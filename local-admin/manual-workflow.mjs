// 说明书5.3：同一编号提交/补充，已提交版本与图片留存只读；不执行真实入站或公开。
import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {manualPageLimits,manualPageIdPattern} from '../shared/manual-pages.mjs';
import {manualConsentVersion,normalizeManualWorkflowOperation,manualSubmissionProblems} from '../shared/manual-workflow.mjs';
import {normalizeManualSubmission,manualSubmissionFields} from '../shared/manual-submission.mjs';
import {isManualPdfReading,manualSnapshotContent} from '../shared/manual-pdf-review.mjs';
const hash=value=>createHash('sha256').update(value).digest('hex');
const fail=(message,statusCode=400)=>{throw Object.assign(new Error(message),{name:'SubmissionError',statusCode});};
export function createManualWorkflowStore({root,read,locked,ownedBy,safeAccountId,writeRecord,summary,accountDetail,pageUsage,checkSubmitLimit,checkDraftLimit,pdfDescription,generationDescription=async()=>null,pdfReview,assertMaterialWritable}){
  const owned=async(id,accountId)=>{const record=ownedBy(await read(id),safeAccountId(accountId));if(record.submission_kind!=='manual')fail('找不到这份说明书投稿。',404);return record;};
  async function manifest(record){
    if(!Array.isArray(record.images)||record.images.length>manualPageLimits.pages)fail('页面数量无法核对，请重新读取草稿。');
    const pages=[];
    for(const page of record.images){
      if(typeof page.filename!=='string'||!/^manual-[a-f0-9]{64}\.jpg$/.test(page.filename)||!manualPageIdPattern.test(page.page_id??''))fail('页面清单无效，请重新读取草稿。');
      let bytes;try{bytes=await fs.readFile(path.join(root,record.id,page.filename));}catch(error){if(error.code==='ENOENT')fail('有页面副本无法读取，请补传或替换后再提交。');throw error;}
      if(bytes.length!==page.bytes||bytes[0]!==0xff||bytes[1]!==0xd8)fail('页面副本与保存记录不一致，请先核对。');
      pages.push({...page,sha256:hash(bytes)});
    }
    if(new Set(pages.map(page=>page.page_id)).size!==pages.length||new Set(pages.map(page=>page.filename)).size!==pages.length)fail('页面清单有重复，请先核对页序。');
    return pages;
  }
  const get=async({id,accountId})=>{const record=await owned(id,accountId);return {...accountDetail(record),manual_upload_usage:await pageUsage(record),manual_pdf:await pdfDescription(record),manual_pdf_generation:await generationDescription(record),manual_pdf_review:await pdfReview?.describe(record)??null};};
  const operate=async({id,accountId,payload})=>{
    const op=normalizeManualWorkflowOperation(payload),fingerprint=hash(JSON.stringify(op)),account=safeAccountId(accountId);
    return locked(`account-quota-${account}`,()=>locked(id,async()=>{
      const record=await owned(id,account),previous=(record.manual_workflow_receipts??[]).find(item=>item.operation_id===op.operation_id);
      if(previous){if(previous.fingerprint!==fingerprint)fail('同一次投稿操作的内容已改变，请核对后重新操作。',409);return {...summary(record),operation_id:op.operation_id,repeated:true};}
      await assertMaterialWritable(record);
      if(record.revision!==op.revision)fail('投稿已被其他操作更新，本页填写仍保留，请先读取最新版本。',409);
      const inPreparation=Boolean(record.linked_item_id||record.manual_handoff||record.manual_catalog_key);
      if(record.withdrawal_requested||inPreparation&&op.action!=='withdraw')fail('这份资料已经进入整理或停止处理申请，请联系站主核对，不能直接改写。',409);
      const now=new Date().toISOString();let next;
      if(op.action==='withdraw'&&inPreparation){
        next={...record,withdrawal_requested:true,revision:record.revision+1,updated_at:now,history:[...record.history,{at:now,action:'withdrawal_requested',public_message:'已申请停止处理，请站主核对整理或公开状态。'}]};
      }else if(op.action==='submit'){
        if(record.status!=='draft')fail('只有当前草稿可以提交，请先核对处理状态。',409);
        const pdf=isManualPdfReading(record)?await pdfReview.snapshot(record,op.pdf_confirmation):null;
        if(!pdf&&op.pdf_confirmation)fail('当前提供方式不需要PDF整册确认，请重新读取后提交。');
        const metadata=normalizeManualSubmission(record.manual_metadata),issues=manualSubmissionProblems(metadata,record.images.length);if(issues.length)fail(issues.join('\n'));
        await checkSubmitLimit(account);const images=pdf?pdf.images:record.source_format==='pdf'?[]:await manifest(record),fields=manualSubmissionFields(metadata);
        const consent={version:manualConsentVersion,confirmed_at:now,...op.consents,sharing_scope:metadata.sharing_scope,...(pdf?{pdf_confirmation:pdf.confirmation}:{})};
        const revision=record.revision+1,snapshot={revision,at:now,action:record.manual_draft_reason==='supplement'?'supplemented':'submitted',fields:{...fields},manual_metadata:structuredClone(metadata),images,consent};
        if(record.source_format==='pdf'){snapshot.source_format='pdf';snapshot.pdf=pdf?.pdf??null;}
        snapshot.digest=hash(JSON.stringify(manualSnapshotContent(snapshot)));
        next={...record,fields,status:'pending',revision,updated_at:now,manual_metadata:metadata,consent,public_message:'',private_note:'',manual_draft_reason:'',manual_submitted_revision:revision,
          versions:[...(record.versions??[]),snapshot].slice(-20),history:[...record.history,{at:now,action:'submitted',revision,public_message:snapshot.action==='supplemented'?'补充资料已重新提交。':''}]};
        delete next.manual_review_binding;
      }else if(op.action==='discard'){
        if(record.status!=='draft')fail('只有未提交的草稿可以停止；已提交内容请先撤回并修改。',409);
        next={...record,status:'withdrawn',revision:record.revision+1,updated_at:now,
          consent:{version:manualConsentVersion,confirmed_at:'',copies:false,rights:false,privacy:false,processing:false},
          history:[...record.history,{at:now,action:'draft_discarded'}]};
      }else{
        const allowed=op.action==='edit'?['needs_info','declined','withdrawn']:['pending','needs_info','approved','declined'];
        if(!allowed.includes(record.status))fail('当前状态不能进行这项修改，请重新读取投稿进度。',409);
        await checkDraftLimit(account);
        const reason=record.status==='needs_info'?'supplement':'withdrawal';
        next={...record,status:'draft',revision:record.revision+1,updated_at:now,manual_draft_reason:reason,
          consent:{version:manualConsentVersion,confirmed_at:'',copies:false,rights:false,privacy:false,processing:false},
          history:[...record.history,{at:now,action:reason==='supplement'?'manual_supplement_started':'withdrawn_to_draft',public_message:record.public_message??''}]};
        delete next.manual_review_binding;
      }
      next.manual_workflow_receipts=[...(record.manual_workflow_receipts??[]),{operation_id:op.operation_id,fingerprint,action:op.action,revision:next.revision}].slice(-200);
      await writeRecord(record.id,next);return {...summary(next),operation_id:op.operation_id};
    }));
  };
  const operationStatus=async({id,accountId,operationId})=>{
    if(!/^[a-f0-9]{64}$/.test(operationId??''))fail('操作凭证无效。',404);const record=await owned(id,accountId),found=(record.manual_workflow_receipts??[]).find(item=>item.operation_id===operationId);
    return {id,operation_id:operationId,applied:Boolean(found),revision:record.revision,status:record.status};
  };
  const versionImage=async({id,accountId,revision,filename})=>{
    const record=await owned(id,accountId),version=(record.versions??[]).find(item=>item.manual_metadata&&item.revision===revision);
    const page=version?.images.find(item=>item.filename===filename);
    if(!page||!/^manual-[a-f0-9]{64}\.jpg$/.test(filename))fail('找不到这次提交中的页面。',404);
    if(isManualPdfReading(version))return pdfReview.versionImage(record,version,page);
    let bytes;try{bytes=await fs.readFile(path.join(root,id,filename));}catch(error){if(error.code==='ENOENT')fail('这次提交的留存页面暂时无法读取。',404);throw error;}
    if(hash(bytes)!==page.sha256)fail('留存页面与提交时不一致，已停止显示，请联系站主核对。',409);return bytes;
  };
  return {get,operate,operationStatus,versionImage};
}
