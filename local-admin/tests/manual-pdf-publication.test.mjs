import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs/promises';import path from 'node:path';import os from 'node:os';
import {createPdfPublicationFixture} from './helpers/manual-pdf-publication-fixture.mjs';import {key,sha,reviewRuntime} from './helpers/manual-pdf-review-fixture.mjs';
import {manualPublicationInput} from '../manuals.mjs';import {createManualPdfPublicationBackup,assertManualPdfPublicArtifacts} from '../manual-pdf-publication.mjs';
import {createSubmissionStore} from '../submissions.mjs';

test('PDF交接只复制本次审核的完整JPEG，保留私密来源和纸面页码，不复制源PDF',async t=>{
  const f=await createPdfPublicationFixture(t);let r=await f.get();await f.submissions.saveAccountManualPdfLabel({id:f.id,accountId:f.accountId,payload:{operation_id:key(),revision:r.revision,page_id:r.images[1].page_id,label:'封里 ii',note:'PRIVATE-PDF65-PAGE-NOTE'}});
  await f.handoff();r=await f.raw();const v=r.versions.at(-1),doc=(await f.catalog.store.bootstrap()).state.draft.documents[0];
  assert.equal(f.draft.manual_submission.source_format,'pdf');assert.equal(f.draft.manual_submission.pdf_digest,sha(JSON.stringify(v.pdf)));assert.deepEqual(f.draft.manual_submission.pages.map(p=>p.source_page),[1,2,3]);assert.equal(f.draft.manual_submission.pages[1].note,'PRIVATE-PDF65-PAGE-NOTE');
  assert.equal(doc.source_pdf_digest,r.manual_handoff.pdf_digest);assert.deepEqual(doc.page_map,r.manual_handoff.page_map);assert.equal(doc.page_map[1].printed_label,'封里 ii');assert.equal((await f.store.manualCatalogPublicationIssues({documents:[doc]})).length,0);
  const projected=JSON.stringify(manualPublicationInput((await f.catalog.store.bootstrap()).state.draft));for(const privateValue of [f.id,r.account_id,v.pdf.source.sha256,v.pdf.source.filename,v.pdf.engine_fingerprint,'PRIVATE-PDF65-PAGE-NOTE','source_pdf_digest'])assert(!projected.includes(privateValue));
  for(const name of await fs.readdir(path.join(f.catalog.site,'public/archive',f.catalog.id)))assert(!name.endsWith('.pdf'));
  await f.store.guardPublication(f.catalog.id,async verify=>{await verify({draft:f.draft,images:await f.images()});});
});

test('200页PDF完整交接，逐页摘要和源页序保留，重复请求不重复创建草稿',{timeout:60000},async t=>{
  const f=await createPdfPublicationFixture(t,{pages:200});const r=await f.approve(),body={...f.transfer(r),catalog_revision:(await f.catalog.store.bootstrap()).revision};const handed=await f.store.transferManualSubmission(f.id,body,f.callbacks);assert.equal(f.draft.manual_submission.pages.length,200);assert.equal(f.draft.manual_submission.pages[199].source_page,200);assert.equal((await f.images()).length,200);
  const repeated=await f.store.transferManualSubmission(f.id,body,f.callbacks);assert(repeated.repeated);assert.equal(repeated.item_id,handed.item_id);assert.equal(f.archiveCalls,1);
});

test('处理配置、源文件和21项审核绑定变化都在写入待入站前阻断',async t=>{
  for(const change of ['config','source','checks']){const f=await createPdfPublicationFixture(t);let r=await f.approve();
    if(change==='config')f.runtime.setEngine('e'.repeat(64));
    if(change==='source')await fs.appendFile(path.join(f.root,'submissions',f.id,'pdf',r.versions[0].pdf.source.filename),'changed');
    if(change==='checks'){const record=JSON.parse(await fs.readFile(f.rawFile));record.manual_review_binding.pdf_checks[2]=false;await fs.writeFile(f.rawFile,JSON.stringify(record));r=await f.raw();}
    await assert.rejects(f.store.transferManualSubmission(f.id,{...f.transfer(r),catalog_revision:(await f.catalog.store.bootstrap()).revision},f.callbacks));assert.equal(f.archiveCalls,0);
  }
});

test('PDF档案草稿改图、换序或篡改来源不能沿用确认，历史恢复原整册可重新检查',async t=>{
  const f=await createPdfPublicationFixture(t);await f.handoff();const images=await f.images();
  for(const mutate of [d=>d.record.core.publication_file_path.reverse(),d=>d.record.core.publication_file_path.pop(),d=>d.manual_submission.pdf_digest='c'.repeat(64)]){const draft=structuredClone(f.draft);mutate(draft);await assert.rejects(f.store.guardPublication(f.catalog.id,verify=>verify({draft,images})));}
  await assert.rejects(f.store.guardPublication(f.catalog.id,verify=>verify({draft:f.draft,images:images.map((p,i)=>i? p:{...p,sha256:'d'.repeat(64)})})));
  const restored={record:structuredClone(f.draft.record),restored_from_history:'synthetic-history'};await f.store.guardPublication(f.catalog.id,verify=>verify({draft:restored,images}));
  const original=JSON.parse(await fs.readFile(f.rawFile));for(const [key,value]of [['digest','a'.repeat(64)],['submitted_revision',1],['archive_item_id','LJM-20000101-OTH-999'],['source_format','images']]){const changed=structuredClone(original);changed.manual_handoff[key]=value;await fs.writeFile(f.rawFile,JSON.stringify(changed));await assert.rejects(f.store.guardPublication(f.catalog.id,()=>{}));}await fs.writeFile(f.rawFile,JSON.stringify(original));
});

test('PDF目录不能换页序、纸面页码、来源摘要或扩展为其他档案',async t=>{
  const f=await createPdfPublicationFixture(t);await f.handoff();const doc=(await f.catalog.store.bootstrap()).state.draft.documents[0];
  for(const mutate of [d=>d.page_map.reverse(),d=>d.page_map[0].printed_label='另一页',d=>d.source_pdf_digest='d'.repeat(64),d=>d.linked_archive_id='LJM-20000101-OTH-999']){const changed=structuredClone(doc);mutate(changed);assert.equal((await f.store.manualCatalogPublicationIssues({documents:[changed]})).length,1);}
  const file=path.join(f.catalog.site,'public',doc.page_map[1].attachment_ref),bytes=await fs.readFile(file);await fs.writeFile(file,Buffer.concat([bytes,Buffer.from('changed')]));assert.equal((await f.store.manualCatalogPublicationIssues({documents:[doc]})).length,1);
  await fs.unlink(file);assert.match((await f.store.manualCatalogPublicationIssues({documents:[doc]}))[0].message,/尚未公开或缺失/);
});

test('PDF构建期间可立即申请停止，构建完成复查拒绝继续发布',async t=>{
  const f=await createPdfPublicationFixture(t);await f.handoff();let start,release;const started=new Promise(r=>start=r),gate=new Promise(r=>release=r);
  const operation=f.store.guardPublication(f.catalog.id,async verify=>{await verify({draft:f.draft,images:await f.images()});start();await gate;await verify();return 'must not commit';});await started;
  const r=await f.get();await f.operate({action:'withdraw',operation_id:key(),revision:r.revision});assert.equal((await f.get()).withdrawal_requested,true);release();await assert.rejects(operation);
  assert.equal((await f.store.manualCatalogPublicationIssues((await f.catalog.store.bootstrap()).state.draft)).length,1);
});

test('来源逐页深检期间收到停止申请，在执行发布回调前再次核对最新状态',{timeout:10000},async t=>{
  const runtime=reviewRuntime(),configuration=runtime.configuration;let entered,release;const reached=new Promise(r=>entered=r),gate=new Promise(r=>release=r);let block=false,adopted=false;
  runtime.configuration=async()=>{if(block){block=false;entered();await gate;}return configuration();};
  const f=await createPdfPublicationFixture(t,{runtime});await f.handoff();const owner=await f.get();block=true;
  const publication=f.store.guardPublication(f.catalog.id,()=>{adopted=true;});await reached;await f.operate({action:'withdraw',operation_id:key(),revision:owner.revision});release();await assert.rejects(publication);assert.equal(adopted,false);
});

test('整理后源PDF或生成页图发生变化时，档案与目录都停止采用旧审核',async t=>{
  const f=await createPdfPublicationFixture(t);await f.handoff();const r=await f.raw(),v=r.versions[0];await fs.appendFile(path.join(f.root,'submissions',f.id,'pdf/jobs',v.pdf.job_id,'pages',v.images[0].filename),'changed');await assert.rejects(f.store.guardPublication(f.catalog.id,()=>{}));assert.equal((await f.store.manualCatalogPublicationIssues((await f.catalog.store.bootstrap()).state.draft)).length,1);
});

test('恢复私密备份时中断任务只标记待重试，不重放生成或覆盖已有审核整册',async t=>{
  const f=await createPdfPublicationFixture(t);await f.handoff();const original=await f.raw(),restoredRoot=path.join(f.root,'restored/submissions');await fs.mkdir(path.dirname(restoredRoot),{recursive:true});await fs.cp(path.join(f.root,'submissions'),restoredRoot,{recursive:true});
  const operationId=key(),jobId='PG-'+sha(f.accountId+':'+f.id+':'+operationId).slice(0,24),oldJob=JSON.parse(await fs.readFile(path.join(restoredRoot,f.id,'pdf/jobs',original.manual_pdf_preview.job_id,'job.json'))),pending={...oldJob,job_id:jobId,operation_id:operationId,owner_pid:2147483646,state:'queued',pages:[],page_count:0,pages_digest:'',helper_cleanup:false};const folder=path.join(restoredRoot,f.id,'pdf/jobs',jobId);await fs.mkdir(folder,{recursive:true});await fs.writeFile(path.join(folder,'job.json'),JSON.stringify(pending));
  const callsBefore=f.runtime.calls.opens,store=createSubmissionStore({root:restoredRoot,siteDirectory:f.catalog.site,pdfGenerationRuntime:f.runtime}),receipt=await store.getAccountManualPdfGeneration({id:f.id,accountId:f.accountId,operationId});assert.equal(receipt.state,'interrupted');assert.equal(receipt.applied,false);await store.waitForPdfGenerationIdle();assert.equal(f.runtime.calls.opens,callsBefore);
  const saved=await store.getManualReview(f.id);assert.equal(saved.versions[0].digest,original.versions[0].digest);assert.equal(saved.manual_handoff.status,'complete');assert.deepEqual(saved.pdf_review.problems,[]);
});

async function files(t){const root=await fs.mkdtemp(path.join(os.tmpdir(),'ljm-pdf65-publish-'));t.after(async()=>{assert.equal(path.dirname(root),path.resolve(os.tmpdir()));assert(path.basename(root).startsWith('ljm-pdf65-publish-'));await fs.rm(root,{recursive:true,force:true});});const site=path.join(root,'site'),dist=path.join(site,'dist');await fs.mkdir(dist,{recursive:true});await fs.writeFile(path.join(dist,'index.html'),'PREVIOUS PUBLIC PAGE');return {root,site,dist};}

test('PDF页面备份失败回退保留原页面和失败结果，恢复后不自动重放',async t=>{
  const f=await files(t),prepare=createManualPdfPublicationBackup({root:path.join(f.root,'private/history/pdf-builds'),siteDirectory:f.site}),backup=await prepare();await assert.rejects(prepare(),/中断/);await fs.writeFile(path.join(f.dist,'index.html'),'FAILED CANDIDATE');await fs.writeFile(path.join(f.dist,'new.txt'),'new');await backup.restore();assert.equal(await fs.readFile(path.join(f.dist,'index.html'),'utf8'),'PREVIOUS PUBLIC PAGE');await assert.rejects(fs.access(path.join(f.dist,'new.txt')));assert.equal(await fs.readFile(path.join(backup.directory,'failed-dist/index.html'),'utf8'),'FAILED CANDIDATE');await backup.restore();const next=await prepare();await next.complete();
});

test('公开扫描拒绝已知私密值、处理文件及改名源PDF，另有授权的其他PDF不受一概禁止',async t=>{
  const f=await files(t),source=Buffer.from('%PDF-1.4\nSYNTHETIC PRIVATE PDF65'),values={dist:f.dist,privateValues:['usr_'+('a'.repeat(24))],sourceFiles:[{sha256:sha(source),bytes:source.length}]};
  await assertManualPdfPublicArtifacts(values);await fs.writeFile(path.join(f.dist,'allowed-guide.pdf'),'%PDF-1.4\nDIFFERENT AUTHORISED GUIDE');await assertManualPdfPublicArtifacts(values);
  await fs.writeFile(path.join(f.dist,'renamed-guide.bin'),source);await assert.rejects(assertManualPdfPublicArtifacts(values),/源PDF字节/);await fs.unlink(path.join(f.dist,'renamed-guide.bin'));
  await fs.writeFile(path.join(f.dist,'index.html'),'usr_'+('a'.repeat(24)));await assert.rejects(assertManualPdfPublicArtifacts(values),/私密来源/);await fs.writeFile(path.join(f.dist,'index.html'),'safe');
  for(const field of ['origin_attestation','attestation_key_id','attestation_public_key']){await fs.writeFile(path.join(f.dist,'index.html'),JSON.stringify({[field]:'synthetic-private-proof'}));await assert.rejects(assertManualPdfPublicArtifacts(values),/私密来源/);}await fs.writeFile(path.join(f.dist,'index.html'),'safe');
  await fs.writeFile(path.join(f.dist,'source-'+('b'.repeat(64))+'.pdf'),'%PDF');await assert.rejects(assertManualPdfPublicArtifacts(values),/私密文件/);
});
