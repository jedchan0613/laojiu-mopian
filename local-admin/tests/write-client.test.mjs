import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import test from 'node:test';

const script = (await readFile(new URL('../public/app.js', import.meta.url), 'utf8')).replaceAll('\r\n', '\n');
const revision = 'a'.repeat(64);
const response = (data, status = 200) => ({ ok: status >= 200 && status < 300, status, headers: { get: () => 'application/json' }, json: async () => data });
const setupApi = (fetch) => {
	const notices = [];
	const state = { writeProtocol: 2, current: { core: { item_id: 'LJM-20000101-LET-001', title: '尚未保存的输入' }, _admin: { revision } }, records: [] };
	const context = vm.createContext({ state, fetch, crypto: { randomUUID }, showToast: message => notices.push(message), updateCancellableOperation: () => {} });
	vm.runInContext(`let pendingWriteReview = null; let activeOperation = null; ${script.slice(script.indexOf('const readApiJson ='), script.indexOf('const isWithdrawn ='))}
	globalThis.api = { apiPost, isOperationCancellation, operationErrorMessage, cancelActiveOperation, setActive: value => { activeOperation = value; } };`, context);
	return { ...context.api, state, notices };
};

test('同一父操作的保存与发布使用不同子编号，并传递版本', async () => {
	const requests = [];
	const api = setupApi(async (url, request) => { requests.push({ url, ...request }); return response({ operation: { kind: url.includes('save') ? 'save-draft' : 'publish', status: 'succeeded' } }); });
	const operation = { id: randomUUID(), controller: new AbortController() };
	await api.apiPost('/api/save-draft', { isNew: true, expectedRevision: 'new' }, { operation });
	await api.apiPost('/api/publish', { itemId: api.state.current.core.item_id, expectedRevision: revision }, { operation });
	assert.equal(requests[0].headers['X-LJM-Operation-Id'], operation.id);
	assert.equal(requests[1].headers['X-LJM-Operation-Id'], operation.id);
	assert.notEqual(requests[0].headers['X-LJM-Step-Id'], requests[1].headers['X-LJM-Step-Id']);
	assert.equal(JSON.parse(requests[1].body).expectedRevision, revision);
	assert.equal(operation.lastCompleted.kind, 'publish');
});

test('旧服务或缺失版本在请求发出前停止，冲突保留输入和错误码', async () => {
	let calls = 0;
	const api = setupApi(async () => { calls++; return response({ error: '已有其他页面更新', code: 'REVISION_CONFLICT' }, 409); });
	api.state.writeProtocol = 1;
	await assert.rejects(api.apiPost('/api/save-draft', { isNew: true, expectedRevision: 'new' }), /尚未启用写入保护/);
	api.state.writeProtocol = 2;
	await assert.rejects(api.apiPost('/api/save-draft', { isNew: false }), /缺少档案版本/);
	assert.equal(calls, 0);
	await assert.rejects(api.apiPost('/api/save-draft', { expectedRevision: revision }), { code: 'REVISION_CONFLICT' });
	assert.equal(api.state.current.core.title, '尚未保存的输入');
});

test('重放收据和丢失响应均保留输入并阻止本页再次写入', async () => {
	for (const replay of [true, false]) {
		let calls = 0;
		const api = setupApi(async () => { calls++; if (!replay) throw new TypeError('网络中断'); return response({ replayed: true, operation: { status: 'succeeded', result: { itemId: 'LJM-20000101-LET-001' } } }); });
		await assert.rejects(api.apiPost('/api/save-draft', { isNew: true, expectedRevision: 'new' }), replay ? { code: 'OPERATION_REPLAYED' } : /尚未收到写入结果/);
		await assert.rejects(api.apiPost('/api/save-draft', { isNew: true, expectedRevision: 'new' }), /上次写入结果尚待核对/);
		assert.equal(calls, 1);
		assert.equal(api.state.current.core.title, '尚未保存的输入');
	}
});

test('取消请求等待结果，已成功与待核对步骤都不报告取消成功', async () => {
	for (const status of ['succeeded', 'needs_review']) {
		const api = setupApi(async () => response({ requested: true, cancelled: true, operations: [{ kind: 'stage-image', status: 'cancelled' }, { kind: 'publish', status }] }));
		const operation = { id: randomUUID(), kind: 'publish', controller: new AbortController() };
		api.setActive(operation);
		await api.cancelActiveOperation();
		assert.equal(operation.controller.signal.aborted, false);
		assert.equal(api.notices.length, 1);
		assert.match(api.notices[0], status === 'succeeded' ? /已经完成/ : /尚不能确认已取消/);
		assert.equal(api.isOperationCancellation({ cancelled: true, operation: { status } }), false);
	}
});

test('不刷新保存后立即更新 revision，后续保存使用新版本并保留管理元数据', async () => {
	const requests = [];
	const context = vm.createContext({
		deepClone: structuredClone,
		state: { writeProtocol: 2, current: { core: { item_id: 'LJM-20000101-LET-001' }, public_view: {}, _admin: { revision, hasOfficial: true, officialPublished: true } }, isNew: false, images: [], pendingRemovedImages: [], editSequence: 0, savePhase: '', savePhaseDetail: '', saveOperationId: '', composing: false, dirty: false },
		pendingWriteReview: null, draftSavePrerequisiteIssues: () => [], beginCancellableOperation: () => ({}), throwIfOperationCancelled: () => {}, updateCancellableOperation: () => {}, finishCancellableOperation: () => {},
		itemIdPattern: /^LJM-\d{8}-[A-Z]{3}-\d{3}$/, recordImages: () => [], updateHeader: () => {},
		apiPost: async (url, payload) => {
			requests.push(structuredClone(payload));
			return { draft: { record: { core: { ...payload.record.core }, public_view: {} }, saved_at: '2026-10-18T00:00:00Z' }, revision: (requests.length === 1 ? 'b' : 'c').repeat(64) };
		},
	});
	vm.runInContext(`const expectedRecordRevision = () => state.current._admin?.revision;
		const setSavePhase = () => {}; const scheduleAutoSaveDraft = () => {}; const renderEditorPreservingViewport = () => {};
		const isOperationCancellation = () => false; const hasPendingImageUploads = () => false; const autoSaveTimeLabel = () => '14:32';
		${script.slice(script.indexOf('const saveDraft ='), script.indexOf('const publishCurrent ='))} globalThis.saveDraft = saveDraft;`, context);
	await context.saveDraft({ reload: false, silent: true });
	assert.equal(context.state.current._admin.revision, 'b'.repeat(64));
	assert.equal(context.state.current._admin.hasOfficial, true);
	assert.equal(context.state.current._admin.savedAt, '2026-10-18T00:00:00Z');
	await context.saveDraft({ reload: false, silent: true });
	assert.equal(requests[0].expectedRevision, revision);
	assert.equal(requests[1].expectedRevision, 'b'.repeat(64));
});

test('批次工具在网络重试时复用同一父号、子号与请求正文', async () => {
	const batchScript = (await readFile(new URL('../batch-intake.mjs', import.meta.url), 'utf8')).replaceAll('\r\n', '\n');
	const requests = [];
	const context = vm.createContext({ randomUUID, serverUrl: 'http://127.0.0.1:1', adminHeaders: { 'Content-Type': 'application/json' },
		setTimeout: callback => callback(), fetch: async (url, request) => { requests.push(request); if (requests.length === 1) throw new TypeError('响应丢失'); return response({ draft: { record: {} } }); },
	});
	vm.runInContext(`${batchScript.slice(batchScript.indexOf('const postJson ='), batchScript.indexOf('const sha256File ='))} globalThis.postJson = postJson;`, context);
	await context.postJson('/api/save-draft', { expectedRevision: 'new', isNew: true }, { retries: 2 });
	assert.equal(requests.length, 2);
	assert.deepEqual(requests[0].headers, requests[1].headers);
	assert.equal(requests[0].body, requests[1].body);
	assert.match(requests[0].headers['X-LJM-Operation-Id'], /^[a-f0-9-]{36}$/);
	assert.notEqual(requests[0].headers['X-LJM-Operation-Id'], requests[0].headers['X-LJM-Step-Id']);
});
