import {readManualQuery,manualQueryString,searchManualCatalog,validateManualSearchIndex,manualKinds,manualLanguages} from '../../../shared/manual-catalog.mjs';
import {manualBrandPath} from '../../../shared/manual-browse.mjs';

const root=document.querySelector<HTMLElement>('[data-manual-search]');
if(root){
  const form=root.querySelector<HTMLFormElement>('#manual-search-form')!;
  const results=root.querySelector<HTMLElement>('#manual-results')!;
  const status=root.querySelector<HTMLElement>('#manual-load-status')!;
  const error=root.querySelector<HTMLElement>('#manual-load-error')!;
  const config=JSON.parse(document.getElementById('manual-search-config')!.textContent!);
  let query:Record<string,string>=readManualQuery(location.search),catalog:any=null,pending:Promise<void>|null=null;
  const fields=['q','brand','category','language','kind','region','era','complete','access'];
  const node=(tag:string,text='',className='')=>{const el=document.createElement(tag);el.textContent=text;if(className)el.className=className;return el;};
  const matchLabels:any={exact:'准确型号',model:'型号吻合，请核对品牌',partial:'型号片段相关',format:'格式相近，请核对',keyword:'关键词相关'};
  const currentListUrl=()=>'/manuals/'+(manualQueryString(query)?'?'+manualQueryString(query):'');
  function syncControls(){
    for(const name of fields){
      const control=form.elements.namedItem(name) as HTMLInputElement|HTMLSelectElement;
      if(control instanceof HTMLSelectElement){
        control.querySelector('[data-invalid-option]')?.remove();
        if(query[name]&&!Array.from(control.options).some(o=>o.value===query[name])){const option=new Option('无效条件（可清空）',query[name]);option.dataset.invalidOption='';control.add(option);}
      }
      control.value=query[name]??'';
    }
    const extra=['kind','region','era','complete','access'].some(k=>query[k]);
    if(extra)(form.querySelector('details') as HTMLDetailsElement).open=true;
  }
  function readControls(){for(const name of fields)query[name]=(form.elements.namedItem(name) as HTMLInputElement|HTMLSelectElement).value.slice(0,name==='q'?200:150);}
  function groupElement(group:any,unavailable=false){
    const article=node('article','','manual-model'+(unavailable?' manual-model--unavailable':''));article.dataset.manualModel=group.model.model_key;
    const mark=node('div','','manual-model-mark');mark.setAttribute('aria-hidden','true');mark.append(node('span','说明'),node('small',group.model.model_text));
    const body=node('div','','manual-model-body'),heading=node('h3');
    const brandLink=node('a',group.brand.name,'manual-brand-link') as HTMLAnchorElement;brandLink.href=manualBrandPath(group.brand.brand_key);
    heading.append(brandLink,document.createTextNode(' '),node('span',group.model.model_text,'manual-model-code'));
    if(matchLabels[group.matchKind])heading.append(document.createTextNode(' '),node('span',matchLabels[group.matchKind],'manual-match'));
    body.append(heading,node('p',`${group.model.product_name}${group.model.product_era_display?' · '+group.model.product_era_display:''} · ${group.documents.length} 份${unavailable?'暂不可用':'可用'}文档`,'manual-model-meta'));
    const list=node('ul','','manual-documents');
    for(const d of group.documents){
      const row=node('li'),link=document.createElement('a');link.className='manual-document-link';link.dataset.manualLink='';link.dataset.manualKey=d.manual_key;
      link.href=`/manuals/${encodeURIComponent(d.manual_key)}/?return=${encodeURIComponent(currentListUrl())}`;
      const way=unavailable?'来源暂不可用':d.has_reader?'站内阅读 →':'官网查看 ↗';
      link.append(node('span',`${d.languages.map((l:string)=>manualLanguages[l]).join('／')} · ${manualKinds[d.document_kind]} · ${d.edition_display}`),node('small',way+(d.completeness==='incomplete'?' · 有缺页':'')));
      row.append(link);list.append(row);
    }
    body.append(list);article.append(mark,body);return article;
  }
  function restorePosition(){
    try{const raw=sessionStorage.getItem('ljm-manuals-return');if(!raw)return;const saved=JSON.parse(raw);if(saved.url===location.pathname+location.search&&Date.now()-saved.at<1800000&&Number.isFinite(saved.scroll)){requestAnimationFrame(()=>window.scrollTo({top:Math.max(0,Math.min(saved.scroll,document.documentElement.scrollHeight)),behavior:'instant'}));sessionStorage.removeItem('ljm-manuals-return');}}catch{/*浏览器禁用存储时仍可查询*/}
  }
  function render(){
    if(!catalog)return;
    const found=searchManualCatalog(catalog,query),fragment=document.createDocumentFragment();
    const header=node('header','','manual-results-heading'),count=node('p',`${found.modelCount} 个型号 · ${found.documentCount} 份独立文档版本`);count.setAttribute('role','status');count.setAttribute('aria-live','polite');header.append(node('h2',query.q?'查询结果':'可用资料'),count);fragment.append(header);
    if(found.hasModelQuery&&!found.hasExact&&found.groups.length)fragment.append(node('p','暂未找到准确型号，以下是相关资料，请核对完整型号。','manual-notice'));
    if(found.groups.length)for(const group of found.groups)fragment.append(groupElement(group));
    else {
      const empty=node('div','','manual-empty');
      const anyConditions=fields.some(k=>query[k]);
      empty.append(node('h3',found.unavailable.length?'该型号的来源暂不可用':anyConditions?'暂未收录准确型号':'说明书资料正在整理'),node('p',found.unavailable.length?'下面的资料暂时没有可用阅读入口，可提交线索或稍后再查。':anyConditions?'没有找到符合当前条件的可用资料。请核对型号后缀，或减少筛选条件。':'您可以先查看型号查找方法，或提供希望寻找的品牌与完整型号。'));
      const help=document.createElement('a');help.href='/manuals/help/';help.textContent='查看型号查找方法 →';empty.append(help);
      if(anyConditions){const clear=node('button','清空条件','manual-text-button') as HTMLButtonElement;clear.type='button';clear.dataset.manualClear='';empty.append(document.createTextNode('　'),clear);}
      fragment.append(empty);
    }
    if(found.unavailable.length){const section=node('section','','manual-unavailable');section.append(node('h2','来源暂不可用'),node('p','下列资料暂时没有可用的阅读入口，不计入上方可用数量。'));for(const group of found.unavailable)section.append(groupElement(group,true));fragment.append(section);}
    results.replaceChildren(fragment);results.hidden=false;error.hidden=true;status.textContent='';restorePosition();
  }
  function update(push=true){readControls();const url=currentListUrl();if(url!==location.pathname+location.search)history[push?'pushState':'replaceState'](history.state,'',url);if(catalog)render();else void load();}
  async function load(){
    if(pending)return pending;
    pending=(async()=>{
      results.hidden=true;error.hidden=true;status.textContent='正在加载说明书目录，关键词和筛选条件已保留。';
      const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),12000);
      try{
        if(!/^\/manuals-search\/[a-f0-9]{24}\.json$/.test(config.url)||config.url!==`/manuals-search/${config.version}.json`||typeof config.demo!=='boolean')throw new Error('Invalid manual index');
        const response=await fetch(config.url,{signal:controller.signal,cache:'no-cache'});if(!response.ok)throw new Error('Manual index unavailable');
        catalog=validateManualSearchIndex(await response.json(),{demo:config.demo});render();
      }catch{catalog=null;error.hidden=false;results.hidden=true;status.textContent='';}
      finally{clearTimeout(timer);pending=null;}
    })();return pending;
  }
  function clear(){query=readManualQuery('');syncControls();update();}
  form.addEventListener('submit',event=>{event.preventDefault();update();});
  form.querySelectorAll('select').forEach(control=>control.addEventListener('change',()=>update()));
  root.addEventListener('click',event=>{const target=(event.target as HTMLElement).closest<HTMLElement>('[data-manual-clear],[data-manual-retry],[data-manual-link],[data-manual-contact]');if(!target)return;
    if(target.hasAttribute('data-manual-clear'))clear();
    if(target.hasAttribute('data-manual-retry'))void load();
    if(target.hasAttribute('data-manual-contact'))document.querySelector<HTMLButtonElement>('[data-contact-launcher]')?.click();
    if(target.hasAttribute('data-manual-link')){try{sessionStorage.setItem('ljm-manuals-return',JSON.stringify({url:location.pathname+location.search,scroll:window.scrollY,at:Date.now()}));}catch{/*无存储不影响导航*/}}
  });
  window.addEventListener('popstate',()=>{query=readManualQuery(location.search);syncControls();render();});
  window.addEventListener('pageshow',()=>{if(catalog)restorePosition();});
  syncControls();void load();
}
