// 独立公开接收进程：只暴露投稿、回执查询、停止处理申请，不提供任何管理或静态文件路由。
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createSubmissionStore, createPublicSubmissionHandler } from './submissions.mjs';

const project = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const origin = process.env.PUBLIC_SITE_URL?.trim();
const configuredRoot = process.env.LJM_SUBMISSION_DATA_DIR?.trim();
if (!origin || new URL(origin).origin !== origin || new URL(origin).protocol !== 'https:') throw new Error('PUBLIC_SITE_URL 必须为正式网站的 HTTPS 来源地址，不含末尾斜线。');
if (!configuredRoot || !path.isAbsolute(configuredRoot)) throw new Error('必须显式配置网站目录之外的 LJM_SUBMISSION_DATA_DIR 绝对路径。');
const root = path.resolve(configuredRoot);
const publicReleases = process.env.LJM_PUBLIC_RELEASES_DIR?.trim();
for (const publicRoot of [path.join(project, 'site'), path.join(project, 'public-assets'), path.join(project, 'local-admin', 'public'), publicReleases].filter(Boolean)) {
 const relative = path.relative(path.resolve(publicRoot), root);
 if (!relative || (!relative.startsWith('..') && !path.isAbsolute(relative))) throw new Error('私密投稿目录不能位于公开目录内。');
}
const port = Number(process.env.LJM_SUBMISSION_PORT || 4176);
if (!Number.isInteger(port) || port < 1024 || port > 65535) throw new Error('投稿端口设置无效。');
const store = createSubmissionStore({ root, siteDirectory: path.join(project, 'site') });
const handler = createPublicSubmissionHandler({ store, origin, trustProxy: true });
const server = http.createServer(async (request, response) => {
 try {
  if (!await handler(request, response, new URL(request.url, origin).pathname)) response.writeHead(404, { 'Cache-Control': 'no-store' }).end();
 } catch { if (!response.headersSent) response.writeHead(500, { 'Cache-Control': 'no-store' }); response.end(); }
});
server.requestTimeout = 120_000;
server.headersTimeout = 15_000;
server.timeout = 120_000;
server.maxConnections = 40;
server.listen(port, '127.0.0.1', () => console.log(`投稿接收服务已启动：127.0.0.1:${port}（仅接受公开反向代理转发）`));
for (const signal of ['SIGINT', 'SIGTERM']) process.once(signal, () => server.close());
