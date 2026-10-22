import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import { localeDefinitions } from '../shared/locale-config.mjs';
import { publicSecurityHeaders, hstsHeader } from './public-security-config.mjs';

export async function verifyPublicSecurity({ baseUrl, reportFile, request = (url, options) => fetch(url, options) }) {
 const results = [];
 const check = async (pathname, status) => {
  const response = await request(new URL(pathname, baseUrl), { redirect: 'manual', signal: AbortSignal.timeout(15000) });
  const body = await response.text();
  results.push({ path: pathname, status: response.status, headers: Object.fromEntries([...Object.keys(publicSecurityHeaders), 'strict-transport-security', 'cache-control', 'x-robots-tag'].map(name => [name, response.headers.get(name)])) });
  assert.equal(response.status, status, pathname);
  for (const [name, value] of Object.entries(publicSecurityHeaders)) assert.equal(response.headers.get(name), value, `${pathname}: ${name}`);
  assert.equal(response.headers.get('strict-transport-security'), hstsHeader, pathname);
  if (status === 404) {
   assert.equal(response.headers.get('cache-control'), 'no-store', pathname);
   assert.equal(response.headers.get('x-robots-tag'), 'noindex', pathname);
   assert.match(body, /<meta\b[^>]*name="robots"[^>]*content="noindex, follow"/);
   assert.doesNotMatch(body, /<link\b[^>]*rel="(?:canonical|alternate)"|<meta\b[^>]*property="og:url"/);
   for (const { prefix } of localeDefinitions) assert.ok(body.includes(`data-language-target="/${prefix ? `${prefix}/` : ''}"`), `${pathname}: 语言切换未返回首页`);
  }
  return body;
 };
 try {
  for (const { prefix, locale } of localeDefinitions) {
   const start = prefix ? `/${prefix}` : '';
   await check(`${start}/`, 200);
   const body = await check(`${start}/security-check-not-found/`, 404);
   assert.ok(body.includes(`<html lang="${locale}"`));
   await check(`${start}/404/`, 404);
  }
 } finally { if (reportFile) await fs.writeFile(reportFile, JSON.stringify(results, null, 2), { mode: 0o600 }); }
 return results;
}
