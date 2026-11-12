import {accountFetch,setStatus} from './account-client';
import {manualPdfUploadLimits as limits} from '../../../shared/manual-pdf-upload.mjs';

type Hooks={blocked:()=>boolean;dirty:()=>boolean;ensureOwner:()=>Promise<void>;accept:(data:any)=>void;lock:(value:boolean)=>void;unauthorized:()=>void};
type Upload={operation_id:string;revision:number;name:string;bytes:number;sha256:string;copies_confirmed:true};
const $=<T extends HTMLElement>(id:string)=>document.getElementById(id) as T;
const key=()=>Array.from(crypto.getRandomValues(new Uint8Array(32)),v=>v.toString(16).padStart(2,'0')).join('');
const size=(bytes:number)=>`${(bytes/1024/1024).toLocaleString('zh-CN',{maximumFractionDigits:2})} MiB`;
const activeStates=new Set(['reserved','receiving','cancelling','committing','needs_review']);

export function createManualPdfEditor(hooks:Hooks){
  let record:any=null,enabled=false,paused=false,running=false,cancelling=false,lastLock=false,uncertain=false;
  let operation:any=null,upload:Upload|null=null,material:any=null,chosen:File|null=null;
  const picker=$<HTMLInputElement>('manual-pdf-file'),confirmed=$<HTMLInputElement>('manual-pdf-confirm');
  const start=$<HTMLButtonElement>('manual-pdf-start'),check=$<HTMLButtonElement>('manual-pdf-check'),cancel=$<HTMLButtonElement>('manual-pdf-cancel');
  const images=$<HTMLButtonElement>('manual-material-images'),pdf=$<HTMLButtonElement>('manual-material-pdf');
  const base=()=>`/api/account/manual-drafts/${record.id}`;
  const isActive=()=>Boolean(operation&&activeStates.has(operation.state)&&!operation.applied);
  const writable=()=>enabled&&record?.status==='draft'&&!paused&&!hooks.blocked()&&!hooks.dirty();
  const message=(text:string,tone:'info'|'ok'|'error'='info')=>setStatus($('manual-pdf-status'),text,tone);
  async function api(path:string,options:{method?:string;body?:unknown}={}){
    const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),15000);
    try{return await accountFetch(path,{...options,signal:controller.signal});}finally{clearTimeout(timer);}
  }
  function refreshControls(){
    const mode=record?.source_format??'images',blocked=!writable()||running||cancelling||Boolean(material);
    $('manual-material-note').textContent=!record?'先保存上方文字草稿，再选择图片或PDF。':record.status!=='draft'?'本次提交的文件只读；需要补充时，请先从投稿进度回到同一编号的草稿。':hooks.dirty()?'请先保存上方文字修改，再操作文件。':mode==='pdf'?'本册使用PDF方式。已有完整文件会保留，不能直接切换为图片。':record.manual_metadata?.sharing_scope!=='reading-copy'?'如需上传PDF，请先把“希望提供的方式”选为“希望提供站内阅读副本”，并保存文字。':'本册使用逐页图片；尚未留存文件时可以改选PDF。';
    const retained=Boolean(record?.images?.length||record?.manual_pdf?.retained_sources||record?.manual_upload_usage?.stored_copies);
    images.disabled=blocked||retained||isActive()||mode==='images';pdf.disabled=blocked||retained||isActive()||mode==='pdf'||record?.manual_metadata?.sharing_scope!=='reading-copy';
    images.setAttribute('aria-pressed',String(mode==='images'));pdf.setAttribute('aria-pressed',String(mode==='pdf'));
    picker.disabled=blocked||mode!=='pdf'||Boolean(operation&&isActive()&&operation.state!=='reserved');confirmed.disabled=picker.disabled;
    start.disabled=blocked||mode!=='pdf'||!chosen||!confirmed.checked||Boolean(isActive()&&operation.state!=='reserved');
    start.textContent=operation?.state==='reserved'?'重新传输并私密保存':record?.manual_pdf?.current?'保存另一份PDF副本':'上传并私密保存';
    check.hidden=!operation&&!upload;check.disabled=running||cancelling||hooks.blocked()||hooks.dirty();
    cancel.hidden=!isActive();cancel.disabled=cancelling||hooks.blocked()||hooks.dirty()||!['reserved','receiving','cancelling'].includes(operation?.state);
    $<HTMLButtonElement>('manual-pdf-clear').disabled=!chosen||running||cancelling;
    $('manual-material-retry').hidden=!material;$<HTMLButtonElement>('manual-material-retry').disabled=running||hooks.blocked();
    $('manual-pdf-upload-controls').hidden=record?.status!=='draft';
    if(!running)$('manual-pdf-progress-wrap').hidden=true;
    const lock=running||cancelling||uncertain||isActive()||Boolean(material);
    if(lastLock!==lock){lastLock=lock;hooks.lock(lock);}
  }
  function render(){
    const mode=record?.source_format??'images',info=record?.manual_pdf;
    $('manual-material-controls').hidden=!enabled;$('manual-pdf-content').hidden=mode!=='pdf';
    $('manual-pdf-availability').textContent=enabled?'PDF私密保存已在本地开放；图片仍可逐页保存和送审。':'PDF私密上传暂未开放，图片草稿仍可继续。';
    const current=info?.current;$('manual-pdf-saved').hidden=!current;
    $('manual-pdf-saved-name').textContent=current?.name??'';
    const generated=record?.manual_pdf_generation?.preview;
    $('manual-pdf-saved-detail').textContent=current?`${size(current.bytes)} · ${new Date(current.saved_at).toLocaleString('zh-CN',{hour12:false})} · ${generated?.source_current?'已生成'+generated.pages+'页私密预览':'当前PDF尚未生成整册预览'}`:'';
    $('manual-pdf-usage').textContent=info?`本册已留存${info.retained_sources}份PDF，占用${size(info.pdf_stored_bytes)}；未完成字节${size(info.temporary_bytes)}，上传预留${size(info.reserved_bytes)}。账号可用${size(record.manual_upload_usage?.account_remaining_bytes??0)}。`:'';
    $('manual-pdf-selected').textContent=chosen?`本页选择：${chosen.name} · ${size(chosen.size)}`:operation?.state==='reserved'?`上次已预留：${operation.name}。请重新选择同一份文件，核对后从头传输。`:'尚未选择文件。';
    refreshControls();
  }
  async function reload(){
    const data=await api(`/api/account/manual-submissions/${record.id}`);
    if(data.id!==record.id||data.submission_kind!=='manual')throw new Error('PDF保存结果无法核对，请保留本页并查询上传回执。');
    hooks.accept(data);
  }
  function acceptReceipt(data:any){
    const expected=upload?.operation_id??operation?.operation_id;
    if(data.id!==record.id||(data.operation_id!==expected&&!(data.found===false&&data.operation_id===''))||typeof data.applied!=='boolean'||!Number.isSafeInteger(data.revision))throw new Error('PDF上传回执无法核对，请稍后再次查询。');
    operation={...data,operation_id:expected};uncertain=false;
    if(data.applied){chosen=null;picker.value='';confirmed.checked=false;upload=null;}
    return data;
  }
  async function query(){
    const operationId=upload?.operation_id??operation?.operation_id;
    if(!operationId)throw new Error('尚无需要查询的PDF上传。');
    return acceptReceipt(await api(base()+'/pdf/operations/'+operationId));
  }
  function uploadBytes(file:File,uploadId:string){
    return new Promise<any>((resolve,reject)=>{
      const xhr=new XMLHttpRequest();xhr.open('POST',base()+'/pdf/uploads/'+uploadId+'/content');xhr.timeout=135000;
      xhr.setRequestHeader('Content-Type','application/pdf');xhr.setRequestHeader('X-LJM-Account-Request','1');
      $('manual-pdf-progress-wrap').hidden=false;$<HTMLProgressElement>('manual-pdf-progress').value=0;
      const progress=$('manual-pdf-progress-text');progress.textContent='正在传输文件…';
      xhr.upload.onprogress=event=>{if(event.lengthComputable){const value=Math.min(100,Math.floor(event.loaded/event.total*100));$<HTMLProgressElement>('manual-pdf-progress').value=value;progress.textContent=value===100?'已传输，正在核对保存结果…':`已传输 ${value}%`;}};
      xhr.onload=()=>{let data;try{data=JSON.parse(xhr.responseText);}catch{reject(new Error('未收到可核对的PDF保存结果。'));return;}if(xhr.status>=200&&xhr.status<300)resolve(data);else reject(Object.assign(new Error(data.error||'PDF暂未保存，请核对回执。'),{status:xhr.status}));};
      xhr.onerror=xhr.ontimeout=xhr.onabort=()=>reject(new Error('文件传输连接中断，请先查询原上传回执。'));
      xhr.send(file);
    });
  }
  async function startUpload(){
    if(!writable()||running||cancelling||!chosen||!confirmed.checked)return;
    running=true;refreshControls();let sent=false;
    try{
      await hooks.ensureOwner();message('正在本机核对所选PDF；请保持页面打开…');
      const file=chosen,hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',await file.arrayBuffer())),n=>n.toString(16).padStart(2,'0')).join('');
      if(upload&&(upload.name!==file.name||upload.bytes!==file.size||upload.sha256!==hash))throw new Error('上次上传结果尚未核对，请先核对回执或取消，再选择另一份文件。');
      if(operation&&isActive()&&(operation.name!==file.name||operation.bytes!==file.size||operation.sha256!==hash))throw new Error('已预留另一份文件。请重选同一份PDF，或先取消未完成上传。');
      upload??={operation_id:operation?.state==='reserved'?operation.operation_id:key(),revision:record.revision,name:file.name,bytes:file.size,sha256:hash,copies_confirmed:true};
      let result=await query();
      if(!result.found){sent=true;result=acceptReceipt(await api(base()+'/pdf/uploads',{method:'POST',body:upload}));}
      if(result.applied){await reload();message('已找到原上传结果，PDF只保存一份。预览状态请查看下方生成区域。','ok');return;}
      if(!result.can_upload)throw new Error(result.message||'本次上传不能继续，请核对回执或取消未完成上传。');
      sent=true;message('正在上传到私密草稿…');result=acceptReceipt(await uploadBytes(file,result.upload_id));
      if(!result.applied)throw new Error('文件已传输，保存结果仍需查询回执。');
      await reload();message('PDF已私密保存。请在下方查看预览生成状态，尚未提交审核。','ok');
    }catch(error){
      const issue=error as Error&{status?:number};if(issue.status===401)hooks.unauthorized();
      if(upload){try{const result=await query();await reload();message(result.applied?'已通过回执确认PDF保存成功，未重复上传。':result.state==='not_found'?issue.message:result.message||issue.message,result.applied?'ok':'error');if(!isActive()&&!result.applied)upload=null;}catch{uncertain=sent||Boolean(upload);message('暂未能核对上传结果。请保留本页，点击“核对上传回执”，确认前不会再次传输。','error');}}
      else message(issue.message,'error');
    }finally{running=false;render();}
  }
  async function checkReceipt(){
    if(running||cancelling||hooks.blocked()||hooks.dirty())return;running=true;refreshControls();
    try{await hooks.ensureOwner();const result=await query();await reload();if(!isActive()&&!result.applied)upload=null;message(result.applied?'已核对：PDF已私密保存，未公开。':result.state==='reserved'?'空间已预留。请重新选择同一份PDF，并确认后重新传输。':result.state==='not_found'?'尚未收到这次上传。可以重新选择文件后上传。':result.message||'已读取本次上传状态。',result.applied?'ok':'info');}
    catch(error){uncertain=true;if((error as any).status===401)hooks.unauthorized();message((error as Error).message,'error');}
    finally{running=false;render();}
  }
  async function cancelUpload(){
    if(cancelling||hooks.blocked()||hooks.dirty()||!operation||!isActive())return;cancelling=true;refreshControls();
    try{await hooks.ensureOwner();const result=acceptReceipt(await api(base()+'/pdf/operations/'+operation.operation_id+'/cancel',{method:'POST'}));await reload();if(!isActive())upload=null;message(result.applied?'PDF已完整保存，完整文件和历史副本仍保留。':result.message||'未完成上传已取消。',result.applied?'ok':'info');}
    catch(error){uncertain=true;message((error as Error).message,'error');if((error as any).status===401)hooks.unauthorized();}
    finally{cancelling=false;render();}
  }
  async function changeMaterial(mode:string){
    if(!writable()||running||cancelling||isActive())return;running=true;refreshControls();
    try{await hooks.ensureOwner();material??={operation_id:key(),revision:record.revision,source_format:mode};
      await api(base()+'/material',{method:'POST',body:material});material=null;chosen=null;picker.value='';confirmed.checked=false;await reload();message(mode==='pdf'?'已选择PDF方式，可在下方选择副本。':'已选择逐页图片方式。','ok');}
    catch(error){if((error as any).status){material=null;if((error as any).status===401)hooks.unauthorized();}message(material?'暂未核对资料方式，请点击“核对并重试资料方式”。':(error as Error).message,'error');}
    finally{running=false;render();}
  }
  picker.addEventListener('change',()=>{
    const file=picker.files?.[0];chosen=null;confirmed.checked=false;
    if(file){if(!/\.pdf$/i.test(file.name)||file.size<5||file.size>limits.sourceBytes){picker.value='';message('请选择一份PDF副本，大小不超过20 MiB。','error');}else{chosen=file;message('文件仅在本页选中，请检查副本并确认后上传。');}}
    render();
  });
  confirmed.addEventListener('change',refreshControls);start.addEventListener('click',()=>void startUpload());check.addEventListener('click',()=>void checkReceipt());cancel.addEventListener('click',()=>void cancelUpload());
  images.addEventListener('click',()=>void changeMaterial('images'));pdf.addEventListener('click',()=>void changeMaterial('pdf'));
  $('manual-material-retry').addEventListener('click',()=>{if(material)void changeMaterial(material.source_format);});
  $('manual-pdf-clear').addEventListener('click',()=>{chosen=null;picker.value='';confirmed.checked=false;render();});
  return {refreshControls,hasUnsaved:()=>running||cancelling||uncertain||isActive()||Boolean(material)||Boolean(chosen),canReload:()=>!running&&!cancelling&&!uncertain&&!isActive()&&!material,
    load(data:any,available:boolean,isPaused:boolean){
      if(record?.id!==data?.id){chosen=null;picker.value='';confirmed.checked=false;upload=null;operation=null;uncertain=false;material=null;}
      record=data;enabled=available;paused=isPaused;operation=data?.manual_pdf?.operation??operation;
      if(!running&&!cancelling&&operation?.message)message(operation.message,operation.state==='needs_review'?'error':operation.applied?'ok':'info');
      render();
    },
  };
}
