// 说明书专用人工审核的输入规则；不授予公开、下载或自动入站权限。
import {safeManualSourceUrl} from './manual-catalog.mjs';
import {manualPdfReviewChecks} from './manual-pdf-review.mjs';
export {manualPdfReviewChecks};
export const manualReviewChecks=Object.freeze([
  '已逐一核对品牌、完整型号及本册适用范围，未把相近型号当作同一型号。',
  '已核对原文语言、版本、页序、纸面页码与完整程度，缺页情况已如实说明。',
  '已实际核对资料来源；官方线索只记录厂家公开入口，阅读副本另有展示依据。',
  '已核对提供范围和权利依据；持有实物不代替展示许可，本次不扩大下载权限。',
]);
const fail=(message,statusCode=400)=>{throw Object.assign(new Error(message),{name:'SubmissionError',statusCode});};
const str=(value,label,max,min=0)=>{if(typeof value!=='string'||value.trim().length<min||value.length>max||/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(value))fail(`请检查${label}（${min}—${max}字）。`);return value.trim();};
function base(input,keys){
  if(!input||typeof input!=='object'||Array.isArray(input)||Object.keys(input).some(k=>!keys.includes(k)))fail('说明书审核表单含不支持的字段。');
  if(!Number.isSafeInteger(input.revision)||input.revision<1||!Number.isSafeInteger(input.submitted_revision)||input.submitted_revision<1||!/^[a-f0-9]{64}$/.test(input.snapshot_digest??''))fail('请重新读取投稿及本次提交版本。',428);
  return {revision:input.revision,submitted_revision:input.submitted_revision,snapshot_digest:input.snapshot_digest};
}
export function normalizeManualReview(input,privacyCount){
  const out=base(input,['revision','submitted_revision','snapshot_digest','status','public_message','private_note','model_basis','source_basis','rights_basis','checks','privacy_checks','pdf_checks']);
  if(!['approved','needs_info','declined'].includes(input.status))fail('请选择通过人工审核、要求补充或暂不采用。');
  Object.assign(out,{status:input.status,public_message:str(input.public_message??'','给投稿人的说明',1000,input.status==='approved'?0:2),private_note:str(input.private_note??'','内部备注',4000),model_basis:str(input.model_basis??'','型号适用依据',2000),source_basis:str(input.source_basis??'','来源核对依据',2000),rights_basis:str(input.rights_basis??'','权利及提供范围依据',2000)});
  if(input.status==='approved'){
    if([out.model_basis,out.source_basis,out.rights_basis].some(value=>value.length<2))fail('请记录型号、来源及权利核对依据；不能用空白勾选代替核实。');
    for(const [field,count]of [['checks',manualReviewChecks.length],['privacy_checks',privacyCount]]){
      if(!Array.isArray(input[field])||input[field].length!==count||input[field].some(v=>v!==true))fail('请逐项完成说明书及隐私人工检查。',428);
      out[field]=[...input[field]];
    }
    if(Object.hasOwn(input,'pdf_checks')){if(!Array.isArray(input.pdf_checks)||input.pdf_checks.length!==manualPdfReviewChecks.length||input.pdf_checks.some(v=>v!==true))fail('请逐项完成4项PDF人工核对。',428);out.pdf_checks=[...input.pdf_checks];}
  }
  return out;
}
export function normalizeManualTransfer(input,metadata){
  const out=base(input,['revision','submitted_revision','snapshot_digest','catalog_revision','confirmed','title','public_description','object_type','accession_date','product_name','region_display','edition_display','official_source_name','checked_on','source_available']);
  if(!/^[a-f0-9]{64}$/.test(input.catalog_revision??''))fail('请重新读取说明书目录版本。',428);
  if(input.confirmed!==true)fail('请确认只生成未公开的整理草稿，不直接发布。',428);
  Object.assign(out,{catalog_revision:input.catalog_revision,title:str(input.title??'','整理后的题名',80,2),public_description:str(input.public_description??'','整理后的公开简介',3000),product_name:str(input.product_name??'','物件名称',120,1),region_display:str(input.region_display||'地区未注明','地区',120,1),edition_display:str(input.edition_display||'版本未注明','版本',150,1)});
  const date=(value,label)=>{const s=str(value??'',label,10,10);if(!/^\d{4}-\d{2}-\d{2}$/.test(s)||Number.isNaN(Date.parse(s+'T00:00:00Z'))||new Date(s+'T00:00:00Z').toISOString().slice(0,10)!==s||s>new Date().toLocaleDateString('en-CA',{timeZone:'Asia/Shanghai'}))fail(`请填写有效且不晚于今天的${label}。`);return s;};
  if(metadata.sharing_scope==='reading-copy'){
    if(!['RPR','OTH'].includes(input.object_type))fail('请人工选择复制件或其他类，说明书只使用既有通用结构。');
    out.object_type=input.object_type;out.accession_date=date(input.accession_date,'实际接收或获得日期');
  }else{
    if(metadata.sharing_scope!=='official-link'||!safeManualSourceUrl(metadata.official_url))fail('官方线索与已提交提供范围不符。');
    if(input.object_type||input.accession_date)fail('官方来源线索不生成实物档案或永久编号。');
    if(typeof input.source_available!=='boolean')fail('请明确记录实际核对时官方入口是否可用。');
    out.official_source_name=str(input.official_source_name??'','官方来源名称',100,2);out.checked_on=date(input.checked_on,'来源核对日期');out.source_available=input.source_available;
  }
  return out;
}
