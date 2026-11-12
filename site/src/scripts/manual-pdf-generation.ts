import {accountFetch,setStatus} from './account-client';
import {manualPdfJobActive,manualPdfJobStates,manualPdfJobLabels,manualPdfProfiles} from '../../../shared/manual-pdf-generation.mjs';
type Hooks={blocked:()=>boolean;dirty:()=>boolean;ensureOwner:()=>Promise<void>;accept:(data:any)=>void;lock:(value:boolean)=>void;preview:()=>void;unauthorized:()=>void};
type Pending={operation_id:string;revision:number;profile:string};
const $=<T extends HTMLElement>(id:string)=>document.getElementById(id) as T;
const key=()=>Array.from(crypto.getRandomValues(new Uint8Array(32)),n=>n.toString(16).padStart(2,'0')).join('');
const size=(bytes:number)=>(bytes/1024/1024).toLocaleString('zh-CN',{maximumFractionDigits:2})+' MiB';
const warningLabels:Record<string,string>={font_warning:'生成工具报告字体问题，请检查缺字、乱码与字体替换。',font_not_embedded:'原PDF含未嵌入字体，请对照原文件检查文字。',font_check_needs_review:'字体情况尚需人工核对。',cropbox_differs:'原PDF可见范围与纸张范围不同，已按正常可见范围生成，请核对裁切。',tool_warning:'PDF文件检查有提示，请逐页对照。',render_warning:'页面生成有提示，请逐页对照。'};
export function createManualPdfGeneration(hooks:Hooks){
  let record:any=null,operation:any=null,available=false,paused=false,messageAvailability='',running=false,unknown=false,lastLock=false,pending:Pending|null=null,timer:ReturnType<typeof setTimeout>|null=null,polling=false;
  const profile=$<HTMLSelectElement>('manual-generation-profile'),start=$<HTMLButtonElement>('manual-generation-start'),check=$<HTMLButtonElement>('manual-generation-check'),stop=$<HTMLButtonElement>('manual-generation-stop');
  const base=()=>`/api/account/manual-drafts/${record.id}/pdf`;
  const active=()=>Boolean(operation&&!operation.applied&&(manualPdfJobActive.has(operation.state)||operation.state==='needs_review'));
  const status=(value:string,tone:'info'|'ok'|'error'='info')=>setStatus($('manual-generation-status'),value,tone);
  async function api(path:string,options:{method?:string;body?:unknown}={}){const controller=new AbortController(),deadline=setTimeout(()=>controller.abort(),15000);try{return await accountFetch(path,{...options,signal:controller.signal});}finally{clearTimeout(deadline);}}
  function refreshControls(){
    const ready=record?.source_format==='pdf',preview=record?.manual_pdf_generation?.preview,blocked=hooks.blocked()||hooks.dirty()||running,official=record?.manual_metadata?.sharing_scope==='official-link';
    $('manual-pdf-generation').hidden=!ready;
    const already=preview?.source_current&&preview.engine_current!==false&&preview.profile===profile.value&&operation?.state==='succeeded';
    profile.disabled=!ready||!available||paused||record?.status!=='draft'||blocked||active()||unknown||Boolean(pending)||official;
    start.disabled=!ready||!available||paused||!record?.manual_pdf?.current||record?.status!=='draft'||blocked||active()||unknown||Boolean(pending)||already||official;
    start.textContent=operation?.can_retry?'重新生成整册':preview&&!preview.source_current?'为当前PDF生成整册':'生成整册预览';
    check.hidden=!operation&&!pending;check.disabled=running||polling||hooks.blocked()||hooks.dirty();
    check.textContent=pending?'核对并重试生成':'核对生成回执';
    stop.hidden=!operation?.can_cancel;stop.disabled=running||hooks.blocked()||hooks.dirty();
    $('manual-generation-preview').hidden=!preview;
    const lock=running||unknown||Boolean(pending)||active();if(lock!==lastLock){lastLock=lock;hooks.lock(lock);}
  }
  function render(){
    const data=record?.manual_pdf_generation,preview=data?.preview;
    $('manual-generation-availability').textContent=messageAvailability;
    $('manual-generation-preview-detail').textContent=preview?`${preview.pages}页 · ${manualPdfProfiles[preview.profile]?.label??'已保存配置'} · ${new Date(preview.generated_at).toLocaleString('zh-CN',{hour12:false})} · ${record.status==='draft'?'尚未提交审核':'私密投稿留存'}`:'';
    $('manual-generation-source-note').textContent=preview?.source_current?(preview.engine_current===false?'这份预览使用旧处理配置，可按新配置重新生成；旧预览仍可阅读。':'这份预览对应当前私密PDF，请逐页核对文字、图表、方向和缺页。'):'当前PDF尚未完成新的整册生成；下方保留的是上一次完整预览。';
    $('manual-generation-usage').textContent=data?`本册已保留${data.stored_images}张图片，占用${size(data.stored_image_bytes)}；图片累计最多100 MiB、1000份，账号资料合计200 MiB。`:'';
    const warnings=$('manual-generation-warnings');warnings.replaceChildren();for(const code of new Set([...(preview?.warnings??[]),...(operation?.warnings??[])])){const item=document.createElement('li');item.textContent=warningLabels[code as string]??'本册还有需要人工核对的处理提示。';warnings.append(item);}warnings.hidden=warnings.children.length===0;
    $('manual-generation-progress-wrap').hidden=!operation||(!manualPdfJobActive.has(operation.state)&&operation.state!=='succeeded');
    const bar=$<HTMLProgressElement>('manual-generation-progress');if(operation?.page_count){bar.max=operation.page_count;bar.value=operation.completed_pages;}else bar.removeAttribute('value');
    $('manual-generation-progress-text').textContent=operation?`${manualPdfJobLabels[operation.state]??'待核对'}${operation.page_count?` · ${operation.completed_pages}/${operation.page_count}页`:''}`:'';
    refreshControls();
  }
  function acceptReceipt(data:any){
    const expected=pending?.operation_id??operation?.operation_id;
    if(data.id!==record.id||data.operation_id!==expected||typeof data.found!=='boolean'||typeof data.applied!=='boolean'||!(data.state==='not_found'||manualPdfJobStates.has(data.state))||!Number.isSafeInteger(data.revision))throw new Error('生成回执无法核对，请保留本页并重试查询。');
    operation=data;unknown=false;if(data.found)pending=null;return data;
  }
  async function reload(){const saved=await api(`/api/account/manual-submissions/${record.id}`);if(saved.id!==record.id||saved.submission_kind!=='manual')throw new Error('整册保存结果无法核对。');hooks.accept(saved);}
  async function query(){const id=pending?.operation_id??operation?.operation_id;if(!id)throw new Error('尚无需要查询的生成任务。');return acceptReceipt(await api(base()+'/generation-operations/'+id));}
  function schedule(){if(timer)clearTimeout(timer);timer=null;if(operation&&manualPdfJobActive.has(operation.state)&&!unknown&&!polling)timer=setTimeout(()=>void poll(),2500);}
  async function poll(){
    if(polling||running||!operation)return;polling=true;
    try{const result=await query();if(!manualPdfJobActive.has(result.state)){await reload();status(result.message||result.state_label,result.applied?'ok':result.state==='needs_review'?'error':'info');}else status(result.message||result.state_label);}
    catch(error){unknown=true;status('暂时无法读取生成进度。请点击“核对生成回执”，确认前不会重新生成。','error');if((error as any).status===401)hooks.unauthorized();}
    finally{polling=false;render();schedule();}
  }
  async function perform(retry=false){
    if(running||hooks.blocked()||hooks.dirty()||!record)return;running=true;refreshControls();let sent=false;
    try{
      await hooks.ensureOwner();
      if(!retry){if(!available||paused||active())return;pending={operation_id:key(),revision:record.revision,profile:profile.value};operation=null;}
      let result=await query();
      if(!result.found&&pending){if(paused)throw new Error('新生成暂时暂停，已保存预览仍可查看。');sent=true;result=acceptReceipt(await api(base()+'/generations',{method:'POST',body:pending}));}
      if(!result.found){pending=null;status('没有找到这次生成任务，可重新发起。');}
      else if(!manualPdfJobActive.has(result.state)){await reload();status(result.message||result.state_label,result.applied?'ok':'info');}
      else status(result.message||result.state_label);
    }catch(error){
      const issue=error as Error&{status?:number};if(issue.status===401)hooks.unauthorized();
      if(sent||pending){try{const result=await query();if(!result.found&&issue.status){pending=null;unknown=false;await reload();status(issue.message,'error');}else if(result.found){if(!manualPdfJobActive.has(result.state))await reload();status(result.message||result.state_label,result.applied?'ok':'info');}else{unknown=true;status('尚未收到可核对的生成结果，请保留本页，点击“核对并重试生成”。','error');}}catch{unknown=true;status('暂未能核对生成结果，请保留本页并查询原生成回执。','error');}}
      else{unknown=Boolean(operation);status(issue.message,'error');}
    }finally{running=false;render();schedule();}
  }
  async function cancel(){
    if(running||hooks.blocked()||hooks.dirty()||!operation?.can_cancel)return;running=true;refreshControls();
    try{await hooks.ensureOwner();const result=acceptReceipt(await api(base()+'/generation-operations/'+operation.operation_id+'/cancel',{method:'POST'}));status(result.message||result.state_label);if(!manualPdfJobActive.has(result.state))await reload();}
    catch(error){unknown=true;status('停止结果尚未核对，请查询原生成回执。','error');if((error as any).status===401)hooks.unauthorized();}
    finally{running=false;render();schedule();}
  }
  start.addEventListener('click',()=>void perform());check.addEventListener('click',()=>void perform(true));stop.addEventListener('click',()=>void cancel());profile.addEventListener('change',refreshControls);
  $('manual-generation-open-reader').addEventListener('click',hooks.preview);
  return {refreshControls,hasUnsaved:()=>running||unknown||Boolean(pending),canReload:()=>!running&&!unknown&&!pending,
    load(data:any,enabled:boolean,isPaused:boolean,availability=''){
      const changed=record?.id!==data?.id;if(changed){if(timer)clearTimeout(timer);timer=null;operation=null;pending=null;unknown=false;profile.value='standard';}
      record=data;available=enabled;paused=isPaused;messageAvailability=availability;
      operation=data?.manual_pdf_generation?.operation??operation;if(operation?.profile&&changed)profile.value=operation.profile;
      if(!running&&!polling)status(data?.status&&data.status!=='draft'?'当前投稿只读，处理状态与补充要求请查看上方进度。':operation?.message??(data?.manual_pdf?.current?'选择清晰度后生成整册，完成前不会替换旧预览。':'先在上方私密保存一份PDF，再生成预览。'),operation?.state==='needs_review'?'error':operation?.applied?'ok':'info');render();schedule();
    },
  };
}
