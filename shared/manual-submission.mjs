// 说明书投稿的私密草稿字段；不属于档案core/metadata，也不是公开目录输入。
import {manualCategories,manualKinds,manualLanguages,manualCompleteness,safeManualSourceUrl} from './manual-catalog.mjs';

export const manualDraftChoices=Object.freeze({
  categories:manualCategories,kinds:manualKinds,languages:manualLanguages,completeness:manualCompleteness,
  sharing:{'official-link':'仅提供官方来源线索','reading-copy':'希望提供站内阅读副本',unsure:'提供方式待确认'},
  rights:{'own-work':'本人创作的内容',permission:'已获授权，依据见下方说明','public-domain':'认为已进入公有领域，仍需核对','official-link':'仅提供厂家公开入口',unknown:'权利情况尚未确认'},
  people:{none:'不涉及可识别的真实人物',yes:'涉及，需人工判断',unsure:'不确定，需人工判断'},
});
const fields=['schema_version','brand_name','model_texts','product_name','category_key','document_kind','languages','region_display','edition_display','edition_date','completeness','missing_note','official_url','source_note','rights_basis','rights_note','sharing_scope','description','people','attribution','credit'];
const fail=message=>{throw Object.assign(new Error(message),{name:'SubmissionError',statusCode:400});};
const text=(value,label,max)=>{if(value==null)return '';if(typeof value!=='string'||value.length>max||/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(value))fail(`${label}格式不正确或内容过长。`);return value.trim();};
const choice=(value,options,label)=>{const result=text(value,label,40);if(result&&!Object.hasOwn(options,result))fail(`请重新选择${label}。`);return result;};
const array=(value,label,max,count)=>{if(value==null)return [];if(!Array.isArray(value)||value.length>count)fail(`${label}格式或数量不正确。`);const result=value.map(v=>text(v,label,max));if(result.some(v=>!v)||new Set(result).size!==result.length)fail(`${label}不能含空项或重复项。`);return result;};

export function normalizeManualSubmission(input){
  if(!input||typeof input!=='object'||Array.isArray(input)||input.schema_version!==1)fail('说明书草稿版本无法读取，请刷新页面后重试。');
  if(Object.keys(input).some(key=>!fields.includes(key)))fail('表单含尚未支持的说明书字段，请刷新页面后重试。');
  const result={schema_version:1,
    brand_name:text(input.brand_name,'品牌',100),model_texts:array(input.model_texts,'适用型号',100,20),product_name:text(input.product_name,'物件名称',120),
    category_key:choice(input.category_key,manualCategories,'品类'),document_kind:choice(input.document_kind,manualKinds,'文档用途'),languages:array(input.languages,'原文语言',20,10),
    region_display:text(input.region_display,'适用地区',120),edition_display:text(input.edition_display,'版本',150),edition_date:text(input.edition_date,'文档日期',10),
    completeness:choice(input.completeness,manualCompleteness,'完整程度'),missing_note:text(input.missing_note,'缺页说明',500),official_url:text(input.official_url,'官方来源网址',2048),
    source_note:text(input.source_note,'资料来源',500),rights_basis:choice(input.rights_basis,manualDraftChoices.rights,'权利情况'),rights_note:text(input.rights_note,'授权依据',1000),sharing_scope:choice(input.sharing_scope,manualDraftChoices.sharing,'提供方式'),
    description:text(input.description,'补充说明',3000),people:choice(input.people,manualDraftChoices.people,'人物情况'),attribution:input.attribution??'anonymous',credit:text(input.credit,'公开署名',40),
  };
  if(!['anonymous','named'].includes(result.attribution))fail('请选择匿名或署名方式。');
  if(result.languages.some(language=>!Object.hasOwn(manualLanguages,language)))fail('请重新选择原文语言。');
  if(result.edition_date&&(!/^\d{4}-\d{2}-\d{2}$/.test(result.edition_date)||Number.isNaN(Date.parse(result.edition_date+'T00:00:00Z'))||new Date(result.edition_date+'T00:00:00Z').toISOString().slice(0,10)!==result.edition_date))fail('文档日期无效；没有标注时请留空。');
  return result;
}

export function manualSubmissionFields(manual){
  return {title:`${manual.brand_name||'品牌待补充'} ${manual.model_texts[0]||'型号待补充'} ${manualKinds[manual.document_kind]||'说明书'}`.slice(0,80),description:manual.description,category:'其他',era:'',place:'',source_note:manual.source_note,people:manual.people,attribution:manual.attribution,credit:manual.credit};
}

// 只提示资料仍需核对，不把保存草稿视为授权、审核或公开批准。
export function manualSubmissionNotes(manual){
  const notes=[];
  if(!manual.brand_name||!manual.model_texts.length)notes.push('品牌或完整型号尚未填写。');
  if(!manual.languages.length)notes.push('原文语言尚未选择。');
  if(manual.completeness==='incomplete'&&!manual.missing_note)notes.push('已标记有缺页，请补充已知缺页情况。');
  if(manual.official_url&&!safeManualSourceUrl(manual.official_url))notes.push('来源网址尚未通过格式检查，将只按文字显示。');
  if(!manual.rights_basis||manual.rights_basis==='unknown'||!manual.sharing_scope||manual.sharing_scope==='unsure')notes.push('权利情况或提供方式仍待确认。');
  if(manual.people!=='none')notes.push('人物与隐私情况尚需人工核对。');
  if(manual.attribution==='named'&&!manual.credit)notes.push('选择了署名，请补充希望公开的名字。');
  return notes;
}
