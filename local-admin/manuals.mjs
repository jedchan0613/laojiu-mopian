// 说明书本地维护：复用管理服务的写入队列；原档案及图片由既有入站流程维护。
import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash,randomUUID} from 'node:crypto';
import {atomicWrite} from './write-coordinator.mjs';
import {manualCategories,manualKinds,manualLanguages,manualCompleteness,normalizeManualText,projectManualCatalog,safeManualSourceUrl} from '../shared/manual-catalog.mjs';
import {assertPublicationImageSignature} from '../shared/publication-image-safety.mjs';
import {importManualCatalog} from './manual-review-catalog.mjs';

export class ManualsError extends Error {
  constructor(message,statusCode=400,code='MANUALS_INVALID'){super(message);this.name='ManualsError';this.statusCode=statusCode;this.code=code;}
}
const fail=(message,status=400,code)=>{throw new ManualsError(message,status,code);};
const hash=value=>createHash('sha256').update(typeof value==='string'||Buffer.isBuffer(value)?value:JSON.stringify(value)).digest('hex');
const empty=()=>({schema_version:1,brands:[],models:[],documents:[]});
const blank=()=>({version:1,published:empty(),draft:null,updated_at:null});
const idPattern=kind=>new RegExp(`^${kind}-[a-z0-9]+(?:-[a-z0-9]+)*$`);
const id=(value,kind)=>{if(typeof value!=='string'||value.length>80||!idPattern(kind).test(value))fail('目录标识无效，请从本地维护页面新建资料。');return value;};
const str=(value,max=200)=>{if(value==null)return '';if(typeof value!=='string'||value.length>max||/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(value))fail('填写内容过长或含无法保存的字符。');return value.trim();};
const list=(value,max=200,size=500)=>{if(value==null)return [];if(!Array.isArray(value)||value.length>size)fail('列表内容格式或数量无效。');return value.map(v=>str(v,max));};
const rows=(value,max)=>{if(!Array.isArray(value)||value.length>max||value.some(v=>!v||typeof v!=='object'||Array.isArray(v)))fail('目录内容格式或数量无效。');return value;};
const isoDate=value=>/^\d{4}-\d{2}-\d{2}$/.test(value)&&!Number.isNaN(Date.parse(value+'T00:00:00Z'))&&new Date(value+'T00:00:00Z').toISOString().slice(0,10)===value;
const when=()=>new Date().toISOString();
const today=()=>new Date().toLocaleDateString('en-CA',{timeZone:'Asia/Shanghai'});
const inside=(root,target)=>{const relative=path.relative(root,target);return relative===''||!relative.startsWith('..')&&!path.isAbsolute(relative);};
const optional=async filename=>{try{return await fs.readFile(filename);}catch(e){if(e.code==='ENOENT')return null;throw e;}};
async function noLinks(root,target,{missing=true}={}){
  root=path.resolve(root);target=path.resolve(target);if(!inside(root,target))fail('文件位置越出了说明书维护范围。');
  const parts=path.relative(root,target).split(path.sep).filter(Boolean);let p=root;
  for(const part of ['',...parts]){if(part)p=path.join(p,part);const stat=await fs.lstat(p).catch(e=>{if(e.code==='ENOENT'&&missing)return null;throw e;});if(!stat)break;if(stat.isSymbolicLink())fail('维护目录或附件不能使用文件链接。');}
}
async function safeTree(root){
  await noLinks(root,root,{missing:false});
  for(const row of await fs.readdir(root,{withFileTypes:true})){if(row.isSymbolicLink())fail('网站产物中出现文件链接，不能建立可靠备份。');if(row.isDirectory())await safeTree(path.join(root,row.name));}
}

// 草稿允许缺项；只接受已知字段，不能提交审批标记、主档路径或任意文件位置。
export function normalizeManualDraft(input){
  if(!input||input.schema_version!==1||input.demo_only)fail('请使用正式目录格式，演示目录不能保存为真实资料。');
  const brands=rows(input.brands,1000).map(b=>({brand_key:id(b.brand_key,'brand'),name:str(b.name,100),aliases:list(b.aliases,100),evidence:str(b.evidence,2000)}));
  const models=rows(input.models,5000).map(m=>({model_key:id(m.model_key,'model'),brand_key:m.brand_key?id(m.brand_key,'brand'):'',model_text:str(m.model_text,100),model_aliases:list(m.model_aliases,100),product_name:str(m.product_name,120),category_key:str(m.category_key,40),product_era_display:str(m.product_era_display,80),evidence:str(m.evidence,2000)}));
  const documents=rows(input.documents,5000).map(d=>({manual_key:id(d.manual_key,'manual'),model_keys:list(d.model_keys,80).map(k=>id(k,'model')),document_kind:str(d.document_kind,40),languages:list(d.languages,20,20),region_display:str(d.region_display,120),edition_display:str(d.edition_display,150),edition_date:str(d.edition_date,10),completeness:str(d.completeness,40),missing_note:str(d.missing_note,500),linked_archive_id:str(d.linked_archive_id,40),page_map:rows(d.page_map??[],2000).map(p=>({attachment_ref:str(p.attachment_ref,250),printed_label:str(p.printed_label,80)})),contents:rows(d.contents??[],300).map(c=>({label:str(c.label,100),page:Number.isInteger(c.page)?c.page:0})),keywords:list(d.keywords,120),catalogue_summary:str(d.catalogue_summary,3000),official_sources:rows(d.official_sources??[],10).map(s=>({name:str(s.name,100),url:str(s.url,2048),checked_on:str(s.checked_on,10),available:s.available===true,evidence:str(s.evidence,2000)})),publication_status:d.publication_status==='withdrawn'?'withdrawn':'draft',applicability_basis:str(d.applicability_basis,2000),display_basis:str(d.display_basis,2000),review_note:str(d.review_note,3000)}));
  for(const [index,doc]of documents.entries()){
    const source=input.documents[index];if(!source.source_submission_id)continue;
    if(!/^TG-[A-F0-9]{24}$/.test(source.source_submission_id)||!Number.isSafeInteger(source.source_submission_revision)||source.source_submission_revision<1||!/^[a-f0-9]{64}$/.test(source.source_submission_digest??'')||!['official-link','reading-copy'].includes(source.source_sharing_scope))fail('投稿来源绑定无法核对，不能保存。');
    Object.assign(doc,{source_submission_id:source.source_submission_id,source_submission_revision:source.source_submission_revision,source_submission_digest:source.source_submission_digest,source_sharing_scope:source.source_sharing_scope});
    if(source.source_pdf_digest){if(!/^[a-f0-9]{64}$/.test(source.source_pdf_digest)||source.source_sharing_scope!=='reading-copy')fail('PDF来源绑定无法核对，不能保存。');doc.source_pdf_digest=source.source_pdf_digest;}
  }
  for(const [values,key] of [[brands,'brand_key'],[models,'model_key'],[documents,'manual_key']])if(new Set(values.map(v=>v[key])).size!==values.length)fail('目录中有重复标识，已停止保存。');
  return {schema_version:1,brands,models,documents};
}

// 发布源白名单：不向构建程序传递依据、审核备注和历史。
export function manualPublicationInput(catalog){
  const active=catalog.documents.filter(d=>d.publication_status!=='withdrawn'),usedModels=new Set(active.flatMap(d=>d.model_keys)),models=catalog.models.filter(m=>usedModels.has(m.model_key)),usedBrands=new Set(models.map(m=>m.brand_key));
  return {schema_version:1,brands:catalog.brands.filter(b=>usedBrands.has(b.brand_key)).map(({brand_key,name,aliases})=>({brand_key,name,aliases})),models:models.map(({model_key,brand_key,model_text,model_aliases,product_name,category_key,product_era_display})=>({model_key,brand_key,model_text,model_aliases,product_name,category_key,product_era_display})),documents:active.map(d=>({manual_key:d.manual_key,model_keys:d.model_keys,document_kind:d.document_kind,languages:d.languages,region_display:d.region_display,edition_display:d.edition_display,edition_date:d.edition_date,completeness:d.completeness,missing_note:d.missing_note,linked_archive_id:d.linked_archive_id,page_map:d.page_map,contents:d.contents,keywords:d.keywords,catalogue_summary:d.linked_archive_id?'':d.catalogue_summary,official_sources:d.official_sources.map(({name,url,checked_on,available})=>({name,url,checked_on,available})),publication_status:'published',publication_approved:true,display_approved:Boolean(d.linked_archive_id)}))};
}
function pruneInput(source,projection){
  const docs=new Set(projection.documents.map(d=>d.manual_key)),models=new Set(projection.models.map(m=>m.model_key)),brands=new Set(projection.brands.map(b=>b.brand_key));
  return {...source,brands:source.brands.filter(b=>brands.has(b.brand_key)),models:source.models.filter(m=>models.has(m.model_key)),documents:source.documents.filter(d=>docs.has(d.manual_key))};
}

export function validateManualPublication(catalog,archives){
  const issues=[];const add=(where,message)=>issues.push({where,message});
  const brands=new Map(catalog.brands.map(b=>[b.brand_key,b])),models=new Map(catalog.models.map(m=>[m.model_key,m])),records=new Map(archives.map(a=>[a.core?.item_id,a]));
  const active=catalog.documents.filter(d=>d.publication_status!=='withdrawn'),used=new Set(active.flatMap(d=>d.model_keys));
  for(const b of catalog.brands.filter(b=>catalog.models.some(m=>used.has(m.model_key)&&m.brand_key===b.brand_key))){if(!b.name)add(b.brand_key,'请填写品牌名称。');if(!b.evidence)add(b.brand_key,'请记录品牌及别名的核对依据。');if(b.aliases.some(a=>!a))add(b.brand_key,'品牌别名不能留空。');}
  const exact=new Set(),spellings=new Map();
  for(const m of catalog.models.filter(m=>used.has(m.model_key))){
    if(!brands.has(m.brand_key))add(m.model_key,'请关联已有品牌。');
    if(!m.model_text||!m.product_name||!Object.hasOwn(manualCategories,m.category_key))add(m.model_key,'请填写完整型号、物件名称并选择品类。');
    if(!m.evidence)add(m.model_key,'请记录完整型号与型号别名的核对依据。');
    const token=m.brand_key+'\n'+normalizeManualText(m.model_text);if(exact.has(token))add(m.model_key,'同一品牌下存在重复型号。');exact.add(token);
    for(const name of new Set([m.model_text,...m.model_aliases].map(normalizeManualText))){const alias=m.brand_key+'\n'+name;if(spellings.has(alias)&&spellings.get(alias)!==m.model_key)add(m.model_key,'型号或别名与同品牌其他型号冲突，请核对实际写法。');spellings.set(alias,m.model_key);}
    if(m.model_aliases.some(a=>!a))add(m.model_key,'型号别名不能留空。');
  }
  const versions=new Map();
  for(const d of active){
    const at=d.manual_key;
    if(!d.model_keys.length||d.model_keys.some(k=>!models.has(k))||new Set(d.model_keys).size!==d.model_keys.length)add(at,'请选择不重复的明确适用型号。');
    if(!d.applicability_basis)add(at,'请记录这份资料适用于所选型号的依据。');
    if(!Object.hasOwn(manualKinds,d.document_kind)||!d.languages.length||d.languages.some(l=>!Object.hasOwn(manualLanguages,l))||new Set(d.languages).size!==d.languages.length)add(at,'请选择有效的用途和原文语言。');
    if(!d.region_display||!d.edition_display)add(at,'地区与版本不能为空；无法核实请如实填写未注明。');
    if(d.edition_date&&!isoDate(d.edition_date))add(at,'文档日期必须是真实有效的年月日。');
    if(!Object.hasOwn(manualCompleteness,d.completeness)||d.completeness==='incomplete'&&!d.missing_note)add(at,'请选择完整程度，有缺页时请填写缺页说明。');
    if(!d.linked_archive_id&&!d.official_sources.length)add(at,'请关联已审核馆藏，或填写官方来源。');
    if(d.linked_archive_id){
      const a=records.get(d.linked_archive_id);
      if(!a||a.core?.record_status!=='ACT'||a.core?.privacy_level!=='G'||a.core?.use_status!=='U3')add(at,'关联档案未公开、已撤下或未通过隐私检查，请先在档案管理中处理。');
      else if(!['OTH','RPR'].includes(a.core.object_type)||a.metadata?.schema!=='common')add(at,'只可关联类型与通用结构相匹配的其他类或复制件档案。');
      if(!d.display_basis)add(at,'请记录本次阅读展示的权利与公开依据，持有实物不能代替展示许可。');
      if(!d.page_map.length)add(at,'关联馆藏后，请选择已公开附件并排好页序。');
      if(d.catalogue_summary)add(at,'馆藏简介沿用正式档案，不在说明书目录重复填写。');
    }else if(d.page_map.length||d.contents.length)add(at,'只有关联馆藏才能填写阅读页序与目录。');
    for(const s of d.official_sources){if(!s.name||!safeManualSourceUrl(s.url)||!isoDate(s.checked_on)||s.checked_on>today()||!s.evidence)add(at,'官方来源须有名称、安全的HTTPS网址、不晚于今天的核对日期及核对依据。');}
    for(const c of d.contents)if(!c.label||c.page<1||c.page>d.page_map.length)add(at,'阅读目录的标题或跳转页序无效。');
    const version=JSON.stringify([d.document_kind,d.languages.slice().sort(),normalizeManualText(d.region_display),normalizeManualText(d.edition_display),d.edition_date]);
    const prior=versions.get(version)??new Set();if(d.model_keys.some(k=>prior.has(k)))add(at,'适用型号、用途、语言、地区和版本重复，请合并来源或写明版本区别。');for(const k of d.model_keys)prior.add(k);versions.set(version,prior);
  }
  let projection=null;
  if(!issues.length){try{projection=projectManualCatalog(manualPublicationInput(catalog),archives);}catch{add('目录','阅读图片、型号关系或其他公开字段未通过检查。');}}
  return {issues,projection};
}

export function createManualStore({root,siteDirectory,readArchives,build,guardCatalog=async()=>[],requireInitialization=false,publication=null}){
  root=path.resolve(root);siteDirectory=path.resolve(siteDirectory);
  const stateFile=path.join(root,'state.json'),sourceFile=path.join(siteDirectory,'src/data/generated/manuals-catalog.json'),dist=path.join(siteDirectory,'dist');
  if(inside(siteDirectory,root)||inside(root,siteDirectory))fail('说明书私密维护目录必须与网站项目分开。');
  const tickets=new Map();
  const operationFiles=new Map();
  const read=async()=>{
    await noLinks(root,stateFile);const raw=await optional(stateFile);let state;
    try{
      state=raw?JSON.parse(raw):blank();
      if(state.version!==1||!state.published||state.draft!==null&&!state.draft)throw new Error();
      normalizeManualDraft(state.published);if(state.draft)normalizeManualDraft(state.draft);
    }catch{fail('说明书保存记录无法核实，已停止写入，请先核对私密维护记录。',409,'MANUALS_STATE_INVALID');}
    return {state,revision:hash(raw??JSON.stringify(state)),exists:raw!==null};
  };
  const assertVersion=(current,expected)=>{if(!/^[a-f0-9]{64}$/.test(expected??''))fail('页面缺少目录版本，请重新打开维护页面。',428);if(current.revision!==expected)fail('目录已在其他页面更新，当前内容没有覆盖保存；请先核对最新版本。',409,'MANUALS_REVISION_CONFLICT');};
  const ensure=async()=>{await noLinks(path.dirname(root),root);await fs.mkdir(root,{recursive:true,mode:0o700});for(const name of ['history','transactions']){await noLinks(root,path.join(root,name));await fs.mkdir(path.join(root,name),{recursive:true,mode:0o700});}};
  const persist=async state=>{await ensure();await noLinks(root,stateFile);await atomicWrite(stateFile,JSON.stringify(state,null,2)+'\n');tickets.clear();};
  const snapshot=async(catalog,kind,reason='',actor='')=>{await ensure();const history_id=randomUUID();await atomicWrite(path.join(root,'history',history_id+'.json'),JSON.stringify({version:1,history_id,created_at:when(),kind,reason,...(actor?{actor}:{}),catalog},null,2)+'\n');return history_id;};
  const history=async()=>{const directory=path.join(root,'history');await noLinks(root,directory);const names=await fs.readdir(directory).catch(e=>{if(e.code==='ENOENT')return [];throw e;});const result=[];for(const name of names){if(!/^[a-f0-9-]{36}\.json$/.test(name))continue;await noLinks(root,path.join(directory,name));const row=JSON.parse(await fs.readFile(path.join(directory,name),'utf8'));result.push({history_id:row.history_id,created_at:row.created_at,kind:row.kind,reason:row.reason,count:row.catalog.documents.length});}return result.sort((a,b)=>b.created_at.localeCompare(a.created_at));};
  const pending=async()=>{const directory=path.join(root,'transactions');await noLinks(root,directory);const names=await fs.readdir(directory).catch(e=>{if(e.code==='ENOENT')return [];throw e;});const result=[];for(const name of names){if(!/^[a-f0-9-]{36}$/.test(name))continue;const file=path.join(directory,name,'manifest.json');await noLinks(root,file);const raw=await optional(file);if(!raw)continue;const m=JSON.parse(raw);if(!['complete','rolled-back'].includes(m.status))result.push({transaction_id:name,status:m.status,created_at:m.created_at});}return result;};
  const publicBaseline=async()=>{
    await noLinks(siteDirectory,sourceFile);const raw=await optional(sourceFile);
    try{
      const source=raw?JSON.parse(raw):empty(),archives=await readArchives();
      return {raw,source,projection:projectManualCatalog(source,archives),revision:hash(raw??'MANUALS_PUBLIC_INPUT_ABSENT')};
    }catch{fail('已有公开说明书目录无法核对，已停止写入；请先核对目录基线。',409,'MANUALS_PUBLIC_INPUT_INVALID');}
  };
  const maintenanceStatus=async current=>{
    if((await pending()).length)return {status:'blocked',code:'MANUALS_TRANSACTION_UNCERTAIN',message:'有中断的说明书发布需要核对，暂时不能写入；历史和原公开版本仍保留。'};
    const baseline=await publicBaseline();
    if(!current.exists){
      const count=baseline.source.documents.length;
      if(count||baseline.source.brands.length||baseline.source.models.length)return {status:'blocked',code:'MANUALS_BASELINE_REQUIRED',message:`已有公开说明书资料（${count}份文档），但缺少完整私密维护记录。请先恢复并核对记录，不能建立空目录覆盖。`};
      return {status:requireInitialization?'needs-initialization':'ready',publicRevision:baseline.revision,message:requireInitialization?'当前没有正式说明书条目。首次保存前，请确认建立空目录；不会导入演示资料。':''};
    }
    const expected=projectManualCatalog(manualPublicationInput(current.state.published),await readArchives());
    if(hash(expected)!==hash(baseline.projection))return {status:'blocked',code:'MANUALS_BASELINE_MISMATCH',message:'私密正式目录与当前公开输入不一致，已停止写入；请先核对版本，原资料没有被覆盖。'};
    return {status:'ready',publicRevision:baseline.revision,message:''};
  };
  const assertReady=async()=>{const status=await maintenanceStatus(await read());if(status.status==='blocked')fail(status.message,409,status.code);return status;};
  const reserveSpace=async(next,current)=>{
    let directory=root;while(!await fs.lstat(directory).catch(error=>{if(error.code==='ENOENT')return null;throw error;}))directory=path.dirname(directory);
    let space;try{space=await fs.statfs(directory,{bigint:true});}catch{fail('暂时无法核对保存空间，当前资料未改变，请稍后重试。',503,'MANUALS_STORAGE_UNAVAILABLE');}
    const required=BigInt(16*1024*1024+2*Buffer.byteLength(JSON.stringify(next))+(current.state.draft?Buffer.byteLength(JSON.stringify(current.state.draft)):0));
    if(space.bavail*space.bsize<required)fail('磁盘剩余空间不足，当前资料未改变；请先核对可清理的构建产物，不要删除档案或历史。',503,'MANUALS_STORAGE_FULL');
  };
  const archiveOptions=async()=>{const archives=await readArchives();return archives.filter(a=>a.core?.record_status==='ACT'&&a.core?.privacy_level==='G'&&a.core?.use_status==='U3'&&['OTH','RPR'].includes(a.core.object_type)&&a.metadata?.schema==='common').map(a=>({item_id:a.core.item_id,title:a.core.title,rights_status:a.core.rights_status,pages:(a.core.publication_file_path??[]).filter(src=>new RegExp(`^/archive/${a.core.item_id}/[a-zA-Z0-9_-]+\\.(?:jpe?g|png|webp)$`).test(src))}));};
  const imageFingerprint=async(catalog,archives)=>{
    const files=[];
    for(const doc of catalog.documents){if(doc.publication_status==='withdrawn')continue;for(const page of doc.page_map){const target=path.resolve(siteDirectory,'public','.'+page.attachment_ref);await noLinks(path.join(siteDirectory,'public','archive'),target,{missing:false});const bytes=await fs.readFile(target);try{assertPublicationImageSignature(bytes,{filename:path.basename(target)});}catch{fail('阅读附件内容不是允许的JPEG、PNG或WebP发布图片。');}files.push([page.attachment_ref,hash(bytes)]);}}
    const linked=new Set(catalog.documents.filter(d=>d.publication_status!=='withdrawn').map(d=>d.linked_archive_id).filter(Boolean));
    return hash({files,archives:archives.filter(a=>linked.has(a.core?.item_id))});
  };
  const check=async(current,catalog)=>{
    const archives=await readArchives(),result=validateManualPublication(catalog,archives);
    const sourceIssues=await guardCatalog(catalog);if(sourceIssues.length){result.issues.push(...sourceIssues);result.projection=null;}
    if(result.issues.length)return {...result,fingerprint:null};
    try{return {...result,fingerprint:await imageFingerprint(catalog,archives)};}catch(error){return {issues:[{where:'阅读附件',message:error instanceof ManualsError?error.message:'阅读附件缺失或无法读取，请先在档案管理中检查。'}],projection:null,fingerprint:null};}
  };
  const bootstrap=async()=>{
    let current;
    try{
      current=await read();const readiness=await maintenanceStatus(current);
      return {state:current.state,revision:current.revision,history:await history(),pending:await pending(),archives:await archiveOptions(),readiness,choices:{categories:manualCategories,kinds:manualKinds,languages:manualLanguages,completeness:manualCompleteness}};
    }catch(error){
      if(!requireInitialization)throw error;
      return {state:current?.state??blank(),revision:current?.revision??null,history:[],pending:[],archives:[],readiness:{status:'blocked',code:error instanceof ManualsError?error.code:'MANUALS_STATE_INVALID',message:error instanceof ManualsError?error.message:'维护记录暂时无法核对，已暂停写入；请由维护者核对私密资料。'},choices:{categories:manualCategories,kinds:manualKinds,languages:manualLanguages,completeness:manualCompleteness}};
    }
  };
  const save=async(payload,context={})=>{const status=await assertReady();const current=await read();assertVersion(current,payload.expectedRevision);const catalog=normalizeManualDraft(payload.catalog);
    const actor=typeof context.actor==='string'?context.actor.trim().slice(0,254):'';
    if(status.status==='needs-initialization'&&(payload.initializeEmpty!==true||payload.expectedPublicRevision!==status.publicRevision||!actor))fail('首次保存须重新核对当前空目录，并确认建立私密维护记录。',428,'MANUALS_INITIALIZATION_REQUIRED');
    for(const doc of catalog.documents){const prior=[...(current.state.draft?.documents??[]),...current.state.published.documents].find(row=>row.manual_key===doc.manual_key&&row.source_submission_id);if(prior){for(const field of ['source_submission_id','source_submission_revision','source_submission_digest','source_sharing_scope','source_pdf_digest']){if(Object.hasOwn(prior,field))doc[field]=prior[field];else delete doc[field];}}else if(doc.source_submission_id)fail('不能手工新增投稿审核绑定，请从说明书专用审核入口生成草稿。');}
    const next={...current.state,draft:catalog,updated_at:when()};
    if(!current.exists&&requireInitialization)next.initialization={kind:'confirmed-empty',created_at:when(),actor,public_input_sha256:status.publicRevision};
    await reserveSpace(next,current);
    if(current.state.draft)await snapshot(current.state.draft,'draft-before-save','',actor);
    context.markChanged?.();await persist(next);return {revision:(await read()).revision};};
  const planReviewedImport=async input=>{await assertReady();const current=await read();assertVersion(current,input.transfer.catalog_revision);const result=importManualCatalog(current.state.draft??current.state.published,{...input,archive:input.version.manual_metadata.sharing_scope==='reading-copy'?{item_id:'',page_map:[]}:null});normalizeManualDraft(result.catalog);return {revision:current.revision};};
  const importReviewed=async(input,context={})=>{
    await assertReady();const current=await read();assertVersion(current,input.transfer.catalog_revision);const result=importManualCatalog(current.state.draft??current.state.published,input);
    if(result.repeated)return {manual_key:result.manual_key,revision:current.revision,repeated:true};
    const catalog=normalizeManualDraft(result.catalog);if(current.state.draft)await snapshot(current.state.draft,'draft-before-save','接收已审核说明书前保留原目录草稿');context.markChanged?.();await persist({...current.state,draft:catalog,updated_at:when()});return {manual_key:result.manual_key,revision:(await read()).revision};
  };
  const prepare=async(payload,context={})=>{await assertReady();const current=await read();assertVersion(current,payload.expectedRevision);if(!current.state.draft)fail('请先保存目录草稿，再进行发布检查。');const result=await check(current,current.state.draft);if(result.issues.length)return {issues:result.issues};const review_id=randomUUID();tickets.set(review_id,{revision:current.revision,fingerprint:result.fingerprint,actor:context.actor??'',expires:Date.now()+30*60*1000});for(const [k,t]of tickets)if(t.expires<Date.now())tickets.delete(k);const old=new Set(current.state.published.documents.filter(d=>d.publication_status!=='withdrawn').map(d=>d.manual_key)),next=new Set(result.projection.documents.map(d=>d.manual_key));return {review_id,issues:[],documents:next.size,models:result.projection.models.length,removed:[...old].filter(k=>!next.has(k)),summary:result.projection.documents.map(d=>({manual_key:d.manual_key,title:d.title,pages:d.pages.length,sources:d.official_sources.length}))};};
  const transactLocal=async(current,next,kind,reason,context={})=>{
    await ensure();await assertReady();await noLinks(siteDirectory,sourceFile);await noLinks(siteDirectory,dist);
    const archives=await readArchives(),source=manualPublicationInput(next.published),projection=projectManualCatalog(source,archives),publicInput=pruneInput(source,projection);
    const job=path.join(root,'transactions',randomUUID());await fs.mkdir(job,{mode:0o700});
    const oldSource=await optional(sourceFile),oldState=await optional(stateFile),hadDist=Boolean(await fs.lstat(dist).catch(e=>{if(e.code==='ENOENT')return null;throw e;}));
    if(oldSource)await fs.writeFile(path.join(job,'previous-source.json'),oldSource,{flag:'wx',mode:0o600});
    if(oldState)await fs.writeFile(path.join(job,'previous-state.json'),oldState,{flag:'wx',mode:0o600});
    if(hadDist){await safeTree(dist);await fs.cp(dist,path.join(job,'previous-dist'),{recursive:true,errorOnExist:true,force:false});}
    const manifest={version:1,status:'prepared',created_at:when(),kind,reason,had_source:oldSource!==null,had_state:oldState!==null,had_dist:hadDist};
    const writeManifest=async(status,extra={})=>{Object.assign(manifest,{status,...extra});await atomicWrite(path.join(job,'manifest.json'),JSON.stringify(manifest,null,2)+'\n');};
    await writeManifest('prepared');await snapshot(current.state.published,kind,reason,context.actor??'');
    try{
      if(context.signal?.aborted)fail('操作已取消，目录尚未发布。',409);
      context.markChanged?.();await fs.mkdir(path.dirname(sourceFile),{recursive:true});await atomicWrite(sourceFile,JSON.stringify(publicInput,null,2)+'\n');await writeManifest('building');
      const buildOutput=await build({signal:context.signal});
      if(context.signal?.aborted)fail('操作已取消，正在恢复上次版本。',409);
      // 校验期间附件或档案发生变化时，原人工确认不再适用。
      if(context.fingerprint&&await imageFingerprint(next.published,await readArchives())!==context.fingerprint)fail('构建期间关联档案或图片发生变化，请重新核对。',409);
      if((await guardCatalog(next.published)).length)fail('构建期间投稿审核或停止处理状态发生变化，已停止采用本次目录。',409);
      assertVersion(await read(),current.revision);
      await persist(next);await writeManifest('complete',{completed_at:when()});
      return {revision:(await read()).revision,buildOutput,documents:projection.documents.length};
    }catch(error){
      try{
        if(await fs.lstat(dist).catch(()=>null)){await noLinks(siteDirectory,dist);await fs.rename(dist,path.join(job,'failed-dist'));}
        if(hadDist)await fs.rename(path.join(job,'previous-dist'),dist);
        if(oldSource)await atomicWrite(sourceFile,oldSource);else if(await optional(sourceFile))await fs.rename(sourceFile,path.join(job,'failed-source.json'));
        if(oldState)await atomicWrite(stateFile,oldState);else if(await optional(stateFile))await fs.rename(stateFile,path.join(job,'failed-state.json'));
        await writeManifest('rolled-back',{finished_at:when()});tickets.clear();
      }catch{fail('发布中断且恢复未能全部完成，已保留前后版本并暂停写入，请核对说明书私密目录。',503,'MANUALS_ROLLBACK_UNCERTAIN');}
      const cancelled=context.signal?.aborted||error.code==='OPERATION_CANCELLED';
      throw Object.assign(new ManualsError(cancelled?'操作已停止，本地原目录、页面和草稿保留。':'本次发布未完成，已恢复上次目录及页面，草稿仍保留。'+(error instanceof ManualsError?error.message:''),cancelled?409:400,cancelled?'OPERATION_CANCELLED':'MANUALS_BUILD_FAILED'),{safeToRetry:true,...(cancelled?{name:'OperationCancelledError'}:{})});
    }
  };
  const transactOnline=async(current,next,kind,reason,context)=>{
    if(typeof context.assertDeploymentLock!=='function'||!context.actor||!context.operationId||!context.stepId)fail('线上维护缺少部署锁或操作身份，未执行发布。',409,'MANUALS_LOCK_REQUIRED');
    const assertHeld=context.assertDeploymentLock;assertHeld();await assertReady();assertVersion(await read(),current.revision);
    await noLinks(siteDirectory,sourceFile);await noLinks(root,stateFile);
    const oldSource=await optional(sourceFile),oldState=await optional(stateFile),publicationBefore=await publication.capture();
    const expectedFingerprint=context.fingerprint??await imageFingerprint(next.published,await readArchives());
    await reserveSpace(next,current);await ensure();
    const transaction_id=randomUUID(),job=path.join(root,'transactions',transaction_id);await fs.mkdir(job,{mode:0o700});
    if(oldSource)await fs.writeFile(path.join(job,'previous-source.json'),oldSource,{flag:'wx',mode:0o600});
    if(oldState)await fs.writeFile(path.join(job,'previous-state.json'),oldState,{flag:'wx',mode:0o600});
    const manifest={version:2,transaction_id,status:'prepared',created_at:when(),kind,reason,actor:context.actor,operation_id:context.operationId,step_id:context.stepId,expected_revision:current.revision,source_before_sha256:oldSource?hash(oldSource):null,state_before_sha256:oldState?hash(oldState):null,publicationBefore};
    operationFiles.set(context.operationId+'.'+context.stepId,path.join(job,'manifest.json'));
    const writeManifest=async(status,extra={})=>{Object.assign(manifest,{status,...extra});await atomicWrite(path.join(job,'manifest.json'),JSON.stringify(manifest,null,2)+'\n');};
    await writeManifest('prepared');
    const validate=async()=>{
      assertHeld();assertVersion(await read(),current.revision);
      if(context.signal?.aborted)fail('操作已请求停止，正在保留原公开版本。',409,'OPERATION_CANCELLED');
      if(await imageFingerprint(next.published,await readArchives())!==expectedFingerprint)fail('构建期间关联档案或图片变化，请重新核对。',409);
      if((await guardCatalog(next.published)).length)fail('构建期间投稿审核或停止处理状态发生变化，不能采用本次目录。',409);
    };
    try{
      await validate();await snapshot(current.state.published,kind,reason,context.actor);
      const archives=await readArchives(),source=manualPublicationInput(next.published),projection=projectManualCatalog(source,archives);
      context.markChanged?.();await fs.mkdir(path.dirname(sourceFile),{recursive:true});await atomicWrite(sourceFile,JSON.stringify(pruneInput(source,projection),null,2)+'\n');
      await writeManifest('building');const buildOutput=await build({signal:context.signal});await validate();
      await writeManifest('built');await publication.publish(manifest,writeManifest,{signal:context.signal,validate,assertHeld});
      // 切换成功后即使收到晚到的停止请求，也先完成状态和回执，不把已经公开误报为取消。
      assertHeld();await publication.verify(manifest);
      next.last_publication={transaction_id,operation_id:context.operationId,step_id:context.stepId,release_name:manifest.publicationAfter.releaseName,completed_at:when()};
      await persist(next);const revision=(await read()).revision;
      await writeManifest('complete',{committed_revision:revision,completed_at:when()});
      return {revision,transaction_id,publicRelease:manifest.publicationAfter.releaseName,documents:projection.documents.length,buildOutput};
    }catch(error){
      try{
        assertHeld();await publication.rollback(manifest,assertHeld);
        const stateNow=await read();if(stateNow.revision!==current.revision&&stateNow.state.last_publication?.transaction_id!==transaction_id)fail('维护状态已有不同变更，不能自动覆盖。',409,'MANUALS_RECOVERY_CONFLICT');
        if(oldSource)await atomicWrite(sourceFile,oldSource);else if(await optional(sourceFile))await fs.rename(sourceFile,path.join(job,'failed-source.json'));
        if(oldState)await atomicWrite(stateFile,oldState);else if(await optional(stateFile))await fs.rename(stateFile,path.join(job,'failed-state.json'));
        await writeManifest('rolled-back',{finished_at:when()});tickets.clear();
      }catch{
        await writeManifest('needs-review',{finished_at:when()}).catch(()=>{});
        fail('发布结果无法全部核实，前后版本已保留，相关写入已暂停，请核对操作记录。',503,'MANUALS_ROLLBACK_UNCERTAIN');
      }
      const cancelled=context.signal?.aborted||error.code==='OPERATION_CANCELLED';
      throw Object.assign(new ManualsError(cancelled?'操作已停止，原公开版本和草稿保留。':'本次发布未完成，已保留原公开版本和草稿，请核对后重试。',409,cancelled?'OPERATION_CANCELLED':'MANUALS_BUILD_FAILED'),{safeToRetry:true,...(cancelled?{name:'OperationCancelledError'}:{})});
    }
  };
  const transact=(...args)=>publication?transactOnline(...args):transactLocal(...args);
  const publish=async(payload,context={})=>{
    await assertReady();const current=await read();assertVersion(current,payload.expectedRevision);const ticket=tickets.get(payload.review_id);
    if(!ticket||ticket.expires<Date.now()||ticket.revision!==current.revision||ticket.actor!==(context.actor??''))fail('发布检查已失效或维护身份已改变，请重新检查并人工确认。',428);
    if(!Array.isArray(payload.confirmations)||payload.confirmations.length!==5||payload.confirmations.some(v=>v!==true))fail('请逐项完成人工确认，不能自动跳过隐私与来源检查。',428);
    const result=await check(current,current.state.draft);if(result.issues.length||result.fingerprint!==ticket.fingerprint)fail('资料、关联档案或图片已变化，请重新进行发布检查。',409);
    const next={...current.state,published:current.state.draft,draft:null,updated_at:when()};
    return transact(current,next,'published-before-update','目录经维护者逐项确认发布',{...context,fingerprint:ticket.fingerprint});
  };
  const withdraw=async(payload,context={})=>{
    await assertReady();const current=await read();assertVersion(current,payload.expectedRevision);id(payload.manual_key,'manual');
    const reason=str(payload.reason,500);if(payload.confirmed!==true||reason.length<2)fail('请说明撤下原因并确认本次影响。');
    const doc=current.state.published.documents.find(d=>d.manual_key===payload.manual_key&&d.publication_status!=='withdrawn');if(!doc)fail('该说明书未公开或已经撤下。',404);
    const next=structuredClone(current.state);if(next.draft)await snapshot(next.draft,'draft-before-withdrawal',reason,context.actor??'');
    for(const catalog of [next.published,next.draft].filter(Boolean)){const row=catalog.documents.find(d=>d.manual_key===payload.manual_key);if(row)row.publication_status='withdrawn';}
    next.updated_at=when();return transact(current,next,'published-before-withdrawal',reason,context);
  };
  const restore=async(payload,context={})=>{
    await assertReady();const current=await read();assertVersion(current,payload.expectedRevision);if(!/^[a-f0-9-]{36}$/.test(payload.history_id??''))fail('历史版本标识无效。');
    const file=path.join(root,'history',payload.history_id+'.json');await noLinks(root,file);const raw=await optional(file);if(!raw)fail('找不到该历史版本。',404);const saved=JSON.parse(raw);if(saved.version!==1||saved.history_id!==payload.history_id)fail('历史版本内容无法核实。');
    const draft=normalizeManualDraft(saved.catalog);if(current.state.draft)await snapshot(current.state.draft,'draft-before-restore','恢复其他历史前保留当前草稿',context.actor??'');context.markChanged?.();await persist({...current.state,draft,updated_at:when()});return {revision:(await read()).revision};
  };
  const previewSelection=async(expectedRevision,manualKey)=>{
    const current=await read();try{assertVersion(current,expectedRevision);}catch(error){if(error.code==='MANUALS_REVISION_CONFLICT')fail('草稿已更新，这个预览地址已失效。请回到维护页面重新打开预览。',409,'MANUALS_PREVIEW_STALE');throw error;}
    const readiness=await maintenanceStatus(current);if(readiness.status==='blocked')fail(readiness.message,409,readiness.code);
    id(manualKey,'manual');const catalog=current.state.draft??current.state.published;
    const d=catalog.documents.find(d=>d.manual_key===manualKey&&d.publication_status!=='withdrawn');if(!d)fail('请先保存并选择一份未撤下的说明书。',404);
    return {current,selected:{...catalog,documents:[d]}};
  };
  const preview=async(expectedRevision,manualKey)=>{const {current,selected}=await previewSelection(expectedRevision,manualKey);const result=await check(current,selected);return {issues:result.issues,document:result.projection?.documents[0]??null,models:result.projection?.models??[],brands:result.projection?.brands??[],labels:{languages:manualLanguages,completeness:manualCompleteness}};};
  const previewImage=async(expectedRevision,manualKey,page)=>{
    if(!Number.isSafeInteger(page)||page<1)fail('预览页序无效。');
    const {selected}=await previewSelection(expectedRevision,manualKey),archives=await readArchives();
    const result=validateManualPublication(selected,archives),sourceIssues=await guardCatalog(selected);
    if(result.issues.length||sourceIssues.length)fail('预览资料或关联档案已变化，请回到维护页核对。',409,'MANUALS_PREVIEW_INVALID');
    const entry=result.projection.documents[0]?.pages[page-1];if(!entry)fail('预览页序超出本册范围。',404);
    const target=path.resolve(siteDirectory,'public','.'+entry.src);
    await noLinks(path.join(siteDirectory,'public/archive'),target,{missing:false});
    let bytes;try{bytes=await fs.readFile(target);assertPublicationImageSignature(bytes,{filename:path.basename(target)});}catch{fail('当前发布图片暂时无法读取，请保留页码并稍后重试。',404,'MANUALS_PREVIEW_IMAGE_UNAVAILABLE');}
    return bytes;
  };
  const sync=async()=>{
    await noLinks(root,stateFile);await noLinks(siteDirectory,sourceFile);
    if((await pending()).length)fail('有中断的说明书发布需要核对，不能通过同步继续写入。',409,'MANUALS_TRANSACTION_UNCERTAIN');
    if(!await optional(stateFile)){
      // 新代码部署继承已有公开投影，不能因本机私密目录未迁移而清空它。
      const raw=await optional(sourceFile);if(raw)projectManualCatalog(JSON.parse(raw),await readArchives());return;
    }
    await assertReady();const current=await read(),source=manualPublicationInput(current.state.published);const sourceIssues=await guardCatalog(current.state.published);if(sourceIssues.length)fail('投稿状态或提供范围已变化，请先处理说明书目录中的关联问题。',409);const projection=projectManualCatalog(source,await readArchives());
    await fs.mkdir(path.dirname(sourceFile),{recursive:true});await atomicWrite(sourceFile,JSON.stringify(pruneInput(source,projection),null,2)+'\n');
  };
  const assertSettled=async()=>{if((await pending()).length)fail('说明书发布仍有待核对事务，相关网站写入暂已停止。',409,'MANUALS_TRANSACTION_UNCERTAIN');};
  const findOperation=async(operationId,stepId)=>{
    if(!/^[a-f0-9-]{36}$/i.test(operationId??'')||!/^[a-f0-9-]{36}$/i.test(stepId??''))fail('操作编号无效。');
    const key=operationId.toLowerCase()+'.'+stepId.toLowerCase();
    if(!operationFiles.has(key)){
      const directory=path.join(root,'transactions');await noLinks(root,directory);
      for(const name of await fs.readdir(directory).catch(error=>{if(error.code==='ENOENT')return [];throw error;})){
        if(!/^[a-f0-9-]{36}$/i.test(name))continue;const file=path.join(directory,name,'manifest.json');await noLinks(root,file);const raw=await optional(file);if(!raw)continue;
        const record=JSON.parse(raw);if(record.version!==2||!record.operation_id||!record.step_id)continue;
        const entryKey=record.operation_id+'.'+record.step_id;
        if(operationFiles.has(entryKey)&&operationFiles.get(entryKey)!==file)fail('同一操作出现多份事务，不能自动核对。',409,'MANUALS_OPERATION_UNPROVEN');
        operationFiles.set(entryKey,file);
      }
    }
    const file=operationFiles.get(key);if(!file)return null;await noLinks(root,file);const record=JSON.parse(await fs.readFile(file,'utf8'));
    if(record.version!==2||record.operation_id+'.'+record.step_id!==key||record.transaction_id!==path.basename(path.dirname(file)))fail('事务与操作编号不匹配，不能自动核对。',409,'MANUALS_OPERATION_UNPROVEN');
    return record;
  };
  const operationSummary=async(operationId,stepId)=>{
    const record=await findOperation(operationId,stepId);return record?{transactionId:record.transaction_id,phase:record.status,...(record.publicationAfter?.releaseName?{publicRelease:record.publicationAfter.releaseName}:{})}:null;
  };
  const proveOperation=async(operationId,stepId)=>{
    const record=await findOperation(operationId,stepId);if(!record)return (await pending()).length?{status:'unproven'}:null;
    if(!publication)return {status:'unproven'};
    const current=await read();await noLinks(siteDirectory,sourceFile);
    if(record.status==='complete'&&current.revision===record.committed_revision){await publication.verify(record);return {status:'succeeded',result:{revision:current.revision}};}
    if(record.status==='rolled-back'){
      const state=await optional(stateFile),source=await optional(sourceFile);
      if((state?hash(state):null)!==record.state_before_sha256||(source?hash(source):null)!==record.source_before_sha256)return {status:'unproven'};
      await publication.verifyBefore(record);return {status:'failed'};
    }
    return {status:'unproven'};
  };
  const pruneAfterOperation=async(operationId,stepId)=>{const record=await findOperation(operationId,stepId);if(publication&&record?.status==='complete')return publication.prune(record);return null;};
  return {bootstrap,save,prepare,publish,withdraw,restore,preview,previewImage,sync,planReviewedImport,importReviewed,assertSettled,operationSummary,proveOperation,pruneAfterOperation};
}
