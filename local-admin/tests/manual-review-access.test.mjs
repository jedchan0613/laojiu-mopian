import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {
  manualReviewRulesVersion,
  readManualReviewSettings,
  assertManualReviewImages,
  manualReviewBindingProblems,
  projectManualReviewRecord,
  manualReviewSummary,
  readManualReviewFile,
} from '../manual-review-access.mjs';
import {normalizeManualSubmission} from '../../shared/manual-submission.mjs';
import {manualReviewChecks} from '../../shared/manual-review.mjs';
import {manualSnapshotContent} from '../../shared/manual-pdf-review.mjs';
import {manualConsentVersion} from '../../shared/manual-workflow.mjs';

const ID = 'TG-0123456789ABCDEF01234567';
const AT = '2026-11-15T10:20:30.000Z';
const PRIVACY_COUNT = 3;
const hash = value => createHash('sha256').update(value).digest('hex');
// 仅用于签名筛选的合成字节，不把签名通过当作完整图片解码成功。
const JPEG = Buffer.from('ffd8ffe000104a46494600010100000100010000ffd9', 'hex');
const FILENAME = 'manual-' + hash(JPEG) + '.jpg';

function seal(version) {
  version.digest = hash(JSON.stringify(manualSnapshotContent(version)));
  return version;
}

function makeRecord() {
  const metadata = normalizeManualSubmission({
    schema_version: 1,
    brand_name: '隔离合成品牌',
    model_texts: ['ACCESS-TEST'],
    product_name: '合成物件',
    category_key: 'tools',
    document_kind: 'user-guide',
    languages: ['zh-CN'],
    completeness: 'complete',
    region_display: '地区未注明',
    edition_display: '合成第一版',
    source_note: '本机自制合成样页',
    rights_basis: 'own-work',
    sharing_scope: 'reading-copy',
    people: 'none',
    attribution: 'anonymous',
  });
  const image = {
    page_id: 'MP-' + 'a'.repeat(24),
    filename: FILENAME,
    label: '1',
    note: '合成第一页',
    bytes: JPEG.length,
    sha256: hash(JPEG),
  };
  const version = seal({
    revision: 2,
    at: AT,
    action: 'submit',
    source_format: 'images',
    fields: {title: '隔离合成说明书'},
    manual_metadata: structuredClone(metadata),
    images: [structuredClone(image)],
    consent: {version: manualConsentVersion, copies: true, rights: true, privacy: true, processing: true},
  });
  return {
    id: ID,
    revision: 3,
    submission_kind: 'manual',
    source_format: 'images',
    status: 'approved',
    created_at: AT,
    updated_at: AT,
    fields: {title: '隔离合成说明书'},
    manual_metadata: metadata,
    images: [image],
    manual_submitted_revision: version.revision,
    public_message: '已核对，尚未公开。',
    private_note: '必要的管理员内部备注',
    withdrawal_requested: false,
    linked_item_id: null,
    manual_catalog_key: null,
    manual_handoff: null,
    manual_review_binding: {
      submitted_revision: version.revision,
      digest: version.digest,
      sharing_scope: metadata.sharing_scope,
      at: AT,
      model_basis: '封面完整型号与适用范围已核对',
      source_basis: '本机自制合成页的来源已核对',
      rights_basis: '合成图展示依据已逐项核对',
      checks: manualReviewChecks.map(() => true),
      privacy_checks: Array.from({length: PRIVACY_COUNT}, () => true),
    },
    manual_review_audit: {
      rules_version: manualReviewRulesVersion,
      actor: 'reviewer@example.invalid',
      operation_id: '11111111-1111-4111-8111-111111111111',
      step_id: '22222222-2222-4222-8222-222222222222',
      submitted_revision: version.revision,
      digest: version.digest,
      status: 'approved',
      at: AT,
    },
    versions: [version],
    history: [{at: AT, action: 'review', status: 'approved', private_note: '必要历史备注', public_message: '已核对', submitted_revision: 2, actor: 'reviewer@example.invalid'}],
  };
}

function pdfVersion(revision = 1) {
  const version = structuredClone(makeRecord().versions[0]);
  version.revision = revision;
  version.source_format = 'pdf';
  version.pdf = {
    source: {source_id: 'PRIVATE-SOURCE-ID', filename: 'PRIVATE-SOURCE-FILE.pdf'},
    job_id: 'PRIVATE-JOB-ID',
    engine_fingerprint: 'PRIVATE-ENGINE',
    inspection: {report: 'PRIVATE-PDF-REPORT'},
  };
  return seal(version);
}

function freezeDeep(value) {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    for (const child of Object.values(value)) freezeDeep(child);
    Object.freeze(value);
  }
  return value;
}

function safeError(statusCode, forbidden = '') {
  return error => {
    assert.equal(error.name, 'SubmissionError');
    assert.equal(error.statusCode, statusCode);
    assert.match(error.message, /[一-龥]/);
    assert.doesNotMatch(error.message, /ENOENT|EACCES|ENOTDIR|ELOOP/);
    if (forbidden) assert.equal(error.message.includes(forbidden), false);
    return true;
  };
}

function pdfError(error) {
  safeError(404, 'PRIVATE-SOURCE')(error);
  assert.equal(error.code, 'MANUAL_REVIEW_PDF_DISABLED');
  return true;
}

async function temporary(t) {
  const base = await fs.realpath(os.tmpdir());
  const directory = await fs.mkdtemp(path.join(base, 'ljm-manual-review-access-'));
  const original = await fs.lstat(directory);
  t.after(async () => {
    const relative = path.relative(base, directory);
    assert.notEqual(relative, '');
    assert.equal(path.isAbsolute(relative), false);
    assert.equal(relative.startsWith('..'), false);
    assert.equal(path.dirname(directory), base);
    assert.match(path.basename(directory), /^ljm-manual-review-access-[A-Za-z0-9]+$/);
    const current = await fs.lstat(directory);
    assert.equal(current.isSymbolicLink(), false);
    assert.equal(current.isDirectory(), true);
    assert.equal(current.dev, original.dev);
    assert.equal(current.ino, original.ino);
    assert.equal(await fs.realpath(directory), directory);
    await fs.rm(directory, {recursive: true, force: false});
    await assert.rejects(fs.lstat(directory), {code: 'ENOENT'});
  });
  return directory;
}

async function fileFixture(t) {
  const directory = await temporary(t);
  const root = path.join(directory, 'submissions');
  const recordDirectory = path.join(root, ID);
  await fs.mkdir(recordDirectory, {recursive: true});
  const record = makeRecord();
  const recordBytes = Buffer.from(JSON.stringify(record), 'utf8');
  const recordFile = path.join(recordDirectory, 'record.json');
  const imageFile = path.join(recordDirectory, FILENAME);
  await fs.writeFile(recordFile, recordBytes);
  await fs.writeFile(imageFile, JPEG);
  return {directory, root, recordDirectory, record, recordBytes, recordFile, imageFile};
}

async function linkOrSkip(t, operation) {
  try {
    await operation();
    return true;
  } catch (error) {
    if (['EPERM', 'EACCES', 'ENOTSUP', 'EOPNOTSUPP', 'ENOSYS'].includes(error.code)) {
      t.skip('当前系统权限或文件系统不允许创建测试链接；未放宽生产读取检查。');
      return false;
    }
    throw error;
  }
}

function directoryLink(target, link) {
  return fs.symlink(target, link, process.platform === 'win32' ? 'junction' : 'dir');
}

test('规则版本与本机、线上能力开关相互独立', () => {
  assert.equal(manualReviewRulesVersion, '2026-11-15-manual-review-v1');
  const local = readManualReviewSettings({}, false, 'darwin');
  assert.equal(local.onlineEnabled, false);
  assert.equal(local.requestedTransfer, false);
  assert.equal(local.reviewWritable, true);
  assert.equal(local.transferWritable, true);
  assert.deepEqual(local.capabilities, {manualReviewVersion: 1, manualTransferVersion: 1, manualPdfHandoffVersion: 1});
  const disabled = readManualReviewSettings({}, true, 'linux');
  assert.equal(disabled.reviewWritable, false);
  assert.equal(disabled.transferWritable, false);
  assert.ok(disabled.reviewWriteReason.length > 0);
  assert.deepEqual(disabled.capabilities, {manualReviewVersion: 0, manualTransferVersion: 0, manualPdfHandoffVersion: 0});
  const env = {LJM_MANUAL_REVIEW_ONLINE_ENABLED: 'true', LJM_MANUAL_TRANSFER_ONLINE_ENABLED: 'true'};
  const enabled = readManualReviewSettings(env, true, 'linux');
  assert.equal(enabled.onlineEnabled, true);
  assert.equal(enabled.requestedTransfer, true);
  assert.equal(enabled.reviewWritable, true);
  assert.deepEqual(enabled.capabilities, {manualReviewVersion: 1, manualTransferVersion: 0, manualPdfHandoffVersion: 0});
  assert.equal(enabled.transferWritable, false, '未开放目录维护时不能转入');
  const allEnabled = {...env, LJM_MANUALS_ONLINE_ENABLED: 'true'};
  const transfer = readManualReviewSettings(allEnabled, true, 'linux');
  assert.equal(transfer.transferWritable, true);
  assert.equal(transfer.transferWriteReason, '');
  assert.deepEqual(transfer.capabilities, {manualReviewVersion: 1, manualTransferVersion: 1, manualPdfHandoffVersion: 0});
  assert.equal(readManualReviewSettings({...allEnabled, LJM_MANUALS_ONLINE_ENABLED: ' true '}, true, 'linux').transferWritable, true, '目录开关沿用现有空白兼容');
  for (const name of Object.keys(allEnabled)) {
    const partial = readManualReviewSettings({...allEnabled, [name]: 'false'}, true, 'linux');
    assert.equal(partial.transferWritable, false, name);
    assert.equal(partial.capabilities.manualTransferVersion, 0, name);
    assert.equal(partial.capabilities.manualPdfHandoffVersion, 0, name);
    assert.ok(partial.transferWriteReason.length > 0, name);
  }
  for (const platform of ['darwin', 'win32', 'freebsd']) {
    const settings = readManualReviewSettings(allEnabled, true, platform);
    assert.equal(settings.reviewWritable, false);
    assert.ok(settings.reviewWriteReason.length > 0);
    assert.equal(settings.capabilities.manualReviewVersion, 1);
    assert.equal(settings.capabilities.manualTransferVersion, 0);
    assert.equal(settings.transferWritable, false);
    assert.equal(settings.capabilities.manualPdfHandoffVersion, 0);
    assert.equal(readManualReviewSettings(env, false, platform).reviewWritable, true);
  }
  assert.equal(readManualReviewSettings({LJM_MANUAL_REVIEW_ONLINE_ENABLED: 'false', LJM_MANUAL_TRANSFER_ONLINE_ENABLED: 'false'}, true, 'linux').reviewWritable, false);
  assert.deepEqual(env, {LJM_MANUAL_REVIEW_ONLINE_ENABLED: 'true', LJM_MANUAL_TRANSFER_ONLINE_ENABLED: 'true'});
});

test('两个开关都只接受小写字符串 true 或 false，不回显错误配置', () => {
  const invalid = ['', 'TRUE', 'False', '1', ' true ', 'false\n', true, false, 0, 1, null, {}, '/srv/PRIVATE-CONFIG'];
  for (const name of ['LJM_MANUAL_REVIEW_ONLINE_ENABLED', 'LJM_MANUAL_TRANSFER_ONLINE_ENABLED']) {
    for (const value of invalid) {
      const env = {};
      env[name] = value;
      assert.throws(() => readManualReviewSettings(env, false, 'linux'), safeError(409, '/srv/PRIVATE-CONFIG'));
    }
  }
});

test('当前明确图片可保留历史 PDF，但请求历史 PDF 必须拒绝', () => {
  const record = makeRecord();
  const previous = pdfVersion();
  record.versions.unshift(previous);
  record.manual_pdf_sources = [{filename: 'PRIVATE-SOURCE-FILE.pdf'}];
  assert.doesNotThrow(() => assertManualReviewImages(record));
  assert.doesNotThrow(() => assertManualReviewImages(record, record.versions[1]));
  assert.throws(() => assertManualReviewImages(record, previous), pdfError);
  delete record.source_format;
  assert.doesNotThrow(() => assertManualReviewImages(record));
  record.versions.push(pdfVersion(4));
  assert.throws(() => assertManualReviewImages(record), pdfError);
});

test('缺失格式不能掩盖当前提交中的 PDF，活动引用与未知格式均拒绝', () => {
  const legacy = makeRecord();
  delete legacy.source_format;
  legacy.versions[0] = pdfVersion(2);
  assert.throws(() => assertManualReviewImages(legacy), pdfError);
  for (const format of ['pdf', 'PDF', 'unknown', '', null, 1]) {
    const record = makeRecord();
    record.source_format = format;
    assert.throws(() => assertManualReviewImages(record), pdfError);
  }
  for (const key of ['pdf', 'manual_pdf_current_source_id', 'manual_pdf_preview', 'manual_pdf_current_job_id', 'manual_pdf_pending_job_id', 'manual_pdf_confirmation']) {
    const record = makeRecord();
    record[key] = {filename: 'PRIVATE-SOURCE-FILE.pdf'};
    assert.throws(() => assertManualReviewImages(record), pdfError);
    const selected = structuredClone(record.versions[0]);
    selected[key] = {filename: 'PRIVATE-SOURCE-FILE.pdf'};
    delete record[key];
    assert.throws(() => assertManualReviewImages(record, selected), pdfError);
  }
  const absent = makeRecord();
  absent.pdf = null;
  absent.manual_pdf_preview = null;
  assert.doesNotThrow(() => assertManualReviewImages(absent));
});

test('非说明书及非法编号统一返回不泄露信息的 404', () => {
  for (const id of ['../PRIVATE-SOURCE', 'TG-../../PRIVATE-SOURCE', 'TG-short', 'TG-0123456789abcdef', '', null]) {
    const record = makeRecord();
    record.id = id;
    assert.throws(() => assertManualReviewImages(record), pdfError);
  }
  const other = makeRecord();
  other.submission_kind = 'archive';
  assert.throws(() => assertManualReviewImages(other), pdfError);
  assert.throws(() => assertManualReviewImages(null), pdfError);
});

test('正确摘要、检查与审核审计可以通过，核验和投影不修改冻结输入', () => {
  const record = freezeDeep(makeRecord());
  const before = JSON.stringify(record);
  assert.deepEqual(manualReviewBindingProblems(record, PRIVACY_COUNT), []);
  assert.deepEqual(manualReviewBindingProblems(record, PRIVACY_COUNT, {requireAudit: true}), []);
  assert.equal(projectManualReviewRecord(record, PRIVACY_COUNT).review_validity.valid, true);
  assert.equal(JSON.stringify(record), before);
  const local = makeRecord();
  delete local.manual_review_audit;
  assert.deepEqual(manualReviewBindingProblems(local, PRIVACY_COUNT), []);
  assert.ok(manualReviewBindingProblems(local, PRIVACY_COUNT, {requireAudit: true}).length > 0);
});

test('审核绑定必须对应当前提交、范围、四项检查和动态隐私检查数量', () => {
  const mutations = [
    record => { record.status = 'pending'; },
    record => { record.withdrawal_requested = true; },
    record => { delete record.manual_review_binding; },
    record => { record.manual_submitted_revision = 9; },
    record => { record.versions.push(structuredClone(record.versions[0])); },
    record => { record.manual_review_binding.submitted_revision = 1; },
    record => { record.manual_review_binding.digest = '0'.repeat(64); },
    record => { record.manual_review_binding.sharing_scope = 'official-link'; },
    record => { record.manual_review_binding.checks[0] = false; },
    record => { record.manual_review_binding.checks.pop(); },
    record => { delete record.manual_review_binding.checks[1]; },
    record => { record.manual_review_binding.privacy_checks[0] = 1; },
    record => { record.manual_review_binding.privacy_checks.push(true); },
    record => { delete record.manual_review_binding.privacy_checks[1]; },
  ];
  for (const change of mutations) {
    const record = makeRecord();
    change(record);
    assert.ok(manualReviewBindingProblems(record, PRIVACY_COUNT).length > 0);
  }
  for (const key of ['model_basis', 'source_basis', 'rights_basis']) {
    for (const value of ['', '  ', '字', null, {}]) {
      const record = makeRecord();
      record.manual_review_binding[key] = value;
      assert.ok(manualReviewBindingProblems(record, PRIVACY_COUNT).length > 0);
    }
  }
  assert.ok(manualReviewBindingProblems(makeRecord(), PRIVACY_COUNT + 1).length > 0);
  assert.ok(manualReviewBindingProblems(makeRecord(), -1).length > 0);
});

test('实际重算快照摘要并检测当前资料偏离，不仅比较存储的摘要字符串', () => {
  for (const change of [
    version => { version.manual_metadata.brand_name = '被更改品牌'; },
    version => { version.images[0].label = '被更改页码'; },
    version => { version.images[0].sha256 = 'a'.repeat(64); },
    version => { version.consent.privacy = false; },
  ]) {
    const record = makeRecord();
    change(record.versions[0]);
    assert.equal(record.versions[0].digest, record.manual_review_binding.digest);
    assert.ok(manualReviewBindingProblems(record, PRIVACY_COUNT).length > 0);
  }
  for (const change of [
    record => { record.manual_metadata.model_texts[0] = 'CHANGED'; },
    record => { record.images[0].note = '更改当前说明'; },
    record => { record.images[0].sha256 = 'b'.repeat(64); },
  ]) {
    const record = makeRecord();
    change(record);
    assert.ok(manualReviewBindingProblems(record, PRIVACY_COUNT).length > 0);
  }
  const forged = makeRecord();
  forged.versions[0].images[0].label = '2';
  seal(forged.versions[0]);
  assert.ok(manualReviewBindingProblems(forged, PRIVACY_COUNT).length > 0);
});

test('严格审计核验规则、身份、操作标识及同一提交和绑定时间', () => {
  const values = {
    rules_version: 'old-rules',
    actor: '本机维护者',
    operation_id: 'invalid-operation',
    step_id: 'invalid-step',
    submitted_revision: 1,
    digest: 'f'.repeat(64),
    status: 'declined',
    at: '2026-11-15T11:20:30.000Z',
  };
  for (const [key, value] of Object.entries(values)) {
    const record = makeRecord();
    record.manual_review_audit[key] = value;
    assert.deepEqual(manualReviewBindingProblems(record, PRIVACY_COUNT), []);
    assert.ok(manualReviewBindingProblems(record, PRIVACY_COUNT, {requireAudit: true}).length > 0);
    assert.equal(projectManualReviewRecord(record, PRIVACY_COUNT).review_validity.valid, false);
  }
});

test('旧不足记录只能得到无效提示，不自动补审核绑定或审计', () => {
  const record = {
    id: ID, submission_kind: 'manual', source_format: 'images', revision: 1,
    status: 'approved', fields: {title: '旧说明书'}, images: [], versions: [], history: [],
  };
  const before = structuredClone(record);
  assert.ok(manualReviewBindingProblems(record, PRIVACY_COUNT).length > 0);
  const projected = projectManualReviewRecord(record, PRIVACY_COUNT);
  assert.equal(projected.review_validity.valid, false);
  assert.ok(projected.review_validity.problems.some(value => value.includes('只读')));
  assert.equal(projected.manual_review_binding, null);
  assert.equal(projected.manual_review_audit, null);
  assert.deepEqual(record, before);
});

test('管理员投影逐层白名单，保留必要依据但剔除联系人、凭据、PDF资料和扩展字段', () => {
  const record = makeRecord();
  record.account_id = 'PRIVATE-ACCOUNT';
  record.key_hash = 'PRIVATE-KEY-HASH';
  record.fingerprint = 'PRIVATE-FINGERPRINT';
  record.contact = {email: 'PRIVATE-CONTACT'};
  record.extension = {secret: 'PRIVATE-TOP-EXTENSION'};
  record.fields.contact = 'PRIVATE-FIELDS-CONTACT';
  record.manual_metadata.contact = 'PRIVATE-METADATA-CONTACT';
  record.images[0].source_path = 'PRIVATE-IMAGE-SOURCE';
  record.images[0].extension = {secret: 'PRIVATE-IMAGE-EXTENSION'};
  record.manual_pdf_sources = [{filename: 'PRIVATE-ARCHIVED-PDF'}];
  record.manual_handoff = {status: 'complete', fingerprint: 'PRIVATE-HANDOFF', page_map: [{secret: 'PRIVATE-PAGE-MAP'}]};
  record.linked_item_id = 'LJM-20261115-RPR-001';
  record.manual_catalog_key = 'manual-' + 'a'.repeat(24);
  record.manual_review_binding.extra = 'PRIVATE-BINDING-EXTENSION';
  record.manual_review_audit.extra = 'PRIVATE-AUDIT-EXTENSION';
  record.history[0].operation_id = 'PRIVATE-HISTORY-OPERATION';
  record.history[0].contact = 'PRIVATE-HISTORY-CONTACT';
  const version = record.versions[0];
  version.fields.contact = 'PRIVATE-VERSION-CONTACT';
  version.manual_metadata.contact = 'PRIVATE-VERSION-METADATA';
  version.images[0].source_path = 'PRIVATE-VERSION-IMAGE';
  version.consent.token = 'PRIVATE-CONSENT-TOKEN';
  version.extension = 'PRIVATE-VERSION-EXTENSION';
  record.versions.unshift(pdfVersion());
  const before = structuredClone(record);
  const output = projectManualReviewRecord(record, PRIVACY_COUNT);
  const serialized = JSON.stringify(output);
  assert.equal(serialized.includes('PRIVATE-'), false);
  assert.equal(output.private_note, record.private_note);
  assert.equal(output.manual_review_binding.rights_basis, record.manual_review_binding.rights_basis);
  assert.equal(output.manual_review_audit.actor, 'reviewer@example.invalid');
  assert.deepEqual(Object.keys(output).sort(), [
    'id', 'revision', 'submission_kind', 'source_format', 'status', 'created_at', 'updated_at',
    'fields', 'manual_metadata', 'images', 'manual_submitted_revision', 'public_message',
    'private_note', 'withdrawal_requested', 'linked_item_id', 'manual_catalog_key',
    'manual_handoff', 'manual_review_binding', 'manual_review_audit', 'review_validity', 'versions', 'history',
  ].sort());
  assert.deepEqual(Object.keys(output.fields), ['title']);
  assert.deepEqual(Object.keys(output.images[0]).sort(), ['page_id', 'filename', 'label', 'note', 'bytes', 'sha256'].sort());
  assert.deepEqual(output.manual_handoff, {status: 'complete'});
  assert.deepEqual(output.versions[0], {revision: 1, at: AT, source_format: 'pdf', restricted: true});
  assert.deepEqual(Object.keys(output.versions[1]).sort(), ['fields', 'manual_metadata', 'images', 'consent', 'digest', 'at', 'revision', 'action'].sort());
  assert.deepEqual(output.versions[1].consent, {copies: true, rights: true, privacy: true, processing: true});
  assert.deepEqual(Object.keys(output.history[0]).sort(), ['at', 'action', 'status', 'private_note', 'public_message', 'submitted_revision', 'actor'].sort());
  assert.deepEqual(Object.keys(output.manual_metadata).sort(), Object.keys(normalizeManualSubmission(before.manual_metadata.schema_version === 1 ? Object.assign({}, makeRecord().manual_metadata) : {})).sort());
  assert.deepEqual(record, before);
  output.images[0].label = '改投影';
  output.manual_metadata.model_texts.push('PROJECTION-ONLY');
  output.manual_review_binding.checks[0] = false;
  assert.deepEqual(record, before);
});

test('当前 PDF 不可投影，历史异常 PDF 引用也只显示受限版本标记', () => {
  const record = makeRecord();
  const historical = structuredClone(record.versions[0]);
  historical.revision = 1;
  historical.pdf = {source: 'PRIVATE-SOURCE'};
  record.versions.unshift(historical);
  assert.deepEqual(projectManualReviewRecord(record, PRIVACY_COUNT).versions[0], {revision: 1, at: AT, source_format: 'pdf', restricted: true});
  record.source_format = 'pdf';
  assert.throws(() => projectManualReviewRecord(record, PRIVACY_COUNT), pdfError);
});

test('收件箱仅返回摘要，PDF也不包含页面、联系人或原始私密对象', () => {
  const record = makeRecord();
  record.account_id = 'PRIVATE-ACCOUNT';
  record.fields.contact = 'PRIVATE-CONTACT';
  record.manual_handoff = {status: 'needs_review', fingerprint: 'PRIVATE-HANDOFF'};
  const summary = manualReviewSummary(record);
  assert.deepEqual(Object.keys(summary).sort(), [
    'id', 'revision', 'submission_kind', 'fields', 'status', 'image_count', 'source_format',
    'withdrawal_requested', 'linked_item_id', 'manual_catalog_key', 'manual_handoff_status',
  ].sort());
  assert.equal(summary.image_count, 1);
  assert.equal(summary.source_format, 'images');
  assert.equal(summary.manual_handoff_status, 'needs_review');
  assert.equal(Object.hasOwn(summary, 'images'), false);
  assert.equal(JSON.stringify(summary).includes('PRIVATE-'), false);
  record.source_format = 'pdf';
  record.pdf = {source: 'PRIVATE-SOURCE'};
  assert.equal(manualReviewSummary(record).source_format, 'pdf');
  assert.equal(JSON.stringify(manualReviewSummary(record)).includes('PRIVATE-'), false);
  delete record.source_format;
  delete record.pdf;
  record.versions[0] = pdfVersion(2);
  assert.equal(manualReviewSummary(record).source_format, 'pdf');
});

test('安全读取合成记录和图片，返回 Buffer 并按真实字节校验摘要及 JPEG 签名', async t => {
  const fixture = await fileFixture(t);
  const bytes = await readManualReviewFile(fixture.root, ID, 'record.json', {expectedDigest: hash(fixture.recordBytes)});
  assert.equal(Buffer.isBuffer(bytes), true);
  assert.deepEqual(bytes, fixture.recordBytes);
  const parsed = JSON.parse(bytes.toString('utf8'));
  assert.equal(hash(JSON.stringify(manualSnapshotContent(parsed.versions[0]))), parsed.versions[0].digest);
  const image = await readManualReviewFile(fixture.root, ID, FILENAME, {expectedDigest: hash(JPEG), mimeType: 'image/jpeg', maximumBytes: JPEG.length});
  assert.equal(Buffer.isBuffer(image), true);
  assert.deepEqual(image, JPEG);
});

test('拒绝不允许的编号与文件名，缺失返回404且不创建目录', async t => {
  const fixture = await fileFixture(t);
  for (const filename of ['../record.json', '/record.json', 'source.pdf', 'manual-' + 'A'.repeat(64) + '.jpg', FILENAME + '/x', 'manual-short.jpg', 'record.json\u0000']) {
    await assert.rejects(readManualReviewFile(fixture.root, ID, filename), safeError(409, fixture.root));
  }
  await assert.rejects(readManualReviewFile(fixture.root, '../PRIVATE-ID', 'record.json'), safeError(409, 'PRIVATE-ID'));
  await assert.rejects(readManualReviewFile(fixture.root, ID, 'manual-' + 'b'.repeat(64) + '.jpg'), safeError(404, fixture.root));
  const missing = path.join(fixture.directory, 'not-created');
  await assert.rejects(readManualReviewFile(missing, ID, 'record.json'), safeError(404, missing));
  await assert.rejects(fs.lstat(missing), {code: 'ENOENT'});
});

test('大小、摘要和可选真实JPEG签名分别生效，错误不包含文件内容或路径', async t => {
  const fixture = await fileFixture(t);
  await assert.rejects(readManualReviewFile(fixture.root, ID, FILENAME, {maximumBytes: JPEG.length - 1}), safeError(409, fixture.root));
  await assert.rejects(readManualReviewFile(fixture.root, ID, FILENAME, {expectedDigest: '0'.repeat(64)}), safeError(409, fixture.root));
  for (const maximumBytes of [0, -1, 1.5, NaN, Infinity, '30']) {
    await assert.rejects(readManualReviewFile(fixture.root, ID, FILENAME, {maximumBytes}), safeError(409, fixture.root));
  }
  await assert.rejects(readManualReviewFile(fixture.root, ID, FILENAME, {expectedDigest: 'PRIVATE-DIGEST'}), safeError(409, 'PRIVATE-DIGEST'));
  await assert.rejects(readManualReviewFile(fixture.root, ID, FILENAME, {mimeType: 'image/png'}), safeError(409, fixture.root));
  for (const bytes of [Buffer.from('%PDF-1.7 PRIVATE-FILE-CONTENT'), Buffer.from('89504e470d0a1a0a00000000', 'hex')]) {
    await fs.writeFile(fixture.imageFile, bytes);
    assert.deepEqual(await readManualReviewFile(fixture.root, ID, FILENAME, {expectedDigest: hash(bytes)}), bytes);
    await assert.rejects(readManualReviewFile(fixture.root, ID, FILENAME, {expectedDigest: hash(bytes), mimeType: 'image/jpeg'}), safeError(409, 'PRIVATE-FILE-CONTENT'));
  }
  await fs.writeFile(fixture.imageFile, Buffer.alloc(0));
  await assert.rejects(readManualReviewFile(fixture.root, ID, FILENAME), safeError(409, fixture.root));
});

test('JPEG默认允许16至30MiB，记录默认16MiB，超过默认上限不读取', async t => {
  const fixture = await fileFixture(t);
  const size = 16 * 1024 * 1024 + 17;
  const handle = await fs.open(fixture.imageFile, 'w');
  try {
    await handle.truncate(size);
    await handle.write(JPEG, 0, JPEG.length, 0);
    await handle.write(Buffer.from([0xff, 0xd9]), 0, 2, size - 2);
  } finally {
    await handle.close();
  }
  const image = await readManualReviewFile(fixture.root, ID, FILENAME, {mimeType: 'image/jpeg'});
  assert.equal(image.length, size);
  await fs.truncate(fixture.imageFile, 30 * 1024 * 1024 + 1);
  await assert.rejects(readManualReviewFile(fixture.root, ID, FILENAME), safeError(409, fixture.root));
  await fs.truncate(fixture.recordFile, 16 * 1024 * 1024 + 1);
  await assert.rejects(readManualReviewFile(fixture.root, ID, 'record.json'), safeError(409, fixture.root));
});

test('根目录、投稿目录及目标必须具有正确文件类型', async t => {
  const fixture = await fileFixture(t);
  const wrongRoot = path.join(fixture.directory, 'root-file');
  await fs.writeFile(wrongRoot, 'PRIVATE-ROOT-CONTENT');
  await assert.rejects(readManualReviewFile(wrongRoot, ID, 'record.json'), safeError(409, wrongRoot));
  await fs.unlink(fixture.imageFile);
  await fs.mkdir(fixture.imageFile);
  await assert.rejects(readManualReviewFile(fixture.root, ID, FILENAME), safeError(409, fixture.root));
  const otherRoot = path.join(fixture.directory, 'other-root');
  await fs.mkdir(otherRoot);
  await fs.writeFile(path.join(otherRoot, ID), 'PRIVATE-DIRECTORY-CONTENT');
  await assert.rejects(readManualReviewFile(otherRoot, ID, 'record.json'), safeError(409, otherRoot));
});

test('拒绝根目录符号链接', async t => {
  const fixture = await fileFixture(t);
  const link = path.join(fixture.directory, 'root-link');
  if (!await linkOrSkip(t, () => directoryLink(fixture.root, link))) return;
  await assert.rejects(readManualReviewFile(link, ID, 'record.json'), safeError(409, fixture.directory));
});

test('拒绝根目录祖先符号链接，不能借相同realpath绕过', async t => {
  const fixture = await fileFixture(t);
  const link = path.join(fixture.directory, 'ancestor-link');
  if (!await linkOrSkip(t, () => directoryLink(fixture.directory, link))) return;
  await assert.rejects(readManualReviewFile(path.join(link, 'submissions'), ID, 'record.json'), safeError(409, fixture.directory));
});

test('拒绝投稿目录符号链接', async t => {
  const fixture = await fileFixture(t);
  const target = path.join(fixture.directory, 'moved-record');
  await fs.rename(fixture.recordDirectory, target);
  if (!await linkOrSkip(t, () => directoryLink(target, fixture.recordDirectory))) return;
  await assert.rejects(readManualReviewFile(fixture.root, ID, 'record.json'), safeError(409, fixture.directory));
});

test('拒绝目标文件符号链接，不能读取根目录外的合成秘密', async t => {
  const fixture = await fileFixture(t);
  const target = path.join(fixture.directory, 'private-target');
  const secret = Buffer.from('PRIVATE-LINK-TARGET');
  await fs.writeFile(target, secret);
  await fs.unlink(fixture.imageFile);
  if (!await linkOrSkip(t, () => fs.symlink(target, fixture.imageFile, 'file'))) return;
  await assert.rejects(readManualReviewFile(fixture.root, ID, FILENAME), safeError(409, 'PRIVATE-LINK-TARGET'));
  assert.deepEqual(await fs.readFile(target), secret);
});

test('记录及图片硬链接均不可读取，不能因realpath仍在根目录内而放行', async t => {
  const fixture = await fileFixture(t);
  if (!await linkOrSkip(t, () => fs.link(fixture.recordFile, path.join(fixture.directory, 'record-hardlink')))) return;
  if (!await linkOrSkip(t, () => fs.link(fixture.imageFile, path.join(fixture.directory, 'image-hardlink')))) return;
  await assert.rejects(readManualReviewFile(fixture.root, ID, 'record.json'), safeError(409, fixture.directory));
  await assert.rejects(readManualReviewFile(fixture.root, ID, FILENAME), safeError(409, fixture.directory));
});

test('读取期间增长的文件不能以旧stat大小通过', {concurrency: false}, async t => {
  const fixture = await fileFixture(t);
  const originalOpen = fs.open.bind(fs);
  let changed = false;
  t.mock.method(fs, 'open', async (file, flags) => {
    const handle = await originalOpen(file, flags);
    if (file === fixture.imageFile) {
      const originalRead = handle.read.bind(handle);
      handle.read = async (buffer, offset, length, position) => {
        const result = await originalRead(buffer, offset, length, position);
        if (!changed) {
          changed = true;
          await fs.appendFile(fixture.imageFile, Buffer.from([0]));
        }
        return result;
      };
    }
    return handle;
  });
  await assert.rejects(readManualReviewFile(fixture.root, ID, FILENAME, {expectedDigest: hash(JPEG), mimeType: 'image/jpeg'}), safeError(409, fixture.directory));
  assert.equal(changed, true);
  assert.equal((await fs.stat(fixture.imageFile)).size, JPEG.length + 1);
});

test('权限错误只返回中文409；特权身份可读时明确跳过权限断言', async t => {
  if (process.platform !== 'linux') {
    t.skip('仅在 Linux 上验证合成文件的 POSIX 读取权限。');
    return;
  }
  const fixture = await fileFixture(t);
  await fs.chmod(fixture.imageFile, 0);
  try {
    let readable;
    try {
      const handle = await fs.open(fixture.imageFile, 'r');
      await handle.close();
      readable = true;
    } catch (error) {
      if (!['EACCES', 'EPERM'].includes(error.code)) throw error;
      readable = false;
    }
    if (readable) {
      t.skip('当前特权身份仍可读取零权限合成文件，不能据此验证普通用户权限错误。');
      return;
    }
    await assert.rejects(readManualReviewFile(fixture.root, ID, FILENAME), safeError(409, fixture.directory));
  } finally {
    await fs.chmod(fixture.imageFile, 0o600);
  }
});
