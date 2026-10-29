import test from 'node:test';
import assert from 'node:assert/strict';
import { initializeMergeExecution } from '../public/merge-execution.js';

const storageKey = 'ljm-private-merge-operation';
const attempt = { id: '11111111-1111-4111-8111-111111111111', step: '22222222-2222-4222-8222-222222222222' };
const receipt = status => ({ operationId: attempt.id, stepId: attempt.step, status });

// Only the DOM surfaces used during startup recovery are needed; no form or merge logic is simulated.
class ElementStub {
  hidden = false; disabled = false; checked = false; open = false; value = ''; textContent = ''; innerHTML = ''; dataset = {};
  listeners = new Map(); children = new Map();
  addEventListener(type, listener) { this.listeners.set(type, [...(this.listeners.get(type) ?? []), listener]); }
  querySelector(selector) { if (!this.children.has(selector)) this.children.set(selector, new ElementStub()); return this.children.get(selector); }
  querySelectorAll() { return []; }
  close() { this.open = false; }
  reset() {}
}

async function startRecovery(t, response, { refreshError = false } = {}) {
  const nodes = new Map(), storage = new Map([[storageKey, JSON.stringify(attempt)]]), events = [], requests = [], messages = [];
  const get = id => { if (!nodes.has(id)) nodes.set(id, new ElementStub()); return nodes.get(id); };
  const document = {
    getElementById: get, querySelector: selector => get(selector),
    addEventListener() {}, dispatchEvent: event => { events.push(event.type); return true; },
  };
  const windowListeners = new Map(), descriptors = new Map(), timers = new Set();
  const install = (name, value) => { descriptors.set(name, Object.getOwnPropertyDescriptor(globalThis, name)); Object.defineProperty(globalThis, name, { configurable: true, writable: true, value }); };
  const timeout = globalThis.setTimeout, interval = globalThis.setInterval;
  t.after(() => {
    for (const timer of timers) clearTimeout(timer);
    for (const [name, descriptor] of descriptors) { if (descriptor) Object.defineProperty(globalThis, name, descriptor); else delete globalThis[name]; }
  });
  install('document', document);
  install('window', { addEventListener: (type, listener) => windowListeners.set(type, listener) });
  install('sessionStorage', { getItem: key => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, value), removeItem: key => storage.delete(key) });
  install('setTimeout', (fn, delay, ...args) => { const timer = timeout(fn, delay, ...args); timers.add(timer); return timer; });
  install('setInterval', (fn, delay, ...args) => { const timer = interval(fn, delay, ...args); timers.add(timer); return timer; });
  let refreshed = 0;
  await initializeMergeExecution({
    request: async (url, options) => {
      requests.push({ url, options });
      if (url === '/api/merge-capabilities') return { internalExecutionEnabled: true, online: true, undoEnabled: false };
      assert.equal(url, '/api/merge-attempt/resolve', 'Startup must resolve the existing attempt instead of submitting another merge.');
      assert.deepEqual(options.body, { operationId: attempt.id, stepId: attempt.step });
      if (response instanceof Error) throw response;
      return structuredClone(response);
    },
    getState: () => ({ plan: { planId: 'synthetic-saved-plan', planRevision: 1 } }),
    setBusy() {},
    onCommitted: async () => { refreshed++; if (refreshError) throw new Error('Synthetic list refresh failed'); },
    say: (message, tone) => messages.push({ message, tone }),
  });
  return { get, storage, requests, events, messages, refreshed: () => refreshed,
    protectsUnload: () => { let prevented = false; windowListeners.get('beforeunload')?.({ preventDefault() { prevented = true; }, returnValue: undefined }); return prevented; },
  };
}

test('旧session请求经持久未执行证明后释放，保留方案并允许重新审核', async t => {
  const f = await startRecovery(t, { state: 'not-started', operation: receipt('cancelled'), merge: null });
  assert.equal(f.storage.get(storageKey), undefined);
  assert.equal(f.get('recover-merge').hidden, true); assert.equal(f.get('repair-merge').hidden, true);
  assert.equal(f.get('review-merge').disabled, false); assert.equal(f.protectsUnload(), false);
  assert.match(f.get('merge-execution-status').textContent, /已核实上次请求未执行.*方案已保留/);
  assert.equal(f.requests.filter(row => row.url === '/api/merge-attempt/resolve').length, 1);
  assert.equal(f.refreshed(), 0);
});

test('运行中、待核对、未知、网络失败或不匹配收据均保留原pending，不能当作未执行', async t => {
  const hash = 'a'.repeat(64);
  const cases = [
    ['running', { state: 'running', operation: receipt('running') }],
    ['needs-review', { state: 'needs-review', operation: { ...receipt('needs_review'), requestHash: hash } }],
    ['unknown', { state: 'unknown' }],
    ['network-error', new Error('Synthetic network failure')],
    ['wrong-receipt', { state: 'not-started', operation: { ...receipt('cancelled'), stepId: '33333333-3333-4333-8333-333333333333' } }],
    ['unproven-not-started', { state: 'not-started', operation: receipt('succeeded') }],
  ];
  for (const [name, response] of cases) await t.test(name, async sub => {
    const f = await startRecovery(sub, response), pending = JSON.parse(f.storage.get(storageKey));
    assert.equal(pending.id, attempt.id); assert.equal(pending.step, attempt.step);
    assert.equal(f.get('recover-merge').hidden, false); assert.equal(f.protectsUnload(), true);
    assert.equal(f.refreshed(), 0); assert.equal(f.get('execute-submit').disabled, true);
    if (name === 'needs-review') { assert.equal(pending.requestHash, hash); assert.equal(f.get('repair-merge').hidden, false); }
    assert.ok(f.requests.every(row => row.url !== '/api/merge'));
  });
});

test('已证明合并完成时列表刷新失败仍结束pending，提示刷新而不再次合并', async t => {
  const f = await startRecovery(t, { state: 'finished', operation: receipt('succeeded'), merge: {
    status: 'committed', phase: 'committed', primary_id: 'LJM-20000101-LET-001', secondary_id: 'LJM-20000101-LET-002', events: [], snapshots: [],
  } }, { refreshError: true });
  assert.equal(f.refreshed(), 1); assert.equal(f.storage.get(storageKey), undefined);
  assert.equal(f.get('recover-merge').hidden, true); assert.equal(f.get('review-merge').disabled, true);
  assert.equal(f.protectsUnload(), false); assert.ok(f.events.includes('merge-records-updated'));
  assert.ok(f.messages.some(row => /合并已完成，但列表刷新失败.*不要再次合并/.test(row.message)));
  assert.ok(f.requests.every(row => row.url !== '/api/merge'));
});
