import fs from 'node:fs/promises';
import path from 'node:path';
import {constants} from 'node:fs';
import {createHash,randomUUID} from 'node:crypto';
import {atomicWrite,digest,WriteSafetyError} from './write-coordinator.mjs';

export const mergeFail=(message,code='MERGE_EXECUTION_BLOCKED',status=409)=>{throw new WriteSafetyError(message,status,code);};
export const exists=async file=>fs.lstat(file).then(()=>true,error=>{if(error.code==='ENOENT')return false;throw error;});
export const hashBytes=bytes=>createHash('sha256').update(bytes).digest('hex');
export const inside=(root,file)=>{const relative=path.relative(path.resolve(root),path.resolve(file));return relative===''||!relative.startsWith('..')&&!path.isAbsolute(relative);};
export function relativeFile(root,relative){
  if(typeof relative!=='string'||!relative||relative.split('/').some(part=>!part||['.','..'].includes(part))||/[\\:\u0000]/.test(relative))mergeFail('合并文件相对路径无效。','MERGE_PATH_INVALID');
  const file=path.resolve(root,...relative.split('/'));if(!inside(root,file))mergeFail('合并路径越界。','MERGE_PATH_INVALID');return file;
}
export async function safeDirectory(directory,{create=false}={}){
  if(create)await fs.mkdir(directory,{recursive:true,mode:0o700});
  const stat=await fs.lstat(directory);if(!stat.isDirectory()||stat.isSymbolicLink())mergeFail('合并目录必须是常规私密目录。','MERGE_PATH_INVALID');
  return fs.realpath(directory);
}
export async function safeBytes(root,relative){
  const file=relativeFile(root,relative);let current=path.resolve(root);
  await safeDirectory(current);
  for(const name of relative.split('/').slice(0,-1)){current=path.join(current,name);await safeDirectory(current);}
  const before=await fs.lstat(file);if(!before.isFile()||before.isSymbolicLink()||before.size>64*1024*1024)mergeFail('文件类型或大小不符合合并要求。','MERGE_FILE_INVALID');
  const handle=await fs.open(file,constants.O_RDONLY|(constants.O_NOFOLLOW??0));let bytes;
  try{const stat=await handle.stat();if(stat.ino!==before.ino||stat.dev!==before.dev)mergeFail('文件已被替换，请重新核对。','MERGE_BASELINE_CHANGED');bytes=await handle.readFile();}finally{await handle.close();}
  const after=await fs.lstat(file);if(after.isSymbolicLink()||after.ino!==before.ino||after.dev!==before.dev||after.size!==before.size||after.mtimeMs!==before.mtimeMs)mergeFail('文件在读取期间发生变化。','MERGE_BASELINE_CHANGED');
  return bytes;
}
export async function tree(directory,{exclude=new Set()}={}){
  if(!await exists(directory))return{};await safeDirectory(directory);const files={};
  async function walk(folder,prefix=''){
    for(const entry of (await fs.readdir(folder,{withFileTypes:true})).sort((a,b)=>a.name.localeCompare(b.name))){
      if(exclude.has(entry.name))continue;
      const relative=prefix+entry.name,full=path.join(folder,entry.name);
      if(entry.isSymbolicLink())mergeFail('合并输入含未允许的链接。','MERGE_PATH_INVALID');
      if(entry.isDirectory())await walk(full,relative+'/');
      else if(entry.isFile()){const bytes=await safeBytes(directory,relative);files[relative]={sha256:hashBytes(bytes),size:bytes.length};}
      else mergeFail('合并输入含特殊文件。','MERGE_FILE_INVALID');
    }
  }
  await walk(directory);return files;
}
export async function copyTree(source,target,{exclude=new Set()}={}){
  await safeDirectory(source);await safeDirectory(target,{create:true});
  for(const[relative,row]of Object.entries(await tree(source,{exclude}))){
    const bytes=await safeBytes(source,relative);if(hashBytes(bytes)!==row.sha256)mergeFail('复制期间文件变化。','MERGE_BASELINE_CHANGED');
    const output=relativeFile(target,relative);await fs.mkdir(path.dirname(output),{recursive:true,mode:0o700});
    await fs.writeFile(output,bytes,{flag:'wx',mode:0o600});
    if(hashBytes(await safeBytes(target,relative))!==row.sha256)mergeFail('复制后摘要不一致。','MERGE_COPY_INVALID');
  }
}
export async function currentHash(root,relative){try{return hashBytes(await safeBytes(root,relative));}catch(error){if(error.code==='ENOENT')return null;throw error;}}
export async function writeExclusive(root,relative,bytes){
  const file=relativeFile(root,relative);await fs.mkdir(path.dirname(file),{recursive:true,mode:0o700});
  // 创建后仍核对父目录，避免用符号链接把新文件写到可信根之外。
  let parent=path.resolve(root);for(const part of relative.split('/').slice(0,-1)){parent=path.join(parent,part);await safeDirectory(parent);}
  await fs.writeFile(file,bytes,{flag:'wx',mode:0o600});
}
export async function writeVersionedFile(root,relative,bytes){
  const file=relativeFile(root,relative);await fs.mkdir(path.dirname(file),{recursive:true,mode:0o700});
  let parent=path.resolve(root);for(const part of relative.split('/').slice(0,-1)){parent=path.join(parent,part);await safeDirectory(parent);}
  if(await exists(file)){const stat=await fs.lstat(file);if(!stat.isFile()||stat.isSymbolicLink())mergeFail('目标文件类型变化。','MERGE_PATH_INVALID');}
  await atomicWrite(file,bytes);
}
export async function readJson(root,relative){return JSON.parse((await safeBytes(root,relative)).toString('utf8'));}
export async function assertFreeSpace(directory,required){
  const space=await fs.statfs(directory);if(space.bavail*space.bsize<required)mergeFail('磁盘空间不足以保存快照和独立候选网站。','MERGE_SPACE_LOW',507);
}
export const bytesOf=value=>Buffer.from(JSON.stringify(value,null,2)+'\n');
export const snapshotEntryId=()=>{const date=new Date();return date.toISOString().replace(/[-:TZ.]/g,'').slice(0,8)+'-'+date.toISOString().slice(11,19).replaceAll(':','')+'-'+String(date.getMilliseconds()).padStart(3,'0')+'-'+randomUUID().replaceAll('-','').slice(0,8);};
export const treeDigest=async directory=>digest(await tree(directory));
