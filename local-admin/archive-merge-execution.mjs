// 第二阶段内部验收引擎。只在调用方显式开启本机内部模式后接入；没有通用线上入口。
import fs from 'node:fs/promises';
import path from 'node:path';
import {randomUUID} from 'node:crypto';
import {digest,operationIdPattern} from './write-coordinator.mjs';
import {archiveSourceForRecords,resolveArchiveMergeProjection} from '../shared/archive-merge-projection.mjs';
import {translationLocales} from '../shared/locale-config.mjs';
import {acquirePrivateFileGate,releasePrivateFileGate} from '../shared/private-file-gate.mjs';
import {validateLikesSnapshot} from '../shared/archive-merge-likes.mjs';
import {mergeFail,exists,safeDirectory,safeBytes,tree,copyTree,currentHash,writeExclusive,writeVersionedFile,readJson,assertFreeSpace,bytesOf,snapshotEntryId,treeDigest,hashBytes,relativeFile,inside,fileAttributes,moveVerifiedDirectory} from './archive-merge-files.mjs';

const publicRecord=r=>r.core.record_status==='ACT'&&r.core.privacy_level==='G'&&r.core.use_status==='U3';
const linkKeys=new Set(['related_item_ids','attachment_item_ids','portrait_item_id']);
const asIds=plan=>[plan.primaryId,plan.secondaryId];
const assertUuid=id=>{if(!operationIdPattern.test(id??''))mergeFail('合并操作编号无效。','MERGE_NOT_FOUND',404);return id.toLowerCase();};
const abort=signal=>{if(signal?.aborted)throw Object.assign(new Error('合并已取消，正在恢复操作前状态。'),{name:'OperationCancelledError',code:'OPERATION_CANCELLED',statusCode:409});};
const same=(a,b)=>digest(a)===digest(b);

export function rewriteMergeReferences(record,primaryId,secondaryId){
  const copy=structuredClone(record),self=record.core.item_id;
  const array=values=>[...new Set(values.map(id=>id===secondaryId?primaryId:id))].filter(id=>id!==self);
  if(copy.core.related_item_ids!==undefined){if(!Array.isArray(copy.core.related_item_ids))mergeFail('相关档案字段不是数组，须先修复。');copy.core.related_item_ids=array(copy.core.related_item_ids);}
  for(const fields of Object.values(copy.metadata?.dimensions??{}))for(const[key,value]of Object.entries(fields))if(linkKeys.has(key)){
    if(Array.isArray(value))fields[key]=array(value);
    else if(typeof value==='string')fields[key]=value===secondaryId?(self===primaryId?'':primaryId):value;
    else mergeFail('结构化引用字段格式不正确，须先修复。');
  }
  return copy;
}

export function createArchiveMergeExecution({
  directory,archiveDirectory,draftDirectory,inboxDirectory,siteDirectory,sharedDirectory,historyDirectory,
  translationDirectory,submissionDirectory,likesFile,planner,readRecords,accounts,
  validateRecord=async()=>[],normalizeRecord=record=>record,validateImage,buildCandidate,
  afterPhase=async()=>{},now=()=>new Date(),reviewTtl=30*60*1000,publication=null,
}){
  const reviews=new Map();
  const accountHandler=log=>log.operation_kind==='undo'?{
    begin:args=>accounts.beginUndo({...args,parentMergeId:log.parent_merge_id}),
    apply:id=>accounts.applyUndo(id),finalize:id=>accounts.finalizeUndo(id),rollback:id=>accounts.rollbackUndo(id),status:id=>accounts.undoStatus(id),
  }:accounts;
  const roots={archive:archiveDirectory,drafts:draftDirectory,inbox:inboxDirectory,
    sources:path.join(siteDirectory,'src'),public:path.join(siteDirectory,'public'),scripts:path.join(siteDirectory,'scripts'),
    shared:sharedDirectory,services:path.join(siteDirectory,'server'),translations:translationDirectory,submissions:submissionDirectory,dist:path.join(siteDirectory,'dist')};
  const writeRoots={archive:archiveDirectory,drafts:draftDirectory,inbox:inboxDirectory,translations:translationDirectory,
    sources:path.join(siteDirectory,'src'),public:path.join(siteDirectory,'public')};
  const event=async(log,phase,extra={})=>{log.phase=phase;log.events.push({at:now().toISOString(),phase,...extra});await writeVersionedFile(directory,log.merge_id+'/manifest.json',bytesOf(log));await afterPhase(phase,log);};
  async function capture(){
    const files={};for(const[key,root]of Object.entries(roots))files[key]=await tree(root);
    const packages={};for(const entry of await fs.readdir(siteDirectory,{withFileTypes:true}))if(entry.isFile())packages[entry.name]=await currentHash(siteDirectory,entry.name);
    const code={};for(const name of ['archive-merge-execution.mjs','archive-merge-undo.mjs','archive-merge-files.mjs','archive-merge-runtime.mjs','archive-merge-favorites.mjs','archive-merge-plans.mjs','archive-merge-references.mjs','archive-merge-production.mjs','release-deployer.mjs','write-coordinator.mjs','accounts.mjs','account-server.mjs','server.mjs'])code[name]=hashBytes(await fs.readFile(new URL(name,import.meta.url)));
    const favorites=accounts.inspect;const accountState=typeof favorites==='function'?true:false;
    return{files,packages,code,likes:likesFile?hashBytes(await fs.readFile(likesFile)):null,adapterReady:accountState,...(publication?{publication:await publication.capture()}: {})};
  }
  async function currentPlan(payload,actor){
    const detail=await planner.detail(payload.planId,actor);
    if(detail.plan.planRevision!==payload.planRevision)mergeFail('方案已有新版本，请重新打开核对。','MERGE_PLAN_CONFLICT');
    if(detail.stale||!detail.current?.canCompare)mergeFail('档案、图片、引用或标准已变化，请重新核对方案。','MERGE_STALE');
    const pending=detail.plan.unresolved.filter(row=>row.path!=='references');
    if(pending.length)mergeFail('方案仍有待处理项目：'+pending.map(row=>row.message).join('；'),'MERGE_PLAN_INCOMPLETE',422);
    const allowed=new Set(['archive-links','albums','tag-groups','favorites','translations','likes','submissions','merge-chain','loans','approvals','retention','external']);
    for(const row of detail.current.references){
      if(!allowed.has(row.key))mergeFail('发现未适配的引用类型，不能执行合并。','MERGE_REFERENCE_UNSUPPORTED');
      if(['unknown','unavailable'].includes(row.availability))mergeFail(row.label+'尚未可靠核对，不能执行。','MERGE_REFERENCE_UNAVAILABLE');
      if(row.blocking&&!['favorites','translations'].includes(row.key))mergeFail(row.label+'存在执行阻断，须先处理。','MERGE_REFERENCE_BLOCKED');
    }
    if(!accounts||typeof accounts.begin!=='function')mergeFail('未连接可恢复的账号收藏迁移适配器。','MERGE_REFERENCE_UNAVAILABLE');
    if(!likesFile)mergeFail('必须配置当前本机实际点赞文件；未知不能当0。','MERGE_REFERENCE_UNAVAILABLE');
    const likes=validateLikesSnapshot(JSON.parse(await fs.readFile(likesFile,'utf8')));
    for(const id of asIds(detail.plan))if((likes.items[id]?.voters??[]).length)mergeFail('存在匿名点赞，当前不支持伪称去重迁移。','MERGE_LIKES_NONZERO');
    return detail;
  }
  async function propose(plan,records){
    const primary=await normalizeRecord(structuredClone(plan.proposedRecord));
    primary.core.publication_file_path=plan.attachmentMap.map(image=>`/archive/${plan.primaryId}/${image.targetFilename}`);
    primary.public_view.image_descriptions=plan.attachmentMap.map(image=>image.description);
    primary.core.updated_date=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Shanghai',year:'numeric',month:'2-digit',day:'2-digit'}).format(now());
    primary.core.id_check='永久编号保留；合并前后编号与图片映射已核对。';
    primary.core.required_check='本次合并重新校验字段、隐私、图片、引用及正式构建。';
    const before=new Map(records.map(record=>[record.core.item_id,record])),secondary=structuredClone(before.get(plan.secondaryId));
    secondary.core.record_status='WDR';secondary.core.use_status='U4';secondary.core.updated_date=primary.core.updated_date;
    secondary.core.notes=[secondary.core.notes,`合并留档（${primary.core.updated_date}）：原件归入 ${plan.primaryId}；原编号不回收，原文和副本保留于私密历史。`].filter(Boolean).join('\n');
    const result=[];
    for(const original of records){
      let row=original.core.item_id===plan.primaryId?primary:original.core.item_id===plan.secondaryId?secondary:structuredClone(original);
      if(publicRecord(row)){
        const rewritten=rewriteMergeReferences(row,plan.primaryId,plan.secondaryId);
        if(!same(row,rewritten))rewritten.core.updated_date=primary.core.updated_date;row=rewritten;
      }
      result.push(row);
    }
    const affected=result.filter(row=>!same(row,before.get(row.core.item_id)));
    for(const row of affected.filter(publicRecord)){
      const issues=await validateRecord(row);if(issues.length)mergeFail(issues.map(issue=>issue.message).join('；'),'MERGE_METADATA_INVALID',422);
    }
    return{records:result,affected,primary:result.find(row=>row.core.item_id===plan.primaryId),secondary};
  }
  async function review(payload,actor){
    if(!payload||Object.keys(payload).some(key=>!['planId','planRevision'].includes(key)))mergeFail('合并核对请求格式无效。');
    const detail=await currentPlan(payload,actor),plan=detail.plan;
    await safeDirectory(directory,{create:true});
    for(const root of [archiveDirectory,inboxDirectory,siteDirectory,sharedDirectory])await safeDirectory(root);
    const directoryStat=await fs.stat(directory),siteStat=await fs.stat(siteDirectory);
    if(directoryStat.dev!==siteStat.dev)mergeFail('私密合并目录与网站目录不在同一文件系统，不能安全切换。','MERGE_FILESYSTEM_UNSUPPORTED');
    if(typeof validateImage!=='function'||typeof buildCandidate!=='function')mergeFail('缺少真实解码或构建器，不能模拟检查通过。');
    for(const image of plan.sourceImages){
      const relative=image.itemId+'/'+image.filename,bytes=await safeBytes(inboxDirectory,relative);
      if(hashBytes(bytes)!==image.sha256)mergeFail('图片与方案不同。','MERGE_STALE');
      await validateImage(bytes,image.filename);
    }
    for(const image of plan.attachmentMap){
      const relative=plan.primaryId+'/'+image.targetFilename;
      for(const root of [inboxDirectory,path.join(siteDirectory,'public/archive')]){
        const hash=await currentHash(root,relative);if(hash!==null&&hash!==image.sha256)mergeFail('同名目标副本内容不同，不能覆盖；请先调整方案。','MERGE_IMAGE_COLLISION');
      }
    }
    const records=await readRecords(),proposed=await propose(plan,records),baseline=await capture();
    // “发布前快照”必须对应当前应用中的发布副本，不能把同名但不同的inbox文件冒作旧图。
    for(const changed of proposed.affected){
      const original=records.find(row=>row.core.item_id===changed.core.item_id);
      for(const publicPath of original.core.publication_file_path??[]){
        const filename=path.basename(publicPath),relative=original.core.item_id+'/'+filename;
        if(publicPath!=='/archive/'+relative)mergeFail('受影响档案的图片路径不一致。','MERGE_IMAGE_PATH_INVALID');
        const hash=hashBytes(await safeBytes(inboxDirectory,relative));
        if(await currentHash(path.join(siteDirectory,'public/archive'),relative)!==hash)mergeFail('当前发布副本与私密待入站副本不一致或缺失，须先核对：'+original.core.item_id,'MERGE_PUBLIC_COPY_MISMATCH');
      }
    }
    for(const record of proposed.affected)if(await exists(path.join(draftDirectory,record.core.item_id+'.json')))mergeFail('受影响档案已有草稿，请先处理草稿：'+record.core.item_id,'MERGE_RELATED_DRAFT_EXISTS');
    for(const relative of Object.keys(baseline.files.drafts).filter(name=>/^LJM-\d{8}-[A-Z]{3}-\d{3}\.json$/.test(name))){
      const draft=await readJson(draftDirectory,relative),record=draft.record;
      if(!record?.core||!record.metadata)mergeFail('当前草稿结构异常，引用不能可靠核对。','MERGE_DRAFT_INVALID');
      if(!same(record,rewriteMergeReferences(record,plan.primaryId,plan.secondaryId)))mergeFail('其他未发布草稿引用了从档案，请先处理：'+record.core.item_id,'MERGE_RELATED_DRAFT_EXISTS');
    }
    const sourceBytes=Object.values(baseline.files).flatMap(Object.values).reduce((sum,row)=>sum+row.size,0);
    await assertFreeSpace(directory,sourceBytes*3+25*1024*1024);
    const favorites=accounts.inspect(asIds(plan)),reviewId=randomUUID();
    const value={reviewId,actor,plan:structuredClone(plan),planId:plan.planId,planRevision:plan.planRevision,
      basis:detail.current.fingerprint,baseline,baselineDigest:digest(baseline),favoritesDigest:favorites.digest,proposed,
      createdAt:now().toISOString(),expiresAt:now().getTime()+reviewTtl};
    reviews.set(reviewId,value);
    return{reviewId,planId:plan.planId,planRevision:plan.planRevision,expiresAt:new Date(value.expiresAt).toISOString(),
      primaryId:plan.primaryId,secondaryId:plan.secondaryId,record:proposed.primary,images:plan.attachmentMap,
      affectedIds:proposed.affected.map(row=>row.core.item_id),favoritesCount:favorites.rows.length,
      imageCount:plan.attachmentMap.length,beforePublicCount:records.filter(publicRecord).length,afterPublicCount:proposed.records.filter(publicRecord).length,
      warnings:['从件将正式撤销为WDR/U4，旧编号留档；旧副本撤出公开目录，私密待入站副本与快照保留。','修改过的中文和图片需要重新审核译文；旧译文保留于私密快照。','此为本机内部验收，尚未开放一般线上合并或撤销。'],canExecute:true};
  }
  async function snapshot(log,record){
    const id=record.core.item_id,entry=snapshotEntryId(),relative=id+'/'+entry,folder=path.join(historyDirectory,...relative.split('/'));
    await safeDirectory(historyDirectory,{create:true});await safeDirectory(folder,{create:true});
    await writeExclusive(historyDirectory,relative+'/record.json',await safeBytes(archiveDirectory,id+'.json'));
    const images=[];
    for(const publicPath of record.core.publication_file_path??[]){
      const filename=path.basename(publicPath);if(publicPath!==`/archive/${id}/${filename}`)mergeFail('历史图片路径不一致。');
      const bytes=await safeBytes(inboxDirectory,id+'/'+filename);await writeExclusive(historyDirectory,relative+'/images/'+filename,bytes);images.push({filename,sha256:hashBytes(bytes)});
    }
    const manifest={type:'history',entry_id:entry,item_id:id,title:record.core.title,created_at:now().toISOString(),status:'complete',snapshot_kind:log.operation_kind==='undo'?'published-before-merge-undo':'published-before-merge',merge_id:log.merge_id,images:images.map(row=>row.filename),image_hashes:images};
    await writeExclusive(historyDirectory,relative+'/manifest.json',bytesOf(manifest));
    return{item_id:id,entry_id:entry,relative,record_sha256:hashBytes(await safeBytes(historyDirectory,relative+'/record.json')),images};
  }
  async function stage(review,log){
    const folder=path.join(directory,log.merge_id),project=path.join(folder,'candidate'),site=path.join(project,'site');
    await copyTree(siteDirectory,site,{exclude:new Set(['node_modules','dist','.astro','.git'])});
    await copyTree(sharedDirectory,path.join(project,'shared'));
    await fs.symlink(await fs.realpath(path.join(siteDirectory,'node_modules')),path.join(site,'node_modules'),process.platform==='win32'?'junction':'dir');
    const plan=review.plan;
    const imageTargets=review.proposed.imageTargets??plan.attachmentMap.map(image=>({...image,targetItemId:plan.primaryId,sourceRoot:'inbox',sourceRelative:image.itemId+'/'+image.filename}));
    const imageRoots={inbox:inboxDirectory,history:historyDirectory,merges:directory};
    for(const image of imageTargets){
      if(!imageRoots[image.sourceRoot])mergeFail('图片恢复来源未定义。');
      const bytes=await safeBytes(imageRoots[image.sourceRoot],image.sourceRelative),relative='public/archive/'+image.targetItemId+'/'+image.targetFilename;
      if(hashBytes(bytes)!==image.sha256)mergeFail('制作候选版本时图片发生变化。','MERGE_STALE');
      const existing=await currentHash(site,relative);if(existing===null)await writeExclusive(site,relative,bytes);else if(existing!==image.sha256)mergeFail('候选版本同名图片冲突。');
    }
    // 仅移除本次候选网站中的公开副本；原inbox、当前网站与历史均尚未改动。
    for(const group of ['archive','archive-responsive'])for(const id of asIds(plan)){
      const root=path.join(site,'public',group,id);if(!await exists(root))continue;
      const current=review.proposed.records.find(row=>row.core.item_id===id),isPublic=current&&publicRecord(current);
      const keep=new Set(isPublic?current.core.publication_file_path.map(file=>path.basename(file)):[]);
      for(const relative of Object.keys(await tree(root)))if(!isPublic||group==='archive'&&!keep.has(relative))await fs.unlink(relativeFile(root,relative));
      // 响应式生成器根据正式源图清理主件不再需要的尺寸副本。
    }
    const source=archiveSourceForRecords(review.proposed.records);
    await writeVersionedFile(site,'src/data/archive.ts',Buffer.from(source));
    let projection={schema_version:1,aliases:{}};
    if(await exists(path.join(site,'src/data/archive-merge-aliases.json')))projection=await readJson(site,'src/data/archive-merge-aliases.json');
    if(review.proposed.projection)projection=structuredClone(review.proposed.projection);
    else projection.aliases[plan.secondaryId]={target_id:plan.primaryId,images:plan.sourceImages.filter(row=>row.itemId===plan.secondaryId).map(row=>({source_position:row.sourcePosition,target_filename:plan.attachmentMap.find(image=>image.ref===row.ref)?.targetFilename??null}))};
    resolveArchiveMergeProjection(review.proposed.records,projection);
    await writeVersionedFile(site,'src/data/archive-merge-aliases.json',bytesOf(projection));
    log.translationChanges=structuredClone(review.proposed.translationChanges??[]);
    for(const locale of translationLocales){
      const filename=locale==='en'?'archive-translations.json':`archive-translations.${locale}.json`,relative='src/data/'+filename;
      if(await exists(path.join(site,...relative.split('/')))){
        const layer=await readJson(site,relative);for(const id of asIds(plan))delete layer.records?.[id];await writeVersionedFile(site,relative,bytesOf(layer));
      }
      if(review.proposed.translationChanges)continue;
      const stored=(locale==='en'?'':locale+'/')+plan.primaryId+'.json';
      if(await exists(relativeFile(translationDirectory,stored))){
        const before=await readJson(translationDirectory,stored),active=before.draft??before.published??(before.locale?before:null);
        if(active){const next={schema_version:1,item_id:plan.primaryId,revision:(before.revision??1)+1,draft:{...active,status:'review'},published:null};log.translationChanges.push({relative:stored,value:next});}
      }
    }
    return{folder,project,site};
  }
  async function prepareFiles(review,log,candidate){
    const entries=[];
    const add=async(root,relative,bytes)=>{
      const beforeHash=await currentHash(writeRoots[root],relative),afterHash=bytes===null?null:hashBytes(bytes);if(beforeHash===afterHash)return;
      const index=entries.length,backup=beforeHash===null?null:`${log.merge_id}/before/${index}.bin`,next=bytes===null?null:`${log.merge_id}/after/${index}.bin`;
      if(backup)await writeExclusive(directory,backup,await safeBytes(writeRoots[root],relative));
      if(next)await writeExclusive(directory,next,bytes);
      entries.push({root,relative,beforeHash,afterHash,afterSize:bytes?.length??null,backup,next,beforeAttributes:await fileAttributes(writeRoots[root],relative),state:'pending'});
    };
    for(const record of review.proposed.affected)await add('archive',record.core.item_id+'.json',bytesOf(record));
    for(const draft of review.proposed.removeDrafts??[]){if(await currentHash(draftDirectory,draft.itemId+'.json')!==draft.sha256)mergeFail('恢复草稿有新编辑，不能直接转为发布。','MERGE_UNDO_STALE');await add('drafts',draft.itemId+'.json',null);}
    const imageRoots={inbox:inboxDirectory,history:historyDirectory,merges:directory};
    const imageTargets=review.proposed.imageTargets??review.plan.attachmentMap.map(image=>({...image,targetItemId:review.plan.primaryId,sourceRoot:'inbox',sourceRelative:image.itemId+'/'+image.filename}));
    for(const image of imageTargets)await add('inbox',image.targetItemId+'/'+image.targetFilename,await safeBytes(imageRoots[image.sourceRoot],image.sourceRelative));
    for(const row of log.translationChanges)await add('translations',row.relative,bytesOf(row.value));
    for(const key of ['sources','public']){
      const target=key==='sources'?path.join(candidate.site,'src'):path.join(candidate.site,'public');
      const before=review.baseline.files[key],after=await tree(target);
      for(const relative of new Set([...Object.keys(before),...Object.keys(after)])){
        if(before[relative]?.sha256===after[relative]?.sha256)continue;
        if(key==='sources'&&!/^data\/(?:archive(?:-translations(?:\.[A-Za-z-]+)?|-merge-aliases)?\.(?:ts|json)|generated\/image-manifest\.json)$/.test(relative))mergeFail('候选构建改变了未允许的程序源文件。','MERGE_BUILD_MUTATED_SOURCE');
        await add(key,relative,after[relative]?await safeBytes(target,relative):null);
      }
    }
    log.files=entries;log.distBefore=await treeDigest(path.join(siteDirectory,'dist'));log.distFiles=await tree(path.join(candidate.site,'dist'));log.distAfter=digest(log.distFiles);
    log.hadDist=await exists(path.join(siteDirectory,'dist'));await event(log,'files-prepared');
  }
  async function verifyAfter(log){
    for(const row of log.files)if(await currentHash(writeRoots[row.root],row.relative)!==row.afterHash)mergeFail('提交后文件摘要不一致，须核对。','MERGE_AFTER_MISMATCH');
    for(const row of log.files)if(row.afterHash!==null&&row.beforeAttributes&&!same(await fileAttributes(writeRoots[row.root],row.relative),row.beforeAttributes))mergeFail('提交后文件属主或权限不一致。','MERGE_AFTER_MISMATCH');
    if(await treeDigest(path.join(siteDirectory,'dist'))!==log.distAfter)mergeFail('当前公开产物与候选摘要不一致。','MERGE_AFTER_MISMATCH');
    if(!['applied','committed'].includes(accountHandler(log).status(log.merge_id)?.status))mergeFail('收藏迁移状态不能证明完成。');
    if(publication)await publication.verify(log);
  }
  async function retainPlanResult(log){
    if(log.operation_kind==='undo'){
      const parent=await detail(log.parent_merge_id,log.actor);
      if(parent.undo_merge_id&&parent.undo_merge_id!==log.merge_id)mergeFail('已有另一项撤销结果，须核对。');
      parent.status='reverted';parent.undo_merge_id=log.merge_id;
      if(!parent.events.some(row=>row.undoId===log.merge_id))parent.events.push({at:now().toISOString(),phase:'undo-committed',undoId:log.merge_id});
      await writeVersionedFile(directory,parent.merge_id+'/manifest.json',bytesOf(parent));
      await writeVersionedFile(directory,`plan-commits/${parent.plan_id}.${parent.plan_revision}.json`,bytesOf({mergeId:parent.merge_id,actor:parent.actor,status:'reverted',undoId:log.merge_id,completedAt:log.completed_at}));
      await writeVersionedFile(directory,`undo-results/${parent.merge_id}.json`,bytesOf({mergeId:log.merge_id,actor:log.actor,status:'committed',completedAt:log.completed_at}));return;
    }
    const relative=`plan-commits/${log.plan_id}.${log.plan_revision}.json`;
    if(await exists(relativeFile(directory,relative))){const old=await readJson(directory,relative);if(old.mergeId!==log.merge_id)mergeFail('该方案已关联其他执行结果，须核对。');}
    await writeVersionedFile(directory,relative,bytesOf({mergeId:log.merge_id,actor:log.actor,status:'committed',completedAt:log.completed_at}));
  }
  function expectedAfterBaseline(review,log,withDist=false){
    const expected=structuredClone(review.baseline);
    for(const row of log.files)if(row.afterHash===null)delete expected.files[row.root][row.relative];else expected.files[row.root][row.relative]={sha256:row.afterHash,size:row.afterSize};
    if(withDist)expected.files.dist=log.distFiles;
    if(log.publication?.switched)expected.publication=log.publication.after;
    return expected;
  }
  async function releaseLikes(log){
    if(!log.likes_gate)return;
    const result=await releasePrivateFileGate(likesFile,log.likes_gate.token);
    if(result.otherOwner&&log.likes_gate.acquired)mergeFail('点赞写入门禁归属改变，须核对。','MERGE_RECOVERY_CONFLICT');
    log.likes_gate.released=true;
  }
  async function rollback(log){
    const folder=path.join(directory,log.merge_id),dist=path.join(siteDirectory,'dist'),previous=path.join(folder,'previous-dist');
    // 先确认所有目标仍是本次的前值/后值，发现外部改动时不覆盖任何未知数据。
    for(const row of log.files??[]){const hash=await currentHash(writeRoots[row.root],row.relative);if(hash!==row.beforeHash&&hash!==row.afterHash)mergeFail('检测到合并后的外部改动，不能盲目恢复。','MERGE_RECOVERY_CONFLICT');}
    const currentDist=await treeDigest(dist);
    if(currentDist!==log.distBefore&&currentDist!==log.distAfter&&await exists(dist))mergeFail('公开产物已被其他操作改动，恢复已停止。','MERGE_RECOVERY_CONFLICT');
    if(publication)await publication.rollback(log);
    if(await exists(previous)){
      if(await treeDigest(previous)!==log.distBefore)mergeFail('原公开版本备份摘要不一致。','MERGE_RECOVERY_CONFLICT');
      if(await exists(dist)){
        const failed=path.join(folder,'failed-dist-'+randomUUID());await moveVerifiedDirectory(dist,failed,currentDist);
      }
      await moveVerifiedDirectory(previous,dist,log.distBefore);
    }else if(!log.hadDist&&await exists(dist)&&currentDist===log.distAfter)await moveVerifiedDirectory(dist,path.join(folder,'failed-dist-'+randomUUID()),log.distAfter);
    accountHandler(log).rollback(log.merge_id);
    for(const row of [...(log.files??[])].reverse()){
      const current=await currentHash(writeRoots[row.root],row.relative);if(current===row.beforeHash)continue;
      if(row.beforeHash===null){if(current!==row.afterHash)mergeFail('新增文件已有其他变化，禁止删除。');await fs.unlink(relativeFile(writeRoots[row.root],row.relative));}
      else{const bytes=await safeBytes(directory,row.backup);if(hashBytes(bytes)!==row.beforeHash)mergeFail('恢复副本摘要无效。');await writeVersionedFile(writeRoots[row.root],row.relative,bytes,row.beforeAttributes);}
    }
    for(const row of log.files??[])if(await currentHash(writeRoots[row.root],row.relative)!==row.beforeHash)mergeFail('恢复后摘要仍不一致。','MERGE_RECOVERY_CONFLICT');
    if(log.hadDist&&await treeDigest(dist)!==log.distBefore)mergeFail('恢复后的公开版本摘要无效。','MERGE_RECOVERY_CONFLICT');
    await releaseLikes(log);log.status='rolled-back';await event(log,'rolled-back',log.failure?{errorCode:log.failure.code}:{});return{status:'rolled-back'};
  }
  async function execute(payload,actor,context){
    const allowed=new Set(['planId','planRevision','reviewId','confirmPrimaryId','confirmations','publicationAuthorization']);
    if(!payload||Object.keys(payload).some(key=>!allowed.has(key)))mergeFail('合并提交参数无效。');
    const reviewed=reviews.get(payload.reviewId);
    if(!reviewed||reviewed.actor!==actor||reviewed.expiresAt<=now().getTime()||reviewed.planId!==payload.planId||reviewed.planRevision!==payload.planRevision)mergeFail('合并核对已过期、重启失效或不属于当前维护身份，请重新核对。','MERGE_REVIEW_EXPIRED');
    if(payload.confirmPrimaryId!==reviewed.plan.primaryId||!Array.isArray(payload.confirmations)||payload.confirmations.length!==13||payload.confirmations.some(value=>value!==true)||payload.publicationAuthorization?.publishMergedPrimary!==true||payload.publicationAuthorization?.withdrawSecondary!==true||Object.keys(payload.publicationAuthorization).some(key=>!['publishMergedPrimary','withdrawSecondary'].includes(key)))mergeFail('必须本人核对13项、确认保留编号，并明确同意发布主件和撤销从件。','MERGE_CONFIRMATION_REQUIRED',422);
    assertUuid(context.operationId);assertUuid(context.stepId);abort(context.signal);
    await currentPlan(payload,actor);
    if(!same(await capture(),reviewed.baseline))mergeFail('全站输入或当前公开版本已变化，请重新生成核对。','MERGE_BASELINE_CHANGED');
    if(accounts.inspect(asIds(reviewed.plan)).digest!==reviewed.favoritesDigest)mergeFail('收藏已变化，请重新核对。','MERGE_BASELINE_CHANGED');
    reviews.delete(payload.reviewId);
    return commitChange(reviewed,actor,context,payload);
  }
  async function commitChange(reviewed,actor,context,payload){
    context.assertDeploymentLock?.();
    if(reviewed.actor!==actor)mergeFail('核对结果不属于当前维护身份。','MERGE_FORBIDDEN',403);
    assertUuid(context.operationId);assertUuid(context.stepId);abort(context.signal);
    if(!same(await capture(),reviewed.baseline))mergeFail('全站输入已变化，请重新核对。','MERGE_BASELINE_CHANGED');
    const mergeId=randomUUID(),folder=path.join(directory,mergeId);
    await safeDirectory(folder,{create:true});
    const log={schema_version:1,merge_id:mergeId,operation_kind:reviewed.operationKind??'merge',parent_merge_id:reviewed.parentMergeId??null,status:'prepared',phase:'prepared',actor,primary_id:reviewed.plan.primaryId,secondary_id:reviewed.plan.secondaryId,plan_id:payload.planId,plan_revision:payload.planRevision,
      operation:{operationId:context.operationId,stepId:context.stepId},created_at:now().toISOString(),baseline_digest:reviewed.baselineDigest,authorization:{confirmPrimaryId:payload.confirmPrimaryId,...(payload.confirmSecondaryId?{confirmSecondaryId:payload.confirmSecondaryId}:{}),confirmations:payload.confirmations,publicationAuthorization:payload.publicationAuthorization},events:[],snapshots:[],files:[]};
    if(publication)log.publicationBefore=reviewed.baseline.publication;
    context.markChanged();
    await writeExclusive(directory,`${mergeId}/review.json`,bytesOf(reviewed));
    await writeExclusive(directory,`commit-operations/${context.operationId}.${context.stepId}.json`,bytesOf({mergeId,actor}));
    await event(log,'prepared');
    let candidate;
    try{
      const originals=await readRecords();
      for(const row of reviewed.proposed.affected){abort(context.signal);log.snapshots.push(await snapshot(log,originals.find(record=>record.core.item_id===row.core.item_id)));}
      await event(log,'snapshots-complete');abort(context.signal);
      candidate=await stage(reviewed,log);await event(log,'candidate-ready');abort(context.signal);
      log.buildOutput=String(await buildCandidate({siteDirectory:candidate.site,projectDirectory:candidate.project,signal:context.signal})).slice(-50000);
      await event(log,'build-complete');abort(context.signal);
      if(!same(await capture(),reviewed.baseline))mergeFail('构建期间全站输入发生变化；候选已作废，原公开版本保留。','MERGE_BASELINE_CHANGED');
      if(accounts.inspect(asIds(reviewed.plan)).digest!==reviewed.favoritesDigest)mergeFail('构建期间收藏变化，须重新核对。','MERGE_BASELINE_CHANGED');
      await prepareFiles(reviewed,log,candidate);abort(context.signal);
      log.likes_gate={token:randomUUID(),pid:process.pid,acquired:false};await event(log,'likes-lock-intent');
      await acquirePrivateFileGate(likesFile,{token:log.likes_gate.token,role:'archive-merge',mergeId});log.likes_gate.acquired=true;await event(log,'likes-locked');
      if(!same(await capture(),reviewed.baseline))mergeFail('最终提交前全站输入或点赞已变化，须重新核对。','MERGE_BASELINE_CHANGED');
      // 到此仅写私密候选与快照。提交期间账号只短时设置持久化目标门禁，不长持SQLite锁。
      accountHandler(log).begin({mergeId,primaryId:log.primary_id,secondaryId:log.secondary_id,expectedDigest:reviewed.favoritesDigest});
      log.status='committing';await event(log,'favorites-locked');
      for(const row of log.files){
        context.assertDeploymentLock?.();
        abort(context.signal);
        if(await currentHash(writeRoots[row.root],row.relative)!==row.beforeHash)mergeFail('提交前文件变化，已停止。','MERGE_BASELINE_CHANGED');
        if(row.beforeAttributes&&!same(await fileAttributes(writeRoots[row.root],row.relative),row.beforeAttributes))mergeFail('提交前文件属主或权限变化，已停止。','MERGE_BASELINE_CHANGED');
        row.state='writing';await event(log,'writing-file',{root:row.root,relative:row.relative});
        if(row.afterHash===null)await fs.unlink(relativeFile(writeRoots[row.root],row.relative));
        else{const bytes=await safeBytes(directory,row.next);if(hashBytes(bytes)!==row.afterHash)mergeFail('待提交副本摘要不一致。');await writeVersionedFile(writeRoots[row.root],row.relative,bytes,row.beforeAttributes);}
        row.state='written';await event(log,'file-written');
      }
      await event(log,'files-applied');abort(context.signal);
      accountHandler(log).apply(mergeId);await event(log,'favorites-applied');abort(context.signal);
      if(!same(await capture(),expectedAfterBaseline(reviewed,log)))mergeFail('提交期间其他输入变化，旧候选不能覆盖新资料。','MERGE_BASELINE_CHANGED');
      const dist=path.join(siteDirectory,'dist'),previous=path.join(folder,'previous-dist');
      if(await treeDigest(dist)!==log.distBefore)mergeFail('当前公开版本变化，不能切换。','MERGE_BASELINE_CHANGED');
      if(await treeDigest(path.join(candidate.site,'dist'))!==log.distAfter)mergeFail('候选产物摘要变化，不能切换。','MERGE_CANDIDATE_CHANGED');
      if(log.hadDist)await moveVerifiedDirectory(dist,previous,log.distBefore);
      await event(log,'previous-dist-retained');
      await moveVerifiedDirectory(path.join(candidate.site,'dist'),dist,log.distAfter);await event(log,'dist-switched');
      if(!same(await capture(),expectedAfterBaseline(reviewed,log,true)))mergeFail('切换后发现其他输入变化，须恢复后核对。','MERGE_BASELINE_CHANGED');
      if(publication){context.assertDeploymentLock?.();await publication.publish(log,phase=>{context.assertDeploymentLock?.();return event(log,phase);},context.signal);if(!same(await capture(),expectedAfterBaseline(reviewed,log,true)))mergeFail('公开切换后发现其他变化。','MERGE_BASELINE_CHANGED');}
      await verifyAfter(log);await event(log,'verified');abort(context.signal);
      log.status='committed';log.completed_at=now().toISOString();await event(log,'committed');
      await retainPlanResult(log);
      accountHandler(log).finalize(mergeId);
      await releaseLikes(log);await writeVersionedFile(directory,mergeId+'/manifest.json',bytesOf(log));
      return{mergeId,status:'committed',primaryId:log.primary_id,secondaryId:log.secondary_id,results:asIds(reviewed.plan).map(itemId=>({itemId,ok:true}))};
    }catch(error){
      if(log.status==='committed')throw error;
      log.failure={code:error.code??'BUILD_FAILED',phase:log.phase};
      try{context.assertDeploymentLock?.();}catch(lockError){log.status='needs_review';await event(log,'needs-review',{errorCode:lockError.code});throw lockError;}
      // 提交前失败不应尝试覆盖全站来源或他人的新改动。
      if(!log.files.length||log.files.every(row=>row.state==='pending')){
        accountHandler(log).rollback(mergeId);await releaseLikes(log);log.status='rolled-back';await event(log,'rolled-back',{errorCode:error.code??'BUILD_FAILED'});
      }else try{await rollback(log);}catch(recovery){log.status='needs_review';await event(log,'needs-review',{errorCode:recovery.code??'RECOVERY_FAILED'});error.message+='；无法证明恢复完成，写入保持暂停。';throw error;}
      error.safeToRetry=true;throw error;
    }
  }
  async function detail(mergeId,actor){
    mergeId=assertUuid(mergeId);const log=await readJson(directory,mergeId+'/manifest.json');
    if(isLegacy(log))return{merge_id:mergeId,legacy:true,operation_kind:'legacy',status:log.status,primary_id:log.primary_id,secondary_id:log.secondary_id,created_at:log.created_at,completed_at:log.completed_at??null,snapshots:(log.snapshots??[]).map(row=>({item_id:row.item_id})),message:'历史手工操作，只读追溯。旧日志格式不同，需核对快照与原授权后另建恢复提案，不能按新版事务直接撤销。'};
    if(log.actor!==actor)mergeFail('无权查看这项合并记录。','MERGE_FORBIDDEN',403);return log;
  }
  async function byOperation(operationId,stepId,actor){
    operationId=assertUuid(operationId);stepId=assertUuid(stepId);
    let link;
    try{link=await readJson(directory,`commit-operations/${operationId}.${stepId}.json`);}
    catch(error){
      if(error.code!=='ENOENT')throw error;
      for(const entry of await fs.readdir(directory,{withFileTypes:true}))if(entry.isDirectory()&&operationIdPattern.test(entry.name)){
        let log;try{log=await readJson(directory,entry.name+'/manifest.json');}catch{continue;}
        if(log.operation?.operationId===operationId&&log.operation?.stepId===stepId&&log.actor===actor){if(link)mergeFail('操作去向不唯一，须人工核对。');link={mergeId:entry.name,actor};}
      }
      if(!link)mergeFail('尚未找到可靠的合并日志，请核对原请求。','MERGE_RESULT_UNKNOWN');
    }
    if(link.actor!==actor)mergeFail('无权查看这项合并结果。','MERGE_FORBIDDEN',403);return detail(link.mergeId,actor);
  }
  async function recover(mergeId,actor){
    const log=await detail(mergeId,actor);
    if(log.legacy)mergeFail('历史手工操作不能使用新版事务恢复，请先核对历史快照。','MERGE_LEGACY_READ_ONLY');
    if(log.status==='committed'){await verifyAfter(log);await retainPlanResult(log);accountHandler(log).finalize(log.merge_id);await releaseLikes(log);await writeVersionedFile(directory,log.merge_id+'/manifest.json',bytesOf(log));return{status:'committed',log};}
    if(log.status==='reverted')return{status:log.status,log};
    if(log.status==='rolled-back')return{status:log.status,log};
    if(!log.files.length||log.files.every(row=>row.state==='pending')){accountHandler(log).rollback(log.merge_id);await releaseLikes(log);log.status='rolled-back';await event(log,'rolled-back');return{status:log.status,log};}
    await rollback(log);return{status:'rolled-back',log};
  }
  async function list(actor){
    const rows=[];
    for(const entry of await fs.readdir(directory,{withFileTypes:true}).catch(error=>{if(error.code==='ENOENT')return[];throw error;}))if(entry.isDirectory()&&operationIdPattern.test(entry.name)){
      const log=await readJson(directory,entry.name+'/manifest.json');
      if(log.actor===actor||isLegacy(log))rows.push({mergeId:log.merge_id,operationKind:isLegacy(log)?'legacy':log.operation_kind??'merge',canUndo:!isLegacy(log)&&log.operation_kind!=='undo'&&log.status==='committed',parentMergeId:log.parent_merge_id??null,primaryId:log.primary_id,secondaryId:log.secondary_id,status:log.status,createdAt:log.created_at,completedAt:log.completed_at??null});
    }
    return rows.sort((a,b)=>b.createdAt.localeCompare(a.createdAt));
  }
  return{review,execute,detail,byOperation,recover,capture,commitChange,list};
}

const isLegacy=log=>!log.actor&&Boolean(log.operator)&&['committed','failed'].includes(log.status)&&/^LJM-\d{8}-[A-Z]{3}-\d{3}$/.test(log.primary_id??'')&&/^LJM-\d{8}-[A-Z]{3}-\d{3}$/.test(log.secondary_id??'');
