import test from 'node:test';import assert from 'node:assert/strict';
import {createPdfReviewFixture,key} from './helpers/manual-pdf-review-fixture.mjs';
const labelPayload=r=>({operation_id:key(),revision:r.revision,page_id:r.images[0].page_id,label:'封面',note:'合成私密说明'});
test('本地PDF送审HTTP冻结完整提交，留存图片无缓存且没有源PDF下载路径',async t=>{
  const f=await createPdfReviewFixture(t),config=await f.request('/api/account/config');assert.equal(config.body.manual_pdf_workflow_version,1);
  const payload=f.submitPayload(await f.get()),saved=await f.request(f.base+'/operate',{method:'POST',body:payload});assert.equal(saved.status,200);
  const r=(await f.request(f.base)).body,v=r.versions[0];assert.equal(r.status,'pending');assert.equal(v.pdf_summary.pages,3);assert.equal(v.pdf,undefined);
  const image=await fetch(f.origin+f.base+`/versions/${v.revision}/images/${v.images[0].filename}`,{headers:{Cookie:f.cookie()}});assert.equal(image.status,200);assert.match(image.headers.get('Cache-Control'),/no-store/);assert.equal(image.headers.get('Cross-Origin-Resource-Policy'),'same-origin');
  const raw=await f.raw(),source=raw.versions[0].pdf.source.filename;for(const route of [f.base+'/pdf/'+source,'/api/account/manual-drafts/'+f.id+'/images/'+source,'/'+f.id+'/pdf/'+source])assert.equal((await fetch(f.origin+route,{headers:{Cookie:f.cookie()}})).status,404);
});
test('账号与同源保护覆盖PDF页码、回执、提交和历史图像',async t=>{
  const f=await createPdfReviewFixture(t),draft=await f.get(),payload=labelPayload(draft),labelBase='/api/account/manual-drafts/'+f.id+'/pdf';
  for(const user of [null,f.users[1]]){const expected=user?404:401;assert.equal((await f.request(labelBase+'/page-labels',{user,method:'POST',body:payload})).status,expected);assert.equal((await f.request(labelBase+'/label-operations/'+payload.operation_id,{user})).status,expected);assert.equal((await f.request(f.base+'/operate',{user,method:'POST',body:f.submitPayload(draft)})).status,expected);}
  for(const changed of [{Origin:'https://other.example.invalid'},{'X-LJM-Account-Request':''}])assert.equal((await f.request(labelBase+'/page-labels',{method:'POST',body:payload,headers:changed})).status,403);
  await f.submitBook();const r=await f.raw(),v=r.versions[0];for(const user of [null,f.users[1]]){const image=await fetch(f.origin+f.base+`/versions/${v.revision}/images/${v.images[0].filename}`,{headers:user?{Cookie:f.cookie(user)}:{}});assert.equal(image.status,user?404:401);}
});
test('送审成功而响应丢失时原回执可找回，不重复创建版本或消耗次数',async t=>{
  const f=await createPdfReviewFixture(t),payload=f.submitPayload(await f.get());let lost=false;f.setInterceptor((req,res)=>{if(req.url===f.base+'/operate'&&!lost){lost=true;res.end=()=>{res.destroy();return res;};}return false;});
  await assert.rejects(f.request(f.base+'/operate',{method:'POST',body:payload}));f.setInterceptor(null);
  const receipt=await f.request(f.base+'/operations/'+payload.operation_id);assert.equal(receipt.body.applied,true);const repeated=await f.request(f.base+'/operate',{method:'POST',body:payload});assert.equal(repeated.body.repeated,true);assert.equal((await f.raw()).versions.length,1);
});
test('纸面页码成功丢响应后按原操作找回；不能借额外字段换页或改源',async t=>{
  const f=await createPdfReviewFixture(t),before=await f.get(),payload=labelPayload(before),base='/api/account/manual-drafts/'+f.id+'/pdf';let lost=false;f.setInterceptor((req,res)=>{if(req.url===base+'/page-labels'&&!lost){lost=true;res.end=()=>{res.destroy();return res;};}return false;});
  await assert.rejects(f.request(base+'/page-labels',{method:'POST',body:payload}));f.setInterceptor(null);const receipt=await f.request(base+'/label-operations/'+payload.operation_id);assert.equal(receipt.body.applied,true);assert.match(receipt.headers.get('Cache-Control'),/no-store/);
  assert.equal((await f.request(base+'/page-labels',{method:'POST',body:payload})).body.repeated,true);const r=await f.get();assert.equal(r.images[0].label,'封面');assert.equal(r.revision,before.revision+1);
  assert.equal((await f.request(base+'/page-labels',{method:'POST',body:{...payload,operation_id:key(),revision:r.revision,filename:'../source.pdf'}})).status,400);
});
test('暂停时禁止新送审和页码写入，已有版本、回执、撤回及停止仍可用',async t=>{
  const f=await createPdfReviewFixture(t),p=f.submitPayload(await f.get());await f.operate(p);f.setUploadsOpen(false);let r=await f.get();const v=r.versions[0];
  assert.equal((await f.request(f.base+'/operations/'+p.operation_id)).body.applied,true);assert.equal((await fetch(f.origin+f.base+`/versions/${v.revision}/images/${v.images[0].filename}`,{headers:{Cookie:f.cookie()}})).status,200);
  assert.equal((await f.request(f.base+'/operate',{method:'POST',body:{action:'withdraw',operation_id:key(),revision:r.revision}})).status,200);r=await f.get();assert.equal((await f.request(f.base+'/operate',{method:'POST',body:f.submitPayload(r)})).status,503);
  assert.equal((await f.request('/api/account/manual-drafts/'+f.id+'/pdf/page-labels',{method:'POST',body:labelPayload(r)})).status,503);assert.equal((await f.request(f.base+'/operate',{method:'POST',body:{action:'discard',operation_id:key(),revision:r.revision}})).status,200);
});
test('生产模式PDF送审与页码能力关闭，已有记录可读，普通图片投稿能力保持',async t=>{
  const f=await createPdfReviewFixture(t,{handlerOptions:{local:false}}),config=await f.request('/api/account/config'),p=f.submitPayload(await f.get());assert.equal(config.body.manual_pdf_workflow_version,0);assert.equal(config.body.manual_workflow_version,1);
  assert.equal((await f.request(f.base+'/operate',{method:'POST',body:p})).status,503);assert.equal((await f.request('/api/account/manual-drafts/'+f.id+'/pdf/page-labels',{method:'POST',body:labelPayload(await f.get())})).status,503);assert.equal((await f.request(f.base)).status,200);
});
