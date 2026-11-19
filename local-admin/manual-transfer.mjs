// 整册交接只生成私密草稿；回执丢失后只核对证据，不重新复制。
import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {manualReviewBindingProblems,manualReviewRulesVersion,assertManualReviewImages} from './manual-review-access.mjs';
import {normalizeManualTransfer} from '../shared/manual-review.mjs';
import {medicineKeysForTransfer,submissionManualKey} from './manual-review-catalog.mjs';
const hash=value=>createHash('sha256').update(Buffer.isBuffer(value)?value:JSON.stringify(value)).digest('hex');
const uuid=value=>typeof value==='string'&&/^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(value);
const fail=message=>{throw Object.assign(new Error(message),{name:'SubmissionError',statusCode:409});};
const checkCancelled=(context,started=true)=>{if(context.signal?.aborted)fail(started?'整理已请求停止，已有编号和副本保留待核对，不能继续下一步。':'整理操作已取消，尚未创建草稿。');};
const itemId=value=>/^LJM-\d{8}-(RPR|OTH)-\d{3}$/.test(value??'');
const manualKey=value=>/^manual-[a-f0-9]{24}$/.test(value??'');
const sourcePages=v=>v.images.map(p=>({page_id:p.page_id,sha256:p.sha256,bytes:p.bytes,printed_label:p.label,note:p.note??''}));
const receipt=(r,v)=>({submissionId:r.id,revision:r.revision,submittedRevision:v.revision,snapshotDigest:v.digest,manualKey:r.manual_catalog_key,itemId:r.linked_item_id??null,pages:v.images.length,sharingScope:v.manual_metadata.sharing_scope});
const result=(r,v,repeated=false)=>({item_id:r.linked_item_id??null,manual_key:r.manual_catalog_key,...(repeated?{repeated:true}:{}),manualTransferResult:receipt(r,v)});
export const verifiedTransferContext=context=>uuid(context.operationId)&&uuid(context.stepId);
export function createVerifiedManualTransfer({root,manual,lockedManual,submitted,approved,verifiedImages,imageBytes,writeRecord,privacyCount}){
  const verifyHandoff=(r,v)=>{
    const h=r.manual_handoff;
    if(!h||h.version!==2||h.status!=='complete'||h.rules_version!==manualReviewRulesVersion||!uuid(h.operation_id)||!uuid(h.step_id)||h.digest!==v.digest||h.submitted_revision!==v.revision||h.sharing_scope!==v.manual_metadata.sharing_scope||hash(h.source_pages)!==hash(sourcePages(v))||!manualKey(r.manual_catalog_key)||h.manual_key!==r.manual_catalog_key)fail('整册交接凭证不完整，不能沿用旧结果。');
    if(h.online&&manualReviewBindingProblems(r,privacyCount,{requireAudit:true}).length)fail('管理员审核凭证已失效，请重新核对。');
    if(v.manual_metadata.schema_version===2 && v.manual_metadata.category_key==='medicines') {
      medicineKeysForTransfer(r.id,{mode:'existing',medicine_keys:h.medicine_keys});
    }
    if(h.sharing_scope==='official-link'){if(r.linked_item_id||h.archive_item_id||h.page_map?.length)fail('官方线索不能包含档案或阅读页。');}
    else if(!itemId(r.linked_item_id)||h.archive_item_id!==r.linked_item_id||!Array.isArray(h.page_map)||h.page_map.length!==v.images.length||h.page_map.some((p,i)=>p.printed_label!==v.images[i].label||!new RegExp('^/archive/'+r.linked_item_id+'/[a-zA-Z0-9_-]+\\.jpg$').test(p.attachment_ref))||new Set(h.page_map.map(p=>p.attachment_ref)).size!==v.images.length)fail('整册交接的档案编号、页序或页码不符。');
    return h;
  };
  const transfer=async(id,payload,adapters,context)=>lockedManual(id,async()=>{
    const r=await manual(id);if(context.online)assertManualReviewImages(r);
    const v=submitted(r,payload),p=normalizeManualTransfer(payload,v.manual_metadata),binding=approved(r,v);
    if(context.online&&manualReviewBindingProblems(r,privacyCount,{requireAudit:true}).length)fail('线上交接需要当前规则下的17项检查及管理员审核凭证。');
    if(!verifiedTransferContext(context)||typeof context.actor!=='string'||!context.actor.trim()||context.online&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(context.actor))fail('缺少本次整理操作的身份或回执编号。');
    const {revision,catalog_revision,...content}=p,fingerprint=hash(content),old=r.manual_handoff;
    if(old?.status==='complete'){
      verifyHandoff(r,v);
      if(old.fingerprint!==fingerprint||old.operation_id!==context.operationId||old.step_id!==context.stepId||old.actor!==context.actor)fail('本册已有整理结果，请在已生成的草稿中继续维护，不能重新交接。');
      return result(r,v,true);
    }
    if(old||r.linked_item_id)fail('已有未完成的整册交接，需要核对原回执，不能重复执行。');
    if(r.revision!==p.revision)fail('投稿已变化，请重新读取后再转入。');
    const bytes=v.images.reduce((n,page)=>n+page.bytes,0);
    if(v.images.length>200||!Number.isSafeInteger(bytes)||bytes>100*1024*1024||v.manual_metadata.sharing_scope==='reading-copy'&&!v.images.length)fail('整册页数或大小超出当前交接范围。');
    await verifiedImages(r,v);await adapters.planCatalog({record:r,version:v,review:binding,transfer:p});
    const space=await fs.statfs(root,{bigint:true});if(space.bavail*space.bsize<BigInt(bytes+16*1024*1024))fail('磁盘空间不足，尚未创建整理草稿。');
    checkCancelled(context,false);
    const h={version:2,status:'in-progress',rules_version:manualReviewRulesVersion,online:context.online===true,actor:context.actor,operation_id:context.operationId,step_id:context.stepId,submitted_revision:v.revision,digest:v.digest,sharing_scope:v.manual_metadata.sharing_scope,manual_key:submissionManualKey(id),expected_catalog_revision:p.catalog_revision,fingerprint,source_pages:sourcePages(v),page_map:[],copied_pages:[],at:new Date().toISOString()};
    if(v.manual_metadata.schema_version===2 && v.manual_metadata.category_key==='medicines'){
      h.medicine_keys=medicineKeysForTransfer(id,p.medicine_match);
    }
    r.manual_handoff=h;r.revision++;r.updated_at=h.at;context.markChanged?.();await writeRecord(id,r);
    try{
      let archive=null;
      if(h.sharing_scope==='reading-copy')archive=await adapters.createArchive({id,title:p.title,description:p.public_description,object_type:p.object_type,accession_date:p.accession_date,images:v.images.map((page,index)=>({kind:'manual-reviewed',page_id:page.page_id,originalName:'screened-page-'+(index+1)+'.jpg'})),manual_submission:{submitted_revision:v.revision,digest:v.digest,operation_id:h.operation_id,step_id:h.step_id,pages:sourcePages(v)},onReserved:async reserved=>{if(!itemId(reserved)||h.archive_item_id)fail('档案预留编号无法核对。');h.archive_item_id=reserved;await writeRecord(id,r);checkCancelled(context);},onPageWritten:async page=>{const index=h.copied_pages.length,source=v.images[index];if(!h.archive_item_id||!source||page.index!==index||page.sha256!==source.sha256||page.bytes!==source.bytes||page.filename!==path.basename(page.attachment_ref??'')||!new RegExp('^/archive/'+h.archive_item_id+'/[a-zA-Z0-9_-]+\\.jpg$').test(page.attachment_ref??'')||h.copied_pages.some(p=>p.attachment_ref===page.attachment_ref))fail('复制检查点无法对应本次整册。');h.copied_pages.push({...page,page_id:source.page_id,printed_label:source.label});await writeRecord(id,r);checkCancelled(context);},readImage:async pageId=>{checkCancelled(context);if(!h.archive_item_id)fail('尚未记录档案预留编号，不能复制图片。');const page=v.images.find(p=>p.page_id===pageId);if(!page)fail('该页不属于本次整册。');const bytes=await imageBytes(id,page);checkCancelled(context);return bytes;}});
      if(archive){if(archive.item_id!==h.archive_item_id||h.copied_pages.length!==v.images.length||archive.page_map?.length!==v.images.length||archive.page_map.some((p,i)=>p.attachment_ref!==h.copied_pages[i].attachment_ref||p.printed_label!==v.images[i].label))fail('档案草稿无法证明已完整复制本次整册。');h.page_map=structuredClone(archive.page_map);if(archive.write_revision)h.archive_write_revision=archive.write_revision;await writeRecord(id,r);}
      checkCancelled(context);
      const imported=await adapters.importCatalog({record:r,version:v,review:binding,transfer:p,archive});
      checkCancelled(context);
      if(!manualKey(imported.manual_key)||!/^[a-f0-9]{64}$/.test(imported.document_digest??''))fail('目录草稿的写入结果无法核对。');
      h.manual_key=imported.manual_key;h.catalog_revision=imported.revision;h.catalog_document_digest=imported.document_digest;r.linked_item_id=archive?.item_id??null;r.manual_catalog_key=imported.manual_key;h.status='complete';h.completed_at=new Date().toISOString();r.revision++;r.updated_at=h.completed_at;r.history.push({at:r.updated_at,action:'manual_draft_created',item_id:r.linked_item_id,actor:h.actor,operation_id:h.operation_id,step_id:h.step_id,public_message:'已进入未公开整理草稿，尚未发布。'});await writeRecord(id,r);
      return result(r,v);
    }catch(error){h.status='needs_review';r.revision++;r.updated_at=new Date().toISOString();await writeRecord(id,r).catch(()=>{});throw error;}
  });
  const inspect=async(id,identity,adapters)=>lockedManual(id,async()=>{
    try{
      const r=await manual(id),h=r.manual_handoff;
      if(!h||h.status!=='complete'||h.operation_id!==identity.operationId||h.step_id!==identity.stepId||h.actor!==identity.actor)return {status:'needs_review'};
      const v=submitted(r,{submitted_revision:h.submitted_revision,snapshot_digest:h.digest});approved(r,v);verifyHandoff(r,v);await verifiedImages(r,v);
      const catalog=await adapters.inspectCatalog(),doc=catalog.state?.draft?.documents?.find(doc=>doc.manual_key===h.manual_key);
      if(!doc||catalog.readiness?.status!=='ready'||hash(doc)!==h.catalog_document_digest||doc.source_submission_id!==id||doc.source_submission_revision!==v.revision||doc.source_submission_digest!==v.digest||doc.source_sharing_scope!==h.sharing_scope||doc.linked_archive_id!==(r.linked_item_id??'')||hash(doc.page_map)!==hash(h.page_map))return {status:'needs_review'};
      if(h.sharing_scope==='reading-copy'){
        const {draft,images}=await adapters.inspectArchive(h.archive_item_id),source=draft?.manual_submission;
        if(draft?.source_submission_id!==id||draft?.record?.core?.item_id!==h.archive_item_id||h.archive_write_revision&&draft.write_revision!==h.archive_write_revision||source?.operation_id!==h.operation_id||source?.step_id!==h.step_id||source?.digest!==v.digest||source?.submitted_revision!==v.revision||hash(draft.record.core.publication_file_path)!==hash(h.page_map.map(p=>p.attachment_ref))||source.pages?.length!==v.images.length||source.pages.some((p,i)=>p.page_id!==v.images[i].page_id||p.sha256!==v.images[i].sha256||p.bytes!==v.images[i].bytes||p.printed_label!==v.images[i].label||p.attachment_ref!==h.page_map[i].attachment_ref)||images?.length!==v.images.length||h.page_map.some((p,i)=>images.find(img=>img.filename===path.basename(p.attachment_ref))?.sha256!==v.images[i].sha256||images.find(img=>img.filename===path.basename(p.attachment_ref))?.bytes!==v.images[i].bytes))return {status:'needs_review'};
      }
      if(hash(await manual(id))!==hash(r))return {status:'needs_review'};
      return {status:'succeeded',result:{manualTransfer:receipt(r,v)}};
    }catch{return {status:'needs_review'};}
  });
  return {transfer,inspect,verifyHandoff};
}
