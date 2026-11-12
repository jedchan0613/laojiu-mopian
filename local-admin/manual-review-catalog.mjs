import {createHash} from 'node:crypto';
import {normalizeManualText} from '../shared/manual-catalog.mjs';
const hash=value=>createHash('sha256').update(value).digest('hex').slice(0,24);
const fail=message=>{throw Object.assign(new Error(message),{name:'ManualsError',statusCode:409});};
// 公开标识不携带可还原的私密投稿编号；同一交接仍能稳定去重。
export const submissionManualKey=id=>'manual-'+hash('reviewed-manual:'+id);
export function importManualCatalog(catalog,{record,version,review,transfer,archive}){
  const data=structuredClone(catalog),m=version.manual_metadata,key=submissionManualKey(record.id);
  const prior=data.documents.find(d=>d.manual_key===key);
  if(prior){if(prior.source_submission_id!==record.id||prior.source_submission_digest!==version.digest||prior.linked_archive_id!==(archive?.item_id??''))fail('已有同编号说明书草稿，关联或版本不同，请先核对，不能覆盖。');return {catalog:data,manual_key:key,repeated:true};}
  const brandMatches=data.brands.filter(b=>normalizeManualText(b.name)===normalizeManualText(m.brand_name));
  if(brandMatches.length>1||!brandMatches.length&&data.brands.some(b=>b.aliases.some(a=>normalizeManualText(a)===normalizeManualText(m.brand_name))))fail('品牌名称与现有目录有重复或别名冲突，请先在说明书维护中核对。');
  let brand=brandMatches[0];if(!brand){brand={brand_key:'brand-'+hash(normalizeManualText(m.brand_name)),name:m.brand_name,aliases:[],evidence:review.model_basis};if(data.brands.some(b=>b.brand_key===brand.brand_key))fail('品牌标识冲突，请人工核对。');data.brands.push(brand);}
  const modelKeys=[];
  for(const modelText of m.model_texts){
    const matches=data.models.filter(row=>row.brand_key===brand.brand_key&&normalizeManualText(row.model_text)===normalizeManualText(modelText));
    if(matches.length>1||!matches.length&&data.models.some(row=>row.brand_key===brand.brand_key&&row.model_aliases.some(a=>normalizeManualText(a)===normalizeManualText(modelText))))fail('完整型号与现有型号或别名冲突，请先核对。');
    let model=matches[0];if(model&&(model.category_key!==m.category_key||model.product_name!==transfer.product_name))fail('已有相同型号的品类或物件名称不同，请先在说明书维护中核对；本次不覆盖旧资料。');
    if(!model){model={model_key:'model-'+hash(brand.brand_key+'\n'+normalizeManualText(modelText)),brand_key:brand.brand_key,model_text:modelText,model_aliases:[],product_name:transfer.product_name,category_key:m.category_key,product_era_display:'',evidence:review.model_basis};if(data.models.some(row=>row.model_key===model.model_key))fail('型号标识冲突，请人工核对。');data.models.push(model);}modelKeys.push(model.model_key);
  }
  const doc={manual_key:key,model_keys:modelKeys,document_kind:m.document_kind,languages:[...m.languages],region_display:transfer.region_display,edition_display:transfer.edition_display,edition_date:m.edition_date,completeness:m.completeness,missing_note:m.missing_note,linked_archive_id:archive?.item_id??'',page_map:archive?.page_map??[],contents:[],keywords:[],catalogue_summary:archive?'':transfer.public_description,official_sources:archive?[]:[{name:transfer.official_source_name,url:m.official_url,checked_on:transfer.checked_on,available:transfer.source_available,evidence:review.source_basis}],publication_status:'draft',applicability_basis:review.model_basis,display_basis:archive?review.rights_basis:'',review_note:'由已审核说明书投稿生成；仍需目录发布检查。',source_submission_id:record.id,source_submission_revision:version.revision,source_submission_digest:version.digest,source_sharing_scope:m.sharing_scope};
  if(version.pdf)doc.source_pdf_digest=createHash('sha256').update(JSON.stringify(version.pdf)).digest('hex');
  if(data.documents.some(d=>d.publication_status!=='withdrawn'&&d.model_keys.some(k=>modelKeys.includes(k))&&d.document_kind===doc.document_kind&&JSON.stringify([...d.languages].sort())===JSON.stringify([...doc.languages].sort())&&normalizeManualText(d.region_display)===normalizeManualText(doc.region_display)&&normalizeManualText(d.edition_display)===normalizeManualText(doc.edition_display)&&d.edition_date===doc.edition_date))fail('相同适用型号、用途、语言、地区和版本已有资料，请先核对重复来源，不自动合并两份投稿。');
  data.documents.push(doc);return {catalog:data,manual_key:key,repeated:false};
}
