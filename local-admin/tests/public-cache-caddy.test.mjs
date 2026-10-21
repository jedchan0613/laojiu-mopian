// 真Caddy、回环端口、临时合成版本；不重载系统Caddy、不触碰真实资料或配置。
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import net from 'node:net';
import { spawn, spawnSync, execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { once } from 'node:events';
import { fileURLToPath } from 'node:url';
import { revalidateCache, immutableCache, imageCache } from '../../deployment/verify-public-cache.mjs';

const command = process.env.LJM_CACHE_TEST_CADDY || 'caddy';
const available = spawnSync(command, ['version'], { windowsHide: true }).status === 0;
const prefixes = ['', '/en', '/th', '/ja', '/ko', '/zh-hant'];
const languages = ['zh-CN', 'en', 'th', 'ja', 'ko', 'zh-Hant'];
const execute = promisify(execFile);
const unusedPort = async () => { const server = net.createServer(); server.listen(0, '127.0.0.1'); await once(server, 'listening'); const port = server.address().port; await new Promise(resolve => server.close(resolve)); return port; };

test('真实Caddy：六语言、条件请求、更新/撤下、哈希资源与私密/错误响应', { skip: available ? false : '本机无既有Caddy；在Linux隔离目录执行真实验收', timeout: 60000 }, async t => {
	const root = await fs.mkdtemp(path.join(os.tmpdir(), 'ljm-cache-caddy-'));
	const publicRoot = path.join(root, 'public');
	const retired = path.join(root, 'withdrawn');
	await fs.mkdir(publicRoot); await fs.mkdir(retired);
	let child; let childClosed;
	const upstream = http.createServer((request, response) => {
		const code = /^\/api\/error\/(401|403|404|500)$/.exec(request.url)?.[1];
		response.writeHead(code ? Number(code) : 200, { 'Content-Type': 'application/json', 'Cache-Control': immutableCache });
		response.end(JSON.stringify({ synthetic: true, private: true }));
	});
	upstream.listen(0, '127.0.0.1'); await once(upstream, 'listening');
	t.after(async () => {
		if (child && child.exitCode === null) { child.kill('SIGTERM'); await childClosed; }
		upstream.closeAllConnections(); await new Promise(resolve => upstream.close(resolve));
		assert.equal(path.dirname(path.resolve(root)), path.resolve(os.tmpdir())); assert.ok(path.basename(root).startsWith('ljm-cache-caddy-'));
		await fs.rm(root, { recursive: true, force: true });
	});
	const write = async (route, value, year = 2000) => { const file = path.join(publicRoot, route); await fs.mkdir(path.dirname(file), { recursive: true }); await fs.writeFile(file, value); const date = new Date(`${year}-01-01T00:00:00Z`); await fs.utimes(file, date, date); };
	for (const [index, prefix] of prefixes.entries()) {
		for (const route of ['', '/archive', '/archive/SYNTHETIC', '/albums/synthetic', '/about', '/contribute', '/corrections']) await write(`${prefix}${route}/index.html`, `<html lang="${languages[index]}">synthetic-page-v1</html>`);
		for (const route of ['/login', '/me/contributions', '/me/favorites', '/me/settings']) await write(`${prefix}${route}/index.html`, '<html>synthetic-private</html>');
		await write(`${prefix}/records.json`, '{"synthetic":1}');
		await write(`${prefix}/404/index.html`, `<html lang="${languages[index]}">synthetic-not-found</html>`);
	}
	await write('/404.html', '<html lang="zh-CN">synthetic-not-found</html>');
	for (const route of ['/archive/SYNTHETIC/front.png', '/archive-responsive/SYNTHETIC/front-640.webp', '/robots.txt', '/sitemap.xml', '/favicon.svg', '/social/test.png', '/_astro/unversioned.js']) await write(route, 'synthetic-resource-v1');
	for (const route of ['/_astro/client.ABCDEFGH.js', '/_astro/site.IJKLMNOP.css', '/_astro/font.QRSTUVWX.woff2']) await write(route, 'synthetic-hashed-v1');
	const deployment = fileURLToPath(new URL('../../deployment', import.meta.url));
	const snippet = path.join(root, 'public.caddy'), errors = path.join(root, 'errors.caddy');
	await fs.copyFile(path.join(deployment, 'Caddyfile.public-cache.example'), snippet);
	await fs.copyFile(path.join(deployment, 'Caddyfile.error-cache.example'), errors);
	const port = await unusedPort();
	const config = path.join(root, 'Caddyfile');
	const errorRoutes = prefixes.slice(1).map(prefix => `@error${prefix.slice(1).replaceAll('-', '')} path ${prefix}/*\nhandle @error${prefix.slice(1).replaceAll('-', '')} {\n rewrite * ${prefix}/404/index.html\n file_server\n}`).join('\n');
	await fs.writeFile(config, `{\n admin off\n auto_https off\n persist_config off\n}\nhttp://laojiumopian.com:${port}, http://hk-test.laojiumopian.com:${port} {\n bind 127.0.0.1\n root * "${publicRoot.replaceAll('\\', '/')}"\n import "${snippet.replaceAll('\\', '/')}"\n encode gzip\n @api path /api /api/*\n handle @api {\n reverse_proxy 127.0.0.1:${upstream.address().port}\n }\n handle {\n file_server\n }\n handle_errors {\n import "${errors.replaceAll('\\', '/')}"\n ${errorRoutes}\n handle {\n rewrite * /404.html\n file_server\n }\n }\n}\n`);
	const env = { ...process.env, XDG_CONFIG_HOME: path.join(root, 'config'), XDG_DATA_HOME: path.join(root, 'data') };
	await execute(command, ['validate', '--config', config, '--adapter', 'caddyfile'], { env, windowsHide: true });
	let output = '';
	child = spawn(command, ['run', '--config', config, '--adapter', 'caddyfile'], { env, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] });
	childClosed = once(child, 'exit'); child.stdout.on('data', chunk => { output += chunk; }); child.stderr.on('data', chunk => { output += chunk; });
	// 原生HTTP允许明确设置Host；避免不同Node版本的fetch重写Host导致假阴性。
	const request = (route, options = {}) => new Promise((resolve, reject) => {
		const outgoing = http.request(`http://127.0.0.1:${port}${route}`, { method: options.method || 'GET', headers: { Host: 'laojiumopian.com', ...options.headers }, signal: AbortSignal.timeout(10000) }, incoming => {
			const chunks = []; incoming.on('data', chunk => chunks.push(chunk)); incoming.once('error', reject);
			incoming.once('end', () => resolve(new Response([204, 205, 304].includes(incoming.statusCode) || options.method === 'HEAD' ? null : Buffer.concat(chunks), { status: incoming.statusCode, headers: incoming.headers })));
		});
		outgoing.once('error', reject); outgoing.end(options.body);
	});
	let ready = false;
	for (let attempt = 0; attempt < 100 && child.exitCode === null; attempt++) { try { const result = await request('/'); await result.arrayBuffer(); if (result.ok) { ready = true; break; } } catch {} await new Promise(resolve => setTimeout(resolve, 25)); }
	assert.ok(ready, output);
	const check = async (route, cache, status = 200, options = {}) => { const response = await request(route, options); const body = await response.text(); assert.equal(response.status, status, `${route}: ${body}`); assert.equal(response.headers.get('cache-control'), cache, route); return { response, body }; };
	for (const prefix of prefixes) await t.test(`${prefix || '/'}公开页面与私密页完整覆盖`, async () => {
		for (const route of ['/', '/archive/', '/archive/SYNTHETIC/', '/albums/synthetic/', '/about/', '/contribute/', '/corrections/', '/records.json']) await check(`${prefix}${route}`, revalidateCache);
		for (const route of ['/login/', '/me/contributions/', '/me/favorites/', '/me/settings/']) await check(`${prefix}${route}`, 'no-store');
		const notFound = await check(`${prefix}/does-not-exist/`, 'no-store', 404); assert.ok(notFound.body.includes(`lang="${languages[prefixes.indexOf(prefix)]}"`));
	});
	await t.test('哈希程序/样式/字体一年复用，未知或不存在资源不得误用长缓存', async () => {
		for (const route of ['/_astro/client.ABCDEFGH.js', '/_astro/site.IJKLMNOP.css', '/_astro/font.QRSTUVWX.woff2']) {
			const { response } = await check(route, immutableCache); assert.ok(response.headers.get('etag')); assert.ok(response.headers.get('last-modified'));
			await check(route, immutableCache, 304, { headers: { 'If-None-Match': response.headers.get('etag') } });
			await check(route, immutableCache, 200, { method: 'HEAD' });
		}
		await check('/_astro/unversioned.js', revalidateCache);
		await check('/_astro/missing.ABCDEFGH.js', 'no-store', 404);
		await write('/_astro/client.YZabcdef.js', 'synthetic-hashed-v2', 2001);
		assert.equal((await check('/_astro/client.YZabcdef.js', immutableCache)).body, 'synthetic-hashed-v2');
		assert.equal((await check('/_astro/client.ABCDEFGH.js', immutableCache)).body, 'synthetic-hashed-v1');
	});
	await t.test('六语言旧页条件请求、改版和撤下不返回旧内容，恢复后不被负缓存卡住', async () => {
		for (const prefix of prefixes) {
			const route = `${prefix}/archive/SYNTHETIC/`, file = `${prefix}/archive/SYNTHETIC/index.html`;
			const { response } = await check(route, revalidateCache); const etag = response.headers.get('etag'); const modified = response.headers.get('last-modified');
			await check(route, revalidateCache, 304, { headers: { 'If-None-Match': etag } });
			await check(route, revalidateCache, 304, { headers: { 'If-Modified-Since': modified } });
			await write(file, 'synthetic-page-v2', 2001);
			const updated = await check(route, revalidateCache, 200, { headers: { 'If-None-Match': etag, 'If-Modified-Since': modified } }); assert.equal(updated.body, 'synthetic-page-v2');
			const retiredFile = path.join(retired, `${prefix.replaceAll('/', '') || 'zh'}.html`);
			await fs.rename(path.join(publicRoot, file), retiredFile);
			await check(route, 'no-store', 404, { headers: { 'If-None-Match': updated.response.headers.get('etag') } });
			await fs.rename(retiredFile, path.join(publicRoot, file));
			assert.equal((await check(route, revalidateCache)).body, 'synthetic-page-v2');
		}
	});
	await t.test('发布图片每次复用前核验、替换/撤下及时核对，哈希图不存在时同样no-store', async () => {
		assert.equal(imageCache, revalidateCache, '发布图片不能延迟隐私撤下后的重新核验');
		for (const route of ['/archive/SYNTHETIC/front.png', '/archive-responsive/SYNTHETIC/front-640.webp']) {
			const { response } = await check(route, imageCache);
			await check(route, imageCache, 304, { headers: { 'If-None-Match': response.headers.get('etag') } });
			await write(route, 'synthetic-image-v2', 2001);
			assert.equal((await check(route, imageCache, 200, { headers: { 'If-None-Match': response.headers.get('etag') } })).body, 'synthetic-image-v2');
			await fs.rename(path.join(publicRoot, route), path.join(retired, path.basename(route)));
			await check(route, 'no-store', 404);
		}
		for (const route of ['/robots.txt', '/sitemap.xml', '/favicon.svg', '/social/test.png']) await check(route, revalidateCache);
	});
	await t.test('接口的成功/错误/POST都覆盖上游误设的public；共享测试域名不变', async () => {
		for (const route of ['/api/account/me', '/api/submissions/config', '/api/contact/config', '/api/likes/config']) await check(route, 'no-store');
		for (const code of [401, 403, 404, 500]) await check(`/api/error/${code}`, 'no-store', code);
		await check('/api/account/login', 'no-store', 200, { method: 'POST', body: '{}' });
		await check('/about', 'no-store', 308);
		await check('/_astro/client.ABCDEFGH.js', null, 200, { headers: { Host: 'hk-test.laojiumopian.com' } });
		await check('/missing-cache-fixture/', null, 404, { headers: { Host: 'hk-test.laojiumopian.com' } });
	});
});
