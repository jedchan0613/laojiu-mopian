// 8.2 人工审核客户端：线上不接通整册交接，不提供线上 PDF。
(() => {
  'use strict';

  const $ = id => document.getElementById(id);
  const node = (tag, text = '') => {
    const element = document.createElement(tag);
    element.textContent = text;
    return element;
  };
  const rawId = new URLSearchParams(location.search).get('id');
  const submissionId = typeof rawId === 'string' ? rawId.trim().toUpperCase() : '';
  const validSubmissionId = /^TG-[A-F0-9]{24}$/.test(submissionId);
  const base = '/api/admin/manual-submissions/' + submissionId;
  const storageKey = 'manual-review.pending.' + submissionId;
  const textFields = [
    'review-public', 'review-private', 'basis-model', 'basis-source', 'basis-rights',
    'transfer-title', 'transfer-product', 'transfer-region', 'transfer-edition',
    'transfer-description', 'transfer-type', 'transfer-date', 'transfer-source-name',
    'transfer-source-date', 'transfer-source-available'
  ];
  const errorMessages = {
    auth: '登录状态或审核权限已失效，请重新登录后核对；当前填写已保留。',
    login: '服务返回了非 JSON 页面，可能需要重新登录；当前填写已保留。',
    nonjson: '无法核对服务的 JSON 响应；当前填写已保留，请查询操作回执。',
    timeout: '请求超时，不能据此判断操作是否完成；当前填写已保留。',
    network: '连接未能完成，不能据此判断操作是否完成；当前填写已保留。',
    http: '服务未确认本次请求完成，请核对权限、记录状态和操作回执。',
    detail: '未能读取可核对的本册详情；当前填写已保留。',
    id: '请从投稿收件箱选择一份说明书。',
    binding: '本次提交的版本绑定不完整，请重新读取并核对。',
    uuid: '浏览器无法生成安全操作编号，请使用支持安全 UUID 的本机浏览器。'
  };

  class ClientError extends Error {
    constructor(code, status = 0, operation = null) {
      super(errorMessages[code] || errorMessages.network);
      this.code = code;
      this.status = status;
      this.operation = operation;
    }
  }

  const isObject = value => Boolean(value) && typeof value === 'object' && !Array.isArray(value);
  const isUuid = value => typeof value === 'string' && /^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(value);
  const operationKey = op => op.id + '/' + op.step;
  const safeError = error => error instanceof ClientError ? error.message : errorMessages.network;
  const modeOf = detail => ['local', 'online'].includes(detail?.context?.adminMode) ? detail.context.adminMode : 'unknown';
  const display = value => typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean' ? String(value) : '未注明';
  const say = (text, error = false) => {
    $('review-message').textContent = text;
    $('review-message').dataset.error = String(error);
  };

  function statusOf(value) {
    if (typeof value !== 'string') return 'unknown';
    const status = value.toLowerCase().replace(/-/g, '_');
    if (status === 'success' || status === 'succeeded') return 'success';
    if (status === 'canceled' || status === 'cancelled') return 'cancelled';
    if (['failed', 'queued', 'running', 'needs_review'].includes(status)) return status;
    if (status === 'pending') return 'queued';
    return 'unknown';
  }

  function actionOf(value) {
    if (['review', 'manual-review', 'manual_review', 'manual.review'].includes(value)) return 'review';
    if (['transfer', 'manual-transfer', 'manual_transfer', 'manual.transfer'].includes(value)) return 'transfer';
    return 'unknown';
  }

  function dateIso(value) {
    if (typeof value !== 'string' || !value) return '';
    const date = new Date(value);
    return Number.isFinite(date.getTime()) ? date.toISOString() : '';
  }

  function dateLabel(value) {
    const iso = dateIso(value);
    return iso ? new Date(iso).toLocaleString('zh-CN') : '时间未记录';
  }

  function targetMatches(value, scoped) {
    if (value === undefined || value === null) return scoped;
    if (typeof value === 'string') return value === submissionId || value === base;
    if (isObject(value)) return value.id === submissionId || value.submission_id === submissionId;
    return false;
  }

  function receiptIdentity(raw) {
    return {
      id: raw.operationId ?? raw.operation_id ?? raw.id,
      step: raw.stepId ?? raw.step_id ?? raw.step
    };
  }

  function safeReceipt(raw) {
    if (!isObject(raw)) return null;
    const identity = receiptIdentity(raw);
    const result = {status: statusOf(raw.status)};
    if (identity.id !== undefined) result.operationId = isUuid(identity.id) ? identity.id.toLowerCase() : 'invalid';
    if (identity.step !== undefined) result.stepId = isUuid(identity.step) ? identity.step.toLowerCase() : 'invalid';
    return result;
  }

  function receiptStatus(raw, op, requireIdentity = false) {
    if (!isObject(raw)) return null;
    const identity = receiptIdentity(raw);
    if (identity.id !== undefined && String(identity.id).toLowerCase() !== op.id) return null;
    if (identity.step !== undefined && String(identity.step).toLowerCase() !== op.step) return null;
    if (requireIdentity && identity.id === undefined && identity.step === undefined) return null;
    if (!targetMatches(raw.target, true)) return null;
    if (mode === 'online' && op.action === 'transfer' && (!isUuid(identity.id) || !isUuid(identity.step))) return 'needs_review';
    if (mode === 'online' && op.action === 'transfer' && statusOf(raw.status) === 'success' && !transferProof(raw, op)) return 'needs_review';
    return statusOf(raw.status);
  }

  function transferProof(raw, op) {
    const proof = raw?.result?.manualTransfer;
    const submitted = latest();
    const scope = submitted?.manual_metadata?.sharing_scope;
    const expectedRevision = op.body?.submitted_revision ?? submitted?.revision;
    const expectedDigest = op.body?.snapshot_digest ?? submitted?.digest;
    if (!isObject(proof) || proof.submissionId !== submissionId || !Number.isSafeInteger(proof.revision) || proof.revision < 1 ||
        proof.submittedRevision !== expectedRevision || proof.snapshotDigest !== expectedDigest || !/^[a-f0-9]{64}$/.test(proof.snapshotDigest || '') ||
        typeof proof.manualKey !== 'string' || !/^manual-[a-f0-9]{24}$/.test(proof.manualKey) || proof.sharingScope !== scope) return false;
    return scope === 'official-link' ? proof.itemId === null && proof.pages === 0 : scope === 'reading-copy' &&
      typeof proof.itemId === 'string' && /^LJM-\d{8}-(?:RPR|OTH)-\d{3}$/.test(proof.itemId) && proof.pages === images(submitted).length && proof.pages > 0;
  }

  async function request(url, options = {}) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 20000);
    try {
      const init = Object.assign({cache: 'no-store', credentials: 'same-origin', redirect: 'error'}, options, {signal: controller.signal});
      const response = await fetch(url, init);
      if (response.status === 401 || response.status === 403) throw new ClientError('auth', response.status);
      const type = response.headers?.get('content-type') || '';
      if (type && !/^application\/(?:[a-z0-9._+-]+\+)?json(?:\s*;|$)/i.test(type)) {
        throw new ClientError('login', response.status);
      }
      let result;
      try {
        result = await response.json();
      } catch {
        throw new ClientError('nonjson', response.status);
      }
      if (!isObject(result)) throw new ClientError('nonjson', response.status);
      if (!response.ok) throw new ClientError('http', response.status, safeReceipt(result.operation));
      return result;
    } catch (error) {
      if (error instanceof ClientError) throw error;
      throw new ClientError(controller.signal.aborted ? 'timeout' : 'network');
    } finally {
      clearTimeout(timer);
    }
  }

  function readMarker() {
    if (!validSubmissionId) return null;
    try {
      const raw = sessionStorage.getItem(storageKey);
      if (!raw) return null;
      const value = JSON.parse(raw);
      if (!isObject(value) || !isUuid(value.id) || !isUuid(value.step) || value.target !== submissionId) return null;
      if (!['review', 'transfer', 'unknown'].includes(value.action) || !dateIso(value.at)) return null;
      return {
        id: value.id.toLowerCase(), step: value.step.toLowerCase(), action: value.action,
        target: submissionId, at: dateIso(value.at), status: 'unknown', noReceipt: false
      };
    } catch {
      return null;
    }
  }

  function storeMarker(op) {
    try {
      sessionStorage.setItem(storageKey, JSON.stringify({
        id: op.id, step: op.step, action: op.action, target: submissionId,
        at: dateIso(op.at) || new Date().toISOString()
      }));
    } catch {
      // 存储不可用时仍由当前页面的内存标记阻止重复写入。
    }
  }

  function removeMarker() {
    try {
      sessionStorage.removeItem(storageKey);
    } catch {
      // 存储异常不改变已经核对的服务结果。
    }
  }

  let data = null;
  let capabilities = {};
  let mode = 'unknown';
  let selectedRevision = 0;
  let pageIndex = 0;
  let busy = false;
  let dirty = false;
  let pending = readMarker();
  let recentRows = [];
  let remoteOpen = [];
  const knownTerminal = new Map();
  const failedRevisions = new Set();

  function normalizeRow(raw) {
    if (!isObject(raw) || !targetMatches(raw.target, true)) return null;
    const identity = receiptIdentity(raw);
    if (!isUuid(identity.id) || !isUuid(identity.step)) return null;
    const row = {
      id: identity.id.toLowerCase(), step: identity.step.toLowerCase(),
      action: actionOf(raw.action ?? raw.kind), target: submissionId,
      at: dateIso(raw.at ?? raw.createdAt ?? raw.created_at ?? raw.startedAt ?? raw.updatedAt),
      status: statusOf(raw.status)
    };
    if (knownTerminal.has(operationKey(row))) row.status = knownTerminal.get(operationKey(row));
    return row;
  }

  function rowsFrom(detail) {
    const seen = new Set();
    const rows = [];
    for (const raw of Array.isArray(detail.recent_operations) ? detail.recent_operations : []) {
      const row = normalizeRow(raw);
      if (!row || seen.has(operationKey(row))) continue;
      seen.add(operationKey(row));
      rows.push(row);
    }
    return rows;
  }

  const terminal = status => ['success', 'failed', 'cancelled'].includes(status);

  function activateNext() {
    if (pending) return;
    const next = remoteOpen.find(row => !terminal(row.status));
    if (!next) return;
    pending = Object.assign({}, next, {at: next.at || new Date().toISOString(), noReceipt: false});
    storeMarker(pending);
  }

  function rememberResult(op, status) {
    knownTerminal.set(operationKey(op), status);
    const row = {
      id: op.id, step: op.step, action: op.action, target: submissionId,
      at: op.at || new Date().toISOString(), status
    };
    recentRows = [row].concat(recentRows.filter(item => operationKey(item) !== operationKey(op)));
    remoteOpen = remoteOpen.filter(item => operationKey(item) !== operationKey(op));
  }

  function clearActive(op) {
    if (pending && operationKey(pending) === operationKey(op)) {
      pending = null;
      removeMarker();
    }
    remoteOpen = remoteOpen.filter(row => operationKey(row) !== operationKey(op));
    activateNext();
  }

  function versions() {
    const all = Array.isArray(data?.record?.versions) ? data.record.versions : [];
    return all.filter(v => isObject(v) && Number.isSafeInteger(v.revision) && v.revision > 0 && (v.manual_metadata || v.restricted === true || v.source_format === 'pdf'));
  }

  const version = () => versions().find(v => v.revision === selectedRevision);
  const latest = () => versions().find(v => v.revision === data?.record?.manual_submitted_revision);
  const images = v => Array.isArray(v?.images) ? v.images : [];
  const pdfReading = v => v?.source_format === 'pdf' && v?.manual_metadata?.sharing_scope === 'reading-copy';

  function restricted(v) {
    if (!v) return false;
    const pdf = v.source_format === 'pdf' || Boolean(v.pdf) || (v.revision === data?.record?.manual_submitted_revision && data?.record?.source_format === 'pdf');
    return v.restricted === true || (mode !== 'local' && pdf);
  }

  function cap(name) {
    const value = capabilities[name];
    return Number.isSafeInteger(value) && value >= 0 ? value : null;
  }

  function capLabel(name) {
    const value = cap(name);
    return value === null ? '未声明' : 'v' + value;
  }

  function reviewService() {
    return mode !== 'unknown' && cap('manualReviewVersion') === 1 && data?.context?.reviewWritable === true;
  }

  function transferService() {
    if (cap('manualReviewVersion') !== 1) return false;
    if (mode === 'local') return Object.hasOwn(capabilities, 'manualTransferVersion') ? cap('manualTransferVersion') === 1 : true;
    return mode === 'online' && cap('manualTransferVersion') === 1 && data?.context?.transferWritable === true && !restricted(latest());
  }

  function transferUnavailable() {
    if (mode === 'unknown') return '模式尚未确认，整册转草稿不可用。';
    if (mode === 'local') return '当前本机服务尚未开放整册转草稿。';
    if (restricted(latest())) return '线上PDF整册转草稿尚未开放，资料仍保留在私密区。';
    const reasons = {
      '线上说明书审核尚未开启。': '线上审核尚未开放，整册转草稿暂不可用。',
      '线上说明书转入尚未开启。': '线上整册转草稿尚未开放，审核通过仍未公开。',
      '线上说明书目录维护尚未开启。': '说明书目录维护尚未开放，整册转草稿暂不可用。',
      '线上说明书转入仅支持 Linux。': '当前服务器环境不支持整册转草稿。',
      catalog_unavailable: '说明书目录暂不可用，仍可继续人工审核；请稍后核对转草稿。',
      medicine_workspace_unavailable: '药品说明书转入暂未开放，现有资料可查看。',
      medicine_catalog_paused: '当前目录含药品，药品维护暂停期间整份目录只读，审核记录仍可查看。',
      catalog_disabled: '说明书目录维护尚未开放，仍可继续人工审核。',
      disabled: '线上整册转草稿尚未开放，审核通过仍未公开。'
    };
    return reasons[data?.context?.transferWriteReason] || '线上整册转草稿当前不可用，仍可按现有权限人工审核。';
  }

  function currentVersion() {
    const v = version();
    return Boolean(v) && v.revision === data?.record?.manual_submitted_revision;
  }

  function stoppedOrHandedOff() {
    const r = data?.record;
    return !r || Boolean(r.withdrawal_requested || r.manual_handoff || r.linked_item_id);
  }

  function canReview() {
    return reviewService() && currentVersion() && !restricted(version()) && Boolean(version()?.manual_metadata) &&
      ['pending', 'needs_info', 'declined', 'approved'].includes(data?.record?.status) && !stoppedOrHandedOff();
  }

  function validityGood() {
    return data?.record?.review_validity?.valid === true;
  }

  function canTransfer() {
    const r = data?.record;
    const v = latest();
    const pdfBlocked = pdfReading(v) && (cap('manualPdfHandoffVersion') !== 1 || Boolean(r?.pdf_review?.problems?.length));
    return transferService() && reviewService() && currentVersion() && !restricted(v) && r?.status === 'approved' &&
      !stoppedOrHandedOff() && Boolean(r?.manual_review_binding) && validityGood() && !pdfBlocked &&
      /^[a-f0-9]{64}$/.test(data?.catalog_revision || '');
  }

  function publicOfficialUrl(raw) {
    if (typeof raw !== 'string' || !raw || raw.length > 2048) return null;
    for (let i = 0; i < raw.length; i++) {
      const code = raw.charCodeAt(i);
      if (code <= 32 || code === 127 || code === 92) return null;
    }
    try {
      const url = new URL(raw);
      if (url.protocol !== 'https:' || url.username || url.password || (url.port && url.port !== '443')) return null;
      const host = url.hostname.toLowerCase();
      if (!host || host.includes(':') || host.includes('[') || host.endsWith('.')) return null;
      if (/^\d+\.\d+\.\d+\.\d+$/.test(host)) {
        const parts = host.split('.').map(Number);
        const a = parts[0], b = parts[1], c = parts[2];
        if (parts.some(n => n < 0 || n > 255) || a === 0 || a === 10 || a === 127 || a >= 224) return null;
        if (a === 100 && b >= 64 && b <= 127 || a === 169 && b === 254 || a === 172 && b >= 16 && b <= 31) return null;
        if (a === 192 && (b === 168 || b === 0 || b === 88 && c === 99)) return null;
        if (a === 198 && (b === 18 || b === 19 || b === 51 && c === 100) || a === 203 && b === 0 && c === 113) return null;
        return url.href;
      }
      const labels = host.split('.');
      if (host.length > 253 || labels.length < 2 || labels.some(label => !/^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(label))) return null;
      if (!/^(?:[a-z]{2,63}|xn--[a-z0-9-]{2,59})$/.test(labels[labels.length - 1])) return null;
      const privateSuffixes = ['localhost', 'local', 'localdomain', 'internal', 'intranet', 'lan', 'home', 'corp', 'private', 'test', 'invalid', 'example', 'onion', 'arpa'];
      if (privateSuffixes.some(suffix => host === suffix || host.endsWith('.' + suffix))) return null;
      return url.href;
    } catch {
      return null;
    }
  }

  function approvalProblem() {
    const v = version();
    if (!v || restricted(v)) return '本版本只读，不能保存通过。';
    if (failedRevisions.has(v.revision)) return '本版有页图读取失败，不能保存通过；仍可反馈需要补充或暂不采用。';
    if (!Array.isArray(data.checks) || data.checks.length !== 4 || !data.checks.every(x => typeof x === 'string') ||
        !Array.isArray(data.privacy_checks) || data.privacy_checks.length !== 13 || !data.privacy_checks.every(x => typeof x === 'string')) {
      return '本次17项人工检查不完整，请重新读取并核对。';
    }
    if (v.manual_metadata?.sharing_scope === 'reading-copy' && !images(v).length) return '本次阅读副本没有可读取页图，不能保存通过。';
    if (v.manual_metadata?.sharing_scope === 'official-link' && !publicOfficialUrl(v.manual_metadata.official_url)) return '官方来源不是可安全打开的 HTTPS 公网入口，请先要求补充。';
    if (pdfReading(v) && (mode !== 'local' || !Array.isArray(data.pdf_checks) || data.pdf_checks.length !== 4 || !data.pdf_checks.every(x => typeof x === 'string'))) return 'PDF的4项补充人工检查不完整，不能保存通过。';
    if (pdfReading(v) && data.record.pdf_review?.problems?.length) return 'PDF处理记录仍需核对，不能保存通过；可以先反馈需要补充。';
    return '';
  }

  function checksIn(id) {
    return Array.from($(id).querySelectorAll('input'));
  }

  function resetConfirmations() {
    $('review-decision').value = '';
    $('approval-checks').hidden = true;
    for (const id of ['manual-checks', 'privacy-checks', 'pdf-checks']) {
      for (const input of checksIn(id)) input.checked = false;
    }
    $('transfer-confirm').checked = false;
  }

  function readTextFields() {
    const values = Object.create(null);
    for (const id of textFields) values[id] = $(id).value;
    return values;
  }

  function checkboxes(id, labels) {
    const box = $(id);
    box.replaceChildren();
    for (const text of Array.isArray(labels) ? labels : []) {
      if (typeof text !== 'string') continue;
      const label = node('label');
      label.className = 'choice';
      const input = node('input');
      input.type = 'checkbox';
      input.checked = false;
      label.append(input, node('span', text));
      box.append(label);
    }
  }

  const selectedMedicines=new Set();
  const medicineRoles={manufacturer:'生产企业',holder:'上市许可持有人',unverified:'原件署名'};
  function medicineLabel(medicine) {
    const companies=(medicine.companies || []).map(row=>[medicineRoles[row.role],row.name].filter(Boolean).join(' '));
    const names=[...new Set([medicine.generic_name,medicine.original_title,medicine.trade_name].filter(Boolean))];
    return [...names,medicine.dosage_form,medicine.strength,...companies,medicine.approval_number].filter(Boolean).join(' · ');
  }
  function updateMedicineOptions(){
    const existing=$('medicine-match-mode').value==='existing';
    $('medicine-existing').hidden=!existing;
    const box=$('medicine-match-options');
    box.replaceChildren();
    if(!existing)return;
    const words=$('medicine-match-search').value.normalize('NFKC').toLowerCase().trim().split(/\s+/).filter(Boolean);
    const candidates=(data.medicine_candidates || []).filter(row=>isObject(row) && typeof row.medicine_key==='string');
    const matches=candidates.filter(row=>words.every(word=>medicineLabel(row).normalize('NFKC').toLowerCase().includes(word)));
    const visible=matches.slice(0,50);
    for(const row of candidates)if(selectedMedicines.has(row.medicine_key) && !visible.includes(row))visible.push(row);
    for(const row of visible){
      const label=node('label'),input=node('input');
      label.className='choice';
      input.type='checkbox';input.checked=selectedMedicines.has(row.medicine_key);input.value=row.medicine_key;
      input.addEventListener('change',()=>{
        if(input.checked)selectedMedicines.add(row.medicine_key);else selectedMedicines.delete(row.medicine_key);
        $('medicine-match-count').textContent='已选择 '+selectedMedicines.size+' 项。';
      });
      label.append(input,node('span',medicineLabel(row)));box.append(label);
    }
    if(!matches.length)box.append(node('p','没有匹配的药品。'));
    if(matches.length>50)box.append(node('p','已显示前 50 项，请补充名称、规格或企业缩小范围。'));
    $('medicine-match-count').textContent='已选择 '+selectedMedicines.size+' 项。';
  }
  function fillForms(savedText) {
    const r = data.record;
    const m = latest()?.manual_metadata || {};
    $('review-public').value = typeof r.public_message === 'string' ? r.public_message : '';
    $('review-private').value = typeof r.private_note === 'string' ? r.private_note : '';
    for (const pair of [['basis-model', 'model_basis'], ['basis-source', 'source_basis'], ['basis-rights', 'rights_basis']]) {
      $(pair[0]).value = typeof r.manual_review_binding?.[pair[1]] === 'string' ? r.manual_review_binding[pair[1]] : '';
    }
    $('transfer-title').value = typeof r.fields?.title === 'string' ? r.fields.title : '';
    $('transfer-product').value = typeof m.product_name === 'string' ? m.product_name : '';
    $('transfer-region').value = typeof m.region_display === 'string' ? m.region_display : '';
    $('transfer-edition').value = typeof m.edition_display === 'string' ? m.edition_display : '';
    for (const id of ['transfer-description', 'transfer-type', 'transfer-date', 'transfer-source-name', 'transfer-source-date', 'transfer-source-available']) $(id).value = '';
    const medicine=m.schema_version===2;
    $('transfer-product-field').hidden=medicine;
    $('transfer-product').required=!medicine;
    $('transfer-medicine').hidden=!medicine;
    $('basis-object-label').textContent=medicine?'药名、剂型、规格、企业和适用范围依据':'品牌、完整型号及适用范围依据';
    $('medicine-match-mode').value='';
    $('medicine-match-search').value=medicine ? m.medicine?.generic_name || m.medicine?.original_title || '' : '';
    selectedMedicines.clear();
    updateMedicineOptions();
    checkboxes('manual-checks', medicine && Array.isArray(data.checks) ?
      ['已逐项核对原件标注的药名、剂型、规格、企业角色和本版适用范围。',...data.checks.slice(1)] : data.checks);
    checkboxes('privacy-checks', data.privacy_checks);
    checkboxes('pdf-checks', data.pdf_checks);
    resetConfirmations();
    if (savedText) for (const id of textFields) $(id).value = savedText[id];
  }

  function fact(box, label, value) {
    const part = node('div');
    part.append(node('dt', label), node('dd', value === '' || value === undefined || value === null ? '未注明' : display(value)));
    box.append(part);
    return part;
  }

  const pdfWarningLabels = {
    font_warning: '工具报告字体问题，请检查缺字、乱码或字体替换。',
    font_not_embedded: '原文件含未嵌入字体，请对照源文件。',
    font_check_needs_review: '字体情况需人工核对。',
    cropbox_differs: '可见范围与纸张范围不同，请核对裁切。',
    tool_warning: '文件检查有提示，请逐页对照。',
    render_warning: '转图有提示，请逐页核对。'
  };

  function renderPdfReport() {
    const v = version();
    const pdf = mode === 'local' && !restricted(v) && isObject(v?.pdf) ? v.pdf : null;
    $('review-pdf-report').hidden = !pdf;
    $('pdf-checks-group').hidden = !(mode === 'local' && !restricted(v) && pdfReading(v));
    const box = $('review-pdf-facts');
    box.replaceChildren();
    $('review-pdf-warnings').replaceChildren();
    if (!pdf) return;
    const source = pdf.source || {};
    const inspection = pdf.inspection || {};
    const geometry = Array.isArray(inspection.geometry) ? inspection.geometry : [];
    const rows = [
      ['私密源文件名', source.original_name],
      ['源文件大小', Number.isFinite(source.bytes) ? (source.bytes / 1024 / 1024).toFixed(2) + ' MiB' : '未记录'],
      ['源文件摘要', source.sha256], ['处理工具', pdf.tool_version],
      ['处理配置', pdf.profile === 'detail' ? '精细核对' : '标准清晰'],
      ['配置摘要', pdf.engine_fingerprint], ['检查时间', dateLabel(inspection.checked_at)],
      ['PDF版本', inspection.pdf_version || '未记录'],
      ['结构检查', '加密：' + (inspection.encrypted ? '有' : '无') + '；脚本：' + (inspection.javascript ? '有' : '无') + '；表单：' + (inspection.form === 'none' ? '无' : display(inspection.form)) + '；附件：' + display(inspection.attachments) + '个'],
      ['整册页面', display(inspection.pages) + '页；' + geometry.filter(g => g?.rotation).length + '页带旋转标记'],
      ['生成结果', '完整生成；页面逐张绑定源PDF页序及图片摘要']
    ];
    for (const row of rows) fact(box, row[0], row[1]);
    for (const warning of Array.isArray(inspection.warnings) ? inspection.warnings : []) {
      $('review-pdf-warnings').append(node('li', pdfWarningLabels[warning] || '本次处理还有需人工核对的提示。'));
    }
    $('review-pdf-validity').textContent = !currentVersion() ? '历史提交只读，不沿用为当前审核。' : data.record.pdf_review?.problems?.length ? '旧PDF审核已失效，处理记录待重新核对。' : '送审所需的处理记录齐全；保存通过前仍会重新核对源文件及全部页图。';
  }

  function renderMetadata() {
    const v = version();
    const box = $('review-metadata');
    box.replaceChildren();
    if (!v) {
      $('review-version-note').textContent = '没有可读取的提交保存版。';
      renderPdfReport();
      return;
    }
    const pageText = restricted(v) ? '页图未开放' : images(v).length + '页';
    $('review-version-note').textContent = '正在查看提交保存版' + v.revision + ' · ' + pageText + ' · ' + (currentVersion() ? '最新提交，按当前状态处理' : '历史提交，只读') + '。';
    if (restricted(v)) {
      fact(box, '版本访问', '此版本只读；PDF未开放，不请求元数据或页图。');
      renderPdfReport();
      return;
    }
    const m = v.manual_metadata;
    if (!isObject(m)) {
      fact(box, '版本资料', '本版本未提供可读取的说明书元数据。');
      renderPdfReport();
      return;
    }
    const choice = (group, key) => typeof data.choices?.[group]?.[key] === 'string' ? data.choices[group][key] : key;
    const rows = [
      ...(m.schema_version===2 && m.medicine ? [
        ['通用名',m.medicine.generic_name],['原件题名或旧称',m.medicine.original_title],['商品名',m.medicine.trade_name],
        ['剂型',m.medicine.dosage_form],['规格',m.medicine.strength],['包装规格',m.medicine.package_spec],
        ...(m.medicine.companies||[]).map(company=>[medicineRoles[company.role]||'企业',company.name]),
        [m.medicine.approval_label||'批准或注册编号',m.medicine.approval_number],
        ['原件核准日期',m.approval_date_text],['原件修订日期',m.revision_date_text]
      ] : [['品牌', m.brand_name], ['物件名称', m.product_name],
        ['明确适用型号', Array.isArray(m.model_texts) ? m.model_texts.join('\n') : '']]),
      ['品类', choice('categories', m.category_key)], ['文档用途', choice('kinds', m.document_kind)],
      ['原文语言', Array.isArray(m.languages) ? m.languages.map(key => choice('languages', key)).join('／') : ''],
      ['地区', m.region_display], ['版本', m.edition_display], ['明确标注日期', m.edition_date],
      ['完整程度', choice('completeness', m.completeness)], ['缺页说明', m.missing_note],
      ['提供方式', choice('sharing', m.sharing_scope)], ['权利情况', choice('rights', m.rights_basis)],
      ['官方来源线索', m.official_url], ['投稿人的来源说明', m.source_note],
      ['投稿人的授权说明', m.rights_note], ['投稿人的补充说明', m.description],
      ['人物情况', choice('people', m.people)], ['希望署名', m.attribution === 'named' ? m.credit : '匿名']
    ];
    for (const row of rows) {
      const part = fact(box, row[0], row[1]);
      if (row[0] === '官方来源线索') {
        const url = publicOfficialUrl(m.official_url);
        if (url) {
          const link = node('a', '在新窗口核对官方来源（HTTPS 外链）');
          link.href = url;
          link.target = '_blank';
          link.rel = 'noopener noreferrer';
          link.referrerPolicy = 'no-referrer';
          part.append(link);
        }
      }
    }
    renderPdfReport();
  }

  function reader() {
    const v = version();
    const pages = restricted(v) ? [] : images(v);
    const image = $('reader-image');
    const viewport = document.querySelector('.review-reader-viewport');
    const empty = $('reader-empty');
    $('review-reader').hidden = false;
    const hasPages = pages.length > 0;
    if (empty) empty.hidden = hasPages;
    for (const id of ['reader-prev', 'reader-next', 'reader-jump', 'reader-zoom']) $(id).hidden = !hasPages;
    if (viewport) viewport.hidden = !hasPages;
    image.hidden = !hasPages;
    if (!hasPages) {
      image.removeAttribute('src');
      delete image.dataset.reviewRevision;
      $('reader-jump').replaceChildren();
      $('reader-error').hidden = true;
      const text = restricted(v) ? '此历史版本只读；PDF未开放，不请求元数据或页图。' : v?.manual_metadata?.sharing_scope === 'official-link' ? '本次仅提供官网线索，没有页图；请通过明确的安全外链自行核对官方来源。' : '本版本没有可读取的页图；不能在未核对阅读副本时保存通过。';
      if (empty) empty.textContent = text;
      $('reader-caption').textContent = text;
      return;
    }
    pageIndex = Math.min(Math.max(0, Number.isSafeInteger(pageIndex) ? pageIndex : 0), pages.length - 1);
    const jump = $('reader-jump');
    jump.replaceChildren();
    pages.forEach((page, index) => {
      const option = node('option', '第' + (index + 1) + '页' + (typeof page.label === 'string' && page.label ? ' · ' + page.label : ''));
      option.value = String(index);
      jump.append(option);
    });
    jump.value = String(pageIndex);
    $('reader-prev').disabled = pageIndex === 0;
    $('reader-next').disabled = pageIndex === pages.length - 1;
    const page = pages[pageIndex];
    $('reader-caption').textContent = '保存版' + v.revision + ' · 页序 ' + (pageIndex + 1) + '/' + pages.length + (page.source_page ? ' · 源PDF第' + display(page.source_page) + '页' : '') + (typeof page.label === 'string' && page.label ? ' · 纸面页码 ' + page.label : '') + (typeof page.note === 'string' && page.note ? '\n投稿人本页说明（私密）：' + page.note : '');
    image.dataset.reviewRevision = String(v.revision);
    image.alt = '提交保存版' + v.revision + '第' + (pageIndex + 1) + '页';
    const filename = page.filename;
    if (typeof filename !== 'string' || !/^[a-z0-9][a-z0-9._-]{0,199}\.(?:jpe?g|png|webp)$/i.test(filename) || filename.includes('..')) {
      image.removeAttribute('src');
      failedRevisions.add(v.revision);
      $('reader-error').hidden = false;
      return;
    }
    const src = base + '/versions/' + v.revision + '/images/' + encodeURIComponent(filename);
    if (image.getAttribute('src') !== src) image.src = src;
    $('reader-error').hidden = !failedRevisions.has(v.revision);
  }

  function renderOperations() {
    const box = $('review-operations');
    if (!box) return;
    box.replaceChildren();
    const labels = {
      success: '成功（只读结果，可继续编辑）', failed: '失败，原操作未完成（只读）',
      cancelled: '已取消，原操作未完成（只读）', queued: '排队中，禁止重复写入',
      running: '执行中，禁止重复写入', needs_review: '需要人工核对，禁止重复写入',
      unknown: '结果未知，不能当作成功'
    };
    const actionLabel = action => action === 'review' ? '人工审核' : action === 'transfer' ? '转未公开草稿' : '写操作';
    if (pending) {
      const item = node('li', '待核对：' + actionLabel(pending.action) + ' · ' + labels[pending.status || 'unknown'] + '\n操作编号：' + pending.id + '\n步骤编号：' + pending.step);
      if (pending.noReceipt && !(mode === 'online' && pending.action === 'transfer')) {
        item.append(node('p', '没有找到本步骤回执，不代表原操作未执行。请重新读取并人工核对；不会自动重发。'));
        const release = node('button', '重新读取并释放无回执标记');
        release.type = 'button';
        release.disabled = busy;
        release.addEventListener('click', () => { void releaseMissingMarker(); });
        item.append(release);
      }
      if (mode === 'online' && pending.action === 'transfer' && ['unknown', 'needs_review'].includes(pending.status || 'unknown')) {
        item.append(node('p', '重新核对已生成的草稿和版本证据，不会重新执行转入；只有完整成功证据才能解除冻结。'));
        const resolve = node('button', '核对已有转入结果');
        resolve.type = 'button';
        resolve.disabled = busy;
        resolve.addEventListener('click', () => { void resolveTransfer(); });
        item.append(resolve);
      }
      box.append(item);
    }
    for (const row of recentRows.slice(0, 40)) {
      box.append(node('li', dateLabel(row.at) + ' · ' + actionLabel(row.action) + ' · ' + labels[row.status] + '\n操作编号：' + row.id + '\n步骤编号：' + row.step));
    }
    if (!pending && !recentRows.length) box.append(node('li', '没有可显示的近期操作回执。'));
  }

  function controls() {
    const r = data?.record;
    const blocked = busy || Boolean(pending);
    $('review-refresh').disabled = busy;
    $('review-version').disabled = blocked || !data;
    $('review-recover').hidden = !pending;
    $('review-recover').disabled = busy;
    $('review-recover').textContent = '核对上次操作';
    $('review-fields').disabled = blocked || !canReview();
    $('transfer-fields').disabled = blocked || !canTransfer();
    let reason;
    if (pending) reason = '上次写操作待核对，全部重复写入已冻结；核对按钮只查询，不重发。';
    else if (busy) reason = '正在读取或核对，暂时冻结写入。';
    else if (mode === 'unknown') reason = '尚未确认当前访问范围，请重新读取；暂时只读。';
    else if (cap('manualReviewVersion') !== 1) reason = '当前服务尚未开放说明书专用审核，暂时只读。';
    else if (data?.context?.reviewWritable !== true) {
      const reasons = {
        read_only: '当前审核入口为只读。', readonly: '当前审核入口为只读。',
        medicine_workspace_unavailable: '药品说明书审核暂未开放，现有资料可查看。',
        forbidden: '当前权限不允许保存审核。', disabled: '当前服务暂停审核写入。',
        stopped: '当前记录已停止处理。', frozen: '当前记录已冻结。',
        '线上说明书审核写入仅支持 Linux，当前仅可只读核对。': '线上审核保存需要服务器环境；当前可先查看资料，本地开发请使用本机工作台。',
        '线上说明书审核尚未开启，当前仅可只读核对。': '线上审核保存尚未开放，当前可先查看资料。'
      };
      reason = reasons[data?.context?.reviewWriteReason] || '当前服务不允许审核写入，请核对权限与记录状态。';
    } else if (restricted(version())) reason = '此版本受限，只读；PDF未开放。';
    else if (!currentVersion()) reason = '正在查看旧提交，只读；请切回最新提交后审核。';
    else if (r?.withdrawal_requested) reason = '投稿人已申请停止处理，审核及整理交接冻结。';
    else if (r?.manual_handoff || r?.linked_item_id) reason = '本册已进入整理或已关联档案，审核绑定保持只读。';
    else if (!canReview()) reason = '投稿尚未提交或已停止，不能审核。';
    else reason = approvalProblem() || '本次处理绑定最新提交版本；17项确认须逐项人工完成，通过审核不会直接公开。';
    $('review-lock-note').textContent = reason;
    renderOperations();
  }

  function renderChrome() {
    const r = data.record;
    const current = latest();
    $('manual-main').hidden = false;
    if ($('review-mode')) $('review-mode').textContent = mode === 'online' ? '管理员专用 · 受保护访问' : mode === 'local' ? '仅本机可访问 · 未公开' : '管理工作区 · 访问受限';
    $('review-title').textContent = typeof r.fields?.title === 'string' ? r.fields.title : '说明书投稿';
    $('review-identity').textContent = '投稿编号 ' + submissionId + ' · 当前记录版' + display(r.revision) + ' · 最新提交保存版' + (current?.revision || '无');
    const state = typeof data.states?.[r.status] === 'string' ? data.states[r.status] : ({pending: '待审核', approved: '审核通过，待整理', needs_info: '待补充', declined: '暂不采用', withdrawn: '已停止'})[r.status] || '未知状态';
    $('review-state').textContent = state + (r.status === 'approved' && !validityGood() ? ' · 旧审核失效待核对' : '');
    const validity = $('review-validity');
    if (validity) {
      validity.hidden = r.status !== 'approved';
      const count = Array.isArray(r.review_validity?.problems) ? r.review_validity.problems.length : 0;
      validity.textContent = validityGood() ? '当前审核绑定有效；保存新审核仍须重新逐项确认。' : '旧审核已失效或尚未核对有效性，待重新核对' + (count ? '（' + count + '项）' : '') + '。最新待审记录仍可重新审核；失效审核不能用于转草稿。';
    }
    const picker = $('review-version');
    picker.replaceChildren();
    for (const v of versions().slice().sort((a, b) => b.revision - a.revision)) {
      const option = node('option', '保存版' + v.revision + ' · ' + (restricted(v) ? 'PDF未开放，只读' : images(v).length + '页') + ' · ' + dateLabel(v.at));
      option.value = String(v.revision);
      picker.append(option);
    }
    picker.value = String(selectedRevision);
    const next = $('review-next-stage');
    if (next) {
      next.hidden = transferService();
      next.textContent = transferUnavailable();
    }
    const localPdf = mode === 'local' && pdfReading(current);
    $('review-transfer-section').hidden = !transferService() || (localPdf && cap('manualPdfHandoffVersion') !== 1);
    $('pdf-next-stage').hidden = !localPdf;
    $('pdf-next-stage').textContent = cap('manualPdfHandoffVersion') === 1 ? 'PDF只转入本次审核的整册JPEG，源PDF、处理报告及私密说明继续保留在私密区。整理与发布前仍会核对来源、页序和图片；这一步不会自动公开。' : '当前本机服务尚未开放PDF整理；现有私密资料保留，请更新并重启本机工作台后核对。';
    const reading = current?.manual_metadata?.sharing_scope === 'reading-copy';
    $('transfer-reading').hidden = !reading;
    $('transfer-official').hidden = reading;
    $('transfer-explanation').textContent = reading ? '按本次提交的完整页序，将已审核副本逐张写入待入站区，生成未公开档案草稿和说明书目录草稿。后续仍须补全、预览并完成发布检查。' : '只生成官方来源目录草稿，不复制图片、不生成实物档案或永久编号。核对目录后仍须逐项确认，才能生成正式目录。';
    const handoff = $('review-handoff-note');
    handoff.hidden = !r.manual_handoff && !r.withdrawal_requested && !r.linked_item_id;
    handoff.textContent = r.withdrawal_requested ? '投稿人已申请停止处理，审核与后续整理发布冻结。请在对应管理入口核对，不能忽略申请。' : r.manual_handoff?.status === 'complete' ? '本册已接入整理草稿；已有草稿、页序和版本绑定保留，不能重复创建。' : '本册已有交接或档案关联，审核和重复交接冻结；请先核对已有记录及操作回执。';
    const links = $('review-links');
    links.replaceChildren();
    if (mode === 'local' || mode === 'online') {
      if (r.linked_item_id) {
        const link = node('a', '继续维护档案草稿或已有档案');
        link.href = '/admin/?item=' + encodeURIComponent(r.linked_item_id);
        links.append(link);
      }
      if (r.manual_catalog_key) {
        const link = node('a', '继续维护说明书目录草稿');
        link.href = '/admin/manuals.html?manual=' + encodeURIComponent(r.manual_catalog_key);
        links.append(link);
      }
    }
    const history = $('review-history');
    history.replaceChildren();
    const actions = {review: '审核处理', submitted: '提交审核', manual_supplement_started: '开始补充', manual_draft_created: '进入整理草稿', withdrawal_requested: '申请停止处理'};
    for (const h of (Array.isArray(r.history) ? r.history : []).slice().reverse().slice(0, 40)) {
      history.append(node('li', dateLabel(h.at) + ' · ' + (actions[h.action] || '记录变更') + (typeof h.public_message === 'string' && h.public_message ? '\n给投稿人的说明：' + h.public_message : '') + (typeof h.private_note === 'string' && h.private_note ? '\n内部备注：' + h.private_note : '')));
    }
  }

  async function fetchDetail() {
    if (!validSubmissionId) throw new ClientError('id');
    const detail = await request(base);
    if (!isObject(detail.record) || detail.record.id !== submissionId || !Array.isArray(detail.record.versions)) throw new ClientError('detail');
    let caps = isObject(detail.capabilities) ? detail.capabilities : {};
    if (modeOf(detail) === 'local' && Object.keys(caps).length === 0) {
      try {
        const health = await request('/healthz');
        caps = isObject(health.capabilities) ? health.capabilities : {};
      } catch {
        caps = {};
      }
    }
    return {detail, capabilities: caps};
  }

  function acceptDetail(bundle, preserveText) {
    const savedText = preserveText ? readTextFields() : null;
    const wasDirty = dirty;
    data = bundle.detail;
    capabilities = bundle.capabilities;
    mode = modeOf(data);
    selectedRevision = latest()?.revision || versions()[0]?.revision || 0;
    pageIndex = 0;
    failedRevisions.clear();
    $('reader-image').removeAttribute('src');
    recentRows = rowsFrom(data);
    remoteOpen = recentRows.filter(row => !terminal(row.status));
    activateNext();
    fillForms(savedText);
    renderChrome();
    renderMetadata();
    reader();
    dirty = Boolean(savedText) && wasDirty;
    controls();
  }

  function binding() {
    const v = latest();
    const r = data?.record;
    if (!v || !Number.isSafeInteger(r?.revision) || r.revision < 1 || !/^[a-f0-9]{64}$/.test(v.digest || '')) throw new ClientError('binding');
    return {revision: r.revision, submitted_revision: v.revision, snapshot_digest: v.digest};
  }

  function newOperation(action, body) {
    let operationId;
    let stepId;
    try {
      operationId = crypto.randomUUID();
      stepId = crypto.randomUUID();
    } catch {
      throw new ClientError('uuid');
    }
    if (!isUuid(operationId) || !isUuid(stepId) || operationId === stepId) throw new ClientError('uuid');
    return {
      id: operationId.toLowerCase(), step: stepId.toLowerCase(), action,
      target: submissionId, at: new Date().toISOString(), body,
      status: 'unknown', noReceipt: false, knownSuccess: false
    };
  }

  async function finishSuccess(op) {
    op.knownSuccess = true;
    rememberResult(op, 'success');
    // 成功回执后也必须成功读取最新记录，才能释放标记。读取失败不触碰表单。
    const bundle = await fetchDetail();
    const transferred = op.action === 'transfer' && bundle.detail.record.manual_handoff?.status === 'complete';
    acceptDetail(bundle, !transferred && dirty);
    clearActive(op);
    const result = op.action === 'transfer' ? '未公开整理草稿已生成，可从本页入口继续维护。' : '审核结果已保存。';
    say(result + '已凭成功回执读取最新记录，没有重复执行。' + (!transferred ? '本页文字保留，新一轮审核须重新逐项核对。' : '') + (pending ? '本册还有其他未决操作，请继续核对。' : ''));
  }

  function finishFailure(op, status) {
    rememberResult(op, status);
    clearActive(op);
    resetConfirmations();
    say('原操作明确' + (status === 'cancelled' ? '已取消' : '失败') + '，未完成；当前文字已保留。请重新核对版本、选择处理结果并逐项确认后再编辑保存。' + (pending ? '本册仍有其他未决操作，写入继续冻结。' : ''), true);
  }

  async function applyOperation(op) {
    if (busy || pending) return;
    pending = op;
    storeMarker(op);
    busy = true;
    controls();
    try {
      const result = await request(base + '/' + op.action, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json', 'X-LJM-Admin-Request': '1',
          'X-LJM-Operation-Id': op.id, 'X-LJM-Step-Id': op.step
        },
        body: JSON.stringify(op.body)
      });
      const status = receiptStatus(result.operation, op);
      if (status === 'success') await finishSuccess(op);
      else if (status === 'failed' || status === 'cancelled') finishFailure(op, status);
      else {
        op.status = status || 'unknown';
        say('操作结果尚待核对，当前输入已保留。请使用“核对上次操作”；只查询回执，不会自动重发。操作编号：' + op.id, true);
      }
    } catch (error) {
      const status = !op.knownSuccess ? receiptStatus(error instanceof ClientError ? error.operation : null, op) : null;
      if (status === 'failed' || status === 'cancelled') finishFailure(op, status);
      else say((op.knownSuccess ? '成功回执已收到，但重新读取失败；仍保留待核对标记和当前输入。' : '操作结果未知，当前输入及操作标记已保留；不得重复提交。') + '\n' + safeError(error) + '\n请使用“核对上次操作”。操作编号：' + op.id, true);
    } finally {
      busy = false;
      controls();
    }
  }

  function queryResult(result, op) {
    if (Array.isArray(result.operations)) {
      for (const row of result.operations) {
        if (!isObject(row)) continue;
        const identity = receiptIdentity(row);
        if (String(identity.step || '').toLowerCase() !== op.step) continue;
        const status = receiptStatus(row, op);
        if (status !== null) return {status, absent: false};
      }
      return {status: 'unknown', absent: true};
    }
    const status = receiptStatus(result.operation, op, true);
    return {status: status || 'unknown', absent: result.operation === null || result.found === false};
  }

  async function recoverPending() {
    if (busy || !pending) return;
    const op = pending;
    busy = true;
    controls();
    try {
      const result = await request('/api/operations/' + encodeURIComponent(op.id));
      const receipt = queryResult(result, op);
      op.noReceipt = receipt.absent;
      op.status = receipt.status;
      if (receipt.status === 'success') await finishSuccess(op);
      else if (receipt.status === 'failed' || receipt.status === 'cancelled') finishFailure(op, receipt.status);
      else if (receipt.absent) say('没有找到本步骤回执，不能推断成功或失败，也不会重发。当前输入保留；' + (mode === 'online' && op.action === 'transfer' ? '请使用“核对已有转入结果”核对完整证据，确认前继续冻结。' : '可在近期操作区明确重新读取、人工核对后释放本机标记。'), true);
      else {
        const stateText = ({queued: '仍在排队', running: '仍在执行', needs_review: '需要人工核对'})[receipt.status] || '结果仍未知';
        say('原操作' + stateText + '；不自动重试，全部重复写入继续冻结。', true);
      }
    } catch (error) {
      if (error instanceof ClientError && error.code === 'http' && error.status === 404 && !op.knownSuccess) {
        op.noReceipt = true;
        op.status = 'unknown';
        say('没有找到可查询的操作回执，不能推断原操作未执行。输入保留；' + (mode === 'online' && op.action === 'transfer' ? '请使用“核对已有转入结果”核对完整证据，确认前继续冻结。' : '可明确重新读取、人工核对后释放本机标记，不会重发。'), true);
      } else say((op.knownSuccess ? '已收到成功回执，但最新记录仍未读取完成；标记和输入继续保留。' : '尚未能核对上次操作，输入和标记继续保留。') + '\n' + safeError(error), true);
    } finally {
      busy = false;
      controls();
    }
  }

  async function releaseMissingMarker() {
    if (busy || !pending || !pending.noReceipt || (mode === 'online' && pending.action === 'transfer')) return;
    if (!confirm('没有回执不代表原操作未执行。此操作将重新读取当前记录，保留本页文字并清除确认，供你人工核对后释放本机标记；不会重发原请求，也不会把未知结果当作成功。是否继续？')) return;
    const op = pending;
    busy = true;
    controls();
    try {
      const bundle = await fetchDetail();
      const unresolved = rowsFrom(bundle.detail).find(row => operationKey(row) === operationKey(op) && !terminal(row.status));
      acceptDetail(bundle, dirty);
      if (unresolved) {
        op.status = unresolved.status;
        op.noReceipt = false;
        say('最新记录仍列出此未决操作，不能释放标记；输入保留，请继续查询或人工核对。', true);
      } else {
        clearActive(op);
        say('已重新读取并释放本机无回执标记；没有重发原请求，也未判定原操作成功。文字保留、确认已清除，请先人工核对当前状态再决定是否创建新操作。' + (pending ? '本册另有未决操作，写入继续冻结。' : ''), true);
      }
    } catch (error) {
      say('重新读取未完成，不能释放操作标记；输入已保留。\n' + safeError(error), true);
    } finally {
      busy = false;
      controls();
    }
  }

  async function resolveTransfer() {
    if (busy || !pending || mode !== 'online' || pending.action !== 'transfer' || !['unknown', 'needs_review'].includes(pending.status || 'unknown')) return;
    const op = pending;
    busy = true;
    controls();
    try {
      const result = await request(base + '/resolve-operation', {
        method: 'POST',
        headers: {'Content-Type': 'application/json', 'X-LJM-Admin-Request': '1'},
        body: JSON.stringify({operationId: op.id, stepId: op.step})
      });
      const receipt = queryResult(result, op);
      if (receipt.status === 'success') await finishSuccess(op);
      else {
        op.status = ['queued', 'running'].includes(receipt.status) ? receipt.status : 'needs_review';
        op.noReceipt = receipt.absent;
        say('现有转入证据尚不足以确认整册成功；全部重复写入继续冻结。未重新执行转入，请核对已有草稿或联系维护人员。', true);
      }
    } catch (error) {
      say('现有转入结果未核对完成；输入和操作标记继续保留，没有重新执行转入。\n' + safeError(error), true);
    } finally {
      busy = false;
      controls();
    }
  }

  async function refresh() {
    if (busy) return;
    if (pending) {
      await recoverPending();
      return;
    }
    if (dirty && !confirm('重新读取会替换本页尚未保存的审核及整理填写，并清除处理结果和逐项确认。是否继续？')) return;
    busy = true;
    controls();
    try {
      const bundle = await fetchDetail();
      acceptDetail(bundle, false);
      say('已读取最新投稿及可用的目录版本，请重新逐项核对。');
    } catch (error) {
      say(safeError(error), true);
    } finally {
      busy = false;
      controls();
    }
  }

  $('manual-review-form').addEventListener('submit', event => {
    event.preventDefault();
    if (busy || pending || !canReview() || $('review-fields').disabled) return;
    const status = $('review-decision').value;
    if (!['approved', 'needs_info', 'declined'].includes(status)) {
      say('请选择本次处理结果。', true);
      return;
    }
    if (status !== 'approved' && $('review-public').value.trim().length < 2) {
      say('请填写给投稿人的补充或暂不采用说明。', true);
      return;
    }
    if (status === 'approved') {
      const problem = approvalProblem();
      if (problem) {
        say(problem, true);
        return;
      }
      const groups = ['manual-checks', 'privacy-checks'].concat(pdfReading(latest()) ? ['pdf-checks'] : []);
      if (groups.some(id => checksIn(id).some(input => !input.checked))) {
        say('请逐项完成全部人工确认，不能默认通过或跳过确认。', true);
        return;
      }
      if (['basis-model', 'basis-source', 'basis-rights'].some(id => $(id).value.trim().length < 2)) {
        say('请记录适用范围、来源及权利核对依据。', true);
        return;
      }
    }
    try {
      const body = Object.assign(binding(), {
        status, public_message: $('review-public').value, private_note: $('review-private').value,
        model_basis: $('basis-model').value, source_basis: $('basis-source').value, rights_basis: $('basis-rights').value,
        checks: checksIn('manual-checks').map(input => input.checked),
        privacy_checks: checksIn('privacy-checks').map(input => input.checked)
      });
      if (mode === 'local' && pdfReading(latest())) body.pdf_checks = checksIn('pdf-checks').map(input => input.checked);
      void applyOperation(newOperation('review', body));
    } catch (error) {
      say(safeError(error), true);
    }
  });

  $('manual-transfer-form').addEventListener('submit', event => {
    event.preventDefault();
    if (busy || pending || !canTransfer() || $('transfer-fields').disabled) return;
    if (!$('transfer-confirm').checked) {
      say('请人工确认只生成未公开整理草稿。', true);
      return;
    }
    try {
      const body = Object.assign(binding(), {
        catalog_revision: data.catalog_revision, confirmed: $('transfer-confirm').checked,
        title: $('transfer-title').value, public_description: $('transfer-description').value,
        region_display: $('transfer-region').value,
        edition_display: $('transfer-edition').value
      });
      if(latest().manual_metadata.schema_version===2){
        const mode=$('medicine-match-mode').value;
        if(!['existing','new'].includes(mode) || mode==='existing'&&!selectedMedicines.size){
          say('请选择已有药品并核对规格，或确认按本次原件新建药品。',true);return;
        }
        body.medicine_match={mode,medicine_keys:mode==='new'?[]:[...selectedMedicines]};
      }else body.product_name=$('transfer-product').value;
      if (latest().manual_metadata.sharing_scope === 'reading-copy') {
        Object.assign(body, {object_type: $('transfer-type').value, accession_date: $('transfer-date').value});
      } else {
        Object.assign(body, {official_source_name: $('transfer-source-name').value, checked_on: $('transfer-source-date').value});
        if ($('transfer-source-available').value) body.source_available = $('transfer-source-available').value === 'true';
      }
      void applyOperation(newOperation('transfer', body));
    } catch (error) {
      say(safeError(error), true);
    }
  });

  $('medicine-match-mode').addEventListener('change',()=>{
    selectedMedicines.clear();
    updateMedicineOptions();
  });
  $('medicine-match-search').addEventListener('input',updateMedicineOptions);
  $('review-decision').addEventListener('change', () => {
    $('approval-checks').hidden = $('review-decision').value !== 'approved';
  });
  for (const form of [$('manual-review-form'), $('manual-transfer-form')]) {
    form.addEventListener('input', () => { dirty = true; });
    form.addEventListener('change', () => { dirty = true; });
  }
  $('review-version').addEventListener('change', () => {
    if (busy || pending) {
      $('review-version').value = String(selectedRevision);
      return;
    }
    const revision = Number($('review-version').value);
    if (!versions().some(v => v.revision === revision)) return;
    selectedRevision = revision;
    pageIndex = 0;
    resetConfirmations();
    renderMetadata();
    reader();
    controls();
    say('已切换版本，处理结果及全部确认已清除；未保存文字保持不变。历史提交只读，保存前须切回最新提交重新核对。');
  });
  $('reader-prev').addEventListener('click', () => { pageIndex--; reader(); });
  $('reader-next').addEventListener('click', () => { pageIndex++; reader(); });
  $('reader-jump').addEventListener('change', () => { pageIndex = Number($('reader-jump').value); reader(); });
  $('reader-image').addEventListener('error', () => {
    const image = $('reader-image');
    if (!image.getAttribute('src') || image.dataset.reviewRevision !== String(selectedRevision)) return;
    failedRevisions.add(selectedRevision);
    $('reader-error').hidden = false;
    say('页图读取失败；本次阅读不能保存通过，仍可反馈需要补充或暂不采用。请重新读取后再次核对。', true);
    controls();
  });
  $('reader-image').addEventListener('load', () => {
    const image = $('reader-image');
    if (!image.getAttribute('src')) return;
    if (image.naturalWidth > 0) image.width = image.naturalWidth;
    if (image.naturalHeight > 0) image.height = image.naturalHeight;
    $('reader-error').hidden = !failedRevisions.has(selectedRevision);
  });
  $('reader-zoom').addEventListener('click', () => {
    const viewport = document.querySelector('.review-reader-viewport');
    if (!viewport) return;
    const active = viewport.classList.toggle('is-actual');
    $('reader-zoom').setAttribute('aria-pressed', String(active));
    $('reader-zoom').textContent = active ? '适宽查看' : '原尺寸查看';
  });
  $('review-refresh').addEventListener('click', () => { void refresh(); });
  $('review-recover').addEventListener('click', () => { void recoverPending(); });
  window.addEventListener('beforeunload', event => {
    if (dirty || busy || pending) {
      event.preventDefault();
      event.returnValue = '';
    }
  });

  async function start() {
    busy = true;
    controls();
    try {
      const bundle = await fetchDetail();
      acceptDetail(bundle, false);
      say(pending ? '已定位本册上次未决操作，写入已冻结。请使用“核对上次操作”；不会恢复或重发私密请求正文。' : '请先阅读本次提交，再记录人工审核结果。');
    } catch (error) {
      say(safeError(error), true);
    } finally {
      busy = false;
      controls();
    }
  }
  void start();
})();
