import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { createHash, randomUUID } from 'node:crypto';
import { createAccessAuthenticator } from './access-auth.mjs';
import { createReleaseDeployer, readLiveRelease } from './release-deployer.mjs';

const adminDirectory = path.dirname(fileURLToPath(import.meta.url));
const runtimeMode = (process.env.LJM_ADMIN_MODE ?? 'local').trim().toLowerCase();
const onlineMode = runtimeMode === 'online';
const readEnvironmentPath = (name, fallback) => {
	const value = process.env[name]?.trim();
	return path.resolve(value || fallback);
};
const stripTrailingSlash = (value) => value.replace(/\/+$/, '');
const configuredPort = Number.parseInt(process.env.LJM_ADMIN_PORT ?? (onlineMode ? '4174' : '4173'), 10);
const adminHost = process.env.LJM_ADMIN_HOST?.trim() || '127.0.0.1';
const adminPort = configuredPort;
const localAdminOrigin = `http://127.0.0.1:${adminPort}`;
const configuredAdminOrigin = stripTrailingSlash(process.env.LJM_ADMIN_ORIGIN?.trim() || localAdminOrigin);
const publicSiteUrl = stripTrailingSlash(process.env.PUBLIC_SITE_URL?.trim() || '');
const accessTeamDomain = stripTrailingSlash(process.env.LJM_CF_ACCESS_TEAM_DOMAIN?.trim() || '');
const accessAudience = process.env.LJM_CF_ACCESS_AUD?.trim() || '';
const npmCommand = process.env.LJM_NPM_COMMAND?.trim() || (onlineMode ? '/snap/node/current/bin/npm' : 'npm');
const configuredPublicReleasesDirectory = process.env.LJM_PUBLIC_RELEASES_DIR?.trim();
const allowedAdminEmails = new Set((process.env.LJM_ADMIN_ALLOWED_EMAILS ?? '')
	.split(',')
	.map((value) => value.trim().toLowerCase())
	.filter(Boolean));
const configuredDataRoot = process.env.LJM_ADMIN_DATA_ROOT?.trim();
const projectRoot = readEnvironmentPath('LJM_PROJECT_ROOT', path.resolve(adminDirectory, '..'));
const publicDirectory = path.join(adminDirectory, 'public');
const adminDataRoot = configuredDataRoot ? path.resolve(configuredDataRoot) : adminDirectory;
const archiveDataDirectory = readEnvironmentPath(
	'LJM_ARCHIVE_DATA_DIR',
	onlineMode ? path.join(adminDataRoot, 'archive-data') : path.join(projectRoot, 'archive-data'),
);
const draftDirectory = readEnvironmentPath('LJM_DRAFT_DIR', path.join(adminDataRoot, 'drafts'));
const historyDirectory = readEnvironmentPath('LJM_HISTORY_DIR', path.join(adminDataRoot, 'history'));
const recycleDirectory = readEnvironmentPath('LJM_RECYCLE_DIR', path.join(adminDataRoot, 'recycle-bin'));
const inboxDirectory = readEnvironmentPath(
	'LJM_INBOX_DIR',
	onlineMode ? path.join(adminDataRoot, 'inbox') : path.join(projectRoot, 'public-assets', 'inbox'),
);
const siteDirectory = readEnvironmentPath('LJM_SITE_DIR', path.join(projectRoot, 'site'));
const standardsDirectory = path.join(siteDirectory, 'src', 'data', 'standards');
const siteArchiveDirectory = path.join(siteDirectory, 'public', 'archive');
const siteResponsiveArchiveDirectory = path.join(siteDirectory, 'public', 'archive-responsive');
const siteArchiveDataFile = path.join(siteDirectory, 'src', 'data', 'archive.ts');
const responsiveImageManifestFile = path.join(siteDirectory, 'src', 'data', 'generated', 'image-manifest.json');
const archiveCategoryFile = path.join(siteDirectory, 'src', 'data', 'archive-categories.json');
const siteDistDirectory = path.join(siteDirectory, 'dist');
const publicReleasesDirectory = configuredPublicReleasesDirectory
	? path.resolve(configuredPublicReleasesDirectory)
	: path.join(projectRoot, 'site-releases');
const publicLiveLink = readEnvironmentPath('LJM_PUBLIC_LIVE_LINK', path.join(publicReleasesDirectory, 'live'));
const execFileAsync = promisify(execFile);
const maximumRequestBytes = (onlineMode ? 90 : 160) * 1024 * 1024;
const maximumImageBytes = 30 * 1024 * 1024;
const allowedImageTypes = new Map([
	['image/jpeg', '.jpg'],
	['image/png', '.png'],
	['image/webp', '.webp'],
]);
const allowedOriginalExtensions = new Map([
	['image/jpeg', new Set(['.jpg', '.jpeg'])],
	['image/png', new Set(['.png'])],
	['image/webp', new Set(['.webp'])],
]);
const objectSchema = {
	PHO: 'photo',
	NEG: 'photo',
	SLD: 'photo',
	ALB: 'photo',
	PCD: 'postcard',
	PST: 'postcard',
	DIA: 'diary_notebook',
	NTB: 'diary_notebook',
	IDC: 'credential',
	LET: 'common',
	RPR: 'common',
	OTH: 'common',
};
const itemIdPattern = /^LJM-\d{8}-[A-Z]{3}-\d{3}$/;
const safeEntryIdPattern = /^\d{8}-\d{6}-\d{3}-[a-f0-9]{8}$/;
let publishInProgress = false;

class RequestError extends Error {
	constructor(message, statusCode = 400) {
		super(message);
		this.name = 'RequestError';
		this.statusCode = statusCode;
	}
}

const validateHttpsOrigin = (value, label) => {
	let parsed;
	try {
		parsed = new URL(value);
	} catch {
		throw new Error(`${label}格式无效。`);
	}
	if (parsed.protocol !== 'https:' || parsed.username || parsed.password ||
		parsed.pathname !== '/' || parsed.search || parsed.hash) {
		throw new Error(`${label}必须是只有域名的 HTTPS 地址。`);
	}
	return parsed;
};

const pathIsInside = (parent, candidate) => {
	const relative = path.relative(path.resolve(parent), path.resolve(candidate));
	return relative === '' || (!relative.startsWith('..') && !path.isAbsolute(relative));
};

const validateRuntimeConfiguration = () => {
	if (!['local', 'online'].includes(runtimeMode)) {
		throw new Error('LJM_ADMIN_MODE 只能填写 local 或 online。');
	}
	if (!Number.isInteger(adminPort) || adminPort < 1024 || adminPort > 65535) {
		throw new Error('LJM_ADMIN_PORT 必须是 1024 至 65535 之间的端口号。');
	}
	if (!onlineMode) return;
	if (adminHost !== '127.0.0.1') {
		throw new Error('线上管理服务必须只监听 127.0.0.1，不能直接暴露服务器端口。');
	}
	const adminUrl = validateHttpsOrigin(configuredAdminOrigin, 'LJM_ADMIN_ORIGIN');
	const publicUrl = validateHttpsOrigin(publicSiteUrl, 'PUBLIC_SITE_URL');
	const teamUrl = validateHttpsOrigin(accessTeamDomain, 'LJM_CF_ACCESS_TEAM_DOMAIN');
	if (adminUrl.origin === publicUrl.origin) {
		throw new Error('管理域名和公开网站域名必须分开。');
	}
	if (!teamUrl.hostname.endsWith('.cloudflareaccess.com')) {
		throw new Error('LJM_CF_ACCESS_TEAM_DOMAIN 必须使用 Cloudflare Access 团队域名。');
	}
	if (!accessAudience) throw new Error('缺少 LJM_CF_ACCESS_AUD。');
	if (!configuredDataRoot || !path.isAbsolute(configuredDataRoot)) {
		throw new Error('LJM_ADMIN_DATA_ROOT 必须填写服务器上的绝对路径。');
	}
	if (!configuredPublicReleasesDirectory || !path.isAbsolute(configuredPublicReleasesDirectory)) {
		throw new Error('LJM_PUBLIC_RELEASES_DIR 必须填写服务器上的绝对路径。');
	}
	if (path.dirname(publicLiveLink) !== publicReleasesDirectory || path.basename(publicLiveLink) !== 'live') {
		throw new Error('LJM_PUBLIC_LIVE_LINK 必须是公开版本目录内名为 live 的软链接。');
	}
	for (const [label, privateDirectory] of [
		['正式档案数据目录', archiveDataDirectory],
		['草稿目录', draftDirectory],
		['历史版本目录', historyDirectory],
		['图片回收目录', recycleDirectory],
		['待入站图片目录', inboxDirectory],
	]) {
		if (pathIsInside(siteDirectory, privateDirectory) || pathIsInside(publicDirectory, privateDirectory)) {
			throw new Error(`${label}不能放在网站或管理页面的公开文件目录中。`);
		}
	}
	if (pathIsInside(adminDataRoot, publicReleasesDirectory) || pathIsInside(publicReleasesDirectory, adminDataRoot)) {
		throw new Error('公开网站版本目录必须与私有管理数据目录完全分开。');
	}
	if (allowedAdminEmails.size === 0) throw new Error('至少要配置一个允许登录的管理员邮箱。');
	for (const email of allowedAdminEmails) {
		if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
			throw new Error('LJM_ADMIN_ALLOWED_EMAILS 中存在格式无效的邮箱。');
		}
	}
};

validateRuntimeConfiguration();

const accessAuthenticator = onlineMode
	? createAccessAuthenticator({
		teamDomain: accessTeamDomain,
		audience: accessAudience,
		allowedEmails: allowedAdminEmails,
	})
	: null;

const releaseDeployer = onlineMode
	? createReleaseDeployer({
		sourceDirectory: siteDistDirectory,
		releasesDirectory: publicReleasesDirectory,
		liveLink: publicLiveLink,
	})
	: null;

const securityHeaders = () => ({
	'X-Content-Type-Options': 'nosniff',
	'X-Frame-Options': 'DENY',
	'Referrer-Policy': 'no-referrer',
	'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
	...(onlineMode ? {
		'Content-Security-Policy': "default-src 'self'; img-src 'self' blob: data:; style-src 'self'; script-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'; form-action 'self'",
		'Cross-Origin-Opener-Policy': 'same-origin',
		'Cross-Origin-Resource-Policy': 'same-origin',
		'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
		'X-Robots-Tag': 'noindex, nofollow, noarchive',
	} : {}),
});

class PublicationValidationError extends Error {
	constructor(issues) {
		super(issues[0]?.message ?? '发布检查没有通过。');
		this.name = 'PublicationValidationError';
		this.issues = issues;
	}
}

const mimeTypes = new Map([
	['.css', 'text/css; charset=utf-8'],
	['.html', 'text/html; charset=utf-8'],
	['.js', 'text/javascript; charset=utf-8'],
	['.json', 'application/json; charset=utf-8'],
	['.jpg', 'image/jpeg'],
	['.jpeg', 'image/jpeg'],
	['.png', 'image/png'],
	['.svg', 'image/svg+xml; charset=utf-8'],
	['.webp', 'image/webp'],
]);

const sendJson = (response, status, value) => {
	response.writeHead(status, {
		'Content-Type': 'application/json; charset=utf-8',
		'Cache-Control': 'no-store',
		...securityHeaders(),
	});
	response.end(JSON.stringify(value));
};

const safeMessage = (error) =>
	error instanceof Error && error.message ? error.message : '发生了未知错误。';

const safeEntryId = (value) => {
	if (!safeEntryIdPattern.test(value ?? '')) throw new Error('历史或回收记录编号无效。');
	return value;
};

const requireSafeMutation = (request) => {
	const expectedOrigins = onlineMode
		? new Set([configuredAdminOrigin])
		: new Set([localAdminOrigin, `http://localhost:${adminPort}`]);
	const origin = request.headers.origin;
	if ((onlineMode && !origin) || (origin && !expectedOrigins.has(stripTrailingSlash(origin)))) {
		throw new RequestError('已阻止来自其他网页的操作。', 403);
	}
	if (request.headers['x-ljm-admin-request'] !== '1') {
		throw new RequestError('管理操作标记无效。', 403);
	}
	if (!(request.headers['content-type'] ?? '').startsWith('application/json')) {
		throw new RequestError('提交格式无效。', 415);
	}
};

const readRequestJson = async (request) => {
	const declaredLength = Number.parseInt(request.headers['content-length'] ?? '0', 10);
	if (Number.isFinite(declaredLength) && declaredLength > maximumRequestBytes) {
		throw new RequestError('本次图片总量过大，请先保存已选图片，再分次继续上传。', 413);
	}
	let total = 0;
	const chunks = [];
	for await (const chunk of request) {
		total += chunk.length;
		if (total > maximumRequestBytes) {
			throw new RequestError('本次图片总量过大，请先保存已选图片，再分次继续上传。', 413);
		}
		chunks.push(chunk);
	}
	try {
		return JSON.parse(Buffer.concat(chunks).toString('utf8'));
	} catch {
		throw new Error('提交内容无法读取。');
	}
};

const sendFile = async (response, rootDirectory, requestPath, options = {}) => {
	const decodedPath = decodeURIComponent(requestPath.split('?')[0]);
	const relativePath = decodedPath === '/' ? 'index.html' : decodedPath.replace(/^\/+/, '');
	let filePath = path.resolve(rootDirectory, relativePath);
	if (!filePath.startsWith(`${path.resolve(rootDirectory)}${path.sep}`)) {
		response.writeHead(403, securityHeaders()).end('Forbidden');
		return;
	}

	try {
		const stat = await fs.stat(filePath);
		if (stat.isDirectory()) filePath = path.join(filePath, 'index.html');
		let content = await fs.readFile(filePath);
		if (options.transformHtml && path.extname(filePath).toLowerCase() === '.html') {
			content = Buffer.from(options.transformHtml(content.toString('utf8')), 'utf8');
		}
		response.writeHead(200, {
			'Content-Type': mimeTypes.get(path.extname(filePath).toLowerCase()) ?? 'application/octet-stream',
			'Cache-Control': 'no-store',
			...securityHeaders(),
		});
		response.end(content);
	} catch (error) {
		if (error?.code === 'ENOENT') {
			if (options.notFoundFile && await pathExists(options.notFoundFile)) {
				let content = await fs.readFile(options.notFoundFile);
				if (options.transformHtml) content = Buffer.from(options.transformHtml(content.toString('utf8')), 'utf8');
				response.writeHead(404, {
					'Content-Type': 'text/html; charset=utf-8',
					'Cache-Control': 'no-store',
					...securityHeaders(),
				});
				response.end(content);
				return;
			}
			response.writeHead(404, securityHeaders()).end('Not found');
			return;
		}
		throw error;
	}
};

const injectLocalPreviewToolbar = (html) => {
	if (html.includes('data-ljm-local-preview-toolbar')) return html;
	const toolbar = `<div data-ljm-local-preview-toolbar role="navigation" aria-label="本地网站预览工具条">
		<button type="button" data-ljm-local-preview-toggle aria-expanded="true" aria-controls="ljm-local-preview-content">
			<svg data-ljm-local-preview-icon viewBox="0 0 24 24" aria-hidden="true" focusable="false"><rect x="4" y="5" width="16" height="12" rx="1"></rect><path d="M8 20h8M12 17v3M8 9h8M8 13h5"></path></svg>
			<span data-ljm-local-preview-toggle-label>收起</span>
		</button>
		<div id="ljm-local-preview-content" data-ljm-local-preview-content>
			<span><strong>本地网站预览</strong><small>这里显示的是最近一次成功构建的公开内容</small></span>
			<a href="/admin/">返回档案管理</a>
		</div>
	</div>
	<style data-ljm-local-preview-style>
		html[data-ljm-local-preview-state="expanded"] body{padding-bottom:max(88px,env(safe-area-inset-bottom))!important}
		html[data-ljm-local-preview-state="collapsed"] body{padding-bottom:max(58px,env(safe-area-inset-bottom))!important}
		[data-ljm-local-preview-toolbar]{position:fixed;right:18px;bottom:max(18px,env(safe-area-inset-bottom));z-index:2147483647;display:flex;align-items:stretch;max-width:calc(100vw - 36px);overflow:hidden;color:#f7f0e4;background:#2f342e;border:1px solid #62695f;border-radius:4px;box-shadow:0 12px 34px rgba(18,20,17,.28);font-family:system-ui,-apple-system,"Microsoft YaHei",sans-serif;line-height:1.35}
		[data-ljm-local-preview-content]{display:flex;align-items:center;gap:14px;padding:10px 12px 10px 14px}
		[data-ljm-local-preview-content]>span{display:grid;gap:2px}
		[data-ljm-local-preview-toolbar] strong{font-size:13px;font-weight:650}
		[data-ljm-local-preview-toolbar] small{color:#c6c5bb;font-size:10px;white-space:nowrap}
		[data-ljm-local-preview-toolbar] a{flex:0 0 auto;padding:7px 10px;color:#2f342e!important;background:#f0e7d8;border-radius:3px;text-decoration:none!important;font-size:12px;font-weight:650}
		[data-ljm-local-preview-toggle]{flex:0 0 auto;padding:0 9px;color:#d8d5cb;background:#252a25;border:0;border-right:1px solid #62695f;cursor:pointer;font:600 11px/1 system-ui,-apple-system,"Microsoft YaHei",sans-serif;writing-mode:vertical-rl;letter-spacing:.08em}
		[data-ljm-local-preview-icon]{display:none;width:19px;height:19px;fill:none;stroke:currentColor;stroke-width:1.6;stroke-linecap:round;stroke-linejoin:round}
		[data-ljm-local-preview-toggle]:focus-visible,[data-ljm-local-preview-toolbar] a:focus-visible{outline:2px solid #fff;outline-offset:-3px}
		html[data-ljm-local-preview-state="collapsed"] [data-ljm-local-preview-content]{display:none}
		html[data-ljm-local-preview-state="collapsed"] [data-ljm-local-preview-toggle]{min-height:38px;padding:7px 11px;border-right:0;writing-mode:horizontal-tb}
		@media(max-width:540px){html[data-ljm-local-preview-state="expanded"] body{padding-bottom:max(104px,env(safe-area-inset-bottom))!important}html[data-ljm-local-preview-state="collapsed"] body{padding-bottom:0!important}[data-ljm-local-preview-toolbar]{right:10px;bottom:max(10px,env(safe-area-inset-bottom));max-width:calc(100vw - 20px)}[data-ljm-local-preview-content]{gap:10px;padding:9px 10px}[data-ljm-local-preview-toolbar] small{max-width:150px;white-space:normal}[data-ljm-local-preview-toolbar] a{padding:8px 9px}html[data-ljm-local-preview-state="collapsed"] [data-ljm-local-preview-toolbar]{border-radius:999px;box-shadow:0 7px 22px rgba(18,20,17,.24)}html[data-ljm-local-preview-state="collapsed"] [data-ljm-local-preview-toggle]{display:grid;width:42px;height:42px;min-height:42px;padding:0;place-items:center;border-radius:999px}html[data-ljm-local-preview-state="collapsed"] [data-ljm-local-preview-icon]{display:block}html[data-ljm-local-preview-state="collapsed"] [data-ljm-local-preview-toggle-label]{position:absolute;width:1px;height:1px;padding:0;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}}
	</style>
	<script data-ljm-local-preview-script>
		(() => {
			const toolbar = document.querySelector('[data-ljm-local-preview-toolbar]');
			const toggle = toolbar?.querySelector('[data-ljm-local-preview-toggle]');
			const label = toolbar?.querySelector('[data-ljm-local-preview-toggle-label]');
			if (!toolbar || !toggle || !label) return;
			const storageKey = 'ljm-local-preview-toolbar-collapsed';
			const mobileQuery = window.matchMedia('(max-width: 540px)');
			let storedState = null;
			try { storedState = window.localStorage.getItem(storageKey); } catch {}
			let collapsed = mobileQuery.matches ? true : storedState === 'true';
			const render = () => {
				document.documentElement.dataset.ljmLocalPreviewState = collapsed ? 'collapsed' : 'expanded';
				toggle.setAttribute('aria-expanded', String(!collapsed));
				label.textContent = collapsed ? '预览工具' : '收起';
				toggle.setAttribute('aria-label', collapsed ? '展开本地网站预览工具条' : '收起本地网站预览工具条');
			};
			toggle.addEventListener('click', () => {
				collapsed = !collapsed;
				try { window.localStorage.setItem(storageKey, String(collapsed)); } catch {}
				render();
			});
			if (typeof mobileQuery.addEventListener === 'function') {
				mobileQuery.addEventListener('change', (event) => {
					if (!event.matches) return;
					collapsed = true;
					render();
				});
			}
			render();
		})();
	</script>`;
	return /<\/body>/i.test(html) ? html.replace(/<\/body>/i, `${toolbar}</body>`) : `${html}${toolbar}`;
};

const readJson = async (filePath) => JSON.parse(await fs.readFile(filePath, 'utf8'));

const pathExists = async (filePath) => {
	try {
		await fs.access(filePath);
		return true;
	} catch {
		return false;
	}
};

const today = () => new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Shanghai' });

const createEntryId = () => {
	const parts = new Intl.DateTimeFormat('zh-CN', {
		timeZone: 'Asia/Shanghai', year: 'numeric', month: '2-digit', day: '2-digit',
		hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
	}).formatToParts(new Date()).reduce((result, part) => ({ ...result, [part.type]: part.value }), {});
	const milliseconds = String(new Date().getMilliseconds()).padStart(3, '0');
	return `${parts.year}${parts.month}${parts.day}-${parts.hour}${parts.minute}${parts.second}-${milliseconds}-${randomUUID().slice(0, 8)}`;
};

const fileSha256 = async (filePath) =>
	createHash('sha256').update(await fs.readFile(filePath)).digest('hex');

const loadOfficialRecords = async () => {
	const archiveFiles = (await fs.readdir(archiveDataDirectory, { withFileTypes: true }))
		.filter((entry) => entry.isFile() && /^LJM-.*\.json$/i.test(entry.name))
		.map((entry) => entry.name);
	return Promise.all(archiveFiles.map((name) => readJson(path.join(archiveDataDirectory, name))));
};

const walkFiles = async (rootDirectory) => {
	if (!(await pathExists(rootDirectory))) return [];
	const files = [];
	for (const entry of await fs.readdir(rootDirectory, { withFileTypes: true })) {
		const entryPath = path.join(rootDirectory, entry.name);
		if (entry.isDirectory()) files.push(...await walkFiles(entryPath));
		else if (entry.isFile()) files.push(entryPath);
	}
	return files;
};

const preflightImageFiles = async (payload) => {
	const files = Array.isArray(payload?.files) ? payload.files : [];
	if (!files.length || files.length > 50) throw new Error('请一次选择 1 至 50 张图片进行预检。');
	const knownByHash = new Map();
	for (const filePath of await walkFiles(inboxDirectory)) {
		if (!['.jpg', '.jpeg', '.png', '.webp'].includes(path.extname(filePath).toLowerCase())) continue;
		const hash = await fileSha256(filePath);
		if (!knownByHash.has(hash)) knownByHash.set(hash, []);
		knownByHash.get(hash).push(path.relative(inboxDirectory, filePath).replaceAll('\\', '/'));
	}
	const batchHashes = new Set();
	return {
		files: files.map((file) => {
			const clientId = typeof file?.client_id === 'string' ? file.client_id : '';
			const name = typeof file?.name === 'string' ? path.basename(file.name) : '';
			const type = typeof file?.type === 'string' ? file.type : '';
			const size = Number(file?.size);
			const sha256 = typeof file?.sha256 === 'string' ? file.sha256.toLowerCase() : '';
			const messages = [];
			let accepted = true;
			if (!name || name !== file.name || name.length > 180) {
				accepted = false;
				messages.push('文件名无效。');
			}
			if (!allowedImageTypes.has(type)) {
				accepted = false;
				messages.push('格式不是 JPG、PNG 或 WebP。');
			}
			if (!Number.isInteger(size) || size <= 0 || size > maximumImageBytes) {
				accepted = false;
				messages.push('文件为空或超过 30 MB。');
			}
			if (/(master|original|raw|主档|原始)/i.test(name)) {
				accepted = false;
				messages.push('文件名疑似主档或原始文件。');
			}
			if (allowedOriginalExtensions.has(type) && !allowedOriginalExtensions.get(type).has(path.extname(name).toLowerCase())) {
				accepted = false;
				messages.push('扩展名与图片格式不一致。');
			}
			if (!/^[a-f0-9]{64}$/.test(sha256)) {
				accepted = false;
				messages.push('无法完成重复文件校验。');
			}
			const knownMatches = knownByHash.get(sha256) ?? [];
			if (knownMatches.length) {
				accepted = false;
				messages.push(`内容与待入站区已有文件相同：${knownMatches.slice(0, 2).join('、')}`);
			}
			if (batchHashes.has(sha256)) {
				accepted = false;
				messages.push('本次选择中已有内容相同的图片。');
			}
			batchHashes.add(sha256);
			if (accepted) messages.push('格式、大小、名称和重复文件检查通过。');
			return { client_id: clientId, name, sha256, accepted, messages };
		}),
	};
};

const createIntegrityReport = async (officialRecords) => {
	const issues = [];
	let checkCount = 0;
	let publicationImageCount = 0;
	let responsiveVariantCount = 0;
	const check = (passed, issue) => {
		checkCount += 1;
		if (!passed) issues.push({ severity: 'error', ...issue });
		return passed;
	};
	const globalIssue = (code, message) => ({ code, item_id: '', area: '公开构建', message });
	const recordIssue = (record, code, area, message) => ({
		code,
		item_id: record?.core?.item_id ?? '',
		title: record?.core?.title ?? '未命名藏品',
		area,
		message,
	});

	let imageManifest = {};
	try {
		imageManifest = await readJson(responsiveImageManifestFile);
		check(true, globalIssue('responsive_manifest', '响应式图片清单可以读取。'));
	} catch {
		check(false, globalIssue('responsive_manifest_missing', '响应式图片清单缺失或无法读取，请重新执行正式构建。'));
	}

	const recordIds = new Set();
	for (const record of officialRecords) {
		const itemId = record?.core?.item_id ?? '';
		check(itemIdPattern.test(itemId), recordIssue(record, 'invalid_item_id', '档案数据', '永久编号格式不正确。'));
		check(!recordIds.has(itemId), recordIssue(record, 'duplicate_item_id', '档案数据', '永久编号与另一条正式档案重复。'));
		recordIds.add(itemId);
		check(record?.metadata?.schema === objectSchema[record?.core?.object_type],
			recordIssue(record, 'schema_mismatch', '档案数据', '资料类型与对象专属结构不一致。'));

		const archiveFile = path.join(archiveDataDirectory, `${itemId}.json`);
		check(await pathExists(archiveFile), recordIssue(record, 'archive_filename_mismatch', '档案数据', '正式 JSON 文件名与永久编号不一致。'));
		const detailPage = path.join(siteDistDirectory, 'archive', itemId, 'index.html');
		const isPublished = record?.core?.record_status === 'ACT' && record?.core?.use_status === 'U3';
		if (!isPublished) {
			check(!(await pathExists(detailPage)), recordIssue(record, 'inactive_page_exposed', '公开构建', '非公开或已撤销档案仍存在公开详情页。'));
			continue;
		}

		check(record?.core?.privacy_level === 'G', recordIssue(record, 'published_privacy_not_green', '隐私状态', '已发布档案的隐私等级不是可公开 G。'));
		check(await pathExists(detailPage), recordIssue(record, 'published_page_missing', '公开构建', '已发布档案缺少公开详情页。'));
		const publicationPaths = Array.isArray(record?.core?.publication_file_path) ? record.core.publication_file_path : [];
		check(publicationPaths.length > 0, recordIssue(record, 'publication_images_empty', '发布图片', '已发布档案没有发布图片。'));
		for (const publicPath of publicationPaths) {
			publicationImageCount += 1;
			const expectedPrefix = `/archive/${itemId}/`;
			if (!check(publicPath.startsWith(expectedPrefix), recordIssue(record, 'publication_path_mismatch', '发布图片', `图片路径没有使用本档案永久编号：${publicPath}`))) continue;
			const filename = path.basename(publicPath);
			const inboxFile = path.join(inboxDirectory, itemId, filename);
			const siteFile = path.join(siteArchiveDirectory, itemId, filename);
			const distFile = path.join(siteDistDirectory, 'archive', itemId, filename);
			const inboxExists = await pathExists(inboxFile);
			const siteExists = await pathExists(siteFile);
			const distExists = await pathExists(distFile);
			check(inboxExists, recordIssue(record, 'inbox_image_missing', '发布图片', `待入站区缺少 ${filename}。`));
			check(siteExists, recordIssue(record, 'site_image_missing', '发布图片', `网站发布目录缺少 ${filename}。`));
			check(distExists, recordIssue(record, 'dist_image_missing', '公开构建', `构建结果缺少 ${filename}。`));
			if (inboxExists && siteExists && distExists) {
				const [inboxHash, siteHash, distHash] = await Promise.all([
					fileSha256(inboxFile), fileSha256(siteFile), fileSha256(distFile),
				]);
				check(inboxHash === siteHash && siteHash === distHash,
					recordIssue(record, 'publication_image_hash_mismatch', '发布图片', `${filename} 在待入站区、网站目录与构建结果中内容不一致。`));
			}

			const manifestEntry = imageManifest[publicPath];
			if (!check(Boolean(manifestEntry), recordIssue(record, 'responsive_manifest_entry_missing', '响应式图片', `${filename} 没有响应式图片记录。`))) continue;
			const variants = Array.isArray(manifestEntry.variants) ? manifestEntry.variants : [];
			check(variants.length > 0, recordIssue(record, 'responsive_variants_empty', '响应式图片', `${filename} 没有可用的网页尺寸副本。`));
			for (const variant of variants) {
				responsiveVariantCount += 1;
				const relativeVariantPath = String(variant.src ?? '').replace(/^\/+archive-responsive\//, '');
				const responsiveFile = path.join(siteResponsiveArchiveDirectory, relativeVariantPath);
				const distResponsiveFile = path.join(siteDistDirectory, 'archive-responsive', relativeVariantPath);
				check(Boolean(relativeVariantPath) && await pathExists(responsiveFile),
					recordIssue(record, 'responsive_source_missing', '响应式图片', `缺少网页图片副本 ${path.basename(relativeVariantPath || '未知文件')}。`));
				check(Boolean(relativeVariantPath) && await pathExists(distResponsiveFile),
					recordIssue(record, 'responsive_dist_missing', '公开构建', `构建结果缺少网页图片副本 ${path.basename(relativeVariantPath || '未知文件')}。`));
			}
		}
	}

	for (const requiredPage of ['index.html', path.join('archive', 'index.html'), path.join('about', 'index.html')]) {
		check(await pathExists(path.join(siteDistDirectory, requiredPage)), globalIssue('required_page_missing', `公开构建缺少 ${requiredPage.replaceAll('\\', '/')}。`));
	}
	check(!(await pathExists(path.join(siteDistDirectory, 'admin'))), globalIssue('admin_directory_exposed', '公开构建中出现了本地管理目录。'));
	let exposedMarker = false;
	for (const filePath of (await walkFiles(siteDistDirectory))
		.filter((candidate) => ['.html', '.js'].includes(path.extname(candidate).toLowerCase()))) {
		if (/LOCAL ARCHIVE DESK|PRIVATE ARCHIVE DESK|\/api\/bootstrap|withdraw-record|X-LJM-Admin-Request|cf-access-jwt-assertion/.test(await fs.readFile(filePath, 'utf8'))) {
			exposedMarker = true;
			break;
		}
	}
	check(!exposedMarker, globalIssue('admin_code_exposed', '公开构建中出现了本地管理脚本或维护接口文字。'));

	return {
		checked_at: new Date().toISOString(),
		status: issues.length ? 'error' : 'pass',
		summary: {
			records: officialRecords.length,
			published_records: officialRecords.filter((record) => record?.core?.record_status === 'ACT' && record?.core?.use_status === 'U3').length,
			publication_images: publicationImageCount,
			responsive_variants: responsiveVariantCount,
			checks: checkCount,
			failures: issues.length,
		},
		issues,
	};
};

const loadDrafts = async () => {
	await fs.mkdir(draftDirectory, { recursive: true });
	const files = (await fs.readdir(draftDirectory, { withFileTypes: true }))
		.filter((entry) => entry.isFile() && itemIdPattern.test(entry.name.replace(/\.json$/i, '')))
		.map((entry) => entry.name);
	return Promise.all(files.map((name) => readJson(path.join(draftDirectory, name))));
};

const withdrawnRestoreEligibility = async (record) => {
	if (record?.core?.record_status !== 'WDR') return { allowed: false, reason: '' };
	const itemId = record.core.item_id;
	const paths = record.core.publication_file_path ?? [];
	for (const publicPath of paths) {
		const expectedPrefix = `/archive/${itemId}/`;
		if (!publicPath.startsWith(expectedPrefix)) {
			return { allowed: false, reason: '这条记录的图片已经并入其他主档，只能作为历史追溯记录查看。' };
		}
		const filename = path.basename(publicPath);
		if (!(await pathExists(path.join(inboxDirectory, itemId, filename)))) {
			return { allowed: false, reason: `本地待入站区缺少保留图片 ${filename}，已停止自动恢复。` };
		}
	}
	return { allowed: true, reason: '' };
};

const loadEntryManifests = async (rootDirectory, statusFilter) => {
	await fs.mkdir(rootDirectory, { recursive: true });
	const itemDirectories = (await fs.readdir(rootDirectory, { withFileTypes: true }))
		.filter((entry) => entry.isDirectory() && itemIdPattern.test(entry.name));
	const manifests = [];
	for (const itemDirectory of itemDirectories) {
		const itemPath = path.join(rootDirectory, itemDirectory.name);
		const entryDirectories = (await fs.readdir(itemPath, { withFileTypes: true }))
			.filter((entry) => entry.isDirectory() && safeEntryIdPattern.test(entry.name));
		for (const entryDirectory of entryDirectories) {
			const manifestPath = path.join(itemPath, entryDirectory.name, 'manifest.json');
			if (!(await pathExists(manifestPath))) continue;
			const manifest = await readJson(manifestPath);
			if (!statusFilter || statusFilter(manifest)) manifests.push(manifest);
		}
	}
	return manifests.sort((left, right) => (right.created_at ?? right.removed_at ?? '').localeCompare(
		left.created_at ?? left.removed_at ?? '',
	));
};

const loadHistoryEntries = () => loadEntryManifests(
	historyDirectory,
	(manifest) => manifest.status === 'complete',
);

const loadRecycleEntries = () => loadEntryManifests(
	recycleDirectory,
	(manifest) => !manifest.restored_at,
);

const hasMeaningfulValue = (value) =>
	value !== undefined &&
	value !== null &&
	value !== '' &&
	(!Array.isArray(value) || value.some((entry) => hasMeaningfulValue(entry)));

const sameFieldValue = (left, right) => JSON.stringify(left) === JSON.stringify(right);

const normalizeSharedCoreFields = (record, fieldRouting, commonFields) => {
	const sharedFields = new Set(fieldRouting?.core_canonical_fields ?? []);
	const definitions = new Map((commonFields?.fields ?? []).map((field) => [field.field_code, field]));
	const conflicts = [];
	for (const [dimensionCode, dimension] of Object.entries(record?.metadata?.dimensions ?? {})) {
		if (!dimension || typeof dimension !== 'object') continue;
		for (const fieldCode of sharedFields) {
			if (!(fieldCode in dimension)) continue;
			const metadataValue = dimension[fieldCode];
			if (!hasMeaningfulValue(metadataValue)) {
				delete dimension[fieldCode];
				continue;
			}
			const coreValue = record.core?.[fieldCode];
			const isMultiValue = (definitions.get(fieldCode)?.dictionary_or_multi_value_rule ?? '').includes('｜是');
			if (isMultiValue) {
				const merged = [...new Set([
					...(Array.isArray(coreValue) ? coreValue : hasMeaningfulValue(coreValue) ? [coreValue] : []),
					...(Array.isArray(metadataValue) ? metadataValue : [metadataValue]),
				].filter(hasMeaningfulValue))];
				record.core[fieldCode] = merged;
				delete dimension[fieldCode];
				continue;
			}
			if (!hasMeaningfulValue(coreValue)) {
				record.core[fieldCode] = structuredClone(metadataValue);
				delete dimension[fieldCode];
				continue;
			}
			if (sameFieldValue(coreValue, metadataValue)) {
				delete dimension[fieldCode];
				continue;
			}
			conflicts.push({ dimension_code: dimensionCode, field_code: fieldCode });
		}
		if (Object.keys(dimension).length === 0) delete record.metadata.dimensions[dimensionCode];
	}
	return conflicts;
};

const normalizeRuleField = (field) =>
	typeof field === 'string' ? { field_code: field, scope: 'metadata' } : field;

const getRuleFieldValue = (record, dimensionCode, field) => {
	const definition = normalizeRuleField(field);
	if (definition.scope === 'core') return record?.core?.[definition.field_code];
	const metadataValue = record?.metadata?.dimensions?.[dimensionCode]?.[definition.field_code];
	return hasMeaningfulValue(metadataValue) ? metadataValue : record?.core?.[definition.field_code];
};

const toCollectionCodeToken = (code) => {
	const value = String(code ?? '');
	const separatorIndex = value.indexOf('-');
	return separatorIndex >= 0 ? value.slice(separatorIndex + 1) : value;
};

const toCollectionTextToken = (value) => String(value ?? '').trim().toUpperCase()
	.replace(/[\s_+\\/|]+/g, '-')
	.replace(/[‐‑‒–—―]+/g, '-')
	.replace(/-+/g, '-')
	.replace(/^-|-$/g, '');

const getCollectionCodeResult = (record, collectionCodeRules, codeDictionary) => {
	const schemaRules = collectionCodeRules?.schemas?.[record?.metadata?.schema];
	const dictionary = new Map();
	for (const entry of codeDictionary?.entries ?? []) {
		if (!entry.enabled) continue;
		if (!dictionary.has(entry.dictionary_key)) dictionary.set(entry.dictionary_key, new Set());
		dictionary.get(entry.dictionary_key).add(entry.code);
	}
	const objectType = record?.core?.object_type;
	const allowedObjectTypes = dictionary.get('object_type') ?? new Set();
	const segments = allowedObjectTypes.has(objectType) ? [objectType] : [];
	const issues = [];
	for (const field of collectionCodeRules?.global_code_fields ?? []) {
		const value = record?.core?.[field.field_code];
		if (!hasMeaningfulValue(value)) {
			if (field.required) {
				issues.push({
					code: `collection_code_required_${field.field_code}`,
					tab: 'basic',
					field: field.field_code,
					message: `${field.name ?? field.field_code}是藏品编码组成字段，必须填写。`,
				});
			}
			continue;
		}
		const token = field.encoding === 'normalized_text'
			? toCollectionTextToken(value)
			: String(value).trim();
		if (!token) {
			issues.push({
				code: `collection_code_invalid_${field.field_code}`,
				tab: 'basic',
				field: field.field_code,
				message: `${field.name ?? field.field_code}无法生成有效的藏品编码片段。`,
			});
			continue;
		}
		segments.push(token);
	}
	for (const dimension of schemaRules?.required_dimensions ?? []) {
		const normalizedFields = (dimension.fields ?? []).map(normalizeRuleField);
		const dimensionValues = (dimension.fields ?? []).map((field) =>
			getRuleFieldValue(record, dimension.dimension_code, field));
		const hasDimensionValue = dimensionValues.some(hasMeaningfulValue);
		if (!hasDimensionValue) {
			const issueField = normalizedFields[0] ?? { field_code: '', scope: 'metadata' };
			const allCore = normalizedFields.length > 0 && normalizedFields.every((field) => field.scope === 'core');
			issues.push({
				code: `collection_required_${dimension.dimension_code}`,
				tab: allCore ? 'basic' : 'specific',
				field: issueField.field_code,
				message: `${dimension.dimension_code} · ${dimension.name}为必填维度，请至少填写一项。`,
			});
		}

		const dimensionCodes = [];
		for (const codeField of dimension.code_fields ?? []) {
			const value = getRuleFieldValue(record, dimension.dimension_code, codeField);
			const values = (Array.isArray(value) ? value : [value]).filter(hasMeaningfulValue);
			if (!values.length) {
				if (hasDimensionValue) {
					issues.push({
						code: `collection_code_required_${dimension.dimension_code}_${codeField.field_code}`,
						tab: codeField.scope === 'core' ? 'basic' : 'specific',
						field: codeField.field_code,
						message: `${dimension.dimension_code} · ${dimension.name}需要填写可编码的${codeField.field_code}。`,
					});
				}
				continue;
			}
			const allowedCodes = dictionary.get(codeField.dictionary_key) ?? new Set();
			for (const code of values) {
				if (!allowedCodes.has(code)) {
					issues.push({
						code: `collection_code_invalid_${dimension.dimension_code}_${codeField.field_code}_${code}`,
						tab: codeField.scope === 'core' ? 'basic' : 'specific',
						field: codeField.field_code,
						message: `${dimension.dimension_code} · ${dimension.name}中的 ${code} 未匹配正式代码字典。`,
					});
					continue;
				}
				const shortCode = toCollectionCodeToken(code);
				if (!dimensionCodes.includes(shortCode)) dimensionCodes.push(shortCode);
			}
		}
		if (dimensionCodes.length) segments.push(dimensionCodes.join('+'));
	}
	return {
		code: segments.join('_'),
		segments,
		issues,
		complete: issues.length === 0,
	};
};

const applyCollectionCode = (record, collectionCodeRules, codeDictionary) => {
	record.core.collection_code = getCollectionCodeResult(record, collectionCodeRules, codeDictionary).code;
	return record;
};

const loadCollectionCodeStandards = async () => Promise.all([
	readJson(path.join(standardsDirectory, 'collection-code-rules.json')),
	readJson(path.join(standardsDirectory, 'code-dictionary.json')),
]);

const loadFieldRoutingStandards = async () => Promise.all([
	readJson(path.join(standardsDirectory, 'admin-field-routing.json')),
	readJson(path.join(standardsDirectory, 'common-fields.json')),
]);

const getPublicationIssues = async (
	record,
	commonFields,
	confirmations = null,
	collectionCodeRules = null,
	codeDictionary = null,
) => {
	const issues = [];
	const add = (code, tab, message, field = null) => issues.push({ code, tab, message, field });
	try {
		assertSafeRecord(record);
	} catch (error) {
		add('unsafe_record', 'specific', safeMessage(error));
	}
	if (!itemIdPattern.test(record?.core?.item_id ?? '')) {
		add('item_id', 'basic', '永久编号尚未生成或格式不正确。', 'item_id');
	}
	for (const field of commonFields.fields.filter((candidate) => candidate.required)) {
		if (['record_status', 'item_id', 'privacy_level', 'created_date'].includes(field.field_code)) continue;
		const value = record?.core?.[field.field_code];
		if (value === undefined || value === null || value === '' || (Array.isArray(value) && value.length === 0)) {
			add(`required_${field.field_code}`, 'basic', `${field.name}尚未填写。`, field.field_code);
		}
	}
	if (collectionCodeRules && codeDictionary) {
		issues.push(...getCollectionCodeResult(record, collectionCodeRules, codeDictionary).issues);
	}
	const paths = record?.core?.publication_file_path ?? [];
	if (!paths.length) add('images_empty', 'images', '正式发布前至少需要一张发布图片。');
	for (const publicPath of paths) {
		const expectedPrefix = `/archive/${record.core.item_id}/`;
		if (!publicPath.startsWith(expectedPrefix)) {
			add('image_path', 'images', `图片路径与永久编号不一致：${publicPath}`);
			continue;
		}
		const filename = path.basename(publicPath);
		if (!(await pathExists(path.join(inboxDirectory, record.core.item_id, filename)))) {
			add('image_missing', 'images', `待入站目录缺少图片：${filename}`);
		}
	}
	if (!Array.isArray(confirmations) || confirmations.length !== 13 || confirmations.some((value) => value !== true)) {
		add('privacy_confirmation', 'privacy', '需要由你本人完成全部 13 项隐私与发布检查。');
	}
	return issues;
};

const loadBootstrap = async () => {
	const [officialRecords, drafts, commonFields, codeDictionary, collectionCodeRules, fieldRouting, archiveCategories, administrativeRegions, photo, postcard, diaryNotebook, credential, history, recycleBin] =
		await Promise.all([
			loadOfficialRecords(),
			loadDrafts(),
			readJson(path.join(standardsDirectory, 'common-fields.json')),
			readJson(path.join(standardsDirectory, 'code-dictionary.json')),
			readJson(path.join(standardsDirectory, 'collection-code-rules.json')),
			readJson(path.join(standardsDirectory, 'admin-field-routing.json')),
			readJson(archiveCategoryFile),
			readJson(path.join(standardsDirectory, 'administrative-regions.json')),
			readJson(path.join(standardsDirectory, 'photo-dimensions.json')),
			readJson(path.join(standardsDirectory, 'postcard-dimensions.json')),
			readJson(path.join(standardsDirectory, 'diary-notebook-dimensions.json')),
			readJson(path.join(standardsDirectory, 'credential-dimensions.json')),
			loadHistoryEntries(),
			loadRecycleEntries(),
		]);
	const officialById = new Map(officialRecords.map((record) => [record.core.item_id, record]));
	const draftById = new Map(drafts.map((draft) => [draft.record.core.item_id, draft]));
	const allIds = new Set([...officialById.keys(), ...draftById.keys()]);
	const records = await Promise.all([...allIds].map(async (itemId) => {
		const official = officialById.get(itemId);
		const draft = draftById.get(itemId);
		const restoreEligibility = await withdrawnRestoreEligibility(official);
		const withdrawalEntry = history.find((entry) =>
			entry.item_id === itemId && entry.snapshot_kind === 'published-before-withdrawal');
		const record = structuredClone(draft?.record ?? official);
		const routingConflicts = normalizeSharedCoreFields(record, fieldRouting, commonFields);
		applyCollectionCode(record, collectionCodeRules, codeDictionary);
		const routingIssues = routingConflicts.map((conflict) => ({
			code: `shared_field_conflict_${conflict.dimension_code}_${conflict.field_code}`,
			tab: 'basic',
			field: conflict.field_code,
			message: `${conflict.field_code} 的旧基本信息值与对象专属旧值不一致，已保留两份原值并停止自动覆盖。`,
		}));
		record._admin = {
			hasDraft: Boolean(draft),
			hasOfficial: Boolean(official),
			officialRecordStatus: official?.core.record_status ?? null,
			restoredFromWithdrawal: Boolean(draft?.restored_from_withdrawal),
			canRestoreWithdrawn: Boolean(official?.core.record_status === 'WDR' && !draft && restoreEligibility.allowed),
			restoreWithdrawnReason: restoreEligibility.reason,
			withdrawalReason: withdrawalEntry?.withdrawal_reason ?? null,
			officialPublished:
				official?.core.record_status === 'ACT' &&
				official?.core.privacy_level === 'G' &&
				official?.core.use_status === 'U3',
			savedAt: draft?.saved_at ?? null,
			pendingRemovedImages: draft?.removed_images ?? [],
			pendingRemovedImageDescriptions: draft?.removed_image_descriptions ?? {},
			issues: draft
				? [...routingIssues, ...await getPublicationIssues(record, commonFields, null, collectionCodeRules, codeDictionary)]
				: routingIssues,
		};
		return record;
	}));

	records.sort((left, right) =>
		(right.core.updated_date ?? right.core.created_date ?? '').localeCompare(
			left.core.updated_date ?? left.core.created_date ?? '',
		),
	);
	const integrityReport = await createIntegrityReport(officialRecords);

	return {
		records,
		drafts: records
			.filter((record) => record._admin.hasDraft)
			.map((record) => ({
				item_id: record.core.item_id,
				title: record.core.title,
				object_type: record.core.object_type,
				saved_at: record._admin.savedAt,
				issues: record._admin.issues,
				pending_removed_count: record._admin.pendingRemovedImages.length,
			})),
		history,
		recycle_bin: recycleBin.map((entry) => ({
			...entry,
			preview_url: `/api/recycle-image/${entry.item_id}/${entry.entry_id}`,
		})),
		maintenance: {
			integrity: integrityReport,
		},
		standards: {
			commonFields,
			codeDictionary,
			collectionCodeRules,
			fieldRouting,
			archiveCategories,
			administrativeRegions,
			dimensions: { photo, postcard, diary_notebook: diaryNotebook, credential },
		},
		paths: {
			projectName: '老旧默片',
			previewUrl: onlineMode ? `${publicSiteUrl}/` : `${localAdminOrigin}/`,
			adminMode: runtimeMode,
		},
	};
};

const queryTextList = (value) => {
	const values = Array.isArray(value) ? value : [value];
	return [...new Set(values
		.flatMap((entry) => typeof entry === 'string' ? entry.split(';') : [])
		.map((entry) => entry.trim())
		.filter(Boolean))];
};

const safeSpecificQueryFields = new Set([
	'photo_function', 'verso_types', 'photographer', 'studio', 'photography_source',
	'event_scene', 'themes', 'condition_grade', 'condition_details', 'carrier', 'material',
	'postcard_type', 'view_subject', 'sender_name', 'recipient_name', 'postmark_place', 'postmark_date',
	'diary_type', 'notebook_type', 'content_date_start', 'content_date_end', 'language',
	'document_type', 'document_number_masked', 'address_masked', 'credential_status', 'redaction_status',
]);

const createQueryRecords = async () => {
	const bootstrap = await loadBootstrap();
	let imageManifest = {};
	try { imageManifest = await readJson(responsiveImageManifestFile); } catch {}
	const requiredVariantWidths = [320, 640, 1280, 1920];
	const categoryByType = new Map((bootstrap.standards.archiveCategories?.categories ?? [])
		.flatMap((category) => (category.object_types ?? []).map((objectType) => [objectType, category])));
	const objectTypeLabels = new Map((bootstrap.standards.codeDictionary?.entries ?? [])
		.filter((entry) => entry.enabled && entry.dictionary_key === 'object_type')
		.map((entry) => [entry.code, entry.label]));

	return bootstrap.records.map((record) => {
		const core = record.core ?? {};
		const publicView = record.public_view ?? {};
		const publicPaths = Array.isArray(core.publication_file_path) ? core.publication_file_path : [];
		const descriptions = Array.isArray(publicView.image_descriptions) ? publicView.image_descriptions : [];
		const images = publicPaths.map((publicPath, index) => {
			const manifestEntry = imageManifest[publicPath];
			const widths = new Set((manifestEntry?.variants ?? []).map((variant) => variant.width));
			return {
				filename: path.basename(publicPath),
				description: typeof descriptions[index] === 'string' ? descriptions[index].trim() : '',
				responsive_status: requiredVariantWidths.every((width) => widths.has(width)) ? 'complete' : 'missing',
			};
		});
		const descriptionCount = images.filter((image) => image.description).length;
		const responsiveComplete = images.length > 0 && images.every((image) => image.responsive_status === 'complete');
		const orderComplete = descriptions.length === publicPaths.length;
		const publicationStructureStatus = images.length === 0
			? 'missing'
			: descriptionCount < images.length || !responsiveComplete || !orderComplete
				? 'warning'
				: 'complete';
		const category = categoryByType.get(core.object_type);
		const isCredential = core.object_type === 'IDC';
		const placeParts = [core.province, core.city, core.district,
			...(isCredential ? [] : [core.specific_place])].filter((value) => typeof value === 'string' && value.trim());
		const dimensions = record.metadata?.dimensions ?? {};
		const specificSummary = [];
		for (const [dimensionCode, dimension] of Object.entries(dimensions)) {
			if (!dimension || typeof dimension !== 'object') continue;
			for (const [fieldCode, value] of Object.entries(dimension)) {
				if (!safeSpecificQueryFields.has(fieldCode) || !hasMeaningfulValue(value)) continue;
				if (typeof value === 'object' && !Array.isArray(value)) continue;
				specificSummary.push({ dimension_code: dimensionCode, field_code: fieldCode, value });
			}
		}
		const dateYear = String(core.date_display ?? '').match(/(?:18|19|20)\d{2}/)?.[0];
		return {
			item_id: core.item_id ?? '',
			collection_code: core.collection_code ?? '',
			batch_id: core.batch_id ?? '',
			title: core.title ?? '未命名藏品',
			category: category?.slug ?? 'other',
			category_label: category?.label ?? '其他旧物',
			object_type: core.object_type ?? '',
			object_type_label: objectTypeLabels.get(core.object_type) ?? core.object_type ?? '未填写',
			date_display: core.date_display ?? '',
			decade: dateYear ? `${dateYear.slice(0, 3)}0` : '',
			date_start: core.date_start ?? '',
			date_end: core.date_end ?? '',
			place_summary: placeParts.join(' · '),
			province: core.province ?? '',
			city: core.city ?? '',
			district: core.district ?? '',
			people: queryTextList(core.people),
			organizations: queryTextList(core.organizations),
			themes: queryTextList(core.themes),
			event_scene: queryTextList(core.event_scene),
			source_name: core.source_name ?? '',
			source_place: core.source_place ?? '',
			record_status: core.record_status ?? '',
			research_status: core.research_status ?? '',
			evidence_level: core.evidence_level ?? '',
			privacy_level: core.privacy_level ?? '',
			rights_status: core.rights_status ?? '',
			use_status: core.use_status ?? '',
			backup_status: core.backup_status ?? '',
			updated_date: core.updated_date ?? core.created_date ?? '',
			has_draft: Boolean(record._admin?.hasDraft),
			has_official: Boolean(record._admin?.hasOfficial),
			is_published: Boolean(record._admin?.officialPublished),
			required_issue_count: (record._admin?.issues ?? []).filter((issue) => issue.code !== 'privacy_confirmation').length,
			publication_image_count: images.length,
			description_complete_count: descriptionCount,
			image_order_status: orderComplete ? 'complete' : 'warning',
			responsive_variant_status: responsiveComplete ? 'complete' : images.length ? 'warning' : 'missing',
			checksum_status: hasMeaningfulValue(core.checksum_sha256) ? 'complete' : 'missing',
			publication_structure_status: publicationStructureStatus,
			images,
			specific_summary: specificSummary,
		};
	});
};

const assertSafeRecord = (record) => {
	if (!record || typeof record !== 'object' || !record.core || !record.metadata || !record.public_view) {
		throw new Error('档案数据结构不完整。');
	}
	if (!objectSchema[record.core.object_type]) throw new Error('请选择正式的藏品类型。');
	if (record.metadata.schema !== objectSchema[record.core.object_type]) {
		throw new Error('藏品类型与专属信息结构不匹配。');
	}
	if ('master_file_path' in record.core) throw new Error('网站数据不得保存原始主文件路径。');
	if (record.public_view.revision_note !== undefined) {
		if (typeof record.public_view.revision_note !== 'string' || record.public_view.revision_note.length > 300) {
			throw new Error('公开修订说明必须是 300 字以内的文字。');
		}
	}
	if (record.public_view.image_descriptions !== undefined) {
		if (!Array.isArray(record.public_view.image_descriptions)) throw new Error('图片说明格式不正确。');
		for (const description of record.public_view.image_descriptions) {
			if (typeof description !== 'string' || description.length > 180) {
				throw new Error('每条图片说明必须是 180 字以内的文字。');
			}
		}
	}
	const credentialDimensions = record.metadata?.dimensions ?? {};
	for (const dimension of Object.values(credentialDimensions)) {
		if (dimension && typeof dimension === 'object' && ('signatures' in dimension || 'fingerprints' in dimension)) {
			throw new Error('完整签名和指纹不得进入网站数据。');
		}
	}
};

const allocateItemId = async (accessionDate, objectType) => {
	if (!/^\d{4}-\d{2}-\d{2}$/.test(accessionDate ?? '')) throw new Error('请先填写正确的入藏日期。');
	if (!objectSchema[objectType]) throw new Error('请先选择正式的藏品类型。');
	const prefix = `LJM-${accessionDate.replaceAll('-', '')}-${objectType}-`;
	const [records, drafts] = await Promise.all([loadOfficialRecords(), loadDrafts()]);
	const usedSequences = [...records, ...drafts.map((draft) => draft.record)]
		.map((record) => record.core.item_id)
		.filter((itemId) => itemId?.startsWith(prefix))
		.map((itemId) => Number(itemId.slice(-3)))
		.filter(Number.isInteger);
	const nextSequence = Math.max(0, ...usedSequences) + 1;
	if (nextSequence > 999) throw new Error('同一天同一类型的编号已经用完。');
	return `${prefix}${String(nextSequence).padStart(3, '0')}`;
};

const validateImageBuffer = (buffer, mimeType, originalName) => {
	if (!allowedImageTypes.has(mimeType)) throw new Error(`不支持图片格式：${originalName}`);
	if (buffer.length === 0 || buffer.length > maximumImageBytes) {
		throw new Error(`图片大小不合适：${originalName}`);
	}
	const lowerName = originalName.toLocaleLowerCase('en-US');
	if (/(master|original|raw|主档|原始)/i.test(lowerName)) {
		throw new Error(`文件名疑似主档或原始文件，已停止接收：${originalName}`);
	}
	const isJpeg = buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
	const isPng = buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
	const isWebp =
		buffer.subarray(0, 4).toString('ascii') === 'RIFF' &&
		buffer.subarray(8, 12).toString('ascii') === 'WEBP';
	if (
		(mimeType === 'image/jpeg' && !isJpeg) ||
		(mimeType === 'image/png' && !isPng) ||
		(mimeType === 'image/webp' && !isWebp)
	) {
		throw new Error(`图片实际格式与文件说明不一致：${originalName}`);
	}
};

const decodeUploadedImage = (image) => {
	const match = /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/.exec(image.data ?? '');
	if (!match) throw new Error(`无法读取图片：${image.originalName ?? '未命名图片'}`);
	const buffer = Buffer.from(match[2], 'base64');
	validateImageBuffer(buffer, match[1], image.originalName ?? '未命名图片');
	return { buffer, extension: allowedImageTypes.get(match[1]) };
};

const nextImageName = async (itemId, reservedNames, position, extension) => {
	const inboxItemDirectory = path.join(inboxDirectory, itemId);
	const frontName = `front-public${extension}`;
	const backName = `back-public${extension}`;
	if (
		reservedNames.size === 0 &&
		position === 0 &&
		!(await pathExists(path.join(inboxItemDirectory, frontName)))
	) return frontName;
	if (
		reservedNames.size === 1 &&
		position === 1 &&
		!reservedNames.has(backName) &&
		!(await pathExists(path.join(inboxItemDirectory, backName)))
	) {
		return backName;
	}
	for (let sequence = 1; sequence <= 99; sequence += 1) {
		const candidate = `detail-${String(sequence).padStart(2, '0')}-public${extension}`;
		if (!reservedNames.has(candidate) && !(await pathExists(path.join(inboxItemDirectory, candidate)))) {
			return candidate;
		}
	}
	throw new Error('这件藏品的细节图片编号已经用完。');
};

const saveDraft = async (payload) => {
	if (!payload.confirmedPublicationCopies && payload.images?.some((image) => image.kind === 'new')) {
		throw new Error('上传前必须确认图片是经过筛选和必要脱敏的发布副本。');
	}
	const record = structuredClone(payload.record ?? {});
	delete record._admin;
	if (!record.core?.accession_date || !record.core?.object_type || !record.core?.title?.trim()) {
		throw new Error('保存草稿前，请填写入藏日期、藏品类型和题名。');
	}
	let itemId = record.core.item_id;
	if (!itemId) itemId = await allocateItemId(record.core.accession_date, record.core.object_type);
	if (!itemIdPattern.test(itemId)) throw new Error('永久编号格式不正确。');
	const official = (await loadOfficialRecords()).find((candidate) => candidate.core.item_id === itemId);
	const existingDraft = (await loadDrafts()).find((draft) => draft.record.core.item_id === itemId);
	if (payload.isNew && (official || existingDraft)) throw new Error('永久编号已经存在，已停止覆盖。');
	if (!payload.isNew && !official && !existingDraft) throw new Error('找不到要编辑的原记录。');
	if (official?.core.record_status === 'WDR' && !existingDraft?.restored_from_withdrawal) {
		throw new Error('撤销追溯记录保持只读；请先使用“恢复为草稿”。');
	}

	record.core.item_id = itemId;
	record.core.record_status = 'SUS';
	record.core.privacy_level = 'Y';
	record.core.use_status = 'U0';
	record.core.created_date = official?.core.created_date ?? existingDraft?.record.core.created_date ?? today();
	record.core.updated_date = today();
	record.metadata.schema = objectSchema[record.core.object_type];
	const [[collectionCodeRules, codeDictionary], [fieldRouting, commonFields]] = await Promise.all([
		loadCollectionCodeStandards(),
		loadFieldRoutingStandards(),
	]);
	const routingConflicts = normalizeSharedCoreFields(record, fieldRouting, commonFields);
	if (routingConflicts.length) {
		throw new Error('发现旧基本信息与对象专属信息存在不同的单值内容，已停止自动合并，避免覆盖旧值。');
	}
	applyCollectionCode(record, collectionCodeRules, codeDictionary);
	assertSafeRecord(record);

	const inboxItemDirectory = path.join(inboxDirectory, itemId);
	await fs.mkdir(inboxItemDirectory, { recursive: true });
	const removedImages = [...new Set(payload.removedImages ?? [])].map((filename) => path.basename(filename));
	for (const filename of removedImages) {
		if (!filename || !/^[-A-Za-z0-9_.]+$/.test(filename)) throw new Error('待移除图片名称无效。');
		if (!(await pathExists(path.join(inboxItemDirectory, filename)))) {
			throw new Error(`待移除图片在待入站目录中不存在：${filename}`);
		}
	}
	const reservedNames = new Set();
	const publicationPaths = [];
	const newlyWrittenFiles = [];
	try {
		for (const [position, image] of (payload.images ?? []).entries()) {
			if (image.kind === 'existing') {
				const filename = path.basename(image.filename ?? '');
				if (!filename || filename !== image.filename || !/^[-A-Za-z0-9_.]+$/.test(filename)) {
					throw new Error('已有图片名称无效。');
				}
				const source = path.join(inboxItemDirectory, filename);
				if (!(await pathExists(source))) throw new Error(`待入站目录缺少图片：${filename}`);
				reservedNames.add(filename);
				publicationPaths.push(`/archive/${itemId}/${filename}`);
				continue;
			}
			if (image.kind !== 'new') throw new Error('图片列表包含无法识别的项目。');
			const decoded = decodeUploadedImage(image);
			const filename = await nextImageName(itemId, reservedNames, position, decoded.extension);
			const targetPath = path.join(inboxItemDirectory, filename);
			await fs.writeFile(targetPath, decoded.buffer, { flag: 'wx' });
			newlyWrittenFiles.push(targetPath);
			reservedNames.add(filename);
			publicationPaths.push(`/archive/${itemId}/${filename}`);
		}
		record.core.publication_file_path = publicationPaths;
		const activeNames = new Set(publicationPaths.map((publicPath) => path.basename(publicPath)));
		const cleanRemovedImages = removedImages.filter((filename) => !activeNames.has(filename));
		const currentDescriptions = Array.isArray(record.public_view.image_descriptions)
			? record.public_view.image_descriptions.map((description) => description.trim())
			: [];
		if (currentDescriptions.some(Boolean)) {
			record.public_view.image_descriptions = publicationPaths.map((_, index) => currentDescriptions[index] ?? '');
		} else {
			delete record.public_view.image_descriptions;
		}
		const removedImageDescriptions = Object.fromEntries(cleanRemovedImages.flatMap((filename) => {
			const description = payload.removedImageDescriptions?.[filename];
			return typeof description === 'string' && description.trim() && description.length <= 180
				? [[filename, description.trim()]]
				: [];
		}));
		const draft = {
			version: 2,
			saved_at: new Date().toISOString(),
			removed_images: cleanRemovedImages,
			removed_image_descriptions: removedImageDescriptions,
			restored_from_history: existingDraft?.restored_from_history ?? null,
			restored_from_withdrawal: existingDraft?.restored_from_withdrawal ?? null,
			record,
		};
		await fs.mkdir(draftDirectory, { recursive: true });
		await fs.writeFile(path.join(draftDirectory, `${itemId}.json`), `${JSON.stringify(draft, null, 2)}\n`, 'utf8');
		return draft;
	} catch (error) {
		for (const filePath of newlyWrittenFiles) await fs.rm(filePath, { force: true });
		throw error;
	}
};

const validateForPublication = async (record, confirmations) => {
	const [commonFields, collectionCodeRules, codeDictionary] = await Promise.all([
		readJson(path.join(standardsDirectory, 'common-fields.json')),
		readJson(path.join(standardsDirectory, 'collection-code-rules.json')),
		readJson(path.join(standardsDirectory, 'code-dictionary.json')),
	]);
	const issues = await getPublicationIssues(
		record,
		commonFields,
		confirmations,
		collectionCodeRules,
		codeDictionary,
	);
	if (issues.length) throw new PublicationValidationError(issues);
};

const generateSiteArchiveSource = async () => {
	const [officialRecords, collectionCodeStandards, fieldRoutingStandards] = await Promise.all([
		loadOfficialRecords(),
		loadCollectionCodeStandards(),
		loadFieldRoutingStandards(),
	]);
	const [collectionCodeRules, codeDictionary] = collectionCodeStandards;
	const [fieldRouting, commonFields] = fieldRoutingStandards;
	const records = officialRecords
		.filter(
			(record) =>
				record.core.record_status === 'ACT' &&
				record.core.privacy_level === 'G' &&
				record.core.use_status === 'U3',
		)
		.map((record) => {
			const normalizedRecord = structuredClone(record);
			normalizeSharedCoreFields(normalizedRecord, fieldRouting, commonFields);
			return applyCollectionCode(normalizedRecord, collectionCodeRules, codeDictionary);
		})
		.sort((left, right) => (left.core.item_id ?? '').localeCompare(right.core.item_id ?? ''));
	return `import type { ArchiveItem } from './archive-schema';\n\n// 本文件由本地档案管理入口根据 archive-data 中通过发布检查的记录生成。\n// 原始主档、完整私人地址、完整号码、签名和指纹不得写入这里。\nexport const archiveItems = ${JSON.stringify(records, null, '\t')} satisfies ArchiveItem[];\n\nexport type { ArchiveItem } from './archive-schema';\n`;
};

const updateEntryManifest = async (entryDirectory, updates) => {
	const manifestPath = path.join(entryDirectory, 'manifest.json');
	const current = (await pathExists(manifestPath)) ? await readJson(manifestPath) : {};
	const next = { ...current, ...updates };
	await fs.writeFile(manifestPath, `${JSON.stringify(next, null, 2)}\n`, 'utf8');
	return next;
};

const createHistorySnapshot = async (record, options = {}) => {
	if (!record) return null;
	const entryId = createEntryId();
	const entryDirectory = path.join(historyDirectory, record.core.item_id, entryId);
	const imageDirectory = path.join(entryDirectory, 'images');
	await fs.mkdir(imageDirectory, { recursive: true });
	await fs.writeFile(path.join(entryDirectory, 'record.json'), `${JSON.stringify(record, null, 2)}\n`, 'utf8');
	const copiedImages = [];
	for (const publicPath of record.core.publication_file_path ?? []) {
		const parts = publicPath.split('/').filter(Boolean);
		const imageItemId = parts.at(-2);
		const filename = parts.at(-1);
		const inboxFile = path.join(inboxDirectory, imageItemId, filename);
		const siteFile = path.join(siteArchiveDirectory, imageItemId, filename);
		const source = (await pathExists(inboxFile)) ? inboxFile : siteFile;
		if (!(await pathExists(source))) continue;
		await fs.copyFile(source, path.join(imageDirectory, filename));
		copiedImages.push(filename);
	}
	const manifest = await updateEntryManifest(entryDirectory, {
		type: 'history',
		entry_id: entryId,
		item_id: record.core.item_id,
		title: record.core.title,
		created_at: new Date().toISOString(),
		status: 'pending',
		images: copiedImages,
		snapshot_kind: options.snapshotKind ?? 'published-before-update',
		removed_images: options.removedImages ?? [],
		withdrawal_reason: options.withdrawalReason ?? null,
	});
	return { entryDirectory, imageDirectory, manifest };
};

const moveImageToRecycle = async (itemId, filename) => {
	const safeFilename = path.basename(filename);
	const source = path.join(inboxDirectory, itemId, safeFilename);
	if (!(await pathExists(source))) return null;
	const entryId = createEntryId();
	const entryDirectory = path.join(recycleDirectory, itemId, entryId);
	await fs.mkdir(entryDirectory, { recursive: true });
	const recycledFile = path.join(entryDirectory, safeFilename);
	await fs.copyFile(source, recycledFile);
	const sourceHash = await fileSha256(source);
	if ((await fileSha256(recycledFile)) !== sourceHash) throw new Error(`回收区图片校验失败：${safeFilename}`);
	const manifest = await updateEntryManifest(entryDirectory, {
		type: 'recycle',
		entry_id: entryId,
		item_id: itemId,
		filename: safeFilename,
		removed_at: new Date().toISOString(),
		created_at: new Date().toISOString(),
		sha256: sourceHash,
		restored_at: null,
	});
	await fs.rm(source, { force: true });
	return { entryDirectory, manifest };
};

const copyRestoredImage = async (itemId, source, preferredName) => {
	const itemDirectory = path.join(inboxDirectory, itemId);
	await fs.mkdir(itemDirectory, { recursive: true });
	const safePreferredName = path.basename(preferredName);
	const preferredTarget = path.join(itemDirectory, safePreferredName);
	if (!(await pathExists(preferredTarget))) {
		await fs.copyFile(source, preferredTarget);
		return safePreferredName;
	}
	if ((await fileSha256(preferredTarget)) === (await fileSha256(source))) return safePreferredName;
	const extension = path.extname(safePreferredName);
	const stem = path.basename(safePreferredName, extension).replace(/[^-A-Za-z0-9_.]/g, '-');
	for (let sequence = 1; sequence <= 99; sequence += 1) {
		const candidate = `restored-${String(sequence).padStart(2, '0')}-${stem}${extension}`;
		const target = path.join(itemDirectory, candidate);
		if (!(await pathExists(target))) {
			await fs.copyFile(source, target);
			return candidate;
		}
	}
	throw new Error('恢复图片时无法分配安全文件名。');
};

const writeRestoredDraft = async (
	record,
	removedImages = [],
	restoredFromHistory = null,
	restoredFromWithdrawal = null,
) => {
	record.core.record_status = 'SUS';
	record.core.privacy_level = 'Y';
	record.core.use_status = 'U0';
	record.core.updated_date = today();
	const [[collectionCodeRules, codeDictionary], [fieldRouting, commonFields]] = await Promise.all([
		loadCollectionCodeStandards(),
		loadFieldRoutingStandards(),
	]);
	normalizeSharedCoreFields(record, fieldRouting, commonFields);
	applyCollectionCode(record, collectionCodeRules, codeDictionary);
	const draft = {
		version: 2,
		saved_at: new Date().toISOString(),
		removed_images: removedImages,
		restored_from_history: restoredFromHistory,
		restored_from_withdrawal: restoredFromWithdrawal,
		record,
	};
	await fs.mkdir(draftDirectory, { recursive: true });
	await fs.writeFile(path.join(draftDirectory, `${record.core.item_id}.json`), `${JSON.stringify(draft, null, 2)}\n`, 'utf8');
	return draft;
};

const restoreRecycleEntry = async (payload) => {
	const itemId = payload.itemId;
	const entryId = safeEntryId(payload.entryId);
	if (!itemIdPattern.test(itemId ?? '')) throw new Error('永久编号无效。');
	const entryDirectory = path.join(recycleDirectory, itemId, entryId);
	const manifest = await readJson(path.join(entryDirectory, 'manifest.json'));
	if (manifest.item_id !== itemId || manifest.entry_id !== entryId) throw new Error('回收记录不匹配。');
	if (manifest.restored_at) throw new Error('这张图片已经恢复过。');
	const [officialRecords, drafts] = await Promise.all([loadOfficialRecords(), loadDrafts()]);
	const official = officialRecords.find((record) => record.core.item_id === itemId);
	const currentDraft = drafts.find((draft) => draft.record.core.item_id === itemId);
	if (official?.core.record_status === 'WDR' && !currentDraft?.restored_from_withdrawal) {
		throw new Error('撤销追溯记录保持只读。');
	}
	const record = structuredClone(currentDraft?.record ?? official);
	if (!record) throw new Error('找不到要恢复图片的档案。');
	const source = path.join(entryDirectory, manifest.filename);
	const restoredName = await copyRestoredImage(itemId, source, manifest.filename);
	const restoredPath = `/archive/${itemId}/${restoredName}`;
	record.core.publication_file_path ??= [];
	if (!record.core.publication_file_path.includes(restoredPath)) record.core.publication_file_path.push(restoredPath);
	const removedImages = (currentDraft?.removed_images ?? []).filter((filename) => filename !== manifest.filename);
	const draft = await writeRestoredDraft(
		record,
		removedImages,
		currentDraft?.restored_from_history ?? null,
		currentDraft?.restored_from_withdrawal ?? null,
	);
	await updateEntryManifest(entryDirectory, {
		restored_at: new Date().toISOString(),
		restored_as: restoredName,
	});
	return draft;
};

const restoreHistoryEntry = async (payload) => {
	const itemId = payload.itemId;
	const entryId = safeEntryId(payload.entryId);
	if (!itemIdPattern.test(itemId ?? '')) throw new Error('永久编号无效。');
	const entryDirectory = path.join(historyDirectory, itemId, entryId);
	const manifest = await readJson(path.join(entryDirectory, 'manifest.json'));
	if (manifest.status !== 'complete' || manifest.item_id !== itemId) throw new Error('历史版本不可恢复。');
	if (['published-before-withdrawal', 'withdrawn-before-reactivation'].includes(manifest.snapshot_kind)) {
		throw new Error('撤销追溯快照保持只读；请从“已撤销”列表按正式恢复流程操作。');
	}
	const currentOfficial = (await loadOfficialRecords()).find((record) => record.core.item_id === itemId);
	if (currentOfficial?.core.record_status === 'WDR') {
		throw new Error('撤销记录保持只读；请从“已撤销”列表恢复为草稿。');
	}
	const currentDraft = (await loadDrafts()).find((draft) => draft.record.core.item_id === itemId);
	if (currentDraft) {
		const safetySnapshot = await createHistorySnapshot(currentDraft.record, {
			snapshotKind: 'draft-before-history-restore',
			removedImages: currentDraft.removed_images ?? [],
		});
		await updateEntryManifest(safetySnapshot.entryDirectory, {
			status: 'complete',
			completed_at: new Date().toISOString(),
		});
	}
	const record = await readJson(path.join(entryDirectory, 'record.json'));
	if (record.core.record_status === 'WDR') throw new Error('撤销追溯记录保持只读。');
	const restoredPaths = [];
	for (const publicPath of record.core.publication_file_path ?? []) {
		const filename = path.basename(publicPath);
		const source = path.join(entryDirectory, 'images', filename);
		if (!(await pathExists(source))) throw new Error(`历史版本缺少图片：${filename}`);
		const restoredName = await copyRestoredImage(itemId, source, filename);
		restoredPaths.push(`/archive/${itemId}/${restoredName}`);
	}
	record.core.publication_file_path = restoredPaths;
	return writeRestoredDraft(record, manifest.removed_images ?? [], entryId);
};

const restoreWithdrawnRecord = async (payload) => {
	const itemId = payload.itemId;
	if (!itemIdPattern.test(itemId ?? '')) throw new Error('永久编号无效。');
	const [officialRecords, drafts] = await Promise.all([loadOfficialRecords(), loadDrafts()]);
	const official = officialRecords.find((record) => record.core.item_id === itemId);
	if (!official) throw new Error('找不到要恢复的撤销记录。');
	if (official.core.record_status !== 'WDR') throw new Error('只有已撤销档案可以恢复为草稿。');
	if (drafts.some((draft) => draft.record.core.item_id === itemId)) throw new Error('这条档案已经有恢复草稿。');
	const eligibility = await withdrawnRestoreEligibility(official);
	if (!eligibility.allowed) throw new Error(eligibility.reason || '这条撤销记录不能自动恢复。');
	return writeRestoredDraft(structuredClone(official), [], null, {
		item_id: itemId,
		restored_at: new Date().toISOString(),
	});
};

const runSiteBuild = async () => {
	const buildCommand = process.platform === 'win32'
		? { file: process.env.ComSpec ?? 'C:\\Windows\\System32\\cmd.exe', arguments: ['/d', '/s', '/c', 'npm run build'] }
		: { file: npmCommand, arguments: ['run', 'build'] };
	const { stdout, stderr } = await execFileAsync(buildCommand.file, buildCommand.arguments, {
		cwd: siteDirectory,
		env: onlineMode
			? { ...process.env, PATH: `/snap/node/current/bin:${process.env.PATH ?? '/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin'}` }
			: process.env,
		windowsHide: true,
		maxBuffer: 10 * 1024 * 1024,
	});
	return `${stdout}\n${stderr}`.trim();
};

const withdrawOfficialRecord = async (payload) => {
	if (publishInProgress) throw new Error('已有一项网站更新正在进行，请稍候。');
	publishInProgress = true;
	const itemId = payload.itemId;
	try {
		if (!itemIdPattern.test(itemId ?? '')) throw new Error('永久编号无效。');
		if (payload.confirmed !== true) throw new Error('请先确认本次撤销的影响。');
		const reason = String(payload.reason ?? '').trim();
		if (reason.length < 2 || reason.length > 500) throw new Error('请填写 2 到 500 字的明确撤销原因。');
		const draftPath = path.join(draftDirectory, `${itemId}.json`);
		if (await pathExists(draftPath)) throw new Error('这条档案还有未发布草稿，请先处理草稿后再撤销。');
		const officialPath = path.join(archiveDataDirectory, `${itemId}.json`);
		if (!(await pathExists(officialPath))) throw new Error('找不到要撤销的正式档案。');
		const official = await readJson(officialPath);
		if (official.core.record_status === 'WDR') throw new Error('这条档案已经撤销。');
		if (official.core.record_status !== 'ACT' || official.core.use_status !== 'U3') {
			throw new Error('只有当前正常且已发布的档案可以执行撤销。');
		}
		for (const publicPath of official.core.publication_file_path ?? []) {
			if (!publicPath.startsWith(`/archive/${itemId}/`)) {
				throw new Error(`发布图片路径与永久编号不一致，已停止撤销：${publicPath}`);
			}
		}

		const previousOfficial = await fs.readFile(officialPath);
		const previousArchiveSource = await fs.readFile(siteArchiveDataFile);
		const historySnapshot = await createHistorySnapshot(official, {
			snapshotKind: 'published-before-withdrawal',
			withdrawalReason: reason,
		});
		const withdrawn = structuredClone(official);
		withdrawn.core.record_status = 'WDR';
		withdrawn.core.use_status = 'U4';
		withdrawn.core.updated_date = today();
		const withdrawalNote = `撤销记录（${today()}）：${reason}`;
		withdrawn.core.notes = [withdrawn.core.notes, withdrawalNote].filter(Boolean).join('\n');
		const removedSiteFiles = [];
		let buildOutput = '';
		let deployment = null;
		try {
			await fs.writeFile(officialPath, `${JSON.stringify(withdrawn, null, 2)}\n`, 'utf8');
			await fs.writeFile(siteArchiveDataFile, await generateSiteArchiveSource(), 'utf8');
			for (const publicPath of official.core.publication_file_path ?? []) {
				const filename = path.basename(publicPath);
				const siteFile = path.join(siteArchiveDirectory, itemId, filename);
				if (await pathExists(siteFile)) {
					removedSiteFiles.push(siteFile);
					await fs.rm(siteFile, { force: true });
				}
			}
			buildOutput = await runSiteBuild();
			if (onlineMode) deployment = await releaseDeployer.deploy();
		} catch (error) {
			await fs.writeFile(officialPath, previousOfficial);
			await fs.writeFile(siteArchiveDataFile, previousArchiveSource);
			for (const siteFile of removedSiteFiles) {
				const source = path.join(historySnapshot.imageDirectory, path.basename(siteFile));
				if (await pathExists(source)) await fs.copyFile(source, siteFile);
			}
			await updateEntryManifest(historySnapshot.entryDirectory, {
				status: 'failed',
				failed_at: new Date().toISOString(),
				failure_reason: safeMessage(error),
			});
			let rollbackBuildMessage = '';
			try {
				await runSiteBuild();
			} catch (rollbackError) {
				rollbackBuildMessage = `；恢复后的构建也未完成：${safeMessage(rollbackError)}`;
			}
			throw new Error(`撤销后的网站构建或安全切换没有完成，已恢复原发布状态：${safeMessage(error)}${rollbackBuildMessage}`);
		}
		const warnings = [];
		try {
			await updateEntryManifest(historySnapshot.entryDirectory, {
				status: 'complete',
				completed_at: new Date().toISOString(),
				withdrawn_at: new Date().toISOString(),
			});
		} catch (error) {
			warnings.push(`撤销已完成，但历史清单状态更新失败：${safeMessage(error)}`);
		}
		return { record: withdrawn, buildOutput, deployment, warnings };
	} finally {
		publishInProgress = false;
	}
};

const publishDraft = async (payload) => {
	if (publishInProgress) throw new Error('已有一项发布检查正在进行，请稍候。');
	publishInProgress = true;
	const itemId = payload.itemId;
	try {
		if (!itemIdPattern.test(itemId ?? '')) throw new Error('永久编号无效。');
		const draftPath = path.join(draftDirectory, `${itemId}.json`);
		if (!(await pathExists(draftPath))) throw new Error('请先保存草稿。');
		const draft = await readJson(draftPath);
		const record = structuredClone(draft.record);
		const [fieldRouting, commonFields] = await loadFieldRoutingStandards();
		const routingConflicts = normalizeSharedCoreFields(record, fieldRouting, commonFields);
		if (routingConflicts.length) {
			throw new Error('旧基本信息与对象专属信息仍有冲突值，请先返回草稿处理，系统不会自动覆盖旧值。');
		}
		const previousOfficialRecord = (await loadOfficialRecords()).find(
			(candidate) => candidate.core.item_id === itemId,
		);
		if (previousOfficialRecord?.core.record_status === 'WDR' && !draft.restored_from_withdrawal) {
			throw new Error('撤销追溯记录不能直接重新发布；请先恢复为草稿。');
		}
		if (draft.restored_from_withdrawal?.item_id && draft.restored_from_withdrawal.item_id !== itemId) {
			throw new Error('恢复草稿与撤销记录不匹配，已停止发布。');
		}
		await validateForPublication(record, payload.confirmations);

		record.core.record_status = 'ACT';
		record.core.privacy_level = 'G';
		record.core.use_status = 'U3';
		record.core.updated_date = today();
		record.core.created_date ??= today();
		const [collectionCodeRules, codeDictionary] = await loadCollectionCodeStandards();
		applyCollectionCode(record, collectionCodeRules, codeDictionary);
		record.core.id_check = '永久编号格式与重复检查通过，编号、JSON、图片目录和发布路径一致。';
		record.core.required_check = '核心必填字段、对象类型与 schema、隐私检查、图片路径和正式构建均已通过。';

		const officialPath = path.join(archiveDataDirectory, `${itemId}.json`);
		const previousOfficial = (await pathExists(officialPath)) ? await fs.readFile(officialPath) : null;
		const previousArchiveSource = await fs.readFile(siteArchiveDataFile);
		const historySnapshot = await createHistorySnapshot(previousOfficialRecord, {
			snapshotKind: previousOfficialRecord?.core.record_status === 'WDR'
				? 'withdrawn-before-reactivation'
				: 'published-before-update',
		});
		const copiedNewFiles = [];
		const removedSiteFiles = [];
		const removedImages = [...new Set(draft.removed_images ?? [])];
		let buildOutput = '';
		let deployment = null;
		try {
			const siteItemDirectory = path.join(siteArchiveDirectory, itemId);
			await fs.mkdir(siteItemDirectory, { recursive: true });
			for (const publicPath of record.core.publication_file_path) {
				const filename = path.basename(publicPath);
				const destination = path.join(siteItemDirectory, filename);
				if (!(await pathExists(destination))) copiedNewFiles.push(destination);
				await fs.copyFile(path.join(inboxDirectory, itemId, filename), destination);
			}
			for (const filename of removedImages) {
				const siteFile = path.join(siteItemDirectory, path.basename(filename));
				if (await pathExists(siteFile)) {
					removedSiteFiles.push(siteFile);
					await fs.rm(siteFile, { force: true });
				}
			}
			await fs.writeFile(officialPath, `${JSON.stringify(record, null, 2)}\n`, 'utf8');
			await fs.writeFile(siteArchiveDataFile, await generateSiteArchiveSource(), 'utf8');
			buildOutput = await runSiteBuild();
			if (onlineMode) deployment = await releaseDeployer.deploy();
		} catch (error) {
			if (previousOfficial) await fs.writeFile(officialPath, previousOfficial);
			else await fs.rm(officialPath, { force: true });
			await fs.writeFile(siteArchiveDataFile, previousArchiveSource);
			for (const filePath of copiedNewFiles) await fs.rm(filePath, { force: true });
			if (historySnapshot) {
				for (const siteFile of removedSiteFiles) {
					const source = path.join(historySnapshot.imageDirectory, path.basename(siteFile));
					if (await pathExists(source)) await fs.copyFile(source, siteFile);
				}
				await updateEntryManifest(historySnapshot.entryDirectory, {
					status: 'failed',
					failed_at: new Date().toISOString(),
					failure_reason: safeMessage(error),
				});
			}
			let rollbackBuildMessage = '';
			try {
				await runSiteBuild();
			} catch (rollbackError) {
				rollbackBuildMessage = `；恢复后的构建也未完成：${safeMessage(rollbackError)}`;
			}
			throw new Error(`网站构建或安全切换没有完成，已恢复发布前状态：${safeMessage(error)}${rollbackBuildMessage}`);
		}

		const warnings = [];
		for (const filename of removedImages) {
			try {
				await moveImageToRecycle(itemId, filename);
			} catch (error) {
				warnings.push(`图片 ${filename} 未能进入回收区：${safeMessage(error)}`);
			}
		}
		if (historySnapshot) {
			try {
				await updateEntryManifest(historySnapshot.entryDirectory, {
					status: 'complete',
					completed_at: new Date().toISOString(),
				});
			} catch (error) {
				warnings.push(`历史版本记录失败：${safeMessage(error)}`);
			}
		}
		await fs.rm(draftPath, { force: true });
		return { record, buildOutput, deployment, warnings };
	} finally {
		publishInProgress = false;
	}
};

const validateRuntimePaths = async () => {
	const requiredDirectories = [
		['管理页面目录', publicDirectory],
		['网站项目目录', siteDirectory],
		['数据规范目录', standardsDirectory],
		...(onlineMode ? [
			['正式档案数据目录', archiveDataDirectory],
			['草稿目录', draftDirectory],
			['历史版本目录', historyDirectory],
			['图片回收目录', recycleDirectory],
			['待入站图片目录', inboxDirectory],
			['公开网站版本目录', publicReleasesDirectory],
		] : []),
	];
	for (const [label, directory] of requiredDirectories) {
		let stat;
		try {
			stat = await fs.stat(directory);
		} catch {
			throw new Error(`${label}不存在或无法读取：${directory}`);
		}
		if (!stat.isDirectory()) throw new Error(`${label}不是目录：${directory}`);
	}
	for (const [label, filePath] of [
		['网站构建配置', path.join(siteDirectory, 'package.json')],
		['网站档案数据文件', siteArchiveDataFile],
	]) {
		try {
			const stat = await fs.stat(filePath);
			if (!stat.isFile()) throw new Error();
		} catch {
			throw new Error(`${label}不存在或无法读取：${filePath}`);
		}
	}
	if (onlineMode) await readLiveRelease(publicReleasesDirectory, publicLiveLink);
};

const printConfigurationSummary = () => {
	console.log(`管理模式：${onlineMode ? '线上安全模式' : '本地模式'}`);
	console.log(`监听地址：http://${adminHost}:${adminPort}`);
	console.log(`管理程序目录：${projectRoot}`);
	console.log(`管理数据目录：${onlineMode ? adminDataRoot : '沿用本地项目目录'}`);
	if (onlineMode) {
		console.log(`线上管理域名：${configuredAdminOrigin}`);
		console.log(`公开网站域名：${publicSiteUrl}`);
		console.log(`公开版本目录：${publicReleasesDirectory}`);
		console.log(`当前版本软链接：${publicLiveLink}`);
		console.log(`允许登录邮箱数量：${allowedAdminEmails.size}`);
		console.log('Cloudflare Access 二次验证：已配置');
	}
};

const adminServer = http.createServer(async (request, response) => {
	try {
		const url = new URL(request.url ?? '/', configuredAdminOrigin);
		if ((request.method === 'GET' || request.method === 'HEAD') && url.pathname === '/healthz') {
			sendJson(response, 200, { ok: true });
			return;
		}
		if (onlineMode) await accessAuthenticator.verifyRequest(request);
		if (request.method === 'GET' && url.pathname === '/api/bootstrap') {
			sendJson(response, 200, await loadBootstrap());
			return;
		}
		if (request.method === 'GET' && url.pathname === '/api/query-records') {
			sendJson(response, 200, { records: await createQueryRecords() });
			return;
		}
		if (request.method === 'GET' && url.pathname.startsWith('/api/image/')) {
			const [, , , itemId, filename] = url.pathname.split('/');
			if (!itemIdPattern.test(itemId ?? '') || path.basename(filename ?? '') !== filename) {
				response.writeHead(400).end('Invalid image path');
				return;
			}
			const inboxFile = path.join(inboxDirectory, itemId, filename);
			await sendFile(
				response,
				await pathExists(inboxFile) ? path.join(inboxDirectory, itemId) : path.join(siteArchiveDirectory, itemId),
				`/${filename}`,
			);
			return;
		}
		if (request.method === 'GET' && url.pathname.startsWith('/api/recycle-image/')) {
			const [, , , itemId, entryId] = url.pathname.split('/');
			if (!itemIdPattern.test(itemId ?? '')) throw new Error('永久编号无效。');
			safeEntryId(entryId);
			const entryDirectory = path.join(recycleDirectory, itemId, entryId);
			const manifest = await readJson(path.join(entryDirectory, 'manifest.json'));
			await sendFile(response, entryDirectory, `/${manifest.filename}`);
			return;
		}
		if (request.method === 'POST' && url.pathname === '/api/save-draft') {
			requireSafeMutation(request);
			sendJson(response, 200, { draft: await saveDraft(await readRequestJson(request)) });
			return;
		}
		if (request.method === 'POST' && url.pathname === '/api/preflight-images') {
			requireSafeMutation(request);
			sendJson(response, 200, await preflightImageFiles(await readRequestJson(request)));
			return;
		}
		if (request.method === 'POST' && url.pathname === '/api/publish') {
			requireSafeMutation(request);
			sendJson(response, 200, await publishDraft(await readRequestJson(request)));
			return;
		}
		if (request.method === 'POST' && url.pathname === '/api/withdraw-record') {
			requireSafeMutation(request);
			sendJson(response, 200, await withdrawOfficialRecord(await readRequestJson(request)));
			return;
		}
		if (request.method === 'POST' && url.pathname === '/api/restore-withdrawn') {
			requireSafeMutation(request);
			sendJson(response, 200, { draft: await restoreWithdrawnRecord(await readRequestJson(request)) });
			return;
		}
		if (request.method === 'POST' && url.pathname === '/api/restore-recycle') {
			requireSafeMutation(request);
			sendJson(response, 200, { draft: await restoreRecycleEntry(await readRequestJson(request)) });
			return;
		}
		if (request.method === 'POST' && url.pathname === '/api/restore-history') {
			requireSafeMutation(request);
			sendJson(response, 200, { draft: await restoreHistoryEntry(await readRequestJson(request)) });
			return;
		}
		if ((request.method === 'GET' || request.method === 'HEAD') && url.pathname === '/admin') {
			response.writeHead(302, { Location: '/admin/', ...securityHeaders() }).end();
			return;
		}
		if (onlineMode && (request.method === 'GET' || request.method === 'HEAD') && url.pathname === '/') {
			response.writeHead(302, { Location: '/admin/', ...securityHeaders() }).end();
			return;
		}
		if ((request.method === 'GET' || request.method === 'HEAD') && url.pathname.startsWith('/admin/')) {
			await sendFile(response, publicDirectory, url.pathname.slice('/admin'.length));
			return;
		}
		if (request.method !== 'GET' && request.method !== 'HEAD') {
			sendJson(response, 405, { error: '不支持此操作。' });
			return;
		}
		if (onlineMode) {
			sendJson(response, 404, { error: '此管理地址不存在。' });
			return;
		}
		await sendFile(response, siteDistDirectory, url.pathname, {
			transformHtml: injectLocalPreviewToolbar,
			notFoundFile: path.join(siteDistDirectory, '404.html'),
		});
	} catch (error) {
		if (!['AccessAuthenticationError', 'RequestError'].includes(error?.name)) console.error(error);
		if (response.headersSent) {
			response.end();
			return;
		}
		sendJson(response, Number.isInteger(error?.statusCode) ? error.statusCode : 400, {
			error: safeMessage(error),
			...(Array.isArray(error?.issues) ? { issues: error.issues } : {}),
		});
	}
});

await validateRuntimePaths();

if (process.argv.includes('--check-config')) {
	printConfigurationSummary();
	console.log('配置和必要目录检查通过。');
} else if (process.argv.includes('--sync-site-data')) {
	await fs.writeFile(siteArchiveDataFile, await generateSiteArchiveSource(), 'utf8');
	console.log('网站档案数据已根据正式 JSON 重新生成。');
} else {
	adminServer.listen(adminPort, adminHost, () => {
		if (onlineMode) {
			console.log(`线上档案管理仅在服务器本机监听：http://${adminHost}:${adminPort}`);
			console.log(`浏览器管理入口：${configuredAdminOrigin}/admin/`);
			return;
		}
		console.log(`本地网站预览：${localAdminOrigin}/`);
		console.log(`本地档案管理：${localAdminOrigin}/admin/`);
	});
}
