import assert from 'node:assert/strict';
import { cp, mkdir, mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { createServer } from 'node:net';
import { request as httpRequest } from 'node:http';
import { once } from 'node:events';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import { albumPositionSortKey, compareAlbumPositions } from '../../site/src/data/album-position.mjs';

const projectRoot = new URL('../../', import.meta.url);

const readScript = async () => (await readFile(new URL('local-admin/public/app.js', projectRoot), 'utf8')).replaceAll('\r\n', '\n');

test('档案列表提供按相册筛选入口，激活时按原始位置排序并显示页序', async () => {
	const html = await readFile(new URL('local-admin/public/index.html', projectRoot), 'utf8');
	assert.match(html, /id="record-album-filter"/);
	assert.match(html, /list="record-album-options"/);
	const script = await readScript();
	assert.match(script, /recordAlbumFilter: ''/);
	assert.match(script, /String\(record\.core\.album_id \?\? ''\)\.trim\(\) === wantedAlbum/);
	assert.match(script, /compareAlbumPositions\(left\.core\.original_position, right\.core\.original_position\)/);
	assert.match(script, /页序未填/);
	assert.match(script, /state\.recordAlbumFilter = ''/);
});

test('相册编号字段带同册编号建议与轻提醒', async () => {
	const script = await readScript();
	assert.match(script, /list="album-id-suggestions"/);
	assert.match(script, /datalist id="album-id-suggestions"/);
	assert.match(script, /但还没有相册（ALB）总档案。`, warning: true/);
	assert.match(script, /新相册编号；整理时建议再补一条相册（ALB）总档案。/);
});

test('管理端页序解析与公开站共享模块结果一致', async () => {
	const script = await readScript();
	assert.ok(/from ['"]\.\/album-position\.mjs['"]/.test(script), '管理端应直接导入同一份共享页序模块');
	assert.ok(!/const albumPositionSortKey =/.test(script), '管理端不再复制页序算法');
	const shared = await import('../../shared/album-position.mjs');
	assert.equal(albumPositionSortKey, shared.albumPositionSortKey);
	assert.equal(compareAlbumPositions, shared.compareAlbumPositions);
});

const unusedPort = async () => {
	const probe = createServer();
	probe.listen(0, '127.0.0.1');
	await once(probe, 'listening');
	const port = probe.address().port;
	await new Promise((resolve, reject) => probe.close((error) => error ? reject(error) : resolve()));
	return port;
};

// 使用真实 HTTP 保存和发布入口，只写新建临时目录中的合成资料，不读取真实档案或触发构建。
test('相册关联在真实服务中保持草稿隔离、输入安全与发布门禁', { timeout: 30000 }, async (t) => {
	const fixtureRoot = await mkdtemp(path.join(os.tmpdir(), 'ljm-album-service-test-'));
	assert.ok(path.resolve(fixtureRoot).startsWith(`${path.resolve(os.tmpdir())}${path.sep}ljm-album-service-test-`));
	const site = path.join(fixtureRoot, 'site');
	const privateRoot = path.join(fixtureRoot, 'private');
	const archive = path.join(fixtureRoot, 'archive-data');
	const sourcePath = path.join(site, 'src', 'data', 'archive.ts');
	const sourceBefore = 'export const archiveItems = [];\n';
	await mkdir(path.dirname(sourcePath), { recursive: true });
	await mkdir(archive, { recursive: true });
	await cp(new URL('site/src/data/standards/', projectRoot), path.join(site, 'src', 'data', 'standards'), { recursive: true });
	await cp(new URL('site/src/data/archive-categories.json', projectRoot), path.join(site, 'src', 'data', 'archive-categories.json'));
	await writeFile(path.join(site, 'package.json'), '{"private":true}\n');
	await writeFile(sourcePath, sourceBefore);
	const fixture = (type, sequence, extra = {}) => ({
		core: { item_id: `LJM-20000101-${type}-${sequence}`, accession_date: '2000-01-01', object_type: type,
			title: '测试档案', date_display: '年代未知', record_status: 'ACT', privacy_level: 'G', use_status: 'U3',
			created_date: '2000-01-01', publication_file_path: [], ...extra },
		metadata: { schema: ['PHO', 'ALB'].includes(type) ? 'photo' : 'common', dimensions: {} }, public_view: {},
	});
	const officialAlbum = fixture('ALB', '001', { album_id: '旧相册 A_01' });
	const withdrawnAlbum = fixture('ALB', '002', { album_id: '已撤册', record_status: 'WDR' });
	const officialPhoto = fixture('PHO', '001', { album_id: '旧相册 A_01', original_position: '第2页左上' });
	const albumPendingRename = fixture('ALB', '006', { album_id: '正式旧编号' });
	const originals = [officialAlbum, withdrawnAlbum, officialPhoto, albumPendingRename];
	const officialBefore = new Map();
	for (const record of originals) {
		const filename = `${record.core.item_id}.json`;
		const content = `${JSON.stringify(record)}\n`;
		officialBefore.set(filename, content);
		await writeFile(path.join(archive, filename), content);
	}
	const port = await unusedPort();
	const origin = `http://127.0.0.1:${port}`;
	const child = spawn(process.execPath, [fileURLToPath(new URL('local-admin/server.mjs', projectRoot))], {
		env: { ...process.env, LJM_ADMIN_MODE: 'local', LJM_ADMIN_HOST: '127.0.0.1', LJM_ADMIN_PORT: String(port),
			LJM_PROJECT_ROOT: fixtureRoot, LJM_SITE_DIR: site, LJM_ARCHIVE_DATA_DIR: archive,
			LJM_ADMIN_DATA_ROOT: privateRoot, LJM_DRAFT_DIR: path.join(privateRoot, 'drafts'),
			LJM_HISTORY_DIR: path.join(privateRoot, 'history'), LJM_RECYCLE_DIR: path.join(privateRoot, 'recycle'),
			LJM_INBOX_DIR: path.join(privateRoot, 'inbox'), LJM_UPLOAD_STAGING_DIR: path.join(privateRoot, 'uploads'),
			LJM_SUBMISSION_DATA_DIR: path.join(privateRoot, 'submissions'), LJM_ACCOUNT_DATA_DIR: path.join(privateRoot, 'accounts'),
			LJM_MAIL_TRANSPORT: 'file' }, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'],
	});
	let processOutput = '';
	child.stdout.on('data', (chunk) => { processOutput += chunk; });
	child.stderr.on('data', (chunk) => { processOutput += chunk; });
	t.after(async () => {
		if (child.exitCode === null) {
			const ended = once(child, 'exit');
			child.kill('SIGTERM');
			await ended;
		}
		await rm(fixtureRoot, { recursive: true, force: true });
	});
	const deadline = Date.now() + 10000;
	let ready = false;
	while (Date.now() < deadline && child.exitCode === null) {
		try { ready = (await fetch(`${origin}/healthz`)).ok; } catch {}
		if (ready) break;
		await new Promise((resolve) => setTimeout(resolve, 40));
	}
	assert.ok(ready, `测试服务未能启动：${processOutput}`);
	const post = async (route, payload, headers = {}) => {
		const response = await fetch(`${origin}${route}`, { method: 'POST', headers: {
			'content-type': 'application/json', 'x-ljm-admin-request': '1', origin, ...headers }, body: JSON.stringify(payload) });
		return { status: response.status, body: await response.json() };
	};
	const save = (record, isNew = true) => post('/api/save-draft', { record, isNew, images: [] });
	const issuesFor = async (record) => {
		const response = await post('/api/publish', { itemId: record.core.item_id, confirmations: [] });
		assert.equal(response.status, 400);
		assert.ok(response.body.issues?.some((issue) => issue.code === 'privacy_confirmation'), '未确认隐私不能发布');
		return response.body.issues;
	};

	await t.test('维护自己保留永久编号和已发布资料，已有中文编号可保存', async () => {
		const result = await save(structuredClone(officialAlbum), false);
		assert.equal(result.status, 200, JSON.stringify(result.body));
		assert.equal(result.body.draft.record.core.item_id, officialAlbum.core.item_id);
		assert.equal(result.body.draft.record.core.album_id, '旧相册 A_01');
		assert.deepEqual(['record_status', 'privacy_level', 'use_status'].map((field) => result.body.draft.record.core[field]), ['SUS', 'Y', 'U0']);
		assert.ok(!(await issuesFor(officialAlbum)).some((issue) => issue.code === 'album_duplicate_parent'));
	});
	await t.test('非法相册/位置字段返回可定位的错误，保存前阻断', async () => {
		for (const [field, value] of [['album_id', []], ['album_id', {}], ['album_id', 1], ['album_id', '../secret'],
			['album_id', 'C:\\private'], ['album_id', '.'], ['album_id', 'a\n'], ['album_id', 'x'.repeat(201)],
			['original_position', []], ['original_position', 1], ['original_position', 'x'.repeat(501)]]) {
			const record = fixture('PHO', '010', { [field]: value });
			const response = await save(record);
			assert.equal(response.status, 400, `${field}=${JSON.stringify(value)}`);
			assert.ok(response.body.issues.some((issue) => issue.tab === 'basic' && issue.field === field));
		}
		await assert.rejects(readFile(path.join(privateRoot, 'drafts', 'LJM-20000101-PHO-010.json')));
	});
	await t.test('先录照片、缺位置与重复位置仍能存草稿，隐私门禁保留', async () => {
		const photo = fixture('PHO', '002', { album_id: '尚无总册' });
		assert.equal((await save(photo)).status, 200);
		assert.ok(!(await issuesFor(photo)).some((issue) => issue.code.startsWith('album_')));
		const samePosition = fixture('PHO', '003', { album_id: '旧相册 A_01', original_position: '第2页左上' });
		assert.equal((await save(samePosition)).status, 200);
		assert.ok(!(await issuesFor(samePosition)).some((issue) => issue.code.startsWith('album_')));
	});
	await t.test('同号总册可先保存改错，但正式发布必须阻断', async () => {
		const second = fixture('ALB', '003', { album_id: '旧相册 A_01' });
		assert.equal((await save(second)).status, 200);
		const issues = await issuesFor(second);
		assert.ok(issues.some((issue) => issue.code === 'album_duplicate_parent' && issue.field === 'album_id' && issue.tab === 'basic'));
		const different = fixture('ALB', '004', { album_id: '全新相册' });
		assert.equal((await save(different)).status, 200);
		assert.ok(!(await issuesFor(different)).some((issue) => issue.code.startsWith('album_')));
		const noParentPosition = fixture('ALB', '005', { album_id: '已撤册' });
		assert.equal((await save(noParentPosition)).status, 200);
		assert.ok(!(await issuesFor(noParentPosition)).some((issue) => issue.code.startsWith('album_')), '撤销总册不占用关联，ALB无需填原始位置');
	});
	await t.test('草稿改号不能掩盖尚未改变的正式相册编号', async () => {
		const renamed = structuredClone(albumPendingRename);
		renamed.core.album_id = '准备改号';
		assert.equal((await save(renamed, false)).status, 200);
		const conflicting = fixture('ALB', '007', { album_id: '正式旧编号' });
		assert.equal((await save(conflicting)).status, 200);
		assert.ok((await issuesFor(conflicting)).some((issue) => issue.code === 'album_duplicate_parent'));
	});
	await t.test('正式发布再次校验旧草稿中的非法字段', async () => {
		const record = fixture('PHO', '004', { album_id: '先录照片' });
		assert.equal((await save(record)).status, 200);
		const draftPath = path.join(privateRoot, 'drafts', `${record.core.item_id}.json`);
		const draft = JSON.parse(await readFile(draftPath, 'utf8'));
		draft.record.core.album_id = { invalid: true };
		await writeFile(draftPath, JSON.stringify(draft));
		assert.ok((await issuesFor(record)).some((issue) => issue.code === 'album_album_id_invalid' && issue.field === 'album_id'));
	});
	await t.test('旧其他类型关联不被清空，也不作为照片或总册阻断', async () => {
		const letter = fixture('LET', '001', { album_id: '旧相册 A_01', original_position: '附页' });
		assert.equal((await save(letter)).status, 200);
		assert.ok(!(await issuesFor(letter)).some((issue) => issue.code.startsWith('album_')));
	});
	await t.test('仅提供受保护的共享页序文件，不暴露 shared 目录', async () => {
		const module = await fetch(`${origin}/admin/album-position.mjs`);
		assert.equal(module.status, 200);
		assert.match(module.headers.get('content-type'), /javascript/);
		assert.equal(await module.text(), await readFile(new URL('shared/album-position.mjs', projectRoot), 'utf8'));
		const head = await fetch(`${origin}/admin/album-position.mjs`, { method: 'HEAD' });
		assert.equal(head.status, 200);
		assert.equal(await head.text(), '');
		assert.equal((await fetch(`${origin}/shared/album-position.mjs`)).status, 404);
		assert.equal((await fetch(`${origin}/admin/other-shared.mjs`)).status, 404);
		const foreignHostStatus = await new Promise((resolve, reject) => {
			const request = httpRequest(`${origin}/admin/album-position.mjs`, { headers: { host: 'attacker.test' } }, (response) => {
				response.resume(); response.once('end', () => resolve(response.statusCode));
			});
			request.once('error', reject); request.end();
		});
		assert.equal(foreignHostStatus, 403);
	});
	await t.test('跨站保存被阻止，正式档案与公开源完整保留', async () => {
		assert.equal((await post('/api/save-draft', { record: fixture('PHO', '009'), isNew: true, images: [] }, { origin: 'https://attacker.test' })).status, 403);
		for (const [filename, content] of officialBefore) assert.equal(await readFile(path.join(archive, filename), 'utf8'), content);
		assert.equal(await readFile(sourcePath, 'utf8'), sourceBefore);
		assert.equal((await readdir(archive)).length, officialBefore.size);
		const history = await readdir(path.join(privateRoot, 'history')).catch(() => []);
		assert.deepEqual(history, []);
	});
});
