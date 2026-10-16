import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

test('站点地图为中英文公开页成对标记，四类账号路径与两种404均不收录', async (t) => {
	const root = await fs.mkdtemp(path.join(os.tmpdir(), 'ljm-bilingual-sitemap-'));
	t.after(() => fs.rm(root, { recursive: true, force: true }));
	const scripts = path.join(root, 'site', 'scripts');
	const dist = path.join(root, 'site', 'dist');
	await fs.mkdir(scripts, { recursive: true });
	await fs.mkdir(path.join(root, 'shared'));
	await fs.copyFile(new URL('../../shared/locale-config.mjs', import.meta.url), path.join(root, 'shared', 'locale-config.mjs'));
	await fs.copyFile(new URL('../../site/scripts/generate-sitemap.mjs', import.meta.url), path.join(scripts, 'generate-sitemap.mjs'));
	const pages = ['index.html', 'en/index.html', 'archive/one/index.html', 'en/archive/one/index.html', 'login/index.html', 'en/login/index.html', 'me/settings/index.html', 'en/me/settings/index.html', '404.html', 'en/404/index.html'];
	for (const page of pages) {
		const filename = path.join(dist, page);
		await fs.mkdir(path.dirname(filename), { recursive: true });
		await fs.writeFile(filename, '<html></html>');
	}
	await promisify(execFile)(process.execPath, [path.join(scripts, 'generate-sitemap.mjs')], {
		env: { ...process.env, PUBLIC_SITE_URL: 'https://example.invalid' }, windowsHide: true,
	});
	const sitemap = await fs.readFile(path.join(dist, 'sitemap.xml'), 'utf8');
	assert.equal((sitemap.match(/<loc>/g) ?? []).length, 4);
	assert.equal((sitemap.match(/hreflang="zh-CN"/g) ?? []).length, 4);
	assert.equal((sitemap.match(/hreflang="en"/g) ?? []).length, 4);
	assert.equal((sitemap.match(/hreflang="x-default"/g) ?? []).length, 4);
	assert.doesNotMatch(sitemap, /\/login\/|\/me\/|404/);
	const robots = await fs.readFile(path.join(dist, 'robots.txt'), 'utf8');
	for (const privatePath of ['/login/', '/me/', '/en/login/', '/en/me/']) assert.ok(robots.includes(`Disallow: ${privatePath}`));
});
