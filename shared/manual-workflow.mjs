import {normalizeManualSubmission} from './manual-submission.mjs';
import {safeManualSourceUrl} from './manual-catalog.mjs';
import {normalizeManualPdfConfirmation} from './manual-pdf-review.mjs';
export const manualConsentVersion='2026-11-11-manual-v1';
export const manualConsentStatements=Object.freeze({
  copies:'我提供的是经过筛选的副本或公开来源线索，不提供原始主档。',
  rights:'我有权提供上述资料，并同意按所选提供方式交由本站整理；其他使用范围需另行确认。',
  privacy:'我已检查人物与隐私并完成必要遮盖，仍需判断的情况已在说明中如实填写。',
  processing:'我同意为本次审核与沟通私密保存资料，提交不代表公开。',
});
export const manualSubmissionStates=Object.freeze({draft:'草稿（未提交）',pending:'已提交，待核对',needs_info:'需要补充',approved:'初审通过，待整理',declined:'暂不采用',withdrawn:'已停止处理'});
const fail=(message,statusCode=400)=>{throw Object.assign(new Error(message),{name:'SubmissionError',statusCode});};
export function manualSubmissionLabel(record){return record.withdrawal_requested?'停止处理申请已收到':record.status==='draft'&&record.manual_draft_reason==='supplement'?'补充中（未重新提交）':manualSubmissionStates[record.status]??'状态待核对';}
export function manualSubmissionProblems(input,pageCount){
  const m=normalizeManualSubmission(input),issues=[];
  if(!m.brand_name||!m.model_texts.length)issues.push('请填写品牌和完整适用型号。');
  if(!m.category_key||!m.document_kind||!m.languages.length)issues.push('请选择品类、文档用途及原文语言；无法确认时选择已有的未知选项。');
  if(!m.completeness)issues.push('请选择完整程度；无法核实时可选择“完整度未核实”。');
  if(m.completeness==='incomplete'&&!m.missing_note)issues.push('请说明已经知道的缺页情况。');
  if(m.source_note.length<2)issues.push('请补充资料来源。');
  if(!m.people)issues.push('请如实说明是否涉及可识别人物。');
  if(m.attribution==='named'&&!m.credit)issues.push('请填写希望的署名，或选择匿名。');
  if(!['official-link','reading-copy'].includes(m.sharing_scope))issues.push('请先明确希望提供官网线索还是站内阅读副本。');
  if(!m.rights_basis||m.rights_basis==='unknown')issues.push('权利情况尚未确认，请先保存私密草稿，补充依据后再提交。');
  if(['permission','public-domain'].includes(m.rights_basis)&&m.rights_note.length<2)issues.push('请补充授权或权利判断的依据与限制。');
  if(m.official_url&&!safeManualSourceUrl(m.official_url))issues.push('官方来源网址未通过安全格式检查，请修正或留空。');
  if(m.sharing_scope==='official-link'&&!safeManualSourceUrl(m.official_url))issues.push('提供官网线索时，请填写安全的HTTPS官方来源网址。');
  if(m.sharing_scope==='reading-copy'&&(!pageCount||m.rights_basis==='official-link'))issues.push('站内阅读副本至少需要一页，并需有相应的提供依据。');
  return issues;
}
export function normalizeManualWorkflowOperation(input){
  if(!input||typeof input!=='object'||Array.isArray(input))fail('投稿操作无法读取。');
  const allowed=input.action==='submit'?['action','operation_id','revision','consent_version','consents','pdf_confirmation','website']:['action','operation_id','revision','website'];
  if(Object.keys(input).some(key=>!allowed.includes(key))||!['submit','edit','withdraw','discard'].includes(input.action))fail('不支持这项说明书投稿操作。');
  if(typeof input.operation_id!=='string'||!/^[a-f0-9]{64}$/.test(input.operation_id))fail('操作凭证无效，请重新打开草稿。');
  if(!Number.isSafeInteger(input.revision)||input.revision<1)fail('投稿版本无效，请重新读取后核对。',428);
  if(input.website)fail('提交未通过，请稍后重试。');
  const result={action:input.action,operation_id:input.operation_id,revision:input.revision};
  if(input.action==='submit'){
    if(input.consent_version!==manualConsentVersion||!input.consents||typeof input.consents!=='object'||Array.isArray(input.consents)||Object.keys(input.consents).some(key=>!Object.hasOwn(manualConsentStatements,key))||!Object.keys(manualConsentStatements).every(key=>Object.hasOwn(input.consents,key)&&input.consents[key]===true))fail('请阅读并逐项确认说明书的副本、提供范围、隐私及私密处理说明。');
    result.consent_version=manualConsentVersion;result.consents=Object.fromEntries(Object.keys(manualConsentStatements).map(key=>[key,true]));
    if(Object.hasOwn(input,'pdf_confirmation'))result.pdf_confirmation=normalizeManualPdfConfirmation(input.pdf_confirmation);
  }
  return result;
}
