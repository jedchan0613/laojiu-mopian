import {accountFetch,setStatus} from './account-client';
import {manualPageLimits,manualPageIdPattern} from '../../../shared/manual-pages.mjs';
import {manualSubmissionStates} from '../../../shared/manual-workflow.mjs';

type Page={page_id:string;filename:string;original_name:string;bytes:number;label:string;note:string;source_page?:number};
type Operation={key:string;revision:number;body:unknown;path:string;sent:boolean;confirmed:boolean;queueKey?:string};
type QueueEntry={key:string;file:File;target:string;state:'waiting'|'uploading'|'done'|'error';operation?:Operation};
type Hooks={textBlocked:()=>boolean;textDirty:()=>boolean;ensureOwner:()=>Promise<void>;acceptRecord:(record:any)=>void;lockChanged:(locked:boolean)=>void;unauthorized:()=>void};
const $=<T extends HTMLElement>(id:string)=>document.getElementById(id) as T;
const make=<K extends keyof HTMLElementTagNameMap>(tag:K,text='',className='')=>{const el=document.createElement(tag);el.textContent=text;if(className)el.className=className;return el;};
const key=()=>Array.from(crypto.getRandomValues(new Uint8Array(32)),v=>v.toString(16).padStart(2,'0')).join('');
const mb=(bytes:number)=>(bytes/1024/1024).toFixed(1)+' MB';

export function createManualPagesEditor(hooks:Hooks){
  let record:any=null,pages:Page[]=[],queue:QueueEntry[]=[],available=false,paused=false,readOnly=false,layoutDirty=false,running=false,stopRequested=false,lastLock=false,lastReloadBlocked=false,readerIndex=0,versionContext:any=null;
  let pending:Operation|null=null,replaceTarget='',workflowEnabled=false;
  const rowNodes=new Map<string,HTMLLIElement>();
  const files=$<HTMLInputElement>('manual-pages-files'),replacement=$<HTMLInputElement>('manual-pages-replacement'),copies=$<HTMLInputElement>('manual-pages-confirm');
  const start=$<HTMLButtonElement>('manual-pages-start'),pause=$<HTMLButtonElement>('manual-pages-pause'),clear=$<HTMLButtonElement>('manual-pages-clear'),retry=$<HTMLButtonElement>('manual-pages-retry');
  const saveOrder=$<HTMLButtonElement>('manual-pages-save-order'),reader=$('manual-pages-reader'),image=$<HTMLImageElement>('manual-pages-reader-image'),jump=$<HTMLSelectElement>('manual-pages-jump');
  const waiting=()=>queue.some(entry=>entry.state!=='done');
  const blocked=()=>!record||!available||paused||readOnly||hooks.textBlocked()||hooks.textDirty()||running||Boolean(pending);
  function message(value:string,tone:'info'|'ok'|'error'='info'){
    setStatus($('manual-pages-status'),value,tone);setStatus($('manual-pages-order-status'),value,tone);
  }
  async function api(path:string,options:{method?:string;body?:unknown}={}){
    const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),60000);
    try{return await accountFetch(path,{...options,signal:controller.signal});}finally{clearTimeout(timer);}
  }
  function validateSnapshot(data:any){
    if(!data||data.id!==record?.id||!Object.hasOwn(manualSubmissionStates,data.status)||data.submission_kind!=='manual'||!Number.isSafeInteger(data.revision)||!Array.isArray(data.images)||data.images.length>manualPageLimits.pages)throw new Error('保存内容无法核对，请重新打开自己的说明书草稿。');
    if(data.images.some((page:Page)=>typeof page.page_id!=='string'||!manualPageIdPattern.test(page.page_id)||!/^manual-[a-f0-9]{64}\.jpg$/.test(page.filename))||new Set(data.images.map((page:Page)=>page.page_id)).size!==data.images.length)throw new Error('页面清单无法核对，已停止编辑。');
    return data;
  }
  function imagePath(page:Page,version:any=null){return version?`/api/account/manual-submissions/${record.id}/versions/${version.revision}/images/${page.filename}`:`/api/account/manual-drafts/${record.id}/images/${page.filename}`;}
  function refreshControls(){
    const disabled=blocked(),noEdit=disabled||waiting();
    $('manual-pages-upload-controls').hidden=readOnly&&!waiting()&&!pending;
    copies.disabled=disabled||waiting()||layoutDirty;
    files.disabled=noEdit||layoutDirty||!copies.checked;
    start.disabled=disabled||layoutDirty||!copies.checked||!waiting();
    start.textContent=queue.some(entry=>entry.state==='done'||entry.state==='error')?'继续上传':'开始上传';
    pause.disabled=!running;clear.disabled=running||Boolean(pending)||queue.length===0;
    retry.hidden=!pending||running;retry.disabled=running||hooks.textBlocked();
    saveOrder.disabled=disabled||waiting()||!layoutDirty;
    $<HTMLButtonElement>('manual-pages-open-reader').disabled=!pages.length;
    pages.forEach((page,index)=>{
      const row=rowNodes.get(page.page_id);if(!row)return;
      for(const input of row.querySelectorAll<HTMLInputElement|HTMLTextAreaElement>('input,textarea'))input.disabled=noEdit;
      for(const button of row.querySelectorAll<HTMLButtonElement>('button')){
        const action=button.dataset.action;
        button.disabled=action==='view'?false:noEdit||(['replace','remove'].includes(action??'')&&layoutDirty)||(action==='up'&&index===0)||(action==='down'&&index===pages.length-1);
      }
    });
    const lock=layoutDirty||running||Boolean(pending)||waiting(),reloadBlocked=running||Boolean(pending);
    if(lock!==lastLock||reloadBlocked!==lastReloadBlocked){lastLock=lock;lastReloadBlocked=reloadBlocked;hooks.lockChanged(lock);}
  }
  function updateUsage(){
    const usage=record?.manual_upload_usage;
    $('manual-pages-count').textContent=`${pages.length}页${layoutDirty?' · 页序或页码未保存':''}`;
    if(usage)$('manual-pages-usage').textContent=`本册 ${pages.length}/${manualPageLimits.pages} 页 · 私密副本占用 ${mb(usage.stored_bytes)}/100 MB（含替换、移出与中断保留副本）· 已存副本 ${usage.stored_copies}/${manualPageLimits.storedCopies} 份 · 账号剩余 ${mb(usage.account_remaining_bytes)}（总额200 MB）`;
    $('manual-pages-empty').hidden=pages.length>0;
  }
  function renderQueue(){
    const list=$('manual-pages-queue');list.replaceChildren();list.hidden=!queue.length;
    const labels={waiting:'等待上传',uploading:'正在保存',done:'已保存',error:'尚未核对成功'};
    for(const [index,entry]of queue.entries()){const row=make('li');row.append(make('span',`${index+1}. ${entry.file.name}`),make('strong',labels[entry.state]));row.dataset.state=entry.state;list.append(row);}
  }
  function changed(){layoutDirty=true;updateUsage();refreshControls();message('本页页序或印刷页码有修改，请保存；图片文件仍为已上传的私密副本。');if(!reader.hidden)renderReader();}
  function move(pageId:string,to:number){
    const from=pages.findIndex(page=>page.page_id===pageId);if(from<0||!Number.isSafeInteger(to)||to<0||to>=pages.length){message('页序超出范围，请填写本册已有的序号。','error');renderPages();return;}
    if(to===from)return;const [page]=pages.splice(from,1);pages.splice(to,0,page);readerIndex=to;changed();renderPages();
  }
  function buildRow(pageId:string){
    const row=make('li','','manual-page-row');row.dataset.pageId=pageId;
    const thumb=make('button','','manual-page-thumb');thumb.type='button';thumb.dataset.action='view';const picture=make('img');picture.loading='lazy';picture.width=70;picture.height=96;thumb.append(picture);
    const body=make('div','','manual-page-fields'),heading=make('p','','manual-page-heading'),name=make('small','','manual-page-filename');
    const positionLabel=make('label','页序'),position=make('input');position.type='number';position.min='1';position.inputMode='numeric';position.dataset.field='position';positionLabel.append(position);
    const labelWrap=make('label','印刷页码'),label=make('input');label.maxLength=40;label.placeholder='封面、1、附录A…';label.dataset.field='label';labelWrap.append(label);
    const noteWrap=make('label','本页说明'),note=make('textarea');note.maxLength=300;note.rows=2;note.dataset.field='note';noteWrap.append(note);
    const fields=make('div','','manual-page-row-fields');fields.append(positionLabel,labelWrap,noteWrap);
    const actions=make('div','','manual-page-row-actions');
    for(const [action,title]of [['up','上移'],['down','下移'],['replace','替换此页'],['remove','移出本册']]){const button=make('button',title,'manual-text-button');button.type='button';button.dataset.action=action;actions.append(button);}
    body.append(heading,name,fields,actions);row.append(thumb,body);
    row.addEventListener('click',event=>{
      const button=(event.target as Element).closest<HTMLButtonElement>('button[data-action]');if(!button||button.disabled)return;
      const index=pages.findIndex(page=>page.page_id===pageId),action=button.dataset.action;
      if(action==='view'){readerIndex=index;openReader();}
      else if(action==='up'||action==='down')move(pageId,index+(action==='up'?-1:1));
      else if(action==='replace'){if(!copies.checked){message('请先勾选图片副本筛选确认，再选择替换图片。','error');return;}replaceTarget=pageId;replacement.value='';replacement.click();}
      else if(action==='remove')void remove(pageId);
    });
    position.addEventListener('change',()=>move(pageId,Number(position.value)-1));
    position.addEventListener('keydown',event=>{if(event.key==='Enter'){event.preventDefault();position.blur();}});
    for(const input of [label,note])input.addEventListener('input',()=>{const page=pages.find(page=>page.page_id===pageId);if(!page)return;page[input.dataset.field as 'label'|'note']=input.value;changed();});
    return row;
  }
  function renderPages(){
    const list=$('manual-pages-list'),ids=new Set(pages.map(page=>page.page_id));
    for(const [id,row]of rowNodes)if(!ids.has(id)){row.remove();rowNodes.delete(id);}
    pages.forEach((page,index)=>{
      let row=rowNodes.get(page.page_id);if(!row){row=buildRow(page.page_id);rowNodes.set(page.page_id,row);}
      row.querySelector('.manual-page-heading')!.textContent=`第 ${index+1} 页${page.label?' · '+page.label:''}`;
      row.querySelector('.manual-page-filename')!.textContent=page.original_name;
      const thumb=row.querySelector('img')!,src=imagePath(page);if(thumb.getAttribute('src')!==src)thumb.src=src;thumb.alt=`预览第${index+1}页`;
      row.querySelector('button')!.setAttribute('aria-label',`预览第${index+1}页`);
      for(const button of row.querySelectorAll<HTMLButtonElement>('.manual-page-row-actions button'))button.setAttribute('aria-label',`第${index+1}页${button.textContent}`);
      for(const input of row.querySelectorAll<HTMLInputElement|HTMLTextAreaElement>('input,textarea')){
        const field=input.dataset.field;input.value=field==='position'?String(index+1):page[field as 'label'|'note']??'';
        input.setAttribute('aria-label',`第${index+1}页${field==='position'?'移至页序':field==='label'?'印刷页码':'本页说明'}`);if(field==='position')(input as HTMLInputElement).max=String(pages.length);
      }
      const next=list.children[index];if(next!==row)list.insertBefore(row,next??null);
    });
    updateUsage();refreshControls();if(!reader.hidden)renderReader();
  }
  function apply(snapshot:any){
    const data=validateSnapshot(snapshot);hooks.acceptRecord(data);record=data;readOnly=data.status!=='draft';if(readOnly)stopRequested=true;pages=data.images.map((page:Page)=>({...page}));layoutDirty=false;renderPages();
  }
  async function perform(operation:Operation,checkOwner=true){
    const retried=pending===operation;pending=operation;refreshControls();
    let rejected=false;
    try{
      if(checkOwner)await hooks.ensureOwner();
      if(retried&&!operation.confirmed){
        const status=await api(`/api/account/manual-drafts/${record.id}/pages/operations/${operation.key}`);
        if(status.id!==record.id||status.operation_id!==operation.key||typeof status.applied!=='boolean'||!Number.isSafeInteger(status.revision)||status.revision<1)throw new Error('页面操作回执无法核对，请稍后再查询本次结果。');
        if(status.applied)operation.confirmed=true;
        else if(status.revision!==operation.revision){pending=null;throw new Error('本次页面操作没有保存，资料已在其他窗口更新。本页队列、页序与页码仍保留，请使用上方“读取已保存版本”按钮，重新读取最新状态后再操作。');}
      }
      if(!operation.confirmed){
        operation.sent=true;
        let result;
        try{result=await api(operation.path,{method:'POST',body:operation.body});}catch(error){rejected=Boolean((error as any).status);throw error;}
        if(result.id!==record.id||result.operation_id!==operation.key)throw new Error('页面保存回执无法核对，请重试本次操作。');operation.confirmed=true;
      }
      const snapshot=await api(`/api/account/${workflowEnabled?'manual-submissions':'manual-drafts'}/${record.id}`);apply(snapshot);pending=null;refreshControls();return true;
    }catch(error){
      const issue=error as Error&{status?:number};
      if(!operation.sent||!retried&&!operation.confirmed&&rejected&&issue.status&&[400,401,403,404,409,413,415,428,429,503].includes(issue.status))pending=null;
      if(issue.status===401)hooks.unauthorized();
      message(pending?'暂未能核对页面保存结果，文件与本次操作已保留。请点击“核对并重试上次页面操作”；系统先查回执，避免重复加入。':issue.message,'error');refreshControls();return false;
    }
  }
  function uploadOperation(entry:QueueEntry):Operation{
    const body=new FormData();body.set('operation_id',entry.key);body.set('revision',String(record.revision));body.set('copies_confirmed','true');body.set('target_page_id',entry.target);body.set('images',entry.file,entry.file.name);
    return {key:entry.key,revision:record.revision,path:`/api/account/manual-drafts/${record.id}/pages/upload`,body,sent:false,confirmed:false,queueKey:entry.key};
  }
  function choose(selected:File[],target=''){
    if(blocked()||waiting()||layoutDirty||!copies.checked)return;
    if(!selected.length)return;
    if(selected.length>(target?1:manualPageLimits.queueFiles)){message(target?'替换时每次选择一张图片。':`每批最多${manualPageLimits.queueFiles}张，请分批选择。`,'error');return;}
    if(!target&&pages.length+selected.length>manualPageLimits.pages){message('选择后将超过每册200页，请减少本批数量。','error');return;}
    for(const file of selected)if(!/\.(jpe?g|png|webp)$/i.test(file.name)||/(master|original|raw|主档|原始)/i.test(file.name)||!file.size||file.size>manualPageLimits.imageBytes){message('只接收JPG、PNG、WebP筛选副本，每张最多5 MB；不接收原始主档。','error');return;}
    queue=selected.map(file=>({file,key:key(),target,state:'waiting'}));renderQueue();refreshControls();message(target?'替换图片已排入本批，请点击“开始上传”；原页面在新副本保存成功前保持原样。':`已选择${queue.length}张图片，点击“开始上传”，系统会逐张保存。`);
  }
  async function uploadBatch(){
    if(start.disabled)return;running=true;stopRequested=false;refreshControls();
    try{
      await hooks.ensureOwner();
      for(const entry of queue){
        if(stopRequested)break;if(entry.state==='done')continue;
        entry.state='uploading';entry.operation??=uploadOperation(entry);renderQueue();message(`正在保存 ${entry.file.name}，已完成${queue.filter(item=>item.state==='done').length}/${queue.length}张…`);
        const ok=await perform(entry.operation,false);entry.state=ok?'done':'error';if(ok)entry.operation=undefined;renderQueue();if(!ok)return;
      }
      message(readOnly&&waiting()?'本册已在其他窗口提交，后续上传已停止。未上传文件仍在本页，清空队列后可从进度页撤回再补充。':waiting()?`本批已暂停，已保存${queue.filter(entry=>entry.state==='done').length}张；剩余文件保留在本页，可继续上传。`:`本批${queue.length}张已全部保存为私密草稿。可继续选择下一批，或调整页序后预览整册。`,'ok');
    }catch(error){if((error as any).status===401)hooks.unauthorized();message((error as Error).message,'error');}
    finally{running=false;refreshControls();}
  }
  async function saveLayout(){
    if(saveOrder.disabled)return;
    const operation={key:key(),revision:record.revision,path:`/api/account/manual-drafts/${record.id}/pages`,body:null as unknown,sent:false,confirmed:false};
    operation.body={action:'reorder',operation_id:operation.key,revision:record.revision,pages:pages.map(page=>({page_id:page.page_id,label:page.label.trim(),note:page.note.trim()}))};
    running=true;refreshControls();const ok=await perform(operation);running=false;refreshControls();if(ok)message('页序、印刷页码与本页说明已保存为私密草稿。','ok');
  }
  async function remove(pageId:string){
    if(blocked()||waiting()||layoutDirty)return;
    if(!confirm('将这一页移出本册草稿？旧副本仍私密保留并计入容量，不会永久删除。'))return;
    const operation={key:key(),revision:record.revision,path:`/api/account/manual-drafts/${record.id}/pages`,body:null as unknown,sent:false,confirmed:false};operation.body={action:'remove',operation_id:operation.key,revision:record.revision,page_id:pageId};
    running=true;refreshControls();const ok=await perform(operation);running=false;refreshControls();if(ok)message('此页已移出本册，旧副本仍保留在私密收件区。','ok');
  }
  function renderReader(){
    const shown:Page[]=versionContext?.images??pages;
    if(reader.hidden)return;if(!shown.length){reader.hidden=true;return;}readerIndex=Math.min(Math.max(0,readerIndex),shown.length-1);
    const page=shown[readerIndex];jump.replaceChildren();shown.forEach((entry,index)=>{const option=make('option',`第${index+1}页${entry.label?' · '+entry.label:''}`);option.value=String(index);jump.append(option);});jump.value=String(readerIndex);
    $<HTMLButtonElement>('manual-pages-prev').disabled=readerIndex===0;$<HTMLButtonElement>('manual-pages-next').disabled=readerIndex===shown.length-1;
    const pdf=versionContext?versionContext.source_format==='pdf':record?.source_format==='pdf';
    $('manual-pages-reader-title').textContent=versionContext?pdf?'PDF已提交版本 · 只读':'已提交版本预览 · 只读':pdf?record?.status==='draft'?'PDF整册预览 · 私密草稿':'PDF整册预览 · 私密投稿':readOnly?'整册预览 · 私密投稿':'整册预览 · 私密草稿';
    $('manual-pages-reader-state').textContent=versionContext?`提交时的保存版${versionContext.revision}，共${shown.length}页；只读留存，不会覆盖当前草稿。`:layoutDirty?'按本页尚未保存的页序、页码预览；只包含已经上传的图片。':readOnly?`当前私密投稿共${shown.length}页；处理状态请查看上方“我的投稿与进度”。`:`已保存的私密草稿，第${record.revision}版；只包含已经上传的${pages.length}页，尚未提交审核。`;
    if(pdf)$('manual-pages-reader-state').textContent=versionContext?`提交保存版${versionContext.revision}，共${shown.length}页；来自该次PDF与处理配置的只读留存，不会覆盖当前草稿。`:`整册${shown.length}页，由PDF制作的私密阅读图片；${record.manual_pdf_generation?.preview?.source_current?'对应当前PDF':'保留的是上一次完整预览，当前PDF尚未完成新的生成'}。${record.status==='draft'?'请逐页核对，尚未提交审核。':'当前内容只读，处理反馈请查看上方投稿进度。'}`;
    $('manual-pages-reader-caption').textContent=`页序 ${readerIndex+1}/${shown.length}${page.source_page?' · 源PDF第'+page.source_page+'页':''}${page.label?' · 印刷页码 '+page.label:''}${page.note?' · '+page.note:''}`;
    image.alt=`说明书第${readerIndex+1}页${page.label?'，印刷页码'+page.label:''}`;
    const src=imagePath(page,versionContext);if(image.getAttribute('src')!==src){$('manual-pages-reader-error').hidden=true;image.src=src;}
  }
  function openReader(){if(!pages.length)return;versionContext=null;reader.hidden=false;renderReader();reader.scrollIntoView({block:'start',behavior:'smooth'});}
  files.addEventListener('change',()=>{choose(Array.from(files.files??[]));files.value='';});
  replacement.addEventListener('change',()=>{choose(Array.from(replacement.files??[]),replaceTarget);replacement.value='';replaceTarget='';});
  copies.addEventListener('change',refreshControls);start.addEventListener('click',()=>void uploadBatch());pause.addEventListener('click',()=>{stopRequested=true;message('当前这页完成后暂停，已保存页面会保留。');});
  clear.addEventListener('click',()=>{if(running||pending)return;queue=[];renderQueue();refreshControls();message('已清空本页队列，已经保存的图片仍在本册。');});
  retry.addEventListener('click',()=>void(async()=>{
    if(!pending||running)return;const operation=pending;running=true;refreshControls();const ok=await perform(operation);running=false;
    if(ok){const entry=queue.find(entry=>entry.key===operation.queueKey);if(entry){entry.state='done';entry.operation=undefined;}renderQueue();message(readOnly?'已核对本次页面操作，当前投稿内容只读；处理状态请查看上方投稿进度。':waiting()?'已核对并保存本次页面。剩余文件仍在本页，请点击“继续上传”。':'已核对本次页面操作，私密草稿保存成功。','ok');}refreshControls();
  })());
  saveOrder.addEventListener('click',()=>void saveLayout());$('manual-pages-open-reader').addEventListener('click',openReader);
  $('manual-pages-prev').addEventListener('click',()=>{readerIndex--;renderReader();});$('manual-pages-next').addEventListener('click',()=>{readerIndex++;renderReader();});jump.addEventListener('change',()=>{readerIndex=Number(jump.value);renderReader();});
  $('manual-pages-zoom').addEventListener('click',()=>{const actual=$('manual-pages-reader-viewport').classList.toggle('is-actual');$('manual-pages-zoom').setAttribute('aria-pressed',String(actual));$('manual-pages-zoom').textContent=actual?'适宽查看':'原尺寸查看';});
  image.addEventListener('error',()=>{$('manual-pages-reader-error').hidden=false;});image.addEventListener('load',()=>{image.width=image.naturalWidth;image.height=image.naturalHeight;$('manual-pages-reader-error').hidden=true;});
  refreshControls();
  return {
    refreshControls,hasUnsaved:()=>layoutDirty||running||Boolean(pending)||waiting(),canReload:()=>!running&&!pending,previewCurrent:openReader,
    previewVersion(version:any){if(!record?.versions?.some((v:any)=>v.revision===version.revision))return;if(!version.images.length){message('这次提交只有官网线索，请查看版本信息。');return;}versionContext=version;readerIndex=0;reader.hidden=false;renderReader();reader.scrollIntoView({block:'start',behavior:'smooth'});},
    loadRecord(data:any,enabled:boolean,isPaused:boolean,hasWorkflow=false){record=data;if(data)validateSnapshot(data);available=enabled;paused=isPaused;workflowEnabled=hasWorkflow;readOnly=Boolean(data)&&(data.status!=='draft'||data.source_format==='pdf');versionContext=null;pages=(data?.images??[]).map((page:Page)=>({...page}));layoutDirty=false;queue=[];pending=null;readerIndex=0;renderQueue();renderPages();
      message(!data?'先保存文字草稿，再上传说明书页面。':readOnly?'当前内容只读。需要补充时，请从上方投稿进度进入同一册草稿。':!enabled?'图片保存服务暂未开放，已有文字草稿仍可编辑。':isPaused?'图片暂时暂停保存，已上传页面仍可预览。':'图片仅保存到自己的私密草稿。可分批继续上传，或调整页序后预览。');},
  };
}
