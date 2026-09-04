// 单元测试：验证 capture/restore 折叠区展开状态的逻辑
import assert from 'node:assert/strict';

// 模拟 elements.editorSurface
const fakeEditorSurface = {
	innerHTML: '',
	dataset: {},
	querySelectorAll(selector) {
		return this._details || [];
	},
	_details: [],
};

// 待测试函数（与 app.js 中的实现一致）
const captureEditorDetailsOpenState = () => fakeEditorSurface.querySelectorAll('details').map((d) => d.open);
const restoreEditorDetailsOpenState = (previousOpen) => {
	fakeEditorSurface.querySelectorAll('details').forEach((d, i) => {
		if (previousOpen[i]) d.setAttribute('open', '');
	});
};

// 测试场景 1：基本捕获与恢复
fakeEditorSurface._details = [
	{ open: false, setAttribute(k, v) { if (k === 'open') this.open = v === '' || v === 'open' || v === true; } },
	{ open: true,  setAttribute(k, v) { if (k === 'open') this.open = v === '' || v === 'open' || v === true; } },
	{ open: false, setAttribute(k, v) { if (k === 'open') this.open = v === '' || v === 'open' || v === true; } },
];
let captured = captureEditorDetailsOpenState();
assert.deepEqual(captured, [false, true, false], '应正确捕获折叠区展开状态');

// 模拟 innerHTML 重置：所有折叠区都变 closed
fakeEditorSurface._details = [
	{ open: false, setAttribute(k, v) { if (k === 'open') this.open = v === '' || v === 'open' || v === true; } },
	{ open: false, setAttribute(k, v) { if (k === 'open') this.open = v === '' || v === 'open' || v === true; } },
	{ open: false, setAttribute(k, v) { if (k === 'open') this.open = v === '' || v === 'open' || v === true; } },
];
restoreEditorDetailsOpenState(captured);
assert.deepEqual(
	fakeEditorSurface._details.map((d) => d.open),
	[false, true, false],
	'应正确恢复折叠区展开状态',
);

// 测试场景 2：跨标签页不应保留旧展开状态（用空数组表示 previousTab !== currentTab）
fakeEditorSurface._details = [
	{ open: true, setAttribute() {} },
	{ open: true, setAttribute() {} },
	{ open: true, setAttribute() {} },
];
captured = captureEditorDetailsOpenState();
assert.deepEqual(captured, [true, true, true]);

// 模拟切到其他标签页：details 数量变化，且不应用恢复
fakeEditorSurface._details = [
	{ open: false, setAttribute(k, v) { if (k === 'open') this.open = v === '' || v === 'open' || v === true; } },
	{ open: false, setAttribute(k, v) { if (k === 'open') this.open = v === '' || v === 'open' || v === true; } },
];

restoreEditorDetailsOpenState([]); // 空数组：表示不同标签页
assert.deepEqual(
	fakeEditorSurface._details.map((d) => d.open),
	[false, false],
	'跨标签页渲染不应保留旧展开状态',
);

// 测试场景 3：编辑「地点」后保持展开（核心 bug 场景）
// 用户展开「地点」折叠区
fakeEditorSurface._details = [
	{ open: false, setAttribute(k, v) { if (k === 'open') this.open = v === '' || v === 'open' || v === true; } }, // 联系方式
	{ open: true,  setAttribute(k, v) { if (k === 'open') this.open = v === '' || v === 'open' || v === true; } }, // 地点
	{ open: false, setAttribute(k, v) { if (k === 'open') this.open = v === '' || v === 'open' || v === true; } }, // 其他
];
captured = captureEditorDetailsOpenState();
// 修改省级触发 renderEditor：所有 details 都重置为 closed
fakeEditorSurface._details = [
	{ open: false, setAttribute(k, v) { if (k === 'open') this.open = v === '' || v === 'open' || v === true; } },
	{ open: false, setAttribute(k, v) { if (k === 'open') this.open = v === '' || v === 'open' || v === true; } },
	{ open: false, setAttribute(k, v) { if (k === 'open') this.open = v === '' || v === 'open' || v === true; } },
];
restoreEditorDetailsOpenState(captured);
assert.deepEqual(
	fakeEditorSurface._details.map((d) => d.open),
	[false, true, false],
	'修改省级后「地点」折叠区应保持展开',
);

console.log('✓ 所有折叠区展开状态相关测试通过');
