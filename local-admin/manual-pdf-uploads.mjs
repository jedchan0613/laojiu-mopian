// 私密PDF流式接收。6.2不调用解析器、不生成页图、不提供文件下载。
// 文件系统诊断不能把私密绝对路径带入账号响应。
import fs from "node:fs/promises";
import { createReadStream } from "node:fs";
import path from "node:path";
import { createHash, randomBytes } from "node:crypto";
import { manualPdfUploadLimits as limits, manualPdfUploadIdPattern, manualPdfSourcePattern, normalizeManualPdfUpload, normalizeManualMaterial } from "../shared/manual-pdf-upload.mjs";
import { submissionPayloadUsage } from "./submission-storage.mjs";
const active = new Map(), digest = (x) => createHash("sha256").update(x).digest("hex");
const fail = (message, statusCode = 400) => {
  throw Object.assign(new Error(message), { name: "SubmissionError", statusCode });
};
const states = new Set(["reserved", "receiving", "cancelling", "committing", "saved", "failed", "cancelled", "interrupted", "expired", "needs_review"]);
function createManualPdfStore({ root, read, locked, ownedBy, safeAccountId, writeRecord, atomicJson, summary, checkStorageLimit, globalUsage, maxStorageBytes, assertGenerationIdle = async()=>{}, options = {} }) {
  const now = options.now ?? Date.now, processAlive = options.processAlive ?? ((pid) => {
    try {
      process.kill(pid, 0);
      return true;
    } catch (e) {
      return e.code !== "ESRCH";
    }
  });
  const owned = async (id, accountId) => {
    const r = ownedBy(await read(id), safeAccountId(accountId));
    if (r.submission_kind !== "manual") fail("找不到这份说明书草稿。", 404);
    return r;
  };
  const editable = (r) => {
    if (r.status !== "draft" || r.manual_handoff || r.withdrawal_requested) fail("只有尚未进入整理流程的私密草稿可以上传PDF。", 409);
  };
  const folder = (id) => {
    if (!/^TG-[A-F0-9]{24}$/.test(id ?? "")) fail("投稿编号无效。", 404);
    return path.join(root, id, "pdf");
  };
  const uploadId = (id, account, key) => "PU-" + digest(account + ":" + id + ":" + key).slice(0, 24);
  const opFile = (id, u) => {
    if (!manualPdfUploadIdPattern.test(u ?? "")) fail("PDF上传标识无效。", 404);
    return path.join(folder(id), "uploads", u + ".json");
  };
  const partFile = (id, u) => opFile(id, u).replace(/\.json$/, ".part"), leaseDir = (id, u) => opFile(id, u).replace(/\.json$/, ".stream.lock");
  const keyFor = (id, u) => path.join(root, id, u);
  const writeOp = (id, op) => atomicJson(opFile(id, op.upload_id), op);
  const loadOp = async (id, u) => {
    try {
      const op = JSON.parse(await fs.readFile(opFile(id, u), "utf8"));
      if (op.upload_id !== u || !states.has(op.status) || !Number.isSafeInteger(op.bytes) || op.bytes < 5 || op.bytes > limits.sourceBytes || !/^[a-f0-9]{64}$/.test(op.operation_id ?? "") || !/^[a-f0-9]{64}$/.test(op.sha256 ?? "") || !Number.isFinite(Date.parse(op.expires_at)) || !Number.isFinite(Date.parse(op.created_at))) fail("PDF上传记录需由维护者核对。", 503);
      return op;
    } catch (e) {
      if (e.code === "ENOENT") return null;
      throw e;
    }
  };
  const operations = async (id) => {
    const entries = await fs.readdir(path.join(folder(id), "uploads"), { withFileTypes: true }).catch((e) => {
      if (e.code === "ENOENT") return [];
      throw e;
    });
    const result = [];
    for (const e of entries) {
      if (e.isSymbolicLink()) fail("PDF暂存目录出现链接，已停止处理。", 503);
      if (e.isFile() && e.name.endsWith(".json") && manualPdfUploadIdPattern.test(e.name.slice(0, -5))) result.push(await loadOp(id, e.name.slice(0, -5)));
    }
    return result.filter(Boolean).sort((a, b) => b.created_at.localeCompare(a.created_at));
  };
  const transaction = async (id, account, fn, retry = false) => {
    const end = Date.now() + 5e3;
    while (true) {
      try {
        return await locked(`account-quota-${safeAccountId(account)}`, () => locked("intake", () => locked(id, fn)));
      } catch (e) {
        if (!retry || e.statusCode !== 409 || Date.now() >= end || !String(e.message).includes("当前正在处理")) throw e;
        await new Promise((resolve) => setTimeout(resolve, 25));
      }
    }
  };
  const applied = (r, op) => (r.manual_pdf_saved_operations ?? []).some((x) => x.operation_id === op.operation_id && x.source_id === op.target_source?.source_id);
  const expired = (op) => op.status === "reserved" && Date.parse(op.expires_at) <= now();
  const pending = async (r) => (await operations(r.id)).find((op) => !applied(r, op) && (["receiving", "cancelling", "committing", "needs_review", "saved"].includes(op.status) || op.status === "reserved" && !expired(op)));
  const assertUploadsIdle = async (r) => {
    if (await pending(r)) fail("本册有未完成的PDF上传，请先核对回执或取消该次上传。", 409);
  };
  const assertNotBusy = async r=>{await assertUploadsIdle(r);await assertGenerationIdle(r);};
  const checkSource = async (id, source) => {
    if (!source || !manualPdfSourcePattern.test(source.filename ?? "")) fail("PDF留存信息无法核对。", 503);
    const file = path.join(folder(id), source.filename), stat = await fs.lstat(file);
    if (!stat.isFile() || stat.isSymbolicLink() || stat.size !== source.bytes) fail("PDF留存文件发生变化，请联系维护者核对。", 409);
    const h = createHash("sha256");
    for await (const b of createReadStream(file)) h.update(b);
    if (h.digest("hex") !== source.sha256) fail("PDF留存文件发生变化，请联系维护者核对。", 409);
  };
  const projection = (r, op) => {
    const saved = op && applied(r, op);
    const unlinked = op?.status === "saved" && !saved;
    return { id: r.id, revision: r.revision, found: Boolean(op), operation_id: op?.operation_id ?? "", upload_id: op?.upload_id ?? "", state: saved ? "saved" : unlinked ? "needs_review" : op ? expired(op) ? "expired" : op.status : "not_found", applied: Boolean(saved), name: op?.name ?? "", bytes: op?.bytes ?? 0, sha256: op?.sha256 ?? "", expires_at: op?.expires_at ?? "", message: saved ? "PDF已私密保存；预览生成与送审状态请查看草稿。" : unlinked ? "文件回执与草稿留存信息不一致，已有文件仍私密保留，请联系维护者核对。" : op?.message ?? "", can_upload: Boolean(op && !saved && op.status === "reserved" && !expired(op)) };
  };
  const describe = async (r) => {
    const ops = await operations(r.id), op = await pending(r) ?? ops[0] ?? null, source = (r.manual_pdf_sources ?? []).find((s) => s.source_id === r.manual_pdf_current_source_id), used = await submissionPayloadUsage(path.join(root, r.id), { now: now() });
    if (r.manual_pdf_current_source_id && !source) fail("PDF留存信息无法核对，请联系维护者。", 503);
    if (source) await checkSource(r.id, source);
    return { source_format: r.source_format ?? "images", status: source ? "saved" : op ? expired(op) ? "expired" : op.status : "empty", current: source ? { name: source.original_name, bytes: source.bytes, saved_at: source.uploaded_at } : null, retained_sources: used.sourceCount, pdf_stored_bytes: used.pdfBytes, temporary_bytes: used.temporaryBytes, reserved_bytes: used.reservedBytes, operation: op ? projection(r, op) : null, limits };
  };
  const removePart = async (id, u) => {
    const file = partFile(id, u), resolved = path.resolve(file);
    if (!resolved.startsWith(path.resolve(folder(id)) + path.sep) || !resolved.endsWith(".part")) fail("临时文件路径无法核对。", 503);
    try {
      const stat = await fs.lstat(file);
      if (!stat.isFile() || stat.isSymbolicLink()) fail("临时文件无法安全清理。", 503);
      await fs.unlink(file);
    } catch (e) {
      if (e.code !== "ENOENT") throw e;
    }
  };
  const lease = async (id, u) => {
    try {
      return JSON.parse(await fs.readFile(path.join(leaseDir(id, u), "owner.json"), "utf8"));
    } catch (e) {
      if (e.code === "ENOENT") {
        try {
          await fs.access(leaseDir(id, u));
          return { unknown: true };
        } catch (error) {
          if (error.code === "ENOENT") return null;
          throw error;
        }
      }
      throw e;
    }
  };
  const releaseLease = async (id, u) => {
    try {
      await fs.unlink(path.join(leaseDir(id, u), "owner.json"));
      await fs.rmdir(leaseDir(id, u));
    } catch (e) {
      if (e.code !== "ENOENT") throw e;
    }
  };
  const canClean = async (id, op) => {
    if (active.has(keyFor(id, op.upload_id))) return false;
    const owner = await lease(id, op.upload_id);
    return !owner || Number.isSafeInteger(owner.pid) && owner.pid > 0 && !processAlive(owner.pid);
  };
  const reconcile = async (r) => {
    for (const op of await operations(r.id)) {
      if (op.status === "saved" && !applied(r, op)) {
        op.status = "needs_review";
        op.message = "文件回执与草稿留存信息不一致，已有文件仍私密保留，请联系维护者核对。";
        await writeOp(r.id, op);
      }
      if (applied(r, op) || !["reserved", "receiving", "cancelling"].includes(op.status)) continue;
      if ((expired(op) || op.status !== "reserved") && await canClean(r.id, op)) {
        await removePart(r.id, op.upload_id);
        await releaseLease(r.id, op.upload_id);
        op.status = expired(op) ? "expired" : "interrupted";
        op.message = "上次上传未完成，请重新选择文件，从头上传。";
        await writeOp(r.id, op);
      }
    }
  };
  const status = async ({ id, accountId, operationId }) => {
    if (!/^[a-f0-9]{64}$/.test(operationId ?? "")) fail("PDF操作凭证无效。", 404);
    return transaction(id, accountId, async () => {
      const r = await owned(id, accountId);
      await reconcile(r);
      const op = await loadOp(id, uploadId(id, r.account_id, operationId));
      if (op && applied(r, op)) await checkSource(id, op.target_source);
      return { ...projection(r, op), operation_id: operationId };
    }, true);
  };
  const material = async ({ id, accountId, payload }) => {
    const op = normalizeManualMaterial(payload);
    return transaction(id, accountId, async () => {
      const r = await owned(id, accountId);
      editable(r);
      const fingerprint = digest(JSON.stringify(op)), old = (r.manual_material_receipts ?? []).find((x) => x.operation_id === op.operation_id);
      if (old) {
        if (old.fingerprint !== fingerprint) fail("同一资料方式操作的内容发生变化。", 409);
        return { ...summary(r), operation_id: op.operation_id, repeated: true };
      }
      await reconcile(r);
      await assertNotBusy(r);
      if (r.revision !== op.revision) fail("草稿版本已更新，请重新读取。", 409);
      if (op.source_format === "pdf" && r.manual_metadata?.sharing_scope !== "reading-copy") fail("请先将提供方式保存为“希望提供站内阅读副本”，再选择PDF。", 409);
      const used = await submissionPayloadUsage(path.join(root, id), { now: now() });
      if ((r.source_format ?? "images") !== op.source_format && (used.actualBytes || used.reservedBytes || r.images.length)) fail("本册已经留存文件，请继续当前方式或另建草稿；旧文件不会自动删除。", 409);
      const next = { ...r, source_format: op.source_format, revision: r.revision + 1, updated_at: new Date(now()).toISOString(), manual_material_receipts: [...r.manual_material_receipts ?? [], { operation_id: op.operation_id, fingerprint }].slice(-200), history: [...r.history, { at: new Date(now()).toISOString(), action: "manual_material_changed" }] };
      await writeRecord(id, next);
      return { ...summary(next), operation_id: op.operation_id };
    });
  };
  const prepare = async ({ id, accountId, payload }) => {
    const input = normalizeManualPdfUpload(payload), fingerprint = digest(JSON.stringify(input));
    return transaction(id, accountId, async () => {
      const r = await owned(id, accountId), u = uploadId(id, r.account_id, input.operation_id), prior = await loadOp(id, u);
      if (prior) {
        if (prior.fingerprint !== fingerprint) fail("同一上传凭证的文件信息已改变，请重新选择操作。", 409);
        if (applied(r, prior)) await checkSource(id, prior.target_source);
        return projection(r, prior);
      }
      editable(r);
      await reconcile(r);
      await assertNotBusy(r);
      if (r.source_format !== "pdf" || r.manual_metadata?.sharing_scope !== "reading-copy") fail("请先保存PDF资料方式。", 409);
      if (r.revision !== input.revision) fail("草稿版本已更新，请重新读取后上传。", 409);
      const ops = await operations(id);
      if (ops.length >= limits.operations) fail("本册上传操作记录已达上限，请联系维护者核对。", 429);
      await fs.mkdir(path.join(folder(id), "uploads"), { recursive: true, mode: 0o700 });
      const at = new Date(now()).toISOString(), op = { ...input, fingerprint, upload_id: u, status: "reserved", created_at: at, expires_at: new Date(now() + limits.reservationMs).toISOString(), message: "已预留文件空间，等待接收PDF。" };
      const existing = (r.manual_pdf_sources ?? []).find((s) => s.sha256 === input.sha256 && s.bytes === input.bytes);
      if (existing) {
        await checkSource(id, existing);
        op.target_source = existing;
        op.status = "committing";
        await writeOp(id, op);
        const next = { ...r, manual_pdf_current_source_id: existing.source_id, manual_pdf_saved_operations: [...r.manual_pdf_saved_operations ?? [], { operation_id: op.operation_id, source_id: existing.source_id }], revision: r.revision + 1, updated_at: at, history: [...r.history, { at, action: "manual_pdf_reused" }] };
        await writeRecord(id, next);
        op.status = "saved";
        await writeOp(id, op);
        return projection(next, op);
      }
      const used = await submissionPayloadUsage(path.join(root, id), { now: now() });
      if (used.sourceCount >= limits.sources) fail("本册最多保留5份不同PDF副本，旧版本仍占容量，请先联系维护者整理。", 413);
      await checkStorageLimit(accountId, input.bytes);
      if ((await globalUsage()).allocatedBytes + input.bytes > maxStorageBytes) fail("私密暂存区空间不足，已有文件仍保留。", 503);
      await writeOp(id, op);
      return projection(r, op);
    });
  };
  const cancel = async ({ id, accountId, operationId }) => {
    if (!/^[a-f0-9]{64}$/.test(operationId ?? "")) fail("PDF操作凭证无效。", 404);
    let running;
    const result = await transaction(id, accountId, async () => {
      const r = await owned(id, accountId), op = await loadOp(id, uploadId(id, r.account_id, operationId));
      if (!op) return { ...projection(r, null), operation_id: operationId };
      if (applied(r, op)) {
        await checkSource(id, op.target_source);
        return projection(r, op);
      }
      if (["needs_review", "committing", "saved"].includes(op.status)) fail("保存结果需要维护者核对，完整文件仍私密保留，不能按未完成上传删除。", 409);
      running = active.get(keyFor(id, op.upload_id));
      if (running) {
        op.status = "cancelling";
        op.message = "正在停止未完成上传。";
        await writeOp(id, op);
        return projection(r, op);
      }
      if (!await canClean(id, op)) fail("上次上传仍由另一个进程处理，暂不能取消或清理。", 409);
      await removePart(id, op.upload_id);
      await releaseLease(id, op.upload_id);
      op.status = "cancelled";
      op.message = "未完成的上传已取消；已保存的完整PDF和历史副本仍保留。";
      await writeOp(id, op);
      return projection(r, op);
    }, true);
    if (running) {
      running.abort();
      await Promise.race([running.done, new Promise((resolve) => setTimeout(resolve, 2e3))]);
      return status({ id, accountId, operationId });
    }
    return result;
  };
  const receive = async ({ id, accountId, uploadId: u, request }) => {
    let op, handle, control, resolveDone, verified = false;
    const key = keyFor(id, u);
    await transaction(id, accountId, async () => {
      const r = await owned(id, accountId);
      editable(r);
      op = await loadOp(id, u);
      if (!op) fail("找不到这次PDF上传。", 404);
      if (applied(r, op)) fail("这次PDF已保存，请先查询原操作回执。", 409);
      if (op.status !== "reserved" || expired(op)) fail("这次上传不能继续，请核对回执或取消后重新选择文件。", 409);
      if (r.source_format !== "pdf" || r.revision !== op.revision) fail("草稿版本或资料方式已更新，请重新读取。", 409);
      if ((request.headers["content-type"] ?? "").split(";")[0].trim().toLowerCase() !== "application/pdf") fail("PDF文件传输格式无效。", 415);
      const declared = request.headers["content-length"];
      if (declared !== void 0 && (!/^\d+$/.test(String(declared)) || Number(declared) !== op.bytes)) fail("文件传输大小与预留不一致。", 413);
      if (await lease(id, u)) fail("这次文件正在接收，请先核对回执。", 409);
      try {
        await fs.access(partFile(id, u));
        fail("存在未完成的临时文件，请先取消后重选。", 409);
      } catch (e) {
        if (e.code !== "ENOENT") throw e;
      }
      await fs.mkdir(leaseDir(id, u), { mode: 0o700 });
      try {
        await atomicJson(path.join(leaseDir(id, u), "owner.json"), { pid: process.pid });
        op.status = "receiving";
        op.expires_at = new Date(now() + limits.reservationMs).toISOString();
        await writeOp(id, op);
        // 无错误参数，避免异步迭代尚未接管时取消导致未监听的error事件。
        control = { abort: () => request.destroy(), done: new Promise((resolve) => { resolveDone = resolve; }) };
        active.set(key, control);
      } catch (error) {
        // 本调用还未开流，可以撤去自己刚建立的进程标记；不触及完整文件。
        await releaseLease(id, u).catch(() => {});
        throw error;
      }
    });
    let timer, idle, received = 0;
    const h = createHash("sha256");
    let header = Buffer.alloc(0);
    const resetIdle = () => {
      clearTimeout(idle);
      idle = setTimeout(() => control.abort(), options.idleMs ?? limits.idleMs);
      idle.unref?.();
    };
    try {
      handle = await fs.open(partFile(id, u), "wx", 384);
      timer = setTimeout(() => control.abort(), options.streamMs ?? limits.streamMs);
      timer.unref?.();
      resetIdle();
      for await (const value of request) {
        const chunk = Buffer.from(value);
        received += chunk.length;
        if (received > op.bytes || received > limits.sourceBytes) fail("实际PDF字节超过预留，上传未保存。", 413);
        if (header.length < 5) header = Buffer.concat([header, chunk.subarray(0, 5 - header.length)]);
        if (header.length === 5 && !header.equals(Buffer.from("%PDF-"))) fail("文件头不符合PDF初筛要求，上传未保存。", 415);
        h.update(chunk);
        let offset = 0;
        while (offset < chunk.length) {
          const result = await handle.write(chunk, offset, chunk.length - offset);
          if (!result.bytesWritten) fail("暂存写入未完成。", 503);
          offset += result.bytesWritten;
        }
        resetIdle();
      }
      if (received !== op.bytes || h.digest("hex") !== op.sha256) fail("文件字节数或摘要与所选PDF不一致，请重新选择。", 409);
      verified = true;
      await handle.sync();
      await handle.close();
      handle = null;
      return await transaction(id, accountId, async () => {
        const r = await owned(id, accountId), fresh = await loadOp(id, u);
        editable(r);
        if (fresh.status !== "receiving" || r.revision !== op.revision || r.source_format !== "pdf") fail("上传期间草稿或取消状态已改变，未替换原文件。", 409);
        const source = { source_id: "PS-" + randomBytes(12).toString("hex"), filename: "source-" + randomBytes(32).toString("hex") + ".pdf", sha256: op.sha256, bytes: received, original_name: op.name, uploaded_at: new Date(now()).toISOString() };
        fresh.target_source = source;
        fresh.status = "committing";
        await writeOp(id, fresh);
        op = fresh;
        try {
          await fs.access(path.join(folder(id), source.filename));
          fail("目标文件已存在，已停止避免覆盖。", 409);
        } catch (e) {
          if (e.code !== "ENOENT") throw e;
        }
        await fs.rename(partFile(id, u), path.join(folder(id), source.filename));
        const next = { ...r, manual_pdf_sources: [...r.manual_pdf_sources ?? [], source], manual_pdf_current_source_id: source.source_id, manual_pdf_saved_operations: [...r.manual_pdf_saved_operations ?? [], { operation_id: op.operation_id, source_id: source.source_id }], revision: r.revision + 1, updated_at: source.uploaded_at, history: [...r.history, { at: source.uploaded_at, action: "manual_pdf_saved" }] };
        await writeRecord(id, next);
        op.status = "saved";
        await writeOp(id, op);
        return projection(next, op);
      }, true);
    } catch (error) {
      if (handle) {
        await handle.close().catch(() => {
        });
        handle = null;
      }
      return await transaction(id, accountId, async () => {
        const r = await owned(id, accountId), fresh = await loadOp(id, u);
        if (applied(r, fresh)) {
          await checkSource(id, fresh.target_source);
          fresh.status = "saved";
          await writeOp(id, fresh);
          return projection(r, fresh);
        }
        if (fresh.status === "committing" || verified && fresh.status !== "cancelling") {
          fresh.status = "needs_review";
          fresh.message = "保存中断，完整结果仍私密保留，需维护者核对；不会自动重传或删除。";
          await writeOp(id, fresh);
          throw Object.assign(new Error(fresh.message), { name: "SubmissionError", statusCode: 503 });
        }
        try {
          await removePart(id, u);
        } catch {
          fresh.status = "needs_review";
          fresh.message = "临时文件清理未完成，仍计入容量，请联系维护者核对。";
          await writeOp(id, fresh);
          fail(fresh.message, 503);
        }
        fresh.status = fresh.status === "cancelling" ? "cancelled" : "failed";
        fresh.message = fresh.status === "cancelled" ? "未完成上传已取消，原PDF和历史副本仍保留。" : error.statusCode ? error.message : "文件传输中断，请重新选择同一文件，从头上传。";
        await writeOp(id, fresh);
        throw Object.assign(new Error(fresh.message), { name: "SubmissionError", statusCode: error.statusCode ?? 409 });
      }, true);
    } finally {
      clearTimeout(timer);
      clearTimeout(idle);
      if (handle) await handle.close().catch(() => {
      });
      active.delete(key);
      try {
        await releaseLease(id, u);
      } finally {
        resolveDone?.();
      }
    }
  };
  const safe = (fn) => async (...args) => {
    try {
      return await fn(...args);
    } catch (error) {
      if (error?.name === "SubmissionError") throw error;
      fail("私密PDF文件暂时无法核对，已有文件仍保留，请联系维护者。", 503);
    }
  };
  return { prepare: safe(prepare), receive: safe(receive), cancel: safe(cancel), status: safe(status), describe: safe(describe), material: safe(material), assertNotBusy: safe(assertNotBusy),assertUploadsIdle:safe(assertUploadsIdle) };
}
export {
  createManualPdfStore
};
