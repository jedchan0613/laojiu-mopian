import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { detectPublicationImageMime, assertPublicationImageSignature, createPublicationImageInput } from '../../shared/publication-image-safety.mjs';

const project = fileURLToPath(new URL('../../', import.meta.url));
const sharp = createRequire(new URL('../../site/package.json', import.meta.url))('sharp');
const execute = promisify(execFile);
const synthetic = () => sharp({ create: { width: 768, height: 512, channels: 3, background: '#a98a68' } });
const svg = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="1" height="1"><rect width="1" height="1"/></svg>');

test('解码前拒绝禁用格式、截断签名、扩展名和 MIME 不一致；原生调用次数为零', () => {
	let calls = 0;
	const decoder = () => { calls++; throw new Error('不应调用原生解码器'); };
	decoder.block = () => { calls++; };
	const invalid = [
		[svg, 'screening.jpg'], [Buffer.from('GIF89a'), 'screening.png'],
		[Buffer.from('II*\0'), 'screening.webp'], [Buffer.from('\0\0\0\x18ftypavif'), 'screening.jpg'],
		[Buffer.from([0xff, 0xd8]), 'short.jpg'], [Buffer.from('RIFF\0\0\0\0WEB'), 'short.webp'],
		[Buffer.from([0xff, 0xd8, 0xff]), 'wrong.png'],
		[Buffer.from([0xff, 0xd8, 0xff]), 'copy.jpg', 'image/svg+xml'],
	];
	for (const [bytes, filename, mimeType] of invalid) {
		assert.throws(() => createPublicationImageInput(decoder, bytes, { filename, mimeType }), /实际格式/);
	}
	assert.equal(calls, 0);
});

test('解码器防护先于读取、每个实例仅配置一次，像素和错误门禁不降低', () => {
	const calls = [];
	const decoder = (_bytes, options) => { calls.push(['decode', options]); return {}; };
	decoder.block = (options) => { calls.push(['block', options.operation]); };
	for (let index = 0; index < 2; index++) createPublicationImageInput(decoder, Buffer.from([0xff, 0xd8, 0xff]), { filename: 'copy.jpg' });
	assert.deepEqual(calls.map(([name]) => name), ['block', 'decode', 'decode']);
	assert.ok(calls[0][1].includes('VipsForeignLoadHeif'));
	assert.ok(calls[0][1].includes('VipsForeignLoadSvg'));
	assert.deepEqual(calls[1][1], { limitInputPixels: 40_000_000, failOn: 'warning', animated: false });
});

test('实际 JPEG/PNG/WebP 可解码、重编码；签名不是完整性证明', async () => {
	for (const [format, extension, mimeType] of [['jpeg', 'JPG', 'image/jpeg'], ['png', 'png', 'image/png'], ['webp', 'webp', 'image/webp']]) {
		const bytes = await synthetic()[format]().toBuffer();
		assert.equal(detectPublicationImageMime(bytes), mimeType);
		assert.equal(assertPublicationImageSignature(bytes, { filename: `copy.${extension}`, mimeType }).format, format);
		const input = createPublicationImageInput(sharp, bytes, { filename: `copy.${extension}`, mimeType });
		assert.equal((await input.metadata()).format, format);
		assert.ok((await input.resize({ width: 320 }).jpeg().toBuffer()).length > 0);
		await assert.rejects(createPublicationImageInput(sharp, bytes.subarray(0, 16), { filename: `broken.${extension}` }).jpeg().toBuffer());
	}
	// 即使误绕过字节筛选，SVG 解码器也在原生层被阻止（合成无害图形）。
	await assert.rejects(sharp(svg).toBuffer(), /blocked|unsupported/i);
});

test('构建器在隔离目录生成和复用衍生图；伪装格式不破坏已生成副本', async (t) => {
	const root = await fs.mkdtemp(path.join(os.tmpdir(), 'ljm-image-safety-'));
	t.after(async () => {
		assert.equal(path.dirname(path.resolve(root)), path.resolve(os.tmpdir()));
		assert.ok(path.basename(root).startsWith('ljm-image-safety-'));
		await fs.rm(root, { recursive: true, force: true });
	});
	const site = path.join(root, 'site');
	const source = path.join(site, 'public', 'archive', 'LJM-20000101-LET-001');
	await fs.mkdir(source, { recursive: true });
	await fs.mkdir(path.join(site, 'scripts'), { recursive: true });
	await fs.mkdir(path.join(root, 'shared'));
	await fs.copyFile(path.join(project, 'shared', 'publication-image-safety.mjs'), path.join(root, 'shared', 'publication-image-safety.mjs'));
	const script = path.join(site, 'scripts', 'generate-responsive-images.mjs');
	await fs.copyFile(path.join(project, 'site', 'scripts', 'generate-responsive-images.mjs'), script);
	await fs.symlink(path.join(project, 'site', 'node_modules'), path.join(site, 'node_modules'), process.platform === 'win32' ? 'junction' : 'dir');
	const bytes = await synthetic().jpeg().toBuffer();
	await fs.writeFile(path.join(source, 'front-public.jpg'), bytes);
	const run = () => execute(process.execPath, [script], { cwd: site, windowsHide: true });
	assert.match((await run()).stdout, /新生成 1 张/);
	const manifest = path.join(site, 'src', 'data', 'generated', 'image-manifest.json');
	const before = await fs.readFile(manifest);
	const parsed = JSON.parse(before);
	assert.equal(Object.values(parsed)[0].variants.length, 2);
	assert.match((await run()).stdout, /复用 1 张/);
	assert.deepEqual(await fs.readFile(manifest), before);
	await fs.writeFile(path.join(source, 'fake.png'), svg);
	await assert.rejects(run(), /实际格式/);
	assert.deepEqual(await fs.readFile(manifest), before);
	assert.deepEqual(await fs.readFile(path.join(source, 'front-public.jpg')), bytes);
	for (const variant of Object.values(parsed)[0].variants) assert.ok((await fs.stat(path.join(site, 'public', variant.src))).size > 0);
});
