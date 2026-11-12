// PDF6.4：固定私密源、处理报告与整册页图；历史读取不依赖当前生成配置。
import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {manualPdfJobPattern,manualPdfProfiles,manualPdfGenerationLimits as limits} from '../shared/manual-pdf-generation.mjs';
import {manualPdfSourcePattern,manualPdfUploadLimits} from '../shared/manual-pdf-upload.mjs';
import {isManualPdfReading,manualPdfPageIdentity,manualSnapshotContent,normalizeManualPdfConfirmation,normalizeManualPdfLabel} from '../shared/manual-pdf-review.mjs';
import {verifiedLinuxPdfGeneration} from './manual-pdf-attestation.mjs';
const hash=v=>createHash('sha256').update(Buffer.isBuffer(v)?v:JSON.stringify(v)).digest('hex');
const fail=(message,statusCode=409)=>{throw Object.assign(new Error(message),{name:'SubmissionError',statusCode});};
export function createManualPdfReviewStore({root,read,locked,ownedBy,safeAccountId,writeRecord,summary,jobs,uploads,trustFile}){
  const directory=id=>{if(!/^TG-[A-F0-9]{24}$/.test(id??''))fail('投稿编号无效。',404);return path.join(root,id);};
  const jobDirectory=(id,jobId)=>{if(!manualPdfJobPattern.test(jobId??''))fail('PDF生成记录无法核对。');return path.join(directory(id),'pdf','jobs',jobId);};
  const owned=async(id,accountId)=>{const r=ownedBy(await read(id),safeAccountId(accountId));if(r.submission_kind!=='manual'||r.source_format!=='pdf')fail('找不到这份PDF说明书。',404);return r;};
  async function readFile(file,max){let s;try{s=await fs.lstat(file);}catch(e){if(e.code==='ENOENT')fail('PDF或页面留存缺失，请联系维护者核对。');throw e;}if(!s.isFile()||s.isSymbolicLink()||s.size>max)fail('PDF或页面留存大小无法核对。');return fs.readFile(file);}
  function sourceShape(source){if(!source||!/^PS-[a-f0-9]{24}$/.test(source.source_id??'')||!manualPdfSourcePattern.test(source.filename??'')||!/^[a-f0-9]{64}$/.test(source.sha256??'')||!Number.isSafeInteger(source.bytes)||source.bytes<5||source.bytes>manualPdfUploadLimits.sourceBytes)fail('源PDF留存信息无法核对。');}
  async function sourceBytes(id,source){sourceShape(source);const bytes=await readFile(path.join(directory(id),'pdf',source.filename),manualPdfUploadLimits.sourceBytes);if(bytes.length!==source.bytes||hash(bytes)!==source.sha256)fail('源PDF与提交留存不一致，不能沿用审核。');return bytes;}
  const manifest=pages=>hash(pages.map(manualPdfPageIdentity));
  function checkPages(pages,saved){
    if(!Array.isArray(pages)||!pages.length||pages.length>limits.pages||!Array.isArray(saved)||pages.length!==saved.length||new Set(pages.map(p=>p.page_id)).size!==pages.length||new Set(pages.map(p=>p.filename)).size!==pages.length)fail('PDF整册页面清单无法核对。');
    for(let index=0;index<pages.length;index++){const p=pages[index];if(p.source_page!==index+1||!/^MP-[a-f0-9]{24}$/.test(p.page_id??'')||!/^manual-[a-f0-9]{64}\.jpg$/.test(p.filename??'')||!/^[a-f0-9]{64}$/.test(p.sha256??'')||!Number.isSafeInteger(p.bytes)||p.bytes<1||p.bytes>limits.pageBytes||![p.width,p.height].every(n=>Number.isSafeInteger(n)&&n>0)||p.width*p.height>8_000_000||hash(manualPdfPageIdentity(p))!==hash(manualPdfPageIdentity(saved[index]))||typeof p.label!=='string'||p.label.length>40||typeof p.note!=='string'||p.note.length>300)fail('PDF页序、来源或页面内容已改变，不能沿用审核。');}
  }
  function checkInspection(job){const i=job.inspection;if(!i||i.schema!==1||!i.checked_at||i.pages!==job.page_count||i.encrypted!==false||i.javascript!==false||i.form!=='none'||i.attachments!==0||!Array.isArray(i.geometry)||i.geometry.length!==i.pages||i.geometry.some((g,n)=>g.page!==n+1||![0,90,180,270].includes(g.rotation)||![g.width,g.height].every(x=>Number.isFinite(x)&&x>0))||!Array.isArray(i.warnings)||i.warnings.some(w=>!['font_warning','font_not_embedded','font_check_needs_review','cropbox_differs','tool_warning','render_warning'].includes(w)))fail('本册缺少送审所需的完整PDF检查报告，请按当前配置重新生成整册；旧预览仍保留。');}
  async function loadJob(r,pdf){
    const job=JSON.parse((await readFile(path.join(jobDirectory(r.id,pdf.job_id),'job.json'),2*1024*1024)).toString('utf8'));
    if(job.schema!==1||job.job_id!==pdf.job_id||job.submission_id!==r.id||job.account_id!==r.account_id||job.state!=='succeeded'||job.helper_cleanup!==true||!(r.manual_pdf_render_saved??[]).some(x=>x.job_id===job.job_id&&x.operation_id===job.operation_id&&x.digest===job.pages_digest))fail('本次完整生成的任务绑定无法核对。');
    checkInspection(job);sourceShape(job.source);checkPages(job.pages,job.pages);
    if(job.page_count!==job.pages.length||job.pages_digest!==manifest(job.pages)||job.engine_fingerprint!==pdf.engine_fingerprint||job.profile!==pdf.profile||job.pages_digest!==pdf.pages_digest||job.source.source_id!==pdf.source.source_id||hash(job.source)!==hash(pdf.source)||!Object.hasOwn(manualPdfProfiles,job.profile))fail('源PDF、配置或整册任务记录已变化。');
    return job;
  }
  const snapshotFromJob=job=>({schema_version:1,job_id:job.job_id,source:structuredClone(job.source),engine_fingerprint:job.engine_fingerprint,profile:job.profile,tool_version:job.tool_version,pages_digest:job.pages_digest,generated_at:job.updated_at,inspection:structuredClone(job.inspection),...(job.execution_platform==='linux'||job.origin_attestation?{execution_platform:'linux',origin_attestation:structuredClone(job.origin_attestation)}:{})});
  async function prepared(r,{deep=false}={}){
    if(!isManualPdfReading(r))fail('本次提供范围不是PDF阅读副本。');
    const preview=r.manual_pdf_preview,source=(r.manual_pdf_sources??[]).find(s=>s.source_id===r.manual_pdf_current_source_id);
    if(!preview||!source||preview.source_id!==source.source_id||preview.source_sha256!==source.sha256)fail('当前PDF尚未完成对应的整册生成，请先生成并核对。');
    const seed={...preview,source},job=await loadJob(r,seed),pdf=snapshotFromJob(job);checkPages(r.images,job.pages);
    if(preview.pages!==r.images.length||preview.pages_digest!==manifest(r.images)||hash(source)!==hash(job.source))fail('当前PDF与完整预览不一致，请重新核对。');
    let config=null;try{config=await jobs.configuration();}catch{}
    if(job.execution_platform==='linux'||job.origin_attestation){if(!await verifiedLinuxPdfGeneration(job,config,{trustFile}))fail('服务器生成来源尚未受信任或已变化，新送审和通过审核已暂停；历史版本仍可阅读。');}
    else{if(!config)fail('当前PDF处理配置暂时无法核对，新送审和通过审核已暂停；历史版本仍可阅读。');if(config.fingerprint!==pdf.engine_fingerprint)fail('处理配置已更新，请用当前配置重新生成整册，再重新确认送审。');}
    await sourceBytes(r.id,pdf.source);if(deep)for(const page of r.images)await pageBytes(r.id,pdf,page);
    return {pdf,images:structuredClone(r.images),token:hash({pdf,images:r.images,manual_metadata:r.manual_metadata,revision:r.revision})};
  }
  async function pageBytes(id,pdf,page){const bytes=await readFile(path.join(jobDirectory(id,pdf.job_id),'pages',page.filename),limits.pageBytes);if(bytes.length!==page.bytes||hash(bytes)!==page.sha256||bytes[0]!==0xff||bytes[1]!==0xd8)fail('页面与提交时留存不一致，已停止读取及审核。');return bytes;}
  async function describe(r){
    if(r.source_format!=='pdf')return null;
    if(r.manual_metadata?.sharing_scope==='official-link')return {can_submit:r.status==='draft',labels_enabled:false,confirmation_token:'',problems:[],official_only:true};
    try{
      await uploads.assertNotBusy(r);const result=await prepared(r,{deep:r.status==='approved'});
      if(r.status==='approved'){
        const v=(r.versions??[]).find(v=>v.revision===r.manual_submitted_revision),binding=r.manual_review_binding;
        if(!v||!binding||binding.submitted_revision!==v.revision||binding.digest!==v.digest||binding.pdf_digest!==hash(v.pdf)||hash(result.pdf)!==hash(v.pdf)||hash(result.images)!==hash(v.images)||hash(r.manual_metadata)!==hash(v.manual_metadata))fail('当前整册、文字或提交快照已变化，旧PDF审核已失效。');
        await verifyVersion(r,v);
      }
      return {can_submit:r.status==='draft',labels_enabled:r.status==='draft',confirmation_token:result.token,problems:[],official_only:false};
    }
    catch(e){return {can_submit:false,labels_enabled:false,confirmation_token:'',official_only:false,problems:[e.name==='SubmissionError'?e.message:'PDF整册留存暂时无法核对，请联系维护者。']};}
  }
  async function snapshot(r,confirmation){const result=await prepared(r,{deep:true}),checked=normalizeManualPdfConfirmation(confirmation);if(checked.token!==result.token)fail('本次整册、纸面页码或说明已经改变，请重新阅读并确认，不能沿用旧勾选。');return {...result,confirmation:checked};}
  async function verifyVersion(r,v,{current=false,deep=false}={}){
    if(v.source_format!=='pdf'||!isManualPdfReading(v)||!v.pdf||v.pdf.schema_version!==1||hash(manualSnapshotContent(v))!==v.digest)fail('PDF提交快照无法核对，不能沿用审核。');
    const job=await loadJob(r,v.pdf);if(hash(snapshotFromJob(job))!==hash(v.pdf))fail('PDF提交时的检查报告或处理记录已改变。');checkPages(v.images,job.pages);
    const checked=normalizeManualPdfConfirmation(v.consent?.pdf_confirmation);if(checked.token!==hash({pdf:v.pdf,images:v.images,manual_metadata:v.manual_metadata,revision:v.revision-1}))fail('整册确认与本次提交不一致。');
    if(current){const now=await prepared(r,{deep});if(hash(now.pdf)!==hash(v.pdf)||hash(now.images)!==hash(v.images))fail('当前源、配置、页图或纸面页码已变化，旧审核失效。');}
    else if(deep){await sourceBytes(r.id,v.pdf.source);for(const page of v.images)await pageBytes(r.id,v.pdf,page);}
    return job;
  }
  async function versionImage(r,v,page){await verifyVersion(r,v);return pageBytes(r.id,v.pdf,page);}
  async function label({id,accountId,payload}){
    const op=normalizeManualPdfLabel(payload),fingerprint=hash(op),account=safeAccountId(accountId);
    return locked('account-quota-'+account,()=>locked(id,async()=>{
      const r=await owned(id,account),prior=(r.manual_pdf_label_receipts??[]).find(p=>p.operation_id===op.operation_id);
      if(prior){if(prior.fingerprint!==fingerprint)fail('同一纸面页码操作内容已改变。');return {...summary(r),operation_id:op.operation_id,repeated:true};}
      if(r.status!=='draft'||r.manual_handoff||r.withdrawal_requested)fail('只能填写尚未提交的PDF草稿。');if(r.revision!==op.revision)fail('草稿版本已更新，请读取最新状态再填写。');
      await uploads.assertNotBusy(r);await prepared(r);const page=r.images.find(p=>p.page_id===op.page_id);if(!page)fail('这页不属于当前PDF整册。');
      const at=new Date().toISOString(),next={...r,images:r.images.map(p=>p.page_id===op.page_id?{...p,label:op.label,note:op.note}:p),revision:r.revision+1,updated_at:at,manual_pdf_label_receipts:[...(r.manual_pdf_label_receipts??[]),{operation_id:op.operation_id,fingerprint,revision:r.revision+1}].slice(-200),history:[...r.history,{at,action:'manual_pdf_labels_saved'}]};delete next.manual_review_binding;
      await writeRecord(id,next);return {...summary(next),operation_id:op.operation_id};
    }));
  }
  async function labelStatus({id,accountId,operationId}){if(!/^[a-f0-9]{64}$/.test(operationId??''))fail('纸面页码操作凭证无效。',404);const r=await owned(id,accountId),saved=(r.manual_pdf_label_receipts??[]).find(p=>p.operation_id===operationId);return {id,operation_id:operationId,applied:Boolean(saved),revision:r.revision};}
  return {describe,snapshot,verifyVersion,versionImage,label,labelStatus};
}
