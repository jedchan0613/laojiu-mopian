import assert from 'node:assert/strict';
import test from 'node:test';
import {
  normalizeArchivePlace,
  isBrowseableArchivePlace,
  createArchivePlaceFacets,
} from '../../shared/archive-place-filters.mjs';

test('上海等明确城市别名归一，城市名称内部文字不被替换', () => {
  for (const name of ['上海', '北京', '天津', '重庆', '广州', '大连', '哈尔滨']) {
    assert.equal(normalizeArchivePlace(`${name}市`), name);
    assert.equal(normalizeArchivePlace(` ${name} `), name);
  }
  assert.equal(normalizeArchivePlace('上海大厦'), '上海大厦');
  assert.equal(normalizeArchivePlace('北京动物园'), '北京动物园');
});

test('不以剥离后缀的方式合并省、市、区、县或未登记地名', () => {
  for (const name of ['吉林省', '吉林市', '吉林', '朝阳市', '朝阳区', '朝阳县', '广东省', '广东']) {
    assert.equal(normalizeArchivePlace(name), name);
  }
  const first = createArchivePlaceFacets({ province: '吉林省', city: '吉林市', district: '朝阳区' });
  assert.deepEqual(first.values, ['吉林省', '吉林市', '朝阳区']);
});

test('未知地点和考证说明退出常规选项，正常地名保留', () => {
  const excluded = [
    '', '未知', '地点未知', '未知地点', '待核', '不详', '地点不详', '地点不明', '无法判断', '不确定', 'UNKNOWN', 'Unknown location', 'N/A',
    '整册地点待核；分件地点见照片档案',
    '北京动物园（仅本组第1图已确认）',
    '天安门前、天安门广场一带（第3、4图）',
    '旅顺友谊塔；青泥洼桥；明泽池',
    '工业博物馆（原照片题字）',
    '星海村浴场（历史题字）',
    '推定为广州', '可能在上海', 'https://example.invalid/place', '1989',
  ];
  for (const name of excluded) assert.equal(isBrowseableArchivePlace(name), false, name);
  for (const name of ['上海市', '大连锚地', '旅顺友谊塔', '雅加达港', 'St. Louis', '华盛顿（哥伦比亚特区）']) {
    assert.equal(isBrowseableArchivePlace(name), true, name);
  }
});

test('只调整展示选项，旧城市链接、未知链接和考证句链接仍有原值可匹配', () => {
  const note = '整册地点待核；分件地点见照片档案';
  const facets = createArchivePlaceFacets({ country: '中国', province: '未知', city: '上海市', specific_place: note });
  assert.deepEqual(facets.values, ['中国', '上海']);
  assert.deepEqual(facets.labels, { 中国: '中国', 上海: '上海' });
  for (const value of ['中国', '上海', '上海市', '未知', note]) assert.ok(facets.matchingValues.includes(value), value);
  assert.ok(facets.matchingValues.includes(normalizeArchivePlace(note)), '旧URL归一后仍可匹配原考证句');
});

test('同一档案多层重复地点只形成一个入口，中文标签采用相同规范名', () => {
  const facets = createArchivePlaceFacets({ province: '上海市', city: '上海', specific_place: '上海市' });
  assert.deepEqual(facets.values, ['上海']);
  assert.deepEqual(facets.labels, { 上海: '上海' });
  assert.deepEqual(facets.matchingValues, ['上海', '上海市']);
});

test('规范筛选值独立于页面语言，现有外语翻译继续显示', () => {
  const core = { country: '中国', city: '上海市', specific_place: '黄浦江畔' };
  const facets = createArchivePlaceFacets(core, { country: 'China', city: 'Shanghai', specific_place: 'Huangpu River waterfront' });
  assert.deepEqual(facets.values, ['中国', '上海', '黄浦江畔']);
  assert.deepEqual(facets.labels, { 中国: 'China', 上海: 'Shanghai', 黄浦江畔: 'Huangpu River waterfront' });
  assert.deepEqual(facets.matchingValues, ['中国', '上海', '黄浦江畔', '上海市']);
});

test('只读取约定的公开地点字段，不使用题名、备注或私人地址', () => {
  const facets = createArchivePlaceFacets({
    title: '标题不是地点', notes: '备注不是地点', address: '地址不是地点',
    country: '中国', city: '广州市',
  });
  assert.deepEqual(facets.values, ['中国', '广州']);
  assert.equal(JSON.stringify(facets).includes('不是地点'), false);
});

test('空输入与非文字字段安全返回，生成过程不修改任何输入', () => {
  assert.deepEqual(createArchivePlaceFacets(undefined), { values: [], labels: {}, matchingValues: [] });
  assert.deepEqual(createArchivePlaceFacets(null), { values: [], labels: {}, matchingValues: [] });
  const core = Object.freeze({ city: ' 上海市 ', country: undefined, district: 123, specific_place: ['上海'] });
  const localized = Object.freeze({ city: 'Shanghai' });
  const before = structuredClone(core);
  const facets = createArchivePlaceFacets(core, localized);
  assert.deepEqual(facets.values, ['上海']);
  assert.deepEqual(core, before);
  assert.equal(core.city, ' 上海市 ');
});
