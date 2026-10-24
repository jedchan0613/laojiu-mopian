// 只用系统临时目录与虚构记录，实际运行写入协调、重放、取消和重启场景。
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { once } from 'node:events';
import { spawn } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import test from 'node:test';
import { acquireWriteLease, atomicWrite, createWriteCoordinator, digest, recordRevision } from '../write-coordinator.mjs';

const itemId = 'LJM-20000101-LET-001';
const moduleUrl = new URL('../write-coordinator.mjs', import.meta.url).href;
const request = (overrides = {}) => ({ operationId: randomUUID(), stepId: randomUUID(), kind: 'save-draft', target: itemId, payload: { title: '合成样例' }, ...overrides });
const gate = () => {
  let resolve;
  const promise = new Promise(done => { resolve = done; });
  return { promise, resolve };
};
const fixture = async (t) => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'ljm-write-safety-'));
  // 只删除本次明确创建且核对位于系统临时目录中的夹具。
  t.after(async () => {
    assert.ok(path.resolve(root).startsWith(path.resolve(os.tmpdir(), 'ljm-write-safety-')));
    await fs.rm(root, { recursive: true, force: true });
  });
  const directory = path.join(root, 'operations');
  await fs.mkdir(directory);
  return { root, directory };
};
const eventually = async (check) => {
  const deadline = Date.now() + 4000;
  while (!await check()) {
    if (Date.now() > deadline) assert.fail('等待夹具状态超时');
    await new Promise(resolve => setTimeout(resolve, 5));
  }
};
const journalFile = (directory, params) => path.join(directory, `${params.operationId.toLowerCase()}.${params.stepId.toLowerCase()}.json`);
const journalEntry = (params, overrides = {}) => ({
  version: 1, operationId: params.operationId, stepId: params.stepId, kind: params.kind, target: params.target,
  requestHash: digest({ kind: params.kind, target: params.target, payload: params.payload }), status: 'queued', startedAt: new Date().toISOString(), ...overrides,
});
const child = (t, source, args = []) => {
  const process = spawn(globalThis.process.execPath, ['--input-type=module', '-e', source, ...args], { stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true });
  let output = '', errors = '';
  process.stdout.on('data', data => { output += data; });
  process.stderr.on('data', data => { errors += data; });
  const exited = once(process, 'exit');
  t.after(async () => { if (process.exitCode === null && process.signalCode === null) process.kill(); await exited; });
  return { process, exited, output: () => output, errors: () => errors };
};

test('共同队列串行执行不同档案写入，并让读请求看到前一个完成结果', async (t) => {
  const { directory } = await fixture(t), writes = await createWriteCoordinator({ directory });
  const pause = gate(), started = gate(), events = [];
  const first = writes.perform(request(), async () => { events.push('一开始'); started.resolve(); await pause.promise; events.push('一结束'); return {}; });
  await started.promise;
  const second = writes.perform(request({ target: 'LJM-20000101-PHO-001' }), async () => { events.push('二'); return {}; });
  // 等第二次请求完成入队，随后读与第三次写严格按共同队列顺序运行。
  await eventually(async () => (await fs.readdir(directory)).filter(name => name.endsWith('.json')).length === 2);
  const read = writes.read(() => { events.push('读'); return [...events]; });
  const third = writes.perform(request(), async () => { events.push('三'); return {}; });
  assert.deepEqual(events, ['一开始']);
  pause.resolve();
  await Promise.all([first, second, third]);
  assert.deepEqual(await read, ['一开始', '一结束', '二', '读']);
  assert.deepEqual(events, ['一开始', '一结束', '二', '读', '三']);
});

test('同一父操作可分步骤；并发重复、键顺序变化和重启后重放均不再执行', async (t) => {
  const { directory } = await fixture(t), writes = await createWriteCoordinator({ directory });
  const params = request({ payload: { title: '样例', tags: ['一', '二'] } });
  const pause = gate(), started = gate(); let executions = 0;
  const perform = () => writes.perform(params, async () => { executions++; started.resolve(); await pause.promise; return { privateBody: '不存收据' }; }, () => ({ itemId, revision: 'a'.repeat(64) }));
  const first = perform(); await started.promise;
  const repeated = perform(); pause.resolve();
  const [one, two] = await Promise.all([first, repeated]);
  assert.equal(executions, 1); assert.deepEqual(one.operation, two.operation);
  const reordered = { ...params, operationId: params.operationId.toUpperCase(), stepId: params.stepId.toUpperCase(), payload: { tags: ['一', '二'], title: '样例' } };
  assert.equal((await writes.perform(reordered, () => { executions++; })).replayed, true);
  await writes.perform({ ...params, stepId: randomUUID(), kind: 'publish' }, () => { executions++; return {}; });
  assert.equal(executions, 2); assert.equal(writes.query(params.operationId.toUpperCase()).length, 2);
  const restarted = await createWriteCoordinator({ directory });
  assert.equal((await restarted.perform(params, () => { executions++; })).operation.result.itemId, itemId);
  assert.equal(executions, 2);
});

test('同一子步骤更改正文、目标或类型会拒绝，原结果不受影响', async (t) => {
  const { directory } = await fixture(t), writes = await createWriteCoordinator({ directory });
  const params = request(); let calls = 0;
  await writes.perform(params, () => { calls++; return {}; });
  for (const change of [{ payload: { title: '改过' } }, { target: 'LJM-20000101-PHO-001' }, { kind: 'publish' }]) {
    await assert.rejects(writes.perform({ ...params, ...change }, () => { calls++; }), { code: 'OPERATION_MISMATCH' });
  }
  assert.equal(calls, 1); assert.equal(writes.query(params.operationId)[0].status, 'succeeded');
});

test('缺父编号、缺子编号及非法目标在回调前拒绝', async (t) => {
  const { directory } = await fixture(t), writes = await createWriteCoordinator({ directory }); let calls = 0;
  for (const change of [{ operationId: undefined }, { stepId: undefined }, { operationId: 'bad' }]) {
    await assert.rejects(writes.perform(request(change), () => { calls++; }), { statusCode: 428, code: 'CLIENT_REFRESH_REQUIRED' });
  }
  await assert.rejects(writes.perform(request({ target: '私人邮箱@example.test' }), () => { calls++; }), { code: 'OPERATION_INVALID' });
  assert.equal(calls, 0); assert.deepEqual(await fs.readdir(directory), []);
});

test('收据白名单不保存正文、图片、文件名、错误文本或凭证；返回结果不能篡改内部终态', async (t) => {
  const { directory } = await fixture(t), writes = await createWriteCoordinator({ directory });
  const secret = '测试正文与访问凭证绝不能写入收据', params = request({ payload: { body: secret, image: 'data:image/jpeg;base64,QUJD', authorization: secret } });
  const upload = { token: randomUUID(), sha256: 'f'.repeat(64), size: 3, originalName: secret, mimeType: 'image/jpeg', bytes: secret };
  const result = await writes.perform(params, () => ({ body: secret, upload }), (value) => ({ ...value, itemId, revision: 'a'.repeat(64), credentials: secret, results: [{ itemId, ok: true, error: secret }] }));
  const raw = await fs.readFile(journalFile(directory, params), 'utf8');
  assert.ok(!raw.includes(secret)); assert.ok(!raw.includes('data:image')); assert.ok(!raw.includes('authorization')); assert.ok(!raw.includes('originalName'));
  assert.deepEqual(JSON.parse(raw).result.upload, { token: upload.token, sha256: upload.sha256, size: 3 });
  result.operation.status = 'failed';
  const query = writes.query(params.operationId); query[0].result.itemId = '改坏';
  assert.equal(writes.query(params.operationId)[0].status, 'succeeded');
  assert.equal(writes.query(params.operationId)[0].result.itemId, itemId);
});

test('失败终态可查询和重放，失败内容不持久化，也不会让队列中毒', async (t) => {
  const { directory } = await fixture(t), writes = await createWriteCoordinator({ directory });
  const params = request(); let calls = 0;
  const fail = () => { calls++; throw Object.assign(new Error('敏感错误详情'), { code: 'VALIDATION_FAILED', statusCode: 422 }); };
  await assert.rejects(writes.perform(params, fail), { code: 'VALIDATION_FAILED', statusCode: 422 });
  await assert.rejects(writes.perform(params, fail), (error) => error.replayed === true && error.operation.status === 'failed' && error.statusCode === 422);
  assert.equal(calls, 1); assert.ok(!(await fs.readFile(journalFile(directory, params), 'utf8')).includes('敏感错误详情'));
  const restarted = await createWriteCoordinator({ directory });
  await assert.rejects(restarted.perform(params, fail), (error) => error.replayed && error.operation.status === 'failed' && error.code === 'VALIDATION_FAILED');
  assert.equal(calls, 1);
  await writes.perform(request(), () => ({}));
  assert.doesNotThrow(() => writes.assertReady());
});

test('开始改动后失败会全局暂停，未运行的写入亦停止，读取仍可用', async (t) => {
  const { directory } = await fixture(t), writes = await createWriteCoordinator({ directory });
  const pause = gate(), started = gate(), params = request(); let secondRan = false;
  const first = writes.perform(params, async ({ markChanged }) => { markChanged(); started.resolve(); await pause.promise; throw new Error('模拟改动后失败'); });
  const firstResult = assert.rejects(first, { code: 'OPERATION_NEEDS_REVIEW' });
  await started.promise;
  const second = writes.perform(request(), () => { secondRan = true; return {}; });
  const secondResult = assert.rejects(second, { code: 'OPERATION_NEEDS_REVIEW' });
  pause.resolve(); await Promise.all([firstResult, secondResult]);
  assert.equal(secondRan, false); assert.equal(writes.query(params.operationId)[0].status, 'needs_review');
  assert.equal(await writes.read(() => '可继续查看'), '可继续查看');
  await assert.rejects(writes.perform(request(), () => ({})), { code: 'OPERATION_NEEDS_REVIEW' });
  await assert.rejects(writes.perform(params, () => ({})), (error) => error.replayed && error.operation.status === 'needs_review');
});

test('已核对回滚的失败允许下一次新操作，原子收据写失败则保持待核对', async (t) => {
  const { directory } = await fixture(t), writes = await createWriteCoordinator({ directory });
  const params = request();
  await assert.rejects(writes.perform(params, ({ markChanged }) => { markChanged(); throw Object.assign(new Error('已核对恢复'), { safeToRetry: true }); }));
  assert.equal(writes.query(params.operationId)[0].status, 'failed');
  assert.doesNotThrow(() => writes.assertReady());
  const second = request(), originalRename = fs.rename;
  const rename = t.mock.method(fs, 'rename', async (from, to) => {
    const content = JSON.parse(await fs.readFile(from, 'utf8'));
    if (['succeeded', 'failed', 'needs_review'].includes(content.status)) throw Object.assign(new Error('模拟终态磁盘不可写'), { code: 'ENOSPC' });
    return originalRename(from, to);
  });
  await assert.rejects(writes.perform(second, ({ markChanged }) => { markChanged(); return {}; }), { code: 'OPERATION_NEEDS_REVIEW' });
  rename.mock.restore();
  assert.equal(writes.query(second.operationId)[0].status, 'needs_review');
  assert.equal(JSON.parse(await fs.readFile(journalFile(directory, second), 'utf8')).status, 'running');
  const restarted = await createWriteCoordinator({ directory });
  assert.equal(restarted.query(second.operationId)[0].status, 'needs_review');
});

test('取消等待运行中操作实际回滚和排队请求终结，不把已完成操作误报为取消', async (t) => {
  const { directory } = await fixture(t), writes = await createWriteCoordinator({ directory });
  const started = gate(), rollback = gate(), abortSeen = gate(), params = request(); let queuedRan = false, settled = false;
  const first = writes.perform(params, async ({ signal, markChanged }) => {
    markChanged(); started.resolve();
    await new Promise(resolve => signal.addEventListener('abort', resolve, { once: true }));
    abortSeen.resolve(); await rollback.promise;
    throw Object.assign(new Error('撤回并恢复完成'), { name: 'OperationCancelledError', safeToRetry: true });
  });
  const firstRejected = assert.rejects(first);
  await started.promise;
  const secondParams = { ...params, stepId: randomUUID(), kind: 'publish' };
  const second = writes.perform(secondParams, () => { queuedRan = true; return {}; });
  const secondRejected = assert.rejects(second);
  const cancelled = writes.cancel(params.operationId.toUpperCase()).then(value => { settled = true; return value; });
  await abortSeen.promise;
  assert.equal(settled, false); assert.equal(writes.query(params.operationId)[0].status, 'running');
  await assert.rejects(writes.perform({ ...params, stepId: randomUUID() }, () => ({})), { code: 'OPERATION_CANCELLING' });
  rollback.resolve(); const terminal = await cancelled;
  await Promise.all([firstRejected, secondRejected]);
  assert.equal(queuedRan, false); assert.equal(terminal.requested, true); assert.equal(terminal.cancelled, true);
  assert.equal(terminal.operations.length, 2); assert.ok(terminal.operations.every(entry => entry.status === 'cancelled'));
  const complete = request(); await writes.perform(complete, () => ({}));
  const after = await writes.cancel(complete.operationId);
  assert.equal(after.requested, false); assert.equal(after.cancelled, false); assert.equal(after.operations[0].status, 'succeeded');
});

test('运行中忽略中止但实际完成时，取消回复返回成功终态', async (t) => {
  const { directory } = await fixture(t), writes = await createWriteCoordinator({ directory });
  const pause = gate(), started = gate(), params = request();
  const operation = writes.perform(params, async () => { started.resolve(); await pause.promise; return {}; });
  await started.promise;
  const cancellation = writes.cancel(params.operationId); pause.resolve();
  await operation;
  const terminal = await cancellation;
  assert.equal(terminal.cancelled, false); assert.equal(terminal.operations[0].status, 'succeeded');
});

test('刚递交但尚未入队的请求也由取消等待处理，不执行其回调', async (t) => {
  const { directory } = await fixture(t), writes = await createWriteCoordinator({ directory });
  const params = request(); let ran = false;
  const operation = writes.perform(params, () => { ran = true; return {}; });
  const rejected = assert.rejects(operation, (error) => error.operation?.status === 'cancelled');
  const firstCancel = writes.cancel(params.operationId), repeatedCancel = writes.cancel(params.operationId.toUpperCase());
  assert.equal(firstCancel, repeatedCancel);
  const terminal = await firstCancel; await rejected;
  assert.equal(terminal.requested, true); assert.equal(terminal.cancelled, true); assert.equal(ran, false);
  await assert.rejects(writes.perform(params, () => ({})), (error) => error.replayed && error.operation.status === 'cancelled');
});

test('容量为每个并发排队操作预留终态，达到条数上限保留已有收据', async (t) => {
  const { directory } = await fixture(t), writes = await createWriteCoordinator({ directory, maxEntries: 3, maxBytes: 32768 });
  const params = request(), pause = gate(), started = gate();
  const first = writes.perform(params, async () => { started.resolve(); await pause.promise; return {}; }); await started.promise;
  await assert.rejects(writes.perform(request(), () => ({})), { code: 'JOURNAL_LIMIT', statusCode: 503 });
  pause.resolve(); await first;
  assert.equal((await writes.perform(params, () => ({}))).replayed, true);
  const only = await createWriteCoordinator({ directory, maxEntries: 1 });
  await assert.rejects(only.perform(request(), () => ({})), { code: 'JOURNAL_LIMIT' });
  assert.equal((await fs.readdir(directory)).filter(name => name.endsWith('.json')).length, 1);
});

test('崩溃遗留的临时收据不自动采用、不删除，但计入容量', async (t) => {
  const { directory } = await fixture(t), params = request();
  const temporary = `${journalFile(directory, params)}.${randomUUID()}.tmp`;
  await fs.writeFile(temporary, 'x'.repeat(32768));
  const writes = await createWriteCoordinator({ directory, maxBytes: 32768 });
  await assert.rejects(writes.perform(params, () => ({})), { code: 'JOURNAL_LIMIT' });
  assert.deepEqual(writes.query(params.operationId), []); assert.equal((await fs.stat(temporary)).size, 32768);
});

test('真实子进程中断后，running 和 queued 收据均待核对；已落盘终态在重启后不变', { timeout: 15000 }, async (t) => {
  const { root, directory } = await fixture(t), first = request(), second = request();
  const worker = child(t, `
    import fs from 'node:fs/promises';
    import { acquireWriteLease, createWriteCoordinator } from ${JSON.stringify(moduleUrl)};
    const [directory, destination, one, two] = process.argv.slice(1);
    await acquireWriteLease(directory); const writes = await createWriteCoordinator({ directory });
    const a = JSON.parse(one), b = JSON.parse(two);
    let start; const started = new Promise(resolve => start = resolve);
    void writes.perform(a, async ({ markChanged }) => { markChanged(); await fs.writeFile(destination, '已发生的合成改动'); start(); await new Promise(() => {}); });
    await started; void writes.perform(b, () => ({}));
    while (writes.query(b.operationId)[0]?.status !== 'queued') await new Promise(resolve => setTimeout(resolve, 5));
    process.stdout.write('ready\\n'); setInterval(() => {}, 1000);
  `, [directory, path.join(root, 'domain-state.txt'), JSON.stringify(first), JSON.stringify(second)]);
  await eventually(() => worker.output().includes('ready') || worker.process.exitCode !== null);
  assert.ok(worker.output().includes('ready'), worker.errors());
  assert.equal(await fs.readFile(path.join(root, 'domain-state.txt'), 'utf8'), '已发生的合成改动');
  worker.process.kill('SIGKILL'); await worker.exited;
  const release = await acquireWriteLease(directory); t.after(release);
  const restarted = await createWriteCoordinator({ directory });
  for (const params of [first, second]) {
    assert.equal(restarted.query(params.operationId)[0].status, 'needs_review');
    await assert.rejects(restarted.perform(params, () => assert.fail('中断操作不得重做')), { code: 'OPERATION_NEEDS_REVIEW' });
  }
  await assert.rejects(restarted.perform(request(), () => ({})), { code: 'OPERATION_NEEDS_REVIEW' });
  assert.equal(await restarted.read(() => '仍能只读'), '仍能只读');
});

for (const [name, corrupt] of [
  ['非JSON内容', () => '{broken'],
  ['文件与操作编号不符', (entry) => JSON.stringify({ ...entry, stepId: randomUUID() })],
  ['未知状态', (entry) => JSON.stringify({ ...entry, status: 'done' })],
  ['正文误入收据', (entry) => JSON.stringify({ ...entry, body: '不能加载' })],
  ['缺摘要', (entry) => JSON.stringify({ ...entry, requestHash: undefined })],
  ['伪造成功收据含秘密', (entry) => JSON.stringify({ ...entry, status: 'succeeded', finishedAt: new Date().toISOString(), result: { body: '不接受' } })],
]) test(`重启遇到${name}，明确拒绝加载以阻止写入`, async (t) => {
  const { directory } = await fixture(t), params = request();
  await fs.writeFile(journalFile(directory, params), corrupt(journalEntry(params)));
  await assert.rejects(createWriteCoordinator({ directory }), { code: 'JOURNAL_INVALID' });
});

test('无法识别的文件及大小写重复文件名不默默忽略', async (t) => {
  const { directory } = await fixture(t);
  await fs.writeFile(path.join(directory, 'unknown.json'), '{}');
  await assert.rejects(createWriteCoordinator({ directory }), { code: 'JOURNAL_INVALID' });
  await fs.unlink(path.join(directory, 'unknown.json'));
  const params = request(), uppercase = path.join(directory, `${params.operationId}.${params.stepId}.json`.toUpperCase());
  await fs.writeFile(uppercase, JSON.stringify(journalEntry(params)));
  await assert.rejects(createWriteCoordinator({ directory }), { code: 'JOURNAL_INVALID' });
});

test('目录占用拒绝活进程；重复释放不会删掉后来取得的占用', async (t) => {
  const { directory } = await fixture(t), release = await acquireWriteLease(directory);
  await assert.rejects(acquireWriteLease(directory), /同一资料目录已有/);
  const once = release(), again = release(); assert.equal(once, again); await once;
  const currentRelease = await acquireWriteLease(directory); t.after(currentRelease);
  const current = JSON.parse(await fs.readFile(path.join(directory, 'owner.lock'), 'utf8'));
  await release();
  assert.equal(JSON.parse(await fs.readFile(path.join(directory, 'owner.lock'), 'utf8')).token, current.token);
});

test('多个竞争者同时取得目录占用时，始终只有一个成功', async (t) => {
  const { directory } = await fixture(t);
  const contenders = await Promise.allSettled(Array.from({ length: 5 }, () => acquireWriteLease(directory)));
  const winners = contenders.filter(result => result.status === 'fulfilled');
  assert.equal(winners.length, 1);
  await winners[0].value();
  assert.deepEqual(await fs.readdir(directory), []);
});

test('不能核实的占用和遗留取得门闩均保持停止，不擅自删除', async (t) => {
  const { directory } = await fixture(t), filename = path.join(directory, 'owner.lock');
  await fs.writeFile(filename, '{broken');
  await assert.rejects(acquireWriteLease(directory), /无法核实/);
  assert.equal(await fs.readFile(filename, 'utf8'), '{broken');
  await fs.writeFile(path.join(directory, 'owner-acquire.lock'), '{}');
  await assert.rejects(acquireWriteLease(directory), /人工核对/);
  assert.equal(await fs.readFile(path.join(directory, 'owner-acquire.lock'), 'utf8'), '{}');
});

test('原子写提交后清理失败仍报告成功；提交前失败保留原错误及旧文件', async (t) => {
  const { root } = await fixture(t), destination = path.join(root, 'atomic.json');
  await atomicWrite(destination, '旧版');
  const cleanup = t.mock.method(fs, 'rm', async () => { throw new Error('模拟清理失败'); });
  await atomicWrite(destination, '新版'); assert.equal(await fs.readFile(destination, 'utf8'), '新版');
  const rename = t.mock.method(fs, 'rename', async () => { throw Object.assign(new Error('模拟提交失败'), { code: 'ENOSPC' }); });
  await assert.rejects(atomicWrite(destination, '不能提交'), { code: 'ENOSPC', message: '模拟提交失败' });
  assert.equal(await fs.readFile(destination, 'utf8'), '新版');
  rename.mock.restore(); cleanup.mock.restore();
});

test('版本摘要稳定比较对象键顺序，同时识别正文、草稿与图片次序变化', () => {
  assert.equal(digest({ a: 1, b: 2 }), digest({ b: 2, a: 1 }));
  const record = { core: { item_id: itemId }, images: ['a', 'b'] };
  assert.notEqual(recordRevision(record, null), recordRevision(record, {}));
  assert.notEqual(recordRevision(record, null), recordRevision({ ...record, images: ['b', 'a'] }, null));
  assert.equal(recordRevision(undefined, undefined), recordRevision(null, null));
});

test('五个现有译文语言均可使用独立目标编号，包括繁体中文', async (t) => {
  const { directory } = await fixture(t), writes = await createWriteCoordinator({ directory });
  for (const locale of ['en', 'th', 'ja', 'ko', 'zh-Hant']) {
    const result = await writes.perform(request({ kind: 'save-translation', target: `${itemId}:${locale}` }), () => ({ revision: 1 }), value => ({ translationRevision: value.revision }));
    assert.equal(result.operation.target, `${itemId}:${locale}`);
  }
});

test('安全退出等待尚在入队和执行的任务，再返回全部终态', async (t) => {
  const { directory } = await fixture(t), writes = await createWriteCoordinator({ directory });
  const pause = gate(), started = gate(), params = request(); let drained = false;
  const operation = writes.perform(params, async () => { started.resolve(); await pause.promise; return {}; });
  // 故意不等待 admission，以验证退出不能漏掉刚递交的请求。
  const drain = writes.drain().then(() => { drained = true; });
  await started.promise; assert.equal(drained, false);
  pause.resolve(); await drain; await operation;
  assert.equal(writes.query(params.operationId)[0].status, 'succeeded');
});

test('读取不能越过已递交但尚未完成入队的写入', async t => {
  const { directory } = await fixture(t), writes = await createWriteCoordinator({ directory });
  const pause = gate(), started = gate(); let value = 'before', read = false;
  const write = writes.perform(request(), async () => { started.resolve(); await pause.promise; value = 'after'; return {}; });
  const result = writes.read(() => { read = true; return value; });
  await started.promise; assert.equal(read, false);
  pause.resolve(); await write; assert.equal(await result, 'after');
});

test('合并待核对收据只接受服务端证明；恢复后保留原幂等去向',async t=>{
 const {directory}=await fixture(t),writes=await createWriteCoordinator({directory});
 const params=request({kind:'merge-records',target:[itemId,'LJM-20000101-LET-002']});
 await assert.rejects(writes.perform(params,context=>{context.markChanged();throw new Error('synthetic uncertain result');}),{code:'OPERATION_NEEDS_REVIEW'});
 const stored=writes.query(params.operationId)[0];assert.equal(stored.status,'needs_review');
 await assert.rejects(writes.reconcileMerge({...params,requestHash:'wrong'},async()=>({status:'succeeded'})),{code:'MERGE_RECOVERY_INVALID'});
 await assert.rejects(writes.reconcileMerge({...params,requestHash:stored.requestHash},async()=>({status:'unknown'})),{code:'MERGE_RECOVERY_UNPROVEN'});
 assert.throws(()=>writes.assertReady(),{code:'OPERATION_NEEDS_REVIEW'});
 const reconciled=await writes.reconcileMerge({...params,requestHash:stored.requestHash},async()=>({status:'succeeded',result:{results:[{itemId,ok:true}],privateText:'must not enter receipt'}}));
 assert.equal(reconciled.status,'succeeded');assert.ok(!JSON.stringify(reconciled).includes('must not enter receipt'));writes.assertReady();
 let called=false;const replay=await writes.perform(params,()=>{called=true;});assert.equal(replay.replayed,true);assert.equal(called,false);
});

test('合并恢复成失败不伪造成功；其他类型待核对操作不可借此解除',async t=>{
 const {directory}=await fixture(t),writes=await createWriteCoordinator({directory});
 const params=request({kind:'merge-records',target:[itemId,'LJM-20000101-LET-002']});
 await assert.rejects(writes.perform(params,context=>{context.markChanged();throw new Error('interrupted');}));
 const stored=writes.query(params.operationId)[0];
 assert.equal((await writes.reconcileMerge({...params,requestHash:stored.requestHash},async()=>({status:'failed'}))).status,'failed');writes.assertReady();
 const other=request();await assert.rejects(writes.perform(other,context=>{context.markChanged();throw new Error('different operation');}));
 const entry=writes.query(other.operationId)[0];await assert.rejects(writes.reconcileMerge({...other,requestHash:entry.requestHash},async()=>({status:'succeeded'})),{code:'MERGE_RECOVERY_INVALID'});
});
