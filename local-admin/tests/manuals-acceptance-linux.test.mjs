import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {randomUUID} from 'node:crypto';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {fileURLToPath} from 'node:url';
import {createManualFixture} from './helpers/manuals-fixture.mjs';
import {createManualOnlineFixture} from './helpers/manuals-online-fixture.mjs';
import {createManualStore} from '../manuals.mjs';
import {createManualPublication} from '../manuals-publication.mjs';
import {acquireDeploymentLock} from '../archive-merge-production.mjs';
import {treeDigest} from '../archive-merge-files.mjs';
import {pruneReleases} from '../../shared/release-retention.mjs';

const linux={skip:process.platform!=='linux'?'7.4必须在真实Linux隔离目录验证，Windows不计通过':false,timeout:30000};
const until=async(check)=>{for(let i=0;i<600;i++){if(await check())return;await new Promise(resolve=>setTimeout(resolve,15));}throw new Error('SYNTHETIC-WAIT-TIMEOUT');};
const exists=async file=>Boolean(await fs.stat(file).catch(()=>null));
async function reviewed(f){
  assert.equal((await f.save()).status,200);const state=(await f.get('/api/manuals')).body,review=await f.post('/api/manuals/review',{expectedRevision:state.revision});assert.equal(review.status,200,JSON.stringify(review.body));
  return {expectedRevision:state.revision,review_id:review.body.review_id,confirmations:Array(5).fill(true)};
}

test('Linux合并关闭时说明书和原档案写入仍受同一flock保护',linux,async t=>{
  const f=await createManualOnlineFixture(t),before=await fs.readFile(path.join(f.archiveDirectory,f.id+'.json'));
  assert.notEqual(f.env.LJM_MERGE_ONLINE_ENABLED,'true');const lock=await acquireDeploymentLock(f.env.LJM_MERGE_DEPLOY_LOCK);
  try{
    assert.equal((await f.save()).status,423);
    const rejected=await f.post('/api/save-draft',{record:f.archive,isNew:false,expectedRevision:'a'.repeat(64)});assert.equal(rejected.status,423,JSON.stringify(rejected.body));
    assert.equal((await f.get('/api/manuals',{signal:AbortSignal.timeout(1500)})).status,200);
  }finally{await lock.release();}
  assert.equal((await f.save()).status,200);assert.deepEqual(await fs.readFile(path.join(f.archiveDirectory,f.id+'.json')),before);assert.equal(await fs.readlink(f.live),f.previousRelease);
});

test('Linux构建中重新进入不被长队列阻塞，取消后旧公开版及原草稿保留',linux,async t=>{
  const f=await createManualOnlineFixture(t),payload=await reviewed(f),before=await fs.readFile(path.join(f.root,'state.json'));
  await fs.writeFile(path.join(f.site,'build-hold'),'hold');const ids={operationId:randomUUID(),stepId:randomUUID()},posting=f.post('/api/manuals/publish',payload,ids);
  await until(()=>exists(path.join(f.site,'build-waiting')));
  const boot=await f.get('/api/manuals',{signal:AbortSignal.timeout(1500)});assert.equal(boot.status,200);assert.equal(boot.body.readiness.status,'busy');assert.equal(boot.body.activeOperations[0].operationId,ids.operationId);
  const cancelling=f.post('/api/cancel-operation',{operationId:ids.operationId});await new Promise(resolve=>setTimeout(resolve,100));await fs.writeFile(path.join(f.site,'build-release'),'release');
  const [result,cancelled]=await Promise.all([posting,cancelling]);assert.equal(result.body.operation.status,'cancelled',JSON.stringify(result.body));assert.equal(cancelled.body.cancelled,true);
  assert.equal(await fs.realpath(f.live),f.previousRelease);assert.deepEqual(await fs.readFile(path.join(f.root,'state.json')),before);assert.equal((await f.get('/api/manuals')).body.pending.length,0);
});

test('Linux真实进程中断后不自动续发，重启、关闭开关及代码同步不能绕过停写',linux,async t=>{
  const f=await createManualOnlineFixture(t),payload=await reviewed(f),before=await fs.readFile(path.join(f.root,'state.json')),archiveInput=await fs.readFile(path.join(f.site,'src/data/archive.ts'));
  await fs.writeFile(path.join(f.site,'build-hold'),'hold');const ids={operationId:randomUUID(),stepId:randomUUID()};
  const posting=f.post('/api/manuals/publish',payload,ids).catch(error=>({error:error.message}));await until(()=>exists(path.join(f.site,'build-waiting')));
  await f.crash();await posting;await fs.writeFile(path.join(f.site,'build-release'),'release');await until(()=>exists(path.join(f.site,'build-finished')));
  await f.restart(f.site);const current=(await f.get('/api/manuals')).body;assert.equal(current.readiness.status,'blocked');assert.equal(current.pending.length,1);assert.equal((await f.get('/api/operations/'+ids.operationId)).body.operations[0].status,'needs_review');
  assert.equal((await f.save()).status,409);assert.equal((await f.post('/api/manuals/resolve-operation',{...ids,confirmed:true})).body.state,'needs-review');
  await assert.rejects(pruneReleases({releasesDirectory:f.releases,liveLink:f.live,kind:'public',manualsRoot:f.root,apply:true}),/待核对/);
  await f.stop();await assert.rejects(promisify(execFile)(process.execPath,[fileURLToPath(new URL('../server.mjs',import.meta.url)),'--sync-site-data'],{env:{...f.env,LJM_MANUALS_ONLINE_ENABLED:'false'},windowsHide:true}),error=>/OPERATION_NEEDS_REVIEW|MANUALS_TRANSACTION_UNCERTAIN/.test(error.stderr));
  assert.deepEqual(await fs.readFile(path.join(f.root,'state.json')),before);assert.deepEqual(await fs.readFile(path.join(f.site,'src/data/archive.ts')),archiveInput);assert.equal(await fs.realpath(f.live),f.previousRelease);assert.equal(await fs.readFile(path.join(f.site,'build-count'),'utf8'),'1');
});

test('Linux非空正式目录升级后保留草稿与历史，只从正式状态同步公开输入',linux,async t=>{
  const f=await createManualOnlineFixture(t),payload=await reviewed(f);assert.equal((await f.post('/api/manuals/publish',payload)).status,200);
  const liveBefore=await fs.realpath(f.live),draft=f.readerCatalog();draft.documents[0].edition_display='PRIVATE-UNPUBLISHED-UPGRADE-EDITION';assert.equal((await f.save(draft)).status,200);
  const before=(await f.get('/api/manuals')).body,candidate=path.join(f.dir,'candidate-site');await f.stop();await fs.cp(f.site,candidate,{recursive:true});await f.restart(candidate);
  const after=(await f.get('/api/manuals')).body;assert.equal(after.revision,before.revision);assert.equal(after.state.initialization.actor,f.email);assert.equal(after.state.published.documents[0].edition_display,'测试第一版');assert.equal(after.state.draft.documents[0].edition_display,'PRIVATE-UNPUBLISHED-UPGRADE-EDITION');assert.equal(after.history.length,before.history.length);assert.equal(after.readiness.status,'ready');
  await f.stop();await promisify(execFile)(process.execPath,[fileURLToPath(new URL('../server.mjs',import.meta.url)),'--sync-site-data'],{env:{...f.env,LJM_MANUALS_ONLINE_ENABLED:'false'},windowsHide:true});
  const source=await fs.readFile(path.join(candidate,'src/data/generated/manuals-catalog.json'),'utf8');assert(!source.includes('PRIVATE-'));assert.equal(JSON.parse(source).documents[0].edition_display,'测试第一版');assert.equal(await fs.realpath(f.live),liveBefore);
});

async function transactionFixture(t,fault){
  const f=await createManualFixture(t),releases=path.join(f.dir,'native-releases'),before=path.join(releases,'previous'),live=path.join(releases,'live');
  await fs.mkdir(before,{recursive:true});await fs.writeFile(path.join(before,'index.html'),'PREVIOUS-IMMUTABLE-PUBLIC');await fs.symlink('previous',live);
  const native=createManualPublication({siteDirectory:f.site,releasesDirectory:releases,liveLink:live,manualsRoot:f.root});
  const publication={...native,publish:async(log,persist,context)=>native.publish(log,async status=>{await persist(status);if(status===fault)throw new Error('SYNTHETIC-'+fault);},{...context,validate:async()=>{if(fault==='changed-image')await fs.appendFile(f.image,'SYNTHETIC-CHANGED');await context.validate();}})};
  const store=createManualStore({root:f.root,siteDirectory:f.site,readArchives:async()=>[f.archive],publication,build:async()=>{for(const name of ['index.html','404.html','robots.txt','sitemap.xml'])await fs.writeFile(path.join(f.dist,name),'CANDIDATE-'+name);return 'SYNTHETIC';}});
  const lockFile=path.join(f.dir,'native.lock');await fs.writeFile(lockFile,'');const lock=await acquireDeploymentLock(lockFile);t.after(()=>lock.release());
  const context={actor:'access:synthetic@example.test',operationId:randomUUID(),stepId:randomUUID(),assertDeploymentLock:()=>lock.assertHeld()};
  await store.save({expectedRevision:(await store.bootstrap()).revision,catalog:f.readerCatalog()},context);
  const state=await store.bootstrap(),review=await store.prepare({expectedRevision:state.revision},context);
  return {...f,store,publication,before,live,context,payload:{expectedRevision:state.revision,review_id:review.review_id,confirmations:Array(5).fill(true)}};
}

for(const phase of ['public-switch-intent','public-switched','changed-image'])test('Linux原生目录事务故障回退：'+phase,linux,async t=>{
  const f=await transactionFixture(t,phase),before=await fs.readFile(path.join(f.root,'state.json')),oldTree=await treeDigest(f.before);
  await assert.rejects(f.store.publish(f.payload,f.context),error=>error.code==='MANUALS_BUILD_FAILED');assert.equal(await fs.readlink(f.live),'previous');assert.equal(await treeDigest(f.before),oldTree);assert.deepEqual(await fs.readFile(path.join(f.root,'state.json')),before);assert.equal((await f.store.bootstrap()).pending.length,0);
  for(const job of await fs.readdir(path.join(f.root,'transactions')))await assert.rejects(fs.access(path.join(f.root,'transactions',job,'previous-dist')));
});

test('Linux原生切换后状态写入失败恢复旧公开链接，原草稿未丢失',linux,async t=>{
  const f=await transactionFixture(t),stateFile=path.join(f.root,'state.json'),before=await fs.readFile(stateFile),rename=fs.rename;let injected=false;
  const mock=t.mock.method(fs,'rename',async(from,to)=>{if(to===stateFile&&!injected&&JSON.parse(await fs.readFile(from)).last_publication){injected=true;throw new Error('SYNTHETIC-STATE-EIO');}return rename(from,to);});
  try{await assert.rejects(f.store.publish(f.payload,f.context),error=>error.code==='MANUALS_BUILD_FAILED');}finally{mock.mock.restore();}
  assert(injected);assert.equal(await fs.readlink(f.live),'previous');assert.deepEqual(await fs.readFile(stateFile),before);
});
