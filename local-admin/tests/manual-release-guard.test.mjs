import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {randomBytes,randomUUID} from 'node:crypto';
import {prepareManualReleaseGuard} from '../manual-release-guard.mjs';
import {createSubmissionStore,privacyChecks} from '../submissions.mjs';
import {createManualFixture,manualFixtureCatalog} from './helpers/manuals-fixture.mjs';
import {createPdfPublicationFixture} from './helpers/manual-pdf-publication-fixture.mjs';
import {manualConsentVersion} from '../../shared/manual-workflow.mjs';
import {manualReviewChecks} from '../../shared/manual-review.mjs';

const empty=()=>({schema_version:1,brands:[],models:[],documents:[]}),key=()=>randomBytes(32).toString('hex');
async function fixture(t){
  const f=await createManualFixture(t),adminDataRoot=path.dirname(f.root),submissionRoot=path.join(adminDataRoot,'submissions'),archiveDataDirectory=path.join(adminDataRoot,'archive-data');
  await fs.mkdir(submissionRoot,{recursive:true});await fs.mkdir(archiveDataDirectory,{recursive:true});await fs.writeFile(path.join(archiveDataDirectory,f.id+'.json'),JSON.stringify(f.archive));
  return {...f,options:{adminDataRoot,submissionRoot,archiveDataDirectory,siteDirectory:f.site},submissionRoot};
}
async function publish(f){const current=await f.store.bootstrap(),review=await f.store.prepare({expectedRevision:current.revision});return f.store.publish({expectedRevision:current.revision,review_id:review.review_id,confirmations:Array(5).fill(true)});}

test('未配置私密目录的空说明书旧站可发布，明确配置但目录缺失必须停止',async t=>{
  const f=await fixture(t),guard=await prepareManualReleaseGuard({siteDirectory:f.site});let committed=false;await guard.withCommit(()=>{committed=true;});assert(committed);
  await assert.rejects(prepareManualReleaseGuard({...f.options,adminDataRoot:path.join(f.dir,'missing-private')}));
  await f.save(manualFixtureCatalog());await publish(f);
  await assert.rejects(prepareManualReleaseGuard({siteDirectory:f.site}),/私密来源目录/);
});

test('Git发布对照私密正式目录与候选投影，准备后改用旧目录也不能切站',async t=>{
  const f=await fixture(t);await f.save(manualFixtureCatalog());await publish(f);
  const guard=await prepareManualReleaseGuard(f.options);assert.equal(guard.records.length,0);
  await fs.writeFile(f.source,JSON.stringify(empty()));
  let committed=false;await assert.rejects(guard.withCommit(()=>{committed=true;}),/不一致|已变化/);assert.equal(committed,false);
  await assert.rejects(prepareManualReleaseGuard(f.options),/不一致/);
});

test('正式档案和私密维护文件不能经由链接读取',async t=>{
  const f=await fixture(t),file=path.join(f.options.archiveDataDirectory,f.id+'.json'),saved=path.join(f.dir,'saved.json');
  await fs.rename(file,saved);await fs.link(saved,file);
  await assert.rejects(prepareManualReleaseGuard(f.options),/链接|特殊文件/);
  await fs.unlink(file);await fs.rename(saved,file);
  const moved=path.join(f.dir,'linked-archives');await fs.rename(f.options.archiveDataDirectory,moved);await fs.symlink(moved,f.options.archiveDataDirectory,process.platform==='win32'?'junction':'dir');
  await assert.rejects(prepareManualReleaseGuard(f.options),/目录|链接/);
});

test('Git切站前复查官方线索的真实来源，已受理停止申请阻止提交',async t=>{
  const f=await fixture(t),store=createSubmissionStore({root:f.submissionRoot,siteDirectory:f.site}),accountId='usr_'+'a'.repeat(24);
  const metadata={schema_version:1,brand_name:'Git隔离合成来源',model_texts:['RELEASE-83'],product_name:'合成物件',category_key:'tools',document_kind:'user-guide',languages:['zh-CN'],completeness:'complete',region_display:'地区未注明',edition_display:'合成版',source_note:'合成测试',rights_basis:'official-link',sharing_scope:'official-link',official_url:'https://support.example.com/manual',people:'none',attribution:'anonymous'};
  const created=await store.createAccountManualDraft({accountId,payload:{request_key:key(),manual:metadata}}),id=created.id;
  await store.operateAccountManualSubmission({id,accountId,payload:{action:'submit',revision:1,operation_id:key(),consent_version:manualConsentVersion,consents:{copies:true,rights:true,privacy:true,processing:true}}});
  let r=await store.getManualReview(id);const identity=()=>({online:true,operationId:randomUUID(),stepId:randomUUID(),actor:'synthetic-admin@example.invalid'});
  await store.reviewManualSubmission(id,{revision:r.revision,submitted_revision:r.manual_submitted_revision,snapshot_digest:r.versions.at(-1).digest,status:'approved',model_basis:'合成型号已核对',source_basis:'合成来源已核对',rights_basis:'合成官方线索已核对',checks:manualReviewChecks.map(()=>true),privacy_checks:privacyChecks.map(()=>true),public_message:'合成审核',private_note:''},identity());
  r=await store.getManualReview(id);
  await store.transferManualSubmission(id,{revision:r.revision,submitted_revision:r.manual_submitted_revision,snapshot_digest:r.versions.at(-1).digest,catalog_revision:(await f.store.bootstrap()).revision,confirmed:true,title:'Git合成官方手册',public_description:'合成公开简介',product_name:metadata.product_name,region_display:metadata.region_display,edition_display:metadata.edition_display,official_source_name:'合成官方来源',checked_on:'2026-01-01',source_available:true},{planCatalog:f.store.planReviewedImport,importCatalog:f.store.importReviewed},identity());
  await publish(f);const guard=await prepareManualReleaseGuard(f.options);assert.equal(guard.records.length,1);
  r=await store.getManualReview(id);await store.operateAccountManualSubmission({id,accountId,payload:{action:'withdraw',revision:r.revision,operation_id:key()}});
  let committed=false;await assert.rejects(guard.withCommit(()=>{committed=true;}),/停止处理|投稿已变化/);assert.equal(committed,false);
  await assert.rejects(prepareManualReleaseGuard(f.options),/停止处理|提供范围/);
});

test('全站发布按真实公开候选副本核对SHA，同路径换图及文件链接都不能沿用审核',async t=>{
  const f=await createPdfPublicationFixture(t,{pages:1});await f.handoff();
  await f.store.prepareManualPublication([f.draft.record]);
  const file=path.join(f.catalog.site,'public',f.draft.record.core.publication_file_path[0]),bytes=await fs.readFile(file),changed=Buffer.from(bytes);changed[changed.length-5]^=1;
  await fs.writeFile(file,changed);await assert.rejects(f.store.prepareManualPublication([f.draft.record]),/图片.*不同|审核版本不同/);
  await fs.writeFile(file,bytes);const saved=file+'.saved';await fs.rename(file,saved);await fs.link(saved,file);
  await assert.rejects(f.store.prepareManualPublication([f.draft.record]),/链接|文件类型/);
});
