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
	assert.match(script, /page: 1, pageSize: 15/);
	assert.match(script, /renderRecordOverview/);
	assert.match(script, /尚未选择档案/);
	assert.match(script, /if \(previousMode !== 'records'\) \{/);
	assert.match(script, /data-record-overview-action="edit"/);
	assert.doesNotMatch(script, /else if \(visibleRecords\[0\]\) previewRecord/);
	assert.match(styles, /body\.admin-v2\[data-workspace="records"\] \.app-shell/);
	assert.match(styles, /\.record-overview-hero/);
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
