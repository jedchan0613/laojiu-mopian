import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import test from 'node:test';

// 第三阶段客户端保存状态机的纯逻辑测试：从 app.js 提取相关片段在受控上下文内验证。
const script = (await readFile(new URL('../public/app.js', import.meta.url), 'utf8')).replaceAll('\r\n', '\n');
const sliceA = script.slice(script.indexOf('const readApiJson ='), script.indexOf('const isWithdrawn ='));
const sliceB = script.slice(script.indexOf('// —— 自动保存草稿（第三阶段调整）——'), script.indexOf('const saveDraft = async'));

const createContext = ({ fetch = async () => { throw new Error('不应发起请求'); } } = {}) => {
	const timers = [];
	const state = {
		writeProtocol: 2, adminMode: 'local', dirty: false, current: null, images: [],
		savePhase: '', savePhaseDetail: '', editSequence: 0, lastInputAt: 0, lastAutoSaveAt: 0,
		composing: false, pendingObjectCategory: '', saveOperationId: '',
		translation: { dirty: false },
	};
	const context = vm.createContext({
		state, fetch, crypto: { randomUUID },
		showToast: () => {}, updateCancellableOperation: () => {}, updateHeader: () => {},
		isWithdrawn: () => false,
		navigator: { onLine: true },
		elements: { confirmDialog: { open: false }, withdrawDialog: { open: false } },
		setTimeout: (callback, delay) => { timers.push({ callback, delay }); return timers.length; },
		clearTimeout: () => {},
	});
	vm.runInContext(`let pendingWriteReview = null; let activeOperation = null; ${sliceA}`, context);
	vm.runInContext(sliceB, context);
	context.state = state;
	context.timers = timers;
	return context;
};

test('保存状态文字：各阶段给出可执行的下一步，不只靠颜色', () => {
	const api = createContext();
	api.state.adminMode = 'local';
	for (const [phase, fragment] of [
		['saving', '正在保存草稿'],
		['saving-auto', '正在自动保存'],
		['saved', '已保存到本机草稿'],
		['pending-images', '有图片待上传'],
		['failed', '尚未保存'],
		['offline', '网络连接中断'],
		['auth', '需要重新登录'],
		['conflict', '已在其他页面更新'],
		['unknown', '正在核对是否保存成功'],
	]) {
		api.state.savePhase = phase;
		api.state.savePhaseDetail = phase === 'saved' ? '14:32' : phase === 'failed' ? '网络超时' : '';
		assert.match(vm.runInContext('describeSaveState()', api), new RegExp(fragment), `阶段 ${phase} 缺少说明文字`);
	}
	api.state.adminMode = 'online';
	api.state.savePhase = 'saved';
	api.state.savePhaseDetail = '15:01';
	assert.match(vm.runInContext('describeSaveState()', api), /已保存到线上草稿/);
});

test('编辑序号：每次修改推进，瞬态保存阶段被清除，冲突与登录失效保留', () => {
	const api = createContext();
	assert.equal(api.state.editSequence, 0);
	for (const phase of ['saving', 'saved', 'failed', 'offline', 'pending-images']) {
		api.state.savePhase = phase;
		vm.runInContext('noteRecordEdit()', api);
		assert.equal(api.state.editSequence, 1, '编辑序号应推进');
		assert.equal(api.state.savePhase, '', `阶段 ${phase} 应在继续编辑时清除`);
		api.state.editSequence = 0;
	}
	for (const phase of ['auth', 'conflict', 'unknown']) {
		api.state.savePhase = phase;
		vm.runInContext('noteRecordEdit()', api);
		assert.equal(api.state.savePhase, phase, `阶段 ${phase} 需要用户处理，不应被继续输入清除`);
		api.state.editSequence = 0;
	}
});

test('错误归类：登录失效、版本冲突、断网与未知结果分别给出对应阶段', () => {
	const api = createContext();
	// vm 上下文返回的数组与本地数组原型不同，strict deepEqual 会判不相等；逐项比较内容。
	const classify = (error) => {
		api.__err = error;
		return [...vm.runInContext('classifySaveError(globalThis.__err)', api)];
	};
	assert.deepEqual(classify({ code: 'AUTH_EXPIRED' }), ['auth', '']);
	assert.deepEqual(classify({ code: 'REVISION_CONFLICT' }), ['conflict', '']);
	assert.deepEqual(classify({ name: 'TypeError', message: 'Failed to fetch' }), ['offline', '']);
	assert.deepEqual(classify({ code: 'OPERATION_NEEDS_REVIEW' }), ['unknown', '']);
	assert.deepEqual(classify({ code: 'SAVE_BUSY' }), ['busy', '']);
	assert.deepEqual(classify({ message: '图片上传失败' }), ['failed', '图片上传失败']);
	// 网络响应丢失时页面会进入待核对，归类为未知而不是失败。
	vm.runInContext('pendingWriteReview = { operationId: "x" }', api);
	assert.deepEqual(classify({ message: '尚未收到写入结果' }), ['unknown', '']);
});

test('自动保存安排：纯文字 5 秒空档，连续编辑 30 秒兜底，待传图片暂停并提示', () => {
	const api = createContext();
	api.state.dirty = true;
	api.state.current = { core: { item_id: 'LJM-20000101-LET-001' }, _admin: { revision: 'a'.repeat(64) } };
	// 刚保存过：按空闲节奏安排约 5 秒。
	api.state.lastAutoSaveAt = Date.now();
	api.state.lastInputAt = Date.now();
	vm.runInContext('scheduleAutoSaveDraft()', api);
	assert.equal(api.timers.length, 1);
	assert.ok(api.timers[0].delay >= 4750 && api.timers[0].delay <= 5250, `空闲保存应在 5 秒附近，实际 ${api.timers[0].delay}`);
	// 连续输入超过 30 秒未保存：短间隔内安排一次完整快照保存。
	api.timers.length = 0;
	api.state.lastAutoSaveAt = Date.now() - 31000;
	api.state.lastInputAt = Date.now() - 1000;
	vm.runInContext('scheduleAutoSaveDraft()', api);
	assert.equal(api.timers.length, 1);
	assert.ok(api.timers[0].delay <= 500, `长编辑应尽快保存，实际 ${api.timers[0].delay}`);
	// 有待上传新图片：不安排自动保存，持续提示待上传。
	api.timers.length = 0;
	api.state.savePhase = '';
	api.state.images = [{ id: 'new-1', kind: 'new', file: { name: 'a.png' } }];
	vm.runInContext('scheduleAutoSaveDraft()', api);
	assert.equal(api.timers.length, 0, '待传图片时不应安排自动保存');
	assert.equal(api.state.savePhase, 'pending-images');
	// 冲突与登录失效状态下不自动保存。
	api.state.images = [];
	for (const phase of ['conflict', 'auth', 'unknown']) {
		api.state.savePhase = phase;
		vm.runInContext('scheduleAutoSaveDraft()', api);
		assert.equal(api.timers.length, 0, `阶段 ${phase} 不应自动保存`);
	}
});

test('自动保存前置检查：组词中、离线、有待传图片都不发出请求', async () => {
	const api = createContext({ fetch: async () => { throw new Error('不应请求'); } });
	api.state.dirty = true;
	api.state.current = { core: { item_id: 'LJM-20000101-LET-001' }, _admin: { revision: 'a'.repeat(64) } };
	// saveDraft 未定义时 autoSaveDraft 不应走到请求；这里只验证各前置分支直接返回。
	api.state.composing = true;
	await vm.runInContext('autoSaveDraft()', api);
	api.state.composing = false;
	api.state.images = [{ id: 'new-1', kind: 'new', file: {} }];
	await vm.runInContext('autoSaveDraft()', api);
	assert.equal(api.state.savePhase, 'pending-images');
	api.state.images = [];
	api.navigator.onLine = false;
	await vm.runInContext('autoSaveDraft()', api);
	assert.equal(api.state.savePhase, 'offline');
});
