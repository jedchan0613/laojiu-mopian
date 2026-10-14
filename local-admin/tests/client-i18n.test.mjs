import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
const project = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const require = createRequire(path.join(project, 'site/package.json'));
const esbuild = require('esbuild');
const parser = require('@babel/parser');

async function loadClient(relativePath) {
 const built = await esbuild.build({ absWorkingDir: project, entryPoints: [path.join(project, relativePath)], bundle: true, write: false, platform: 'node', format: 'cjs', tsconfigRaw: {}, logLevel: 'silent' });
 const module = { exports: {} };
 new Function('module', 'exports', built.outputFiles[0].text)(module, module.exports);
 return module.exports;
}
function staticKeys(source) {
 const keys = [];
 const tree = parser.parse(source, { sourceType: 'module', plugins: ['typescript'] });
 const walk = node => {
  if (!node || typeof node !== 'object') return;
  if (node.type === 'CallExpression' && node.callee?.name === 'ct' && node.arguments?.[0]?.type === 'StringLiteral') keys.push(node.arguments[0].value);
  for (const value of Object.values(node)) { if (Array.isArray(value)) value.forEach(walk); else if (value && typeof value === 'object') walk(value); }
 };
 walk(tree); return keys;
}

test('中文默认、英文提示和网站路径正确，API及图片不加语言前缀', async t => {
 const oldDocument = globalThis.document;
 t.after(() => { globalThis.document = oldDocument; });
 globalThis.document = { documentElement: { lang: 'zh-CN' } };
 const client = await loadClient('site/src/i18n/client.ts');
 assert.equal(client.clientText('正在上传 {0}%…', {0: 30}), '正在上传 30%…');
 assert.equal(client.clientPath('/archive/LJM-20260101-PHO-001/?place=珠海#images'), '/archive/LJM-20260101-PHO-001/?place=珠海#images');
 globalThis.document.documentElement.lang = 'en';
 assert.equal(client.clientText('正在上传 {0}%…', {0: 30}), 'Uploading 30%…');
 assert.equal(client.clientPath('/archive/LJM-20260101-PHO-001/?place=珠海#images'), '/en/archive/LJM-20260101-PHO-001/?place=珠海#images');
 assert.equal(client.clientPath('/api/account/favorites'), '/api/account/favorites');
 assert.equal(client.clientPath('/archive/images/front.jpg'), '/archive/images/front.jpg');
 assert.equal(client.clientPath('/records.json'), '/en/records.json');
 assert.equal(client.clientText('站主的说明：{0}', {0: '人工回复保持原文'}), 'Curator’s reply: 人工回复保持原文');
});

test('全部客户端和三个公开页面的固定交互文字有英文译文', async () => {
 const client = await loadClient('site/src/i18n/client.ts');
 const keys = [];
 for (const name of fs.readdirSync(path.join(project, 'site/src/scripts')).filter(name => name.endsWith('.ts'))) keys.push(...staticKeys(fs.readFileSync(path.join(project, 'site/src/scripts', name), 'utf8')));
 for (const file of ['site/src/pages/index.astro','site/src/pages/archive/index.astro','site/src/pages/archive/[id].astro','site/src/components/ArchiveFavoriteButton.astro','site/src/components/ArchiveLikeButton.astro','site/src/components/ContactWidget.astro','site/src/components/AccountShell.astro','site/src/components/BackgroundMusic.astro']) {
  const source = fs.readFileSync(path.join(project, file), 'utf8');
  for (const match of source.matchAll(/<script>([\s\S]*?)<\/script>/g)) keys.push(...staticKeys(match[1]));
  for (const match of source.matchAll(/ct\(((?:"(?:\\.|[^"\\])*")|(?:'(?:\\.|[^'\\])*'))/g)) keys.push(parser.parseExpression(match[1]).value);
 }
 const missing = [...new Set(keys)].filter(key => /[\u3400-\u9fff]/.test(client.interfaceText(key, 'en')));
 assert.deepEqual(missing, []);
});

test('旧浏览足迹按英语摘要刷新，撤下记录过滤，摘要失联不显示缓存图片', async t => {
 const oldDocument = globalThis.document, oldWindow = globalThis.window, oldFetch = globalThis.fetch;
 t.after(() => { globalThis.document = oldDocument; globalThis.window = oldWindow; globalThis.fetch = oldFetch; });
 globalThis.document = { documentElement: { lang: 'en' } };
 const entry = id => ({ id, title: '中文旧缓存', typeLabel: '照片', dateDisplay: '年代未知', imageSrc: '/old-cache.jpg', imageAlt: '中文缓存说明', imageWidth: 640, imageHeight: 480, viewedAt: 100 });
 globalThis.window = { localStorage: { getItem: () => JSON.stringify([entry('LJM-20260101-PHO-001'),entry('LJM-20260101-PHO-002')]) } };
 let requested = '';
 globalThis.fetch = async url => { requested = url; return { ok: true, json: async () => ({ records: [{ id: 'LJM-20260101-PHO-001', title: 'English title', type_label: 'Photograph', date_display: 'Date unknown', cover: '/current-public.jpg', cover_alt: 'English image caption', cover_width: 400, cover_height: 300 }] }) }; };
 const history = await loadClient('site/src/scripts/view-history.ts');
 const entries = await history.readLocalizedViewHistory();
 assert.equal(requested, '/en/records.json');
 assert.equal(entries.length, 1);
 assert.equal(entries[0].title, 'English title');
 assert.equal(entries[0].imageSrc, '/current-public.jpg');
 assert.equal(entries[0].imageAlt, 'English image caption');
 assert.equal(entries[0].imageWidth, 400);
 globalThis.fetch = async () => { throw new Error('offline'); };
 assert.deepEqual(await history.readLocalizedViewHistory(), []);
});
