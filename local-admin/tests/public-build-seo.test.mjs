import test, { after } from 'node:test';
import assert from 'node:assert/strict';
import { localeDefinitions } from '../../shared/locale-config.mjs';
import { checkLocalizedPageSeo } from '../../site/scripts/public-build-seo.mjs';

// 必须真正启用正式域名分支；不能依靠本地预览清空环境变量而绕过普通页面的检查。
const originalSiteUrl = process.env.PUBLIC_SITE_URL;
process.env.PUBLIC_SITE_URL = 'https://laojiumopian.com';
after(() => { if (originalSiteUrl === undefined) delete process.env.PUBLIC_SITE_URL; else process.env.PUBLIC_SITE_URL = originalSiteUrl; });
const issuesFor = (page, locale) => {
 const issues = [];
 checkLocalizedPageSeo(page, locale, (condition, message) => { if (!condition) issues.push(message); });
 return issues;
};
const links = locale => `<link rel="alternate" hreflang="zh-CN" href="https://laojiumopian.com/"><link rel="alternate" hreflang="x-default" href="https://laojiumopian.com/"><link rel="alternate" hreflang="${locale}" href="https://laojiumopian.com/">`;
const page = (relativePath, head, body = '') => ({ relativePath, html: `<html><head>${head}</head><body>${body}</body></html>` });

test('正式PUBLIC_SITE_URL已启用时，六个实际404由独立错误页门禁负责，不要求普通语言自引用', () => {
 assert.equal(process.env.PUBLIC_SITE_URL, 'https://laojiumopian.com');
 for (const { locale, prefix } of localeDefinitions) {
  const filename = prefix ? `${prefix}/404/index.html` : '404.html';
  assert.deepEqual(issuesFor(page(filename, '<meta name="robots" content="noindex, follow">'), locale), [], filename);
 }
});

test('正式域名分支仍拒绝普通外语页缺少中文、默认或当前语言对应，不能广泛跳过noindex或含404名称页面', () => {
 for (const { locale, prefix } of localeDefinitions.filter(entry => entry.prefix)) {
  const published = page(`${prefix}/about/index.html`, links(locale));
  assert.deepEqual(issuesFor(published, locale), []);
  for (const missing of ['zh-CN', 'x-default', locale]) {
   const broken = page(published.relativePath, links(locale).replace(`hreflang="${missing}"`, 'hreflang="removed"'));
   assert.equal(issuesFor(broken, locale).length, 1, `${locale}: ${missing}`);
  }
  for (const filename of [`${prefix}/archive/404/index.html`, `${prefix}/404-extra/index.html`, `${prefix}/login/index.html`]) {
   assert.equal(issuesFor(page(filename, '<meta name="robots" content="noindex, follow">'), locale).length, 2, filename);
  }
 }
});

test('正式域名分支保持五种语言的待审档案及相册门禁：保留中文/默认、禁止自身hreflang、要求待审提示', () => {
 for (const { locale, prefix } of localeDefinitions.filter(entry => entry.prefix)) {
  for (const filename of [`${prefix}/archive/LJM-20000101-LET-001/index.html`, `${prefix}/albums/synthetic/index.html`]) {
   const reviewedLinks = links(locale), pendingLinks = reviewedLinks.replace(new RegExp(`<link[^>]*hreflang="${locale}"[^>]*>`), '');
   const noindex = '<meta name="robots" content="noindex, follow">';
   assert.deepEqual(issuesFor(page(filename, noindex + pendingLinks, '<p class="translation-notice">待复核</p>'), locale), []);
   assert.equal(issuesFor(page(filename, noindex + reviewedLinks, '<p class="translation-notice">待复核</p>'), locale).length, 1, `${filename}: 禁止自身对应`);
   assert.equal(issuesFor(page(filename, noindex + pendingLinks), locale).length, 1, `${filename}: 要求待审提示`);
   assert.equal(issuesFor(page(filename, noindex + pendingLinks.replace('hreflang="zh-CN"', 'hreflang="removed"'), '<p class="translation-notice">待复核</p>'), locale).length, 1, `${filename}: 要求中文对应`);
  }
 }
});
