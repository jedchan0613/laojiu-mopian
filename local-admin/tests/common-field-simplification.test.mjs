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
