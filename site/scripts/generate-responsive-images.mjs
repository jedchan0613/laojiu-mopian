import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const siteDirectory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const publicDirectory = path.join(siteDirectory, 'public');
const archiveDirectory = path.join(publicDirectory, 'archive');
const outputDirectory = path.join(publicDirectory, 'archive-responsive');
const manifestPath = path.join(siteDirectory, 'src', 'data', 'generated', 'image-manifest.json');
const targetWidths = [320, 640, 1280, 1920];
const supportedImagePattern = /\.(?:jpe?g|png|webp)$/i;

const isInside = (parent, candidate) => {
	const relative = path.relative(parent, candidate);
	return relative !== '' && !relative.startsWith('..') && !path.isAbsolute(relative);
};

if (!isInside(publicDirectory, outputDirectory) || path.basename(outputDirectory) !== 'archive-responsive') {
	throw new Error('响应式图片输出目录不安全，已停止构建。');
}

const pathExists = async (target) => fs.access(target).then(() => true).catch(() => false);
const manifest = {};

// 这里只清理并重建可再生成的网页缩略副本；原发布图片始终保留在 public/archive。
await fs.rm(outputDirectory, { recursive: true, force: true });
await fs.mkdir(outputDirectory, { recursive: true });
await fs.mkdir(path.dirname(manifestPath), { recursive: true });

if (await pathExists(archiveDirectory)) {
	const itemEntries = await fs.readdir(archiveDirectory, { withFileTypes: true });
	for (const itemEntry of itemEntries.filter((entry) => entry.isDirectory()).sort((a, b) => a.name.localeCompare(b.name))) {
		const sourceDirectory = path.join(archiveDirectory, itemEntry.name);
		const targetDirectory = path.join(outputDirectory, itemEntry.name);
		const fileEntries = await fs.readdir(sourceDirectory, { withFileTypes: true });
		for (const fileEntry of fileEntries.filter((entry) => entry.isFile() && supportedImagePattern.test(entry.name)).sort((a, b) => a.name.localeCompare(b.name))) {
			const sourcePath = path.join(sourceDirectory, fileEntry.name);
			const metadata = await sharp(sourcePath).metadata();
			if (!metadata.width || !metadata.height) throw new Error(`无法读取发布图片尺寸：${sourcePath}`);

			await fs.mkdir(targetDirectory, { recursive: true });
			const sourcePublicPath = `/archive/${itemEntry.name}/${fileEntry.name}`;
			const stem = path.basename(fileEntry.name, path.extname(fileEntry.name));
			const variants = [];
			for (const width of targetWidths.filter((candidate) => candidate < metadata.width)) {
				const filename = `${stem}-${width}.webp`;
				const targetPath = path.join(targetDirectory, filename);
				const result = await sharp(sourcePath)
					.rotate()
					.resize({ width, withoutEnlargement: true })
					.webp({ quality: 80, effort: 4 })
					.toFile(targetPath);
				variants.push({
					src: `/archive-responsive/${itemEntry.name}/${filename}`,
					width: result.width,
					height: result.height,
				});
			}

			manifest[sourcePublicPath] = {
				width: metadata.width,
				height: metadata.height,
				variants,
			};
		}
	}
}

await fs.writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
console.log(`已生成 ${Object.keys(manifest).length} 张发布图片的响应式副本。`);
