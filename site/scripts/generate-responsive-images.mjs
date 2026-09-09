import { createHash } from 'node:crypto';
import { createReadStream } from 'node:fs';
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
const generatorKey = `webp-q80-e4-${targetWidths.join('-')}-v1`;
const supportedImagePattern = /\.(?:jpe?g|png|webp)$/i;
const generatedVariantPattern = /-[1-9]\d*\.webp$/i;

const isInside = (parent, candidate) => {
	const relative = path.relative(parent, candidate);
	return relative !== '' && !relative.startsWith('..') && !path.isAbsolute(relative);
};

if (!isInside(publicDirectory, outputDirectory) || path.basename(outputDirectory) !== 'archive-responsive') {
	throw new Error('响应式图片输出目录不安全，已停止构建。');
}

const pathExists = async (target) => fs.access(target).then(() => true).catch(() => false);
const sha256 = async (filePath) => {
	const hash = createHash('sha256');
	for await (const chunk of createReadStream(filePath)) hash.update(chunk);
	return hash.digest('hex');
};
const readPreviousManifest = async () => {
	try {
		const parsed = JSON.parse(await fs.readFile(manifestPath, 'utf8'));
		return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
	} catch {
		return {};
	}
};
const expectedVariant = (itemId, stem, width) => ({
	filename: `${stem}-${width}.webp`,
	publicPath: `/archive-responsive/${itemId}/${stem}-${width}.webp`,
	filePath: path.join(outputDirectory, itemId, `${stem}-${width}.webp`),
});
const reusableEntry = async (entry, sourceHash, itemId, stem) => {
	if (!entry || entry.source_sha256 !== sourceHash || entry.generator !== generatorKey) return false;
	if (!Number.isInteger(entry.width) || entry.width <= 0 || !Number.isInteger(entry.height) || entry.height <= 0) return false;
	if (!Array.isArray(entry.variants)) return false;
	const expectedWidths = targetWidths.filter((width) => width < entry.width);
	if (entry.variants.length !== expectedWidths.length) return false;
	for (const width of expectedWidths) {
		const expected = expectedVariant(itemId, stem, width);
		const variant = entry.variants.find((candidate) => candidate?.width === width);
		if (!variant || variant.src !== expected.publicPath || !Number.isInteger(variant.height) || variant.height <= 0) return false;
		const stat = await fs.stat(expected.filePath).catch(() => null);
		if (!stat?.isFile() || stat.size <= 0) return false;
	}
	return true;
};
const listGeneratedFiles = async (directory) => {
	if (!(await pathExists(directory))) return [];
	const entries = await fs.readdir(directory, { withFileTypes: true });
	const nested = await Promise.all(entries.map((entry) => {
		const entryPath = path.join(directory, entry.name);
		return entry.isDirectory() ? listGeneratedFiles(entryPath) : [entryPath];
	}));
	return nested.flat();
};

await fs.mkdir(outputDirectory, { recursive: true });
await fs.mkdir(path.dirname(manifestPath), { recursive: true });

const previousManifest = await readPreviousManifest();
const manifest = {};
const expectedOutputFiles = new Set();
let generatedCount = 0;
let reusedCount = 0;
let removedCount = 0;

if (await pathExists(archiveDirectory)) {
	const itemEntries = await fs.readdir(archiveDirectory, { withFileTypes: true });
	for (const itemEntry of itemEntries.filter((entry) => entry.isDirectory()).sort((a, b) => a.name.localeCompare(b.name))) {
		const sourceDirectory = path.join(archiveDirectory, itemEntry.name);
		const targetDirectory = path.join(outputDirectory, itemEntry.name);
		const fileEntries = await fs.readdir(sourceDirectory, { withFileTypes: true });
		for (const fileEntry of fileEntries.filter((entry) => entry.isFile() && supportedImagePattern.test(entry.name)).sort((a, b) => a.name.localeCompare(b.name))) {
			const sourcePath = path.join(sourceDirectory, fileEntry.name);
			const sourcePublicPath = `/archive/${itemEntry.name}/${fileEntry.name}`;
			const stem = path.basename(fileEntry.name, path.extname(fileEntry.name));
			const sourceHash = await sha256(sourcePath);
			const previousEntry = previousManifest[sourcePublicPath];

			if (await reusableEntry(previousEntry, sourceHash, itemEntry.name, stem)) {
				manifest[sourcePublicPath] = previousEntry;
				for (const variant of previousEntry.variants) {
					expectedOutputFiles.add(path.resolve(siteDirectory, variant.src.replace(/^\/+/, 'public/')));
				}
				reusedCount += 1;
				continue;
			}

			const metadata = await sharp(sourcePath).metadata();
			if (!metadata.width || !metadata.height) throw new Error(`无法读取发布图片尺寸：${sourcePath}`);

			await fs.mkdir(targetDirectory, { recursive: true });
			const variants = [];
			for (const width of targetWidths.filter((candidate) => candidate < metadata.width)) {
				const expected = expectedVariant(itemEntry.name, stem, width);
				const result = await sharp(sourcePath)
					.rotate()
					.resize({ width, withoutEnlargement: true })
					.webp({ quality: 80, effort: 4 })
					.toFile(expected.filePath);
				variants.push({
					src: expected.publicPath,
					width: result.width,
					height: result.height,
				});
				expectedOutputFiles.add(path.resolve(expected.filePath));
			}

			manifest[sourcePublicPath] = {
				width: metadata.width,
				height: metadata.height,
				source_sha256: sourceHash,
				generator: generatorKey,
				variants,
			};
			generatedCount += 1;
		}
	}
}

// 只清理专用生成目录内、已不再对应任何发布图片的网页 WebP 副本。
for (const filePath of await listGeneratedFiles(outputDirectory)) {
	if (!isInside(outputDirectory, filePath) || !generatedVariantPattern.test(path.basename(filePath))) continue;
	if (expectedOutputFiles.has(path.resolve(filePath))) continue;
	await fs.rm(filePath, { force: true });
	removedCount += 1;
}
for (const entry of await fs.readdir(outputDirectory, { withFileTypes: true })) {
	if (!entry.isDirectory()) continue;
	const directory = path.join(outputDirectory, entry.name);
	if ((await fs.readdir(directory)).length === 0) await fs.rmdir(directory);
}

await fs.writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
console.log(`响应式图片完成：新生成 ${generatedCount} 张，复用 ${reusedCount} 张，清理 ${removedCount} 个失效网页副本。`);
