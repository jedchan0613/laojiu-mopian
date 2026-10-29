// 仅判断当前人工确认是否齐备；不勾选、不填编号，也不发送任何请求。
export function getMergeExecutionReadiness({ review, confirmPrimaryId, confirmations, publicationAuthorization, pending = false, executing = false, now = Date.now() } = {}) {
  const reasons = [];
  const primaryId = typeof review?.primaryId === 'string' ? review.primaryId : '';
  const validReview = /^LJM-\d{8}-[A-Z]{3}-\d{3}$/.test(primaryId);
  const expiresAt = typeof review?.expiresAt === 'string' ? Date.parse(review.expiresAt) : NaN;
  const validTime = Number.isFinite(expiresAt) && Number.isFinite(now);
  const expired = validTime && now >= expiresAt;
  const completeChecklist = Array.isArray(confirmations) && confirmations.length === 13;
  const missingChecks = completeChecklist ? confirmations.filter(value => value !== true).length : 13;
  if (executing) reasons.push('正在执行合并，请等待结果。');
  else if (pending) reasons.push('上一次请求的结果尚待核实，请先核对原结果。');
  if (!validReview) reasons.push('请先重新检查执行条件并核对本次资料。');
  else {
    const entered = typeof confirmPrimaryId === 'string' ? confirmPrimaryId.trim() : '';
    if (!entered) reasons.push('请在编号输入框中填写将保留的完整编号。');
    else if (entered !== primaryId) reasons.push('输入的编号与将保留的完整编号不一致。');
  }
  if (!validTime) reasons.push('本次核对的有效时间无效，请返回重新检查执行条件。');
  else if (expired) reasons.push('本次核对已过期，请返回重新检查执行条件。');
  if (!completeChecklist) reasons.push('13项核对清单不完整，请返回重新检查执行条件。');
  else if (missingChecks) reasons.push(`还有${missingChecks}项本人核对未勾选。`);
  if (publicationAuthorization?.publishMergedPrimary !== true) reasons.push('请勾选同意发布合并后的主档案。');
  if (publicationAuthorization?.withdrawSecondary !== true) reasons.push('请勾选同意从档案正式撤销留档。');
  return { ready: reasons.length === 0, reasons, primaryId, missingChecks, completeChecklist, validReview, expired, expiresAt,
    canSelectChecks: validReview && validTime && !expired && !pending && !executing };
}
