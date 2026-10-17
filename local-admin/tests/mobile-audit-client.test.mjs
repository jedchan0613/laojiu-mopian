import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import { randomUUID } from 'node:crypto';
import test from 'node:test';
const script = (await readFile(new URL('../public/app.js', import.meta.url), 'utf8')).replaceAll('\r\n', '\n');
const gate = () => { let resolve; const promise = new Promise(r => { resolve = r; }); return { promise, resolve }; };
const id = 'LJM-20000101-LET-001', revision = 'a'.repeat(64), nextRevision = 'b'.repeat(64);

test('普通确认的取消与Esc保持false，只有三选离开框返回字符串选项', async () => {
  const listeners = {}, elements = {};
  for (const key of ['confirmDialog', 'confirmDialogTitle', 'confirmDialogMessage', 'confirmDialogNoticeTitle', 'confirmDialogNoticeText', 'confirmDialogNotice', 'confirmDialogAccept', 'confirmDialogSave']) {
    elements[key] = { dataset: {}, hidden: false, classList: { toggle() {} }, focus() {}, addEventListener(name, fn) { listeners[`${key}:${name}`] = fn; } };
  }
  elements.confirmDialog.showModal = () => { elements.confirmDialog.open = true; };
  elements.confirmDialog.close = () => { elements.confirmDialog.open = false; listeners['confirmDialog:close'](); };
  const context = vm.createContext({ elements, requestAnimationFrame: fn => fn() });
  vm.runInContext(`${script.slice(script.indexOf('let confirmDialogResolve ='), script.indexOf('// 各处“有尚未保存的修改”'))}\nglobalThis.confirm = confirmAction;`, context);
  let result = context.confirm({}); elements.confirmDialog.close(); assert.equal(await result, false);
  result = context.confirm({}); listeners['confirmDialogAccept:click'](); assert.equal(await result, true);
  result = context.confirm({ saveLabel: '保存并离开' }); elements.confirmDialog.close(); assert.equal(await result, 'cancel');
  result = context.confirm({ saveLabel: '保存并离开' }); listeners['confirmDialogSave:click'](); assert.equal(await result, 'save');
});

const saveFixture = (apiPost, stageImageUpload = async () => ({})) => {
  const context = vm.createContext({
    state: { writeProtocol: 2, current: { core: { item_id: '', title: '开始保存时的题名' }, metadata: { schema: 'common', dimensions: { retained: ['隐藏值'] } }, public_view: {} }, isNew: true, dirty: true,
      images: [], pendingRemovedImages: [], editSequence: 0, activeTab: 'quick' },
    deepClone: structuredClone, pendingWriteReview: null, apiPost, stageImageUpload,
    draftSavePrerequisiteIssues: () => [], beginCancellableOperation: () => ({ id: randomUUID() }), beginQuietOperation: () => ({ quiet: true }),
    throwIfOperationCancelled() {}, updateCancellableOperation() {}, finishCancellableOperation() {}, updateHeader() {}, renderEditorPreservingViewport() {},
    recordImages: record => record.core.publication_file_path?.map(filename => ({ kind: 'existing', filename })) ?? [],
    showToast() {}, scheduleAutoSaveDraft() {}, isOperationCancellation: () => false, classifySaveError: e => ['failed', e.message],
    fileSha256: async () => 'c'.repeat(64), URL: { revokeObjectURL() {} }, itemIdPattern: /^LJM-\d{8}-[A-Z]{3}-\d{3}$/,
    loadBootstrap: () => { throw new Error('不应刷新覆盖新输入'); },
  });
  vm.runInContext(`const expectedRecordRevision = () => state.current._admin?.revision; const setSavePhase = (phase) => { state.savePhase=phase; }; const autoSaveTimeLabel=()=> '12:00';
    ${script.slice(script.indexOf('const saveDraft = async'), script.indexOf('const publishCurrent = async'))}\nglobalThis.save = saveDraft;`, context);
  return context;
};
test('上传期间固定完整快照；新建响应回填永久编号但保留之后文字和图片说明', async () => {
  const uploading = gate(), resume = gate(); let sent;
  const context = saveFixture(async (_url, payload) => {
    sent = structuredClone(payload);
    return { draft: { record: { ...structuredClone(payload.record), core: { ...payload.record.core, item_id: id, publication_file_path: [`/archive/${id}/front-public.png`] } }, saved_at: 'now' }, revision: nextRevision };
  }, async () => { uploading.resolve(); await resume.promise; return { uploadToken: randomUUID(), originalName: 'sample.png' }; });
  context.state.images = [{ id: 'image-1', kind: 'new', file: { name: 'sample.png' }, description: '开始保存时的说明' }];
  const task = context.save(); await uploading.promise;
  context.state.current.core.title = '保存期间继续输入'; context.state.images[0].description = '保存期间补充的说明'; context.state.editSequence++;
  resume.resolve(); await task;
  assert.equal(sent.record.core.title, '开始保存时的题名');
  assert.equal(sent.record.public_view.image_descriptions[0], '开始保存时的说明');
  assert.equal(context.state.current.core.title, '保存期间继续输入');
  assert.equal(context.state.current.core.item_id, id); assert.equal(context.state.isNew, false);
  assert.equal(context.state.current._admin.revision, nextRevision); assert.equal(context.state.dirty, true);
  assert.equal(context.state.images[0].description, '保存期间补充的说明'); assert.equal(context.state.images[0].kind, 'existing');
  assert.deepEqual([...context.state.current.metadata.dimensions.retained], ['隐藏值']);
});

test('旧保存响应不能更新已经切换到另一档案的表单', async () => {
  const started = gate(), resume = gate();
  const context = saveFixture(async (_url, payload) => {
    started.resolve(); await resume.promise;
    return { draft: { record: { ...payload.record, core: { ...payload.record.core, item_id: id } } }, revision: nextRevision };
  });
  const task = context.save(); await started.promise;
  const other = { core: { item_id: 'LJM-20000101-LET-002', title: '另一条档案' } };
  context.state.current = other; resume.resolve(); await task;
  assert.equal(context.state.current, other); assert.equal(context.state.current._admin, undefined);
});

test('图片成功但响应丢失后，凭原收据沿用可用令牌而不再上传', async () => {
  const token = randomUUID(), step = randomUUID(); let posts = 0;
  const context = vm.createContext({ state: { writeProtocol: 2 }, pendingWriteReview: null,
    crypto: { randomUUID }, throwIfOperationCancelled() {}, updateCancellableOperation() {},
    fetch: async (_url, options) => { if (options?.method === 'POST') posts++; return { ok: true, json: async () => ({ operations: [{ stepId: step, status: 'succeeded', result: { upload: { token } } }] }) }; },
    readApiJson: response => response.json(), apiPost: async () => ({ statuses: { [token]: 'available' } }),
  });
  vm.runInContext(`${script.slice(script.indexOf('const stageImageUpload = async'), script.indexOf('const validateSelectedImage ='))}\nglobalThis.upload=stageImageUpload;`, context);
  const result = await context.upload({ id: randomUUID(), uploadStepId: step, file: { name: 'sample.png' } }, { id: randomUUID() }, 1, 1);
  assert.equal(result.uploadToken, token); assert.equal(posts, 0);
});

test('核对新建成功收据后回填同一编号，保留后来输入并允许按现有档案继续保存', async () => {
  let review;
  const record = { core: { item_id: '', title: '后来继续输入' }, public_view: {} };
  const pending = { operationId: randomUUID(), stepId: randomUUID(), payload: { images: [] }, recovery: { recordAtStart: record, snapshotSequence: 0, snapshotImages: [] } };
  const state = { current: record, editSequence: 1, isNew: true, dirty: true, images: [] };
  const context = vm.createContext({ state, elements: { reviewButton: { addEventListener: (_event, fn) => { review = fn; } } },
    fetch: async url => ({ ok: true, json: async () => url.includes('/api/operations/')
      ? { operations: [{ kind: 'save-draft', stepId: pending.stepId, status: 'succeeded', result: { itemId: id, revision: nextRevision } }] }
      : { draft: { record: { core: { item_id: id }, public_view: {} }, saved_at: 'now' }, revision: nextRevision } }),
    readApiJson: response => response.json(), itemIdPattern: /^LJM-\d{8}-[A-Z]{3}-\d{3}$/, setSavePhase: phase => { state.savePhase = phase; },
    renderEditor() {}, showToast() {}, autoSaveTimeLabel: () => '12:00', recordImages: () => [],
  });
  context.pending = pending;
  vm.runInContext(`let pendingWriteReview=pending; ${script.slice(script.indexOf("elements.reviewButton.addEventListener('click'"), script.indexOf('const requestedItem ='))}`, context);
  await review();
  assert.equal(state.current.core.item_id, id); assert.equal(state.isNew, false); assert.equal(state.current.core.title, '后来继续输入');
  assert.equal(state.current._admin.revision, nextRevision); assert.equal(state.dirty, true);
});

test('图片失败终态改用新子编号重传，仍保持同一父操作', async () => {
  const oldStep = randomUUID(), parent = randomUUID(), token = randomUUID(); let headers;
  const context = vm.createContext({ state: { writeProtocol: 2 }, pendingWriteReview: null, crypto: { randomUUID },
    throwIfOperationCancelled() {}, updateCancellableOperation() {}, readApiJson: response => response.json(),
    fetch: async (_url, options) => ({ ok: true, json: async () => {
      if (!options?.method) return { operations: [{ stepId: oldStep, status: 'failed' }] };
      headers = options.headers; return { upload: { token } };
    } }),
  });
  vm.runInContext(`${script.slice(script.indexOf('const stageImageUpload = async'), script.indexOf('const validateSelectedImage ='))}\nglobalThis.upload=stageImageUpload;`, context);
  const image = { id: randomUUID(), uploadStepId: oldStep, file: { name: 'sample.png', type: 'image/png' } };
  assert.equal((await context.upload(image, { id: parent, controller: { signal: undefined } }, 1, 1)).uploadToken, token);
  assert.notEqual(headers['X-LJM-Step-Id'], oldStep); assert.equal(headers['X-LJM-Operation-Id'], parent);
});

test('发布响应丢失只查询精确子收据并刷新结果，不重复发布', async () => {
  let review, loads = 0; const record = { core: { item_id: id } };
  const pending = { operationId: randomUUID(), stepId: randomUUID(), payload: { itemId: id }, recovery: { recordAtStart: record } };
  const state = { current: record, dirty: false };
  const context = vm.createContext({ state, pending, elements: { reviewButton: { addEventListener: (_event, fn) => { review = fn; } } },
    fetch: async url => ({ ok: true, json: async () => url.includes('/api/operations/')
      ? { operations: [{ kind: 'save-draft', stepId: randomUUID(), status: 'failed' }, { kind: 'publish', stepId: pending.stepId, status: 'succeeded', result: { itemId: id, revision: nextRevision } }] }
      : { revision: nextRevision } }),
    readApiJson: response => response.json(), itemIdPattern: /^LJM-\d{8}-[A-Z]{3}-\d{3}$/, setSavePhase: phase => { state.savePhase = phase; },
    hasUnsavedChanges: () => false, loadBootstrap: async () => { loads++; }, renderEditor() {}, showToast() {},
  });
  vm.runInContext(`let pendingWriteReview=pending; ${script.slice(script.indexOf("elements.reviewButton.addEventListener('click'"), script.indexOf('const requestedItem ='))}\nglobalThis.isPending=()=>!!pendingWriteReview;`, context);
  await review(); assert.equal(loads, 1); assert.equal(context.isPending(), false);
  assert.equal(state.publicationResult.itemId, id);
});

test('网络恢复核对失败或登录过期时不安排自动重发', async () => {
  for (const newRecord of [false, true]) {
    const state = { current: { core: { item_id: newRecord ? '' : id } }, isNew: newRecord, dirty: true, savePhase: 'offline' };
    const context = vm.createContext({ state, crypto: { randomUUID }, activeOperation: null, pendingWriteReview: null,
      expectedRecordRevision: () => revision, fetch: async () => ({ ok: false, status: 401 }), readApiJson: async () => ({ error: 'expired' }),
      setSavePhase: phase => { state.savePhase = phase; }, showToast() {}, hasUnsavedChanges: () => true,
    });
    vm.runInContext(`${script.slice(script.indexOf('const recheckAfterForeground = async'), script.indexOf("window.addEventListener('offline'"))}\nglobalThis.recheck=recheckAfterForeground;`, context);
    assert.equal(await context.recheck(), false); assert.equal(state.savePhase, 'auth');
  }
});
