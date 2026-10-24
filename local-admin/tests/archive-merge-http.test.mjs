import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fixture, operation } from './helpers/merge-fixture.mjs';

test('HTTP保存幂等、版本冲突、结果找回及正式记录隔离', async t => {
  const f = await fixture(t, { http: true });
  const before = await Promise.all(f.ids.map(id => fs.readFile(path.join(f.archive, id + '.json'), 'utf8')));
  const checked = await f.post('/api/merge-preflight', { itemIds: f.ids });
  assert.equal(checked.status, 200); assert.equal(checked.body.canCompare, true, JSON.stringify(checked.body.blockers));
  assert.match(checked.headers.get('cache-control'), /no-store/);
  const payload = f.payload(checked.body), op = operation();
  const saved = await f.post('/api/merge-plan', payload, op); assert.equal(saved.status, 200, JSON.stringify(saved.body));
  assert.equal(saved.body.plan.privacyReviewCompleted, false); assert.equal(saved.body.canExecute, false);
  const replay = await f.post('/api/merge-plan', payload, op); assert.equal(replay.status, 200); assert.equal(replay.body.plan.planId, saved.body.plan.planId);
  assert.equal(replay.body.plan.planRevision, 1);
  const found = await f.get(`/api/merge-plans/by-operation/${op.operationId}/${op.stepId}`); assert.equal(found.body.plan.planId, saved.body.plan.planId);
  const receipt = await f.get('/api/operations/' + op.operationId); const text = JSON.stringify(receipt.body);
  assert.ok(!text.includes('虚构同一封信')); assert.ok(!text.includes('sourceRecords')); assert.ok(!text.includes('fieldChoices'));
  const changed = await f.post('/api/merge-plan', { ...payload, sourceReason: '另一份内容' }, op); assert.equal(changed.status, 409);
  assert.equal((await f.get('/api/merge-plans')).body.plans.length, 1);
  const detail = await f.get('/api/merge-plans/' + saved.body.plan.planId); assert.equal(detail.body.stale, false);
  assert.equal((await f.post('/api/merge', payload)).status, 501);
  assert.equal((await f.post('/api/merge-undo', payload)).status, 501);
  assert.deepEqual(await Promise.all(f.ids.map(id => fs.readFile(path.join(f.archive, id + '.json'), 'utf8'))), before);
  for (const name of ['drafts', 'history', 'recycle']) assert.equal((await fs.readdir(path.join(f.privateRoot, name)).catch(() => [])).length, 0);
  const privateNames = await fs.readdir(f.directory); assert.deepEqual(privateNames.sort(), ['plan-operations', 'plans', 'versions']);
});

test('HTTP拒绝跨站和缺失协议、伪造操作者；异常不会触及正式记录', async t => {
  const f = await fixture(t, { http: true });
  assert.equal((await f.post('/api/merge-preflight', { itemIds: f.ids }, null, { origin: 'https://foreign.example' })).status, 403);
  assert.equal((await f.post('/api/merge-preflight', { itemIds: f.ids }, null, { 'x-ljm-admin-request': '' })).status, 403);
  assert.equal((await f.post('/api/merge-preflight', { itemIds: f.ids, actor: 'fake-admin' })).status, 400);
  const pf = (await f.post('/api/merge-preflight', { itemIds: f.ids })).body;
  assert.equal((await f.post('/api/merge-plan', f.payload(pf), null)).status, 428);
  assert.equal((await f.post('/api/merge-plan', { ...f.payload(pf), actor: 'fake-admin' })).status, 422);
  assert.equal((await f.post('/api/merge-plan', null)).status, 400);
  const html = await fetch(f.origin + '/admin/merge.html'); assert.equal(html.status, 200); assert.match(html.headers.get('cache-control'), /no-store/);
  assert.equal((await f.get('/api/merge-plans')).body.plans.length, 0);
});

test('线上模式：经过真实签名验证仍不开放第一阶段页面或接口', async t => {
  const f = await fixture(t, { http: true, online: true });
  assert.equal((await f.get('/api/merge-plans', { 'cf-access-jwt-assertion': '' })).status, 403);
  for (const route of ['/api/merge-plans', '/admin/merge.html', '/admin/merge.js', '/admin/merge.css']) {
    const response = await f.get(route); assert.equal(response.status, 404, JSON.stringify(response.body));
  }
  for (const route of ['/api/merge-preflight', '/api/merge-plan', '/api/merge', '/api/merge-undo']) assert.equal((await f.post(route, { itemIds: f.ids })).status, 404);
  await assert.rejects(fs.stat(f.directory), { code: 'ENOENT' });
});
