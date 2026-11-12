// 只操作账号的私密说明书草稿；图片先落盘、记录原子切换，旧副本始终保留。
import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash,randomBytes} from 'node:crypto';
import {manualPageLimits,privateSubmissionImagePattern,normalizeManualPageOperation} from '../shared/manual-pages.mjs';

const digest=value=>createHash('sha256').update(value).digest('hex');
const fail=(message,statusCode=400)=>{throw Object.assign(new Error(message),{name:'SubmissionError',statusCode});};
async function filesUsage(directory){
  const entries=await fs.readdir(directory,{withFileTypes:true}).catch(error=>{if(error.code==='ENOENT')return [];throw error;});
  let bytes=0,count=0;
  for(const entry of entries)if(entry.isFile()&&privateSubmissionImagePattern.test(entry.name)){bytes+=(await fs.stat(path.join(directory,entry.name))).size;count++;}
  return {bytes,count};
}
export function createManualPageStore({root,read,locked,ownedBy,safeAccountId,stageImages,processImages,writeRecord,summary,checkAccountStorage,accountUsage,maxStorageBytes,globalUsage,assertMaterialWritable}){
  const draft=async(id,accountId)=>{
    const record=ownedBy(await read(id),safeAccountId(accountId));
    if(record.submission_kind!=='manual'||record.status!=='draft')fail('找不到可编辑的说明书草稿。',404);
    if(record.source_format==='pdf')fail('本册使用PDF方式，请从PDF入口保存；不能同时加入图片。',409);
    return record;
  };
  const usage=async(record)=>{
    const current=await filesUsage(path.join(root,record.id));
    return {stored_bytes:current.bytes,stored_copies:current.count,page_count:record.images.length,account_remaining_bytes:(await accountUsage(record.account_id)).storage_left_bytes};
  };
  const receipt=(record,operation,fingerprint)=>{
    const previous=(record.manual_page_receipts??[]).find(entry=>entry.operation_id===operation.operation_id);
    if(!previous)return null;
    if(previous.fingerprint!==fingerprint)fail('同一次页面操作的内容已经改变，请读取最新草稿后重新操作。',409);
    return {...summary(record),operation_id:operation.operation_id,page_id:previous.page_id??'',repeated:true};
  };
  const finish=async(record,operation,fingerprint,images,retired=null,pageId='')=>{
    const now=new Date().toISOString();
    const next={...record,images,revision:record.revision+1,updated_at:now,
      manual_page_receipts:[...(record.manual_page_receipts??[]),{operation_id:operation.operation_id,fingerprint,page_id:pageId,revision:record.revision+1}].slice(-manualPageLimits.receipts),
      history:[...record.history,{at:now,action:'manual_page_'+operation.action}],
    };
    if(retired)next.manual_page_archive=[...(record.manual_page_archive??[]),{...retired,retired_at:now,reason:operation.action}];
    await writeRecord(record.id,next);
    return {...summary(next),operation_id:operation.operation_id,page_id:pageId};
  };
  const upload=async({id,accountId,payload})=>{
    const operation=normalizeManualPageOperation(payload,true);
    // 拒绝未归属账号的内容后才进行解码；每次只有一张，复用原有真实解码与元数据清理。
    await draft(id,accountId);
    const staged=await stageImages([payload.image],1);
    const fingerprint=digest(JSON.stringify({...operation,image:{name:staged[0].name,type:staged[0].mimeType,sha256:digest(staged[0].buffer)}}));
    return locked(`account-quota-${safeAccountId(accountId)}`,()=>locked('intake',()=>locked(id,async()=>{
      const record=await draft(id,accountId),replayed=receipt(record,operation,fingerprint);if(replayed)return replayed;
      await assertMaterialWritable(record);
      if(record.revision!==operation.revision)fail('草稿已被其他操作更新，请读取最新版本后重新选择图片。',409);
      const target=operation.target_page_id?record.images.find(image=>image.page_id===operation.target_page_id):null;
      if(operation.target_page_id&&!target)fail('要替换的页面已改变，请重新读取草稿。',409);
      if(!target&&record.images.length>=manualPageLimits.pages)fail('每册最多200页，请先核对本册资料。',413);
      // 操作凭证决定文件名，异常中断后重试可以核对同一副本，不重复占用空间。
      const filename=`manual-${operation.operation_id}.jpg`,file=path.join(root,id,filename);
      if(record.images.some(image=>image.filename===filename)||(record.manual_page_archive??[]).some(image=>image.filename===filename))fail('这次图片操作已使用，请读取最新草稿后重新操作。',409);
      const [clean]=await processImages(staged,()=>filename);
      let existing=null;try{existing=await fs.readFile(file);}catch(error){if(error.code!=='ENOENT')throw error;}
      if(existing&&!existing.equals(clean.buffer))fail('同一次上传的副本发生变化，请重新选择图片。',409);
      const added=existing?0:clean.bytes,current=await filesUsage(path.join(root,id));
      if(current.bytes+added>manualPageLimits.bookBytes||current.count+(existing?0:1)>manualPageLimits.storedCopies)fail('本册私密副本占用已达上限（100 MB或1000份，含替换与移出后保留的副本）。',413);
      await checkAccountStorage(accountId,added);
      if((await globalUsage()).allocatedBytes+added>maxStorageBytes)fail('私密暂存区容量不足，已保存页面仍保留，请稍后重试。',503);
      const image={filename,original_name:clean.original_name,bytes:clean.bytes,page_id:target?.page_id??`MP-${randomBytes(12).toString('hex')}`,label:target?.label??'',note:target?.note??''};
      if(!existing)await fs.writeFile(file,clean.buffer,{mode:0o600,flag:'wx'});
      const images=target?record.images.map(old=>old.page_id===target.page_id?image:old):[...record.images,image];
      return finish(record,operation,fingerprint,images,target,image.page_id);
    })));
  };
  const edit=async({id,accountId,payload})=>{
    const operation=normalizeManualPageOperation(payload),fingerprint=digest(JSON.stringify(operation));
    return locked(`account-quota-${safeAccountId(accountId)}`,()=>locked(id,async()=>{
      const record=await draft(id,accountId),replayed=receipt(record,operation,fingerprint);if(replayed)return replayed;
      await assertMaterialWritable(record);
      if(record.revision!==operation.revision)fail('草稿已被其他操作更新，本页页序仍保留，请先核对最新版本。',409);
      if(operation.action==='remove'){
        const page=record.images.find(image=>image.page_id===operation.page_id);if(!page)fail('要移出的页面不存在，请重新读取。',409);
        return finish(record,operation,fingerprint,record.images.filter(image=>image.page_id!==page.page_id),page,page.page_id);
      }
      const byId=new Map(record.images.map(image=>[image.page_id,image]));
      if(operation.pages.length!==record.images.length||operation.pages.some(page=>!byId.has(page.page_id)))fail('页序清单与已保存页面不一致，不能遗漏或加入其他页面。',409);
      const images=operation.pages.map(page=>({...byId.get(page.page_id),label:page.label,note:page.note}));
      return finish(record,operation,fingerprint,images);
    }));
  };
  const image=async({id,accountId,filename})=>{
    const record=ownedBy(await read(id),safeAccountId(accountId));
    if(record.submission_kind!=='manual')fail('找不到这份说明书投稿。',404);
    if(!record.images.some(page=>page.filename===filename))fail('本册没有这张已保存页面。',404);
    let bytes;try{bytes=await fs.readFile(path.join(root,id,filename));}catch(error){if(error.code==='ENOENT')fail('本页私密副本暂时无法读取，请联系站主核对。',404);throw error;}
    if(['pending','needs_info','approved','declined'].includes(record.status)){
      const version=(record.versions??[]).find(item=>item.revision===record.manual_submitted_revision&&item.manual_metadata);
      const page=version?.images.find(item=>item.filename===filename);
      if(!page||digest(bytes)!==page.sha256)fail('页面与提交时的留存内容不一致，请联系站主核对。',409);
    }
    return bytes;
  };
  const operationStatus=async({id,accountId,operationId})=>{
    if(!/^[a-f0-9]{64}$/.test(operationId??''))fail('页面操作凭证无效。',404);
    const record=ownedBy(await read(id),safeAccountId(accountId));
    if(record.submission_kind!=='manual')fail('找不到这份说明书投稿。',404);
    const found=(record.manual_page_receipts??[]).find(entry=>entry.operation_id===operationId);
    return {id,operation_id:operationId,applied:Boolean(found),revision:record.revision,page_id:found?.page_id??''};
  };
  return {upload,edit,image,usage,operationStatus};
}
