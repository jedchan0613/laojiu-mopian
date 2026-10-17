import assert from 'node:assert/strict';
import { cp, mkdir, mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { createServer } from 'node:net';
import { once } from 'node:events';
import { createHash, randomUUID } from 'node:crypto';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const projectRoot = new URL('../../', import.meta.url);
// 固定合成 PNG，不读取用户图片；所有发布、恢复和构建均限定在新建的临时目录。
const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+j8WQAAAAASUVORK5CYII=', 'base64');
const confirmations = Array(13).fill(true);
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
const exists = (file) => readFile(file).then(() => true, () => false);
const operation = (parent = randomUUID()) => ({ parent, step: randomUUID() });
const sample = (sequence = '001', extra = {}) => ({
	core: { item_id: `LJM-20000101-LET-${sequence}`, accession_date: '2000-01-01', object_type: 'LET',
		title: `合成写入验收 ${sequence}`, date_display: '年代未知', batch_id: 'SYNTHETIC-WRITE-TEST',
		record_status: 'ACT', privacy_level: 'G', rights_status: 'UNK', research_status: 'R0', evidence_level: 'D',
		digitization_status: 'DG0', transcription_status: 'TX0', use_status: 'U3', physical_location: '临时合成目录',
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

const createFixture = async (t, { officialCount = 1 } = {}) => {
	const root = await mkdtemp(path.join(os.tmpdir(), 'ljm-write-safety-http-'));
	assert.ok(path.resolve(root).startsWith(`${path.resolve(os.tmpdir())}${path.sep}ljm-write-safety-http-`));
	const site = path.join(root, 'site'), archive = path.join(root, 'archive-data'), privateRoot = path.join(root, 'private');
	const draftDirectory = path.join(privateRoot, 'drafts'), inbox = path.join(privateRoot, 'inbox');
	const source = path.join(site, 'src', 'data', 'archive.ts');
	await mkdir(path.dirname(source), { recursive: true });
	await mkdir(archive, { recursive: true });
	await cp(new URL('site/src/data/standards/', projectRoot), path.join(site, 'src', 'data', 'standards'), { recursive: true });
	await cp(new URL('site/src/data/archive-categories.json', projectRoot), path.join(site, 'src', 'data', 'archive-categories.json'));
	await writeFile(source, 'export const archiveItems = [];\n');
	// 用临时站点的正式 npm build 入口制造可控成功、失败与等待，不替换服务内部函数。
	await writeFile(path.join(site, 'package.json'), JSON.stringify({ private: true, scripts: { build: 'node build.mjs' } }));
	await writeFile(path.join(site, 'build.mjs'), `import fs from 'node:fs/promises';
const read = async f => { try { return await fs.readFile(f,'utf8'); } catch { return ''; } };
const count = Number(await read('build-count')) + 1;
await fs.writeFile('build-count',String(count));
await fs.writeFile('build-start-'+count,'started');
while (await read('build-hold')) await new Promise(r=>setTimeout(r,25));
if (Number(await read('build-fail-at')) === count) { console.error('synthetic controlled build failure'); process.exitCode=1; }
else console.log('synthetic build '+count);
`);
	for (let index = 1; index <= officialCount; index++) {
		const record = sample(String(index).padStart(3, '0'));
		const id = record.core.item_id;
		record.core.publication_file_path = [`/archive/${id}/front-public.png`];
		for (const directory of [path.join(inbox, id), path.join(site, 'public', 'archive', id)]) {
			await mkdir(directory, { recursive: true });
			await writeFile(path.join(directory, 'front-public.png'), png);
		}
		await writeFile(path.join(archive, `${id}.json`), JSON.stringify(record));
	}
	const port = await unusedPort(), origin = `http://127.0.0.1:${port}`;
	const env = Object.fromEntries(Object.entries(process.env).filter(([key]) => !key.startsWith('LJM_') && key !== 'PUBLIC_SITE_URL'));
	Object.assign(env, { LJM_ADMIN_MODE: 'local', LJM_ADMIN_HOST: '127.0.0.1', LJM_ADMIN_PORT: String(port),
		LJM_PROJECT_ROOT: root, LJM_SITE_DIR: site, LJM_ARCHIVE_DATA_DIR: archive, LJM_ADMIN_DATA_ROOT: privateRoot,
		LJM_DRAFT_DIR: draftDirectory, LJM_HISTORY_DIR: path.join(privateRoot, 'history'), LJM_RECYCLE_DIR: path.join(privateRoot, 'recycle'),
		LJM_INBOX_DIR: inbox, LJM_UPLOAD_STAGING_DIR: path.join(privateRoot, 'uploads'),
		LJM_SUBMISSION_DATA_DIR: path.join(privateRoot, 'submissions'), LJM_ACCOUNT_DATA_DIR: path.join(privateRoot, 'accounts'),
		LJM_PUBLIC_RELEASES_DIR: path.join(root, 'releases'), LJM_PUBLIC_LIVE_LINK: path.join(root, 'releases', 'live'), LJM_MAIL_TRANSPORT: 'file' });
	const child = spawn(process.execPath, [fileURLToPath(new URL('local-admin/server.mjs', projectRoot))], {
		env, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'],
	});
	let output = '';
	child.stdout.on('data', chunk => { output += chunk; }); child.stderr.on('data', chunk => { output += chunk; });
	t.after(async () => {
		await rm(path.join(site, 'build-hold'), { force: true });
		if (child.exitCode === null) { const ended = once(child, 'exit'); child.kill('SIGTERM'); await ended; }
		// 仅删除由本测试 mkdtemp 建立且核对过的隔离目录。
		assert.ok(path.resolve(root).startsWith(`${path.resolve(os.tmpdir())}${path.sep}ljm-write-safety-http-`));
		await rm(root, { recursive: true, force: true, maxRetries: 10, retryDelay: 100 });
	});
	let ready = false;
	for (let attempt = 0; attempt < 250 && child.exitCode === null; attempt++) {
		try { ready = (await fetch(`${origin}/healthz`)).ok; } catch {}
		if (ready) break;
		await sleep(40);
	}
	assert.ok(ready, `隔离服务启动失败：${output}`);
	const get = async route => { const response = await fetch(`${origin}${route}`); return { status: response.status, body: await response.json() }; };
	const reviewIds = new Map();
	const post = async (route, payload, ids = operation(), extraHeaders = {}) => {
		// 合成资料的人工检查测试先显式生成版本清单；复用同版本清单以验证重放。
		const reviewFor = async (itemId, revision) => {
			const key = `${itemId}:${revision}`;
			if (!reviewIds.has(key)) {
				const result = await post('/api/publication-review', { itemId, expectedRevision: revision });
				reviewIds.set(key, result.body.reviewId);
			}
			return reviewIds.get(key);
		};
		if (route === '/api/publish' && ids && payload.expectedRevision && !Object.hasOwn(payload, 'reviewId')) payload = { ...payload, reviewId: await reviewFor(payload.itemId, payload.expectedRevision) };
		if (route === '/api/publish-batch' && !Object.hasOwn(payload, 'reviewIds')) payload = { ...payload, reviewIds: Object.fromEntries(await Promise.all(payload.itemIds.map(async id => [id, await reviewFor(id, payload.expectedRevisions?.[id])]))) };
		const response = await fetch(`${origin}${route}`, { method: 'POST', headers: { 'content-type': 'application/json',
			'x-ljm-admin-request': '1', origin,
			...(ids ? { 'x-ljm-operation-id': ids.parent, 'x-ljm-step-id': ids.step } : {}), ...extraHeaders }, body: JSON.stringify(payload) });
		return { status: response.status, body: await response.json() };
	};
	const record = async (id = 'LJM-20000101-LET-001') => {
		const result = await get('/api/bootstrap?format=split-v1');
		assert.equal(result.status, 200, JSON.stringify(result.body));
		return result.body.records.find(row => row.core.item_id === id);
	};
	const savePayload = (row, extra = {}) => ({ record: row, isNew: false, expectedRevision: row._admin?.revision,
		images: row.core.publication_file_path.map(file => ({ kind: 'existing', filename: path.basename(file) })), ...extra });
	const save = (row, extra = {}, ids) => post('/api/save-draft', savePayload(row, extra), ids);
	const newPayload = (title) => {
		const row = sample('001', { item_id: '', title, accession_date: '2001-01-01' });
		return { record: row, isNew: true, expectedRevision: 'new', images: [] };
	};
	const buildCount = async () => Number(await readFile(path.join(site, 'build-count'), 'utf8').catch(() => '0'));
	const holdBuild = async () => { const next = await buildCount() + 1; await writeFile(path.join(site, 'build-hold'), 'hold'); return next; };
	const waitBuild = async (number) => {
		for (let attempt = 0; attempt < 500; attempt++) { if (await exists(path.join(site, `build-start-${number}`))) return; await sleep(20); }
		assert.fail(`隔离构建 ${number} 未启动：${output}`);
	};
	const releaseBuild = () => rm(path.join(site, 'build-hold'), { force: true });
	return { root, site, archive, privateRoot, draftDirectory, inbox, origin, post, get, record, savePayload, save, newPayload,
		buildCount, holdBuild, waitBuild, releaseBuild };
};

test('发布须有当前版本人工确认；缺确认、改图或旧清单均不构建且保留原公开内容', { timeout: 30000 }, async t => {
	const f = await createFixture(t), row = await f.record(), itemId = row.core.item_id;
	const saved = await f.save(row), expectedRevision = saved.body.revision;
	const payload = { itemId, expectedRevision, confirmations, reviewId: null };
	const original = await readFile(path.join(f.archive, `${itemId}.json`), 'utf8');
	assert.equal((await f.post('/api/publish', payload)).status, 428);
	const review = await f.post('/api/publication-review', { itemId, expectedRevision });
	assert.equal(review.status, 200, JSON.stringify(review.body));
	const unchecked = await f.post('/api/publish', { ...payload, reviewId: review.body.reviewId, confirmations: Array(13).fill(false) });
	assert.equal(unchecked.status, 400);
	// 不改 JSON 版本，只改变实际文件字节，也须阻止发布。
	await writeFile(path.join(f.inbox, itemId, 'front-public.png'), Buffer.concat([png, Buffer.from('synthetic-change')]));
	const changedImage = await f.post('/api/publish', { ...payload, reviewId: review.body.reviewId });
	assert.equal(changedImage.status, 428, JSON.stringify(changedImage.body));
	assert.equal(await f.buildCount(), 0);
	assert.equal(await readFile(path.join(f.archive, `${itemId}.json`), 'utf8'), original);
	assert.deepEqual(await readFile(path.join(f.site, 'public', 'archive', itemId, 'front-public.png')), png);
	await writeFile(path.join(f.inbox, itemId, 'front-public.png'), png);
	const nextReview = await f.post('/api/publication-review', { itemId, expectedRevision });
	const modified = await f.record(); modified.core.title = '人工核对以后又修改文字';
	const next = await f.save(modified);
	assert.equal(next.status, 200);
	const stale = await f.post('/api/publish', { ...payload, expectedRevision: next.body.revision, reviewId: nextReview.body.reviewId });
	assert.equal(stale.status, 428, JSON.stringify(stale.body));
	assert.equal(await f.buildCount(), 0);
});

test('同名发布图片被外部修改时拒绝覆盖，失败前后公开图片均保持原字节', { timeout: 30000 }, async t => {
	const f = await createFixture(t), row = await f.record(), itemId = row.core.item_id;
	const saved = await f.save(row), expectedRevision = saved.body.revision;
	await writeFile(path.join(f.inbox, itemId, 'front-public.png'), Buffer.concat([png, Buffer.from('synthetic-change')]));
	const result = await f.post('/api/publish', { itemId, expectedRevision, confirmations });
	assert.notEqual(result.status, 200);
	assert.equal(await f.buildCount(), 0);
	assert.deepEqual(await readFile(path.join(f.site, 'public', 'archive', itemId, 'front-public.png')), png);
	assert.equal(await exists(path.join(f.draftDirectory, `${itemId}.json`)), true);
});

test('旧客户端缺操作编号或版本时返回 428，正式资料与草稿不受影响', { timeout: 30000 }, async t => {
	const f = await createFixture(t), row = await f.record();
	assert.match(row._admin.revision, /^[a-f0-9]{64}$/);
	const before = await readFile(path.join(f.archive, `${row.core.item_id}.json`), 'utf8');
	assert.equal((await f.post('/api/save-draft', f.savePayload(row), null)).status, 428);
	assert.equal((await f.save(row, { expectedRevision: undefined })).status, 428);
	assert.equal((await f.post('/api/save-draft', { ...f.newPayload('缺少新建版本'), expectedRevision: undefined })).status, 428);
	assert.equal(await exists(path.join(f.draftDirectory, `${row.core.item_id}.json`)), false);
	assert.equal(await readFile(path.join(f.archive, `${row.core.item_id}.json`), 'utf8'), before);
});

test('同一旧版本的两个并发保存只有一次成功，成功内容不被覆盖', { timeout: 30000 }, async t => {
	const f = await createFixture(t), base = await f.record();
	const a = structuredClone(base), b = structuredClone(base); a.core.title = '并发甲'; b.core.title = '并发乙';
	const results = await Promise.all([f.save(a), f.save(b)]);
	assert.deepEqual(results.map(row => row.status).sort(), [200, 409]);
	const winner = results.find(row => row.status === 200).body.draft.record;
	const current = await f.record();
	assert.equal(current.core.title, winner.core.title);
	assert.notEqual(current._admin.revision, base._admin.revision);
	assert.equal(current._admin.officialSnapshot.core.title, base.core.title);
});

test('新建重放只分配一次编号；同操作不同内容被拒绝；并发新建编号唯一', { timeout: 30000 }, async t => {
	const f = await createFixture(t), ids = operation(), payload = f.newPayload('只创建一次');
	const [first, second] = await Promise.all([f.post('/api/save-draft', payload, ids), f.post('/api/save-draft', payload, ids)]);
	assert.equal(first.status, 200, JSON.stringify(first.body)); assert.equal(second.status, 200, JSON.stringify(second.body));
	const id = first.body.draft.record.core.item_id;
	assert.equal(second.body.operation.result.itemId, id);
	const replay = await f.post('/api/save-draft', payload, ids);
	assert.equal(replay.status, 200); assert.equal(replay.body.replayed, true);
	assert.equal(replay.body.draft, undefined, '完成重放只能返回收据，不能用旧档案内容回填页面');
	assert.equal(replay.body.operation.result.itemId, id);
	const mismatch = await f.post('/api/save-draft', f.newPayload('同号换内容'), ids);
	assert.equal(mismatch.status, 409);
	const created = await Promise.all(Array.from({ length: 5 }, (_, index) => f.post('/api/save-draft', f.newPayload(`并行新建 ${index}`))));
	for (const row of created) assert.equal(row.status, 200, JSON.stringify(row.body));
	assert.equal(new Set([id, ...created.map(row => row.body.draft.record.core.item_id)]).size, 6);
	const drafts = await readdir(f.draftDirectory);
	assert.equal(drafts.filter(name => /^LJM-20010101-LET-\d{3}\.json$/.test(name)).length, 6);
	const receipt = await f.get(`/api/operations/${ids.parent}`);
	assert.equal(receipt.status, 200); assert.equal(receipt.body.operations.length, 1);
	assert.equal(receipt.body.operations[0].status, 'succeeded');
	assert.equal(JSON.stringify(receipt.body).includes('只创建一次'), false, '操作查询不保存档案正文');
});

test('同一父操作中的上传、保存、发布分步骤执行，发布重放不重复构建且隐私门禁仍生效', { timeout: 30000 }, async t => {
	const f = await createFixture(t), parent = randomUUID(), uploadIds = operation(parent), saveIds = operation(parent), publishIds = operation(parent);
	const response = await fetch(`${f.origin}/api/stage-image`, { method: 'POST', headers: {
		'content-type': 'image/png', 'content-length': String(png.length), 'x-ljm-file-name': 'synthetic-public.png',
		'x-ljm-file-sha256': createHash('sha256').update(png).digest('hex'), 'x-ljm-admin-request': '1', origin: f.origin,
		'x-ljm-operation-id': parent, 'x-ljm-step-id': uploadIds.step }, body: png });
	const upload = await response.json(); assert.equal(response.status, 200, JSON.stringify(upload));
	const payload = f.newPayload('同一父操作多步骤');
	payload.confirmedPublicationCopies = true;
	payload.images = [{ kind: 'staged', uploadToken: upload.upload.token, publicationName: 'front-public.png' }];
	const saved = await f.post('/api/save-draft', payload, saveIds);
	assert.equal(saved.status, 200, JSON.stringify(saved.body));
	const itemId = saved.body.draft.record.core.item_id, expectedRevision = saved.body.revision;
	assert.equal((await f.post('/api/publish', { itemId, expectedRevision, confirmations: [] })).status, 400);
	assert.equal(await f.buildCount(), 0, '未完成隐私确认不能启动构建');
	const publishPayload = { itemId, expectedRevision, confirmations };
	const published = await f.post('/api/publish', publishPayload, publishIds);
	assert.equal(published.status, 200, JSON.stringify(published.body));
	assert.equal(await f.buildCount(), 1);
	const replay = await f.post('/api/publish', publishPayload, publishIds);
	assert.equal(replay.status, 200, JSON.stringify(replay.body)); assert.equal(replay.body.replayed, true);
	assert.equal(replay.body.record, undefined); assert.equal(await f.buildCount(), 1);
	const query = await f.get(`/api/operations/${parent}`);
	assert.deepEqual(query.body.operations.map(row => row.kind), ['stage-image', 'save-draft', 'publish']);
	assert.ok(query.body.operations.every(row => row.status === 'succeeded'));
	assert.equal(await exists(path.join(f.draftDirectory, `${itemId}.json`)), false);
});

test('发布时另一个旧版保存进入队列，构建完成后拒绝覆盖已发布版本', { timeout: 30000 }, async t => {
	const f = await createFixture(t); assert.equal((await f.save(await f.record())).status, 200);
	const base = await f.record(), itemId = base.core.item_id, next = await f.holdBuild(), saveIds = operation();
	const publishing = f.post('/api/publish', { itemId, expectedRevision: base._admin.revision, confirmations });
	try {
		await f.waitBuild(next);
		const edit = structuredClone(base); edit.core.title = '发布期间旧页面另存';
		const saving = f.save(edit, {}, saveIds);
		let queued;
		for (let attempt = 0; attempt < 100; attempt++) {
			queued = (await f.get(`/api/operations/${saveIds.parent}`)).body.operations[0];
			if (queued?.status === 'queued') break; await sleep(20);
		}
		assert.equal(queued?.status, 'queued', '保存必须等待正在构建的发布完成');
		await f.releaseBuild();
		const [published, rejected] = await Promise.all([publishing, saving]);
		assert.equal(published.status, 200, JSON.stringify(published.body));
		assert.equal(rejected.status, 409, JSON.stringify(rejected.body));
		assert.equal((await f.record()).core.title, base.core.title);
		assert.equal(await exists(path.join(f.draftDirectory, `${itemId}.json`)), false);
	} finally { await f.releaseBuild(); await publishing; }
});

test('构建期间若草稿文件被其他本地操作更新，完成发布后保留新草稿', { timeout: 30000 }, async t => {
	const f = await createFixture(t); assert.equal((await f.save(await f.record())).status, 200);
	const base = await f.record(), itemId = base.core.item_id, next = await f.holdBuild();
	const publishing = f.post('/api/publish', { itemId, expectedRevision: base._admin.revision, confirmations });
	try {
		await f.waitBuild(next);
		// 模拟服务队列之外的本机文件修改，仅改本测试创建的合成草稿。
		const file = path.join(f.draftDirectory, `${itemId}.json`), updated = JSON.parse(await readFile(file, 'utf8'));
		updated.write_revision = randomUUID(); updated.record.core.title = '应保留的新草稿';
		await writeFile(file, JSON.stringify(updated));
		await f.releaseBuild();
		const result = await publishing; assert.equal(result.status, 200, JSON.stringify(result.body));
		assert.ok(result.body.warnings.some(message => /保留新的草稿/.test(message)));
		assert.equal(JSON.parse(await readFile(file, 'utf8')).record.core.title, '应保留的新草稿');
		assert.equal(JSON.parse(await readFile(path.join(f.archive, `${itemId}.json`), 'utf8')).core.title, base.core.title);
	} finally { await f.releaseBuild(); await publishing; }
});

test('构建中取消须等构建结束并完成回滚，正式版本和草稿保留且后续可保存', { timeout: 30000 }, async t => {
	const f = await createFixture(t), original = await f.record(), itemId = original.core.item_id;
	const officialFile = path.join(f.archive, `${itemId}.json`), draftFile = path.join(f.draftDirectory, `${itemId}.json`);
	const officialBefore = await readFile(officialFile, 'utf8');
	original.core.title = '待取消发布的合成草稿';
	assert.equal((await f.save(original)).status, 200);
	const draftBefore = await readFile(draftFile, 'utf8'), base = await f.record(), publishIds = operation();
	const next = await f.holdBuild();
	const publishing = f.post('/api/publish', { itemId, expectedRevision: base._admin.revision, confirmations }, publishIds);
	let cancelling;
	try {
		await f.waitBuild(next);
		let cancelFinished = false;
		cancelling = f.post('/api/cancel-operation', { operationId: publishIds.parent }).then(result => { cancelFinished = true; return result; });
		await sleep(250);
		assert.equal(cancelFinished, false, '取消响应必须等构建及恢复处理结束');
		assert.equal(await f.buildCount(), next, '旧构建仍运行时不能提前启动恢复构建');
		assert.equal((await f.get(`/api/operations/${publishIds.parent}`)).body.operations[0].status, 'running');
		await f.releaseBuild();
		const [cancelled, result] = await Promise.all([cancelling, publishing]);
		assert.equal(cancelled.status, 200, JSON.stringify(cancelled.body)); assert.equal(cancelled.body.cancelled, true);
		assert.equal(result.status, 409, JSON.stringify(result.body)); assert.equal(result.body.cancelled, true);
		assert.equal(await f.buildCount(), next + 1, '原构建完成后再执行一次恢复构建');
		assert.equal(await readFile(officialFile, 'utf8'), officialBefore);
		assert.equal(await readFile(draftFile, 'utf8'), draftBefore);
		const query = await f.get(`/api/operations/${publishIds.parent}`);
		assert.equal(query.body.operations.length, 1); assert.equal(query.body.operations[0].status, 'cancelled');
		const current = await f.record(); current.core.title = '取消回滚后继续保存';
		const saved = await f.save(current); assert.equal(saved.status, 200, JSON.stringify(saved.body));
		assert.equal((await f.record()).core.title, current.core.title);
	} finally { await f.releaseBuild(); await Promise.allSettled([publishing, cancelling].filter(Boolean)); }
});

test('图片上传重放仍核对实际字节，伪造摘要不能替换原上传结果', { timeout: 30000 }, async t => {
	const f = await createFixture(t), ids = operation();
	const stage = async body => {
		const response = await fetch(`${f.origin}/api/stage-image`, { method: 'POST', headers: {
			'content-type': 'image/png', 'content-length': String(png.length), 'x-ljm-file-name': 'synthetic-public.png',
			'x-ljm-file-sha256': createHash('sha256').update(png).digest('hex'), 'x-ljm-admin-request': '1', origin: f.origin,
			'x-ljm-operation-id': ids.parent, 'x-ljm-step-id': ids.step }, body });
		return { status: response.status, body: await response.json() };
	};
	const first = await stage(png); assert.equal(first.status, 200, JSON.stringify(first.body));
	const changed = Buffer.from(png); changed[changed.length - 1] ^= 1;
	const mismatch = await stage(changed); assert.equal(mismatch.status, 409, JSON.stringify(mismatch.body));
	const replay = await stage(png); assert.equal(replay.status, 200, JSON.stringify(replay.body));
	assert.equal(replay.body.replayed, true); assert.equal(replay.body.upload.token, first.body.upload.token);
	assert.equal(replay.body.upload.sha256, first.body.upload.sha256);
	const query = await f.get(`/api/operations/${ids.parent}`);
	assert.equal(query.body.operations.length, 1); assert.equal(query.body.operations[0].status, 'succeeded');
});

test('批量发布逐件构建，失败件保留草稿并恢复发布前内容', { timeout: 30000 }, async t => {
	const f = await createFixture(t, { officialCount: 2 }), ids = ['LJM-20000101-LET-001', 'LJM-20000101-LET-002'];
	for (const id of ids) { const row = await f.record(id); row.core.title += ' 草稿修改'; assert.equal((await f.save(row)).status, 200); }
	const rows = await Promise.all(ids.map(id => f.record(id)));
	const expectedRevisions = Object.fromEntries(rows.map(row => [row.core.item_id, row._admin.revision]));
	await writeFile(path.join(f.site, 'build-fail-at'), '2');
	const beforeSecond = await readFile(path.join(f.archive, `${ids[1]}.json`), 'utf8');
	const result = await f.post('/api/publish-batch', { itemIds: ids, expectedRevisions, confirmations });
	assert.equal(result.status, 200, JSON.stringify(result.body));
	assert.deepEqual(result.body.results.map(row => row.ok), [true, false]);
	assert.equal(await exists(path.join(f.draftDirectory, `${ids[0]}.json`)), false);
	assert.equal(await exists(path.join(f.draftDirectory, `${ids[1]}.json`)), true);
	assert.equal(await readFile(path.join(f.archive, `${ids[1]}.json`), 'utf8'), beforeSecond);
	assert.equal((await f.record(ids[1])).core.title, rows[1].core.title);
	assert.equal(await f.buildCount(), 3, '失败构建后执行一次恢复构建');
});

test('撤销与恢复都核对当前版本，旧页面不能撤销新版或覆盖恢复草稿', { timeout: 30000 }, async t => {
	const f = await createFixture(t), original = await f.record(), itemId = original.core.item_id;
	assert.equal((await f.save(original)).status, 200);
	let current = await f.record();
	assert.equal((await f.post('/api/publish', { itemId, expectedRevision: current._admin.revision, confirmations })).status, 200);
	assert.equal((await f.post('/api/withdraw-record', { itemId, expectedRevision: original._admin.revision, confirmed: true, reason: '合成撤销验收' })).status, 409);
	current = await f.record();
	const withdrawn = await f.post('/api/withdraw-record', { itemId, expectedRevision: current._admin.revision, confirmed: true, reason: '合成撤销验收' });
	assert.equal(withdrawn.status, 200, JSON.stringify(withdrawn.body));
	assert.equal((await f.post('/api/restore-withdrawn', { itemId, expectedRevision: current._admin.revision })).status, 409);
	const withdrawnRow = await f.record(); assert.equal(withdrawnRow.core.record_status, 'WDR');
	const restored = await f.post('/api/restore-withdrawn', { itemId, expectedRevision: withdrawnRow._admin.revision });
	assert.equal(restored.status, 200, JSON.stringify(restored.body));
	const draftBefore = await readFile(path.join(f.draftDirectory, `${itemId}.json`), 'utf8');
	assert.equal((await f.post('/api/restore-withdrawn', { itemId, expectedRevision: withdrawnRow._admin.revision })).status, 409);
	assert.equal(await readFile(path.join(f.draftDirectory, `${itemId}.json`), 'utf8'), draftBefore);
	assert.deepEqual(['record_status', 'privacy_level', 'use_status'].map(key => restored.body.draft.record.core[key]), ['SUS', 'Y', 'U0']);
	assert.equal(JSON.parse(await readFile(path.join(f.archive, `${itemId}.json`), 'utf8')).core.record_status, 'WDR');
});

test('译文以自己的版本并发保存，只保留一次成功结果，完成重放返回收据', { timeout: 30000 }, async t => {
	const f = await createFixture(t), itemId = 'LJM-20000101-LET-001', route = `/api/admin/translations/${itemId}`;
	const detail = (await f.get(route)).body;
	assert.equal(detail.revision, 0);
	const payload = title => ({ revision: detail.revision, source_hash: detail.source_hash, status: 'draft',
		fields: { 'core.title': title }, image_descriptions: {}, transcription_kind: 'none' });
	const requestIds = [operation(), operation()], input = [payload('Synthetic title A'), payload('Synthetic title B')];
	const results = await Promise.all(input.map((body, index) => f.post(`${route}/save`, body, requestIds[index])));
	assert.deepEqual(results.map(row => row.status).sort(), [200, 409]);
	const winnerIndex = results.findIndex(row => row.status === 200), winner = results[winnerIndex].body;
	const current = (await f.get(route)).body;
	assert.equal(current.revision, 1); assert.equal(current.translation.fields['core.title'], winner.translation.fields['core.title']);
	const replay = await f.post(`${route}/save`, input[winnerIndex], requestIds[winnerIndex]);
	assert.equal(replay.status, 200); assert.equal(replay.body.replayed, true);
	assert.equal(replay.body.translation, undefined); assert.equal(replay.body.operation.result.translationRevision, 1);
	assert.equal((await f.get(route)).body.revision, 1);
});
