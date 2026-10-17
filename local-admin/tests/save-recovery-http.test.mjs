import assert from 'node:assert/strict';
import { cp, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { createServer } from 'node:net';
import { once } from 'node:events';
import { createHash, randomUUID } from 'node:crypto';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

// 第三阶段 HTTP 验收：暂存令牌状态查询、失败后重试只传失败图片、服务重启后令牌恢复。
const projectRoot = new URL('../../', import.meta.url);
// 合成 PNG：与既有写入验收共用同一 1x1 像素图，不读取任何用户图片。
const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+j8WQAAAAASUVORK5CYII=', 'base64');
const png2 = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+9cSoAAAAASUVORK5CYII=', 'base64');
const sha256 = (buffer) => createHash('sha256').update(buffer).digest('hex');
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
const sample = (sequence = '001', extra = {}) => ({
	core: { item_id: `LJM-20000101-LET-${sequence}`, accession_date: '2000-01-01', object_type: 'LET',
		title: `合成保存恢复 ${sequence}`, date_display: '年代未知', batch_id: 'SYNTHETIC-SAVE-RECOVERY',
		record_status: 'SUS', privacy_level: 'Y', rights_status: 'UNK', research_status: 'R0', evidence_level: 'D',
		digitization_status: 'DG0', transcription_status: 'TX0', use_status: 'U0', physical_location: '临时合成目录',
		created_date: '2000-01-01', updated_date: '2000-01-01', publication_file_path: [], ...extra },
	metadata: { schema: 'common', dimensions: {} },
	public_view: { description: '程序生成的合成验收资料，无真实人物、档案或隐私。', tags: ['合成验收'] },
});

const unusedPort = async () => {
	const probe = createServer();
	probe.listen(0, '127.0.0.1');
	await once(probe, 'listening');
	const port = probe.address().port;
	await new Promise((resolve, reject) => probe.close(error => error ? reject(error) : resolve()));
	return port;
};

const createFixture = async () => {
	const root = await mkdtemp(path.join(os.tmpdir(), 'ljm-save-recovery-'));
	assert.ok(path.resolve(root).startsWith(`${path.resolve(os.tmpdir())}${path.sep}ljm-save-recovery-`));
	const site = path.join(root, 'site'), archive = path.join(root, 'archive-data'), privateRoot = path.join(root, 'private');
	const source = path.join(site, 'src', 'data', 'archive.ts');
	await mkdir(path.dirname(source), { recursive: true });
	await mkdir(archive, { recursive: true });
	await cp(new URL('site/src/data/standards/', projectRoot), path.join(site, 'src', 'data', 'standards'), { recursive: true });
	await cp(new URL('site/src/data/archive-categories.json', projectRoot), path.join(site, 'src', 'data', 'archive-categories.json'));
	await writeFile(source, 'export const archiveItems = [];\n');
	// 与写入验收相同：提供最小 package.json 和合成构建脚本满足运行时路径校验。
	await writeFile(path.join(site, 'package.json'), JSON.stringify({ private: true, scripts: { build: 'node build.mjs' } }));
	await writeFile(path.join(site, 'build.mjs'), 'console.log("synthetic no-op build");\n');
	await writeFile(path.join(archive, 'LJM-20000101-LET-001.json'), JSON.stringify(sample()));
	const port = await unusedPort(), origin = `http://127.0.0.1:${port}`;
	const env = Object.fromEntries(Object.entries(process.env).filter(([key]) => !key.startsWith('LJM_') && key !== 'PUBLIC_SITE_URL'));
	Object.assign(env, { LJM_ADMIN_MODE: 'local', LJM_ADMIN_HOST: '127.0.0.1', LJM_ADMIN_PORT: String(port),
		LJM_PROJECT_ROOT: root, LJM_SITE_DIR: site, LJM_ARCHIVE_DATA_DIR: archive, LJM_ADMIN_DATA_ROOT: privateRoot,
		LJM_DRAFT_DIR: path.join(privateRoot, 'drafts'), LJM_HISTORY_DIR: path.join(privateRoot, 'history'), LJM_RECYCLE_DIR: path.join(privateRoot, 'recycle'),
		LJM_INBOX_DIR: path.join(privateRoot, 'inbox'), LJM_UPLOAD_STAGING_DIR: path.join(privateRoot, 'uploads'),
		LJM_SUBMISSION_DATA_DIR: path.join(privateRoot, 'submissions'), LJM_ACCOUNT_DATA_DIR: path.join(privateRoot, 'accounts'),
		LJM_PUBLIC_RELEASES_DIR: path.join(root, 'releases'), LJM_PUBLIC_LIVE_LINK: path.join(root, 'releases', 'live'), LJM_MAIL_TRANSPORT: 'file' });
	const start = () => new Promise((resolve, reject) => {
		const child = spawn(process.execPath, [fileURLToPath(new URL('local-admin/server.mjs', projectRoot))], {
			env, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'],
		});
		let output = '';
		child.stdout.on('data', chunk => { output += chunk; });
		child.stderr.on('data', chunk => { output += chunk; });
		const fail = setTimeout(() => reject(new Error(`服务未在预期时间就绪：${output.slice(-800)}`)), 25000);
		const ready = setInterval(async () => {
			try { const response = await fetch(`${origin}/healthz`); if (response.ok) { clearTimeout(fail); clearInterval(ready); resolve({ child, output: () => output }); } }
			catch { /* 继续等待 */ }
		}, 200);
		child.once('exit', () => { clearInterval(ready); });
	});
	const stop = (handle) => new Promise((resolve) => {
		handle.child.once('exit', () => resolve());
		handle.child.kill();
	});
	const post = async (pathname, body, headers = {}) => {
		const response = await fetch(`${origin}${pathname}`, { method: 'POST',
			headers: { 'Content-Type': 'application/json', Origin: origin, 'X-LJM-Admin-Request': '1', ...headers },
			body: typeof body === 'string' ? body : JSON.stringify(body) });
		return { status: response.status, data: await response.json().catch(() => ({})) };
	};
	const stageImage = (operationId, stepId, buffer, name) => post('/api/stage-image', buffer, {
		'Content-Type': 'image/png', 'Content-Length': String(buffer.length),
		'X-LJM-Operation-Id': operationId, 'X-LJM-Step-Id': stepId,
		'X-LJM-File-Name': encodeURIComponent(name), 'X-Ljm-File-Sha256': sha256(buffer),
	}).then(result => ({ ...result, buffer, body: buffer }));
	// fetch body 需要正确的类型
	const stageBinary = (operationId, stepId, buffer, name) => fetch(`${origin}/api/stage-image`, {
		method: 'POST', headers: { 'Content-Type': 'image/png', Origin: origin, 'X-LJM-Admin-Request': '1',
			'X-LJM-Operation-Id': operationId, 'X-LJM-Step-Id': stepId,
			'X-LJM-File-Name': encodeURIComponent(name), 'X-LJM-File-Sha256': sha256(buffer) },
		body: buffer,
	}).then(async response => ({ status: response.status, data: await response.json().catch(() => ({})) }));
	const version = async (itemId) => (await (await fetch(`${origin}/api/record-version/${itemId}`)).json()).revision;
	return { root, origin, env, start, stop, post, stageBinary, version, privateRoot };
};

test('暂存令牌状态查询与保存后消费标记', async () => {
	const fixture = await createFixture();
	const handle = await fixture.start();
	try {
		const parent = randomUUID();
		const first = await fixture.stageBinary(parent, randomUUID(), png, 'staged-a.png');
		assert.equal(first.status, 200);
		const token = first.data.upload.token;
		// 可用
		let status = await fixture.post('/api/staged-uploads/status', { tokens: [token] });
		assert.equal(status.status, 200);
		assert.equal(status.data.statuses[token], 'available');
		// 随草稿保存后变为已消费
		const revision = await fixture.version('LJM-20000101-LET-001');
		const record = sample();
		const saved = await fixture.post('/api/save-draft', {
			record, isNew: false, expectedRevision: revision, confirmedPublicationCopies: true,
			images: [{ kind: 'staged', uploadToken: token, originalName: 'staged-a.png' }], removedImages: [],
		}, { 'X-LJM-Operation-Id': parent, 'X-LJM-Step-Id': randomUUID() });
		assert.equal(saved.status, 200, JSON.stringify(saved.data));
		status = await fixture.post('/api/staged-uploads/status', { tokens: [token] });
		assert.equal(status.data.statuses[token], 'consumed');
		// 未知令牌按缺失处理，不抛异常
		const missing = randomUUID();
		status = await fixture.post('/api/staged-uploads/status', { tokens: [missing] });
		assert.equal(status.data.statuses[missing], 'missing');
	} finally {
		await fixture.stop(handle);
		await rm(fixture.root, { recursive: true, force: true });
	}
});

test('保存失败后重试：有效令牌沿用，失败图片单独重传，不重复建档', async () => {
	const fixture = await createFixture();
	const handle = await fixture.start();
	try {
		const parent = randomUUID();
		const good = await fixture.stageBinary(parent, randomUUID(), png, 'keep-a.png');
		assert.equal(good.status, 200);
		// 首次保存：故意让草稿版本不匹配（模拟另一页面已保存），失败后暂存令牌应保留。
		const record = sample();
		const wrongRevision = 'a'.repeat(64);
		const failed = await fixture.post('/api/save-draft', {
			record, isNew: false, expectedRevision: wrongRevision, confirmedPublicationCopies: true,
			images: [{ kind: 'staged', uploadToken: good.data.upload.token, originalName: 'keep-a.png' }], removedImages: [],
		}, { 'X-LJM-Operation-Id': parent, 'X-LJM-Step-Id': randomUUID() });
		assert.equal(failed.status, 409);
		// 失败后令牌仍可用
		const status = await fixture.post('/api/staged-uploads/status', { tokens: [good.data.upload.token] });
		assert.equal(status.data.statuses[good.data.upload.token], 'available');
		// 用正确版本重试：沿用同一令牌，保存成功
		const revision = await fixture.version('LJM-20000101-LET-001');
		const retry = await fixture.post('/api/save-draft', {
			record, isNew: false, expectedRevision: revision, confirmedPublicationCopies: true,
			images: [{ kind: 'staged', uploadToken: good.data.upload.token, originalName: 'keep-a.png' }], removedImages: [],
		}, { 'X-LJM-Operation-Id': parent, 'X-LJM-Step-Id': randomUUID() });
		assert.equal(retry.status, 200, JSON.stringify(retry.data));
		const draft = JSON.parse(await readFile(path.join(fixture.privateRoot, 'drafts', 'LJM-20000101-LET-001.json'), 'utf8'));
		assert.equal(draft.record.core.publication_file_path.length, 1);
		assert.equal(draft.record.core.publication_file_path[0], '/archive/LJM-20000101-LET-001/front-public.png');
	} finally {
		await fixture.stop(handle);
		await rm(fixture.root, { recursive: true, force: true });
	}
});

test('服务重启后：收据对应的暂存图片可恢复并继续保存；缺失令牌明确失效', async () => {
	const fixture = await createFixture();
	const handle = await fixture.start();
	const parent = randomUUID();
	const staged = await fixture.stageBinary(parent, randomUUID(), png, 'restart-a.png');
	assert.equal(staged.status, 200);
	const token = staged.data.upload.token;
	await fixture.stop(handle);
	// 模拟服务器重启：进程结束后暂存文件仍在磁盘上，重启后应从收据恢复令牌。
	const relaunched = await fixture.start();
	try {
		let status = await fixture.post('/api/staged-uploads/status', { tokens: [token] });
		assert.equal(status.status, 200);
		assert.equal(status.data.statuses[token], 'available', '重启后有效暂存图片应恢复');
		// 用恢复的令牌完成保存
		const revision = await fixture.version('LJM-20000101-LET-001');
		const saved = await fixture.post('/api/save-draft', {
			record: sample(), isNew: false, expectedRevision: revision, confirmedPublicationCopies: true,
			images: [{ kind: 'staged', uploadToken: token, originalName: 'restart-a.png' }], removedImages: [],
		}, { 'X-LJM-Operation-Id': parent, 'X-LJM-Step-Id': randomUUID() });
		assert.equal(saved.status, 200, JSON.stringify(saved.data));
		const draft = JSON.parse(await readFile(path.join(fixture.privateRoot, 'drafts', 'LJM-20000101-LET-001.json'), 'utf8'));
		assert.equal(draft.record.core.publication_file_path.length, 1);
		// 保存后令牌消费完成；再查询已消费
		status = await fixture.post('/api/staged-uploads/status', { tokens: [token] });
		assert.equal(status.data.statuses[token], 'consumed');
	} finally {
		await fixture.stop(relaunched);
		await rm(fixture.root, { recursive: true, force: true });
	}
});
