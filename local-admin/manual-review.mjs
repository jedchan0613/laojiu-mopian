// 本地说明书人工审核与整理交接。图片仅在逐项人工确认后进入既有未公开待入站草稿。
import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {normalizeManualReview,normalizeManualTransfer,manualReviewChecks} from '../shared/manual-review.mjs';
import {manualSubmissionProblems} from '../shared/manual-workflow.mjs';
import {isManualPdfReading,manualSnapshotContent,manualPdfReviewChecks} from '../shared/manual-pdf-review.mjs';
const hash=value=>createHash('sha256').update(Buffer.isBuffer(value)?value:JSON.stringify(value)).digest('hex');
const fail=(message,statusCode=409)=>{throw Object.assign(new Error(message),{name:'SubmissionError',statusCode});};
export function createManualReviewStore({root,siteDirectory,read,all,locked,writeRecord,detail,privacyChecks,deliverNotification,pdfReview}){
  const lockedManual=(id,operation)=>{if(!/^TG-[A-F0-9]{24}$/.test(id??''))fail('投稿编号无效。',404);return locked(id,operation);};
  const manual=async id=>{const r=await read(id);if(r.submission_kind!=='manual')fail('找不到这份说明书投稿。',404);return r;};
  function submitted(r,payload){
    const v=(r.versions??[]).find(row=>row.revision===r.manual_submitted_revision&&row.manual_metadata);
    if(!v||payload.submitted_revision!==v.revision||payload.snapshot_digest!==v.digest)fail('已提交版本已变化，请重新读取并核对，不能使用旧版审核结果。');
    const samePages=v.source_format==='pdf'?v.manual_metadata.sharing_scope==='official-link'?v.images.length===0:hash(r.images)===hash(v.images):hash(r.images.map(p=>({page_id:p.page_id,filename:p.filename,label:p.label,note:p.note,bytes:p.bytes})))===hash(v.images.map(p=>({page_id:p.page_id,filename:p.filename,label:p.label,note:p.note,bytes:p.bytes})));
    if(hash(manualSnapshotContent(v))!==v.digest||hash(r.manual_metadata)!==hash(v.manual_metadata)||!samePages||v.source_format==='pdf'&&r.source_format!=='pdf')fail('当前内容与提交时留存不一致，请先核对资料。');
    return v;
  }
  async function imageBytes(id,page){
    if(!/^manual-[a-f0-9]{64}\.jpg$/.test(page.filename??'')||!/^[a-f0-9]{64}$/.test(page.sha256??''))fail('留存图片清单无法核对。');
    let bytes;try{bytes=await fs.readFile(path.join(root,id,page.filename));}catch(error){if(error.code==='ENOENT')fail('有留存图片缺失，请先反馈补充要求。');throw error;}
    if(hash(bytes)!==page.sha256)fail('图片与提交时不同，请重新核对，不能沿用旧审核结果。');return bytes;
  }
  async function verifiedImages(r,v){if(isManualPdfReading(v)){await pdfReview.verifyVersion(r,v,{current:true,deep:true});return;}for(const page of v.images)await imageBytes(r.id,page);}
  const get=async id=>{const r=await manual(id);return {...detail(r),...(r.source_format==='pdf'?{pdf_review:await pdfReview.describe(r)}:{})};};
  const image=async(id,revision,filename)=>{const r=await manual(id),v=(r.versions??[]).find(row=>row.revision===revision&&row.manual_metadata),page=v?.images.find(p=>p.filename===filename);if(!page)fail('找不到这次提交的留存图片。',404);return isManualPdfReading(v)?pdfReview.versionImage(r,v,page):imageBytes(id,page);};
  const review=async(id,payload,context={})=>{
    const p=normalizeManualReview(payload,privacyChecks.length);let notification;
    const result=await lockedManual(id,async()=>{
      const r=await manual(id);if(p.revision!==r.revision)fail('投稿已更新，请重新读取后审核。');
      if(!['pending','needs_info','declined','approved'].includes(r.status)||r.withdrawal_requested||r.linked_item_id||r.manual_handoff)fail('本册未提交、已进入整理或已申请停止处理，不能直接更改审核。');
      const v=submitted(r,p),now=new Date().toISOString(),previous=r.status;
      if(p.status==='approved'){const issues=manualSubmissionProblems(v.manual_metadata,v.images.length);if(issues.length)fail(issues.join('\n'));if(isManualPdfReading(v)&&p.pdf_checks?.length!==manualPdfReviewChecks.length)fail('PDF阅读副本必须逐项完成4项PDF检查，共21项人工核对。',428);if(!isManualPdfReading(v)&&p.pdf_checks)fail('当前提交不是PDF阅读副本，请重新读取审核表单。',400);await verifiedImages(r,v);}
      const next={...r,status:p.status,revision:r.revision+1,updated_at:now,public_message:p.public_message,private_note:p.private_note,history:[...r.history,{at:now,action:'review',status:p.status,private_note:p.private_note,public_message:p.public_message,submitted_revision:v.revision}]};
      if(p.status==='approved')next.manual_review_binding={submitted_revision:v.revision,digest:v.digest,sharing_scope:v.manual_metadata.sharing_scope,at:now,model_basis:p.model_basis,source_basis:p.source_basis,rights_basis:p.rights_basis,checks:p.checks,privacy_checks:p.privacy_checks,...(isManualPdfReading(v)?{pdf_digest:hash(v.pdf),pdf_checks:p.pdf_checks}:{})};else delete next.manual_review_binding;
      context.markChanged?.();await writeRecord(id,next);if(previous!==p.status)notification={accountId:r.account_id,event:p.status,submission_id:id,title:r.fields.title};return detail(next);
    });
    await deliverNotification(notification);return result;
  };
  function approved(r,v){const binding=r.manual_review_binding;if(r.status!=='approved'||r.withdrawal_requested||!binding||binding.digest!==v.digest||binding.submitted_revision!==v.revision||binding.sharing_scope!==v.manual_metadata.sharing_scope)fail('本次提交尚未通过专用审核，或审核已失效，请重新核对。');
    if(isManualPdfReading(v)&&(binding.pdf_digest!==hash(v.pdf)||[['checks',manualReviewChecks.length],['privacy_checks',privacyChecks.length],['pdf_checks',manualPdfReviewChecks.length]].some(([key,count])=>!Array.isArray(binding[key])||binding[key].length!==count||binding[key].some(x=>x!==true))||['model_basis','source_basis','rights_basis'].some(key=>typeof binding[key]!=='string'||binding[key].trim().length<2)))fail('PDF的21项检查、来源或审核依据已失效，请重新核对。');
    return binding;}
  const transfer=async(id,payload,{planCatalog,createArchive,importCatalog},context={})=>lockedManual(id,async()=>{
    const r=await manual(id),v=submitted(r,payload),p=normalizeManualTransfer(payload,v.manual_metadata),binding=approved(r,v);
    const {revision,catalog_revision,...content}=p,fingerprint=hash(content);
    if(r.manual_handoff?.status==='complete'){if(r.manual_handoff.fingerprint!==fingerprint)fail('本册已进入整理，本次填写与原交接不同，请在已生成的草稿中继续维护。');return {item_id:r.linked_item_id??null,manual_key:r.manual_catalog_key,repeated:true};}
    if(r.manual_handoff||r.linked_item_id)fail('有未完成的整理交接需要核对，不能自动重复执行。');
    if(p.revision!==r.revision)fail('投稿已变化，请重新读取后再转入。');
    await verifiedImages(r,v);await planCatalog({record:r,version:v,review:binding,transfer:p});if(context.signal?.aborted)fail('整理操作已取消，尚未创建草稿。');
    const now=new Date().toISOString();r.manual_handoff={status:'in-progress',submitted_revision:v.revision,digest:v.digest,fingerprint,operation_id:context.operationId??'',at:now,...(isManualPdfReading(v)?{source_format:'pdf',pdf_digest:hash(v.pdf)}:{})};r.revision++;r.updated_at=now;
    context.markChanged?.();await writeRecord(id,r);
    try{
      let archive=null;
      if(v.manual_metadata.sharing_scope==='reading-copy')archive=await createArchive({id:r.id,title:p.title,description:p.public_description,object_type:p.object_type,accession_date:p.accession_date,images:v.images.map((page,index)=>({kind:'manual-reviewed',page_id:page.page_id,originalName:'screened-page-'+(index+1)+'.jpg'})),manual_submission:{submitted_revision:v.revision,digest:v.digest,...(isManualPdfReading(v)?{source_format:'pdf',pdf_digest:hash(v.pdf)}:{}),pages:v.images.map(page=>({page_id:page.page_id,printed_label:page.label,note:page.note,sha256:page.sha256,...(isManualPdfReading(v)?{source_page:page.source_page}:{})}))},readImage:async pageId=>{const page=v.images.find(p=>p.page_id===pageId);if(!page)fail('待转入的页面不属于本次提交。');return isManualPdfReading(v)?pdfReview.versionImage(r,v,page):imageBytes(id,page);}});
      if(archive&&(!/^LJM-\d{8}-(RPR|OTH)-\d{3}$/.test(archive.item_id??'')||archive.page_map?.length!==v.images.length))fail('档案草稿结果无法核对，请停止并检查交接记录。');
      if(archive){r.manual_handoff.archive_item_id=archive.item_id;if(isManualPdfReading(v)){if(archive.page_map.some((page,index)=>page.printed_label!==v.images[index].label||!new RegExp('^/archive/'+archive.item_id+'/[a-zA-Z0-9_-]+\\.jpg$').test(page.attachment_ref)))fail('PDF转入的页序或纸面页码无法核对。');r.manual_handoff.page_map=structuredClone(archive.page_map);}await writeRecord(id,r);}
      if(context.signal?.aborted)fail('整理操作已取消，已生成的未公开资料需要核对。');
      const imported=await importCatalog({record:r,version:v,review:binding,transfer:p,archive});
      if(!/^manual-[a-f0-9]{24}$/.test(imported.manual_key??''))fail('目录草稿结果无法核对，请停止并检查交接记录。');
      r.linked_item_id=archive?.item_id??null;r.manual_catalog_key=imported.manual_key;r.manual_handoff={...r.manual_handoff,status:'complete',completed_at:new Date().toISOString()};r.revision++;r.updated_at=new Date().toISOString();r.history.push({at:r.updated_at,action:'manual_draft_created',item_id:r.linked_item_id,public_message:'已进入未公开整理草稿，尚未发布。'});await writeRecord(id,r);
      return {item_id:r.linked_item_id,manual_key:r.manual_catalog_key};
    }catch(error){r.manual_handoff.status='needs_review';r.revision++;r.updated_at=new Date().toISOString();await writeRecord(id,r).catch(()=>{});throw error;}
  });
  const publicationIssues=async catalog=>{
    const records=await all(),issues=[],verified=[];
    for(const doc of catalog.documents.filter(d=>d.publication_status!=='withdrawn')){
      const r=doc.source_submission_id?records.find(r=>r.id===doc.source_submission_id):records.find(r=>r.submission_kind==='manual'&&r.linked_item_id&&r.linked_item_id===doc.linked_archive_id);
      if(!r&&!doc.source_submission_id)continue;
      let valid=Boolean(r&&r.status==='approved'&&!r.withdrawal_requested&&r.manual_handoff?.status==='complete'&&r.manual_review_binding?.digest===r.manual_handoff.digest);
      if(doc.source_submission_id)valid=valid&&r.manual_catalog_key===doc.manual_key&&r.manual_submitted_revision===doc.source_submission_revision&&r.manual_review_binding.digest===doc.source_submission_digest&&r.manual_review_binding.sharing_scope===doc.source_sharing_scope;
      if(valid&&doc.source_sharing_scope==='official-link')valid=!doc.linked_archive_id&&!doc.page_map.length;
      if(valid&&doc.source_sharing_scope==='reading-copy')valid=doc.linked_archive_id===r.linked_item_id;
      let problem='投稿已申请停止、审核绑定失效或提供范围不符，请回到说明书审核页核对。';
      if(valid){try{const v=submitted(r,{submitted_revision:r.manual_submitted_revision,snapshot_digest:r.manual_review_binding.digest});if(isManualPdfReading(v)){await assertArchivePublication(r);if(doc.source_pdf_digest!==hash(v.pdf)||hash(doc.page_map)!==hash(r.manual_handoff.page_map))fail('PDF目录与已审核整册的页序或页码不同。');for(const [index,page]of doc.page_map.entries()){const file=path.join(siteDirectory,'public','.'+page.attachment_ref);await noPublicLinks(file);if(hash(await fs.readFile(file))!==v.images[index].sha256)fail('PDF公开候选图片已改变，请重新核对。');}}}catch(error){valid=false;problem=error.code==='ENOENT'?'PDF关联档案的阅读图片尚未公开或缺失，请先完成档案发布。':error.name==='SubmissionError'?error.message:problem;}}
      if(!valid)issues.push({where:doc.manual_key,message:problem});else verified.push({manual_key:doc.manual_key,record:r});
    }
    // 逐册、逐页检查可能耗时；最后统一复读所有已核对的投稿，接住检查期间的停止申请。
    if(verified.length){const latest=new Map((await all()).map(r=>[r.id,r]));for(const row of verified){const current=latest.get(row.record.id);if(!current||hash(current)!==hash(row.record))issues.push({where:row.manual_key,message:'目录校验期间投稿已变化，请重新读取并核对停止申请或审核状态，不能继续发布。'});}}
    return issues;
  };
  async function noPublicLinks(file){const base=path.resolve(siteDirectory,'public'),relative=path.relative(base,file);if(relative.startsWith('..')||path.isAbsolute(relative))fail('PDF发布图片路径无效。');let target=base;for(const part of ['',...relative.split(path.sep)]){if(part)target=path.join(target,part);if((await fs.lstat(target)).isSymbolicLink())fail('PDF发布图片不能使用文件链接。');}}
  const assertArchivePublication=async(r,{draft,images}={})=>{const v=submitted(r,{submitted_revision:r.manual_submitted_revision,snapshot_digest:r.manual_review_binding?.digest});approved(r,v);if(r.manual_handoff?.status!=='complete'||v.manual_metadata.sharing_scope!=='reading-copy')fail('说明书档案尚未完成审核与草稿关联，不能公开。');
    if(!isManualPdfReading(v))return;
    const h=r.manual_handoff;if(h.source_format!=='pdf'||h.digest!==v.digest||h.submitted_revision!==v.revision||h.archive_item_id!==r.linked_item_id||h.pdf_digest!==hash(v.pdf)||!Array.isArray(h.page_map)||h.page_map.length!==v.images.length||new Set(h.page_map.map(p=>p.attachment_ref)).size!==v.images.length||h.page_map.some((p,i)=>p.printed_label!==v.images[i].label||!new RegExp('^/archive/'+r.linked_item_id+'/[a-zA-Z0-9_-]+\\.jpg$').test(p.attachment_ref)))fail('PDF整理来源或完整页序已变化，不能沿用旧审核。');
    await verifiedImages(r,v);
    if(draft){if(draft.record.core.item_id!==r.linked_item_id||hash(draft.record.core.publication_file_path)!==hash(h.page_map.map(p=>p.attachment_ref)))fail('PDF草稿的图片或顺序已变化，必须保持本次审核的完整整册。');if(draft.manual_submission&&(draft.manual_submission.pdf_digest!==hash(v.pdf)||draft.manual_submission.digest!==v.digest||draft.manual_submission.submitted_revision!==v.revision))fail('PDF草稿来源与审核绑定不同。');}
    if(images&&(images.length!==v.images.length||h.page_map.some((p,i)=>images.find(image=>image.filename===path.basename(p.attachment_ref))?.sha256!==v.images[i].sha256)))fail('PDF发布图片与已审核版本不同，不能沿用原确认。');
  };
  const privatePublicationValues=async()=>{const values=[],sourceFiles=[];for(const r of await all()){if(r.submission_kind!=='manual'||r.source_format!=='pdf')continue;values.push(r.id,r.id.slice(3),r.id.slice(3).toLowerCase(),r.account_id);for(const s of r.manual_pdf_sources??[]){sourceFiles.push({sha256:s.sha256,bytes:s.bytes});values.push(s.filename,s.sha256);}for(const v of r.versions??[])if(v.pdf)values.push(v.pdf.job_id,v.pdf.source.source_id,v.pdf.engine_fingerprint,v.pdf.origin_attestation?.key_id,v.pdf.origin_attestation?.signature);}return {privateValues:values,sourceFiles};};
  return {get,image,review,transfer,publicationIssues,assertArchivePublication,privatePublicationValues};
}
