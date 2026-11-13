import fs from 'node:fs/promises';
import path from 'node:path';
import {randomUUID} from 'node:crypto';
import {createManualFixture} from './manuals-fixture.mjs';
import {createManualStore} from '../../manuals.mjs';
import {atomicWrite,digest,WriteSafetyError} from '../../write-coordinator.mjs';
import {treeDigest} from '../../archive-merge-files.mjs';

// 文件指针是发布器的测试替身，验证事务与故障处理；不将它计作Linux原子切站实测。
export async function createManualPublicationFixture(t){
  const f=await createManualFixture(t),releases=path.join(f.dir,'public-releases'),pointer=path.join(f.dir,'public-pointer');
  const previous=path.join(releases,'previous');await fs.mkdir(previous,{recursive:true});await fs.writeFile(path.join(previous,'index.html'),'PREVIOUS-PUBLIC');await atomicWrite(pointer,'previous');
  let archives=[f.archive],builds=0,held=true,failure='',buildHook=null,preparedHook=null,afterSwitchHook=null;
  const capture=async()=>{const releaseName=await fs.readFile(pointer,'utf8');if(path.basename(releaseName)!==releaseName)throw new Error('fixture pointer invalid');const resolvedTarget=path.join(releases,releaseName);return {rawTarget:releaseName,resolvedTarget,releaseName,site:await fs.realpath(f.site),sha256:await treeDigest(resolvedTarget)};};
  const same=(a,b)=>digest(a)===digest(b),fail=point=>{if(failure===point)throw new Error('SYNTHETIC-'+point);};
  const assertHeld=()=>{if(!held)throw new WriteSafetyError('SYNTHETIC-LOCK-LOST',409,'MANUALS_LOCK_LOST');};
  const publication={capture,async publish(log,persist,options){
    assertHeld();fail('candidate');const releaseName='candidate-'+randomUUID(),target=path.join(releases,releaseName);await fs.cp(f.dist,target,{recursive:true});
    log.publicationAfter={rawTarget:releaseName,resolvedTarget:target,releaseName,site:log.publicationBefore.site,sha256:await treeDigest(target)};
    if(preparedHook)await preparedHook();await options.validate();assertHeld();await persist('public-switch-intent');fail('before-switch');
    await atomicWrite(pointer,releaseName);await persist('public-switched');if(afterSwitchHook)await afterSwitchHook();fail('after-switch');
  },async verify(log){fail('verify');if(!same(await capture(),log.publicationAfter))throw new Error('SYNTHETIC-AFTER-MISMATCH');},async verifyBefore(log){if(!same(await capture(),log.publicationBefore))throw new Error('SYNTHETIC-BEFORE-MISMATCH');},async rollback(log){
    assertHeld();fail('rollback');const actual=await capture();if(same(actual,log.publicationBefore))return;if(!same(actual,log.publicationAfter))throw new Error('SYNTHETIC-FOREIGN-LIVE');await atomicWrite(pointer,log.publicationBefore.rawTarget);await publication.verifyBefore(log);
  },async prune(){return {fixtureOnly:true};}};
  const store=createManualStore({root:f.root,siteDirectory:f.site,readArchives:async()=>structuredClone(archives),publication,requireInitialization:true,guardCatalog:async()=>failure==='guard'?[{where:'fixture',message:'SYNTHETIC-STOP'}]:[],build:async()=>{
    builds++;for(const [file,text] of [['index.html','BUILT-'+builds],['404.html','not found'],['robots.txt','robots'],['sitemap.xml','map']])await fs.writeFile(path.join(f.dist,file),text);
    if(buildHook)await buildHook();fail('build');return 'SYNTHETIC-BUILD-'+builds;
  }});
  const context=(extra={})=>({operationId:randomUUID(),stepId:randomUUID(),actor:'admin@example.test',assertDeploymentLock:assertHeld,...extra});
  const save=async(catalog=f.readerCatalog())=>{const current=await store.bootstrap();return store.save({catalog,expectedRevision:current.revision,initializeEmpty:true,expectedPublicRevision:current.readiness.publicRevision},context());};
  const prepare=async ctx=>{const current=await store.bootstrap();return {...await store.prepare({expectedRevision:current.revision},ctx),expectedRevision:current.revision};};
  const publish=async(ctx=context())=>{const review=await prepare(ctx);return store.publish({expectedRevision:review.expectedRevision,review_id:review.review_id,confirmations:Array(5).fill(true)},ctx);};
  return {...f,store,publication,context,save,prepare,publish,releases,pointer,previous,builds:()=>builds,setArchives:value=>archives=value,fail:value=>failure=value,onBuild:value=>buildHook=value,onPrepared:value=>preparedHook=value,onAfterSwitch:value=>afterSwitchHook=value,loseLock:()=>held=false,foreignLive:async()=>{const target=path.join(releases,'foreign');await fs.mkdir(target,{recursive:true});await fs.writeFile(path.join(target,'index.html'),'FOREIGN-PUBLIC');await atomicWrite(pointer,'foreign');}};
}
