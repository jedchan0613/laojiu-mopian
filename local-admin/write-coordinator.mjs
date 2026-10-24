// 档案写入共用队列与私密操作收据。只使用 Node 内置模块，不保存请求正文。
import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash, randomUUID } from 'node:crypto';

export class WriteSafetyError extends Error {
  constructor(message, statusCode = 409, code = 'WRITE_CONFLICT') {
    super(message); this.name = 'RequestError'; this.statusCode = statusCode; this.code = code;
  }
}
export const operationIdPattern = /^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i;
const hashPattern = /^[a-f0-9]{64}$/;
const itemPattern = /^LJM-\d{8}-[A-Z]{3}-\d{3}$/;
const errorPattern = /^[A-Z][A-Z0-9_]{0,63}$/;
const pendingStatuses = new Set(['queued', 'running']);
const statuses = new Set([...pendingStatuses, 'succeeded', 'failed', 'cancelled', 'needs_review']);
const maximumRecordBytes = 32768;
const canonical = (value) => Array.isArray(value) ? value.map(canonical)
  : value && typeof value === 'object' ? Object.fromEntries(Object.keys(value).sort().map(key => [key, canonical(value[key])])) : value;
export const digest = (value) => createHash('sha256').update(JSON.stringify(canonical(value))).digest('hex');
export const recordRevision = (official, draft) => digest({ official: official ?? null, draft: draft ?? null });
const normalizeId = (id, missingMessage = '操作编号无效。') => {
  if (typeof id !== 'string' || !operationIdPattern.test(id)) throw new WriteSafetyError(missingMessage, 428, 'CLIENT_REFRESH_REQUIRED');
  return id.toLowerCase();
};

export const atomicWrite = async (target, contents) => {
  await fs.mkdir(path.dirname(target), { recursive: true, mode: 0o700 });
  const temporary = `${target}.${randomUUID()}.tmp`;
  let ownsTemporary = false;
  try {
    const handle = await fs.open(temporary, 'wx', 0o600);
    ownsTemporary = true;
    try { await handle.writeFile(contents); await handle.sync(); } finally { await handle.close(); }
    await fs.rename(temporary, target);
  } finally {
    // rename 成功即已提交。临时文件清理失败不得伪造保存失败，亦不得覆盖原始写入错误。
    if (ownsTemporary) await fs.rm(temporary, { force: true }).catch(() => {});
  }
};
const readOptional = async (file) => {
  try { return JSON.parse(await fs.readFile(file, 'utf8')); }
  catch (error) { if (error.code === 'ENOENT') return null; throw error; }
};

// 一个资料目录只允许一个新版管理进程／同步命令占用；异常退出只回收已确认死亡的 PID。
export const acquireWriteLease = async (directory) => {
  await fs.mkdir(directory, { recursive: true, mode: 0o700 });
  const filename = path.join(directory, 'owner.lock');
  const token = randomUUID();
  const gate = path.join(directory, 'owner-acquire.lock');
  let guard;
  try { guard = await fs.open(gate, 'wx', 0o600); }
  catch (error) {
    if (error.code === 'EEXIST') throw new WriteSafetyError('正在核对资料占用权；如持续出现，请人工核对占用文件。');
    throw error;
  }
  try {
    await guard.writeFile(JSON.stringify({ pid: process.pid, token }));
    await guard.sync();
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const handle = await fs.open(filename, 'wx', 0o600);
        try { await handle.writeFile(JSON.stringify({ pid: process.pid, token })); await handle.sync(); }
        finally { await handle.close(); }
        // 同一个释放函数可以重复调用，但只进行一次解除；避免旧调用删掉后来取得的新占用。
        let releaseTask;
        return () => releaseTask ??= (async () => {
          if ((await readOptional(filename))?.token === token) await fs.unlink(filename);
        })();
      } catch (error) {
        if (error.code !== 'EEXIST') throw error;
        let owner;
        try { owner = await readOptional(filename); }
        catch { throw new WriteSafetyError('写入占用记录无法核实，请先人工检查。'); }
        if (!Number.isSafeInteger(owner?.pid) || owner.pid < 1 || !operationIdPattern.test(owner.token ?? '')) {
          throw new WriteSafetyError('写入占用记录无法核实，请先人工检查。');
        }
        let dead = false;
        try { process.kill(owner.pid, 0); } catch (probe) { if (probe.code === 'ESRCH') dead = true; }
        if (!dead) throw new WriteSafetyError('同一资料目录已有管理服务或同步命令运行，请先安全停止原进程。');
        // 取得 gate 后才回收 owner；取得 gate 前异常退出则保持停止，交人工核对。
        if ((await readOptional(filename))?.token === owner.token) await fs.unlink(filename);
      }
    }
    throw new WriteSafetyError('未能取得资料目录的写入占用权，请稍后重试。');
  } finally {
    try { await guard.close(); } finally { await fs.unlink(gate); }
  }
};

// 目标只允许引用编号；全文、文件内容、完整路径、邮件或身份凭证不能成为持久目标。
const validReference = (value) => typeof value === 'string' && (
  ['new', 'upload'].includes(value) || itemPattern.test(value)
  || /^LJM-\d{8}-[A-Z]{3}-\d{3}:(?:en|th|ja|ko|zh-Hant)$/.test(value)
  || /^TG-[A-F0-9]{24}$/.test(value)
);
const validTarget = (target) => validReference(target)
  || Array.isArray(target) && target.length > 0 && target.length <= 200 && target.every(value => itemPattern.test(value));
const validKind = (kind) => typeof kind === 'string' && /^[a-z][a-z0-9-]{0,63}$/.test(kind);
const receiptError = () => new WriteSafetyError('操作结果摘要格式无效，必须核对实际结果。', 503, 'RECEIPT_INVALID');
const safeReceipt = (value = {}) => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw receiptError();
  const result = {};
  if (value.itemId !== undefined) {
    if (!itemPattern.test(value.itemId)) throw receiptError();
    result.itemId = value.itemId;
  }
  if (value.revision !== undefined) {
    if (typeof value.revision !== 'string' || !hashPattern.test(value.revision)) throw receiptError();
    result.revision = value.revision;
  }
  if (value.upload !== undefined) {
    const upload = value.upload;
    if (!upload || !operationIdPattern.test(upload.token ?? '') || !hashPattern.test(upload.sha256 ?? '')
      || !Number.isSafeInteger(upload.size) || upload.size < 0) throw receiptError();
    result.upload = { token: upload.token, sha256: upload.sha256, size: upload.size };
  }
  if (value.results !== undefined) {
    if (!Array.isArray(value.results) || value.results.length > 200
      || value.results.some(row => !row || !itemPattern.test(row.itemId ?? '') || typeof row.ok !== 'boolean')) throw receiptError();
    result.results = value.results.map(row => ({ itemId: row.itemId, ok: row.ok }));
  }
  if (value.translationRevision !== undefined) {
    if (!Number.isSafeInteger(value.translationRevision) || value.translationRevision < 0) throw receiptError();
    result.translationRevision = value.translationRevision;
  }
  return result;
};
const invalidJournal = () => new WriteSafetyError('操作记录损坏或格式无法核实，必须核对后才能写入。', 503, 'JOURNAL_INVALID');
const validTime = (value) => typeof value === 'string' && Number.isFinite(Date.parse(value));
const validateStoredRecord = (key, record) => {
  if (!record || record.version !== 1 || `${record.operationId}.${record.stepId}` !== key
    || !operationIdPattern.test(record.operationId ?? '') || !operationIdPattern.test(record.stepId ?? '')
    || !validKind(record.kind) || !validTarget(record.target) || !hashPattern.test(record.requestHash ?? '')
    || !statuses.has(record.status) || !validTime(record.startedAt)) throw invalidJournal();
  const allowed = new Set(['version', 'operationId', 'stepId', 'kind', 'target', 'requestHash', 'status', 'startedAt', 'finishedAt', 'result', 'errorCode', 'errorStatus']);
  if (Object.keys(record).some(field => !allowed.has(field))) throw invalidJournal();
  if (pendingStatuses.has(record.status)) {
    if (record.finishedAt !== undefined || record.result !== undefined || record.errorCode !== undefined || record.errorStatus !== undefined) throw invalidJournal();
  } else if (!validTime(record.finishedAt)) throw invalidJournal();
  if (record.status === 'succeeded') {
    if (record.result === undefined) throw invalidJournal();
    let safe;
    try { safe = safeReceipt(record.result); } catch { throw invalidJournal(); }
    if (digest(safe) !== digest(record.result) || record.errorCode !== undefined || record.errorStatus !== undefined) throw invalidJournal();
  } else if (record.result !== undefined) throw invalidJournal();
  if (record.errorCode !== undefined && !errorPattern.test(record.errorCode)) throw invalidJournal();
  if (record.errorStatus !== undefined && (!Number.isInteger(record.errorStatus) || record.errorStatus < 400 || record.errorStatus > 599)) throw invalidJournal();
};

// 调用者必须先持有该目录的 acquireWriteLease；此队列统筹档案与共享构建写入。
export const createWriteCoordinator = async ({ directory, maxEntries = 10000, maxBytes = 32 * 1024 * 1024 }) => {
  if (!Number.isSafeInteger(maxEntries) || maxEntries < 1 || !Number.isSafeInteger(maxBytes) || maxBytes < 1) {
    throw new TypeError('操作收据容量必须是正整数。');
  }
  await fs.mkdir(directory, { recursive: true, mode: 0o700 });
  const records = new Map(), storedSizes = new Map(), active = new Map(), cancellations = new Map();
  let queue = Promise.resolve(), admissions = Promise.resolve(), bytes = 0, submissionSequence = 0;
  const serial = (callback) => { const task = queue.then(callback); queue = task.catch(() => {}); return task; };
  const fileFor = (key) => path.join(directory, `${key}.json`);
  const persist = async (key, record) => {
    const text = JSON.stringify(record), size = Buffer.byteLength(text);
    if (size > maximumRecordBytes) throw new WriteSafetyError('操作收据过大，已停止自动继续。', 503, 'JOURNAL_LIMIT');
    await atomicWrite(fileFor(key), text);
    bytes += size - (storedSizes.get(key) ?? 0);
    storedSizes.set(key, size);
    records.set(key, structuredClone(record));
  };
  for (const filename of await fs.readdir(directory)) {
    if (['owner.lock', 'owner-acquire.lock'].includes(filename)) continue;
    const info = await fs.lstat(path.join(directory, filename));
    if (!info.isFile() || info.isSymbolicLink()) throw invalidJournal();
    // 崩溃留下的原子写入临时文件不直接采用、不删除，计入占用容量。
    if (/\.json\.[a-f0-9-]{36}\.tmp$/.test(filename)) { bytes += info.size; continue; }
    const key = filename.endsWith('.json') ? filename.slice(0, -5) : '';
    const [operationId, stepId, ...extra] = key.split('.');
    if (extra.length || !operationIdPattern.test(operationId ?? '') || !operationIdPattern.test(stepId ?? '')
      || key !== key.toLowerCase() || info.size > maximumRecordBytes) throw invalidJournal();
    let record;
    try { record = await readOptional(path.join(directory, filename)); }
    catch { throw invalidJournal(); }
    validateStoredRecord(key, record);
    records.set(key, record); storedSizes.set(key, info.size); bytes += info.size;
  }
  // 先核对全部收据，再把任何未证明完成的操作标为待核对，禁止自动重放。
  for (const [key, record] of records) if (pendingStatuses.has(record.status)) {
    await persist(key, { ...record, status: 'needs_review', finishedAt: new Date().toISOString(), errorCode: 'RESULT_UNCERTAIN', errorStatus: 409 });
  }
  const assertReady = () => {
    if ([...records.values()].some(r => r.status === 'needs_review')) {
      throw new WriteSafetyError('有中断操作尚未核对，写入暂已停止；可继续查看档案，请先核对操作结果。', 409, 'OPERATION_NEEDS_REVIEW');
    }
  };
  const query = (id) => {
    if (typeof id !== 'string' || !operationIdPattern.test(id)) throw new WriteSafetyError('操作编号无效。', 400);
    const normalized = id.toLowerCase();
    return [...records.values()].filter(r => r.operationId === normalized).map(r => structuredClone(r));
  };
  const replay = (existing) => {
    if (existing.status === 'succeeded') return { replayed: true, operation: structuredClone(existing) };
    const uncertain = existing.status === 'needs_review';
    const error = new WriteSafetyError(uncertain ? '这项操作的结果待核对，不会再次执行。' : '这项操作已经结束且未成功，请核对当前档案后发起新操作。',
      uncertain ? 409 : existing.errorStatus ?? 409, uncertain ? 'OPERATION_NEEDS_REVIEW' : existing.errorCode ?? `OPERATION_${existing.status.toUpperCase()}`);
    error.operation = structuredClone(existing); error.replayed = true;
    throw error;
  };
  const perform = async ({ operationId, stepId, kind, target, payload }, callback, receipt = () => ({})) => {
    const missingMessage = '页面或工具版本过旧，缺少操作编号，请刷新页面或更新工具后重试。';
    operationId = normalizeId(operationId, missingMessage); stepId = normalizeId(stepId, missingMessage);
    if (!validKind(kind) || !validTarget(target)) throw new WriteSafetyError('操作类型或目标编号无效。', 400, 'OPERATION_INVALID');
    const key = `${operationId}.${stepId}`, requestHash = digest({ kind, target, payload });
    const entryTarget = structuredClone(target);
    const sequence = ++submissionSequence;
    const admit = admissions.then(async () => {
      const existing = records.get(key);
      if (existing) {
        if (existing.requestHash !== requestHash) throw new WriteSafetyError('同一操作编号携带了不同内容，已阻止重复执行。', 409, 'OPERATION_MISMATCH');
        if (active.has(key)) return { task: active.get(key).task };
        return { task: Promise.resolve().then(() => replay(existing)) };
      }
      assertReady();
      if (cancellations.has(operationId) && sequence > cancellations.get(operationId).cutoff) {
        throw new WriteSafetyError('这次操作正在取消，请等待结果核对。', 409, 'OPERATION_CANCELLING');
      }
      // 每个排队／运行请求都预留完整终态空间，避免并发入队后无法写完成收据。
      const reserved = [...records].reduce((total, [storedKey, record]) => total + (pendingStatuses.has(record.status) ? maximumRecordBytes - storedSizes.get(storedKey) : 0), 0);
      if (records.size >= maxEntries || bytes + reserved + maximumRecordBytes > maxBytes) {
        throw new WriteSafetyError('私密操作记录已达到保留上限，请先安排维护；不会自动删除记录。', 503, 'JOURNAL_LIMIT');
      }
      const entry = { version: 1, operationId, stepId, kind, target: entryTarget, requestHash, status: 'queued', startedAt: new Date().toISOString() };
      await persist(key, entry);
      const controller = new AbortController();
      // 取消可能发生在 queued 收据落盘前；该请求可以记账，但不得先于取消启动回调。
      if ((cancellations.get(operationId)?.cutoff ?? -1) >= sequence) controller.abort();
      const task = serial(async () => {
        let changed = false;
        const context = { operationId, stepId, signal: controller.signal, markChanged: () => { changed = true; } };
        try {
          assertReady();
          if (controller.signal.aborted) throw Object.assign(new Error('操作已取消。'), { name: 'OperationCancelledError', statusCode: 409, code: 'OPERATION_CANCELLED' });
          await persist(key, { ...entry, status: 'running' });
          const result = await callback(context);
          const completed = { ...entry, status: 'succeeded', finishedAt: new Date().toISOString(), result: safeReceipt(await receipt(result)) };
          await persist(key, completed);
          return { ...result, operation: structuredClone(completed) };
        } catch (caught) {
          const error = caught instanceof Error ? caught : new Error('操作未能完成。');
          const uncertain = changed && error.safeToRetry !== true;
          const cancelled = error.name === 'OperationCancelledError' || controller.signal.aborted && error.name === 'AbortError';
          const status = uncertain ? 'needs_review' : cancelled ? 'cancelled' : 'failed';
          const terminal = { ...entry, status, finishedAt: new Date().toISOString(),
            errorCode: uncertain ? 'RESULT_UNCERTAIN' : errorPattern.test(error.code ?? '') ? error.code : cancelled ? 'OPERATION_CANCELLED' : 'REQUEST_FAILED',
            errorStatus: Number.isInteger(error.statusCode) && error.statusCode >= 400 && error.statusCode <= 599 ? error.statusCode : 409 };
          try { await persist(key, terminal); }
          catch {
            // 磁盘结果不明时保留停止状态；重启亦会由原 queued/running 收据触发核对。
            records.set(key, { ...terminal, status: 'needs_review', errorCode: 'RESULT_UNCERTAIN' });
          }
          const operation = records.get(key);
          error.operation = structuredClone(operation);
          if (operation.status === 'needs_review') {
            error.code = 'OPERATION_NEEDS_REVIEW'; error.statusCode = 409;
            error.message += '；操作结果需要核对，后续写入已暂停。';
          }
          throw error;
        } finally { active.delete(key); }
      });
      active.set(key, { controller, task, operationId });
      // admission 与写入分开：查询和取消不被长时间构建阻塞。
      task.catch(() => {});
      return { task };
    });
    admissions = admit.then(() => {}, () => {});
    return (await admit).task;
  };
  const cancel = (id) => {
    query(id);
    id = id.toLowerCase();
    if (cancellations.has(id)) return cancellations.get(id).task;
    const cancellation = { cutoff: submissionSequence };
    const task = (async () => {
      // 已经递交的子步骤完成入队后再取消；等待实际任务及其回滚／收据结束。
      await admissions;
      const matches = [...active.values()].filter(value => value.operationId === id);
      for (const match of matches) match.controller.abort();
      await Promise.allSettled(matches.map(value => value.task));
      const operations = query(id);
      return { requested: matches.length > 0, cancelled: operations.some(r => r.status === 'cancelled'), operations };
    })();
    cancellation.task = task;
    cancellations.set(id, cancellation);
    task.finally(() => { if (cancellations.get(id) === cancellation) cancellations.delete(id); }).catch(() => {});
    return task;
  };
  const drain = async () => {
    let admitted, queued;
    do {
      admitted = admissions; await admitted;
      queued = queue; await queued;
    } while (admitted !== admissions || queued !== queue);
  };
  // 只读列举全部收据：供服务重启后恢复暂存图片等核对用途，不暴露正文（收据本身只含白名单字段）。
  const all = () => [...records.values()].map(record => structuredClone(record));
  const read = callback => admissions.then(() => serial(callback));
  // 仅合并恢复使用；结论必须由服务端检查真实日志/摘要产生，不能接受客户端自报成功。
  const reconcileMerge = async ({operationId,stepId,requestHash},verify) => {
    operationId=normalizeId(operationId,'恢复操作编号无效。');stepId=normalizeId(stepId,'恢复子步骤编号无效。');
    await admissions;
    return serial(async()=>{
      const key=operationId+'.'+stepId,entry=records.get(key);
      if(!entry||!['merge-records','merge-undo','merge-undo-drafts'].includes(entry.kind)||entry.requestHash!==requestHash)throw new WriteSafetyError('恢复目标或请求摘要不匹配。',409,'MERGE_RECOVERY_INVALID');
      if(entry.status!=='needs_review')return structuredClone(entry);
      if(active.has(key))throw new WriteSafetyError('合并仍在运行，请等待实际结束。',423,'MERGE_RECOVERY_BUSY');
      const outcome=await verify(structuredClone(entry));
      if(!outcome||!['succeeded','failed'].includes(outcome.status))throw new WriteSafetyError('未能证明合并或恢复结果，写入仍暂停。',409,'MERGE_RECOVERY_UNPROVEN');
      const next={...entry,status:outcome.status,finishedAt:new Date().toISOString(),
        ...(outcome.status==='succeeded'?{result:safeReceipt(outcome.result??{})}:{errorCode:'MERGE_RECOVERED_ROLLBACK',errorStatus:409})};
      delete next.errorCode;if(outcome.status==='failed')next.errorCode='MERGE_RECOVERED_ROLLBACK';
      if(outcome.status==='succeeded')delete next.errorStatus;
      await persist(key,next);return structuredClone(next);
    });
  };
  return { perform, query, cancel, read, assertReady, drain, all, reconcileMerge };
};
