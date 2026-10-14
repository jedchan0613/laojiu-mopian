import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { createTranslationStore } from '../translations.mjs';

const fixture = () => ({
	core: { item_id: 'LJM-20261014-PHO-001', title: '约一九六〇年的家庭照片', date_display: '约1960年',
		record_status: 'ACT', privacy_level: 'G', use_status: 'U3',
		publication_file_path: ['/archive/LJM-20261014-PHO-001/front-01.jpg'], master_file_path: 'PRIVATE-MASTER' },
	metadata: { schema: 'photo', dimensions: {} },
	public_view: { description: '年代根据背面题注推测。', tags: ['家庭', '照片'], image_descriptions: ['照片正面'] },
});
const prepare = async (t) => {
	const root = await fs.mkdtemp(path.join(os.tmpdir(), 'ljm-translations-'));
	t.after(() => fs.rm(root, { recursive: true, force: true }));
	const store = createTranslationStore({ root });
	return { root, store, item: fixture() };
};
const payloadFor = (detail) => ({
	revision: detail.revision, source_hash: detail.source_hash, status: 'review',
	fields: { 'core.title': 'Family photograph, circa 1960', 'core.date_display': 'Circa 1960',
		'public_view.description': 'The date is inferred from the inscription on the back.', 'public_view.tags': ['Family', 'Photograph'] },
	image_descriptions: { '/archive/LJM-20261014-PHO-001/front-01.jpg': 'Front of the photograph' },
	transcription_kind: 'none',
});
const publishFixture = async (store, item) => {
	const saved = await store.saveDraft(item, payloadFor(await store.detail(item)));
	return store.publish(item, { revision: saved.revision, confirmed: true }, 'Synthetic reviewer');
};

test('英文草稿与已发布版本独立，草稿、审核人和私密字段不进入公开层', async (t) => {
	const { store, item } = await prepare(t);
	const first = await store.saveDraft(item, payloadFor(await store.detail(item)));
	assert.equal(first.state, 'review');
	assert.deepEqual((await store.publicLayer([item])).records, {});
	await store.publish(item, { revision: first.revision, confirmed: true }, 'Synthetic reviewer');
	const current = await store.detail(item);
	const changed = payloadFor(current);
	changed.fields['core.title'] = 'Revised unpublished draft title';
	await store.saveDraft(item, changed);
	const layer = await store.publicLayer([item]);
	assert.equal(layer.records[item.core.item_id].fields['core.title'], 'Family photograph, circa 1960');
	assert.doesNotMatch(JSON.stringify(layer), /Synthetic reviewer|reviewed_by|PRIVATE-MASTER|unpublished/);
});

test('中文来源逐字段变化只失效对应译文，未变字段继续有效，保存不自动重新确认', async (t) => {
	const { store, item } = await prepare(t);
	await publishFixture(store, item);
	item.core.title = '约一九六一年家庭照片';
	const layer = await store.publicLayer([item]);
	assert.equal(layer.records[item.core.item_id].fields['core.title'], undefined);
	assert.equal(layer.records[item.core.item_id].fields['public_view.description'], 'The date is inferred from the inscription on the back.');
	const detail = await store.detail(item);
	assert.ok(detail.stale_fields.includes('core.title'));
	const saved = await store.saveDraft(item, payloadFor(detail));
	await assert.rejects(store.publish(item, { revision: saved.revision, confirmed: true }, 'Synthetic reviewer'), /未复核/);
	const confirmed = payloadFor(saved);
	confirmed.confirmed_fields = ['core.title'];
	const reviewed = await store.saveDraft(item, confirmed);
	await store.publish(item, { revision: reviewed.revision, confirmed: true }, 'Synthetic reviewer');
	assert.equal((await store.publicLayer([item])).records[item.core.item_id].fields['core.title'], 'Family photograph, circa 1960');
});

test('过时页面、旧修订号和未明确审核均不能覆盖译文', async (t) => {
	const { store, item } = await prepare(t);
	const initial = await store.detail(item);
	const saved = await store.saveDraft(item, payloadFor(initial));
	await assert.rejects(store.saveDraft(item, payloadFor(initial)), { statusCode: 409 });
	await assert.rejects(store.publish(item, { revision: saved.revision, confirmed: false }, 'Synthetic reviewer'), /先确认/);
	const payload = payloadFor(saved);
	item.public_view.description = '新公开简介';
	await assert.rejects(store.saveDraft(item, payload), { statusCode: 409 });
});

test('未公开、撤销、隐私未通过的档案以及越权字段均不能加入英文公开层', async (t) => {
	const { store, item } = await prepare(t);
	const payload = payloadFor(await store.detail(item));
	payload.fields['core.master_file_path'] = 'PRIVATE';
	await assert.rejects(store.saveDraft(item, payload), /不允许翻译/);
	for (const [key, value] of [['privacy_level', 'Y'], ['use_status', 'U0'], ['record_status', 'WDR']]) {
		const privateItem = structuredClone(item); privateItem.core[key] = value;
		await assert.rejects(store.detail(privateItem), /公开发布/);
		assert.deepEqual((await store.publicLayer([privateItem])).records, {});
	}
	await assert.rejects(store.readRaw('../invalid'), /永久编号/);
});

test('审核更新保留私有历史，构建失败可恢复之前原始维护记录', async (t) => {
	const { root, store, item } = await prepare(t);
	await publishFixture(store, item);
	const before = await store.readRaw(item.core.item_id);
	const detail = await store.detail(item);
	const payload = payloadFor(detail); payload.fields['core.title'] = 'New title';
	const saved = await store.saveDraft(item, payload);
	await store.publish(item, { revision: saved.revision, confirmed: true }, 'Synthetic reviewer');
	assert.equal((await fs.readdir(path.join(root, 'history', item.core.item_id))).length, 1);
	await store.restoreRaw(item.core.item_id, before);
	assert.equal((await store.publicLayer([item])).records[item.core.item_id].fields['core.title'], 'Family photograph, circa 1960');
});

test('兼容首批独立译文记录，之后保存转换为独立草稿和正式版本', async (t) => {
	const { root, store, item } = await prepare(t);
	await publishFixture(store, item);
	const wrapper = JSON.parse(await store.readRaw(item.core.item_id));
	await fs.writeFile(path.join(root, `${item.core.item_id}.json`), JSON.stringify(wrapper.published));
	const detail = await store.detail(item);
	assert.equal(detail.has_draft, false);
	await store.saveDraft(item, payloadFor(detail));
	const result = JSON.parse(await store.readRaw(item.core.item_id));
	assert.ok(result.draft && result.published);
});
