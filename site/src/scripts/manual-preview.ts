import {normalizeManualSubmission,manualDraftChoices,manualSubmissionFields,manualSubmissionNotes} from '../../../shared/manual-submission.mjs';
import {safeManualSourceUrl} from '../../../shared/manual-catalog.mjs';
const node=(tag:string,value='',className='')=>{const element=document.createElement(tag);element.textContent=value;if(className)element.className=className;return element;};
export function renderManualMetadata(body:HTMLElement,manual:any){
  body.replaceChildren();
  try{
    const data=normalizeManualSubmission(manual);body.append(node('h3',manualSubmissionFields(data).title));
    const facts=node('dl','','manual-draft-preview-facts');
    const add=(label:string,value:string)=>{const entry=node('div');entry.append(node('dt',label),node('dd',value||'尚未填写'));facts.append(entry);};
    add('品牌',data.brand_name);add('物件名称',data.product_name);add('明确适用型号',data.model_texts.join('\n'));
    add('品类',manualDraftChoices.categories[data.category_key]??'');add('文档用途',manualDraftChoices.kinds[data.document_kind]??'');
    add('原文语言',data.languages.map((language:string)=>manualDraftChoices.languages[language]).join('／'));add('适用地区',data.region_display);add('资料版本',data.edition_display);add('明确标注日期',data.edition_date);
    add('完整程度',manualDraftChoices.completeness[data.completeness]??'');add('缺页说明',data.missing_note);add('提供方式',manualDraftChoices.sharing[data.sharing_scope]??'');add('权利情况',manualDraftChoices.rights[data.rights_basis]??'');
    add('资料来源',data.source_note);add('授权依据与限制',data.rights_note);add('人物情况',manualDraftChoices.people[data.people]??'');add('希望的署名',data.attribution==='named'?data.credit:'匿名');
    body.append(facts);
    if(data.official_url){const href=safeManualSourceUrl(data.official_url);body.append(node('h3','官方来源线索'));if(href){const link=node('a',data.official_url) as HTMLAnchorElement;link.href=href;link.target='_blank';link.rel='noopener noreferrer';body.append(link);}else body.append(node('p',data.official_url,'manual-draft-preview-text'));}
    if(data.description)body.append(node('h3','补充说明'),node('p',data.description,'manual-draft-preview-text'));
    const notes=manualSubmissionNotes(data);if(notes.length){const list=node('ul','','manual-draft-notes');for(const note of notes)list.append(node('li',note));body.append(list);}
  }catch(error){body.append(node('p',(error as Error).message));}
}
