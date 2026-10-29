import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import {
	getDecade, getDecadeOptions, sortDictionaryEntries, getArchiveCategoryOptions,
	getArchiveTypeOrder, compareReferenceValues, managementStatusOrder, getManagementStatus,
} from '../../shared/archive-reference.mjs';

const categories = JSON.parse(await readFile(new URL('../../site/src/data/archive-categories.json', import.meta.url), 'utf8')).categories;
const dictionarySource = JSON.parse(await readFile(new URL('../../site/src/data/standards/code-dictionary.json', import.meta.url), 'utf8'));
const freeze = (value) => {
	if (value && typeof value === 'object') {
		Object.values(value).forEach(freeze);
		Object.freeze(value);
	}
	return value;
};

test('分类与精确类型从同一七类来源读取，管理和公开结构得到相同顺序且不改原值', () => {
	const source = freeze(structuredClone(categories));
	const before = structuredClone(source);
	const options = getArchiveCategoryOptions(source);
	assert.deepEqual(options.map(({ label }) => label), ['老照片', '明信片', '信件', '老证件', '旧卡片', '笔记与笔记本', '其他旧物']);
	assert.deepEqual(getArchiveTypeOrder(source), ['PHO', 'NEG', 'SLD', 'ALB', 'PST', 'PCD', 'LET', 'IDC', 'CRD', 'DIA', 'NTB', 'RPR', 'OTH']);
	assert.deepEqual(getArchiveCategoryOptions(source.map(({ object_types, ...entry }) => ({ ...entry, objectTypes: object_types }))), options);
	options[0].objectTypes.push('TEST');
	assert.deepEqual(source, before, '生成选项必须复制数组，不得写回正式分类');
});

test('字典顺序使用正式sort，排除停用项，同序项稳定且不重排来源数组', () => {
	const source = freeze([
		{ code: 'late', sort: 20 }, { code: 'early', sort: 1 },
		{ code: 'same-1', sort: 2 }, { code: 'disabled', sort: 0, enabled: false },
		{ code: 'same-2', sort: 2 }, { code: 'unsorted' },
	]);
	const before = structuredClone(source);
	assert.deepEqual(sortDictionaryEntries(source).map(({ code }) => code), ['early', 'same-1', 'same-2', 'late', 'unsorted']);
	assert.deepEqual(source, before);
	assert.deepEqual(['UNK10', 'B', 'A', 'UNK2'].sort((left, right) => compareReferenceValues(left, right, ['B', 'A'])), ['B', 'A', 'UNK2', 'UNK10']);
});

test('年代统一按显示年代提取，去重后由早到晚，未知始终在最后', () => {
	assert.equal(getDecade('约1999年5月6日'), '1990');
	assert.equal(getDecade('1888—1910年'), '1880');
	assert.equal(getDecade('年代未知'), undefined);
	assert.equal(getDecade('清末待考'), undefined);
	assert.equal(getDecade(undefined), undefined);
	const dates = freeze(['约2008年', '1999', '', '1888年', '1992年', '年代未知']);
	assert.deepEqual(getDecadeOptions(dates), [
		{ value: '1880', label: '1880年代' }, { value: '1990', label: '1990年代' },
		{ value: '2000', label: '2000年代' }, { value: 'unknown', label: '年代未知' },
	]);
	assert.deepEqual(getDecadeOptions([]), [{ value: 'unknown', label: '年代未知' }]);
});

test('管理列表与结构化查询使用相同状态优先级，恢复与未发布修改不被已发布掩盖', () => {
	const cases = [
		[{ core: { use_status: 'U3' }, _admin: { restoredFromWithdrawal: true, hasDraft: true, hasOfficial: true } },
			{ use_status: 'U3', restored_from_withdrawal: true, has_draft: true, has_official: true }, '恢复草稿'],
		[{ core: { use_status: 'U3' }, _admin: { hasDraft: true, hasOfficial: true } },
			{ use_status: 'U3', has_draft: true, has_official: true }, '有未发布修改'],
		[{ core: { record_status: 'WDR' }, _admin: { hasDraft: true, hasOfficial: false } },
			{ record_status: 'WDR', has_draft: true, has_official: false }, '草稿'],
		[{ core: { record_status: 'WDR', use_status: 'U3' } }, { record_status: 'WDR', is_published: true }, '已撤销'],
		[{ core: { use_status: 'U3' } }, { is_published: true }, '已发布'],
		[{ core: { use_status: 'U1' } }, { use_status: 'U1' }, '候选'],
		[{ core: { use_status: 'U0' } }, { use_status: 'U0' }, '未发布'],
	];
	const before = structuredClone(cases);
	freeze(cases);
	for (const [managed, flat, expected] of cases) {
		assert.equal(getManagementStatus(managed), expected);
		assert.equal(getManagementStatus(flat), expected);
	}
	assert.deepEqual(cases, before);
	assert.deepEqual(managementStatusOrder, ['草稿', '恢复草稿', '有未发布修改', '未发布', '候选', '已发布', '已撤销']);
});

// 执行真实管理端菜单生成函数，检查实际option值及顺序，不以源码字串代替行为。
const appSource = (await readFile(new URL('../public/app.js', import.meta.url), 'utf8')).replaceAll('\r\n', '\n');
const declaration = (name) => {
	const start = appSource.indexOf(`const ${name} =`);
	assert.notEqual(start, -1, name);
	return appSource.slice(start, appSource.indexOf('\n\n', start));
};
const optionsIn = (control) => [...control.innerHTML.matchAll(/<option value="([^"]*)"([^>]*)>(.*?)<\/option>/g)]
	.map(([, value, attributes, label]) => ({ value, label, selected: /\bselected\b/.test(attributes) }));

test('管理筛选实际输出七类及全量精确类型，年代、状态与研究等选项按主数据排序并保留活动值', () => {
	const dictionary = new Map();
	for (const entry of sortDictionaryEntries(dictionarySource.entries)) {
		if (!dictionary.has(entry.dictionary_key)) dictionary.set(entry.dictionary_key, []);
		dictionary.get(entry.dictionary_key).push(entry);
	}
	const record = (id, date, use, extra = {}, admin = {}) => ({
		core: { item_id: id, date_display: date, use_status: use, object_type: 'LET', ...extra }, _admin: admin,
	});
	const records = freeze([
		record('published', '2001年', 'U3', { research_status: 'R4', evidence_level: 'D', rights_status: 'UNK' }),
		record('candidate', '1888年', 'U1', { research_status: 'R1', evidence_level: 'A' }),
		record('draft', '', 'U0', {}, { hasDraft: true }),
		record('modified', '约1992年', 'U3', {}, { hasDraft: true, hasOfficial: true }),
	]);
	const state = {
		dictionary, standards: { archiveCategories: { categories: freeze(structuredClone(categories)) } },
		recordTypeFilter: 'CRD', recordDecadeFilter: '1970', recordQuickStatus: '恢复草稿', recordAlbumFilter: '',
		recordFilters: { category: 'cards', research: 'R2', evidence: '', rights: '', imageStatus: '' },
	};
	const before = structuredClone(state);
	const control = () => ({ innerHTML: '', value: '', textContent: '' });
	const elements = Object.fromEntries(['recordTypeFilter', 'recordDecadeFilter', 'recordQuickStatusFilter',
		'recordAlbumOptions', 'recordAlbumFilter', 'recordAdvancedCount'].map((key) => [key, control()]));
	const controls = new Map(['[data-record-filter="research"]', '[data-record-filter="evidence"]',
		'[data-record-filter="rights"]', '#record-category-filter', '#record-image-filter'].map((selector) => [selector, control()]));
	const scope = {
		state, elements, document: { querySelector: (selector) => controls.get(selector) },
		getDecadeOptions, getArchiveCategoryOptions, getArchiveTypeOrder, compareReferenceValues,
		managementStatusOrder, getManagementStatus, buildAdminAlbumGroups: () => new Map(),
	};
	const names = ['escapeHtml', 'statusLabel', 'queryCodeLabel', 'queryOptionMarkup', 'syncRecordToolOptions'];
	const sync = new Function(...Object.keys(scope), `${names.map(declaration).join('\n')}\nreturn syncRecordToolOptions;`)(...Object.values(scope));
	sync(records);
	assert.deepEqual(optionsIn(elements.recordTypeFilter).map(({ value }) => value), ['', ...getArchiveTypeOrder(categories)]);
	assert.equal(optionsIn(elements.recordTypeFilter).find(({ value }) => value === 'CRD').selected, true);
	assert.deepEqual(optionsIn(controls.get('#record-category-filter')).map(({ value }) => value), ['', ...categories.map(({ slug }) => slug)]);
	assert.equal(optionsIn(controls.get('#record-category-filter')).find(({ value }) => value === 'cards').selected, true);
	assert.deepEqual(optionsIn(elements.recordDecadeFilter).map(({ value }) => value), ['', '1880', '1970', '1990', '2000', 'unknown']);
	assert.equal(optionsIn(elements.recordDecadeFilter).find(({ value }) => value === '1970').selected, true);
	assert.deepEqual(optionsIn(elements.recordQuickStatusFilter).map(({ value }) => value), ['', '草稿', '恢复草稿', '有未发布修改', '候选', '已发布']);
	assert.deepEqual(optionsIn(controls.get('[data-record-filter="research"]')).map(({ value }) => value), ['', 'R1', 'R2', 'R4']);
	assert.equal(optionsIn(controls.get('[data-record-filter="research"]')).find(({ value }) => value === 'R2').selected, true);
	assert.deepEqual(optionsIn(controls.get('[data-record-filter="evidence"]')).map(({ value }) => value), ['', 'A', 'D']);
	assert.deepEqual(state, before, '渲染筛选不能改写档案、选中状态或字典');
});
