import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { randomUUID, generateKeyPairSync, sign } from 'node:crypto';
import { spawn } from 'node:child_process';
import { createServer } from 'node:net';
import { once } from 'node:events';
import { fileURLToPath, pathToFileURL } from 'node:url';
import {createRequire} from 'node:module';
import { createMergePlanner } from '../../archive-merge-plans.mjs';
import { digest } from '../../write-coordinator.mjs';

export const projectRoot = fileURLToPath(new URL('../../../', import.meta.url));
export const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+j8WQAAAAASUVORK5CYII=', 'base64');
export const actor = 'local:synthetic-test';
export const operation = () => ({ operationId: randomUUID(), stepId: randomUUID(), markChanged() {} });
export const sample = (sequence = '001', core = {}) => ({
  core: { item_id: `LJM-20000101-LET-${sequence}`, accession_date: '2000-01-01', object_type: 'LET',
    title: `虚构信件验收 ${sequence}`, date_display: '年代未知', batch_id: 'SYNTHETIC-MERGE-TEST',
    record_status: 'ACT', privacy_level: 'G', rights_status: 'UNK', research_status: 'R0', evidence_level: 'D',
    digitization_status: 'DG0', transcription_status: 'TX0', use_status: 'U3', physical_location: '合成验收目录',
    created_date: '2000-01-01', updated_date: '2000-01-01',
    publication_file_path: [`/archive/LJM-20000101-LET-${sequence}/front-public.png`], ...core },
  metadata: { schema: 'common', dimensions: {} },
  public_view: { description: '虚构资料，仅用于验收，没有真实档案或人物。', tags: ['合成验收'], image_descriptions: [`虚构信件第${sequence}页`] },
});

export async function standards() {
  const read = name => fs.readFile(path.join(projectRoot, 'site/src/data/standards', name + '.json'), 'utf8').then(JSON.parse);
  const [commonFields, codeDictionary, collectionCodeRules, fieldRouting, photo, postcard, diary_notebook, credential, card] =
    await Promise.all(['common-fields', 'code-dictionary', 'collection-code-rules', 'admin-field-routing', 'photo-dimensions', 'postcard-dimensions', 'diary-notebook-dimensions', 'credential-dimensions', 'card-dimensions'].map(read));
  return { commonFields, codeDictionary, collectionCodeRules, fieldRouting, dimensions: { photo, postcard, diary_notebook, credential, card } };
}
export async function fixture(t, { http = false, count = 2, keep = false, online = false, internal = false, port: requestedPort } = {}) {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'ljm-merge-test-'));
  const checked = () => assert.ok(path.resolve(root).startsWith(path.resolve(os.tmpdir()) + path.sep + 'ljm-merge-test-'));
  checked();
  const privateRoot = path.join(root, 'private'), imageRoot = path.join(privateRoot, 'inbox'), directory = path.join(privateRoot, 'merges');
  const site = path.join(root, 'site'), archive = path.join(root, 'archive-data');
  await fs.mkdir(archive, { recursive: true });
  const records = Array.from({ length: count }, (_, i) => sample(String(i + 1).padStart(3, '0')));
  for (const record of records) {
    const id = record.core.item_id;
    await fs.mkdir(path.join(imageRoot, id), { recursive: true });
    await fs.writeFile(path.join(imageRoot, id, 'front-public.png'), png);
    await fs.writeFile(path.join(archive, id + '.json'), JSON.stringify(record));
  }
  const standard = await standards(), policies = JSON.parse(await fs.readFile(path.join(projectRoot, 'local-admin/archive-merge-field-policies.json'), 'utf8'));
  const drafts = new Map(); let refs = [{ key: 'synthetic', label: '合成引用', availability: 'available', count: 0, digest: digest([]) }];
  const options = { directory, imageRoot, policies, getStandards: async () => standard, readRecords: async () => records,
    readState: async id => { const official = records.find(r => r.core.item_id === id); return { official, draft: drafts.get(id), revision: digest({ official, draft: drafts.get(id) ?? null }) }; },
    inspectReferences: async () => refs, collectionCode: record => ({ code: `${record.core.object_type}_${record.core.date_display}`, issues: [] }) };
  const planner = createMergePlanner(options), ids = records.slice(0, 2).map(r => r.core.item_id);
  const payload = pf => ({ primaryId: ids[0], secondaryId: ids[1], expectedRevisions: pf.fingerprints.revisions, basisFingerprint: pf.fingerprint,
    fieldChoices: Object.fromEntries(pf.fields.filter(f => !f.defaultChoice).map(f => [f.path, { choice: 'primary' }])),
    attachmentOrder: pf.images.map(i => i.ref), excludedImages: [], attachmentDescriptions: {}, sourceReason: '虚构同一封信的前后两页', primaryReason: '' });
  let child = null, output = '';
  t?.after?.(async () => {
    await fs.rm(path.join(root,'build-hold'),{force:true});
    if (child?.exitCode === null) { const end = once(child, 'exit'); child.kill('SIGTERM'); await end; }
    if (!keep) { checked(); await fs.rm(root, { recursive: true, force: true, maxRetries: 10, retryDelay: 100 }); }
  });
  if (!http) return { root, privateRoot, imageRoot, directory, archive, records, standard, policies, drafts, options, planner, ids, payload, setRefs(value) { refs = value; } };
  await fs.mkdir(path.join(site, 'src/data'), { recursive: true });
  await fs.cp(path.join(projectRoot, 'site/src/data/standards'), path.join(site, 'src/data/standards'), { recursive: true });
  await fs.copyFile(path.join(projectRoot, 'site/src/data/archive-categories.json'), path.join(site, 'src/data/archive-categories.json'));
  await fs.writeFile(path.join(site, 'src/data/archive.ts'), 'export const archiveItems = [];\n');
  await fs.writeFile(path.join(site, 'package.json'), JSON.stringify({ private: true, scripts: { build: 'node -e "console.log(\'synthetic\')"' } }));
  if(internal){
    const sharp=createRequire(path.join(projectRoot,'site/package.json'))('sharp');
    await fs.symlink(await fs.realpath(path.join(projectRoot,'site/node_modules')),path.join(site,'node_modules'),process.platform==='win32'?'junction':'dir');
    for(const record of records){
      const id=record.core.item_id,bytes=await sharp({create:{width:20,height:30,channels:3,background:'#e9e0ce'}}).png().toBuffer();
      await fs.writeFile(path.join(imageRoot,id,'front-public.png'),bytes);
      await fs.mkdir(path.join(site,'public/archive',id),{recursive:true});await fs.writeFile(path.join(site,'public/archive',id,'front-public.png'),bytes);
    }
    await fs.mkdir(path.join(site,'dist'),{recursive:true});await fs.writeFile(path.join(site,'dist/index.html'),'SYNTHETIC ORIGINAL PUBLIC VERSION');
    await fs.mkdir(path.join(privateRoot,'translations'),{recursive:true});await fs.mkdir(path.join(privateRoot,'submissions'),{recursive:true});
    await fs.writeFile(path.join(privateRoot,'likes.json'),JSON.stringify({version:1,items:{}}));
    await fs.writeFile(path.join(site,'package.json'),JSON.stringify({private:true,scripts:{build:'node build.mjs'}}));
    await fs.writeFile(path.join(site,'build.mjs'),`import fs from 'node:fs/promises';
const has=path=>fs.access(path).then(()=>true,()=>false);
await fs.writeFile(${JSON.stringify(path.join(root,'build-started'))},'started');
while(await has(${JSON.stringify(path.join(root,'build-hold'))}))await new Promise(resolve=>setTimeout(resolve,30));
if(await has(${JSON.stringify(path.join(root,'build-fail'))}))throw new Error('synthetic controlled build failure');
await fs.mkdir('dist',{recursive:true});await fs.writeFile('dist/index.html','SYNTHETIC CANDIDATE PUBLIC VERSION');
await fs.copyFile('src/data/archive.ts','dist/synthetic-data.txt');
if(await has('public'))await fs.cp('public','dist',{recursive:true});
console.log('synthetic official npm build entry completed');`);
  }
  const net = createServer(); net.listen(0, '127.0.0.1'); await once(net, 'listening'); const port = requestedPort ?? net.address().port;
  await new Promise(resolve => net.close(resolve));
  const origin = `http://127.0.0.1:${port}`;
  const env = Object.fromEntries(Object.entries(process.env).filter(([key]) => !key.startsWith('LJM_') && key !== 'PUBLIC_SITE_URL'));
  Object.assign(env, { LJM_ADMIN_MODE: 'local', LJM_ADMIN_HOST: '127.0.0.1', LJM_ADMIN_PORT: String(port), LJM_PROJECT_ROOT: root,
    LJM_SITE_DIR: site, LJM_ARCHIVE_DATA_DIR: archive, LJM_ADMIN_DATA_ROOT: privateRoot, LJM_INBOX_DIR: imageRoot,
    LJM_DRAFT_DIR: path.join(privateRoot, 'drafts'), LJM_HISTORY_DIR: path.join(privateRoot, 'history'), LJM_RECYCLE_DIR: path.join(privateRoot, 'recycle'),
    LJM_UPLOAD_STAGING_DIR: path.join(privateRoot, 'uploads'), LJM_SUBMISSION_DATA_DIR: path.join(privateRoot, 'submissions'),
    LJM_ACCOUNT_DATA_DIR: path.join(privateRoot, 'accounts'), LJM_MAIL_TRANSPORT: 'file', LJM_PUBLIC_RELEASES_DIR: path.join(root, 'releases'), LJM_PUBLIC_LIVE_LINK: path.join(root, 'releases/live') });
  if(internal)Object.assign(env,{LJM_MERGE_INTERNAL_ENABLED:'1',LJM_MERGE_LIKES_FILE:path.join(privateRoot,'likes.json')});
  const args = [], authHeaders = {};
  if (online) {
    for (const folder of ['drafts', 'history', 'recycle']) await fs.mkdir(path.join(privateRoot, folder), { recursive: true });
    const release = path.join(root, 'releases', '20000101-000000-synthetic-12345678'); await fs.mkdir(release, { recursive: true });
    await fs.symlink(release, env.LJM_PUBLIC_LIVE_LINK, process.platform === 'win32' ? 'junction' : 'dir');
    Object.assign(env, { LJM_ADMIN_MODE: 'online', LJM_ADMIN_ORIGIN: 'https://admin.example.test', PUBLIC_SITE_URL: 'https://public.example.test',
      LJM_CF_ACCESS_TEAM_DOMAIN: 'https://synthetic.cloudflareaccess.com', LJM_CF_ACCESS_AUD: 'synthetic-audience', LJM_ADMIN_ALLOWED_EMAILS: 'test@example.test' });
    const { privateKey, publicKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
    const jwk = { ...publicKey.export({ format: 'jwk' }), kid: 'synthetic-key', alg: 'RS256', use: 'sig' };
    const preload = path.join(root, 'synthetic-jwks.mjs');
    await fs.writeFile(preload, `globalThis.fetch=async url=>{if(String(url)==='https://synthetic.cloudflareaccess.com/cdn-cgi/access/certs')return {ok:true,json:async()=>(${JSON.stringify({ keys: [jwk] })})};throw new Error('合成测试禁止向外请求');};`);
    args.push('--import', pathToFileURL(preload).href);
    const encode = value => Buffer.from(JSON.stringify(value)).toString('base64url'), current = Math.floor(Date.now() / 1000);
    const token = encode({ alg: 'RS256', kid: 'synthetic-key' }) + '.' + encode({ iss: env.LJM_CF_ACCESS_TEAM_DOMAIN, aud: ['synthetic-audience'], email: 'test@example.test', sub: 'synthetic-test', iat: current, nbf: current, exp: current + 600, type: 'app' });
    authHeaders['cf-access-jwt-assertion'] = token + '.' + sign('RSA-SHA256', Buffer.from(token), privateKey).toString('base64url');
  }
  child = spawn(process.execPath, [...args, path.join(projectRoot, 'local-admin/server.mjs')], { env, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] });
  child.stdout.on('data', b => { output += b; }); child.stderr.on('data', b => { output += b; });
  let ready = false;
  for (let i = 0; i < 200 && child.exitCode === null; i++) {
    try { ready = (await fetch(origin + '/healthz')).ok; } catch {}
    if (ready) break; await new Promise(resolve => setTimeout(resolve, 40));
  }
  assert.ok(ready, output);
  const get = async (route, headers = {}) => { const res = await fetch(origin + route, { headers: { ...authHeaders, ...headers } }); return { status: res.status, body: await res.json(), headers: res.headers }; };
  const post = async (route, body, op = operation(), headers = {}) => {
    const res = await fetch(origin + route, { method: 'POST', headers: { ...authHeaders, 'content-type': 'application/json', 'x-ljm-admin-request': '1', origin,
      ...(op ? { 'x-ljm-operation-id': op.operationId, 'x-ljm-step-id': op.stepId } : {}), ...headers }, body: JSON.stringify(body) });
    return { status: res.status, body: await res.json(), headers: res.headers };
  };
  return { root, site, archive, privateRoot, imageRoot, directory, records, ids, origin, child, get, post, payload, env, output: () => output };
}
