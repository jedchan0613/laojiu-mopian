/**
 * 零依赖、Linux/root 专用。prepare 只在隔离版本内构建；commit 必须另行显式执行。
 * node publish-bilingual-site.mjs prepare /srv/laojiumopian-admin/build-work/input/bundle.json
 * node publish-bilingual-site.mjs commit /srv/laojiumopian-admin/build-work/bilingual-...
 * 包格式：{baseline:{app,live,archiveSourceHash,ids},siteUrl,files:[{path,base64,sha256}],translations:[record]}
 * 不读取生产环境文件/账号内容，不改变 canonical 档案、图片、Caddy、环境变量或服务配置。
 * 旧版本、隔离目录、备份和失败产物全部保留；不运行 npm install/ci，不新增依赖。
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createHash, randomUUID } from 'node:crypto';
import { execFile, spawn } from 'node:child_process';
import { promisify, isDeepStrictEqual as same } from 'node:util';

const exec = promisify(execFile);
const SELF = fileURLToPath(import.meta.url);
const ROOT = '/srv/laojiumopian-admin';
const DATA = `${ROOT}/data`;
const CURRENT = `${ROOT}/app/current`;
const APP_RELEASES = `${ROOT}/app/releases`;
const BUILD = `${ROOT}/build-work`;
const PUBLIC_RELEASES = '/srv/laojiumopian/releases';
const LIVE = `${PUBLIC_RELEASES}/live`;
const NODE = '/snap/node/current/bin/node';
const NPM = '/snap/node/current/bin/npm';
const LOCK = '/run/lock/laojiumopian-github-deploy.lock';
const ID = /^LJM-\d{8}-[A-Z]{3}-\d{3}$/;
const JOB = /^bilingual-\d{14}-[a-f0-9]{8}$/;
const hash = (value) => createHash('sha256').update(value).digest('hex');
const sha = async (file) => hash(await fs.readFile(file));
const has = async (file) => fs.access(file).then(() => true, () => false);
const maybeSha = async (file) => await has(file) ? sha(file) : null;
const json = async (file) => JSON.parse(await fs.readFile(file, 'utf8'));
const assert = (value, message) => { if (!value) throw new Error(message); };
const inside = (parent, candidate) => {
  const relative = path.relative(path.resolve(parent), path.resolve(candidate));
  return relative !== '' && !relative.startsWith('..') && !path.isAbsolute(relative);
};
const sorted = (values) => [...values].sort();
const log = (message) => process.stdout.write(`[bilingual] ${message}\n`);
const writeJson = (file, value) => fs.writeFile(file, `${JSON.stringify(value, null, 2)}\n`, { mode: 0o640 });
const cleanEnv = {
  PATH: '/snap/node/current/bin:/usr/local/bin:/usr/bin:/bin', LANG: 'C.UTF-8', TZ: 'Asia/Shanghai',
  HOME: `${BUILD}/npm-home`, NPM_CONFIG_CACHE: `${BUILD}/npm-cache`,
};

const safeSourcePath = (value) => {
  if (typeof value !== 'string' || value.includes('\\') || value.startsWith('/') || value.includes('\0') ||
      value.split('/').some((part) => !part || ['.', '..'].includes(part))) return false;
  if (/(?:^|\/)(?:\.env[^/]*|node_modules|dist|\.astro|\.git|accounts|submissions|drafts|history|recycle-bin|translations|upload-staging|batch-import)(?:\/|$)/.test(value)) return false;
  if (/^site\/src\/(?:pages|components|layouts|styles|scripts|i18n)\/.+\.(?:astro|ts|js|mjs|json|css)$/.test(value)) return true;
  if (/^site\/scripts\/[a-z0-9-]+\.mjs$/.test(value)) return true;
  if (/^site\/src\/data\/.+\.ts$/.test(value) && value !== 'site/src/data/archive.ts' && !value.includes('/standards/') && !value.includes('/generated/')) return true;
  if (/^shared\/[a-z0-9-]+\.(?:mjs|js)$/.test(value)) return true;
  if (/^local-admin\/[a-z0-9-]+\.mjs$/.test(value)) return true;
  if (/^local-admin\/public\/.+\.(?:html|js|css)$/.test(value)) return true;
  return ['site/astro.config.mjs', 'site/package.json', 'site/public/robots.txt',
    'deployment/laojiumopian-github-deploy.sh', 'deployment/publish-built-site.mjs',
    'deployment/publish-bilingual-site.mjs'].includes(value);
};

const decodeFile = (entry) => {
  assert(safeSourcePath(entry.path), `发布包包含不允许覆盖的路径：${entry.path}`);
  assert(/^[a-f0-9]{64}$/.test(entry.sha256 ?? ''), '发布包文件哈希无效');
  const encoded = entry.base64 ?? entry.data;
  assert(typeof encoded === 'string' && encoded.length < 32 * 1024 * 1024, '发布包文件内容无效或过大');
  const base64 = Buffer.from(encoded, 'base64');
  const plain = Buffer.from(encoded, 'utf8');
  const data = entry.encoding === 'utf8' ? plain : hash(base64) === entry.sha256 ? base64 : plain;
  assert(hash(data) === entry.sha256, `发布包文件校验失败：${entry.path}`);
  return data;
};

const treeManifest = async (directory) => {
  const manifest = {};
  const walk = async (current) => {
    for (const entry of (await fs.readdir(current, { withFileTypes: true })).sort((a, b) => a.name.localeCompare(b.name))) {
      const file = path.join(current, entry.name);
      assert(!entry.isSymbolicLink(), '数据或公开构建目录中出现软链接，已停止');
      if (entry.isDirectory()) await walk(file);
      else { assert(entry.isFile(), '数据目录中出现不支持的文件类型'); manifest[path.relative(directory, file).split(path.sep).join('/')] = await sha(file); }
    }
  };
  if (await has(directory)) await walk(directory);
  return manifest;
};
const canonicalManifest = async () => {
  const result = {};
  const entries = (await fs.readdir(`${DATA}/archive-data`)).filter((file) => /^LJM-\d{8}-[A-Z]{3}-\d{3}\.json$/.test(file)).sort();
  assert(entries.length > 0, '服务器正式档案目录为空');
  for (const file of entries) {
    const filename = `${DATA}/archive-data/${file}`;
    assert((await fs.lstat(filename)).isFile(), '正式档案不能是软链接或特殊文件');
    result[file] = await sha(filename);
  }
  return result;
};
const sourceItems = async (app) => {
  const source = await fs.readFile(`${app}/site/src/data/archive.ts`, 'utf8');
  const match = source.match(/export const archiveItems\s*=\s*([\s\S]+?)\s+satisfies ArchiveItem\[\];/);
  assert(match, '当前网站档案源格式无法安全识别');
  const records = JSON.parse(match[1]);
  assert(Array.isArray(records) && records.every((item) => ID.test(item?.core?.item_id)), '当前公开档案源无效');
  return records;
};
const siteOrigin = (value) => {
  const url = new URL(value);
  assert(url.protocol === 'https:' && !url.username && !url.password && url.pathname === '/' && !url.search && !url.hash &&
    !['localhost', '127.0.0.1', '::1'].includes(url.hostname), '发布包 siteUrl 必须是正式 HTTPS 网站域名');
  return url.origin;
};
const ensureBaseline = async (baseline) => {
  const app = await fs.realpath(CURRENT), live = await fs.realpath(LIVE);
  assert(inside(APP_RELEASES, app) && inside(PUBLIC_RELEASES, live), '当前应用或公开网站软链接越界');
  assert(app === baseline.app && live === baseline.live, '当前应用或公开版本已变化，请重新准备发布包');
  assert(await sha(`${app}/site/src/data/archive.ts`) === baseline.archiveSourceHash, '当前公开档案源已变化，请重新准备');
  const ids = sorted((await sourceItems(app)).map((item) => item.core.item_id));
  assert(Array.isArray(baseline.ids) && baseline.ids.every((id) => ID.test(id)) && new Set(baseline.ids).size === baseline.ids.length && same(ids, sorted(baseline.ids)), '公开档案编号集合与基线不一致');
  return { app, live, ids };
};
const runAdmin = (args, environment = {}, options = {}) => exec('/usr/sbin/runuser', [
  '-u', 'ljmadmin', '--', '/usr/bin/env', '-i',
  ...Object.entries({ ...cleanEnv, ...environment }).map(([key, value]) => `${key}=${value}`), ...args,
], { windowsHide: true, maxBuffer: 24 * 1024 * 1024, timeout: 20 * 60 * 1000, ...options });
const switchLink = async (link, target, group) => {
  const temporary = `${link}.bilingual-next-${randomUUID().slice(0, 8)}`;
  await fs.symlink(target, temporary, 'dir');
  await exec('/bin/chown', ['-h', `ljmadmin:${group}`, temporary]);
  await fs.rename(temporary, link);
};
const safeJob = async (value) => {
  const job = await fs.realpath(value);
  assert(path.dirname(job) === BUILD && JOB.test(path.basename(job)), '准备目录必须是本工具创建的独立工作目录');
  return job;
};

const copyApplication = async (app, stage) => {
  const allowedTop = new Set(['site', 'local-admin', 'deployment', 'shared']);
  const privateAdmin = new Set(['accounts', 'submissions', 'drafts', 'history', 'recycle-bin', 'translations', 'upload-staging', 'batch-import']);
  await fs.cp(app, stage, { recursive: true, errorOnExist: true, force: false, filter: async (source) => {
    const relative = path.relative(app, source).split(path.sep).join('/');
    const parts = relative.split('/');
    if (!relative) return true;
    if (!allowedTop.has(parts[0]) || /^\.env/.test(parts.at(-1)) || /\.(?:sqlite|sqlite3|db|key|pem)(?:-(?:wal|shm))?$/.test(parts.at(-1)) ||
      /(?:^|\/)(?:id_ed25519|known_hosts|credentials)(?:\/|$)/.test(relative)) return false;
    if (parts[0] === 'local-admin' && privateAdmin.has(parts[1])) return false;
    if (parts[0] === 'site' && ['node_modules', 'dist', '.astro'].includes(parts[1])) return false;
    assert(!(await fs.lstat(source)).isSymbolicLink(), `应用源中出现未经允许的软链接：${relative}`);
    return true;
  } });
  await fs.symlink(`${app}/site/node_modules`, `${stage}/site/node_modules`, 'dir');
};

async function prepare(input) {
  const bundlePath = await fs.realpath(input);
  assert(inside(BUILD, bundlePath), '输入发布包必须放在服务器私有 build-work 目录内');
  assert((await fs.lstat(bundlePath)).isFile(), '发布包必须是普通文件');
  const bundleBytes = await fs.readFile(bundlePath);
  const bundle = JSON.parse(bundleBytes);
  const baseline = bundle.baseline;
  assert(baseline && /^[a-f0-9]{64}$/.test(baseline.archiveSourceHash ?? ''), '发布包缺少有效基线');
  const initial = await ensureBaseline(baseline);
  const origin = siteOrigin(bundle.siteUrl ?? baseline.siteUrl);
  const official = await canonicalManifest();
  const images = { archive: await treeManifest(`${initial.app}/site/public/archive`), responsive: await treeManifest(`${initial.app}/site/public/archive-responsive`) };
  assert(Array.isArray(bundle.files) && bundle.files.length > 0 && bundle.files.length <= 1000, '发布包程序文件清单无效');
  const seen = new Set();
  for (const entry of bundle.files) { decodeFile(entry); assert(!seen.has(entry.path), '发布包路径重复'); seen.add(entry.path); }
  const translations = Array.isArray(bundle.translations) ? bundle.translations : Object.values(bundle.translations?.records ?? bundle.records ?? {});
  assert(translations.length === initial.ids.length && same(sorted(translations.map((record) => record.item_id)), initial.ids), '英文初始化记录必须与当前公开档案逐项对应');
  const stamp = new Date().toISOString().replace(/\D/g, '').slice(0, 14), suffix = randomUUID().slice(0, 8);
  const job = `${BUILD}/bilingual-${stamp}-${suffix}`;
  const stage = `${APP_RELEASES}/${stamp}-bilingual-${suffix}`;
  const data = `${job}/data`;
  await fs.mkdir(job, { mode: 0o750 });
  await fs.mkdir(data, { mode: 0o750 });
  await writeJson(`${job}/bundle.json`, bundle);
  await copyApplication(initial.app, stage);
  const oldPackage = await json(`${initial.app}/site/package.json`);
  for (const entry of bundle.files) {
    const target = path.join(stage, entry.path);
    assert(inside(stage, target), '文件目标越界');
    await fs.mkdir(path.dirname(target), { recursive: true, mode: 0o750 });
    await fs.writeFile(target, decodeFile(entry), { mode: 0o640 });
  }
  const newPackage = await json(`${stage}/site/package.json`);
  for (const key of ['dependencies', 'devDependencies', 'optionalDependencies', 'overrides', 'scripts']) {
    assert(same(oldPackage[key], newPackage[key]), `本次双语发布不能改变依赖或正式命令：${key}`);
  }
  for (const directory of ['archive-data', 'drafts', 'history', 'recycle-bin', 'inbox', 'upload-staging', 'submissions', 'accounts', 'translations']) await fs.mkdir(`${data}/${directory}`, { mode: 0o750 });
  for (const file of Object.keys(official)) {
    await fs.copyFile(`${DATA}/archive-data/${file}`, `${data}/archive-data/${file}`, fs.constants.COPYFILE_EXCL);
    assert(await sha(`${data}/archive-data/${file}`) === official[file], '构建复制期间正式档案发生变化');
  }
  const translationBefore = {}, seeds = [];
  const shared = await import(pathToFileURL(`${stage}/shared/archive-translations.mjs`).href);
  const records = await sourceItems(initial.app);
  const byId = new Map(records.map((item) => [item.core.item_id, item]));
  for (const translation of translations) {
    assert(translation.status === 'published', '初始化译文必须已审核');
    const item = byId.get(translation.item_id);
    const validation = shared.validateTranslationRecord(item, translation);
    assert(validation.valid && translation.source_hash === shared.getTranslationSourceHash(item), `译文与当前公开来源不匹配：${translation.item_id}`);
    const filename = `${translation.item_id}.json`;
    translationBefore[filename] = await maybeSha(`${DATA}/translations/${filename}`);
    if (translationBefore[filename] !== null) await fs.copyFile(`${DATA}/translations/${filename}`, `${data}/translations/${filename}`, fs.constants.COPYFILE_EXCL);
    else { await writeJson(`${data}/translations/${filename}`, translation); seeds.push(filename); }
  }
  await exec('/bin/chown', ['-h', '-R', 'ljmadmin:ljmadmin', job, stage]);
  const environment = { LJM_ADMIN_MODE: 'local', LJM_PROJECT_ROOT: stage, LJM_SITE_DIR: `${stage}/site`,
    LJM_ADMIN_DATA_ROOT: data, LJM_ARCHIVE_DATA_DIR: `${data}/archive-data`, PUBLIC_SITE_URL: origin, LJM_REQUIRE_SITE_URL: '1' };
  log('隔离版本已准备，开始使用现有正式命令构建。');
  const sync = await runAdmin([NODE, `${stage}/local-admin/server.mjs`, '--sync-site-data'], environment);
  await fs.writeFile(`${job}/sync.log`, `${sync.stdout}\n${sync.stderr}`, { mode: 0o640 });
  assert(same((await sourceItems(stage)), records), '生成网站数据改变了当前中文公开档案内容，已停止');
  const build = await runAdmin([NPM, 'run', 'build', '--prefix', `${stage}/site`], environment);
  await fs.writeFile(`${job}/build.log`, `${build.stdout}\n${build.stderr}`, { mode: 0o640 });
  assert(same(images.archive, await treeManifest(`${stage}/site/public/archive`)), '隔离构建改变了公开原图');
  assert(same(images.responsive, await treeManifest(`${stage}/site/public/archive-responsive`)), '隔离构建改变了既有响应式图片');
  await ensureBaseline(baseline);
  assert(same(official, await canonicalManifest()), '准备期间真实档案已变化，请重新准备');
  const dist = await treeManifest(`${stage}/site/dist`);
  for (const file of ['index.html', 'en/index.html', '404.html', 'robots.txt', 'sitemap.xml']) assert(Object.hasOwn(dist, file), `新版本缺少${file}`);
  const manifest = { schema_version: 1, state: 'ready', job, stage, prepared_at: new Date().toISOString(), origin,
    baseline, official, images, translation_before: translationBefore, seeds,
    bundle_sha256: hash(bundleBytes), files: Object.fromEntries(bundle.files.map((entry) => [entry.path, entry.sha256])),
    staged_source_hash: await sha(`${stage}/site/src/data/archive.ts`), dist,
    staged_translation_hash: await sha(`${stage}/site/src/data/archive-translations.json`),
    isolated_translations: await treeManifest(`${data}/translations`),
    dist_files: Object.keys(dist).length, public_records: initial.ids.length };
  await writeJson(`${job}/ready.json`, manifest);
  await exec('/bin/chown', ['-h', '-R', 'ljmadmin:ljmadmin', job, stage]);
  log(`准备完成：${job}；${manifest.public_records} 件公开档案，${manifest.dist_files} 个构建文件；线上链接和真实数据未改动。`);
}

const services = [
  ['laojiumopian-admin.service', 'http://127.0.0.1:4174/healthz'],
  ['laojiumopian-submissions.service', 'http://127.0.0.1:4176/api/submissions/config', 'http://127.0.0.1:4176/api/contact/config'],
  ['laojiumopian-accounts.service', 'http://127.0.0.1:4177/healthz'],
  ['laojiumopian-likes.service', 'http://127.0.0.1:4175/healthz'],
];
const system = (action, service) => exec('/bin/systemctl', [action, service], { timeout: action === 'stop' ? 290000 : 60000, maxBuffer: 1024 * 1024 });
const healthy = async (urls, attempts = 30) => {
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      const checks = await Promise.all(urls.map((url) => fetch(url, { signal: AbortSignal.timeout(2500), headers: { 'Cache-Control': 'no-cache' } }).then((response) => response.ok)));
      if (checks.every(Boolean)) return;
    } catch { /* 服务冷启动时重试；不输出响应或凭证。 */ }
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  throw new Error('服务健康检查未通过');
};

async function commit(directory) {
  const job = await safeJob(directory);
  const manifest = await json(`${job}/ready.json`);
  assert(manifest.state === 'ready' && manifest.job === job && inside(APP_RELEASES, manifest.stage), '准备记录状态或应用目录不正确');
  const stage = await fs.realpath(manifest.stage);
  assert(stage === manifest.stage, '待发布应用目录不能是软链接');
  const recheck = async () => {
    await ensureBaseline(manifest.baseline);
    assert(same(manifest.official, await canonicalManifest()), '真实正式档案已变化，本次准备不能上线');
    assert(await sha(`${stage}/site/src/data/archive.ts`) === manifest.staged_source_hash, '准备后网站数据被修改');
    assert(await sha(`${stage}/site/src/data/archive-translations.json`) === manifest.staged_translation_hash, '准备后公开译文数据被修改');
    assert(same(manifest.isolated_translations, await treeManifest(`${job}/data/translations`)), '准备后隔离译文被修改');
    assert(same(manifest.dist, await treeManifest(`${stage}/site/dist`)), '准备后公开构建被修改');
    for (const [file, digest] of Object.entries(manifest.files)) assert(await sha(`${stage}/${file}`) === digest, `准备后程序文件已变化：${file}`);
    for (const [file, digest] of Object.entries(manifest.translation_before)) assert(await maybeSha(`${DATA}/translations/${file}`) === digest, '线上译文在准备后发生变化');
    assert(same(manifest.images.archive, await treeManifest(`${manifest.baseline.app}/site/public/archive`)) &&
      same(manifest.images.responsive, await treeManifest(`${manifest.baseline.app}/site/public/archive-responsive`)), '线上发布图片发生变化');
  };
  await recheck();
  const running = [];
  for (const service of services) {
    const active = await exec('/bin/systemctl', ['is-active', '--quiet', service[0]]).then(() => true, () => false);
    if (active) running.push(service);
  }
  assert(running.some((service) => service[0] === services[0][0]), '当前档案管理服务未正常运行，停止上线');
  const backup = `${job}/translation-backups`;
  await fs.mkdir(backup, { mode: 0o750 });
  const installed = [];
  let appSwitched = false, liveSwitched = false, stopped = false;
  try {
    log('基线核对通过，短暂停止现有服务并进行最后检查。');
    stopped = true;
    for (const service of running) await system('stop', service[0]);
    await recheck();
    await fs.mkdir(`${DATA}/translations`, { recursive: true, mode: 0o750 });
    for (const [file, digest] of Object.entries(manifest.translation_before)) {
      if (digest !== null) await fs.copyFile(`${DATA}/translations/${file}`, `${backup}/${file}`, fs.constants.COPYFILE_EXCL);
    }
    for (const file of manifest.seeds) {
      assert(file.endsWith('.json') && ID.test(file.slice(0, -5)) && manifest.translation_before[file] === null, '译文初始化清单不正确');
      // 只补充尚未存在的记录；已有审核版本和草稿不被本次初始化覆盖。
      await fs.copyFile(`${job}/data/translations/${file}`, `${DATA}/translations/${file}`, fs.constants.COPYFILE_EXCL);
      installed.push(file);
      await exec('/bin/chown', ['ljmadmin:ljmadmin', `${DATA}/translations/${file}`]);
      await fs.chmod(`${DATA}/translations/${file}`, 0o640);
    }
    await exec('/bin/chown', ['ljmadmin:ljmadmin', `${DATA}/translations`]);
    await switchLink(CURRENT, stage, 'ljmadmin'); appSwitched = true;
    // 使用项目现有独立公开版本发布器；没有改动 Caddy 或环境文件。
    const published = await runAdmin([NODE, `${stage}/deployment/publish-built-site.mjs`, `${stage}/site/dist`, PUBLIC_RELEASES, LIVE, 'bilingual']);
    await fs.writeFile(`${job}/public-publish.log`, `${published.stdout}\n${published.stderr}`, { mode: 0o640 });
    liveSwitched = true;
    const newLive = await fs.realpath(LIVE);
    assert(inside(PUBLIC_RELEASES, newLive) && newLive !== manifest.baseline.live, '公开版本没有完成独立切换');
    assert(same(manifest.dist, await treeManifest(newLive)), '公开版本与已验证构建不一致');
    assert(same(manifest.official, await canonicalManifest()), '发布期间中文正式档案发生变化');
    assert(same(manifest.images.archive, await treeManifest(`${stage}/site/public/archive`)), '发布期间图片发生变化');
    // 管理服务最后启动：完整切换和数据验证完成前，不能接受新的档案发布请求。
    const startOrder = [...running.filter((service) => service[0] !== services[0][0]), ...running.filter((service) => service[0] === services[0][0])];
    for (const service of startOrder) { await system('start', service[0]); await healthy(service.slice(1)); }
    stopped = false;
    await healthy([`${manifest.origin}/en/?deployment=${path.basename(job)}`], 10);
    const publicEnglish = await fetch(`${manifest.origin}/en/?verified=${randomUUID()}`, { signal: AbortSignal.timeout(10000), headers: { 'Cache-Control': 'no-cache' } });
    assert(publicEnglish.ok && /<html\b[^>]*\blang="en"/.test(await publicEnglish.text()), '公开英语地址未返回英语页面');
    await writeJson(`${job}/committed.json`, { state: 'committed', committed_at: new Date().toISOString(), previous_app: manifest.baseline.app,
      previous_live: manifest.baseline.live, app: stage, live: newLive, initialized_translations: installed.length,
      public_records: manifest.public_records, canonical_unchanged: true, publication_images_unchanged: true, credentials_and_accounts_read: false });
    manifest.state = 'committed'; await writeJson(`${job}/ready.json`, manifest);
    log(`上线完成：${manifest.public_records} 件档案共用原编号和图片；中文数据未改动，旧版本与备份均保留。`);
  } catch (error) {
    const rollback = [];
    log('上线未完成，开始恢复原应用、公开版本和译文初始化状态。');
    for (const service of running) await system('stop', service[0]).catch(() => rollback.push(`停止${service[0]}失败`));
    if (liveSwitched || await fs.realpath(LIVE).catch(() => '') !== manifest.baseline.live) await switchLink(LIVE, manifest.baseline.live, 'ljmpublish').catch(() => rollback.push('公开链接恢复失败'));
    if (appSwitched) await switchLink(CURRENT, manifest.baseline.app, 'ljmadmin').catch(() => rollback.push('应用链接恢复失败'));
    for (const file of installed) await fs.rename(`${DATA}/translations/${file}`, `${backup}/${file}`).catch(() => rollback.push(`译文${file}恢复失败`));
    for (const service of running) { await system('start', service[0]).catch(() => rollback.push(`恢复${service[0]}失败`)); await healthy(service.slice(1), 10).catch(() => rollback.push(`${service[0]}恢复后健康检查失败`)); }
    stopped = false;
    await writeJson(`${job}/failed.json`, { state: 'failed', failed_at: new Date().toISOString(), reason: error.message, rollback_errors: rollback, retained_translation_backups: installed.length });
    manifest.state = 'failed'; await writeJson(`${job}/ready.json`, manifest);
    throw new Error(`上线失败，已执行恢复：${error.message}${rollback.length ? `；${rollback.join('；')}` : ''}`);
  } finally {
    if (stopped) for (const service of running) await system('start', service[0]).catch(() => {});
  }
}

const args = process.argv.slice(2);
if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  assert(process.platform === 'linux' && process.getuid?.() === 0, '此工具仅在目标 Linux 服务器以 root 运行');
  const locked = args[0] === '--lock-held';
  const actual = locked ? args.slice(1) : args;
  assert(actual.length === 2 && ['prepare', 'commit'].includes(actual[0]), '用法：prepare BUNDLE.json 或 commit READY_DIR');
  if (!locked) {
    // 与 GitHub 自动部署共享同一互斥锁；prepare 和 commit 都拒绝并发部署。
    const child = spawn('/usr/bin/flock', ['--exclusive', '--nonblock', LOCK, NODE, SELF, '--lock-held', ...actual], { stdio: 'inherit' });
    child.on('error', () => { process.stderr.write('无法取得共享部署锁。\n'); process.exitCode = 1; });
    child.on('exit', (code) => { process.exitCode = code ?? 1; });
  } else {
    try { if (actual[0] === 'prepare') await prepare(actual[1]); else await commit(actual[1]); }
    catch (error) { process.stderr.write(`[bilingual] ${error.message}\n`); process.exitCode = 1; }
  }
}

export { safeSourcePath, decodeFile };
