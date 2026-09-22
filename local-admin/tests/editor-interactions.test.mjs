// 单元测试：档案编辑页交互优化（统一检索、图片操作焦点恢复、统一确认弹窗、
// 字段级错误、自动保存、编辑区灯箱、说明字数计数器和 Ctrl+S 保存草稿）。
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const projectRoot = new URL('../../', import.meta.url);

test('档案管理使用一个搜索框，输入时只刷新结果列表', async () => {
	const [html, script] = await Promise.all([
		readFile(new URL('local-admin/public/index.html', projectRoot), 'utf8'),
		readFile(new URL('local-admin/public/app.js', projectRoot), 'utf8'),
	]);

	assert.match(html, /id="record-search"/);
	assert.doesNotMatch(html, /data-workspace="query"|资料查询/);
	assert.match(script, /elements\.recordSearch\.addEventListener\('input',[\s\S]{0,180}renderRecordList\(\)/);
	assert.doesNotMatch(script, /data-query-search|querySearchComposing|scheduleQuerySearchRefresh/);
});

test('图片排序与移除后恢复滚动位置并把焦点送回原位置', async () => {
	const script = await readFile(new URL('local-admin/public/app.js', projectRoot), 'utf8');

	assert.match(script, /const renderEditorPreservingViewport = \(focusTarget\) => \{/);
	assert.match(script, /const scrollY = window\.scrollY;\s*\n\s*renderEditor\(\);\s*\n\s*window\.scrollTo\(\{ top: scrollY \}\);/);
	// 移除后焦点回到同一位置，排序后焦点跟随刚移动的图片
	assert.match(script, /focusIndex = Math\.min\(index, state\.images\.length - 1\)/);
	assert.match(script, /focusIndex = targetIndex;/);
});

test('确认弹窗统一为自定义样式，不再使用系统原生 confirm', async () => {
	const [html, script] = await Promise.all([
		readFile(new URL('local-admin/public/index.html', projectRoot), 'utf8'),
		readFile(new URL('local-admin/public/app.js', projectRoot), 'utf8'),
	]);

	assert.match(html, /id="confirm-dialog"/);
	assert.match(html, /id="confirm-dialog-accept"/);
	assert.match(script, /const confirmAction = \(/);
	assert.match(script, /const confirmUnsavedChanges = \(question\) => confirmAction\(\{/);
	// 除注释外不再出现 window.confirm 调用
	assert.doesNotMatch(script.replace(/\/\/[^\n]*window\.confirm[^\n]*/g, ''), /window\.confirm\(/);
});

test('侧栏投稿与联系入口在有未保存修改时先确认再跳转', async () => {
	const [html, script] = await Promise.all([
		readFile(new URL('local-admin/public/index.html', projectRoot), 'utf8'),
		readFile(new URL('local-admin/public/app.js', projectRoot), 'utf8'),
	]);

	assert.match(html, /href="\/admin\/submissions\.html"/);
	assert.match(html, /href="\/admin\/contacts\.html"/);
	assert.match(script, /\.desk-nav a\[href\$="\/admin\/submissions\.html"\], \.desk-nav a\[href\$="\/admin\/contacts\.html"\]/);
	assert.match(script, /event\.preventDefault\(\);\s*\n\s*if \(await confirmUnsavedChanges/);
	// 回归保护：body 上也带有 data-workspace（布局状态），工作区切换只能匹配真正的侧栏按钮，
	// 否则点击侧栏链接或空白处会被误判为切换工作区并绕过未保存提醒。
	assert.match(script, /closest\('\.desk-nav-button\[data-workspace\]'\)/);
	assert.doesNotMatch(script, /closest\('\[data-workspace\]'\)/);
});

test('字段级错误汇总只收集当前分区且带字段编号的问题', async () => {
	const script = await readFile(new URL('local-admin/public/app.js', projectRoot), 'utf8');
	const mapStart = script.indexOf('let activeFieldIssueMap');
	const mapEnd = script.indexOf('const renderField =');
	assert.ok(mapStart >= 0 && mapEnd > mapStart, '应能读取字段问题汇总逻辑');
	const createMapHelper = new Function(
		'state', 'isWithdrawn', 'currentPreviewIssues',
		`${script.slice(mapStart, mapEnd)}\nreturn buildFieldIssueMap;`,
	);
	const buildFieldIssueMap = createMapHelper(
		{ current: {} },
		() => false,
		() => [
			{ code: 'a', tab: 'basic', message: '题名尚未填写。', field: 'title' },
			{ code: 'b', tab: 'basic', message: '发布图片缺失。', field: '' },
			{ code: 'c', tab: 'specific', message: 'D01 尚未填写。', field: 'D01' },
		],
	);

	assert.deepEqual(
		buildFieldIssueMap('basic'),
		new Map([['title', ['题名尚未填写。']]]),
	);
	assert.deepEqual(
		buildFieldIssueMap('specific'),
		new Map([['D01', ['D01 尚未填写。']]]),
	);
	// 已撤销记录不显示字段错误
	const buildForWithdrawn = createMapHelper({ current: {} }, () => true, () => { throw new Error('不应调用'); });
	assert.deepEqual(buildForWithdrawn('basic'), new Map());
});

test('字段旁直接标红错误并在发布失败时定位到第一个出错字段', async () => {
	const script = await readFile(new URL('local-admin/public/app.js', projectRoot), 'utf8');

	assert.match(script, /activeFieldIssueMap = buildFieldIssueMap\('basic'\);/);
	assert.match(script, /activeFieldIssueMap = buildFieldIssueMap\('specific'\);/);
	assert.match(script, /<span class="field-error" role="alert">/);
	assert.match(script, /aria-invalid="true"/);
	// 发布失败不再固定跳到预览页，而是第一个出错分区并滚动定位
	const publishStart = script.indexOf('const publishCurrent =');
	const publishEnd = script.indexOf('const openWithdrawalDialog =');
	assert.ok(publishStart >= 0 && publishEnd > publishStart, '应能读取发布流程');
	const publishBlock = script.slice(publishStart, publishEnd);
	assert.match(publishBlock, /const firstFieldIssue = error\.issues\.find\(\(issue\) => issue\.field && issue\.tab !== 'privacy'\);/);
	assert.match(publishBlock, /state\.activeTab = targetIssue\?\.tab \?\? 'preview';/);
	assert.doesNotMatch(publishBlock, /state\.activeTab = 'preview';/);
});

test('字段提示隐藏内部维度编号并去除重复操作说明', async () => {
	const [script, server, styles] = await Promise.all([
		readFile(new URL('local-admin/public/app.js', projectRoot), 'utf8'),
		readFile(new URL('local-admin/server.mjs', projectRoot), 'utf8'),
		readFile(new URL('local-admin/public/styles.css', projectRoot), 'utf8'),
	]);

	// 必填错误只说用户需要做什么，不再把 D02、D06 等内部维度编号重复显示。
	assert.doesNotMatch(script, /message:\s*`\$\{dimension\.dimension_code\}\s*·/);
	assert.doesNotMatch(server, /message:\s*`\$\{dimension\.dimension_code\}\s*·/);
	assert.match(script, /message:\s*`\$\{dimension\.name\}至少填写一项。`/);
	assert.match(server, /message:\s*`\$\{dimension\.name\}至少填写一项。`/);
	// 一般编辑卡片和查询摘要只显示中文名称；编码生成逻辑仍保留底层数据关系。
	assert.doesNotMatch(script, /<summary><span>\$\{escapeHtml\(dimension\.dimension_code\)\}/);
	assert.doesNotMatch(script, /escapeHtml\(entry\.dimension_code\)\}\} ·/);
	assert.doesNotMatch(script, /这是 Excel 中已打勾/);
	// 复选框和逐行输入已经接管格式，不再提示用户使用英文分号。
	assert.match(script, /!\/英文分号\|分号分隔\/\.test\(part\)/);
	assert.match(script, /part !== '规范名称'/);
	// 每个字段只显示一条简短提示：错误优先，不与普通帮助同时堆叠。
	assert.match(script, /const briefFieldHelpOverrides = new Map/);
	assert.match(script, /const briefFieldError = \(messages\) =>/);
	assert.match(script, /const notes = fieldIssues\.length[\s\S]{0,500}: help\.text/);
	assert.doesNotMatch(script, /escapeHtml\(fieldIssues\.join\('；'\)\)/);
	// 普通表单不再展示英文内部字段名，错误时也不再把整段字段标题染红。
	assert.doesNotMatch(script, /fieldVisibilityBadge\(scope, fieldCode\)\}<small>/);
	assert.match(styles, /\.form-field\.is-invalid > \.field-label \{\s*color: #4d4941;/s);
	assert.match(styles, /\.field-help \{[\s\S]{0,260}white-space: nowrap;/);
	assert.match(styles, /\.field-error \{[\s\S]{0,260}white-space: nowrap;/);
});

test('停止编辑约半分钟后自动保存草稿并更新状态栏', async () => {
	const script = await readFile(new URL('local-admin/public/app.js', projectRoot), 'utf8');

	assert.match(script, /const AUTO_SAVE_DELAY_MS = 30000;/);
	assert.match(script, /const scheduleAutoSaveDraft = \(\) => \{/);
	assert.match(script, /await saveDraft\(\{ reload: false, silent: true, autoSave: true \}\);/);
	assert.match(script, /state\.autoSaveNotice = autoSave \? `已自动保存 \$\{autoSaveTimeLabel\(\)\}` : '';/);
	// 状态栏优先显示自动保存提示
	assert.match(script, /: state\.autoSaveNotice\s*\n\s*\? state\.autoSaveNotice/);
	// 字段编辑、图片说明、图片增删都会安排自动保存
	const setFieldValueBlock = script.slice(
		script.indexOf('const setFieldValue ='),
		script.indexOf('const handleAdministrativeRegionCommit ='),
	);
	assert.match(setFieldValueBlock, /scheduleAutoSaveDraft\(\);/);
	assert.match(script, /scheduleAutoSaveDraft\(\);\s*\n\s*return;\s*\n\s*\}\s*\n\s*if \(event\.target\.matches\('\.field-control/);
});

test('编辑区图片支持灯箱放大查看并显示说明字数', async () => {
	const [html, script, styles] = await Promise.all([
		readFile(new URL('local-admin/public/index.html', projectRoot), 'utf8'),
		readFile(new URL('local-admin/public/app.js', projectRoot), 'utf8'),
		readFile(new URL('local-admin/public/styles.css', projectRoot), 'utf8'),
	]);

	assert.match(html, /id="image-lightbox"/);
	assert.match(html, /id="image-lightbox-previous"/);
	assert.match(html, /id="image-lightbox-next"/);
	assert.match(script, /data-image-lightbox=/);
	assert.match(script, /const showImageLightbox = \(index\) => \{/);
	assert.match(script, /elements\.imageLightbox\.showModal\(\);/);
	// 灯箱支持左右方向键与按钮切换
	assert.match(script, /ArrowLeft[\s\S]{0,80}stepImageLightbox\(-1\)/);
	// 说明框显示 n/180 计数并在输入时更新
	assert.match(script, /data-image-counter=/);
	assert.match(script, /counter\.textContent = `\$\{event\.target\.value\.length\}\/180`;/);
	assert.match(styles, /\.image-lightbox \{/);
	assert.match(styles, /\.image-preview-open \{/);
	assert.match(styles, /\.image-description-counter output \{/);
});

test('Ctrl+S 保存草稿且不影响浏览器默认行为之外的场景', async () => {
	const script = await readFile(new URL('local-admin/public/app.js', projectRoot), 'utf8');

	assert.match(script, /if \(!\(event\.ctrlKey \|\| event\.metaKey\) \|\| event\.key !== 's' \|\| event\.shiftKey \|\| event\.altKey\) return;/);
	assert.match(script, /if \(!elements\.saveDraftButton\.hidden && !elements\.saveDraftButton\.disabled\) saveDraftWithFeedback\(\);/);
});
