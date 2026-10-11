import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { join } from 'node:path';
import { fontace } from 'fontace';

export const pointsInRanges = (ranges) => {
	const points = new Set();
	for (const [start, end] of ranges) {
		for (let point = start; point <= end; point += 1) points.add(point);
	}
	return points;
};

export const parseFontRanges = (value) => [...value.matchAll(/U\+([\da-f]+)(?:-([\da-f]+))?/gi)]
	.map((match) => [Number.parseInt(match[1], 16), Number.parseInt(match[2] ?? match[1], 16)]);

// 字库必须真实含字、CSS确实分配该字，且完整继承官方源字体；构建期间不联网。
export const readCompleteFontCoverage = async (directory, legacyPoints, check) => {
	const manifest = JSON.parse(await readFile(join(directory, 'manifest.json'), 'utf8'));
	const styles = await readFile(join(directory, 'complete.css'), 'utf8');
	const faces = new Map();
	for (const match of styles.matchAll(/@font-face\s*\{([^}]+)\}/g)) {
		const filename = match[1].match(/src:\s*url\('\.\/([^']+)'\)/)?.[1];
		if (!filename) continue;
		check(!faces.has(filename), `完整字库CSS重复引用：${filename}`);
		check(/font-family:\s*'LJM Brand Serif'\s*;/.test(match[1]) && /font-style:\s*normal\s*;/.test(match[1]), `完整字库CSS字体家族或样式错误：${filename}`);
		check(/font-weight:\s*200\s+900\s*;/.test(match[1]), `完整字库字重配置不完整：${filename}`);
		const ranges = match[1].match(/unicode-range:\s*([^;]+);/)?.[1] ?? '';
		faces.set(filename, pointsInRanges(parseFontRanges(ranges)));
	}
	check(faces.size === manifest.shards.length, '完整字库分片数量与CSS不一致。');
	const points = new Set(legacyPoints);
	// 逐片读取，避免将全部字库同时解压而增加服务器构建内存。
	for (const shard of manifest.shards) {
		if (!/^noto-serif-sc-full-[\da-f]{4,6}\.woff2$/.test(shard.file)) throw new Error('完整字库分片文件名无效。');
		const buffer = await readFile(join(directory, shard.file));
		check(createHash('sha256').update(buffer).digest('hex') === shard.sha256, `完整字库文件校验失败：${shard.file}`);
		const metadata = fontace(buffer);
		check(metadata.family.startsWith('Noto Serif SC') && metadata.style === 'normal', `完整字库实际字体家族或样式不匹配：${shard.file}`);
		check(metadata.isVariable && metadata.weight === '200 900', `完整字库实际可变字重不匹配：${shard.file}`);
		const actual = pointsInRanges(parseFontRanges(metadata.unicodeRangeArray.join(',')));
		// 当前fontace把cmap格式4的终止段U+FFFF也列为字形；它是非字符，不是实际cmap映射。
		actual.delete(0xFFFF);
		const expected = pointsInRanges(shard.ranges);
		const declared = faces.get(shard.file) ?? new Set();
		check(actual.size === expected.size && [...expected].every((point) => actual.has(point)), `完整字库实际字形与清单不一致：${shard.file}`);
		check(actual.size === declared.size && [...actual].every((point) => declared.has(point)), `完整字库CSS未正确分配字形：${shard.file}`);
		check([...actual].every((point) => !points.has(point)), `完整字库与已有字体分配重叠：${shard.file}`);
		for (const point of actual) {
			if (declared.has(point)) points.add(point);
		}
	}
	const sourcePoints = pointsInRanges(manifest.source_ranges);
	check(sourcePoints.size === manifest.source_character_count, '完整源字体字符数量与清单不一致。');
	check([...sourcePoints].every((point) => points.has(point)), '完整字库遗漏官方源字体字符。');
	const basicHan = pointsInRanges([[0x3400, 0x4DBF], [0x4E00, 0x9FFF]]);
	check([...basicHan].every((point) => points.has(point)), '完整字库遗漏汉字基本区或扩展A区。');
	return points;
};
