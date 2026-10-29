import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { DatabaseSync } from 'node:sqlite';
import { createMergePlanner, buildMergeFields } from '../archive-merge-plans.mjs';
import { createMergeReferenceInspector } from '../archive-merge-references.mjs';
import { actor, operation, fixture, png } from './helpers/merge-fixture.mjs';

test('字段策略逐一覆盖86项标准；保留缺失、null、0和false的区别', async t => {
  const f = await fixture(t);
  assert.equal(f.standard.commonFields.fields.length, 86);
  assert.deepEqual(Object.keys(f.policies).sort(), f.standard.commonFields.fields.map(row => row.field_code).sort());
  f.records[0].core.scan_ppi = 0; f.records[1].core.scan_ppi = 1;
  f.records[0].core.notes = null; delete f.records[1].core.notes;
  const fields = buildMergeFields(...f.records, f.standard, f.policies);
  assert.equal(fields.find(r => r.path === 'core.scan_ppi').primary, 0);
  const notes = fields.find(r => r.path === 'core.notes');
  assert.equal(notes.primaryPresent, true); assert.equal(notes.secondaryPresent, false); assert.equal(notes.same, false);
  assert.equal(fields.find(r => r.path === 'core.evidence_level').primary, 'D');
  assert.equal(fields.find(r => r.path === 'core.evidence_level').suggestion, '');
  const standards = structuredClone(f.standard); standards.commonFields.fields.push({ field_code: 'future_field', name: '新增字段' });
  assert.throws(() => buildMergeFields(...f.records, standards, f.policies), { code: 'MERGE_POLICY_MISSING' });
});

test('前置条件阻断自合并、未公开、草稿、不同归属和类型', async t => {
  const f = await fixture(t), { planner, ids, records } = f;
  await assert.rejects(planner.preflight([ids[0], ids[0]], actor));
  await assert.rejects(planner.preflight([ids[0]], actor));
  assert.equal((await planner.preflight([ids[0], 'LJM-20000101-LET-099'], actor)).blockers[0].code, 'NOT_OFFICIAL');
  for (const [key, value, code] of [['record_status', 'WDR', 'NOT_PUBLISHED'], ['privacy_level', 'Y', 'NOT_PUBLISHED'], ['use_status', 'U0', 'NOT_PUBLISHED'], ['master_file_path', 'Z:/must-never-read.tif', 'PRIVATE_PATH']]) {
    const old = records[0].core[key]; records[0].core[key] = value;
    assert.ok((await planner.preflight(ids, actor)).blockers.some(r => r.code === code));
    old === undefined ? delete records[0].core[key] : records[0].core[key] = old;
  }
  f.drafts.set(ids[0], {}); assert.equal((await planner.preflight(ids, actor)).canCompare, false); f.drafts.clear();
  records[0].core.album_id = 'A'; records[1].core.album_id = 'B';
  assert.ok((await planner.preflight(ids, actor)).blockers.some(r => r.code === 'GROUP_MISMATCH'));
  delete records[0].core.album_id; delete records[1].core.album_id;
  records[1].core.object_type = 'IDC'; records[1].metadata.schema = 'credential';
  assert.ok((await planner.preflight(ids, actor)).blockers.some(r => r.code === 'TYPE_MISMATCH'));
  const badId = createMergePlanner({ ...f.options, readState: async id => {
    const state = await f.options.readState(id);
    return id === ids[0] ? { ...state, official: { ...state.official, core: { ...state.official.core, item_id: ids[1] } } } : state;
  } });
  assert.ok((await badId.preflight(ids, actor)).blockers.some(r => r.code === 'ID_MISMATCH'));
});

test('专属schema字段和遮盖字段不会被扁平化或拼接；保留布尔false', async t => {
  const f = await fixture(t);
  for (const r of f.records) { r.core.object_type = 'IDC'; r.metadata.schema = 'credential'; r.metadata.dimensions = { ID09: { document_number_masked: '12***' } }; }
  // 字段所在维度从当前规范查找，避免测试维护第二套规范。
  const dim = f.standard.dimensions.credential.dimensions.find(d => d.fields.includes('document_number_masked')).dimension_code;
  for (const r of f.records) r.metadata.dimensions = { [dim]: { document_number_masked: '12***' } };
  const field = buildMergeFields(...f.records, f.standard, f.policies).find(r => r.path.endsWith('.document_number_masked'));
  assert.equal(field.masked, true); assert.ok(!field.allowedChoices.includes('union'));
  const boolDim = f.standard.dimensions.credential.dimensions.find(d => d.fields.includes('portrait_present'));
  if (boolDim) { f.records[0].metadata.dimensions[boolDim.dimension_code] = { portrait_present: false }; const b = buildMergeFields(...f.records, f.standard, f.policies).find(r => r.path.endsWith('.portrait_present')); assert.equal(b.primary, false); assert.equal(b.type, 'boolean'); }
  f.records[0].metadata.dimensions.BAD = {};
  assert.throws(() => buildMergeFields(...f.records, f.standard, f.policies), { code: 'MERGE_SCHEMA_INVALID' });
  delete f.records[0].metadata.dimensions.BAD;
  f.records[0].metadata.dimensions[dim].unrecognized = 'x';
  assert.throws(() => buildMergeFields(...f.records, f.standard, f.policies), { code: 'MERGE_FIELD_INVALID' });
});

test('图片摘要只建议重复，保存、重开与重启不改正式记录及任何图片', async t => {
  const f = await fixture(t), before = JSON.stringify(f.records), pf = await f.planner.preflight(f.ids, actor);
  assert.equal(pf.canExecute, false); assert.equal(pf.images.length, 2); assert.ok(pf.images[1].duplicateOf);
  const payload = f.payload(pf); payload.attachmentOrder.reverse();
  payload.attachmentDescriptions[pf.images[1].ref] = '合成第二页先显示';
  payload.fieldChoices['core.title'] = { choice: 'custom', value: '虚构前后页整合题名' };
  const op = operation(), saved = await f.planner.save(payload, actor, op);
  assert.equal(saved.status, 'plan-only'); assert.equal(saved.privacyReviewCompleted, false);
  assert.equal(saved.proposedRecord.core.item_id, f.ids[0]); assert.equal(saved.proposedRecord.core.title, '虚构前后页整合题名');
  assert.deepEqual(saved.proposedRecord.public_view.image_descriptions, ['合成第二页先显示', '虚构信件第001页']);
  assert.equal(saved.attachmentMap[0].targetFilename, 'detail-01-public.png');
  assert.equal(saved.attachmentMap[1].targetFilename, 'front-public.png');
  const restarted = createMergePlanner(f.options), detail = await restarted.detail(saved.planId, actor);
  assert.equal(detail.stale, false); assert.equal(detail.plan.planRevision, 1);
  assert.equal((await restarted.byOperation(op.operationId, op.stepId, actor)).planId, saved.planId);
  assert.equal((await restarted.list(actor)).length, 1);
  assert.deepEqual(await restarted.list('another-operator'), []);
  await assert.rejects(restarted.detail(saved.planId, 'another-operator'), { statusCode: 403 });
  assert.equal(JSON.stringify(f.records), before);
  for (const id of f.ids) assert.deepEqual(await fs.readFile(path.join(f.imageRoot, id, 'front-public.png')), png);
  assert.equal((await fs.readdir(f.privateRoot)).includes('drafts'), false);
});

test('禁止写保护字段、无效代码、陌生字段与原型路径；尺寸不能以0充当未知', async t => {
  const f = await fixture(t); f.records[0].core.width_mm = 30;
  const pf = await f.planner.preflight(f.ids, actor), base = f.payload(pf);
  for (const [key, decision, code] of [
    ['core.item_id', { choice: 'custom', value: f.ids[1] }, 'MERGE_FIELD_INVALID'],
    ['core.evidence_level', { choice: 'custom', value: 'INVENTED' }, 'MERGE_CODE_INVALID'],
    ['core.width_mm', { choice: 'custom', value: 0 }, 'MERGE_INVALID'],
    ['core.unknown', { choice: 'primary' }, 'MERGE_FIELD_INVALID'],
    ['__proto__.polluted', { choice: 'custom', value: 'x' }, 'MERGE_FIELD_INVALID'],
  ]) {
    const payload = structuredClone(base); payload.fieldChoices[key] = decision;
    await assert.rejects(f.planner.save(payload, actor, operation()), { code });
  }
  assert.equal({}.polluted, undefined);
});

test('已有电子转录可选主、选从或自定义保存，转录状态仍使用正式代码', async t => {
  const f = await fixture(t);
  f.records[0].public_view.transcription = '合成贺卡题字甲\n姓名〔遮盖〕';
  f.records[1].public_view.transcription = '合成贺卡题字乙\n疑读〔不清〕';
  for (const record of f.records) record.core.transcription_status = 'TX2';
  const before = structuredClone(f.records), pf = await f.planner.preflight(f.ids, actor);
  assert.deepEqual(pf.fields.find(field => field.path === 'public_view.transcription').options, []);
  assert.ok(pf.fields.find(field => field.path === 'core.transcription_status').options.some(option => option.code === 'TX2'));
  for (const [decision, expected] of [
    [{ choice: 'primary' }, before[0].public_view.transcription],
    [{ choice: 'secondary' }, before[1].public_view.transcription],
    [{ choice: 'custom', value: '合成整合原文\n姓名〔遮盖〕\n〔不清〕' }, '合成整合原文\n姓名〔遮盖〕\n〔不清〕'],
  ]) {
    const payload = f.payload(pf); payload.fieldChoices['public_view.transcription'] = decision;
    const saved = await f.planner.save(payload, actor, operation());
    assert.equal(saved.proposedRecord.public_view.transcription, expected);
    assert.equal(saved.proposedRecord.core.transcription_status, 'TX2');
  }
  const invalid = f.payload(pf); invalid.fieldChoices['core.transcription_status'] = { choice: 'custom', value: '编造状态' };
  await assert.rejects(f.planner.save(invalid, actor, operation()), { code: 'MERGE_CODE_INVALID' });
  assert.deepEqual(f.records, before);
});

test('公开呈现字段不按同名字典校验，正文、检索标签和修订说明保持自由文本', async t => {
  const f = await fixture(t);
  for (const name of ['description', 'tags', 'revision_note', 'image_descriptions']) {
    f.standard.codeDictionary.entries.push({ enabled: true, dictionary_key: name, field: name, code: 'SYNTHETIC', label: '合成同名字典' });
  }
  const pf = await f.planner.preflight(f.ids, actor), payload = f.payload(pf);
  for (const field of pf.fields.filter(field => field.path.startsWith('public_view.'))) assert.deepEqual(field.options, [], field.path);
  payload.fieldChoices['public_view.description'] = { choice: 'custom', value: '合成整件公开描述' };
  payload.fieldChoices['public_view.tags'] = { choice: 'custom', value: ['自由检索词', '合成验收'] };
  payload.fieldChoices['public_view.revision_note'] = { choice: 'custom', value: '按合成图像重新整理说明' };
  const saved = await f.planner.save(payload, actor, operation());
  assert.deepEqual(saved.proposedRecord.public_view.tags, ['自由检索词', '合成验收']);
  assert.equal(saved.proposedRecord.public_view.description, '合成整件公开描述');
  assert.equal(saved.proposedRecord.public_view.revision_note, '按合成图像重新整理说明');
});

test('来源代码、日期、整数与新增字段均明确校验，未配置策略不悄悄沿用', async t => {
  const f = await fixture(t); f.records[0].core.date_start = '2000-01-01'; f.records[0].core.people_count = 1;
  let pf = await f.planner.preflight(f.ids, actor), payload = f.payload(pf);
  for (const [key, value] of [['core.date_start', '2001-02-29'], ['core.date_start', '2000-13-01'], ['core.people_count', 1.5]]) {
    const p = structuredClone(payload); p.fieldChoices[key] = { choice: 'custom', value };
    await assert.rejects(f.planner.save(p, actor, operation()), { code: 'MERGE_INVALID' });
  }
  payload.fieldChoices['core.date_start'] = { choice: 'custom', value: '2000-02-29' };
  assert.ok((await f.planner.save(payload, actor, operation())).planId);
  f.records[0].core.evidence_level = 'INVENTED'; pf = await f.planner.preflight(f.ids, actor); payload = f.payload(pf);
  await assert.rejects(f.planner.save(payload, actor, operation()), { code: 'MERGE_CODE_INVALID' });
  f.records[0].core.evidence_level = 'D'; f.records[0].core.future = 'future';
  assert.ok((await f.planner.preflight(f.ids, actor)).blockers.some(r => r.code === 'MERGE_POLICY_MISSING'));
});

test('附件取舍逐页留有原因，图注随排序；所有页都必须被交代', async t => {
  const f = await fixture(t), pf = await f.planner.preflight(f.ids, actor), payload = f.payload(pf);
  payload.attachmentOrder = [pf.images[0].ref];
  await assert.rejects(f.planner.save(payload, actor, operation()), { code: 'MERGE_IMAGES_INVALID' });
  payload.excludedImages = [{ ref: pf.images[1].ref, reason: '' }];
  const plan = await f.planner.save(payload, actor, operation());
  assert.ok(plan.unresolved.some(r => r.path === 'images')); assert.equal(plan.attachmentMap.length, 1);
  payload.attachmentOrder = []; await assert.rejects(f.planner.save(payload, actor, operation()), { code: 'MERGE_IMAGES_INVALID' });
});

test('并发保存使用方案版本校验，旧结果查询仍返回当时版本', async t => {
  const f = await fixture(t), pf = await f.planner.preflight(f.ids, actor), payload = f.payload(pf), op = operation();
  const first = await f.planner.save(payload, actor, op);
  const next = { ...payload, planId: first.planId, planRevision: 1, sourceReason: '实际更改后用于并发保存的新依据' };
  const results = await Promise.allSettled([f.planner.save(next, actor, operation()), f.planner.save(next, actor, operation())]);
  assert.equal(results.filter(r => r.status === 'fulfilled').length, 1);
  assert.equal(results.find(r => r.status === 'rejected').reason.code, 'MERGE_PLAN_CONFLICT');
  assert.equal((await f.planner.byOperation(op.operationId, op.stepId, actor)).planRevision, 1);
  assert.equal((await f.planner.detail(first.planId, actor)).plan.planRevision, 2);
  assert.equal((await fs.readdir(path.join(f.directory, 'versions'))).length, 2);
});

test('不修改内容的多次保存不新增方案或版本，原请求仍可找回', async t => {
  const f=await fixture(t),pf=await f.planner.preflight(f.ids,actor),payload=f.payload(pf);
  const first=await f.planner.save(payload,actor,operation());
  const currentFile=path.join(f.directory,'plans',first.planId+'.json'),before=await fs.readFile(currentFile);
  const repeated={...payload,planId:first.planId,planRevision:1};
  // 显式重复默认选择及原图注也属于有效内容相同。
  repeated.fieldChoices['public_view.tags']={choice:'union',reason:''};
  repeated.attachmentDescriptions[pf.images[0].ref]=pf.images[0].description;
  for(let i=0;i<3;i++){
    const op=operation(),saved=await f.planner.save(repeated,actor,op);
    assert.equal(saved.planRevision,1);assert.equal(saved.saveUnchanged,true);assert.equal(saved.updatedAt,first.updatedAt);
    assert.equal((await f.planner.byOperation(op.operationId,op.stepId,actor)).saveUnchanged,true);
  }
  const sameNew=await f.planner.save(payload,actor,operation());assert.equal(sameNew.planId,first.planId);assert.equal(sameNew.saveUnchanged,true);
  assert.deepEqual(await fs.readFile(currentFile),before);
  assert.equal((await fs.readdir(path.join(f.directory,'plans'))).length,1);assert.equal((await fs.readdir(path.join(f.directory,'versions'))).length,1);
  repeated.sourceReason+='新增真实说明';assert.equal((await f.planner.save(repeated,actor,operation())).planRevision,2);
});

test('正式记录、图片、引用明细或标准变更都使原方案失效，仍保留选值', async t => {
  const f = await fixture(t), pf = await f.planner.preflight(f.ids, actor), payload = f.payload(pf);
  payload.fieldChoices['core.title'] = { choice: 'custom', value: '应保留的人工编辑' };
  const first = await f.planner.save(payload, actor, operation());
  const next = { ...payload, planId: first.planId, planRevision: 1 };
  for (const mutate of [
    async () => { f.records[0].core.updated_date = '2000-01-02'; },
    async () => { await fs.appendFile(path.join(f.imageRoot, f.ids[0], 'front-public.png'), Buffer.from([1])); },
    async () => { f.setRefs([{ key: 'synthetic', label: '合成引用', availability: 'available', count: 0, digest: 'changed-details-same-count' }]); },
    async () => { f.standard.commonFields.source_note = '规范版本变化'; },
  ]) {
    await mutate(); await assert.rejects(f.planner.save(next, actor, operation()), { code: 'MERGE_STALE' });
    const detail = await f.planner.detail(first.planId, actor); assert.equal(detail.stale, true);
    assert.equal(detail.plan.fieldChoices['core.title'].value, '应保留的人工编辑');
    const current = detail.current; next.expectedRevisions = current.fingerprints.revisions; next.basisFingerprint = current.fingerprint;
    next.attachmentOrder = current.images.map(image => image.ref);
  }
  await assert.rejects(f.planner.save(next, actor, operation()), { code: 'MERGE_STALE' });
  next.refreshBasis = true; assert.equal((await f.planner.save(next, actor, operation())).planRevision, 2);
});

test('图片缺失、签名不符、越界、大小写冲突与链接目录均阻断', async t => {
  const f = await fixture(t), file = path.join(f.imageRoot, f.ids[0], 'front-public.png');
  await fs.writeFile(file, 'not-an-image'); assert.equal((await f.planner.preflight(f.ids, actor)).canCompare, false);
  await fs.writeFile(file, png); f.records[0].core.publication_file_path.push(`/archive/${f.ids[0]}/FRONT-public.png`);
  assert.equal((await f.planner.preflight(f.ids, actor)).canCompare, false);
  f.records[0].core.publication_file_path = ['/archive/../other/front-public.png'];
  assert.equal((await f.planner.preflight(f.ids, actor)).canCompare, false);
  f.records[0].core.publication_file_path = [`/archive/${f.ids[0]}/missing.png`];
  assert.equal((await f.planner.preflight(f.ids, actor)).canCompare, false);
  const linked = path.join(f.imageRoot, 'linked'), target = path.join(f.imageRoot, f.ids[0]);
  await fs.symlink(target, linked, process.platform === 'win32' ? 'junction' : 'dir');
  // 换成链接目录，但仍使用目标永久编号，不能通过真实路径绕过检查。
  await fs.rename(target, target + '-real'); await fs.symlink(target + '-real', target, process.platform === 'win32' ? 'junction' : 'dir');
  f.records[0].core.publication_file_path = [`/archive/${f.ids[0]}/front-public.png`];
  assert.equal((await f.planner.preflight(f.ids, actor)).canCompare, false);
});

test('引用适配器只读实际收藏，不创建数据库；未知点赞不是0', async t => {
  const f = await fixture(t), accounts = path.join(f.privateRoot, 'accounts');
  const inspect = createMergeReferenceInspector({ accountDirectory: accounts, submissionDirectory: path.join(f.privateRoot, 'submissions'), mergeDirectory: f.directory });
  let refs = await inspect(f.ids, f.records);
  assert.equal(refs.find(r => r.key === 'favorites').count, null); assert.equal(refs.find(r => r.key === 'likes').availability, 'unknown');
  await assert.rejects(fs.stat(accounts), { code: 'ENOENT' });
  await fs.mkdir(accounts); const db = new DatabaseSync(path.join(accounts, 'accounts.db'));
  db.exec('CREATE TABLE favorites(user_id TEXT,item_id TEXT,created_at TEXT)');
  db.prepare('INSERT INTO favorites VALUES (?,?,?)').run('synthetic-one', f.ids[0], '2000-01-01'); db.close();
  refs = await inspect(f.ids, f.records); const before = refs.find(r => r.key === 'favorites'); assert.equal(before.count, 1);
  const edit = new DatabaseSync(path.join(accounts, 'accounts.db')); edit.exec("UPDATE favorites SET user_id='synthetic-two'"); edit.close();
  assert.notEqual((await inspect(f.ids, f.records)).find(r => r.key === 'favorites').digest, before.digest);
  const submission = path.join(f.privateRoot, 'submissions', 'TG-' + 'A'.repeat(24)); await fs.mkdir(submission, { recursive: true });
  await fs.writeFile(path.join(submission, 'record.json'), JSON.stringify({ linked_item_id: f.ids[1], status: 'published', account_id: 'synthetic' }));
  const ledger = path.join(f.directory, randomUUID()); await fs.mkdir(ledger, { recursive: true });
  await fs.writeFile(path.join(ledger, 'manifest.json'), JSON.stringify({ status: 'committed', primary_id: f.ids[1], secondary_id: 'LJM-20000101-LET-099' }));
  refs = await inspect(f.ids, f.records);
  assert.equal(refs.find(r => r.key === 'submissions').blocking, true); assert.equal(refs.find(r => r.key === 'merge-chain').blocking, true);
  const likes = path.join(f.privateRoot, 'likes.json'); await fs.writeFile(likes, JSON.stringify({ version:1, items: { [f.ids[0]]: { voters: ['a'.repeat(64)] } } }));
  const connected = createMergeReferenceInspector({ accountDirectory: accounts, submissionDirectory: path.join(f.privateRoot, 'submissions'), mergeDirectory: f.directory, likesFile: likes });
  assert.equal((await connected(f.ids, f.records)).find(r => r.key === 'likes').blocking, true);
});

test('逐语言核对译文的实际内容摘要；相同数量的新译文仍会使方案基础变化', async t => {
  const f = await fixture(t), translationDirectory = path.join(f.privateRoot, 'translations'), siteDataDirectory = path.join(f.root, 'site-data');
  await fs.mkdir(translationDirectory); await fs.mkdir(siteDataDirectory);
  const file = path.join(translationDirectory, f.ids[0] + '.json');
  await fs.writeFile(file, JSON.stringify({ item_id: f.ids[0], revision: 1, published: { locale: 'en', fields: { 'core.title': 'Synthetic letter' } } }));
  await fs.writeFile(path.join(siteDataDirectory, 'archive-translations.json'), JSON.stringify({ records: { [f.ids[0]]: { locale: 'en', status: 'published' } } }));
  const inspect = createMergeReferenceInspector({ accountDirectory: path.join(f.privateRoot, 'accounts'), submissionDirectory: path.join(f.privateRoot, 'submissions'), mergeDirectory: f.directory, translationDirectory, siteDataDirectory });
  let refs = await inspect(f.ids, f.records), translated = refs.find(r => r.key === 'translations');
  assert.equal(translated.count, 2); assert.equal(translated.blocking, true); assert.ok(!JSON.stringify(translated).includes('Synthetic letter'));
  await fs.writeFile(file, JSON.stringify({ item_id: f.ids[0], revision: 1, published: { locale: 'en', fields: { 'core.title': 'Changed with same count' } } }));
  refs = await inspect(f.ids, f.records); assert.notEqual(refs.find(r => r.key === 'translations').digest, translated.digest);
});
