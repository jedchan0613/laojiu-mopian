import fs from 'node:fs/promises';
import path from 'node:path';
import {spawn} from 'node:child_process';
import {once} from 'node:events';
import {fileURLToPath, pathToFileURL} from 'node:url';
import {randomBytes} from 'node:crypto';
import {createSubmissionStore, consentVersion} from '../../submissions.mjs';
import {manualConsentVersion} from '../../../shared/manual-workflow.mjs';
import {seedSyntheticManualPages, syntheticManualMetadata, syntheticManualJpeg} from './manual-synthetic-pages.mjs';
import {syntheticApproval} from './manual-synthetic-transfer-fixture.mjs';

export const phase84EmptyCatalog = {schema_version: 1, brands: [], models: [], documents: []};
export const phase84SecondAdmin = 'second-phase84@example.test';
export const phase84List = directory => fs.readdir(directory).catch(error => error.code === 'ENOENT' ? [] : Promise.reject(error));

async function createPhase84Online({pages, official}) {
  const {createManualOnlineFixture} = await import('./manuals-online-fixture.mjs');
  const f = await createManualOnlineFixture(null, {enabled: true, reviewEnabled: true, transferEnabled: true});
  try {
    const submissionRoot = f.env.LJM_SUBMISSION_DATA_DIR, store = createSubmissionStore({root: submissionRoot, siteDirectory: f.site});
    const accountId = 'usr_' + 'a'.repeat(24), manual = {...syntheticManualMetadata,
      ...(official ? {sharing_scope: 'official-link', rights_basis: 'official-link', official_url: 'https://support.example.com/phase84/manual'} : {})};
    const created = await store.createAccountManualDraft({accountId, payload: {request_key: randomBytes(32).toString('hex'), manual}}), id = created.id;
    const seeded = official ? {revision: 1} : await seedSyntheticManualPages({submissionRoot, id, pages});
    await store.operateAccountManualSubmission({id, accountId, payload: {action: 'submit', revision: seeded.revision, operation_id: randomBytes(32).toString('hex'), consent_version: manualConsentVersion, consents: {copies: true, rights: true, privacy: true, processing: true}}});
    return {...f, store, accountId, id, base: '/api/admin/manual-submissions/' + id, file: path.join(submissionRoot, id, 'record.json'), jpeg: syntheticManualJpeg, approval: syntheticApproval};
  } catch (error) { await f.dispose(); throw error; }
}

export async function createPhase84Fixture(t = null, {online = false, pages = 3, official = false, metadata = {}} = {}) {
  const base = online ? await createPhase84Online({pages, official})
    : await (await import('./manual-review-fixture.mjs')).createReviewHttpFixture(null, {pages: official ? 0 : pages, metadata: {...(official ? {sharing_scope: 'official-link', rights_basis: 'official-link', official_url: 'https://support.example.com/phase84/manual'} : {}), ...metadata}});
  const id = base.submissionId ?? base.id;
  const file = base.file ?? path.join(base.submissionRoot, id, 'record.json');
  const privateRoot = path.dirname(base.root);
  const marker = path.join(base.dir, 'phase84-checkpoint-held.json');
  let child = base.child;
  let preload = '';
  const localStop = async signal => {
    if (child && child.exitCode === null && child.signalCode === null) {
      const exited = once(child, 'exit');
      child.kill(signal || 'SIGTERM');
      await exited;
    }
  };
  const localStart = async () => {
    let output = '';
    child = spawn(process.execPath, [...(preload ? ['--import', pathToFileURL(preload).href] : []), fileURLToPath(new URL('../../server.mjs', import.meta.url))], {env: base.env, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe']});
    child.stdout.on('data', bytes => { output += bytes; });
    child.stderr.on('data', bytes => { output += bytes; });
    for (let n = 0; n < 300 && child.exitCode === null; n++) {
      try { if ((await base.get('/healthz')).status === 200) return; } catch {}
      await new Promise(resolve => setTimeout(resolve, 30));
    }
    await localStop();
    throw new Error('8.4合成管理服务未启动：' + output);
  };
  const stop = () => online ? base.stop() : localStop();
  const crash = () => online ? base.crash() : localStop('SIGKILL');
  const restart = async () => {
    if (online) return base.restart();
    await localStop();
    await localStart();
  };
  const dispose = async () => { await stop(); await base.dispose(); };
  if (t) t.after(dispose);
  const raw = () => fs.readFile(file, 'utf8').then(JSON.parse);
  const detail = async () => {
    const result = await base.get(base.base);
    if (result.status !== 200) throw new Error(JSON.stringify(result.body));
    return result.body;
  };
  const approval = data => base.approval(online ? data.record : data);
  const transfer = data => {
    const r = data.record, v = r.versions.find(version => version.revision === r.manual_submitted_revision), m = v.manual_metadata;
    return {revision: r.revision, submitted_revision: v.revision, snapshot_digest: v.digest,
      catalog_revision: data.catalog_revision, confirmed: true, title: '8.4隔离验收合成说明书',
      product_name: m.product_name, public_description: '自制合成资料，未包含真实设备或个人资料。', region_display: m.region_display, edition_display: m.edition_display,
      ...(m.sharing_scope === 'reading-copy' ? {object_type: 'RPR', accession_date: '2000-01-02'} : {official_source_name: '8.4合成官方来源', checked_on: '2026-01-01', source_available: true})};
  };
  const approve = async () => {
    const data = await detail(), saved = await base.post(base.base + '/review', approval(data));
    if (saved.status !== 200) throw new Error(JSON.stringify(saved.body));
    return detail();
  };
  const accountAction = async action => {
    const r = await raw();
    return base.store.operateAccountManualSubmission({id, accountId: base.accountId, payload: {action, revision: r.revision, operation_id: randomBytes(32).toString('hex')}});
  };
  const ordinary = async () => {
    const r = await raw(), image = r.images[0];
    const jpeg = base.jpeg ?? await fs.readFile(path.join(path.dirname(file), image.filename));
    return base.store.createAccountSubmission({accountId: 'usr_' + 'b'.repeat(24), mode: 'pending', payload: {
      request_key: randomBytes(32).toString('hex'), fields: {title: '8.4普通投稿并发合成资料', description: '普通投稿隔离验收用自制说明，不含真实人物。', category: '照片', era: '年代未知', place: '地点未知', source_note: '本次临时创建的合成图', people: 'none', attribution: 'anonymous', credit: ''},
      images: [{name: 'screened-ordinary.jpg', buffer: jpeg}], consent_version: consentVersion, consents: {copies: true, rights: true, privacy: true, processing: true}
    }});
  };
  const holdReservedCheckpoint = async () => {
    if (online) throw new Error('HTTP强杀夹具仅对独立本机合成进程启用；不伪装平台。');
    await stop();
    preload = path.join(base.dir, 'phase84-fault-preload.mjs');
    await fs.writeFile(preload, `import fs from 'node:fs/promises';
const write=fs.writeFile.bind(fs),record=${JSON.stringify(file)},marker=${JSON.stringify(marker)};let held=false;
fs.writeFile=async function(file,data,...rest){const result=await write(file,data,...rest);if(!held&&typeof file==='string'&&file.startsWith(record+'.')&&file.endsWith('.tmp')){let row;try{row=JSON.parse(String(data));}catch{}const h=row?.manual_handoff;if(h?.status==='in-progress'&&h.archive_item_id){held=true;await write(marker,JSON.stringify({temporaryFile:file,submissionId:row.id,itemId:h.archive_item_id,operationId:h.operation_id,stepId:h.step_id}),{mode:0o600});await new Promise(()=>{});}}return result;};
`);
    await localStart();
  };
  const waitHeld = async () => {
    for (let n = 0; n < 600; n++) {
      try { return JSON.parse(await fs.readFile(marker, 'utf8')); } catch (error) { if (error.code !== 'ENOENT') throw error; }
      await new Promise(resolve => setTimeout(resolve, 25));
    }
    throw new Error('未观察到8.4合成预留编号检查点；不据此宣称已强杀验收。');
  };
  if (online) {
    base.env.LJM_ADMIN_ALLOWED_EMAILS = base.email + ',' + phase84SecondAdmin;
    await restart();
    if (process.platform === 'linux') {
      const saved = await base.save(phase84EmptyCatalog);
      if (saved.status !== 200) { await dispose(); throw new Error(JSON.stringify(saved.body)); }
    }
  }
  return {...base, id, submissionId: id, file, privateRoot, raw, detail, approval, transfer, approve, accountAction, ordinary,
    stop, crash, restart, dispose, holdReservedCheckpoint, waitHeld, childPid: () => child?.pid};
}
