import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readManualPdfSettings,manualPdfAvailability} from '../manual-pdf-availability.mjs';
import {createManualAccountFixture} from './helpers/manual-account-fixture.mjs';
import {createPdfReviewFixture,reviewRuntime,key,pdfManual} from './helpers/manual-pdf-review-fixture.mjs';
import path from'node:path';import{createRequire}from'node:module';import{createSubmissionStore}from'../submissions.mjs';

test('生产PDF默认关闭，本地默认保留；私密总容量明确按MiB配置',()=>{
  assert.deepEqual(readManualPdfSettings('production',{}),{pdfOpen:false,maxStorageBytes:10*1024**3});
  assert.equal(readManualPdfSettings('development',{}).pdfOpen,true);
  assert.deepEqual(readManualPdfSettings('production',{LJM_ACCOUNT_PDF_OPEN:' TRUE ',LJM_SUBMISSION_MAX_STORAGE_MIB:'1024'}),{pdfOpen:true,maxStorageBytes:1024**3});
  for(const value of ['1','yes',''])assert.throws(()=>readManualPdfSettings('production',{LJM_ACCOUNT_PDF_OPEN:value}),/只能是 true 或 false/);
  for(const value of ['0','-1','1.5','1e3','10241','',NaN])assert.throws(()=>readManualPdfSettings('production',{LJM_SUBMISSION_MAX_STORAGE_MIB:value}),/1至10240/);
});

test('共用收件区的不同进程入口读取同一环境预算，预留不能被未显式传参的入口绕过',async t=>{
 const previous=process.env.LJM_SUBMISSION_MAX_STORAGE_MIB;process.env.LJM_SUBMISSION_MAX_STORAGE_MIB='1';
 try{const f=await createManualAccountFixture();t.after(()=>f.close());const a=f.users[0].user.id,b=f.users[1].user.id,first=await f.submissions.createAccountManualDraft({accountId:a,payload:{request_key:key(),manual:pdfManual}});await f.submissions.setAccountManualMaterial({id:first.id,accountId:a,payload:{operation_id:key(),revision:1,source_format:'pdf'}});const operation_id=key();await f.submissions.prepareAccountManualPdf({id:first.id,accountId:a,payload:{operation_id,revision:2,name:'synthetic.pdf',bytes:1024**2,sha256:'b'.repeat(64),copies_confirmed:true}});
 const other=createSubmissionStore({root:path.join(f.root,'submissions'),siteDirectory:path.resolve('site')}),second=await other.createAccountManualDraft({accountId:b,payload:{request_key:key(),manual:pdfManual}}),sharp=createRequire(new URL('../../site/package.json',import.meta.url))('sharp'),buffer=await sharp({create:{width:3,height:2,channels:3,background:'white'}}).jpeg().toBuffer(),payload={operation_id:key(),revision:1,copies_confirmed:true,image:{name:'synthetic.jpg',type:'image/jpeg',buffer}};
 await assert.rejects(other.uploadAccountManualPage({id:second.id,accountId:b,payload}),{statusCode:503});await f.submissions.cancelAccountManualPdf({id:first.id,accountId:a,operationId:operation_id});assert.equal((await other.uploadAccountManualPage({id:second.id,accountId:b,payload})).image_count,1);
 }finally{if(previous===undefined)delete process.env.LJM_SUBMISSION_MAX_STORAGE_MIB;else process.env.LJM_SUBMISSION_MAX_STORAGE_MIB=previous;}
});

test('关闭开关时不触碰转换器；异常运行状态保持生产关闭',async()=>{
  let calls=0;const submissionStore={manualPdfRuntimeStatus:async()=>{calls++;throw new Error('PRIVATE-PATH');}};
  const off=await manualPdfAvailability({local:false,pdfOpen:false,submissionStore});assert.equal(off.uploads,false);assert.equal(calls,0);
  const broken=await manualPdfAvailability({local:false,pdfOpen:true,submissionStore});assert.equal(broken.generation,false);assert.equal(calls,1);assert.doesNotMatch(broken.message,/PRIVATE/);
  await assert.rejects(manualPdfAvailability({local:false,pdfOpen:'true',submissionStore}),/布尔值/);
});

test('Windows通过或普通available不能替代Linux隔离验收；仅用内部合成证明覆盖未来分支',async()=>{
  for(const status of [{available:true},{available:true,execution_platform:'win32',production_verified:true},{available:true,execution_platform:'linux',production_verified:'true'},{available:false,execution_platform:'linux',production_verified:true}]){
    const state=await manualPdfAvailability({local:false,pdfOpen:true,submissionStore:{manualPdfRuntimeStatus:async()=>status}});assert.equal(state.uploads,false);assert.equal(state.workflow,false);
  }
  const synthetic={manualPdfRuntimeStatus:async()=>({available:true,execution_platform:'linux',production_verified:true})};
  assert.equal((await manualPdfAvailability({local:false,pdfOpen:true,submissionStore:synthetic})).uploads,true);
  assert.equal((await manualPdfAvailability({local:false,pdfOpen:false,submissionStore:synthetic})).uploads,false);
});

test('生产显式开启但未有Linux验收仍拒绝全部PDF新写入；图片能力不受影响',async t=>{
  const f=await createPdfReviewFixture(t,{handlerOptions:{local:false,pdfOpen:true}}),r=await f.get(),base='/api/account/manual-drafts/'+f.id;
  const config=(await f.request('/api/account/config')).body;
  for(const field of ['manual_pdf_uploads_version','manual_pdf_generation_version','manual_pdf_workflow_version'])assert.equal(config[field],0);
  assert.equal(config.manual_page_uploads_version,1);
  for(const [route,body] of [[base+'/material',{operation_id:key(),revision:r.revision,source_format:'images'}],[base+'/pdf/uploads',{}],[base+'/pdf/generations',{}],[base+'/pdf/page-labels',{}],[f.base+'/operate',f.submitPayload(r)]])assert.equal((await f.request(route,{method:'POST',body})).status,503);
  assert.equal((await fetch(f.origin+base+'/pdf/uploads/PU-'+'a'.repeat(24)+'/content',{method:'POST',headers:{Cookie:f.cookie(),Origin:f.origin,'X-LJM-Account-Request':'1','Content-Type':'application/pdf'},body:'%PDF-1.4'})).status,503);
  const made=await f.request('/api/account/manual-drafts',{method:'POST',body:{request_key:key(),manual:pdfManual}});assert.equal(made.status,200);
  const bytes=await f.submissions.getAccountManualPage({id:f.id,accountId:f.accountId,filename:r.images[0].filename}),form=new FormData();form.set('operation_id',key());form.set('revision','1');form.set('copies_confirmed','true');form.set('images',new Blob([bytes],{type:'image/jpeg'}),'synthetic-page.jpg');
  assert.equal((await f.request('/api/account/manual-drafts/'+made.body.id+'/pages/upload',{method:'POST',body:form})).status,200);
});

test('生产关闭PDF后仍可读取本人的上传、生成和页码回执，其他账号与跨站不放宽',async t=>{
  const f=await createPdfReviewFixture(t,{handlerOptions:{local:false,pdfOpen:false}}),r=await f.get(),base='/api/account/manual-drafts/'+f.id+'/pdf';
  const operations=[['operations',r.manual_pdf.operation.operation_id],['generation-operations',r.manual_pdf_generation.operation.operation_id],['label-operations',key()]];
  for(const [kind,operation] of operations){
    const url=base+'/'+kind+'/'+operation,result=await f.request(url);assert.equal(result.status,200);if(kind!=='label-operations')assert.equal(result.body.applied,true);
    for(const user of [null,f.users[1]])assert.equal((await f.request(url,{user})).status,user?404:401);
    assert.equal((await f.request(url,{headers:{Origin:'https://other.invalid'}})).status,403);
  }
  assert.equal((await f.request(base+'/operations/'+key()+'/cancel',{method:'POST'})).status,200);
  assert.equal((await f.request(base+'/generation-operations/'+key()+'/cancel',{method:'POST'})).status,200);
});

test('PDF关闭后原上传预留仍可取消并释放预留，禁止开始传送源字节',async t=>{
  const f=await createManualAccountFixture();t.after(()=>f.close());
  const made=await f.request('/api/account/manual-drafts',{method:'POST',body:{request_key:key(),manual:pdfManual}}),base='/api/account/manual-drafts/'+made.body.id;
  assert.equal((await f.request(base+'/material',{method:'POST',body:{operation_id:key(),revision:1,source_format:'pdf'}})).status,200);
  const pdf=Buffer.from('%PDF-1.4\nSYNTHETIC CLOSED SWITCH\n%%EOF'),operation_id=key(),prepared=await f.request(base+'/pdf/uploads',{method:'POST',body:{operation_id,revision:2,name:'synthetic.pdf',bytes:pdf.length,sha256:createHash('sha256').update(pdf).digest('hex'),copies_confirmed:true}});assert.equal(prepared.status,200);
  f.setPdfOpen(false);assert.equal((await f.request(base+'/pdf/operations/'+operation_id)).body.state,'reserved');
  const wire=await fetch(f.origin+base+'/pdf/uploads/'+prepared.body.upload_id+'/content',{method:'POST',headers:{Cookie:f.cookie(),Origin:f.origin,'X-LJM-Account-Request':'1','Content-Type':'application/pdf'},body:pdf});assert.equal(wire.status,503);
  assert.equal((await f.request(base+'/pdf/operations/'+operation_id+'/cancel',{method:'POST'})).body.state,'cancelled');
  assert.equal((await f.submissions.accountUsage(f.users[0].user.id)).storage_reserved_bytes,0);
});

test('PDF独立关闭后实际保留页码及提交回执、历史图像、撤回和停止；图片开关仍开',async t=>{
  const f=await createPdfReviewFixture(t),base='/api/account/manual-drafts/'+f.id+'/pdf';
  let r=await f.get();const label={operation_id:key(),revision:r.revision,page_id:r.images[0].page_id,label:'合成封面',note:''};
  assert.equal((await f.request(base+'/page-labels',{method:'POST',body:label})).status,200);
  const p=f.submitPayload(await f.get());assert.equal((await f.request(f.base+'/operate',{method:'POST',body:p})).status,200);f.setPdfOpen(false);
  const config=(await f.request('/api/account/config')).body;assert.equal(config.uploads_open,true);assert.equal(config.manual_page_uploads_version,1);assert.equal(config.manual_pdf_uploads_version,0);
  assert.equal((await f.request(base+'/label-operations/'+label.operation_id)).body.applied,true);assert.equal((await f.request(f.base+'/operations/'+p.operation_id)).body.applied,true);
  r=await f.get();const v=r.versions[0];assert.equal((await fetch(f.origin+f.base+`/versions/${v.revision}/images/${v.images[0].filename}`,{headers:{Cookie:f.cookie()}})).status,200);
  assert.equal((await f.request(f.base+'/operate',{method:'POST',body:{action:'withdraw',operation_id:key(),revision:r.revision}})).status,200);r=await f.get();
  assert.equal((await f.request(f.base+'/operate',{method:'POST',body:f.submitPayload(r)})).status,503);
  assert.equal((await f.request(f.base+'/operate',{method:'POST',body:{action:'discard',operation_id:key(),revision:r.revision}})).status,200);
});

test('新生成已开始后关闭PDF，原任务仍可查询并通过HTTP取消',async t=>{
  let release,entered;const blocked=new Promise(resolve=>{release=resolve;}),started=new Promise(resolve=>{entered=resolve;});
  const runtime=reviewRuntime({gate:async()=>{entered();await blocked;}}),f=await createPdfReviewFixture(t,{runtime,generate:false});
  t.after(()=>release());const base='/api/account/manual-drafts/'+f.id+'/pdf',operation_id=key(),r=await f.get();
  assert.equal((await f.request(base+'/generations',{method:'POST',body:{operation_id,revision:r.revision,profile:'standard'}})).status,200);
  await Promise.race([started,new Promise((_,reject)=>setTimeout(()=>reject(new Error('合成任务未启动')),10000).unref())]);f.setPdfOpen(false);
  assert.equal((await f.request(base+'/generation-operations/'+operation_id)).status,200);
  assert.equal((await f.request(base+'/generations',{method:'POST',body:{operation_id:key(),revision:r.revision,profile:'standard'}})).status,503);
  assert.equal((await f.request(base+'/generation-operations/'+operation_id+'/cancel',{method:'POST'})).status,200);release();await f.submissions.waitForPdfGenerationIdle();
  assert.equal((await f.request(base+'/generation-operations/'+operation_id)).body.state,'cancelled');
});
