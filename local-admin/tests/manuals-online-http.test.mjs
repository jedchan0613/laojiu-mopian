import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {randomUUID} from 'node:crypto';
import {createManualOnlineFixture} from './helpers/manuals-online-fixture.mjs';
import {manualFixtureCatalog,png} from './helpers/manuals-fixture.mjs';
import {manualPublicationInput} from '../manuals.mjs';

test('说明书异常核对仅建立未开始屏障，不允许迟到保存或跨类型核对',{timeout:30000},async t=>{
  const f=await createManualOnlineFixture(t),ids={operationId:randomUUID(),stepId:randomUUID()};
  assert.equal((await f.post('/api/manuals/resolve-operation',{...ids})).status,428);
  const resolved=await f.post('/api/manuals/resolve-operation',{...ids,confirmed:true});assert.equal(resolved.status,200);assert.equal(resolved.body.state,'not-started');
  const state=(await f.get('/api/manuals')).body;
  const late=await f.post('/api/manuals/save',{catalog:manualFixtureCatalog(),expectedRevision:state.revision,initializeEmpty:true,expectedPublicRevision:state.readiness.publicRevision},ids);assert.equal(late.status,409);assert.equal(late.body.code,'OPERATION_MISMATCH');await assert.rejects(fs.access(path.join(f.root,'state.json')));
  const receipt=(await f.get('/api/operations/'+ids.operationId)).body.operations[0];assert.equal(receipt.status,'cancelled');assert.equal(receipt.errorCode,'MANUALS_NOT_STARTED');
});

test('线上维护关闭时隐藏能力，直达有中文页面，路径变体与私密路径不能绕过',{timeout:30000},async t=>{
  const f=await createManualOnlineFixture(t,{enabled:false});
  const health=(await f.get('/healthz')).body;
  assert.equal(health.capabilities.manualsDraftMaintenanceVersion,0);assert.equal(health.capabilities.manualsMaintenanceVersion,0);
  const page=await f.get('/admin/manuals.html');assert.equal(page.status,404);assert.match(page.headers.get('content-type'),/text\/html/);assert.match(page.body,/返回档案管理/);
  for(const route of ['/api/manuals','/admin/manuals-preview.html','/admin/manuals.js','/admin/%6danuals.html','/ADMIN/MANUALS.HTML','/api/%6danuals','/API/MANUALS','/api%2fmanuals%2fsave'])assert.equal((await f.get(route)).status,404,route);
  assert.equal((await f.get('/admin/manuals.html',{headers:{'cf-access-jwt-assertion':''}})).status,403);
  for(const route of ['/manuals/state.json','/local-admin/manuals/state.json','/admin/../manuals/state.json'])assert.equal((await f.get(route)).status,404);
  await assert.rejects(fs.access(path.join(f.root,'state.json')));
});

test('开启草稿能力仍逐项核验Access身份，普通账号、过期及伪造身份不可读写',{timeout:30000},async t=>{
  const f=await createManualOnlineFixture(t);
  const bad=['', 'invalid',f.token({email:'visitor@example.test'}),f.token({aud:['other']}),f.token({exp:Math.floor(Date.now()/1000)-120}),f.token({iss:'https://other.cloudflareaccess.com'})];
  const valid=f.token();bad.push(valid.slice(0,-4)+'AAAA');
  for(const value of bad){
    const headers={'cf-access-jwt-assertion':value,cookie:'ljm_session=SYNTHETIC-VISITOR'};
    for(const route of ['/admin/manuals.html','/api/manuals','/api/manuals/preview-image?manual=manual-test&revision=x&page=1'])assert.equal((await f.get(route,{headers})).status,403,route);
    assert.equal((await f.post('/api/manuals/save',{},undefined,headers)).status,403);
  }
  await assert.rejects(fs.access(path.join(f.root,'state.json')));
});

test('草稿、完整工作台和split能力按实际平台一致，专用审核仍关闭',{timeout:30000},async t=>{
  const f=await createManualOnlineFixture(t),caps=(await f.get('/healthz')).body.capabilities;
  assert.equal(caps.manualsDraftMaintenanceVersion,1);assert.equal(caps.manualsMaintenanceVersion,process.platform==='linux'?1:0);assert.equal(caps.manualReviewVersion,0);assert.equal(caps.manualPdfHandoffVersion,0);
  for(const route of ['/api/bootstrap','/api/bootstrap?format=split-v1','/api/admin/submissions']){
    const result=await f.get(route);assert.equal(result.status,200,JSON.stringify(result.body));
    for(const key of ['manualsDraftMaintenanceVersion','manualsMaintenanceVersion','manualReviewVersion','manualPdfHandoffVersion'])assert.equal(result.body.capabilities[key],caps[key]);
  }
  const current=(await f.get('/api/manuals')).body;assert.equal(current.context.publicSiteUrl,f.publicOrigin);assert.equal(current.context.publicationEnabled,process.platform==='linux');
  if(process.platform!=='linux')for(const action of ['review','publish','withdraw','restore']){const result=await f.post('/api/manuals/'+action,{});assert.equal(result.status,409);assert.equal(result.body.code,'MANUALS_PUBLICATION_UNAVAILABLE');}
  assert.equal((await f.get('/admin/manual-review.html')).status,404);
  await assert.rejects(fs.access(path.join(f.site,'build-count')));
  assert.equal(await fs.readFile(path.join(f.live,'index.html'),'utf8'),'PREVIOUS-PUBLIC-SITE');
});

test('首次保存须确认空基线，私密初始化身份由服务端记录，重复与旧请求不会覆盖',{timeout:30000},async t=>{
  const f=await createManualOnlineFixture(t),initial=(await f.get('/api/manuals')).body;
  assert.equal(initial.readiness.status,'needs-initialization');await assert.rejects(fs.access(f.root));
  const payload={expectedRevision:initial.revision,catalog:manualFixtureCatalog()};
  assert.equal((await f.post('/api/manuals/save',payload)).status,428);
  assert.equal((await f.post('/api/manuals/save',{...payload,initializeEmpty:true,expectedPublicRevision:'0'.repeat(64)})).status,428);
  const ids={operationId:randomUUID(),stepId:randomUUID()};Object.assign(payload,{initializeEmpty:true,expectedPublicRevision:initial.readiness.publicRevision,actor:'forged@example.test'});
  const saved=await f.post('/api/manuals/save',payload,ids);assert.equal(saved.status,200,JSON.stringify(saved.body));
  const state=JSON.parse(await fs.readFile(path.join(f.root,'state.json')));assert.equal(state.initialization.actor,f.email);assert.equal(state.published.documents.length,0);assert.equal(state.draft.documents.length,1);
  const replay=await f.post('/api/manuals/save',payload,ids);assert.equal(replay.status,200);assert.equal(replay.body.replayed,true);
  const stale=await f.post('/api/manuals/save',payload);assert.equal(stale.status,409);assert.equal(stale.body.code,'MANUALS_REVISION_CONFLICT');
  const current=(await f.get('/api/manuals')).body;assert.equal(current.revision,saved.body.revision);assert.equal(current.readiness.status,'ready');assert.equal(current.history.length,0);
  await assert.rejects(fs.access(f.source));assert.equal(await fs.readFile(path.join(f.live,'index.html'),'utf8'),'PREVIOUS-PUBLIC-SITE');
});

test('开关切换并重启后工作台能力缓存失效，不沿用旧菜单状态',{timeout:30000},async t=>{
  const f=await createManualOnlineFixture(t),before=await f.get('/api/bootstrap?format=split-v1');
  assert.equal(before.body.capabilities.manualsDraftMaintenanceVersion,1);
  f.env.LJM_MANUALS_ONLINE_ENABLED='false';await f.restart();
  const after=await f.get('/api/bootstrap?format=split-v1',{headers:{'if-none-match':before.headers.get('etag')}});
  assert.equal(after.status,200);assert.notEqual(after.headers.get('etag'),before.headers.get('etag'));assert.equal(after.body.capabilities.manualsDraftMaintenanceVersion,0);
  assert.equal((await f.get('/api/manuals')).status,404);
});

test('品牌型号与来源缺项可暂存，重启并切换程序目录后草稿和私密历史保留',{timeout:30000},async t=>{
  const f=await createManualOnlineFixture(t),catalog=manualFixtureCatalog();catalog.models[0].model_text='';catalog.brands[0].aliases.push('别名二');
  catalog.documents[0].official_sources.push({...catalog.documents[0].official_sources[0],name:'第二来源'});
  let saved=await f.save(catalog);assert.equal(saved.status,200,JSON.stringify(saved.body));
  catalog.models[0].model_text='TEST-200';saved=await f.save(catalog,{actor:'forged'});assert.equal(saved.status,200);
  const before=(await f.get('/api/manuals')).body;assert.equal(before.history.length,1);
  const record=JSON.parse(await fs.readFile(path.join(f.root,'history',before.history[0].history_id+'.json')));assert.equal(record.actor,f.email);
  const site2=path.join(f.dir,'application-v2','site');await fs.cp(f.site,site2,{recursive:true});await f.restart(site2);
  const after=(await f.get('/api/manuals')).body;assert.equal(after.revision,before.revision);assert.deepEqual(after.state,before.state);assert.equal(after.history.length,1);assert.equal(after.readiness.status,'ready');
  assert.equal(after.state.draft.brands[0].aliases.length,2);assert.equal(after.state.draft.documents[0].official_sources.length,2);
  await assert.rejects(fs.access(path.join(site2,'src/data/generated/manuals-catalog.json')));
});

test('已有公开条目却无私密记录时只读，直达保存及确认空目录也不能覆盖',{timeout:30000},async t=>{
  const f=await createManualOnlineFixture(t),raw=JSON.stringify(manualPublicationInput(manualFixtureCatalog()));
  await fs.mkdir(path.dirname(f.source),{recursive:true});await fs.writeFile(f.source,raw);
  const current=(await f.get('/api/manuals')).body;assert.equal(current.readiness.code,'MANUALS_BASELINE_REQUIRED');assert.equal(current.readiness.status,'blocked');
  const result=await f.save(manualFixtureCatalog(),{initializeEmpty:true,expectedPublicRevision:'0'.repeat(64)});assert.equal(result.status,409);
  await f.store.sync();assert.equal(await fs.readFile(f.source,'utf8'),raw);await assert.rejects(fs.access(path.join(f.root,'state.json')));
});

test('空基线读取后出现既有公开目录，首次保存重新核对而非沿用旧确认',{timeout:30000},async t=>{
  const f=await createManualOnlineFixture(t),initial=(await f.get('/api/manuals')).body;
  await fs.mkdir(path.dirname(f.source),{recursive:true});const raw=JSON.stringify(manualPublicationInput(manualFixtureCatalog()));await fs.writeFile(f.source,raw);
  const result=await f.post('/api/manuals/save',{catalog:manualFixtureCatalog(),expectedRevision:initial.revision,initializeEmpty:true,expectedPublicRevision:initial.readiness.publicRevision});
  assert.equal(result.status,409);assert.equal(result.body.code,'MANUALS_BASELINE_REQUIRED');assert.equal(await fs.readFile(f.source,'utf8'),raw);
});

test('状态损坏、基线冲突及中断事务分别阻止保存和同步，不清空公开资料',{timeout:30000},async t=>{
  const f=await createManualOnlineFixture(t);assert.equal((await f.save()).status,200);
  const stateFile=path.join(f.root,'state.json'),before=await fs.readFile(stateFile);
  await fs.writeFile(stateFile,'{BROKEN-PRIVATE-STATE');let current=(await f.get('/api/manuals')).body;assert.equal(current.readiness.code,'MANUALS_STATE_INVALID');assert.equal((await f.save()).status,409);
  assert.equal(await fs.readFile(stateFile,'utf8'),'{BROKEN-PRIVATE-STATE');await fs.writeFile(stateFile,before);
  await fs.mkdir(path.dirname(f.source),{recursive:true});const raw=JSON.stringify(manualPublicationInput(manualFixtureCatalog()));await fs.writeFile(f.source,raw);
  current=(await f.get('/api/manuals')).body;assert.equal(current.readiness.code,'MANUALS_BASELINE_MISMATCH');assert.equal((await f.save()).status,409);await assert.rejects(f.store.sync(),error=>error.code==='MANUALS_BASELINE_MISMATCH');assert.equal(await fs.readFile(f.source,'utf8'),raw);
  const job=path.join(f.root,'transactions',randomUUID());await fs.mkdir(job,{recursive:true});await fs.writeFile(path.join(job,'manifest.json'),JSON.stringify({status:'building',created_at:new Date().toISOString()}));
  current=(await f.get('/api/manuals')).body;assert.equal(current.readiness.code,'MANUALS_TRANSACTION_UNCERTAIN');assert.equal((await f.save()).status,409);await assert.rejects(f.store.sync(),error=>error.code==='MANUALS_TRANSACTION_UNCERTAIN');
  assert.deepEqual(await fs.readFile(stateFile),before);
});

test('线上保存保留来源、请求标记、JSON、大小与版本保护',{timeout:30000},async t=>{
  const f=await createManualOnlineFixture(t),current=(await f.get('/api/manuals')).body;
  const payload={catalog:manualFixtureCatalog(),expectedRevision:current.revision,initializeEmpty:true,expectedPublicRevision:current.readiness.publicRevision};
  for(const [headers,status] of [[{origin:'https://foreign.example.test'},403],[{origin:''},403],[{'x-ljm-admin-request':''},403],[{'content-type':'text/plain'},415]])assert.equal((await f.post('/api/manuals/save',payload,undefined,headers)).status,status);
  const malformed=await f.request('/api/manuals/save',{method:'POST',headers:{origin:f.adminOrigin,'content-type':'application/json','x-ljm-admin-request':'1','x-ljm-operation-id':randomUUID(),'x-ljm-step-id':randomUUID()},body:'{INVALID-JSON'});assert.equal(malformed.status,400);
  assert.equal((await f.post('/api/manuals/save',payload,undefined,{'x-ljm-operation-id':''})).status,428);
  const tooLarge=structuredClone(payload);tooLarge.catalog.documents[0].catalogue_summary='x'.repeat(4*1024*1024);assert.equal((await f.post('/api/manuals/save',tooLarge)).status,413);
  const forged=structuredClone(payload);Object.assign(forged.catalog.documents[0],{source_submission_id:'TG-'+'A'.repeat(24),source_submission_revision:1,source_submission_digest:'a'.repeat(64),source_sharing_scope:'official-link'});
  assert.equal((await f.post('/api/manuals/save',forged)).status,400);await assert.rejects(fs.access(path.join(f.root,'state.json')));
});

test('同域整册预览只读正式附件，页码重试、失效版本及隐私变化均受控',{timeout:30000},async t=>{
  const f=await createManualOnlineFixture(t),catalog=f.readerCatalog();
  for(const [index,label] of [[2,'第1页'],[3,'第2页']]){
    const ref=`/archive/${f.id}/page-${index}.png`;await fs.writeFile(path.join(f.site,'public',ref),png);f.archive.core.publication_file_path.push(ref);catalog.documents[0].page_map.push({attachment_ref:ref,printed_label:label});
  }
  catalog.documents[0].contents.push({label:'第2页',page:3});await fs.writeFile(path.join(f.archiveDirectory,f.id+'.json'),JSON.stringify(f.archive));
  assert.equal((await f.save(catalog)).status,200);const current=(await f.get('/api/manuals')).body;
  const preview=await f.get('/api/manuals/preview?'+new URLSearchParams({manual:'manual-test',revision:current.revision}));assert.equal(preview.status,200);assert.equal(preview.body.document.pages.length,3);assert(!JSON.stringify(preview.body).includes('PRIVATE-'));
  const shadow=path.join(f.privateRoot,'inbox',f.id,path.basename(f.src));await fs.mkdir(path.dirname(shadow),{recursive:true});await fs.writeFile(shadow,Buffer.concat([png,Buffer.from('UNREVIEWED-SHADOW')]));
  for(const page of preview.body.document.pages){
    assert.match(page.src,/^\/api\/manuals\/preview-image\?/);const result=await f.get(page.src+'&retry=1');assert.equal(result.status,200,JSON.stringify(result.body));assert.deepEqual(result.bytes,png);assert.equal(result.headers.get('cache-control'),'no-store');assert.equal(result.headers.get('content-type'),'image/png');
  }
  for(const page of ['0','01','-1','1.5','9999'])assert((await f.get('/api/manuals/preview-image?'+new URLSearchParams({manual:'manual-test',revision:current.revision,page}))).status>=400);
  const oldImage=preview.body.document.pages[0].src;catalog.documents[0].edition_display='更新后的版本';assert.equal((await f.save(catalog)).status,200);assert.equal((await f.get(oldImage)).status,409);
  const next=(await f.get('/api/manuals')).body;const newImage='/api/manuals/preview-image?'+new URLSearchParams({manual:'manual-test',revision:next.revision,page:'1'});
  f.archive.core.privacy_level='Y';await fs.writeFile(path.join(f.archiveDirectory,f.id+'.json'),JSON.stringify(f.archive));assert.equal((await f.get(newImage)).status,409);
  const invalid=await f.get('/api/manuals/preview-image?'+new URLSearchParams({manual:'../../private',revision:next.revision,page:'1'}));assert.equal(invalid.status,400);
});
