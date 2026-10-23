// 公开构建收尾：压缩 dist/archive 中过大的发布副本图片。
// 这些全尺寸图只被「下载发布副本」功能按需获取，页面展示一律使用 archive-responsive 的 webp。
// 超过阈值的副本在构建产物中原地压缩（上限 2560px、jpeg/webp q80），下载链接与文件名保持不变；
// site/public/archive 中的发布副本源文件不做任何改动，每次构建由源文件重新生成。
// 任何单个文件处理失败都保留原样，不影响构建。
// 试运行（不写任何文件、不需要 sharp）：node scripts/compress-publication-copies.mjs --dry-run

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const siteDirectory = fileURLToPath(new URL('..', import.meta.url));
const distArchiveDirectory = path.join(siteDirectory, 'dist', 'archive');
const dryRun = process.argv.includes('--dry-run');

const byteThreshold = 1.5 * 1024 * 1024;
const maxDimension = 2560;
const publicationImagePattern = /^(front-public|back-public|detail-(0[1-9]|[1-9]\d)-public)\.(jpe?g|png|webp)$/i;

const isInside = (parent, candidate) => {
	const relative = path.relative(parent, candidate);
	return relative && !relative.startsWith('..') && !path.isAbsolute(relative);
};

const archiveStat = await fs.stat(distArchiveDirectory).catch(() => null);
if (!archiveStat?.isDirectory()) {
	console.log('发布副本压缩：dist/archive 不存在，跳过。');
	process.exit(0);
}

const sharp = dryRun ? null : (await import('sharp')).default;
let scanned = 0;
let compressed = 0;
let keptOriginal = 0;
let beforeBytes = 0;
let afterBytes = 0;

const itemDirectories = await fs.readdir(distArchiveDirectory, { withFileTypes: true });
for (const itemEntry of itemDirectories) {
	if (!itemEntry.isDirectory()) continue;
	const itemDirectory = path.join(distArchiveDirectory, itemEntry.name);
	if (!isInside(distArchiveDirectory, itemDirectory)) {
		throw new Error(`发布副本压缩路径不安全：${itemDirectory}`);
	}
	const files = await fs.readdir(itemDirectory, { withFileTypes: true });
	for (const fileEntry of files) {
		if (!fileEntry.isFile() || !publicationImagePattern.test(fileEntry.name)) continue;
		const filePath = path.join(itemDirectory, fileEntry.name);
		const stat = await fs.stat(filePath);
		if (stat.size <= byteThreshold) continue;
		scanned += 1;
		beforeBytes += stat.size;
		if (dryRun) continue;
		const extension = fileEntry.name.split('.').at(-1).toLowerCase();
		const temporaryPath = `${filePath}.compress-tmp`;
		try {
			// 先关闭源文件句柄，避免 Windows 上 sharp 持有句柄使原子替换失败。
			const image = sharp(await fs.readFile(filePath), { limitInputPixels: false }).rotate();
			const metadata = await image.metadata();
			const resizeNeeded = Math.max(metadata.width ?? 0, metadata.height ?? 0) > maxDimension;
			let pipeline = resizeNeeded
				? image.resize({ width: maxDimension, height: maxDimension, fit: 'inside', withoutEnlargement: true })
				: image;
			if (extension === 'png') {
				pipeline = pipeline.png({ compressionLevel: 9, palette: false });
			} else if (extension === 'webp') {
				pipeline = pipeline.webp({ quality: 80 });
			} else {
				pipeline = pipeline.jpeg({ quality: 80, progressive: true, mozjpeg: true });
			}
			const buffer = await pipeline.toBuffer();
			if (buffer.length >= stat.size) {
				keptOriginal += 1;
				afterBytes += stat.size;
				continue;
			}
			await fs.writeFile(temporaryPath, buffer);
			await fs.rename(temporaryPath, filePath);
			compressed += 1;
			afterBytes += buffer.length;
		} catch (error) {
			keptOriginal += 1;
			afterBytes += stat.size;
			console.warn(`发布副本压缩失败，已保留原文件：${filePath}（${error.message}）`);
		} finally {
			await fs.rm(temporaryPath, { force: true });
		}
	}
}

const toMb = (bytes) => (bytes / 1024 / 1024).toFixed(1);
if (dryRun) {
	console.log(`发布副本压缩（试运行）：${scanned} 个文件超过 ${toMb(byteThreshold)} MB，合计 ${toMb(beforeBytes)} MB。`);
} else {
	console.log(
		`发布副本压缩：检查 ${scanned} 个超限文件，压缩 ${compressed} 个，保留原样 ${keptOriginal} 个，` +
		`占用从 ${toMb(beforeBytes)} MB 降至 ${toMb(afterBytes)} MB。`,
	);
}
