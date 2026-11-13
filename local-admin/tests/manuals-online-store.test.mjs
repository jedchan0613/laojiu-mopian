import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {createManualFixture,manualFixtureCatalog} from './helpers/manuals-fixture.mjs';
import {createManualStore,manualPublicationInput} from '../manuals.mjs';

test('保存空间不足或无法核对空间时保留旧状态，不新增草稿历史',async t=>{
  const f=await createManualFixture(t);await f.save();const before=await fs.readFile(path.join(f.root,'state.json')),current=await f.store.bootstrap();
  const replacement=manualFixtureCatalog();replacement.models[0].model_text='OTHER';
  const mock=t.mock.method(fs,'statfs',async()=>({bavail:0n,bsize:4096n}));
  await assert.rejects(f.store.save({catalog:replacement,expectedRevision:current.revision}),error=>error.code==='MANUALS_STORAGE_FULL'&&error.statusCode===503);
  mock.mock.mockImplementation(async()=>{throw new Error('SYNTHETIC-SPACE-ERROR');});
  await assert.rejects(f.store.save({catalog:replacement,expectedRevision:current.revision}),error=>error.code==='MANUALS_STORAGE_UNAVAILABLE');
  mock.mock.restore();assert.deepEqual(await fs.readFile(path.join(f.root,'state.json')),before);assert.equal((await f.store.bootstrap()).history.length,0);
});

test('已有非空目录即使只剩失效引用，也不能按空目录初始化',async t=>{
  const f=await createManualFixture(t),catalog=f.readerCatalog();
  await fs.mkdir(path.dirname(f.source),{recursive:true});const raw=JSON.stringify(manualPublicationInput(catalog));await fs.writeFile(f.source,raw);f.setArchives([]);
  const current=await f.store.bootstrap();assert.equal(current.readiness.code,'MANUALS_BASELINE_REQUIRED');
  await assert.rejects(f.save(),error=>error.code==='MANUALS_BASELINE_REQUIRED');await f.store.sync();assert.equal(await fs.readFile(f.source,'utf8'),raw);
});

test('独立维护记录的公开输入无法解析时只读，不被保存或同步覆盖',async t=>{
  const f=await createManualFixture(t),store=createManualStore({root:f.root,siteDirectory:f.site,readArchives:async()=>[f.archive],build:async()=>{throw new Error('MUST-NOT-BUILD');},requireInitialization:true});
  await fs.mkdir(path.dirname(f.source),{recursive:true});await fs.writeFile(f.source,'{BROKEN-PUBLIC-BASELINE');
  const state=await store.bootstrap();assert.equal(state.readiness.status,'blocked');assert.equal(state.readiness.code,'MANUALS_PUBLIC_INPUT_INVALID');
  await assert.rejects(store.save({catalog:manualFixtureCatalog(),expectedRevision:state.revision,initializeEmpty:true}),error=>error.code==='MANUALS_PUBLIC_INPUT_INVALID');
  assert.equal(await fs.readFile(f.source,'utf8'),'{BROKEN-PUBLIC-BASELINE');await assert.rejects(fs.access(path.join(f.root,'state.json')));
});
