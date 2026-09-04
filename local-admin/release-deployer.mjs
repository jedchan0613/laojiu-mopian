import fs from 'node:fs/promises';
import { constants as fsConstants } from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';

const safeReleaseNamePattern = /^\d{8}-\d{6}-admin-[a-f0-9]{8}$/;

const pathIsInside = (parent, candidate) => {
	const relative = path.relative(path.resolve(parent), path.resolve(candidate));
	return relative === '' || (!relative.startsWith('..') && !path.isAbsolute(relative));
};

const timestamp = (date) => {
	const parts = new Intl.DateTimeFormat('en-CA', {
		timeZone: 'Asia/Shanghai', year: 'numeric', month: '2-digit', day: '2-digit',
		hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
	}).formatToParts(date).reduce((result, part) => ({ ...result, [part.type]: part.value }), {});
	return `${parts.year}${parts.month}${parts.day}-${parts.hour}${parts.minute}${parts.second}`;
};

const requireDirectory = async (directory, label) => {
	let stat;
	try {
		stat = await fs.stat(directory);
	} catch {
		throw new Error(`${label}不存在或无法读取：${directory}`);
	}
	if (!stat.isDirectory()) throw new Error(`${label}不是目录：${directory}`);
};

const copyPublishedTree = async (sourceDirectory, destinationDirectory) => {
	for (const entry of await fs.readdir(sourceDirectory, { withFileTypes: true })) {
		const sourcePath = path.join(sourceDirectory, entry.name);
		const destinationPath = path.join(destinationDirectory, entry.name);
		if (entry.isSymbolicLink()) throw new Error(`公开构建中不允许出现软链接：${entry.name}`);
		if (entry.isDirectory()) {
			await fs.mkdir(destinationPath, { mode: 0o755 });
			await fs.chmod(destinationPath, 0o755);
			await copyPublishedTree(sourcePath, destinationPath);
		} else if (entry.isFile()) {
			await fs.copyFile(sourcePath, destinationPath, fsConstants.COPYFILE_EXCL);
			await fs.chmod(destinationPath, 0o644);
		}
		else throw new Error(`公开构建中出现了不支持的文件类型：${entry.name}`);
	}
};

export const readLiveRelease = async (releasesDirectory, liveLink) => {
	const linkStat = await fs.lstat(liveLink).catch(() => null);
	if (!linkStat?.isSymbolicLink()) throw new Error(`公开网站当前版本不是软链接：${liveLink}`);
	const rawTarget = await fs.readlink(liveLink);
	const resolvedTarget = path.resolve(path.dirname(liveLink), rawTarget);
	if (!pathIsInside(releasesDirectory, resolvedTarget) || resolvedTarget === path.resolve(releasesDirectory)) {
		throw new Error('公开网站当前版本指向了版本目录之外，已停止切换。');
	}
	await requireDirectory(resolvedTarget, '公开网站当前版本');
	return { rawTarget, resolvedTarget, releaseName: path.basename(resolvedTarget) };
};

export const createReleaseDeployer = ({
	sourceDirectory,
	releasesDirectory,
	liveLink,
	now = () => new Date(),
	randomId = () => randomUUID().slice(0, 8),
}) => ({
	deploy: async () => {
		await requireDirectory(sourceDirectory, '待发布网站构建目录');
		await requireDirectory(releasesDirectory, '公开网站版本目录');
		if (path.dirname(path.resolve(liveLink)) !== path.resolve(releasesDirectory)) {
			throw new Error('公开网站切换软链接必须直接位于版本目录中。');
		}
		const previous = await readLiveRelease(releasesDirectory, liveLink);
		const releaseName = `${timestamp(now())}-admin-${randomId()}`;
		if (!safeReleaseNamePattern.test(releaseName)) throw new Error('新公开版本名称无效。');
		const releaseDirectory = path.join(releasesDirectory, releaseName);
		const temporaryLink = path.join(releasesDirectory, `.live-next-${randomUUID().slice(0, 8)}`);
		let releaseCreated = false;
		try {
			await fs.mkdir(releaseDirectory, { mode: 0o755 });
			await fs.chmod(releaseDirectory, 0o755);
			releaseCreated = true;
			await copyPublishedTree(sourceDirectory, releaseDirectory);
			for (const requiredFile of ['index.html', '404.html', 'robots.txt', 'sitemap.xml']) {
				const stat = await fs.stat(path.join(releaseDirectory, requiredFile)).catch(() => null);
				if (!stat?.isFile()) throw new Error(`新公开版本缺少 ${requiredFile}。`);
			}
			const linkTarget = process.platform === 'win32' ? releaseDirectory : releaseName;
			await fs.symlink(linkTarget, temporaryLink, process.platform === 'win32' ? 'junction' : 'dir');
		} catch (error) {
			await fs.rm(temporaryLink, { force: true }).catch(() => {});
			if (releaseCreated) await fs.rm(releaseDirectory, { recursive: true, force: true }).catch(() => {});
			throw new Error(`新公开版本准备失败，当前网站没有切换：${error.message}`);
		}

		try {
			await fs.rename(temporaryLink, liveLink);
		} catch (error) {
			await fs.rm(temporaryLink, { force: true }).catch(() => {});
			await fs.rm(releaseDirectory, { recursive: true, force: true }).catch(() => {});
			throw new Error(`新公开版本切换失败，当前网站仍保留原版本：${error.message}`);
		}

		return {
			releaseName,
			releaseDirectory,
			previousReleaseName: previous.releaseName,
		};
	},
});
