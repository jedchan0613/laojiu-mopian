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
