import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {createRequire} from 'node:module';
import {randomBytes} from 'node:crypto';
import {createManualAccountFixture} from './helpers/manual-account-fixture.mjs';
import {createManualFixture} from './helpers/manuals-fixture.mjs';
import {createManualStore,manualPublicationInput} from '../manuals.mjs';
import {manualConsentVersion} from '../../shared/manual-workflow.mjs';
import {manualReviewChecks} from '../../shared/manual-review.mjs';
import {privacyChecks} from '../submissions.mjs';
const sharp=createRequire(new URL('../../site/package.json',import.meta.url))('sharp'),jpeg=await sharp({create:{width:80,height:100,channels:3,background:'#d4c7ac'}}).jpeg().toBuffer(),key=()=>randomBytes(32).toString('hex');
export const reviewMetadata={schema_version:1,brand_name:'专用审核合成品牌',model_texts:['REVIEW-12'],product_name:'合成工具',category_key:'tools',document_kind:'user-guide',languages:['en'],completeness:'complete',region_display:'地区未注明',edition_display:'合成第一版',source_note:'隔离自制测试，不含真实档案',rights_basis:'own-work',sharing_scope:'reading-copy',people:'none',attribution:'anonymous'};
const consent=revision=>({action:'submit',revision,operation_id:key(),consent_version:manualConsentVersion,consents:{copies:true,rights:true,privacy:true,processing:true}});
export const reviewPayload=r=>({revision:r.revision,submitted_revision:r.manual_submitted_revision,snapshot_digest:r.versions.at(-1).digest,status:'approved',model_basis:'合成册封面明确列示型号',source_basis:'自制样页来源核对',rights_basis:'合成图为本测试制作，仅用于隔离验收',checks:manualReviewChecks.map(()=>true),privacy_checks:privacyChecks.map(()=>true),public_message:'合成审核已完成',private_note:'REVIEW-PRIVATE-NOTE'});
const transferPayload=(r,revision)=>({revision:r.revision,submitted_revision:r.manual_submitted_revision,snapshot_digest:r.versions.at(-1).digest,catalog_revision:revision,confirmed:true,title:'合成测试手册',public_description:'自制测试公开简介',product_name:'合成工具',region_display:'地区未注明',edition_display:'合成第一版',object_type:'RPR',accession_date:'2000-01-02'});
async function setup(t,{pages=2,metadata=reviewMetadata}={}){const f=await createManualAccountFixture();t.after(()=>f.close());const accountId=f.users[0].user.id,store=f.submissions,created=await store.createAccountManualDraft({accountId,payload:{request_key:key(),manual:metadata}});for(let i=0;i<pages;i++)await store.uploadAccountManualPage({id:created.id,accountId,payload:{revision:i+1,operation_id:key(),copies_confirmed:true,image:{name:'screened-test.jpg',type:'image/jpeg',buffer:jpeg}}});await store.operateAccountManualSubmission({id:created.id,accountId,payload:consent(pages+1)});return {...f,store,id:created.id,accountId,load:()=>store.getManualReview(created.id)};}

test('专用审核绑定当前保存版、提交版和摘要，完整人工检查不可省略，内部依据不返回账号',async t=>{
  const f=await setup(t,{pages:12}),r=await f.load(),payload=reviewPayload(r);
  for(const wrong of [{revision:r.revision-1},{submitted_revision:1},{snapshot_digest:'0'.repeat(64)},{checks:[]},{privacy_checks:privacyChecks.map(()=>false)},{rights_basis:''},{download_approved:true}])await assert.rejects(f.store.reviewManualSubmission(f.id,{...payload,...wrong}));
  const result=await f.store.reviewManualSubmission(f.id,payload);assert.equal(result.status,'approved');assert.equal(result.manual_review_binding.digest,payload.snapshot_digest);assert.equal(result.images.length,12);
  const account=await f.store.getAccountManualSubmission({id:f.id,accountId:f.accountId});assert.equal(JSON.stringify(account).includes('REVIEW-PRIVATE-NOTE'),false);assert.equal(Object.hasOwn(account,'manual_review_binding'),false);
  await assert.rejects(f.store.reviewManualSubmission(f.id,payload),{statusCode:409});await assert.rejects(f.store.review(f.id,{revision:result.revision,status:'approved',rights_reviewed:true}),{statusCode:409});
});

test('补充新版本后旧审核绑定失效；已审核图片变化也不能转入',async t=>{
  const f=await setup(t),first=await f.load();await f.store.reviewManualSubmission(f.id,{...reviewPayload(first),status:'needs_info',public_message:'合成要求：补充版本说明'});let r=await f.load();await f.store.operateAccountManualSubmission({id:f.id,accountId:f.accountId,payload:{action:'edit',revision:r.revision,operation_id:key()}});r=await f.load();await f.store.saveAccountManualDraft({id:f.id,accountId:f.accountId,revision:r.revision,payload:{manual:{...reviewMetadata,description:'已补充合成说明'}}});r=await f.load();await f.store.operateAccountManualSubmission({id:f.id,accountId:f.accountId,payload:consent(r.revision)});
  await assert.rejects(f.store.reviewManualSubmission(f.id,{...reviewPayload(first),revision:(await f.load()).revision}),{statusCode:409});r=await f.load();await f.store.reviewManualSubmission(f.id,reviewPayload(r));r=await f.load();const file=path.join(f.root,'submissions',f.id,r.images[0].filename),bytes=await fs.readFile(file);bytes[bytes.length-5]^=1;await fs.writeFile(file,bytes);let calls=0;await assert.rejects(f.store.transferManualSubmission(f.id,transferPayload(r,'a'.repeat(64)),{planCatalog:async()=>calls++,createArchive:async()=>calls++,importCatalog:async()=>calls++}));assert.equal(calls,0);
});

test('阅读副本生成档案与目录草稿，保留全册页序；正式公开前目录检查阻断，未生成公开输入',async t=>{
  const f=await setup(t,{pages:12}),catalog=await createManualFixture(t);let r=await f.load();await f.store.reviewManualSubmission(f.id,reviewPayload(r));r=await f.load();let archiveInput;
  const callbacks={planCatalog:catalog.store.planReviewedImport,createArchive:async input=>{archiveInput=input;for(const page of input.images)assert((await input.readImage(page.page_id)).length);return {item_id:catalog.id,page_map:input.images.map((_,index)=>({attachment_ref:`/archive/${catalog.id}/detail-${index+1}-public.jpg`,printed_label:String(index+1)}))};},importCatalog:input=>catalog.store.importReviewed(input)};
  const body=transferPayload(r,(await catalog.store.bootstrap()).revision),result=await f.store.transferManualSubmission(f.id,body,callbacks);assert.equal(result.item_id,catalog.id);assert.equal(archiveInput.images.length,12);assert.equal(archiveInput.manual_submission.pages.length,12);
  const state=await catalog.store.bootstrap(),doc=state.state.draft.documents[0];assert.equal(doc.page_map.length,12);assert.equal(doc.page_map[11].printed_label,'12');assert.equal(doc.source_submission_id,f.id);assert.equal(state.state.published.documents.length,0);await assert.rejects(fs.access(catalog.source));
  const repeated=await f.store.transferManualSubmission(f.id,body,{...callbacks,createArchive:async()=>{throw new Error('不得重复创建');}});assert.equal(repeated.repeated,true);
  r=await f.load();await assert.rejects(f.store.operateAccountManualSubmission({id:f.id,accountId:f.accountId,payload:{action:'edit',revision:r.revision,operation_id:key()}}),{statusCode:409});
});

test('仅官方线索不复制图片、不分配永久编号；发布投影不含投稿和审核依据',async t=>{
  const f=await setup(t,{pages:0,metadata:{...reviewMetadata,sharing_scope:'official-link',rights_basis:'official-link',official_url:'https://support.example.com/synthetic/manual'}}),catalog=await createManualFixture(t);let r=await f.load();await f.store.reviewManualSubmission(f.id,reviewPayload(r));r=await f.load();const {object_type,accession_date,...base}=transferPayload(r,(await catalog.store.bootstrap()).revision);
  const result=await f.store.transferManualSubmission(f.id,{...base,official_source_name:'合成厂家来源',checked_on:'2026-01-01',source_available:true},{planCatalog:catalog.store.planReviewedImport,createArchive:async()=>{throw new Error('官方线索不得创建档案');},importCatalog:input=>catalog.store.importReviewed(input)});assert.equal(result.item_id,null);
  const state=await catalog.store.bootstrap(),doc=state.state.draft.documents[0];assert.equal(doc.linked_archive_id,'');assert.equal(doc.page_map.length,0);assert.equal(doc.official_sources.length,1);assert.equal((await f.store.manualCatalogPublicationIssues(state.state.draft)).length,0);
  const publicInput=JSON.stringify(manualPublicationInput(state.state.draft));assert.equal(publicInput.includes(f.id),false);assert.equal(publicInput.includes('source_submission_'),false);assert.equal(publicInput.includes('合成册封面明确列示型号'),false);
  assert.equal(publicInput.toLowerCase().includes(f.id.slice(3).toLowerCase()),false,'公开目录标识不得携带可还原的私密投稿编号尾段');
  const expanded=structuredClone(state.state.draft);expanded.documents[0].linked_archive_id=catalog.id;expanded.documents[0].page_map=[{attachment_ref:catalog.src,printed_label:'封面'}];assert.equal((await f.store.manualCatalogPublicationIssues(expanded)).length,1,'仅官方线索不能借由维护页扩大为阅读副本');
  const modified=structuredClone(state.state.draft);delete modified.documents[0].source_submission_id;await catalog.store.save({expectedRevision:state.revision,catalog:modified});assert.equal((await catalog.store.bootstrap()).state.draft.documents[0].source_submission_id,f.id);
});

test('目录构建期间收到停止申请，发布回退并保留未公开草稿',async t=>{
  const f=await setup(t,{pages:0,metadata:{...reviewMetadata,sharing_scope:'official-link',rights_basis:'official-link',official_url:'https://support.example.com/synthetic/manual'}}),catalog=await createManualFixture(t);
  const guarded=createManualStore({root:catalog.root,siteDirectory:catalog.site,readArchives:async()=>[],guardCatalog:c=>f.store.manualCatalogPublicationIssues(c),build:async()=>{const r=await f.load();await f.store.operateAccountManualSubmission({id:f.id,accountId:f.accountId,payload:{action:'withdraw',revision:r.revision,operation_id:key()}});return 'synthetic build';}});
  let r=await f.load();await f.store.reviewManualSubmission(f.id,reviewPayload(r));r=await f.load();const {object_type,accession_date,...body}=transferPayload(r,(await guarded.bootstrap()).revision);
  await f.store.transferManualSubmission(f.id,{...body,official_source_name:'合成官方来源',checked_on:'2026-01-01',source_available:true},{planCatalog:guarded.planReviewedImport,createArchive:async()=>{throw new Error('不应复制图片');},importCatalog:guarded.importReviewed});
  const state=await guarded.bootstrap(),checked=await guarded.prepare({expectedRevision:state.revision});assert.equal(checked.issues.length,0);
  await assert.rejects(guarded.publish({expectedRevision:state.revision,review_id:checked.review_id,confirmations:Array(5).fill(true)}),{code:'MANUALS_BUILD_FAILED'});assert.equal((await guarded.bootstrap()).state.published.documents.length,0);assert((await guarded.bootstrap()).state.draft);await assert.rejects(fs.access(catalog.source));
});

test('交接前目录版本冲突不创建档案；交接中失败保留未公开结果并阻止重复执行',async t=>{
  const f=await setup(t),catalog=await createManualFixture(t);let r=await f.load();await f.store.reviewManualSubmission(f.id,reviewPayload(r));r=await f.load();let calls=0;
  await assert.rejects(f.store.transferManualSubmission(f.id,transferPayload(r,'0'.repeat(64)),{planCatalog:catalog.store.planReviewedImport,createArchive:async()=>{calls++;},importCatalog:catalog.store.importReviewed}),{statusCode:409});assert.equal(calls,0);assert.equal((await f.load()).manual_handoff,undefined);
  const body=transferPayload(r,(await catalog.store.bootstrap()).revision);await assert.rejects(f.store.transferManualSubmission(f.id,body,{planCatalog:catalog.store.planReviewedImport,createArchive:async()=>{calls++;throw new Error('SYNTHETIC-PRIVATE-HANDOFF-FAIL');},importCatalog:catalog.store.importReviewed}));assert.equal((await f.load()).manual_handoff.status,'needs_review');
  await assert.rejects(f.store.transferManualSubmission(f.id,{...body,revision:(await f.load()).revision},{planCatalog:async()=>{},createArchive:async()=>{calls++;},importCatalog:catalog.store.importReviewed}),{statusCode:409});assert.equal(calls,1);await assert.rejects(fs.access(catalog.source));
});

test('进入整理后可申请停止，账号不获得内部交接数据；档案和目录发布门禁生效',async t=>{
  const f=await setup(t),catalog=await createManualFixture(t);let r=await f.load();await f.store.reviewManualSubmission(f.id,reviewPayload(r));r=await f.load();await f.store.transferManualSubmission(f.id,transferPayload(r,(await catalog.store.bootstrap()).revision),{planCatalog:catalog.store.planReviewedImport,createArchive:async()=>({item_id:catalog.id,page_map:r.images.map((_,i)=>({attachment_ref:`/archive/${catalog.id}/detail-${i+1}-public.jpg`,printed_label:''}))}),importCatalog:catalog.store.importReviewed});
  let account=await f.store.getAccountManualSubmission({id:f.id,accountId:f.accountId});assert.equal(account.manual_in_preparation,true);assert.equal(Object.hasOwn(account,'manual_handoff'),false);await f.store.operateAccountManualSubmission({id:f.id,accountId:f.accountId,payload:{action:'withdraw',revision:account.revision,operation_id:key()}});account=await f.store.getAccountManualSubmission({id:f.id,accountId:f.accountId});assert.equal(account.withdrawal_requested,true);assert.equal(account.status,'approved');
  await assert.rejects(f.store.guardPublication(catalog.id,async()=>{throw new Error('不得调用');}),{statusCode:409});assert.equal((await f.store.manualCatalogPublicationIssues((await catalog.store.bootstrap()).state.draft)).length,1);
});
