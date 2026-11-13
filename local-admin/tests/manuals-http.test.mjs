import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {randomUUID} from 'node:crypto';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {fileURLToPath} from 'node:url';
import {createManualHttpFixture} from './helpers/manuals-http-fixture.mjs';
import {manualFixtureCatalog} from './helpers/manuals-fixture.mjs';

test('说明书维护沿用本机来源保护、no-store与操作编号，不能通过公开路径读取私密文件',{timeout:30000},async t=>{
  const f=await createManualHttpFixture(t);
  for(const route of ['/api/manuals','/admin/manuals.html','/admin/manuals.js','/admin/manuals.css','/admin/manuals-preview.html','/admin/manuals-preview.js']){const r=await f.get(route);assert.equal(r.status,200,route);assert.equal(r.headers.get('cache-control'),'no-store');}
  const initial=(await f.get('/api/manuals')).body;
  await assert.rejects(promisify(execFile)(process.execPath,[fileURLToPath(new URL('../server.mjs',import.meta.url)),'--check-config'],{env:{...f.env,LJM_ADMIN_DATA_ROOT:path.join(f.site,'public')},windowsHide:true}),error=>/说明书私密维护资料/.test(error.stderr));
  assert.equal((await f.post('/api/manuals/save',{catalog:manualFixtureCatalog(),expectedRevision:initial.revision},undefined,{origin:'https://foreign.example.com'})).status,403);
  assert.equal((await f.post('/api/manuals/save',{catalog:manualFixtureCatalog(),expectedRevision:initial.revision},undefined,{'x-ljm-admin-request':''})).status,403);
  assert.equal((await f.post('/api/manuals/save',{catalog:manualFixtureCatalog(),expectedRevision:initial.revision},undefined,{'x-ljm-operation-id':''})).status,428);
  for(const route of ['/manuals/state.json','/local-admin/manuals/state.json','/api/manuals/history/../../state.json'])assert.equal((await f.get(route)).status,404);
  assert.equal((await f.get('/api/manuals')).body.revision,initial.revision);
});

test('完整HTTP流程：保存、隔离预览、人工确认、正式构建、重复请求、撤下及恢复',{timeout:45000},async t=>{
  const f=await createManualHttpFixture(t);let state=(await f.get('/api/manuals')).body;
  const ids={operationId:randomUUID(),stepId:randomUUID()},payload={expectedRevision:state.revision,catalog:f.readerCatalog()};let r=await f.post('/api/manuals/save',payload,ids);assert.equal(r.status,200,JSON.stringify(r.body));assert.equal(r.body.operation.status,'succeeded');const savedRevision=r.body.revision;
  r=await f.post('/api/manuals/save',payload,ids);assert.equal(r.status,200);assert.equal(r.body.replayed,true);assert.equal((await f.get('/api/manuals')).body.revision,savedRevision);
  const preview=await f.get('/api/manuals/preview?manual=manual-test&revision='+savedRevision);assert.equal(preview.status,200);assert.equal(preview.body.document.pages.length,1);assert(!JSON.stringify(preview.body).includes('PRIVATE-'));await assert.rejects(fs.access(f.source));
  r=await f.post('/api/manuals/review',{expectedRevision:savedRevision});assert.equal(r.status,200);assert.equal(r.body.issues.length,0);const review_id=r.body.review_id;
  r=await f.post('/api/manuals/publish',{expectedRevision:savedRevision,review_id,confirmations:Array(5).fill(false)});assert.equal(r.status,428);
  r=await f.post('/api/manuals/publish',{expectedRevision:savedRevision,review_id,confirmations:Array(5).fill(true)});assert.equal(r.status,200,JSON.stringify(r.body));assert.match(r.body.buildOutput,/isolated build passed/);assert.equal(JSON.parse(await fs.readFile(f.source)).documents.length,1);
  state=(await f.get('/api/manuals')).body;assert.equal(state.state.draft,null);assert.equal(state.state.published.documents.length,1);
  r=await f.post('/api/manuals/withdraw',{expectedRevision:state.revision,manual_key:'manual-test',reason:'隔离撤下测试',confirmed:true});assert.equal(r.status,200,JSON.stringify(r.body));assert.equal(JSON.parse(await fs.readFile(f.source)).documents.length,0);
  state=(await f.get('/api/manuals')).body;const history=state.history.find(h=>h.kind==='published-before-withdrawal');r=await f.post('/api/manuals/restore',{expectedRevision:state.revision,history_id:history.history_id});assert.equal(r.status,200);state=(await f.get('/api/manuals')).body;assert(state.state.draft);assert.equal(JSON.parse(await fs.readFile(f.source)).documents.length,0);
});

test('HTTP构建失败恢复旧产物与草稿，原档案及附件不被说明书模块改写',{timeout:45000},async t=>{
  const f=await createManualHttpFixture(t),archive=await fs.readFile(path.join(f.archiveDirectory,f.id+'.json')),image=await fs.readFile(f.image),oldPage=await fs.readFile(path.join(f.dist,'index.html'));const state=(await f.get('/api/manuals')).body;
  const saved=await f.post('/api/manuals/save',{expectedRevision:state.revision,catalog:f.readerCatalog()});assert.equal(saved.status,200);const review=await f.post('/api/manuals/review',{expectedRevision:saved.body.revision});await fs.writeFile(path.join(f.site,'build-fail'),'fail');
  const r=await f.post('/api/manuals/publish',{expectedRevision:saved.body.revision,review_id:review.body.review_id,confirmations:Array(5).fill(true)});assert.equal(r.status,400);assert.equal(r.body.code,'MANUALS_BUILD_FAILED');assert.equal(r.body.operation.status,'failed');assert.deepEqual(await fs.readFile(path.join(f.dist,'index.html')),oldPage);assert.deepEqual(await fs.readFile(path.join(f.archiveDirectory,f.id+'.json')),archive);assert.deepEqual(await fs.readFile(f.image),image);await assert.rejects(fs.access(f.source));assert((await f.get('/api/manuals')).body.state.draft);
});

test('构建中停止的HTTP回执准确标为取消，恢复原页面并保留草稿',{timeout:30000},async t=>{
  const f=await createManualHttpFixture(t),before=await fs.readFile(path.join(f.dist,'index.html'));
  await fs.appendFile(path.join(f.site,'build.mjs'),'\nawait new Promise(resolve=>setTimeout(resolve,2000));\n');
  const saved=await f.post('/api/manuals/save',{expectedRevision:(await f.get('/api/manuals')).body.revision,catalog:f.readerCatalog()});
  const review=await f.post('/api/manuals/review',{expectedRevision:saved.body.revision}),ids={operationId:randomUUID(),stepId:randomUUID()};
  const publishing=f.post('/api/manuals/publish',{expectedRevision:saved.body.revision,review_id:review.body.review_id,confirmations:Array(5).fill(true)},ids);
  for(let i=0;i<300;i++){if(await fs.stat(path.join(f.site,'build-count')).catch(()=>null))break;await new Promise(resolve=>setTimeout(resolve,10));}
  await fs.access(path.join(f.site,'build-count'));
  const stopped=await f.post('/api/cancel-operation',{operationId:ids.operationId});assert.equal(stopped.status,200);
  const result=await publishing;assert.equal(result.status,409);assert.equal(result.body.code,'OPERATION_CANCELLED');assert.equal(result.body.operation.status,'cancelled');
  const state=(await f.get('/api/manuals')).body;assert.equal(state.revision,saved.body.revision);assert(state.state.draft);assert.deepEqual(await fs.readFile(path.join(f.dist,'index.html')),before);await assert.rejects(fs.access(f.source));
  const receipt=(await f.get('/api/operations/'+ids.operationId)).body.operations[0];assert.equal(receipt.status,'cancelled');assert.equal(receipt.errorCode,'OPERATION_CANCELLED');
});
