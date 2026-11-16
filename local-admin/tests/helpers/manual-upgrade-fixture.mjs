// 全部账号、来源、审核和图片均为运行时合成；恢复范围只包含本次相关私密文件。
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {createHash,randomBytes,randomUUID} from 'node:crypto';
import {createManualAccountFixture} from './manual-account-fixture.mjs';
import {seedSyntheticManualPages} from './manual-synthetic-pages.mjs';
import {createManualStore} from '../../manuals.mjs';
import {createManualStore as createLegacyCatalog} from './legacy-manuals-1e84c27.mjs';
import {createManualReviewStore as createLegacyReview} from './legacy-manual-review-1e84c27.mjs';
import {createWriteCoordinator,atomicWrite} from '../../write-coordinator.mjs';
import {createWriteCoordinator as createLegacyWrites} from './legacy-write-coordinator-1e84c27.mjs';
import {manualConsentVersion} from '../../../shared/manual-workflow.mjs';
import {manualReviewChecks} from '../../../shared/manual-review.mjs';
import {privacyChecks} from '../../submissions.mjs';
export const emptyCatalog=()=>({schema_version:1,brands:[],models:[],documents:[]});
export const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const key=()=>randomBytes(32).toString('hex');
export const syntheticIdentity=()=>({operationId:randomUUID(),stepId:randomUUID(),actor:'upgrade-review@example.invalid',online:true});
export async function temporaryRecoveryDirectory(t){
  const root=await fs.mkdtemp(path.join(os.tmpdir(),'ljm-manual-recovery84-'));
  t.after(async()=>{assert.equal(path.dirname(path.resolve(root)),path.resolve(os.tmpdir()));assert(path.basename(root).startsWith('ljm-manual-recovery84-'));await fs.rm(root,{recursive:true,force:true,maxRetries:10,retryDelay:100});});
  return root;
}
export async function fileManifest(directory){
  const files=[];
  const walk=async relative=>{
    const current=path.join(directory,relative),stat=await fs.lstat(current).catch(error=>{if(error.code==='ENOENT')return null;throw error;});if(!stat)return;
    assert.equal(stat.isSymbolicLink(),false);
    if(stat.isDirectory())for(const child of (await fs.readdir(current)).sort())await walk(path.join(relative,child));
    else {assert.equal(stat.isFile(),true);assert.equal(stat.nlink,1);const bytes=await fs.readFile(current);files.push({path:relative.split(path.sep).join('/'),bytes:bytes.length,sha256:sha(bytes),mode:stat.mode&0o777,uid:stat.uid,gid:stat.gid});}
  };await walk('');return files;
}
export async function createSyntheticRecoveryFixture(t,{legacy=false,interrupted=false,transfer=true,pages=3,official=false}={}){
  const f=await createManualAccountFixture();t.after(()=>f.close());
  const root=await temporaryRecoveryDirectory(t),site=path.join(root,'site'),privateRoot=path.join(root,'private');
  const roots={submissions:path.join(f.root,'submissions'),manuals:path.join(privateRoot,'manuals'),drafts:path.join(privateRoot,'drafts'),inbox:path.join(privateRoot,'inbox'),operations:path.join(privateRoot,'operations'),config:path.join(privateRoot,'config')};
  for(const value of Object.values(roots))await fs.mkdir(value,{recursive:true,mode:0o700});await fs.mkdir(site,{recursive:true});
  await fs.writeFile(path.join(roots.config,'manuals.conf'),'LJM_MANUAL_REVIEW_ONLINE_ENABLED=false\nLJM_MANUAL_TRANSFER_ONLINE_ENABLED=false\nLJM_MANUAL_PDF_UPLOADS_OPEN=false\n',{mode:0o600});
  const metadata={schema_version:1,brand_name:'升级恢复合成品牌',model_texts:['UPGRADE-84'],product_name:'合成工具',category_key:'tools',document_kind:'user-guide',languages:['en'],completeness:'complete',region_display:'地区未注明',edition_display:'合成第一版',source_note:'自制合成资料，无真实来源',rights_basis:official?'official-link':'own-work',sharing_scope:official?'official-link':'reading-copy',...(official?{official_url:'https://support.example.com/manual/upgrade-84'}:{}),people:'none',attribution:'anonymous'};
  const accountId=f.users[0].user.id,store=f.submissions,created=await store.createAccountManualDraft({accountId,payload:{request_key:key(),manual:metadata}}),id=created.id;
  // 固定合成页仅替代上传解码；实际提交、旧/新审核、交接与恢复仍走正式实现。
  if(!official)await seedSyntheticManualPages({submissionRoot:roots.submissions,id,pages});
  await store.operateAccountManualSubmission({id,accountId,payload:{action:'submit',revision:(official?0:pages)+1,operation_id:key(),consent_version:manualConsentVersion,consents:{copies:true,rights:true,privacy:true,processing:true}}});
  const recordFile=path.join(roots.submissions,id,'record.json'),readRecord=async()=>JSON.parse(await fs.readFile(recordFile,'utf8'));
  const reviewStore=legacy?createLegacyReview({root:roots.submissions,siteDirectory:site,read:readRecord,all:async()=>[await readRecord()],locked:async(_id,operation)=>operation(),writeRecord:async(_id,r)=>atomicWrite(recordFile,JSON.stringify(r,null,2)+'\n'),detail:r=>r,privacyChecks,deliverNotification:async()=>true}):{review:store.reviewManualSubmission,transfer:store.transferManualSubmission};
  let r=await readRecord();await reviewStore.review(id,{revision:r.revision,submitted_revision:r.manual_submitted_revision,snapshot_digest:r.versions.at(-1).digest,status:'approved',model_basis:'合成封面完整型号已核对',source_basis:'自制合成来源已核对',rights_basis:'自制图片仅供隔离恢复验收',checks:manualReviewChecks.map(()=>true),privacy_checks:privacyChecks.map(()=>true),public_message:'合成审核通过',private_note:'UPGRADE-84-PRIVATE-NOTE'},legacy?{}:syntheticIdentity());r=await readRecord();
  const makeCatalog=legacy?createLegacyCatalog:createManualStore;
  const catalog=makeCatalog({root:roots.manuals,siteDirectory:site,readArchives:async()=>[],build:async()=>{const dist=path.join(site,'dist');await fs.mkdir(dist,{recursive:true});await fs.writeFile(path.join(dist,'index.html'),'SYNTHETIC-RECOVERY-SITE');return 'SYNTHETIC';}});
  await catalog.save({expectedRevision:(await catalog.bootstrap()).revision,catalog:emptyCatalog()});
  const identity=syntheticIdentity(),itemId='LJM-20000102-RPR-001',payload={revision:r.revision,submitted_revision:r.manual_submitted_revision,snapshot_digest:r.versions.at(-1).digest,catalog_revision:(await catalog.bootstrap()).revision,confirmed:true,title:'升级恢复合成说明书',public_description:'隔离合成公开简介',product_name:'合成工具',region_display:'地区未注明',edition_display:'合成第一版',...(official?{official_source_name:'合成官网入口',checked_on:'2026-01-01',source_available:true}:{object_type:'RPR',accession_date:'2000-01-02'})};
  const writes=await (legacy?createLegacyWrites:createWriteCoordinator)({directory:roots.operations});
  const params={operationId:identity.operationId,stepId:identity.stepId,kind:'manual-transfer',target:id,payload:{body:payload,actor:identity.actor}};
  const createArchive=async input=>{
    await input.onReserved?.(itemId);const copies=path.join(roots.inbox,itemId);await fs.mkdir(copies,{recursive:true,mode:0o700});const page_map=[];
    for(const [index,page]of input.images.entries()){
      const bytes=await input.readImage(page.page_id),filename=`detail-${index+1}-public.jpg`,attachment_ref=`/archive/${itemId}/${filename}`;await fs.writeFile(path.join(copies,filename),bytes,{flag:'wx',mode:0o600});await input.onPageWritten?.({index,filename,attachment_ref,sha256:sha(bytes),bytes:bytes.length});page_map.push({attachment_ref,printed_label:input.manual_submission.pages[index].printed_label});
      if(interrupted&&index===0)throw new Error('SYNTHETIC-RECOVERY-PARTIAL');
    }
    const draft={version:2,write_revision:randomUUID(),source_submission_id:id,manual_submission:{...input.manual_submission,pages:input.manual_submission.pages.map((page,index)=>({...page,attachment_ref:page_map[index].attachment_ref}))},record:{core:{item_id:itemId,title:input.title,accession_date:input.accession_date,object_type:'RPR',date_display:'年代未知',record_status:'SUS',privacy_level:'Y',use_status:'U0',rights_status:'UNK',publication_file_path:page_map.map(p=>p.attachment_ref)},metadata:{schema:'common',dimensions:{}},public_view:{description:input.description,transcription:'',tags:[]}}};
    await atomicWrite(path.join(roots.drafts,itemId+'.json'),JSON.stringify(draft,null,2)+'\n');return {item_id:itemId,page_map,write_revision:draft.write_revision};
  };
  let result=null;
  if(transfer){const task=writes.perform(params,context=>reviewStore.transfer(id,payload,{planCatalog:catalog.planReviewedImport,createArchive,importCatalog:input=>catalog.importReviewed(input,{...context,actor:identity.actor})},{...context,actor:identity.actor,online:!legacy}),value=>legacy?{}:{manualTransfer:value.manualTransferResult});if(interrupted)await assert.rejects(task,/SYNTHETIC-RECOVERY-PARTIAL/);else result=await task;}
  return {root,privateRoot,site,roots,id,itemId,accountId,store,catalog,writes,identity,payload,params,result,readRecord};
}
const allowedRoot=/^(?:config|submissions|drafts|inbox|manuals|operations)$/;
export async function createSyntheticBackup(f,target){
  await fs.mkdir(target,{recursive:true,mode:0o700});const manifest=[];
  for(const [kind,source]of Object.entries(f.roots)){
    assert(allowedRoot.test(kind));
    const selected=kind==='submissions'?path.join(source,f.id):source,base=kind==='submissions'?kind+'/'+f.id:kind;
    for(const file of await fileManifest(selected)){
      const relative=base+'/'+file.path;assert(!path.isAbsolute(relative)&&!relative.split('/').includes('..'));
      const destination=path.join(target,relative);await fs.mkdir(path.dirname(destination),{recursive:true,mode:0o700});await fs.copyFile(path.join(selected,file.path),destination,fs.constants.COPYFILE_EXCL);await fs.chmod(destination,file.mode);manifest.push({...file,path:relative});
    }
  }
  await fs.writeFile(path.join(target,'manifest.json'),JSON.stringify({version:1,program:'manuals-8.4-synthetic',files:manifest},null,2)+'\n',{flag:'wx',mode:0o600});return manifest;
}
export async function restoreSyntheticBackup(backup,restored){
  const manifest=JSON.parse(await fs.readFile(path.join(backup,'manifest.json'),'utf8'));await fs.mkdir(restored,{recursive:true,mode:0o700});
  for(const file of manifest.files){
    assert(file.path.split('/').length>1&&allowedRoot.test(file.path.split('/')[0]));assert(!path.isAbsolute(file.path)&&!file.path.split('/').includes('..'));
    const bytes=await fs.readFile(path.join(backup,file.path));assert.equal(bytes.length,file.bytes);assert.equal(sha(bytes),file.sha256);const target=path.join(restored,file.path);await fs.mkdir(path.dirname(target),{recursive:true,mode:0o700});await fs.writeFile(target,bytes,{flag:'wx',mode:file.mode});await fs.chmod(target,file.mode);
  }
  return manifest.files;
}
