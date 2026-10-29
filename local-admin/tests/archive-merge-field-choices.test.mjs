import test from 'node:test';
import assert from 'node:assert/strict';
import { chooseMergeFieldSource, undoMergeFieldSource } from '../public/merge-field-choices.js';
import { fixture } from './helpers/merge-fixture.mjs';

const field = (path, extras = {}) => ({ path, readonly: false, allowedChoices: ['primary', 'secondary', 'custom'], defaultChoice: null, ...extras });

test('批量选主或从只修改允许编辑的取值，保护字段及附件选择保持', () => {
  const fields = [
    field('core.title'), field('public_view.transcription'), field('core.date_start'),
    field('core.item_id', { readonly: true }),
    field('core.collection_code', { readonly: true }),
    field('public_view.image_descriptions', { readonly: true }),
    field('masked', { allowedChoices: ['primary'] }),
  ];
  const choices = {
    'core.title': { choice: 'custom', value: '合成测试题名', reason: '合成依据' },
    'public_view.transcription': { choice: 'primary', reason: '保留逐页全文' },
    masked: { choice: 'primary' },
  };
  const order = ['image-2', 'image-1'], before = structuredClone({ fields, choices, order });
  const result = chooseMergeFieldSource(fields, choices, 'secondary');
  assert.equal(result.changed, 3);
  for (const path of ['core.title', 'public_view.transcription', 'core.date_start']) assert.deepEqual(result.choices[path], { choice: 'secondary' });
  for (const path of ['core.item_id', 'core.collection_code', 'public_view.image_descriptions']) assert.equal(Object.hasOwn(result.choices, path), false);
  assert.deepEqual(result.choices.masked, choices.masked);
  assert.deepEqual({ fields, choices, order }, before);
  assert.deepEqual(undoMergeFieldSource(result.choices, result.undo).choices, choices);
  const primary = chooseMergeFieldSource(fields, result.choices, 'primary');
  assert.equal(primary.changed, 3);
  assert.deepEqual(primary.choices['core.title'], { choice: 'primary' });
});

test('撤销精确恢复自定义值、依据、显式空值与原本缺失的选择', () => {
  const fields = ['text', 'array', 'number', 'boolean', 'null', 'unresolved'].map(path => field(path));
  const choices = {
    text: { choice: 'custom', value: '合成\n转录', reason: '逐页核对' },
    array: { choice: 'custom', value: ['合成甲', '合成乙'], reason: '去重' },
    number: { choice: 'custom', value: 0 }, boolean: { choice: 'custom', value: false },
    null: { choice: 'custom', value: null },
  };
  const before = structuredClone(choices), result = chooseMergeFieldSource(fields, choices, 'primary');
  choices.array.value.push('后来变动');
  assert.deepEqual(result.undo.before, before, '撤销快照不可共享可变引用');
  const undone = undoMergeFieldSource(result.choices, result.undo);
  assert.equal(undone.restored, 6); assert.equal(undone.kept, 0); assert.deepEqual(undone.choices, before);
  assert.equal(Object.hasOwn(undone.choices, 'unresolved'), false);
});

test('重复选择及隐含默认值不产生改动；拒绝非主从的批量操作', () => {
  const fields = [field('default', { defaultChoice: 'primary' }), field('chosen'), field('fixed', { readonly: true })];
  const choices = { chosen: { choice: 'primary', reason: '原依据' } };
  const repeated = chooseMergeFieldSource(fields, choices, 'primary');
  assert.equal(repeated.changed, 0); assert.equal(repeated.undo, null); assert.deepEqual(repeated.choices, choices);
  assert.equal(Object.hasOwn(repeated.choices, 'default'), false, '默认选择不增加冗余显式决策');
  assert.throws(() => chooseMergeFieldSource(fields, choices, 'union'), TypeError);
  const result = chooseMergeFieldSource(fields, choices, 'secondary');
  const again = chooseMergeFieldSource(fields, result.choices, 'secondary');
  assert.equal(again.changed, 0); assert.deepEqual(again.choices, result.choices);
});

test('撤销批量选择保留后来逐项编辑，连续主从选择仅撤销最近一次', () => {
  const fields = ['title', 'transcription', 'date'].map(path => field(path));
  const choices = { title: { choice: 'custom', value: '合成题名', reason: '原依据' } };
  const first = chooseMergeFieldSource(fields, choices, 'primary');
  const second = chooseMergeFieldSource(fields, first.choices, 'secondary');
  assert.deepEqual(undoMergeFieldSource(second.choices, second.undo).choices, first.choices);
  const later = { ...second.choices, transcription: { choice: 'custom', value: '后来逐项修订', reason: '新依据' }, extra: { choice: 'custom', value: '新字段编辑' } };
  const undone = undoMergeFieldSource(later, second.undo);
  assert.equal(undone.restored, 2); assert.equal(undone.kept, 1);
  assert.deepEqual(undone.choices.transcription, later.transcription); assert.deepEqual(undone.choices.extra, later.extra);
  assert.deepEqual(undone.choices.title, first.choices.title);
});

test('浏览器批量选择模块仅从管理地址提供，禁用线上合并时也禁止读取', async t => {
  const local = await fixture(t, { http: true });
  const asset = await fetch(local.origin + '/admin/merge-field-choices.js?v=1');
  assert.equal(asset.status, 200); assert.match(asset.headers.get('cache-control'), /no-store/);
  const online = await fixture(t, { http: true, online: true });
  assert.equal((await online.get('/admin/merge-field-choices.js')).status, 404);
});
