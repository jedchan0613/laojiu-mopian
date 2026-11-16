import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {randomUUID} from 'node:crypto';
import {createPhase84Fixture, phase84List, phase84SecondAdmin} from './helpers/manual-phase84-fixture.mjs';

const operation = () => ({operationId: randomUUID(), stepId: randomUUID()});
const privatePath = (f, ...parts) => path.join(f.privateRoot, ...parts);
const query = async (f, ids) => (await f.get('/api/operations/' + ids.operationId)).body.operations.find(row => row.stepId === ids.stepId);

test('8.4 E02同册两次HTTP交接并发时仅一次成功，普通投稿并行处理不串资料', {timeout: 60000}, async t => {
  const f = await createPhase84Fixture(t, {pages: 12});
  const ordinary = await f.ordinary(), data = await f.approve(), payload = f.transfer(data), a = operation(), b = operation();
  const ordinaryRaw = await f.store.detail(ordinary.id);
  const results = await Promise.all([
    f.post(f.base + '/transfer', payload, a), f.post(f.base + '/transfer', payload, b),
    f.post('/api/admin/submissions/' + ordinary.id + '/review', {revision: ordinaryRaw.revision, status: 'approved', rights_reviewed: true, public_message: '普通投稿并发审核反馈'})
  ]);
  assert.deepEqual(results.slice(0, 2).map(result => result.status).sort(), [200, 409]);
  assert.equal(results[2].status, 200, JSON.stringify(results[2].body));
  const winner = results.find(result => result.body.operation?.status === 'succeeded');
  const proof = winner.body.operation.result.manualTransfer;
  assert.equal(proof.pages, 12);
  assert.equal((await phase84List(privatePath(f, 'drafts'))).length, 1);
  assert.equal((await phase84List(privatePath(f, 'inbox', proof.itemId))).length, 12);
  const document = (await f.get('/api/manuals')).body.state.draft.documents[0];
  assert.equal(document.source_submission_id, f.id);
  assert.equal(document.page_map.length, 12);
  const ordinaryAfter = await f.store.detail(ordinary.id);
  assert.equal(ordinaryAfter.status, 'approved');
  for (const field of ['manual_handoff', 'manual_catalog_key', 'manual_review_binding', 'manual_metadata']) assert.equal(ordinaryAfter[field], undefined, field);
  assert.equal(ordinaryAfter.fields.title, '8.4普通投稿并发合成资料');
  assert.equal((await f.raw()).manual_handoff.status, 'complete');
  await assert.rejects(fs.access(path.join(f.site, 'public/archive', proof.itemId)));
});

test('8.4 E02账号撤回已受理后，陈旧HTTP审核与交接均拒绝，普通投稿继续可用', {timeout: 45000}, async t => {
  const f = await createPhase84Fixture(t, {pages: 3});
  const ordinary = await f.ordinary(), data = await f.approve(), stale = f.transfer(data);
  const withdrawn = await f.accountAction('withdraw');
  assert.equal(withdrawn.status, 'draft');
  const ordinaryRaw = await f.store.detail(ordinary.id);
  const [transfer, review, ordinaryReview] = await Promise.all([
    f.post(f.base + '/transfer', stale), f.post(f.base + '/review', f.approval(data)),
    f.post('/api/admin/submissions/' + ordinary.id + '/review', {revision: ordinaryRaw.revision, status: 'needs_info', public_message: '请补充普通投稿合成来源'})
  ]);
  assert.equal(transfer.status, 409, JSON.stringify(transfer.body));
  assert.equal(review.status, 409, JSON.stringify(review.body));
  assert.equal(ordinaryReview.status, 200, JSON.stringify(ordinaryReview.body));
  const latest = await f.raw();
  assert.equal(latest.status, 'draft');
  assert.equal(latest.manual_handoff, undefined);
  assert.equal(latest.manual_review_binding, undefined);
  assert.deepEqual(await phase84List(privatePath(f, 'drafts')), []);
  assert.deepEqual(await phase84List(privatePath(f, 'inbox')), []);
  assert.equal((await f.store.detail(ordinary.id)).status, 'needs_info');
});

test('8.4 E02账号补充使旧审核失效；交接后停止申请保留已有结果并冻结再次交接', {timeout: 45000}, async t => {
  const f = await createPhase84Fixture(t, {pages: 3});
  let detail = await f.detail();
  const feedback = {...f.approval(detail), status: 'needs_info', public_message: '请补充合成来源与适用型号'};
  assert.equal((await f.post(f.base + '/review', feedback)).status, 200);
  const edited = await f.accountAction('edit');
  assert.equal(edited.status, 'draft');
  assert.equal((await f.raw()).manual_draft_reason, 'supplement');
  assert.equal((await f.post(f.base + '/transfer', f.transfer(detail))).status, 409);
  const raw = await f.raw();
  await f.store.operateAccountManualSubmission({id: f.id, accountId: f.accountId, payload: {
    action: 'submit', revision: raw.revision, operation_id: 'e'.repeat(64), consent_version: '2026-11-11-manual-v1', consents: {copies: true, rights: true, privacy: true, processing: true}
  }});
  detail = await f.approve();
  const ids = operation(), transferred = await f.post(f.base + '/transfer', f.transfer(detail), ids);
  assert.equal(transferred.status, 200, JSON.stringify(transferred.body));
  const itemId = transferred.body.item_id, before = await fs.readFile(privatePath(f, 'drafts', itemId + '.json'));
  await f.accountAction('withdraw');
  assert.equal((await f.raw()).withdrawal_requested, true);
  const retry = await f.post(f.base + '/transfer', f.transfer(await f.detail()));
  assert.equal(retry.status, 409, JSON.stringify(retry.body));
  assert.deepEqual(await fs.readFile(privatePath(f, 'drafts', itemId + '.json')), before);
  assert.equal((await phase84List(privatePath(f, 'drafts'))).length, 1);
  assert.equal((await f.raw()).manual_handoff.archive_item_id, itemId);
  assert.equal((await query(f, ids)).status, 'succeeded');
});

test('8.4 E04实际SIGKILL保留running回执、预留编号临时证据和逐册锁；重启不得清锁假恢复', {timeout: 45000}, async t => {
  const f = await createPhase84Fixture(t, {pages: 3});
  const detail = await f.approve(), ids = operation(), payload = f.transfer(detail);
  await f.holdReservedCheckpoint();
  const oldPid = f.childPid();
  const request = f.post(f.base + '/transfer', payload, ids).then(value => ({value}), error => ({error}));
  const held = await f.waitHeld();
  assert.equal(held.operationId, ids.operationId);
  assert.equal(held.stepId, ids.stepId);
  assert.match(held.itemId, /^LJM-\d{8}-RPR-\d{3}$/);
  const checkpointBytes = await fs.readFile(held.temporaryFile);
  const recordBeforeKill = await fs.readFile(f.file);
  const journalFile = privatePath(f, 'operations', ids.operationId + '.' + ids.stepId + '.json');
  assert.equal(JSON.parse(await fs.readFile(journalFile, 'utf8')).status, 'running');
  const bookLock = path.join(path.dirname(f.file), '..', '.' + f.id + '.lock');
  assert.equal((await fs.stat(bookLock)).isDirectory(), true);
  await f.crash();
  await request;
  const oldOwner = JSON.parse(await fs.readFile(privatePath(f, 'operations', 'owner.lock'), 'utf8'));
  assert.equal(oldOwner.pid, oldPid);
  await f.restart();
  const newOwner = JSON.parse(await fs.readFile(privatePath(f, 'operations', 'owner.lock'), 'utf8'));
  assert.equal(newOwner.pid, f.childPid());
  assert.notEqual(newOwner.pid, oldPid);
  assert.equal((await query(f, ids)).status, 'needs_review');
  assert.deepEqual(await fs.readFile(f.file), recordBeforeKill);
  assert.deepEqual(await fs.readFile(held.temporaryFile), checkpointBytes);
  assert.equal((await fs.stat(bookLock)).isDirectory(), true, '强杀后的逐册锁无owner证明，不能自行删除');
  const replay = await f.post(f.base + '/transfer', payload, ids);
  assert.equal(replay.status, 409, JSON.stringify(replay.body));
  const fresh = await f.post(f.base + '/transfer', payload);
  assert.equal(fresh.status, 409, JSON.stringify(fresh.body));
  assert.equal(fresh.body.code, 'OPERATION_NEEDS_REVIEW');
  const resolved = await f.post(f.base + '/resolve-operation', ids);
  assert.equal(resolved.status, 409, JSON.stringify(resolved.body));
  assert.equal((await query(f, ids)).status, 'needs_review');
  assert.deepEqual(await fs.readFile(held.temporaryFile), checkpointBytes);
  assert.equal((await phase84List(privatePath(f, 'drafts'))).length, 0);
});

test('8.4 Linux双JWT管理员并发交接200页阅读副本及官网线索，原号重启恢复且PDF仍关闭', {skip: process.platform !== 'linux' && '真实Linux部署锁与双管理员交接不得以Windows伪装平台替代', timeout: 180000}, async t => {
  for (const official of [false, true]) {
    await t.test(official ? '官网线索零页无档案' : '200页整册只生成一份', async sub => {
      const f = await createPhase84Fixture(sub, {online: true, pages: 200, official});
      const detail = await f.approve(), payload = f.transfer(detail), a = operation(), b = operation();
      const result = await Promise.all([
        f.post(f.base + '/transfer', payload, a),
        f.post(f.base + '/transfer', payload, b, {'cf-access-jwt-assertion': f.token({email: phase84SecondAdmin})})
      ]);
      assert.equal(result.filter(value => value.status === 200).length, 1, JSON.stringify(result));
      const index = result.findIndex(value => value.status === 200), saved = result[index], ids = index === 0 ? a : b;
      const headers = index === 0 ? {} : {'cf-access-jwt-assertion': f.token({email: phase84SecondAdmin})};
      const loserIndex = 1 - index, loser = result[loserIndex], loserIds = loserIndex === 0 ? a : b;
      const loserHeaders = loserIndex === 0 ? {} : {'cf-access-jwt-assertion': f.token({email: phase84SecondAdmin})};
      const assertSafeRejection = (rejection, allowFailedReplay = false) => {
        assert.equal(rejection.status, 409, JSON.stringify(rejection.body));
        const specific = ['投稿已变化，请重新读取后再转入。', '本册已有整理结果，请在已生成的草稿中继续维护，不能重新交接。'];
        const failedReplay = allowFailedReplay && rejection.body.replayed === true && rejection.body.code === 'REQUEST_FAILED'
          && rejection.body.error === '这项操作已经结束且未成功，请核对当前档案后发起新操作。';
        assert.ok(specific.includes(rejection.body.error) || failedReplay, JSON.stringify(rejection.body));
        assert.equal(rejection.body.operation?.status, 'failed');
        assert.equal(rejection.body.operation?.errorCode, 'REQUEST_FAILED');
        assert.equal(rejection.body.operation?.kind, 'manual-transfer');
        assert.equal(rejection.body.operation?.target, f.id);
        assert.equal(rejection.body.operation?.operationId, loserIds.operationId);
        assert.equal(rejection.body.operation?.stepId, loserIds.stepId);
      };
      if (loser.status === 423) {
        assert.equal(loser.body.code, 'MERGE_DEPLOYMENT_BUSY');
        assert.equal(loser.body.operation, undefined, '非阻塞部署锁应在入队前拒绝');
        assert.equal((await f.get('/api/operations/' + loserIds.operationId)).body.operations.length, 0);
      } else assertSafeRejection(loser);
      const proof = saved.body.operation.result.manualTransfer;
      assert.equal(proof.pages, official ? 0 : 200);
      assert.equal(proof.sharingScope, official ? 'official-link' : 'reading-copy');
      const r = await f.raw();
      assert.equal(r.manual_handoff.actor, index === 0 ? f.email : phase84SecondAdmin);
      if (official) {
        assert.equal(proof.itemId, null);
        assert.deepEqual(await phase84List(privatePath(f, 'drafts')), []);
        assert.deepEqual(await phase84List(privatePath(f, 'inbox')), []);
      } else {
        assert.equal((await phase84List(privatePath(f, 'drafts'))).length, 1);
        assert.equal((await phase84List(privatePath(f, 'inbox', proof.itemId))).length, 200);
        const draft = JSON.parse(await fs.readFile(privatePath(f, 'drafts', proof.itemId + '.json'), 'utf8'));
        assert.equal(draft.record.core.publication_file_path.length, 200);
        assert.deepEqual(draft.manual_submission.pages.map(page => page.page_id), r.versions.at(-1).images.map(page => page.page_id));
      }
      const catalogBeforeRetry = (await f.get('/api/manuals')).body.state.draft;
      const draftsBeforeRetry = await phase84List(privatePath(f, 'drafts'));
      const copiesBeforeRetry = official ? [] : await phase84List(privatePath(f, 'inbox', proof.itemId));
      const loserRetry = await f.post(f.base + '/transfer', payload, loserIds, loserHeaders);
      assertSafeRejection(loserRetry, true);
      assert.deepEqual((await f.get('/api/manuals')).body.state.draft, catalogBeforeRetry);
      assert.deepEqual(await phase84List(privatePath(f, 'drafts')), draftsBeforeRetry);
      assert.deepEqual(official ? [] : await phase84List(privatePath(f, 'inbox', proof.itemId)), copiesBeforeRetry);
      assert.equal((await f.raw()).manual_handoff.actor, index === 0 ? f.email : phase84SecondAdmin);
      await f.restart();
      const repeated = await f.post(f.base + '/transfer', payload, ids, headers);
      assert.equal(repeated.status, 200, JSON.stringify(repeated.body));
      assert.equal(repeated.body.replayed, true);
      assert.deepEqual(repeated.body.operation.result.manualTransfer, proof);
      assert.equal((await f.get('/healthz')).body.capabilities.manualPdfHandoffVersion, 0);
      assert.equal((await f.get('/healthz')).body.capabilities.manualPdfUploadVersion ?? 0, 0);
      assert.equal((await f.get('/api/account-admin/users')).status, 404);
    });
  }
});
