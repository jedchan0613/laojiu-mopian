import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash,randomBytes,randomUUID} from 'node:crypto';
import {createRequire} from 'node:module';
import {createManualAccountFixture} from './helpers/manual-account-fixture.mjs';
import {createManualFixture} from './helpers/manuals-fixture.mjs';
import {manualConsentVersion} from '../../shared/manual-workflow.mjs';
import {manualReviewChecks} from '../../shared/manual-review.mjs';
import {privacyChecks} from '../submissions.mjs';
const sharp=createRequire(new URL('../../site/package.json',import.meta.url))('sharp');
const jpeg=await sharp({create:{width:90,height:110,channels:3,background:'#c8c3b8'}}).jpeg().toBuffer();
const digest=bytes=>createHash('sha256').update(bytes).digest('hex'),key=()=>randomBytes(32).toString('hex');
const metadata={schema_version:1,brand_name:'整册交接合成品牌',model_texts:['HANDOFF-83'],product_name:'合成工具',category_key:'tools',document_kind:'user-guide',languages:['en'],completeness:'complete',region_display:'地区未注明',edition_display:'合成第一版',source_note:'自制合成资料',rights_basis:'own-work',sharing_scope:'reading-copy',people:'none',attribution:'anonymous'};
const identity=()=>({operationId:randomUUID(),stepId:randomUUID(),actor:'synthetic-admin@example.invalid',online:true});
async function setup(t,{pages=3,official=false,audited=true}={}){
  const f=await createManualAccountFixture(),catalog=await createManualFixture(t);t.after(()=>f.close());
  const accountId=f.users[0].user.id,store=f.submissions,created=await store.createAccountManualDraft({accountId,payload:{request_key:key(),manual:official?{...metadata,sharing_scope:'official-link',rights_basis:'official-link',official_url:'https://support.example.com/manual/handoff-83'}:metadata}}),id=created.id;
  for(let i=0;i<(official?0:pages);i++)await store.uploadAccountManualPage({id,accountId,payload:{revision:i+1,operation_id:key(),copies_confirmed:true,image:{name:'screened-test.jpg',type:'image/jpeg',buffer:jpeg}}});
  await store.operateAccountManualSubmission({id,accountId,payload:{action:'submit',revision:(official?0:pages)+1,operation_id:key(),consent_version:manualConsentVersion,consents:{copies:true,rights:true,privacy:true,processing:true}}});
  let r=await store.getManualReview(id);await store.reviewManualSubmission(id,{revision:r.revision,submitted_revision:r.manual_submitted_revision,snapshot_digest:r.versions.at(-1).digest,status:'approved',model_basis:'合成封面型号已核对',source_basis:'自制来源已核对',rights_basis:'自制合成资料仅用于隔离验收',checks:manualReviewChecks.map(()=>true),privacy_checks:privacyChecks.map(()=>true),public_message:'合成审核完成',private_note:''},audited?identity():{});r=await store.getManualReview(id);
  const context=identity(),payload={revision:r.revision,submitted_revision:r.manual_submitted_revision,snapshot_digest:r.versions.at(-1).digest,catalog_revision:(await catalog.store.bootstrap()).revision,confirmed:true,title:'整册交接合成手册',public_description:'隔离测试简介',product_name:'合成工具',region_display:'地区未注明',edition_display:'合成第一版',...(official?{official_source_name:'合成官方来源',checked_on:'2026-01-01',source_available:true}:{object_type:'RPR',accession_date:'2000-01-02'})};
  let draft=null,copies=0;
  const copyDirectory=path.join(catalog.dir,'private','copies');await fs.mkdir(copyDirectory,{recursive:true});
  const createArchive=async input=>{
    await input.onReserved(catalog.id);const page_map=[];
    for(const [index,page] of input.images.entries()){
      const bytes=await input.readImage(page.page_id),filename=`detail-${index+1}-public.jpg`,attachment_ref=`/archive/${catalog.id}/${filename}`;await fs.writeFile(path.join(copyDirectory,filename),bytes);copies++;await input.onPageWritten({index,filename,attachment_ref,sha256:digest(bytes),bytes:bytes.length});page_map.push({attachment_ref,printed_label:input.manual_submission.pages[index].printed_label});
    }
    const write_revision=randomUUID();draft={write_revision,source_submission_id:id,record:{core:{item_id:catalog.id,publication_file_path:page_map.map(p=>p.attachment_ref)}},manual_submission:{...input.manual_submission,pages:input.manual_submission.pages.map((p,i)=>({...p,attachment_ref:page_map[i].attachment_ref}))}};
    return {item_id:catalog.id,page_map,write_revision};
  };
  const adapters={planCatalog:catalog.store.planReviewedImport,createArchive,importCatalog:input=>catalog.store.importReviewed(input,context)};
  const inspect={inspectCatalog:()=>catalog.store.bootstrap(),inspectArchive:async()=>({draft:structuredClone(draft),images:await Promise.all((await fs.readdir(copyDirectory)).map(async filename=>{const bytes=await fs.readFile(path.join(copyDirectory,filename));return {filename,sha256:digest(bytes),bytes:bytes.length};}))})};
  return {...f,store,catalog,id,accountId,context,payload,adapters,inspect,copyDirectory,copies:()=>copies,load:()=>store.getManualReview(id),draft:()=>draft};
}
test('v2整册先保存编号与逐页检查点，成功回执可只读核对，不重复创建',async t=>{
  const f=await setup(t,{pages:12});const result=await f.store.transferManualSubmission(f.id,f.payload,f.adapters,f.context),r=await f.load();assert.equal(r.manual_handoff.version,2);assert.equal(r.manual_handoff.copied_pages.length,12);assert.equal(r.manual_handoff.page_map.length,12);assert.equal(result.manualTransferResult.pages,12);assert.equal(result.manualTransferResult.itemId,f.catalog.id);assert.equal(result.manualTransferResult.revision,r.revision);
  const proof=await f.store.inspectManualTransfer(f.id,f.context,f.inspect);assert.equal(proof.status,'succeeded');assert.deepEqual(proof.result.manualTransfer,result.manualTransferResult);assert.equal(f.copies(),12);
  const repeated=await f.store.transferManualSubmission(f.id,f.payload,{...f.adapters,createArchive:()=>{throw new Error('不得重复复制');}},f.context);assert.equal(repeated.repeated,true);assert.equal(f.copies(),12);
  await assert.rejects(f.store.transferManualSubmission(f.id,f.payload,f.adapters,identity()),/不能重新交接/);
  await fs.writeFile(path.join(f.copyDirectory,'detail-12-public.jpg'),jpeg.subarray(0,-2));assert.equal((await f.store.inspectManualTransfer(f.id,f.context,f.inspect)).status,'needs_review');
});
test('v2复制前必须持久记录编号，跳过预留会冻结且不重复执行',async t=>{
  const f=await setup(t);let reads=0;
  await assert.rejects(f.store.transferManualSubmission(f.id,f.payload,{...f.adapters,createArchive:async input=>{reads++;await input.readImage(input.images[0].page_id);}},f.context),/预留编号/);
  const r=await f.load();assert.equal(r.manual_handoff.status,'needs_review');assert.equal(r.manual_handoff.archive_item_id,undefined);assert.equal(f.copies(),0);
  await assert.rejects(f.store.transferManualSubmission(f.id,{...f.payload,revision:r.revision},f.adapters,f.context));assert.equal(reads,1);assert.equal((await f.store.inspectManualTransfer(f.id,f.context,f.inspect)).status,'needs_review');
});
test('v2逐页中断保留已预留编号和检查点，部分复制不能被结果核对释放',async t=>{
  const f=await setup(t);await assert.rejects(f.store.transferManualSubmission(f.id,f.payload,{...f.adapters,createArchive:async input=>{await input.onReserved(f.catalog.id);const bytes=await input.readImage(input.images[0].page_id),filename='detail-1-public.jpg',attachment_ref=`/archive/${f.catalog.id}/${filename}`;await fs.writeFile(path.join(f.copyDirectory,filename),bytes);await input.onPageWritten({index:0,filename,attachment_ref,sha256:digest(bytes),bytes:bytes.length});throw new Error('合成逐页中断');}},f.context));
  const r=await f.load();assert.equal(r.manual_handoff.archive_item_id,f.catalog.id);assert.equal(r.manual_handoff.copied_pages.length,1);assert.equal(r.manual_handoff.status,'needs_review');assert.equal((await f.store.inspectManualTransfer(f.id,f.context,f.inspect)).status,'needs_review');assert.equal((await fs.readdir(f.copyDirectory)).length,1);
});
test('v2目录已写入但交接未完成时保持冻结，不能把部分结果当成成功',async t=>{
  const f=await setup(t);await assert.rejects(f.store.transferManualSubmission(f.id,f.payload,{...f.adapters,importCatalog:async input=>{await f.adapters.importCatalog(input);throw new Error('合成目录写后中断');}},f.context));assert.equal((await f.catalog.store.bootstrap()).state.draft.documents.length,1);assert.equal((await f.load()).manual_handoff.status,'needs_review');assert.equal((await f.store.inspectManualTransfer(f.id,f.context,f.inspect)).status,'needs_review');assert.equal(f.copies(),3);
});
test('v2官网线索只生成目录草稿；来源删除或停止申请不能借同键条目绕过门禁',async t=>{
  const f=await setup(t,{official:true});const result=await f.store.transferManualSubmission(f.id,f.payload,{...f.adapters,createArchive:()=>{throw new Error('不能创建档案');}},f.context);assert.equal(result.manualTransferResult.itemId,null);assert.equal(result.manualTransferResult.pages,0);assert.equal((await f.store.inspectManualTransfer(f.id,f.context,f.inspect)).status,'succeeded');
  const catalog=(await f.catalog.store.bootstrap()).state.draft;const snapshots=[];assert.deepEqual(await f.store.manualCatalogPublicationIssues(catalog,{verifiedRecords:snapshots}),[]);assert.equal(snapshots.length,1);
  const changed=structuredClone(catalog);delete changed.documents[0].source_submission_id;delete changed.documents[0].source_sharing_scope;assert.equal((await f.store.manualCatalogPublicationIssues(changed)).length,1);
  const r=await f.load();await f.store.operateAccountManualSubmission({id:f.id,accountId:f.accountId,payload:{action:'withdraw',revision:r.revision,operation_id:key()}});assert.equal((await f.store.inspectManualTransfer(f.id,f.context,f.inspect)).status,'needs_review');assert.equal((await f.store.manualCatalogPublicationIssues(catalog)).length,1);
});
test('线上v2交接不能沿用缺少管理员身份的旧审核，失败前不创建交接记录',async t=>{
  const f=await setup(t,{audited:false});await assert.rejects(f.store.transferManualSubmission(f.id,f.payload,f.adapters,f.context),/管理员审核凭证/);assert.equal((await f.load()).manual_handoff,undefined);assert.equal(f.copies(),0);
});
test('图片册构建期间可立即受理停止申请，逐次验证和最终切换都拒绝旧审核',async t=>{
  const f=await setup(t);await f.store.transferManualSubmission(f.id,f.payload,f.adapters,f.context);let committed=false;
  await f.store.guardPublication(f.catalog.id,async verify=>{
    const r=await f.load();await f.store.operateAccountManualSubmission({id:f.id,accountId:f.accountId,payload:{action:'withdraw',revision:r.revision,operation_id:key()}});
    assert.equal((await f.load()).withdrawal_requested,true);await assert.rejects(verify(),{statusCode:409});await assert.rejects(async()=>verify.withCommit(async()=>{committed=true;}),{statusCode:409});
  });assert.equal(committed,false);
});
