import {accountFetch,setStatus} from './account-client';
type Hooks={blocked:()=>boolean;dirty:()=>boolean;ensureOwner:()=>Promise<void>;accept:(value:any)=>void;lock:(value:boolean)=>void;unauthorized:()=>void};
type Pending={operation_id:string;revision:number;page_id:string;label:string;note:string};
const $=<T extends HTMLElement>(id:string)=>document.getElementById(id) as T;
const key=()=>Array.from(crypto.getRandomValues(new Uint8Array(32)),n=>n.toString(16).padStart(2,'0')).join('');
export function createManualPdfLabels(hooks:Hooks){
  let record:any=null,enabled=false,paused=false,dirty=false,running=false,lastLock=false,pending:Pending|null=null;
  const picker=$<HTMLSelectElement>('manual-pdf-label-page'),label=$<HTMLInputElement>('manual-pdf-label-value'),note=$<HTMLTextAreaElement>('manual-pdf-label-note'),save=$<HTMLButtonElement>('manual-pdf-label-save'),reset=$<HTMLButtonElement>('manual-pdf-label-reset'),retry=$<HTMLButtonElement>('manual-pdf-label-retry');
  const say=(value:string,tone:'info'|'ok'|'error'='info')=>setStatus($('manual-pdf-label-status'),value,tone);
  const page=()=>record?.images?.find((p:any)=>p.page_id===picker.value);
  function fill(){const p=page();label.value=p?.label??'';note.value=p?.note??'';dirty=false;}
  function refreshControls(){
    const visible=record?.source_format==='pdf'&&record.manual_metadata.sharing_scope==='reading-copy'&&record.images.length>0;
    $('manual-pdf-labels').hidden=!visible;
    const blocked=!enabled||paused||record?.status!=='draft'||!record?.manual_pdf_review?.labels_enabled||hooks.blocked()||hooks.dirty()||running||Boolean(pending);
    picker.disabled=blocked||dirty;label.disabled=blocked;note.disabled=blocked;save.disabled=blocked||!dirty;reset.disabled=running||Boolean(pending)||!dirty;retry.hidden=!pending;retry.disabled=running||hooks.blocked()||hooks.dirty();
    const lock=dirty||running||Boolean(pending);if(lock!==lastLock){lastLock=lock;hooks.lock(lock);}
  }
  async function api(path:string,options:{method?:string;body?:unknown}={}){const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),15000);try{return await accountFetch(path,{...options,signal:controller.signal});}finally{clearTimeout(timer);}}
  async function perform(retryOnly=false){
    if(running||hooks.blocked()||hooks.dirty()||!record||retryOnly&&!pending||!retryOnly&&(!dirty||!enabled||paused))return;
    if(!retryOnly)pending={operation_id:key(),revision:record.revision,page_id:picker.value,label:label.value,note:note.value};
    const operation=pending!;running=true;refreshControls();let sent=false,knownSaved=false;
    try{
      await hooks.ensureOwner();const base=`/api/account/manual-drafts/${record.id}/pdf`;
      const receipt=await api(base+'/label-operations/'+operation.operation_id);
      if(receipt.id!==record.id||receipt.operation_id!==operation.operation_id||typeof receipt.applied!=='boolean'||!Number.isSafeInteger(receipt.revision))throw new Error('纸面页码回执无法核对。');
      knownSaved=receipt.applied;
      if(!receipt.applied){
        if(receipt.revision!==operation.revision){pending=null;throw new Error('本次页码尚未保存，草稿已在其他窗口更新。请先读取最新版本。');}
        if(paused){pending=null;throw new Error('当前暂停保存，本页填写仍保留。');}
        sent=true;const saved=await api(base+'/page-labels',{method:'POST',body:operation});if(saved.id!==record.id||saved.operation_id!==operation.operation_id)throw new Error('纸面页码保存回执无法核对。');knownSaved=true;
      }
      const saved=await api(`/api/account/manual-submissions/${record.id}`);if(saved.id!==record.id||saved.submission_kind!=='manual')throw new Error('草稿保存结果无法核对。');
      pending=null;dirty=false;running=false;hooks.accept(saved);say('本页纸面页码与说明已保存。整册确认已重置，请阅读后重新逐项确认。','ok');
    }catch(error){const issue=error as Error&{status?:number};if(sent&&!knownSaved&&issue.status||!sent&&!retryOnly)pending=null;if(issue.status===401)hooks.unauthorized();say(pending?'尚未核对页码保存结果，请保留本页并点击“核对并重试页码保存”。':issue.message,'error');}
    finally{running=false;refreshControls();}
  }
  picker.addEventListener('change',()=>{fill();refreshControls();});
  for(const control of [label,note])control.addEventListener('input',()=>{const p=page();dirty=label.value!==(p?.label??'')||note.value!==(p?.note??'');refreshControls();say(dirty?'本页页码或说明尚未保存。':'当前填写与已保存内容一致。');});
  save.addEventListener('click',()=>void perform());retry.addEventListener('click',()=>void perform(true));reset.addEventListener('click',()=>{if(running||pending)return;fill();refreshControls();say('已恢复本页已保存的页码与说明。');});
  return {refreshControls,hasUnsaved:()=>dirty||running||Boolean(pending),canReload:()=>!running&&!pending,
    load(value:any,active:boolean,isPaused:boolean){const selected=record?.id===value?.id?picker.value:'';record=value;enabled=active;paused=isPaused;picker.replaceChildren();for(const p of value?.images??[]){const option=document.createElement('option');option.value=p.page_id;option.textContent=`源PDF第${p.source_page}页${p.label?' · '+p.label:''}`;picker.append(option);}if(value?.images?.some((p:any)=>p.page_id===selected))picker.value=selected;pending=null;fill();say(record?.status!=='draft'?'已提交内容只读；需要补充时请先从上方进入同一册草稿。':record?.manual_pdf_review?.labels_enabled?'可填写纸面页码与本页说明；不会改动PDF页序。':'请先完成当前PDF的整册生成并核对。');refreshControls();},
  };
}
