import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { getMergeExecutionReadiness } from '../public/merge-execution-confirmation.js';
import { fixture } from './helpers/merge-fixture.mjs';

const now = Date.parse('2026-10-29T10:00:00.000Z');
const input = overrides => ({ review: { primaryId: 'LJM-20000101-LET-001', expiresAt: '2026-10-29T10:05:00.000Z' },
  confirmPrimaryId: 'LJM-20000101-LET-001', confirmations: Array(13).fill(true),
  publicationAuthorization: { publishMergedPrimary: true, withdrawSecondary: true }, now, ...overrides });

test('15项全勾仍须实际填写保留编号，错误编号明确提示，首尾空格可忽略', () => {
  const empty = getMergeExecutionReadiness(input({ confirmPrimaryId: '' }));
  assert.equal(empty.ready, false); assert.equal(empty.canSelectChecks, true);
  assert.ok(empty.reasons.some(text => text.includes('填写将保留的完整编号')));
  const wrong = getMergeExecutionReadiness(input({ confirmPrimaryId: 'LJM-20000101-LET-002' }));
  assert.equal(wrong.ready, false); assert.ok(wrong.reasons.some(text => text.includes('不一致')));
  assert.equal(getMergeExecutionReadiness(input({ confirmPrimaryId: '  LJM-20000101-LET-001\n' })).ready, true);
});

test('完整13项与两项发布授权都必须为true，未勾数量准确', () => {
  const confirmations = Array(13).fill(true); confirmations[0] = false; confirmations[12] = false;
  const result = getMergeExecutionReadiness(input({ confirmations }));
  assert.equal(result.ready, false); assert.equal(result.missingChecks, 2); assert.ok(result.reasons.some(text => text.includes('还有2项')));
  for (const list of [[], Array(12).fill(true), Array(14).fill(true), null]) {
    const missing = getMergeExecutionReadiness(input({ confirmations: list }));
    assert.equal(missing.ready, false); assert.equal(missing.completeChecklist, false);
  }
  for (const value of [false, 1, 'true', null]) {
    const list = Array(13).fill(true); list[5] = value;
    assert.equal(getMergeExecutionReadiness(input({ confirmations: list })).ready, false);
  }
  for (const name of ['publishMergedPrimary', 'withdrawSecondary']) {
    for (const value of [false, undefined, 'true']) {
      const publicationAuthorization = { publishMergedPrimary: true, withdrawSecondary: true, [name]: value };
      assert.equal(getMergeExecutionReadiness(input({ publicationAuthorization })).ready, false);
    }
  }
});

test('过期边界、无效时间、缺少核对和未完成请求均阻止再次执行', () => {
  const expiresAt = new Date(now).toISOString();
  assert.equal(getMergeExecutionReadiness(input({ review: { ...input().review, expiresAt } })).expired, true);
  assert.equal(getMergeExecutionReadiness(input({ now: now + 300000 })).ready, false);
  for (const value of ['无效时间', '', undefined, null, Infinity]) {
    const blocked = getMergeExecutionReadiness(input({ review: { ...input().review, expiresAt: value } }));
    assert.equal(blocked.ready, false); assert.equal(blocked.canSelectChecks, false);
  }
  for (const overrides of [{ review: null }, { now: NaN }, { pending: { id: 'synthetic' } }, { executing: true }]) {
    const blocked = getMergeExecutionReadiness(input(overrides));
    assert.equal(blocked.ready, false); assert.equal(blocked.canSelectChecks, false);
  }
  assert.equal(getMergeExecutionReadiness(input()).ready, true);
});

test('确认计算只读且不自动补编号或勾选，默认页面要求实际输入', async () => {
  const value = input({ confirmPrimaryId: '', confirmations: Array(13).fill(false), publicationAuthorization: { publishMergedPrimary: false, withdrawSecondary: false } }), before = structuredClone(value);
  getMergeExecutionReadiness(value); assert.deepEqual(value, before);
  const html = await fs.readFile(new URL('../public/merge.html', import.meta.url), 'utf8');
  const confirmationInput = html.match(/<input\s+id="merge-primary-confirm"[^>]*>/)?.[0];
  assert.ok(confirmationInput); assert.match(confirmationInput, /\brequired(?:\s|>)/); assert.doesNotMatch(confirmationInput, /\bvalue=/);
  assert.match(html, /id="merge-primary-expected"/);
  for (const id of ['authorize-primary', 'authorize-secondary']) {
    const tag = html.match(new RegExp('<input\\s+type="checkbox"\\s+id="'+id+'"[^>]*>'))?.[0];
    assert.ok(tag, id); assert.doesNotMatch(tag, /\bchecked/);
  }
});

test('确认模块只经私密管理地址提供，线上关闭合并时拒绝访问', async t => {
  const local = await fixture(t, { http: true });
  const response = await fetch(local.origin + '/admin/merge-execution-confirmation.js?v=1');
  assert.equal(response.status, 200); assert.match(response.headers.get('cache-control'), /no-store/);
  const online = await fixture(t, { http: true, online: true });
  assert.equal((await online.get('/admin/merge-execution-confirmation.js')).status, 404);
});
