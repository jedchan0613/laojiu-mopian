import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {randomUUID} from 'node:crypto';
import {createOnlineReviewFixture} from './helpers/manual-review-online-fixture.mjs';
import {createReviewHttpFixture} from './helpers/manual-review-fixture.mjs';
import {createSubmissionStore} from '../submissions.mjs';

test('线上审核默认关闭：页面给可理解入口，私密接口/脚本和编码旁路拒绝，目录不被补开',async t=>{
  const f=await createOnlineReviewFixture(t,{reviewEnabled:false});
  const caps=(await f.get('/healthz')).body.capabilities;
  assert.equal(caps.manualReviewVersion,0);assert.equal(caps.manualTransferVersion,0);assert.equal(caps.manualPdfHandoffVersion,0);
  const page=await f.get('/admin/manual-review.html');assert.equal(page.status,404);assert.match(page.body,/返回投稿收件箱/);
  for(const p of [f.base,f.base+'/review',f.base+'/transfer','/admin/manual-review.js','/admin/manual-review.css','/api/admin/%6danual-submissions/'+f.id,'/ADMIN/manual-review.html'])assert.equal((await f.get(p)).status,404,p);
  assert.equal((await f.get('/api/manuals')).status,404);
  assert.equal((await f.raw()).status,'pending');
});

test('线上审核入口走真实JWT验证：无令牌、伪造邮箱、过期、错站点、错签发方及普通账号均拒绝',async t=>{
  const f=await createOnlineReviewFixture(t),r=await f.raw(),page=r.versions.at(-1).images[0];
  const routes=['/admin/manual-review.html',f.base,f.base+`/versions/${r.manual_submitted_revision}/images/${page.filename}`,'/api/operations/'+randomUUID()];
  const invalid=['',f.token({email:'visitor@example.test'}),f.token({exp:1}),f.token({aud:['another-app']}),f.token({iss:'https://wrong.example.test'}),'not-a-valid-jwt'];
  for(const route of routes){
    for(const jwt of invalid)assert.equal((await f.get(route,{headers:{'cf-access-jwt-assertion':jwt,'cf-access-authenticated-user-email':f.email,Cookie:'ljm_session=ordinary-user'}})).status,403,route);
    assert.equal((await f.get(route)).status,200,route);
  }
});

test('线上审核读取独立于目录：持久目录损坏不初始化；响应使用白名单，历史PDF只显示受限版本',async t=>{
  const f=await createOnlineReviewFixture(t);
  await fs.mkdir(f.root,{recursive:true});await fs.writeFile(path.join(f.root,'state.json'),'BROKEN-CATALOG-KEEP');
  await f.mutate(r=>{
    r.internal_extra='PRIVATE-EXTRA-82';r.fields.contact_value='PRIVATE-CONTACT-82';
    const v=structuredClone(r.versions.at(-1));v.revision=1;v.source_format='pdf';v.pdf={source:{filename:'PRIVATE-PDF-82.pdf'},engine_fingerprint:'PRIVATE-ENGINE'};r.versions.unshift(v);
  });
  const result=await f.get(f.base);assert.equal(result.status,200,JSON.stringify(result.body));
  assert.equal(result.body.context.adminMode,'online');assert.equal(result.body.capabilities.manualReviewVersion,1);assert.equal(result.body.capabilities.manualTransferVersion,0);
  assert.equal(result.body.catalog_revision,undefined);assert.equal(result.body.record.account_id,undefined);
  const text=JSON.stringify(result.body);for(const x of ['PRIVATE-EXTRA-82','PRIVATE-CONTACT-82','PRIVATE-PDF-82.pdf','PRIVATE-ENGINE','key_hash','fingerprint'])assert(!text.includes(x),x);
  assert.equal(result.body.record.versions[0].restricted,true);assert.equal(result.body.record.versions[0].images,undefined);
  assert.equal((await f.get(f.base+`/versions/1/images/${(await f.raw()).images[0].filename}`)).status,404);
  assert.equal(await fs.readFile(path.join(f.root,'state.json'),'utf8'),'BROKEN-CATALOG-KEEP');
  const summary=(await f.get('/api/admin/submissions/'+f.id)).body;assert.equal(summary.image_count,2);assert.equal(summary.images,undefined);assert.equal(summary.versions,undefined);assert.equal(summary.fields.contact_value,undefined);
});

test('PDF关闭不受新审核开关影响：当前PDF、缺标记PDF及官网线索PDF的详情/页图/审核均拒绝',async t=>{
  const f=await createOnlineReviewFixture(t,{transferEnabled:true});const original=await f.raw(),filename=original.images[0].filename;
  for(const kind of ['pdf','missing-format','official-link']){
    await fs.writeFile(f.file,JSON.stringify(original));
    await f.mutate(r=>{if(kind==='missing-format')delete r.source_format;else r.source_format='pdf';r.versions.at(-1).source_format='pdf';r.versions.at(-1).pdf={source:{filename:'PRIVATE-SOURCE.pdf'}};if(kind==='official-link')r.manual_metadata.sharing_scope='official-link';});
    assert.equal((await f.get(f.base)).status,404,kind);
    assert.equal((await f.get(f.base+`/versions/${original.manual_submitted_revision}/images/${filename}`)).status,404,kind);
    assert.equal((await f.post(f.base+'/review',f.approval(original))).status,404,kind);
    assert.equal((await f.post(f.base+'/transfer',{})).status,404,kind);
  }
  assert.equal((await f.get('/healthz')).body.capabilities.manualTransferVersion,0);
  assert.equal((await f.get('/healthz')).body.capabilities.manualPdfHandoffVersion,0);
});

test('页图逐版本绑定并核对真实JPEG、内容摘要、大小：缺失、改图、跨册和路径越界都拒绝',async t=>{
  const f=await createOnlineReviewFixture(t);const r=await f.raw(),page=r.versions.at(-1).images[0],route=f.base+`/versions/${r.manual_submitted_revision}/images/${page.filename}`;
  const result=await f.get(route);assert.equal(result.status,200);assert.deepEqual(result.bytes,await fs.readFile(path.join(path.dirname(f.file),page.filename)));assert.equal(result.headers.get('content-type'),'image/jpeg');assert.equal(result.headers.get('cache-control'),'no-store');assert.equal(result.headers.get('cross-origin-resource-policy'),'same-origin');
  assert.equal((await f.get(f.base+`/versions/999/images/${page.filename}`)).status,404);
  assert.equal((await f.get(f.base+`/versions/${r.manual_submitted_revision}/images/manual-${'0'.repeat(64)}.jpg`)).status,404);
  const file=path.join(path.dirname(f.file),page.filename);await fs.writeFile(file,'PRIVATE-BAD-CONTENT');
  const broken=await f.get(route);assert.equal(broken.status,409);assert(!JSON.stringify(broken.body).includes('PRIVATE-BAD-CONTENT'));assert(!JSON.stringify(broken.body).includes(f.privateRoot));
  await fs.unlink(file);assert.equal((await f.get(route)).status,404);
  assert.equal((await f.get(f.base+`/versions/${r.manual_submitted_revision}/images/..%2Frecord.json`)).status,404);
});

test('审核写入需可信来源和指定入口：目录开关未开时拒绝线上整册转入及普通投稿审核旁路',async t=>{
  const f=await createOnlineReviewFixture(t,{transferEnabled:true}),r=await f.raw(),body=f.approval(r);
  assert.equal((await f.get('/healthz')).body.capabilities.manualTransferVersion,0,'仅启用转入开关不能补开目录维护');
  for(const headers of [{origin:'https://other.example.test'},{origin:''},{'x-ljm-admin-request':''},{'content-type':'text/plain'}])assert([403,415].includes((await f.post(f.base+'/review',body,undefined,headers)).status));
  assert.equal((await f.post(f.base+'/transfer',{...body,confirmed:true})).status,404);
  for(const action of ['review','transfer','request-review'])assert.equal((await f.post('/api/admin/submissions/'+f.id+'/'+action,{revision:r.revision,status:'needs_info',public_message:'不能旁路'})).status,409);
  assert.equal((await f.raw()).revision,r.revision);
  const detail=await f.get(f.base);assert.equal(detail.body.context.reviewWritable,process.platform==='linux');
});

test('本机审核保存返回专用持久回执，查结果和原编号重放均不重复写入或丢失审计',async t=>{
  const f=await createReviewHttpFixture(t);const data=await f.detail(),ids={operationId:randomUUID(),stepId:randomUUID()},body=f.approval(data);
  const saved=await f.post(f.base+'/review',body,ids);assert.equal(saved.status,200,JSON.stringify(saved.body));
  const result=saved.body.operation.result;assert.equal(result.translationRevision,undefined);assert.equal(result.manualReview.submissionId,f.submissionId);assert.equal(result.manualReview.submittedRevision,body.submitted_revision);assert.equal(result.manualReview.snapshotDigest,body.snapshot_digest);
  const queried=(await f.get('/api/operations/'+ids.operationId)).body.operations[0];assert.deepEqual(queried.result,result);assert(!JSON.stringify(queried).includes('PRIVATE-REVIEW-HTTP-NOTE'));
  const latest=await f.detail();assert.equal(latest.record.manual_review_audit.actor,'本机维护者');assert.equal(latest.record.manual_review_audit.operation_id,ids.operationId);assert.equal(latest.record.review_validity.valid,true);
  const repeated=await f.post(f.base+'/review',body,ids);assert.equal(repeated.body.replayed,true);assert.equal((await f.detail()).record.revision,latest.record.revision);
  assert.equal((await f.detail()).recent_operations.length,1);
});

test('审核存储绑定服务端身份并防旧版：17项不足拒绝，旧绑定显示待核对，补充/停止使旧表失效',async t=>{
  const f=await createOnlineReviewFixture(t),before=await f.raw(),payload=f.approval(before);
  await assert.rejects(f.store.reviewManualSubmission(f.id,{...payload,actor:'attacker@example.test'},f.context()),/不支持/);
  for(const changed of [{privacy_checks:[]},{checks:[true,true,true,false]},{source_basis:''}])await assert.rejects(f.store.reviewManualSubmission(f.id,{...payload,...changed},f.context()));
  await assert.rejects(f.store.reviewManualSubmission(f.id,payload,{online:true}),/身份|凭证/);
  const context=f.context(),saved=await f.store.reviewManualSubmission(f.id,payload,context);assert.equal(saved.status,'approved');assert.equal(saved.account_id,undefined);assert.equal(saved.private_note,undefined);
  let raw=await f.raw();assert.equal(raw.manual_review_audit.actor,f.email);assert.equal(raw.manual_review_audit.operation_id,context.operationId);
  let view=await f.get(f.base);assert.equal(view.body.record.review_validity.valid,true,JSON.stringify(view.body));
  const account=await f.store.getAccountSubmission({id:f.id,accountId:f.accountId});for(const field of ['manual_review_audit','manual_review_notice','manual_review_binding','private_note'])assert.equal(account[field],undefined,field);assert(!JSON.stringify(account).includes(f.email));
  await f.mutate(r=>{delete r.manual_review_audit;});view=await f.get(f.base);assert.equal(view.body.record.review_validity.valid,false);
  raw=await f.raw();await f.store.operateAccountManualSubmission({id:f.id,accountId:f.accountId,payload:{action:'withdraw',revision:raw.revision,operation_id:'b'.repeat(64)}});
  await assert.rejects(f.store.reviewManualSubmission(f.id,payload,f.context()),/更新|变化|停止|提交/);
});

test('通知通道失败保留私密待处理请求：审核仍成功，重放/同状态再审不重复通知，账号侧无内部审计',async t=>{
  const f=await createOnlineReviewFixture(t);let calls=0;
  const store=createSubmissionStore({root:f.env.LJM_SUBMISSION_DATA_DIR,siteDirectory:fileURLToPath(new URL('../../site/',import.meta.url)),notifier:async()=>{calls++;throw new Error('SYNTHETIC-NOTICE-FAIL');}});
  const r=await f.raw(),saved=await store.reviewManualSubmission(f.id,f.approval(r),f.context());assert.equal(saved.status,'approved');assert.equal(saved.notification_pending,true);assert.equal(calls,1);
  const next=await f.raw();assert.equal(next.manual_review_notice.status,'pending');
  await store.reviewManualSubmission(f.id,f.approval(next),f.context());assert.equal(calls,1);
  const owner=await store.getAccountSubmission({id:f.id,accountId:f.accountId});assert(!JSON.stringify(owner).includes('SYNTHETIC-NOTICE-FAIL'));assert.equal(owner.manual_review_notice,undefined);
});

test('Linux线上成功保存、身份指纹冲突、目录损坏独立保存与回执重启保留',{skip:process.platform!=='linux'&&'真实Linux部署锁留8.4执行',timeout:60000},async t=>{
  const f=await createOnlineReviewFixture(t),ids={operationId:randomUUID(),stepId:randomUUID()},payload=f.approval(await f.raw());
  await fs.mkdir(f.root,{recursive:true});await fs.writeFile(path.join(f.root,'state.json'),'BROKEN-KEEP');
  f.env.LJM_ADMIN_ALLOWED_EMAILS=f.email+',second@example.test';await f.restart();
  const saved=await f.post(f.base+'/review',payload,ids);assert.equal(saved.status,200,JSON.stringify(saved.body));
  assert.equal(saved.body.operation.result.manualReview.submissionId,f.id);assert.equal((await f.raw()).manual_review_audit.actor,f.email);
  const different=await f.post(f.base+'/review',payload,ids,{'cf-access-jwt-assertion':f.token({email:'second@example.test'})});assert.equal(different.status,409);assert.equal(different.body.code,'OPERATION_MISMATCH');
  await f.restart();assert.equal((await f.get('/api/operations/'+ids.operationId)).body.operations[0].status,'succeeded');assert.equal((await f.post(f.base+'/review',payload,ids)).body.replayed,true);
  assert.equal(await fs.readFile(path.join(f.root,'state.json'),'utf8'),'BROKEN-KEEP');
});
