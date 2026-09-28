const $ = selector => document.querySelector(selector);
const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const date = value => new Date(value).toLocaleString('zh-CN', { hour12: false });
let records = [], states = {}, checks = [], active = null, page = 0, dirty = false, busy = false, loading = 0;
const notify = message => { $('#desk-message').textContent = message; };
const api = async (url, payload) => {
 const response = await fetch(url, payload === undefined ? { cache: 'no-store' } : { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-LJM-Admin-Request': '1' }, body: JSON.stringify(payload) });
 const result = await response.json().catch(() => { throw new Error('无法读取审核区，线上模式请检查是否需要重新登录。'); });
 if (!response.ok) throw new Error(result.error || '操作失败。'); return result;
};
const badge = r => `<span class="badge${r.withdrawal_requested ? ' alert' : ''}">${esc(r.withdrawal_requested ? '停止处理申请' : states[r.status] || (r.status === 'draft' ? '草稿（未提交）' : r.status))}</span>`;
// 账号投稿与免注册投稿必须一眼可分；账号已被暂停或正在注销时一并提示。
const accountBadge = r => {
 if (!r.account) return '<span class="badge">免注册投稿</span>';
 const note = r.account.status === 'suspended' ? '（已暂停）' : r.account.status === 'pending_deletion' ? '（注销处理中）' : r.account.status === 'missing' ? '（账号不存在）' : '';
 return `<span class="badge">账号投稿 · ${esc(r.account.nickname || '未设昵称')}${note}</span>`;
};
const historyLabels = {
 received: '收到投稿', review: h => `保存审核：${states[h.status] || ''}`, withdrawal_requested: '投稿人申请停止处理',
 draft_created: h => `转为草稿 ${h.item_id || ''}`, draft_created_by_user: '投稿人新建草稿', draft_saved: '投稿人保存草稿',
 submitted: h => `投稿人提交第 ${h.revision || ''} 版`, withdrawn_to_draft: '投稿人撤回，回到草稿', draft_discarded: '投稿人将草稿移入回收区',
 claimed: '投稿人关联了这份旧投稿', change_requested: '投稿人申请修改已公开内容', removal_requested: '投稿人申请撤下已公开内容',
};
function renderList() {
 const keyword = $('#inbox-search').value.trim().toLowerCase(); const filter = $('#inbox-filter').value;
 const filtered = records.filter(r => {
  const stateMatch = filter === 'all'
   || (filter === 'withdrawal' ? r.withdrawal_requested : filter === 'account' ? Boolean(r.account) : r.status === filter);
  return stateMatch && `${r.id} ${r.title} ${r.category}`.toLowerCase().includes(keyword);
 });
 page = Math.min(page, Math.max(0, Math.ceil(filtered.length / 20) - 1));
 $('#submission-list').innerHTML = filtered.slice(page * 20, page * 20 + 20).map(r => `<button type="button" class="inbox-item" data-id="${esc(r.id)}" aria-pressed="${r.id === active?.id}"><strong>${esc(r.title)}</strong><small>${esc(r.id)}</small><small>${esc(r.category)} · ${r.image_count} 张 · ${esc(date(r.created_at))}</small>${badge(r)}${accountBadge(r)}${r.people !== 'none' ? ' <span class="badge alert">人物需核实</span>' : ''}${r.linked_item_id ? '<small>已转入档案草稿</small>' : ''}</button>`).join('') || '<p class="hint">没有符合条件的投稿。</p>';
 $('#inbox-count').textContent = `共 ${filtered.length} 份，最新投稿在前`;
 $('#page-count').textContent = `${page + 1} / ${Math.max(1, Math.ceil(filtered.length / 20))}`;
 $('#previous-page').disabled = page === 0; $('#next-page').disabled = (page + 1) * 20 >= filtered.length;
 const stats = [['全部来稿', records.length], ['待审核', records.filter(r => r.status === 'pending').length], ['待补充', records.filter(r => r.status === 'needs_info').length], ['停止处理申请', records.filter(r => r.withdrawal_requested).length]];
 $('#submission-stats').innerHTML = stats.map(([label, count]) => `<div class="stat"><strong>${count}</strong><span>${label}</span></div>`).join('');
}
async function refresh() {
 const result = await api('/api/admin/submissions'); records = result.submissions; states = result.states; checks = result.privacy_checks; renderList();
}
function renderDetail(r) {
 const f = r.fields; const frozen = Boolean(r.linked_item_id || r.status === 'withdrawn' || r.withdrawal_requested || r.status === 'draft');
 const contactLabel = { email: '电子邮箱', wechat: '微信', phone: '电话' }[f.contact_type];
 const peopleLabel = { none: '投稿人表示没有', yes: '涉及真实人物，必须人工判断', unsure: '投稿人无法确定，必须人工判断' }[f.people];
 const detail = $('#review-detail');
 detail.innerHTML = `<header class="detail-heading"><div><p class="eyebrow">来稿详情</p><h2>${esc(f.title)}</h2><p class="hint">${esc(r.id)}<br>收到于 ${esc(date(r.created_at))}</p></div>${badge(r)}</header>
 ${r.withdrawal_requested ? `<p class="notice warning">投稿人已申请停止处理。请检查关联草稿 ${esc(r.linked_item_id)}；若内容已公开，请在档案管理中按撤销流程处理，并在回复中告知结果。不要继续发布。</p>` : ''}
 ${r.status === 'withdrawn' ? '<p class="notice">投稿人已停止这份投稿的处理，不能转入草稿。资料保持私密留存。</p>' : ''}
 <section class="detail-section"><h3>资料介绍</h3><dl class="record-data"><dt>资料类型</dt><dd>${esc(f.category)}</dd><dt>大致年代</dt><dd>${esc(f.era || '未填写')}</dd><dt>大致地点</dt><dd>${esc(f.place || '未填写')}</dd><dt>真实人物</dt><dd>${esc(peopleLabel)}</dd><dt>来源与授权依据</dt><dd>${esc(f.source_note || '未填写')}</dd></dl><p class="long-copy">${esc(f.description)}</p></section>
 ${r.account ? `<section class="detail-section"><h3>投稿人账号</h3><dl class="record-data"><dt>昵称</dt><dd>${esc(r.account.nickname || '未设置')}</dd><dt>账号状态</dt><dd>${esc(r.account.status_label)}</dd><dt>署名意愿</dt><dd>${esc(f.attribution === 'named' ? f.credit : '匿名')}</dd><dt>授权记录</dt><dd>${esc(r.consent.confirmed_at ? `${r.consent.version} · ${date(r.consent.confirmed_at)}` : '尚未提交审核')}</dd></dl><p class="hint">账号投稿不重复收集联系方式。需要补充材料时，请写在下方"给投稿人的说明"里，投稿人登录后可以看到，并可选择接收邮件提醒。</p></section>` : `<section class="detail-section"><h3>私密联系与授权</h3><dl class="record-data"><dt>称呼</dt><dd>${esc(f.name)}</dd><dt>${esc(contactLabel)}</dt><dd>${esc(f.contact)}</dd><dt>署名意愿</dt><dd>${esc(f.attribution === 'named' ? f.credit : '匿名')}</dd><dt>授权确认</dt><dd>投稿人确认：副本与原件分离；有权提供并允许本站整理展示；已检查隐私；同意为审核沟通私密保存。</dd><dt>授权版本</dt><dd>${esc(r.consent.version)} · ${esc(date(r.consent.confirmed_at))}</dd></dl><p class="hint">投稿人的勾选只是来源声明，仍需人工核实。联系方式和内部记录不会复制到档案数据中。</p></section>`}
${r.status === 'draft' ? '<p class="notice">这是投稿人尚未提交的草稿，只能查看，请不要在这里改变审核状态。' : ''}
 <section class="detail-section"><h3>图片副本 <span class="hint">${r.images.length} 张 · 点击图片放大核对</span></h3><div class="review-images">${r.images.map((image, index) => `<div class="review-image"><a href="/api/admin/submissions/${r.id}/${esc(image.filename)}" target="_blank" rel="noopener noreferrer"><img src="/api/admin/submissions/${r.id}/${esc(image.filename)}" alt="投稿图片 ${index + 1}，点击打开大图" width="260" height="170" loading="lazy"></a><p>${index + 1}. ${esc(image.original_name)}${image.note ? ` · ${esc(image.note)}` : ''}</p><label class="choice"><input type="checkbox" name="selected-image" value="${esc(image.filename)}" ${frozen ? 'disabled' : ''}><span>确认此图可转入草稿</span></label></div>`).join('')}</div><p class="hint">系统已重新生成最长边不超过 2400 像素的 JPEG 副本并去除内嵌元数据。图片中可见的敏感内容仍须逐张人工检查；需要遮盖的图片请留在私密审核区，联系投稿人提供处理后的新副本。</p></section>
 <form id="review-form" class="detail-section"><h3>审核处理</h3><label for="review-status">审核状态</label><select id="review-status" ${frozen ? 'disabled' : ''}>${Object.entries(states).filter(([key]) => key !== 'withdrawn' || r.status === 'withdrawn').map(([key, label]) => `<option value="${key}" ${key === r.status ? 'selected' : ''}>${esc(label)}</option>`).join('')}</select><label class="choice"><input id="rights-reviewed" type="checkbox"><span>我已人工核对来源与授权，可以通过初审。通过初审仅表示值得整理。</span></label><label for="review-private">内部备注 <span class="hint">仅管理员可见</span></label><textarea id="review-private" rows="3" maxlength="4000" placeholder="核实要点、沟通记录、需要处理的隐私问题…">${esc(r.private_note)}</textarea><label for="review-public">给投稿人的说明 <span class="hint">投稿人凭密钥查询时可见</span></label><textarea id="review-public" rows="3" maxlength="1000" placeholder="例如：资料很有价值，请补充背面的文字含义。后续将通过您留下的方式联系。">${esc(r.public_message)}</textarea><p class="hint">待补充、暂不采用时必须说明原因。保存后可通过查询页看到，不会自动发送邮件或短信。</p><div class="button-row"><button class="primary" type="submit">保存审核结果</button></div></form>
 <section class="detail-section">${r.linked_item_id ? `<h3>已转入档案整理</h3><p class="notice">关联档案：${esc(r.linked_item_id)}。请在档案管理中继续补全信息、检查隐私和正式发布。</p><a href="/admin/?item=${esc(r.linked_item_id)}">打开关联档案草稿 →</a>` : r.status === 'approved' && !r.withdrawal_requested ? `<details id="transfer-section"><summary>下一步：人工确认后转为未公开草稿</summary><p class="notice">选择上方确认可用的图片，逐项完成隐私检查，再填写整理后的题名与介绍。不要把联系方式或未经核实的人物身份带入公开文字。</p><form id="transfer-form"><label for="draft-title">整理后的题名</label><input id="draft-title" required minlength="2" maxlength="80" value="${esc(f.title)}"><label for="draft-description">整理后的公开介绍</label><textarea id="draft-description" rows="4" maxlength="3000" placeholder="人工整理后填写；如尚未整理，可先留空。"></textarea><div class="field-row"><div><label for="draft-type">正式藏品类型</label><select id="draft-type" required><option value="">请人工选择</option>${Object.entries({ PHO: '照片正片', NEG: '底片', SLD: '反转片', ALB: '相册', PCD: '照片明信片', PST: '明信片', DIA: '日记', NTB: '笔记本', IDC: '证件', LET: '信件', RPR: '复制件', OTH: '其他' }).map(([code, label]) => `<option value="${code}">${code} · ${label}</option>`).join('')}</select></div><div><label for="draft-date">实际接收或获得日期</label><input id="draft-date" type="date" required></div></div><p class="hint">该日期用于分配永久编号，并非资料形成的年代。卡片尚无正式专属类型，请先确认分类规则。</p><div class="checks">${checks.map((label, index) => `<label class="choice"><input type="checkbox" name="privacy-check" required><span>${index + 1}. ${esc(label)}</span></label>`).join('')}</div><p class="hint">任一项不确定，请停止转入并继续人工核实。这里不提供“一键全选”。</p><div class="button-row"><button class="primary" type="submit">确认转为未公开草稿</button></div></form></details>` : '<p class="hint">初审通过后，这里会出现“转为未公开草稿”的操作。正式发布仍执行现有字段、隐私、图片和网站构建检查。</p>'}</section>
 <details class="detail-section"><summary>处理记录（只读） · ${r.history.length} 条</summary><ol class="history-list">${[...r.history].reverse().map(h => `<li>${esc(date(h.at))} · ${esc(historyLabels[h.action] ? (typeof historyLabels[h.action] === 'function' ? historyLabels[h.action](h) : historyLabels[h.action]) : h.action)}${h.private_note ? `<br>内部备注：${esc(h.private_note)}` : ''}${h.public_message ? `<br>给投稿人的说明：${esc(h.public_message)}` : ''}</li>`).join('')}</ol></details>`;
 detail.querySelectorAll('input,textarea,select').forEach(input => input.addEventListener('input', () => { dirty = true; }));
 $('#review-form').addEventListener('submit', saveReview);
 $('#transfer-form')?.addEventListener('submit', transfer);
}
async function select(id, force = false) {
 if (busy || (!force && dirty && !window.confirm('当前有尚未保存的审核内容，确定离开吗？'))) return;
 const token = ++loading;
 try { const record = await api(`/api/admin/submissions/${id}`); if (token !== loading) return; active = record; dirty = false; renderDetail(record); renderList(); }
 catch (error) { notify(error.message); }
}
async function mutate(operation) {
 if (busy) return;
 busy = true; $('#review-detail').querySelectorAll('button').forEach(b => b.disabled = true); notify('正在保存，请稍候…');
 try { await operation(); dirty = false; await refresh(); busy = false; await select(active.id, true); }
 catch (error) { notify(error.message); }
 finally { busy = false; $('#review-detail').querySelectorAll('button').forEach(b => b.disabled = false); }
}
async function saveReview(event) {
 event.preventDefault();
 const payload = { revision: active.revision, status: $('#review-status').value, rights_reviewed: $('#rights-reviewed').checked, private_note: $('#review-private').value, public_message: $('#review-public').value };
 await mutate(async () => { await api(`/api/admin/submissions/${active.id}/review`, payload); notify('审核结果已保存。给投稿人的说明可在查询页查看。'); });
}
async function transfer(event) {
 event.preventDefault();
 if ($('#review-status').value !== active.status || $('#review-private').value !== active.private_note || $('#review-public').value !== active.public_message) { notify('请先保存上方审核结果，再转入草稿。'); return; }
 const payload = { revision: active.revision, title: $('#draft-title').value, description: $('#draft-description').value, object_type: $('#draft-type').value, accession_date: $('#draft-date').value, images: [...document.querySelectorAll('[name=selected-image]:checked')].map(i => i.value), checks: [...document.querySelectorAll('[name=privacy-check]')].map(i => i.checked) };
 await mutate(async () => { const result = await api(`/api/admin/submissions/${active.id}/transfer`, payload); notify(`已生成未公开草稿 ${result.item_id}，请进入档案管理继续整理。`); });
}
$('#submission-list').addEventListener('click', event => { const button = event.target.closest('[data-id]'); if (button) void select(button.dataset.id); });
for (const selector of ['#inbox-search', '#inbox-filter']) $(selector).addEventListener('input', () => { page = 0; renderList(); });
$('#previous-page').addEventListener('click', () => { page--; renderList(); }); $('#next-page').addEventListener('click', () => { page++; renderList(); });
$('#refresh-submissions').addEventListener('click', async () => {
 if (busy || (dirty && !window.confirm('当前有未保存内容，确定刷新吗？'))) return;
 try { await refresh(); if (active) await select(active.id, true); notify('收件箱已刷新。'); } catch (error) { notify(error.message); }
});
window.addEventListener('beforeunload', event => { if (dirty || busy) { event.preventDefault(); event.returnValue = ''; } });
refresh().catch(error => notify(error.message));
