// 6.3只生成本人私密预览，不赋予送审或公开权限。
export const manualPdfGenerationLimits=Object.freeze({pages:200,pageBytes:5*1024*1024,bookBytes:100*1024*1024,storedPages:1000,jobs:200,queue:10,accountActive:1,concurrency:1,inspectMs:10000,pageMs:30000,bookMs:20*60*1000,memoryBytes:512*1024*1024,diagnosticBytes:64*1024});
export const manualPdfProfiles=Object.freeze({standard:{label:'标准清晰',longEdge:2400},detail:{label:'精细核对',longEdge:4096}});
export const manualPdfJobPattern=/^PG-[a-f0-9]{24}$/;
export const manualPdfJobActive=new Set(['queued','inspecting','rendering','committing','cancelling']);
export const manualPdfJobStates=new Set([...manualPdfJobActive,'succeeded','failed','cancelled','interrupted','needs_review']);
export const manualPdfJobLabels=Object.freeze({queued:'等待生成',inspecting:'正在检查PDF',rendering:'正在生成页面',committing:'正在核对整册',cancelling:'正在停止',succeeded:'整册已生成，待逐页核对',failed:'本次生成未完成',cancelled:'本次生成已停止',interrupted:'上次生成中断',needs_review:'需要维护者核对'});
const fail=(message,statusCode=400)=>{throw Object.assign(new Error(message),{name:'SubmissionError',statusCode});};
export function normalizeManualPdfGeneration(input){
  if(!input||typeof input!=='object'||Array.isArray(input)||Object.keys(input).some(k=>!['operation_id','revision','profile','website'].includes(k)))fail('PDF生成操作无法读取。');
  if(!/^[a-f0-9]{64}$/.test(input.operation_id??''))fail('生成操作凭证无效。');
  if(!Number.isSafeInteger(input.revision)||input.revision<1)fail('草稿版本无效，请重新读取。',428);
  if(!Object.hasOwn(manualPdfProfiles,input.profile??''))fail('请选择已有的清晰度配置。');
  if(input.website)fail('提交未通过。');return {operation_id:input.operation_id,revision:input.revision,profile:input.profile};
}
