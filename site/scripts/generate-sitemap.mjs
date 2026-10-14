import { readdir, readFile, rm, writeFile } from 'node:fs/promises';
import { join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const siteRoot = fileURLToPath(new URL('..', import.meta.url));
const distRoot = join(siteRoot, 'dist');
const sitemapPath = join(distRoot, 'sitemap.xml');
const robotsPath = join(distRoot, 'robots.txt');
const configuredSiteUrl = process.env.PUBLIC_SITE_URL?.trim();

if (!configuredSiteUrl) {
	await rm(sitemapPath, { force: true });
	if (process.env.LJM_REQUIRE_SITE_URL === '1') {
		throw new Error('正式发布构建缺少 PUBLIC_SITE_URL（网站正式地址），已停止构建：这样生成的站点不会有规范网址和站点地图。本地预览构建不需要此配置；正式发布前请先设置网站地址再重新构建。');
	}
	process.stdout.write('站点地图：本地预览构建未配置 PUBLIC_SITE_URL，本次不生成。\n');
	process.exit(0);
}

const siteUrl = new URL(configuredSiteUrl);
const isLocalHost = ['localhost', '127.0.0.1', '::1'].includes(siteUrl.hostname);
if (!['http:', 'https:'].includes(siteUrl.protocol) || isLocalHost) {
	throw new Error('PUBLIC_SITE_URL 必须是正式的 http(s) 网站地址，不能使用 localhost 或本机地址。');
}

const listFiles = async (directory) => {
	const entries = await readdir(directory, { withFileTypes: true });
	const nested = await Promise.all(entries.map((entry) => {
		const fullPath = join(directory, entry.name);
		return entry.isDirectory() ? listFiles(fullPath) : [fullPath];
	}));
	return nested.flat();
};

// 账户页面（登录、用户中心）不进站点地图：它们是私密入口，不应被搜索引擎收录或收录进索引。
const accountPagePattern = /^(?:en\/)?(?:login|me)(?:\/|\.html)/;
const isAccountPage = (path) => accountPagePattern.test(relative(distRoot, path).split(sep).join('/'));

const candidates = (await listFiles(distRoot))
	.filter((path) => path.endsWith('.html'))
	.filter((path) => !/(?:^|\/)404(?:\/index)?\.html$/.test(relative(distRoot, path).split(sep).join('/')))
	.filter((path) => !isAccountPage(path));
const htmlFiles=[];
for (const file of candidates) {
 const html=await readFile(file,'utf8');
 if(!/<meta\b[^>]*name=["']robots["'][^>]*content=["'][^"']*noindex/i.test(html))htmlFiles.push(file);
}

const toPublicPath = (path) => {
	const relativePath = relative(distRoot, path).split(sep).join('/');
	if (relativePath === 'index.html') return '/';
	if (relativePath.endsWith('/index.html')) return `/${relativePath.slice(0, -'index.html'.length)}`;
	return `/${relativePath.slice(0, -'.html'.length)}/`;
};

const escapeXml = (value) => value
	.replaceAll('&', '&amp;')
	.replaceAll('<', '&lt;')
	.replaceAll('>', '&gt;')
	.replaceAll('"', '&quot;')
	.replaceAll("'", '&apos;');

const paths = [...new Set(htmlFiles.map(toPublicPath))].sort((left, right) => left.localeCompare(right, 'en'));
const publicPaths = new Set(paths);
const urls = paths.map((path) => new URL(path, siteUrl).href);
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${paths
	.map((path) => {
		const chinesePath = path === '/en/' ? '/' : path.startsWith('/en/') ? path.slice(3) : path;
		const englishPath = chinesePath === '/' ? '/en/' : `/en${chinesePath}`;
		const alternatives = publicPaths.has(chinesePath) && publicPaths.has(englishPath)
			? [['zh-CN', chinesePath], ['en', englishPath], ['x-default', chinesePath]].map(([locale, alternate]) => `<xhtml:link rel="alternate" hreflang="${locale}" href="${escapeXml(new URL(alternate, siteUrl).href)}"/>`).join('')
			: '';
		return `  <url><loc>${escapeXml(new URL(path, siteUrl).href)}</loc>${alternatives}</url>`;
	})
	.join('\n')}\n</urlset>\n`;
await writeFile(sitemapPath, sitemap, 'utf8');

let robots = 'User-agent: *\nAllow: /\n';
try {
	robots = await readFile(robotsPath, 'utf8');
} catch {
	// 构建中没有 robots.txt 时使用最小的公开规则。
}
const privateAccountRules = ['/login/', '/me/', '/en/login/', '/en/me/']
	.filter((path) => !robots.includes(`Disallow: ${path}`)).map((path) => `Disallow: ${path}`).join('\n');
robots = `${robots.replace(/^Sitemap:.*$/gim, '').trim()}\n${privateAccountRules ? `${privateAccountRules}\n` : ''}Sitemap: ${new URL('/sitemap.xml', siteUrl).href}\n`;
await writeFile(robotsPath, robots, 'utf8');
process.stdout.write(`站点地图：已生成 ${urls.length} 个公开页面地址。\n`);
