// 存储层门禁回归：只用新建临时目录和固定合成页，不需要上传解码依赖。
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {createSyntheticTransferFixture,syntheticKey,syntheticIdentity} from './helpers/manual-synthetic-transfer-fixture.mjs';
import {syntheticManualMetadata} from './helpers/manual-synthetic-pages.mjs';
import {createSyntheticRecoveryFixture} from './helpers/manual-upgrade-fixture.mjs';

test('部分交接仅预留archive_item_id时也阻断早期发布；停止申请后回调仍不执行',async t=>{
  const f=await createSyntheticTransferFixture(t);let callbacks=0;
  await assert.rejects(f.store.transferManualSubmission(f.submissionId,f.payload,{...f.adapters,createArchive:async input=>{await input.onReserved(f.id);throw new Error('SYNTHETIC-RESERVED-ONLY');}},f.context),/SYNTHETIC-RESERVED-ONLY/);
  let r=await f.load();assert.equal(r.linked_item_id,null);assert.equal(r.manual_handoff.archive_item_id,f.id);assert.equal(r.manual_handoff.status,'needs_review');
  await assert.rejects(f.store.guardPublication(f.id,async()=>{callbacks++;}),{statusCode:409});assert.equal(callbacks,0);
  await f.stop();r=await f.load();assert.equal(r.withdrawal_requested,true);await assert.rejects(f.store.guardPublication(f.id,async()=>{callbacks++;}),{statusCode:409});assert.equal(callbacks,0);
});
test('完整关联与另一投稿的预留编号冲突时失败封闭，不选择其中一个来源继续发布',async t=>{
  const f=await createSyntheticTransferFixture(t);await f.handoff();
  const second=await f.store.createAccountManualDraft({accountId:f.accountId,payload:{request_key:syntheticKey(),manual:{...syntheticManualMetadata,model_texts:['SYNTHETIC-84-OTHER']}}});
  const file=path.join(f.submissionRoot,second.id,'record.json'),r=JSON.parse(await fs.readFile(file));r.manual_handoff={version:2,status:'needs_review',archive_item_id:f.id};await fs.writeFile(file,JSON.stringify(r));
  let callbacks=0;await assert.rejects(f.store.guardPublication(f.id,async()=>{callbacks++;}),/多份投稿来源/);assert.equal(callbacks,0);
});
test('已完成v2交接不能省略身份或换操作编号走旧版重复路径，正确原身份仍能返回同一结果',async t=>{
  const f=await createSyntheticTransferFixture(t),first=await f.handoff(),file=path.join(f.submissionRoot,f.submissionId,'record.json'),before=await fs.readFile(file);let callbacks=0;
  const blocked={planCatalog:async()=>{callbacks++;},createArchive:async()=>{callbacks++;},importCatalog:async()=>{callbacks++;}};
  const repeated=await f.store.transferManualSubmission(f.submissionId,f.payload,blocked,f.context);assert.equal(repeated.repeated,true);assert.deepEqual(repeated.manualTransferResult,first.manualTransferResult);
  for(const context of [undefined,{}, {actor:f.context.actor}, {operationId:f.context.operationId,stepId:f.context.stepId}, {...f.context,actor:'other-admin@example.invalid'}, syntheticIdentity()])await assert.rejects(f.store.transferManualSubmission(f.submissionId,f.payload,blocked,context),{statusCode:409});
  assert.equal(callbacks,0);assert.deepEqual(await fs.readFile(file),before);
});
test('未知交接协议版本不回退旧版，也不覆盖或尝试续写；真正旧本机交接仍可读取原重复结果',async t=>{
  const f=await createSyntheticTransferFixture(t);await f.handoff();const file=path.join(f.submissionRoot,f.submissionId,'record.json'),r=JSON.parse(await fs.readFile(file));r.manual_handoff.version=99;await fs.writeFile(file,JSON.stringify(r));const before=await fs.readFile(file);let callbacks=0;
  const blocked={planCatalog:async()=>{callbacks++;},createArchive:async()=>{callbacks++;},importCatalog:async()=>{callbacks++;}};
  for(const context of [{},f.context])await assert.rejects(f.store.transferManualSubmission(f.submissionId,f.payload,blocked,context),/不能核对的版本/);assert.equal(callbacks,0);assert.deepEqual(await fs.readFile(file),before);
  const readable=await f.load();assert.equal(readable.manual_handoff.version,99);assert.equal(readable.status,'approved');
  await assert.rejects(f.store.guardPublication(f.id,async()=>{callbacks++;}),/整理记录版本暂不支持/);assert.equal(callbacks,0);
  const catalog=(await f.catalogStore.bootstrap()).state.draft,issues=await f.store.manualCatalogPublicationIssues(catalog);assert(issues.length>0);assert(issues.some(issue=>/整理记录版本暂不支持/.test(issue.message)));assert.deepEqual(await fs.readFile(file),before);
  const old=await createSyntheticRecoveryFixture(t,{legacy:true}),original=await old.readRecord();assert.equal(Object.hasOwn(original.manual_handoff,'version'),false);const repeated=await old.store.transferManualSubmission(old.id,old.payload,blocked,{});assert.equal(repeated.repeated,true);assert.equal(repeated.item_id,old.itemId);assert.equal(callbacks,0);
});
