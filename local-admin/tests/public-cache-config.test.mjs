import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import { preparePublicCacheConfig, publicCacheName, errorCacheName } from '../../deployment/public-cache-config.mjs';
import { installPublicCache } from '../../deployment/public-cache-install.mjs';

const sourceDirectory = fileURLToPath(new URL('../../deployment', import.meta.url));
const original = '# 保留全局设置\n{\n email synthetic@example.invalid\n}\nhk-test.laojiumopian.com, laojiumopian.com {\n root * /synthetic/live\n @api path /api/account/*\n handle @api {\n  reverse_proxy 127.0.0.1:4177\n }\n handle_errors {\n  @thai path /th/*\n  handle @thai {\n   rewrite * /th/404/index.html\n   file_server\n  }\n  rewrite * /404.html\n  file_server\n }\n file_server\n}\nother.example.invalid {\n respond "其他域名 {http.request.uri}"\n}\n';

test('缓存import覆盖共享正式站及错误链，其他设置逐字保留且可重复执行', () => {
	const result = preparePublicCacheConfig(original);
	assert.equal(result.replace(/^\s*import "\/etc\/caddy\/laojiumopian-(?:public|error)-cache\.caddy"\r?\n/gm, ''), original);
	assert.equal(preparePublicCacheConfig(result), result);
	assert.equal((result.match(/import /g) ?? []).length, 2);
	assert.ok(result.indexOf(publicCacheName) < result.indexOf('root *'));
	assert.ok(result.indexOf(errorCacheName) > result.indexOf('handle_errors'));
});
test('支持逗号紧邻、多行地址、CRLF和多个既有错误处理，不改写路由', () => {
	for (const header of ['hk-test.laojiumopian.com,laojiumopian.com {', 'hk-test.laojiumopian.com,\nhttps://laojiumopian.com:443 {']) {
		const input = original.replace('hk-test.laojiumopian.com, laojiumopian.com {', header).replace(' handle_errors {', ' handle_errors 404 {').replace(' file_server\n}\nother', ' handle_errors 5xx {\n  respond "synthetic failure" 500\n }\n file_server\n}\nother').replaceAll('\n', '\r\n');
		const result = preparePublicCacheConfig(input);
		assert.equal((result.match(new RegExp(errorCacheName, 'g')) ?? []).length, 2);
		assert.equal(preparePublicCacheConfig(result), result);
		assert.ok(!/(?<!\r)\n/.test(result));
	}
});
test('站点不明确、跨域误放import、缺少错误链或未知字面量时停止', () => {
	for (const input of [original.replace('laojiumopian.com {', 'other.invalid {'), original + '\nlaojiumopian.com {\n handle_errors {\n respond 404\n }\n}\n', original.replace(' handle_errors {', ' route {'), original.replace(' respond "其他域名', ` import /etc/caddy/${publicCacheName}\n respond "其他域名`), original.replace(' root *', ' header X-Test <<VALUE\ntext\nVALUE\n root *')]) assert.throws(() => preparePublicCacheConfig(input));
});

async function fixture(t) {
	const root = await fs.mkdtemp(path.join(os.tmpdir(), 'ljm-cache-install-'));
	t.after(async () => { assert.equal(path.dirname(path.resolve(root)), path.resolve(os.tmpdir())); assert.ok(path.basename(root).startsWith('ljm-cache-install-')); await fs.rm(root, { recursive: true, force: true }); });
	const configFile = path.join(root, 'Caddyfile');
	await fs.writeFile(configFile, original);
	await fs.chmod(configFile, 0o640);
	await fs.writeFile(path.join(root, publicCacheName), 'old-public-rule\n');
	return { root, configFile, options: { configFile, snippetsDirectory: root, sourceDirectory, backupDirectory: path.join(root, 'backup'), validate: async () => {}, reload: async () => {}, verify: async () => {} } };
}
const assertOriginal = async ({ root, configFile }) => {
	assert.equal(await fs.readFile(configFile, 'utf8'), original);
	if (process.platform !== 'win32') assert.equal((await fs.stat(configFile)).mode & 0o777, 0o640);
	assert.equal(await fs.readFile(path.join(root, publicCacheName), 'utf8'), 'old-public-rule\n');
	await assert.rejects(fs.stat(path.join(root, errorCacheName)), { code: 'ENOENT' });
};
test('默认仅检查：验证候选但不写正式目标、不重载、不发核验请求', async t => {
	const f = await fixture(t); let validated = 0;
	const result = await installPublicCache({ ...f.options, validate: async file => { assert.ok(file.includes('staged')); validated++; }, reload: async () => assert.fail('不能重载'), verify: async () => assert.fail('不能调用') });
	assert.equal(result.applied, false); assert.equal(validated, 1); await assertOriginal(f);
});
test('获准应用时先校验，再写配置、再次校验、重载、HTTP核验，备份可恢复', async t => {
	const f = await fixture(t), events = [];
	const mask = process.umask(0o077);
	try { await installPublicCache({ ...f.options, apply: true, validate: async file => { events.push(file.includes('staged') ? 'stage' : 'live'); }, reload: async () => events.push('reload'), verify: async () => events.push('verify') }); }
	finally { process.umask(mask); }
	assert.deepEqual(events, ['stage', 'live', 'reload', 'verify']);
	assert.match(await fs.readFile(f.configFile, 'utf8'), /laojiumopian-error-cache/);
	if (process.platform !== 'win32') assert.equal((await fs.stat(f.configFile)).mode & 0o777, 0o640);
	if (process.platform !== 'win32') assert.equal((await fs.stat(path.join(f.root, errorCacheName))).mode & 0o777, 0o644);
	assert.equal(await fs.readFile(path.join(f.options.backupDirectory, 'Caddyfile.before'), 'utf8'), original);
});
for (const failure of ['candidate', 'written', 'reload', 'verify']) test(`${failure}失败时不遗留新配置，旧文件逐字恢复`, async t => {
	const f = await fixture(t); let reloads = 0, checks = 0;
	await assert.rejects(installPublicCache({ ...f.options, apply: true,
		validate: async file => { checks++; if ((failure === 'candidate' && file.includes('staged')) || (failure === 'written' && checks === 2)) throw new Error('合成校验失败'); },
		reload: async () => { reloads++; if (failure === 'reload' && reloads === 1) throw new Error('合成重载失败'); },
		verify: async () => { if (failure === 'verify') throw new Error('合成HTTP失败'); },
	}));
	await assertOriginal(f);
	assert.equal(reloads, ['reload', 'verify'].includes(failure) ? 2 : 0);
});
test('候选校验期间配置被其他人修改时停止，不覆盖对方新修改', async t => {
	const f = await fixture(t);
	await assert.rejects(installPublicCache({ ...f.options, apply: true, validate: async () => fs.writeFile(f.configFile, 'other-editor-change\n') }), /发生变化/);
	assert.equal(await fs.readFile(f.configFile, 'utf8'), 'other-editor-change\n');
});
