// 6.2只校验私密字节接收与配额，不解析PDF；全部为合成内容、临时账号和目录。
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {Readable,PassThrough} from 'node:stream';
import {createHash,randomBytes} from 'node:crypto';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {createManualAccountFixture} from './helpers/manual-account-fixture.mjs';
import {createSubmissionStore} from '../submissions.mjs';
import {createManualPdfStore} from '../manual-pdf-uploads.mjs';
import {submissionPayloadUsage} from '../submission-storage.mjs';
import {manualPdfUploadLimits as limits,normalizeManualPdfUpload} from '../../shared/manual-pdf-upload.mjs';
import {manualConsentVersion} from '../../shared/manual-workflow.mjs';

const siteDirectory=new URL('../../site/',import.meta.url);
const key=()=>randomBytes(32).toString('hex');
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const pdf=Buffer.from('%PDF-1.4\n% SYNTHETIC private upload fixture only\n%%EOF\n');
const manual={schema_version:1,brand_name:'PDF合成验收品牌',model_texts:['SYNTHETIC-PDF'],sharing_scope:'reading-copy'};
const input=(revision,bytes=pdf,extra={})=>({operation_id:key(),revision,name:'screened-copy.pdf',bytes:bytes.length,sha256:sha(bytes),copies_confirmed:true,...extra});
async function fixture(t,options={}){
  const f=await createManualAccountFixture(options);t.after(()=>f.close());
  const made=await f.request('/api/account/manual-drafts',{method:'POST',body:{request_key:key(),manual}});assert.equal(made.status,200);
  const id=made.body.id,base='/api/account/manual-drafts/'+id;
  const mode=await f.request(base+'/material',{method:'POST',body:{operation_id:key(),revision:1,source_format:'pdf'}});assert.equal(mode.status,200);
  return {...f,id,base,accountId:f.users[0].user.id};
}
const prepare=async(f,payload)=>f.request(f.base+'/pdf/uploads',{method:'POST',body:payload});
const receipt=async(f,op,user)=>f.request(f.base+'/pdf/operations/'+op,{user});
const get=async f=>(await f.request(f.base)).body;
const stream=(bytes=pdf,headers={})=>{const r=Readable.from([bytes]);r.headers={'content-type':'application/pdf','content-length':String(bytes.length),...headers};return r;};
const receive=(f,u,bytes=pdf,headers={})=>f.submissions.receiveAccountManualPdf({id:f.id,accountId:f.accountId,uploadId:u,request:stream(bytes,headers)});
const rawRecord=f=>path.join(f.root,'submissions',f.id,'record.json');
const opFile=(f,u)=>path.join(f.root,'submissions',f.id,'pdf','uploads',u+'.json');
const put=async(file,value)=>fs.writeFile(file,JSON.stringify(value));

test('PDF头与摘要匹配才保存，响应仅有安全摘要；旧草稿兼容图片方式',async t=>{
  const f=await fixture(t),payload=input(2),init=await prepare(f,payload);assert.equal(init.status,200);assert.equal(init.body.state,'reserved');
  assert.equal((await f.submissions.accountUsage(f.accountId)).storage_reserved_bytes,pdf.length);
  const saved=await receive(f,init.body.upload_id);assert.equal(saved.state,'saved');assert.equal(saved.applied,true);
  const record=await get(f);assert.equal(record.status,'draft');assert.equal(record.revision,3);assert.equal(record.images.length,0);
  assert.equal(record.manual_pdf.current.name,'screened-copy.pdf');assert.equal(record.manual_pdf.retained_sources,1);assert.equal(record.manual_pdf.reserved_bytes,0);
  for(const field of ['manual_pdf_sources','manual_pdf_current_source_id','manual_pdf_saved_operations','manual_material_receipts'])assert.equal(Object.hasOwn(record,field),false);
  assert.doesNotMatch(JSON.stringify(record),/source-[a-f0-9]{64}\.pdf|\.stream\.lock|owner\.json/);
  const raw=JSON.parse(await fs.readFile(rawRecord(f),'utf8'));assert.deepEqual(await fs.readFile(path.join(f.root,'submissions',f.id,'pdf',raw.manual_pdf_sources[0].filename)),pdf);
  const usage=await f.submissions.accountUsage(f.accountId);assert.equal(usage.storage_used_bytes,pdf.length);assert.equal(usage.storage_left_bytes,200*1024**2-pdf.length);
  const listed=(await f.request('/api/account/submissions')).body.items[0];assert.equal(listed.source_format,'pdf');assert.equal(listed.pdf_saved,true);
});

test('原凭证查询和重试幂等；相同文件可重新选为当前版本但不重复写入',async t=>{
  const f=await fixture(t),p=input(2),a=await prepare(f,p);await receive(f,a.body.upload_id);
  assert.equal((await receipt(f,p.operation_id)).body.state,'saved');assert.equal((await prepare(f,p)).body.applied,true);
  assert.equal((await prepare(f,{...p,name:'changed.pdf'})).status,409);
  await assert.rejects(receive(f,a.body.upload_id),{statusCode:409});
  const duplicate=await prepare(f,input(3));assert.equal(duplicate.body.state,'saved');
  const r=await get(f);assert.equal(r.revision,4);assert.equal(r.manual_pdf.retained_sources,1);assert.equal((await f.submissions.accountUsage(f.accountId)).storage_used_bytes,pdf.length);
  const cancelled=await f.request(f.base+'/pdf/operations/'+p.operation_id+'/cancel',{method:'POST'});assert.equal(cancelled.body.state,'saved');
  assert.equal((await get(f)).manual_pdf.retained_sources,1);
});

test('空草稿才能切换资料方式；预留中冻结文字、切换与停止；取消后可继续',async t=>{
  const f=await fixture(t),p=input(2),a=await prepare(f,p);
  assert.equal((await f.request(f.base,{method:'POST',body:{revision:2,manual:{...manual,edition_display:'改版'}}})).status,409);
  assert.equal((await f.request(f.base+'/material',{method:'POST',body:{operation_id:key(),revision:2,source_format:'images'}})).status,409);
  assert.equal((await f.request('/api/account/manual-submissions/'+f.id+'/operate',{method:'POST',body:{operation_id:key(),revision:2,action:'discard'}})).status,409);
  const cancelled=await f.request(f.base+'/pdf/operations/'+p.operation_id+'/cancel',{method:'POST'});assert.equal(cancelled.body.state,'cancelled');
  assert.equal((await f.submissions.accountUsage(f.accountId)).storage_reserved_bytes,0);
  assert.equal((await f.request(f.base+'/material',{method:'POST',body:{operation_id:key(),revision:2,source_format:'images'}})).status,200);
  assert.equal((await prepare(f,input(3))).status,409);
  const mode=await f.request(f.base+'/material',{method:'POST',body:{operation_id:key(),revision:3,source_format:'pdf'}});assert.equal(mode.status,200);
  const b=await prepare(f,input(4));await receive(f,b.body.upload_id);
  assert.equal((await f.request(f.base+'/material',{method:'POST',body:{operation_id:key(),revision:5,source_format:'images'}})).status,409);
  assert.equal((await f.request(f.base,{method:'POST',body:{revision:5,manual:{...manual,sharing_scope:'official-link'}}})).status,409);
});

test('大小、复制确认、主档名、私密字段注入、旧版本均被拒绝',async t=>{
  const f=await fixture(t);
  for(const changed of [{bytes:limits.sourceBytes+1},{bytes:0},{copies_confirmed:false},{name:'../copy.pdf'},{name:'original.pdf'},{name:'原始文件.pdf'},{filename:'source-evil.pdf'},{sha256:'bad'},{revision:1}]){
    const result=await prepare(f,input(2,pdf,changed));assert(result.status>=400,JSON.stringify(changed));
  }
  assert.throws(()=>normalizeManualPdfUpload(input(2,pdf,{name:'C:\\private.pdf'})));
  assert.equal((await get(f)).manual_pdf.retained_sources,0);assert.equal((await f.submissions.accountUsage(f.accountId)).storage_reserved_bytes,0);
});

test('截断、超长、伪装PDF头和摘要变化不留完整文件，释放临时字节和预留',async t=>{
  const f=await fixture(t);
  const cases=[{actual:pdf.subarray(0,pdf.length-1)},{actual:Buffer.concat([pdf,Buffer.from('extra')])},{actual:Buffer.alloc(pdf.length,65)},{actual:Buffer.concat([pdf.subarray(0,-1),Buffer.from('x')])}];
  for(const item of cases){const p=input(2),a=await prepare(f,p);assert.equal(a.status,200);
    await assert.rejects(receive(f,a.body.upload_id,item.actual,{'content-length':String(pdf.length)}));
    assert.equal((await receipt(f,p.operation_id)).body.state,'failed');
    const usage=await f.submissions.accountUsage(f.accountId);assert.equal(usage.storage_reserved_bytes,0);assert.equal(usage.storage_used_bytes,0);
  }
});

test('超时和传输中取消只清理part；取消回执可复查',async t=>{
  const f=await fixture(t,{submissionOptions:{pdfOptions:{idleMs:60}}}),p=input(2),a=await prepare(f,p);
  const wire=new PassThrough();wire.headers={'content-type':'application/pdf'};
  const receiving=f.submissions.receiveAccountManualPdf({id:f.id,accountId:f.accountId,uploadId:a.body.upload_id,request:wire});
  const outcome=receiving.then(()=>null,error=>error);wire.write(pdf.subarray(0,10));
  assert((await outcome)?.statusCode);assert.equal((await receipt(f,p.operation_id)).body.state,'failed');
  const q=input(2),b=await prepare(f,q),second=new PassThrough();second.headers={'content-type':'application/pdf'};
  const pending=f.submissions.receiveAccountManualPdf({id:f.id,accountId:f.accountId,uploadId:b.body.upload_id,request:second}).catch(e=>e);
  second.write(pdf.subarray(0,10));
  for(let n=0;n<100;n++){if((await receipt(f,q.operation_id)).body.state==='receiving')break;await new Promise(r=>setTimeout(r,2));}
  const cancelled=await f.submissions.cancelAccountManualPdf({id:f.id,accountId:f.accountId,operationId:q.operation_id});assert.equal(cancelled.state,'cancelled');await pending;
  assert.equal((await f.submissions.accountUsage(f.accountId)).storage_left_bytes,200*1024**2);
});

test('过期预留释放额度；重开服务可核对已死进程的中断，存活进程保持冻结',async t=>{
  let now=Date.now();const f=await fixture(t,{submissionOptions:{pdfOptions:{now:()=>now}}}),p=input(2),a=await prepare(f,p);
  now+=limits.reservationMs+1;assert.equal((await f.submissions.accountUsage(f.accountId)).storage_reserved_bytes,0);
  assert.equal((await receipt(f,p.operation_id)).body.state,'expired');
  const q=input(2),b=await prepare(f,q),file=opFile(f,b.body.upload_id),op=JSON.parse(await fs.readFile(file,'utf8'));
  op.status='receiving';await put(file,op);await fs.writeFile(file.replace('.json','.part'),pdf.subarray(0,8));
  const lease=file.replace('.json','.stream.lock');await fs.mkdir(lease);await put(path.join(lease,'owner.json'),{pid:process.pid});
  assert.equal((await receipt(f,q.operation_id)).body.state,'receiving');assert.equal((await f.request(f.base+'/pdf/operations/'+q.operation_id+'/cancel',{method:'POST'})).status,409);
  const restarted=createSubmissionStore({root:path.join(f.root,'submissions'),siteDirectory:fileURLToPath(siteDirectory),pdfOptions:{now:()=>now,processAlive:()=>false}});
  assert.equal((await restarted.getAccountManualPdfOperation({id:f.id,accountId:f.accountId,operationId:q.operation_id})).state,'interrupted');
  assert.equal((await restarted.accountUsage(f.accountId)).storage_reserved_bytes,0);await assert.rejects(fs.access(file.replace('.json','.part')));
});

test('历史PDF、图片、回收区和孤立PDF文件均计入容量；无法通过图片上传绕过预留',async t=>{
  const f=await fixture(t),p=input(2),a=await prepare(f,p);await receive(f,a.body.upload_id);
  const second=Buffer.concat([pdf,Buffer.from('second')]),b=await prepare(f,input(3,second));await receive(f,b.body.upload_id,second);
  const used=await f.submissions.accountUsage(f.accountId);assert.equal(used.storage_used_bytes,pdf.length+second.length);assert.equal((await get(f)).manual_pdf.retained_sources,2);
  const folder=path.join(f.root,'submissions',f.id),recycle=path.join(f.root,'submissions','.recycle',f.id,'synthetic');await fs.mkdir(recycle,{recursive:true});
  await fs.writeFile(path.join(folder,'copy-99.jpg'),Buffer.alloc(17));await fs.writeFile(path.join(recycle,'copy-01.jpg'),Buffer.alloc(23));await fs.writeFile(path.join(folder,'pdf','unreferenced.pdf'),Buffer.alloc(31));
  assert.equal((await f.submissions.accountUsage(f.accountId)).storage_used_bytes,used.storage_used_bytes+71);
  const retained=await fs.readdir(path.join(folder,'pdf'));assert.equal(retained.filter(n=>n.startsWith('source-')).length,2);
});

test('账号容量和服务总量均有限制',async t=>{
  const f=await fixture(t),folder=path.join(f.root,'submissions',f.id);
  const filler=await fs.open(path.join(folder,'copy-99.jpg'),'wx');await filler.truncate(200*1024**2-pdf.length+1);await filler.close();
  assert.equal((await prepare(f,input(2))).status,429);
  const capped=createSubmissionStore({root:path.join(f.root,'submissions'),siteDirectory:fileURLToPath(siteDirectory),maxStorageBytes:200*1024**2-pdf.length+5});
  await assert.rejects(capped.prepareAccountManualPdf({id:f.id,accountId:f.accountId,payload:input(2,pdf.subarray(0,5))}),{statusCode:503});
});

test('PDF最多五份不同留存，保留所有旧副本；文件被外部改写时不宣称重试成功',async t=>{
  const f=await fixture(t);let last;
  for(let i=0;i<5;i++){const bytes=Buffer.concat([pdf,Buffer.from(String(i))]),p=input(2+i,bytes),a=await prepare(f,p);last={p,a};await receive(f,a.body.upload_id,bytes);}
  assert.equal((await prepare(f,input(7,Buffer.concat([pdf,Buffer.from('six')])))).status,413);
  const raw=JSON.parse(await fs.readFile(rawRecord(f),'utf8')),source=raw.manual_pdf_sources[4];await fs.writeFile(path.join(f.root,'submissions',f.id,'pdf',source.filename),Buffer.alloc(source.bytes));
  assert.equal((await receipt(f,last.p.operation_id)).status,409);assert.equal((await prepare(f,last.p)).status,409);
  assert.equal(raw.manual_pdf_sources.length,5);
});

test('实际临时字节与预留余额只计一次；损坏的预留信息会暂停新增文件',async t=>{
  const f=await fixture(t),a=await prepare(f,input(2)),file=opFile(f,a.body.upload_id);await fs.writeFile(file.replace('.json','.part'),pdf.subarray(0,8));
  const used=await submissionPayloadUsage(path.join(f.root,'submissions',f.id));assert.equal(used.temporaryBytes,8);assert.equal(used.reservedBytes,pdf.length-8);assert.equal(used.allocatedBytes,pdf.length);
  const corrupt=JSON.parse(await fs.readFile(file,'utf8'));corrupt.upload_id='../escape';await put(file,corrupt);
  await assert.rejects(f.submissions.accountUsage(f.accountId),{statusCode:503});
});

test('源文件落盘后记录写入失败：完整副本保留并冻结，不自动删除或重新上传',async t=>{
  const f=await fixture(t),p=input(2),a=await prepare(f,p),root=path.join(f.root,'submissions');
  const injected=createManualPdfStore({root,read:async()=>JSON.parse(await fs.readFile(rawRecord(f),'utf8')),locked:(_,fn)=>fn(),ownedBy:(r,account)=>{assert.equal(r.account_id,account);return r;},safeAccountId:x=>x,
    writeRecord:async()=>{throw new Error('SYNTHETIC record write interrupted');},atomicJson:put,summary:r=>({id:r.id,revision:r.revision}),checkStorageLimit:async()=>{},globalUsage:async()=>({allocatedBytes:0}),maxStorageBytes:1e9});
  await assert.rejects(injected.receive({id:f.id,accountId:f.accountId,uploadId:a.body.upload_id,request:stream()}),{statusCode:503});
  assert.equal((await receipt(f,p.operation_id)).body.state,'needs_review');
  const files=await fs.readdir(path.join(root,f.id,'pdf'));assert.equal(files.filter(n=>n.endsWith('.pdf')).length,1);
  assert.equal((await f.submissions.accountUsage(f.accountId)).storage_used_bytes,pdf.length);
  assert.equal((await prepare(f,input(2))).status,409);assert.equal((await f.request(f.base+'/pdf/operations/'+p.operation_id+'/cancel',{method:'POST'})).status,409);
});

test('记录已切换但最终回执写入失败：按原源文件摘要恢复saved，不重复保存',async t=>{
  const f=await fixture(t),p=input(2),a=await prepare(f,p),root=path.join(f.root,'submissions');let interrupted=false;
  const injected=createManualPdfStore({root,read:async()=>JSON.parse(await fs.readFile(rawRecord(f),'utf8')),locked:(_,fn)=>fn(),ownedBy:(r,account)=>{assert.equal(r.account_id,account);return r;},safeAccountId:x=>x,
    writeRecord:(_,r)=>put(rawRecord(f),r),atomicJson:async(file,value)=>{if(value.status==='saved'&&!interrupted){interrupted=true;throw new Error('SYNTHETIC final receipt interrupted');}await put(file,value);},summary:r=>({id:r.id,revision:r.revision}),checkStorageLimit:async()=>{},globalUsage:async()=>({allocatedBytes:0}),maxStorageBytes:1e9});
  const result=await injected.receive({id:f.id,accountId:f.accountId,uploadId:a.body.upload_id,request:stream()});assert.equal(result.state,'saved');
  assert.equal((await receipt(f,p.operation_id)).body.applied,true);assert.equal((await get(f)).manual_pdf.retained_sources,1);
});

test('回执已保存而草稿元数据回退时转待核对，不能取消完整文件或自动再传',async t=>{
  const f=await fixture(t),before=JSON.parse(await fs.readFile(rawRecord(f),'utf8')),p=input(2),a=await prepare(f,p);await receive(f,a.body.upload_id);
  await put(rawRecord(f),before); // 合成模拟故障后的元数据回退，不动完整PDF。
  assert.equal((await get(f)).manual_pdf.operation.state,'needs_review');
  const result=await receipt(f,p.operation_id);assert.equal(result.body.state,'needs_review');assert.equal(result.body.applied,false);
  assert.equal((await f.request(f.base+'/pdf/operations/'+p.operation_id+'/cancel',{method:'POST'})).status,409);
  assert.equal((await prepare(f,input(2))).status,409);assert.equal((await get(f)).manual_pdf.retained_sources,1);
  assert.equal((await f.submissions.accountUsage(f.accountId)).storage_used_bytes,pdf.length);
});

test('PDF方式不接受图片，也不能送审；停止后完整文件仍留存',async t=>{
  const f=await fixture(t),p=input(2),a=await prepare(f,p);await receive(f,a.body.upload_id);
  const required={operation_id:key(),revision:3,action:'submit',consent_version:manualConsentVersion,consents:{copies:true,rights:true,privacy:true,processing:true}};
  const submitted=await f.request('/api/account/manual-submissions/'+f.id+'/operate',{method:'POST',body:required});assert.equal(submitted.status,409);assert.match(submitted.body.error,/PDF/);
  const require=createRequire(siteDirectory),sharp=require('sharp'),jpeg=await sharp({create:{width:2,height:2,channels:3,background:'white'}}).jpeg().toBuffer();
  await assert.rejects(f.submissions.uploadAccountManualPage({id:f.id,accountId:f.accountId,payload:{operation_id:key(),revision:3,copies_confirmed:true,image:{name:'copy.jpg',type:'image/jpeg',buffer:jpeg}}}),{statusCode:409});
  const stopped=await f.request('/api/account/manual-submissions/'+f.id+'/operate',{method:'POST',body:{action:'discard',operation_id:key(),revision:3}});assert.equal(stopped.status,200);
  assert.equal((await f.submissions.accountUsage(f.accountId)).storage_used_bytes,pdf.length);assert.equal((await receipt(f,p.operation_id)).body.state,'saved');
});
