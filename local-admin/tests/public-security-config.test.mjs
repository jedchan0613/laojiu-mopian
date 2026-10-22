import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { preparePublicCacheConfig } from '../../deployment/public-cache-config.mjs';
import { preparePublicSecurityConfig, publicSecurityName, errorSecurityName } from '../../deployment/public-security-config.mjs';
import { installPublicSecurity } from '../../deployment/public-security-install.mjs';

const sourceDirectory = fileURLToPath(new URL('../../deployment', import.meta.url));
const original = preparePublicCacheConfig('hk-test.laojiumopian.com, laojiumopian.com {\n root * /synthetic/live\n @private path /admin/*\n handle @private {\n respond 403\n }\n @api path /api/*\n handle @api {\n reverse_proxy 127.0.0.1:4177\n }\n handle_errors {\n rewrite * /404.html\n file_server\n }\n file_server\n}\nother.example.invalid {\n respond 200\n}\n');

test('公开防护只增自身import、保留缓存和访问保护；重复执行不叠加', () => {
 const result = preparePublicSecurityConfig(original);
 assert.equal(result.replace(/^\s*import "\/etc\/caddy\/laojiumopian-(?:public|error)-security\.caddy"\r?\n/gm, ''), original);
 assert.equal(preparePublicSecurityConfig(result), result);
 assert.equal((result.match(/-cache\.caddy/g) ?? []).length, 2);
 for (const input of [original.replace('laojiumopian.com {', 'other.invalid {'), original + '\nlaojiumopian.com {\n handle_errors {\n respond 404\n }\n}\n', original.replace(' respond 200', ` import /etc/caddy/${publicSecurityName}\n respond 200`)]) assert.throws(() => preparePublicSecurityConfig(input));
});

async function fixture(t) {
 const root = await fs.mkdtemp(path.join(os.tmpdir(), 'ljm-security-install-'));
 t.after(async () => { assert.equal(path.dirname(root), path.resolve(os.tmpdir())); assert.ok(path.basename(root).startsWith('ljm-security-install-')); await fs.rm(root, { recursive: true, force: true }); });
 const configFile = path.join(root, 'Caddyfile'); await fs.writeFile(configFile, original); await fs.chmod(configFile, 0o640);
 await fs.writeFile(path.join(root, publicSecurityName), 'old-security\n');
 await fs.writeFile(path.join(root, 'laojiumopian-public-cache.caddy'), 'unchanged-cache\n');
 return { root, configFile, options: { configFile, snippetsDirectory: root, sourceDirectory, backupDirectory: path.join(root, 'backup'), validate: async () => {}, reload: async () => {}, verify: async () => {} } };
}
async function assertOriginal(f) {
 assert.equal(await fs.readFile(f.configFile, 'utf8'), original);
 assert.equal(await fs.readFile(path.join(f.root, publicSecurityName), 'utf8'), 'old-security\n');
 assert.equal(await fs.readFile(path.join(f.root, 'laojiumopian-public-cache.caddy'), 'utf8'), 'unchanged-cache\n');
 await assert.rejects(fs.stat(path.join(f.root, errorSecurityName)), { code: 'ENOENT' });
 if (process.platform !== 'win32') assert.equal((await fs.stat(f.configFile)).mode & 0o777, 0o640);
}
test('安全防护默认只预演，不改正式目标、不重载、不HTTP调用', async t => {
 const f = await fixture(t);
 const result = await installPublicSecurity({ ...f.options, reload: async () => assert.fail('不应重载'), verify: async () => assert.fail('不应请求') });
 assert.equal(result.applied, false); await assertOriginal(f);
});
test('防护安装先验证候选，原子替换并复验，再重载及核验，保留缓存原文与恢复清单', async t => {
 const f = await fixture(t), events = [], mask = process.umask(0o077);
 try { await installPublicSecurity({ ...f.options, apply: true, validate: async file => { events.push(file.includes('staged') ? 'candidate' : 'written'); }, reload: async () => events.push('reload'), verify: async () => events.push('verify') }); }
 finally { process.umask(mask); }
 assert.deepEqual(events, ['candidate', 'written', 'reload', 'verify']);
 assert.match(await fs.readFile(f.configFile, 'utf8'), /-security\.caddy/);
 assert.equal(await fs.readFile(path.join(f.root, 'laojiumopian-public-cache.caddy'), 'utf8'), 'unchanged-cache\n');
 const manifest = JSON.parse(await fs.readFile(path.join(f.options.backupDirectory, 'rollback-manifest.json'), 'utf8'));
 assert.equal(manifest.length, 3); assert.equal(manifest.find(entry => entry.target.endsWith(errorSecurityName)).backup, null);
 if (process.platform !== 'win32') assert.equal((await fs.stat(path.join(f.root, errorSecurityName))).mode & 0o777, 0o644);
});
for (const failure of ['candidate', 'written', 'reload', 'verify']) test(`防护${failure}失败恢复原配置，绝不改既有缓存或访问路由`, async t => {
 const f = await fixture(t); let validations = 0, reloads = 0;
 await assert.rejects(installPublicSecurity({ ...f.options, apply: true,
  validate: async file => { validations++; if ((failure === 'candidate' && file.includes('staged')) || (failure === 'written' && validations === 2)) throw new Error('synthetic validate'); },
  reload: async () => { reloads++; if (failure === 'reload' && reloads === 1) throw new Error('synthetic reload'); },
  verify: async () => { if (failure === 'verify') throw new Error('synthetic HTTP'); },
 }));
 await assertOriginal(f); assert.equal(reloads, ['reload', 'verify'].includes(failure) ? 2 : 0);
});
test('候选检查期间正式文件改变就停止，回退失败明确给出恢复位置', async t => {
 const f = await fixture(t);
 await assert.rejects(installPublicSecurity({ ...f.options, apply: true, validate: async () => fs.writeFile(f.configFile, 'concurrent-change\n') }), /发生变化/);
 assert.equal(await fs.readFile(f.configFile, 'utf8'), 'concurrent-change\n');
 const g = await fixture(t); let reloads = 0;
 await assert.rejects(installPublicSecurity({ ...g.options, apply: true, reload: async () => { reloads++; throw new Error('synthetic permanent reload failure'); } }), error => error instanceof AggregateError && error.message.includes(g.options.backupDirectory));
 assert.equal(reloads, 2);
});
