import fs from 'node:fs/promises';
import path from 'node:path';
import { Readable } from 'node:stream';
import { createHash, randomBytes, randomUUID, timingSafeEqual } from 'node:crypto';
import { createRequire } from 'node:module';

export const submissionLimits = Object.freeze({ images: 8, imageBytes: 5 * 1024 * 1024, totalBytes: 20 * 1024 * 1024, requestBytes: 22 * 1024 * 1024 });
export const consentVersion = '2026-09-05-v1';
export const submissionStates = { pending: '待审核', needs_info: '待补充', approved: '初审通过', declined: '暂不采用', withdrawn: '已停止处理' };
export const privacyChecks = [
 '无完整身份识别号码', '无完整银行卡号、账户号码或卡号', '无电话号码', '无精确私人住址',
 '无清晰签名', '无医疗信息', '无未成年人私人信息', '无极私密内容', '可识别人物已由本人完成人工判断并确认适合公开',
 '无未经确认的负面描述或指控', '已区分事实、推测与未知内容', '确认为经过筛选的图片副本', '已完成必要遮盖，无未确定的隐私风险',
];
export class SubmissionError extends Error {
 constructor(message, statusCode = 400) { super(message); this.name = 'SubmissionError'; this.statusCode = statusCode; }
}
const fail = (message, status = 400) => { throw new SubmissionError(message, status); };
const hash = (value) => createHash('sha256').update(value).digest('hex');
const idPattern = /^TG-[A-F0-9]{24}$/;
const keyPattern = /^[a-f0-9]{64}$/;
export const submissionId = (key) => `TG-${hash(key).slice(0, 24).toUpperCase()}`;
const text = (value, name, min, max) => {
 if (typeof value !== 'string' || value.trim().length < min || value.trim().length > max || /[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(value)) fail(`请检查${name}（${min}—${max} 字）。`);
 return value.trim();
};
const exists = (file) => fs.access(file).then(() => true, () => false);
const atomicJson = async (file, value) => {
 const temporary = `${file}.${randomUUID()}.tmp`;
 await fs.writeFile(temporary, JSON.stringify(value, null, 2), { mode: 0o600, flag: 'wx' });
 await fs.rename(temporary, file);
};

export function createSubmissionStore({ root, siteDirectory, maxEntries = 2000, maxStorageBytes = 10 * 1024 ** 3, notifier = null }) {
 root = path.resolve(root);
 const require = createRequire(path.join(siteDirectory, 'package.json'));
 let sharp;
 const safeId = (id) => { if (!idPattern.test(id ?? '')) fail('投稿编号无效。', 404); return id; };
 const recordPath = (id) => path.join(root, safeId(id), 'record.json');
 const read = async (id) => {
  try { return JSON.parse(await fs.readFile(recordPath(id), 'utf8')); }
  catch (error) { if (error.code === 'ENOENT') fail('找不到投稿。', 404); throw error; }
 };
 const locked = async (name, operation) => {
  await fs.mkdir(root, { recursive: true, mode: 0o700 });
  const lock = path.join(root, `.${name}.lock`);
  try { await fs.mkdir(lock, { mode: 0o700 }); }
  catch (error) { if (error.code === 'EEXIST') fail('当前正在处理，请稍后重试。', 409); throw error; }
  try { return await operation(); } finally { await fs.rmdir(lock); }
 };
 const all = async () => {
  await fs.mkdir(root, { recursive: true, mode: 0o700 });
  const entries = await fs.readdir(root, { withFileTypes: true });
  const records = [];
  for (const entry of entries) if (entry.isDirectory() && idPattern.test(entry.name)) records.push(await read(entry.name));
  return records.sort((a, b) => b.created_at.localeCompare(a.created_at));
 };
 // 图片入站：免注册投稿与账户投稿共用同一套真实解码、重编码与元数据清理。
 const stageImages = async (list, maximumCount = submissionLimits.images) => {
  if (!Array.isArray(list) || !list.length) fail('请至少选择一张经过筛选的图片副本。');
  if (list.length > maximumCount) fail(`每次最多选择 ${maximumCount} 张图片。`);
  const staged = [];
  let incoming = 0;
  for (const image of list) {
   const originalName = text(image?.name, '图片文件名', 1, 180);
   if (!/\.(jpe?g|png|webp)$/i.test(originalName) || /(master|original|raw|主档|原始)/i.test(originalName)) fail('只接收 JPG、PNG、WebP 筛选副本，不接收主档或原始文件。');
   const raw = image?.buffer ?? image?.file;
   const buffer = raw instanceof Uint8Array ? Buffer.from(raw) : (raw && typeof raw.arrayBuffer === 'function' ? Buffer.from(await raw.arrayBuffer()) : null);
   if (!buffer?.length) fail('图片格式无法读取。');
   incoming += buffer.length;
   if (buffer.length > submissionLimits.imageBytes || incoming > submissionLimits.totalBytes) fail('每张图片最多 5 MB，每次合计最多 20 MB。', 413);
   staged.push({ name: originalName, buffer });
  }
  return staged;
 };
 const processImages = async (staged, filenameFor = (index) => `copy-${String(index + 1).padStart(2, '0')}.jpg`) => {
  sharp ??= require('sharp');
  const images = [];
  for (const [index, image] of staged.entries()) {
   try {
    const input = sharp(image.buffer, { limitInputPixels: 40_000_000, failOn: 'warning', animated: false });
    const info = await input.metadata();
    const expectedFormat = /\.(png)$/i.test(image.name) ? 'png' : /\.(webp)$/i.test(image.name) ? 'webp' : 'jpeg';
    if (info.format !== expectedFormat || (info.pages ?? 1) > 1) fail('图片真实格式不符，或包含动画/多页内容。');
    const clean = await input.rotate().resize({ width: 2400, height: 2400, fit: 'inside', withoutEnlargement: true }).flatten({ background: '#ffffff' }).jpeg({ quality: 88 }).toBuffer();
    images.push({ filename: filenameFor(index), original_name: image.name, bytes: clean.length, buffer: clean });
   } catch (error) { if (error instanceof SubmissionError) throw error; fail(`第 ${index + 1} 张图片损坏、尺寸过大或无法解码，请重新导出副本。`); }
  }
  return images;
 };
 const create = async (payload) => {
  if (!payload || !keyPattern.test(payload.key ?? '')) fail('提交凭证无效，请刷新后重试。');
  if (payload.website) fail('提交未通过，请稍后重试。');
  const id = submissionId(payload.key);
  const fields = {
   title: text(payload.title, '资料标题', 2, 80), description: text(payload.description, '资料介绍', 10, 3000),
   category: text(payload.category, '资料类型', 1, 20), era: text(payload.era ?? '', '大致年代', 0, 80),
   name: text(payload.name, '称呼', 1, 40), contact_type: payload.contact_type,
   contact: text(payload.contact, '联系方式', 3, 120), attribution: payload.attribution,
   credit: text(payload.credit ?? '', '公开署名', 0, 40), people: payload.people,
  };
  if (!['照片', '明信片', '信件', '证件与卡片', '日记与笔记', '其他'].includes(fields.category)) fail('请选择资料类型。');
  if (!['email', 'wechat', 'phone'].includes(fields.contact_type)) fail('请选择联系方式。');
  if (fields.contact_type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.contact)) fail('邮箱格式不正确。');
  if (fields.contact_type === 'phone' && !/^\+?[\d ()-]{6,30}$/.test(fields.contact)) fail('电话号码格式不正确。');
  if (!['anonymous', 'named'].includes(fields.attribution) || (fields.attribution === 'named' && !fields.credit)) fail('请填写希望公开的署名，或选择匿名。');
  if (!['none', 'yes', 'unsure'].includes(fields.people)) fail('请说明是否涉及可以识别的真实人物。');
  if (payload.consent_version !== consentVersion || !['copies', 'rights', 'privacy', 'processing'].every((key) => payload.consents?.[key] === true)) fail('请阅读并逐项确认图片、授权和隐私说明。');
  if (!Array.isArray(payload.images) || payload.images.length < 1 || payload.images.length > submissionLimits.images) fail('每次请提交 1—8 张图片。');
  const staged = await stageImages(payload.images);
  const fingerprint = hash(JSON.stringify({ fields, images: staged.map((image) => [image.name, hash(image.buffer)]), consent_version: payload.consent_version }));
  return locked('intake', async () => locked(id, async () => {
   if (await exists(recordPath(id))) {
    const old = await read(id);
    if (old.fingerprint !== fingerprint) fail('这次提交已收到。请用回执查询；如需提交另一份资料，请重新打开投稿页。', 409);
    return { id, created_at: old.created_at, repeated: true };
   }
   const records = await all();
   if (records.length >= maxEntries || records.reduce((n, r) => n + r.images.reduce((s, i) => s + i.bytes, 0), 0) + submissionLimits.totalBytes > maxStorageBytes) fail('投稿收件区暂满，请稍后再试。', 503);
   sharp ??= require('sharp');
   const images = await processImages(staged);
   const now = new Date().toISOString();
   const record = { version: 1, revision: 1, id, created_at: now, updated_at: now, key_hash: hash(payload.key), fingerprint,
    fields, consent: { version: consentVersion, confirmed_at: now, copies: true, rights: true, privacy: true, processing: true },
    images: images.map(({ buffer, ...image }) => image), status: 'pending', private_note: '', public_message: '', linked_item_id: null,
    history: [{ at: now, action: 'received' }],
   };
   const staging = path.join(root, `.incoming-${randomUUID()}`);
   await fs.mkdir(staging, { mode: 0o700 });
   for (const image of images) await fs.writeFile(path.join(staging, image.filename), image.buffer, { mode: 0o600, flag: 'wx' });
   await atomicJson(path.join(staging, 'record.json'), record);
   await fs.rename(staging, path.join(root, id));
   return { id, created_at: now, repeated: false };
  }));
 };
 const authenticate = async (id, key) => {
  if (!idPattern.test(id ?? '') || !keyPattern.test(key ?? '')) fail('投稿编号或查询密钥不正确。', 404);
  let record;
  try { record = await read(id); } catch (error) { if (error.statusCode === 404) fail('投稿编号或查询密钥不正确。', 404); throw error; }
  if (!timingSafeEqual(Buffer.from(record.key_hash, 'hex'), Buffer.from(hash(key), 'hex'))) fail('投稿编号或查询密钥不正确。', 404);
  return record;
 };
 const publicSummary = (r) => ({ id: r.id, status: r.status, status_label: submissionStates[r.status], created_at: r.created_at, updated_at: r.updated_at, message: r.public_message, withdrawal_requested: Boolean(r.withdrawal_requested), in_preparation: Boolean(r.linked_item_id) });
 const lookup = async ({ id, key }) => publicSummary(await authenticate(id, key));
 const withdraw = async ({ id, key }) => {
  await authenticate(id, key);
  return locked(id, async () => {
   const r = await authenticate(id, key);
   if (!r.withdrawal_requested && r.status !== 'withdrawn') {
    if (r.linked_item_id) r.withdrawal_requested = true;
    else r.status = 'withdrawn';
    r.updated_at = new Date().toISOString(); r.revision++;
    r.history.push({ at: r.updated_at, action: 'withdrawal_requested' });
    await atomicJson(recordPath(id), r);
   }
   return publicSummary(r);
  });
 };
 // 进度通知：只在审核状态真正发生变化时触发，发送失败不影响审核结果，也不回退任何状态。
 const deliverNotification = async (notification) => {
  if (!notification || typeof notifier !== 'function') return;
  try { await notifier(notification); } catch { /* 邮件通道失败不影响审核与发布结果。 */ }
 };
 const review = async (id, payload) => {
  let notification = null;
  const result = await locked(safeId(id), async () => {
   const r = await read(id);
   if (payload.revision !== r.revision) fail('投稿已被其他操作更新，请刷新后再保存。', 409);
   if (r.status === 'draft') fail('投稿人尚未提交草稿，不能审核或通过初审。', 409);
   if (!Object.hasOwn(submissionStates, payload.status)) fail('审核状态无效。');
   if ((r.linked_item_id || r.status === 'withdrawn' || r.withdrawal_requested) && payload.status !== r.status) fail('此投稿已转入草稿或申请停止处理，不能直接更改审核状态。');
   const publicMessage = text(payload.public_message ?? '', '给投稿人的说明', 0, 1000);
   if (['needs_info', 'declined'].includes(payload.status) && !publicMessage) fail('请填写给投稿人的说明。');
   if (payload.status === 'approved' && r.status !== 'approved' && payload.rights_reviewed !== true) fail('请先人工核对投稿授权和来源。');
   const previous = r.status;
   r.status = payload.status; r.private_note = text(payload.private_note ?? '', '内部备注', 0, 4000); r.public_message = publicMessage;
   r.revision++; r.updated_at = new Date().toISOString();
   r.history.push({ at: r.updated_at, action: 'review', status: r.status, private_note: r.private_note, public_message: r.public_message });
   await atomicJson(recordPath(id), r);
   if (r.account_id && previous !== r.status && ['needs_info', 'approved', 'declined'].includes(r.status)) {
    notification = { accountId: r.account_id, event: r.status, submission_id: r.id, title: r.fields.title };
   }
   return detail(r);
  });
  await deliverNotification(notification);
  return result;
 };
 const detail = (r) => { const { key_hash, fingerprint, ...safe } = r; return safe; };
 const list = async () => (await all()).map((r) => ({ id: r.id, revision: r.revision, title: r.fields.title, category: r.fields.category, status: r.status, created_at: r.created_at, updated_at: r.updated_at, image_count: r.images.length, people: r.fields.people, linked_item_id: r.linked_item_id, withdrawal_requested: Boolean(r.withdrawal_requested), change_request: r.change_request ?? null, account_id: r.account_id ?? null }));
 const getImage = async (id, filename) => {
  const r = await read(id);
  if (!r.images.some((image) => image.filename === filename)) fail('图片不存在。', 404);
  return fs.readFile(path.join(root, safeId(id), filename));
 };
 const transfer = async (id, payload, createDraft) => locked(safeId(id), async () => {
  const r = await read(id);
  if (r.linked_item_id) return { item_id: r.linked_item_id, repeated: true };
  if (payload.revision !== r.revision) fail('投稿已发生变化，请刷新后再操作。', 409);
  if (r.status !== 'approved' || r.withdrawal_requested) fail('只有初审通过且没有撤回申请的投稿才能转入草稿。');
  if (!Array.isArray(payload.checks) || payload.checks.length !== privacyChecks.length || !payload.checks.every((v) => v === true)) fail('必须逐项完成人工隐私检查。');
  const selected = payload.images;
  if (!Array.isArray(selected) || !selected.length || new Set(selected).size !== selected.length || selected.some((name) => !r.images.some((i) => i.filename === name))) fail('请选择已经人工确认可用的图片。');
  const title = text(payload.title, '草稿题名', 2, 80);
  const description = text(payload.description, '已整理的公开介绍', 0, 3000);
  const transferred = await createDraft({ id, title, description, object_type: payload.object_type, accession_date: payload.accession_date, images: await Promise.all(selected.map(async (filename) => ({ kind: 'new', originalName: filename, data: `data:image/jpeg;base64,${(await getImage(id, filename)).toString('base64')}` }))) });
  r.linked_item_id = transferred; r.updated_at = new Date().toISOString(); r.revision++;
  r.history.push({ at: r.updated_at, action: 'draft_created', item_id: transferred, checks: [...payload.checks], images: selected });
  await atomicJson(recordPath(id), r);
  return { item_id: transferred, repeated: false };
 });
 const guardPublication = async (itemId, operation) => {
  const linked = (await all()).find(r => r.linked_item_id === itemId);
  if (!linked) return operation();
  return locked(linked.id, async () => {
   const current = await read(linked.id);
   if (current.withdrawal_requested || current.status !== 'approved') fail('投稿人已申请停止处理或审核状态不允许发布，请先核查。', 409);
   return operation();
  });
 };
 // ---------- 账户投稿 ----------
 // 与免注册投稿共用同一个私密收件区、同一套人工隐私检查与发布门禁；
 // 这里只增加"归属账号、草稿、只读版本、进度、撤回与申请"。
 const accountIdPattern = /^usr_[a-f0-9]{24}$/;
 const accountCategories = ['照片', '明信片', '信件', '证件与卡片', '日记与笔记', '其他'];
 const accountStatusLabels = { draft: '草稿', pending: '待审核', needs_info: '待补充', approved: '整理中', declined: '暂不采用', withdrawn: '已撤回' };
 const maximumVersions = 20;
 // 账号级配额（方案 K）：防止单个账号耗尽共享收件区，也不能靠反复删除重传绕过。
 // 草稿、投稿和私密回收区图片都计入占用；撤回不免除存储配额。
 const accountQuota = { perDay: 10, maxDrafts: 20, maxBytes: 200 * 1024 * 1024 };

 const safeAccountId = (value) => {
  if (!accountIdPattern.test(String(value ?? ''))) fail('账号信息无效。', 403);
  return value;
 };
 // 投稿只能由归属账号读取与操作；不匹配时统一按"找不到"处理，避免泄漏编号是否存在。
 const ownedBy = (record, accountId) => {
  if (!record || record.account_id !== accountId) fail('找不到这份投稿，或它不属于当前账号。', 404);
  return record;
 };
 // 草稿允许不完整，提交时必须通过完整校验。
 const accountFields = (raw, strict) => {
  const fields = {
   title: text(raw?.title ?? '', '资料标题', strict ? 2 : 0, 80),
   description: text(raw?.description ?? '', '资料介绍', strict ? 10 : 0, 3000),
   category: text(raw?.category ?? '', '资料类型', 0, 20),
   era: text(raw?.era ?? '', '大致年代', 0, 80),
   place: text(raw?.place ?? '', '大致地点', 0, 80),
   source_note: text(raw?.source_note ?? '', '来源与展示授权依据', strict ? 2 : 0, 500),
   people: raw?.people ?? '',
   attribution: raw?.attribution ?? 'anonymous',
   credit: text(raw?.credit ?? '', '公开署名', 0, 40),
  };
  if (fields.people && !['none', 'yes', 'unsure'].includes(fields.people)) fail('请说明是否涉及可以识别的真实人物。');
  if (!['anonymous', 'named'].includes(fields.attribution)) fail('请选择署名方式。');
  if (fields.category && !accountCategories.includes(fields.category)) fail('请选择资料类型。');
  if (strict) {
   if (!accountCategories.includes(fields.category)) fail('请选择资料类型。');
   if (!fields.people) fail('请说明是否涉及可以识别的真实人物。');
   if (fields.attribution === 'named' && !fields.credit) fail('请填写希望公开的署名，或选择匿名。');
  }
  return fields;
 };
 const requireAccountConsents = (payload) => {
  if (payload?.consent_version !== consentVersion || !['copies', 'rights', 'privacy', 'processing'].every((key) => payload?.consents?.[key] === true)) {
   fail('请阅读并逐项确认图片、授权和隐私说明。');
  }
 };
 const accountSummary = (r) => ({
  id: r.id, revision: r.revision,
  title: r.fields.title || '（未命名草稿）', category: r.fields.category,
  status: r.status, status_label: accountStatusLabels[r.status] ?? r.status,
  created_at: r.created_at, updated_at: r.updated_at, image_count: r.images.length,
  people: r.fields.people ?? '', linked_item_id: r.linked_item_id ?? null,
  withdrawal_requested: Boolean(r.withdrawal_requested),
  change_request: r.change_request ?? null,
  version_count: Array.isArray(r.versions) ? r.versions.length : 0,
  public_message: r.public_message ?? '',
 });
 // 以投稿记录为真实来源。索引写入可能在服务异常退出时落后，不能用它决定权限或配额。
 const accountRecords = async (accountId) => {
  return (await all()).filter((record) => record.account_id === accountId);
 };
 // 草稿数量上限（方案 K：同时保存不超过 20 件未提交草稿）。
 const checkDraftLimit = async (accountId) => {
  const records = await accountRecords(accountId);
  const drafts = records.filter((record) => record.status === 'draft').length;
  if (drafts >= accountQuota.maxDrafts) {
   fail(`未提交的草稿已达上限（${accountQuota.maxDrafts} 件）。请先提交，或把不再需要的移入回收区。`, 429);
  }
 };
 // 提交审核的每日次数上限（方案 K：每天提交不超过 10 件）。按今天"提交审核"的动作统计，创建草稿本身不计。
 const checkSubmitLimit = async (accountId) => {
  const records = await accountRecords(accountId);
  const today = new Date().toISOString().slice(0, 10);
  const submittedToday = records.reduce((count, record) => count + (record.history ?? [])
   .filter((entry) => entry.action === 'submitted' && String(entry.at ?? '').startsWith(today)).length, 0);
  if (submittedToday >= accountQuota.perDay) {
   fail(`今天提交审核的次数已达上限（${accountQuota.perDay} 件），请明天再试。`, 429);
  }
 };
 // 已移入私密回收区的图片依然占用空间，不能通过移除/撤回绕过账号配额。
 const storageUsage = async (accountId, suppliedRecords = null) => {
  const records = suppliedRecords ?? await accountRecords(accountId);
  let usedBytes = 0;
  for (const record of records) {
   // 直接统计私密目录中的真实文件，连异常中断留下的未引用图片也计入容量。
   const folder = path.join(root, record.id);
   const currentFiles = await fs.readdir(folder, { withFileTypes: true });
   for (const file of currentFiles) {
    if (file.isFile() && /^copy-\d+\.jpg$/.test(file.name)) {
     try { usedBytes += (await fs.stat(path.join(folder, file.name))).size; }
     catch (error) { if (error.code !== 'ENOENT') throw error; }
    }
   }
   const recycle = path.join(root, '.recycle', record.id);
   let batches;
   try { batches = await fs.readdir(recycle, { withFileTypes: true }); }
   catch (error) { if (error.code === 'ENOENT') continue; throw error; }
   for (const batch of batches) {
    if (!batch.isDirectory()) continue;
    const files = await fs.readdir(path.join(recycle, batch.name), { withFileTypes: true });
    for (const file of files) {
     if (file.isFile() && /^copy-\d+\.jpg$/.test(file.name)) {
      try { usedBytes += (await fs.stat(path.join(recycle, batch.name, file.name))).size; }
      catch (error) { if (error.code !== 'ENOENT') throw error; }
     }
    }
   }
  }
  return usedBytes;
 };
 const checkStorageLimit = async (accountId, addedBytes) => {
  const usedBytes = await storageUsage(accountId);
  if (usedBytes + addedBytes > accountQuota.maxBytes) {
   fail(`你的资料占用已达上限（约 200 MB）。请先整理现有草稿与投稿，或申请导出后清理。`, 429);
  }
 };
 const accountUsage = async (accountId) => {
  const account = safeAccountId(accountId);
  const records = await accountRecords(account);
  const today = new Date().toISOString().slice(0, 10);
  return {
   drafts_left: Math.max(0, accountQuota.maxDrafts - records.filter(record => record.status === 'draft').length),
   submissions_left_today: Math.max(0, accountQuota.perDay - records.reduce((count, record) => count + (record.history ?? []).filter(entry => entry.action === 'submitted' && String(entry.at ?? '').startsWith(today)).length, 0)),
   storage_left_bytes: Math.max(0, accountQuota.maxBytes - await storageUsage(account, records)),
  };
 };
 const nextImageIndex = async (record) => {
  let maximum = 0;
  // 未完成写入留下的私密图片也占用文件名；下次保存不能被旧残留卡住。
  const files = await fs.readdir(path.join(root, record.id));
  for (const filename of files) {
   const match = /^copy-(\d+)\.jpg$/.exec(filename);
   if (match) maximum = Math.max(maximum, Number(match[1]));
  }
  return maximum + 1;
 };
 // 只读版本快照：提交与补充都会留下一份确定内容的记录，供审核与追溯使用。
 const pushVersion = (record, action, at) => {
  const versions = Array.isArray(record.versions) ? record.versions : [];
  versions.push({
   revision: record.revision, at, action,
   fields: { ...record.fields },
   images: record.images.map(({ filename, original_name, bytes, note }) => ({ filename, original_name, bytes, note: note ?? '' })),
  });
  record.versions = versions.slice(-maximumVersions);
 };
 const createAccountSubmission = async ({ accountId, mode, payload }) => {
  const account = safeAccountId(accountId);
  if (payload?.website) fail('提交未通过，请稍后重试。');
  if (!/^[a-f0-9]{64}$/.test(String(payload?.request_key ?? ''))) fail('本次提交凭证无效，请刷新页面后重试。');
  const submitting = mode === 'pending';
  const fields = accountFields(payload?.fields, submitting);
  if (submitting) requireAccountConsents(payload);
  const suppliedImages = Array.isArray(payload?.images) ? payload.images : [];
  if (submitting && !suppliedImages.length) fail('请至少选择一张经过筛选的图片副本。');
  const staged = suppliedImages.length ? await stageImages(suppliedImages) : [];
  const fingerprint = hash(JSON.stringify({
   account, submitting, fields, consent_version: payload.consent_version,
   images: staged.map((image, index) => [image.name, hash(image.buffer), String(suppliedImages[index]?.note ?? '').trim().slice(0, 300)]),
  }));
  // 同一账号的一次提交使用稳定编号；网络超时后用同一凭证重试，只会找回原记录。
  const key = hash(`${account}:${payload.request_key}`);
  const id = submissionId(key);
  const now = new Date().toISOString();
  return locked(`account-quota-${account}`, async () => locked('intake', async () => locked(id, async () => {
   if (await exists(recordPath(id))) {
    const existing = await read(id);
    if (existing.account_id !== account || existing.fingerprint !== fingerprint) fail('这次提交已收到；内容若有改动，请刷新页面后重新提交。', 409);
    return { id, created_at: existing.created_at, status: existing.status, revision: existing.revision, repeated: true };
   }
   // 账号配额检查与真正落盘在同一把锁内，两个同时提交的请求不能都按旧余额通过。
   if (submitting) await checkSubmitLimit(account);
   else await checkDraftLimit(account);
   const records = await all();
   if (records.length >= maxEntries || records.reduce((n, r) => n + r.images.reduce((s, i) => s + i.bytes, 0), 0) + submissionLimits.totalBytes > maxStorageBytes) fail('投稿收件区暂满，请稍后再试。', 503);
   const processed = await processImages(staged);
   await checkStorageLimit(account, processed.reduce((sum, image) => sum + image.bytes, 0));
   const images = processed.map(({ buffer, ...image }, index) => ({ ...image, note: String(payload.images[index]?.note ?? '').trim().slice(0, 300) }));
   const record = {
    version: 1, revision: 1, id, created_at: now, updated_at: now,
    key_hash: hash(key), fingerprint,
    account_id: account, fields,
    consent: submitting
     ? { version: consentVersion, confirmed_at: now, copies: true, rights: true, privacy: true, processing: true }
     : { version: consentVersion, confirmed_at: '', copies: false, rights: false, privacy: false, processing: false },
    images, status: submitting ? 'pending' : 'draft', private_note: '', public_message: '',
    linked_item_id: null, withdrawal_requested: false, change_request: null, versions: [],
    history: [{ at: now, action: submitting ? 'submitted' : 'draft_created' }],
   };
   if (submitting) pushVersion(record, 'submitted', now);
   const staging = path.join(root, `.incoming-${randomUUID()}`);
   await fs.mkdir(staging, { mode: 0o700 });
   for (const image of processed) await fs.writeFile(path.join(staging, image.filename), image.buffer, { mode: 0o600, flag: 'wx' });
   await atomicJson(path.join(staging, 'record.json'), record);
   await fs.rename(staging, path.join(root, id));
   return { id, created_at: now, status: record.status, revision: record.revision };
  })));
 };
 const saveAccountSubmission = async ({ id, accountId, revision, payload }) => {
  const account = safeAccountId(accountId);
  if (payload?.website) fail('提交未通过，请稍后重试。');
  return locked(`account-quota-${account}`, async () => locked(safeId(id), async () => {
   const r = await read(id);
   ownedBy(r, account);
   if (r.status !== 'draft') fail('这份投稿已经提交，不能再作为草稿编辑；如需修改请先撤回。');
   if (revision !== r.revision) fail('草稿已被其他操作更新，请刷新后再试。', 409);
   const fields = accountFields(payload?.fields, false);
   const keep = Array.isArray(payload?.keep) ? payload.keep.map(String) : r.images.map((image) => image.filename);
   if (new Set(keep).size !== keep.length) fail('保留的图片有重复，请刷新后重试。');
   const kept = keep.map((filename) => {
    const image = r.images.find((item) => item.filename === filename);
    if (!image) fail('保留的图片不存在，请刷新后重试。');
    return image;
   });
   const incoming = Array.isArray(payload?.images) ? payload.images : [];
   if (kept.length + incoming.length > submissionLimits.images) fail(`一件投稿最多 ${submissionLimits.images} 张图片。`, 413);
   const staged = incoming.length ? await stageImages(incoming, submissionLimits.images - kept.length) : [];
   const start = await nextImageIndex(r);
   const processed = staged.length ? await processImages(staged, (index) => `copy-${String(start + index).padStart(2, '0')}.jpg`) : [];
   if (processed.length) await checkStorageLimit(account, processed.reduce((sum, image) => sum + image.bytes, 0));
   const notes = payload?.notes && typeof payload.notes === 'object' ? payload.notes : {};
   const images = [
    ...kept.map((image) => ({ ...image, note: typeof notes[image.filename] === 'string' ? notes[image.filename].trim().slice(0, 300) : (image.note ?? '') })),
    ...processed.map(({ buffer, ...image }, index) => ({ ...image, note: String(incoming[index]?.note ?? '').trim().slice(0, 300) })),
   ];
   const now = new Date().toISOString();
   // 新图片直接写入投稿目录；文件名由序号保证不会覆盖已有图片。
   for (const image of processed) await fs.writeFile(path.join(root, id, image.filename), image.buffer, { mode: 0o600, flag: 'wx' });
   // 先保存新记录，再把不再引用的旧图片移入私密回收区；保存失败时旧记录仍指向原图片。
   const removed = r.images.filter((image) => !keep.includes(image.filename));
   const next = { ...r, fields, images, revision: r.revision + 1, updated_at: now };
   next.history = [...r.history, { at: now, action: 'draft_saved' }];
   await atomicJson(recordPath(id), next);
   if (removed.length) {
    const entry = path.join(root, '.recycle', id, `${Date.now()}-${randomBytes(4).toString('hex')}`);
    await fs.mkdir(entry, { recursive: true, mode: 0o700 });
    for (const image of removed) {
     try { await fs.rename(path.join(root, id, image.filename), path.join(entry, image.filename)); } catch { /* 文件已不存在时继续处理其余图片。 */ }
    }
    await atomicJson(path.join(entry, 'manifest.json'), { at: now, reason: 'draft_image_removed', images: removed.map((image) => image.filename) });
   }
   return accountSummary(next);
  }));
 };
 const submitAccountSubmission = async ({ id, accountId, revision, payload }) => {
  const account = safeAccountId(accountId);
  requireAccountConsents(payload);
  return locked(`account-quota-${account}`, async () => locked(safeId(id), async () => {
   const r = await read(id);
   ownedBy(r, account);
   if (r.status !== 'draft') fail('只有草稿可以提交审核。');
   if (revision !== r.revision) fail('草稿已被其他操作更新，请刷新后再试。', 409);
   await checkSubmitLimit(account);
   const fields = accountFields(r.fields, true);
   if (!r.images.length) fail('请至少保留一张经过筛选的图片副本。');
   const now = new Date().toISOString();
   const next = {
    ...r, fields, status: 'pending', revision: r.revision + 1, updated_at: now,
    public_message: '', private_note: '',
    consent: { version: consentVersion, confirmed_at: now, copies: true, rights: true, privacy: true, processing: true },
   };
   next.history = [...r.history, { at: now, action: 'submitted' }];
   pushVersion(next, 'submitted', now);
   await atomicJson(recordPath(id), next);
   return accountSummary(next);
  }));
 };
 // 投稿人只能看到自己的内容与公开处理说明；管理员的内部备注与内部记录绝不下发。
 const publicHistory = (history) => (Array.isArray(history) ? history : [])
  .filter((entry) => entry)
  .map((entry) => ({ at: entry.at, action: entry.action, status: entry.status ?? '', public_message: entry.public_message ?? '' }));
 const accountDetail = (r) => {
  const { key_hash, fingerprint, private_note, history, ...rest } = r;
  return { ...rest, history: publicHistory(history) };
 };
 const getAccountSubmission = async ({ id, accountId }) => accountDetail(ownedBy(await read(id), safeAccountId(accountId)));
 const listAccountSubmissions = async ({ accountId }) => {
  const account = safeAccountId(accountId);
  const records = await accountRecords(account);
  return records
   .sort((a, b) => String(b.updated_at).localeCompare(String(a.updated_at)))
   .map(accountSummary);
 };
 const getAccountImage = async ({ id, accountId, filename }) => {
  const r = await read(id);
  ownedBy(r, safeAccountId(accountId));
  if (!r.images.some((image) => image.filename === filename)) fail('图片不存在。', 404);
  return fs.readFile(path.join(root, safeId(id), filename));
 };
 const withdrawAccountSubmission = async ({ id, accountId }) => {
  const account = safeAccountId(accountId);
  return locked(safeId(id), async () => {
   const r = await read(id);
   ownedBy(r, account);
   const now = new Date().toISOString();
   if (r.status === 'draft') fail('草稿不需要撤回；可以直接移入回收区。');
   // 已经转入档案草稿的投稿沿用现有"停止处理申请"机制，由站主核查。
   if (r.linked_item_id || r.withdrawal_requested) {
    if (!r.withdrawal_requested) {
     r.withdrawal_requested = true; r.updated_at = now; r.revision++;
     r.history = [...r.history, { at: now, action: 'withdrawal_requested' }];
     await atomicJson(recordPath(id), r);
    }
    return accountSummary(r);
   }
   // 尚未进入整理流程的投稿：撤回后回到草稿，可以继续修改再重新提交。
   r.status = 'draft'; r.updated_at = now; r.revision++;
   r.history = [...r.history, { at: now, action: 'withdrawn_to_draft' }];
   await atomicJson(recordPath(id), r);
   return accountSummary(r);
  });
 };
 const discardAccountSubmission = async ({ id, accountId }) => {
  const account = safeAccountId(accountId);
  return locked(safeId(id), async () => {
   const r = await read(id);
   ownedBy(r, account);
   if (r.status !== 'draft') fail('只有草稿可以移入回收区。');
   const now = new Date().toISOString();
   r.status = 'withdrawn'; r.updated_at = now; r.revision++;
   r.history = [...r.history, { at: now, action: 'draft_discarded' }];
   await atomicJson(recordPath(id), r);
   return accountSummary(r);
  });
 };
 const requestAccountChange = async ({ id, accountId, kind, note }) => {
  const account = safeAccountId(accountId);
  if (!['modify', 'remove'].includes(kind)) fail('不支持这种申请。');
  const message = String(note ?? '').trim().slice(0, 1000);
  if (!message) fail('请简要说明需要修改或撤下的原因。');
  return locked(safeId(id), async () => {
   const r = await read(id);
   ownedBy(r, account);
   if (!r.linked_item_id) fail('这份投稿还没有进入整理或公开流程，不需要提交这类申请。');
   if (['received', 'processing'].includes(r.change_request?.status)) fail('你已经提交过申请，站主处理后会更新状态。', 409);
   const now = new Date().toISOString();
   r.change_request = { at: now, kind, note: message, status: 'received' };
   if (kind === 'remove') r.withdrawal_requested = true;
   r.updated_at = now; r.revision++;
   r.history = [...r.history, { at: now, action: kind === 'remove' ? 'removal_requested' : 'change_requested', kind, note: message }];
   await atomicJson(recordPath(id), r);
   return accountSummary(r);
  });
 };
 const reviewAccountChange = async ({ id, revision, status, publicMessage }) => {
  const result = await locked(safeId(id), async () => {
   const r = await read(id);
   if (r.revision !== revision) fail('投稿已发生变化，请刷新后再处理申请。', 409);
   if (!r.account_id || !r.change_request || !['received', 'processing'].includes(r.change_request.status)) fail('当前没有待处理的修改或撤下申请。', 409);
   if (!['processing', 'done', 'rejected'].includes(status)) fail('申请处理状态无效。');
   const message = text(publicMessage ?? '', '给投稿人的处理说明', status === 'processing' ? 0 : 2, 1000);
   const now = new Date().toISOString();
   r.change_request = { ...r.change_request, status, reviewed_by: 'admin', reviewed_at: now, resolved_at: status === 'processing' ? '' : now, public_message: message };
   r.public_message = message || r.public_message;
   r.updated_at = now; r.revision++;
   r.history = [...r.history, { at: now, action: 'change_request_review', status, actor: 'admin', public_message: message }];
   await atomicJson(recordPath(id), r);
   return detail(r);
  });
  if (['done', 'rejected'].includes(status)) await deliverNotification({ accountId: result.account_id, event: status === 'done' ? 'change_done' : 'change_rejected', title: result.fields.title, submission_id: result.id });
  return result;
 };
 // 关联旧投稿：必须同时提供已登录账号、原投稿编号与原查询密钥，三者缺一不可。
 const claimSubmission = async ({ id, key, accountId }) => {
  const account = safeAccountId(accountId);
  return locked(`account-quota-${account}`, async () => locked(safeId(id), async () => {
   const r = await authenticate(id, key);
   if (r.account_id === account) return { id, claimed: true, repeated: true };
   if (r.account_id) fail('这份投稿已经关联其他账号，请通过联系入口告知站主核对。', 409);
   await checkStorageLimit(account, r.images.reduce((sum, image) => sum + image.bytes, 0));
   const now = new Date().toISOString();
   r.account_id = account; r.updated_at = now; r.revision++;
   r.history = [...r.history, { at: now, action: 'claimed' }];
   await atomicJson(recordPath(id), r);
   return { id, claimed: true, repeated: false };
  }));
 };
 // 正式发布成功后按投稿人是否开启通知偏好决定是否发信（由调用方提供的通知器处理）。
 const notifyPublished = async (itemId) => {
  if (typeof notifier !== 'function') return;
  const linked = (await all()).find((record) => record.linked_item_id === itemId && record.account_id);
  if (!linked) return;
  await deliverNotification({ accountId: linked.account_id, event: 'published', submission_id: linked.id, title: linked.fields.title });
 };
 return {
  create, lookup, withdraw, review, list, detail: async (id) => detail(await read(id)), getImage, transfer, guardPublication,
  createAccountSubmission, saveAccountSubmission, submitAccountSubmission, getAccountSubmission, listAccountSubmissions,
  getAccountImage, withdrawAccountSubmission, discardAccountSubmission, requestAccountChange, reviewAccountChange, claimSubmission, notifyPublished,
  accountUsage,
 };
}

export async function readSubmissionJson(request, maximum = submissionLimits.requestBytes) {
 if (!(request.headers['content-type'] ?? '').startsWith('application/json')) fail('提交格式无效。', 415);
 if (Number(request.headers['content-length']) > maximum) fail('提交内容过大。', 413);
 const chunks = []; let bytes = 0;
 for await (const chunk of request) { bytes += chunk.length; if (bytes > maximum) fail('提交内容过大。', 413); chunks.push(chunk); }
 try {
  const result = JSON.parse(Buffer.concat(chunks).toString('utf8'));
  if (!result || typeof result !== 'object' || Array.isArray(result)) fail('提交内容必须是有效表单。');
  return result;
 } catch { fail('提交内容无法读取。'); }
}

// 投稿正文使用 multipart 表单直传，图片不再经 base64 膨胀；文字字段与图片在读取时统一转成内部结构。
export async function readSubmissionForm(request, maximum = submissionLimits.requestBytes) {
 const contentType = String(request.headers['content-type'] ?? '');
 if (!contentType.startsWith('multipart/form-data')) fail('提交格式无效。', 415);
 if (Number(request.headers['content-length']) > maximum) fail('提交内容过大。', 413);
 let bytes = 0;
 const limited = Readable.toWeb(request).pipeThrough(new TransformStream({
  transform(chunk, controller) {
   bytes += chunk.length;
   if (bytes > maximum) controller.error(new SubmissionError('提交内容过大。', 413));
   else controller.enqueue(chunk);
  },
 }));
 let form;
 try {
  form = await new Request('http://127.0.0.1/', { method: 'POST', headers: { 'content-type': contentType }, body: limited, duplex: 'half' }).formData();
 } catch (error) {
  if (error instanceof SubmissionError) throw error;
  if (bytes > maximum) fail('提交内容过大。', 413);
  fail('提交内容无法读取。');
 }
 const payload = { consents: {}, images: [] };
 for (const [key, value] of form.entries()) {
  if (typeof value !== 'string') {
   if (key !== 'images') fail('提交内容无法读取。');
   payload.images.push({ name: value.name, buffer: Buffer.from(await value.arrayBuffer()) });
   continue;
  }
  if (key.startsWith('consents_')) payload.consents[key.slice('consents_'.length)] = value === 'true';
  else if (key !== 'images') payload[key] = value;
 }
 return payload;
}

export function createPublicSubmissionHandler({ store, origin, local = false, trustProxy = false }) {
 const rate = new Map(); let active = 0;
 const send = (response, code, data) => {
  response.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'no-referrer', 'X-Robots-Tag': 'noindex, nofollow', ...(code === 429 ? { 'Retry-After': '600' } : {}) });
  response.end(JSON.stringify(data));
 };
 return async (request, response, pathname) => {
  if (!pathname.startsWith('/api/submissions')) return false;
  let admitted = false;
  try {
   const actions = new Set(['/api/submissions', '/api/submissions/lookup', '/api/submissions/withdraw']);
   if (pathname === '/api/submissions/config' && request.method === 'GET') { send(response, 200, { available: true, local_preview: local, limits: submissionLimits, consent_version: consentVersion }); return true; }
   if (!actions.has(pathname)) fail('此地址不存在。', 404);
   if (request.method !== 'POST') fail('不支持此操作。', 405);
   const origins = new Set([origin, ...(local ? [origin.replace('127.0.0.1', 'localhost')] : [])]);
   if (!origins.has(request.headers.origin) || request.headers['x-ljm-submission'] !== '1') fail('提交来源不正确，请从网站投稿页重试。', 403);
   const now = Date.now();
   for (const [key, value] of rate) if (value.until <= now) rate.delete(key);
   const address = trustProxy ? request.headers['x-ljm-client-ip'] : request.socket.remoteAddress;
   if (!address || typeof address !== 'string' || address.length > 100) fail('无法确认提交来源。', 403);
   const bucket = `${hash(address)}:${pathname === '/api/submissions' ? 'submit' : 'lookup'}`;
   const previous = rate.get(bucket) ?? { count: 0, until: now + 600_000 };
   if (rate.size >= 5000 && !rate.has(bucket)) fail('当前访问较多，请稍后再试。', 429);
   previous.count++; rate.set(bucket, previous);
   if (previous.count > (pathname === '/api/submissions' ? 5 : 40)) fail('操作太频繁，请十分钟后再试。', 429);
   if (active >= 2) fail('当前正在接收其他投稿，请稍后重试。', 503);
   active++; admitted = true;
   const payload = pathname === '/api/submissions' ? await readSubmissionForm(request, submissionLimits.requestBytes) : await readSubmissionJson(request, 4096);
   const data = pathname === '/api/submissions' ? await store.create(payload) : pathname.endsWith('/lookup') ? await store.lookup(payload) : await store.withdraw(payload);
   send(response, pathname === '/api/submissions' ? 201 : 200, data);
  } catch (error) { if (!response.headersSent) send(response, error instanceof SubmissionError ? error.statusCode : 500, { error: error instanceof SubmissionError ? error.message : '暂时无法完成操作，请保留回执并稍后重试。' }); }
  finally { if (admitted) active--; }
  return true;
 };
}
