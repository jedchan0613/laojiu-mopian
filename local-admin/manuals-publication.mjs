// 说明书线上发布适配：只引用既有公开版本回退，不复制旧网站到私密事务。
import fs from 'node:fs/promises';
import path from 'node:path';
import {randomUUID} from 'node:crypto';
import {createReleaseDeployer,readLiveRelease} from './release-deployer.mjs';
import {treeDigest} from './archive-merge-files.mjs';
import {digest,WriteSafetyError} from './write-coordinator.mjs';
import {pruneReleases} from '../shared/release-retention.mjs';

const fail=(message,code='MANUALS_PUBLICATION_UNCERTAIN')=>{throw new WriteSafetyError(message,409,code);};
export function createManualPublication({siteDirectory,releasesDirectory,liveLink,manualsRoot}){
  const capture=async()=>{
    const live=await readLiveRelease(releasesDirectory,liveLink);
    return {...live,site:await fs.realpath(siteDirectory),sha256:await treeDigest(live.resolvedTarget)};
  };
  const same=(a,b)=>digest(a)===digest(b);
  const verifyBefore=async log=>{if(!same(await capture(),log.publicationBefore))fail('公开版本或当前程序已变化，不能采用或覆盖本次目录。');};
  const publish=async(log,persist,{signal,validate,assertHeld})=>{
    assertHeld();await verifyBefore(log);
    const expected=await treeDigest(path.join(siteDirectory,'dist'));
    const deployer=createReleaseDeployer({sourceDirectory:path.join(siteDirectory,'dist'),releasesDirectory,liveLink,releaseLabel:'manuals',manualsRoot});
    await deployer.deploy({signal,retain:true,onPrepared:async({releaseName,releaseDirectory})=>{
      const sha256=await treeDigest(releaseDirectory);
      if(sha256!==expected)fail('候选公开副本与构建结果不一致，未切换。');
      log.publicationAfter={rawTarget:process.platform==='win32'?releaseDirectory:releaseName,resolvedTarget:releaseDirectory,releaseName,site:log.publicationBefore.site,sha256};
      await persist('public-switch-intent');await verifyBefore(log);await validate();assertHeld();
      const live=await readLiveRelease(releasesDirectory,liveLink);
      if(live.rawTarget!==log.publicationBefore.rawTarget||live.resolvedTarget!==log.publicationBefore.resolvedTarget||await fs.realpath(siteDirectory)!==log.publicationBefore.site)fail('切换前公开指针或程序发生变化，未采用候选。');
      assertHeld();
    }});
    await persist('public-switched');
  };
  const verify=async log=>{if(!log.publicationAfter||!same(await capture(),log.publicationAfter))fail('实际公开版本无法证明已采用本次目录，已停止继续。');};
  const rollback=async(log,assertHeld)=>{
    assertHeld();const current=await capture();
    if(same(current,log.publicationBefore))return;
    if(!log.publicationAfter||!same(current,log.publicationAfter))fail('公开网站已有不同版本，不能自动覆盖；前后记录已保留。','MANUALS_RECOVERY_CONFLICT');
    const old=log.publicationBefore;
    if(path.dirname(path.resolve(old.resolvedTarget))!==path.resolve(releasesDirectory)||await treeDigest(old.resolvedTarget)!==old.sha256||await fs.realpath(siteDirectory)!==old.site)fail('原公开版本或程序位置无法核对，不能盲目恢复。');
    const temporary=path.join(releasesDirectory,'.manuals-restore-'+randomUUID());
    assertHeld();await fs.symlink(old.rawTarget,temporary,process.platform==='win32'?'junction':'dir');
    try{assertHeld();await fs.rename(temporary,liveLink);}finally{await fs.unlink(temporary).catch(error=>{if(error.code!=='ENOENT')throw error;});}
    await verifyBefore(log);
  };
  const prune=log=>pruneReleases({releasesDirectory,liveLink,kind:'public',manualsRoot,protectedDirectories:[log.publicationBefore.resolvedTarget],apply:true});
  return {capture,publish,verify,verifyBefore,rollback,prune};
}
