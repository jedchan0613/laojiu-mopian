import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import {Readable} from 'node:stream';
import {randomBytes,createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import {createManualAccountFixture} from './helpers/manual-account-fixture.mjs';
import {manualPdfUploadLimits as limits} from '../../shared/manual-pdf-upload.mjs';

const key=()=>randomBytes(32).toString('hex');
const pdf=Buffer.from('%PDF-1.4\n% SYNTHETIC HTTP upload fixture\n%%EOF\n');
const manual={schema_version:1,brand_name:'HTTP合成品牌',model_texts:['SYNTHETIC-HTTP-PDF'],sharing_scope:'reading-copy'};
async function fixture(t,options={}){const f=await createManualAccountFixture(options);t.after(()=>f.close());return f;}
async function draft(f,user=f.users[0]){
  const made=await f.request('/api/account/manual-drafts',{user,method:'POST',body:{request_key:key(),manual}});assert.equal(made.status,200);
  const id=made.body.id,base='/api/account/manual-drafts/'+id;
  const switched=await f.request(base+'/material',{user,method:'POST',body:{operation_id:key(),revision:1,source_format:'pdf'}});assert.equal(switched.status,200);
  return {id,base,user};
}
async function prepare(f,d,bytes=pdf){const payload={operation_id:key(),revision:2,name:'http-screened-copy.pdf',bytes:bytes.length,sha256:createHash('sha256').update(bytes).digest('hex'),copies_confirmed:true};const result=await f.request(d.base+'/pdf/uploads',{user:d.user,method:'POST',body:payload});assert.equal(result.status,200);return {...result.body,payload};}
const headers=(f,user=f.users[0])=>({Cookie:f.cookie(user),Origin:f.origin,'X-LJM-Account-Request':'1','Content-Type':'application/pdf'});
const wire=(f,d,op,bytes=pdf,extra={})=>fetch(f.origin+d.base+'/pdf/uploads/'+op.upload_id+'/content',{method:'POST',headers:headers(f,d.user),body:bytes,...extra});
const status=(f,d,op,user=d.user)=>f.request(d.base+'/pdf/operations/'+op.operation_id,{user});

test('真实二进制HTTP传输、无Content-Length分块与20 MiB边界；回执无缓存且无下载入口',async t=>{
  const f=await fixture(t),d=await draft(f),op=await prepare(f,d);
  const unknown=key(),notFound=await f.request(d.base+'/pdf/operations/'+unknown);assert.equal(notFound.body.found,false);assert.equal(notFound.body.operation_id,unknown);
  const response=await wire(f,d,op,Readable.from([pdf.subarray(0,3),pdf.subarray(3)]),{duplex:'half'});assert.equal(response.status,200);assert.equal((await response.json()).state,'saved');assert.match(response.headers.get('Cache-Control'),/no-store/);
  assert.equal((await status(f,d,op)).body.applied,true);
  const raw=JSON.parse(await fs.readFile(path.join(f.root,'submissions',d.id,'record.json'),'utf8')),name=raw.manual_pdf_sources[0].filename;
  for(const url of [d.base+'/pdf/'+name,d.base+'/images/'+name,'/public-assets/'+name,'/'+d.id+'/pdf/'+name])assert.equal((await fetch(f.origin+url,{headers:headers(f)})).status,404);
  const large=Buffer.alloc(limits.sourceBytes,32);pdf.copy(large);const e=await draft(f),big=await prepare(f,e,large);
  const saved=await wire(f,e,big,large);assert.equal(saved.status,200);assert.equal((await saved.json()).applied,true);
  const over=await f.request(e.base+'/pdf/uploads',{method:'POST',body:{...big.payload,operation_id:key(),revision:3,bytes:limits.sourceBytes+1}});assert.equal(over.status,413);
});

test('账号与同源保护覆盖模式、预留、字节、查询和取消；拒绝伪MIME及未匹配长度',async t=>{
  const f=await fixture(t),d=await draft(f),op=await prepare(f,d);
  for(const user of [null,f.users[1]]){
    const expected=user?404:401;
    for(const [route,method,body] of [[d.base+'/material','POST',{operation_id:key(),revision:2,source_format:'images'}],[d.base+'/pdf/uploads','POST',op.payload],[d.base+'/pdf/operations/'+op.operation_id,'GET',undefined],[d.base+'/pdf/operations/'+op.operation_id+'/cancel','POST',undefined]])assert.equal((await f.request(route,{user,method,body})).status,expected);
    const response=await fetch(f.origin+d.base+'/pdf/uploads/'+op.upload_id+'/content',{method:'POST',headers:{...headers(f),...(user?{Cookie:f.cookie(user)}:{Cookie:''})},body:pdf});assert.equal(response.status,expected);
  }
  for(const changed of [{Origin:'https://elsewhere.invalid'},{'X-LJM-Account-Request':''}]){
    const rejected=await wire(f,d,op,pdf,{headers:{...headers(f),...changed}});assert.equal(rejected.status,403);
  }
  const wrong=await wire(f,d,op,pdf,{headers:{...headers(f),'Content-Type':'image/jpeg'}});assert.equal(wrong.status,415);
  const short=await wire(f,d,op,pdf.subarray(0,-1));assert.equal(short.status,413);
  assert.equal((await status(f,d,op)).body.state,'reserved');assert.equal((await wire(f,d,op)).status,200);
});

test('服务已保存而响应丢失，原操作回执找回结果，不重新接收文件',async t=>{
  const f=await fixture(t),d=await draft(f),op=await prepare(f,d);let lost=false;
  f.setInterceptor((req,res)=>{if(req.url.endsWith('/content')&&!lost){lost=true;res.end=()=>{res.destroy();return res;};}return false;});
  await assert.rejects(wire(f,d,op));f.setInterceptor(null);
  const receipt=await status(f,d,op);assert.equal(receipt.body.state,'saved');assert.equal(receipt.body.applied,true);
  const repeated=await f.request(d.base+'/pdf/uploads',{method:'POST',body:op.payload});assert.equal(repeated.body.applied,true);
  const record=(await f.request(d.base)).body;assert.equal(record.manual_pdf.retained_sources,1);assert.equal(record.revision,3);
});

test('暂停允许查询和取消；生产模式默认关闭PDF，既有图片能力仍开放',async t=>{
  const f=await fixture(t),d=await draft(f),op=await prepare(f,d);f.setUploadsOpen(false);
  assert.equal((await wire(f,d,op)).status,503);assert.equal((await status(f,d,op)).status,200);
  assert.equal((await f.request(d.base+'/pdf/operations/'+op.operation_id+'/cancel',{method:'POST'})).body.state,'cancelled');
  const online=await fixture(t,{handlerOptions:{local:false}}),config=await online.request('/api/account/config');assert.equal(config.body.manual_pdf_uploads_version,0);assert.equal(config.body.manual_page_uploads_version,1);
  const made=await online.request('/api/account/manual-drafts',{method:'POST',body:{request_key:key(),manual}}),base='/api/account/manual-drafts/'+made.body.id;
  for(const [route,method,body] of [[base+'/material','POST',{operation_id:key(),revision:1,source_format:'pdf'}],[base+'/pdf/uploads','POST',op.payload]])assert.equal((await online.request(route,{method,body})).status,503);
  const receipt=await online.request(base+'/pdf/operations/'+key());assert.equal(receipt.status,200);assert.equal(receipt.body.found,false);
});

test('共享全局容量检查：PDF预留挡住图片上传；取消后原图片通道可继续',async t=>{
  const f=await fixture(t,{submissionOptions:{maxStorageBytes:1024}}),d=await draft(f),reserved=Buffer.alloc(1024,32);pdf.copy(reserved);
  const op=await prepare(f,d,reserved),e=await f.request('/api/account/manual-drafts',{user:f.users[1],method:'POST',body:{request_key:key(),manual}});
  const require=createRequire(new URL('../../site/package.json',import.meta.url)),sharp=require('sharp'),jpeg=await sharp({create:{width:3,height:2,channels:3,background:'white'}}).jpeg().toBuffer();
  const payload={operation_id:key(),revision:1,copies_confirmed:true,image:{name:'copy.jpg',type:'image/jpeg',buffer:jpeg}};
  await assert.rejects(f.submissions.uploadAccountManualPage({id:e.body.id,accountId:f.users[1].user.id,payload}),{statusCode:503});
  await f.request(d.base+'/pdf/operations/'+op.operation_id+'/cancel',{method:'POST'});
  const saved=await f.submissions.uploadAccountManualPage({id:e.body.id,accountId:f.users[1].user.id,payload});assert.equal(saved.image_count,1);
  assert((await f.submissions.accountUsage(f.users[1].user.id)).storage_used_bytes>0);
});

test('同一账号同时只能一个图片或PDF传输；竞争取消不会发布或覆盖',async t=>{
  const f=await fixture(t),d=await draft(f),op=await prepare(f,d);
  const request=http.request(f.origin+d.base+'/pdf/uploads/'+op.upload_id+'/content',{method:'POST',headers:headers(f)});let earlyResponse=null;request.on('response',response=>{earlyResponse=response.statusCode;response.resume();});request.on('error',()=>{});request.write(pdf.subarray(0,8));t.after(()=>request.destroy());
  // 等到真实接收状态再检查竞争，避免短轮询在并行文件测试下饥饿写锁或提前断言。
  const deadline=Date.now()+10000;let state='reserved';
  do{const receipt=await status(f,d,op);assert.equal(receipt.status,200);state=receipt.body.state;if(state==='receiving')break;assert.equal(earlyResponse,null,'未完成的传输不应提前返回HTTP响应');await new Promise(r=>setTimeout(r,25));}while(Date.now()<deadline);
  assert.equal(state,'receiving','本次传输应在10秒内进入真实接收状态');assert.equal((await wire(f,d,op)).status,409);
  const another=await f.request('/api/account/manual-drafts',{method:'POST',body:{request_key:key(),manual}});assert.equal(another.status,200);
  const empty=new FormData();assert.equal((await f.request('/api/account/manual-drafts/'+another.body.id+'/pages/upload',{method:'POST',body:empty})).status,409);
  assert.equal((await f.request(d.base+'/pdf/operations/'+op.operation_id+'/cancel',{method:'POST'})).body.state,'cancelled');
  assert.equal((await f.request(d.base)).body.status,'draft');assert.equal((await f.submissions.accountUsage(f.users[0].user.id)).storage_used_bytes,0);
});

test('两个账号竞争最后一份容量，已预留的字节不能重复分配',async t=>{
  const f=await fixture(t,{submissionOptions:{maxStorageBytes:pdf.length}}),a=await draft(f),b=await draft(f,f.users[1]);
  const make=()=>({operation_id:key(),revision:2,name:'synthetic-copy.pdf',bytes:pdf.length,sha256:createHash('sha256').update(pdf).digest('hex'),copies_confirmed:true});
  const [x,y]=[make(),make()];
  const results=await Promise.all([f.request(a.base+'/pdf/uploads',{method:'POST',body:x}),f.request(b.base+'/pdf/uploads',{user:b.user,method:'POST',body:y})]);
  assert.equal(results.filter(r=>r.status===200).length,1);
  const failed=results[0].status===200?b:a,payload=failed===a?x:y;
  assert.equal((await f.request(failed.base+'/pdf/uploads',{user:failed.user,method:'POST',body:payload})).status,503);
  const used=await Promise.all(f.users.map(u=>f.submissions.accountUsage(u.user.id)));assert.equal(used.reduce((n,u)=>n+u.storage_reserved_bytes,0),pdf.length);
});
