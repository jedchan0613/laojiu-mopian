// 说明书查询与公开投影。只读消费经审核的发布输入，不替代本地人工发布门禁。
// 本模块同时供构建、浏览器与测试使用，不读取文件、不发请求、不写档案。
/** @type {Readonly<Record<string,string>>} */
export const manualCategories = Object.freeze({
  'home-appliances':'家用电器', 'audio-photo':'影音与摄影', 'office-digital':'数码与办公',
  tools:'工具与设备', 'daily-assembly':'生活用品与装配',
});
/** @type {Readonly<Record<string,string>>} */
export const manualKinds = Object.freeze({'user-guide':'使用说明', 'quick-start':'快速入门', installation:'安装指南', care:'保养说明', service:'维修手册', unknown:'用途未明'});
/** @type {Readonly<Record<string,string>>} */
export const manualLanguages = Object.freeze({'zh-CN':'中文', en:'英文', ja:'日文', ko:'韩文', th:'泰文', 'zh-Hant':'繁体中文', unknown:'语言未明'});
/** @type {Readonly<Record<string,string>>} */
export const manualCompleteness = Object.freeze({complete:'完整', incomplete:'有缺页', unverified:'完整度未核实'});
const fail=()=>{throw new Error('说明书目录格式或公开引用检查未通过，请核对资料后重试。');};
const text=(value,max=200,required=false)=>{
  if(value==null&&!required)return '';
  if(typeof value!=='string'||value.length>max||/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(value))fail();
  const result=value.trim();if(required&&!result)fail();return result;
};
const strings=(value,max=100)=>{if(value==null)return [];if(!Array.isArray(value)||value.length>500)fail();return [...new Set(value.map(v=>text(v,max,true)))];};
const key=(value,kind,demo)=>{const result=text(value,80,true);if(!new RegExp(`^${demo?'demo-':''}${kind}-[a-z0-9]+(?:-[a-z0-9]+)*$`).test(result))fail();return result;};
const date=value=>{if(value==null||value==='')return '';const s=text(value,10,true);if(!/^\d{4}-\d{2}-\d{2}$/.test(s)||Number.isNaN(Date.parse(s+'T00:00:00Z'))||new Date(s+'T00:00:00Z').toISOString().slice(0,10)!==s)fail();return s;};
export const normalizeManualText=value=>String(value??'').normalize('NFKC').trim().replace(/\s+/g,' ').toLowerCase();
const escapeRegExp=value=>value.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
const phrasePattern=value=>new RegExp(`(^|[^a-z0-9._/\\-])(${escapeRegExp(value)})(?=$|[^a-z0-9._/\\-])`,'i');

export function safeManualSourceUrl(value,{demo=false}={}) {
  try {
    if(typeof value!=='string'||value.length>2048||/[\u0000-\u0020\\]/.test(value))return null;
    const url=new URL(value),host=url.hostname.toLowerCase();
    if(url.protocol!=='https:'||url.username||url.password||!host.includes('.')||host.includes(':')||/^\d+(?:\.\d+){3}$/.test(host))return null;
    if(/(?:^|\.)(?:localhost|local|internal|test)$/.test(host)||host.endsWith('.invalid')&&!demo)return null;
    if([...url.searchParams.keys()].some(k=>/^(?:token|access_token|password|secret|session|auth|api_key|key|code)$/i.test(k)))return null;
    return url.href;
  } catch {return null;}
}

/** 发布输入只能来自本地已审投影。私密审核记录及其余字段均不向外复制。 */
export function projectManualCatalog(source,archiveItems=[],{allowDemo=false}={}) {
  if(!source||source.schema_version!==1||!Array.isArray(source.brands)||!Array.isArray(source.models)||!Array.isArray(source.documents))fail();
  const demo=source.demo_only===true;
  if(demo&&!allowDemo||!demo&&allowDemo)fail();
  const brands=source.brands.map(b=>({brand_key:key(b.brand_key,'brand',demo),name:text(b.name,100,true),aliases:strings(b.aliases,100)}));
  const brandMap=new Map(brands.map(b=>[b.brand_key,b]));if(brandMap.size!==brands.length)fail();
  const models=source.models.map(m=>{
    const brand_key=key(m.brand_key,'brand',demo);if(!brandMap.has(brand_key)||!Object.hasOwn(manualCategories,m.category_key))fail();
    return {model_key:key(m.model_key,'model',demo),brand_key,model_text:text(m.model_text,100,true),model_aliases:strings(m.model_aliases,100),product_name:text(m.product_name,120,true),category_key:m.category_key,product_era_display:text(m.product_era_display,80)};
  });
  const modelMap=new Map(models.map(m=>[m.model_key,m]));if(modelMap.size!==models.length)fail();
  if(new Set(models.map(m=>m.brand_key+'\n'+normalizeManualText(m.model_text))).size!==models.length)fail();
  const archives=new Map(archiveItems.map(item=>[item?.core?.item_id,item]));
  const documents=[],seen=new Set();
  for(const record of source.documents) {
    if(record?.publication_status!=='published'||record.publication_approved!==true)continue;
    const manual_key=key(record.manual_key,'manual',demo);if(seen.has(manual_key))fail();seen.add(manual_key);
    const model_keys=strings(record.model_keys,80);if(!model_keys.length||!model_keys.every(k=>modelMap.has(k)))fail();
    if(!Object.hasOwn(manualKinds,record.document_kind)||!Object.hasOwn(manualCompleteness,record.completeness))fail();
    const languages=strings(record.languages,20);if(!languages.length||!languages.every(l=>Object.hasOwn(manualLanguages,l)))fail();
    const missing_note=text(record.missing_note,500);if(record.completeness==='incomplete'&&!missing_note)fail();
    if(!Array.isArray(record.official_sources??[])||(record.official_sources??[]).length>10)fail();
    const official_sources=(record.official_sources??[]).map(s=>{
      const href=safeManualSourceUrl(s.url,{demo});if(!href)fail();
      if(typeof s.available!=='boolean')fail();
      return {href,name:text(s.name,100,true),checked_on:date(s.checked_on),available:s.available};
    });
    let archive=null,pages=[],contents=[],summary='',can_download=false,archive_id='';
    if(record.demo_presentation&&!demo)fail();
    if(record.linked_archive_id) {
      archive_id=text(record.linked_archive_id,40,true);archive=archives.get(archive_id);
      // 关联撤下或未公开资料时整条不输出，连题名和型号简介也不由此泄露。
      if(!archive||archive.core?.record_status!=='ACT'||archive.core?.use_status!=='U3'||archive.core?.privacy_level!=='G')continue;
      if(!['OTH','RPR'].includes(archive.core.object_type)||archive.metadata?.schema!=='common'||record.display_approved!==true)fail();
      if(!/^LJM-\d{8}-(?:OTH|RPR)-\d{3}$/.test(archive_id))fail();
      const allowed=archive.core.publication_file_path;if(!Array.isArray(allowed))fail();
      const rawPages=record.page_map??[];if(!Array.isArray(rawPages)||!rawPages.length||rawPages.length>2000)fail();
      pages=rawPages.map((p,i)=>{
        const src=text(p.attachment_ref,250,true);
        if(!allowed.includes(src)||!src.startsWith(`/archive/${archive_id}/`)||!/^\/archive\/LJM-\d{8}-(?:OTH|RPR)-\d{3}\/[a-zA-Z0-9_-]+\.(?:jpe?g|png|webp)$/.test(src))fail();
        return {src,label:text(p.printed_label,80)||`第${i+1}张`,alt:`${archive.core.title}，${text(p.printed_label,80)||`第${i+1}张`}`};
      });
      if(new Set(pages.map(p=>p.src)).size!==pages.length)fail();
      summary=text(archive.public_view?.description,3000);
      can_download=archive.core.rights_status==='PD';
    } else if(demo&&record.demo_presentation?.reader) {
      const labels=strings(record.demo_presentation.page_labels,80);if(!labels.length)fail();
      pages=labels.map((label,i)=>({src:`/manuals-demo-pages/${manual_key}/${i+1}.svg`,label,alt:`虚构说明书版面，${label}`}));
    } else summary=text(record.catalogue_summary,3000);
    const rawContents=demo&&record.demo_presentation?.reader?record.demo_presentation.contents:record.contents;
    if(!Array.isArray(rawContents??[])||(rawContents??[]).length>300)fail();
    contents=(rawContents??[]).map(c=>{if(!Number.isInteger(c.page)||c.page<1||c.page>pages.length)fail();return {label:text(c.label,100,true),page:c.page};});
    if(!pages.length&&!official_sources.length)continue;
    const firstModel=modelMap.get(model_keys[0]),brand=brandMap.get(firstModel.brand_key);
    documents.push({manual_key,model_keys,document_kind:record.document_kind,languages,region_display:text(record.region_display,120,true),edition_display:text(record.edition_display,150,true),edition_date:date(record.edition_date),completeness:record.completeness,missing_note,archive_id,
      title:archive?text(archive.core.title,250,true):`${brand.name} ${firstModel.model_text} ${manualKinds[record.document_kind]}`,
      summary,keywords:strings(record.keywords,120),official_sources,pages,contents,can_download,
      available:pages.length>0||official_sources.some(s=>s.available)});
  }
  const usedModels=new Set(documents.flatMap(d=>d.model_keys)),publicModels=models.filter(m=>usedModels.has(m.model_key));
  const usedBrands=new Set(publicModels.map(m=>m.brand_key));
  return {schema_version:1,demo,brands:brands.filter(b=>usedBrands.has(b.brand_key)),models:publicModels,documents};
}

// 查询索引不携带阅读附件、下载路径或私密审批字段。
export function manualSearchProjection(catalog) {
  return {schema_version:1,demo:catalog.demo,brands:catalog.brands,models:catalog.models,documents:catalog.documents.map(d=>({manual_key:d.manual_key,model_keys:d.model_keys,document_kind:d.document_kind,languages:d.languages,region_display:d.region_display,edition_display:d.edition_display,edition_date:d.edition_date,completeness:d.completeness,missing_note:d.missing_note,title:d.title,summary:d.summary,keywords:d.keywords,available:d.available,has_reader:d.pages.length>0,has_official:d.official_sources.some(s=>s.available)}))};
}

export function validateManualSearchIndex(input,{demo=false}={}) {
  if(!input||input.schema_version!==1||input.demo!==demo||!Array.isArray(input.brands)||!Array.isArray(input.models)||!Array.isArray(input.documents))fail();
  const only=(object,keys)=>{if(!object||typeof object!=='object'||Object.keys(object).some(k=>!keys.includes(k)))fail();};
  only(input,['schema_version','demo','brands','models','documents']);
  const brands=new Set(input.brands.map(b=>key(b.brand_key,'brand',demo))),models=new Set(input.models.map(m=>key(m.model_key,'model',demo))),docs=new Set();
  if(brands.size!==input.brands.length||models.size!==input.models.length)fail();
  for(const b of input.brands){only(b,['brand_key','name','aliases']);text(b.name,100,true);strings(b.aliases,100);}
  for(const m of input.models){only(m,['model_key','brand_key','model_text','model_aliases','product_name','category_key','product_era_display']);if(!brands.has(m.brand_key)||!Object.hasOwn(manualCategories,m.category_key))fail();text(m.model_text,100,true);text(m.product_name,120,true);strings(m.model_aliases,100);text(m.product_era_display,80);}
  for(const d of input.documents){
    only(d,['manual_key','model_keys','document_kind','languages','region_display','edition_display','edition_date','completeness','missing_note','title','summary','keywords','available','has_reader','has_official']);
    const k=key(d.manual_key,'manual',demo);if(docs.has(k))fail();docs.add(k);
    if(!Array.isArray(d.model_keys)||!d.model_keys.length||!d.model_keys.every(k=>models.has(k))||!Object.hasOwn(manualKinds,d.document_kind)||!Object.hasOwn(manualCompleteness,d.completeness))fail();
    if(!Array.isArray(d.languages)||!d.languages.length||!d.languages.every(l=>Object.hasOwn(manualLanguages,l)))fail();
    for(const k of ['available','has_reader','has_official'])if(typeof d[k]!=='boolean')fail();
    if(d.available!==(d.has_reader||d.has_official))fail();
    text(d.title,250,true);text(d.summary,3000);strings(d.keywords,120);text(d.region_display,120,true);text(d.edition_display,150,true);date(d.edition_date);text(d.missing_note,500);
  }
  return input;
}

const filterKeys=['brand','category','language','kind','region','era','complete','access'];
export function readManualQuery(search='') {
  const p=new URLSearchParams(search),result={q:(p.get('q')??'').slice(0,200)};
  for(const k of filterKeys)result[k]=(p.get(k)??'').slice(0,150);
  return result;
}
export function manualQueryString(query) {
  const p=new URLSearchParams();for(const k of ['q',...filterKeys])if(typeof query[k]==='string'&&query[k].trim())p.set(k,query[k].trim().slice(0,k==='q'?200:150));return p.toString();
}
export function safeManualReturn(value) {
  if(typeof value!=='string'||value.length>2200||!value.startsWith('/manuals/')||value.startsWith('//')||/[\\\u0000-\u001f]/.test(value))return '/manuals/';
  try{
    const url=new URL(value,'https://manuals.example.invalid');if(url.origin!=='https://manuals.example.invalid')return '/manuals/';
    if(url.pathname==='/manuals/'){const q=manualQueryString(readManualQuery(url.search));return '/manuals/'+(q?'?'+q:'');}
    const brand=/^\/manuals\/brands\/((?:demo-)?brand-[a-z0-9]+(?:-[a-z0-9]+)*)\/$/.exec(url.pathname);
    const category=/^\/manuals\/categories\/([a-z0-9-]+)\/$/.exec(url.pathname);
    if((brand&&brand[1].length<=80)||(category&&Object.hasOwn(manualCategories,category[1]))){
      const anchor=/^#(?:unavailable-)?(?:demo-)?model-[a-z0-9]+(?:-[a-z0-9]+)*$/.test(url.hash)&&url.hash.length<=100?url.hash:'';
      return url.pathname+anchor;
    }
    return '/manuals/';
  }catch{return '/manuals/';}
}

export function searchManualCatalog(catalog,query={}) {
  if(query.access&&!['reader','official'].includes(query.access))return {groups:[],unavailable:[],modelCount:0,documentCount:0,hasExact:false,hasModelQuery:false};
  const q=normalizeManualText(query.q),brands=new Map(catalog.brands.map(b=>[b.brand_key,b]));
  let remaining=q;
  const named=[];
  for(const brand of catalog.brands){
    const aliases=[brand.name,...brand.aliases].map(normalizeManualText).sort((a,b)=>b.length-a.length);
    const alias=aliases.find(a=>/[a-z0-9]/.test(a)?phrasePattern(a).test(q):q.includes(a));
    if(alias){named.push(brand.brand_key);remaining=remaining.replace(alias,' ').trim();}
  }
  const brandExplicit=Boolean(query.brand||named.length===1),compact=s=>s.replace(/[\s._/\-]/g,'');
  const possible=catalog.models.filter(m=>(!query.brand||m.brand_key===query.brand)&&(!named.length||named.includes(m.brand_key)));
  const compactCandidates=/^[a-z0-9][a-z0-9 ._/\-]*$/i.test(remaining)?possible.filter(m=>compact(normalizeManualText(m.model_text))===compact(remaining)):[];
  const groups=[],unavailable=[];
  for(const model of possible){
    if(query.category&&query.category!==model.category_key||query.era&&query.era!==model.product_era_display)continue;
    const brand=brands.get(model.brand_key),names=[model.model_text,...model.model_aliases].map(normalizeManualText).sort((a,b)=>b.length-a.length);
    const exact=remaining&&names.find(name=>phrasePattern(name).test(remaining));
    const format=remaining&&compactCandidates.includes(model);
    let rest=exact?remaining.replace(phrasePattern(exact),'$1').trim():remaining;
    let matchKind=exact?(brandExplicit?'exact':'model'):(format?(compactCandidates.length===1&&brandExplicit?'exact':'format'):'keyword');
    if(!exact&&remaining&&names.some(name=>name.includes(remaining)))matchKind='partial';
    // 全词等价优先；型号格式候选仍要求歧义提示，不把0与O互换。
    const modelHit=Boolean(exact||format||matchKind==='partial');
    if(modelHit)rest=exact?rest:'';
    const terms=rest.split(/\s+/).filter(Boolean);
    const documents=catalog.documents.filter(d=>{
      if(!d.model_keys.includes(model.model_key))return false;
      if(query.language&&!d.languages.includes(query.language)||query.kind&&query.kind!==d.document_kind||query.region&&query.region!==d.region_display||query.complete&&query.complete!==d.completeness)return false;
      const reader=d.has_reader??d.pages?.length>0,official=d.has_official??d.official_sources?.some(s=>s.available);
      if(query.access==='reader'&&!reader||query.access==='official'&&!official)return false;
      const field=normalizeManualText([model.model_text,...model.model_aliases,model.product_name,brand.name,...brand.aliases,manualKinds[d.document_kind],...d.languages.map(l=>manualLanguages[l]),d.title,d.summary,...d.keywords].join(' '));
      return terms.every(term=>field.includes(term));
    }).sort((a,b)=>(a.document_kind==='user-guide'?0:1)-(b.document_kind==='user-guide'?0:1)||(b.edition_date||'').localeCompare(a.edition_date||'')||a.manual_key.localeCompare(b.manual_key));
    if(!documents.length)continue;
    const visible=documents.filter(d=>d.available),lost=documents.filter(d=>!d.available);
    if(visible.length)groups.push({model,brand,documents:visible,matchKind:q?matchKind:'none'});
    if(lost.length)unavailable.push({model,brand,documents:lost,matchKind:q?matchKind:'none'});
  }
  const rank={exact:5,model:4,partial:3,format:2,keyword:1,none:0};
  const compare=(a,b)=>(rank[b.matchKind]-rank[a.matchKind])||a.brand.name.localeCompare(b.brand.name,'zh-CN')||a.model.model_text.localeCompare(b.model.model_text,'en',{numeric:true})||a.model.model_key.localeCompare(b.model.model_key);
  groups.sort(compare);unavailable.sort(compare);
  return {groups,unavailable,modelCount:groups.length,documentCount:new Set(groups.flatMap(g=>g.documents.map(d=>d.manual_key))).size,hasExact:groups.some(g=>['exact','model'].includes(g.matchKind)),hasModelQuery:/[a-z][a-z0-9._/\-]*\d/i.test(remaining)};
}

export function manualPageFromHash(hash,count) {
  const match=/^#page=([1-9]\d*)$/.exec(hash||'');if(!match)return {page:1,invalid:Boolean(hash)};
  const page=Number(match[1]);return page<=count?{page,invalid:false}:{page:1,invalid:true};
}
