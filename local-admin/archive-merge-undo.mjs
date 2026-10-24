// 撤销默认只生成恢复草稿；恢复发布必须是新核对、新授权、新事务，不能重放旧合并批准。
import fs from 'node:fs/promises';
import path from 'node:path';
import {randomUUID} from 'node:crypto';
import {digest,operationIdPattern} from './write-coordinator.mjs';
import {translationLocales} from '../shared/locale-config.mjs';
import {validateLikesSnapshot} from '../shared/archive-merge-likes.mjs';
import {exists,readJson,safeBytes,currentHash,writeExclusive,writeVersionedFile,bytesOf,hashBytes,tree,mergeFail,snapshotEntryId} from './archive-merge-files.mjs';

const published=row=>row?.core?.record_status==='ACT'&&row.core.privacy_level==='G'&&row.core.use_status==='U3';
const same=(a,b)=>digest(a??null)===digest(b??null);
const uuid=id=>{if(!operationIdPattern.test(id??''))mergeFail('合并记录编号无效。','MERGE_NOT_FOUND',404);return id.toLowerCase();};
const relevantRefs=(records,ids)=>{
 const targets=new Set(ids),rows=[];
 for(const record of records){
  for(const target of record.core.related_item_ids??[])if(targets.has(target))rows.push([record.core.item_id,'core.related_item_ids',target]);
  for(const[dimension,fields]of Object.entries(record.metadata?.dimensions??{}))for(const[key,value]of Object.entries(fields))if(['portrait_item_id','related_item_ids','attachment_item_ids'].includes(key))for(const target of Array.isArray(value)?value:[value])if(targets.has(target))rows.push([record.core.item_id,dimension+'.'+key,target]);
 }
 return rows.sort((a,b)=>JSON.stringify(a).localeCompare(JSON.stringify(b)));
};
const differences=(before,merged,current,prefix='')=>{
 if(same(merged,current))return[];
 if(merged&&current&&typeof merged==='object'&&typeof current==='object'&&!Array.isArray(merged)&&!Array.isArray(current))return [...new Set([...Object.keys(merged),...Object.keys(current)])].flatMap(key=>differences(before?.[key],merged[key],current[key],prefix?prefix+'.'+key:key));
 return[{path:prefix,before:before??null,merged:merged??null,current:current??null}];
};

export function createMergeUndo({directory,archiveDirectory,draftDirectory,inboxDirectory,historyDirectory,translationDirectory,siteDirectory,likesFile,engine,accounts,readRecords,normalizeRecord=row=>row,validateRecord=async()=>[],validateImage,now=()=>new Date(),reviewTtl=30*60*1000,afterPhase=async()=>{}}){
 const reviews=new Map(),imageRoots={inbox:inboxDirectory,history:historyDirectory,merges:directory};
 async function originalData(log){
  const records=new Map(),images=[],issues=[];
  for(const snapshot of log.snapshots??[]){
   try{
    const bytes=await safeBytes(historyDirectory,snapshot.relative+'/record.json');if(hashBytes(bytes)!==snapshot.record_sha256)throw new Error('record hash');
    const record=JSON.parse(bytes.toString('utf8'));if(record.core.item_id!==snapshot.item_id)throw new Error('record id');records.set(snapshot.item_id,record);
    for(const image of snapshot.images??[]){const relative=snapshot.relative+'/images/'+image.filename,bytes=await safeBytes(historyDirectory,relative);if(hashBytes(bytes)!==image.sha256)throw new Error('image hash');images.push({targetItemId:snapshot.item_id,targetFilename:image.filename,sourceRoot:'history',sourceRelative:relative,sha256:image.sha256});}
   }catch{issues.push({code:'SNAPSHOT_INCOMPLETE',itemId:snapshot.item_id,message:'历史快照或图片缺失/摘要不符，不能据此自动恢复。'});}
  }
  for(const id of [log.primary_id,log.secondary_id])if(!records.has(id))issues.push({code:'SNAPSHOT_MISSING',itemId:id,message:'缺少原档案快照，不能编造恢复内容。'});
  return{records,images,issues};
 }
 async function inspect(mergeId,actor){
  const log=await engine.detail(uuid(mergeId),actor),conflicts=[],ids=[log.primary_id,log.secondary_id];
  if(log.legacy)mergeFail('这是旧版手工合并，只读追溯；需另行核对历史快照，不能直接撤销。','MERGE_LEGACY_READ_ONLY');
  if(log.operation_kind==='undo'||log.status!=='committed')mergeFail(log.status==='reverted'?'这项合并已经撤销，不会再次执行。':'仅已完成且未撤销的合并可申请恢复。','MERGE_UNDO_NOT_AVAILABLE');
  const original=await originalData(log);conflicts.push(...original.issues);
  const saved=await readJson(directory,log.merge_id+'/review.json'),current=await readRecords(),map=new Map(current.map(row=>[row.core.item_id,row])),merged=new Map(saved.proposed.records.map(row=>[row.core.item_id,row]));
  const threeWay=[];
  for(const snapshot of log.snapshots){
   const expected=log.files.find(row=>row.root==='archive'&&row.relative===snapshot.item_id+'.json');
   if(!expected||await currentHash(archiveDirectory,snapshot.item_id+'.json')!==expected.afterHash){conflicts.push({code:'RECORD_CHANGED',itemId:snapshot.item_id,message:'档案在合并后有新修改或状态变化，不能用旧版本覆盖。'});threeWay.push({itemId:snapshot.item_id,changes:differences(original.records.get(snapshot.item_id),merged.get(snapshot.item_id),map.get(snapshot.item_id))});}
  }
  for(const image of saved.plan.attachmentMap??[]){
   const relative=log.primary_id+'/'+image.targetFilename;
   if(await currentHash(path.join(siteDirectory,'public/archive'),relative)!==image.sha256||await currentHash(inboxDirectory,relative)!==image.sha256)conflicts.push({code:'IMAGE_CHANGED',itemId:log.primary_id,message:'合并后的发布副本或待入站副本已变化，不能盲目撤销。'});
  }
  if(!same(relevantRefs(saved.proposed.records,ids),relevantRefs(current,ids)))conflicts.push({code:'REFERENCES_CHANGED',message:'合并后出现新引用或引用变化，需要逐项核对。'});
  const albumIds=new Set(ids.map(id=>merged.get(id)?.core.album_id).filter(Boolean));
  const albumMembers=records=>records.filter(row=>albumIds.has(row.core.album_id)).map(row=>[row.core.item_id,row.core.album_id,row.core.original_position??null]).sort();
  if(!same(albumMembers(saved.proposed.records),albumMembers(current)))conflicts.push({code:'ALBUM_CHANGED',message:'实物相册成员或原位置已变化，须先核对册内影响。'});
  for(const entry of await fs.readdir(directory,{withFileTypes:true}))if(entry.isDirectory()&&operationIdPattern.test(entry.name)&&entry.name!==log.merge_id){
   let other;try{other=await readJson(directory,entry.name+'/manifest.json');}catch{continue;}
   if(other.status==='committed'&&other.operation_kind!=='undo'&&Date.parse(other.created_at)>=Date.parse(log.created_at)&&[other.primary_id,other.secondary_id].some(id=>ids.includes(id)))conflicts.push({code:'DEPENDENT_MERGE',mergeId:other.merge_id,message:'存在后续合并，应先按依赖逆序处理，不能破坏后续内容。'});
  }
  const drafts=[];
  for(const id of ids)if(await exists(path.join(draftDirectory,id+'.json'))){const value=await readJson(draftDirectory,id+'.json');drafts.push({itemId:id,value,sha256:await currentHash(draftDirectory,id+'.json')});
   if(value.merge_undo?.mergeId!==log.merge_id||value.merge_undo.recordDigest!==digest(value.record))conflicts.push({code:'DRAFT_EXISTS',itemId:id,message:'已有草稿或恢复草稿已编辑，将保留现有编辑，不自动覆盖。'});
  }
  for(const relative of Object.keys(await tree(draftDirectory)).filter(name=>/^LJM-\d{8}-[A-Z]{3}-\d{3}\.json$/.test(name))){
   if(ids.includes(relative.slice(0,-5)))continue;const draft=await readJson(draftDirectory,relative);
   if(draft.record&&relevantRefs([draft.record],ids).length)conflicts.push({code:'OTHER_DRAFT_REFERENCE',itemId:draft.record.core.item_id,message:'其他未发布草稿引用这两件资料，须先处理其引用。'});
  }
  let favorites;
  try{favorites=accounts.reviewUndo(log.merge_id);for(const message of favorites.conflicts??[])conflicts.push({code:'FAVORITES_CHANGED',message});}catch{conflicts.push({code:'FAVORITES_UNAVAILABLE',message:'收藏或账号状态未能可靠核对，不能自动迁回。'});}
  try{const likes=validateLikesSnapshot(JSON.parse(await fs.readFile(likesFile,'utf8')));if(ids.some(id=>(likes.items[id]?.voters??[]).length))conflicts.push({code:'NEW_LIKES',message:'存在合并后的点赞，不得删除或伪造人数；仅可生成恢复草稿。'});}catch{conflicts.push({code:'LIKES_UNAVAILABLE',message:'点赞库无法可靠核对。'});}
  for(const locale of translationLocales)for(const id of ids){
   const relative=(locale==='en'?'':locale+'/')+id+'.json',changed=log.files.find(row=>row.root==='translations'&&row.relative===relative);
   const expected=changed?changed.afterHash:(saved.baseline.files.translations[relative]?.sha256??null);
   if(await currentHash(translationDirectory,relative)!==expected)conflicts.push({code:'TRANSLATION_CHANGED',itemId:id,locale,message:'译文已有后续编辑或新译文，将保留当前译文，不能自动覆盖。'});
  }
  let projection={schema_version:1,aliases:{}};
  if(await exists(path.join(siteDirectory,'src/data/archive-merge-aliases.json')))projection=await readJson(siteDirectory,'src/data/archive-merge-aliases.json');
  const aliasFile=log.files.find(row=>row.root==='sources'&&row.relative==='data/archive-merge-aliases.json');
  const beforeAlias=aliasFile?.backup?JSON.parse((await safeBytes(directory,aliasFile.backup)).toString('utf8')):{schema_version:1,aliases:{}};
  const afterAlias=aliasFile?.next?JSON.parse((await safeBytes(directory,aliasFile.next)).toString('utf8')):{schema_version:1,aliases:{}};
  const proposedProjection=structuredClone(projection);
  for(const key of new Set([...Object.keys(beforeAlias.aliases),...Object.keys(afterAlias.aliases)]))if(!same(beforeAlias.aliases[key],afterAlias.aliases[key])){
   if(!same(projection.aliases[key],afterAlias.aliases[key]))conflicts.push({code:'ALIAS_CHANGED',message:'旧编号去向已有后续变化，不能覆盖。'});
   if(beforeAlias.aliases[key])proposedProjection.aliases[key]=structuredClone(beforeAlias.aliases[key]);else delete proposedProjection.aliases[key];
  }
  for(const image of original.images.filter(image=>ids.includes(image.targetItemId))){const hash=await currentHash(inboxDirectory,image.targetItemId+'/'+image.targetFilename);if(hash!==null&&hash!==image.sha256)conflicts.push({code:'IMAGE_NAME_CONFLICT',itemId:image.targetItemId,message:'原文件名已有不同内容，恢复草稿会另存副本；自动恢复发布已停止。'});}
  const baseline=await engine.capture(),reviewId=randomUUID();
  const value={reviewId,actor,mergeId:log.merge_id,logDigest:digest(log),log,original,current,merged,saved,drafts,conflicts,threeWay,proposedProjection,favorites,baseline,baselineDigest:digest(baseline),expiresAt:now().getTime()+reviewTtl};reviews.set(reviewId,value);
  return value;
 }
 async function review(payload,actor){
  if(!payload||Object.keys(payload).some(key=>key!=='mergeId'))mergeFail('撤销核对请求格式无效。');
  const value=await inspect(payload.mergeId,actor),ids=[value.log.primary_id,value.log.secondary_id];
  const canCreateDrafts=ids.every(id=>value.original.records.has(id))&&value.original.issues.length===0;
  return{reviewId:value.reviewId,mergeId:value.mergeId,expiresAt:new Date(value.expiresAt).toISOString(),primaryId:ids[0],secondaryId:ids[1],conflicts:value.conflicts,threeWay:value.threeWay,
   canCreateDrafts,canPublish:canCreateDrafts&&value.conflicts.length===0,hasExistingDrafts:value.drafts.length>0,
   existingDrafts:value.drafts.map(row=>({itemId:row.itemId,record:row.value.record,unchangedRecovery:row.value.merge_undo?.mergeId===value.mergeId&&row.value.merge_undo.recordDigest===digest(row.value.record)})),
   originals:ids.map(id=>({record:value.original.records.get(id)??null,images:value.original.images.filter(image=>image.targetItemId===id).map((image,index)=>({...image,sourceRoot:undefined,sourceRelative:undefined,url:'/api/merge-undo-image/'+value.reviewId+'/'+id+'/'+encodeURIComponent(image.targetFilename),position:index+1}))})),
   message:'默认只生成SUS/Y/U0恢复草稿，不改变当前公开状态。新编辑、收藏、点赞和后续合并不会被旧快照覆盖。'};
 }
 function token(payload,actor){const value=reviews.get(payload.reviewId);if(!value||value.actor!==actor||value.mergeId!==payload.mergeId||value.expiresAt<=now().getTime())mergeFail('撤销核对已过期或不属于当前身份，请重新核对。','MERGE_UNDO_REVIEW_EXPIRED');return value;}
 async function checked(payload,actor){const value=token(payload,actor);if(digest(await engine.detail(value.mergeId,actor))!==value.logDigest||!same(await engine.capture(),value.baseline))mergeFail('恢复方案核对后资料已变化，请重新核对。','MERGE_UNDO_STALE');const again=await originalData(value.log);if(again.issues.length||!same([...again.records],[...value.original.records]))mergeFail('历史快照在核对后变化，不能继续。','MERGE_UNDO_STALE');return value;}
 async function image(reviewId,itemId,filename,actor){const value=token({reviewId,mergeId:reviews.get(reviewId)?.mergeId},actor),row=value.original.images.find(row=>row.targetItemId===itemId&&row.targetFilename===filename);if(!row)mergeFail('恢复图片不在核对清单中。','MERGE_IMAGE_NOT_FOUND',404);const bytes=await safeBytes(imageRoots[row.sourceRoot],row.sourceRelative);if(hashBytes(bytes)!==row.sha256)mergeFail('历史副本已变化。','MERGE_UNDO_STALE');return{bytes,filename:row.targetFilename};}
 async function translationProposal(value){
  const result=[];
  for(const locale of translationLocales)for(const id of [value.log.primary_id,value.log.secondary_id]){
   const relative=(locale==='en'?'':locale+'/')+id+'.json';
   let current=null;if(await exists(path.join(translationDirectory,...relative.split('/'))))current=await readJson(translationDirectory,relative);
   const oldFile=value.log.files.find(row=>row.root==='translations'&&row.relative===relative),old=oldFile?.backup?JSON.parse((await safeBytes(directory,oldFile.backup)).toString('utf8')):current;
   if(!old)continue;
   for(const raw of [old,current].filter(Boolean))if(typeof raw!=='object'||!Number.isSafeInteger(raw.revision??1)||(raw.revision??1)<0||raw.item_id&&raw.item_id!==id||raw.locale&&raw.locale!==locale||[raw.draft,raw.published].some(entry=>entry&&entry.locale!==locale))mergeFail('译文格式、语言或版本不一致，不能自动覆盖。','MERGE_TRANSLATION_FORMAT_INVALID');
   const active=old.draft??old.published??(old.locale?old:null);if(!active)continue;
   result.push({relative,value:{...(!current?.locale?current:{}),schema_version:1,item_id:id,revision:(current?.revision??0)+1,draft:{...active,item_id:id,locale,status:'review'},published:null}});
  }
  return result;
 }
 async function publish(payload,actor,context){
  const allowed=new Set(['mergeId','reviewId','mode','confirmPrimaryId','confirmSecondaryId','confirmations','publicationAuthorization']);
  if(!payload||Object.keys(payload).some(key=>!allowed.has(key))||payload.mode!=='republish')mergeFail('恢复发布参数无效。');
  const value=await checked(payload,actor),ids=[value.log.primary_id,value.log.secondary_id];
  if(value.conflicts.length)mergeFail('存在后续变化或引用冲突，只能生成恢复草稿，不能盲目恢复发布。','MERGE_UNDO_CONFLICT');
  const scope=payload.publicationAuthorization;
  if(payload.confirmPrimaryId!==ids[0]||payload.confirmSecondaryId!==ids[1]||!Array.isArray(payload.confirmations)||payload.confirmations.length!==13||payload.confirmations.some(row=>row!==true)||!scope||Object.keys(scope).some(key=>!['restorePrimary','restoreSecondary','restoreReferences','consumeRecoveryDrafts'].includes(key))||scope.restorePrimary!==true||scope.restoreSecondary!==true||scope.restoreReferences!==true||value.drafts.length&&scope.consumeRecoveryDrafts!==true)mergeFail('恢复发布须本人重新核对13项、两个完整编号和恢复范围。','MERGE_UNDO_CONFIRMATION_REQUIRED',422);
  const records=[];
  for(const current of value.current){let row=value.original.records.has(current.core.item_id)?structuredClone(value.original.records.get(current.core.item_id)):structuredClone(current);if(value.original.records.has(row.core.item_id)){
    row.core.updated_date=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Shanghai',year:'numeric',month:'2-digit',day:'2-digit'}).format(now());row=await normalizeRecord(row);const issues=await validateRecord(row);if(issues.length)mergeFail(issues.map(issue=>issue.message).join('；'),'MERGE_UNDO_METADATA_INVALID',422);
   }records.push(row);}
  const images=value.original.images.filter(image=>ids.includes(image.targetItemId));
  for(const image of images){const bytes=await safeBytes(imageRoots[image.sourceRoot],image.sourceRelative);if(hashBytes(bytes)!==image.sha256)mergeFail('恢复图片变化。');await validateImage(bytes,image.targetFilename);}
  const prepared={actor,operationKind:'undo',parentMergeId:value.mergeId,planId:randomUUID(),planRevision:1,plan:{planId:randomUUID(),planRevision:1,primaryId:ids[0],secondaryId:ids[1],sourceImages:[],attachmentMap:[]},baseline:value.baseline,baselineDigest:value.baselineDigest,favoritesDigest:value.favorites.digest,
   proposed:{records,affected:records.filter(row=>value.original.records.has(row.core.item_id)),primary:records.find(row=>row.core.item_id===ids[0]),imageTargets:images,projection:value.proposedProjection,translationChanges:await translationProposal(value),removeDrafts:value.drafts.map(row=>({itemId:row.itemId,sha256:row.sha256}))}};
  reviews.delete(payload.reviewId);
  return engine.commitChange(prepared,actor,context,{...payload,planId:prepared.planId,planRevision:1});
 }
 async function draftResult(undoId,actor){const log=await readJson(directory,'undo-drafts/'+uuid(undoId)+'/manifest.json');if(log.actor!==actor)mergeFail('无权查看恢复草稿。','MERGE_FORBIDDEN',403);return log;}
 async function byOperation(operationId,stepId,actor){
  operationId=uuid(operationId);stepId=uuid(stepId);let link;
  try{link=await readJson(directory,`undo-draft-operations/${operationId}.${stepId}.json`);}catch(error){
   if(error.code!=='ENOENT')throw error;
   for(const entry of await fs.readdir(path.join(directory,'undo-drafts'),{withFileTypes:true}).catch(error=>{if(error.code==='ENOENT')return[];throw error;}))if(entry.isDirectory()&&operationIdPattern.test(entry.name)){
    const log=await readJson(directory,'undo-drafts/'+entry.name+'/manifest.json');
    if(log.actor===actor&&log.operation?.operationId===operationId&&log.operation?.stepId===stepId){if(link)mergeFail('恢复草稿去向不唯一，须核对。');link={actor,undoId:log.undo_id};}
   }
   if(!link)mergeFail('尚未找到可靠的恢复日志，请核对原请求。','MERGE_RESULT_UNKNOWN');
  }
  if(link.actor!==actor)mergeFail('无权查看这次草稿恢复。','MERGE_FORBIDDEN',403);return draftResult(link.undoId,actor);
 }
 async function rollbackDrafts(log){
  for(const row of log.draftFiles){const hash=await currentHash(draftDirectory,row.relative);if(hash!==row.beforeHash&&hash!==row.afterHash)mergeFail('恢复草稿已有新编辑，不能覆盖。','MERGE_UNDO_DRAFT_RECOVERY_CONFLICT');}
  for(const row of [...log.draftFiles].reverse()){const hash=await currentHash(draftDirectory,row.relative);if(hash===row.beforeHash)continue;if(row.beforeHash===null)await fs.unlink(path.join(draftDirectory,row.relative));else{const bytes=await safeBytes(directory,row.backup);if(hashBytes(bytes)!==row.beforeHash)mergeFail('草稿备份摘要不符。');await writeVersionedFile(draftDirectory,row.relative,bytes);}}
  // 新增的图片始终留在私密inbox和恢复提案中，不永久删除已保存副本。
  log.status='rolled-back';log.phase='rolled-back';await writeVersionedFile(directory,'undo-drafts/'+log.undo_id+'/manifest.json',bytesOf(log));return log;
 }
 async function drafts(payload,actor,context){
  if(!payload||Object.keys(payload).some(key=>!['mergeId','reviewId','mode','replaceExistingDrafts'].includes(key))||payload.mode!=='drafts'||payload.replaceExistingDrafts!==undefined&&typeof payload.replaceExistingDrafts!=='boolean')mergeFail('恢复草稿参数无效。');
  const value=await checked(payload,actor),ids=[value.log.primary_id,value.log.secondary_id];
  if(ids.some(id=>!value.original.records.has(id))||value.original.issues.some(row=>ids.includes(row.itemId)))mergeFail('缺少完整原始快照，不能生成恢复草稿。','MERGE_UNDO_SNAPSHOT_INVALID');
  const previous=value.drafts.length===2&&value.drafts.every(row=>row.value.merge_undo?.mergeId===value.mergeId&&row.value.merge_undo.recordDigest===digest(row.value.record))?value.drafts[0].value.merge_undo.undoId:null;
  if(previous&&value.drafts.every(row=>row.value.merge_undo.undoId===previous)){
   const saved=await draftResult(previous,actor);context.markChanged();await writeExclusive(directory,`undo-draft-operations/${uuid(context.operationId)}.${uuid(context.stepId)}.json`,bytesOf({undoId:previous,actor}));return{...saved,unchanged:true};
  }
  const undoId=randomUUID(),base='undo-drafts/'+undoId,proposalOnly=value.drafts.length>0&&!payload.replaceExistingDrafts;
  const log={schema_version:1,undo_id:undoId,merge_id:value.mergeId,actor,mode:'drafts',status:'preparing',phase:'preparing',created_at:now().toISOString(),operation:{operationId:uuid(context.operationId),stepId:uuid(context.stepId)},proposalOnly,draftFiles:[],createdInboxes:[],records:[],conflicts:value.conflicts};
  context.markChanged();await writeExclusive(directory,base+'/manifest.json',bytesOf(log));await writeExclusive(directory,`undo-draft-operations/${log.operation.operationId}.${log.operation.stepId}.json`,bytesOf({undoId,actor}));
  try{
   for(const id of ids){
    const record=structuredClone(value.original.records.get(id));record.core.record_status='SUS';record.core.privacy_level='Y';record.core.use_status='U0';record.core.updated_date=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Shanghai',year:'numeric',month:'2-digit',day:'2-digit'}).format(now());
    const images=value.original.images.filter(row=>row.targetItemId===id),paths=[];
    const reserved=new Set(Object.keys(await tree(path.join(inboxDirectory,id))).map(name=>name.toLowerCase()));
    for(const image of images){
      let filename=image.targetFilename;const current=await currentHash(inboxDirectory,id+'/'+filename);
      if(current!==null&&current!==image.sha256){let selected=null;for(let n=1;n<=99;n++){const candidate='detail-'+String(n).padStart(2,'0')+'-public'+path.extname(filename).toLowerCase();if(!reserved.has(candidate.toLowerCase())){selected=candidate;break;}}if(!selected)mergeFail('规范图片名容量不足，不能覆盖现有文件。');filename=selected;}
      reserved.add(filename.toLowerCase());const bytes=await safeBytes(imageRoots[image.sourceRoot],image.sourceRelative);if(hashBytes(bytes)!==image.sha256)mergeFail('历史图片在恢复期间变化。','MERGE_UNDO_STALE');
      await writeExclusive(directory,base+'/images/'+id+'/'+filename,bytes);
      if(!proposalOnly&&!await exists(path.join(inboxDirectory,id,filename))){await writeExclusive(inboxDirectory,id+'/'+filename,bytes);log.createdInboxes.push(id+'/'+filename);}
      paths.push('/archive/'+id+'/'+filename);
    }
    record.core.publication_file_path=paths;
    const draft={version:2,write_revision:randomUUID(),saved_at:now().toISOString(),removed_images:[],removed_image_descriptions:{},restored_from_history:value.log.snapshots.find(row=>row.item_id===id).entry_id,restored_from_withdrawal:id===value.log.secondary_id?{item_id:id,merge_id:value.mergeId}:null,merge_undo:{mergeId:value.mergeId,undoId,recordDigest:digest(record)},record};
    await writeExclusive(directory,base+'/proposals/'+id+'.json',bytesOf(draft));log.records.push({itemId:id,title:record.core.title,imageCount:paths.length});
    if(!proposalOnly){
      const relative=id+'.json',beforeHash=await currentHash(draftDirectory,relative),backup=beforeHash===null?null:base+'/draft-before/'+relative;
      if(beforeHash!==(value.baseline.files.drafts[relative]?.sha256??null))mergeFail('当前草稿在核对后变化，未替换。','MERGE_UNDO_STALE');
      if(backup){
        const bytes=await safeBytes(draftDirectory,relative);await writeExclusive(directory,backup,bytes);const oldDraft=JSON.parse(bytes.toString('utf8'));
        for(const publicPath of oldDraft.record?.core?.publication_file_path??[]){const filename=path.basename(publicPath);if(publicPath!==`/archive/${id}/${filename}`)mergeFail('现有草稿图片路径异常，不能覆盖。');await writeExclusive(directory,base+'/draft-before-images/'+id+'/'+filename,await safeBytes(inboxDirectory,id+'/'+filename));}
      }
      log.draftFiles.push({relative,beforeHash,afterHash:hashBytes(bytesOf(draft)),backup,next:base+'/proposals/'+relative,state:'pending'});
    }
   }
   log.phase='prepared';await writeVersionedFile(directory,base+'/manifest.json',bytesOf(log));await afterPhase('drafts-prepared',log);
   // 制作提案期间任何当前草稿的新编辑均保留；绝不静默替换。
   for(const row of log.draftFiles)if(await currentHash(draftDirectory,row.relative)!==row.beforeHash)mergeFail('当前草稿已变化，请重新核对。','MERGE_UNDO_STALE');
   for(const row of log.draftFiles){if(context.signal?.aborted)throw Object.assign(new Error('恢复草稿已取消。'),{name:'OperationCancelledError'});row.state='writing';await writeVersionedFile(directory,base+'/manifest.json',bytesOf(log));const bytes=await safeBytes(directory,row.next);await writeVersionedFile(draftDirectory,row.relative,bytes);row.state='written';await writeVersionedFile(directory,base+'/manifest.json',bytesOf(log));await afterPhase('draft-written',log);}
   log.status=proposalOnly?'proposal-only':'drafts-created';log.phase=log.status;log.completed_at=now().toISOString();await writeVersionedFile(directory,base+'/manifest.json',bytesOf(log));
   return log;
  }catch(error){try{await rollbackDrafts(log);error.safeToRetry=true;}catch{log.status='needs_review';await writeVersionedFile(directory,base+'/manifest.json',bytesOf(log));}throw error;}
 }
 async function recoverDrafts(undoId,actor){const log=await draftResult(undoId,actor);if(['drafts-created','proposal-only','rolled-back'].includes(log.status))return log;return rollbackDrafts(log);}
 return{review,image,inspect,checked,publish,drafts,draftResult,byOperation,recoverDrafts};
}
