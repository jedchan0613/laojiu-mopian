import assert from 'node:assert/strict';
import test from 'node:test';
import { groupArchiveMatches } from '../../site/src/data/archive-browse.mjs';

const countItems = (groups) => groups.reduce((total, group) => total + group.memberIds.length, 0);

test('默认收拢相册，并保留相册首次命中与册内成员的输入顺序', () => {
  const records = [
    { id: 'B2', albumKey: 'album-b' },
    { id: 'X' },
    { id: 'A3', albumKey: 'album-a' },
    { id: 'B1', albumKey: 'album-b' },
    { id: 'Y' },
    { id: 'A1', albumKey: 'album-a' },
  ];

  assert.deepEqual(groupArchiveMatches(records), [
    { kind: 'album', key: 'album-b', memberIds: ['B2', 'B1'] },
    { kind: 'item', key: 'X', memberIds: ['X'] },
    { kind: 'album', key: 'album-a', memberIds: ['A3', 'A1'] },
    { kind: 'item', key: 'Y', memberIds: ['Y'] },
  ]);
});

test('真实件数按命中成员计算，不能使用收拢后的卡片数', () => {
  const groups = groupArchiveMatches([
    { id: 'P1', albumKey: 'album-a' },
    { id: 'P2', albumKey: 'album-a' },
    { id: 'P3', albumKey: 'album-a' },
    { id: 'X' },
  ]);

  assert.equal(groups.length, 2);
  assert.equal(countItems(groups), 4);
});

test('已逐件筛选的结果只收拢命中成员，不补入同册未命中成员', () => {
  const records = [
    { id: 'P1', albumKey: 'album-a' },
    { id: 'P2', albumKey: 'album-a' },
    { id: 'P3', albumKey: 'album-a' },
    { id: 'X' },
  ];
  const matchingRecords = records.filter(({ id }) => id === 'P2' || id === 'X');
  const groups = groupArchiveMatches(matchingRecords);

  assert.deepEqual(groups, [
    { kind: 'album', key: 'album-a', memberIds: ['P2'] },
    { kind: 'item', key: 'X', memberIds: ['X'] },
  ]);
  assert.equal(countItems(groups), 2);
});

test('items 模式将相册成员逐件显示，顺序与输入一致', () => {
  const groups = groupArchiveMatches([
    { id: 'P2', albumKey: 'album-a' },
    { id: 'X' },
    { id: 'P1', albumKey: 'album-a' },
  ], 'items');

  assert.deepEqual(groups, [
    { kind: 'item', key: 'P2', memberIds: ['P2'] },
    { kind: 'item', key: 'X', memberIds: ['X'] },
    { kind: 'item', key: 'P1', memberIds: ['P1'] },
  ]);
  assert.equal(countItems(groups), 3);
});

test('albums 模式仅显示有相册归属的命中成员，并保留首次出现顺序', () => {
  const groups = groupArchiveMatches([
    { id: 'X' },
    { id: 'B2', albumKey: 'album-b' },
    { id: 'A1', albumKey: 'album-a' },
    { id: 'Y', albumKey: '' },
    { id: 'B1', albumKey: 'album-b' },
  ], 'albums');

  assert.deepEqual(groups, [
    { kind: 'album', key: 'album-b', memberIds: ['B2', 'B1'] },
    { kind: 'album', key: 'album-a', memberIds: ['A1'] },
  ]);
  assert.equal(countItems(groups), 3);
});

test('空列表在各显示模式下均返回空结果', () => {
  for (const mode of ['grouped', 'items', 'albums']) {
    assert.deepEqual(groupArchiveMatches([], mode), []);
  }
  assert.deepEqual(groupArchiveMatches([]), []);
});

test('各显示模式都不修改输入数组或成员', () => {
  const records = Object.freeze([
    Object.freeze({ id: 'P2', albumKey: 'album-a' }),
    Object.freeze({ id: 'X' }),
    Object.freeze({ id: 'P1', albumKey: 'album-a' }),
  ]);
  const original = structuredClone(records);

  for (const mode of ['grouped', 'items', 'albums']) {
    groupArchiveMatches(records, mode);
    assert.deepEqual(records, original);
  }
});

test('重复 id 只计一次，并以首次出现的归属和顺序为准', () => {
  const records = [
    { id: 'P2', albumKey: 'album-a' },
    { id: 'X' },
    { id: 'P2', albumKey: 'album-b' },
    { id: 'P1', albumKey: 'album-a' },
    { id: 'X', albumKey: 'album-b' },
    { id: 'P1', albumKey: 'album-a' },
  ];
  const grouped = groupArchiveMatches(records);
  const items = groupArchiveMatches(records, 'items');
  const albums = groupArchiveMatches(records, 'albums');

  assert.deepEqual(grouped, [
    { kind: 'album', key: 'album-a', memberIds: ['P2', 'P1'] },
    { kind: 'item', key: 'X', memberIds: ['X'] },
  ]);
  assert.deepEqual(items, [
    { kind: 'item', key: 'P2', memberIds: ['P2'] },
    { kind: 'item', key: 'X', memberIds: ['X'] },
    { kind: 'item', key: 'P1', memberIds: ['P1'] },
  ]);
  assert.deepEqual(albums, [
    { kind: 'album', key: 'album-a', memberIds: ['P2', 'P1'] },
  ]);
  assert.equal(countItems(grouped), 3);
  assert.equal(countItems(items), 3);
  assert.equal(countItems(albums), 2);
});
