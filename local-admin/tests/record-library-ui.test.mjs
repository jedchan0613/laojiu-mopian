import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const projectRoot = new URL('../../', import.meta.url);

test('档案管理首页包含独立列表、速览和返回入口', async () => {
	const [html, script, styles] = await Promise.all([
		readFile(new URL('local-admin/public/index.html', projectRoot), 'utf8'),
		readFile(new URL('local-admin/public/app.js', projectRoot), 'utf8'),
		readFile(new URL('local-admin/public/styles.css', projectRoot), 'utf8'),
	]);

	assert.match(html, /class="records-pane"/);
	assert.match(html, /id="back-to-library-button"/);
	assert.match(script, /recordViewMode: 'overview'/);
	assert.match(script, /recordPage: 1, recordPageSize: 15/);
	assert.match(script, /recordFilters: \{ category: '', research: '', evidence: '', rights: '', imageStatus: '' \}/);
	assert.match(html, /id="record-advanced"/);
	assert.match(html, /data-record-filter="research"/);
	assert.match(html, /data-record-filter="evidence"/);
	assert.match(html, /data-record-filter="rights"/);
	assert.match(html, /data-record-filter="imageStatus"/);
	assert.match(script, /renderRecordOverview/);
	assert.match(script, /data-record-reference/);
	assert.match(script, /尚未选择档案/);
	assert.match(script, /if \(previousMode !== 'records'\) \{/);
	assert.match(script, /data-record-overview-action="edit"/);
	assert.doesNotMatch(script, /else if \(visibleRecords\[0\]\) previewRecord/);
	assert.match(styles, /body\.admin-v2\[data-workspace="records"\] \.app-shell/);
	assert.match(styles, /\.record-overview-hero/);
});

test('历史版本与图片回收区合并入口，但原恢复门槛保持不变', async () => {
	const [html, script] = await Promise.all([
		readFile(new URL('local-admin/public/index.html', projectRoot), 'utf8'),
		readFile(new URL('local-admin/public/app.js', projectRoot), 'utf8'),
	]);

	assert.match(html, /data-workspace="recovery"/);
	assert.doesNotMatch(html, /data-workspace="history"|data-workspace="recycle"/);
	assert.match(script, /data-recovery-tab="history"/);
	assert.match(script, /data-recovery-tab="recycle"/);
	assert.match(script, /撤销追溯快照保持只读/);
	assert.match(script, /恢复后只会生成草稿，不会直接公开/);
	assert.match(script, /\/api\/restore-recycle/);
	assert.match(script, /\/api\/restore-history/);
});

test('维护概览只保留四个摘要，图片说明与备份仍留在任务清单', async () => {
	const script = await readFile(new URL('local-admin/public/app.js', projectRoot), 'utf8');

	assert.doesNotMatch(script, /overview\.missingImageDescriptions|overview\.backupUnregistered/);
	assert.match(script, /add\('image_descriptions', 'fill'/);
	assert.match(script, /add\('backup_status_unregistered', 'fill'/);
	assert.match(script, /class="maintenance-guidance"/);
});

test('新建档案仍直接进入原有编辑流程', async () => {
	const script = await readFile(new URL('local-admin/public/app.js', projectRoot), 'utf8');
	const startNewRecordBlock = script.slice(
		script.indexOf('const startNewRecord ='),
		script.indexOf('const startSimilarRecord ='),
	);
	assert.match(startNewRecordBlock, /state\.recordViewMode = 'editor'/);
	assert.match(startNewRecordBlock, /renderTabs\(\)/);
	assert.match(startNewRecordBlock, /renderEditor\(\)/);
});

test('档案管理可按藏品时间从新到旧排序，并将未知年代放在最后', async () => {
	const [html, script] = await Promise.all([
		readFile(new URL('local-admin/public/index.html', projectRoot), 'utf8'),
		readFile(new URL('local-admin/public/app.js', projectRoot), 'utf8'),
	]);

	assert.match(html, /<option value="item-date-desc">按藏品时间<\/option>/);
	const sortingStart = script.indexOf('const normalizeRecordItemDate =');
	const sortingEnd = script.indexOf('const queryCodeLabel =');
	assert.ok(sortingStart >= 0 && sortingEnd > sortingStart, '应能读取档案排序逻辑');
	const createSortingHelpers = new Function(
		'state',
		'chineseCollator',
		`${script.slice(sortingStart, sortingEnd)}\nreturn { sortedRecords };`,
	);
	const { sortedRecords } = createSortingHelpers(
		{ recordSort: 'item-date-desc' },
		new Intl.Collator('zh-CN'),
	);
	const records = [
		{ core: { item_id: 'LJM-D', date_display: '年代未知' } },
		{ core: { item_id: 'LJM-B', date_display: '约1999年' } },
		{ core: { item_id: 'LJM-C', date_display: '年代未知', date_end: '1980-12-31' } },
		{ core: { item_id: 'LJM-A', date_display: '2008年', date_start: '2001-06-01' } },
		{ core: { item_id: 'LJM-E', date_display: '2001年' } },
	];

	assert.deepEqual(
		sortedRecords(records).map((record) => record.core.item_id),
		['LJM-A', 'LJM-E', 'LJM-B', 'LJM-C', 'LJM-D'],
	);
});

test('保存发布支持取消，并使用轻量图片与按需巡检', async () => {
	const [html, script, server] = await Promise.all([
		readFile(new URL('local-admin/public/index.html', projectRoot), 'utf8'),
		readFile(new URL('local-admin/public/app.js', projectRoot), 'utf8'),
		readFile(new URL('local-admin/server.mjs', projectRoot), 'utf8'),
	]);

	assert.match(html, /id="busy-cancel-button"/);
	assert.match(script, /new AbortController\(\)/);
	assert.match(script, /\/api\/cancel-operation/);
	assert.match(script, /\/api\/stage-image/);
	assert.match(script, /kind: 'staged'/);
	assert.match(script, /\?variant=thumb/);
	assert.match(script, /loading="lazy" decoding="async"/);
	assert.match(script, /\/api\/integrity-report/);
	assert.match(server, /const runManagedOperation =/);
	assert.match(server, /const responsiveImageVariant =/);
	assert.match(server, /url\.pathname === '\/api\/integrity-report'/);
	assert.doesNotMatch(
		server.slice(server.indexOf('const loadBootstrap ='), server.indexOf('const computeBootstrapSignature =')),
		/createIntegrityReport\(/,
	);
});

test('投稿与联系页面使用新版管理界面视觉', async () => {
	const [submissionsHtml, contactsHtml, submissionsStyles, contactsStyles] = await Promise.all([
		readFile(new URL('local-admin/public/submissions.html', projectRoot), 'utf8'),
		readFile(new URL('local-admin/public/contacts.html', projectRoot), 'utf8'),
		readFile(new URL('local-admin/public/submissions.css', projectRoot), 'utf8'),
		readFile(new URL('local-admin/public/contacts.css', projectRoot), 'utf8'),
	]);

	assert.match(submissionsHtml, /<body class="review-v2">/);
	assert.match(contactsHtml, /<body class="review-v2">/);
	assert.match(submissionsStyles, /--accent:\s*#4f46e5/);
	assert.match(submissionsStyles, /background:\s*#f5f7fb/);
	assert.match(contactsStyles, /\.contact-message/);
	assert.doesNotMatch(`${submissionsStyles}\n${contactsStyles}`, /#8e432e|#eeece4/i);
});

test('管理端启动数据拆分并使用私密压缩传输', async () => {
	const [script, server] = await Promise.all([
		readFile(new URL('local-admin/public/app.js', projectRoot), 'utf8'),
		readFile(new URL('local-admin/server.mjs', projectRoot), 'utf8'),
	]);

	assert.match(script, /fetch\('\/api\/admin-standards'/);
	assert.match(script, /Promise\.all\(\[\s*fetch\('\/api\/bootstrap\?format=split-v1'/);
	assert.match(script, /if \(state\.standards\) return state\.standards/);
	assert.match(script, /separatelyLoadedStandards \?\? data\.standards/);
	assert.match(server, /brotliCompressSync/);
	assert.match(server, /gzipSync/);
	assert.match(server, /'Content-Encoding': encoding/);
	assert.match(server, /url\.pathname === '\/api\/admin-standards'/);
	assert.match(server, /splitResponse \? 'split' : 'full'/);
	assert.match(server, /W\/"ljm-standards-/);
	const bootstrapResponse = server.slice(
		server.indexOf('const loadBootstrap ='),
		server.indexOf('const computeBootstrapSignature ='),
	);
	assert.doesNotMatch(bootstrapResponse, /\n\s*standards:\s*\{/);
});

test('公开详情页和管理端预览的大图固定在中央栏', async () => {
	const [detailPage, previewStyles] = await Promise.all([
		readFile(new URL('site/src/pages/archive/[id].astro', projectRoot), 'utf8'),
		readFile(new URL('local-admin/public/styles.css', projectRoot), 'utf8'),
	]);

	for (const styles of [detailPage, previewStyles]) {
		assert.match(styles, /\.lightbox-previous\s*\{\s*grid-column:\s*1;/s);
		assert.match(styles, /\.lightbox-figure\s*\{[^}]*grid-column:\s*2;/s);
		assert.match(styles, /\.lightbox-next\s*\{\s*grid-column:\s*3;/s);
	}
});
