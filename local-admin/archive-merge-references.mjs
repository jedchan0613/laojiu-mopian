// 只读适配器：返回数量和明细摘要，不返回用户姓名、邮箱或账号数据。
import fs from 'node:fs/promises';
import path from 'node:path';
import { digest, operationIdPattern } from './write-coordinator.mjs';
import { translationLocales } from '../shared/locale-config.mjs';
import {validateLikesSnapshot} from '../shared/archive-merge-likes.mjs';

const entries = async directory => {
  try {
    const stat = await fs.lstat(directory);
    if (!stat.isDirectory() || stat.isSymbolicLink()) throw new Error('引用目录不能是链接');
    return await fs.readdir(directory, { withFileTypes: true });
  } catch (error) { if (error.code === 'ENOENT') return []; throw error; }
};
const read = async file => {
  const parent = await fs.lstat(path.dirname(file)), stat = await fs.lstat(file);
  if (!parent.isDirectory() || parent.isSymbolicLink() || !stat.isFile() || stat.isSymbolicLink() || stat.size > 4 * 1024 * 1024) throw new Error('引用文件类型或大小异常');
  return JSON.parse(await fs.readFile(file, 'utf8'));
};
const available=(key,label,rows,extra={})=>({key,label,availability:'available',count:rows.length,digest:digest(rows),...extra});

export function createMergeReferenceInspector({ accountDirectory, submissionDirectory, mergeDirectory, translationDirectory=null, siteDataDirectory=null, likesFile=null }) {
  return async (ids,records) => {
    const selected=new Set(ids),result=[];
    const related=[];
    for(const record of records){
      for(const target of record.core.related_item_ids??[])if(selected.has(target))related.push({from:record.core.item_id,path:'core.related_item_ids',to:target});
      for(const[dimension,fields]of Object.entries(record.metadata?.dimensions??{}))for(const[key,value]of Object.entries(fields))if(/^(portrait_item_id|attachment_item_ids|related_item_ids)$/.test(key))for(const target of Array.isArray(value)?value:[value])if(selected.has(target))related.push({from:record.core.item_id,path:'metadata.dimensions.'+dimension+'.'+key,to:target});
    }
    result.push(available('archive-links','其他档案引用',related,{message:'结构化引用保留原编号和迁移依据；执行阶段须逐条处理。'}));
    const albumIds=new Set(records.filter(r=>selected.has(r.core.item_id)).map(r=>r.core.album_id).filter(Boolean));
    const members=records.filter(r=>albumIds.has(r.core.album_id)).map(r=>({itemId:r.core.item_id,albumId:r.core.album_id,position:r.core.original_position??null}));
    result.push(available('albums','实物相册关系',members,{message:'按现有相册编号核对；主题选览不能代替同源依据。'}));
    const selectedTags = new Set(records.filter(r=>selected.has(r.core.item_id)).flatMap(r=>r.public_view?.tags??[]));
    const tagged = records.flatMap(r=>(r.public_view?.tags??[]).filter(tag=>selectedTags.has(tag)).map(tag=>({itemId:r.core.item_id,tag,status:[r.core.record_status,r.core.privacy_level,r.core.use_status]})));
    result.push(available('tag-groups','标签与主题归集线索',tagged,{message:'主题选览按最终公开标签及现有页面规则重建；不会把主题标签改写为实物相册编号。'}));
    if(translationDirectory&&siteDataDirectory)try{
      const rows=[];
      for(const locale of translationLocales){
        const folder=locale==='en'?translationDirectory:path.join(translationDirectory,locale);
        for(const itemId of ids){
          try{const record=await read(path.join(folder,itemId+'.json'));rows.push({itemId,locale,storage:'private',digest:digest(record),hasDraft:Boolean(record.draft),hasPublished:Boolean(record.published||record.status==='published')});}
          catch(error){if(error.code!=='ENOENT')throw error;}
        }
        const name=locale==='en'?'archive-translations.json':`archive-translations.${locale}.json`;
        try{const layer=await read(path.join(siteDataDirectory,name));for(const itemId of ids)if(layer.records?.[itemId])rows.push({itemId,locale,storage:'public-export',digest:digest(layer.records[itemId])});}
        catch(error){if(error.code!=='ENOENT')throw error;}
      }
      result.push(available('translations','五语言译文与逐图翻译',rows,{blocking:rows.length>0,message:rows.length?'已有译文及原文摘要必须按最终中文和图片映射逐项复核，不能自动沿用已审核状态；全文不进入引用清单。':'已查当前本机配置的译文库和公开导出；不据此假定线上无译文。'}));
    }catch{result.push({key:'translations',label:'五语言译文与逐图翻译',availability:'unavailable',count:null,blocking:true,message:'译文引用未能完整读取；不能假设没有译文。'});}
    else result.push({key:'translations',label:'五语言译文与逐图翻译',availability:'unknown',count:null,blocking:true,message:'未配置译文只读核对路径，执行前必须补齐。'});
    try {
      const file=path.join(accountDirectory,'accounts.db'),stat=await fs.lstat(file),parent=await fs.lstat(accountDirectory);
      if(!parent.isDirectory()||parent.isSymbolicLink()||!stat.isFile()||stat.isSymbolicLink())throw new Error('账户库类型异常');
      const {DatabaseSync}=await import('node:sqlite'),db=new DatabaseSync(file,{readOnly:true});
      try{const rows=db.prepare('SELECT user_id, item_id, created_at FROM favorites WHERE item_id IN (?, ?) ORDER BY user_id, item_id').all(...ids);result.push(available('favorites','账号收藏',rows,{message:'仅核对数量和摘要，账号库没有写入。执行阶段须去重并保留可逆证据。'}));}finally{db.close();}
    }catch(error){result.push({key:'favorites',label:'账号收藏',availability:error.code==='ENOENT'?'not_applicable':'unavailable',count:null,blocking:error.code!=='ENOENT',message:error.code==='ENOENT'?'当前本机未建立账号库，不假设线上收藏为0；上线前须重新核对。':'账号引用未能可靠核对，不能承诺迁移。'});}
    try {
      const rows=[];for(const entry of await entries(submissionDirectory)){if(!entry.isDirectory()||!/^TG-[A-F0-9]{24}$/.test(entry.name))continue;const record=await read(path.join(submissionDirectory,entry.name,'record.json'));if(selected.has(record.linked_item_id))rows.push({id:entry.name,itemId:record.linked_item_id,status:record.status,accountId:record.account_id??null,updatedAt:record.updated_at??null});}
      result.push(available('submissions','投稿与撤回权',rows,{blocking:rows.length>0,message:rows.length?'存在关联投稿；执行阶段需要专门适配归属及撤回权。':'已查当前私密投稿记录，无目标编号关联。'}));
    }catch{result.push({key:'submissions',label:'投稿与撤回权',availability:'unavailable',count:null,blocking:true,message:'投稿引用未能完整读取。'});}
    try {
      const rows=[];for(const entry of await entries(mergeDirectory)){if(!entry.isDirectory()||!operationIdPattern.test(entry.name))continue;const record=await read(path.join(mergeDirectory,entry.name,'manifest.json'));if(record.status!=='committed')continue;const primary=record.primary_id??record.primary,secondary=record.secondary_id??record.secondary;if(selected.has(primary)||selected.has(secondary))rows.push({mergeId:entry.name,primary,secondary});}
      result.push(available('merge-chain','既有合并关系',rows,{blocking:rows.some(row=>row.primary===ids[1]||selected.has(row.secondary)),message:'既有主件首版不得作为从件；已合并从件不得再次合并。'}));
    }catch{result.push({key:'merge-chain',label:'既有合并关系',availability:'unavailable',count:null,blocking:true,message:'合并依赖记录无法可靠读取。'});}
    if(likesFile)try{const state=validateLikesSnapshot(await read(likesFile)),rows=ids.map(itemId=>({itemId,voters:state.items[itemId]?.voters??[]})),count=rows.reduce((n,row)=>n+row.voters.length,0);result.push({...available('likes','匿名点赞',rows),count,blocking:count>0,message:count?'旧匿名标识含档案编号，不能跨两件伪称去重；尚未开放迁移。':'当前配置的点赞库已只读核对，目标为0赞。'});}catch{result.push({key:'likes',label:'匿名点赞',availability:'unavailable',count:null,blocking:true,message:'配置的点赞库无法核对。'});}
    else result.push({key:'likes',label:'匿名点赞',availability:'unknown',count:null,blocking:true,message:'本机未连接线上独立点赞库，执行前必须现场核对；未把未知当0。'});
    for(const[key,label]of [['loans','借阅/流转'],['approvals','审批/移交/保全'],['retention','保管期限与密级']])result.push({key,label,availability:'not_applicable',count:null,message:'本项目未接入此管理项，不模拟校验通过；如存在实际业务，执行前须另行核对。'});
    result.push({key:'external',label:'站外链接与浏览器足迹',availability:'manual_review',count:null,message:'无法穷举站外引用；后续使用旧编号去向映射，不上传浏览历史。'});
    return result;
  };
}
