// 复用既有Linux部署锁、公开release目录和账号库；不新增服务或依赖。
import fs from 'node:fs/promises';
import path from 'node:path';
import {spawn} from 'node:child_process';
import {randomUUID} from 'node:crypto';
import {DatabaseSync} from 'node:sqlite';
import {createFavoriteMergeAdapter} from './archive-merge-favorites.mjs';
import {createReleaseDeployer,readLiveRelease} from './release-deployer.mjs';
import {treeDigest,mergeFail} from './archive-merge-files.mjs';
import {digest} from './write-coordinator.mjs';

export async function acquireDeploymentLock(file){
 if(process.platform!=='linux')mergeFail('线上发布锁必须在Linux服务器取得。','MERGE_PLATFORM_REQUIRED');
 const stat=await fs.lstat(file);if(!stat.isFile()||stat.isSymbolicLink())mergeFail('部署锁类型无效。');
 await fs.access(file,fs.constants.R_OK|fs.constants.W_OK);
 const child=spawn('flock',['--exclusive','--nonblock','--conflict-exit-code','75',file,process.execPath,'-e',"process.stdout.write('LOCKED\\n');process.stdin.resume();"],{stdio:['pipe','pipe','pipe'],windowsHide:true});
 let acquired=false,finished=false,output='',errors='';
 const ended=new Promise((resolve,reject)=>{child.once('error',reject);child.once('exit',(code,signal)=>{finished=true;resolve({code,signal});});});
 child.stderr.on('data',chunk=>errors+=chunk.toString());
 await new Promise((resolve,reject)=>{
  const timer=setTimeout(()=>{child.kill();reject(new Error('部署锁响应超时，未执行写入。'));},5000);
  child.stdout.on('data',chunk=>{output+=chunk.toString();if(output==='LOCKED\n'){acquired=true;clearTimeout(timer);resolve();}});
  ended.then(result=>{clearTimeout(timer);if(!acquired){if(result.code===75){try{mergeFail('网站正在部署或维护，请稍后重试。当前操作未执行。','MERGE_DEPLOYMENT_BUSY',423);}catch(error){reject(error);}}else reject(new Error('部署锁取得失败：'+errors.slice(0,200)));}},reject);
 });
 return{assertHeld(){if(!acquired||finished)mergeFail('部署锁已失效，提交停止。','MERGE_DEPLOYMENT_LOCK_LOST');},async release(){if(!finished)child.stdin.end();await ended;}};
}

export async function assertAccountMergeService(url){
 const target=new URL(url);if(target.hostname!=='127.0.0.1'||target.protocol!=='http:'||target.pathname!=='/healthz'||target.username||target.password)mergeFail('账户能力地址必须是本机健康检查。');
 const response=await fetch(target,{signal:AbortSignal.timeout(3000)}),body=await response.json();
 if(!response.ok||body.capabilities?.archiveMergeProtocol!==1)mergeFail('独立账户服务尚未支持收藏合并门禁，执行保持关闭。','MERGE_ACCOUNT_SERVICE_UNREADY',503);
}
export async function assertLikeMergeService(url){
 const target=new URL(url);if(target.hostname!=='127.0.0.1'||target.protocol!=='http:'||target.pathname!=='/healthz'||target.username||target.password)mergeFail('点赞能力地址必须是本机健康检查。');
 const response=await fetch(target,{signal:AbortSignal.timeout(3000)}),body=await response.json();
 if(!response.ok||body.capabilities?.fileGateProtocol!==1||body.capabilities?.sharedRead!==true)mergeFail('点赞服务尚未支持共享检查与门禁，执行保持关闭。','MERGE_LIKE_SERVICE_UNREADY',503);
}
export async function openAccountMergeConnection(directory){
 const file=path.join(directory,'accounts.db'),stat=await fs.lstat(file);if(!stat.isFile()||stat.isSymbolicLink())mergeFail('只能复用既有账号数据库。');
 const database=new DatabaseSync(file);database.exec('PRAGMA busy_timeout=5000; PRAGMA foreign_keys=ON;');
 try{for(const name of ['users','favorites','archive_merge_events','archive_merge_undo_events','archive_item_aliases'])if(!database.prepare("SELECT 1 FROM sqlite_master WHERE type='table' AND name=?").get(name))mergeFail('账号服务尚未准备合并协调表，不能自行新建档案库。');
  return{adapter:createFavoriteMergeAdapter(database),close(){database.close();}};
 }catch(error){database.close();throw error;}
}

export function createMergePublication({siteDirectory,releasesDirectory,liveLink,applicationLink}){
 const capture=async()=>{const live=await readLiveRelease(releasesDirectory,liveLink);return{...live,application:await fs.realpath(applicationLink),sha256:await treeDigest(live.resolvedTarget)};};
 const same=(a,b)=>digest(a)===digest(b);
 const publish=async(log,persist,signal)=>{
   if(!same(await capture(),log.publicationBefore))mergeFail('公开版本或当前应用已变化，不能切站。','MERGE_PUBLICATION_CHANGED');
   const deployer=createReleaseDeployer({sourceDirectory:path.join(siteDirectory,'dist'),releasesDirectory,liveLink,releaseLabel:'merge'});
   await deployer.deploy({signal,retain:true,onPrepared:async({releaseName,releaseDirectory})=>{
     const after={rawTarget:releaseName,resolvedTarget:releaseDirectory,releaseName,application:log.publicationBefore.application,sha256:await treeDigest(releaseDirectory)};
     if(after.sha256!==log.distAfter||!same(await capture(),log.publicationBefore))mergeFail('候选公开副本或当前版本不一致，未切换。','MERGE_PUBLICATION_CHANGED');
     log.publication={before:log.publicationBefore,after};await persist('public-switch-intent');
   }});
   log.publication.switched=true;await persist('public-switched');
 };
 const verify=async log=>{if(!log.publication||!same(await capture(),log.publication.after))mergeFail('实际公开版本无法证明已切换。','MERGE_PUBLICATION_UNPROVEN');};
 const rollback=async log=>{
   if(!log.publication)return;
   const current=await capture();if(same(current,log.publication.before))return;
   if(!same(current,log.publication.after))mergeFail('公开live已有后续版本，不能覆盖。','MERGE_PUBLICATION_RECOVERY_CONFLICT');
   const before=log.publication.before;if(await treeDigest(before.resolvedTarget)!==before.sha256||await fs.realpath(applicationLink)!==before.application)mergeFail('原公开版本或应用已变化，不能盲目恢复。');
   const temporary=path.join(releasesDirectory,'.merge-restore-'+randomUUID());
   await fs.symlink(before.rawTarget,temporary,'dir');try{await fs.rename(temporary,liveLink);}finally{await fs.unlink(temporary).catch(error=>{if(error.code!=='ENOENT')throw error;});}
   if(!same(await capture(),before))mergeFail('公开版本恢复后仍不一致。');
 };
 return{capture,publish,verify,rollback};
}
