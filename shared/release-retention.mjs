// 仅整理独立的部署版本；业务历史、草稿、备份不属于版本保留策略。
import fs from 'node:fs/promises';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execute = promisify(execFile);
const privateDirectories = ['drafts', 'history', 'recycle-bin', 'accounts', 'submissions', 'operations', 'uploads', 'translations'];

export const releaseTimestamp = (name) => {
	const match = /^(\d{8})-?(\d{6})-[a-z0-9]+(?:-[a-z0-9]+)*$/.exec(name);
	if (!match) return null;
	const digits = match[1] + match[2];
	const iso = `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6, 8)}T${digits.slice(8, 10)}:${digits.slice(10, 12)}:${digits.slice(12, 14)}Z`;
	const date = new Date(iso);
	return Number.isNaN(date.valueOf()) || date.toISOString().slice(0, 19) !== iso.slice(0, 19) ? null : digits;
};

export const pruneReleases = async ({ releasesDirectory, liveLink, kind, keep = 3, protectedDirectories = [], apply = false }) => {
	if (!['admin', 'public'].includes(kind) || !Number.isInteger(keep) || keep < 3) throw new Error('版本保留参数无效，至少保留三个版本。');
	const root = path.resolve(releasesDirectory);
	const rootStat = await fs.lstat(root);
	if (!rootStat.isDirectory() || rootStat.isSymbolicLink() || await fs.realpath(root) !== root) throw new Error('版本目录必须是独立的真实目录。');
	const link = path.resolve(liveLink);
	if (kind === 'public' ? path.dirname(link) !== root : path.dirname(link) !== path.dirname(root)) throw new Error('当前版本链接位置异常。');
	const readActive = async () => {
		if (!(await fs.lstat(link)).isSymbolicLink()) throw new Error('当前版本必须使用链接。');
		const target = await fs.realpath(link);
		if (path.dirname(target) !== root || !(await fs.lstat(target)).isDirectory()) throw new Error('当前版本必须位于版本目录内部。');
		return target;
	};
	const initialActive = await readActive();
	const protectedPaths = new Set([initialActive]);
	for (const directory of protectedDirectories) {
		const resolved = path.resolve(directory);
		if (path.dirname(resolved) !== root) throw new Error('额外保护版本超出目录。');
		protectedPaths.add(resolved);
	}
	const candidates = (await fs.readdir(root, { withFileTypes: true }))
		.filter(entry => entry.isDirectory() && !entry.isSymbolicLink() && releaseTimestamp(entry.name))
		.map(entry => ({ name: entry.name, directory: path.join(root, entry.name), stamp: releaseTimestamp(entry.name) }))
		.sort((a, b) => b.stamp.localeCompare(a.stamp) || b.name.localeCompare(a.name));
	for (const release of candidates.slice(0, keep)) protectedPaths.add(release.directory);
	const result = { kept: [], removable: [], removed: [], skipped: [] };
	for (const release of candidates) {
		if (protectedPaths.has(release.directory)) { result.kept.push(release.name); continue; }
		const stat = await fs.lstat(release.directory);
		if (!stat.isDirectory() || stat.isSymbolicLink() || stat.dev !== rootStat.dev || await fs.realpath(release.directory) !== release.directory) throw new Error('待清理版本路径发生变化。');
		const marker = path.join(release.directory, kind === 'admin' ? 'site/package.json' : 'index.html');
		if (!(await fs.lstat(marker).catch(() => null))?.isFile()) { result.skipped.push(release.name); continue; }
		let privateData = false;
		for (const name of privateDirectories) {
			const directory = path.join(release.directory, 'local-admin', name);
			const privateStat = await fs.lstat(directory).catch(() => null);
			if (privateStat && (!privateStat.isDirectory() || (await fs.readdir(directory)).length)) privateData = true;
		}
		if (privateData) { result.skipped.push(release.name); continue; }
		result.removable.push(release.name);
		if (!apply) continue;
		// 再次检查当前链接；并发切换后的活动版本同样受到保护。
		if (await readActive() === release.directory) { result.kept.push(release.name); continue; }
		if (process.platform === 'linux') await execute('/usr/bin/rm', ['-rf', '--one-file-system', '--', release.directory]);
		else await fs.rm(release.directory, { recursive: true });
		result.removed.push(release.name);
	}
	return result;
};
