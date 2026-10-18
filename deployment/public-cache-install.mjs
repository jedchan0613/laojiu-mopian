import fs from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';
import { preparePublicCacheConfig, publicCacheName, errorCacheName } from './public-cache-config.mjs';
import { verifyPublicCache } from './verify-public-cache.mjs';

const execute = promisify(execFile);
const snapshot = async file => {
	try { const stat = await fs.lstat(file); if (!stat.isFile() || stat.isSymbolicLink()) throw new Error(`配置目标不是普通文件：${file}`); return { bytes: await fs.readFile(file), mode: stat.mode & 0o777, uid: stat.uid, gid: stat.gid }; }
	catch (error) { if (error.code === 'ENOENT') return null; throw error; }
};
const replace = async (file, bytes, metadata) => {
	const temporary = `${file}.cache-next-${randomUUID()}`;
	const mode = metadata?.mode ?? 0o644;
	try {
		await fs.writeFile(temporary, bytes, { mode, flag: 'wx' });
		// 不让调用者的umask改变Caddy可读性；替换和回退都保留原所有者/权限。
		if (metadata && process.platform !== 'win32') await fs.chown(temporary, metadata.uid, metadata.gid);
		await fs.chmod(temporary, mode);
		await fs.rename(temporary, file);
	}
	finally { await fs.rm(temporary, { force: true }); }
};

// 可注入校验/重载/HTTP核验，只为合成目录的失败演练；CLI路径仍固定为现有部署位置。
export async function installPublicCache({ configFile, snippetsDirectory, sourceDirectory, backupDirectory, validate, reload, verify, apply = false }) {
	const before = new Map();
	for (const file of [configFile, path.join(snippetsDirectory, publicCacheName), path.join(snippetsDirectory, errorCacheName)]) before.set(file, await snapshot(file));
	if (!before.get(configFile)) throw new Error('没有找到原Caddy配置。');
	await fs.mkdir(backupDirectory, { mode: 0o700 });
	const staged = path.join(backupDirectory, 'staged');
	await fs.mkdir(staged, { mode: 0o700 });
	const rules = new Map([
		[publicCacheName, await fs.readFile(path.join(sourceDirectory, 'Caddyfile.public-cache.example'))],
		[errorCacheName, await fs.readFile(path.join(sourceDirectory, 'Caddyfile.error-cache.example'))],
	]);
	for (const [name, bytes] of rules) await fs.writeFile(path.join(staged, name), bytes, { mode: 0o600, flag: 'wx' });
	const original = before.get(configFile).bytes.toString('utf8');
	const candidate = path.join(staged, 'Caddyfile');
	await fs.writeFile(candidate, preparePublicCacheConfig(original, staged.replaceAll('\\', '/')), { mode: 0o600, flag: 'wx' });
	await validate(candidate);
	if (!apply) return { applied: false, candidate, backupDirectory };
	const manifest = [];
	for (const [file, old] of before) {
		const name = path.basename(file) + '.before';
		if (old) await fs.writeFile(path.join(backupDirectory, name), old.bytes, { mode: 0o600, flag: 'wx' });
		manifest.push({ target: file, backup: old ? name : null, mode: old?.mode ?? null, uid: old?.uid ?? null, gid: old?.gid ?? null });
	}
	await fs.writeFile(path.join(backupDirectory, 'rollback-manifest.json'), JSON.stringify(manifest, null, 2), { mode: 0o600, flag: 'wx' });
	// 校验期间若有人修改配置，停止而不是覆盖新内容。
	for (const [file, old] of before) {
		const current = await snapshot(file);
		if ((old === null) !== (current === null) || (old && !old.bytes.equals(current.bytes))) throw new Error('配置在检查期间发生变化，请重新核对。');
	}
	let reloadAttempted = false;
	try {
		for (const [name, bytes] of rules) { const target = path.join(snippetsDirectory, name); await replace(target, bytes, before.get(target)); }
		await replace(configFile, Buffer.from(preparePublicCacheConfig(original, snippetsDirectory.replaceAll('\\', '/'))), before.get(configFile));
		await validate(configFile);
		reloadAttempted = true;
		await reload();
		await verify();
		return { applied: true, backupDirectory };
	} catch (error) {
		try {
			for (const [file, old] of before) {
				if (old) await replace(file, old.bytes, old);
				else await fs.rm(file, { force: true }); // 只移除本次新建、原先不存在的两份缓存配置。
			}
			if (reloadAttempted) { await validate(configFile); await reload(); }
		} catch (rollbackError) { throw new AggregateError([error, rollbackError], `安装失败且回退未完成，请依据${backupDirectory}人工恢复。`); }
		throw new Error(`缓存安装未完成，已恢复原配置；备份：${backupDirectory}`, { cause: error });
	}
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
	const mode = process.argv[2] ?? '--check';
	if (!['--check', '--apply'].includes(mode) || process.argv.length > 3) throw new Error('用法：public-cache-install.mjs --check 或 --apply。默认只检查，不上线。');
	if (process.getuid?.() !== 0) throw new Error('读取正式Caddy配置需要sudo；默认检查仍不会重载服务。');
	const backupDirectory = `/srv/laojiumopian-admin/build-work/public-cache-${new Date().toISOString().replace(/[:.]/g, '-')}-${randomUUID()}`;
	const sourceDirectory = path.dirname(fileURLToPath(import.meta.url));
	const result = await installPublicCache({
		configFile: '/etc/caddy/Caddyfile', snippetsDirectory: '/etc/caddy', sourceDirectory, backupDirectory,
		apply: mode === '--apply',
		validate: async file => {
			const result = await execute('caddy', ['validate', '--config', file, '--adapter', 'caddyfile']);
			await fs.appendFile(path.join(backupDirectory, 'validation.log'), result.stdout + result.stderr, { mode: 0o600 });
		},
		reload: () => execute('systemctl', ['reload', 'caddy']),
		verify: () => verifyPublicCache({ baseUrl: 'https://laojiumopian.com', reportFile: path.join(backupDirectory, 'http-verification.json'), adminOrigin: 'http://127.0.0.1:4174' }),
	});
	console.log(JSON.stringify(result));
	console.log(result.applied ? '缓存规则已应用并核验，配置备份已保留。' : '仅检查通过，未改正式配置或重载Caddy；全部五点完成后再单独执行--apply。');
}
