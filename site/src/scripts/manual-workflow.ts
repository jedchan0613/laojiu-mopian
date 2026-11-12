import {accountFetch,setStatus} from './account-client';
import {manualConsentVersion,manualConsentStatements,manualSubmissionLabel,manualSubmissionProblems} from '../../../shared/manual-workflow.mjs';
import {renderManualMetadata} from './manual-preview';
import {isManualPdfReading,manualPdfConfirmationVersion,manualPdfConsentStatements} from '../../../shared/manual-pdf-review.mjs';
type Hooks={busy:()=>boolean;dirty:()=>boolean;ensureOwner:()=>Promise<void>;accept:(data:any)=>void;lock:(locked:boolean)=>void;unauthorized:()=>void;previewVersion:(version:any)=>void;previewCurrent:()=>void;refresh:()=>void};
type Operation={key:string;body:any;sent:boolean;confirmed:boolean};
const $=<T extends HTMLElement>(id:string)=>document.getElementById(id) as T;
const node=(tag:string,text='')=>{const element=document.createElement(tag);element.textContent=text;return element;};
const key=()=>Array.from(crypto.getRandomValues(new Uint8Array(32)),v=>v.toString(16).padStart(2,'0')).join('');
const date=(value:string)=>value?new Date(value).toLocaleString('zh-CN',{hour12:false}):'尚未提交';
export function createManualWorkflow(hooks:Hooks){
  let record:any=null,enabled=false,pdfEnabled=false,paused=false,running=false,lastLock=false,pending:Operation|null=null;
  const submit=$<HTMLButtonElement>('manual-workflow-submit'),edit=$<HTMLButtonElement>('manual-workflow-edit'),withdraw=$<HTMLButtonElement>('manual-workflow-withdraw'),discard=$<HTMLButtonElement>('manual-workflow-discard'),retry=$<HTMLButtonElement>('manual-workflow-retry'),select=$<HTMLSelectElement>('manual-workflow-version');
  const checks=Array.from(document.querySelectorAll<HTMLInputElement>('[data-manual-consent]'));
  const pdfChecks=Array.from(document.querySelectorAll<HTMLInputElement>('[data-manual-pdf-consent]'));
  const pdfReading=(value:any)=>value?.source_format==='pdf'&&isManualPdfReading(value);
  const pdfAllowed=()=>record?.source_format!=='pdf'||pdfEnabled;
  const versions=()=>record?.versions?.filter((v:any)=>v.manual_metadata)??[];
  const selected=()=>versions().find((v:any)=>v.revision===Number(select.value));
  function message(value:string,tone:'info'|'ok'|'error'='info'){setStatus($('manual-workflow-status'),value,tone);setStatus($('manual-workflow-submit-status'),value,tone);}
  function refreshControls(){
    const blocked=hooks.busy()||hooks.dirty()||running||Boolean(pending),draft=record?.status==='draft';
    const needsPdf=pdfReading(record),pdfReady=!needsPdf||record?.manual_pdf_review?.can_submit===true;
    submit.disabled=!enabled||!record||!draft||paused||blocked||!pdfAllowed()||!pdfReady||checks.some(check=>!check.checked)||needsPdf&&pdfChecks.some(check=>!check.checked);
    submit.textContent=record?.manual_draft_reason==='supplement'?'确认重新提交补充版本':'确认提交审核';
    for(const check of [...checks,...pdfChecks])check.disabled=!enabled||!draft||paused||blocked||!pdfAllowed()||!pdfReady;
    edit.hidden=!record||!['needs_info','declined','withdrawn'].includes(record.status)||Boolean(record.linked_item_id||record.manual_in_preparation);edit.disabled=!enabled||paused||blocked;
    edit.textContent=record?.status==='needs_info'?'按要求补充':record?.status==='declined'?'修改后重新提交':'恢复为草稿';
    withdraw.hidden=!record||!['pending','approved'].includes(record.status);withdraw.disabled=!enabled||blocked||Boolean(record?.withdrawal_requested);withdraw.textContent=record?.manual_in_preparation||record?.linked_item_id?'申请停止处理':'撤回并修改';
    discard.hidden=!draft||Boolean(record?.linked_item_id);discard.disabled=!enabled||blocked;$('manual-workflow-discard-note').hidden=discard.hidden;
    retry.hidden=!pending||running;retry.disabled=running||hooks.busy();
    $('manual-workflow-consents').hidden=!draft||!pdfAllowed();$('manual-workflow-pdf-confirmations').hidden=!draft||!needsPdf||!pdfAllowed();$('manual-review-submit').hidden=Boolean(record)&&!draft&&!pending;
    $('manual-workflow-official-pdf-note').hidden=!draft||record?.source_format!=='pdf'||record?.manual_metadata?.sharing_scope!=='official-link';
    $('manual-workflow-go-submit').hidden=!draft||!pdfAllowed();$<HTMLButtonElement>('manual-workflow-read-current').disabled=!record?.images?.length;
    $<HTMLButtonElement>('manual-workflow-refresh').disabled=!record||running||Boolean(pending)||hooks.busy();
    $<HTMLButtonElement>('manual-workflow-read-version').disabled=!selected()?.images?.length;
    const lock=running||Boolean(pending);if(lock!==lastLock){lastLock=lock;hooks.lock(lock);}
  }
  function renderHistory(){
    const labels:Record<string,string>={submitted:'提交审核',review:'收到处理反馈',manual_supplement_started:'开始补充资料',withdrawn_to_draft:'撤回并回到草稿',draft_discarded:'已停止处理',withdrawal_requested:'申请停止处理',change_request_review:'申请处理反馈',manual_draft_created:'已进入未公开整理草稿',manual_pdf_generated:'PDF整册生成完成',manual_pdf_labels_saved:'已保存PDF纸面页码'};
    const list=$('manual-workflow-history-list');list.replaceChildren();const rows=(record?.history??[]).filter((row:any)=>labels[row.action]).slice(-30).reverse();
    for(const row of rows){const item=node('li',`${date(row.at)} · ${labels[row.action]}${row.public_message?'\n'+row.public_message:''}`);list.append(item);}if(!rows.length)list.append(node('li','还没有提交或处理记录。'));
  }
  function versionSummary(){const version=selected();$('manual-workflow-version-summary').textContent=version?`${date(version.at)} · 保存版${version.revision} · ${version.images.length}页 · ${version.action==='supplemented'?'补充后重新提交':'提交审核'}；此版本只读，不会覆盖当前草稿。`:'';refreshControls();}
  function render(){
    $('manual-workflow-summary').textContent=!record?'新建说明书草稿 · 尚未提交':`${manualSubmissionLabel(record)} · 投稿编号 ${record.id} · 当前保存版${record.revision}`;
    const notice=$('manual-workflow-message');notice.hidden=!record?.public_message;notice.textContent=record?.public_message?'站主的说明：'+record.public_message:'';
    const pdfNotice=$('manual-workflow-pdf-note'),pdfIssues=record?.source_format==='pdf'&&record.status!=='draft'?record.manual_pdf_review?.problems??[]:[];pdfNotice.hidden=!pdfIssues.length;pdfNotice.textContent=pdfIssues.length?`${record.status==='approved'?'旧PDF审核已失效，需重新核对。':'当前PDF仍需核对。'}\n${pdfIssues.join('\n')}\n可以撤回到同一编号的草稿，重新生成并确认后再提交。`:'';
    const issues=record?.status==='draft'?[...manualSubmissionProblems(record.manual_metadata,record.images.length),...(record.source_format==='pdf'?!pdfEnabled?['PDF送审目前仅在已更新的本地服务开放。']:record.manual_pdf_review?.problems??['请先生成并核对当前PDF整册。']:[])]:[],list=$('manual-workflow-problems');list.replaceChildren();for(const issue of issues)list.append(node('li',issue));list.hidden=!issues.length;
    renderHistory();const entries=versions();$('manual-workflow-versions').hidden=!entries.length;select.replaceChildren();
    for(const version of [...entries].reverse()){const option=node('option',`${date(version.at)} · 保存版${version.revision} · ${version.images.length}页`) as HTMLOptionElement;option.value=String(version.revision);select.append(option);}versionSummary();
  }
  async function api(path:string,options:{method?:string;body?:unknown}={}){
    const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),60000);try{return await accountFetch(path,{...options,signal:controller.signal});}finally{clearTimeout(timer);}
  }
  async function perform(operation:Operation){
    const retried=pending===operation;pending=operation;running=true;refreshControls();let rejected=false;
    try{
      await hooks.ensureOwner();
      if(retried&&!operation.confirmed){
        const receipt=await api(`/api/account/manual-submissions/${record.id}/operations/${operation.key}`);
        if(receipt.id!==record.id||receipt.operation_id!==operation.key||typeof receipt.applied!=='boolean'||!Number.isSafeInteger(receipt.revision))throw new Error('投稿回执无法核对，请稍后重试本次操作。');
        if(receipt.applied)operation.confirmed=true;
        else if(receipt.revision>operation.body.revision){pending=null;throw new Error('这次操作没有保存，投稿已在其他窗口更新。本页内容仍保留，请点击“刷新状态”核对最新内容。');}
      }
      if(!operation.confirmed){operation.sent=true;let result;try{result=await api(`/api/account/manual-submissions/${record.id}/operate`,{method:'POST',body:operation.body});}catch(error){rejected=Boolean((error as any).status);throw error;}
        if(result.id!==record.id||result.operation_id!==operation.key)throw new Error('投稿保存回执无法核对，请重试本次操作。');operation.confirmed=true;}
      const saved=await api(`/api/account/manual-submissions/${record.id}`);if(saved.id!==record.id||saved.submission_kind!=='manual')throw new Error('投稿结果无法核对，请重试本次操作。');
      pending=null;hooks.accept(saved);message(saved.status==='draft'?'已回到同一编号的草稿。补充并保存后，请重新逐项确认并提交。':saved.status==='withdrawn'?'草稿已停止，内容与图片仍私密保留，需要时可恢复为草稿。':saved.status==='pending'?'本次提交已保存，等待处理。可以查看只读版本与后续反馈。':'操作结果已核对，请查看当前状态与站主说明。','ok');
    }catch(error){const issue=error as Error&{status?:number};
      if(!operation.sent||!retried&&!operation.confirmed&&rejected&&issue.status&&[400,401,403,404,409,413,415,428,429,503].includes(issue.status))pending=null;
      if(issue.status===401)hooks.unauthorized();message(pending?'暂未能核对投稿操作结果，本页状态已保留。请点击“核对并重试上次投稿操作”，系统会先查询回执。':issue.message,'error');
    }finally{running=false;refreshControls();}
  }
  function operate(action:string){
    if(!record||!enabled||hooks.busy()||hooks.dirty()||running||pending)return;
    const body:any={action,operation_id:key(),revision:record.revision};
    if(action==='submit'){
      if(!pdfAllowed()){message('PDF送审目前仅在已更新的本地服务开放。','error');return;}
      if(pdfReading(record)){
        if(!record.manual_pdf_review?.can_submit){message((record.manual_pdf_review?.problems??['请先生成并核对当前PDF整册。']).join('\n'),'error');return;}
        const confirmed=Object.fromEntries(pdfChecks.map(check=>[check.dataset.manualPdfConsent,check.checked]));
        if(!Object.keys(manualPdfConsentStatements).every(name=>confirmed[name]===true)){message('请逐项确认本次生成的PDF整册、外观和提供范围。','error');return;}
        body.pdf_confirmation={version:manualPdfConfirmationVersion,token:record.manual_pdf_review.confirmation_token,checks:confirmed};
      }
      const issues=manualSubmissionProblems(record.manual_metadata,record.images.length);if(issues.length){message(issues.join('\n'),'error');return;}
      body.consent_version=manualConsentVersion;body.consents=Object.fromEntries(checks.map(check=>[check.dataset.manualConsent,check.checked]));
      if(!Object.keys(manualConsentStatements).every(name=>body.consents[name]===true)){message('请逐项阅读并确认后再提交。','error');return;}
    }
    void perform({key:body.operation_id,body,sent:false,confirmed:false});
  }
  submit.addEventListener('click',()=>operate('submit'));edit.addEventListener('click',()=>operate('edit'));withdraw.addEventListener('click',()=>operate('withdraw'));discard.addEventListener('click',()=>operate('discard'));retry.addEventListener('click',()=>{if(pending&&!running)void perform(pending);});
  [...checks,...pdfChecks].forEach(check=>check.addEventListener('change',refreshControls));select.addEventListener('change',()=>{$('manual-workflow-version-preview').hidden=true;versionSummary();});
  $('manual-workflow-view-version').addEventListener('click',()=>{const version=selected();if(!version)return;$('manual-workflow-version-preview').hidden=false;$('manual-workflow-version-preview-title').textContent=`该次提交的信息 · 保存版${version.revision} · 只读`;renderManualMetadata($('manual-workflow-version-metadata'),version.manual_metadata);if(version.pdf_summary)$('manual-workflow-version-metadata').append(node('p',`由PDF制作的私密阅读副本 · ${version.pdf_summary.pages}页 · ${version.pdf_summary.profile==='detail'?'精细核对':'标准清晰'}。本次提交的源文件与处理记录私密留存，不提供下载。`));$('manual-workflow-version-preview').scrollIntoView({block:'start',behavior:'smooth'});});
  $('manual-workflow-read-version').addEventListener('click',()=>{const version=selected();if(version)hooks.previewVersion(version);});$('manual-workflow-read-current').addEventListener('click',hooks.previewCurrent);
  $('manual-workflow-refresh').addEventListener('click',hooks.refresh);
  refreshControls();
  return {refreshControls,hasUnsaved:()=>running||Boolean(pending),canReload:()=>!running&&!pending,
    load(data:any,active:boolean,isPaused:boolean,pdfActive=false){record=data;enabled=active;pdfEnabled=pdfActive;paused=isPaused;[...checks,...pdfChecks].forEach(check=>{check.checked=false;});$('manual-workflow-version-preview').hidden=true;render();refreshControls();message(!active?'投稿进度服务暂未开放，请更新并重启本地服务后重试。':!data?'先保存草稿，再查看提交前需要补充的内容。':data.status==='draft'?pdfReading(data)?'请先生成并逐页核对当前PDF整册，保存纸面页码后，重新逐项确认提交。':'请先保存文字、页序并完成上传，再逐项确认提交。':data.status==='withdrawn'?'本册已停止处理，保存内容只读；需要时可恢复为草稿。':'本次已提交内容只读。后续反馈会显示在此，不代表已经公开。');},
  };
}
