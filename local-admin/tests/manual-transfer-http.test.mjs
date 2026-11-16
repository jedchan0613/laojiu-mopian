import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {spawn} from 'node:child_process';
import {once} from 'node:events';
import {fileURLToPath} from 'node:url';
import {randomUUID} from 'node:crypto';
import {createReviewHttpFixture} from './helpers/manual-review-fixture.mjs';
import {createOnlineReviewFixture} from './helpers/manual-review-online-fixture.mjs';

// 全部资料、服务和故障注入均在辅助函数建立的合成临时目录中。
const ids = () => ({operationId: randomUUID(), stepId: randomUUID()});
const privatePath = (f, ...parts) => path.join(path.dirname(f.root), ...parts);
const list = directory => fs.readdir(directory).catch(error => error.code === 'ENOENT' ? [] : Promise.reject(error));
const operationFile = (f, operation) => privatePath(f, 'operations', operation.operationId + '.' + operation.stepId + '.json');

async function approved(f) {
  const detail = await f.detail();
  const result = await f.post(f.base + '/review', f.approval(detail));
  assert.equal(result.status, 200, JSON.stringify(result.body));
  return f.detail();
}

async function markReceiptUncertain(f, operation) {
  const file = operationFile(f, operation);
  const record = JSON.parse(await fs.readFile(file, 'utf8'));
  assert.equal(record.kind, 'manual-transfer');
  assert.equal(record.status, 'succeeded');
  record.status = 'needs_review';
  record.errorCode = 'RESULT_UNCERTAIN';
  record.errorStatus = 409;
  delete record.result;
  await fs.writeFile(file, JSON.stringify(record), {mode: 0o600});
}

async function restartLocal(f) {
  const child = spawn(process.execPath, [fileURLToPath(new URL('../server.mjs', import.meta.url))], {
    env: f.env, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe']
  });
  let output = '';
  child.stdout.on('data', bytes => { output += bytes; });
  child.stderr.on('data', bytes => { output += bytes; });
  const stop = async () => {
    if (child.exitCode === null && child.signalCode === null) {
      const exited = once(child, 'exit');
      child.kill('SIGTERM');
      await exited;
    }
  };
  for (let n = 0; n < 300 && child.exitCode === null; n++) {
    try { if ((await f.get('/healthz')).status === 200) return stop; } catch {}
    await new Promise(resolve => setTimeout(resolve, 30));
  }
  await stop();
  throw new Error('合成重启服务无法读取：' + output);
}

test('8.3本机HTTP交接返回专用完整回执，查询及原编号重放不创建第二份草稿', {timeout: 45000}, async t => {
  const f = await createReviewHttpFixture(t, {pages: 3});
  const detail = await approved(f), operation = ids(), payload = f.transfer(detail);
  assert.equal(detail.context.transferWritable, true);
  assert.equal(detail.catalog_readiness.ready, true);
  const result = await f.post(f.base + '/transfer', payload, operation);
  assert.equal(result.status, 200, JSON.stringify(result.body));
  assert.equal(result.body.operation.kind, 'manual-transfer');
  const proof = result.body.operation.result.manualTransfer;
  assert.deepEqual(proof, {
    submissionId: f.submissionId, revision: (await f.detail()).record.revision,
    submittedRevision: payload.submitted_revision, snapshotDigest: payload.snapshot_digest,
    manualKey: result.body.manual_key, itemId: result.body.item_id, pages: 3, sharingScope: 'reading-copy'
  });
  assert.match(proof.manualKey, /^manual-[a-f0-9]{24}$/);
  assert.match(proof.itemId, /^LJM-\d{8}-RPR-\d{3}$/);
  const queried = (await f.get('/api/operations/' + operation.operationId)).body.operations[0];
  assert.deepEqual(queried.result.manualTransfer, proof);
  for (const secret of ['PRIVATE-REVIEW-HTTP-NOTE', 'model_basis', f.accountId, f.submissionRoot]) assert.equal(JSON.stringify(queried).includes(secret), false);
  const draftsBefore = await list(privatePath(f, 'drafts'));
  const inboxBefore = await list(privatePath(f, 'inbox', proof.itemId));
  const replayed = await f.post(f.base + '/transfer', payload, operation);
  assert.equal(replayed.status, 200, JSON.stringify(replayed.body));
  assert.equal(replayed.body.replayed, true);
  assert.deepEqual(replayed.body.operation.result.manualTransfer, proof);
  assert.deepEqual(await list(privatePath(f, 'drafts')), draftsBefore);
  assert.deepEqual(await list(privatePath(f, 'inbox', proof.itemId)), inboxBefore);
  assert.equal((await f.detail()).record.manual_handoff.status, 'complete');
  await assert.rejects(fs.access(path.join(f.site, 'public/archive', proof.itemId)));
  await assert.rejects(fs.access(f.source));
});

test('8.3官方来源HTTP仅生成私密目录，专用回执为零页且无档案编号', {timeout: 45000}, async t => {
  const f = await createReviewHttpFixture(t, {pages: 0, metadata: {sharing_scope: 'official-link', rights_basis: 'official-link', official_url: 'https://support.example.com/synthetic/manual'}});
  const detail = await approved(f), result = await f.post(f.base + '/transfer', f.transfer(detail));
  assert.equal(result.status, 200, JSON.stringify(result.body));
  const proof = result.body.operation.result.manualTransfer;
  assert.equal(proof.submissionId, f.submissionId);
  assert.equal(proof.sharingScope, 'official-link');
  assert.equal(proof.itemId, null);
  assert.equal(proof.pages, 0);
  assert.deepEqual(await list(privatePath(f, 'drafts')), []);
  assert.deepEqual(await list(privatePath(f, 'inbox')), []);
  const catalog = (await f.get('/api/manuals')).body.state.draft;
  assert.equal(catalog.documents.length, 1);
  assert.equal(catalog.documents[0].manual_key, proof.manualKey);
  assert.equal(catalog.documents[0].linked_archive_id, '');
  assert.deepEqual(catalog.documents[0].page_map, []);
  await assert.rejects(fs.access(f.source));
});

test('8.3丢失交接完成回执后重启，HTTP只凭整册草稿证据恢复成功，不重新转入', {timeout: 45000}, async t => {
  const f = await createReviewHttpFixture(t, {pages: 3});
  const detail = await approved(f), operation = ids(), payload = f.transfer(detail);
  const saved = await f.post(f.base + '/transfer', payload, operation);
  assert.equal(saved.status, 200, JSON.stringify(saved.body));
  const proof = saved.body.operation.result.manualTransfer;
  const draftFile = privatePath(f, 'drafts', proof.itemId + '.json');
  const draftBytes = await fs.readFile(draftFile);
  const catalogBytes = await fs.readFile(path.join(f.root, 'state.json'));
  const imageNames = await list(privatePath(f, 'inbox', proof.itemId));
  await f.stop();
  await markReceiptUncertain(f, operation);
  const stop = await restartLocal(f);
  try {
    const pending = await f.detail();
    const row = pending.recent_operations.find(value => value.operationId === operation.operationId);
    assert.equal(row.kind, 'manual-transfer');
    assert.equal(row.status, 'needs_review');
    assert.equal(row.result, undefined);
    const resolved = await f.post(f.base + '/resolve-operation', operation);
    assert.equal(resolved.status, 200, JSON.stringify(resolved.body));
    assert.equal(resolved.body.operation.status, 'succeeded');
    assert.deepEqual(resolved.body.operation.result.manualTransfer, proof);
    assert.deepEqual(await fs.readFile(draftFile), draftBytes);
    assert.deepEqual(await fs.readFile(path.join(f.root, 'state.json')), catalogBytes);
    assert.deepEqual(await list(privatePath(f, 'inbox', proof.itemId)), imageNames);
    assert.equal((await f.get('/api/operations/' + operation.operationId)).body.operations[0].status, 'succeeded');
    const replay = await f.post(f.base + '/transfer', payload, operation);
    assert.equal(replay.status, 200, JSON.stringify(replay.body));
    assert.equal(replay.body.replayed, true);
    assert.equal((await list(privatePath(f, 'drafts'))).length, 1);
  } finally { await stop(); }
});

test('8.3部分交接证据不足保持needs_review，核对和同编号重放均不补写或重复复制', {timeout: 45000}, async t => {
  const f = await createReviewHttpFixture(t, {pages: 3});
  const detail = await approved(f), operation = ids(), payload = f.transfer(detail);
  const saved = await f.post(f.base + '/transfer', payload, operation);
  assert.equal(saved.status, 200, JSON.stringify(saved.body));
  const proof = saved.body.operation.result.manualTransfer;
  await f.stop();
  await markReceiptUncertain(f, operation);
  const directory = privatePath(f, 'inbox', proof.itemId), names = await list(directory);
  // 仅删除本测试刚创建的合成副本，模拟交接写入不完整；不触碰网站或主档。
  await fs.unlink(path.join(directory, names[0]));
  const remaining = await list(directory), stop = await restartLocal(f);
  try {
    for (let n = 0; n < 2; n++) {
      const resolved = await f.post(f.base + '/resolve-operation', operation);
      assert.equal(resolved.status, 200, JSON.stringify(resolved.body));
      assert.equal(resolved.body.operation.status, 'needs_review');
      assert.equal(resolved.body.operation.result, undefined);
    }
    const replay = await f.post(f.base + '/transfer', payload, operation);
    assert.equal(replay.status, 409, JSON.stringify(replay.body));
    const newAttempt = await f.post(f.base + '/transfer', payload);
    assert.equal(newAttempt.status, 409, JSON.stringify(newAttempt.body));
    assert.equal(newAttempt.body.code, 'OPERATION_NEEDS_REVIEW');
    assert.equal((await f.get('/api/operations/' + operation.operationId)).body.operations[0].status, 'needs_review');
    assert.deepEqual(await list(directory), remaining);
    assert.equal((await list(privatePath(f, 'drafts'))).length, 1);
    assert.equal((await f.detail()).recent_operations.find(row => row.operationId === operation.operationId).kind, 'manual-transfer');
  } finally { await stop(); }
});

test('8.3目录损坏不阻断HTTP人工审核，GET明确交接不可写且不自行修复目录', {timeout: 45000}, async t => {
  const f = await createReviewHttpFixture(t, {pages: 2});
  await fs.mkdir(f.root, {recursive: true});
  const file = path.join(f.root, 'state.json');
  await fs.writeFile(file, 'SYNTHETIC-BROKEN-CATALOG-KEEP');
  const detail = await f.detail();
  assert.equal(detail.context.reviewWritable, true);
  assert.equal(detail.context.transferWritable, false);
  assert.equal(detail.context.transferWriteReason, 'catalog_unavailable');
  assert.equal(detail.catalog_readiness.ready, false);
  assert.equal(detail.catalog_revision, undefined);
  const reviewed = await f.post(f.base + '/review', f.approval(detail));
  assert.equal(reviewed.status, 200, JSON.stringify(reviewed.body));
  assert.equal((await f.detail()).record.status, 'approved');
  assert.equal(await fs.readFile(file, 'utf8'), 'SYNTHETIC-BROKEN-CATALOG-KEEP');
  assert.deepEqual(await list(privatePath(f, 'drafts')), []);
  assert.deepEqual(await list(privatePath(f, 'inbox')), []);
});

test('8.3HTTP核对入口只接收原操作编号，不能夹带新转入正文或借用审核回执', {timeout: 45000}, async t => {
  const f = await createReviewHttpFixture(t, {pages: 2});
  const detail = await f.detail(), operation = ids();
  const reviewed = await f.post(f.base + '/review', f.approval(detail), operation);
  assert.equal(reviewed.status, 200, JSON.stringify(reviewed.body));
  assert.equal((await f.post(f.base + '/resolve-operation', {...operation, confirmed: true})).status, 400);
  assert.equal((await f.post(f.base + '/resolve-operation', operation)).status, 409);
  assert.deepEqual(await list(privatePath(f, 'drafts')), []);
});

test('8.3线上转入能力依赖审核与目录开关，并保持PDF能力关闭', {timeout: 45000}, async t => {
  const f = await createOnlineReviewFixture(t, {enabled: true, transferEnabled: true});
  const capabilities = (await f.get('/healthz')).body.capabilities;
  assert.equal(capabilities.manualReviewVersion, 1);
  assert.equal(capabilities.manualTransferVersion, process.platform === 'linux' ? 1 : 0);
  assert.equal(capabilities.manualPdfHandoffVersion, 0);
  const detail = (await f.get(f.base)).body;
  if (process.platform !== 'linux') {
    assert.equal(detail.context.transferWritable, false);
    assert.equal((await f.post(f.base + '/transfer', {})).status, 404);
  }
  f.env.LJM_MANUALS_ONLINE_ENABLED = 'false';
  await f.restart();
  const disabled = (await f.get('/healthz')).body.capabilities;
  assert.equal(disabled.manualReviewVersion, 1);
  assert.equal(disabled.manualTransferVersion, 0);
  assert.equal((await f.post(f.base + '/transfer', {})).status, 404);
});
