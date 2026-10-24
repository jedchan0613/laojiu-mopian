// 第一阶段仅比较和保存私密方案；此模块没有写正式档案、移动图片、发布或撤销入口。
import fs from 'node:fs/promises';
import path from 'node:path';
import { randomUUID, createHash } from 'node:crypto';
import { constants } from 'node:fs';
import { isDeepStrictEqual as equal } from 'node:util';
import { atomicWrite, digest, operationIdPattern, WriteSafetyError } from './write-coordinator.mjs';
import { assertPublicationImageSignature } from '../shared/publication-image-safety.mjs';

const itemPattern = /^LJM-\d{8}-[A-Z]{3}-\d{3}$/;
const schemaFor = { PHO:'photo', NEG:'photo', SLD:'photo', ALB:'photo', PCD:'postcard', PST:'postcard', DIA:'diary_notebook', NTB:'diary_notebook', IDC:'credential', CRD:'card', LET:'common', RPR:'common', OTH:'common' };
const frozen = new Set('item_id accession_date object_type item_seq batch_id record_status privacy_level use_status collection_code master_file_path access_file_path publication_file_path checksum_sha256 record_creator created_date updated_date id_check required_check'.split(' '));
const photoOnly = new Set('photo_function shot_form photography_source studio_photographer people_count verso_types verso_transcription'.split(' '));
const publicDefinitions = { description:'公开描述', transcription:'公开电子转录', tags:'公开检索标签', image_descriptions:'逐图说明', revision_note:'公开修订说明' };
const integerFields = new Set(['item_seq','people_count','leaf_count','page_count']);
const numberFields = new Set(['width_mm','height_mm','scan_ppi']);
const dictionaryAliases = { postal_mark_types:'postal_mark', postcard_process:'process', card_functions:'card_function', card_technologies:'card_technology', security_features:'security_feature' };
const safeKeys = values => { if (values.some(key => !/^[A-Za-z][A-Za-z0-9_]*$/.test(key) || ['__proto__','prototype','constructor'].includes(key))) fail('字段路径不在规范中。',422,'MERGE_FIELD_INVALID'); };
const fail = (message, status=422, code='MERGE_INVALID') => { throw new WriteSafetyError(message,status,code); };
const hasValue = value => value !== undefined && value !== null && value !== '' && (!Array.isArray(value) || value.length > 0);
const get = (record, key) => key.split('.').reduce((value, name) => value?.[name], record);
const exists = (record, key) => { const names=key.split('.'),parent=names.slice(0,-1).reduce((v,n)=>v?.[n],record);return parent!==null&&typeof parent==='object'&&Object.hasOwn(parent,names.at(-1)); };
const put = (record, key, value, present=true) => { const names=key.split('.');safeKeys(names);let parent=record;for(const name of names.slice(0,-1))parent=parent[name]??=(Object.create(null));if(present)parent[names.at(-1)]=structuredClone(value);else delete parent[names.at(-1)]; };
const checkActor = actor => { if(typeof actor!=='string'||actor.length<1||actor.length>256)fail('维护身份无效。',403,'MERGE_FORBIDDEN');return actor; };
const note = (value, maximum=4000) => { if(typeof value!=='string'||value.length>maximum||/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(value))fail('说明文字过长或含控制字符。');return value; };
const cleanRecord = record => { const copy=structuredClone(record);delete copy._admin;for(const key of ['master_file_path','access_file_path'])if(hasValue(copy.core?.[key]))copy.core[key]='〔私密路径不在合并方案中展示〕';return copy; };

// 比较用户的有效决策，不把请求编号、保存时间或显式写出的默认值当成内容变更。
export const mergePlanContentDigest = plan => digest({
  primaryId:plan.primaryId,secondaryId:plan.secondaryId,basisFingerprint:plan.basisFingerprint,
  fieldChoices:Object.fromEntries(plan.fields.filter(field=>!field.readonly).map(field=>{
    const decision=plan.fieldChoices[field.path]??(field.defaultChoice?{choice:field.defaultChoice}:null);
    if(!decision)return[field.path,{unresolved:true}];
    const selected=['primary','secondary'].includes(decision.choice)?{value:field[decision.choice],present:field[decision.choice+'Present']}:
      decision.choice==='union'?{value:[...new Set([field.primary,field.secondary].flatMap(value=>value===null?[]:Array.isArray(value)?value:[value]))],present:true}:
      {value:decision.value,present:decision.value!==null};
    return[field.path,{...selected,reason:decision.reason??''}];
  })),
  attachmentOrder:plan.attachmentOrder,
  excludedImages:plan.excludedImages.map(row=>({ref:row.ref,reason:row.reason??''})).sort((a,b)=>a.ref.localeCompare(b.ref)),
  attachmentDescriptions:Object.fromEntries(plan.sourceImages.map(image=>[image.ref,plan.attachmentDescriptions?.[image.ref]??image.description??''])),
  sourceReason:plan.sourceReason,primaryReason:plan.primaryReason,
});

export function buildMergeFields(left, right, standards, policies) {
  const rows=[],routing=new Set(standards.fieldRouting.core_canonical_fields),common=new Map(standards.commonFields.fields.map(field=>[field.field_code,field]));
  for(const record of [left,right]) {
    for(const key of Object.keys(record.core))if(!common.has(key)&&key!=='collection_code')fail('基本信息字段尚未配置合并策略：'+key,422,'MERGE_POLICY_MISSING');
    for(const key of Object.keys(record.public_view))if(!Object.hasOwn(publicDefinitions,key))fail('公开字段尚未配置合并策略：'+key,422,'MERGE_POLICY_MISSING');
  }
  const add=(key,label,definition={},rule='按证据明确选择；不自动把未知当空值。')=>{
    const a=get(left,key),b=get(right,key),aPresent=exists(left,key),bPresent=exists(right,key),same=equal(a,b)&&aPresent===bPresent;
    const fieldName=key.split('.').at(-1),masked=/masked|signature|fingerprint/.test(fieldName),readonly=(key.startsWith('core.')&&frozen.has(fieldName))||fieldName==='image_descriptions';
    const declaredDictionary=String(definition.dictionary_or_multi_value_rule??'').split('｜')[0].trim();
    const dictionaryKey=dictionaryAliases[fieldName]??(standards.codeDictionary.entries.some(entry=>entry.enabled&&entry.dictionary_key===declaredDictionary)?declaredDictionary:fieldName);
    const options=standards.codeDictionary.entries.filter(entry=>entry.enabled&&(entry.dictionary_key===dictionaryKey||entry.field===fieldName)).map(entry=>({code:entry.code,label:entry.label}));
    const multi=fieldName==='tags'||String(definition.dictionary_or_multi_value_rule??'').includes('｜是')||String(definition.data_type??'').includes('多值')||Array.isArray(a)||Array.isArray(b);
    const type=multi?'array':typeof a==='boolean'||typeof b==='boolean'?'boolean':integerFields.has(fieldName)||numberFields.has(fieldName)||typeof a==='number'||typeof b==='number'||/整数|小数|数值|数字/.test(definition.data_type??'')?'number':'text';
    rows.push({path:key,label,section:definition.section??(key.startsWith('metadata.')?'对象专属信息':'公开呈现'),rule,required:Boolean(definition.required),readonly,masked,type,options,
      primary:a??null,secondary:b??null,primaryPresent:aPresent,secondaryPresent:bPresent,same,
      defaultChoice:readonly||same?'primary':fieldName==='tags'?'union':null,
      integer:integerFields.has(fieldName),allowedChoices:readonly?['primary']:['primary','secondary','custom',...(multi&&!masked?['union']:[])],
      suggestion:!hasValue(a)&&hasValue(b)?'从件有值，可核对依据后补入；未知代码不等同空白。':''});
  };
  for(const field of common.values()){
    if(!policies[field.field_code])fail('规范新增字段尚未配置合并策略：'+field.name,422,'MERGE_POLICY_MISSING');
    const a=left.core?.[field.field_code],b=right.core?.[field.field_code];
    if(photoOnly.has(field.field_code)&&left.metadata.schema!=='photo'&&!hasValue(a)&&!hasValue(b))continue;
    if(!field.required&&!hasValue(a)&&!hasValue(b)&&!['title','date_display','album_id','collection_id','series_id','related_item_ids','notes'].includes(field.field_code))continue;
    add('core.'+field.field_code,field.name,field,policies[field.field_code]);
  }
  add('core.collection_code','收藏编码',{},'由最终类型、显示年代和规范维度自动重算，不能手工填写。');
  const dimensions=standards.dimensions[left.metadata.schema]?.dimensions??[];
  const allowedDimensions=new Map(dimensions.map(dim=>[dim.dimension_code,new Set(dim.fields)]));
  for(const record of [left,right])for(const[code,values]of Object.entries(record.metadata.dimensions??{})){
    if(!allowedDimensions.has(code))fail('对象专属维度不符合当前schema：'+code,422,'MERGE_SCHEMA_INVALID');
    for(const key of Object.keys(values)){safeKeys([key]);if(!allowedDimensions.get(code).has(key))fail('对象专属字段没有规范定义：'+key,422,'MERGE_FIELD_INVALID');}
  }
  for(const dim of dimensions)for(const key of dim.fields){
    if(routing.has(key)){
      for(const record of [left,right])if(hasValue(record.metadata.dimensions?.[dim.dimension_code]?.[key])&&!equal(record.metadata.dimensions[dim.dimension_code][key],record.core[key]))fail('基本信息与专属维度的旧值未统一，请先处理：'+key,422,'MERGE_ROUTING_CONFLICT');
      continue;
    }
    const fieldPath='metadata.dimensions.'+dim.dimension_code+'.'+key;
    if(!exists(left,fieldPath)&&!exists(right,fieldPath))continue;
    add(fieldPath,dim.name+' / '+key,common.get(key)??{},/masked/.test(key)?'仅选择现有遮盖表示或重新脱敏；禁止拼接或互补还原。':'按当前schema及正式字典核对；数量、尺寸及单值冲突不求和、不取最大值。');
  }
  for(const[key,label]of Object.entries(publicDefinitions))add('public_view.'+key,label,{},key==='transcription'?'按最终图像逐页整理原文；保留疑读与遮盖，图片重排后必须重新核对页号。':key==='image_descriptions'?'逐图说明随附件排序和取舍生成。':'按整件内容核对；公开描述不能直接拼接矛盾说法。');
  return rows;
}

function validateChoice(field, decision) {
  if(!decision||typeof decision!=='object'||Array.isArray(decision)||!field.allowedChoices.includes(decision.choice))fail('字段选择无效：'+field.label,422,'MERGE_FIELD_INVALID');
  if(Object.keys(decision).some(key=>!['choice','value','reason'].includes(key)))fail('字段选择包含未知参数。');
  note(decision.reason??'',1000);
  if(['primary','secondary'].includes(decision.choice)){
    const value=field[decision.choice],present=field[decision.choice+'Present'];
    if(field.options.length&&present&&hasValue(value)){const allowed=new Set(field.options.map(row=>row.code));for(const code of Array.isArray(value)?value:[value])if(!allowed.has(code))fail('来源含未在字典中的代码，请先核对：'+field.label,422,'MERGE_CODE_INVALID');}
    return{value,present};
  }
  if(decision.choice==='union'){
    if(field.masked||!['array'].includes(field.type))fail('单值或遮盖字段不能拼接。');
    const values=[field.primary,field.secondary].flatMap(value=>value===null?[]:Array.isArray(value)?value:[value]);
    if(values.some(value=>typeof value!=='string'))fail('多值字段只能包含文本或正式代码。');
    if(field.options.length&&values.some(value=>!field.options.some(option=>option.code===value)))fail('并集含未在字典中的代码：'+field.label,422,'MERGE_CODE_INVALID');
    return{value:[...new Set(values)],present:true};
  }
  const value=decision.value;
  if(field.type==='array'){
    if(!Array.isArray(value)||value.length>300||value.some(v=>typeof v!=='string'||v.length>2000))fail('多值字段应为文字数组：'+field.label);
  }else if(field.type==='number'){
    if(value!==null&&(typeof value!=='number'||!Number.isFinite(value)||value<0))fail('请输入有效数值：'+field.label);
    if(value!==null&&field.integer&&!Number.isSafeInteger(value))fail('本字段应为非负整数：'+field.label);
    if(value===0&&/width_mm|height_mm/.test(field.path))fail('实物尺寸不能用0代替未知。');
  }else if(field.type==='boolean'){if(typeof value!=='boolean'&&value!==null)fail('布尔字段值无效。');}
  else note(value,field.path==='public_view.transcription'?200000:20000);
  if(field.options.length){const allowed=new Set(field.options.map(row=>row.code));for(const code of Array.isArray(value)?value:[value])if(code!==null&&code!==''&&!allowed.has(code))fail('未在字典中的代码：'+field.label,422,'MERGE_CODE_INVALID');}
  if(/(?:^|\.)(?:date_start|date_end|accession_date|issue_date|registration_date|writing_date|dispatch_date|arrival_date|valid_from|valid_to|birth_date)$/.test(field.path)&&hasValue(value)){
    const match=/^(\d{4})(?:-(\d{2})(?:-(\d{2}))?)?$/.exec(value);
    if(!match||Number(match[1])<1||match[2]&&(Number(match[2])<1||Number(match[2])>12)||match[3]&&(Number(match[3])<1||Number(match[3])>new Date(Date.UTC(Number(match[1]),Number(match[2]),0)).getUTCDate()))fail('日期格式或实际日历日期不正确。');
  }
  return{value,present:value!==null};
}

export function createMergePlanner({ directory, imageRoot, readState, readRecords, getStandards, policies, validateRecord=async()=>[], collectionCode=()=>null, inspectReferences=async()=>[], now=()=>new Date() }) {
  let tail=Promise.resolve();
  const requireId=id=>{if(!operationIdPattern.test(id??''))fail('方案编号无效。',404,'MERGE_PLAN_NOT_FOUND');return id.toLowerCase();};
  const safeRead=async file=>{try{for(const dir of[directory,path.dirname(file)])if((await fs.lstat(dir)).isSymbolicLink())fail('私密方案目录不能是链接。',403);const root=await fs.realpath(directory),parent=await fs.realpath(path.dirname(file)),relative=path.relative(root,parent);if(relative.startsWith('..')||path.isAbsolute(relative))fail('私密方案路径越界。',403);const stat=await fs.lstat(file);if(!stat.isFile()||stat.isSymbolicLink()||stat.size>6*1024*1024)fail('私密方案文件类型或大小异常，已停止读取。',403);return JSON.parse(await fs.readFile(file,'utf8'));}catch(error){if(error.code==='ENOENT')return null;throw error;}};
  const initialize=async()=>{
    await fs.mkdir(directory,{recursive:true,mode:0o700});if((await fs.lstat(directory)).isSymbolicLink())fail('私密方案目录不能是链接。',403);
    for(const name of ['plans','versions','plan-operations']){const dir=path.join(directory,name);await fs.mkdir(dir,{recursive:true,mode:0o700});if((await fs.lstat(dir)).isSymbolicLink())fail('私密方案子目录不能是链接。',403);}
  };
  const planFile=id=>path.join(directory,'plans',requireId(id)+'.json');
  async function images(record) {
    const id=record.core.item_id,root=await fs.realpath(imageRoot),folder=path.join(root,id),stat=await fs.lstat(folder);
    if(!stat.isDirectory()||stat.isSymbolicLink())fail('待入站图片目录类型异常。',422,'MERGE_IMAGE_INVALID');
    const rows=[],names=new Set();
    for(const[pIndex,p]of (record.core.publication_file_path??[]).entries()){
      const filename=path.basename(p);if(p!==`/archive/${id}/${filename}`||!/^[-A-Za-z0-9_]+(?:[-A-Za-z0-9_.]*?)\.(jpe?g|png|webp)$/i.test(filename))fail('图片路径与永久编号不一致。',422,'MERGE_IMAGE_INVALID');
      if(names.has(filename.toLowerCase()))fail('图片文件名存在大小写冲突。',422,'MERGE_IMAGE_INVALID');names.add(filename.toLowerCase());
      const file=path.join(folder,filename),before=await fs.lstat(file);if(!before.isFile()||before.isSymbolicLink()||before.size>30*1024*1024)fail('图片必须是有效的常规发布副本。',422,'MERGE_IMAGE_INVALID');
      const handle=await fs.open(file,constants.O_RDONLY|(constants.O_NOFOLLOW??0));let bytes;
      try{const opened=await handle.stat();if(!opened.isFile()||opened.ino!==before.ino||opened.dev!==before.dev)fail('图片文件在检查期间被替换。',409,'MERGE_STALE');bytes=await handle.readFile();}finally{await handle.close();}
      assertPublicationImageSignature(bytes,{filename});const after=await fs.lstat(file);if(after.isSymbolicLink()||after.ino!==before.ino||after.dev!==before.dev||after.size!==before.size||after.mtimeMs!==before.mtimeMs)fail('图片在检查期间发生变化，请重新核对。',409,'MERGE_STALE');
      const sha256=createHash('sha256').update(bytes).digest('hex');rows.push({ref:digest({id,filename,sha256}),itemId:id,filename,sha256,sourcePosition:pIndex+1,description:record.public_view.image_descriptions?.[pIndex]??'',url:'/api/image/'+id+'/'+encodeURIComponent(filename)});
    }
    if(!rows.length)fail('档案没有可核对的发布图片。',422,'MERGE_IMAGE_MISSING');return rows;
  }
  async function preflight(itemIds,actor) {
    checkActor(actor);if(!Array.isArray(itemIds)||itemIds.length!==2||new Set(itemIds).size!==2||itemIds.some(id=>!itemPattern.test(id)))fail('请选择两件不同的正式档案。');
    const states=await Promise.all(itemIds.map(readState)),standards=await getStandards(),blockers=[],warnings=[];
    const add=(code,message,itemId)=>blockers.push({code,message,...(itemId?{itemId}:{}),scope:'record'});
    for(let index=0;index<states.length;index++){
      const state=states[index],r=state.official,id=itemIds[index];
      if(!r){add('NOT_OFFICIAL','档案不存在或只有草稿。',id);continue;}
      if(!r.core||!r.metadata||!r.public_view||typeof r.core!=='object'||typeof r.metadata!=='object'||typeof r.public_view!=='object'){add('RECORD_INVALID','档案结构不完整，请先修复。',id);continue;}
      if(r.core.item_id!==id)add('ID_MISMATCH','正式文件与档案内的永久编号不一致，请先修复。',id);
      if(state.draft)add('DRAFT_EXISTS','这件档案已有草稿，请先处理草稿。',id);
      if(r.core.record_status!=='ACT'||r.core.privacy_level!=='G'||r.core.use_status!=='U3')add('NOT_PUBLISHED','首版仅支持已公开的有效档案。',id);
      if(schemaFor[r.core.object_type]!==r.metadata?.schema)add('SCHEMA_INVALID','对象类型与schema不一致。',id);
      if(hasValue(r.core.master_file_path)||hasValue(r.core.access_file_path))add('PRIVATE_PATH','档案含主档或访问路径，请先通过现有流程核对；不会读取该文件。',id);
      for(const issue of await validateRecord(r,standards))if(issue.code!=='privacy_confirmation')add(issue.code,issue.message,id);
    }
    const left=states[0].official,right=states[1].official;
    if(left?.core&&right?.core){
      if(left.core.object_type!==right.core.object_type||left.metadata?.schema!==right.metadata?.schema)add('TYPE_MISMATCH','两件档案必须同类型、同schema。');
      for(const key of ['collection_id','album_id','series_id'])if(hasValue(left.core[key])&&hasValue(right.core[key])&&!equal(left.core[key],right.core[key]))add('GROUP_MISMATCH','两件资料的组合归属不同，请先核对：'+key);
    }
    const summaries=states.map((state,index)=>({itemId:itemIds[index],revision:state.revision,record:state.official?cleanRecord(state.official):null,hasDraft:Boolean(state.draft)}));
    if(blockers.length)return{pass:false,canCompare:false,canExecute:false,phase:1,blockers,warnings,records:summaries,fields:[],images:[],references:[]};
    let attachments;try{attachments=(await Promise.all(states.map(state=>images(state.official)))).flat();}catch(error){add('IMAGE_INVALID',error.code==='ENOENT'?'私密待入站区缺少图片，请先核对现有发布副本。':error.message);return{pass:false,canCompare:false,canExecute:false,phase:1,blockers,warnings,records:summaries,fields:[],images:[],references:[]};}
    let fields;try{fields=buildMergeFields(left,right,standards,policies);}catch(error){add(error.code??'FIELD_INVALID',error.message);return{pass:false,canCompare:false,canExecute:false,phase:1,blockers,warnings,records:summaries,fields:[],images:attachments,references:[]};}
    const allRecords=await readRecords(),references=await inspectReferences(itemIds,allRecords);
    for(const ref of references)if(ref.availability==='unknown'||ref.availability==='unavailable'||ref.blocking)warnings.push({code:'REFERENCE_PENDING',message:ref.label+'：'+(ref.message??'执行阶段仍需完成核对。')});
    const fingerprints={revisions:Object.fromEntries(summaries.map(row=>[row.itemId,row.revision])),images:attachments.map(({ref,sha256})=>({ref,sha256})),references:digest(references),standards:digest({standards,policies})};
    const seen=new Map();for(const image of attachments){image.duplicateOf=seen.get(image.sha256)??null;seen.set(image.sha256,image.ref);}
    const recommended=[left,right].slice().sort((a,b)=>String(a.core.created_date??'9999').localeCompare(String(b.core.created_date??'9999'))||a.core.item_id.localeCompare(b.core.item_id))[0].core.item_id;
    warnings.unshift({code:'SAME_SOURCE_REQUIRED',message:'同作者、同相册或版式相似不代表同一件，请填写同源依据。'}, {code:'PHASE_ONE',message:'比较和保存方案不会执行合并；执行前须另行核对合成图文、当前版本和授权范围。'});
    return{pass:true,canCompare:true,canExecute:false,phase:1,blockers,warnings,records:summaries,fields,images:attachments,references,fingerprints,fingerprint:digest(fingerprints),recommendedPrimary:recommended,recommendationReason:'按实际建档时间推荐；同日以编号稳定排序。请结合正文首页及现有引用明确选择。'};
  }
  async function saveUnlocked(payload,actor,context) {
    checkActor(actor);await initialize();
    const allowed=new Set(['planId','planRevision','primaryId','secondaryId','expectedRevisions','basisFingerprint','fieldChoices','attachmentOrder','excludedImages','attachmentDescriptions','sourceReason','primaryReason','refreshBasis']);
    if(!payload||typeof payload!=='object'||Array.isArray(payload)||Object.keys(payload).some(key=>!allowed.has(key)))fail('方案请求含未知参数。');
    if(payload.refreshBasis!==undefined&&typeof payload.refreshBasis!=='boolean')fail('重新核对标记必须明确为是或否。');
    const ids=[payload.primaryId,payload.secondaryId],state=await preflight(ids,actor);if(!state.canCompare)fail(state.blockers.map(row=>row.message).join('；'),422,'MERGE_PREFLIGHT_BLOCKED');
    for(const row of state.records)if(payload.expectedRevisions?.[row.itemId]!==row.revision)fail('档案已更新；当前编辑保留，请重新核对新版本。',409,'MERGE_STALE');
    if(payload.basisFingerprint!==state.fingerprint)fail('图片、引用或规范已变化，请重新核对。',409,'MERGE_STALE');
    let id=payload.planId?requireId(payload.planId):randomUUID(),previous=await safeRead(planFile(id));
    if(previous&&previous.actor!==actor)fail('无权访问这份方案。',403,'MERGE_FORBIDDEN');
    if(previous&&payload.planRevision!==previous.planRevision)fail('方案已在另一页面保存，请先核对版本。',409,'MERGE_PLAN_CONFLICT');
    if(!previous&&payload.planId)fail('方案不存在。',404,'MERGE_PLAN_NOT_FOUND');
    if(previous&&previous.basisFingerprint!==state.fingerprint&&!payload.refreshBasis)fail('已保存方案的基础已变化，请明确重新核对。',409,'MERGE_STALE');
    const record=structuredClone(state.records[0].record),choices=payload.fieldChoices??{},fieldMap=new Map(state.fields.map(field=>[field.path,field])),unresolved=[];
    if(!choices||typeof choices!=='object'||Array.isArray(choices))fail('字段选值格式无效。');
    for(const key of Object.keys(choices))if(!fieldMap.has(key))fail('没有配置策略的字段不能保存：'+key,422,'MERGE_FIELD_INVALID');
    for(const field of state.fields){const decision=choices[field.path]??(field.defaultChoice?{choice:field.defaultChoice}:null);if(!decision){unresolved.push({path:field.path,message:field.label+'尚未明确选择。'});continue;}const selected=validateChoice(field,decision);put(record,field.path,selected.value,selected.present);}
    const sourceReason=note(payload.sourceReason??''),primaryReason=note(payload.primaryReason??'',1000);if(sourceReason.trim().length<5)unresolved.push({path:'sourceReason',message:'请补充同一件/同一套的具体依据。'});
    if(ids[0]!==state.recommendedPrimary&&!primaryReason.trim())unresolved.push({path:'primaryReason',message:'请说明人工选择主档案的理由。'});
    const available=new Map(state.images.map(image=>[image.ref,image])),order=payload.attachmentOrder??state.images.map(image=>image.ref),excluded=payload.excludedImages??[];
    const descriptions=payload.attachmentDescriptions??{};if(!descriptions||typeof descriptions!=='object'||Array.isArray(descriptions)||Object.keys(descriptions).some(ref=>!available.has(ref)))fail('逐图说明引用无效。');for(const value of Object.values(descriptions))note(value,2000);
    if(!Array.isArray(order)||!Array.isArray(excluded)||order.length===0||new Set(order).size!==order.length)fail('附件顺序无效或全部被移除。',422,'MERGE_IMAGES_INVALID');
    const omitted=new Set();for(const row of excluded){if(!row||!available.has(row.ref)||omitted.has(row.ref))fail('移除图片引用无效。');omitted.add(row.ref);note(row.reason??'',1000);if(!row.reason?.trim())unresolved.push({path:'images',message:'移除某页尚未说明原因。'});}
    if(order.some(ref=>!available.has(ref)||omitted.has(ref))||order.length+omitted.size!==available.size)fail('每幅来源图片都必须保留或明确列为不采用。',422,'MERGE_IMAGES_INVALID');
    const filenames=new Set(state.images.filter(image=>image.itemId===ids[0]).map(image=>image.filename.toLowerCase()));
    const attachmentMap=order.map((ref,index)=>{const image=available.get(ref);let targetFilename=image.filename;if(image.itemId!==ids[0]){const extension=path.extname(image.filename).toLowerCase();let found=false;for(let n=1;n<=99;n++){const candidate=`detail-${String(n).padStart(2,'0')}-public${extension}`;if(!filenames.has(candidate.toLowerCase())){targetFilename=candidate;found=true;break;}}if(!found)unresolved.push({path:'images',message:'规范图片命名容量不足，执行阶段需先处理。'});}filenames.add(targetFilename.toLowerCase());return{...image,targetFilename,position:index+1,description:note(descriptions[ref]??image.description??'',2000)};});
    record.public_view.image_descriptions=attachmentMap.map(row=>row.description);
    const codeResult=collectionCode(record,await getStandards());if(codeResult?.code)record.core.collection_code=codeResult.code;
    for(const issue of codeResult?.issues??[])unresolved.push({path:issue.field??'collection_code',message:issue.message});
    for(const issue of await validateRecord(record,await getStandards()))if(issue.code!=='privacy_confirmation'&&!unresolved.some(row=>row.message===issue.message))unresolved.push({path:issue.field??'record',message:issue.message});
    for(const ref of state.references)if(ref.blocking||['unknown','unavailable'].includes(ref.availability))unresolved.push({path:'references',message:ref.label+'仍需在执行阶段核对。'});
    const revision=(previous?.planRevision??0)+1,operation={operationId:context.operationId,stepId:context.stepId};
    if(!operationIdPattern.test(operation.operationId??'')||!operationIdPattern.test(operation.stepId??''))fail('缺少受保护的操作编号。',428);
    const plan={schemaVersion:1,phase:1,status:'plan-only',planId:id,planRevision:revision,actor,primaryId:ids[0],secondaryId:ids[1],createdAt:previous?.createdAt??now().toISOString(),updatedAt:now().toISOString(),basisFingerprint:state.fingerprint,expectedRevisions:state.fingerprints.revisions,sourceRecords:state.records,sourceImages:state.images,fields:state.fields,references:state.references,fieldChoices:choices,attachmentOrder:order,excludedImages:excluded,attachmentDescriptions:descriptions,sourceReason,primaryReason,attachmentMap,proposedRecord:record,unresolved,privacyReviewCompleted:false,operation};
    plan.contentDigest=mergePlanContentDigest(plan);
    if(!previous&&!payload.planId){
      for(const candidate of await list(actor)){
        const existing=await safeRead(planFile(candidate.planId));
        if(existing?.status==='plan-only'&&mergePlanContentDigest(existing)===plan.contentDigest){previous=existing;id=existing.planId;break;}
      }
    }
    if(previous&&mergePlanContentDigest(previous)===plan.contentDigest){
      const operationFile=path.join(directory,'plan-operations',operation.operationId+'.'+operation.stepId+'.json');
      if(await safeRead(operationFile))fail('操作编号已用于另一份方案，请核对原结果。',409,'MERGE_OPERATION_CONFLICT');
      context.markChanged?.();await atomicWrite(operationFile,JSON.stringify({planId:id,planRevision:previous.planRevision,actor,operation,unchanged:true})+'\n');
      return{...previous,saveUnchanged:true};
    }
    const bytes=JSON.stringify(plan,null,2)+'\n';if(Buffer.byteLength(bytes)>6*1024*1024)fail('方案内容过大，请先整理原文。',413);
    const versionFile=path.join(directory,'versions',id+'.'+revision+'.json'),operationFile=path.join(directory,'plan-operations',operation.operationId+'.'+operation.stepId+'.json');
    if(await safeRead(operationFile))fail('操作编号已用于另一份方案，请核对原结果。',409,'MERGE_OPERATION_CONFLICT');
    if(await safeRead(versionFile))fail('方案版本已存在，停止覆盖。',409,'MERGE_PLAN_CONFLICT');
    context.markChanged?.();await atomicWrite(versionFile,bytes);await atomicWrite(planFile(id),bytes);
    await atomicWrite(operationFile,JSON.stringify({planId:id,planRevision:revision,actor,operation})+'\n');return plan;
  }
  const save=(...args)=>{const result=tail.then(()=>saveUnlocked(...args));tail=result.catch(()=>{});return result;};
  async function byOperation(operationId,stepId,actor){checkActor(actor);operationId=requireId(operationId);stepId=requireId(stepId);const receipt=await safeRead(path.join(directory,'plan-operations',operationId+'.'+stepId+'.json'));if(!receipt||receipt.actor!==actor)fail('保存结果尚待核对，请从方案列表查看。',409,'MERGE_RESULT_UNKNOWN');requireId(receipt.planId);if(!Number.isSafeInteger(receipt.planRevision)||receipt.planRevision<1)fail('保存结果版本异常，须人工核对。',409);const saved=await safeRead(path.join(directory,'versions',receipt.planId+'.'+receipt.planRevision+'.json'));if(!saved)fail('保存版本缺失，请核对。',409,'MERGE_RESULT_UNKNOWN');return{...saved,saveUnchanged:Boolean(receipt.unchanged)};}
  async function detail(id,actor){checkActor(actor);const plan=await safeRead(planFile(id));if(!plan)fail('方案不存在。',404,'MERGE_PLAN_NOT_FOUND');if(plan.actor!==actor)fail('无权访问这份方案。',403,'MERGE_FORBIDDEN');let current=null;try{current=await preflight([plan.primaryId,plan.secondaryId],actor);}catch{}const execution=await safeRead(path.join(directory,'plan-commits',plan.planId+'.'+plan.planRevision+'.json'));return{plan,current,execution,stale:current?.fingerprint!==plan.basisFingerprint,canExecute:false};}
  async function list(actor){checkActor(actor);await initialize();const files=(await fs.readdir(path.join(directory,'plans'))).filter(name=>/^[a-f0-9-]{36}\.json$/.test(name));const rows=[];for(const name of files){const plan=await safeRead(path.join(directory,'plans',name));if(plan?.actor===actor){const execution=await safeRead(path.join(directory,'plan-commits',plan.planId+'.'+plan.planRevision+'.json'));rows.push({planId:plan.planId,planRevision:plan.planRevision,primaryId:plan.primaryId,secondaryId:plan.secondaryId,title:plan.proposedRecord.core.title,updatedAt:plan.updatedAt,unresolved:plan.unresolved.length,status:execution?(execution.status??'committed'):'plan-only',mergeId:execution?.mergeId??null});}}return rows.sort((a,b)=>b.updatedAt.localeCompare(a.updatedAt));}
  return{preflight,save,detail,list,byOperation};
}
