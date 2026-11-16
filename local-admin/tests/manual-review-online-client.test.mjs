// 用 Node VM 执行真实客户端，仅模拟浏览器表面和本地 API，不访问网络。
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {Script} from 'node:vm';
import {webcrypto} from 'node:crypto';
import {setImmediate as tick} from 'node:timers/promises';

const source = await readFile(new URL('../public/manual-review.js', import.meta.url), 'utf8');
const script = new Script(source, {filename: 'manual-review.js'});
const ID = 'TG-AAAAAAAAAAAAAAAAAAAAAAAA';
const BASE = '/api/admin/manual-submissions/' + ID;
const OP = '11111111-1111-4111-8111-111111111111';
const STEP = '22222222-2222-4222-8222-222222222222';
const OLD_OP = '33333333-3333-4333-8333-333333333333';
const OLD_STEP = '44444444-4444-4444-8444-444444444444';
const FAILED_OP = '55555555-5555-4555-8555-555555555555';
const FAILED_STEP = '66666666-6666-4666-8666-666666666666';
const AT = '2026-11-12T00:00:00.000Z';
const clone = value => JSON.parse(JSON.stringify(value));

function response(value, status = 200, type = 'application/json; charset=utf-8') {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: {get: name => name.toLowerCase() === 'content-type' ? type : null},
    json: async () => clone(value)
  };
}

function htmlResponse(status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: {get: () => 'text/html; charset=utf-8'},
    json: async () => { throw new Error('<html>/srv/private/login SECRET-TOKEN</html>'); }
  };
}

function store(options = {}) {
  const data = new Map();
  const writes = [];
  return {
    data, writes,
    getItem(key) {
      if (options.throwRead) throw new Error('/srv/private/storage-read');
      return data.get(key) ?? null;
    },
    setItem(key, value) {
      if (options.throwWrite) throw new Error('/srv/private/storage-write');
      const text = String(value);
      data.set(key, text);
      writes.push({key, value: text});
    },
    removeItem(key) {
      if (options.throwWrite) throw new Error('/srv/private/storage-remove');
      data.delete(key);
    }
  };
}

class Element {
  constructor(tag = 'div', onImage = () => {}) {
    this.tagName = tag.toUpperCase();
    this.onImage = onImage;
    this.children = [];
    this.parentNode = null;
    this.listeners = new Map();
    this.attributes = new Map();
    this.dataset = {};
    this.hidden = false;
    this.disabled = false;
    this.checked = false;
    this.value = '';
    this.type = '';
    this._text = '';
    this.naturalWidth = 1200;
    this.naturalHeight = 1600;
    const classes = new Set();
    this.classList = {
      toggle(name) {
        if (classes.has(name)) {
          classes.delete(name);
          return false;
        }
        classes.add(name);
        return true;
      },
      contains: name => classes.has(name)
    };
  }
  get textContent() {
    return this._text + this.children.map(child => child.textContent).join('');
  }
  set textContent(value) {
    this._text = String(value);
    for (const child of this.children) child.parentNode = null;
    this.children = [];
  }
  set innerHTML(value) {
    throw new Error('Unsafe DOM HTML assignment: ' + String(value));
  }
  append() {
    for (const value of Array.from(arguments)) {
      const child = typeof value === 'string' ? new Element('span', this.onImage) : value;
      if (typeof value === 'string') child.textContent = value;
      if (child.parentNode) {
        const parent = child.parentNode;
        parent.children = parent.children.filter(item => item !== child);
      }
      child.parentNode = this;
      this.children.push(child);
      if (this.tagName === 'SELECT' && this.children.length === 1 && child.tagName === 'OPTION') this.value = child.value;
    }
  }
  replaceChildren() {
    for (const child of this.children) child.parentNode = null;
    this.children = [];
    this._text = '';
    if (this.tagName === 'SELECT') this.value = '';
    this.append.apply(this, arguments);
  }
  addEventListener(name, listener) {
    if (!this.listeners.has(name)) this.listeners.set(name, []);
    this.listeners.get(name).push(listener);
  }
  emit(name) {
    const event = {
      type: name, target: this, defaultPrevented: false,
      preventDefault() { this.defaultPrevented = true; }
    };
    let current = this;
    while (current) {
      for (const listener of current.listeners.get(name) || []) listener(event);
      current = name === 'input' || name === 'change' ? current.parentNode : null;
    }
    return event;
  }
  click() {
    let current = this;
    while (current) {
      if (current.hidden || current.disabled) return;
      current = current.parentNode;
    }
    this.emit('click');
  }
  querySelectorAll(selector) {
    const result = [];
    const matches = element => selector === 'input' ? element.tagName === 'INPUT' :
      selector === 'input[type=checkbox]' || selector === 'input[type="checkbox"]' ? element.tagName === 'INPUT' && element.type === 'checkbox' :
      selector === 'button' ? element.tagName === 'BUTTON' :
      selector === 'a' ? element.tagName === 'A' :
      selector === 'img' ? element.tagName === 'IMG' : false;
    const walk = element => {
      for (const child of element.children) {
        if (matches(child)) result.push(child);
        walk(child);
      }
    };
    walk(this);
    return result;
  }
  setAttribute(name, value) {
    const text = String(value);
    this.attributes.set(name, text);
    if (name === 'src' && this.tagName === 'IMG' && text) this.onImage(text);
  }
  getAttribute(name) { return this.attributes.get(name) ?? null; }
  removeAttribute(name) { this.attributes.delete(name); }
  set src(value) { this.setAttribute('src', value); }
  get src() { return this.getAttribute('src') || ''; }
}

function surface(imageRequests) {
  const elements = new Map();
  const root = new Element('div');
  const ids = [
    'review-mode', 'review-message', 'review-refresh', 'review-recover', 'review-next-stage',
    'review-validity', 'review-operations', 'manual-main', 'review-title', 'review-identity',
    'review-state', 'review-handoff-note', 'review-links', 'review-version', 'review-version-note',
    'review-metadata', 'review-pdf-report', 'review-pdf-facts', 'review-pdf-warnings', 'review-pdf-validity',
    'review-reader', 'reader-empty', 'reader-prev', 'reader-next', 'reader-jump', 'reader-zoom',
    'reader-caption', 'reader-image', 'reader-error', 'review-lock-note', 'manual-review-form',
    'review-fields', 'review-decision', 'review-public', 'review-private', 'approval-checks',
    'basis-model', 'basis-source', 'basis-rights', 'manual-checks', 'privacy-checks', 'pdf-checks',
    'pdf-checks-group', 'pdf-next-stage', 'review-transfer-section', 'transfer-explanation',
    'manual-transfer-form', 'transfer-fields', 'transfer-title', 'transfer-product', 'transfer-region',
    'transfer-edition', 'transfer-description', 'transfer-reading', 'transfer-official', 'transfer-type',
    'transfer-date', 'transfer-source-name', 'transfer-source-date', 'transfer-source-available',
    'transfer-confirm', 'review-history'
  ];
  const selects = ['review-version', 'review-decision', 'reader-jump', 'transfer-type', 'transfer-source-available'];
  const buttons = ['review-refresh', 'review-recover', 'reader-prev', 'reader-next', 'reader-zoom'];
  for (const id of ids) {
    const tag = selects.includes(id) ? 'select' : buttons.includes(id) ? 'button' :
      id.endsWith('-form') ? 'form' : id.endsWith('-fields') ? 'fieldset' :
      id === 'reader-image' ? 'img' : id === 'transfer-confirm' ? 'input' :
      ['review-public', 'review-private', 'basis-model', 'basis-source', 'basis-rights', 'transfer-description'].includes(id) ? 'textarea' : 'div';
    const element = new Element(tag, src => imageRequests.push(src));
    element.id = id;
    elements.set(id, element);
    root.append(element);
  }
  const el = id => elements.get(id) || null;
  el('manual-main').hidden = true;
  el('review-recover').hidden = true;
  el('review-transfer-section').hidden = true;
  el('reader-error').hidden = true;
  el('transfer-confirm').type = 'checkbox';
  el('manual-review-form').append(el('review-fields'));
  for (const id of ['review-decision', 'review-public', 'review-private', 'approval-checks']) el('review-fields').append(el(id));
  for (const id of ['basis-model', 'basis-source', 'basis-rights', 'manual-checks', 'privacy-checks', 'pdf-checks-group']) el('approval-checks').append(el(id));
  el('pdf-checks-group').append(el('pdf-checks'));
  el('review-transfer-section').append(el('manual-transfer-form'));
  el('manual-transfer-form').append(el('transfer-fields'));
  for (const id of ['transfer-title', 'transfer-product', 'transfer-region', 'transfer-edition', 'transfer-description', 'transfer-reading', 'transfer-official', 'transfer-confirm']) el('transfer-fields').append(el(id));
  for (const id of ['transfer-type', 'transfer-date']) el('transfer-reading').append(el(id));
  for (const id of ['transfer-source-name', 'transfer-source-date', 'transfer-source-available']) el('transfer-official').append(el(id));
  const viewport = new Element('div');
  viewport.append(el('reader-image'));
  el('review-reader').append(viewport);
  for (const id of ['reader-empty', 'reader-prev', 'reader-next', 'reader-jump', 'reader-zoom', 'reader-caption', 'reader-error']) el('review-reader').append(el(id));
  return {
    el, root, elements, viewport,
    document: {
      getElementById: el,
      createElement: tag => new Element(tag, src => imageRequests.push(src)),
      querySelector: selector => selector === '.review-reader-viewport' ? viewport : null,
      querySelectorAll: selector => root.querySelectorAll(selector)
    }
  };
}

function fixture({mode = 'online', status = 'pending', pdf = false, official = false} = {}) {
  const metadata = {
    brand_name: '合成品牌', product_name: '合成物件', model_texts: ['SYNTHETIC-82'],
    category_key: 'tools', document_kind: 'user-guide', languages: ['zh-CN'],
    region_display: '地区未注明', edition_display: '合成版本', edition_date: '',
    completeness: 'complete', missing_note: '', sharing_scope: official ? 'official-link' : 'reading-copy',
    rights_basis: official ? 'official-link' : 'own-work', official_url: official ? 'https://support.example.com/manuals' : '',
    source_note: '合成私密来源', rights_note: '合成权利说明', description: '不应自动复制为公开简介',
    people: 'none', attribution: 'anonymous'
  };
  const pages = official ? [] : [
    {filename: 'page-one.jpg', label: '封面', note: '第一页私密说明', source_page: 1},
    {filename: 'page-two.jpg', label: '1', note: '', source_page: 2}
  ];
  const current = {revision: 7, digest: 'a'.repeat(64), at: AT, manual_metadata: clone(metadata), images: pages, source_format: pdf ? 'pdf' : 'images'};
  if (pdf) current.pdf = {
    source: {original_name: 'synthetic-local.pdf', bytes: 1048576, sha256: 'b'.repeat(64)},
    tool_version: 'synthetic-tool-v1', profile: 'standard', engine_fingerprint: 'c'.repeat(64),
    inspection: {
      checked_at: AT, pdf_version: '1.7', encrypted: false, javascript: false, form: 'none',
      attachments: 0, pages: 2, geometry: [{rotation: 0}, {rotation: 90}], warnings: ['font_warning']
    }
  };
  const old = {revision: 4, digest: 'd'.repeat(64), at: AT, manual_metadata: clone(metadata), images: official ? [] : [{filename: 'old-page.jpg', label: '', note: ''}], source_format: 'images'};
  const record = {
    id: ID, revision: 8, manual_submitted_revision: 7, fields: {title: '合成说明书投稿'},
    source_format: pdf ? 'pdf' : 'images', status, versions: [old, current], history: [],
    public_message: '已保存的反馈', private_note: '已保存的内部备注',
    review_validity: {valid: true, problems: []}, pdf_review: {problems: []}
  };
  if (status === 'approved') record.manual_review_binding = {model_basis: '已核实型号', source_basis: '已核实来源', rights_basis: '已核实权利'};
  const result = {
    record,
    checks: Array.from({length: 4}, (_, i) => '说明书人工检查' + (i + 1)),
    privacy_checks: Array.from({length: 13}, (_, i) => '隐私人工检查' + (i + 1)),
    pdf_checks: Array.from({length: 4}, (_, i) => 'PDF补充人工检查' + (i + 1)),
    states: {pending: '待审核', approved: '通过待整理', needs_info: '待补充', declined: '暂不采用'},
    choices: {
      categories: {tools: '工具'}, kinds: {'user-guide': '使用说明'}, languages: {'zh-CN': '简体中文'},
      completeness: {complete: '完整'}, sharing: {'reading-copy': '阅读副本', 'official-link': '官网线索'},
      rights: {'own-work': '自有权利', 'official-link': '官方线索'}, people: {none: '无人物'}
    },
    context: {adminMode: mode, reviewWritable: true, reviewWriteReason: ''},
    capabilities: {manualReviewVersion: 1, manualTransferVersion: mode === 'local' ? 1 : 0, manualPdfHandoffVersion: mode === 'local' ? 1 : 0},
    recent_operations: []
  };
  if (mode === 'local') result.catalog_revision = 'f'.repeat(64);
  return result;
}

async function settle(check) {
  for (let i = 0; i < 150; i++) {
    if (check()) return;
    await tick();
  }
  assert.ok(check(), '客户端没有到达预期状态');
}

function manualClock() {
  let next = 0;
  const timers = new Map();
  return {
    timers,
    setTimeout(fn) { const id = ++next; timers.set(id, fn); return id; },
    clearTimeout(id) { timers.delete(id); },
    fire() {
      const tasks = Array.from(timers.entries());
      for (const pair of tasks) {
        timers.delete(pair[0]);
        pair[1]();
      }
    }
  };
}

function browser(options = {}) {
  const calls = [];
  const imageRequests = [];
  const storage = options.storage || store();
  const dom = surface(imageRequests);
  let currentDetail = clone(options.detail || fixture());
  let health = clone(options.health || {capabilities: {manualReviewVersion: 1, manualTransferVersion: 1, manualPdfHandoffVersion: 1}});
  let confirmAnswer = true;
  const confirmations = [];
  const windowListeners = new Map();
  let api;
  const mockFetch = async (url, init = {}) => {
    url = String(url);
    calls.push({url, init});
    assert.ok(init.signal instanceof AbortSignal, '每次请求必须带 AbortController 信号');
    if (options.route) {
      const result = await options.route(url, init, api);
      if (result !== undefined) return result;
    }
    if (init.method === 'POST') return response({operation: {status: 'succeeded'}});
    if (url === BASE) return response(currentDetail);
    if (url === '/healthz') return response(health);
    if (url.startsWith('/api/operations/')) return response({operations: []});
    throw new Error('Unexpected mock request');
  };
  api = {
    el: dom.el, root: dom.root, viewport: dom.viewport, calls, imageRequests, storage, confirmations,
    get detail() { return currentDetail; },
    setDetail(value) { currentDetail = clone(value); },
    setHealth(value) { health = clone(value); },
    setConfirm(value) { confirmAnswer = value; },
    get posts() { return calls.filter(call => call.init.method === 'POST'); },
    ready: () => settle(() => !dom.el('review-refresh').disabled && !dom.el('manual-main').hidden),
    beforeUnload() {
      const event = {prevented: false, preventDefault() { this.prevented = true; }};
      for (const listener of windowListeners.get('beforeunload') || []) listener(event);
      return event;
    }
  };
  const clock = options.clock || {setTimeout, clearTimeout};
  script.runInNewContext({
    document: dom.document,
    location: {search: '?id=' + ID, href: 'http://127.0.0.1/admin/manual-review.html?id=' + ID},
    URL, URLSearchParams, crypto: webcrypto, AbortController,
    sessionStorage: storage, fetch: mockFetch,
    setTimeout: clock.setTimeout, clearTimeout: clock.clearTimeout,
    confirm: text => { confirmations.push(text); return typeof confirmAnswer === 'function' ? confirmAnswer(text) : confirmAnswer; },
    window: {addEventListener(name, listener) {
      if (!windowListeners.has(name)) windowListeners.set(name, []);
      windowListeners.get(name).push(listener);
    }}
  });
  return api;
}

function input(client, id, value, event = 'input') {
  client.el(id).value = value;
  client.el(id).emit(event);
}

function choose(client, status) {
  input(client, 'review-decision', status, 'change');
}

function checks(client, pdf = false) {
  const ids = ['manual-checks', 'privacy-checks'].concat(pdf ? ['pdf-checks'] : []);
  return ids.reduce((all, id) => all.concat(client.el(id).querySelectorAll('input')), []);
}

function prepareApproval(client, pdf = false) {
  choose(client, 'approved');
  input(client, 'basis-model', '人工核对型号依据');
  input(client, 'basis-source', '人工核对来源依据');
  input(client, 'basis-rights', '人工核对权利依据');
  for (const check of checks(client, pdf)) {
    check.checked = true;
    check.emit('input');
  }
}

function submitFeedback(client) {
  choose(client, 'needs_info');
  input(client, 'review-public', '请补充合成来源说明');
  client.el('manual-review-form').emit('submit');
}

const idlePending = client => settle(() => !client.el('review-recover').hidden && !client.el('review-recover').disabled);
const idleResolved = client => settle(() => client.el('review-recover').hidden && !client.el('review-refresh').disabled);
const operationQueries = client => client.calls.filter(call => call.url.startsWith('/api/operations/'));
const detailReads = client => client.calls.filter(call => call.url === BASE && call.init.method !== 'POST');

function openRow(status = 'needs_review') {
  return {operationId: OP, stepId: STEP, action: 'review', target: ID, at: AT, status};
}

function releaseButton(client) {
  return client.el('review-operations').querySelectorAll('button').find(button => button.textContent.includes('释放'));
}

function onlineTransfer(options = {}) {
  const detail = fixture({status: 'approved', ...options});
  detail.context.transferWritable = true;
  detail.context.transferWriteReason = '';
  detail.capabilities.manualTransferVersion = 1;
  detail.catalog_revision = 'f'.repeat(64);
  detail.catalog_readiness = {ready: true};
  return detail;
}

function transferResult(init, {official = false, status = 'succeeded', proof = {}} = {}) {
  return {
    operationId: init.headers['X-LJM-Operation-Id'], stepId: init.headers['X-LJM-Step-Id'],
    action: 'manual-transfer', target: ID, status,
    result: {manualTransfer: {
      submissionId: ID, revision: 9, submittedRevision: 7, snapshotDigest: 'a'.repeat(64),
      manualKey: 'manual-0123456789abcdef01234567', itemId: official ? null : 'LJM-20261116-RPR-001',
      pages: official ? 0 : 2, sharingScope: official ? 'official-link' : 'reading-copy', ...proof
    }}
  };
}

function prepareTransfer(client) {
  input(client, 'transfer-title', '人工整理的合成题名');
  input(client, 'transfer-description', '经核实可公开的合成简介');
  input(client, 'transfer-type', 'RPR', 'change');
  input(client, 'transfer-date', '2026-11-16');
  client.el('transfer-confirm').checked = true;
  client.el('manual-transfer-form').emit('submit');
}

const resolveButton = client => client.el('review-operations').querySelectorAll('button').find(button => button.textContent === '核对已有转入结果');

test('线上非PDF转入按能力、可写权限及目录版本开放；目录不可用仍可审核', async () => {
  const enabled = browser({detail: onlineTransfer()});
  await enabled.ready();
  assert.equal(enabled.el('review-transfer-section').hidden, false);
  assert.equal(enabled.el('transfer-fields').disabled, false);
  assert.equal(enabled.el('review-next-stage').hidden, true);
  for (const mutation of [
    detail => { detail.capabilities.manualTransferVersion = 0; },
    detail => { delete detail.context.transferWritable; },
    detail => { detail.context.transferWritable = false; detail.context.transferWriteReason = '/srv/PRIVATE-DIRECTORY'; },
    detail => { detail.context.reviewWritable = false; },
    detail => { delete detail.catalog_revision; }
  ]) {
    const detail = onlineTransfer();
    mutation(detail);
    const c = browser({detail});
    await c.ready();
    assert.equal(c.el('transfer-fields').disabled, true);
    prepareTransfer(c);
    assert.equal(c.posts.length, 0);
    assert.doesNotMatch(c.el('review-next-stage').textContent, /PRIVATE|\/srv/);
  }
  const unavailable = onlineTransfer();
  unavailable.context.transferWritable = false;
  unavailable.context.transferWriteReason = 'catalog_unavailable';
  delete unavailable.catalog_revision;
  unavailable.catalog_readiness = {ready: false};
  const c = browser({detail: unavailable});
  await c.ready();
  assert.equal(c.el('review-fields').disabled, false);
  assert.match(c.el('review-next-stage').textContent, /仍可继续人工审核/);
  submitFeedback(c);
  await idleResolved(c);
  assert.equal(c.posts.length, 1);
  assert.equal(c.posts[0].url, BASE + '/review');
});

test('线上PDF即使误报转入和PDF能力也继续关闭', async () => {
  for (const official of [false, true]) {
    const detail = onlineTransfer({pdf: true, official});
    detail.capabilities.manualPdfHandoffVersion = 1;
    const c = browser({detail});
    await c.ready();
    assert.equal(c.el('review-transfer-section').hidden, true);
    assert.equal(c.el('transfer-fields').disabled, true);
    assert.match(c.el('review-next-stage').textContent, /PDF.*尚未开放/);
    prepareTransfer(c);
    assert.equal(c.posts.length, 0);
  }
});

test('线上阅读副本成功需完整绑定回执，完成后提供准确的档案和目录维护入口', async () => {
  const c = browser({detail: onlineTransfer(), route: async (url, init, api) => {
    if (init.method !== 'POST') return;
    assert.equal(url, BASE + '/transfer');
    const operation = transferResult(init);
    const next = clone(api.detail);
    next.record.revision = 9;
    next.record.manual_handoff = {status: 'complete'};
    next.record.linked_item_id = operation.result.manualTransfer.itemId;
    next.record.manual_catalog_key = operation.result.manualTransfer.manualKey;
    api.setDetail(next);
    return response({operation});
  }});
  await c.ready();
  prepareTransfer(c);
  await idleResolved(c);
  assert.equal(c.posts.length, 1);
  const body = JSON.parse(c.posts[0].init.body);
  assert.equal(body.revision, 8);
  assert.equal(body.submitted_revision, 7);
  assert.equal(body.snapshot_digest, 'a'.repeat(64));
  assert.equal(body.catalog_revision, 'f'.repeat(64));
  assert.equal(body.confirmed, true);
  assert.equal(body.public_description, '经核实可公开的合成简介');
  assert.equal(c.el('transfer-fields').disabled, true);
  assert.deepEqual(c.el('review-links').querySelectorAll('a').map(link => link.href), [
    '/admin/?item=LJM-20261116-RPR-001', '/admin/manuals.html?manual=manual-0123456789abcdef01234567'
  ]);
  assert.match(c.el('review-message').textContent, /未公开整理草稿已生成/);
  assert.doesNotMatch(c.storage.getItem('manual-review.pending.' + ID) || '', /私密|public_description|snapshot_digest/);
});

test('线上官方线索成功仅接目录，零页且无档案编号', async () => {
  const c = browser({detail: onlineTransfer({official: true}), route: async (url, init, api) => {
    if (init.method !== 'POST') return;
    const operation = transferResult(init, {official: true});
    const next = clone(api.detail);
    next.record.manual_handoff = {status: 'complete'};
    next.record.manual_catalog_key = operation.result.manualTransfer.manualKey;
    api.setDetail(next);
    return response({operation});
  }});
  await c.ready();
  input(c, 'transfer-source-name', '合成官方支持站');
  input(c, 'transfer-source-date', '2026-11-16');
  input(c, 'transfer-source-available', 'false', 'change');
  c.el('transfer-confirm').checked = true;
  c.el('manual-transfer-form').emit('submit');
  await idleResolved(c);
  const body = JSON.parse(c.posts[0].init.body);
  assert.equal(body.official_source_name, '合成官方支持站');
  assert.equal(body.source_available, false);
  assert.equal(Object.hasOwn(body, 'object_type'), false);
  assert.equal(Object.hasOwn(body, 'accession_date'), false);
  assert.deepEqual(c.el('review-links').querySelectorAll('a').map(link => link.href), ['/admin/manuals.html?manual=manual-0123456789abcdef01234567']);
});

test('线上交接断线保留冻结，查询成功回执只读取不重发', async () => {
  let operation;
  const c = browser({detail: onlineTransfer(), route: async (url, init) => {
    if (url === BASE + '/transfer') {
      operation = transferResult(init);
      throw new Error('synthetic disconnect');
    }
    if (url.startsWith('/api/operations/')) return response({operation});
  }});
  await c.ready();
  prepareTransfer(c);
  await idlePending(c);
  assert.equal(c.el('transfer-fields').disabled, true);
  assert.ok(resolveButton(c));
  assert.equal(releaseButton(c), undefined);
  c.el('manual-transfer-form').emit('submit');
  assert.equal(c.posts.length, 1);
  c.el('review-recover').emit('click');
  await idleResolved(c);
  assert.equal(c.posts.length, 1);
  assert.equal(operationQueries(c).length, 1);
  assert.match(c.el('review-message').textContent, /没有重复执行/);
});

test('线上待核对交接只核对既有证据，部分结果保持冻结，完整结果才解除', async () => {
  let operation;
  let resolutions = 0;
  const c = browser({detail: onlineTransfer(), route: async (url, init) => {
    if (url === BASE + '/transfer') {
      operation = transferResult(init);
      return response({operation: {...operation, result: {manualTransfer: {...operation.result.manualTransfer, pages: 1}}}});
    }
    if (url === BASE + '/resolve-operation') {
      resolutions++;
      assert.deepEqual(JSON.parse(init.body), {operationId: operation.operationId, stepId: operation.stepId});
      assert.equal(Object.hasOwn(init.headers, 'X-LJM-Operation-Id'), false);
      return response({operation: resolutions === 1 ? {...operation, status: 'needs_review'} : operation});
    }
  }});
  await c.ready();
  prepareTransfer(c);
  await idlePending(c);
  assert.equal(c.el('transfer-fields').disabled, true, '缺一页不能仅凭succeeded解冻');
  assert.ok(resolveButton(c));
  resolveButton(c).emit('click');
  await idlePending(c);
  assert.equal(c.posts.filter(post => post.url === BASE + '/transfer').length, 1);
  assert.match(c.el('review-message').textContent, /证据尚不足/);
  assert.equal(c.el('transfer-fields').disabled, true);
  assert.equal(releaseButton(c), undefined);
  resolveButton(c).emit('click');
  await idleResolved(c);
  assert.equal(resolutions, 2);
  assert.equal(c.posts.filter(post => post.url === BASE + '/transfer').length, 1);
  assert.equal(c.posts.filter(post => post.url === BASE + '/resolve-operation').length, 2);
});

test('线上交接成功回执必须匹配整册、范围、正式标识和操作编号', async () => {
  for (const mismatch of [
    {submissionId: 'TG-BBBBBBBBBBBBBBBBBBBBBBBB'}, {revision: 0}, {submittedRevision: 4},
    {snapshotDigest: 'b'.repeat(64)}, {manualKey: 'manual-arbitrary'},
    {itemId: 'LJM-20261116-PHT-001'}, {itemId: null}, {pages: 0}, {sharingScope: 'official-link'}
  ]) {
    const c = browser({detail: onlineTransfer(), route: async (url, init) => {
      if (url === BASE + '/transfer') return response({operation: transferResult(init, {proof: mismatch})});
    }});
    await c.ready();
    prepareTransfer(c);
    await idlePending(c);
    assert.equal(c.el('transfer-fields').disabled, true, JSON.stringify(mismatch));
    assert.equal(c.posts.length, 1);
    assert.ok(resolveButton(c));
  }
  const c = browser({detail: onlineTransfer(), route: async (url, init) => {
    if (url === BASE + '/transfer') {
      const operation = transferResult(init);
      delete operation.operationId;
      return response({operation});
    }
  }});
  await c.ready();
  prepareTransfer(c);
  await idlePending(c);
  assert.equal(c.el('transfer-fields').disabled, true, '缺操作编号不视为足够成功证据');
});

test('线上交接无回执或核对断线时继续冻结，不提供清除标记入口', async () => {
  const c = browser({detail: onlineTransfer(), route: async (url) => {
    if (url === BASE + '/transfer' || url === BASE + '/resolve-operation') throw new Error('synthetic disconnect');
    if (url.startsWith('/api/operations/')) return response({operations: []});
  }});
  await c.ready();
  prepareTransfer(c);
  await idlePending(c);
  c.el('review-recover').emit('click');
  await idlePending(c);
  assert.equal(releaseButton(c), undefined);
  assert.match(c.el('review-message').textContent, /完整证据.*继续冻结/);
  resolveButton(c).emit('click');
  await idlePending(c);
  assert.equal(c.el('transfer-fields').disabled, true);
  assert.equal(releaseButton(c), undefined);
  assert.equal(c.posts.filter(post => post.url === BASE + '/transfer').length, 1);
  assert.equal(c.posts.filter(post => post.url === BASE + '/resolve-operation').length, 1);
  assert.match(c.el('review-message').textContent, /没有重新执行转入/);
});

test('服务器原生kind操作记录可恢复线上交接核对入口，不误认成普通写操作', async () => {
  const detail = onlineTransfer();
  detail.recent_operations = [{operationId: OP, stepId: STEP, kind: 'manual-transfer', target: ID, startedAt: AT, status: 'needs_review'}];
  const c = browser({detail, route: async (url) => {
    if (url.startsWith('/api/operations/')) return response({operations: []});
  }});
  await c.ready();
  assert.equal(c.el('transfer-fields').disabled, true);
  assert.ok(resolveButton(c));
  assert.match(c.el('review-operations').textContent, /转未公开草稿/);
  c.el('review-recover').emit('click');
  await idlePending(c);
  assert.equal(releaseButton(c), undefined);
  assert.ok(resolveButton(c));
  assert.equal(c.posts.length, 0);
});

test('online 默认关闭整册交接；能力与可写上下文必须同时明确允许', async () => {
  const c = browser();
  await c.ready();
  assert.match(c.el('review-mode').textContent, /管理员专用/);
  assert.doesNotMatch(c.el('review-identity').textContent, /接口/);
  assert.match(c.el('review-next-stage').textContent, /当前不可用/);
  assert.equal(c.el('review-next-stage').hidden, false);
  assert.equal(c.el('review-transfer-section').hidden, true);
  assert.equal(c.el('transfer-fields').disabled, true);
  assert.equal(c.calls.some(call => call.url === '/healthz'), false);
  c.el('transfer-confirm').checked = true;
  c.el('manual-transfer-form').emit('submit');
  assert.equal(c.posts.length, 0);

  const future = fixture({status: 'approved'});
  future.capabilities.manualTransferVersion = 1;
  const guarded = browser({detail: future});
  await guarded.ready();
  assert.equal(guarded.el('review-transfer-section').hidden, true, '仅能力开关不能代替可写上下文');
  guarded.el('manual-transfer-form').emit('submit');
  assert.equal(guarded.posts.length, 0);

  const disabled = fixture();
  disabled.capabilities.manualReviewVersion = 0;
  const readOnly = browser({detail: disabled});
  await readOnly.ready();
  assert.equal(readOnly.el('review-fields').disabled, true);
  submitFeedback(readOnly);
  assert.equal(readOnly.posts.length, 0);
});

test('本机显式能力控制表单，旧本机仅在详情无能力时回退 health', async () => {
  const disabled = fixture({mode: 'local', status: 'approved'});
  disabled.capabilities.manualTransferVersion = 0;
  const denied = browser({detail: disabled});
  await denied.ready();
  assert.match(denied.el('review-mode').textContent, /仅本机可访问/);
  assert.equal(denied.el('review-transfer-section').hidden, true);
  assert.equal(denied.calls.some(call => call.url === '/healthz'), false);

  const legacy = fixture({mode: 'local', status: 'approved'});
  delete legacy.capabilities;
  const allowed = browser({detail: legacy, health: {capabilities: {manualReviewVersion: 1, manualPdfHandoffVersion: 1}}});
  await allowed.ready();
  assert.equal(allowed.calls.filter(call => call.url === '/healthz').length, 1);
  assert.equal(allowed.el('review-transfer-section').hidden, false);
  assert.equal(allowed.el('transfer-fields').disabled, false);

  const online = fixture({status: 'approved'});
  delete online.capabilities;
  const notLegacy = browser({detail: online});
  await notLegacy.ready();
  assert.equal(notLegacy.el('review-fields').disabled, true);
  assert.equal(notLegacy.el('review-transfer-section').hidden, true);
  assert.equal(notLegacy.calls.some(call => call.url === '/healthz'), false);
});

test('unknown、后端只读、停止申请和交接均冻结写入，错误不显示私密原因', async () => {
  const unknown = fixture({mode: 'unknown'});
  const readonly = fixture();
  readonly.context.reviewWritable = false;
  readonly.context.reviewWriteReason = '/srv/private/SECRET-REASON';
  const stopped = fixture();
  stopped.record.withdrawal_requested = {at: AT};
  const handed = fixture();
  handed.record.manual_handoff = {status: 'complete'};
  for (const detail of [unknown, readonly, stopped, handed]) {
    const c = browser({detail});
    await c.ready();
    assert.equal(c.el('review-fields').disabled, true);
    submitFeedback(c);
    assert.equal(c.posts.length, 0);
    assert.doesNotMatch(c.el('review-lock-note').textContent, /SECRET-REASON|\/srv/);
  }
  const c = browser({detail: unknown});
  await c.ready();
  assert.match(c.el('review-mode').textContent, /访问受限/);
});

test('本机整册转入保留原字段与私密边界，完成后交接冻结', async () => {
  const c = browser({detail: fixture({mode: 'local', status: 'approved'}), route: async (url, init, api) => {
    if (init.method !== 'POST') return;
    assert.equal(url, BASE + '/transfer');
    const next = clone(api.detail);
    next.record.manual_handoff = {status: 'complete'};
    next.record.linked_item_id = 'SYNTHETIC-ITEM';
    next.record.manual_catalog_key = 'SYNTHETIC-MANUAL';
    api.setDetail(next);
    return response({operation: {status: 'success'}});
  }});
  await c.ready();
  assert.equal(c.el('review-transfer-section').hidden, false);
  assert.equal(c.el('transfer-fields').disabled, false);
  assert.equal(c.el('transfer-description').value, '', '不得自动公开投稿补充说明');
  input(c, 'transfer-title', '人工整理的合成题名');
  input(c, 'transfer-description', '经核实可公开的合成简介');
  input(c, 'transfer-type', 'RPR', 'change');
  input(c, 'transfer-date', '2026-01-01');
  c.el('transfer-confirm').checked = true;
  c.el('transfer-confirm').emit('input');
  c.el('manual-transfer-form').emit('submit');
  await idleResolved(c);
  assert.equal(c.posts.length, 1);
  const body = JSON.parse(c.posts[0].init.body);
  assert.equal(body.catalog_revision, 'f'.repeat(64));
  assert.equal(body.confirmed, true);
  assert.equal(body.object_type, 'RPR');
  assert.equal(body.accession_date, '2026-01-01');
  assert.equal(body.public_description, '经核实可公开的合成简介');
  assert.equal(body.revision, 8);
  assert.equal(body.submitted_revision, 7);
  assert.equal(body.snapshot_digest, 'a'.repeat(64));
  assert.equal(c.el('review-fields').disabled, true);
  assert.equal(c.el('transfer-fields').disabled, true);
  assert.equal(c.el('review-links').querySelectorAll('a').length, 2);
});

test('本机官网线索转入保留来源字段，不发送实物档案字段', async () => {
  const c = browser({detail: fixture({mode: 'local', status: 'approved', official: true})});
  await c.ready();
  assert.equal(c.el('transfer-reading').hidden, true);
  assert.equal(c.el('transfer-official').hidden, false);
  input(c, 'transfer-source-name', '合成厂家支持站');
  input(c, 'transfer-source-date', '2026-01-01');
  input(c, 'transfer-source-available', 'false', 'change');
  c.el('transfer-confirm').checked = true;
  c.el('manual-transfer-form').emit('submit');
  await idleResolved(c);
  const body = JSON.parse(c.posts[0].init.body);
  assert.equal(body.official_source_name, '合成厂家支持站');
  assert.equal(body.checked_on, '2026-01-01');
  assert.equal(body.source_available, false);
  assert.equal(Object.hasOwn(body, 'object_type'), false);
  assert.equal(Object.hasOwn(body, 'accession_date'), false);
});

test('本机 PDF 报告与21项人工检查保留，未逐项确认不能通过', async () => {
  const c = browser({detail: fixture({mode: 'local', pdf: true})});
  await c.ready();
  assert.equal(c.el('review-pdf-report').hidden, false);
  assert.match(c.el('review-pdf-facts').textContent, /synthetic-local\.pdf/);
  assert.match(c.el('review-pdf-warnings').textContent, /字体/);
  assert.equal(c.el('pdf-checks-group').hidden, false);
  assert.equal(checks(c, true).length, 21);
  assert.ok(checks(c, true).every(check => !check.checked));
  choose(c, 'approved');
  c.el('manual-review-form').emit('submit');
  assert.equal(c.posts.length, 0);
  prepareApproval(c, true);
  c.el('manual-review-form').emit('submit');
  await idleResolved(c);
  const body = JSON.parse(c.posts[0].init.body);
  assert.equal(body.checks.length + body.privacy_checks.length + body.pdf_checks.length, 21);
  assert.ok(body.pdf_checks.every(value => value === true));
  assert.ok(checks(c, true).every(check => !check.checked));

  const blocked = fixture({mode: 'local', status: 'approved', pdf: true});
  blocked.capabilities.manualPdfHandoffVersion = 0;
  const noPdfHandoff = browser({detail: blocked});
  await noPdfHandoff.ready();
  assert.equal(noPdfHandoff.el('review-transfer-section').hidden, true);
  assert.equal(noPdfHandoff.el('review-pdf-report').hidden, false);
});

test('restricted 历史 PDF 可选择只读，不请求元数据、PDF或页图', async () => {
  const detail = fixture();
  detail.record.versions.unshift({revision: 3, at: AT, restricted: true, source_format: 'pdf'});
  const c = browser({detail});
  await c.ready();
  assert.equal(c.imageRequests.length, 1, '初始化只加载当前一张页图');
  input(c, 'review-private', '切版不能覆盖的文字');
  prepareApproval(c);
  const initialCalls = c.calls.length;
  const initialImages = c.imageRequests.length;
  input(c, 'review-version', '3', 'change');
  assert.equal(c.el('review-version').value, '3');
  assert.equal(c.el('review-fields').disabled, true);
  assert.equal(c.el('review-decision').value, '');
  assert.ok(checks(c).every(check => !check.checked));
  assert.equal(c.el('review-private').value, '切版不能覆盖的文字');
  assert.equal(c.el('reader-image').getAttribute('src'), null);
  assert.equal(c.el('reader-empty').hidden, false);
  assert.match(c.el('reader-empty').textContent, /PDF未开放/);
  assert.equal(c.el('review-pdf-report').hidden, true);
  assert.equal(c.calls.length, initialCalls);
  assert.equal(c.imageRequests.length, initialImages);
  assert.equal(c.calls.some(call => call.url.includes('/versions/')), false);
  input(c, 'review-version', '7', 'change');
  assert.equal(c.el('review-fields').disabled, false);
  assert.equal(c.imageRequests.length, initialImages + 1);
});

test('官网线索没有页图时明确提示，只生成显式安全外链且不自动请求官网', async () => {
  const detail = fixture({official: true});
  detail.record.versions[1].manual_metadata.brand_name = '<img src=x onerror=alert(1)>';
  const c = browser({detail});
  await c.ready();
  assert.equal(c.imageRequests.length, 0);
  assert.equal(c.el('reader-empty').hidden, false);
  assert.match(c.el('reader-empty').textContent, /官网线索.*没有页图/);
  assert.match(c.el('review-metadata').textContent, /<img src=x onerror=alert\(1\)>/);
  assert.equal(c.el('review-metadata').querySelectorAll('img').length, 0);
  const links = c.el('review-metadata').querySelectorAll('a');
  assert.equal(links.length, 1);
  assert.equal(links[0].href, 'https://support.example.com/manuals');
  assert.equal(links[0].target, '_blank');
  assert.match(links[0].rel, /noopener/);
  assert.match(links[0].rel, /noreferrer/);
  assert.equal(links[0].referrerPolicy, 'no-referrer');
  assert.ok(c.calls.every(call => call.url === BASE));
  prepareApproval(c);
  c.el('manual-review-form').emit('submit');
  await idleResolved(c);
  const body = JSON.parse(c.posts[0].init.body);
  assert.equal(Object.hasOwn(body, 'pdf_checks'), false);
});

test('不为 HTTP、内网、凭据网址及非网址生成可点击官网外链', async () => {
  const unsafe = [
    'http://example.com/manual', 'https://localhost/manual', 'https://127.0.0.1/manual',
    'https://2130706433/manual', 'https://192.168.1.2/manual', 'https://172.16.1.2/manual',
    'https://router.local/manual', 'https://[::1]/manual', 'https://user:secret@example.com/manual',
    'javascript:alert(1)', 'https://example.com:8443/manual', 'https://example.com/white space'
  ];
  for (const url of unsafe) {
    const detail = fixture({official: true});
    detail.record.versions[1].manual_metadata.official_url = url;
    const c = browser({detail});
    await c.ready();
    assert.equal(c.el('review-metadata').querySelectorAll('a').length, 0, url);
    assert.equal(c.imageRequests.length, 0);
    assert.equal(c.calls.length, 1);
    prepareApproval(c);
    c.el('manual-review-form').emit('submit');
    assert.equal(c.posts.length, 0, '不安全官网线索不能直接保存通过');
  }
});

test('只加载当前页并可按页跳转，页图失败不能通过但仍可反馈', async () => {
  const c = browser({route: async (url, init) => init.method === 'POST' ? response({operation: {status: 'failed'}}) : undefined});
  await c.ready();
  assert.equal(c.imageRequests.length, 1);
  assert.match(c.imageRequests[0], /page-one\.jpg$/);
  c.el('reader-next').click();
  assert.equal(c.imageRequests.length, 2);
  assert.match(c.imageRequests[1], /page-two\.jpg$/);
  input(c, 'reader-jump', '0', 'change');
  assert.equal(c.imageRequests.length, 3);
  prepareApproval(c);
  c.el('reader-image').emit('error');
  c.el('manual-review-form').emit('submit');
  assert.equal(c.posts.length, 0);
  assert.equal(c.el('review-fields').disabled, false);
  assert.equal(c.el('reader-error').hidden, false);
  c.el('reader-next').click();
  c.el('reader-image').emit('load');
  c.el('manual-review-form').emit('submit');
  assert.equal(c.posts.length, 0, '跳到另一张成功页不能绕过失败记录');
  submitFeedback(c);
  await idleResolved(c);
  assert.equal(c.posts.length, 1);
  assert.equal(JSON.parse(c.posts[0].init.body).status, 'needs_info');
});

test('新旧版本切换清除 decision 与17项确认，保留未保存文字；失效审核不阻止最新记录重审', async () => {
  const detail = fixture();
  detail.record.review_validity = {valid: false, problems: ['old_binding']};
  const c = browser({detail});
  await c.ready();
  assert.equal(c.el('review-fields').disabled, false);
  assert.match(c.el('review-validity').textContent, /失效/);
  assert.equal(checks(c).length, 17);
  assert.ok(checks(c).every(check => !check.checked));
  input(c, 'review-private', '仅内存保留的审核文字');
  input(c, 'review-public', '未保存的投稿反馈');
  prepareApproval(c);
  input(c, 'review-version', '4', 'change');
  assert.equal(c.el('review-fields').disabled, true);
  assert.equal(c.el('review-decision').value, '');
  assert.ok(checks(c).every(check => !check.checked));
  assert.equal(c.el('review-private').value, '仅内存保留的审核文字');
  assert.equal(c.el('basis-source').value, '人工核对来源依据');
  input(c, 'review-version', '7', 'change');
  assert.equal(c.el('review-fields').disabled, false);
  assert.equal(c.el('review-decision').value, '');
  assert.ok(checks(c).every(check => !check.checked));
  prepareApproval(c);
  c.el('manual-review-form').emit('submit');
  await idleResolved(c);
  const body = JSON.parse(c.posts[0].init.body);
  assert.equal(body.submitted_revision, 7);
  assert.equal(body.snapshot_digest, 'a'.repeat(64));
  assert.equal(body.status, 'approved');
  assert.equal(body.checks.length, 4);
  assert.equal(body.privacy_checks.length, 13);
  assert.ok(body.checks.concat(body.privacy_checks).every(value => value === true));
  assert.equal(body.private_note, '仅内存保留的审核文字');
});

test('旧审核失效显示待核对并阻止本机转入，但最新 approved 仍可重新审核', async () => {
  const detail = fixture({mode: 'local', status: 'approved'});
  detail.record.review_validity = {valid: false, problems: ['binding_changed']};
  const c = browser({detail});
  await c.ready();
  assert.match(c.el('review-state').textContent, /旧审核失效待核对/);
  assert.equal(c.el('transfer-fields').disabled, true);
  assert.equal(c.el('review-fields').disabled, false);
});

test('私密 body 只在内存，sessionStorage 仅保存定位字段；丢响应后查询成功不重复 POST', async () => {
  let operation;
  const c = browser({route: async (url, init, api) => {
    if (init.method === 'POST') {
      operation = {id: init.headers['X-LJM-Operation-Id'], step: init.headers['X-LJM-Step-Id']};
      const next = clone(api.detail);
      next.record.revision = 9;
      next.record.status = 'needs_info';
      api.setDetail(next);
      throw new Error('/srv/private/SECRET-TOKEN lost response');
    }
    if (url.startsWith('/api/operations/')) return response({operations: [{operationId: operation.id, stepId: operation.step, status: 'succeeded'}]});
  }});
  await c.ready();
  input(c, 'review-private', 'PRIVATE-BODY-82');
  input(c, 'basis-source', 'PRIVATE-SOURCE-82');
  submitFeedback(c);
  await idlePending(c);
  assert.equal(c.posts.length, 1);
  assert.equal(c.el('review-fields').disabled, true);
  assert.notEqual(operation.id, operation.step);
  assert.match(operation.id, /^[a-f0-9-]{36}$/);
  const marker = JSON.parse(c.storage.writes.at(-1).value);
  assert.deepEqual(Object.keys(marker).sort(), ['action', 'at', 'id', 'step', 'target']);
  assert.equal(marker.id, operation.id);
  assert.equal(marker.step, operation.step);
  assert.equal(marker.target, ID);
  const stored = c.storage.writes.map(write => write.value).join('\n');
  assert.doesNotMatch(stored, /PRIVATE-BODY-82|PRIVATE-SOURCE-82|private_note|public_message|actor|token|body|page-one/i);
  assert.doesNotMatch(c.el('review-message').textContent, /\/srv|SECRET-TOKEN/);
  c.el('manual-review-form').emit('submit');
  assert.equal(c.posts.length, 1, '待核对时重复提交被冻结');
  c.el('review-recover').click();
  await idleResolved(c);
  assert.equal(c.posts.length, 1);
  assert.equal(operationQueries(c).length, 1);
  assert.equal(operationQueries(c)[0].url, '/api/operations/' + operation.id);
  assert.equal(c.storage.data.size, 0);
  assert.equal(c.el('review-private').value, 'PRIVATE-BODY-82');
  assert.match(c.el('review-identity').textContent, /当前记录版9/);
  assert.equal(c.el('review-fields').disabled, false);
});

test('POST 已成功但最新记录重读失败时仍保留 pending 和文字，后续只查询回执', async () => {
  let wrote = false;
  let failedReload = false;
  let op;
  const c = browser({route: async (url, init) => {
    if (init.method === 'POST') {
      wrote = true;
      op = {id: init.headers['X-LJM-Operation-Id'], step: init.headers['X-LJM-Step-Id']};
      return response({operation: {status: 'success'}});
    }
    if (url === BASE && wrote && !failedReload) {
      failedReload = true;
      throw new Error('/srv/private/reload failure');
    }
    if (url.startsWith('/api/operations/')) return response({operations: [{operationId: op.id, stepId: op.step, status: 'success'}]});
  }});
  await c.ready();
  input(c, 'review-private', '成功后重读失败仍保留');
  submitFeedback(c);
  await idlePending(c);
  assert.equal(c.storage.data.size, 1);
  assert.equal(c.el('review-private').value, '成功后重读失败仍保留');
  assert.match(c.el('review-message').textContent, /成功回执已收到.*重新读取失败/);
  c.el('review-recover').click();
  await idleResolved(c);
  assert.equal(c.posts.length, 1);
  assert.equal(c.storage.data.size, 0);
  assert.equal(c.el('review-private').value, '成功后重读失败仍保留');
});

test('刷新后可由 session 定位原操作，但不会持久化或重造私密正文', async () => {
  const shared = store();
  let op;
  const first = browser({storage: shared, route: async (url, init) => {
    if (init.method === 'POST') {
      op = {id: init.headers['X-LJM-Operation-Id'], step: init.headers['X-LJM-Step-Id']};
      throw new Error('synthetic response loss');
    }
  }});
  await first.ready();
  input(first, 'review-private', '不落盘的原审核正文');
  submitFeedback(first);
  await idlePending(first);
  const second = browser({storage: shared, route: async url => {
    if (url.startsWith('/api/operations/')) return response({operations: [{operationId: op.id, stepId: op.step, status: 'success'}]});
  }});
  await second.ready();
  assert.equal(second.el('review-fields').disabled, true);
  assert.equal(second.el('review-recover').hidden, false);
  assert.equal(second.el('review-private').value, '已保存的内部备注');
  second.el('review-recover').click();
  await idleResolved(second);
  assert.equal(second.posts.length, 0);
  assert.equal(operationQueries(second)[0].url, '/api/operations/' + op.id);
  assert.equal(shared.data.size, 0);
});

test('session 为空时从 recent_operations 定位未决操作，近期终态只读且不泄漏摘要私密字段', async () => {
  const detail = fixture();
  detail.recent_operations = [
    Object.assign(openRow(), {body: {private_note: 'RECENT-SECRET'}, actor: 'SECRET-ACTOR', error: '/srv/private/summary'}),
    {id: OLD_OP, step: OLD_STEP, action: 'review', target: ID, at: AT, status: 'success'},
    {id: FAILED_OP, step: FAILED_STEP, action: 'review', target: ID, at: AT, status: 'failed', error: 'SECRET-ERROR'}
  ];
  const c = browser({detail, route: async url => url.startsWith('/api/operations/') ? response({operations: [Object.assign(openRow('success'))]}) : undefined});
  await c.ready();
  assert.equal(c.el('review-fields').disabled, true);
  assert.equal(c.el('review-recover').hidden, false);
  assert.equal(c.storage.data.size, 1);
  assert.match(c.el('review-operations').textContent, /成功/);
  assert.match(c.el('review-operations').textContent, /失败/);
  assert.doesNotMatch(c.el('review-operations').textContent, /RECENT-SECRET|SECRET-ACTOR|SECRET-ERROR|\/srv/);
  c.el('review-recover').click();
  await idleResolved(c);
  assert.equal(operationQueries(c)[0].url, '/api/operations/' + OP);
  assert.equal(c.posts.length, 0);
  assert.equal(c.el('review-fields').disabled, false);
  assert.equal(c.storage.data.size, 0);
});

test('全部历史 success、failed、cancelled 不会一律成为 pending，也不显示可执行结果按钮', async () => {
  const detail = fixture();
  detail.recent_operations = [
    openRow('succeeded'),
    {operationId: OLD_OP, stepId: OLD_STEP, action: 'review', target: ID, at: AT, status: 'failed'},
    {operationId: FAILED_OP, stepId: FAILED_STEP, action: 'review', target: ID, at: AT, status: 'cancelled'}
  ];
  const c = browser({detail});
  await c.ready();
  assert.equal(c.el('review-fields').disabled, false);
  assert.equal(c.el('review-recover').hidden, true);
  assert.equal(c.storage.data.size, 0);
  assert.equal(c.el('review-operations').querySelectorAll('button').length, 0);
  assert.match(c.el('review-operations').textContent, /成功/);
  assert.match(c.el('review-operations').textContent, /失败/);
});

test('queued、running、needs_review 只查询不重试；failed、cancelled 保留文字并允许重新核对编辑', async () => {
  for (const status of ['queued', 'running', 'needs_review', 'failed', 'cancelled']) {
    let op;
    const c = browser({route: async (url, init) => {
      if (init.method === 'POST') {
        op = {id: init.headers['X-LJM-Operation-Id'], step: init.headers['X-LJM-Step-Id']};
        throw new Error('synthetic response loss');
      }
      if (url.startsWith('/api/operations/')) return response({operations: [{operationId: op.id, stepId: op.step, status}]});
    }});
    await c.ready();
    input(c, 'review-private', '状态核对保留文字-' + status);
    submitFeedback(c);
    await idlePending(c);
    const reads = detailReads(c).length;
    c.el('review-recover').click();
    if (status === 'failed' || status === 'cancelled') {
      await idleResolved(c);
      assert.equal(c.el('review-fields').disabled, false, status);
      assert.equal(c.storage.data.size, 0);
      assert.equal(c.el('review-decision').value, '');
      assert.ok(checks(c).every(check => !check.checked));
      assert.match(c.el('review-message').textContent, /未完成/);
    } else {
      await idlePending(c);
      assert.equal(c.el('review-fields').disabled, true, status);
      assert.equal(c.storage.data.size, 1);
      const queryCount = operationQueries(c).length;
      c.el('review-refresh').click();
      await idlePending(c);
      assert.equal(operationQueries(c).length, queryCount + 1, 'pending 时重读只用于核对');
    }
    assert.equal(c.posts.length, 1, status);
    assert.equal(detailReads(c).length, reads, '只有成功回执才自动读取最新记录');
    assert.equal(c.el('review-private').value, '状态核对保留文字-' + status);
  }
});

test('已找到但状态未知的回执使用明确提示，保留输入和冻结，不误判缺回执或重复提交', async () => {
  for (const returnedStatus of ['unknown', 'future-status']) {
    let op;
    const c = browser({route: async (url, init) => {
      if (init.method === 'POST') {
        op = {id: init.headers['X-LJM-Operation-Id'], step: init.headers['X-LJM-Step-Id']};
        throw new Error('synthetic response loss');
      }
      if (url.startsWith('/api/operations/')) return response({operations: [{operationId: op.id, stepId: op.step, target: ID, status: returnedStatus}]});
    }});
    await c.ready();
    input(c, 'review-private', '未知回执仍保留的内部填写');
    submitFeedback(c);
    await idlePending(c);
    c.el('review-recover').click();
    await idlePending(c);
    assert.match(c.el('review-message').textContent, /原操作结果仍未知；不自动重试/);
    assert.doesNotMatch(c.el('review-message').textContent, /undefined|null|future-status/);
    assert.equal(c.el('review-fields').disabled, true);
    assert.equal(c.el('review-private').value, '未知回执仍保留的内部填写');
    assert.equal(c.storage.data.size, 1);
    assert.equal(releaseButton(c), undefined, '状态未知的现存回执不能作为无回执释放');
    c.el('manual-review-form').emit('submit');
    assert.equal(c.posts.length, 1);
    assert.equal(operationQueries(c).length, 1);
  }
});

test('明确无回执不重发，不把未知当成功；可明确重读并释放标记，文字仍保留', async () => {
  const c = browser({route: async (url, init) => {
    if (init.method === 'POST') throw new Error('synthetic response loss');
    if (url.startsWith('/api/operations/')) return response({operations: []});
  }});
  await c.ready();
  input(c, 'review-private', '无回执仍保留的输入');
  submitFeedback(c);
  await idlePending(c);
  c.el('review-recover').click();
  await idlePending(c);
  assert.equal(c.posts.length, 1);
  assert.equal(c.el('review-fields').disabled, true);
  assert.ok(releaseButton(c));
  assert.match(c.el('review-message').textContent, /不能推断成功或失败/);
  const reads = detailReads(c).length;
  c.el('review-refresh').click();
  await idlePending(c);
  assert.equal(detailReads(c).length, reads);
  assert.equal(c.el('review-private').value, '无回执仍保留的输入');
  c.setConfirm(false);
  releaseButton(c).click();
  assert.equal(c.storage.data.size, 1);
  assert.equal(detailReads(c).length, reads);
  c.setConfirm(true);
  releaseButton(c).click();
  await idleResolved(c);
  assert.equal(c.posts.length, 1);
  assert.equal(c.storage.data.size, 0);
  assert.equal(detailReads(c).length, reads + 1);
  assert.equal(c.el('review-private').value, '无回执仍保留的输入');
  assert.equal(c.el('review-decision').value, '');
  assert.match(c.el('review-message').textContent, /未判定原操作成功/);
});

test('无回执释放前若最新详情仍有未决操作，继续冻结而非遗忘 pending', async () => {
  let op;
  const c = browser({route: async (url, init, api) => {
    if (init.method === 'POST') {
      op = {id: init.headers['X-LJM-Operation-Id'], step: init.headers['X-LJM-Step-Id']};
      throw new Error('synthetic response loss');
    }
    if (url.startsWith('/api/operations/')) {
      const next = clone(api.detail);
      next.recent_operations = [{id: op.id, step: op.step, action: 'review', target: ID, at: AT, status: 'running'}];
      api.setDetail(next);
      return response({operations: []});
    }
  }});
  await c.ready();
  input(c, 'review-private', '详情未决操作仍冻结');
  submitFeedback(c);
  await idlePending(c);
  c.el('review-recover').click();
  await idlePending(c);
  releaseButton(c).click();
  await idlePending(c);
  assert.equal(c.el('review-fields').disabled, true);
  assert.equal(c.storage.data.size, 1);
  assert.equal(c.el('review-private').value, '详情未决操作仍冻结');
  assert.equal(c.posts.length, 1);
  assert.match(c.el('review-message').textContent, /不能释放/);
});

test('401、403及登录 HTML 写入响应都保留文字与操作标记，不回显服务错误', async () => {
  for (const kind of ['401', '403', 'html', 'broken-json']) {
    const c = browser({route: async (url, init) => {
      if (init.method !== 'POST') return;
      if (kind === 'html') return htmlResponse();
      if (kind === 'broken-json') return {
        ok: true, status: 200, headers: {get: () => 'application/json'},
        json: async () => { throw new Error('/srv/private/SECRET-JSON'); }
      };
      return response({error: '/srv/private/SECRET-SERVER', actor: 'SECRET-ACTOR'}, Number(kind));
    }});
    await c.ready();
    input(c, 'review-private', '登录失败必须保留的文字');
    input(c, 'basis-model', '未保存的型号依据');
    submitFeedback(c);
    await idlePending(c);
    assert.equal(c.el('review-private').value, '登录失败必须保留的文字', kind);
    assert.equal(c.el('basis-model').value, '未保存的型号依据', kind);
    assert.equal(c.storage.data.size, 1);
    assert.equal(c.posts.length, 1);
    assert.doesNotMatch(c.el('review-message').textContent, /\/srv|SECRET-SERVER|SECRET-ACTOR|SECRET-JSON/);
    if (kind !== 'broken-json') assert.match(c.el('review-message').textContent, /登录/);
  }
});

test('非 pending 的 dirty 重读必须确认，拒绝或读取失败都不渲染覆盖填写', async () => {
  let deny = false;
  const c = browser({route: async url => url === BASE && deny ? response({error: '/srv/private/SECRET-READ'}, 403) : undefined});
  await c.ready();
  input(c, 'review-private', '尚未保存的重读测试');
  choose(c, 'needs_info');
  const reads = detailReads(c).length;
  c.setConfirm(false);
  c.el('review-refresh').click();
  assert.equal(detailReads(c).length, reads);
  assert.equal(c.el('review-private').value, '尚未保存的重读测试');
  assert.equal(c.el('review-decision').value, 'needs_info');
  assert.equal(c.confirmations.length, 1);
  c.setConfirm(true);
  deny = true;
  c.el('review-refresh').click();
  await settle(() => !c.el('review-refresh').disabled);
  assert.equal(c.el('review-private').value, '尚未保存的重读测试');
  assert.equal(c.el('review-decision').value, 'needs_info');
  assert.doesNotMatch(c.el('review-message').textContent, /SECRET-READ|\/srv/);
  deny = false;
  c.el('review-refresh').click();
  await settle(() => !c.el('review-refresh').disabled);
  assert.equal(c.el('review-private').value, '已保存的内部备注');
  assert.equal(c.el('review-decision').value, '');
  assert.ok(checks(c).every(check => !check.checked));
});

test('sessionStorage 读写异常不阻断审核和内存中的重复写冻结', async () => {
  const storage = store({throwRead: true, throwWrite: true});
  const c = browser({storage, route: async (url, init) => {
    if (init.method === 'POST') throw new Error('synthetic response loss');
  }});
  await c.ready();
  assert.equal(c.el('review-fields').disabled, false);
  input(c, 'review-private', '存储不可用仍保留');
  submitFeedback(c);
  await idlePending(c);
  assert.equal(c.el('review-fields').disabled, true);
  c.el('manual-review-form').emit('submit');
  assert.equal(c.posts.length, 1);
  assert.equal(c.el('review-private').value, '存储不可用仍保留');
  assert.equal(c.beforeUnload().prevented, true);
});

test('AbortController 超时中止请求，未知结果保持冻结且不会自动重发', async () => {
  const clock = manualClock();
  const c = browser({clock, route: async (url, init) => {
    if (init.method !== 'POST') return;
    return await new Promise((resolve, reject) => {
      init.signal.addEventListener('abort', () => reject(new Error('/srv/private/aborted')), {once: true});
    });
  }});
  await c.ready();
  assert.equal(clock.timers.size, 0);
  input(c, 'review-private', '超时保留文字');
  submitFeedback(c);
  assert.equal(c.posts.length, 1);
  assert.equal(clock.timers.size, 1);
  clock.fire();
  await idlePending(c);
  assert.equal(c.posts[0].init.signal.aborted, true);
  assert.equal(clock.timers.size, 0);
  assert.equal(c.posts.length, 1);
  assert.equal(c.el('review-private').value, '超时保留文字');
  assert.equal(c.el('review-fields').disabled, true);
  assert.match(c.el('review-message').textContent, /超时/);
  assert.doesNotMatch(c.el('review-message').textContent, /\/srv/);
});
