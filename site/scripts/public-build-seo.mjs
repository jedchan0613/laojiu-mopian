import { localeDefinitions } from '../../shared/locale-config.mjs';

// 只识别实际生成的六个错误页；名称含404的普通档案或其他页面仍执行普通SEO门禁。
const errorPagePaths = new Set(localeDefinitions.map(({ prefix }) => prefix ? `${prefix}/404/index.html` : '404.html'));

export function checkLocalizedPageSeo(page, locale, check, siteUrl = process.env.PUBLIC_SITE_URL?.trim()) {
 // 错误页的noindex、无canonical/hreflang及语言首页目标由独立严格门禁检查。
 if (locale === 'zh-CN' || !siteUrl || errorPagePaths.has(page.relativePath)) return;
 const head = page.html.split('</head>')[0];
 const pendingArchive = /^(?:en|th|ja|ko|zh-hant)\/(?:archive\/LJM-|albums\/)/.test(page.relativePath) && /name="robots" content="noindex/.test(page.html);
 check(head.includes('hreflang="zh-CN"') && head.includes('hreflang="x-default"'), `${page.relativePath} 缺少对应中文页面标记。`);
 check(pendingArchive ? !head.includes(`hreflang="${locale}"`) : head.includes(`hreflang="${locale}"`), `${page.relativePath} 英文页面关联与译文审核状态不一致。`);
 if (pendingArchive) check(page.html.includes('class="translation-notice"'), `${page.relativePath} 缺少英文译文待复核提示。`);
}
