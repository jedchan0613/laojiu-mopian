import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, mkdtemp, copyFile, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { fontace } from '../../site/node_modules/fontace/dist/index.js';
import { parseFontRanges, pointsInRanges, readCompleteFontCoverage } from '../../site/scripts/complete-font-coverage.mjs';

const fontRoot = fileURLToPath(new URL('../../site/src/assets/fonts/', import.meta.url));
const completeRoot = join(fontRoot, 'complete');
const legacyPoints = new Set();
for (const name of ['noto-serif-sc-base.woff2', 'noto-serif-sc-extended.woff2', 'noto-serif-sc-public-supplement.woff2', 'noto-serif-sc-brand-supplement.woff']) {
	const font = fontace(await readFile(join(fontRoot, name)));
	for (const point of pointsInRanges(parseFontRanges(font.unicodeRangeArray.join(',')))) legacyPoints.add(point);
}

test('完整字库真实覆盖基本汉字、扩展A及既有字形，且CSS路由完整', async () => {
	const issues = [];
	const points = await readCompleteFontCoverage(completeRoot, legacyPoints, (pass, message) => { if (!pass) issues.push(message); });
	assert.deepEqual(issues, []);
	for (const character of '杯闹胸桌繁體龘') assert.ok(points.has(character.codePointAt(0)));
	for (let point = 0x3400; point <= 0x4DBF; point += 1) assert.ok(points.has(point));
	for (let point = 0x4E00; point <= 0x9FFF; point += 1) assert.ok(points.has(point));
});

const withFixture = async (callback) => {
	const directory = await mkdtemp(join(tmpdir(), 'ljm-font-coverage-'));
	try {
		const manifest = JSON.parse(await readFile(join(completeRoot, 'manifest.json'), 'utf8'));
		for (const shard of manifest.shards) await copyFile(join(completeRoot, shard.file), join(directory, shard.file));
		const styles = await readFile(join(completeRoot, 'complete.css'), 'utf8');
		await writeFile(join(directory, 'complete.css'), styles);
		await writeFile(join(directory, 'manifest.json'), JSON.stringify(manifest));
		await callback({ directory, manifest, styles });
	} finally {
		await rm(directory, { recursive: true, force: true });
	}
};

test('即使字体含字，CSS遗漏字符仍会被阻止', async () => {
	await withFixture(async ({ directory, styles }) => {
		await writeFile(join(directory, 'complete.css'), styles.replace(/unicode-range:\s*[^;]+;/, 'unicode-range: U+10FFFF;'));
		const issues = [];
		await readCompleteFontCoverage(directory, legacyPoints, (pass, message) => { if (!pass) issues.push(message); });
		assert.ok(issues.some((message) => message.includes('CSS未正确分配字形')));
		assert.ok(issues.some((message) => message.includes('遗漏官方源字体字符')));
	});
});

test('字体清单哈希异常不会被当作正常字库', async () => {
	await withFixture(async ({ directory, manifest }) => {
		manifest.shards[0].sha256 = '0'.repeat(64);
		await writeFile(join(directory, 'manifest.json'), JSON.stringify(manifest));
		const issues = [];
		await readCompleteFontCoverage(directory, legacyPoints, (pass, message) => { if (!pass) issues.push(message); });
		assert.ok(issues.some((message) => message.includes('文件校验失败')));
	});
});
