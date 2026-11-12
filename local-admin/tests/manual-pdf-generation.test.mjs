// 任务与配额测试使用合成字节和受控适配器；真实工具另有Windows集成验收。
import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs/promises';import path from 'node:path';import {Readable} from 'node:stream';import {createHash,randomBytes} from 'node:crypto';import {createRequire} from 'node:module';
import {createManualAccountFixture} from './helpers/manual-account-fixture.mjs';
import {manualPdfGenerationLimits as limits} from '../../shared/manual-pdf-generation.mjs';
import {manualConsentVersion} from '../../shared/manual-workflow.mjs';
import {createManualPdfJobStore} from '../manual-pdf-jobs.mjs';
const key=()=>randomBytes(32).toString('hex'),sha=b=>createHash('sha256').update(b).digest('hex');
const manual={schema_version:1,brand_name:'生成合成品牌',model_texts:['SYNTHETIC-GENERATION'],sharing_scope:'reading-copy'};
const pdf=Buffer.from('%PDF-1.4\nSYNTHETIC generation fixture\n');
const require=createRequire(new URL('../../site/package.json',import.meta.url)),sharp=require('sharp');
const jpeg=await sharp({create:{width:24,height:32,channels:3,background:'#c8b79b'}}).jpeg().toBuffer();
const tick=ms=>new Promise(r=>setTimeout(r,ms));
export function fakePdfRuntime({pages=3,gate=null,onPage=null,failAt=0}={}){
  const calls={opens:0,pages:[],closes:0,cancels:0,recoveries:0};let stopped=false;
  return {calls,status:async()=>({available:true,message:'合成受控执行器'}),configuration:async()=>({fingerprint:'a'.repeat(64),version:'synthetic'}),open:async()=>{calls.opens++;stopped=false;return {cancel:async()=>{stopped=true;calls.cancels++;},close:async()=>{calls.closes++;return {cleanup:true};}};},inspect:async()=>{if(gate)await gate();if(stopped)throw Object.assign(new Error('cancelled'),{pdfCode:'cancelled'});return {pages,geometry:Array.from({length:pages},()=>({width:595,height:842,rotation:0})),warnings:[],diagnostic_bytes:0};},render:async(_,source,page)=>{if(onPage)await onPage(page,source);if(stopped)throw Object.assign(new Error('cancelled'),{pdfCode:'cancelled'});if(page===failAt)throw new Error('SYNTHETIC render failure');calls.pages.push(page);return {buffer:jpeg,width:24,height:32,diagnostic_bytes:0,peak_memory:1024};},recover:async()=>{calls.recoveries++;return {cleanup:true};}};
}
export async function setupGeneration(t,{runtime=fakePdfRuntime(),submissionOptions={}}={}){
  const f=await createManualAccountFixture({submissionOptions:{pdfGenerationRuntime:runtime,...submissionOptions}});t.after(async()=>{await f.submissions.waitForPdfGenerationIdle();await f.close();});
  const d=await addPdf(f);return {...f,...d,runtime};
}
export async function addPdf(f,{user=f.users[0],bytes=pdf,id=null,revision=1}={}){
  const accountId=user.user.id;
  if(!id){const created=await f.submissions.createAccountManualDraft({accountId,payload:{request_key:key(),manual}});id=created.id;await f.submissions.setAccountManualMaterial({id,accountId,payload:{operation_id:key(),revision:1,source_format:'pdf'}});revision=2;}
  const operation={operation_id:key(),revision,name:'synthetic-copy.pdf',bytes:bytes.length,sha256:sha(bytes),copies_confirmed:true},prepared=await f.submissions.prepareAccountManualPdf({id,accountId,payload:operation});
  const request=Readable.from([bytes]);request.headers={'content-type':'application/pdf','content-length':String(bytes.length)};
  await f.submissions.receiveAccountManualPdf({id,accountId,uploadId:prepared.upload_id,request});return {id,accountId,base:'/api/account/manual-drafts/'+id,revision:revision+1};
}
const begin=(f,extra={})=>{const payload={operation_id:key(),revision:f.revision,profile:'standard',...extra};return f.submissions.beginAccountManualPdfGeneration({id:f.id,accountId:f.accountId,payload}).then(response=>({payload,...response}));};
const get=f=>f.submissions.getAccountManualSubmission({id:f.id,accountId:f.accountId});
const raw=f=>path.join(f.root,'submissions',f.id,'record.json');
const jobRoot=(f,j)=>path.join(f.root,'submissions',f.id,'pdf','jobs',j.job_id);
async function until(check){for(let i=0;i<200;i++){if(await check())return;await tick(5);}assert.fail('Task did not reach expected state');}

test('整册完成才切换，页序映射、重开、摘要图片读取和私密投影一致',async t=>{
  const f=await setupGeneration(t),before=await get(f),started=await begin(f);assert.equal(started.state,'queued');await f.submissions.waitForPdfGenerationIdle();
  const after=await get(f);assert.equal(before.images.length,0);assert.equal(after.images.length,3);assert.equal(after.revision,4);assert.equal(after.status,'draft');assert.deepEqual(after.images.map(p=>p.source_page),[1,2,3]);assert.equal(after.manual_pdf_generation.preview.source_current,true);
  const result=await f.submissions.getAccountManualPdfGeneration({id:f.id,accountId:f.accountId,operationId:started.operation_id});assert.equal(result.state,'succeeded');assert.equal(result.applied,true);
  const image=await f.submissions.getAccountManualPage({id:f.id,accountId:f.accountId,filename:after.images[1].filename});assert.deepEqual(image,jpeg);
  assert.doesNotMatch(JSON.stringify(after),/source-[a-f0-9]{64}\.pdf|native-config|owner_pid|source\.pdf\.part/);assert.equal(Object.hasOwn(after,'manual_pdf_preview'),false);assert.equal(Object.hasOwn(after,'manual_pdf_render_saved'),false);
  const usage=await f.submissions.accountUsage(f.accountId);assert.equal(usage.storage_used_bytes,pdf.length+3*jpeg.length);assert.equal(usage.storage_reserved_bytes,0);assert.equal(f.runtime.calls.closes,1);
  await assert.rejects(f.submissions.operateAccountManualSubmission({id:f.id,accountId:f.accountId,payload:{operation_id:key(),revision:4,action:'submit',consent_version:manualConsentVersion,consents:{copies:true,rights:true,privacy:true,processing:true}}}),{statusCode:409});
});

test('同一操作回执重试不重复生成；旧版号、额外字段与同凭证改配置均拒绝',async t=>{
  const f=await setupGeneration(t),first=await begin(f);await f.submissions.waitForPdfGenerationIdle();
  const repeat=await f.submissions.beginAccountManualPdfGeneration({id:f.id,accountId:f.accountId,payload:first.payload});assert.equal(repeat.applied,true);assert.equal(f.runtime.calls.opens,1);
  for(const changed of [{...first.payload,profile:'detail'},{operation_id:key(),revision:3,profile:'standard'},{operation_id:key(),revision:4,profile:'standard',source:'C:\\private.pdf'},{operation_id:key(),revision:4,profile:'unknown'}])await assert.rejects(f.submissions.beginAccountManualPdfGeneration({id:f.id,accountId:f.accountId,payload:changed}));
  const missing=key(),receipt=await f.submissions.getAccountManualPdfGeneration({id:f.id,accountId:f.accountId,operationId:missing});assert.equal(receipt.state,'not_found');assert.equal(receipt.operation_id,missing);
});

test('换源后旧预览仍可读；新生成半册失败时不替换，保留页图并计量',async t=>{
  const runtime=fakePdfRuntime({pages:3}),f=await setupGeneration(t,{runtime});await begin(f);await f.submissions.waitForPdfGenerationIdle();const old=await get(f);
  const update=await addPdf(f,{id:f.id,revision:4,bytes:Buffer.concat([pdf,Buffer.from('new')])});f.revision=update.revision;const changed=await get(f);assert.equal(changed.manual_pdf_generation.preview.source_current,false);assert.deepEqual(changed.images,old.images);
  const render=runtime.render;runtime.render=async(...args)=>{if(args[2]===2)throw new Error('synthetic page failure');return render(...args);};const next=await begin(f);await f.submissions.waitForPdfGenerationIdle();
  const result=await f.submissions.getAccountManualPdfGeneration({id:f.id,accountId:f.accountId,operationId:next.operation_id});assert.equal(result.state,'failed');assert.equal(result.completed_pages,1);const current=await get(f);assert.deepEqual(current.images,old.images);assert.equal(current.manual_pdf_generation.stored_images,4);
  assert.deepEqual(await f.submissions.getAccountManualPage({id:f.id,accountId:f.accountId,filename:old.images[0].filename}),jpeg);
  runtime.render=render;const retry=await begin(f);await f.submissions.waitForPdfGenerationIdle();assert.equal((await f.submissions.getAccountManualPdfGeneration({id:f.id,accountId:f.accountId,operationId:retry.operation_id})).state,'succeeded');assert.equal((await get(f)).manual_pdf_generation.stored_images,7);
});

test('生成中冻结文字、PDF上传和图片编辑；停止后释放预留并保留旧源',async t=>{
  let release;const gate=new Promise(r=>{release=r;}),runtime=fakePdfRuntime({gate:()=>gate}),f=await setupGeneration(t,{runtime}),job=await begin(f);
  await until(()=>runtime.calls.opens===1);
  await assert.rejects(f.submissions.saveAccountManualDraft({id:f.id,accountId:f.accountId,revision:3,payload:{manual}}),{statusCode:409});
  await assert.rejects(f.submissions.prepareAccountManualPdf({id:f.id,accountId:f.accountId,payload:{operation_id:key(),revision:3,name:'new.pdf',bytes:pdf.length,sha256:sha(pdf),copies_confirmed:true}}),{statusCode:409});
  await assert.rejects(f.submissions.editAccountManualPages({id:f.id,accountId:f.accountId,payload:{operation_id:key(),revision:3,action:'reorder',pages:[]}}),{statusCode:409});
  const status=await f.submissions.cancelAccountManualPdfGeneration({id:f.id,accountId:f.accountId,operationId:job.operation_id});assert.equal(status.state,'cancelling');release();await f.submissions.waitForPdfGenerationIdle();
  assert.equal((await f.submissions.getAccountManualPdfGeneration({id:f.id,accountId:f.accountId,operationId:job.operation_id})).state,'cancelled');const used=await f.submissions.accountUsage(f.accountId);assert.equal(used.storage_reserved_bytes,0);assert.equal(used.storage_used_bytes,pdf.length);assert.equal((await get(f)).revision,3);
});

test('运行中与排队的跨账号任务共用一个执行器，同账号不能另开一册',async t=>{
  let release;const gate=new Promise(r=>{release=r;}),runtime=fakePdfRuntime({gate:()=>gate}),f=await setupGeneration(t,{runtime}),a=await begin(f);await until(()=>runtime.calls.opens===1);
  const b=await addPdf(f,{user:f.users[1]}),queued=await f.submissions.beginAccountManualPdfGeneration({id:b.id,accountId:b.accountId,payload:{operation_id:key(),revision:3,profile:'standard'}});assert.equal(queued.state,'queued');assert.equal(runtime.calls.opens,1);
  await assert.rejects(f.submissions.beginAccountManualPdfGeneration({id:f.id,accountId:f.accountId,payload:{operation_id:key(),revision:3,profile:'detail'}}),{statusCode:409});
  const stopped=await f.submissions.cancelAccountManualPdfGeneration({id:b.id,accountId:b.accountId,operationId:queued.operation_id});assert.equal(stopped.state,'cancelled');release();await f.submissions.waitForPdfGenerationIdle();assert.equal(runtime.calls.opens,1);assert.equal((await get(f)).images.length,3);
});

test('任务源或草稿在处理中改变，完整结果不覆盖较新内容',async t=>{
  let f;const runtime=fakePdfRuntime({onPage:async page=>{if(page===2){const r=JSON.parse(await fs.readFile(raw(f),'utf8'));r.revision++;r.manual_metadata.edition_display='合成并发新版';await fs.writeFile(raw(f),JSON.stringify(r));}}});f=await setupGeneration(t,{runtime});const job=await begin(f);await f.submissions.waitForPdfGenerationIdle();
  const after=await get(f);assert.equal(after.images.length,0);assert.equal(after.manual_metadata.edition_display,'合成并发新版');assert.equal(after.manual_pdf_generation.stored_images,1);assert.equal((await f.submissions.getAccountManualPdfGeneration({id:f.id,accountId:f.accountId,operationId:job.operation_id})).error_code,'binding_changed');
});

test('生成预留覆盖图片入口；暂停或回收不会隐藏完整文件占用',async t=>{
  let release;const gate=new Promise(r=>{release=r;}),runtime=fakePdfRuntime({gate:()=>gate}),maximum=pdf.length*2+limits.pageBytes*2+limits.diagnosticBytes+1,f=await setupGeneration(t,{runtime,submissionOptions:{maxStorageBytes:maximum}});const job=await begin(f);await until(()=>runtime.calls.opens===1);
  const another=await f.submissions.createAccountManualDraft({accountId:f.users[1].user.id,payload:{request_key:key(),manual}});
  await assert.rejects(f.submissions.uploadAccountManualPage({id:another.id,accountId:f.users[1].user.id,payload:{operation_id:key(),revision:1,copies_confirmed:true,image:{name:'copy.jpg',type:'image/jpeg',buffer:jpeg}}}),{statusCode:503});
  await f.submissions.cancelAccountManualPdfGeneration({id:f.id,accountId:f.accountId,operationId:job.operation_id});release();await f.submissions.waitForPdfGenerationIdle();
  assert.equal((await f.submissions.uploadAccountManualPage({id:another.id,accountId:f.users[1].user.id,payload:{operation_id:key(),revision:1,copies_confirmed:true,image:{name:'copy.jpg',type:'image/jpeg',buffer:jpeg}}})).image_count,1);
});

test('生成页图外部改写后拒绝读取；完成后的取消不能删除整册',async t=>{
  const f=await setupGeneration(t),job=await begin(f);await f.submissions.waitForPdfGenerationIdle();const r=await get(f),page=r.images[0];
  assert.equal((await f.submissions.cancelAccountManualPdfGeneration({id:f.id,accountId:f.accountId,operationId:job.operation_id})).state,'succeeded');
  await fs.writeFile(path.join(jobRoot(f,job),'pages',page.filename),Buffer.alloc(page.bytes));await assert.rejects(f.submissions.getAccountManualPage({id:f.id,accountId:f.accountId,filename:page.filename}),{statusCode:409});assert.equal((await f.submissions.accountUsage(f.accountId)).storage_used_bytes,pdf.length+3*jpeg.length);
});

test('逐页追加预留不足时停止，已经完成的页图保留且整册不提前切换',async t=>{
  const maximum=pdf.length*2+limits.pageBytes*2+limits.diagnosticBytes+jpeg.length-1,f=await setupGeneration(t,{submissionOptions:{maxStorageBytes:maximum}}),job=await begin(f);await f.submissions.waitForPdfGenerationIdle();
  const result=await f.submissions.getAccountManualPdfGeneration({id:f.id,accountId:f.accountId,operationId:job.operation_id});assert.equal(result.state,'failed');assert.equal(result.error_code,'capacity');assert.equal(result.completed_pages,1);assert.equal((await get(f)).images.length,0);assert.equal((await f.submissions.accountUsage(f.accountId)).storage_reserved_bytes,0);
});

test('旧预览及保留页图共同受每册100 MiB限制，不删除旧版以腾空间',async t=>{
  const f=await setupGeneration(t),first=await begin(f);await f.submissions.waitForPdfGenerationIdle();const old=await get(f),filler=path.join(jobRoot(f,first),'pages','retained.jpg'),handle=await fs.open(filler,'wx');await handle.truncate(limits.bookBytes-4*jpeg.length+1);await handle.close();
  f.revision=4;const next=await begin(f);await f.submissions.waitForPdfGenerationIdle();const result=await f.submissions.getAccountManualPdfGeneration({id:f.id,accountId:f.accountId,operationId:next.operation_id});assert.equal(result.error_code,'book_capacity');assert.deepEqual((await get(f)).images,old.images);assert.equal((await fs.stat(filler)).size,limits.bookBytes-4*jpeg.length+1);
});

test('整册时限会结束任务并标明超时，临时空间释放后允许明确重试',async t=>{
  const runtime=fakePdfRuntime({gate:()=>tick(80)}),f=await setupGeneration(t,{runtime,submissionOptions:{pdfGenerationOptions:{bookMs:20}}}),job=await begin(f);await f.submissions.waitForPdfGenerationIdle();const result=await f.submissions.getAccountManualPdfGeneration({id:f.id,accountId:f.accountId,operationId:job.operation_id});assert.equal(result.state,'failed');assert.equal(result.error_code,'timeout');assert.equal((await f.submissions.accountUsage(f.accountId)).storage_reserved_bytes,0);assert.equal(runtime.calls.closes,1);
});

test('服务重开时只收尾已结束的进程；完整但未提交的页图仍私密保留',async t=>{
  const f=await setupGeneration(t,{submissionOptions:{pdfGenerationOptions:{processAlive:()=>false}}}),before=await fs.readFile(raw(f),'utf8'),job=await begin(f);await f.submissions.waitForPdfGenerationIdle();const file=path.join(jobRoot(f,job),'job.json'),saved=JSON.parse(await fs.readFile(file,'utf8'));saved.state='rendering';saved.owner_pid=2147483000;saved.budget_bytes=1000000;await fs.writeFile(file,JSON.stringify(saved));await fs.writeFile(raw(f),before);
  const result=await f.submissions.getAccountManualPdfGeneration({id:f.id,accountId:f.accountId,operationId:job.operation_id});assert.equal(result.state,'interrupted');assert.equal(f.runtime.calls.recoveries,1);assert.equal((await get(f)).images.length,0);assert.equal((await get(f)).manual_pdf_generation.stored_images,3);assert.equal((await f.submissions.accountUsage(f.accountId)).storage_reserved_bytes,0);
});

test('完成回执与草稿记录不一致时展示待核对，禁止取消完整结果或自动重试',async t=>{
  const f=await setupGeneration(t),before=await fs.readFile(raw(f),'utf8'),job=await begin(f);await f.submissions.waitForPdfGenerationIdle();await fs.writeFile(raw(f),before);
  const detail=await get(f);assert.equal(detail.manual_pdf_generation.operation.state,'needs_review');assert.match(detail.manual_pdf_generation.operation.message,/不一致/);
  assert.equal((await f.submissions.getAccountManualPdfGeneration({id:f.id,accountId:f.accountId,operationId:job.operation_id})).state,'needs_review');await assert.rejects(f.submissions.cancelAccountManualPdfGeneration({id:f.id,accountId:f.accountId,operationId:job.operation_id}),{statusCode:409});await assert.rejects(begin(f),{statusCode:409});assert.equal((await get(f)).manual_pdf_generation.stored_images,3);
});

for(const recordSaved of [false,true])test('切换整册记录'+(recordSaved?'后丢失回执可恢复成功':'前写入失败保留完整页图待核对'),async t=>{
  const f=await setupGeneration(t),read=async()=>JSON.parse(await fs.readFile(raw(f),'utf8')),atomicJson=(file,value)=>fs.writeFile(file,JSON.stringify(value));let written=false;
  const lock=async(name,fn)=>{if(name!=='manual-pdf-worker')return fn();const folder=path.join(f.root,'submissions','.manual-pdf-worker.lock');await fs.mkdir(folder);try{return await fn();}finally{await fs.rmdir(folder);}};
  const injected=createManualPdfJobStore({root:path.join(f.root,'submissions'),read,all:async()=>[await read()],locked:lock,ownedBy:(r,a)=>{assert.equal(r.account_id,a);return r;},safeAccountId:x=>x,
    writeRecord:async(_,r)=>{if(recordSaved){await fs.writeFile(raw(f),JSON.stringify(r));written=true;}throw new Error('SYNTHETIC record reply interrupted');},atomicJson,uploadStore:{assertUploadsIdle:async()=>{}},checkStorageLimit:async()=>{},globalUsage:async()=>({allocatedBytes:0}),maxStorageBytes:1e9,runtime:f.runtime});
  const job=await injected.begin({id:f.id,accountId:f.accountId,payload:{operation_id:key(),revision:3,profile:'standard'}});await injected.waitForIdle();const result=await injected.status({id:f.id,accountId:f.accountId,operationId:job.operation_id});assert.equal(result.state,recordSaved?'succeeded':'needs_review');assert.equal(result.applied,recordSaved);assert.equal(written,recordSaved);assert.equal((await get(f)).manual_pdf_generation.stored_images,3);
});
