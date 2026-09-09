import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const siteDirectory = fileURLToPath(new URL('..', import.meta.url));
const distDirectory = path.join(siteDirectory, 'dist');
const retiredPublicPaths = [
	'/audio/lullaby-summer-cicadas.ogg',
	'/audio/last-reunion.mp3',
];

const isInside = (parent, candidate) => {
	const relative = path.relative(parent, candidate);
	return relative && !relative.startsWith('..') && !path.isAbsolute(relative);
};
const listFiles = async (directory) => {
	const entries = await fs.readdir(directory, { withFileTypes: true });
	const nested = await Promise.all(entries.map((entry) => {
		const entryPath = path.join(directory, entry.name);
		return entry.isDirectory() ? listFiles(entryPath) : [entryPath];
	}));
	return nested.flat();
};

const buildFiles = await listFiles(distDirectory);
const referenceFiles = buildFiles.filter((filePath) => /\.(?:html|css|js|json|xml|txt)$/i.test(filePath));
const referenceText = (await Promise.all(referenceFiles.map((filePath) => fs.readFile(filePath, 'utf8')))).join('\n');
let removedBytes = 0;

for (const publicPath of retiredPublicPaths) {
	if (referenceText.includes(publicPath)) {
		throw new Error(`已下线素材仍被公开页面引用，停止清理：${publicPath}`);
	}
	const targetPath = path.resolve(distDirectory, publicPath.replace(/^\/+/, ''));
	if (!isInside(distDirectory, targetPath)) throw new Error(`公开构建清理路径不安全：${targetPath}`);
	const stat = await fs.stat(targetPath).catch(() => null);
	if (!stat?.isFile()) continue;
	removedBytes += stat.size;
	await fs.rm(targetPath, { force: true });
}

const audioDirectory = path.join(distDirectory, 'audio');
const remainingAudioEntries = await fs.readdir(audioDirectory).catch(() => []);
if (remainingAudioEntries.length === 0) await fs.rmdir(audioDirectory).catch(() => {});

console.log(`公开构建清理：移除 ${retiredPublicPaths.length} 个已下线音频副本，减少 ${(removedBytes / 1024 / 1024).toFixed(1)} MB。`);
