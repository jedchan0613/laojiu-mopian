import {localeDefinitions,pathForLocale} from '../../shared/locale-config.mjs';
import { access, readdir, readFile } from 'node:fs/promises';
import { join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { fontace } from 'fontace';
import { pointsInRanges, readCompleteFontCoverage } from './complete-font-coverage.mjs';

const siteRoot = fileURLToPath(new URL('..', import.meta.url));
const distRoot = join(siteRoot, 'dist');
const homeSource = await readFile(join(siteRoot, 'src', 'pages', 'index.astro'), 'utf8');
const archiveIndexSource = await readFile(join(siteRoot, 'src', 'pages', 'archive', 'index.astro'), 'utf8');
const archiveDetailSource = await readFile(join(siteRoot, 'src', 'pages', 'archive', '[id].astro'), 'utf8');
const archiveLikesSource = await readFile(join(siteRoot, 'src', 'scripts', 'archive-likes.ts'), 'utf8');
const baseLayoutSource = await readFile(join(siteRoot, 'src', 'layouts', 'BaseLayout.astro'), 'utf8');
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

const distFiles = await listFiles(distRoot);
const htmlFiles = distFiles.filter((path) => path.endsWith('.html'));
const htmlEntries = await Promise.all(htmlFiles.map(async (path) => ({
	path,
	relativePath: relative(distRoot, path).split(sep).join('/'),
	html: await readFile(path, 'utf8'),
})));

// 公共页面正文统一使用本地宋体。直接读取字体文件的真实字形范围，避免
// 子集缺字时浏览器悄悄回退到另一种宋体，造成同一标题内粗细不一致。
const brandFontFiles = [
	'noto-serif-sc-base.woff2',
	'noto-serif-sc-extended.woff2',
	'noto-serif-sc-public-supplement.woff2',
	'noto-serif-sc-brand-supplement.woff',
];
const brandFontRanges = (await Promise.all(brandFontFiles.map(async (fileName) => {
	const fontBuffer = await readFile(join(siteRoot, 'src', 'assets', 'fonts', fileName));
	return fontace(fontBuffer).unicodeRangeArray.map((range) => {
		const [start, end = start] = range.slice(2).split('-').map((value) => Number.parseInt(value, 16));
		return [start, end];
	});
}))).flat();
const brandFontPoints = await readCompleteFontCoverage(
	join(siteRoot, 'src', 'assets', 'fonts', 'complete'),
	pointsInRanges(brandFontRanges),
	check,
);
check(baseLayoutSource.includes("import '../assets/fonts/complete/complete.css'"), '完整字库没有接入公开页面。');
const brandFontHasGlyph = (character) => brandFontPoints.has(character.codePointAt(0));
// 部署使用服务器正式档案，不应因本地样例较少而缩减既有字库覆盖。
const originalBrandFont = fontace(await readFile(join(siteRoot, 'src', 'assets', 'fonts', 'noto-serif-sc-brand.woff2')));
const originalGlyphsPreserved = originalBrandFont.unicodeRangeArray.every((range) => {
	const [start, end = start] = range.slice(2).split('-').map((value) => Number.parseInt(value, 16));
	for (let point = start; point <= end; point += 1) {
		if (!brandFontHasGlyph(String.fromCodePoint(point))) return false;
	}
	return true;
});
check(originalGlyphsPreserved, '拆分字体遗漏原字库字形，可能导致服务器既有公开档案缺字。');
const publicPageMarkup = htmlEntries
	.map(({ html }) => html
		.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '')
		.replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ''))
	.join('\n');
const requiredBrandCharacters = new Set([
	...(publicPageMarkup.match(/\p{Script=Han}/gu) ?? []),
	// 来自已发布页面截图；即使本地样例数据暂未同步，也必须防止再次回退。
	...'搞玩都困难暗室',
	// 2026-10-11：服务器草稿发布曾因这四字缺失而回滚，字体更新不能再次遗漏。
	...'杯闹胸桌',
	// 完整字库保留常用繁体和基本区生僻字，新增内容不再逐字补字体。
	...'繁體龘',
	// 服务器正式公开原文的缺字回归；不能只验证本地六件样例。
	...'啊哎唉矮傲爸吧佰半伴饱抱倍辈奔俾舶踩惭婵畅吵趁乘吃迟抽匆粗答诞蛋挡弟睇掂颠惦叮懂唞豆毒盾耳帆凡犯饭芳飞奋逢父妇负赶糕咯哥耕顾怪孩害咁憾豪恨厚乎诲慧伙棘几季嫁健奖骄叫颈竟敬举倔嘅颗苦愧啦篮懒牢唠涝叻励俩谅聆履虑乱啰妈吗嘛慢忙矛锚冇妹闷猛眠乜咩母耐男恼脑呢嗯溺廿嬲努哦怕盼抛跑陪碰疲辟贫企气弃歉倾球屈佢却扰森啥衫捎婶甚食叔蔬瞬虽岁碎嗦琐她踏坦讨厅痛偷透忘委胃喂慰吻揾握屋唔午吸媳暇卸兄眼药爷嘢遗椅饮勇忧又娱渔愉愚院责掌啫争侄衷嘱抓仔租阻尊琢坐做咗㗎',
]);
const missingBrandCharacters = [...requiredBrandCharacters]
	.filter((character) => !brandFontHasGlyph(character))
	.sort((left, right) => left.localeCompare(right, 'zh-CN'));
check(
	missingBrandCharacters.length === 0,
	`完整宋体仍未收录公开页面用字：${missingBrandCharacters.join('、')}。这些罕见字需另行处理。`,
);
check(
	baseLayoutSource.includes("noto-serif-sc-brand-supplement.woff") &&
		baseLayoutSource.includes('U+56F0, U+5BA4, U+641E, U+6697, U+73A9'),
	'补充字库没有正确接入公开页面。',
);
const brandSubsetStyles = await readFile(join(siteRoot, 'src', 'assets', 'fonts', 'brand-subsets.css'), 'utf8');
check(brandSubsetStyles.includes('noto-serif-sc-public-supplement.woff2') && brandSubsetStyles.includes('U+35CE'), '服务器公开原文补充字库没有接入字体样式。');
const completeFontManifest = JSON.parse(await readFile(join(siteRoot, 'src', 'assets', 'fonts', 'complete', 'manifest.json'), 'utf8'));
const emittedCompleteFonts = distFiles.filter((file) => /noto-serif-sc-full-[\da-f]+\.[^/\\]+\.woff2$/.test(file));
check(emittedCompleteFonts.length === completeFontManifest.shards.length, '完整字体分片必须全部独立输出，不能内嵌到全站样式中。');
const builtStyles = (await Promise.all(distFiles.filter((file) => file.endsWith('.css')).map((file) => readFile(file, 'utf8')))).join('\n');
check(!builtStyles.includes('data:font/woff2') && !builtStyles.includes('fonts.googleapis.com') && !builtStyles.includes('fonts.gstatic.com'), '公开字体必须本地按需加载，不得内嵌完整分片或请求外部字体服务。');
const scriptEntries = await Promise.all(
	distFiles.filter((path) => path.endsWith('.js')).map(async (path) => ({
		publicPath: `/${relative(distRoot, path).split(sep).join('/')}`,
		contents: await readFile(path, 'utf8'),
	})),
);
const scriptsByPublicPath = new Map(scriptEntries.map((entry) => [entry.publicPath, entry.contents]));
const normalizePublicPath = (value, basePath = '/') =>
	new URL(value, `https://public-build.invalid${basePath}`).pathname;
const scriptTreeIncludes = (scriptPath, marker, visited = new Set()) => {
	const normalizedPath = normalizePublicPath(scriptPath);
	if (visited.has(normalizedPath)) return false;
	visited.add(normalizedPath);
	const contents = scriptsByPublicPath.get(normalizedPath);
	if (!contents) return false;
	if (contents.includes(marker)) return true;
	const basePath = normalizedPath.slice(0, normalizedPath.lastIndexOf('/') + 1);
	const importPaths = [
		...[...contents.matchAll(/\bimport\s*(?:[^"'()]*?\sfrom\s*)?["']([^"']+)["']/g)].map((match) => match[1]),
		...[...contents.matchAll(/\bimport\s*\(\s*[`"']([^`"']+)[`"']/g)].map((match) => match[1]),
	];
	return importPaths.some((importPath) => scriptTreeIncludes(normalizePublicPath(importPath, basePath), marker, visited));
};
const pageLoadsScriptMarker = (page, marker) => {
	if (page.html.includes(marker)) return true;
	const scriptSources = [...page.html.matchAll(/<script\b[^>]*\btype="module"[^>]*\bsrc="([^"]+)"[^>]*>/g)]
		.map((match) => match[1]);
	return scriptSources.some((source) => scriptTreeIncludes(source, marker));
};
const pageDirectlyLoadsScriptMarker = (page, marker) => {
  const scriptSources = [...page.html.matchAll(/<script\b[^>]*\btype="module"[^>]*\bsrc="([^"]+)"[^>]*>/g)]
    .map((match) => normalizePublicPath(match[1]));
  return scriptSources.some((source) => scriptsByPublicPath.get(source)?.includes(marker));
};
// 读取页面内嵌的「随手翻一件」随机档案编号索引。
const extractRandomIndexIds = (html) => {
  const match = html.match(/id="random-record-index"[^>]*>([\s\S]*?)<\/script>/);
  if (!match) return [];
  try {
    const parsed = JSON.parse(match[1]);
    return Array.isArray(parsed) ? parsed.filter((value) => typeof value === 'string') : [];
  } catch {
    return [];
  }
};
const home = htmlEntries.find((entry) => entry.relativePath === 'index.html');
const archiveIndex = htmlEntries.find((entry) => entry.relativePath === 'archive/index.html');
const notFoundPage = htmlEntries.find((entry) => entry.relativePath === '404.html');
const correctionsPage = htmlEntries.find((entry) => entry.relativePath === 'corrections/index.html');
const detailPages = htmlEntries.filter((entry) => /^archive\/[^/]+\/index\.html$/.test(entry.relativePath));
const englishHome = htmlEntries.find((entry) => entry.relativePath === 'en/index.html');
const englishArchiveIndex = htmlEntries.find((entry) => entry.relativePath === 'en/archive/index.html');
const englishDetailPages = htmlEntries.filter((entry) => /^en\/archive\/[^/]+\/index\.html$/.test(entry.relativePath));
const retiredBackgroundMusicPublicPaths = [
	'/audio/lullaby-summer-cicadas.ogg',
	'/audio/last-reunion.mp3',
];

check(Boolean(home), '缺少公开首页。');
check(Boolean(archiveIndex), '缺少档案列表页。');
check(Boolean(notFoundPage), '缺少友好的 404 页面。');
check(Boolean(correctionsPage), '缺少纠错与撤下说明页。');
check(detailPages.length > 0, '没有生成任何公开档案详情页。');
check(Boolean(englishHome), '缺少英语首页。');
check(Boolean(englishArchiveIndex), '缺少英语档案列表。');
check(englishDetailPages.length === detailPages.length, '中英文公开档案详情页数量不一致。');
const chineseRecordIds = new Set(detailPages.map((page) => page.relativePath.split('/')[1]));
for (const page of englishDetailPages) {
	const itemId = page.relativePath.split('/')[2];
	check(chineseRecordIds.has(itemId), `${page.relativePath} 没有对应中文档案，可能改变了档案身份。`);
	check(page.html.includes('data-record-citation') && page.html.includes('data-record-usage'), `${page.relativePath} 缺少引用或权利政策。`);
	check(page.html.includes('"@type":"CreativeWork"'), `${page.relativePath} 缺少结构化档案信息。`);
	const likes = [...page.html.matchAll(/data-archive-like[^>]*data-item-id="([^"]+)"/g)].map((match) => match[1]);
	check(likes.length === 1 && likes[0] === itemId, `${page.relativePath} 的点赞身份与中文不一致。`);
	check(pageLoadsScriptMarker(page, '/api/likes?items='), `${page.relativePath} 缺少点赞计数程序。`);
	const usageSection = page.html.match(/<section\s+class="record-usage"[\s\S]*?<\/section>/)?.[0] ?? '';
	check(usageSection.includes('data-download-available="true"') === usageSection.includes('data-download-publication-copy'), `${page.relativePath} 的下载入口与权利策略不一致。`);
	check(!/<section[^>]*class="record-section"[^>]*>\s*<\/section>/s.test(page.html), `${page.relativePath} 出现空内容区块。`);
}
if (englishHome) check(extractRandomIndexIds(englishHome.html).length === detailPages.length, '英语首页随机索引改变了档案集合。');
if (englishArchiveIndex) {
	const ids = [...englishArchiveIndex.html.matchAll(/data-archive-id="([^"]+)"/g)].map((match) => match[1]);
	check(ids.length === detailPages.length && ids.every((id) => chineseRecordIds.has(id)), '英语档案列表与中文公开集合不一致。');
	check(englishArchiveIndex.html.includes('id="archive-search-index"'), '英语档案列表缺少搜索索引。');
}
// 每个语言版本共用同一资料、图片与权限身份；缺译文页按语言独立禁止收录。
for(const definition of localeDefinitions.filter(entry=>entry.prefix)){
 const prefix=definition.prefix+'/',translatedHome=htmlEntries.find(entry=>entry.relativePath===prefix+'index.html'),translatedIndex=htmlEntries.find(entry=>entry.relativePath===prefix+'archive/index.html');
 const translatedDetails=htmlEntries.filter(entry=>entry.relativePath.startsWith(prefix+'archive/')&&/^LJM-[^/]+\/index\.html$/.test(entry.relativePath.slice((prefix+'archive/').length)));
 check(Boolean(translatedHome)&&Boolean(translatedIndex),definition.locale+' 缺少首页或目录');
 check(translatedDetails.length===detailPages.length,definition.locale+' 档案详情数量不一致');
 for(const page of translatedDetails){
  const id=page.relativePath.split('/')[2];check(chineseRecordIds.has(id),page.relativePath+' 资料身份不一致');
  check(page.html.includes('lang="'+definition.locale+'"'),page.relativePath+' 页面语言不正确');
  check(page.html.includes('data-record-citation')&&page.html.includes('data-record-usage'),page.relativePath+' 缺少引用或使用说明');
 }
 const accounts=htmlEntries.filter(entry=>entry.relativePath===prefix+'login/index.html'||entry.relativePath.startsWith(prefix+'me/'));
 check(accounts.length===htmlEntries.filter(entry=>entry.relativePath==='login/index.html'||entry.relativePath.startsWith('me/')).length,definition.locale+' 账户页不完整');
 for(const page of accounts)check(page.html.includes('name="robots"')&&page.html.includes('noindex'),page.relativePath+' 账户页未禁止收录');
 if(translatedHome)check(extractRandomIndexIds(translatedHome.html).length===detailPages.length,definition.locale+' 随机档案集合不一致');
}
check(homeSource.includes('const view = views[0];'), '首页精选没有固定为每种分类取一件藏品。');
check(homeSource.includes('Boolean(view.images[0])'), '首页精选没有排除缺少图片的藏品。');
check(homeSource.includes('const source = view?.images[0];'), '首页精选没有固定使用每件藏品的首张图片。');
check(homeSource.includes('item.core.created_date?.trim()'), '首页排序没有优先使用首次录入日期。');
check(!homeSource.includes('homeCarouselMaximumSlides'), '首页精选仍受旧的轮播总数上限限制。');
check(!homeSource.includes('homeCarouselExcludedImagePaths'), '首页精选仍使用旧的单张图片排除清单。');
check(
	archiveIndexSource.includes("fetchpriority={originalIndex === 0 ? 'high' : undefined}"),
	'档案列表首张封面缺少高优先级加载设置。',
);
check(archiveLikesSource.includes("window.addEventListener('load'"), '点赞计数应在页面主要资源完成后再读取。');
check(!archiveLikesSource.includes('likePreloadItems'), '首页不应提前读取尚未显示的轮播档案点赞计数。');
check(archiveLikesSource.includes('archive-likes-updated'), '点赞计数更新缺少页面通知事件，列表页无法按最多点赞排序。');
check(archiveLikesSource.includes('data-archive-id'), '点赞计数应同时读取列表中的档案编号，供最多点赞排序使用。');
check(archiveDetailSource.includes("item.core.object_type === 'LET'"), '详情页缺少信件类型专属判断。');
for (const marker of ['data-letter-reader', '文字阅读', '原件对照', '只看原件', '原件图片是最终核对依据']) {
  check(archiveDetailSource.includes(marker), `信件阅读模板缺少必要内容：${marker}。`);
}
check(archiveDetailSource.includes('data-letter-size-select'), '信件阅读缺少字号调节控件。');
check(archiveDetailSource.includes('record-view-data'), '详情页缺少浏览足迹记录数据。');

if (notFoundPage) {
  check(notFoundPage.html.includes('这页目前找不到'), '404 页面缺少清晰的不可访问说明。');
  check(notFoundPage.html.includes('href="/archive/"'), '404 页面缺少返回档案列表的入口。');
  check(notFoundPage.html.includes('href="/corrections/"'), '404 页面缺少纠错与撤下说明入口。');
  check(notFoundPage.html.includes('id="not-found-search-input"'), '404 页面缺少关键词搜索框。');
  check(notFoundPage.html.includes('action="/archive/"'), '404 页面搜索框没有指向档案列表页。');
  check(notFoundPage.html.includes('data-random-record-button'), '404 页面缺少「随手翻一件」随机浏览入口。');
  check(
    extractRandomIndexIds(notFoundPage.html).length === detailPages.length,
    '404 页随机浏览索引与公开详情页数量不一致。',
  );
}

if (correctionsPage) {
	check(correctionsPage.html.includes('id="correction-request-template"'), '纠错页缺少可复制的申请模板。');
	check(!correctionsPage.html.includes('id="correction-online-form"'), '纠错说明页不应增加独立在线表单；统一使用全站联系挂件。');
	const configuredContactEmail = process.env.PUBLIC_CONTACT_EMAIL?.trim() ?? '';
	const validContactEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(configuredContactEmail);
	check(
		correctionsPage.html.includes('mailto:') === validContactEmail,
		'纠错页邮件入口与 PUBLIC_CONTACT_EMAIL 配置状态不一致。',
	);
}

if (home) {
	const categoryOrder = ['photos', 'postcards', 'letters', 'credentials', 'cards', 'notes', 'other'];
	const featuredIds = [...home.html.matchAll(/data-home-featured-record="([^"]+)"/g)].map((match) => match[1]);
	const recentIds = [...home.html.matchAll(/data-home-recent-record="([^"]+)"/g)].map((match) => match[1]);
	const recentCategories = [...home.html.matchAll(/data-home-recent-category="([^"]+)"/g)].map((match) => match[1]);
	const likeIds = [...home.html.matchAll(/data-archive-like[^>]*data-item-id="([^"]+)"/g)].map((match) => match[1]);
	const carouselCategories = home.html.match(/data-carousel-category-order="([^"]*)"/)?.[1].split(',').filter(Boolean) ?? [];
	const carouselRecordIds = home.html.match(/data-carousel-record-order="([^"]*)"/)?.[1].split(',').filter(Boolean) ?? [];
	check(featuredIds.length === 1, '首页精选档案应当且只能出现一次。');
	check(carouselRecordIds.length === carouselCategories.length, '首页精选藏品与分类顺序数量不一致。');
	check(new Set(carouselRecordIds).size === carouselRecordIds.length, '首页精选重复使用了同一件藏品。');
	check(carouselRecordIds.length <= categoryOrder.length, '首页精选每种分类展示超过一件藏品。');
	const carouselCategoryCounts = new Map();
	for (const category of carouselCategories) {
		carouselCategoryCounts.set(category, (carouselCategoryCounts.get(category) ?? 0) + 1);
	}
	check(
		[...carouselCategoryCounts.values()].every((count) => count === 1),
		'首页精选没有为每个入选分类恰好展示一件藏品。',
	);
	check(new Set(recentIds).size === recentIds.length, '首页每种藏品类型只能展示一件最新档案。');
	check(recentCategories.length === recentIds.length, '首页其他档案缺少藏品类型顺序标识。');
	check(new Set(recentCategories).size === recentCategories.length, '首页其他档案重复展示了同一种藏品类型。');
	check(recentIds.every((itemId) => !carouselRecordIds.includes(itemId)), '首页其他档案重复展示了精选藏品。');
	check(recentCategories.every((category, index) =>
		categoryOrder.indexOf(category) > categoryOrder.indexOf(recentCategories[index - 1] ?? '')),
	'首页其他档案没有按规定的藏品类型顺序排列。');
	let lastCarouselCategoryIndex = -1;
	let carouselRoundCategories = new Set();
	for (const category of carouselCategories) {
		const categoryIndex = categoryOrder.indexOf(category);
		check(categoryIndex >= 0, `首页精选轮播包含未知藏品类型：${category}。`);
		if (categoryIndex <= lastCarouselCategoryIndex) carouselRoundCategories = new Set();
		check(!carouselRoundCategories.has(category), `首页精选轮播同一轮重复出现藏品类型：${category}。`);
		carouselRoundCategories.add(category);
		lastCarouselCategoryIndex = categoryIndex;
	}
	check(likeIds.length === 0, '首页不应再显示点赞入口。');
	check(!pageLoadsScriptMarker(home, '/api/likes?items='), '首页不应加载点赞计数程序。');
	check(!home.html.includes('ARCHIVE · 001'), '首页重新出现已移除的装饰性档案编号。');
	check(homeSource.includes('data-random-record-button'), '首页缺少「随手翻一件」随机浏览入口。');
	check(homeSource.includes('data-view-history'), '首页缺少「您最近看过」浏览足迹区块。');
	check(homeSource.includes('data-view-history-clear'), '首页浏览足迹缺少清空入口。');
	check(!homeSource.includes('继续上次浏览'), '首页浏览足迹仍显示已删除的重复说明。');
	check(homeSource.includes("item.className = 'view-history-item'"), '首页浏览足迹缺少受控列表项样式标记。');
	check(homeSource.includes(':global(.view-history-image img)'), '首页浏览足迹的动态图片没有进入尺寸约束。');
	check(homeSource.includes('object-fit: contain;'), '首页浏览足迹图片没有保持比例适配缩略图。');
	check(
		homeSource.includes('手机端去掉桌面端的图标列') &&
			homeSource.includes('grid-template-columns: 1.7rem minmax(0, 1fr) max-content 0.85rem;'),
		'首页移动端分类入口没有采用紧凑的四列布局。',
	);
	check(
		homeSource.includes('word-break: keep-all;') && homeSource.includes('writing-mode: horizontal-tb;'),
		'首页移动端分类名称缺少防止逐字竖排的约束。',
	);
	check(
		extractRandomIndexIds(home.html).length === detailPages.length,
		'首页随机浏览索引与公开详情页数量不一致。',
	);
}

if (archiveIndex) {
	const archiveIds = [...archiveIndex.html.matchAll(/data-archive-id="([^"]+)"/g)].map((match) => match[1]);
	const albumMembers = new Map();
	const albumByItemId = new Map();
	for (const match of archiveIndex.html.matchAll(/<li\b[^>]*data-archive-id="([^"]+)"[^>]*>/g)) {
		const albumKey = match[0].match(/data-archive-album-key="([^"]+)"/)?.[1];
		if (!albumKey) continue;
		albumByItemId.set(match[1], albumKey);
		albumMembers.set(albumKey, (albumMembers.get(albumKey) ?? 0) + 1);
		check(/\shidden(?:\s|=|>)/.test(match[0]), `入册档案 ${match[1]} 在默认目录中没有收拢。`);
	}
	const albumKeys = [];
	for (const match of archiveIndex.html.matchAll(/<li\b[^>]*data-archive-album-card="([^"]+)"[^>]*>/g)) {
		albumKeys.push(match[1]);
		const declaredCount = Number(match[0].match(/data-album-record-count="(\d+)"/)?.[1]);
		check(declaredCount === albumMembers.get(match[1]), `相册 ${match[1]} 的公开总件数没有包含全部真实成员。`);
	}
	check(new Set(albumKeys).size === albumKeys.length, '档案目录重复展示同一个相册入口。');
	check(albumKeys.length === albumMembers.size, '相册入口与入册档案的归属不一致。');
	for (const mode of ['grouped', 'albums', 'items']) check(archiveIndex.html.includes(`data-archive-view="${mode}"`), `档案目录缺少 ${mode} 浏览方式。`);
	check(home?.html.includes('id="home-albums-heading"'), '首页缺少清楚的按相册浏览入口。');
	if (home) {
		const homeRecordIds = [
			...(home.html.match(/data-carousel-record-order="([^"]*)"/)?.[1].split(',').filter(Boolean) ?? []),
			...[...home.html.matchAll(/data-home-recent-record="([^"]+)"/g)].map((match) => match[1]),
		];
		const homeAlbums = homeRecordIds.map((id) => albumByItemId.get(id)).filter(Boolean);
		check(new Set(homeAlbums).size === homeAlbums.length, '首页精选与继续浏览重复分散展示了同册档案。');
	}
	const likeIds = [...archiveIndex.html.matchAll(/data-archive-like[^>]*data-item-id="([^"]+)"/g)].map((match) => match[1]);
	check(archiveIds.length === detailPages.length, '档案列表数量与公开详情页数量不一致。');
	check(likeIds.length === 0, '档案列表不应再显示点赞入口。');
	check(pageLoadsScriptMarker(archiveIndex, '/api/likes?items='), '档案列表缺少点赞计数程序。');
	check(archiveIndex.html.includes('id="archive-sort"'), '档案列表缺少排序控件。');
	check(archiveIndex.html.includes('class="archive-paths"'), '档案列表缺少年代与地点浏览入口。');
	check(archiveIndex.html.includes('id="archive-decade-path-heading"'), '档案列表缺少按年代浏览入口。');
	check(archiveIndex.html.includes('id="archive-place-path-heading"'), '档案列表缺少按地点浏览入口。');
	check(!archiveIndex.html.includes('ARCHIVE INDEX'), '档案列表重新出现已移除的英文装饰标题。');
	check(!archiveIndex.html.includes('data-topic-link='), '档案列表在暂不设置专题时仍输出专题入口。');
	check(archiveIndex.html.includes('id="archive-search-suggestions"'), '档案列表缺少相关标签提示区域。');
	check(archiveIndex.html.includes('data-search-highlight'), '档案列表缺少关键词高亮目标。');
	check(archiveIndex.html.includes('id="archive-search-index"'), '档案列表缺少构建时生成的搜索索引数据。');
	check(archiveIndex.html.includes('data-match-reason'), '档案列表缺少关键词匹配位置提示。');
	check(!archiveIndex.html.includes('data-search-text'), '档案列表重新使用扁平搜索文本而不是分字段搜索索引。');
	check(archiveIndex.html.includes('id="archive-pagination"'), '档案列表缺少条件式分页控件。');
	check(archiveIndexSource.includes('compareRecentEntries'), '档案列表缺少统一的最近收录排序规则。');
	check(archiveIndexSource.includes('item.core.created_date?.trim()'), '最近收录排序没有使用首次录入日期。');
	check(archiveIndexSource.includes('.archive-list > li[hidden]'), '档案列表缺少筛选结果卡片的明确隐藏样式。');
	for (const sortValue of ['recent', 'likes', 'date-asc', 'date-desc', 'type', 'relevance']) {
		check(archiveIndex.html.includes(`value="${sortValue}"`), `档案列表缺少排序方式：${sortValue}。`);
	}
}

for (const page of detailPages) {
	const itemId = page.relativePath.split('/')[1];
	const likeIds = [...page.html.matchAll(/data-archive-like[^>]*data-item-id="([^"]+)"/g)].map((match) => match[1]);
	const basicInformation = page.html.match(/<section\s+class="record-basic-information"[\s\S]*?<\/section>/)?.[0] ?? '';
	check(!page.html.includes('class="record-status"'), `${page.relativePath} 仍显示已取消的资料状态横栏。`);
	check(basicInformation.includes('class="record-sidebar-meta"'), `${page.relativePath} 的基本信息栏缺少末尾辅助信息。`);
	if (page.html.includes('class="record-tags')) {
		check(basicInformation.includes('record-tags--sidebar'), `${page.relativePath} 的标签没有移入图片右侧信息栏。`);
	}
	check(basicInformation.includes('最后更新'), `${page.relativePath} 的更新时间没有移入图片右侧信息栏。`);
	check(likeIds.length === 1 && likeIds[0] === itemId, `${page.relativePath} 缺少对应档案的唯一点赞入口。`);
	check(pageLoadsScriptMarker(page, '/api/likes?items='), `${page.relativePath} 缺少点赞计数程序。`);
	check(page.html.includes('data-record-citation'), `${page.relativePath} 缺少引用与复制入口。`);
	check(page.html.includes('data-record-usage'), `${page.relativePath} 缺少权利与下载说明。`);
	const managementInformation = page.html.match(/<details\s+class="management-information"[\s\S]*?<\/details>/)?.[0] ?? '';
	if (managementInformation) {
		check(managementInformation.includes('更多信息'), `${page.relativePath} 的补充信息区标题不是“更多信息”。`);
		check(!managementInformation.includes('发布副本'), `${page.relativePath} 的补充信息区仍显示“发布副本”字段。`);
	}
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
	const locale=localeDefinitions.find(entry=>entry.prefix&&page.relativePath.startsWith(entry.prefix+'/'))?.locale??'zh-CN';
 const isEnglish=locale!=='zh-CN';
	check(page.html.includes(`<html lang="${locale}"`), `${page.relativePath} 页面语言设置不正确。`);
	if (isEnglish && process.env.PUBLIC_SITE_URL?.trim()) {
  const head = page.html.split('</head>')[0];
		const pendingArchive = /^(?:en|th|ja|ko|zh-hant)\/(?:archive\/LJM-|albums\/)/.test(page.relativePath) && /name="robots" content="noindex/.test(page.html);
		check(head.includes('hreflang="zh-CN"') && head.includes('hreflang="x-default"'), `${page.relativePath} 缺少对应中文页面标记。`);
		check(pendingArchive ? !head.includes(`hreflang="${locale}"`) : head.includes(`hreflang="${locale}"`), `${page.relativePath} 英文页面关联与译文审核状态不一致。`);
		if (pendingArchive) check(page.html.includes('class="translation-notice"'), `${page.relativePath} 缺少英文译文待复核提示。`);
	}
	check(page.html.includes('<meta name="viewport"'), `${page.relativePath} 缺少手机端视口设置。`);
	check(page.html.includes('data-contact-widget'), `${page.relativePath} 缺少联系挂件。`);
	check(page.html.includes('data-contact-launcher'), `${page.relativePath} 缺少联系挂件入口。`);
	const privacyCategoryPosition = page.html.indexOf('data-contact-category-button="privacy"');
	const collaborationCategoryPosition = page.html.indexOf('data-contact-category-button="collab"');
	check(privacyCategoryPosition !== -1 && privacyCategoryPosition < collaborationCategoryPosition, `${page.relativePath} 没有把隐私问题放在联系类型首位。`);
	check(page.html.includes('name="category" value="privacy" data-contact-category'), `${page.relativePath} 没有默认选择隐私问题。`);
	check(page.html.includes('data-contact-category-button="privacy" aria-pressed="true"'), `${page.relativePath} 的隐私问题按钮缺少默认选中状态。`);
	check(pageLoadsScriptMarker(page, '/api/contact/config'), `${page.relativePath} 缺少联系通道可用性检查。`);
	check(pageLoadsScriptMarker(page, '/api/contact/lookup'), `${page.relativePath} 缺少联系回执查询程序。`);
	check(!pageDirectlyLoadsScriptMarker(page, '/api/contact/config'), `${page.relativePath} 在访客打开联系挂件前就加载了完整联系程序。`);
	check(!page.html.includes('data-background-music'), `${page.relativePath} 仍包含已下线的背景音乐播放器。`);
	for (const publicPath of retiredBackgroundMusicPublicPaths) {
		check(!page.html.includes(publicPath), `${page.relativePath} 仍引用已下线的背景音乐：${publicPath}。`);
	}
	check(!pageLoadsScriptMarker(page, 'ljm-background-music-preference'), `${page.relativePath} 仍加载已下线的背景音乐程序。`);
	for (const imageTag of page.html.match(/<img\b[^>]*>/g) ?? []) {
		check(/\bwidth="\d+"/.test(imageTag) && /\bheight="\d+"/.test(imageTag), `${page.relativePath} 存在未声明尺寸的图片，可能引起页面跳动或异常拉长。`);
	}
	check(!/(?:localhost|127\.0\.0\.1)[^<"]*/i.test(
		(page.html.match(/<link rel="canonical"[^>]*>|<meta property="og:url"[^>]*>/g) ?? []).join(' '),
	), `${page.relativePath} 的公开规范地址包含本机网址。`);
}

for (const publicPath of retiredBackgroundMusicPublicPaths) {
	check(!(await exists(join(distRoot, publicPath.replace(/^\/+/, '')))), `公开构建仍携带已下线的音频副本：${publicPath}。`);
}

const publicText = htmlEntries.map((entry) => entry.html).join('\n');
for (const marker of ['LOCAL ARCHIVE DESK', '/api/bootstrap', 'data-admin-app', 'similar-record-button', 'STRUCTURED DATA ONLY', '/api/admin/contacts']) {
	check(!publicText.includes(marker), `公开构建混入管理端标记：${marker}。`);
}
for (const secretMarker of ['LJM_LIKE_HASH_SECRET', 'LJM_LIKE_DATA_FILE', 'X-LJM-Client-IP']) {
	check(!publicText.includes(secretMarker), `公开构建混入点赞服务私有配置：${secretMarker}。`);
}
check(!(await exists(join(distRoot, 'admin'))), '公开构建中不应存在 admin 目录。');

const contributionPage = htmlEntries.find((entry) => entry.relativePath === 'contribute/index.html');
check(Boolean(contributionPage), '缺少免注册投稿页面。');
if (contributionPage) {
	check(contributionPage.html.includes('id="submission-form"'), '投稿页缺少投稿表单。');
	check(contributionPage.html.includes('id="lookup-form"'), '投稿页缺少回执查询。');
	check(contributionPage.html.includes('action="/api/submissions"'), '投稿表单缺少明确的接收地址。');
	check(!/<form\b(?![^>]*method="post")/i.test(contributionPage.html), '投稿与查询表单必须使用 POST，避免联系方式或密钥进入网址。');
	check(pageLoadsScriptMarker(contributionPage, '/api/submissions/config'), '投稿页缺少通道可用性检查。');
	check(pageLoadsScriptMarker(contributionPage, '/api/submissions/lookup'), '投稿页缺少私密回执查询程序。');
}
const publicCode = publicText + scriptEntries.map((entry) => entry.contents).join('\n');
for (const marker of ['/api/admin/submissions', '/api/admin/contacts', '/api/admin/translations', 'reviewed_by', 'confirmed_fields', 'LJM_SUBMISSION_DATA_DIR', 'key_hash', 'source_submission_id', 'PRIVATE-NOTE-ONLY', 'synthetic@example.invalid', 'synthetic-contact@example.invalid']) {
	check(!publicCode.includes(marker), `公开构建混入私密投稿信息或管理程序：${marker}。`);
}
for (const privateName of ['submissions', '_contacts', 'drafts', 'history', 'recycle-bin', 'local-admin', 'accounts', 'translations']) {
	check(!distFiles.some((file) => relative(distRoot, file).split(sep).includes(privateName)), `公开构建混入私密目录：${privateName}。`);
}

// 账户页面（登录、用户中心）：必须禁止收录，且公开构建里不能出现任何账号私密信息。
const accountPages = htmlEntries.filter((entry) => entry.relativePath === 'login/index.html' || entry.relativePath.startsWith('me/'));
const englishAccountPages = htmlEntries.filter((entry) => entry.relativePath === 'en/login/index.html' || entry.relativePath.startsWith('en/me/'));
check(englishAccountPages.length === accountPages.length, '英语账户页面没有完整对应中文账户入口。');
check(accountPages.length >= 4, '账户页面没有完整构建出来：应有登录、我的投稿、我的收藏、账户设置四个页面。');
for (const page of [...accountPages, ...englishAccountPages]) {
	check(page.html.includes('name="robots"') && page.html.includes('noindex'), `${page.relativePath} 缺少禁止搜索引擎收录的设置。`);
	check(page.html.includes('data-ljm-account-page'), `${page.relativePath} 缺少账户页面标记，无法与公开内容区分。`);
}
for (const marker of ['ljm_account_session', 'LJM_ACCOUNT_DATA_DIR', 'LJM_ACCOUNT_IP_SALT', '/api/account-admin/']) {
	check(!publicCode.includes(marker), `公开构建混入账户私密信息：${marker}。`);
}

const configuredSiteUrl = process.env.PUBLIC_SITE_URL?.trim();
const sitemapExists = await exists(join(distRoot, 'sitemap.xml'));
if (configuredSiteUrl) {
	check(sitemapExists, '配置正式域名后没有生成 sitemap.xml。');
	if (sitemapExists) {
		const sitemap = await readFile(join(distRoot, 'sitemap.xml'), 'utf8');
		for (const privatePath of localeDefinitions.flatMap(entry=>['/login/','/me/'].map(p=>pathForLocale(p,entry.locale)))) {
			check(!sitemap.includes(privatePath), `站点地图不应收录账户页面：${privatePath}。`);
		}
		check(sitemap.includes('hreflang="zh-CN"') && sitemap.includes('hreflang="en"') && sitemap.includes('hreflang="x-default"'), '站点地图缺少双语对应地址。');
	}
	const robots = await readFile(join(distRoot, 'robots.txt'), 'utf8');
	check(/^Sitemap:\s+https?:\/\//im.test(robots), '配置正式域名后 robots.txt 缺少站点地图地址。');
} else {
	check(!sitemapExists, '未配置正式域名时不应生成可能错误的 sitemap.xml。');
}

// 相册入口必须指向本次实际生成的页面；仅“编号有值”不能证明链接可用。
const builtPagePaths = new Set(htmlEntries.map((page) => page.relativePath));
for (const page of htmlEntries) {
	for (const match of page.html.matchAll(/<a\b[^>]*href="(\/(?:(?:en|th|ja|ko|zh-hant)\/)?albums\/[^"?#]+)"/g)) {
		const target = decodeURIComponent(match[1]).replace(/^\//,'').replace(/\/$/,'') + '/index.html';
		check(builtPagePaths.has(target), `${page.relativePath} 的相册入口没有对应页面：${match[1]}。`);
	}
	if (!/^(?:(?:en|th|ja|ko|zh-hant)\/)?albums\//.test(page.relativePath)) continue;
	const photos = [...page.html.matchAll(/data-album-photo-id="([^"]+)"/g)].map((match) => match[1]);
	const letters = [...page.html.matchAll(/data-album-letter-id="([^"]+)"/g)].map((match) => match[1]);
	const declaredCount = Number(page.html.match(/data-album-photo-count="(\d+)"/)?.[1]);
	const declaredLetterCount = Number(page.html.match(/data-album-letter-count="(\d+)"/)?.[1]);
	check(photos.length === declaredCount, `${page.relativePath} 的照片数量与目录不一致。`);
	check(letters.length === declaredLetterCount, `${page.relativePath} 的信件数量与目录不一致。`);
	check(new Set(photos).size === photos.length, `${page.relativePath} 重复列出同一张照片。`);
	check(new Set(letters).size === letters.length, `${page.relativePath} 重复列出同一封信件。`);
	check(!(photos.length && letters.length), `${page.relativePath} 混合了照片与信件选览。`);
	check(page.html.includes('"@type":"CollectionPage"'), `${page.relativePath} 缺少相册结构化信息。`);
	const localePrefix = /^(en|th|ja|ko|zh-hant)\//.exec(page.relativePath)?.[0] ?? '';
	for (const id of [...photos, ...letters]) check(builtPagePaths.has(`${localePrefix}archive/${id}/index.html`), `${page.relativePath} 列出不存在的档案：${id}。`);
	if (localePrefix) {
		const chinesePage = htmlEntries.find((entry) => entry.relativePath === page.relativePath.slice(localePrefix.length));
		const chinesePhotos = [...(chinesePage?.html ?? '').matchAll(/data-album-photo-id="([^"]+)"/g)].map((match) => match[1]);
		check(JSON.stringify(photos) === JSON.stringify(chinesePhotos), `${page.relativePath} 的照片数量或顺序与中文版不一致。`);
		const chineseLetters = [...(chinesePage?.html ?? '').matchAll(/data-album-letter-id="([^"]+)"/g)].map((match) => match[1]);
		check(JSON.stringify(letters) === JSON.stringify(chineseLetters), `${page.relativePath} 的信件数量或顺序与中文版不一致。`);
	}
}

if (issues.length) {
	process.stderr.write(`公开页面回归检查失败（${issues.length} 项）：\n${issues.map((issue) => `- ${issue}`).join('\n')}\n`);
	process.exit(1);
}

process.stdout.write(`公开页面回归检查通过：${htmlEntries.length} 个页面、${detailPages.length} 个档案详情，首页精选与去重、分类顺序、空区块、图片尺寸和管理端隔离均正常。\n`);
