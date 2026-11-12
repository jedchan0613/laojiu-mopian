// PDF独立开关只控制新写入。本人查询、回执、取消和停止不能依赖此开关。
export function readManualPdfSettings(environment, values = process.env) {
  const raw = String(values.LJM_ACCOUNT_PDF_OPEN ?? (environment === 'production' ? 'false' : 'true')).trim().toLowerCase();
  if (!['true', 'false'].includes(raw)) throw new Error('LJM_ACCOUNT_PDF_OPEN 只能是 true 或 false。');
  const budget = String(values.LJM_SUBMISSION_MAX_STORAGE_MIB ?? '10240').trim();
  if (!/^[1-9]\d{0,4}$/.test(budget) || Number(budget) > 10240) throw new Error('LJM_SUBMISSION_MAX_STORAGE_MIB 必须为1至10240的整数。');
  return {pdfOpen: raw === 'true', maxStorageBytes: Number(budget) * 1024 ** 2};
}

export async function manualPdfAvailability({local, pdfOpen, submissionStore}) {
  if (typeof pdfOpen !== 'boolean') throw new Error('PDF能力开关必须为明确的布尔值。');
  if (!pdfOpen || !submissionStore) return {uploads: false, generation: false, workflow: false, message: 'PDF暂时暂停接收和处理，已有记录仍可查看、查询回执、取消或停止。'};
  let runtime;
  try { runtime = await submissionStore.manualPdfRuntimeStatus?.(); } catch { runtime = null; }
  // 6.1 Windows本地验收不能作为Linux线上验收。现有运行器没有此证明，线上仍关闭。
  const productionReady = runtime?.available === true && runtime.execution_platform === 'linux' && runtime.production_verified === true;
  if (!local && !productionReady) return {uploads: false, generation: false, workflow: false, message: '服务器PDF隔离处理尚未通过验收，PDF入口保持关闭；已有记录仍可查看或停止。'};
  return {uploads: true, generation: runtime?.available === true, workflow: true, message: local ? (runtime?.message || 'PDF处理工具尚未就绪，已有资料仍保留。') : 'PDF处理可用。'};
}
