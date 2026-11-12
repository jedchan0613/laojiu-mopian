// PDF6.4私密确认与快照规则；不包含公开投影、工具路径或发布权限。
export const manualPdfConfirmationVersion='2026-11-12-manual-pdf-v1';
export const manualPdfConsentStatements=Object.freeze({
  pages:'我已逐页核对这次生成的整册，页数、顺序、方向和缺页说明与所提供的PDF一致。',
  appearance:'我已对照原文件检查文字、字体、图表、批注外观和可见范围，并核对页面中的处理提示。',
  scope:'本次仅提交已核对的阅读图片供私密审核，不授权公开原PDF或扩大下载范围。',
});
export const manualPdfReviewChecks=Object.freeze([
  '已核对本次提交的源PDF、处理配置和生成任务绑定一致，没有沿用其他来源或旧配置的审核。',
  '已逐页对照源PDF的页数、顺序、方向、可见范围及缺页说明，整册完整且无静默裁切。',
  '已核对字体、细字、图表、批注外观和全部处理提示；无法确认时先要求补充，不以生成成功代替人工检查。',
  '已确认后续公开候选仅为本次审核的页面图片，源PDF、私密属性、报告与附件不进入公开层。',
]);
const plain=v=>v&&typeof v==='object'&&!Array.isArray(v);
const fail=(message,statusCode=400)=>{throw Object.assign(new Error(message),{name:'SubmissionError',statusCode});};
export const isManualPdfReading=r=>r?.source_format==='pdf'&&r.manual_metadata?.sharing_scope==='reading-copy';
export const manualPdfPageIdentity=p=>({page_id:p.page_id,filename:p.filename,bytes:p.bytes,sha256:p.sha256,width:p.width,height:p.height,source_page:p.source_page});
export const manualSnapshotContent=v=>({manual_metadata:v.manual_metadata,images:v.images,consent:v.consent,...(v.source_format==='pdf'?{source_format:'pdf',pdf:v.pdf??null}:{})});
export function normalizeManualPdfConfirmation(value){
  if(!plain(value)||Object.keys(value).some(k=>!['version','token','checks'].includes(k))||value.version!==manualPdfConfirmationVersion||!/^[a-f0-9]{64}$/.test(value.token??'')||!plain(value.checks)||Object.keys(value.checks).some(k=>!Object.hasOwn(manualPdfConsentStatements,k))||!Object.keys(manualPdfConsentStatements).every(k=>value.checks[k]===true))fail('请重新读取本册，逐项确认实际生成的整册、外观和提供范围。',428);
  return {version:manualPdfConfirmationVersion,token:value.token,checks:Object.fromEntries(Object.keys(manualPdfConsentStatements).map(k=>[k,true]))};
}
export function normalizeManualPdfLabel(input){
  if(!plain(input)||Object.keys(input).some(k=>!['operation_id','revision','page_id','label','note','website'].includes(k))||!/^[a-f0-9]{64}$/.test(input.operation_id??'')||!/^MP-[a-f0-9]{24}$/.test(input.page_id??''))fail('PDF纸面页码操作无效。');
  if(!Number.isSafeInteger(input.revision)||input.revision<1)fail('请重新读取本册版本后填写。',428);
  if(input.website)fail('提交未通过。');
  const words=(v,max,name)=>{if(typeof v!=='string'||v.length>max||/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(v))fail(name+'内容过长或格式不正确。');return v.trim();};
  return {operation_id:input.operation_id,revision:input.revision,page_id:input.page_id,label:words(input.label??'',40,'纸面页码'),note:words(input.note??'',300,'本页说明')};
}
export function manualPdfSnapshotSummary(v){
  if(!v?.pdf)return null;const p=v.pdf;
  return {pages:v.images.length,profile:p.profile,tool_version:p.tool_version,generated_at:p.generated_at,warnings:[...(p.inspection?.warnings??[])]};
}
