import { createHmac, randomUUID } from 'node:crypto';
import { createServer } from 'node:http';
import { isIP } from 'node:net';
import { access, mkdir, readFile, rename, unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const ITEM_ID_PATTERN = /^LJM-\d{8}-[A-Z0-9]{2,5}-\d{3}$/;
const HASH_PATTERN = /^[a-f0-9]{64}$/;
const STORE_VERSION = 1;
const MAX_ITEMS_PER_QUERY = 20;
const MAX_BODY_BYTES = 1024;
const MAX_STORE_BYTES = 10 * 1024 * 1024;
const RATE_WINDOW_MS = 60_000;
const RATE_LIMIT = 30;

class RequestError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

function isPathInside(parentPath, childPath) {
  const relative = path.relative(parentPath, childPath);
  return relative !== '' && !relative.startsWith('..') && !path.isAbsolute(relative);
}

function normalizeOrigin(value) {
  let parsed;
  try {
    parsed = new URL(value);
  } catch {
    throw new Error('LJM_PUBLIC_ORIGIN 必须是完整的网站地址。');
  }
  if (!['http:', 'https:'].includes(parsed.protocol) || parsed.pathname !== '/' || parsed.search || parsed.hash) {
    throw new Error('LJM_PUBLIC_ORIGIN 只能包含协议和域名。');
  }
  return parsed.origin;
}

export function readConfig(environment = process.env) {
  const host = environment.LJM_LIKE_HOST?.trim() || '127.0.0.1';
  if (host !== '127.0.0.1') {
    throw new Error('点赞服务只能监听 127.0.0.1。');
  }

  const port = Number(environment.LJM_LIKE_PORT || 4175);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('LJM_LIKE_PORT 必须是有效端口。');
  }

  const publicLiveDirectory = path.resolve(environment.LJM_PUBLIC_LIVE_DIR || '');
  const dataFile = path.resolve(environment.LJM_LIKE_DATA_FILE || '');
  const secret = environment.LJM_LIKE_HASH_SECRET || '';
  const publicOrigin = normalizeOrigin(environment.LJM_PUBLIC_ORIGIN || '');

  if (!environment.LJM_PUBLIC_LIVE_DIR) {
    throw new Error('缺少 LJM_PUBLIC_LIVE_DIR。');
  }
  if (!environment.LJM_LIKE_DATA_FILE) {
    throw new Error('缺少 LJM_LIKE_DATA_FILE。');
  }
  if (secret.length < 32) {
    throw new Error('LJM_LIKE_HASH_SECRET 至少需要 32 个字符。');
  }
  if (dataFile === publicLiveDirectory || isPathInside(publicLiveDirectory, dataFile)) {
    throw new Error('点赞数据文件不能放在公开网站目录内。');
  }

  return { host, port, publicLiveDirectory, dataFile, secret, publicOrigin };
}

function normalizeClientIp(rawValue) {
  if (typeof rawValue !== 'string' || rawValue.includes(',')) {
    throw new RequestError(400, '无法确认访问地址。');
  }

  let value = rawValue.trim();
  if (value.startsWith('[') && value.includes(']')) {
    value = value.slice(1, value.indexOf(']'));
  }
  if (value.startsWith('::ffff:') && isIP(value.slice(7)) === 4) {
    value = value.slice(7);
  }
  if (!isIP(value)) {
    throw new RequestError(400, '无法确认访问地址。');
  }
  return value;
}

function createDigest(secret, namespace, ...parts) {
  return createHmac('sha256', secret)
    .update([namespace, ...parts].join('\0'))
    .digest('hex');
}

function emptyState() {
  return new Map();
}

function parseStoredState(contents) {
  const parsed = JSON.parse(contents);
  if (!parsed || parsed.version !== STORE_VERSION || typeof parsed.items !== 'object' || Array.isArray(parsed.items)) {
    throw new Error('点赞数据格式不正确。');
  }

  const state = emptyState();
  for (const [itemId, itemValue] of Object.entries(parsed.items)) {
    if (!ITEM_ID_PATTERN.test(itemId) || !itemValue || !Array.isArray(itemValue.voters)) {
      throw new Error(`点赞数据包含无效档案：${itemId}`);
    }
    const voters = new Set(itemValue.voters);
    if (voters.size !== itemValue.voters.length || [...voters].some((value) => !HASH_PATTERN.test(value))) {
      throw new Error(`点赞数据包含无效记录：${itemId}`);
    }
    state.set(itemId, voters);
  }
  return state;
}

async function loadState(dataFile) {
  try {
    const contents = await readFile(dataFile, 'utf8');
    if (Buffer.byteLength(contents) > MAX_STORE_BYTES) {
      throw new Error('点赞数据文件异常过大。');
    }
    return parseStoredState(contents);
  } catch (error) {
    if (error?.code === 'ENOENT') {
      return emptyState();
    }
    throw error;
  }
}

async function persistState(dataFile, state) {
  const dataDirectory = path.dirname(dataFile);
  await mkdir(dataDirectory, { recursive: true, mode: 0o750 });
  const items = {};
  for (const itemId of [...state.keys()].sort()) {
    items[itemId] = { voters: [...state.get(itemId)].sort() };
  }
  const contents = `${JSON.stringify({
    version: STORE_VERSION,
    updated_at: new Date().toISOString(),
    items,
  }, null, 2)}\n`;
  if (Buffer.byteLength(contents) > MAX_STORE_BYTES) {
    throw new Error('点赞数据文件已达到安全容量上限。');
  }
  const temporaryFile = `${dataFile}.${process.pid}.${randomUUID()}.tmp`;
  try {
    await writeFile(temporaryFile, contents, { encoding: 'utf8', mode: 0o600, flag: 'wx' });
    await rename(temporaryFile, dataFile);
  } finally {
    await unlink(temporaryFile).catch((error) => {
      if (error?.code !== 'ENOENT') throw error;
    });
  }
}

async function publicItemExists(publicLiveDirectory, itemId) {
  if (!ITEM_ID_PATTERN.test(itemId)) return false;
  try {
    await access(path.join(publicLiveDirectory, 'archive', itemId, 'index.html'));
    return true;
  } catch {
    return false;
  }
}

function sendJson(response, status, payload, extraHeaders = {}) {
  const contents = JSON.stringify(payload);
  response.writeHead(status, {
    'Cache-Control': 'no-store',
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(contents),
    'Referrer-Policy': 'same-origin',
    'X-Content-Type-Options': 'nosniff',
    ...extraHeaders,
  });
  response.end(contents);
}

async function readJsonBody(request) {
  const contentType = request.headers['content-type'] || '';
  if (!contentType.toLowerCase().startsWith('application/json')) {
    throw new RequestError(415, '请求格式必须是 JSON。');
  }
  let size = 0;
  const chunks = [];
  for await (const chunk of request) {
    size += chunk.length;
    if (size > MAX_BODY_BYTES) throw new RequestError(413, '请求内容过大。');
    chunks.push(chunk);
  }
  if (size === 0) return {};
  try {
    const parsed = JSON.parse(Buffer.concat(chunks).toString('utf8'));
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      throw new Error('invalid body');
    }
    return parsed;
  } catch {
    throw new RequestError(400, '请求内容不是有效 JSON。');
  }
}

function requireSameOrigin(request, publicOrigin) {
  if (request.headers.origin !== publicOrigin) {
    throw new RequestError(403, '只接受来自本站页面的点赞。');
  }
}

export async function createLikeServer(config) {
  await access(config.publicLiveDirectory);
  const state = await loadState(config.dataFile);
  const rateLimits = new Map();
  let mutationQueue = Promise.resolve();

  function getClient(request) {
    return normalizeClientIp(request.headers['x-ljm-client-ip']);
  }

  function checkRateLimit(clientIp) {
    const now = Date.now();
    const key = createDigest(config.secret, 'rate-v1', clientIp);
    const current = rateLimits.get(key);
    if (!current || now - current.startedAt >= RATE_WINDOW_MS) {
      rateLimits.set(key, { startedAt: now, count: 1 });
      return;
    }
    current.count += 1;
    if (current.count > RATE_LIMIT) {
      throw new RequestError(429, '操作过于频繁，请稍后再试。');
    }
    if (rateLimits.size > 5000) {
      for (const [entryKey, value] of rateLimits) {
        if (now - value.startedAt >= RATE_WINDOW_MS) rateLimits.delete(entryKey);
      }
    }
  }

  async function getItems(requestUrl, clientIp) {
    const rawItems = requestUrl.searchParams.get('items') || '';
    const itemIds = [...new Set(rawItems.split(',').map((value) => value.trim()).filter(Boolean))];
    if (itemIds.length === 0 || itemIds.length > MAX_ITEMS_PER_QUERY) {
      throw new RequestError(400, `一次需要查询 1 至 ${MAX_ITEMS_PER_QUERY} 件档案。`);
    }
    for (const itemId of itemIds) {
      if (!(await publicItemExists(config.publicLiveDirectory, itemId))) {
        throw new RequestError(404, '档案不存在或尚未公开。');
      }
    }
    const items = {};
    for (const itemId of itemIds) {
      const voter = createDigest(config.secret, 'like-v1', itemId, clientIp);
      const voters = state.get(itemId) || new Set();
      items[itemId] = { count: voters.size, liked: voters.has(voter) };
    }
    return { items };
  }

  async function addLike(itemId, clientIp) {
    if (!(await publicItemExists(config.publicLiveDirectory, itemId))) {
      throw new RequestError(404, '档案不存在或尚未公开。');
    }
    const voter = createDigest(config.secret, 'like-v1', itemId, clientIp);
    const resultPromise = mutationQueue.then(async () => {
      const voters = state.get(itemId) || new Set();
      if (voters.has(voter)) {
        return { item_id: itemId, count: voters.size, liked: true, created: false };
      }
      voters.add(voter);
      state.set(itemId, voters);
      try {
        await persistState(config.dataFile, state);
      } catch (error) {
        voters.delete(voter);
        if (voters.size === 0) state.delete(itemId);
        throw error;
      }
      return { item_id: itemId, count: voters.size, liked: true, created: true };
    });
    mutationQueue = resultPromise.catch(() => undefined);
    return resultPromise;
  }

  const server = createServer(async (request, response) => {
    try {
      const requestUrl = new URL(request.url || '/', 'http://127.0.0.1');
      if (request.method === 'GET' && requestUrl.pathname === '/healthz') {
        sendJson(response, 200, { ok: true });
        return;
      }

      if (request.method === 'GET' && requestUrl.pathname === '/api/likes') {
        const clientIp = getClient(request);
        checkRateLimit(clientIp);
        sendJson(response, 200, await getItems(requestUrl, clientIp));
        return;
      }

      const likeMatch = requestUrl.pathname.match(/^\/api\/likes\/(LJM-[A-Z0-9-]+)$/);
      if (request.method === 'POST' && likeMatch) {
        requireSameOrigin(request, config.publicOrigin);
        const clientIp = getClient(request);
        checkRateLimit(clientIp);
        await readJsonBody(request);
        sendJson(response, 200, await addLike(likeMatch[1], clientIp));
        return;
      }

      if (requestUrl.pathname === '/api/likes' || likeMatch) {
        sendJson(response, 405, { error: '不支持这个请求方式。' }, { Allow: requestUrl.pathname === '/api/likes' ? 'GET' : 'POST' });
        return;
      }
      sendJson(response, 404, { error: '接口不存在。' });
    } catch (error) {
      if (error instanceof RequestError) {
        sendJson(response, error.status, { error: error.message });
        return;
      }
      console.error('[public-likes] 请求处理失败：', error?.message || error);
      sendJson(response, 500, { error: '点赞服务暂时不可用。' });
    }
  });

  return server;
}

async function run() {
  const config = readConfig();
  const server = await createLikeServer(config);
  if (process.argv.includes('--check-config')) {
    server.close();
    console.log('点赞服务配置检查通过。');
    return;
  }
  server.listen(config.port, config.host, () => {
    console.log(`[public-likes] 已在 http://${config.host}:${config.port} 启动。`);
  });
  const close = () => server.close(() => process.exit(0));
  process.on('SIGINT', close);
  process.on('SIGTERM', close);
}

const isDirectRun = process.argv[1]
  && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;
if (isDirectRun) {
  run().catch((error) => {
    console.error(`[public-likes] 启动失败：${error?.message || error}`);
    process.exitCode = 1;
  });
}
