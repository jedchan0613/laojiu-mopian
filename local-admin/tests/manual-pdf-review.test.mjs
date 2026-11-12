import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs/promises';import path from 'node:path';
import {createPdfReviewFixture,key,sha,addReviewPdf,pdfBytes,reviewRuntime,pdfManual} from './helpers/manual-pdf-review-fixture.mjs';
import {manualSnapshotContent} from '../../shared/manual-pdf-review.mjs';

test('PDF整册确认后提交固定源、报告、配置及页面，账号只获得必要的版本摘要',async t=>{
  const f=await createPdfReviewFixture(t),draft=await f.get();assert.equal(draft.manual_pdf_review.can_submit,true);assert.equal(draft.images.length,3);
  await f.submitBook();const r=await f.raw(),v=r.versions[0],owner=await f.get();assert.equal(r.status,'pending');assert.equal(v.source_format,'pdf');assert.equal(v.pdf.source.sha256,sha(pdfBytes));assert.equal(v.pdf.inspection.attachments,0);assert.equal(v.pdf.engine_fingerprint,'a'.repeat(64));assert.deepEqual(v.images.map(p=>p.source_page),[1,2,3]);assert.equal(v.digest,sha(JSON.stringify(manualSnapshotContent(v))));
  assert.equal(owner.versions[0].pdf_summary.pages,3);assert.equal(owner.versions[0].pdf,undefined);const safe=JSON.stringify(owner);for(const forbidden of [v.pdf.source.filename,v.pdf.engine_fingerprint,'PRIVATE-PDF-REVIEW-64','manual_pdf_label_receipts','native-config'])assert(!safe.includes(forbidden),'private field: '+forbidden);assert(!JSON.stringify(owner.versions).includes(v.pdf.source.sha256),'版本摘要不能复制内部PDF源绑定；既有本人上传回执仍保留重试所需摘要');
  const bytes=await f.submissions.getAccountManualVersionImage({id:f.id,accountId:f.accountId,revision:v.revision,filename:v.images[1].filename});assert.equal(sha(bytes),v.images[1].sha256);
  await assert.rejects(f.submissions.saveAccountManualPdfLabel({id:f.id,accountId:f.accountId,payload:{operation_id:key(),revision:r.revision,page_id:r.images[0].page_id,label:'1',note:''}}),{statusCode:409});
});

test('PDF纸面页码可保存及重放，不能换序删页；旧勾选不能绑定新版页码',async t=>{
  const f=await createPdfReviewFixture(t),before=await f.get(),old=f.submitPayload(before),payload={operation_id:key(),revision:before.revision,page_id:before.images[1].page_id,label:'封里 ii',note:'合成说明：印字略浅'};
  await f.submissions.saveAccountManualPdfLabel({id:f.id,accountId:f.accountId,payload});assert.equal((await f.submissions.saveAccountManualPdfLabel({id:f.id,accountId:f.accountId,payload})).repeated,true);
  const after=await f.get();assert.deepEqual(after.images.map(p=>p.source_page),[1,2,3]);assert.equal(after.images[1].label,'封里 ii');assert.equal(after.images[1].note,payload.note);assert.notEqual(after.manual_pdf_review.confirmation_token,before.manual_pdf_review.confirmation_token);
  assert.equal(sha(await f.submissions.getAccountManualPage({id:f.id,accountId:f.accountId,filename:after.images[1].filename})),after.images[1].sha256);
  await assert.rejects(f.operate({...old,revision:after.revision}),{statusCode:409});
  for(const changed of [{...payload,label:'不同内容'},{...payload,operation_id:key(),revision:after.revision,source_page:1},{...payload,operation_id:key(),revision:after.revision,label:'x'.repeat(41)}])await assert.rejects(f.submissions.saveAccountManualPdfLabel({id:f.id,accountId:f.accountId,payload:changed}));
  await assert.rejects(f.submissions.editAccountManualPages({id:f.id,accountId:f.accountId,payload:{operation_id:key(),revision:after.revision,action:'reorder',pages:[...after.images].reverse().map(p=>({page_id:p.page_id,label:'',note:''}))}}),{statusCode:409});
  await f.submitBook();assert.equal((await f.raw()).versions[0].images[1].label,'封里 ii');
});

test('整册确认不能省略；记录保存或撤回后不能重复使用旧的整册确认',async t=>{
  const f=await createPdfReviewFixture(t),r=await f.get(),p=f.submitPayload(r);
  const missing={...p};delete missing.pdf_confirmation;await assert.rejects(f.operate(missing),{statusCode:428});
  await assert.rejects(f.operate({...p,pdf_confirmation:{...p.pdf_confirmation,checks:{...p.pdf_confirmation.checks,appearance:false}}}),{statusCode:428});
  await assert.rejects(f.operate({...p,pdf_confirmation:{...p.pdf_confirmation,download:true}}),{statusCode:428});
  await f.operate(p);let current=await f.get();await f.operate({action:'withdraw',operation_id:key(),revision:current.revision});current=await f.get();
  await assert.rejects(f.operate({...p,operation_id:key(),revision:current.revision}),{statusCode:409});assert.equal(current.consent.processing,false);assert.equal(current.id,f.id);
  await f.submitBook();assert.equal((await f.raw()).versions.length,2);
});

test('只有21项人工检查及三个依据完整才能通过；转入仍须单独确认整理影响',async t=>{
  const f=await createPdfReviewFixture(t);await f.submitBook();const r=await f.raw(),p=f.approval(r),missing={...p};delete missing.pdf_checks;
  for(const wrong of [missing,{...p,pdf_checks:[true,true,true,false]},{...p,privacy_checks:p.privacy_checks.map(()=>false)},{...p,rights_basis:''},{...p,snapshot_digest:'0'.repeat(64)}])await assert.rejects(f.submissions.reviewManualSubmission(f.id,wrong));
  const approved=await f.submissions.reviewManualSubmission(f.id,p);assert.equal(approved.status,'approved');assert.equal(approved.manual_review_binding.pdf_checks.length,4);assert.equal(approved.manual_review_binding.pdf_digest,sha(JSON.stringify(r.versions[0].pdf)));
  assert(!JSON.stringify(await f.get()).includes(p.private_note));await assert.rejects(f.submissions.review(f.id,{revision:approved.revision,status:'approved'}),{statusCode:409});
  let calls=0;await assert.rejects(f.submissions.transferManualSubmission(f.id,{...f.binding(approved),catalog_revision:'b'.repeat(64),confirmed:false,title:'合成题名',product_name:'虚构物件',object_type:'RPR',accession_date:'2000-01-01'},{planCatalog:async()=>calls++,createArchive:async()=>calls++,importCatalog:async()=>calls++}),{statusCode:428});assert.equal(calls,0);
});

test('需要补充时沿用原编号整份替换，新源与精细配置生成新快照，旧版仍只读',async t=>{
  const f=await createPdfReviewFixture(t);await f.submitBook();const first=await f.raw(),old=structuredClone(first.versions[0]),image=old.images[1];
  await f.submissions.reviewManualSubmission(f.id,{...f.approval(first),status:'needs_info',public_message:'请提供补齐后的整份合成PDF'});let r=await f.get();await f.operate({action:'edit',operation_id:key(),revision:r.revision});
  r=await f.get();assert.equal(r.manual_draft_reason,'supplement');assert.equal(r.consent.processing,false);await addReviewPdf(f,{id:f.id,bytes:Buffer.concat([pdfBytes,Buffer.from('replacement-64')])});
  r=await f.get();assert.equal(r.manual_pdf_generation.preview.source_current,false);await assert.rejects(f.operate({...f.submitPayload(r),pdf_confirmation:old.consent.pdf_confirmation}));
  await f.generateBook('detail');await f.submitBook();const next=await f.raw();assert.equal(next.id,first.id);assert.equal(next.versions.length,2);assert.deepEqual(next.versions[0],old);assert.equal(next.versions[1].action,'supplemented');assert.equal(next.versions[1].pdf.profile,'detail');assert.notEqual(next.versions[1].pdf.source.source_id,old.pdf.source.source_id);assert.equal(next.manual_review_binding,undefined);
  assert.equal(sha(await f.submissions.getAccountManualVersionImage({id:f.id,accountId:f.accountId,revision:old.revision,filename:image.filename})),image.sha256);
  assert.equal(sha(await f.submissions.getManualReviewImage(f.id,old.revision,image.filename)),image.sha256);
  await assert.rejects(f.submissions.reviewManualSubmission(f.id,{...f.approval(first),revision:next.revision}),{statusCode:409});
  await f.submissions.reviewManualSubmission(f.id,f.approval(next));assert.equal((await f.raw()).status,'approved');
});

test('处理配置更新使旧审核失效，历史仍可阅读；工具关闭时也不能通过新审核',async t=>{
  const f=await createPdfReviewFixture(t);await f.submitBook();let r=await f.raw();await f.submissions.reviewManualSubmission(f.id,f.approval(r));r=await f.raw();
  f.runtime.setEngine('b'.repeat(64));assert((await f.submissions.getManualReview(f.id)).pdf_review.problems.some(s=>s.includes('配置')));
  await assert.rejects(f.submissions.reviewManualSubmission(f.id,f.approval(r)),{statusCode:409});const v=r.versions[0];assert.equal(sha(await f.submissions.getAccountManualVersionImage({id:f.id,accountId:f.accountId,revision:v.revision,filename:v.images[0].filename})),v.images[0].sha256);
  await f.operate({action:'withdraw',operation_id:key(),revision:r.revision});await f.generateBook();await f.submitBook();r=await f.raw();assert.equal(r.versions[1].pdf.engine_fingerprint,'b'.repeat(64));f.runtime.setReady(false);await assert.rejects(f.submissions.reviewManualSubmission(f.id,f.approval(r)),{statusCode:409});
  assert.equal(sha(await f.submissions.getManualReviewImage(f.id,v.revision,v.images[0].filename)),v.images[0].sha256);
});

test('源文件及实际JPEG字节被更改后不能通过；页图损坏也不能借历史入口读取',async t=>{
  const f=await createPdfReviewFixture(t);await f.submitBook();const r=await f.raw(),v=r.versions[0],source=path.join(f.root,'submissions',f.id,'pdf',v.pdf.source.filename),oldSource=await fs.readFile(source),changed=Buffer.from(oldSource);changed[changed.length-2]^=1;await fs.writeFile(source,changed);
  await assert.rejects(f.submissions.reviewManualSubmission(f.id,f.approval(r)),{statusCode:409});await fs.writeFile(source,oldSource);
  const image=path.join(f.root,'submissions',f.id,'pdf/jobs',v.pdf.job_id,'pages',v.images[0].filename),oldImage=await fs.readFile(image),bad=Buffer.from(oldImage);bad[bad.length-5]^=1;await fs.writeFile(image,bad);
  await assert.rejects(f.submissions.reviewManualSubmission(f.id,f.approval(r)),{statusCode:409});await assert.rejects(f.submissions.getAccountManualVersionImage({id:f.id,accountId:f.accountId,revision:v.revision,filename:v.images[0].filename}),{statusCode:409});
  await fs.writeFile(image,oldImage);await f.submissions.reviewManualSubmission(f.id,f.approval(r));assert.equal((await f.raw()).status,'approved');
});

test('修改来源映射、纸面页码、检查报告或提交快照均不能复用审核',async t=>{
  const f=await createPdfReviewFixture(t);await f.submitBook();const original=await f.raw(),jobFile=path.join(f.root,'submissions',f.id,'pdf/jobs',original.versions[0].pdf.job_id,'job.json'),originalJob=await fs.readFile(jobFile);
  for(const change of [r=>{r.images[0].source_page=2;},r=>{r.images[0].label='伪造页码';},r=>{r.versions[0].pdf.inspection.attachments=1;},r=>{r.versions[0].pdf.engine_fingerprint='c'.repeat(64);r.versions[0].digest=sha(JSON.stringify(manualSnapshotContent(r.versions[0])));}]){const r=structuredClone(original);change(r);await fs.writeFile(f.rawFile,JSON.stringify(r));await assert.rejects(f.submissions.reviewManualSubmission(f.id,f.approval(r)));}
  await fs.writeFile(f.rawFile,JSON.stringify(original));const job=JSON.parse(originalJob);job.inspection.form='AcroForm';await fs.writeFile(jobFile,JSON.stringify(job));await assert.rejects(f.submissions.reviewManualSubmission(f.id,f.approval(original)));
  await fs.writeFile(jobFile,originalJob);await f.submissions.reviewManualSubmission(f.id,f.approval(original));assert.equal((await f.raw()).status,'approved');
  const approved=await f.raw();approved.images[0].label='审核后被改动的纸面页码';await fs.writeFile(f.rawFile,JSON.stringify(approved));assert((await f.submissions.getManualReview(f.id)).pdf_review.problems.some(s=>s.includes('失效')));
});

test('保留PDF草稿方式约束；官网线索另建空稿，只提交线索且不扩大阅读或下载范围',async t=>{
  const f=await createPdfReviewFixture(t),before=await f.get(),manual={...pdfManual,sharing_scope:'official-link',rights_basis:'official-link',official_url:'https://example.com/support/synthetic-64.pdf'};
  await assert.rejects(f.submissions.saveAccountManualDraft({id:f.id,accountId:f.accountId,revision:before.revision,payload:{manual}}),{statusCode:409});
  const made=await f.submissions.createAccountManualDraft({accountId:f.accountId,payload:{request_key:key(),manual}}),draft=await f.submissions.getAccountManualSubmission({id:made.id,accountId:f.accountId}),payload=f.submitPayload(draft);
  await f.submissions.operateAccountManualSubmission({id:made.id,accountId:f.accountId,payload});const r=await f.submissions.getManualReview(made.id),v=r.versions[0];assert.equal(v.images.length,0);assert.equal(v.pdf,undefined);assert.equal(r.manual_pdf_sources,undefined);assert.equal((await f.get()).manual_pdf.retained_sources,1);
  await f.submissions.reviewManualSubmission(made.id,f.approval(r));const current=await f.submissions.getManualReview(made.id);assert.equal(current.manual_review_binding.sharing_scope,'official-link');assert.equal(current.manual_review_binding.pdf_checks,undefined);assert(!current.linked_item_id);
});

test('6.3旧预览缺少送审报告时仍可私密阅读，必须重新生成后才可提交',async t=>{
  const runtime=reviewRuntime(),inspect=runtime.inspect;runtime.inspect=async(...args)=>{const r=await inspect(...args);delete r.inspection;return r;};const f=await createPdfReviewFixture(t,{runtime}),r=await f.get();
  assert.equal(r.manual_pdf_review.can_submit,false);assert(r.manual_pdf_review.problems.some(s=>s.includes('检查报告')));const p=r.images[0];assert.equal(sha(await f.submissions.getAccountManualPage({id:f.id,accountId:f.accountId,filename:p.filename})),p.sha256);
  runtime.inspect=inspect;await f.generateBook();assert.equal((await f.get()).manual_pdf_review.can_submit,true);await f.submitBook();assert.equal((await f.raw()).status,'pending');
});

test('撤回、停止、恢复都保留PDF和快照；进入整理标记后只能申请停止且审核受阻',async t=>{
  const f=await createPdfReviewFixture(t);await f.submitBook();let r=await f.get();const versions=r.versions;await f.operate({action:'withdraw',operation_id:key(),revision:r.revision});r=await f.get();await f.operate({action:'discard',operation_id:key(),revision:r.revision});r=await f.get();assert.equal(r.status,'withdrawn');assert.deepEqual(r.versions,versions);assert.equal(r.manual_pdf.retained_sources,1);await f.operate({action:'edit',operation_id:key(),revision:r.revision});await f.submitBook();
  let raw=await f.raw();await f.submissions.reviewManualSubmission(f.id,f.approval(raw));raw=await f.raw();raw.manual_handoff={status:'needs_review',digest:raw.versions.at(-1).digest};await fs.writeFile(f.rawFile,JSON.stringify(raw));
  await f.operate({action:'withdraw',operation_id:key(),revision:raw.revision});raw=await f.raw();assert.equal(raw.withdrawal_requested,true);await assert.rejects(f.submissions.reviewManualSubmission(f.id,f.approval(raw)),{statusCode:409});assert.equal((await f.get()).manual_in_preparation,true);
});

test('提交重放只保存一个快照，多窗口同版竞争只有一次成功，旧token不能用于另一个操作',async t=>{
  const f=await createPdfReviewFixture(t),p=f.submitPayload(await f.get());await f.operate(p);assert.equal((await f.operate(p)).repeated,true);assert.equal((await f.raw()).versions.length,1);await assert.rejects(f.operate({...p,operation_id:key()}),{statusCode:409});
  let r=await f.get();await f.operate({action:'withdraw',operation_id:key(),revision:r.revision});r=await f.get();const a=f.submitPayload(r),b=f.submitPayload(r),results=await Promise.allSettled([f.operate(a),f.operate(b)]);assert.equal(results.filter(x=>x.status==='fulfilled').length,1);assert.equal((await f.raw()).versions.length,2);
});

test('200页提交与审核保留完整来源顺序，每页只读读取均匹配摘要',async t=>{
  const f=await createPdfReviewFixture(t,{pages:200});await f.submitBook();const r=await f.raw(),v=r.versions[0];assert.equal(v.images.length,200);assert.deepEqual(v.images.map(p=>p.source_page),Array.from({length:200},(_,i)=>i+1));await f.submissions.reviewManualSubmission(f.id,f.approval(r));
  for(const n of [1,2,100,200]){const p=v.images[n-1];assert.equal(sha(await f.submissions.getAccountManualVersionImage({id:f.id,accountId:f.accountId,revision:v.revision,filename:p.filename})),p.sha256);}assert.equal((await f.raw()).manual_review_binding.pdf_checks.length,4);
});
