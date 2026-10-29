import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { compareAlbumPositions } from '../../shared/album-position.mjs';
import { getDecade, getManagementStatus, sortDictionaryEntries } from '../../shared/archive-reference.mjs';

// 执行管理页真实函数，只注入合成记录与浏览器控件；不读写真实档案或启动发布流程。
const script = (await readFile(new URL('../public/app.js', import.meta.url), 'utf8')).replaceAll('\r\n', '\n');
const declaration = (name) => {
  const start = script.indexOf(`const ${name} =`);
  assert.notEqual(start, -1, name);
  if (name === 'recordIsWithdrawn') return script.slice(start, script.indexOf('\n', start));
  return script.slice(start, script.indexOf('\n\n', start));
};
const record = (id, type = 'PHO', albumId = '相册甲', extra = {}) => ({
  core: { item_id: id, object_type: type, album_id: albumId, title: `资料 ${id}`, record_status: 'ACT',
    date_display: '年代未知', use_status: 'U3', privacy_level: 'G', publication_file_path: [], ...extra },
  metadata: {}, public_view: {},
});
const setup = (records, overrides = {}) => {
  const state = { records, recordStatusFilter: 'normal', search: '', recordTypeFilter: '', recordDecadeFilter: '',
    recordQuickStatus: '', recordAlbumFilter: '', recordOpenAlbum: '', recordAlbumReturnState: null,
    recordBrowseNotice: '', recordBrowseMode: 'albums', recordSort: 'id-asc', recordPage: 1, recordPageSize: 15,
    recordFilters: { category: '', research: '', evidence: '', rights: '', imageStatus: '' },
    query: { records: [] }, dictionary: new Map(), current: null, activeId: null, isNew: false, dirty: false,
    translation: { dirty: false }, ...overrides };
  const elements = Object.fromEntries(['recordAlbumContext', 'recordAlbumFilter', 'recordBrowserNotice',
    'recordFiltersClear', 'recordCount', 'recordList', 'recordPagination', 'recordSearch', 'recordSort', 'previewLink']
    .map((key) => [key, { innerHTML: '', textContent: '', value: '', querySelector: () => null }]));
  elements.recordBrowseModes = { querySelectorAll: () => [] };
  const calls = [];
  const scope = {
    state, elements, compareAlbumPositions, getDecade, getManagementStatus, sortDictionaryEntries, albumAwareObjectTypes: new Set(['PHO', 'ALB']),
    curatedLetterAlbum: { id: 'LJM-CUR-MING-LETTERS', tag: '明的家书', title: '明的家书' },
    chineseCollator: new Intl.Collator('zh-CN'), hasUnsavedChanges: () => state.dirty || state.translation.dirty,
    sortedRecords: (items) => [...items], syncRecordToolOptions: () => {}, maintenanceTasksForRecord: () => [],
    queryCodeLabel: (_dictionary, value) => value, deepClone: structuredClone,
  };
  for (const name of ['renderWorkspaceNavigation', 'setMobileRecordBrowserOpen', 'updateHeader', 'renderEditor',
    'refreshInboxPendingBadge', 'refreshAdministrativeRegionOptions', 'syncRecordReferenceData', 'loadQueryRecords']) {
    scope[name] = (...args) => calls.push([name, ...args]);
  }
  scope.fetch = async () => ({ ok: true });
  scope.readApiJson = async () => ({ writeProtocol: 2, records: state.nextRecords ?? state.records });
  scope.loadAdminStandards = async () => ({ commonFields: { fields: [] }, codeDictionary: { entries: [] } });
  scope.publicPreviewUrl = (value) => value;
  scope.selectRecord = (itemId) => {
    state.activeId = itemId;
    state.current = structuredClone(state.records.find((entry) => entry.core.item_id === itemId));
    calls.push(['selectRecord', itemId]);
  };
  elements.recordAdvanced = { open: false };
  const names = ['escapeHtml', 'recordIsWithdrawn', 'statusLabel', 'recordStatusTone', 'recordDecade',
    'recordsInCurrentStatusTab', 'filteredRecords', 'recordAlbumId', 'compareAlbumRecords', 'buildAdminAlbumGroups',
    'recordBrowserEntries', 'recordImages', 'refreshAlbumBrowserActions', 'renderAlbumBrowserContext',
    'renderRecordAlbumCard', 'renderRecordList', 'openRecordAlbum', 'returnToRecordOverview', 'loadBootstrap'];
  const functions = new Function(...Object.keys(scope), `let pvCodeIndex;\n${names.map(declaration).join('\n')}\nreturn { ${names.join(',')} };`)(...Object.values(scope));
  return { ...functions, state, elements, calls };
};
const familyAlbum = () => [record('A', 'ALB'), ...Array.from({ length: 55 }, (_, index) =>
  record(`P${index + 1}`, 'PHO', '相册甲', { original_position: `第${index + 1}页` }))];

test('默认按册归集，1件总档案和55件照片仍计56件，分页仅按展示入口', () => {
  const records = [...familyAlbum(), record('L', 'LET'), record('S', 'PHO', '')];
  const before = structuredClone(records);
  const c = setup(records, { recordPageSize: 2 });
  const entries = c.recordBrowserEntries(c.filteredRecords(), c.recordsInCurrentStatusTab());
  assert.deepEqual(entries.map((entry) => entry.kind), ['album', 'record', 'record']);
  assert.equal(entries[0].group.members.length, 56);
  assert.equal(entries[0].matchedCount, 56);
  c.renderRecordList();
  assert.match(c.elements.recordCount.textContent, /正常档案 58 件/);
  assert.match(c.elements.recordCount.textContent, /1 册、2 件未归册档案/);
  assert.match(c.elements.recordList.innerHTML, /本册 56 件 · 当前命中 56 件/);
  assert.match(c.elements.recordList.innerHTML, /55 件照片档案/);
  assert.match(c.elements.recordPagination.innerHTML, /第 1 \/ 2 页/);
  assert.doesNotMatch(c.elements.recordList.innerHTML, /data-id="P1"/);
  c.state.recordPage = 2;
  c.renderRecordList();
  assert.match(c.elements.recordList.innerHTML, /data-id="S"/);
  assert.deepEqual(records, before);
});

test('先逐件匹配再归集，卡片保留全册总件数并准确显示当前命中件数', () => {
  const c = setup([...familyAlbum(), record('S', 'PHO', '')], { search: '资料 P55' });
  const matched = c.filteredRecords();
  assert.deepEqual(matched.map((entry) => entry.core.item_id), ['P55']);
  const [entry] = c.recordBrowserEntries(matched, c.recordsInCurrentStatusTab());
  assert.equal(entry.group.members.length, 56);
  assert.equal(entry.matchedCount, 1);
  c.renderRecordList();
  assert.match(c.elements.recordCount.textContent, /命中 1 \/ 57 件/);
  assert.match(c.elements.recordList.innerHTML, /本册 56 件 · 当前命中 1 件/);
  c.state.search = '';
  c.state.recordTypeFilter = 'PHO';
  assert.equal(c.recordBrowserEntries(c.filteredRecords(), c.recordsInCurrentStatusTab())[0].matchedCount, 55);
});

test('逐件模式和册内列表仍显示各件记录，册内按原始位置排序', () => {
  const c = setup([record('P10', 'PHO', '相册甲', { original_position: '第10页' }), record('A', 'ALB'),
    record('P2', 'PHO', '相册甲', { original_position: '第2页' }), record('L', 'LET')]);
  c.state.recordBrowseMode = 'records';
  assert.equal(c.recordBrowserEntries(c.filteredRecords(), c.recordsInCurrentStatusTab()).length, 4);
  c.openRecordAlbum('相册甲');
  assert.deepEqual(c.filteredRecords().map((entry) => entry.core.item_id), ['P10', 'A', 'P2']);
  c.renderRecordList();
  const markup = c.elements.recordList.innerHTML;
  assert.ok(markup.indexOf('data-id="A"') < markup.indexOf('data-id="P2"'));
  assert.ok(markup.indexOf('data-id="P2"') < markup.indexOf('data-id="P10"'));
  assert.doesNotMatch(markup, /data-id="L"|data-open-album/);
  assert.match(c.elements.recordCount.textContent, /本册命中 3 \/ 3 件/);
});

test('仅看相册按56件真实档案计数，散件不出现，退出后仍可逐件找回', () => {
  const c = setup([...familyAlbum(), record('L', 'LET'), record('S', 'PHO', '')], { recordBrowseMode: 'album-only' });
  assert.equal(c.filteredRecords().length, 56);
  c.renderRecordList();
  assert.match(c.elements.recordCount.textContent, /正常档案 56 件 · 展示 1 册/);
  assert.doesNotMatch(c.elements.recordList.innerHTML, /data-id="[LS]"/);
  c.state.recordBrowseMode='records';
  assert.equal(c.filteredRecords().length,58);
});

test('维护页按标签收拢信件，并保留逐件计数及原有照片册', () => {
  const tagged = (id, date) => ({ ...record(id, 'LET', ''),
    core: { ...record(id, 'LET', '').core, date_start: date },
    public_view: { tags: ['明的家书'] } });
  const records = [record('A', 'ALB'), tagged('L2', '1995-01-01'), tagged('L1', '1987-01-01'),
    record('U', 'LET', '')];
  const c = setup(records);
  const entries = c.recordBrowserEntries(c.filteredRecords(), c.recordsInCurrentStatusTab());
  assert.equal(entries.filter((entry) => entry.kind === 'album').length, 2);
  c.renderRecordList();
  assert.match(c.elements.recordCount.textContent, /正常档案 4 件/);
  assert.match(c.elements.recordList.innerHTML, /明的家书/);
  assert.match(c.elements.recordList.innerHTML, /2 件信件档案/);
  assert.doesNotMatch(c.elements.recordList.innerHTML, /暂无总档案/);
  c.openRecordAlbum('LJM-CUR-MING-LETTERS');
  assert.deepEqual(c.filteredRecords().map((entry) => entry.core.item_id), ['L2', 'L1']);
  c.renderRecordList();
  const markup = c.elements.recordList.innerHTML;
  assert.ok(markup.indexOf('data-id="L1"') < markup.indexOf('data-id="L2"'));
  assert.doesNotMatch(c.elements.recordAlbumContext.innerHTML, /new-photo|尚无相册总档案/);
});

test('正常、撤销与恢复草稿沿用既有分区语义，同一编号的正式快照不重复累计', () => {
  const restored = record('R', 'PHO', '相册甲', { record_status: 'WDR' });
  restored._admin = { hasDraft: true, officialSnapshot: record('R') };
  const c = setup([record('N'), record('W', 'ALB', '相册甲', { record_status: 'WDR' }), restored]);
  assert.deepEqual(c.recordsInCurrentStatusTab().map((entry) => entry.core.item_id), ['N', 'R']);
  assert.equal(c.recordBrowserEntries(c.filteredRecords(), c.recordsInCurrentStatusTab())[0].group.members.length, 2);
  c.state.recordStatusFilter = 'withdrawn';
  c.renderRecordList();
  assert.match(c.elements.recordCount.textContent, /已撤销档案 1 件/);
  assert.match(c.elements.recordList.innerHTML, /本册 1 件 · 当前命中 1 件/);
  c.openRecordAlbum('相册甲');
  assert.doesNotMatch(c.elements.recordAlbumContext.innerHTML, /data-album-browser-action="new-photo"/);
});

test('其他类型旧相册值及无效相册值不被收拢丢失，册卡文字会转义', () => {
  const c = setup([record('L', 'LET'), record('B', 'PHO', { invalid: true }), record('C', 'PHO', '坏\u0000编号'),
    record('A', 'ALB', '<册名>', { title: '<script>alert(1)</script>' })]);
  assert.deepEqual(c.recordBrowserEntries(c.filteredRecords(), c.recordsInCurrentStatusTab()).map((entry) => entry.kind),
    ['record', 'record', 'record', 'album']);
  c.renderRecordList();
  assert.match(c.elements.recordList.innerHTML, /&lt;script&gt;/);
  assert.match(c.elements.recordList.innerHTML, /data-open-album="&lt;册名&gt;"/);
  assert.doesNotMatch(c.elements.recordList.innerHTML, /<script>/);
});

test('进入和返回相册保留未保存原文、译文和图片状态，恢复总览筛选与页码', () => {
  const c = setup(familyAlbum(), { search: '资料', recordPage: 3, recordPageSize: 1, current: record('EDIT'), activeId: 'EDIT',
    dirty: true, translation: { dirty: true, draft: { title: '未保存译文' } }, images: [{ id: 'pending-upload' }] });
  c.state.recordFilters.rights = 'UNK';
  const editor = { current: c.state.current, translation: c.state.translation, images: c.state.images };
  c.openRecordAlbum('相册甲', { clearFilters: true });
  assert.equal(c.state.search, '');
  assert.equal(c.state.recordFilters.rights, '');
  c.returnToRecordOverview();
  assert.equal(c.state.search, '资料');
  assert.equal(c.state.recordFilters.rights, 'UNK');
  // 本例总览只有一册，页码在恢复后仍按现有规则夹在有效范围内。
  assert.equal(c.state.recordPage, 1);
  assert.equal(c.state.current, editor.current);
  assert.equal(c.state.translation, editor.translation);
  assert.equal(c.state.images, editor.images);
  assert.equal(c.state.dirty, true);
  assert.equal(c.state.translation.dirty, true);
  assert.ok(!c.calls.some(([name]) => name === 'selectRecord'));
});

test('保存改册号后仍保留刚保存的档案，原册列表与明确提示同时保留', async () => {
  const photo = record('P');
  const c = setup([photo], { recordOpenAlbum: '相册甲', current: structuredClone(photo), activeId: 'P' });
  c.state.nextRecords = [record('P', 'PHO', '相册乙')];
  await c.loadBootstrap('P', { keepSelectedRecord: true });
  assert.equal(c.state.activeId, 'P');
  assert.equal(c.state.current.core.album_id, '相册乙');
  assert.equal(c.state.recordOpenAlbum, '相册甲');
  assert.match(c.state.recordBrowseNotice, /现归入相册“相册乙”/);
  assert.equal(c.elements.recordBrowserNotice.hidden, false);
  assert.match(c.elements.recordCount.textContent, /本册命中 0 \/ 0 件/);
});

test('保存取消相册归属时保留活动档案并说明未归册，普通刷新保留原筛选语义', async () => {
  const c = setup([record('P')], { recordOpenAlbum: '相册甲', activeId: 'P' });
  c.state.nextRecords = [record('P', 'PHO', '')];
  await c.loadBootstrap('P', { keepSelectedRecord: true });
  assert.equal(c.state.activeId, 'P');
  assert.match(c.state.recordBrowseNotice, /已保存为未归册档案/);
  await c.loadBootstrap('P');
  assert.equal(c.state.activeId, null);
});
