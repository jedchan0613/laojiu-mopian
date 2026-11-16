// 零第三方依赖的非PDF整册夹具；只在新建临时目录写合成资料。
import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash,randomBytes,randomUUID} from 'node:crypto';
import {createSubmissionStore,privacyChecks} from '../../submissions.mjs';
import {createManualFixture} from './manuals-fixture.mjs';
import {seedSyntheticManualPages,syntheticManualMetadata} from './manual-synthetic-pages.mjs';
import {manualConsentVersion} from '../../../shared/manual-workflow.mjs';
import {manualReviewChecks} from '../../../shared/manual-review.mjs';

export const syntheticKey=()=>randomBytes(32).toString('hex');
export const syntheticIdentity=()=>({online:true,actor:'synthetic-phase84@example.invalid',operationId:randomUUID(),stepId:randomUUID()});
export const syntheticApproval=r=>({revision:r.revision,submitted_revision:r.manual_submitted_revision,snapshot_digest:r.versions.at(-1).digest,status:'approved',model_basis:'合成完整型号已逐项核对',source_basis:'本测试固定色块JPEG来源已核对',rights_basis:'隔离合成作品，不含真实资料',checks:manualReviewChecks.map(()=>true),privacy_checks:privacyChecks.map(()=>true),public_message:'合成审核完成，仍未公开',private_note:'PRIVATE-PHASE84-SYNTHETIC'});
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');

export async function createSyntheticTransferFixture(t,{pages=3}={}){
  const f=await createManualFixture(t),privateRoot=path.dirname(f.root),submissionRoot=path.join(privateRoot,'submissions'),archiveDataDirectory=path.join(privateRoot,'archive-data'),copies=path.join(privateRoot,'synthetic-copies');
  for(const directory of [archiveDataDirectory,copies])await fs.mkdir(directory,{recursive:true,mode:0o700});
  const store=createSubmissionStore({root:submissionRoot,siteDirectory:f.site}),accountId='usr_'+'a'.repeat(24);
  const created=await store.createAccountManualDraft({accountId,payload:{request_key:syntheticKey(),manual:syntheticManualMetadata}}),id=created.id;
  let r=await seedSyntheticManualPages({submissionRoot,id,pages});
  await store.operateAccountManualSubmission({id,accountId,payload:{action:'submit',revision:r.revision,operation_id:syntheticKey(),consent_version:manualConsentVersion,consents:{copies:true,rights:true,privacy:true,processing:true}}});
  r=await store.getManualReview(id);await store.reviewManualSubmission(id,syntheticApproval(r),syntheticIdentity());r=await store.getManualReview(id);
  const context=syntheticIdentity(),payload={revision:r.revision,submitted_revision:r.manual_submitted_revision,snapshot_digest:r.versions.at(-1).digest,catalog_revision:(await f.store.bootstrap()).revision,confirmed:true,title:'8.4合成整册',public_description:'固定合成页面，仅用于隔离验收',product_name:syntheticManualMetadata.product_name,region_display:'地区未注明',edition_display:'合成第一版',object_type:'OTH',accession_date:'2000-01-01'};
  let draft=null;
  const adapters={planCatalog:f.store.planReviewedImport,importCatalog:input=>f.store.importReviewed(input,context),createArchive:async input=>{
    await input.onReserved(f.id);const page_map=[];
    for(const [index,page]of input.images.entries()){
      const bytes=await input.readImage(page.page_id),filename='synthetic-'+(index+1)+'-public.jpg',attachment_ref='/archive/'+f.id+'/'+filename;
      await fs.writeFile(path.join(copies,filename),bytes,{flag:'wx',mode:0o600});
      await input.onPageWritten({index,filename,attachment_ref,sha256:hash(bytes),bytes:bytes.length});page_map.push({attachment_ref,printed_label:input.manual_submission.pages[index].printed_label});
    }
    const write_revision=randomUUID();draft={write_revision,source_submission_id:id,record:structuredClone(f.archive),manual_submission:{...input.manual_submission,pages:input.manual_submission.pages.map((page,index)=>({...page,attachment_ref:page_map[index].attachment_ref}))}};
    draft.record.core.title='8.4合成整册';draft.record.core.publication_file_path=page_map.map(page=>page.attachment_ref);
    await fs.writeFile(path.join(privateRoot,'synthetic-draft.json'),JSON.stringify(draft),{mode:0o600});
    return {item_id:f.id,page_map,write_revision};
  }};
  const images=async()=>Promise.all((await fs.readdir(copies)).map(async filename=>{const bytes=await fs.readFile(path.join(copies,filename));return {filename,bytes:bytes.length,sha256:hash(bytes)};}));
  const inspect={inspectArchive:async()=>({draft:structuredClone(draft),images:await images()}),inspectCatalog:()=>f.store.bootstrap()};
  const handoff=()=>store.transferManualSubmission(id,payload,adapters,context);
  const expose=async()=>{
    if(!draft)throw Error('合成册尚未交接');
    for(const filename of await fs.readdir(copies))await fs.copyFile(path.join(copies,filename),path.join(f.site,'public/archive',f.id,filename));
    f.setArchives([draft.record]);await fs.writeFile(path.join(archiveDataDirectory,f.id+'.json'),JSON.stringify(draft.record),{mode:0o600});
    await f.publish();
    for(const filename of ['index.html','404.html','robots.txt','sitemap.xml'])await fs.writeFile(path.join(f.dist,filename),'SYNTHETIC-PHASE84-'+filename);
    await fs.cp(path.join(f.site,'public/archive'),path.join(f.dist,'archive'),{recursive:true});
    return structuredClone(draft.record);
  };
  const stop=async()=>{const current=await store.getManualReview(id);return store.operateAccountManualSubmission({id,accountId,payload:{action:'withdraw',revision:current.revision,operation_id:syntheticKey()}});};
  const releaseFixture=async()=>{const releases=path.join(f.dir,'synthetic-releases'),previous=path.join(releases,'previous'),live=path.join(releases,'live');await fs.mkdir(previous,{recursive:true});await fs.writeFile(path.join(previous,'index.html'),'PREVIOUS-SYNTHETIC-PUBLIC');await fs.symlink(process.platform==='win32'?previous:'previous',live,process.platform==='win32'?'junction':'dir');return {releases,previous,live};};
  return {...f,privateRoot,submissionRoot,archiveDataDirectory,copies,store,catalogStore:f.store,accountId,submissionId:id,context,payload,adapters,inspect,images,handoff,expose,stop,releaseFixture,load:()=>store.getManualReview(id),raw:async()=>JSON.parse(await fs.readFile(path.join(submissionRoot,id,'record.json'))),draft:()=>structuredClone(draft),releaseOptions:{adminDataRoot:privateRoot,submissionRoot,archiveDataDirectory,siteDirectory:f.site}};
}
