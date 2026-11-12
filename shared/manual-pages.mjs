// 账号说明书草稿的私密图片限制，与普通八图投稿和正式档案编码分开。
export const manualPageLimits=Object.freeze({pages:200,queueFiles:50,imageBytes:5*1024*1024,requestBytes:6*1024*1024,layoutBytes:256*1024,bookBytes:100*1024*1024,storedCopies:1000,receipts:200});
export const privateSubmissionImagePattern=/^(?:copy-\d+|manual-[a-f0-9]{64})\.jpg$/;
export const manualPageIdPattern=/^MP-[a-f0-9]{24}$/;
const fail=(message,statusCode=400)=>{throw Object.assign(new Error(message),{name:'SubmissionError',statusCode});};
const plain=value=>value&&typeof value==='object'&&!Array.isArray(value);
const words=(value,max,label)=>{if(typeof value!=='string'||value.length>max||/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(value))fail(`${label}格式不正确或内容过长。`);return value.trim();};
export function normalizeManualPageOperation(input,upload=false){
  if(!plain(input))fail('说明书页面操作无法读取。');
  const allowed=upload?['operation_id','revision','target_page_id','copies_confirmed','image','website']:input.action==='reorder'?['operation_id','revision','action','pages','website']:['operation_id','revision','action','page_id','website'];
  if(Object.keys(input).some(key=>!allowed.includes(key)))fail('页面操作包含尚未支持的内容。');
  if(typeof input.operation_id!=='string'||!/^[a-f0-9]{64}$/.test(input.operation_id))fail('页面操作凭证无效，请重新选择操作。');
  if(!Number.isSafeInteger(input.revision)||input.revision<1)fail('草稿版本无效，请重新读取后核对。',428);
  if(input.website)fail('提交未通过，请稍后重试。');
  const base={operation_id:input.operation_id,revision:input.revision};
  if(upload){
    if(input.copies_confirmed!==true)fail('请先确认所选图片为经过筛选的副本。');
    const target=input.target_page_id??'';if(typeof target!=='string'||target&&!manualPageIdPattern.test(target))fail('要替换的页面无效。');
    return {...base,action:target?'replace':'append',target_page_id:target,copies_confirmed:true};
  }
  if(input.action==='remove'){
    if(typeof input.page_id!=='string'||!manualPageIdPattern.test(input.page_id))fail('要移出的页面无效。');
    return {...base,action:'remove',page_id:input.page_id};
  }
  if(input.action!=='reorder'||!Array.isArray(input.pages)||input.pages.length>manualPageLimits.pages)fail('页序清单无法读取。');
  const pages=input.pages.map(page=>{
    if(!plain(page)||Object.keys(page).some(key=>!['page_id','label','note'].includes(key))||typeof page.page_id!=='string'||!manualPageIdPattern.test(page.page_id))fail('页序清单含无效页面。');
    return {page_id:page.page_id,label:words(page.label??'',40,'印刷页码'),note:words(page.note??'',300,'本页说明')};
  });
  if(new Set(pages.map(page=>page.page_id)).size!==pages.length)fail('页序清单不能重复同一页。');
  return {...base,action:'reorder',pages};
}
