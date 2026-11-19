export function createMedicineDesk({state,el,bind,button,section,changed,message,blankDoc,openPreview,renderSources,chooseObject,addWithdrawal}){
  const get=id=>document.getElementById(id);
  const roles=[['manufacturer','生产企业'],['holder','上市许可持有人'],['unverified','原件署名，角色待核']];
  const workspace=get('medicine-workspace');
  const maintenanceNote=get('maintenance-note');
  const objectMaintenanceText=maintenanceNote.textContent;
  const list=get('medicine-list');
  const editor=get('medicine-editor');
  const nameOf=medicine=>medicine.generic_name||medicine.original_title||'未填写药名';
  const summaryOf=medicine=>[medicine.dosage_form,medicine.strength,...medicine.companies.map(company=>company.name)].filter(Boolean).join(' · ');
  const normalized=text=>String(text||'').normalize('NFKC').trim().toLowerCase();
  const medicines=()=>state.catalog.medicines||[];
  const versions=key=>state.catalog.documents.filter(doc=>doc.medicine_keys?.includes(key));
  let active=false, selected='', selectedVersion='', mobileDetail=false, listScroll=0;
  let firstLoad=true;

  function saveLocation(){
    const url=new URL(location.href);
    url.searchParams.delete('medicine');
    url.searchParams.delete('area');
    if(active){
      url.searchParams.delete('manual');
      url.searchParams.set('area','medicines');
      if(selected)url.searchParams.set('medicine',selected);
      if(selectedVersion)url.searchParams.set('manual',selectedVersion);
    }else if(url.searchParams.has('manual')&&state.catalog.documents.some(d=>d.manual_key===url.searchParams.get('manual')&&d.medicine_keys?.length)){
      url.searchParams.delete('manual');
    }
    history.replaceState(null,'',url);
  }
  function showArea(isMedicine){
    active=isMedicine;
    get('area-medicines').setAttribute('aria-pressed',String(active));
    get('area-objects').setAttribute('aria-pressed',String(!active));
    workspace.hidden=!active;
    get('object-workspace').hidden=active;
    maintenanceNote.textContent=active||medicines().length
      ? '保存后可预览药品说明书。发布前请核对药品和物件两类变更，再确认整个目录。'
      : objectMaintenanceText;
    document.querySelector('.skip').href=active?'#medicine-editor':'#manual-editor';
    if(active){renderList();renderEditor();}
  }
  function selectMedicine(key,version=''){
    if(!mobileDetail)listScroll=window.scrollY;
    selected=key; selectedVersion=version; mobileDetail=true;
    renderList(); renderEditor(); saveLocation();
    editor.focus();
  }
  function backToList(){
    selectedVersion='';
    mobileDetail=false;
    renderList();renderEditor();saveLocation();
    get('medicine-search').focus({preventScroll:true});
    window.scrollTo({top:listScroll,behavior:'instant'});
  }
  function goToObject(tab,key){
    showArea(false);
    saveLocation();
    chooseObject(tab,key);
    get('manual-editor').focus();
  }
  function newMedicine(legacyModel=null){
    state.catalog.schema_version=2;
    state.catalog.medicines??=[];
    const record={
      medicine_key:'medicine-'+crypto.randomUUID(),generic_name:'',original_title:'',dosage_form:'',strength:'',
      companies:[],trade_name:'',approval_label:'',approval_number:'',package_spec:''
    };
    if(legacyModel){
      record.original_title=legacyModel.product_name||'';
      record.legacy_model_key=legacyModel.model_key;
    }
    state.catalog.medicines.push(record);
    get('medicine-search').value='';
    changed();
    selectMedicine(record.medicine_key);
    if(legacyModel&&!record.original_title){
      editor.querySelector('.medicine-extra').open=true;
      editor.querySelector('[aria-label="原件题名或旧称"]').focus();
    }else editor.querySelector('[aria-label="通用名"]').focus();
  }
  function openLegacyOrigin(container,model){
    const entries=state.catalog.documents.filter(doc=>doc.model_keys.includes(model.model_key));
    const brand=state.catalog.brands.find(b=>b.brand_key===model.brand_key);
    const title=[model.product_name,model.model_text,brand?.name].filter(Boolean).join(' · ')||model.model_key;
    container.append(button('原型号 · '+title,()=>goToObject('models',model.model_key),{className:'record-button'}));
    for(const doc of entries)container.append(button('原说明书 · '+(doc.edition_display||'版本未注明'),()=>goToObject('documents',doc.manual_key),{className:'quiet'}));
  }
  function newVersion(medicine){
    const doc=blankDoc();
    Object.assign(doc,{
      medicine_keys:[medicine.medicine_key],approval_date_text:'',revision_date_text:'',
      collected_on:new Intl.DateTimeFormat('sv-SE',{timeZone:'Asia/Shanghai'}).format(new Date())
    });
    state.catalog.documents.push(doc);
    changed();selectMedicine(medicine.medicine_key,doc.manual_key);
    editor.querySelector('[aria-label="版本标识"]').focus();
  }
  function recordButton(title,subtitle,click,selected){
    const item=button('',click,{className:'record-button'});
    item.setAttribute('aria-current',String(selected));
    item.append(el('strong',title),el('small',subtitle));return item;
  }
  function renderList(){
    const scroll=list.scrollTop;
    const query=normalized(get('medicine-search').value);
    const matches=medicines().filter(m=>[
      m.generic_name,m.original_title,m.trade_name,m.dosage_form,m.strength,m.approval_number,...m.companies.map(c=>c.name)
    ].some(value=>normalized(value).includes(query)));
    list.replaceChildren();
    if(matches.length)list.append(el('p',matches.length+' 条药品','record-count'));
    for(const item of matches)list.append(recordButton(nameOf(item),summaryOf(item)||'资料待补',
      ()=>selectMedicine(item.medicine_key),selected===item.medicine_key));
    if(!matches.length){
      list.append(el('p',query?'没有匹配的药品。':'还没有药品。','hint'));
      if(query)list.append(button('清除搜索',()=>{get('medicine-search').value='';renderList();}));
    }
    list.scrollTop=scroll;
    const host=get('legacy-medicines');
    const wasOpen=host.querySelector('details')?.open||false;
    host.replaceChildren();
    const legacy=state.catalog.models.filter(m=>m.category_key==='medicines');
    if(!legacy.length)return;
    const details=el('details');details.open=wasOpen;
    const linked=new Map(medicines().filter(m=>m.legacy_model_key).map(m=>[m.legacy_model_key,m]));
    const remaining=legacy.filter(m=>!linked.has(m.model_key)).length;
    details.append(el('summary','旧型号中的药品 · 待整理 '+remaining+' 条'),
      el('p','按原型号逐条核对。整理时先照录原物件名称，再依据原文填写药品资料。','hint'));
    for(const model of legacy){
      const brand=state.catalog.brands.find(b=>b.brand_key===model.brand_key);
      if(!normalized([model.product_name,model.model_text,brand?.name].join(' ')).includes(query))continue;
      const target=linked.get(model.model_key);
      const entry=el('div','','repeater');
      entry.append(el('p',target?'已关联药品草稿':'待整理','hint'));
      openLegacyOrigin(entry,model);
      const work=button(target?'继续整理':'整理为药品草稿',()=>{
        if(target)selectMedicine(target.medicine_key);
        else newMedicine(model);
      });
      work.disabled=get('medicine-add').disabled;
      work.dataset.legacyMedicineWork='';
      entry.append(work);details.append(entry);
    }
    host.append(details);
  }
  function removeMedicine(medicine){
    if(versions(selected).length){message('该药品仍关联说明书版本，请先核对版本归属。',true);return;}
    if(!confirm('从当前草稿移除“'+nameOf(medicine)+'”？请保存目录草稿使修改生效。'))return;
    state.catalog.medicines=medicines().filter(m=>m.medicine_key!==selected);
    selected='';changed();backToList();
  }
  function removeVersion(doc){
    const affected=doc.medicine_keys.map(key=>{
      const linked=medicines().find(m=>m.medicine_key===key);
      return [nameOf(linked),summaryOf(linked)].filter(Boolean).join(' · ');
    }).join('、');
    if(!confirm('从当前草稿移除版本“'+(doc.edition_display||'版本未注明')+'”？适用药品包括 '+affected+'。原档案及页图将保留。'))return;
    state.catalog.documents=state.catalog.documents.filter(d=>d.manual_key!==doc.manual_key);
    changed();selectMedicine(selected);
  }
  function companyFields(medicine){
    const group=el('div','','wide');
    const choices=el('datalist');
    choices.id='medicine-company-names';
    const known=new Set(medicines().flatMap(m=>m.companies.map(c=>c.name)).filter(Boolean));
    for(const name of known)choices.append(new Option(name));
    group.append(choices);
    const rows=el('div');
    function update(){
      rows.replaceChildren();
      const visible=medicine.companies.length?medicine.companies:[{role:'manufacturer',name:''}];
      visible.forEach((company,index)=>{
        const line=el('div','','medicine-company');
        const touch=()=>{
          if(!medicine.companies.includes(company))medicine.companies.push(company);
          renderList();
        };
        const role=bind('企业角色',company,'role',{options:roles,onChange:touch});
        role.querySelector('option[value=""]').remove();
        const name=bind('企业名称',company,'name',{max:200,onChange:touch});
        name.querySelector('input').setAttribute('list',choices.id);
        line.append(role,name);
        if(visible.length>1||company.name)line.append(button('移除这行企业',()=>{
          medicine.companies.splice(index,1);changed();update();renderList();
        },{className:'quiet'}));
        rows.append(line);
      });
    }
    update();group.append(rows,button('添加另一家企业或角色',()=>{
      if(!medicine.companies.length){rows.querySelector('input').focus();return;}
      medicine.companies.push({role:'unverified',name:''});changed();update();
      rows.lastElementChild.querySelector('input').focus();
    },{className:'quiet'}));
    return group;
  }
  function renderMedicine(medicine){
    const heading=el('div','','editor-heading');
    heading.append(el('h2',nameOf(medicine)),button('从当前草稿移除',()=>removeMedicine(medicine),{className:'quiet'}));
    const related=el('div','','medicine-related');
    function similarNames(){
      const names=[medicine.generic_name,medicine.original_title,medicine.trade_name].map(normalized).filter(Boolean);
      const matches=medicines().filter(other=>other!==medicine&&[other.generic_name,other.original_title,other.trade_name].some(value=>names.includes(normalized(value))));
      related.replaceChildren();
      if(!matches.length)return;
      const details=el('details');
      details.append(el('summary','有 '+matches.length+' 条同名药品，可核对规格和企业'));
      for(const item of matches)details.append(recordButton(nameOf(item),summaryOf(item)||'规格和企业待核',()=>selectMedicine(item.medicine_key),false));
      related.append(details);
    }
    const updateName=()=>{heading.querySelector('h2').textContent=nameOf(medicine);renderList();similarNames();};
    editor.append(heading);
    const basics=el('div','','form-grid');
    basics.append(bind('通用名',medicine,'generic_name',{max:200,wide:true,onChange:updateName}),
      bind('剂型',medicine,'dosage_form',{max:100,onChange:renderList}),
      bind('规格',medicine,'strength',{max:200,onChange:renderList}),companyFields(medicine));
    const extra=el('details','','medicine-extra');
    extra.append(el('summary','更多药品信息'));
    const more=el('div','','form-grid');
    more.append(bind('商品名',medicine,'trade_name',{max:200,onChange:updateName}),
      bind('原件题名或旧称',medicine,'original_title',{max:300,onChange:updateName}),
      bind('编号名称',medicine,'approval_label',{max:100}),
      bind('批准或注册编号',medicine,'approval_number',{max:150,onChange:renderList}),
      bind('包装规格',medicine,'package_spec',{max:200}));
    extra.append(more);similarNames();editor.append(basics,related,extra);
    if(medicine.legacy_model_key){
      const legacyBox=el('details','','medicine-extra');
      legacyBox.append(el('summary','原型号及说明书'));
      const origin=state.catalog.models.find(model=>model.model_key===medicine.legacy_model_key);
      if(origin)openLegacyOrigin(legacyBox,origin);
      else legacyBox.append(el('p','原型号标识：'+medicine.legacy_model_key,'hint'));
      editor.append(legacyBox);
    }
    const entries=versions(medicine.medicine_key);
    const versionsBox=section('说明书版本');
    for(const doc of entries){
      const sources=[];
      if(doc.official_sources.length)sources.push('官方来源');
      if(doc.linked_archive_id)sources.push('已关联页图档案');
      const detail=[doc.revision_date_text||doc.edition_date,...doc.languages.map(k=>state.data.choices.languages[k]),
        sources.join('、')||'待补来源',doc.publication_status==='withdrawn'?'已撤下':state.data.state.published.documents.some(item=>item.manual_key===doc.manual_key&&item.publication_status!=='withdrawn')?'已有正式版本':'目录草稿'].filter(Boolean).join(' · ');
      versionsBox.append(recordButton(doc.edition_display||'版本未注明',detail,
        ()=>selectMedicine(medicine.medicine_key,doc.manual_key),false));
    }
    versionsBox.append(button(entries.length?'新增版本':'添加第一份说明书',()=>newVersion(medicine)));
    editor.append(versionsBox);
  }
  function medicineVersion(medicine,doc){
    const heading=el('div','','editor-heading');
    const headingText=el('div');
    headingText.append(el('h2','说明书版本'),el('p',[nameOf(medicine),summaryOf(medicine)].filter(Boolean).join(' · '),'hint'));
    heading.append(headingText,button('返回药品资料',()=>selectMedicine(medicine.medicine_key)));
    editor.append(heading);
    const actions=el('div','','mini-actions');
    actions.append(button('预览已保存资料',()=>openPreview(doc)),
      button('从当前草稿移除此版本',()=>removeVersion(doc),{className:'quiet'}));
    addWithdrawal(actions,doc,[nameOf(medicine),doc.edition_display].filter(Boolean).join(' · '));
    const base=section('版本信息'),grid=el('div','','form-grid');
    grid.append(bind('版本标识',doc,'edition_display',{max:150}),bind('适用地区',doc,'region_display',{max:120}),
      bind('核准日期（原文）',doc,'approval_date_text',{max:100}),bind('修订日期（原文）',doc,'revision_date_text',{max:100}),
      bind('收录日期',doc,'collected_on',{type:'date',max:10}),bind('完整程度',doc,'completeness',{options:Object.entries(state.data.choices.completeness)}),
      bind('缺页说明',doc,'missing_note',{max:500,wide:true}));
    const langs=el('div','','wide');langs.append(el('p','原文语言'));
    const options=el('div','','actions');
    for(const [key,text] of Object.entries(state.data.choices.languages)){
      const label=el('label','','check'),input=el('input');
      input.type='checkbox';input.checked=doc.languages.includes(key);
      input.onchange=()=>{doc.languages=input.checked?[...doc.languages,key]:doc.languages.filter(l=>l!==key);changed();};
      label.append(input,el('span',text));options.append(label);
    }
    langs.append(options);grid.append(langs);base.append(grid);editor.append(base);
    const applicable=el('details','','medicine-extra');
    applicable.append(el('summary','适用药品及规格（'+doc.medicine_keys.length+'）'));
    const choice=el('div','','choice-list');
    if(doc.source_submission_id){
      applicable.open=true;
      choice.append(el('p','适用药品及规格已在投稿审核时核对，此处只读。','hint'));
      const reviewed=el('ul');
      for(const key of doc.medicine_keys){
        const linked=medicines().find(m=>m.medicine_key===key);
        reviewed.append(el('li',linked?[nameOf(linked),summaryOf(linked)].filter(Boolean).join(' · '):'目录中缺少已核对的药品 '+key));
      }
      choice.append(reviewed);
    }else{
      for(const m of medicines()){
        const label=el('label','','check'),check=el('input');check.type='checkbox';
        check.checked=doc.medicine_keys.includes(m.medicine_key);
        check.onchange=()=>{
          if(!check.checked&&doc.medicine_keys.length===1){check.checked=true;message('每份说明书至少需要关联一条药品。',true);return;}
          doc.medicine_keys=check.checked?[...doc.medicine_keys,m.medicine_key]:doc.medicine_keys.filter(k=>k!==m.medicine_key);
          changed();
          if(!doc.medicine_keys.includes(selected)){selectMedicine(doc.medicine_keys[0],doc.manual_key);return;}
          applicable.querySelector('summary').textContent='适用药品及规格（'+doc.medicine_keys.length+'）';
        };
        label.append(check,el('span',[nameOf(m),summaryOf(m)].filter(Boolean).join(' · ')));choice.append(label);
      }
    }
    applicable.append(choice,bind('适用药品核对依据（仅管理端）',doc,'applicability_basis',{type:'textarea',max:2000}));
    editor.append(applicable);
    renderSources(doc,editor,renderEditor,true);
    editor.append(actions);
  }
  function renderEditor(){
    workspace.dataset.mobile=mobileDetail?'detail':'list';
    editor.replaceChildren();
    const medicine=medicines().find(m=>m.medicine_key===selected);
    if(!medicine){editor.append(el('p','选择或新增一条药品。','empty'));return;}
    const doc=versions(selected).find(d=>d.manual_key===selectedVersion);
    if(doc)medicineVersion(medicine,doc);else renderMedicine(medicine);
  }
  get('medicine-add').onclick=()=>newMedicine();
  get('medicine-back').onclick=backToList;
  get('medicine-search').oninput=renderList;
  get('area-medicines').onclick=()=>{showArea(true);saveLocation();};
  get('area-objects').onclick=()=>{showArea(false);saveLocation();};
  function readyToSave(){
    const incomplete=medicines().find(m=>!m.generic_name.trim()&&!m.original_title.trim());
    if(!incomplete)return true;
    showArea(true);selectMedicine(incomplete.medicine_key);
    editor.querySelector('.medicine-extra').open=true;
    editor.querySelector('[aria-label="通用名"]').focus();
    message('请先填写这条药品的通用名，或在更多药品信息中照录原件题名。',true);
    return false;
  }
  return {readyToSave,loaded(linkedManual){
    if(firstLoad){
      const params=new URLSearchParams(location.search);
      const doc=state.catalog.documents.find(d=>d.manual_key===linkedManual&&d.medicine_keys?.length);
      active=Boolean(doc)||params.get('area')==='medicines';
      selected=params.get('medicine')||doc?.medicine_keys[0]||'';
      selectedVersion=doc?.manual_key||'';
      mobileDetail=Boolean(selected);
      firstLoad=false;
    }
    if(!medicines().some(m=>m.medicine_key===selected)){selected='';selectedVersion='';mobileDetail=false;}
    if(selectedVersion&&!versions(selected).some(d=>d.manual_key===selectedVersion))selectedVersion='';
    showArea(active);
  }};
}
