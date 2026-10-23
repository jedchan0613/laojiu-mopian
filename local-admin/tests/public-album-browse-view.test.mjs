import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { stripTypeScriptTypes } from 'node:module';
import test from 'node:test';

const sourceUrl = (name) => new URL(`../../site/src/data/${name}`, import.meta.url);
const moduleUrl = (source) => `data:text/javascript;base64,${Buffer.from(stripTypeScriptTypes(source)).toString('base64')}`;

// 执行真实公开门禁、分组与年代汇总源码，不加载或改写生产档案。
const archiveViewSource = await readFile(sourceUrl('archive-view.ts'), 'utf8');
const publishedPredicate = archiveViewSource.match(/^export const isPublishedArchiveItem[^\r\n]+/m)?.[0];
assert.ok(publishedPredicate, '应能读取项目实际使用的公开门禁');
const groupSource = (await readFile(sourceUrl('album-groups.ts'), 'utf8'))
  .replace(/import \{ archiveItems, type ArchiveItem \} from '\.\/archive';/, 'const archiveItems = [];')
  .replace(/import \{ isPublishedArchiveItem \} from '\.\/archive-view';/, publishedPredicate);
const groupModuleUrl = moduleUrl(groupSource);

// 展示转换与本地化使用小型桩；如非公开资料进入展示转换，立即失败。
const createArchiveRecordViewStub = (item) => {
  if (item.core.record_status !== 'ACT' || item.core.use_status !== 'U3' || item.core.privacy_level !== 'G') {
    throw new Error('非公开资料进入了相册展示转换');
  }
  return {
    objectType: item.core.object_type,
    title: item.core.title,
    description: item.public_view.description,
    images: [...item.core.publication_file_path],
    imageDescriptions: [...item.public_view.image_descriptions],
  };
};
const translateStub = (text, _locale, values = {}) => text.replace(/\{(\d+)\}/g, (_, key) => String(values[key]));
const browseSource = (await readFile(sourceUrl('album-browse.ts'), 'utf8'))
  .replace(/import type \{ ArchiveItem \} from '\.\/archive';/, '')
  .replace(/import \{ buildAlbumGroups, albumDateSummary, curatedAlbumForId, curatedLetterAlbum \} from '\.\/album-groups';/, `import { buildAlbumGroups, albumDateSummary, curatedAlbumForId, curatedLetterAlbum } from '${groupModuleUrl}';`)
  .replace(/import \{ createArchiveRecordView \} from '\.\/archive-view';/, `const createArchiveRecordView = ${createArchiveRecordViewStub.toString()};`)
  .replace(/import \{ t, type Locale \} from '\.\.\/i18n\/ui';/, `const t = ${translateStub.toString()};`);
const { createAlbumBrowseViews } = await import(moduleUrl(browseSource));

const record = (id, objectType = 'PHO', core = {}, publicView = {}) => ({
  core: {
    item_id: id, object_type: objectType, album_id: '家庭相册',
    record_status: 'ACT', use_status: 'U3', privacy_level: 'G',
    title: `公开档案 ${id}`, date_display: '年代未知', publication_file_path: [], ...core,
  },
  metadata: {},
  public_view: { description: '', image_descriptions: [], ...publicView },
});

test('私密或未公开总册不提供标题、说明、封面与年代，封面只从公开照片回退', () => {
  for (const hiddenState of [
    { privacy_level: 'Y' }, { privacy_level: 'R' }, { use_status: 'U2' },
    { record_status: 'SUS' }, { record_status: 'WDR' },
  ]) {
    const hiddenAlbum = record('A-HIDDEN', 'ALB', {
      ...hiddenState, title: '禁止泄露的总册标题', date_display: '1800—1809年',
      publication_file_path: ['/private/forbidden-cover.jpg'],
    }, { description: '禁止泄露的总册说明', image_descriptions: ['禁止泄露的封面说明'] });
    const [view] = createAlbumBrowseViews([
      hiddenAlbum,
      record('P1', 'PHO', { date_display: '1987年' }),
      record('P2', 'PHO', { publication_file_path: ['/published/photo-2.jpg'] }, { image_descriptions: ['公开照片说明'] }),
    ], 'zh-CN');

    assert.equal(view.title, '相册 家庭相册');
    assert.equal(view.description, '');
    assert.equal(view.coverPath, '/published/photo-2.jpg');
    assert.equal(view.coverDescription, '公开照片说明');
    assert.equal(view.hasAlbumRecord, false);
    assert.deepEqual(view.memberIds, ['P1', 'P2']);
    assert.equal(view.recordCount, 2);
    assert.equal(view.photoCount, 2);
    assert.equal(view.imageCount, 1);
    assert.equal(view.albumCount, 0);
    assert.equal(view.albumImageCount, 0);
    assert.equal(view.dateSummary.range, '1987');
    assert.equal(view.dateSummary.unknownPhotoCount, 1);
    assert.doesNotMatch(JSON.stringify(view), /禁止泄露|private|1800|1809|A-HIDDEN/);
  }
});

test('公开总册优先提供标题和封面，档案件数、照片件数和照片附图数分别统计', () => {
  const [view] = createAlbumBrowseViews([
    record('P1', 'PHO', { date_display: '1980年', publication_file_path: ['/published/p1-front.jpg', '/published/p1-back.jpg'] }),
    record('Z-ALBUM', 'ALB', {
      title: '公开相册名称', date_display: '1900—2020年',
      publication_file_path: ['/published/album-front.jpg', '/published/album-back.jpg'],
    }, { description: '公开总册说明', image_descriptions: ['总册封面', '总册封底'] }),
    record('P2', 'PHO', { date_display: '1990年代', publication_file_path: ['/published/p2.jpg'] }),
    record('P3'),
  ], 'zh-CN');

  assert.equal(view.title, '公开相册名称');
  assert.equal(view.description, '公开总册说明');
  assert.equal(view.coverPath, '/published/album-front.jpg');
  assert.equal(view.coverDescription, '总册封面');
  assert.equal(view.hasAlbumRecord, true);
  assert.deepEqual(view.memberIds, ['P1', 'P2', 'P3', 'Z-ALBUM']);
  assert.equal(view.recordCount, 4);
  assert.equal(view.photoCount, 3);
  assert.equal(view.imageCount, 3);
  assert.equal(view.albumCount, 1);
  assert.equal(view.albumImageCount, 2);
  assert.equal(view.dateSummary.range, '1980—1999');
  assert.equal(view.dateSummary.photoCount, 3);
  assert.equal(view.dateSummary.unknownPhotoCount, 1);
  assert.equal(view.dateSummary.uncertainPhotoCount, 1);
});

test('信件选览使用主题说明与公开信件封面，不把非公开信件带入计数', () => {
  const taggedLetter = (id, changes = {}) => record(id, 'LET', {
    album_id: undefined, publication_file_path: ['/published/' + id + '.jpg'], ...changes,
  }, { tags: ['明的家书'], image_descriptions: ['信件公开副本'] });
  const views = createAlbumBrowseViews([
    taggedLetter('L1'), taggedLetter('L2', { privacy_level: 'Y', publication_file_path: ['/private/hidden.jpg'] }),
  ], 'zh-CN');
  const letterView = views.find((view) => view.isLetterCollection);
  assert.equal(letterView.title, '明的家书');
  assert.match(letterView.description, /网站的主题选览/);
  assert.deepEqual(letterView.memberIds, ['L1']);
  assert.equal(letterView.letterCount, 1);
  assert.equal(letterView.photoCount, 0);
  assert.equal(letterView.coverPath, '/published/L1.jpg');
  assert.doesNotMatch(JSON.stringify(letterView), /hidden|private|L2/);
});

test('照片主题选览使用主题说明与公开照片封面，实物相册归属优先于主题标签', () => {
  const taggedPhoto = (id, changes = {}, view = {}) => record(id, 'PHO', {
    album_id: undefined, publication_file_path: ['/published/' + id + '.jpg'], ...changes,
  }, { tags: ['上海旧影'], image_descriptions: ['照片公开副本'], ...view });
  const views = createAlbumBrowseViews([
    taggedPhoto('P1'),
    taggedPhoto('P2', { privacy_level: 'Y', publication_file_path: ['/private/hidden.jpg'] }),
    taggedPhoto('P3', { album_id: '家庭相册' }),
  ], 'zh-CN');
  const shanghaiView = views.find((view) => view.title === '上海旧影');
  assert.ok(shanghaiView, '应生成上海旧影主题选览');
  assert.match(shanghaiView.description, /网站的主题选览/);
  assert.deepEqual(shanghaiView.memberIds, ['P1']);
  assert.equal(shanghaiView.photoCount, 1);
  assert.equal(shanghaiView.isLetterCollection, false);
  assert.equal(shanghaiView.coverPath, '/published/P1.jpg');
  assert.doesNotMatch(JSON.stringify(shanghaiView), /hidden|private|P2|P3/);
  const physicalView = views.find((view) => view.title === '相册 家庭相册');
  assert.deepEqual(physicalView.memberIds, ['P3'], '有实物相册归属的照片不进入主题选览');
});

test('公开总册没有图片时保留总册文字，并回退到首个有图的公开照片', () => {
  const [view] = createAlbumBrowseViews([
    record('P2', 'PHO', { publication_file_path: ['/published/p2.jpg'] }, { image_descriptions: ['照片封面说明'] }),
    record('A1', 'ALB', { title: '无图总册' }, { description: '总册文字' }),
    record('P1'),
  ], 'zh-CN');

  assert.equal(view.title, '无图总册');
  assert.equal(view.description, '总册文字');
  assert.equal(view.coverPath, '/published/p2.jpg');
  assert.equal(view.coverDescription, '照片封面说明');
  assert.equal(view.hasAlbumRecord, true);
});

test('只有公开总册而没有照片时仍可展示，照片与附图计数为零', () => {
  const [view] = createAlbumBrowseViews([
    record('A1', 'ALB', {
      title: '只有总册', date_display: '1920年',
      publication_file_path: ['/published/album-front.jpg', '/published/album-back.jpg'],
    }, { image_descriptions: ['总册封面'] }),
  ], 'zh-CN');

  assert.equal(view.title, '只有总册');
  assert.equal(view.coverPath, '/published/album-front.jpg');
  assert.equal(view.hasAlbumRecord, true);
  assert.deepEqual(view.memberIds, ['A1']);
  assert.equal(view.recordCount, 1);
  assert.equal(view.photoCount, 0);
  assert.equal(view.imageCount, 0);
  assert.equal(view.dateSummary.range, '');
  assert.equal(view.dateSummary.photoCount, 0);
  assert.equal(view.dateSummary.unknownPhotoCount, 0);
});

test('全册无图时封面为空，仍保留公开档案与照片件数', () => {
  const [view] = createAlbumBrowseViews([record('A1', 'ALB'), record('P1')], 'zh-CN');

  assert.equal(view.coverPath, undefined);
  assert.equal(view.coverDescription, undefined);
  assert.equal(view.recordCount, 2);
  assert.equal(view.photoCount, 1);
  assert.equal(view.imageCount, 0);
  assert.equal(view.dateSummary.unknownPhotoCount, 1);
});

test('17幅整册附件始终计1件ALB，照片计数与整册影像数分开且排除未公开总册', () => {
  const paths = Array.from({ length: 17 }, (_, i) => `/published/page-${i + 1}.jpg`);
  for (const locale of ['zh-CN', 'en', 'th', 'ja', 'ko', 'zh-Hant']) {
    const [view] = createAlbumBrowseViews([
      record('WHOLE-ALBUM', 'ALB', { publication_file_path: paths }),
      record('PRIVATE-ALBUM', 'ALB', { privacy_level: 'R', publication_file_path: ['/private/hidden.jpg'] }),
    ], locale);
    assert.equal(view.recordCount, 1);
    assert.equal(view.albumCount, 1);
    assert.equal(view.albumImageCount, 17);
    assert.equal(view.photoCount, 0);
    assert.equal(view.imageCount, 0);
    assert.deepEqual(view.memberIds, ['WHOLE-ALBUM']);
    assert.doesNotMatch(JSON.stringify(view), /private|PRIVATE/);
  }
});

test('不公开的照片和其他对象不进入成员、封面、计数或年代汇总', () => {
  const [view] = createAlbumBrowseViews([
    record('P-PUBLIC', 'PHO', { date_display: '2001年' }),
    record('P-PRIVATE', 'PHO', { privacy_level: 'Y', date_display: '1900年', publication_file_path: ['/private/hidden-photo.jpg'] }),
    record('P-DRAFT', 'PHO', { use_status: 'U2', date_display: '1910年' }),
    record('P-WITHDRAWN', 'PHO', { record_status: 'WDR', date_display: '1920年' }),
    record('NEGATIVE', 'NEG', { date_display: '1930年', publication_file_path: ['/published/negative.jpg'] }),
    record('POSTCARD', 'PCD', { date_display: '1940年' }),
  ], 'zh-CN');

  assert.deepEqual(view.memberIds, ['P-PUBLIC']);
  assert.equal(view.coverPath, undefined);
  assert.equal(view.recordCount, 1);
  assert.equal(view.photoCount, 1);
  assert.equal(view.imageCount, 0);
  assert.equal(view.dateSummary.range, '2001');
  assert.doesNotMatch(JSON.stringify(view), /PRIVATE|DRAFT|WITHDRAWN|NEGATIVE|POSTCARD|private/);
});

test('空输入或不存在公开相册分组时返回空列表', () => {
  assert.deepEqual(createAlbumBrowseViews([], 'zh-CN'), []);
  assert.deepEqual(createAlbumBrowseViews([
    record('NO-ALBUM', 'PHO', { album_id: '' }),
    record('BLANK-ALBUM', 'ALB', { album_id: '   ' }),
    record('PRIVATE-ALBUM', 'ALB', { privacy_level: 'R' }),
    record('OTHER', 'OTH'),
  ], 'zh-CN'), []);
});

test('展示数据生成不修改输入，包括公开图片数组与未公开资料', () => {
  const freeze = (value) => {
    if (value && typeof value === 'object') {
      for (const child of Object.values(value)) freeze(child);
      Object.freeze(value);
    }
    return value;
  };
  const items = freeze([
    record('P2', 'PHO', { date_display: '约1990年', publication_file_path: ['/published/p2.jpg'] }, { image_descriptions: ['公开图片'] }),
    record('A1', 'ALB', { title: '公开总册' }),
    record('P1'),
    record('PRIVATE', 'ALB', { privacy_level: 'Y', publication_file_path: ['/private/hidden.jpg'] }),
  ]);
  const original = structuredClone(items);
  const views = createAlbumBrowseViews(items, 'zh-CN');

  assert.deepEqual(items, original);
  assert.deepEqual(createAlbumBrowseViews(items, 'zh-CN'), views);
  views[0].memberIds.push('OUTPUT-ONLY');
  assert.deepEqual(items, original);
  assert.deepEqual(createAlbumBrowseViews(items, 'zh-CN')[0].memberIds, ['A1', 'P1', 'P2']);
});
