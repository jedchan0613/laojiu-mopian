import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import { localeDefinitions } from '../shared/locale-config.mjs';

export const revalidateCache = 'public, max-age=0, must-revalidate';
export const immutableCache = 'public, max-age=31536000, immutable';
export const imageCache = 'public, max-age=3600, must-revalidate';

export async function verifyPublicCache({ baseUrl, reportFile, adminOrigin }) {
	const results = [];
	const check = async (pathname, expected, status = 200, options = {}) => {
		assert.ok(pathname.startsWith('/') && !pathname.startsWith('//'));
		const response = await fetch(new URL(pathname, baseUrl), { redirect: 'manual', signal: AbortSignal.timeout(15000), ...options });
		const body = await response.text();
		results.push({ path: pathname, status: response.status, cache: response.headers.get('cache-control'), etag: response.headers.get('etag'), modified: response.headers.get('last-modified') });
		assert.equal(response.status, status, pathname);
		assert.equal(response.headers.get('cache-control'), expected, pathname);
		return { body, response };
	};
	try {
		let home;
		for (const { prefix } of localeDefinitions) {
			const start = prefix ? `/${prefix}` : '';
			const result = await check(`${start}/`, revalidateCache);
			if (!prefix) home = result.body;
			for (const page of ['archive/', 'about/', 'contribute/', 'corrections/', 'records.json']) await check(`${start}/${page}`, revalidateCache);
			await check(`${start}/login/`, 'no-store');
			await check(`${start}/me/contributions/`, 'no-store');
			await check(`${start}/cache-verification-not-found/`, 'no-store', 404);
		}
		const asset = /(?:src|href)="(\/_astro\/[^" ]+\.(?:js|css))"/.exec(home)?.[1];
		const image = /src="(\/archive-responsive\/[^" ]+\.webp)"/.exec(home)?.[1];
		assert.ok(asset && image, '首页缺少可核验资源');
		const first = await check(asset, immutableCache);
		assert.ok(first.response.headers.get('etag'));
		await check(asset, immutableCache, 304, { headers: { 'If-None-Match': first.response.headers.get('etag') } });
		await check(image, imageCache);
		for (const file of ['/robots.txt', '/sitemap.xml']) await check(file, revalidateCache);
		await check('/_astro/cache-check.ABCDEFGH.js', 'no-store', 404);
		await check('/api/account/me', 'no-store', 401);
		await check('/api/submissions/config', 'no-store');
		await check('/api/contact/config', 'no-store');
		const album = /href="(\/albums\/[^"?#]+\/)"/.exec(home)?.[1];
		if (album) for (const { prefix } of localeDefinitions) await check(`${prefix ? `/${prefix}` : ''}${album}`, revalidateCache);
		if (adminOrigin) {
			const response = await fetch(`${adminOrigin}/api/bootstrap`, { redirect: 'manual', signal: AbortSignal.timeout(15000) });
			results.push({ path: 'admin-origin:/api/bootstrap', status: response.status, cache: response.headers.get('cache-control') });
			assert.equal(response.status, 403); assert.equal(response.headers.get('cache-control'), 'no-store');
			await response.arrayBuffer();
		}
	} finally { if (reportFile) await fs.writeFile(reportFile, JSON.stringify(results, null, 2), { mode: 0o600 }); }
	return results;
}
