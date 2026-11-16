// 8.4故障夹具：所有记录/页图只位于调用方新建的系统临时目录。
import fs from 'node:fs/promises';
import path from 'node:path';
import {randomBytes,randomUUID,createHash} from 'node:crypto';
import {createSubmissionStore,privacyChecks} from '../../submissions.mjs';
import {createManualReviewStore} from '../../manual-review.mjs';
import {createManualStore} from '../../manuals.mjs';
import {atomicWrite} from '../../write-coordinator.mjs';
import {manualConsentVersion} from '../../../shared/manual-workflow.mjs';
import {manualReviewChecks} from '../../../shared/manual-review.mjs';
import {syntheticManualMetadata,seedSyntheticManualPages} from './manual-synthetic-pages.mjs';
const key=()=>randomBytes(32).toString('hex');
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
export async function createFaultFixture(directory,{pages=3}={}){
  const siteDirectory=path.join(directory,'site'),submissionRoot=path.join(directory,'private','submissions');
  await fs.mkdir(siteDirectory,{recursive:true});
  const submissions=createSubmissionStore({root:submissionRoot,siteDirectory});
  const accountId='usr_'+ 'a'.repeat(24),draft=await submissions.createAccountManualDraft({accountId,payload:{request_key:key(),manual:syntheticManualMetadata}}),id=draft.id;
  const record=await seedSyntheticManualPages({submissionRoot,id,pages});
  await submissions.operateAccountManualSubmission({id,accountId,payload:{action:'submit',revision:record.revision,operation_id:key(),consent_version:manualConsentVersion,consents:{copies:true,rights:true,privacy:true,processing:true}}});
  let r=await submissions.getManualReview(id);
  await submissions.reviewManualSubmission(id,{revision:r.revision,submitted_revision:r.manual_submitted_revision,snapshot_digest:r.versions.at(-1).digest,status:'approved',model_basis:'合成型号逐项核对',source_basis:'固定色块自制来源',rights_basis:'合成作品仅供隔离验收',checks:manualReviewChecks.map(()=>true),privacy_checks:privacyChecks.map(()=>true),public_message:'合成测试通过',private_note:''},{actor:'本机维护者',operationId:randomUUID(),stepId:randomUUID()});
  const catalog=createManualStore({root:path.join(directory,'private','manuals'),siteDirectory,readArchives:async()=>[],build:async()=>''});
  r=await submissions.getManualReview(id);
  const context={actor:'本机维护者',operationId:randomUUID(),stepId:randomUUID()},payload={revision:r.revision,submitted_revision:r.manual_submitted_revision,snapshot_digest:r.versions.at(-1).digest,catalog_revision:(await catalog.bootstrap()).revision,confirmed:true,title:'8.4故障矩阵合成手册',public_description:'合成验收副本',product_name:syntheticManualMetadata.product_name,region_display:'地区未注明',edition_display:'合成第一版',object_type:'RPR',accession_date:'2000-01-02'};
  const config={directory,siteDirectory,submissionRoot,id,accountId,pages,context,payload};
  await fs.writeFile(path.join(directory,'fixture.json'),JSON.stringify(config),{flag:'wx',mode:0o600});return config;
}
export async function openFaultFixture(config,{checkpoint=async()=>{}}={}){
  const {directory,siteDirectory,submissionRoot,id}=config,file=path.join(submissionRoot,id,'record.json'),itemId='LJM-20000102-RPR-001';
  const read=async()=>JSON.parse(await fs.readFile(file));
  const locked=async(_,fn)=>{const lock=path.join(submissionRoot,'.'+id+'.lock');await fs.mkdir(lock);try{return await fn();}finally{await fs.rmdir(lock);}};
  const writeRecord=async(_,r)=>{await atomicWrite(file,JSON.stringify(r));const h=r.manual_handoff;if(h)await checkpoint(h.status==='complete'?'complete':h.status==='needs_review'?'needs-review':h.page_map?.length?'archive-recorded':h.copied_pages?.length?'page-'+h.copied_pages.length:h.archive_item_id?'reserved':'started',r);};
  const review=createManualReviewStore({root:submissionRoot,siteDirectory,read,all:async()=>[await read()],locked,writeRecord,detail:r=>r,privacyChecks,deliverNotification:async()=>true,pdfReview:null});
  const catalog=createManualStore({root:path.join(directory,'private','manuals'),siteDirectory,readArchives:async()=>[],build:async()=>''}),draftFile=path.join(directory,'private','drafts',itemId+'.json'),inbox=path.join(directory,'private','inbox',itemId);
  const adapters={planCatalog:catalog.planReviewedImport,importCatalog:async input=>{const result=await catalog.importReviewed(input,config.context);await checkpoint('catalog-written',await read());return result;},createArchive:async input=>{
    await input.onReserved(itemId);await fs.mkdir(inbox,{recursive:true});const page_map=[];
    for(const [index,page] of input.images.entries()){
      const bytes=await input.readImage(page.page_id),filename='page-'+(index+1)+'.jpg',attachment_ref='/archive/'+itemId+'/'+filename;
      await fs.writeFile(path.join(inbox,filename),bytes,{flag:'wx',mode:0o600});
      await input.onPageWritten({index,filename,attachment_ref,sha256:sha(bytes),bytes:bytes.length});page_map.push({attachment_ref,printed_label:input.manual_submission.pages[index].printed_label});
    }
    const write_revision=randomUUID(),draft={version:2,write_revision,source_submission_id:id,record:{core:{item_id:itemId,record_status:'SUS',privacy_level:'Y',use_status:'U0',publication_file_path:page_map.map(p=>p.attachment_ref)}},manual_submission:{...input.manual_submission,pages:input.manual_submission.pages.map((p,i)=>({...p,attachment_ref:page_map[i].attachment_ref}))}};
    await fs.mkdir(path.dirname(draftFile),{recursive:true});await atomicWrite(draftFile,JSON.stringify(draft));await checkpoint('draft-written',await read());return {item_id:itemId,page_map,write_revision};
  }};
  const inspect={inspectCatalog:catalog.bootstrap,inspectArchive:async()=>({draft:JSON.parse(await fs.readFile(draftFile)),images:await Promise.all((await fs.readdir(inbox)).map(async filename=>{const bytes=await fs.readFile(path.join(inbox,filename));return {filename,sha256:sha(bytes),bytes:bytes.length};}))})};
  return {review,catalog,adapters,inspect,read,draftFile,inbox,itemId,lock:path.join(submissionRoot,'.'+id+'.lock')};
}
