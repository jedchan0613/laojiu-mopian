import { access, readdir, readFile } from 'node:fs/promises';
import { join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const siteRoot = fileURLToPath(new URL('..', import.meta.url));
const distRoot = join(siteRoot, 'dist');
const issues = [];
const check = (condition, message) => {
	if (!condition) issues.push(message);
};

const exists = async (path) => {
	try {
		await access(path);
		return true;
	} catch {
		return false;
	}
};

const listFiles = async (directory) => {
	const entries = await readdir(directory, { withFileTypes: true });
	const nested = await Promise.all(entries.map((entry) => {
		const fullPath = join(directory, entry.name);
		return entry.isDirectory() ? listFiles(fullPath) : [fullPath];
	}));
	return nested.flat();
};

const htmlFiles = (await listFiles(distRoot)).filter((path) => path.endsWith('.html'));
const htmlEntries = await Promise.all(htmlFiles.map(async (path) => ({
	path,
	relativePath: relative(distRoot, path).split(sep).join('/'),
	html: await readFile(path, 'utf8'),
})));
const home = htmlEntries.find((entry) => entry.relativePath === 'index.html');
const archiveIndex = htmlEntries.find((entry) => entry.relativePath === 'archive/index.html');
const notFoundPage = htmlEntries.find((entry) => entry.relativePath === '404.html');
const correctionsPage = htmlEntries.find((entry) => entry.relativePath === 'corrections/index.html');
const detailPages = htmlEntries.filter((entry) => /^archive\/[^/]+\/index\.html$/.test(entry.relativePath));

check(Boolean(home), '缺少公开首页。');
check(Boolean(archiveIndex), '缺少档案列表页。');
check(Boolean(notFoundPage), '缺少友好的 404 页面。');
check(Boolean(correctionsPage), '缺少纠错与撤下说明页。');
check(detailPages.length > 0, '没有生成任何公开档案详情页。');

if (notFoundPage) {
	check(notFoundPage.html.includes('这页目前找不到'), '404 页面缺少清晰的不可访问说明。');
	check(notFoundPage.html.includes('href="/archive/"'), '404 页面缺少返回档案列表的入口。');
	check(notFoundPage.html.includes('href="/corrections/"'), '404 页面缺少纠错与撤下说明入口。');
}

if (correctionsPage) {
	check(correctionsPage.html.includes('id="correction-request-template"'), '纠错页缺少可复制的申请模板。');
	check(!correctionsPage.html.includes('<form'), '纠错页不应在没有数据处理说明时增加在线表单。');
	const configuredContactEmail = process.env.PUBLIC_CONTACT_EMAIL?.trim() ?? '';
	const validContactEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(configuredContactEmail);
	check(
		correctionsPage.html.includes('mailto:') === validContactEmail,
		'纠错页邮件入口与 PUBLIC_CONTACT_EMAIL 配置状态不一致。',
	);
}

if (home) {
	const featuredIds = [...home.html.matchAll(/data-home-featured-record="([^"]+)"/g)].map((match) => match[1]);
	const recentIds = [...home.html.matchAll(/data-home-recent-record="([^"]+)"/g)].map((match) => match[1]);
	check(featuredIds.length === 1, '首页精选档案应当且只能出现一次。');
	check(new Set(recentIds).size === recentIds.length, '首页其他档案存在重复藏品。');
	check(!recentIds.includes(featuredIds[0]), '首页精选档案与下方其他档案发生重复。');
}

if (archiveIndex) {
	const archiveIds = [...archiveIndex.html.matchAll(/data-archive-id="([^"]+)"/g)].map((match) => match[1]);
	check(archiveIds.length === detailPages.length, '档案列表数量与公开详情页数量不一致。');
	check(archiveIndex.html.includes('id="archive-sort"'), '档案列表缺少排序控件。');
	check(archiveIndex.html.includes('class="archive-paths"'), '档案列表缺少专题、年代与地点浏览入口。');
	check(archiveIndex.html.includes('data-topic-link="posted-postcards"'), '档案列表缺少人工策划专题。');
	check(archiveIndex.html.includes('id="archive-search-suggestions"'), '档案列表缺少相关标签提示区域。');
	check(archiveIndex.html.includes('data-search-highlight'), '档案列表缺少关键词高亮目标。');
	check(archiveIndex.html.includes('id="archive-pagination"'), '档案列表缺少条件式分页控件。');
	for (const sortValue of ['recent', 'date-asc', 'date-desc', 'type']) {
		check(archiveIndex.html.includes(`value="${sortValue}"`), `档案列表缺少排序方式：${sortValue}。`);
	}
}

for (const page of detailPages) {
	check(page.html.includes('class="record-status"'), `${page.relativePath} 缺少资料状态摘要。`);
	check(page.html.includes('data-record-citation'), `${page.relativePath} 缺少引用与复制入口。`);
	check(page.html.includes('data-record-usage'), `${page.relativePath} 缺少权利与下载说明。`);
	const usageSection = page.html.match(/<section\s+class="record-usage"[\s\S]*?<\/section>/)?.[0] ?? '';
	const downloadAvailable = usageSection.includes('data-download-available="true"');
	check(
		downloadAvailable === usageSection.includes('data-download-publication-copy'),
		`${page.relativePath} 的下载入口与权利策略不一致。`,
	);
	check(page.html.includes('type="application/ld+json"'), `${page.relativePath} 缺少结构化档案信息。`);
	check(page.html.includes('"@type":"CreativeWork"'), `${page.relativePath} 的结构化信息类型不正确。`);
	check(!/<section[^>]*class="record-section"[^>]*>\s*<\/section>/s.test(page.html), `${page.relativePath} 出现空内容区块。`);
}

for (const page of htmlEntries) {
	check(page.html.includes('<meta name="viewport"'), `${page.relativePath} 缺少手机端视口设置。`);
	for (const imageTag of page.html.match(/<img\b[^>]*>/g) ?? []) {
		check(/\bwidth="\d+"/.test(imageTag) && /\bheight="\d+"/.test(imageTag), `${page.relativePath} 存在未声明尺寸的图片，可能引起页面跳动或异常拉长。`);
	}
	check(!/(?:localhost|127\.0\.0\.1)[^<"]*/i.test(
		(page.html.match(/<link rel="canonical"[^>]*>|<meta property="og:url"[^>]*>/g) ?? []).join(' '),
	), `${page.relativePath} 的公开规范地址包含本机网址。`);
}

const publicText = htmlEntries.map((entry) => entry.html).join('\n');
for (const marker of ['LOCAL ARCHIVE DESK', '/api/bootstrap', 'data-admin-app', 'similar-record-button', 'STRUCTURED DATA ONLY']) {
	check(!publicText.includes(marker), `公开构建混入管理端标记：${marker}。`);
}
check(!(await exists(join(distRoot, 'admin'))), '公开构建中不应存在 admin 目录。');

const configuredSiteUrl = process.env.PUBLIC_SITE_URL?.trim();
const sitemapExists = await exists(join(distRoot, 'sitemap.xml'));
if (configuredSiteUrl) {
	check(sitemapExists, '配置正式域名后没有生成 sitemap.xml。');
	const robots = await readFile(join(distRoot, 'robots.txt'), 'utf8');
	check(/^Sitemap:\s+https?:\/\//im.test(robots), '配置正式域名后 robots.txt 缺少站点地图地址。');
} else {
	check(!sitemapExists, '未配置正式域名时不应生成可能错误的 sitemap.xml。');
}

if (issues.length) {
	process.stderr.write(`公开页面回归检查失败（${issues.length} 项）：\n${issues.map((issue) => `- ${issue}`).join('\n')}\n`);
	process.exit(1);
}

process.stdout.write(`公开页面回归检查通过：${htmlEntries.length} 个页面、${detailPages.length} 个档案详情，无重复精选、空区块、图片尺寸缺失或管理端内容。\n`);
