const $ = selector => document.querySelector(selector);
const esc = value => String(value ?? '').replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);
const date = value => new Date(value).toLocaleString('zh-CN', { hour12: false });
let records = [], states = {}, categories = {}, active = null, page = 0, dirty = false, busy = false;
const notify = message => { $('#desk-message').textContent = message; };
const api = async (url, payload) => {
 const response = await fetch(url, payload === undefined ? { cache: 'no-store' } : { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-LJM-Admin-Request': '1' }, body: JSON.stringify(payload) });
 const result = await response.json().catch(() => { throw new Error('无法读取联系收件箱，线上模式请检查是否需要重新登录。'); });
 if (!response.ok) throw new Error(result.error || '操作失败。');
 return result;
};
const badge = record => `<span class="badge${record.category === 'privacy' ? ' privacy' : ''}">${esc(categories[record.category] || record.category)}</span> <span class="badge">${esc(states[record.status] || record.status)}</span>`;

function renderList() {
 const keyword = $('#inbox-search').value.trim().toLowerCase();
 const filter = $('#inbox-filter').value;
 const filtered = records.filter(record => {
  const [kind, value] = filter.split(':');
  const matchesFilter = filter === 'all' || (kind === 'category' ? record.category === value : record.status === value);
  return matchesFilter && `${record.id} ${record.name} ${categories[record.category] || record.category}`.toLowerCase().includes(keyword);
 });
 page = Math.min(page, Math.max(0, Math.ceil(filtered.length / 20) - 1));
 $('#contact-list').innerHTML = filtered.slice(page * 20, page * 20 + 20).map(record => `<button type="button" class="inbox-item" data-id="${esc(record.id)}" aria-pressed="${record.id === active?.id}"><strong>${esc(record.name || '未留称呼')}</strong><small>${esc(record.id)}</small><small>${esc(categories[record.category] || record.category)} · ${esc(date(record.created_at))}</small>${badge(record)}</button>`).join('') || '<p class="hint">没有符合条件的来信。</p>';
 $('#inbox-count').textContent = `共 ${filtered.length} 封，最新来信在前`;
 $('#page-count').textContent = `${page + 1} / ${Math.max(1, Math.ceil(filtered.length / 20))}`;
 $('#previous-page').disabled = page === 0;
 $('#next-page').disabled = (page + 1) * 20 >= filtered.length;
 const stats = [
  ['全部来信', records.length],
  ['隐私问题', records.filter(record => record.category === 'privacy').length],
  ['尚未处理', records.filter(record => record.status === 'received').length],
  ['等待补充', records.filter(record => record.status === 'needs_info').length],
 ];
 $('#contact-stats').innerHTML = stats.map(([label, count]) => `<div class="stat"><strong>${count}</strong><span>${label}</span></div>`).join('');
}

async function refresh() {
 const result = await api('/api/admin/contacts');
 records = result.contacts;
 states = result.states;
 categories = result.categories;
 renderList();
}

function historyLabel(entry) {
 if (entry.action === 'received') return '收到来信';
 if (entry.action === 'review') return `保存处理状态：${states[entry.status] || entry.status}`;
 return entry.action;
}

function renderDetail(record) {
 const fields = record.fields;
 const contactLabel = { email: '电子邮箱', wechat: '微信', phone: '电话', none: '无需回复' }[fields.contact_type] || fields.contact_type;
 const detail = $('#review-detail');
 detail.innerHTML = `<header class="detail-heading"><div><p class="eyebrow">来信详情</p><h2>${esc(categories[fields.category] || fields.category)}</h2><p class="hint">${esc(record.id)}<br>收到于 ${esc(date(record.created_at))}</p></div>${badge(record)}</header>
 ${fields.category === 'privacy' ? '<p class="contact-priority">这是一封隐私相关来信。请优先核对涉及的公开页面；在确认前，不要把来信正文或联系方式复制到公开档案中。</p>' : ''}
 <section class="detail-section"><h3>来信内容</h3><dl class="contact-origin"><dt>相关资料</dt><dd>${esc(fields.reference || '未填写')}</dd><dt>来信页面</dt><dd>${esc(fields.page_path || '未记录')}</dd></dl><p class="contact-message">${esc(fields.message)}</p></section>
 <section class="detail-section"><h3>私密联系方式</h3><dl class="record-data"><dt>称呼</dt><dd>${esc(fields.name || '未填写')}</dd><dt>回复方式</dt><dd>${esc(contactLabel)}</dd><dt>联系方式</dt><dd class="${fields.contact_type === 'none' ? 'contact-no-reply' : ''}">${esc(fields.contact || '来信人选择无需回复')}</dd><dt>保存说明</dt><dd>来信人已同意为处理这次联系而私密保存提交内容。</dd><dt>确认版本</dt><dd>${esc(record.consent.version)} · ${esc(date(record.consent.confirmed_at))}</dd></dl>${fields.contact ? '<button class="contact-copy" type="button" data-copy-contact>复制联系方式</button>' : ''}<p class="hint">联系方式和留言只用于人工处理，不得写入公开档案或网站页面。</p></section>
 <form id="contact-review-form" class="detail-section"><h3>处理记录</h3><label for="review-status">处理状态</label><select id="review-status">${Object.entries(states).map(([key, label]) => `<option value="${esc(key)}" ${key === record.status ? 'selected' : ''}>${esc(label)}</option>`).join('')}</select><label for="review-private">内部备注 <span class="hint">仅管理员可见</span></label><textarea id="review-private" rows="4" maxlength="4000" placeholder="核对过程、线下沟通情况、后续动作…">${esc(record.private_note)}</textarea><label for="review-public">给来信人的说明 <span class="hint">凭查询密钥可见</span></label><textarea id="review-public" rows="3" maxlength="1000" placeholder="例如：相关页面已暂时撤下，正在核对。">${esc(record.public_message)}</textarea><p class="hint">保存状态不会自动发送邮件、微信或短信。需要直接回复时，请使用上方联系方式人工联系；选择“等待补充”或“已回复”时必须填写给来信人的说明。</p><div class="button-row"><button class="primary" type="submit">保存处理结果</button></div></form>
 <details class="detail-section"><summary>处理历史（只读） · ${record.history.length} 条</summary><ol class="history-list">${[...record.history].reverse().map(entry => `<li>${esc(date(entry.at))} · ${esc(historyLabel(entry))}${entry.private_note ? `<br>内部备注：${esc(entry.private_note)}` : ''}${entry.public_message ? `<br>给来信人的说明：${esc(entry.public_message)}` : ''}</li>`).join('')}</ol></details>`;
 detail.querySelector('[data-copy-contact]')?.addEventListener('click', async event => {
  try { await navigator.clipboard.writeText(fields.contact); event.currentTarget.textContent = '已复制'; }
  catch { notify('浏览器没有允许自动复制，请手工选择联系方式。'); }
 });
 const reviewForm = $('#contact-review-form');
 reviewForm.addEventListener('input', () => { dirty = true; });
 reviewForm.addEventListener('submit', saveReview);
 dirty = false;
 requestAnimationFrame(() => detail.focus());
}

async function select(id, force = false) {
 if (!force && dirty && !confirm('当前处理内容尚未保存，确定离开吗？')) return;
 active = await api(`/api/admin/contacts/${id}`);
 renderList();
 renderDetail(active);
}

async function saveReview(event) {
 event.preventDefault();
 if (!active || busy) return;
 busy = true;
 const button = event.currentTarget.querySelector('button[type="submit"]');
 button.disabled = true;
 notify('正在保存处理结果…');
 try {
  active = await api(`/api/admin/contacts/${active.id}/review`, {
   revision: active.revision,
   status: $('#review-status').value,
   private_note: $('#review-private').value,
   public_message: $('#review-public').value,
  });
  dirty = false;
  await refresh();
  renderDetail(active);
  notify('处理结果已保存。');
 } catch (error) {
  notify(error.message);
 } finally {
  busy = false;
  button.disabled = false;
 }
}

$('#contact-list').addEventListener('click', event => {
 const button = event.target.closest('[data-id]');
 if (button) select(button.dataset.id).catch(error => notify(error.message));
});
$('#inbox-search').addEventListener('input', () => { page = 0; renderList(); });
$('#inbox-filter').addEventListener('change', () => { page = 0; renderList(); });
$('#previous-page').addEventListener('click', () => { page--; renderList(); });
$('#next-page').addEventListener('click', () => { page++; renderList(); });
$('#refresh-contacts').addEventListener('click', async () => {
 if (dirty && !confirm('当前处理内容尚未保存，确定刷新吗？')) return;
 try { await refresh(); if (active) await select(active.id, true); notify('联系收件箱已刷新。'); }
 catch (error) { notify(error.message); }
});
window.addEventListener('beforeunload', event => { if (dirty) { event.preventDefault(); event.returnValue = ''; } });
refresh().catch(error => notify(error.message));
