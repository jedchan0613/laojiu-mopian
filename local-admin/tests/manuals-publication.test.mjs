import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {randomUUID} from 'node:crypto';
import {createManualPublicationFixture} from './helpers/manuals-publication-fixture.mjs';
import {createWriteCoordinator,acquireWriteLease} from '../write-coordinator.mjs';

test('线上发布绑定身份、整目录确认、轻量事务及实际公开版本，初始化记录保留',async t=>{
  const f=await createManualPublicationFixture(t);await f.save();const ctx=f.context(),review=await f.prepare(ctx);
  await assert.rejects(f.store.publish({expectedRevision:review.expectedRevision,review_id:review.review_id,confirmations:Array(5).fill(false)},ctx),error=>error.statusCode===428);
  await assert.rejects(f.store.publish({expectedRevision:review.expectedRevision,review_id:review.review_id,confirmations:Array(5).fill(true)},{...ctx,actor:'other@example.test'}),error=>error.statusCode===428);
  const result=await f.store.publish({expectedRevision:review.expectedRevision,review_id:review.review_id,confirmations:Array(5).fill(true)},ctx);
  assert.equal(f.builds(),1);assert.equal((await f.store.bootstrap()).state.draft,null);assert.equal((await f.store.bootstrap()).state.initialization.actor,'admin@example.test');
  assert.equal(await fs.readFile(f.pointer,'utf8'),result.publicRelease);const job=path.join(f.root,'transactions',result.transaction_id),log=JSON.parse(await fs.readFile(path.join(job,'manifest.json')));
  assert.equal(log.version,2);assert.equal(log.status,'complete');assert.equal(log.actor,ctx.actor);assert.equal(log.committed_revision,result.revision);
  await assert.rejects(fs.access(path.join(job,'previous-dist')));assert.equal(await fs.readFile(path.join(f.previous,'index.html'),'utf8'),'PREVIOUS-PUBLIC');
  const source=await fs.readFile(f.source,'utf8');assert(!source.includes('PRIVATE-'));assert(!source.includes(ctx.actor));assert.equal((await f.store.proveOperation(ctx.operationId,ctx.stepId)).status,'succeeded');
});

for(const point of ['build','candidate','before-switch','after-switch','verify'])test(`线上${point}失败回退到原指针与目录，保留草稿且不备份整站`,async t=>{
  const f=await createManualPublicationFixture(t);await f.save();const before=await fs.readFile(path.join(f.root,'state.json'));f.fail(point);const ctx=f.context();
  await assert.rejects(f.publish(ctx),error=>error.code==='MANUALS_BUILD_FAILED'&&error.safeToRetry===true);assert.equal(await fs.readFile(f.pointer,'utf8'),'previous');assert.deepEqual(await fs.readFile(path.join(f.root,'state.json')),before);await assert.rejects(fs.access(f.source));
  const current=await f.store.bootstrap();assert.equal(current.pending.length,0);assert(current.state.draft);assert.equal((await f.store.proveOperation(ctx.operationId,ctx.stepId)).status,'failed');
});

test('构建后至候选准备期间附件变化，使旧确认失效且不采用候选',async t=>{
  const f=await createManualPublicationFixture(t);await f.save();const original=await fs.readFile(f.image);f.onPrepared(()=>fs.writeFile(f.image,Buffer.concat([original,Buffer.from('CHANGED-AFTER-BUILD')])));
  await assert.rejects(f.publish(),error=>error.code==='MANUALS_BUILD_FAILED');assert.equal(await fs.readFile(f.pointer,'utf8'),'previous');assert((await f.store.bootstrap()).state.draft);
});

test('构建期间收到停止或投稿停止处理，保留原公开版本',async t=>{
  const f=await createManualPublicationFixture(t);await f.save();const stop=new AbortController();f.onBuild(()=>stop.abort());await assert.rejects(f.publish(f.context({signal:stop.signal})),error=>error.code==='OPERATION_CANCELLED'&&error.safeToRetry);assert.equal(await fs.readFile(f.pointer,'utf8'),'previous');
  f.onBuild(()=>f.fail('guard'));await assert.rejects(f.publish(),error=>error.code==='MANUALS_BUILD_FAILED');assert.equal(await fs.readFile(f.pointer,'utf8'),'previous');
});

test('切站后晚到的停止仍按实际完成记录，不误报未发布',async t=>{
  const f=await createManualPublicationFixture(t);await f.save();const stop=new AbortController();f.onAfterSwitch(()=>stop.abort());const result=await f.publish(f.context({signal:stop.signal}));assert.equal(await fs.readFile(f.pointer,'utf8'),result.publicRelease);assert.equal((await f.store.bootstrap()).pending.length,0);
});

test('切站后正式状态落盘失败能恢复旧站，草稿和原始初始化仍保留',async t=>{
  const f=await createManualPublicationFixture(t);await f.save();const stateFile=path.join(f.root,'state.json'),before=await fs.readFile(stateFile),original=fs.rename;let injected=false;
  const mock=t.mock.method(fs,'rename',async(from,to)=>{if(to===stateFile&&!injected&&JSON.parse(await fs.readFile(from)).last_publication){injected=true;throw Object.assign(new Error('SYNTHETIC-STATE-EIO'),{code:'EIO'});}return original(from,to);});
  try{await assert.rejects(f.publish(),error=>error.code==='MANUALS_BUILD_FAILED');}finally{mock.mock.restore();}
  assert(injected);assert.equal(await fs.readFile(f.pointer,'utf8'),'previous');assert.deepEqual(await fs.readFile(stateFile),before);
});

test('回退期间看到第三方公开版本，不覆盖新指针并停止后续写入和同步',async t=>{
  const f=await createManualPublicationFixture(t);await f.save();f.onAfterSwitch(()=>f.foreignLive());f.fail('after-switch');
  await assert.rejects(f.publish(),error=>error.code==='MANUALS_ROLLBACK_UNCERTAIN');assert.equal(await fs.readFile(f.pointer,'utf8'),'foreign');assert.equal((await f.store.bootstrap()).readiness.status,'blocked');await assert.rejects(f.save());await assert.rejects(f.store.sync());await assert.rejects(f.store.assertSettled());
});

test('部署锁丢失停止切站和盲目回退，事务保留供人工核对',async t=>{
  const f=await createManualPublicationFixture(t);await f.save();f.onBuild(()=>f.loseLock());await assert.rejects(f.publish(),error=>error.code==='MANUALS_ROLLBACK_UNCERTAIN');assert.equal(await fs.readFile(f.pointer,'utf8'),'previous');assert.equal((await f.store.bootstrap()).pending.length,1);
});

test('撤下与历史恢复不删除档案，恢复只生成草稿并保留已有草稿',async t=>{
  const f=await createManualPublicationFixture(t);await f.save();await f.publish();let current=await f.store.bootstrap();
  const draft=f.readerCatalog();draft.documents[0].edition_display='尚未发布的修改';await f.save(draft);current=await f.store.bootstrap();
  await f.store.withdraw({expectedRevision:current.revision,manual_key:'manual-test',confirmed:true,reason:'合成撤下测试'},f.context());current=await f.store.bootstrap();assert.equal(JSON.parse(await fs.readFile(f.source)).documents.length,0);assert.equal(current.state.draft.documents[0].edition_display,'尚未发布的修改');await fs.access(f.image);
  const old=current.history.find(row=>row.kind==='published-before-withdrawal'),pointer=await fs.readFile(f.pointer);await f.store.restore({expectedRevision:current.revision,history_id:old.history_id},f.context());
  const restored=await f.store.bootstrap();assert(restored.state.draft);assert(restored.history.some(row=>row.kind==='draft-before-restore'));assert.deepEqual(await fs.readFile(f.pointer),pointer);assert.equal(JSON.parse(await fs.readFile(f.source)).documents.length,0);
});

test('成功事务但回执写入失败，可核对真实版本后修复回执，不重放发布',async t=>{
  const f=await createManualPublicationFixture(t);await f.save();const directory=path.join(f.dir,'operations'),release=await acquireWriteLease(directory);let writes;
  try{
    writes=await createWriteCoordinator({directory});const ctx=f.context(),review=await f.prepare(ctx),payload={expectedRevision:review.expectedRevision,review_id:review.review_id,confirmations:Array(5).fill(true)};
    await assert.rejects(writes.perform({operationId:ctx.operationId,stepId:ctx.stepId,kind:'manuals-publish',target:'new',payload},c=>f.store.publish(payload,{...c,actor:ctx.actor,assertDeploymentLock:ctx.assertDeploymentLock}),()=>{throw new Error('SYNTHETIC-RECEIPT-FAIL');}),error=>error.code==='OPERATION_NEEDS_REVIEW');
    assert.equal(writes.query(ctx.operationId)[0].status,'needs_review');assert.equal(f.builds(),1);
    const result=await writes.resolveManualAttempt(ctx,()=>f.store.proveOperation(ctx.operationId,ctx.stepId));assert.equal(result.operation.status,'succeeded');writes.assertReady();assert.equal(f.builds(),1);
    const repeat=await writes.perform({operationId:ctx.operationId,stepId:ctx.stepId,kind:'manuals-publish',target:'new',payload},()=>{throw new Error('MUST-NOT-REPLAY');});assert.equal(repeat.replayed,true);assert.equal(f.builds(),1);
  }finally{await writes?.drain();await release();}
});

test('未开始请求核对后建立屏障，迟到请求无法执行，其他类型不得借此核对',async t=>{
  const f=await createManualPublicationFixture(t),directory=path.join(f.dir,'operations'),release=await acquireWriteLease(directory);let writes;
  try{
    writes=await createWriteCoordinator({directory});const ctx=f.context();const result=await writes.resolveManualAttempt(ctx,async()=>null);assert.equal(result.state,'not-started');
    await assert.rejects(writes.perform({operationId:ctx.operationId,stepId:ctx.stepId,kind:'manuals-save',target:'new',payload:{}},()=>{throw new Error('MUST-NOT-RUN');}),error=>error.code==='OPERATION_MISMATCH');
    const other={operationId:randomUUID(),stepId:randomUUID()};await writes.perform({...other,kind:'save-draft',target:'new',payload:{}},async()=>({}));await assert.rejects(writes.resolveManualAttempt({...other,actor:ctx.actor},async()=>null),error=>error.code==='MANUALS_OPERATION_INVALID');
  }finally{await writes?.drain();await release();}
});
