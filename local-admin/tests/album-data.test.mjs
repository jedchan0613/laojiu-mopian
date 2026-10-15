import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { stripTypeScriptTypes } from 'node:module';
import test from 'node:test';
import {
  parseAlbumPosition, compareAlbumPositions, albumPositionIdentity,
} from '../../site/src/data/album-position.mjs';

// Node原生去除类型，注入小型测试档案；执行真实分组源码，不加载生产档案或改写它们。
const groupSource = (await readFile(new URL('../../site/src/data/album-groups.ts', import.meta.url), 'utf8'))
  .replace(/import \{ archiveItems, type ArchiveItem \} from '\.\/archive';/, 'const archiveItems = [];')
  .replace(/import \{ isPublishedArchiveItem \} from '\.\/archive-view';/, `const isPublishedArchiveItem = (item) => item.core.record_status === 'ACT' && item.core.use_status === 'U3' && item.core.privacy_level === 'G';`);
const groups = await import(`data:text/javascript;base64,${Buffer.from(stripTypeScriptTypes(groupSource)).toString('base64')}`);
const record = (id, objectType = 'PHO', overrides = {}) => ({
  core: { item_id: id, object_type: objectType, album_id: '家庭 相册_01', record_status: 'ACT', use_status: 'U3', privacy_level: 'G', date_display: '年代未知', ...overrides },
  metadata: {}, public_view: { tags: [] },
});

test('相册只分组 ACT/G/U3 的 PHO 与 ALB，照片计数不包括底片、明信片、私密或撤销资料', () => {
  const items = [record('A', 'ALB'), record('P1'), record('N1', 'NEG'), record('S1', 'SLD'), record('PC1', 'PCD'),
    record('P2', 'PHO', { privacy_level: 'Y' }), record('P3', 'PHO', { use_status: 'U2' }),
    record('P4', 'PHO', { record_status: 'WDR' }), record('P5', 'PHO', { record_status: 'SUS' })];
  const [group] = groups.buildAlbumGroups(items);
  assert.deepEqual(group.members.map((item) => item.core.item_id), ['A', 'P1']);
  assert.equal(group.albums.length, 1);
  assert.equal(group.photos.length, 1);
  assert.equal(groups.albumPhotoCount(items), 1);
});

test('明的家书按信件标签归集，仅公开信件进入选览，且不改变照片计数', () => {
  const letter = (id, overrides = {}, tags = ['明的家书']) => ({
    ...record(id, 'LET', { album_id: undefined, ...overrides }),
    public_view: { tags },
  });
  const items = [letter('L1'), letter('L2', { privacy_level: 'Y' }),
    letter('L3', {}, ['别的标签']), letter('L4', { record_status: 'WDR' }),
    record('P1', 'PHO', { album_id: '照片册' })];
  const groupsById = new Map(groups.buildAlbumGroups(items).map((group) => [group.albumId, group]));
  const letters = groupsById.get(groups.curatedLetterAlbum.id);
  assert.deepEqual(letters.members.map((item) => item.core.item_id), ['L1']);
  assert.equal(letters.photos.length, 0);
  assert.equal(letters.letters.length, 1);
  assert.deepEqual(groupsById.get('照片册').members.map((item) => item.core.item_id), ['P1']);
});

test('旧相册编号不会因为中文、空格、下划线丢失，路径稳定且不会变成公开私密目录名', () => {
  for (const albumId of ['家庭 相册_01', 'FSA-A0001', 'drafts', '../private', 'a/b', 'ALB_01']) {
    const [group] = groups.buildAlbumGroups([record('P1', 'PHO', { album_id: albumId })]);
    assert.equal(group.albumId, albumId);
    assert.match(group.slug, /^a-[a-f0-9]{64}$/);
    assert.equal(group.href, groups.albumHref(albumId));
    assert.equal(group.href, groups.albumHref(` ${albumId} `));
  }
  assert.notEqual(groups.albumHref('A'), groups.albumHref('a'));
  assert.deepEqual(groups.buildAlbumGroups([record('P1', 'PHO', { album_id: ' ' }), record('P2', 'PHO', { album_id: 1 }), record('P3', 'PHO', { album_id: 'bad\u0000id' })]), []);
});

test('分组不修改输入，输入顺序变化不改变总册候选与成员顺序', () => {
  const items = [record('A2', 'ALB'), record('P2'), record('A1', 'ALB'), record('P1')];
  const before = JSON.stringify(items);
  const [group] = groups.buildAlbumGroups(items);
  assert.deepEqual(group.members.map((item) => item.core.item_id), ['A1', 'A2', 'P1', 'P2']);
  assert.deepEqual(groups.buildAlbumGroups([...items].reverse()), [group]);
  assert.equal(group.albums.length, 2);
  assert.equal(JSON.stringify(items), before);
});

test('页序识别中文、全角、页内张序和封面，不把编号或年份当页码', () => {
  assert.equal(parseAlbumPosition('第三页右上').page, 3);
  assert.equal(parseAlbumPosition('第十二頁左下').page, 12);
  assert.equal(parseAlbumPosition('第１０页第２张').photoNumber, 2);
  assert.equal(parseAlbumPosition('第3页左侧第2张').photoNumber, 2);
  assert.equal(parseAlbumPosition('相册编号A003 第2张').kind, 'unknown');
  assert.equal(parseAlbumPosition('1993年合影').kind, 'unknown');
  assert.equal(parseAlbumPosition('封面2019').kind, 'front-cover');
  assert.equal(parseAlbumPosition('第3—4页左上').kind, 'unknown');
  assert.equal(parseAlbumPosition('第3页、4页').kind, 'unknown');
  assert.equal(parseAlbumPosition('第0页右上').kind, 'unknown');
  assert.equal(parseAlbumPosition('第999999999999999999999页').kind, 'unknown');
  assert.equal(parseAlbumPosition(null).kind, 'empty');
});

test('页序按封面、数字页码、页内位置与张序、封底、待考、空白排序', () => {
  const entries = ['待考', '', '封底', '第10页', '第3页第10张', '第3页第2张', '第3页左下', '第三页右上', '第3页左上', '第2页全页', '封面'];
  assert.deepEqual(entries.sort(compareAlbumPositions), ['封面', '第2页全页', '第3页左上', '第三页右上', '第3页左下', '第3页第2张', '第3页第10张', '第10页', '封底', '待考', '']);
});

test('重复位置只识别唯一页内位置，不误报整页/页码/封面，并保留左右侧区别', () => {
  assert.equal(albumPositionIdentity('第3页右上'), albumPositionIdentity('第三页右上'));
  assert.equal(albumPositionIdentity('3-2'), albumPositionIdentity('第三页第2张'));
  assert.notEqual(albumPositionIdentity('第3页左侧第2张'), albumPositionIdentity('第3页右侧第2张'));
  for (const value of ['第3页', '第3页全页', '第3页整页', '封面', '封二', '第3页左上和右上', '第3页第2张和第3张', '待考', '']) assert.equal(albumPositionIdentity(value), null, value);
});

test('年代汇总读取照片所有起终点/显示年份，年代区间标不确定，不继承总册年代', () => {
  const items = [record('A', 'ALB', { date_display: '1900—2000年' }),
    record('P1', 'PHO', { date_display: '约1989—1993年', date_start: '1989-01-01', date_end: '1994-12-31' }),
    record('P2', 'PHO', { date_display: '20世纪80年代' }), record('P3'),
    record('P4', 'PHO', { date_display: '1950年代', privacy_level: 'Y' })];
  const summary = groups.albumDateSummary(items);
  assert.equal(summary.range, '1980—1994');
  assert.equal(summary.photoCount, 3);
  assert.equal(summary.unknownPhotoCount, 1);
  assert.equal(summary.uncertainPhotoCount, 2);
  assert.deepEqual(summary.knownYears, [1980, 1989, 1993, 1994]);
  assert.equal(items[3].core.date_display, '年代未知');
  assert.equal(groups.albumDateSummary([items[0], items[3]]).range, '');
});
