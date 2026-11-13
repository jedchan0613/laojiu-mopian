// 说明书维护界面。用户文字只通过textContent/表单值显示；只保存操作编号用于结果核对。
const $=id=>document.getElementById(id);
const el=(tag,text='',className='')=>{const node=document.createElement(tag);if(text)node.textContent=text;if(className)node.className=className;return node;};
const pendingKey='ljm-manuals-pending-v1';
const state={data:null,catalog:null,tab:'documents',selected:null,dirty:false,busy:false,review:null,uncertain:false,pending:readPending(),observed:null,querying:false,cancelling:false};
const names={brands:'品牌',models:'型号',documents:'说明书'};
const keyFor={brands:'brand_key',models:'model_key',documents:'manual_key'};
function message(text,error=false){$('message').textContent=text;$('message').dataset.error=String(error);}
function invalidate(){state.review=null;$('approval').hidden=true;$('review-results').replaceChildren();$('review-panel').hidden=true;}
function changed(){state.dirty=true;invalidate();status();}
const canEdit=()=>Boolean(state.data&&!state.pending&&!state.observed&&(state.data.context?.capabilities?.manualsDraftMaintenanceVersion===1||state.data.context?.capabilities?.manualsMaintenanceVersion===1)&&['ready','needs-initialization'].includes(state.data.readiness?.status));
const canPublish=()=>canEdit()&&state.data.context?.publicationEnabled===true;
const online=()=>state.data?.context?.adminMode==='online';
function status(){if(!state.data)return;const count=state.data.state.published.documents.filter(d=>d.publication_status!=='withdrawn').length;$('workspace-status').textContent=['blocked','busy'].includes(state.data.readiness?.status)?state.data.readiness.message:`${online()?'线上':'本地'}正式目录 ${count} 份 · ${state.dirty?'有未保存修改':state.data.state.draft?'已有目录草稿，尚未发布':'当前没有未发布草稿'}`;}
function applyControls(){
  $('editor-fields').disabled=state.busy||!canEdit();$('add').disabled=state.busy||!canEdit();
  $('save').disabled=state.busy||!canEdit()||state.uncertain||(state.data?.readiness?.status==='needs-initialization'&&!$('initialize-empty').checked);
  $('review').hidden=!canPublish();$('review').disabled=state.busy||!canPublish()||state.uncertain;
  $('publish').disabled=state.busy||!canPublish()||state.uncertain;
  $('initialize-empty').disabled=state.busy||!canEdit();
  for(const node of document.querySelectorAll('[data-tab],#library-search'))node.disabled=state.busy||!state.data;
  for(const node of document.querySelectorAll('[data-history-restore]'))node.disabled=state.busy||!canPublish()||state.uncertain;
  const pending=state.pending||state.observed;$('operation-panel').hidden=!pending;
  if(pending){$('operation-id').textContent=pending.operationId;$('operation-query').disabled=state.querying;$('operation-stop').hidden=state.uncertain;$('operation-stop').disabled=state.cancelling;$('operation-resolve').hidden=!state.pending||!state.uncertain;$('operation-resolve').disabled=state.busy||state.querying;$('operation-resolution-note').hidden=!state.uncertain;}
}
function readPending(){try{const value=JSON.parse(sessionStorage.getItem(pendingKey)||'null');return value&&/^[a-f0-9-]{36}$/.test(value.operationId)&&/^[a-f0-9-]{36}$/.test(value.stepId)&&['save','publish','withdraw','restore'].includes(value.action)?value:null;}catch{return null;}}
function remember(value){state.pending=value;state.observed=null;try{if(value)sessionStorage.setItem(pendingKey,JSON.stringify({operationId:value.operationId,stepId:value.stepId,action:value.action}));else sessionStorage.removeItem(pendingKey);}catch{}applyControls();}
function operationMessage(text){$('operation-status').textContent=text;}
const phases={prepared:'正在保留原版本',building:'正在构建和检查网站',built:'构建完成，正在核对发布条件','public-switch-intent':'正在准备采用新公开版本','public-switched':'公开版本已切换，正在核对维护记录',complete:'操作已完成','rolled-back':'本次未采用，原公开版本和草稿已保留','needs-review':'结果仍待维护者核对，写入已暂停'};
async function getOperation(handle){
  const response=await fetch('/api/operations/'+encodeURIComponent(handle.operationId),{cache:'no-store'});const data=await response.json();if(!response.ok)throw new Error(data.error||'暂时无法查询操作结果。');
  const operation=data.operations.find(row=>row.stepId===handle.stepId),summary=data.manuals?.find(row=>row.stepId===handle.stepId);
  if(summary)operationMessage(phases[summary.phase]||'正在核对操作记录');else if(operation)operationMessage(operation.status==='queued'?'请求已登记，正在等待处理':operation.status==='running'?'操作正在进行，请等待实际结果':'正在核对操作结果');
  return operation;
}
function terminal(operation){
  if(!operation)return null;
  if(operation.status==='succeeded'){remember(null);state.observed=null;state.uncertain=false;return {operation,revision:operation.result?.revision};}
  if(['failed','cancelled'].includes(operation.status)){remember(null);state.observed=null;state.uncertain=false;invalidate();throw new Error(operation.errorCode==='MANUALS_NOT_STARTED'?'原请求未开始且已封住，没有再次执行。':operation.errorCode==='OPERATION_CANCELLED'?'操作已停止，请核对原公开版本和保留草稿。':'本次操作未完成，请重新读取并核对保留的草稿。');}
  if(operation.status==='needs_review'){state.uncertain=true;throw new Error('操作结果仍待核对，不会重新执行。请查询或核对异常结果；无法证明时由维护者检查保留记录。');}
  return null;
}
async function request(route,payload){
  const action=route.slice(1),tracked=payload&&['save','publish','withdraw','restore'].includes(action);
  if(tracked&&state.pending)throw new Error('上次维护结果尚未核对，请先查询结果，不能重新发送。');
  const handle={operationId:crypto.randomUUID(),stepId:crypto.randomUUID(),action};
  if(tracked){remember(handle);operationMessage(['publish','withdraw'].includes(action)?'已发送维护请求，正在构建和核对；不会重复发布。':'正在保存私密维护记录。');}
  let settled=null;const controller=new AbortController();
  const http=fetch('/api/manuals'+route,{cache:'no-store',signal:controller.signal,...(payload?{method:'POST',headers:{'content-type':'application/json','x-ljm-admin-request':'1','x-ljm-operation-id':handle.operationId,'x-ljm-step-id':handle.stepId},body:JSON.stringify(payload)}:{})}).then(async response=>({response,result:await response.json()})).catch(error=>({error})).then(value=>{settled=value;return value;});
  if(!tracked){const value=await http;if(value.error)throw new Error('暂时无法读取维护资料，请核对登录状态后重试。');if(!value.response.ok)throw new Error(value.result.error||'操作未完成。');return value.result;}
  let misses=0,emptyResults=0;
  try{
    for(;;){
      if(!settled)await Promise.race([http,new Promise(resolve=>setTimeout(resolve,1000))]);
      if(settled?.response?.ok){const done=terminal(settled.result.operation);if(done)return {...settled.result,...done};state.uncertain=true;throw new Error('响应中缺少可核对的回执，请先查询结果。');}
      let operation;
      try{operation=await getOperation(handle);misses=0;}catch{if(++misses>=3){state.uncertain=true;throw new Error('暂时无法确认结果，操作编号已保留。恢复连接后查询，不会重新发布。');}}
      const done=terminal(operation);if(done)return done;
      if(operation)emptyResults=0;
      if(settled?.response&&!settled.response.ok&&!operation&&settled.response.status<500){remember(null);throw new Error(settled.result.error||'请求未被接受，当前输入保留。');}
      if(settled?.response&&!settled.response.ok&&!operation&&++emptyResults>=3){state.uncertain=true;throw new Error('服务器返回错误，尚未找到可核对的结果。操作编号已保留，请查询或核对异常结果；不会自动重发。');}
      if(settled?.error&&!operation){state.uncertain=true;throw new Error('连接中断，尚未找到操作结果。请查询或核对异常结果，原请求不会自动重发。');}
      if(settled)await new Promise(resolve=>setTimeout(resolve,1000));
    }
  }finally{controller.abort();applyControls();}
}
async function run(callback){if(state.busy)return;state.busy=true;const controls=[...document.querySelectorAll('button,input,select,textarea')].map(node=>[node,node.disabled]);for(const [node]of controls)node.disabled=true;applyControls();try{await callback();}catch(error){message(error.message||'请求未完成，请核对操作结果。',true);}finally{state.busy=false;for(const [node,disabled]of controls)if(node.isConnected)node.disabled=disabled;applyControls();}}
async function load(){
  const data=await request('');state.data=data;state.catalog=structuredClone(data.state.draft??data.state.published);state.dirty=false;if(!state.pending)state.uncertain=false;invalidate();
  if(!state.pending&&data.activeOperations?.length){const active=data.activeOperations[0];state.observed={operationId:active.operationId,stepId:active.stepId,action:active.kind.slice(8)};operationMessage('有维护操作正在进行，可以查询结果。');}else if(!data.activeOperations?.length)state.observed=null;
  $('maintenance-mode').textContent=online()?(data.context.publicationEnabled?'老旧默片 · 线上说明书维护':'老旧默片 · 线上草稿维护'):'老旧默片 · 本地工作台';
  $('maintenance-note').textContent=online()?(data.context.publicationEnabled?'先保存和预览，完成发布前检查及人工确认后才更新公开说明书库。新图片继续走既有入站和隐私审核。':'当前环境支持编辑、保存和预览私密草稿，正式发布暂不可用。新图片须先经既有入站审核；本页只关联已公开发布副本。'):'本机维护先保存草稿，再检查和确认发布。新图片先经既有入站审核，本页只关联已公开发布副本；原始主档不进入这里。';
  $('publication-impact').textContent=online()?'已查看本次新增、修改及移除影响，同意更新公开说明书库。':'已查看本次新增、修改及移除影响，同意生成本地正式目录。';
  $('publish').textContent=online()?'确认并正式发布':'确认并生成本地正式目录';
  $('withdraw-confirm-label').textContent=online()?'我已核对影响，同意从公开说明书库撤下；保留历史和原档案。':'我已核对影响，同意从本地正式说明书目录撤下；保留历史和原档案。';
  const link=$('public-library-link');if(data.context?.publicSiteUrl){link.href=new URL('/manuals/',data.context.publicSiteUrl).href;link.hidden=false;}else{link.hidden=true;link.removeAttribute('href');}
  $('initialization-panel').hidden=data.readiness?.status!=='needs-initialization';$('initialize-empty').checked=false;
  const linkedManual=new URLSearchParams(location.search).get('manual');if(!state.selected&&linkedManual&&state.catalog.documents.some(d=>d.manual_key===linkedManual)){state.tab='documents';state.selected=linkedManual;}
  if(!state.catalog[state.tab].some(row=>row[keyFor[state.tab]]===state.selected))state.selected=null;
  renderList();renderEditor();renderHistory();status();
  if(data.readiness?.status==='blocked')message(data.readiness.message,true);
  else if(data.pending.length&&data.readiness?.status!=='busy')message('有中断的发布需要核对，暂时不能继续写入；历史和发布前备份仍保留。',true);
  applyControls();
}
const brandLabel=key=>state.catalog.brands.find(b=>b.brand_key===key)?.name||'品牌未填写';
const modelLabel=key=>{const m=state.catalog.models.find(m=>m.model_key===key);return m?`${brandLabel(m.brand_key)} ${m.model_text||'型号未填写'}`:'型号未关联';};
function title(row){return state.tab==='brands'?row.name||'未填写品牌':state.tab==='models'?`${brandLabel(row.brand_key)} ${row.model_text||'未填写型号'}`:`${row.model_keys.map(modelLabel).join('、')||'未关联型号'} · ${state.data.choices.kinds[row.document_kind]||'用途未选'}`;}
function renderList(){
  const list=$('library-list');list.replaceChildren();if(!state.catalog)return;const query=$('library-search').value.normalize('NFKC').toLowerCase().trim();const records=state.catalog[state.tab].filter(row=>[title(row),row.edition_display,row[keyFor[state.tab]]].join(' ').normalize('NFKC').toLowerCase().includes(query));
  list.append(el('p',`${records.length} 条${names[state.tab]}`,'record-count'));
  for(const row of records){const key=row[keyFor[state.tab]],button=el('button','','record-button');button.type='button';button.setAttribute('aria-current',String(key===state.selected));button.append(el('strong',title(row)),el('small',state.tab==='documents'?`${row.edition_display||'版本待填'} · ${row.publication_status==='withdrawn'?'已撤下':state.data.state.published.documents.some(d=>d.manual_key===key&&d.publication_status!=='withdrawn')?'已有正式版本':'待审草稿'}`:key));button.onclick=()=>{state.selected=key;renderList();renderEditor();};list.append(button);}
}
function bind(label,row,key,{type='text',max=200,hint='',options=null,wide=false,lines=3,onChange=null}={}){
  const box=el('label',label,wide?'wide':'');let input;
  if(options){input=el('select');input.append(new Option('请选择',''));for(const [value,text]of options)input.append(new Option(text,value));input.value=row[key]||'';}
  else{input=el(type==='textarea'?'textarea':'input');if(type==='textarea')input.rows=lines;else input.type=type;input.maxLength=max;input.value=row[key]??'';}
  input.setAttribute('aria-label',label);
  const event=options?'change':'input';input.addEventListener(event,()=>{row[key]=input.value;changed();if(onChange)onChange();});box.append(input);if(hint)box.append(el('span',hint,'hint'));return box;
}
function arrayField(label,row,key,max=100){const proxy={value:(row[key]??[]).join('\n')};const field=bind(label,proxy,'value',{type:'textarea',max:8000,hint:'每行一项；不确定的别名不要填写。'});field.querySelector('textarea').addEventListener('input',()=>{row[key]=proxy.value.split(/\r?\n/).map(v=>v.trim()).filter(Boolean);if(row[key].some(v=>v.length>max))message('其中一项过长，请缩短后保存。',true);});return field;}
const section=(title)=>{const fieldset=el('fieldset');fieldset.append(el('legend',title));return fieldset;};
function button(text,action,{className='',disabled=false}={}){const b=el('button',text,className);b.type='button';b.disabled=disabled;b.onclick=action;return b;}
function blankDoc(){return {manual_key:'manual-'+crypto.randomUUID(),model_keys:[],document_kind:'user-guide',languages:['zh-CN'],region_display:'地区未注明',edition_display:'版本未注明',edition_date:'',completeness:'unverified',missing_note:'',linked_archive_id:'',page_map:[],contents:[],keywords:[],catalogue_summary:'',official_sources:[],publication_status:'draft',applicability_basis:'',display_basis:'',review_note:''};}
function add(){if(!state.catalog)return;let row;if(state.tab==='brands')row={brand_key:'brand-'+crypto.randomUUID(),name:'',aliases:[],evidence:''};else if(state.tab==='models')row={model_key:'model-'+crypto.randomUUID(),brand_key:'',model_text:'',model_aliases:[],product_name:'',category_key:'',product_era_display:'',evidence:''};else row=blankDoc();state.catalog[state.tab].push(row);state.selected=row[keyFor[state.tab]];changed();renderList();renderEditor();$('manual-editor').focus();}
function removeSelected(row){
  const key=row[keyFor[state.tab]];
  if(state.tab==='brands'&&state.catalog.models.some(m=>m.brand_key===key)||state.tab==='models'&&state.catalog.documents.some(d=>d.model_keys.includes(key))){message('该条目仍被型号或说明书引用，请先处理关联。',true);return;}
  if(!confirm(`将“${title(row)}”从当前编辑目录移除？保存前版本会保留在历史中；本次不删除档案和图片，正式目录只有再次确认发布后才改变。`))return;
  state.catalog[state.tab]=state.catalog[state.tab].filter(v=>v[keyFor[state.tab]]!==key);state.selected=null;changed();renderList();renderEditor();
}
function renderEditor(){
  const editor=$('manual-editor');editor.replaceChildren();const row=state.catalog?.[state.tab].find(v=>v[keyFor[state.tab]]===state.selected);
  if(!row){const box=el('div','','empty');box.append(el('h2','选择或新增一条资料'),el('p','先建品牌和型号，再新增说明书。每次修改先保存草稿；保存不会直接公开。'));editor.append(box);return;}
  const heading=el('div','','editor-heading'),label=el('div');label.append(el('h2',`编辑${names[state.tab]}`),el('p',row[keyFor[state.tab]],'editor-key'));heading.append(label);const actions=el('div','','mini-actions');
  if(state.tab==='documents'){
    actions.append(button('预览已保存资料',()=>{if(state.dirty){message('请先保存目录草稿，再预览已保存版本。',true);return;}const url=new URL('/admin/manuals-preview.html',location.origin);url.searchParams.set('manual',row.manual_key);url.searchParams.set('revision',state.data.revision);window.open(url.href,'_blank','noopener');}));
    const published=state.data.state.published.documents.some(d=>d.manual_key===row.manual_key&&d.publication_status!=='withdrawn');
    if(published&&canPublish())actions.append(button('撤下正式版本',()=>{if(state.dirty){message('请先保存当前修改，再撤下正式版本。',true);return;}$('withdraw-impact').textContent=`将从${online()?'公开说明书库':'本地正式说明书目录'}移除“${title(row)}”。当前草稿中同一条目也会标记撤下，其他草稿保留；原档案和图片不删除。`;$('withdraw-reason').value='';$('withdraw-confirm').checked=false;$('withdraw-dialog').showModal();},{className:'danger'}));
  }
  actions.append(button('从当前草稿移除',()=>removeSelected(row),{className:'quiet'}));heading.append(actions);editor.append(heading);
  if(state.tab==='brands'){
    const group=el('div','','form-grid');group.append(bind('品牌名称',row,'name',{max:100,onChange:renderList}),arrayField('核定别名',row,'aliases'),bind('品牌与别名核对依据（仅管理端）',row,'evidence',{type:'textarea',max:2000,wide:true,hint:'记录厂家页面、品牌标识或资料中的位置，不猜测品牌关系。'}));editor.append(group);return;
  }
  if(state.tab==='models'){
    const group=el('div','','form-grid');group.append(bind('所属品牌',row,'brand_key',{options:state.catalog.brands.map(b=>[b.brand_key,b.name||'未填品牌']),onChange:renderList}),bind('机身完整型号',row,'model_text',{max:100,onChange:renderList}),bind('物件名称',row,'product_name',{max:120}),bind('品类',row,'category_key',{options:Object.entries(state.data.choices.categories)}),bind('产品年代',row,'product_era_display',{max:80,hint:'不能核实可留空，不以接收日期代替。'}),arrayField('核定型号写法',row,'model_aliases'),bind('型号与写法依据（仅管理端）',row,'evidence',{type:'textarea',max:2000,wide:true,hint:'说明完整型号和别名的来源；相近型号不能自动合并。'}));editor.append(group);return;
  }
  if(row.publication_status==='withdrawn')editor.append(el('p','此条目已标记撤下，不会随目录发布。需要恢复时，从下方历史恢复为草稿后重新核对。','inline-help'));
  const base=section('版本与适用范围'),grid=el('div','','form-grid');
  const models=el('div','','wide');models.append(el('p','明确适用型号'));const choices=el('div','','choice-list');if(!state.catalog.models.length)choices.append(el('p','请先在左侧“型号”中新增型号。','hint'));
  for(const model of state.catalog.models){const label=el('label','','check'),check=el('input');check.type='checkbox';check.checked=row.model_keys.includes(model.model_key);check.onchange=()=>{row.model_keys=check.checked?[...row.model_keys,model.model_key]:row.model_keys.filter(k=>k!==model.model_key);changed();renderList();};label.append(check,el('span',modelLabel(model.model_key)));choices.append(label);}models.append(choices);grid.append(models);
  grid.append(bind('文档用途',row,'document_kind',{options:Object.entries(state.data.choices.kinds),onChange:renderList}),bind('资料版本',row,'edition_display',{max:150,onChange:renderList}),bind('适用地区',row,'region_display',{max:120}),bind('明确标注的文档日期',row,'edition_date',{type:'date',max:10,hint:'资料没有标注时留空。'}));
  const languages=el('div','','wide');languages.append(el('p','原文语言'));const languageChoices=el('div','','actions');for(const [key,text]of Object.entries(state.data.choices.languages)){const label=el('label','','check'),input=el('input');input.type='checkbox';input.checked=row.languages.includes(key);input.onchange=()=>{row.languages=input.checked?[...row.languages,key]:row.languages.filter(k=>k!==key);changed();};label.append(input,el('span',text));languageChoices.append(label);}languages.append(languageChoices);grid.append(languages);
  grid.append(bind('完整程度',row,'completeness',{options:Object.entries(state.data.choices.completeness)}),bind('缺页说明',row,'missing_note',{type:'textarea',max:500,hint:'有缺页时写明已知情况，不能把页序当作印刷页码。'}),bind('适用型号核对依据（仅管理端）',row,'applicability_basis',{type:'textarea',max:2000,wide:true,hint:'记录手册封面、型号列表或厂家页面中的明确依据。'}),arrayField('查询关键词',row,'keywords',120));base.append(grid);editor.append(base);
  const official=section('官方来源');official.append(el('p','可登记多个来源。这里只检查网址格式，不会自动访问外站；需由维护者核对实际页面与型号。','hint'));
  row.official_sources.forEach((source,index)=>{const box=el('div','','repeater'),head=el('div','','repeater-head');head.append(el('h3',`来源 ${index+1}`),button('移除此来源',()=>{row.official_sources.splice(index,1);changed();renderEditor();},{className:'quiet'}));box.append(head);const inputs=el('div','','form-grid');inputs.append(bind('来源名称',source,'name',{max:100}),bind('官方HTTPS网址',source,'url',{type:'url',max:2048}),bind('最近核对日期',source,'checked_on',{type:'date',max:10}));const available=el('label','','check'),check=el('input');check.type='checkbox';check.checked=source.available;check.onchange=()=>{source.available=check.checked;changed();};available.append(check,el('span','最近核对时该入口可用'));inputs.append(available,bind('来源与型号核对依据（仅管理端）',source,'evidence',{type:'textarea',max:2000,wide:true}));box.append(inputs);official.append(box);});official.append(button('增加官方来源',()=>{row.official_sources.push({name:'',url:'',checked_on:'',available:false,evidence:''});changed();renderEditor();}));editor.append(official);
  const pdfFixed=Boolean(row.source_pdf_digest),reader=section('站内逐页阅读');reader.append(el('p',pdfFixed?'本册来自已审核PDF。关联档案、整册页序和纸面页码保持只读，可以补充阅读目录。如需换页或改动纸面页码，请暂停发布，核对修正后的整份PDF并重新审核。':'只引用已公开馆藏。要增加或替换图片，请先在档案管理中按待入站、隐私检查和人工批准流程处理，再回到这里关联。','inline-help'));
  const archiveOptions=state.data.archives.map(a=>[a.item_id,`${a.item_id} · ${a.title}`]);if(row.linked_archive_id&&!state.data.archives.some(a=>a.item_id===row.linked_archive_id))archiveOptions.push([row.linked_archive_id,`${row.linked_archive_id} · 当前引用（尚未通过公开检查）`]);
  const archiveSelect=bind('关联已审核档案',row,'linked_archive_id',{options:archiveOptions,hint:pdfFixed?'固定引用本次PDF审核后生成的档案。':'更换关联档案会清空当前阅读页序和目录，请重新选择附件；原图片不会删除。',onChange:()=>{row.page_map=[];row.contents=[];if(row.linked_archive_id)row.catalogue_summary='';renderEditor();}});archiveSelect.querySelector('select').disabled=pdfFixed;reader.append(archiveSelect);
  if(row.linked_archive_id){const archive=state.data.archives.find(a=>a.item_id===row.linked_archive_id);reader.append(bind('本次阅读展示依据（仅管理端）',row,'display_basis',{type:'textarea',max:2000,hint:'记录本次授权或可公开展示的依据；下载范围仍由正式档案规则决定。'}));
    if(!archive){reader.append(el('p','关联档案尚未通过公开检查；现有引用和页序已保留。请先在档案管理中补全并核对，目录当前不能发布。','inline-help'));const link=el('a','打开关联档案继续整理 →');link.href='/admin/?item='+encodeURIComponent(row.linked_archive_id);reader.append(link);}
    if(!pdfFixed){const adder=el('div','','repeater');const picker=el('select');picker.setAttribute('aria-label','选择待添加的公开页面');picker.append(new Option('选择已公开的图片',''));for(const src of archive?.pages??[])if(!row.page_map.some(p=>p.attachment_ref===src))picker.append(new Option(src.split('/').pop(),src));adder.append(picker,button('加入阅读页序',()=>{if(!picker.value)return;row.page_map.push({attachment_ref:picker.value,printed_label:''});changed();renderEditor();}));reader.append(adder);}
    row.page_map.forEach((page,index)=>{const line=el('div','','page-row'),name=el('span',`${pdfFixed?'源PDF第'+(index+1)+'页':index+1+'.'} ${page.attachment_ref.split('/').pop()}`);if(pdfFixed){line.append(name,el('span','纸面页码：'+(page.printed_label||'未填写'),'hint'));reader.append(line);return;}line.append(name,bind('纸面页码',page,'printed_label',{max:80,hint:'如：封面、印刷页1'}));const move=el('div','','mini-actions');move.append(button('上移',()=>{[row.page_map[index-1],row.page_map[index]]=[row.page_map[index],row.page_map[index-1]];row.contents=[];changed();renderEditor();},{className:'quiet',disabled:index===0}),button('下移',()=>{[row.page_map[index+1],row.page_map[index]]=[row.page_map[index],row.page_map[index+1]];row.contents=[];changed();renderEditor();},{className:'quiet',disabled:index===row.page_map.length-1}),button('移除',()=>{row.page_map.splice(index,1);row.contents=[];changed();renderEditor();},{className:'quiet'}));line.append(move);reader.append(line);});
    if(!pdfFixed)reader.append(el('p','调整或移除页面后，阅读目录会清空，避免旧跳转指向错误页面；请重新填写目录。','hint'));
    row.contents.forEach((entry,index)=>{const line=el('div','','page-row');line.append(bind('目录标题',entry,'label',{max:100}));const proxy={page:String(entry.page)},field=bind('跳转页序',proxy,'page',{options:row.page_map.map((p,i)=>[String(i+1),`${i+1} · ${p.printed_label||'页码未填'}`])});field.querySelector('select').addEventListener('change',()=>entry.page=Number(proxy.page));line.append(field,button('移除目录项',()=>{row.contents.splice(index,1);changed();renderEditor();},{className:'quiet'}));reader.append(line);});reader.append(button('增加阅读目录项',()=>{row.contents.push({label:'',page:row.page_map.length?1:0});changed();renderEditor();}));
  }else reader.append(bind('公开资料简介',row,'catalogue_summary',{type:'textarea',max:3000,hint:'用于只有官方入口的资料。关联馆藏后，简介直接沿用正式档案。'}));editor.append(reader);
  const privateSection=section('内部备注');privateSection.append(bind('核对备注（仅管理端，不公开）',row,'review_note',{type:'textarea',max:3000}));editor.append(privateSection);
}
function renderHistory(){
  const box=$('history-list');box.replaceChildren();const labels={'draft-before-save':'修改前草稿','published-before-update':'发布前正式目录','published-before-withdrawal':'撤下前正式目录','draft-before-withdrawal':'撤下前草稿','draft-before-restore':'恢复前草稿备份'};
  if(online()&&!state.data.context?.publicationEnabled)box.append(el('p','当前可查看历史摘要；此环境暂不能恢复历史草稿。','hint'));
  if(!state.data.history.length){box.append(el('p','尚无历史版本。','hint'));return;}
  for(const entry of state.data.history){
    const row=el('div','','history-row'),text=el('div');text.append(el('strong',`${labels[entry.kind]||'目录历史'} · ${entry.count}份`),el('small',`${entry.created_at} ${entry.reason||''}`));
    const restore=button('恢复为草稿',()=>run(async()=>{if(!canPublish())throw new Error('当前服务尚未接通历史恢复。');if(state.dirty)throw new Error('请先保存当前修改，再恢复历史。');await request('/restore',{expectedRevision:state.data.revision,history_id:entry.history_id});await load();message('历史已恢复为草稿，原有草稿已备份；尚未发布。');}),{disabled:!canPublish()});restore.dataset.historyRestore='';row.append(text,restore);box.append(row);
  }
}
document.querySelectorAll('[data-tab]').forEach(tab=>tab.addEventListener('click',()=>{state.tab=tab.dataset.tab;state.selected=null;for(const button of document.querySelectorAll('[data-tab]'))button.setAttribute('aria-selected',String(button===tab));$('add').textContent='新增'+names[state.tab];renderList();renderEditor();}));
$('add').onclick=add;$('library-search').oninput=renderList;
$('initialize-empty').onchange=applyControls;
$('save').onclick=()=>run(async()=>{if(!canEdit()||state.uncertain)throw new Error('当前目录暂时不能保存，请先核对维护状态。');await request('/save',{expectedRevision:state.data.revision,catalog:state.catalog,...(state.data.readiness?.status==='needs-initialization'?{initializeEmpty:$('initialize-empty').checked,expectedPublicRevision:state.data.readiness.publicRevision}:{})});await load();message('目录草稿已保存，本次没有改变正式目录。');});
$('refresh').onclick=()=>run(async()=>{if(state.dirty&&!confirm('重新读取会放弃页面中尚未保存的修改。已保存草稿和正式目录不会改变，是否继续？'))return;await load();message('已读取当前目录。');});
$('review').onclick=()=>run(async()=>{if(state.dirty)throw new Error('请先保存草稿，再进行发布检查。');const result=await request('/review',{expectedRevision:state.data.revision});$('review-panel').hidden=false;const box=$('review-results');box.replaceChildren();if(result.issues.length){const list=el('ul','','issue-list');for(const issue of result.issues)list.append(el('li',`${issue.where}：${issue.message}`));box.append(el('p',`发现 ${result.issues.length} 项待处理问题，尚未发布。`),list);$('approval').hidden=true;}else{state.review=result;box.append(el('p',`检查通过：将展示 ${result.models} 个型号、${result.documents} 份文档；本次移除 ${result.removed.length} 份旧条目。`));if(result.removed.length)box.append(el('p','本次移除：'+result.removed.join('、'),'inline-help'));const list=el('ul','','review-summary');for(const doc of result.summary)list.append(el('li',`${doc.title} · ${doc.pages}页 · ${doc.sources}个官方来源`));box.append(list);for(const check of document.querySelectorAll('[data-confirm]'))check.checked=false;$('approval').hidden=false;}$('review-panel').scrollIntoView({block:'start',behavior:'smooth'});});
$('publish').onclick=()=>run(async()=>{if(!canPublish()||!state.review||state.dirty)throw new Error('请先保存、检查当前目录。');const confirmations=[...document.querySelectorAll('[data-confirm]')].map(c=>c.checked);if(confirmations.some(v=>!v))throw new Error('请实际核对并逐项勾选人工确认。');message('正在构建和检查，请等待实际结果；关闭页面不会取消已经开始的操作。');await request('/publish',{expectedRevision:state.data.revision,review_id:state.review.review_id,confirmations});await load();message(online()?'说明书已正式发布，公开版本和维护记录已完成核对。':'本地正式目录已生成，构建检查通过；本次没有部署到服务器。');});
$('withdraw-cancel').onclick=()=>$('withdraw-dialog').close();$('withdraw-form').onsubmit=event=>{event.preventDefault();const row=state.catalog.documents.find(d=>d.manual_key===state.selected);run(async()=>{if(!canPublish()||state.dirty)throw new Error('请先保存当前修改并核对维护能力。');const payload={expectedRevision:state.data.revision,manual_key:row.manual_key,reason:$('withdraw-reason').value,confirmed:$('withdraw-confirm').checked};$('withdraw-dialog').close();message('正在撤下并检查构建…');await request('/withdraw',payload);await load();message(online()?'说明书已从公开目录撤下，历史和原档案仍保留。':'说明书已从本地正式目录撤下，历史及原档案仍保留。');});};
async function checkPending(){
  const handle=state.pending||state.observed;if(!handle||state.querying)return;state.querying=true;applyControls();
  try{const operation=await getOperation(handle);const done=terminal(operation);if(done){await load();message('操作回执已核对，已重新读取当前目录。');}else if(!operation){state.uncertain=true;operationMessage('尚未找到原请求，请稍后查询，或核对异常结果；不会自动重发。');}}
  catch(error){if(!state.pending&&!state.observed){if(!state.dirty)await load().catch(()=>{});}else state.uncertain=true;message(error.message||'暂时无法核对结果。',true);}
  finally{state.querying=false;applyControls();}
}
$('operation-query').onclick=()=>void checkPending();
async function requestStop(){
  const handle=state.pending||state.observed;if(!handle||state.cancelling)return;state.cancelling=true;applyControls();operationMessage('已请求停止，等待当前构建结束并核对结果；不会重复发布。');
  try{const response=await fetch('/api/cancel-operation',{method:'POST',headers:{'content-type':'application/json','x-ljm-admin-request':'1'},body:JSON.stringify({operationId:handle.operationId})});if(!response.ok)throw new Error('停止请求暂未确认，请继续查询实际结果。');await checkPending();}catch(error){message(error.message,true);}finally{state.cancelling=false;applyControls();}
}
$('operation-stop').onclick=requestStop;
$('operation-resolve').onclick=()=>run(async()=>{
  const handle=state.pending;if(!handle)return;
  const result=await request('/resolve-operation',{operationId:handle.operationId,stepId:handle.stepId,confirmed:true});
  if(result.state==='needs-review'){state.uncertain=true;throw new Error('当前结果无法证明，写入继续暂停；请由维护者核对保留记录，不会重新发布。');}
  try{const done=terminal(result.operation);if(done){await load();message('异常回执已按实际版本核对，没有重新发布。');}}catch(error){if(!state.pending&&!state.dirty)await load();throw error;}
});
window.addEventListener('beforeunload',event=>{if(state.dirty||state.busy){event.preventDefault();event.returnValue='';}});
run(async()=>{await load();if(state.pending||state.observed)await checkPending();});
