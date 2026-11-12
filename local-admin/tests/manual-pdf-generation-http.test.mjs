import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs/promises';import path from 'node:path';import {createHash,randomBytes} from 'node:crypto';import {Readable} from 'node:stream';import {createRequire} from 'node:module';
import {createManualAccountFixture} from './helpers/manual-account-fixture.mjs';
const key=()=>randomBytes(32).toString('hex'),sha=b=>createHash('sha256').update(b).digest('hex');
const require=createRequire(new URL('../../site/package.json',import.meta.url)),sharp=require('sharp'),jpeg=await sharp({create:{width:4,height:6,channels:3,background:'#ddd'}}).jpeg().toBuffer();
async function setup(t,{gate=null,handlerOptions={}}={}){
  let release;const block=gate?new Promise(r=>{release=r;}):Promise.resolve();let stopped=false,opens=0;
  const runtime={status:async()=>({available:true,message:'合成工具可用'}),configuration:async()=>({fingerprint:'a'.repeat(64),version:'synthetic'}),open:async()=>{opens++;return {close:async()=>({cleanup:true}),cancel:async()=>{stopped=true;release?.();}};},inspect:async()=>{await block;if(stopped)throw Object.assign(new Error('cancelled'),{pdfCode:'cancelled'});return {pages:2,geometry:[{width:4,height:6},{width:4,height:6}],warnings:[]};},render:async()=>({buffer:jpeg,width:4,height:6,diagnostic_bytes:0}),recover:async()=>({cleanup:true})};
  const f=await createManualAccountFixture({submissionOptions:{pdfGenerationRuntime:runtime},handlerOptions});t.after(async()=>{release?.();await f.submissions.waitForPdfGenerationIdle();await f.close();});
  const accountId=f.users[0].user.id,created=await f.submissions.createAccountManualDraft({accountId,payload:{request_key:key(),manual:{schema_version:1,brand_name:'HTTP合成预览',model_texts:['SYNTHETIC-HTTP-GEN'],sharing_scope:'reading-copy'}}}),id=created.id;
  await f.submissions.setAccountManualMaterial({id,accountId,payload:{operation_id:key(),revision:1,source_format:'pdf'}});const bytes=Buffer.from('%PDF-1.4\nSYNTHETIC HTTP generation\n'),upload=await f.submissions.prepareAccountManualPdf({id,accountId,payload:{operation_id:key(),revision:2,name:'copy.pdf',bytes:bytes.length,sha256:sha(bytes),copies_confirmed:true}}),request=Readable.from([bytes]);request.headers={'content-type':'application/pdf'};await f.submissions.receiveAccountManualPdf({id,accountId,uploadId:upload.upload_id,request});
  return {...f,id,base:'/api/account/manual-drafts/'+id+'/pdf',accountId,release:()=>release?.(),get opens(){return opens;}};
}
test('本人经真实HTTP生成、回执找回和图片读取，页面与原PDF仍受保护',async t=>{
  const f=await setup(t),body={operation_id:key(),revision:3,profile:'standard'},created=await f.request(f.base+'/generations',{method:'POST',body});assert.equal(created.status,200);await f.submissions.waitForPdfGenerationIdle();
  const receipt=await f.request(f.base+'/generation-operations/'+body.operation_id);assert.equal(receipt.body.applied,true);assert.match(receipt.headers.get('Cache-Control'),/no-store/);
  const record=(await f.request('/api/account/manual-submissions/'+f.id)).body;assert.equal(record.images.length,2);assert.doesNotMatch(JSON.stringify(record),/native-config|owner_pid|source-[a-f0-9]{64}\.pdf/);
  const image=await fetch(f.origin+'/api/account/manual-drafts/'+f.id+'/images/'+record.images[0].filename,{headers:{Cookie:f.cookie()}});assert.equal(image.status,200);assert.match(image.headers.get('Cache-Control'),/no-store/);assert.equal(image.headers.get('Cross-Origin-Resource-Policy'),'same-origin');assert.deepEqual(Buffer.from(await image.arrayBuffer()),jpeg);
  assert.equal((await f.request(f.base+'/generations',{method:'POST',body})).body.applied,true);assert.equal(f.opens,1);
  const disk=JSON.parse(await fs.readFile(path.join(f.root,'submissions',f.id,'record.json'),'utf8'));assert.equal((await fetch(f.origin+f.base+'/'+disk.manual_pdf_sources[0].filename,{headers:{Cookie:f.cookie()}})).status,404);
});
test('未登录、其他账号、跨站和无专用标记的读写都不能生成或取消',async t=>{
  const f=await setup(t),body={operation_id:key(),revision:3,profile:'standard'};
  for(const user of [null,f.users[1]]){const code=user?404:401;for(const [route,method,payload] of [[f.base+'/generations','POST',body],[f.base+'/generation-operations/'+body.operation_id,'GET',undefined],[f.base+'/generation-operations/'+body.operation_id+'/cancel','POST',undefined]])assert.equal((await f.request(route,{user,method,body:payload})).status,code);}
  for(const headers of [{Origin:'https://other.invalid'},{'X-LJM-Account-Request':''}])assert.equal((await f.request(f.base+'/generations',{method:'POST',body,headers})).status,403);
  assert.equal((await f.request(f.base+'/generations',{method:'GET'})).status,405);assert.equal(f.opens,0);
});
test('生成已入队而HTTP响应丢失时，用原操作找回，不能重复生成',async t=>{
  const f=await setup(t),body={operation_id:key(),revision:3,profile:'standard'};let once=false;
  f.setInterceptor((req,res)=>{if(req.url.endsWith('/generations')&&!once){once=true;res.end=()=>{res.destroy();return res;};}return false;});
  await assert.rejects(f.request(f.base+'/generations',{method:'POST',body}));f.setInterceptor(null);await f.submissions.waitForPdfGenerationIdle();
  assert.equal((await f.request(f.base+'/generation-operations/'+body.operation_id)).body.applied,true);assert.equal((await f.request(f.base+'/generations',{method:'POST',body})).body.applied,true);assert.equal(f.opens,1);
});
test('上传暂停仍能查询和停止原任务；生产模式不开放生成',async t=>{
  const f=await setup(t,{gate:true}),body={operation_id:key(),revision:3,profile:'standard'};assert.equal((await f.request(f.base+'/generations',{method:'POST',body})).status,200);f.setUploadsOpen(false);
  assert.equal((await f.request(f.base+'/generations',{method:'POST',body:{...body,operation_id:key()}})).status,503);assert.equal((await f.request(f.base+'/generation-operations/'+body.operation_id)).status,200);
  assert.equal((await f.request(f.base+'/generation-operations/'+body.operation_id+'/cancel',{method:'POST'})).status,200);f.release();await f.submissions.waitForPdfGenerationIdle();assert.equal((await f.request(f.base+'/generation-operations/'+body.operation_id)).body.state,'cancelled');
  const p=await setup(t,{handlerOptions:{local:false}});assert.equal((await p.request('/api/account/config')).body.manual_pdf_generation_version,0);assert.equal((await p.request(p.base+'/generations',{method:'POST',body})).status,503);assert.equal(p.opens,0);
});
