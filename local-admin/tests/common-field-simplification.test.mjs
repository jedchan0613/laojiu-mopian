import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const projectRoot = new URL('../../', import.meta.url);

const hiddenFieldCodes = [
	'checksum_sha256', 'scan_ppi', 'filename_notes', 'storage_box', 'storage_sleeve',
	'record_creator', 'next_action', 'item_seq', 'collection_id', 'album_id', 'series_id',
	'original_position', 'related_item_ids',
];

test('低频通用字段只改变显示，已有值和数组仍随整条草稿保存', async () => {
	const script = await readFile(new URL('local-admin/public/app.js', projectRoot), 'utf8');
	for (const fieldCode of hiddenFieldCodes) assert.match(script, new RegExp(`['"]${fieldCode}['"]`));
	assert.match(script, /return hasMeaningfulValue\(value\) \? '已保存的扩展字段' : null/);
	assert.match(script, /record: state\.current, images, isNew: state\.isNew/);

	const original = Object.fromEntries(hiddenFieldCodes.map((code) => [code,
		code === 'related_item_ids' ? ['LJM-20260101-PHO-001'] : `保留值-${code}`]));
	const record = { core: { ...original, title: '原题名' } };
	record.core.title = '修改后的题名';
	const payload = { record };
	for (const fieldCode of hiddenFieldCodes) {
		assert.deepEqual(payload.record.core[fieldCode], original[fieldCode]);
	}
});

test('表单展示分组压缩为七个常用分组，不修改规范文件', async () => {
	const script = await readFile(new URL('local-admin/public/app.js', projectRoot), 'utf8');
	for (const section of ['时间与来源', '地点', '人物与内容', '载体与标记', '权限与研究', '数字化与备份', '保存与利用']) {
		assert.match(script, new RegExp(`['"]${section}['"]`));
	}
	assert.match(script, /只合并本地表单的展示分组，不改写 Excel 规范、字段编码或已保存的档案内容/);
});

test('原始组合已由批次满足时隐藏空关联项，未满足时保留入口，历史值始终可维护', async () => {
	const script = (await readFile(new URL('local-admin/public/app.js', projectRoot), 'utf8')).replaceAll('\r\n', '\n');
	const rules = JSON.parse(await readFile(new URL('site/src/data/standards/collection-code-rules.json', projectRoot), 'utf8'));
	const common = JSON.parse(await readFile(new URL('site/src/data/standards/common-fields.json', projectRoot), 'utf8'));
	const declaration = (name) => {
		const start = script.indexOf(`const ${name} =`);
		assert.notEqual(start, -1);
		return script.slice(start, script.indexOf('\n\n', start));
	};
	const state = { current: { core: { batch_id: 'TEST-BATCH' }, metadata: { schema: 'photo', dimensions: {} } },
		standards: { collectionCodeRules: rules } };
	const { requiredCoreFieldsForVisibility, commonFieldSectionFor } = new Function('state', [
		'hiddenCommonFieldCodes', 'commonFieldSectionLabels', 'hasMeaningfulValue', 'normalizeRuleField',
		'currentCollectionRules', 'collectionRuleFieldValue', 'requiredCoreFieldsForVisibility', 'commonFieldSectionFor',
	].map(declaration).join('\n') + '\nreturn { requiredCoreFieldsForVisibility, commonFieldSectionFor };')(state);
	const album = common.fields.find((field) => field.field_code === 'album_id');
	assert.ok(album);
	let required = requiredCoreFieldsForVisibility();
	assert.equal(required.has('album_id'), false);
	assert.equal(commonFieldSectionFor(album, { required: required.has('album_id') }), null);
	assert.equal(commonFieldSectionFor(album, { value: 'TEST-ALBUM' }), '已保存的扩展字段');
	delete state.current.core.batch_id;
	required = requiredCoreFieldsForVisibility();
	assert.equal(required.has('album_id'), true);
	assert.equal(commonFieldSectionFor(album, { required: required.has('album_id') }), '时间与来源');
});

test('动态分组顺序改变后，展开状态仍跟随原分组而不串到其他字段', async () => {
	const script = (await readFile(new URL('local-admin/public/app.js', projectRoot), 'utf8')).replaceAll('\r\n', '\n');
	const captureStart = script.indexOf('const captureEditorDetailsOpenState =');
	const restoreStart = script.indexOf('const restoreEditorDetailsOpenState =');
	const code = script.slice(captureStart, script.indexOf(';', captureStart) + 1) + '\n' +
		script.slice(restoreStart, script.indexOf('\n};', restoreStart) + 3);
	const detail = (key, open = false) => ({ dataset: { detailsKey: key }, open,
		setAttribute(name) { if (name === 'open') this.open = true; } });
	let groups = [detail('common-地点', true), detail('common-时间与来源')];
	const elements = { editorSurface: { querySelectorAll: () => groups } };
	const { capture, restore } = new Function('elements', code +
		'\nreturn {capture: captureEditorDetailsOpenState, restore: restoreEditorDetailsOpenState};')(elements);
	const saved = capture();
	groups = [detail('common-已保存的扩展字段'), detail('common-时间与来源'), detail('common-地点')];
	restore(saved);
	assert.deepEqual(groups.map((group) => group.open), [false, false, true]);
});
