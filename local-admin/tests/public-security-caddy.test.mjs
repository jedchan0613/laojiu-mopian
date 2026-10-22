// 真实Caddy只监听临时回环端口；合成页面和内部测试证书不进入正式目录。
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import https from 'node:https';
import net from 'node:net';
import { spawn, spawnSync, execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { once } from 'node:events';
import { fileURLToPath } from 'node:url';
import { localeDefinitions } from '../../shared/locale-config.mjs';
import { publicSecurityHeaders, hstsHeader } from '../../deployment/public-security-config.mjs';
import { verifyPublicSecurity } from '../../deployment/verify-public-security.mjs';
import { immutableCache, revalidateCache } from '../../deployment/verify-public-cache.mjs';

const command = process.env.LJM_CACHE_TEST_CADDY || 'caddy';
const available = spawnSync(command, ['version'], { windowsHide: true }).status === 0;
const execute = promisify(execFile);
const unusedPort = async () => { const server = net.createServer(); server.listen(0, '127.0.0.1'); await once(server, 'listening'); const port = server.address().port; await new Promise(resolve => server.close(resolve)); return port; };

test('真实Caddy：六语言HTTPS防护、错误页、HTTP不发HSTS、共享域名与API隔离、原缓存不变', { skip: available ? false : '本机无既有Caddy；须在Linux私密隔离目录执行', timeout: 60000 }, async t => {
 const root = await fs.mkdtemp(path.join(os.tmpdir(), 'ljm-security-caddy-'));
 const publicRoot = path.join(root, 'public'); await fs.mkdir(publicRoot);
 let child, childClosed;
 const upstream = http.createServer((request, response) => { response.writeHead(request.url.includes('denied') ? 401 : 200, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', 'Content-Security-Policy': "default-src 'none'", 'X-Frame-Options': 'SAMEORIGIN' }); response.end('{"synthetic":true}'); });
 upstream.listen(0, '127.0.0.1'); await once(upstream, 'listening');
 t.after(async () => {
  if (child && child.exitCode === null) { child.kill('SIGTERM'); await childClosed; }
  upstream.closeAllConnections(); await new Promise(resolve => upstream.close(resolve));
  assert.equal(path.dirname(root), path.resolve(os.tmpdir())); assert.ok(path.basename(root).startsWith('ljm-security-caddy-')); await fs.rm(root, { recursive: true, force: true });
 });
 const links = localeDefinitions.map(({ prefix, locale }) => `<a data-language="${locale}" data-language-target="/${prefix ? `${prefix}/` : ''}" href="/${prefix ? `${prefix}/` : ''}">language</a>`).join('');
 const write = async (route, content) => { const filename = path.join(publicRoot, route); await fs.mkdir(path.dirname(filename), { recursive: true }); await fs.writeFile(filename, content); };
 for (const { prefix, locale } of localeDefinitions) {
  const start = prefix ? `/${prefix}` : '';
  await write(`${start}/index.html`, `<html lang="${locale}"><script>window.syntheticInline=true</script><style>p{color:black}</style><p>synthetic</p></html>`);
  await write(`${start}/404/index.html`, `<html lang="${locale}"><head><meta name="robots" content="noindex, follow"></head><body>${links}</body></html>`);
  await write(`${start}/login/index.html`, '<html>synthetic-login</html>');
 }
 await write('/404.html', `<html lang="zh-CN"><head><meta name="robots" content="noindex, follow"></head><body>${links}</body></html>`);
 await write('/_astro/client.ABCDEFGH.js', 'window.synthetic=true;');
 await write('/archive/SYNTHETIC/front.jpg', 'synthetic-publication-copy');
 const deployment = fileURLToPath(new URL('../../deployment', import.meta.url));
 const files = ['Caddyfile.public-cache.example', 'Caddyfile.error-cache.example', 'Caddyfile.public-security.example', 'Caddyfile.error-security.example'];
 for (const filename of files) await fs.copyFile(path.join(deployment, filename), path.join(root, filename));
 const imports = names => names.map(name => `import "${path.join(root, name).replaceAll('\\', '/')}"`).join('\n');
 const errorRoutes = localeDefinitions.filter(entry => entry.prefix).map(({ prefix }) => `@error${prefix.replaceAll('-', '')} path /${prefix}/*\nhandle @error${prefix.replaceAll('-', '')} {\nrewrite * /${prefix}/404/index.html\nfile_server\n}`).join('\n');
 const normal = `${imports([files[0], files[2]])}\n@api path /api /api/*\nhandle @api {\nreverse_proxy 127.0.0.1:${upstream.address().port}\n}\n@admin path /admin /admin/*\nhandle @admin {\nrespond 403\n}\nhandle {\nfile_server\n}\nhandle_errors {\n${imports([files[1], files[3]])}\n${errorRoutes}\nhandle {\nrewrite * /404.html\nfile_server\n}\n}`;
 const plainPort = await unusedPort(), tlsPort = await unusedPort(), config = path.join(root, 'Caddyfile');
 await fs.writeFile(config, `{\nadmin off\nauto_https disable_redirects\npersist_config off\nskip_install_trust\n}\nhttp://laojiumopian.com:${plainPort}, http://hk-test.laojiumopian.com:${plainPort} {\nbind 127.0.0.1\nroot * "${publicRoot.replaceAll('\\', '/')}"\n${normal}\n}\nhttps://laojiumopian.com:${tlsPort}, https://hk-test.laojiumopian.com:${tlsPort} {\nbind 127.0.0.1\ntls internal\nroot * "${publicRoot.replaceAll('\\', '/')}"\n${normal}\n}\n`);
 const env = { ...process.env, XDG_CONFIG_HOME: path.join(root, 'config'), XDG_DATA_HOME: path.join(root, 'data') };
 await execute(command, ['validate', '--config', config, '--adapter', 'caddyfile'], { env, windowsHide: true });
 let output = '';
 child = spawn(command, ['run', '--config', config, '--adapter', 'caddyfile'], { env, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] });
 childClosed = once(child, 'exit'); child.stdout.on('data', chunk => { output += chunk; }); child.stderr.on('data', chunk => { output += chunk; });
 // 只有隔离测试使用内部自签证书；生产核验仍使用fetch的默认HTTPS证书验证。
 const request = (route, { tls = true, host = 'laojiumopian.com', method = 'GET', headers = {} } = {}) => new Promise((resolve, reject) => {
  const outgoing = (tls ? https : http).request({ hostname: '127.0.0.1', port: tls ? tlsPort : plainPort, path: route, method, headers: { Host: host, ...headers }, ...(tls ? { servername: host, rejectUnauthorized: false } : {}), signal: AbortSignal.timeout(10000) }, incoming => {
   const chunks = []; incoming.on('data', chunk => chunks.push(chunk)); incoming.once('error', reject); incoming.once('end', () => resolve(new Response([204, 205, 304].includes(incoming.statusCode) || method === 'HEAD' ? null : Buffer.concat(chunks), { status: incoming.statusCode, headers: incoming.headers })));
  }); outgoing.once('error', reject); outgoing.end();
 });
 let ready = false;
 for (let attempt = 0; attempt < 100 && child.exitCode === null; attempt++) { try { const response = await request('/'); await response.arrayBuffer(); if (response.ok) { ready = true; break; } } catch {} await new Promise(resolve => setTimeout(resolve, 25)); }
 assert.ok(ready, output);
 await verifyPublicSecurity({ baseUrl: 'https://laojiumopian.com', request: url => request(url.pathname) });
 for (const { prefix } of localeDefinitions) {
  const start = prefix ? `/${prefix}` : '';
  for (const route of [`${start}/`, `${start}/login/`]) { const response = await request(route, { method: 'HEAD' }); assert.equal(response.status, 200); for (const [name, value] of Object.entries(publicSecurityHeaders)) assert.equal(response.headers.get(name), value); }
  for (const route of [`${start}/404`, `${start}/404/`, `${start}/404/index.html`]) { const response = await request(route); assert.equal(response.status, 404, route); assert.equal(response.headers.get('cache-control'), 'no-store'); await response.arrayBuffer(); }
 }
 for (const route of ['/', '/does-not-exist/', '/404/']) {
  const response = await request(route, { tls: false }); assert.equal(response.headers.get('strict-transport-security'), null); assert.equal(response.headers.get('x-frame-options'), 'DENY'); await response.arrayBuffer();
 }
 for (const route of ['/', '/does-not-exist/']) {
  const response = await request(route, { host: 'hk-test.laojiumopian.com' }); for (const name of [...Object.keys(publicSecurityHeaders), 'strict-transport-security', 'x-robots-tag', 'cache-control']) assert.equal(response.headers.get(name), null, `${route}: ${name}`); await response.arrayBuffer();
 }
 for (const route of ['/api/account/me', '/api/denied']) {
  const response = await request(route); assert.equal(response.headers.get('content-security-policy'), "default-src 'none'"); assert.equal(response.headers.get('x-frame-options'), 'SAMEORIGIN'); assert.equal(response.headers.get('cache-control'), 'no-store'); assert.equal(response.headers.get('strict-transport-security'), null); await response.arrayBuffer();
 }
 const denied = await request('/admin/'); assert.equal(denied.status, 403); assert.equal(denied.headers.get('cache-control'), 'no-store'); await denied.arrayBuffer();
 for (const [route, cache] of [['/', revalidateCache], ['/_astro/client.ABCDEFGH.js', immutableCache], ['/archive/SYNTHETIC/front.jpg', revalidateCache]]) {
  const response = await request(route); assert.equal(response.status, 200); assert.equal(response.headers.get('cache-control'), cache); assert.equal(response.headers.get('strict-transport-security'), hstsHeader); const etag = response.headers.get('etag'); await response.arrayBuffer();
  assert.ok(etag); const conditional = await request(route, { headers: { 'If-None-Match': etag } }); assert.equal(conditional.status, 304); assert.equal(conditional.headers.get('cache-control'), cache); assert.equal(conditional.headers.get('x-frame-options'), 'DENY');
 }
 const hashed404 = await request('/_astro/missing.ABCDEFGH.js'); assert.equal(hashed404.status, 404); assert.equal(hashed404.headers.get('cache-control'), 'no-store'); await hashed404.arrayBuffer();
});
