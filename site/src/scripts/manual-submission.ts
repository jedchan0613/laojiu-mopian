import {accountFetch,setStatus} from './account-client';
import {normalizeManualSubmission} from '../../../shared/manual-submission.mjs';
import {renderManualMetadata} from './manual-preview';
import {createManualPagesEditor} from './manual-pages';
import {createManualWorkflow} from './manual-workflow';
import {createManualPdfEditor} from './manual-pdf';
import {createManualPdfGeneration} from './manual-pdf-generation';
import {createManualPdfLabels} from './manual-pdf-labels';
import {manualSubmissionStates,manualSubmissionLabel} from '../../../shared/manual-workflow.mjs';

const byId=<T extends HTMLElement>(id:string)=>document.getElementById(id) as T;
const form=byId<HTMLFormElement>('manual-draft-form');
const status=byId('manual-draft-status'),content=byId('manual-draft-content'),unauth=byId('manual-draft-unauth'),errorPanel=byId('manual-draft-error');
const saveButton=byId<HTMLButtonElement>('manual-draft-save'),preview=byId('manual-draft-preview');
const queryId=new URLSearchParams(location.search).get('id');
let id=queryId?.trim().toUpperCase()||'',ownerId='',record:any=null,dirty=false,busy=false,paused=false;
let pageBusy=false,pagesAvailable=false,pagesEditor:ReturnType<typeof createManualPagesEditor>|undefined;
let workflowBusy=false,workflowAvailable=false,readOnly=false,workflow:ReturnType<typeof createManualWorkflow>|undefined;
let pdfBusy=false,pdfAvailable=false,pdfEditor:ReturnType<typeof createManualPdfEditor>|undefined;
let generationBusy=false,generationAvailable=false,generationAvailability='',generation:ReturnType<typeof createManualPdfGeneration>|undefined;
let pdfWorkflowAvailable=false,labelBusy=false,pdfLabels:ReturnType<typeof createManualPdfLabels>|undefined;
let pending:{path:string;body:any}|null=null;
const requestKey=Array.from(crypto.getRandomValues(new Uint8Array(32)),v=>v.toString(16).padStart(2,'0')).join('');
const field=(name:string)=>form.elements.namedItem(name) as HTMLInputElement|HTMLTextAreaElement|HTMLSelectElement;
const text=(name:string)=>field(name)?.value??'';
const safeId=(value:unknown)=>typeof value==='string'&&/^TG-[A-F0-9]{24}$/.test(value);

function showStatus(message:string,tone:'info'|'ok'|'error'='info'){
  setStatus(status,message,tone);setStatus(byId('manual-draft-save-status'),message,tone);
}

async function api(path:string,options:{method?:string;body?:unknown}={}){
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),15000);
  try{return await accountFetch(path,{...options,signal:controller.signal});}finally{clearTimeout(timer);}
}
function readForm(){
  return normalizeManualSubmission({schema_version:1,
    brand_name:text('brand_name'),model_texts:[...new Set(text('model_texts').split(/\r?\n/).map(v=>v.trim()).filter(Boolean))],product_name:text('product_name'),category_key:text('category_key'),document_kind:text('document_kind'),
    languages:Array.from(form.querySelectorAll<HTMLInputElement>('input[name="languages"]:checked')).map(input=>input.value),region_display:text('region_display'),edition_display:text('edition_display'),edition_date:text('edition_date'),completeness:text('completeness'),missing_note:text('missing_note'),official_url:text('official_url'),
    source_note:text('source_note'),rights_basis:text('rights_basis'),rights_note:text('rights_note'),sharing_scope:text('sharing_scope'),description:text('description'),people:text('people'),attribution:text('attribution'),credit:text('credit'),
  });
}
function updateControls(){
  for(const input of form.querySelectorAll<HTMLInputElement|HTMLSelectElement|HTMLTextAreaElement>('input,select,textarea'))input.disabled=busy||Boolean(pending)||pageBusy||workflowBusy||pdfBusy||generationBusy||labelBusy||readOnly;
  saveButton.hidden=readOnly;saveButton.disabled=busy||paused||pageBusy||workflowBusy||pdfBusy||generationBusy||labelBusy||readOnly;saveButton.textContent=pending?'重试上次保存':'保存私密草稿';
  byId<HTMLButtonElement>('manual-draft-preview-button').disabled=busy;
  byId<HTMLButtonElement>('manual-draft-reload').disabled=busy||pagesEditor?.canReload()===false||workflow?.canReload()===false||pdfEditor?.canReload()===false||generation?.canReload()===false||pdfLabels?.canReload()===false;
  byId('manual-draft-credit-field').hidden=text('attribution')!=='named';
  pagesEditor?.refreshControls();
  workflow?.refreshControls();
  pdfEditor?.refreshControls();
  generation?.refreshControls();
  pdfLabels?.refreshControls();
}
function updateIdentity(){
  byId('manual-draft-identity').textContent=record?`投稿编号 ${record.id} · 当前保存版${record.revision}${dirty?' · 本页有未保存修改':''}`:'新建说明书草稿 · 尚未保存';
  byId('manual-draft-preview-state').textContent=dirty||!record?'这是本页当前填写，尚未保存到草稿。':readOnly?`${manualSubmissionLabel(record)}；当前内容只读，不代表已经公开。`:`已保存的私密草稿，第 ${record.revision} 版；尚未提交审核。`;
}
function fill(manual:any){
  const data=normalizeManualSubmission(manual);
  for(const [name,value]of Object.entries(data)){
    if(name==='schema_version')continue;
    if(name==='languages'){for(const input of form.querySelectorAll<HTMLInputElement>('input[name="languages"]'))input.checked=(value as string[]).includes(input.value);continue;}
    if(name==='model_texts')field(name).value=(value as string[]).join('\n');
    else if(field(name))field(name).value=String(value??'');
  }
  updateControls();
}
function renderPreview(){const body=byId('manual-draft-preview-body');try{renderManualMetadata(body,readForm());}catch(error){const message=document.createElement('p');message.textContent=(error as Error).message;body.replaceChildren(message);}updateIdentity();}
function validateRecord(data:any){
  if(!safeId(data.id)||data.submission_kind!=='manual'||!Object.hasOwn(manualSubmissionStates,data.status)||!Number.isSafeInteger(data.revision)||data.revision<1)throw new Error('投稿内容无法核对，请重新打开专用投稿页面。');
  normalizeManualSubmission(data.manual_metadata);return data;
}
const recordPath=(value=id)=>`/api/account/${workflowAvailable?'manual-submissions':'manual-drafts'}/${value}`;
function applyRecord(data:any){
  record=validateRecord(data);readOnly=record.status!=='draft';dirty=false;fill(record.manual_metadata);
  byId('manual-pages-editor').hidden=record.source_format==='pdf'&&!record.images.length;
  byId('manual-pages-editor').dataset.pdfPreview=String(record.source_format==='pdf');
  pagesEditor?.loadRecord(record,pagesAvailable,paused,workflowAvailable);workflow?.load(record,workflowAvailable,paused,pdfWorkflowAvailable);pdfEditor?.load(record,pdfAvailable,paused);generation?.load(record,generationAvailable,paused,generationAvailability);pdfLabels?.load(record,pdfWorkflowAvailable,paused);updateIdentity();updateControls();
  showStatus(readOnly?'当前投稿内容只读，提交记录和后续反馈可在上方查看。':record.manual_draft_reason==='supplement'?'正在补充同一册资料；保存后请重新逐项确认并提交。':'私密草稿已保存，尚未提交审核或公开。');
  byId('manual-draft-login-again').hidden=true;if(!preview.hidden)renderPreview();
}
async function load(){
  errorPanel.hidden=true;unauth.hidden=true;content.hidden=true;showStatus('正在读取草稿服务…');
  try{
    if(queryId&&!safeId(id))throw new Error('草稿地址无效，请从“我的投稿”重新打开。');
    const [config,me]=await Promise.all([api('/api/account/config'),api('/api/account/me')]);
    if(config.manual_drafts_version!==1)throw new Error('说明书草稿保存暂未开放，请稍后重试。');
    ownerId=me.user.id;paused=config.uploads_open===false;pagesAvailable=config.manual_page_uploads_version===1;workflowAvailable=config.manual_workflow_version===1;pdfAvailable=config.manual_pdf_uploads_version===1;generationAvailable=config.manual_pdf_generation_version===1;generationAvailability=config.manual_pdf_generation_message??'';pdfWorkflowAvailable=config.manual_pdf_workflow_version===1;
    if(id)applyRecord(await api(recordPath()));else{record=null;readOnly=false;fill({schema_version:1,attribution:'anonymous'});pagesEditor?.loadRecord(null,pagesAvailable,paused,workflowAvailable);workflow?.load(null,workflowAvailable,paused,pdfWorkflowAvailable);pdfEditor?.load(null,pdfAvailable,paused);generation?.load(null,generationAvailable,paused,generationAvailability);pdfLabels?.load(null,pdfWorkflowAvailable,paused);}
    dirty=false;content.hidden=false;updateIdentity();updateControls();
    showStatus(readOnly?'当前投稿内容只读，提交记录和后续反馈可在上方查看。':paused?'草稿暂时暂停保存，已保存内容仍可查看。':'草稿不会公开，可以先保存不完整的内容。');
  }catch(error){
    const issue=error as Error&{status?:number};
    if(issue.status===401){unauth.hidden=false;showStatus('请先登录，再保存自己的说明书草稿。');}
    else{errorPanel.hidden=false;byId('manual-draft-error-text').textContent=issue.message;showStatus('草稿服务暂时无法读取。','error');}
  }
}
function updateLoginTarget(draftId=id){
  const target='/login/?next='+encodeURIComponent('/manuals/contribute/'+(safeId(draftId)?'?id='+draftId:''));
  (byId('manual-draft-login') as HTMLAnchorElement).href=target;
  (byId('manual-draft-login-again') as HTMLAnchorElement).href=target;
}
updateLoginTarget();

form.addEventListener('submit',event=>{event.preventDefault();void save();});
async function save(){
  if(busy||paused||pageBusy||workflowBusy||pdfBusy||generationBusy||labelBusy||readOnly)return;busy=true;updateControls();let sent=false,writeConfirmed=false;
  try{
    const manual=pending?.body.manual??readForm();
    const me=await api('/api/account/me');
    if(me.user.id!==ownerId)throw new Error('当前登录账号已改变，请用原账号登录后继续；本页填写仍保留。');
    const operation=pending??{path:id?`/api/account/manual-drafts/${id}`:'/api/account/manual-drafts',body:id?{revision:record.revision,manual,website:text('website')}:{request_key:requestKey,manual,website:text('website')}};
    pending=operation;sent=true;showStatus('正在保存私密草稿…');
    const result=await api(operation.path,{method:'POST',body:operation.body});
    if(!safeId(result.id))throw new Error('未能核对保存结果，请重试上次保存。');
    writeConfirmed=true;updateLoginTarget(result.id);
    const saved=validateRecord(await api(recordPath(result.id)));
    id=result.id;record=saved;pending=null;history.replaceState(null,'',location.pathname+'?id='+id);updateLoginTarget();
    if(JSON.stringify(saved.manual_metadata)!==JSON.stringify(manual)){dirty=true;throw new Error('服务器草稿已有其他更新，本页填写仍保留，请先核对已保存版本。');}
    applyRecord(saved);
    showStatus(saved.status==='draft'?'私密草稿已保存，尚未提交审核或公开。':'保存结果已核对，当前状态请查看投稿进度。','ok');
    byId('manual-draft-login-again').hidden=true;
  }catch(error){
    const issue=error as Error&{status?:number};
    if(sent&&!writeConfirmed&&issue.status&&[400,401,403,404,409,413,415,428,429,503].includes(issue.status))pending=null;
    showStatus(pending?'暂未能核对保存结果，填写已保留。请点击“重试上次保存”，系统会核对同一次请求。':issue.message,'error');
    if(issue.status===401)byId('manual-draft-login-again').hidden=false;
  }finally{busy=false;updateIdentity();updateControls();}
}
byId('manual-draft-preview-button').addEventListener('click',()=>{preview.hidden=false;renderPreview();preview.scrollIntoView({block:'start',behavior:'smooth'});});
byId('manual-draft-reload').addEventListener('click',()=>void(async()=>{
  if(busy)return;if(pending){showStatus('请先重试上次保存，核对结果后再读取。','error');return;}
  if(pagesEditor?.canReload()===false){showStatus('请先核对上次图片操作的保存结果，再读取草稿。','error');return;}
  if(workflow?.canReload()===false){showStatus('请先核对上次投稿操作的回执，再读取最新状态。','error');return;}
  if(pdfEditor?.canReload()===false){showStatus('请先在PDF区域核对上传回执或取消未完成上传。','error');return;}
  if(generation?.canReload()===false){showStatus('请先在生成区域核对原任务回执。','error');return;}
  if(pdfLabels?.canReload()===false){showStatus('请先在纸面页码区域核对保存回执。','error');return;}
  if(!id){showStatus('这份新草稿尚未保存。');return;}
  if((dirty||pagesEditor?.hasUnsaved()||pdfEditor?.hasUnsaved()||pdfLabels?.hasUnsaved())&&!confirm('读取已保存版本会替换本页尚未保存的文字、页序与页码，并清空尚未上传的队列；已保存文件会保留。是否继续？'))return;
  busy=true;updateControls();
  try{applyRecord(await api(recordPath()));showStatus('已读取本册最新保存状态与处理反馈。');}catch(error){showStatus((error as Error).message,'error');}finally{busy=false;updateControls();}
})());
form.addEventListener('input',()=>{dirty=true;updateIdentity();updateControls();showStatus('本页有未保存修改，请保存私密草稿。');if(!preview.hidden)renderPreview();});
form.addEventListener('change',()=>{dirty=true;updateIdentity();updateControls();showStatus('本页有未保存修改，请保存私密草稿。');if(!preview.hidden)renderPreview();});
byId('manual-draft-retry').addEventListener('click',()=>void load());
window.addEventListener('beforeunload',event=>{if(dirty||busy||pending||pagesEditor?.hasUnsaved()||workflow?.hasUnsaved()||pdfEditor?.hasUnsaved()||generation?.hasUnsaved()||pdfLabels?.hasUnsaved()){event.preventDefault();event.returnValue='';}});
pagesEditor=createManualPagesEditor({
  textBlocked:()=>busy||Boolean(pending)||workflowBusy||pdfBusy||generationBusy||labelBusy,textDirty:()=>dirty,
  ensureOwner:async()=>{const me=await api('/api/account/me');if(me.user.id!==ownerId)throw new Error('当前账号已改变，请用原账号登录后继续；本页队列仍保留。');},
  acceptRecord:data=>{record=validateRecord(data);readOnly=record.status!=='draft';workflow?.load(record,workflowAvailable,paused,pdfWorkflowAvailable);pdfEditor?.load(record,pdfAvailable,paused);generation?.load(record,generationAvailable,paused,generationAvailability);pdfLabels?.load(record,pdfWorkflowAvailable,paused);byId('manual-draft-login-again').hidden=true;updateIdentity();if(readOnly)showStatus('当前投稿内容只读，提交记录和后续反馈可在上方查看。');if(!preview.hidden)renderPreview();},
  lockChanged:value=>{pageBusy=value;updateControls();},unauthorized:()=>{byId('manual-draft-login-again').hidden=false;},
});
workflow=createManualWorkflow({
  busy:()=>busy||Boolean(pending)||pageBusy||pdfBusy||generationBusy||labelBusy,dirty:()=>dirty||Boolean(pagesEditor?.hasUnsaved())||Boolean(pdfEditor?.hasUnsaved())||Boolean(generation?.hasUnsaved())||Boolean(pdfLabels?.hasUnsaved()),
  ensureOwner:async()=>{const me=await api('/api/account/me');if(me.user.id!==ownerId)throw new Error('当前账号已改变，请用原账号登录后核对本次操作。');},
  accept:applyRecord,lock:value=>{workflowBusy=value;updateControls();},unauthorized:()=>{byId('manual-draft-login-again').hidden=false;},
  previewVersion:version=>pagesEditor?.previewVersion(version),previewCurrent:()=>pagesEditor?.previewCurrent(),refresh:()=>byId<HTMLButtonElement>('manual-draft-reload').click(),
});
pdfEditor=createManualPdfEditor({
  blocked:()=>busy||Boolean(pending)||pageBusy||workflowBusy||generationBusy||labelBusy,dirty:()=>dirty||Boolean(pagesEditor?.hasUnsaved())||Boolean(pdfLabels?.hasUnsaved()),
  ensureOwner:async()=>{const me=await api('/api/account/me');if(me.user.id!==ownerId)throw new Error('当前账号已改变，请用原账号登录后核对PDF上传。');},
  accept:applyRecord,lock:value=>{pdfBusy=value;updateControls();},unauthorized:()=>{byId('manual-draft-login-again').hidden=false;},
});
generation=createManualPdfGeneration({
  blocked:()=>busy||Boolean(pending)||pageBusy||workflowBusy||pdfBusy||labelBusy,dirty:()=>dirty||Boolean(pagesEditor?.hasUnsaved())||Boolean(pdfEditor?.hasUnsaved())||Boolean(pdfLabels?.hasUnsaved()),
  ensureOwner:async()=>{const me=await api('/api/account/me');if(me.user.id!==ownerId)throw new Error('当前账号已改变，请登录原账号后核对生成任务。');},
  accept:applyRecord,lock:value=>{generationBusy=value;updateControls();},preview:()=>pagesEditor?.previewCurrent(),unauthorized:()=>{byId('manual-draft-login-again').hidden=false;},
});
pdfLabels=createManualPdfLabels({
  blocked:()=>busy||Boolean(pending)||pageBusy||workflowBusy||pdfBusy||generationBusy,dirty:()=>dirty||Boolean(pagesEditor?.hasUnsaved())||Boolean(pdfEditor?.hasUnsaved())||Boolean(generation?.hasUnsaved()),
  ensureOwner:async()=>{const me=await api('/api/account/me');if(me.user.id!==ownerId)throw new Error('当前账号已改变，请用原账号登录后核对纸面页码。');},
  accept:applyRecord,lock:value=>{labelBusy=value;updateControls();},unauthorized:()=>{byId('manual-draft-login-again').hidden=false;},
});
void load();
