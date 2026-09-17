const $ = <T extends HTMLElement>(selector: string) => document.querySelector<T>(selector)!;
const form = $<HTMLFormElement>('#submission-form');
const fields = $<HTMLFieldSetElement>('#submission-fields');
const submit = $<HTMLButtonElement>('#submission-submit');
const feedback = $('#submit-feedback');
const service = $('#submission-service');
const picker = $<HTMLInputElement>('#submission-images');
const previews = $('#image-previews');
const fileFeedback = $('#image-feedback');
const progress = $<HTMLProgressElement>('#upload-progress');
const lookupForm = $<HTMLFormElement>('#lookup-form');
const lookupId = $<HTMLInputElement>('#lookup-id');
const lookupKey = $<HTMLInputElement>('#lookup-key');
const lookupResult = $('#lookup-result');
const storageKey = 'ljm-submission-receipt-v1';
type Receipt = { id: string; key: string; confirmed: boolean };
let receipt: Receipt | null = null;
let selected: Array<{ file: File; url: string; hash: string }> = [];
let busy = false, dirty = false, available = false, selecting = false;
let activeLookup: { id: string; key: string } | null = null;
// 加密能力只在安全连接（https 或本机地址）下可用；其余环境提前给出明确提示。
const secureContext = window.isSecureContext && Boolean(crypto.subtle);

const hex = (buffer: ArrayBuffer | Uint8Array) => Array.from(buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer), b => b.toString(16).padStart(2, '0')).join('');
const digest = async (value: ArrayBuffer | Uint8Array) => hex(await crypto.subtle.digest('SHA-256', value as BufferSource));
const announce = (message: string) => { feedback.textContent = message; };
function remember(value: Receipt) {
 receipt = value;
 try { sessionStorage.setItem(storageKey, JSON.stringify(value)); } catch { /* 回执仍可手动保存。 */ }
 lookupId.value = value.id; lookupKey.value = value.key;
}
function showReceipt(value: Receipt) {
 remember(value);
 $('#receipt-id').textContent = value.id; $('#receipt-key').textContent = value.key;
 $('#receipt-title').textContent = value.confirmed ? '投稿已收到，谢谢您的信任。' : '接收状态待确认，请保留回执。';
 $('#receipt-description').textContent = value.confirmed ? '资料已进入私密审核区。您可以凭回执查看进度，或申请停止处理。' : '网络未返回明确结果。请先用下方查询功能确认是否收到，避免重复投稿；不要丢失查询密钥。';
 $('#submission-receipt').hidden = false;
}
async function jsonRequest(url: string, payload: unknown) {
 const controller = new AbortController(); const timer = setTimeout(() => controller.abort(), 20_000);
 try {
  const response = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-LJM-Submission': '1' }, body: JSON.stringify(payload), signal: controller.signal, cache: 'no-store' });
  const data = await response.json().catch(() => { throw new Error('投稿通道暂时无法连接，请稍后重试。'); });
  if (!response.ok) throw new Error(data.error || '操作未完成，请稍后重试。');
  return data;
 } finally { clearTimeout(timer); }
}
async function checkService() {
 try {
  const response = await fetch('/api/submissions/config', { cache: 'no-store', signal: AbortSignal.timeout(10_000) });
  const config = await response.json();
  if (!response.ok || !config.available || config.consent_version !== '2026-09-05-v1') throw new Error();
  available = true; submit.disabled = false;
  service.textContent = config.local_preview ? '本地体验：投稿只进入本机的私密审核区。' : '投稿通道已开放。您填写的内容仅在点击提交后发送。';
 } catch {
  available = false; submit.disabled = true; service.dataset.unavailable = '';
  service.textContent = '投稿通道暂未开放或连接失败。当前不会发送资料；请稍后刷新重试。';
 }
}
function renderImages() {
 previews.replaceChildren();
 for (const [index, entry] of selected.entries()) {
  const li = document.createElement('li');
  const img = document.createElement('img'); img.src = entry.url; img.alt = `第 ${index + 1} 张待投稿副本`; img.width = 200; img.height = 120;
  const caption = document.createElement('p'); caption.textContent = `${index + 1}. ${entry.file.name} · ${(entry.file.size / 1024 ** 2).toFixed(2)} MB`;
  const remove = document.createElement('button'); remove.type = 'button'; remove.textContent = '移除这张'; remove.setAttribute('aria-label', `移除第 ${index + 1} 张图片`);
  remove.addEventListener('click', () => { URL.revokeObjectURL(entry.url); selected = selected.filter(item => item !== entry); dirty = true; renderImages(); });
  li.append(img, caption, remove); previews.append(li);
 }
 fileFeedback.textContent = selected.length ? `已选择 ${selected.length} / 8 张，合计 ${(selected.reduce((sum, i) => sum + i.file.size, 0) / 1024 ** 2).toFixed(2)} / 20 MB。` : '尚未选择图片。';
}
async function addFiles(files: File[]) {
 if (busy || selecting) return;
 if (!secureContext) { fileFeedback.textContent = '当前访问地址不是安全连接，无法读取和加密图片。请通过网站的正式地址访问后再投稿。'; picker.value = ''; return; }
 selecting = true; submit.disabled = true;
 const errors: string[] = [];
 try {
  for (const file of files) {
   if (selected.length >= 8) { errors.push('最多选择 8 张图片。'); break; }
   if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || !/\.(jpe?g|png|webp)$/i.test(file.name) || /(master|original|raw|主档|原始)/i.test(file.name)) { errors.push(`${file.name}：仅接收 JPG、PNG、WebP 筛选副本。`); continue; }
   if (!file.size || file.size > 5 * 1024 ** 2 || selected.reduce((sum, i) => sum + i.file.size, 0) + file.size > 20 * 1024 ** 2) { errors.push(`${file.name}：每张最多 5 MB，合计最多 20 MB。`); continue; }
   const hash = await digest(await file.arrayBuffer());
   if (selected.some(entry => entry.hash === hash)) { errors.push(`${file.name}：已选过相同图片。`); continue; }
   const url = URL.createObjectURL(file);
   try {
    await new Promise<void>((resolve, reject) => { const img = new Image(); img.onload = () => img.naturalWidth * img.naturalHeight <= 40_000_000 ? resolve() : reject(); img.onerror = reject; img.src = url; });
    selected.push({ file, url, hash }); dirty = true;
   } catch { URL.revokeObjectURL(url); errors.push(`${file.name}：无法预览或像素过大，请重新导出副本。`); }
  }
  renderImages();
  if (errors.length) fileFeedback.textContent += ` ${errors.join(' ')}`;
 } catch { fileFeedback.textContent = '图片读取失败，请重新选择。'; }
 finally { selecting = false; submit.disabled = !available; picker.value = ''; }
}
picker.addEventListener('change', () => void addFiles(Array.from(picker.files || [])));
const dropzone = $('#image-dropzone');
for (const eventName of ['dragenter', 'dragover']) dropzone.addEventListener(eventName, event => { event.preventDefault(); if (!busy) dropzone.dataset.drag = ''; });
for (const eventName of ['dragleave', 'drop']) dropzone.addEventListener(eventName, event => { event.preventDefault(); delete dropzone.dataset.drag; });
dropzone.addEventListener('drop', event => void addFiles(Array.from((event as DragEvent).dataTransfer?.files || [])));
form.addEventListener('input', () => { dirty = true; });
$('#submission-description').addEventListener('input', () => { $('#story-count').textContent = `${$<HTMLTextAreaElement>('#submission-description').value.length} / 3000`; });
$('#contact-type').addEventListener('change', () => {
 const type = $<HTMLSelectElement>('#contact-type').value;
 const contact = $<HTMLInputElement>('#submission-contact');
 contact.type = type === 'email' ? 'email' : type === 'phone' ? 'tel' : 'text';
 contact.placeholder = type === 'email' ? '您常用的邮箱' : type === 'phone' ? '便于联系的电话号码' : '您的微信号';
});
for (const input of form.querySelectorAll<HTMLInputElement>('input[name=attribution]')) input.addEventListener('change', () => {
 const named = (new FormData(form)).get('attribution') === 'named'; $('#credit-field').hidden = !named; $<HTMLInputElement>('#submission-credit').required = named;
});
window.addEventListener('beforeunload', event => { if (dirty || busy) { event.preventDefault(); event.returnValue = ''; } });
function upload(payload: FormData): Promise<{ id: string }> {
 return new Promise((resolve, reject) => {
  const xhr = new XMLHttpRequest(); xhr.open('POST', '/api/submissions'); xhr.timeout = 120_000;
  xhr.setRequestHeader('X-LJM-Submission', '1');
  xhr.upload.onprogress = event => { if (event.lengthComputable) { progress.value = Math.round(event.loaded / event.total * 100); announce(progress.value === 100 ? '图片已发送，正在检查并保存，请稍候…' : `正在上传 ${progress.value}%…`); } };
  xhr.onload = () => { try { const data = JSON.parse(xhr.responseText); if (xhr.status < 200 || xhr.status >= 300) reject(new Error(data.error || '投稿未完成。')); else resolve(data); } catch { reject(new Error('没有收到明确的接收结果，请先查询回执。')); } };
  xhr.onerror = xhr.ontimeout = () => reject(new Error('连接中断或等待超时，请先查询回执确认是否收到；未收到时可以重试。'));
  xhr.send(payload);
 });
}
form.addEventListener('submit', async event => {
 event.preventDefault(); if (busy || selecting || !available || !form.reportValidity()) return;
 if (!selected.length) { announce('请先选择至少一张经过筛选的图片副本。'); picker.focus(); return; }
 const data = new FormData(form);
 busy = true; submit.disabled = true; fields.disabled = true; progress.hidden = false; progress.value = 0;
 announce('正在准备图片副本…');
 try {
  const key = receipt && !receipt.confirmed ? receipt.key : hex(crypto.getRandomValues(new Uint8Array(32)));
  const id = `TG-${(await digest(new TextEncoder().encode(key))).slice(0, 24).toUpperCase()}`;
  remember({ id, key, confirmed: false });
  const payload = new FormData();
  for (const [name, value] of data.entries()) {
   if (typeof value !== 'string') continue;
   if (['copies', 'rights', 'privacy', 'processing'].includes(name)) continue;
   payload.append(name, value);
  }
  for (const name of ['copies', 'rights', 'privacy', 'processing']) if (data.get(name) === 'on') payload.append(`consents_${name}`, 'true');
  payload.append('key', key); payload.append('consent_version', '2026-09-05-v1');
  for (const { file } of selected) payload.append('images', file, file.name);
  const result = await upload(payload);
  if (result.id !== id) throw new Error('接收回执需要核实，请先查询进度。');
  showReceipt({ id, key, confirmed: true });
  for (const entry of selected) URL.revokeObjectURL(entry.url);
  selected = []; renderImages(); form.reset(); $('#story-count').textContent = '0 / 3000'; $('#credit-field').hidden = true; $<HTMLInputElement>('#submission-credit').required = false; $<HTMLInputElement>('#submission-contact').type = 'email'; $<HTMLInputElement>('#submission-contact').placeholder = '您常用的邮箱';
  dirty = false; announce('提交完成。请保存上方回执；继续填写可投另一份资料。');
  $('#submission-receipt').focus(); $('#submission-receipt').scrollIntoView({ behavior: 'smooth', block: 'start' });
 } catch (error) { announce(error instanceof Error ? error.message : '投稿未完成，请稍后重试。'); if (receipt) showReceipt(receipt); }
 finally { busy = false; submit.disabled = !available; fields.disabled = false; progress.hidden = true; }
});
const receiptText = () => receipt ? `老旧默片 · 投稿回执\n投稿编号：${receipt.id}\n查询密钥：${receipt.key}\n查询页面：${location.origin}/contribute/#submission-lookup\n接收状态：${receipt.confirmed ? '已收到' : '待查询确认'}\n请勿公开分享查询密钥。` : '';
$('#download-receipt').addEventListener('click', () => {
 if (!receipt) return; const url = URL.createObjectURL(new Blob([receiptText()], { type: 'text/plain;charset=utf-8' }));
 const anchor = document.createElement('a'); anchor.href = url; anchor.download = `${receipt.id}-回执.txt`; anchor.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
});
$('#copy-receipt').addEventListener('click', async () => { try { await navigator.clipboard.writeText(receiptText()); $('#copy-receipt').textContent = '已复制'; } catch { $('#copy-receipt').textContent = '请手动复制或保存回执'; } });
function showLookup(data: { status_label: string; message: string; withdrawal_requested: boolean; status: string; in_preparation: boolean }) {
 lookupResult.textContent = `${data.withdrawal_requested ? '已收到停止处理申请，等待站主核查。' : data.status_label}${data.in_preparation ? '\n已进入档案整理流程；初审通过不等于已公开发布。' : ''}${data.message ? `\n站主的说明：${data.message}` : ''}`;
 $('#withdraw-controls').hidden = data.status === 'withdrawn' || data.withdrawal_requested;
}
lookupForm.addEventListener('input', () => { activeLookup = null; $('#withdraw-controls').hidden = true; lookupResult.textContent = ''; });
lookupForm.addEventListener('submit', async event => {
 event.preventDefault(); const button = lookupForm.querySelector('button')!; if (button.disabled) return;
 button.disabled = true; activeLookup = null; $('#withdraw-controls').hidden = true; lookupResult.textContent = '正在查询…';
 const credentials = { id: lookupId.value.trim().toUpperCase(), key: lookupKey.value.trim() };
 try { const data = await jsonRequest('/api/submissions/lookup', credentials); activeLookup = credentials; showLookup(data); if (receipt?.id === credentials.id) showReceipt({ ...receipt, confirmed: true }); }
 catch (error) { lookupResult.textContent = error instanceof Error ? error.message : '查询失败，请稍后重试。'; }
 finally { button.disabled = false; }
});
$('#withdraw-submission').addEventListener('click', async () => {
 if (!activeLookup) return; const button = $<HTMLButtonElement>('#withdraw-submission'); button.disabled = true;
 try { showLookup(await jsonRequest('/api/submissions/withdraw', activeLookup)); }
 catch (error) { lookupResult.textContent = error instanceof Error ? error.message : '申请未完成，请稍后重试。'; }
 finally { button.disabled = false; }
});
try {
 const saved = JSON.parse(sessionStorage.getItem(storageKey) || 'null');
 if (saved && /^TG-[A-F0-9]{24}$/.test(saved.id) && /^[a-f0-9]{64}$/.test(saved.key)) { remember(saved); if (!saved.confirmed) showReceipt(saved); }
} catch { /* 不持久化表单正文、联系方式或图片。 */ }
if (!secureContext) {
 available = false; submit.disabled = true; service.dataset.unavailable = '';
 service.textContent = '当前访问地址不是安全连接，无法加密处理投稿内容。请改用网站的正式地址（https）访问后再投稿。';
} else void checkService();
