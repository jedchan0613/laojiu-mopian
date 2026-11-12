// 6.2只接收私密PDF副本，不运行PDF解析器或生成公开文件。
const manualPdfUploadLimits = Object.freeze({ sourceBytes: 20 * 1024 * 1024, sources: 5, operations: 200, reservationMs: 15 * 60 * 1e3, streamMs: 120 * 1e3, idleMs: 30 * 1e3, accountBytes: 200 * 1024 * 1024, concurrency: 2 });
const manualPdfUploadIdPattern = /^PU-[a-f0-9]{24}$/;
const manualPdfSourcePattern = /^source-[a-f0-9]{64}\.pdf$/;
const fail = (message, statusCode = 400) => {
  throw Object.assign(new Error(message), { name: "SubmissionError", statusCode });
};
function base(input, keys) {
  if (!input || typeof input !== "object" || Array.isArray(input) || Object.keys(input).some((k) => !keys.includes(k))) fail("PDF操作包含无法识别的内容。");
  if (typeof input.operation_id !== "string" || !/^[a-f0-9]{64}$/.test(input.operation_id)) fail("PDF操作凭证无效。");
  if (!Number.isSafeInteger(input.revision) || input.revision < 1) fail("草稿版本无效，请重新读取。", 428);
  if (input.website) fail("提交未通过。");
  return { operation_id: input.operation_id, revision: input.revision };
}
function normalizeManualMaterial(input) {
  const op = base(input, ["operation_id", "revision", "source_format", "website"]);
  if (!["images", "pdf"].includes(input.source_format)) fail("请选择图片或PDF资料方式。");
  return { ...op, source_format: input.source_format };
}
function normalizeManualPdfUpload(input) {
  const op = base(input, ["operation_id", "revision", "name", "bytes", "sha256", "copies_confirmed", "website"]);
  if (typeof input.name !== "string" || input.name.length > 180 || !input.name.trim() || /[\x00-\x1f\x7f/\\:]/.test(input.name) || !/\.pdf$/i.test(input.name) || /(?:^|[._\s-])(?:master|original|raw)(?:[._\s-]|$)|主档|原始/i.test(input.name)) fail("请选择一份经过筛选的PDF副本，不接收主档或带路径的文件名。");
  if (!Number.isSafeInteger(input.bytes) || input.bytes < 5 || input.bytes > manualPdfUploadLimits.sourceBytes) fail("每份PDF最多20 MiB，请先在本机准备合适的副本。", 413);
  if (typeof input.sha256 !== "string" || !/^[a-f0-9]{64}$/.test(input.sha256)) fail("文件核对信息无效，请重新选择PDF。");
  if (input.copies_confirmed !== true) fail("请确认PDF为经过筛选的副本，主档已另行保存。");
  return { ...op, name: input.name.trim(), bytes: input.bytes, sha256: input.sha256, copies_confirmed: true };
}
export {
  manualPdfSourcePattern,
  manualPdfUploadIdPattern,
  manualPdfUploadLimits,
  normalizeManualMaterial,
  normalizeManualPdfUpload
};
