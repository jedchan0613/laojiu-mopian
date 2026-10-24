import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fixture,actor,operation} from './helpers/merge-fixture.mjs';
import {executionFixture} from './helpers/merge-execution-fixture.mjs';
import {acquireDeploymentLock,createMergePublication,openAccountMergeConnection,assertAccountMergeService,assertLikeMergeService} from '../archive-merge-production.mjs';
import {createArchiveMergeExecution} from '../archive-merge-execution.mjs';
import {writeVersionedFile,treeDigest} from '../archive-merge-files.mjs';
import {createMergeUndo} from '../archive-merge-undo.mjs';
import {createServer} from 'node:http';
import {once} from 'node:events';
const linux={skip:process.platform!=='linux'?'实际flock及POSIX切站在Linux隔离目录验收':false};

test('账号及点赞能力缺失不能当作支持；仅允许回环健康检查',async t=>{
 const server=createServer((req,res)=>res.end(JSON.stringify({capabilities:{}})));server.listen(0,'127.0.0.1');await once(server,'listening');t.after(()=>new Promise(resolve=>{server.closeAllConnections();server.close(resolve);}));
 const url='http://127.0.0.1:'+server.address().port+'/healthz';
 await assert.rejects(assertAccountMergeService(url),{code:'MERGE_ACCOUNT_SERVICE_UNREADY'});await assert.rejects(assertLikeMergeService(url),{code:'MERGE_LIKE_SERVICE_UNREADY'});await assert.rejects(assertAccountMergeService('https://example.invalid/healthz'));
});
test('复用现有账号库连接及持久门禁，不创建另一份库',async t=>{
 const f=await executionFixture(t),bridge=await openAccountMergeConnection(path.join(f.privateRoot,'accounts'));
 try{
 const id=crypto.randomUUID();bridge.adapter.begin({mergeId:id,primaryId:f.ids[0],secondaryId:f.ids[1],expectedDigest:bridge.adapter.inspect(f.ids).digest});assert.throws(()=>f.store.archiveMerge.resolveForWrite(f.ids[0]),{code:'MERGE_FAVORITES_LOCKED'});bridge.adapter.rollback(id);
 }finally{bridge.close();}
});
test('既有文件原子替换保留权限及属主',linux,async t=>{const f=await fixture(t),file=path.join(f.privateRoot,'permission.json');await fs.writeFile(file,'old',{mode:0o640});const before=await fs.stat(file);await writeVersionedFile(f.privateRoot,'permission.json',Buffer.from('new'));const after=await fs.stat(file);assert.equal(after.mode&0o777,0o640);assert.equal(after.uid,before.uid);assert.equal(after.gid,before.gid);});
test('实际flock非阻塞互斥，释放后可再次取得',linux,async t=>{const f=await fixture(t),file=path.join(f.privateRoot,'deploy.lock');await fs.writeFile(file,'');const first=await acquireDeploymentLock(file);try{await assert.rejects(acquireDeploymentLock(file),{code:'MERGE_DEPLOYMENT_BUSY'});}finally{await first.release();}const second=await acquireDeploymentLock(file);await second.release();});

for(const phase of [null,'public-switch-intent','public-switched','verified'])test('生产发布事务 '+(phase??'完整提交')+'：当前应用、live及失败恢复一致',linux,async t=>{
 const f=await executionFixture(t),releases=path.join(f.root,'releases'),previous=path.join(releases,'previous'),live=path.join(releases,'live');await fs.mkdir(previous,{recursive:true});await fs.cp(path.join(f.site,'dist'),previous,{recursive:true});await fs.symlink('previous',live);
 const publication=createMergePublication({siteDirectory:f.site,releasesDirectory:releases,liveLink:live,applicationLink:f.root});let fired=false;
 const engine=createArchiveMergeExecution({...f.engineOptions,publication,buildCandidate:async({siteDirectory})=>{await fs.mkdir(path.join(siteDirectory,'dist'),{recursive:true});for(const file of ['index.html','404.html','robots.txt','sitemap.xml'])await fs.writeFile(path.join(siteDirectory,'dist',file),'synthetic');return'synthetic';},afterPhase:async value=>{if(value===phase&&!fired){fired=true;throw Error('synthetic live fault');}}});
 const pf=await f.planner.preflight(f.ids,actor),plan=await f.planner.save(f.payload(pf),actor,operation()),review=await engine.review({planId:plan.planId,planRevision:plan.planRevision},actor),before=await f.state(),liveBefore=await treeDigest(previous);
 const payload={planId:plan.planId,planRevision:plan.planRevision,reviewId:review.reviewId,confirmPrimaryId:f.ids[0],confirmations:Array(13).fill(true),publicationAuthorization:{publishMergedPrimary:true,withdrawSecondary:true}};
 if(phase){await assert.rejects(engine.execute(payload,actor,operation()));assert.equal(fired,true);assert.equal(await fs.readlink(live),'previous');assert.equal(await treeDigest(previous),liveBefore);assert.deepEqual(await f.state(),before);}
 else{const result=await engine.execute(payload,actor,operation());assert.equal(result.status,'committed');assert.notEqual(await fs.readlink(live),'previous');assert.equal(await treeDigest(await fs.realpath(live)),await treeDigest(path.join(f.site,'dist')));}
});

test('线上HTTP真实身份、整体合并/恢复、live切换、锁竞争与旧手工日志只读',linux,async t=>{
 const f=await fixture(t,{http:true,production:true}),initial=await fs.readlink(f.env.LJM_PUBLIC_LIVE_LINK);
 assert.equal((await f.get('/api/merge-capabilities')).body.online,true);
 const lock=await acquireDeploymentLock(f.env.LJM_MERGE_DEPLOY_LOCK);try{const r=await f.post('/api/merge-plan',{});assert.equal(r.status,423);}finally{await lock.release();}
 const pf=(await f.post('/api/merge-preflight',{itemIds:f.ids})).body,saved=await f.post('/api/merge-plan',f.payload(pf));assert.equal(saved.status,200,JSON.stringify(saved.body));const plan=saved.body.plan;
 assert.equal(plan.actor,'access:test@example.test');const review=await f.post('/api/merge-review',{planId:plan.planId,planRevision:plan.planRevision});assert.equal(review.status,200,JSON.stringify(review.body));
 const merged=await f.post('/api/merge',{planId:plan.planId,planRevision:plan.planRevision,reviewId:review.body.reviewId,confirmPrimaryId:f.ids[0],confirmations:Array(13).fill(true),publicationAuthorization:{publishMergedPrimary:true,withdrawSecondary:true}});assert.equal(merged.status,200,JSON.stringify(merged.body));assert.notEqual(await fs.readlink(f.env.LJM_PUBLIC_LIVE_LINK),initial);
 const reviewUndo=await f.post('/api/merge-undo-review',{mergeId:merged.body.merge.merge_id});assert.equal(reviewUndo.status,200,JSON.stringify(reviewUndo.body));
 const restored=await f.post('/api/merge-undo',{mergeId:merged.body.merge.merge_id,reviewId:reviewUndo.body.reviewId,mode:'republish',confirmPrimaryId:f.ids[0],confirmSecondaryId:f.ids[1],confirmations:Array(13).fill(true),publicationAuthorization:{restorePrimary:true,restoreSecondary:true,restoreReferences:true}});assert.equal(restored.status,200,JSON.stringify(restored.body));
 const legacyId=crypto.randomUUID();await fs.mkdir(path.join(f.directory,legacyId));await fs.writeFile(path.join(f.directory,legacyId,'manifest.json'),JSON.stringify({merge_id:legacyId,operator:'synthetic owner',status:'committed',primary_id:f.ids[0],secondary_id:f.ids[1],created_at:'2000-01-01',snapshots:[],private_path:'never expose'}));
 const legacy=(await f.get('/api/merges/'+legacyId)).body.merge;assert.equal(legacy.legacy,true);assert.ok(!JSON.stringify(legacy).includes('private_path'));assert.equal((await f.post('/api/merge-undo-review',{mergeId:legacyId})).body.code,'MERGE_LEGACY_READ_ONLY');
});
