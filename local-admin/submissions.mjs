import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash, randomUUID, timingSafeEqual } from 'node:crypto';
import { createRequire } from 'node:module';

export const submissionLimits = Object.freeze({ images: 8, imageBytes: 5 * 1024 * 1024, totalBytes: 20 * 1024 * 1024, requestBytes: 28 * 1024 * 1024 });
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

export function createSubmissionStore({ root, siteDirectory, maxEntries = 2000, maxStorageBytes = 10 * 1024 ** 3 }) {
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
  const fingerprint = hash(JSON.stringify({ fields, images: payload.images, consent_version: payload.consent_version }));
  return locked('intake', async () => locked(id, async () => {
   if (await exists(recordPath(id))) {
    const old = await read(id);
    if (old.fingerprint !== fingerprint) fail('这次提交已收到。请用回执查询；如需提交另一份资料，请重新打开投稿页。', 409);
    return { id, created_at: old.created_at, repeated: true };
   }
   const records = await all();
   if (records.length >= maxEntries || records.reduce((n, r) => n + r.images.reduce((s, i) => s + i.bytes, 0), 0) + submissionLimits.totalBytes > maxStorageBytes) fail('投稿收件区暂满，请稍后再试。', 503);
   sharp ??= require('sharp');
   const images = [];
   let total = 0;
   for (const [index, image] of payload.images.entries()) {
    const originalName = text(image.name, '图片文件名', 1, 180);
    if (!/\.(jpe?g|png|webp)$/i.test(originalName) || /(master|original|raw|主档|原始)/i.test(originalName)) fail('只接收 JPG、PNG、WebP 筛选副本，不接收主档或原始文件。');
    const match = /^data:image\/(jpeg|png|webp);base64,([A-Za-z0-9+/]+={0,2})$/.exec(image.data ?? '');
    if (!match) fail('图片格式无法读取。');
    const buffer = Buffer.from(match[2], 'base64');
    total += buffer.length;
    if (!buffer.length || buffer.length > submissionLimits.imageBytes || total > submissionLimits.totalBytes) fail('每张图片最多 5 MB，每次合计最多 20 MB。', 413);
    try {
     const input = sharp(buffer, { limitInputPixels: 40_000_000, failOn: 'warning', animated: false });
     const info = await input.metadata();
     if (info.format !== match[1] || (info.pages ?? 1) > 1) fail('图片真实格式不符，或包含动画/多页内容。');
     const clean = await input.rotate().resize({ width: 2400, height: 2400, fit: 'inside', withoutEnlargement: true }).flatten({ background: '#ffffff' }).jpeg({ quality: 88 }).toBuffer();
     images.push({ filename: `copy-${String(index + 1).padStart(2, '0')}.jpg`, original_name: originalName, bytes: clean.length, buffer: clean });
    } catch (error) { if (error instanceof SubmissionError) throw error; fail(`第 ${index + 1} 张图片损坏、尺寸过大或无法解码，请重新导出副本。`); }
   }
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
 const review = async (id, payload) => locked(safeId(id), async () => {
  const r = await read(id);
  if (payload.revision !== r.revision) fail('投稿已被其他操作更新，请刷新后再保存。', 409);
  if (!Object.hasOwn(submissionStates, payload.status)) fail('审核状态无效。');
  if ((r.linked_item_id || r.status === 'withdrawn' || r.withdrawal_requested) && payload.status !== r.status) fail('此投稿已转入草稿或申请停止处理，不能直接更改审核状态。');
  const publicMessage = text(payload.public_message ?? '', '给投稿人的说明', 0, 1000);
  if (['needs_info', 'declined'].includes(payload.status) && !publicMessage) fail('请填写给投稿人的说明。');
  if (payload.status === 'approved' && r.status !== 'approved' && payload.rights_reviewed !== true) fail('请先人工核对投稿授权和来源。');
  r.status = payload.status; r.private_note = text(payload.private_note ?? '', '内部备注', 0, 4000); r.public_message = publicMessage;
  r.revision++; r.updated_at = new Date().toISOString();
  r.history.push({ at: r.updated_at, action: 'review', status: r.status, private_note: r.private_note, public_message: r.public_message });
  await atomicJson(recordPath(id), r); return detail(r);
 });
 const detail = (r) => { const { key_hash, fingerprint, ...safe } = r; return safe; };
 const list = async () => (await all()).map((r) => ({ id: r.id, revision: r.revision, title: r.fields.title, category: r.fields.category, status: r.status, created_at: r.created_at, updated_at: r.updated_at, image_count: r.images.length, people: r.fields.people, linked_item_id: r.linked_item_id, withdrawal_requested: Boolean(r.withdrawal_requested) }));
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
 return { create, lookup, withdraw, review, list, detail: async (id) => detail(await read(id)), getImage, transfer, guardPublication };
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
   const payload = await readSubmissionJson(request, pathname === '/api/submissions' ? submissionLimits.requestBytes : 4096);
   const data = pathname === '/api/submissions' ? await store.create(payload) : pathname.endsWith('/lookup') ? await store.lookup(payload) : await store.withdraw(payload);
   send(response, pathname === '/api/submissions' ? 201 : 200, data);
  } catch (error) { if (!response.headersSent) send(response, error instanceof SubmissionError ? error.statusCode : 500, { error: error instanceof SubmissionError ? error.message : '暂时无法完成操作，请保留回执并稍后重试。' }); }
  finally { if (admitted) active--; }
  return true;
 };
}
