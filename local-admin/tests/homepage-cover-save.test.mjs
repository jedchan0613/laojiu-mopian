import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash, randomUUID } from 'node:crypto';
import test from 'node:test';
import { validateHomepageCoverRequest, resolveDraftHomepageCover } from '../homepage-cover.mjs';
import { fixture, sample, operation, png } from './helpers/merge-fixture.mjs';

const oldTime = '2026-11-01T08:00:00.000Z';
const nowTime = '2026-11-10T08:00:00.000Z';
const id = 'LJM-20000101-LET-001';
const imagePaths = ['front-public.png', 'back-public.png'].map((filename) => `/archive/${id}/${filename}`);
const record = () => sample('001', { publication_file_path: [...imagePaths] });

test('首页封面请求只接受当前图集位置和明确的优先标记，非法请求不改输入', () => {
	const images = [{ kind: 'existing' }, { kind: 'staged' }];
	assert.equal(validateHomepageCoverRequest(undefined, images), undefined);
	assert.deepEqual(validateHomepageCoverRequest({ imageIndex: null, promote: false }, images), { imageIndex: null, promote: false });
	assert.deepEqual(validateHomepageCoverRequest({ imageIndex: 1, promote: true }, images), { imageIndex: 1, promote: true });
	for (const request of [null, [], 'image.png', {}, { imageIndex: 0 }, { imageIndex: 0, promote: 'true' },
		{ imageIndex: -1, promote: true }, { imageIndex: 2, promote: true }, { imageIndex: 0.5, promote: false },
		{ imageIndex: null, promote: true }, { imageIndex: 0, promote: true, selected_at: nowTime }]) {
		const before = structuredClone(request);
		assert.throws(() => validateHomepageCoverRequest(request, images), /首页封面/);
		assert.deepEqual(request, before);
	}
});

test('封面时间只由服务端生成，普通保存与旧客户端保留原设置，删除后清除', () => {
	const previous = record();
	previous.public_view.homepage_cover = { image: imagePaths[1], selected_at: oldTime };
	const current = record();
	current.public_view.homepage_cover = { image: imagePaths[0], selected_at: '9999-01-01T00:00:00.000Z' };
	const before = structuredClone([previous, current]);
	assert.deepEqual(resolveDraftHomepageCover(current, previous, { imageIndex: 1, promote: false }, () => new Date(nowTime)), previous.public_view.homepage_cover);
	assert.deepEqual(resolveDraftHomepageCover(current, previous, undefined), previous.public_view.homepage_cover);
	assert.deepEqual(resolveDraftHomepageCover(current, previous, { imageIndex: 1, promote: true }, () => new Date(nowTime)), { image: imagePaths[1], selected_at: nowTime });
	assert.deepEqual(resolveDraftHomepageCover(current, previous, { imageIndex: 0, promote: false }, () => new Date(nowTime)), { image: imagePaths[0], selected_at: nowTime });
	assert.equal(resolveDraftHomepageCover(current, previous, { imageIndex: null, promote: false }), undefined);
	assert.equal(resolveDraftHomepageCover({ ...current, core: { ...current.core, publication_file_path: [imagePaths[0]] } }, previous, undefined), undefined);
	assert.deepEqual([previous, current], before, '计算展示设置不能改写旧版本或请求记录');
});

const currentRecord = async (f, itemId = f.ids[0]) => {
	const result = await f.get('/api/bootstrap?format=split-v1');
	assert.equal(result.status, 200, JSON.stringify(result.body));
	return result.body.records.find((row) => row.core.item_id === itemId);
};
const save = (f, row, extra = {}) => f.post('/api/save-draft', {
	record: row, isNew: false, expectedRevision: row._admin.revision,
	images: row.core.publication_file_path.map((image) => ({ kind: 'existing', filename: path.basename(image) })),
	...extra,
});

test('HTTP封面随草稿保存，普通更新/图片重排不抢位，伪造时间和跨档案路径不被采用', { timeout: 30000 }, async (t) => {
	const f = await fixture(t, { http: true, internal: true, count: 1 });
	const sourceFile = path.join(f.archive, `${f.ids[0]}.json`);
	const source = JSON.parse(await fs.readFile(sourceFile, 'utf8'));
	source.core.publication_file_path.push(`/archive/${f.ids[0]}/back-public.png`);
	source.public_view.image_descriptions.push('合成背面');
	await fs.copyFile(path.join(f.imageRoot, f.ids[0], 'front-public.png'), path.join(f.imageRoot, f.ids[0], 'back-public.png'));
	await fs.writeFile(sourceFile, JSON.stringify(source));
	const original = await fs.readFile(sourceFile, 'utf8');
	let row = await currentRecord(f);
	row.public_view.homepage_cover = { image: '/archive/LJM-20000101-LET-999/private.png', selected_at: '9999-01-01T00:00:00.000Z' };
	const selected = await save(f, row, { homepageCover: { imageIndex: 1, promote: true } });
	assert.equal(selected.status, 200, JSON.stringify(selected.body));
	const cover = selected.body.draft.record.public_view.homepage_cover;
	assert.equal(cover.image, `/archive/${f.ids[0]}/back-public.png`);
	assert.ok(Math.abs(Date.now() - Date.parse(cover.selected_at)) < 10000);
	assert.equal(await fs.readFile(sourceFile, 'utf8'), original, '保存草稿不能更新当前公开记录');
	row = await currentRecord(f);
	row.core.title = '仅更新合成标题';
	const reordered = await save(f, row, { images: [
		{ kind: 'existing', filename: 'back-public.png' }, { kind: 'existing', filename: 'front-public.png' },
	], homepageCover: { imageIndex: 0, promote: false } });
	assert.equal(reordered.status, 200, JSON.stringify(reordered.body));
	assert.deepEqual(reordered.body.draft.record.public_view.homepage_cover, cover);
	row = await currentRecord(f);
	row.public_view.homepage_cover = { image: imagePaths[0], selected_at: '9999-01-01T00:00:00.000Z' };
	const legacy = await save(f, row);
	assert.equal(legacy.status, 200, JSON.stringify(legacy.body));
	assert.deepEqual(legacy.body.draft.record.public_view.homepage_cover, cover);
	row = await currentRecord(f);
	const promoted = await save(f, row, { homepageCover: { imageIndex: 0, promote: true } });
	assert.equal(promoted.status, 200, JSON.stringify(promoted.body));
	assert.ok(promoted.body.draft.record.public_view.homepage_cover.selected_at >= cover.selected_at);
	const draftFile = path.join(f.privateRoot, 'drafts', `${f.ids[0]}.json`);
	const beforeInvalid = await fs.readFile(draftFile, 'utf8');
	row = await currentRecord(f);
	for (const homepageCover of [{ imageIndex: -1, promote: true }, { imageIndex: 2, promote: true }, { imageIndex: 0, promote: true, image: '../private.png' }]) {
		const invalid = await save(f, row, { homepageCover });
		assert.equal(invalid.status, 400, JSON.stringify(invalid.body));
		assert.equal(await fs.readFile(draftFile, 'utf8'), beforeInvalid);
	}
	const removed = await save(f, row, { images: [{ kind: 'existing', filename: 'front-public.png' }] });
	assert.equal(removed.status, 200, JSON.stringify(removed.body));
	assert.equal(removed.body.draft.record.public_view.homepage_cover, undefined);
	assert.equal(await fs.readFile(sourceFile, 'utf8'), original);
	assert.ok(await fs.stat(path.join(f.imageRoot, f.ids[0], 'back-public.png')), '移除选择不删除已保存图片');
});

test('HTTP新暂存图按服务器分配路径成为封面，隐私与正式发布门禁保持有效', { timeout: 30000 }, async (t) => {
	const f = await fixture(t, { http: true, internal: true, count: 1 });
	const op = operation();
	const uploadResponse = await fetch(`${f.origin}/api/stage-image`, { method: 'POST', headers: {
		'content-type': 'image/png', 'content-length': String(png.length), 'x-ljm-file-name': 'synthetic-public.png',
		'x-ljm-file-sha256': createHash('sha256').update(png).digest('hex'), 'x-ljm-admin-request': '1', origin: f.origin,
		'x-ljm-operation-id': op.operationId, 'x-ljm-step-id': op.stepId,
	}, body: png });
	const upload = await uploadResponse.json();
	assert.equal(uploadResponse.status, 200, JSON.stringify(upload));
	const newRecord = sample('001', { item_id: '', accession_date: '2001-01-01', publication_file_path: [] });
	newRecord.public_view.image_descriptions = ['合成发布图片'];
	newRecord.public_view.homepage_cover = { image: 'file:///private.jpg', selected_at: '9999-01-01T00:00:00.000Z' };
	const payload = { record: newRecord, isNew: true, expectedRevision: 'new', confirmedPublicationCopies: true,
		images: [{ kind: 'staged', uploadToken: upload.upload.token }], homepageCover: { imageIndex: 0, promote: true } };
	const invalidNew = await f.post('/api/save-draft', { ...payload, homepageCover: { imageIndex: 1, promote: true } }, { ...op, stepId: randomUUID() });
	assert.equal(invalidNew.status, 400, JSON.stringify(invalidNew.body));
	assert.deepEqual((await fs.readdir(f.imageRoot)).sort(), f.ids, '非法选择不能为新藏品分配图片目录');
	const saved = await f.post('/api/save-draft', payload, { ...op, stepId: randomUUID() });
	assert.equal(saved.status, 200, JSON.stringify(saved.body));
	const itemId = saved.body.draft.record.core.item_id;
	const cover = saved.body.draft.record.public_view.homepage_cover;
	assert.equal(cover.image, `/archive/${itemId}/front-public.png`);
	assert.deepEqual(['record_status', 'privacy_level', 'use_status'].map((key) => saved.body.draft.record.core[key]), ['SUS', 'Y', 'U0']);
	await assert.rejects(fs.access(path.join(f.archive, `${itemId}.json`)), { code: 'ENOENT' });
	const review = await f.post('/api/publication-review', { itemId, expectedRevision: saved.body.revision });
	assert.equal(review.status, 200, JSON.stringify(review.body));
	const publishPayload = { itemId, expectedRevision: saved.body.revision, reviewId: review.body.reviewId, confirmations: Array(13).fill(false) };
	const blocked = await f.post('/api/publish', publishPayload);
	assert.equal(blocked.status, 400, JSON.stringify(blocked.body));
	await assert.rejects(fs.access(path.join(f.archive, `${itemId}.json`)), { code: 'ENOENT' });
	const published = await f.post('/api/publish', { ...publishPayload, confirmations: Array(13).fill(true) });
	assert.equal(published.status, 200, JSON.stringify(published.body));
	const official = JSON.parse(await fs.readFile(path.join(f.archive, `${itemId}.json`), 'utf8'));
	assert.deepEqual(official.public_view.homepage_cover, cover);
	assert.deepEqual(['record_status', 'privacy_level', 'use_status'].map((key) => official.core[key]), ['ACT', 'G', 'U3']);
});

test('HTTP历史恢复时图片因重名改路径，封面随图重映射且不刷新优先时间', { timeout: 30000 }, async (t) => {
	const f = await fixture(t, { http: true, internal: true, count: 1 });
	const itemId = f.ids[0], entryId = '20000101-000000-000-12345678';
	const historyDirectory = path.join(f.privateRoot, 'history', itemId, entryId);
	const archived = sample('001');
	archived.public_view.homepage_cover = { image: archived.core.publication_file_path[0], selected_at: oldTime };
	await fs.mkdir(path.join(historyDirectory, 'images'), { recursive: true });
	await fs.writeFile(path.join(historyDirectory, 'record.json'), JSON.stringify(archived));
	await fs.writeFile(path.join(historyDirectory, 'manifest.json'), JSON.stringify({
		status: 'complete', item_id: itemId, entry_id: entryId, snapshot_kind: 'published-before-update', removed_images: [],
	}));
	// 当前同名图片为另一份合成内容，恢复必须另起安全文件名。
	await fs.writeFile(path.join(historyDirectory, 'images', 'front-public.png'), png);
	const sourceFile = path.join(f.archive, `${itemId}.json`);
	const before = await fs.readFile(sourceFile, 'utf8');
	const row = await currentRecord(f);
	const restored = await f.post('/api/restore-history', { itemId, entryId, expectedRevision: row._admin.revision });
	assert.equal(restored.status, 200, JSON.stringify(restored.body));
	const nextPath = `/archive/${itemId}/restored-01-front-public.png`;
	assert.deepEqual(restored.body.draft.record.core.publication_file_path, [nextPath]);
	assert.deepEqual(restored.body.draft.record.public_view.homepage_cover, { image: nextPath, selected_at: oldTime });
	assert.equal(restored.body.draft.record.core.use_status, 'U0');
	assert.equal(await fs.readFile(sourceFile, 'utf8'), before, '历史恢复只生成草稿，不覆盖公开记录');
});
