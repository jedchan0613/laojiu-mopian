import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {randomUUID} from 'node:crypto';
import {createReviewHttpFixture} from './helpers/manual-review-fixture.mjs';

test('本机审核HTTP：来源与操作凭证、旧版审核、人工确认、私密图片及失败回执',{timeout:45000},async t=>{
  const f=await createReviewHttpFixture(t);let data=await f.detail();assert.equal((await f.get('/healthz')).body.capabilities.manualReviewVersion,1);
  for(const asset of ['/admin/manual-review.html','/admin/manual-review.js','/admin/manual-review.css']){const r=await f.get(asset);assert.equal(r.status,200);assert.equal(r.headers.get('cache-control'),'no-store');}
  assert.equal((await f.post(f.base+'/review',f.approval(data),undefined,{origin:'https://foreign.example.com'})).status,403);assert.equal((await f.post(f.base+'/review',f.approval(data),undefined,{'x-ljm-operation-id':''})).status,428);
  let r=await f.post(f.base+'/review',{...f.approval(data),privacy_checks:[]});assert.equal(r.status,428);assert.equal(r.body.operation.status,'failed');
  const ids={operationId:randomUUID(),stepId:randomUUID()},body=f.approval(data);r=await f.post(f.base+'/review',body,ids);assert.equal(r.status,200,JSON.stringify(r.body));assert.equal(r.body.operation.status,'succeeded');const approvedRevision=r.body.revision;
  assert.equal((await f.post(f.base+'/review',body,ids)).body.replayed,true);data=await f.detail();assert.equal(data.record.revision,approvedRevision);
  const page=data.record.versions[0].images[0],image=await fetch(f.origin+f.base+`/versions/${data.record.manual_submitted_revision}/images/${page.filename}`);assert.equal(image.status,200);assert.match(image.headers.get('cache-control'),/no-store/);
  assert.equal((await f.post('/api/admin/submissions/'+f.submissionId+'/review',{revision:data.record.revision,status:'approved',rights_reviewed:true})).status,409);
});

test('200页HTTP转入沿用全册顺序、原编号来源与SUS/Y/U0草稿，不把图片或目录提前公开',{timeout:90000},async t=>{
  const f=await createReviewHttpFixture(t,{pages:200});let data=await f.detail();assert.equal((await f.post(f.base+'/review',f.approval(data))).status,200);data=await f.detail();
  const ids={operationId:randomUUID(),stepId:randomUUID()},payload=f.transfer(data),result=await f.post(f.base+'/transfer',payload,ids);assert.equal(result.status,200,JSON.stringify(result.body));const itemId=result.body.item_id;
  const draft=JSON.parse(await fs.readFile(path.join(path.dirname(f.root),'drafts',itemId+'.json'))),catalog=(await f.get('/api/manuals')).body.state.draft,doc=catalog.documents[0];
  assert.equal(draft.record.core.record_status,'SUS');assert.equal(draft.record.core.privacy_level,'Y');assert.equal(draft.record.core.use_status,'U0');assert.equal(draft.record.core.publication_file_path.length,200);assert.equal(draft.source_submission_id,f.submissionId);assert.equal(draft.manual_submission.pages.length,200);assert.equal(doc.page_map.length,200);assert.equal(doc.page_map.at(-1).attachment_ref.endsWith('/detail-198-public.jpg'),true);
  assert.deepEqual(doc.page_map.map(p=>p.attachment_ref),draft.record.core.publication_file_path);assert.equal((await fs.readdir(path.join(path.dirname(f.root),'inbox',itemId))).length,200);
  await assert.rejects(fs.access(path.join(f.site,'public/archive',itemId)));await assert.rejects(fs.access(f.source));assert.equal((await f.post(f.base+'/transfer',payload,ids)).body.replayed,true);assert.equal((await fs.readdir(path.join(path.dirname(f.root),'drafts'))).length,1);
  const state=(await f.get('/api/manuals')).body,review=await f.post('/api/manuals/review',{expectedRevision:state.revision});assert(review.body.issues.some(i=>i.message.includes('关联档案未公开')));
  const response=await f.post('/api/publish',{itemId,expectedRevision:(await f.get('/api/record-version/'+itemId)).body.revision,confirmations:Array(13).fill(true)});assert.notEqual(response.status,200,'资料不完整和没有正式发布清单时不能公开');
});

test('官方线索审核到目录、隔离预览和本地构建；公开输入不含账号及审核备注',{timeout:45000},async t=>{
  const f=await createReviewHttpFixture(t,{pages:0,metadata:{sharing_scope:'official-link',rights_basis:'official-link',official_url:'https://support.example.com/synthetic/manual'}});let data=await f.detail();assert.equal((await f.post(f.base+'/review',f.approval(data))).status,200);data=await f.detail();const result=await f.post(f.base+'/transfer',f.transfer(data));assert.equal(result.status,200,JSON.stringify(result.body));assert.equal(result.body.item_id,null);
  const state=(await f.get('/api/manuals')).body,doc=state.state.draft.documents[0],preview=await f.get('/api/manuals/preview?revision='+state.revision+'&manual='+doc.manual_key);assert.equal(preview.status,200);assert.equal(preview.body.issues.length,0);assert.equal(preview.body.document.official_sources.length,1);
  const reviewed=await f.post('/api/manuals/review',{expectedRevision:state.revision});assert.equal(reviewed.body.issues.length,0);const published=await f.post('/api/manuals/publish',{expectedRevision:state.revision,review_id:reviewed.body.review_id,confirmations:Array(5).fill(true)});assert.equal(published.status,200,JSON.stringify(published.body));
  const raw=await fs.readFile(f.source,'utf8');for(const secret of [f.submissionId,f.accountId,'PRIVATE-REVIEW-HTTP-NOTE','source_submission_','合成封面型号与适用范围逐项核对'])assert.equal(raw.includes(secret),false);assert.equal(JSON.parse(raw).documents[0].linked_archive_id,'');
  assert.equal(raw.toLowerCase().includes(f.submissionId.slice(3).toLowerCase()),false);
  assert.equal((await fs.readdir(path.join(path.dirname(f.root),'drafts')).catch(e=>e.code==='ENOENT'?[]:Promise.reject(e))).length,0);
});

test('官方交接后停止申请阻断目录发布；不能通过手工删除来源绑定或扩大成阅读副本绕过',{timeout:45000},async t=>{
  const f=await createReviewHttpFixture(t,{pages:0,metadata:{sharing_scope:'official-link',rights_basis:'official-link',official_url:'https://support.example.com/synthetic/manual'}});let data=await f.detail();await f.post(f.base+'/review',f.approval(data));data=await f.detail();await f.post(f.base+'/transfer',f.transfer(data));data=await f.detail();
  await f.store.operateAccountManualSubmission({id:f.submissionId,accountId:f.accountId,payload:{action:'withdraw',operation_id:'a'.repeat(64),revision:data.record.revision}});let state=(await f.get('/api/manuals')).body;const catalog=structuredClone(state.state.draft);delete catalog.documents[0].source_submission_id;assert.equal((await f.post('/api/manuals/save',{expectedRevision:state.revision,catalog})).status,200);state=(await f.get('/api/manuals')).body;assert.equal(state.state.draft.documents[0].source_submission_id,f.submissionId);const checked=await f.post('/api/manuals/review',{expectedRevision:state.revision});assert(checked.body.issues.some(i=>i.message.includes('停止')));await assert.rejects(fs.access(f.source));
});

test('阅读副本完整隔离流程：审核、待入站档案、正式发布检查、目录预览和构建',{timeout:60000},async t=>{
  const f=await createReviewHttpFixture(t,{pages:12});let data=await f.detail();await f.post(f.base+'/review',f.approval(data));data=await f.detail();const handed=await f.post(f.base+'/transfer',f.transfer(data));assert.equal(handed.status,200,JSON.stringify(handed.body));const itemId=handed.body.item_id;
  const row=(await f.get('/api/bootstrap?format=split-v1')).body.records.find(r=>r.core.item_id===itemId);assert(row);Object.assign(row.core,{batch_id:'SYNTHETIC-REVIEW-HTTP',physical_location:'隔离测试目录',rights_status:'OWN',digitization_status:'DG1'});
  let result=await f.post('/api/save-draft',{isNew:false,expectedRevision:row._admin.revision,record:row,images:row.core.publication_file_path.map(src=>({kind:'existing',filename:path.basename(src)}))});assert.equal(result.status,200,JSON.stringify(result.body));const revision=result.body.revision;
  const review=await f.post('/api/publication-review',{itemId,expectedRevision:revision});assert.equal(review.status,200,JSON.stringify(review.body));assert.deepEqual(review.body.issues,[]);
  result=await f.post('/api/publish',{itemId,expectedRevision:revision,reviewId:review.body.reviewId,confirmations:Array(13).fill(true)});assert.equal(result.status,200,JSON.stringify(result.body));
  const published=JSON.parse(await fs.readFile(path.join(f.archiveDirectory,itemId+'.json')));assert.equal(published.core.privacy_level,'G');assert.equal(published.core.use_status,'U3');assert.equal(published.core.publication_file_path.length,12);assert.equal(JSON.stringify(published).includes(f.submissionId),false);
  const state=(await f.get('/api/manuals')).body,manualKey=handed.body.manual_key,preview=await f.get(`/api/manuals/preview?revision=${state.revision}&manual=${manualKey}`);assert.equal(preview.body.issues.length,0,JSON.stringify(preview.body));assert.equal(preview.body.document.pages.length,12);
  const checked=await f.post('/api/manuals/review',{expectedRevision:state.revision});assert.equal(checked.body.issues.length,0);result=await f.post('/api/manuals/publish',{expectedRevision:state.revision,review_id:checked.body.review_id,confirmations:Array(5).fill(true)});assert.equal(result.status,200,JSON.stringify(result.body));const input=JSON.parse(await fs.readFile(f.source,'utf8'));assert.equal(input.documents[0].page_map.length,12);assert.equal(input.documents[0].linked_archive_id,itemId);assert.equal(JSON.stringify(input).includes('PRIVATE-REVIEW-HTTP-NOTE'),false);
});

test('转入保留投稿调整后的页序及纸面页码，本页私密说明不复制进公开档案字段',{timeout:45000},async t=>{
  const f=await createReviewHttpFixture(t,{pages:3});let r=await f.store.getManualReview(f.submissionId);await f.store.operateAccountManualSubmission({id:f.submissionId,accountId:f.accountId,payload:{action:'withdraw',revision:r.revision,operation_id:'b'.repeat(64)}});r=await f.store.getManualReview(f.submissionId);
  const ordered=[r.images[2],r.images[0],r.images[1]].map((p,i)=>({page_id:p.page_id,label:['附页C','封面','印刷1'][i],note:'PRIVATE-PAGE-NOTE-SHOULD-NOT-BE-PUBLIC'}));
  await f.store.editAccountManualPages({id:f.submissionId,accountId:f.accountId,payload:{action:'reorder',operation_id:'c'.repeat(64),revision:r.revision,pages:ordered}});r=await f.store.getManualReview(f.submissionId);await f.store.operateAccountManualSubmission({id:f.submissionId,accountId:f.accountId,payload:{action:'submit',revision:r.revision,operation_id:'d'.repeat(64),consent_version:'2026-11-11-manual-v1',consents:{copies:true,rights:true,privacy:true,processing:true}}});
  let data=await f.detail();await f.post(f.base+'/review',f.approval(data));data=await f.detail();const handed=await f.post(f.base+'/transfer',f.transfer(data));assert.equal(handed.status,200,JSON.stringify(handed.body));const saved=JSON.parse(await fs.readFile(path.join(path.dirname(f.root),'drafts',handed.body.item_id+'.json'))),doc=(await f.get('/api/manuals')).body.state.draft.documents[0];
  assert.deepEqual(saved.manual_submission.pages.map(p=>p.page_id),ordered.map(p=>p.page_id));assert.deepEqual(doc.page_map.map(p=>p.printed_label),ordered.map(p=>p.label));assert(saved.manual_submission.pages.every(p=>p.note===ordered[0].note));assert.equal(JSON.stringify(saved.record).includes(ordered[0].note),false);assert.equal(JSON.stringify(doc).includes(ordered[0].note),false);
});
