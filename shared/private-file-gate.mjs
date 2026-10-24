// 合作式短时文件写入门禁；不等待、不抢占存活进程，也不自动清理未知锁。
import fs from 'node:fs/promises';
import path from 'node:path';
import {randomUUID} from 'node:crypto';
const tokenPattern=/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i;
const blocked=message=>{const error=new Error(message);error.statusCode=423;error.status=423;error.code='PRIVATE_FILE_GATE_BUSY';throw error;};
const fileGate=file=>path.resolve(file)+'.write-lock';
async function ownerFor(file){
 const folder=fileGate(file),stat=await fs.lstat(folder);if(!stat.isDirectory()||stat.isSymbolicLink())blocked('写入门禁类型异常，已停止。');
 const owner=path.join(folder,'owner.json'),info=await fs.lstat(owner);if(!info.isFile()||info.isSymbolicLink()||info.size>4096)blocked('写入门禁归属无法核实。');
 const data=JSON.parse(await fs.readFile(owner,'utf8'));if(!tokenPattern.test(data.token??'')||!Number.isSafeInteger(data.pid)||data.pid<1)blocked('写入门禁归属无法核实。');return data;
}
export async function acquirePrivateFileGate(file,{token=randomUUID(),role='writer',mergeId=null}={}){
 if(!path.isAbsolute(file)||!tokenPattern.test(token))blocked('写入门禁路径或编号无效。');
 const folder=fileGate(file);await fs.mkdir(path.dirname(folder),{recursive:true,mode:0o700});
 if((await fs.lstat(path.dirname(folder))).isSymbolicLink())blocked('私密写入目录不能是链接。');
 try{await fs.mkdir(folder,{mode:0o700});}catch(error){if(error.code==='EEXIST')blocked('资料正在完成合并或其他写入，请稍后重试。');throw error;}
 const owner=path.join(folder,'owner.json'),data={token,pid:process.pid,role,mergeId,at:new Date().toISOString()};
 let created=false;
 try{const handle=await fs.open(owner,'wx',0o600);created=true;try{await handle.writeFile(JSON.stringify(data)+'\n');await handle.sync();}finally{await handle.close();}}
 catch(error){if(created)await fs.unlink(owner).catch(()=>{});await fs.rmdir(folder).catch(()=>{});throw error;}
 return{...data,release:()=>releasePrivateFileGate(file,token)};
}
export async function releasePrivateFileGate(file,token){
 let owner;try{owner=await ownerFor(file);}catch(error){if(error.code==='ENOENT'){const remaining=await fs.lstat(fileGate(file)).catch(value=>{if(value.code==='ENOENT')return null;throw value;});if(remaining)blocked('写入门禁仍存在但归属不明，不能自动解除。');return{released:false};}throw error;}
 if(owner.token!==token)return{released:false,otherOwner:true};
 if(owner.pid!==process.pid){try{process.kill(owner.pid,0);blocked('写入门禁仍属于存活进程，不能解除。');}catch(error){if(error.code!=='ESRCH')throw error;}}
 const checked=await ownerFor(file);if(checked.token!==token||checked.pid!==owner.pid)blocked('写入门禁已被替换，不能解除。');
 await fs.unlink(path.join(fileGate(file),'owner.json'));await fs.rmdir(fileGate(file));return{released:true};
}
