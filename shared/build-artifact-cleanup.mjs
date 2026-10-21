import fs from 'node:fs/promises';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execute = promisify(execFile);
const artifacts = ['app/site/dist', 'app/site/public/archive-responsive', 'app/site/node_modules', 'app/site/.astro'];
const inside = (root, candidate) => candidate === root || candidate.startsWith(`${root}${path.sep}`);

export const cleanTestBuild = async ({ buildRoot, job, protectedPaths = [], apply = false }) => {
	if (!/^[a-z][a-z0-9-]*-\d{8}(?:-?[a-zA-Z0-9]+)*$/.test(job)) throw new Error('维护作业名称无效。');
	const root = path.resolve(buildRoot);
	const directory = path.join(root, job);
	if (await fs.realpath(root) !== root || await fs.realpath(directory) !== directory) throw new Error('维护目录不能经过链接。');
	for (const target of protectedPaths) if (inside(directory, path.resolve(target))) throw new Error('维护作业仍被当前网站使用。');
	if (process.platform === 'linux') {
		for (const pid of (await fs.readdir('/proc')).filter(name => /^\d+$/.test(name) && Number(name) !== process.pid)) {
			const cwd = await fs.readlink(`/proc/${pid}/cwd`).catch(() => '');
			const command = await fs.readFile(`/proc/${pid}/cmdline`, 'utf8').catch(() => '');
			if (inside(directory, cwd) || command.includes(`${directory}/`)) throw new Error(`维护作业仍有进程使用（${pid}）。`);
		}
	}
	const result = { job, removable: [], removed: [], skipped: [] };
	for (const relative of artifacts) {
		const candidate = path.join(directory, relative);
		const stat = await fs.lstat(candidate).catch(() => null);
		if (!stat) continue;
		if (!stat.isDirectory() || stat.isSymbolicLink() || await fs.realpath(candidate) !== candidate) { result.skipped.push(relative); continue; }
		result.removable.push(relative);
		if (!apply) continue;
		if (process.platform === 'linux') await execute('/usr/bin/rm', ['-rf', '--one-file-system', '--', candidate]);
		else await fs.rm(candidate, { recursive: true });
		result.removed.push(relative);
	}
	return result;
};
