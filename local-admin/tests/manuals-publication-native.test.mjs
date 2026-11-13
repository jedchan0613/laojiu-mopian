import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {randomUUID} from 'node:crypto';
import {createManualFixture} from './helpers/manuals-fixture.mjs';
import {createManualPublication} from '../manuals-publication.mjs';
import {readLiveRelease} from '../release-deployer.mjs';
import {pruneReleases} from '../../shared/release-retention.mjs';
import {createManualOnlineFixture} from './helpers/manuals-online-fixture.mjs';

async function nativeFixture(t){
  const f=await createManualFixture(t),releases=path.join(f.dir,'releases'),before=path.join(releases,'20261101-010101-admin-11111111'),live=path.join(releases,'live');
  await fs.mkdir(before,{recursive:true});await fs.writeFile(path.join(before,'index.html'),'OLD-PUBLIC');await fs.symlink(before,live,process.platform==='win32'?'junction':'dir');
  for(const name of ['404.html','robots.txt','sitemap.xml'])await fs.writeFile(path.join(f.dist,name),name);
  const publication=createManualPublication({siteDirectory:f.site,releasesDirectory:releases,liveLink:live,manualsRoot:f.root});return {...f,releases,before,live,publication};
}

test('真实发布器准备阶段会再次检查公开指针，变化时不覆盖其他版本',async t=>{
  const f=await nativeFixture(t),log={publicationBefore:await f.publication.capture()};
  const foreign=path.join(f.releases,'foreign');await fs.mkdir(foreign);await fs.writeFile(path.join(foreign,'index.html'),'FOREIGN');
  await assert.rejects(f.publication.publish(log,async status=>{log.status=status;},{assertHeld(){},validate:async()=>{await fs.unlink(f.live);await fs.symlink(foreign,f.live,process.platform==='win32'?'junction':'dir');}}),/指针|程序/);
  assert.equal((await readLiveRelease(f.releases,f.live)).resolvedTarget,foreign);assert.equal(await fs.readFile(path.join(foreign,'index.html'),'utf8'),'FOREIGN');
});

test('未决说明书事务和待核对回执阻止版本整理，明确完成后才按原规则清理',async t=>{
  const f=await nativeFixture(t);for(const day of ['02','03','04','05']){const dir=path.join(f.releases,`202611${day}-010101-admin-11111111`);await fs.mkdir(dir);await fs.writeFile(path.join(dir,'index.html'),'PUBLIC');}
  const job=path.join(f.root,'transactions',randomUUID());await fs.mkdir(job,{recursive:true});const manifest=path.join(job,'manifest.json');await fs.writeFile(manifest,JSON.stringify({version:2,status:'public-switch-intent'}));
  const options={releasesDirectory:f.releases,liveLink:f.live,kind:'public',manualsRoot:f.root,apply:true};await assert.rejects(pruneReleases(options),/待核对/);assert.equal((await fs.readdir(f.releases)).length,6);
  await fs.writeFile(manifest,JSON.stringify({version:2,status:'complete'}));const operations=path.join(path.dirname(f.root),'operations');await fs.mkdir(operations);const receipt=path.join(operations,randomUUID()+'.'+randomUUID()+'.json');await fs.writeFile(receipt,JSON.stringify({kind:'manuals-publish',status:'needs_review'}));await assert.rejects(pruneReleases(options),/待核对/);
  await fs.writeFile(receipt,JSON.stringify({kind:'manuals-publish',status:'succeeded'}));const result=await pruneReleases(options);assert.equal(result.removed.length,1);assert(await fs.stat(f.before));
});

test('真实发布器在Linux原子切站并能核对、回退至完整旧版本',{skip:process.platform!=='linux'&&'真实软链接原子替换需Linux；Windows不计通过'},async t=>{
  const f=await nativeFixture(t),log={publicationBefore:await f.publication.capture()};let checks=0;
  await f.publication.publish(log,async status=>{log.status=status;},{assertHeld(){checks++;},validate:async()=>{checks++;}});await f.publication.verify(log);assert(checks>=3);assert.equal(await fs.readFile(path.join(f.live,'index.html'),'utf8'),'PREVIOUS-SITE');
  await f.publication.rollback(log,()=>{});await f.publication.verifyBefore(log);assert.equal(await fs.readFile(path.join(f.live,'index.html'),'utf8'),'OLD-PUBLIC');
});

test('Linux真实online HTTP从人工确认到切站、重复请求、撤下及恢复草稿',{skip:process.platform!=='linux'&&'实际flock及POSIX切站留Linux隔离演练',timeout:45000},async t=>{
  const f=await createManualOnlineFixture(t);assert.equal((await f.save()).status,200);let current=(await f.get('/api/manuals')).body;
  const review=await f.post('/api/manuals/review',{expectedRevision:current.revision});assert.equal(review.status,200);assert.equal(review.body.issues.length,0);
  const ids={operationId:randomUUID(),stepId:randomUUID()},payload={expectedRevision:current.revision,review_id:review.body.review_id,confirmations:Array(5).fill(true)};
  const result=await f.post('/api/manuals/publish',payload,ids);assert.equal(result.status,200,JSON.stringify(result.body));assert.equal((await f.get('/api/operations/'+ids.operationId)).body.operations[0].status,'succeeded');assert.notEqual((await fs.realpath(f.live)),f.previousRelease);
  assert.equal((await f.post('/api/manuals/publish',payload,ids)).body.replayed,true);current=(await f.get('/api/manuals')).body;
  const withdraw=await f.post('/api/manuals/withdraw',{expectedRevision:current.revision,manual_key:'manual-test',reason:'合成在线撤下',confirmed:true});assert.equal(withdraw.status,200,JSON.stringify(withdraw.body));current=(await f.get('/api/manuals')).body;
  const pointer=await fs.realpath(f.live),history=current.history.find(row=>row.kind==='published-before-withdrawal');assert.equal((await f.post('/api/manuals/restore',{expectedRevision:current.revision,history_id:history.history_id})).status,200);assert.equal(await fs.realpath(f.live),pointer);assert((await f.get('/api/manuals')).body.state.draft);
});
