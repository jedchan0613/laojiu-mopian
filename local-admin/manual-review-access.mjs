// 线上说明书图片审核的只读投影、审核绑定核验与受限文件读取。
import fs from 'node:fs/promises';
import {constants} from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {normalizeManualSubmission} from '../shared/manual-submission.mjs';
import {manualReviewChecks} from '../shared/manual-review.mjs';
import {manualSnapshotContent} from '../shared/manual-pdf-review.mjs';
import {detectPublicationImageMime} from '../shared/publication-image-safety.mjs';

export const manualReviewRulesVersion = '2026-11-15-manual-review-v1';

const manualIdPattern = /^TG-[A-F0-9]{24}$/;
const operationIdPattern = /^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i;
const validOperation = value => typeof value === 'string' && operationIdPattern.test(value);
const imageFilenamePattern = /^manual-[a-f0-9]{64}\.jpg$/;
const digestPattern = /^[a-f0-9]{64}$/;
const safeFailure = Symbol('manual-review-access-error');
const metadataKeys = Object.freeze([
  'schema_version', 'brand_name', 'model_texts', 'product_name', 'category_key',
  'document_kind', 'languages', 'region_display', 'edition_display', 'edition_date',
  'completeness', 'missing_note', 'official_url', 'source_note', 'rights_basis',
  'rights_note', 'sharing_scope', 'description', 'people', 'attribution', 'credit',
]);
const statuses = Object.freeze(['draft', 'pending', 'needs_info', 'declined', 'approved', 'withdrawn']);
const handoffStatuses = Object.freeze(['in-progress', 'complete', 'needs_review']);
const plain = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const validId = value => typeof value === 'string' && manualIdPattern.test(value);
const validDigest = value => typeof value === 'string' && digestPattern.test(value);
const validRevision = value => Number.isSafeInteger(value) && value >= 1;
const text = (value, maximum) => typeof value === 'string' ? value.slice(0, maximum) : '';
const revision = value => validRevision(value) ? value : null;
const digest = value => validDigest(value) ? value : '';
const choice = (value, values) => values.includes(value) ? value : '';
const sha256 = value => createHash('sha256').update(value).digest('hex');
const contentHash = value => sha256(JSON.stringify(value));

function fail(message, statusCode = 409, code = 'MANUAL_REVIEW_ACCESS_CONFLICT') {
  const error = new Error(message);
  error.name = 'SubmissionError';
  error.statusCode = statusCode;
  error.code = code;
  error[safeFailure] = true;
  throw error;
}

function assertIdentity(record) {
  if (!plain(record) || record.submission_kind !== 'manual' || !validId(record.id)) {
    fail('找不到这份说明书投稿。', 404, 'MANUAL_REVIEW_PDF_DISABLED');
  }
}

export function readManualReviewSettings(env, online, platform = process.platform) {
  const source = env === undefined ? {} : env;
  if (!plain(source)) fail('说明书审核配置无法读取。');
  function flag(name) {
    let value;
    try {
      value = source[name];
    } catch {
      fail('说明书审核开关配置无法读取。');
    }
    if (value === undefined || value === 'false') return false;
    if (value === 'true') return true;
    fail('说明书审核及转入开关只能配置为 true 或 false。');
  }
  const onlineEnabled = flag('LJM_MANUAL_REVIEW_ONLINE_ENABLED');
  const requestedTransfer = flag('LJM_MANUAL_TRANSFER_ONLINE_ENABLED');
  // 目录维护沿用已有配置的首尾空白兼容规则；新开关仍严格检查。
  let catalogValue;
  try {
    catalogValue = source.LJM_MANUALS_ONLINE_ENABLED;
  } catch {
    fail('说明书目录维护开关配置无法读取。');
  }
  const catalogEnabled = typeof catalogValue === 'string' && catalogValue.trim() === 'true';
  const isOnline = Boolean(online);
  const reviewWritable = !isOnline || (onlineEnabled && platform === 'linux');
  const transferWritable = !isOnline || (reviewWritable && requestedTransfer && catalogEnabled);
  let reviewWriteReason = '';
  if (!reviewWritable) {
    reviewWriteReason = !onlineEnabled
      ? '线上说明书审核尚未开启，当前仅可只读核对。'
      : '线上说明书审核写入仅支持 Linux，当前仅可只读核对。';
  }
  return {
    onlineEnabled,
    requestedTransfer,
    reviewWritable,
    reviewWriteReason,
    transferWritable,
    transferWriteReason: transferWritable ? '' : !onlineEnabled ? '线上说明书审核尚未开启。'
      : !requestedTransfer ? '线上说明书转入尚未开启。'
      : !catalogEnabled ? '线上说明书目录维护尚未开启。'
      : '线上说明书转入仅支持 Linux。',
    capabilities: {
      manualReviewVersion: isOnline ? Number(onlineEnabled) : 1,
      manualTransferVersion: Number(transferWritable),
      manualPdfHandoffVersion: isOnline ? 0 : 1,
    },
  };
}

function activePdfReference(value) {
  if (!plain(value)) return true;
  for (const key of Object.keys(value)) {
    const activeKey = key === 'pdf'
      || /^manual_pdf_(?:current|preview|active|pending)(?:_|$)/.test(key)
      || ['manual_pdf_source', 'manual_pdf_source_id', 'manual_pdf_job', 'manual_pdf_job_id',
        'manual_pdf_processing', 'manual_pdf_confirmation'].includes(key);
    if (activeKey && value[key] !== undefined && value[key] !== null && value[key] !== '') return true;
  }
  return false;
}

function imageContent(value) {
  return plain(value)
    && (value.source_format === undefined || value.source_format === 'images')
    && !activePdfReference(value);
}

function latestSnapshot(record) {
  if (!Array.isArray(record.versions)) return null;
  let latest = null;
  for (const row of record.versions) {
    if (!plain(row)) continue;
    if (!latest || !validRevision(latest.revision)
      || (validRevision(row.revision) && row.revision >= latest.revision)) latest = row;
  }
  return latest;
}

function currentImageContent(record) {
  if (!imageContent(record)) return false;
  if (record.source_format !== undefined) return true;
  const latest = latestSnapshot(record);
  if (latest && !imageContent(latest)) return false;
  if (Array.isArray(record.versions)) {
    for (const row of record.versions) {
      if (plain(row) && row.revision === record.manual_submitted_revision && !imageContent(row)) return false;
    }
  }
  return true;
}

export function assertManualReviewImages(record, version = null) {
  assertIdentity(record);
  if (!currentImageContent(record) || (version !== null && version !== undefined && !imageContent(version))) {
    fail('线上仅支持图片说明书审核；本册或所选版本涉及 PDF，请在本机核对。', 404, 'MANUAL_REVIEW_PDF_DISABLED');
  }
}

function normalizeMetadata(value) {
  if (!plain(value)) return null;
  const input = {};
  for (const key of metadataKeys) {
    if (Object.hasOwn(value, key)) input[key] = value[key];
  }
  try {
    return normalizeManualSubmission(input);
  } catch {
    return null;
  }
}

function trueChecks(value, count) {
  if (!Number.isSafeInteger(count) || count < 0 || !Array.isArray(value) || value.length !== count) return false;
  for (let index = 0; index < count; index++) {
    if (value[index] !== true) return false;
  }
  return true;
}

function validActor(value) {
  return typeof value === 'string' && value.length <= 254
    && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
    && !/[\u0000-\u001f\u007f]/.test(value);
}

function validAt(value) {
  return typeof value === 'string' && value.length <= 40
    && /^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}(?:\.[0-9]{1,3})?Z$/.test(value)
    && Number.isFinite(Date.parse(value));
}

function sameCurrentImages(current, submitted) {
  if (!Array.isArray(current) || !Array.isArray(submitted) || current.length !== submitted.length) return false;
  const keys = ['page_id', 'filename', 'label', 'note', 'bytes'];
  for (let index = 0; index < current.length; index++) {
    const left = current[index], right = submitted[index];
    if (!plain(left) || !plain(right)) return false;
    for (const key of keys) {
      if (left[key] !== right[key]) return false;
    }
    // 旧图片草稿可能未保存 sha256；提交快照的摘要仍必须完整重算。
    if (left.sha256 !== undefined && left.sha256 !== right.sha256) return false;
  }
  return true;
}

export function manualReviewBindingProblems(record, privacyCount, {requireAudit = false} = {}) {
  const problems = [];
  if (!plain(record) || record.submission_kind !== 'manual' || !validId(record.id)) {
    return ['说明书记录标识无效，当前只能只读核对。'];
  }
  try {
    assertManualReviewImages(record);
  } catch {
    problems.push('当前资料不能证明是图片说明书，PDF 仅限本机核对。');
  }
  if (record.status !== 'approved') problems.push('当前提交尚未通过说明书人工审核。');
  if (record.withdrawal_requested) problems.push('投稿人已申请停止处理，原审核不能继续使用。');
  if (!Number.isSafeInteger(privacyCount) || privacyCount < 0) problems.push('隐私检查规则数量无效，当前只能只读核对。');

  const rows = Array.isArray(record.versions)
    ? record.versions.filter(row => plain(row) && row.revision === record.manual_submitted_revision)
    : [];
  const version = validRevision(record.manual_submitted_revision) && rows.length === 1 ? rows[0] : null;
  if (!version) {
    problems.push('当前提交快照缺失或版本编号不唯一，不能沿用旧审核。');
  } else {
    if (!imageContent(version)) problems.push('当前提交快照涉及 PDF，不能用于线上图片审核。');
    if (!normalizeMetadata(version.manual_metadata) || !normalizeMetadata(record.manual_metadata)) {
      problems.push('说明书资料不完整或格式无效，旧记录仅供只读核对。');
    }
    try {
      if (!validDigest(version.digest) || contentHash(manualSnapshotContent(version)) !== version.digest) {
        problems.push('提交快照摘要不符，内容可能已变化，必须重新核对。');
      }
    } catch {
      problems.push('提交快照摘要无法核对，不能沿用旧审核。');
    }
    try {
      if (contentHash(record.manual_metadata) !== contentHash(version.manual_metadata)
        || !sameCurrentImages(record.images, version.images)
        || (Object.hasOwn(record, 'consent') && contentHash(record.consent) !== contentHash(version.consent))) {
        problems.push('当前资料与提交时留存不一致，不能沿用原审核绑定。');
      }
    } catch {
      problems.push('当前资料与提交快照无法核对，不能沿用原审核绑定。');
    }
  }

  const binding = plain(record.manual_review_binding) ? record.manual_review_binding : null;
  if (!binding) {
    problems.push('缺少说明书专用审核绑定，旧记录仅供只读核对。');
  } else {
    if (!validRevision(binding.submitted_revision) || binding.submitted_revision !== record.manual_submitted_revision
      || !version || binding.submitted_revision !== version.revision || !validDigest(binding.digest)
      || binding.digest !== version.digest) {
      problems.push('审核未绑定当前提交版本及摘要，请重新审核。');
    }
    const scope = version?.manual_metadata?.sharing_scope;
    if (!['reading-copy', 'official-link'].includes(scope) || binding.sharing_scope !== scope
      || record.manual_metadata?.sharing_scope !== scope) {
      problems.push('审核提供范围与当前提交不一致，请重新核对权利依据。');
    }
    if (!trueChecks(binding.checks, manualReviewChecks.length)) problems.push('说明书四项人工检查尚未全部完成。');
    if (!trueChecks(binding.privacy_checks, privacyCount)) problems.push('隐私人工检查尚未按当前规则全部完成。');
    for (const [key, label] of [['model_basis', '型号适用'], ['source_basis', '来源核对'], ['rights_basis', '权利及提供范围']]) {
      if (typeof binding[key] !== 'string' || binding[key].trim().length < 2) problems.push('缺少至少两字的' + label + '依据。');
    }
  }

  if (requireAudit) {
    const audit = plain(record.manual_review_audit) ? record.manual_review_audit : null;
    if (!audit || audit.rules_version !== manualReviewRulesVersion || !validActor(audit.actor)
      || !validOperation(audit.operation_id) || !validOperation(audit.step_id)) {
      problems.push('缺少当前规则下有效的管理员身份及操作审计，旧记录仅供只读核对。');
    }
    if (!audit || !binding || !version || audit.submitted_revision !== record.manual_submitted_revision
      || audit.submitted_revision !== binding.submitted_revision || !validDigest(audit.digest)
      || audit.digest !== version.digest || audit.digest !== binding.digest
      || audit.status !== record.status || audit.status !== 'approved'
      || !validAt(audit.at) || audit.at !== binding.at) {
      problems.push('操作审计与当前提交、审核状态或绑定时间不一致，不能沿用原审核。');
    }
  }
  return problems;
}

function projectImage(value) {
  const row = plain(value) ? value : {};
  return {
    page_id: typeof row.page_id === 'string' && /^[A-Za-z0-9_-]{1,100}$/.test(row.page_id) ? row.page_id : '',
    filename: typeof row.filename === 'string' && imageFilenamePattern.test(row.filename) ? row.filename : '',
    label: text(row.label, 40),
    note: text(row.note, 300),
    bytes: Number.isSafeInteger(row.bytes) && row.bytes >= 0 ? row.bytes : 0,
    sha256: digest(row.sha256),
  };
}

function projectImages(value) {
  return Array.isArray(value) ? Array.from(value, projectImage) : [];
}

function projectChecks(value, count) {
  if (!Array.isArray(value) || !Number.isSafeInteger(count) || count < 0) return [];
  return Array.from({length: Math.min(value.length, count)}, (_, index) => value[index] === true);
}

function projectBinding(value, privacyCount) {
  if (!plain(value)) return null;
  return {
    submitted_revision: revision(value.submitted_revision),
    digest: digest(value.digest),
    sharing_scope: choice(value.sharing_scope, ['reading-copy', 'official-link']),
    at: validAt(value.at) ? value.at : '',
    model_basis: text(value.model_basis, 2000),
    source_basis: text(value.source_basis, 2000),
    rights_basis: text(value.rights_basis, 2000),
    checks: projectChecks(value.checks, manualReviewChecks.length),
    privacy_checks: projectChecks(value.privacy_checks, privacyCount),
  };
}

function projectActor(value) {
  return validActor(value) || value === '本机维护者' ? value : '';
}

function projectAudit(value) {
  if (!plain(value)) return null;
  return {
    rules_version: value.rules_version === manualReviewRulesVersion ? value.rules_version : '',
    actor: projectActor(value.actor),
    operation_id: validOperation(value.operation_id) ? value.operation_id : '',
    step_id: validOperation(value.step_id) ? value.step_id : '',
    submitted_revision: revision(value.submitted_revision),
    digest: digest(value.digest),
    status: choice(value.status, statuses),
    at: validAt(value.at) ? value.at : '',
  };
}

function projectConsent(value) {
  const consent = plain(value) ? value : {};
  const checks = plain(consent.checks) ? consent.checks : plain(consent.consents) ? consent.consents : consent;
  return {
    copies: checks.copies === true,
    rights: checks.rights === true,
    privacy: checks.privacy === true,
    processing: checks.processing === true,
  };
}

function projectAction(value) {
  return typeof value === 'string' && /^[a-z][a-z0-9_-]{0,63}$/.test(value) ? value : '';
}

function projectVersion(value) {
  if (!imageContent(value)) {
    return {revision: revision(value.revision), at: validAt(value.at) ? value.at : '', source_format: 'pdf', restricted: true};
  }
  return {
    fields: {title: text(value.fields?.title, 80)},
    manual_metadata: normalizeMetadata(value.manual_metadata),
    images: projectImages(value.images),
    consent: projectConsent(value.consent),
    digest: digest(value.digest),
    at: validAt(value.at) ? value.at : '',
    revision: revision(value.revision),
    action: projectAction(value.action),
  };
}

function projectHistory(value) {
  return {
    at: validAt(value.at) ? value.at : '',
    action: projectAction(value.action),
    status: choice(value.status, statuses),
    private_note: text(value.private_note, 4000),
    public_message: text(value.public_message, 1000),
    submitted_revision: revision(value.submitted_revision),
    actor: projectActor(value.actor),
  };
}

function linkedItem(value) {
  return typeof value === 'string' && /^LJM-[0-9]{8}-(?:RPR|OTH)-[0-9]{3}$/.test(value) ? value : null;
}

function catalogKey(value) {
  return typeof value === 'string' && /^manual-[a-f0-9]{24}$/.test(value) ? value : null;
}

function handoffStatus(record) {
  return plain(record.manual_handoff) && handoffStatuses.includes(record.manual_handoff.status)
    ? record.manual_handoff.status : null;
}

export function projectManualReviewRecord(record, privacyCount) {
  assertManualReviewImages(record);
  const problems = manualReviewBindingProblems(record, privacyCount, {requireAudit: true});
  return {
    id: record.id,
    revision: revision(record.revision),
    submission_kind: 'manual',
    source_format: 'images',
    status: choice(record.status, statuses),
    created_at: validAt(record.created_at) ? record.created_at : '',
    updated_at: validAt(record.updated_at) ? record.updated_at : '',
    fields: {title: text(record.fields?.title, 80)},
    manual_metadata: normalizeMetadata(record.manual_metadata),
    images: projectImages(record.images),
    manual_submitted_revision: revision(record.manual_submitted_revision),
    public_message: text(record.public_message, 1000),
    private_note: text(record.private_note, 4000),
    withdrawal_requested: Boolean(record.withdrawal_requested),
    linked_item_id: linkedItem(record.linked_item_id),
    manual_catalog_key: catalogKey(record.manual_catalog_key),
    manual_handoff: plain(record.manual_handoff) ? {status: handoffStatus(record)} : null,
    manual_review_binding: projectBinding(record.manual_review_binding, privacyCount),
    manual_review_audit: projectAudit(record.manual_review_audit),
    review_validity: {valid: problems.length === 0, problems},
    versions: Array.isArray(record.versions) ? record.versions.filter(plain).map(projectVersion) : [],
    history: Array.isArray(record.history) ? record.history.filter(plain).map(projectHistory) : [],
  };
}

export function manualReviewSummary(record) {
  assertIdentity(record);
  return {
    id: record.id,
    revision: revision(record.revision),
    submission_kind: 'manual',
    fields: {title: text(record.fields?.title, 80)},
    status: choice(record.status, statuses),
    image_count: Array.isArray(record.images) ? record.images.length : 0,
    source_format: currentImageContent(record) ? 'images' : 'pdf',
    withdrawal_requested: Boolean(record.withdrawal_requested),
    linked_item_id: linkedItem(record.linked_item_id),
    manual_catalog_key: catalogKey(record.manual_catalog_key),
    manual_handoff_status: handoffStatus(record),
  };
}

const sameIdentity = (left, right) => left.dev === right.dev && left.ino === right.ino;
const samePath = (left, right) => path.relative(left, right) === '';
const sameFile = (left, right) => sameIdentity(left, right) && left.mode === right.mode
  && left.nlink === right.nlink && left.size === right.size
  && left.mtimeMs === right.mtimeMs && left.ctimeMs === right.ctimeMs;

async function checkedDirectory(directory) {
  const stat = await fs.lstat(directory);
  if (stat.isSymbolicLink() || !stat.isDirectory()) fail('说明书留存目录不是可直接读取的普通目录。');
  return stat;
}

async function inspectFile(root, id, filename, maximumBytes) {
  const parsed = path.parse(root);
  let cursor = parsed.root;
  let rootStat = await checkedDirectory(cursor);
  for (const part of root.slice(parsed.root.length).split(path.sep).filter(Boolean)) {
    cursor = path.join(cursor, part);
    rootStat = await checkedDirectory(cursor);
  }
  const rootReal = await fs.realpath(root);
  if (!samePath(root, rootReal)) fail('说明书留存目录不能经过文件链接。');
  const directory = path.join(root, id);
  const directoryStat = await checkedDirectory(directory);
  // 普通目录的链接数包含子目录，不能用普通文件的 nlink 规则判断目录。
  if (sameIdentity(rootStat, directoryStat)) fail('说明书留存目录关联无效。');
  const directoryReal = await fs.realpath(directory);
  if (path.relative(rootReal, directoryReal) !== id) fail('说明书留存目录越出允许范围。');
  const file = path.join(directory, filename);
  const fileStat = await fs.lstat(file);
  if (fileStat.isSymbolicLink() || !fileStat.isFile() || fileStat.nlink !== 1) {
    fail('说明书留存文件必须是没有符号链接或硬链接的普通文件。');
  }
  if (!Number.isSafeInteger(fileStat.size) || fileStat.size < 1 || fileStat.size > maximumBytes) {
    fail('说明书留存文件为空或超过允许大小，请先核对。');
  }
  const fileReal = await fs.realpath(file);
  if (path.relative(directoryReal, fileReal) !== filename
    || path.relative(rootReal, fileReal) !== path.join(id, filename)) {
    fail('说明书留存文件越出允许范围。');
  }
  return {rootStat, directoryStat, fileStat, file};
}

function sameTree(left, right) {
  return sameIdentity(left.rootStat, right.rootStat)
    && sameIdentity(left.directoryStat, right.directoryStat)
    && sameFile(left.fileStat, right.fileStat);
}

export async function readManualReviewFile(root, id, filename, options = {}) {
  let handle;
  try {
    if (!validId(id)) fail('说明书投稿编号格式无效。');
    const isImage = typeof filename === 'string' && imageFilenamePattern.test(filename);
    if (filename !== 'record.json' && !isImage) fail('不允许读取这类说明书留存文件。');
    if (typeof root !== 'string' || !root || root.includes(String.fromCharCode(0))) fail('说明书留存目录配置无效。');
    if (!plain(options)) fail('说明书留存文件读取参数无效。');
    const maximumBytes = options.maximumBytes === undefined
      ? (isImage ? 30 * 1024 * 1024 : 16 * 1024 * 1024) : options.maximumBytes;
    const expectedDigest = options.expectedDigest;
    const mimeType = options.mimeType;
    if (!Number.isSafeInteger(maximumBytes) || maximumBytes < 1) fail('说明书留存文件大小限制无效。');
    if (expectedDigest !== undefined && !validDigest(expectedDigest)) fail('说明书留存文件摘要参数无效。');
    if (mimeType !== undefined && (mimeType !== 'image/jpeg' || !isImage)) fail('说明书留存文件类型参数无效。');

    const base = path.resolve(root);
    const before = await inspectFile(base, id, filename, maximumBytes);
    let flags = constants.O_RDONLY;
    if (typeof constants.O_NOFOLLOW === 'number') flags |= constants.O_NOFOLLOW;
    if (typeof constants.O_NONBLOCK === 'number') flags |= constants.O_NONBLOCK;
    handle = await fs.open(before.file, flags);
    const opened = await handle.stat();
    if (!opened.isFile() || opened.nlink !== 1 || !sameFile(before.fileStat, opened)
      || !Number.isSafeInteger(opened.size) || opened.size < 1 || opened.size > maximumBytes) {
      fail('说明书留存文件在读取前已变化，请重新核对。');
    }
    const checked = await inspectFile(base, id, filename, maximumBytes);
    if (!sameTree(before, checked)) fail('说明书留存目录或文件在读取前已变化。');

    const bytes = Buffer.alloc(opened.size);
    let offset = 0;
    while (offset < bytes.length) {
      const result = await handle.read(bytes, offset, Math.min(64 * 1024, bytes.length - offset), offset);
      if (!Number.isInteger(result.bytesRead) || result.bytesRead < 1) fail('说明书留存文件读取长度不符。');
      offset += result.bytesRead;
    }
    const extra = await handle.read(Buffer.alloc(1), 0, 1, bytes.length);
    const after = await handle.stat();
    if (offset !== opened.size || extra.bytesRead !== 0 || !after.isFile() || after.nlink !== 1
      || !sameFile(opened, after) || bytes.length > maximumBytes) {
      fail('说明书留存文件在读取期间已变化，请重新核对。');
    }
    const finalState = await inspectFile(base, id, filename, maximumBytes);
    if (!sameTree(before, finalState) || !sameFile(after, finalState.fileStat)) {
      fail('说明书留存目录或文件在读取期间已变化。');
    }
    const actualDigest = sha256(bytes);
    if (expectedDigest !== undefined && actualDigest !== expectedDigest) fail('说明书留存文件摘要不符，请重新核对。');
    if (mimeType === 'image/jpeg' && detectPublicationImageMime(bytes) !== 'image/jpeg') {
      fail('说明书留存图片的真实签名不是 JPEG，不能继续读取。');
    }
    return bytes;
  } catch (error) {
    if (error && error[safeFailure]) throw error;
    if (error?.code === 'ENOENT') fail('找不到说明书留存目录或文件，请先核对记录。', 404, 'MANUAL_REVIEW_FILE_NOT_FOUND');
    fail('说明书留存文件无法安全读取，请先核对目录、权限及文件状态。');
  } finally {
    if (handle) {
      try {
        await handle.close();
      } catch {
        // 不以关闭错误覆盖已完成的安全核验或泄露底层文件系统信息。
      }
    }
  }
}
