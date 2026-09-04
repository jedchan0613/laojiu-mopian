import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { createLikeServer } from '../server.mjs';

const ITEM_ID = 'LJM-20260808-PHO-001';
const ORIGIN = 'https://laojiumopian.com';

async function createFixture() {
  const root = await mkdtemp(path.join(tmpdir(), 'ljm-like-test-'));
  const publicDirectory = path.join(root, 'public');
  const itemDirectory = path.join(publicDirectory, 'archive', ITEM_ID);
  const dataFile = path.join(root, 'private-data', 'likes.json');
  await mkdir(itemDirectory, { recursive: true });
  await writeFile(path.join(itemDirectory, 'index.html'), '<!doctype html>', 'utf8');
  const config = {
    host: '127.0.0.1',
    port: 0,
    publicLiveDirectory: publicDirectory,
    dataFile,
    secret: 'test-only-secret-with-at-least-32-characters',
    publicOrigin: ORIGIN,
  };
  return { root, dataFile, config };
}

async function start(config) {
  const server = await createLikeServer(config);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  return {
    server,
    baseUrl: `http://127.0.0.1:${address.port}`,
    close: () => new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve())),
  };
}

function headers(ip, includeOrigin = false) {
  return {
    'X-LJM-Client-IP': ip,
    ...(includeOrigin ? { Origin: ORIGIN, 'Content-Type': 'application/json' } : {}),
  };
}

test('同一访问地址只计一次，其他地址可增加，并且不保存原始 IP', async () => {
  const fixture = await createFixture();
  let running;
  try {
    running = await start(fixture.config);
    const first = await fetch(`${running.baseUrl}/api/likes/${ITEM_ID}`, {
      method: 'POST', headers: headers('203.0.113.8', true), body: '{}',
    });
    assert.equal(first.status, 200);
    assert.deepEqual(await first.json(), { item_id: ITEM_ID, count: 1, liked: true, created: true });

    const repeated = await fetch(`${running.baseUrl}/api/likes/${ITEM_ID}`, {
      method: 'POST', headers: headers('203.0.113.8', true), body: '{}',
    });
    assert.deepEqual(await repeated.json(), { item_id: ITEM_ID, count: 1, liked: true, created: false });

    const concurrent = await Promise.all(Array.from({ length: 8 }, () => fetch(`${running.baseUrl}/api/likes/${ITEM_ID}`, {
      method: 'POST', headers: headers('198.51.100.7', true), body: '{}',
    }).then((response) => response.json())));
    assert.equal(concurrent.filter((result) => result.created).length, 1);
    assert.equal(concurrent.at(-1).count, 2);

    const secondIp = await fetch(`${running.baseUrl}/api/likes/${ITEM_ID}`, {
      method: 'POST', headers: headers('2001:db8::8', true), body: '{}',
    });
    assert.deepEqual(await secondIp.json(), { item_id: ITEM_ID, count: 3, liked: true, created: true });

    const queried = await fetch(`${running.baseUrl}/api/likes?items=${ITEM_ID}`, {
      headers: headers('203.0.113.8'),
    });
    assert.deepEqual(await queried.json(), { items: { [ITEM_ID]: { count: 3, liked: true } } });

    const stored = await readFile(fixture.dataFile, 'utf8');
    assert.equal(stored.includes('203.0.113.8'), false);
    assert.equal(stored.includes('198.51.100.7'), false);
    assert.equal(stored.includes('2001:db8::8'), false);

    await running.close();
    running = await start(fixture.config);
    const afterRestart = await fetch(`${running.baseUrl}/api/likes?items=${ITEM_ID}`, {
      headers: headers('192.0.2.7'),
    });
    assert.deepEqual(await afterRestart.json(), { items: { [ITEM_ID]: { count: 3, liked: false } } });
  } finally {
    if (running?.server.listening) await running.close();
    await rm(fixture.root, { recursive: true, force: true });
  }
});

test('拒绝非本站请求、伪造编号和未公开档案', async () => {
  const fixture = await createFixture();
  const running = await start(fixture.config);
  try {
    const noOrigin = await fetch(`${running.baseUrl}/api/likes/${ITEM_ID}`, {
      method: 'POST', headers: { ...headers('203.0.113.9'), 'Content-Type': 'application/json' }, body: '{}',
    });
    assert.equal(noOrigin.status, 403);

    const invalid = await fetch(`${running.baseUrl}/api/likes/not-an-item`, {
      method: 'POST', headers: headers('203.0.113.9', true), body: '{}',
    });
    assert.equal(invalid.status, 404);

    const unpublishedId = 'LJM-20260808-PHO-999';
    const unpublished = await fetch(`${running.baseUrl}/api/likes/${unpublishedId}`, {
      method: 'POST', headers: headers('203.0.113.9', true), body: '{}',
    });
    assert.equal(unpublished.status, 404);
  } finally {
    await running.close();
    await rm(fixture.root, { recursive: true, force: true });
  }
});
