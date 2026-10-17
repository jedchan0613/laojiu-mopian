// 手机维护隔离验收：完整程序副本 + 合成资料；不复制用户档案或私有业务数据。
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';

const sourceRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const stageArgument = process.argv.find((argument) => /^--stage=[1234]$/.test(argument));
const stage = stageArgument ? Number(stageArgument.split('=')[1]) : 1;
const port = { 1: '4193', 2: '4194', 3: '4195', 4: '4196' }[stage];
const stageLabel = { 1: '第一阶段界面', 2: '第二阶段写入保护', 3: '第三阶段保存与中断恢复', 4: '前三阶段复核及发布验收' }[stage];
const outputRoot = path.join(sourceRoot, 'outputs', `mobile-maintenance-stage${stage}`);
const root = path.join(outputRoot, 'workspace');
const privateRoot = path.join(root, 'private');
const site = path.join(root, 'site');
const exists = async (file) => Boolean(await fs.stat(file).catch(() => null));
const inside = (parent, child) => path.resolve(child).startsWith(`${path.resolve(parent)}${path.sep}`);
if (!inside(outputRoot, root)) throw new Error('隔离目录不在指定验收目录内。');
await fs.mkdir(outputRoot, { recursive: true });

const protectedLocations = ['archive-data', 'public-assets/inbox', 'local-admin/drafts', 'local-admin/history',
	'local-admin/recycle-bin', 'local-admin/upload-staging', 'local-admin/translations', 'local-admin/accounts',
	'local-admin/submissions', 'local-admin/operations', 'site/public/archive', 'site/public/archive-responsive', 'site/src/data/generated',
	'site/src/data/archive.ts', 'site/src/data/archive-translations.json', 'site/src/data/archive-translations.th.json',
	'site/src/data/archive-translations.ja.json', 'site/src/data/archive-translations.ko.json', 'site/src/data/archive-translations.zh-Hant.json'];
const protectedManifest = async () => {
	const manifest = {};
	const visit = async (file) => {
		const stat = await fs.lstat(file).catch(() => null);
		if (!stat || stat.isSymbolicLink()) return;
		if (stat.isDirectory()) { for (const name of await fs.readdir(file)) await visit(path.join(file, name)); }
		else manifest[path.relative(sourceRoot, file).replaceAll('\\', '/')] = createHash('sha256').update(await fs.readFile(file)).digest('hex');
	};
	for (const relative of protectedLocations) await visit(path.join(sourceRoot, relative));
	return manifest;
};
const beforeFile = path.join(outputRoot, 'protected-before.json');
if (process.argv.includes('--verify-protected')) {
	const before = JSON.parse(await fs.readFile(beforeFile, 'utf8'));
	const after = await protectedManifest();
	const changed = [...new Set([...Object.keys(before), ...Object.keys(after)])].filter((key) => before[key] !== after[key]);
	await fs.writeFile(path.join(outputRoot, 'protected-verification.json'), JSON.stringify({ checked: Object.keys(before).length, changed }, null, 2));
	if (changed.length) throw new Error(`保护资料有 ${changed.length} 份变化，请核对私有验收记录。`);
	console.log(`保护资料校验通过：${Object.keys(before).length} 份文件一致。`);
	process.exit(0);
}
if (!(await exists(beforeFile))) await fs.writeFile(beforeFile, JSON.stringify(await protectedManifest(), null, 2));

for (const relative of ['shared', 'local-admin/public', 'site/scripts']) {
	await fs.cp(path.join(sourceRoot, relative), path.join(root, relative), { recursive: true });
}
const previewHtml = path.join(root, 'local-admin', 'public', 'index.html');
await fs.writeFile(previewHtml, (await fs.readFile(previewHtml, 'utf8')).replace(/\?v=20261018-mobile-stage[1234][^" ]*/g, `?v=mobile-preview-${Date.now()}`).replace('<body class="admin-v2">',
	`<body class="admin-v2"><div role="status" style="padding:8px 12px;background:#eef2ff;color:#3730a3;font:13px/1.5 sans-serif;text-align:center">${stageLabel}验收 · 合成测试资料</div>`));
for (const name of await fs.readdir(path.join(sourceRoot, 'local-admin'))) {
	if (name.endsWith('.mjs')) await fs.copyFile(path.join(sourceRoot, 'local-admin', name), path.join(root, 'local-admin', name));
}
await fs.cp(path.join(sourceRoot, 'site', 'src'), path.join(site, 'src'), {
	recursive: true,
	filter: (file) => !/[/\\]data[/\\](?:archive\.ts$|archive-translations(?:\.[^/\\]+)?\.json$|generated(?:[/\\]|$))/.test(file),
});
await fs.cp(path.join(sourceRoot, 'site', 'public'), path.join(site, 'public'), {
	recursive: true,
	filter: (file) => !/^archive(?:-responsive)?(?:[/\\]|$)/.test(path.relative(path.join(sourceRoot, 'site', 'public'), file)),
});
for (const name of ['package.json', 'package-lock.json', 'astro.config.mjs', 'tsconfig.json']) {
	if (await exists(path.join(sourceRoot, 'site', name))) await fs.copyFile(path.join(sourceRoot, 'site', name), path.join(site, name));
}
const dependencies = path.join(site, 'node_modules');
if (!(await exists(dependencies))) await fs.symlink(path.join(sourceRoot, 'site', 'node_modules'), dependencies, process.platform === 'win32' ? 'junction' : 'dir');
if (await fs.realpath(dependencies) !== await fs.realpath(path.join(sourceRoot, 'site', 'node_modules'))) throw new Error('验收依赖路径与现有依赖不一致。');

const paths = {
	LJM_PROJECT_ROOT: root, LJM_SITE_DIR: site, LJM_ADMIN_DATA_ROOT: privateRoot,
	LJM_ARCHIVE_DATA_DIR: path.join(root, 'archive-data'), LJM_DRAFT_DIR: path.join(privateRoot, 'drafts'),
	LJM_HISTORY_DIR: path.join(privateRoot, 'history'), LJM_RECYCLE_DIR: path.join(privateRoot, 'recycle-bin'),
	LJM_INBOX_DIR: path.join(privateRoot, 'inbox'), LJM_UPLOAD_STAGING_DIR: path.join(privateRoot, 'upload-staging'),
	LJM_SUBMISSION_DATA_DIR: path.join(privateRoot, 'submissions'), LJM_ACCOUNT_DATA_DIR: path.join(privateRoot, 'accounts'),
	LJM_PUBLIC_RELEASES_DIR: path.join(root, 'site-releases'), LJM_PUBLIC_LIVE_LINK: path.join(root, 'site-releases', 'live'),
};
for (const [key, directory] of Object.entries(paths)) {
	if (!inside(outputRoot, directory)) throw new Error(`${key} 未隔离。`);
	if (key !== 'LJM_PUBLIC_LIVE_LINK') await fs.mkdir(directory, { recursive: true });
}
await fs.mkdir(path.join(privateRoot, 'translations'), { recursive: true });
await fs.mkdir(path.join(site, 'src', 'data', 'generated'), { recursive: true });
await fs.copyFile(path.join(sourceRoot, 'archive-data', 'metadata-template.json'), path.join(paths.LJM_ARCHIVE_DATA_DIR, 'metadata-template.json'));

const initialized = path.join(privateRoot, 'sample-initialized.json');
const archiveSource = path.join(site, 'src', 'data', 'archive.ts');
if (!(await exists(archiveSource))) await fs.writeFile(archiveSource, "export const archiveItems = [];\n");
if (!(await exists(initialized))) {
	const sharp = createRequire(new URL('../site/package.json', import.meta.url))('sharp');
	const base = (type, seq, extra = {}) => ({
		core: { record_status: 'SUS', item_id: `LJM-20000101-${type}-${seq}`, accession_date: '2000-01-01',
			object_type: type, title: `界面验收样例 ${seq}`, date_display: '年代未知', batch_id: '手机界面合成样例',
			privacy_level: 'Y', rights_status: 'UNK', research_status: 'R0', evidence_level: 'D', evidence_basis: '程序生成的几何图形，仅作界面验收。',
			digitization_status: 'DG0', transcription_status: 'TX0', use_status: 'U0', physical_location: '隔离验收目录',
			created_date: '2000-01-01', publication_file_path: [], ...extra },
		metadata: { schema: ['PHO', 'ALB'].includes(type) ? 'photo' : 'common', dimensions: {} },
		public_view: { description: '虚构测试资料，仅有程序绘制的几何图形，不含真实人物或档案。',
			transcription: '保留完整资料验证文字。', tags: ['界面验收'], image_descriptions: [] },
	});
	for (let index = 1; index <= 19; index++) {
		const seq = String(index).padStart(3, '0');
		const item = base('LET', seq, index === 1 ? { title: '几何图形 · 手机维护验收', date_display: '2000年', country: '中国',
			updated_date: '2026-10-18', record_status: 'ACT', privacy_level: 'G', use_status: 'U3' } : {});
		if (index === 1) {
			for (let image = 1; image <= 3; image++) {
				const name = image === 1 ? 'front-public.jpg' : image === 2 ? 'back-public.jpg' : 'detail-01-public.jpg';
				const svg = `<svg width="800" height="600" xmlns="http://www.w3.org/2000/svg"><rect width="800" height="600" fill="#f1f5fb"/><rect x="100" y="100" width="600" height="400" rx="36" fill="${['#c7d2fe', '#a7d9cc', '#f6d2ac'][image - 1]}"/><circle cx="400" cy="300" r="${65 + image * 20}" fill="#4f46e5"/><path d="M130 480 L350 170 L650 480Z" fill="#fff" opacity=".65"/></svg>`;
				const buffer = await sharp(Buffer.from(svg)).jpeg({ quality: 75 }).toBuffer();
				for (const directory of [path.join(paths.LJM_INBOX_DIR, item.core.item_id), path.join(site, 'public', 'archive', item.core.item_id)]) {
					await fs.mkdir(directory, { recursive: true }); await fs.writeFile(path.join(directory, name), buffer);
				}
				item.core.publication_file_path.push(`/archive/${item.core.item_id}/${name}`);
				item.public_view.image_descriptions.push(`合成几何图形 ${image}：无真实档案内容。`);
			}
		}
		await fs.writeFile(path.join(paths.LJM_ARCHIVE_DATA_DIR, `${item.core.item_id}.json`), JSON.stringify(item, null, 2));
	}
	for (const [type, seq, position] of [['ALB', '001', ''], ['PHO', '001', '1'], ['PHO', '002', '2']]) {
		const item = base(type, seq, { album_id: '手机验收样例册', original_position: position });
		await fs.writeFile(path.join(paths.LJM_ARCHIVE_DATA_DIR, `${item.core.item_id}.json`), JSON.stringify(item, null, 2));
	}
	const draft = base('OTH', '001', { title: '继续整理 · 隔离草稿样例' });
	await fs.writeFile(path.join(paths.LJM_DRAFT_DIR, `${draft.core.item_id}.json`), JSON.stringify({ version: 2, saved_at: new Date().toISOString(), removed_images: [], record: draft }, null, 2));
	for (const suffix of ['', '.th', '.ja', '.ko', '.zh-Hant']) await fs.writeFile(path.join(site, 'src', 'data', `archive-translations${suffix}.json`), JSON.stringify({ schema_version: 1, items: {} }));
	await fs.writeFile(initialized, JSON.stringify({ synthetic: true, created: new Date().toISOString() }));
}
await fs.writeFile(path.join(outputRoot, 'isolation.json'), JSON.stringify({ sourceRoot, root, paths,
	translationDirectory: path.join(privateRoot, 'translations'), siteOutput: path.join(site, 'dist'),
	dependencies: '仅复用既有node_modules，无新增依赖', syntheticDataOnly: true }, null, 2));

const env = Object.fromEntries(Object.entries(process.env).filter(([key]) => !key.startsWith('LJM_') && key !== 'PUBLIC_SITE_URL'));
Object.assign(env, paths, { LJM_ADMIN_MODE: 'local', LJM_ADMIN_HOST: '127.0.0.1', LJM_ADMIN_PORT: port, LJM_MAIL_TRANSPORT: 'file' });
const serverFile = path.join(root, 'local-admin', 'server.mjs');
const run = (file, args, cwd = root) => new Promise((resolve, reject) => {
	const child = spawn(file, args, { cwd, env, windowsHide: true, stdio: 'inherit' });
	child.once('error', reject); child.once('exit', (code) => code === 0 ? resolve() : reject(new Error(`子命令退出：${code}`)));
});
await run(process.execPath, [serverFile, '--sync-site-data']);
if (process.argv.includes('--build')) {
	await run(process.platform === 'win32' ? (process.env.ComSpec || 'cmd.exe') : 'npm',
		process.platform === 'win32' ? ['/d', '/s', '/c', 'npm run build'] : ['run', 'build'], site);
} else if (!process.argv.includes('--prepare-only')) {
	console.log(`手机维护${stageLabel}隔离样例：http://127.0.0.1:${port}/admin/`);
	console.log('仅使用合成资料；本地4173与线上数据不参与验收。');
	await run(process.execPath, [serverFile]);
}
