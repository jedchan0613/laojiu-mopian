import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { createServer } from 'node:http';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

test('批次干跑按正式字典键校验证件遮盖代码，仍拒绝自造代码', async t => {
	const base = path.resolve(os.tmpdir());
	const fixture = await mkdtemp(path.join(base, 'ljm-batch-dictionary-'));
	assert.equal(path.dirname(path.resolve(fixture)), base);
	assert.ok(path.basename(fixture).startsWith('ljm-batch-dictionary-'));
	t.after(() => rm(fixture, { recursive: true, force: true }));
	const standardRoot = new URL('../../site/src/data/standards/', import.meta.url);
	const json = async name => JSON.parse(await readFile(new URL(name, standardRoot), 'utf8'));
	const standards = {
		commonFields: await json('common-fields.json'), codeDictionary: await json('code-dictionary.json'),
		dimensions: { credential: await json('credential-dimensions.json') },
	};
	let preflights = 0;
	const server = createServer(async (req, res) => {
		res.setHeader('Content-Type', 'application/json');
		if (req.url === '/healthz') return res.end(JSON.stringify({ capabilities: { publicationImageNames: true, writeProtocol: 2 } }));
		if (req.url === '/api/admin-standards') return res.end(JSON.stringify(standards));
		if (req.url === '/api/preflight-images') {
			preflights++;
			let text = ''; for await (const chunk of req) text += chunk;
			return res.end(JSON.stringify({ files: JSON.parse(text).files.map(f => ({ ...f, accepted: true })) }));
		}
		res.writeHead(500); res.end('{}');
	});
	server.listen(0, '127.0.0.1'); await once(server, 'listening');
	t.after(() => new Promise(resolve => server.close(resolve)));
	const imageDir = path.join(fixture, 'images', 'T001');
	await mkdir(imageDir, { recursive: true });
	await writeFile(path.join(imageDir, 'front-public.jpg'), Buffer.from([0xff, 0xd8, 0xff, 0xd9]));
	const run = async code => {
		await writeFile(path.join(fixture, 'items.csv'), `temp_id,core.title,core.accession_date,core.object_type,core.batch_id,core.date_display,core.physical_location,dim.ID01.credential_type,dim.ID21.redaction_status\nT001,合成通知,2000-01-01,IDC,TEST-B01,年代未知,测试柜,ID-CER,${code}\n`);
		const child = spawn(process.execPath, [fileURLToPath(new URL('../batch-intake.mjs', import.meta.url)), fixture], {
			env: { ...process.env, LJM_ADMIN_URL: `http://127.0.0.1:${server.address().port}` }, windowsHide: true,
		});
		let output = ''; child.stdout.on('data', v => output += v); child.stderr.on('data', v => output += v);
		return { code: (await once(child, 'exit'))[0], output };
	};
	const accepted = await run('RD-MASK');
	assert.equal(accepted.code, 0, accepted.output);
	assert.match(accepted.output, /0 个错误/);
	assert.equal(preflights, 1);
	const rejected = await run('RD-INVENTED');
	assert.equal(rejected.code, 2, rejected.output);
	assert.match(rejected.output, /RD-INVENTED.*不在代码字典/);
	assert.equal(preflights, 1, '无效代码不得进入后续图片预检');
	await assert.rejects(readFile(path.join(fixture, '_result.csv')));
});

test('批次按收藏编码规范映射邮戳多值字段，保存数组并拦截非法代码及未知字段', async t => {
	const base = path.resolve(os.tmpdir());
	const fixture = await mkdtemp(path.join(base, 'ljm-batch-postal-mark-'));
	assert.equal(path.dirname(path.resolve(fixture)), base);
	assert.ok(path.basename(fixture).startsWith('ljm-batch-postal-mark-'));
	t.after(() => rm(fixture, { recursive: true, force: true }));
	const standardRoot = new URL('../../site/src/data/standards/', import.meta.url);
	const json = async name => JSON.parse(await readFile(new URL(name, standardRoot), 'utf8'));
	const standards = {
		commonFields: await json('common-fields.json'), codeDictionary: await json('code-dictionary.json'),
		dimensions: { postcard: await json('postcard-dimensions.json') },
		collectionCodeRules: await json('collection-code-rules.json'),
	};
	// 未知字典键不应覆盖已有校验，未知字段也不能因出现在规则中变成可用字段。
	standards.collectionCodeRules.schemas.postcard.required_dimensions.push({
		dimension_code: 'PC19', code_fields: [
			{ field_code: 'postal_mark_types', dictionary_key: 'not_in_dictionary' },
			{ field_code: 'postcard_type', dictionary_key: 'not_in_dictionary' },
			{ field_code: 'postal_mark_typo', dictionary_key: 'postal_mark' },
		],
	});
	let preflights = 0;
	const savedPayloads = [];
	const server = createServer(async (req, res) => {
		res.setHeader('Content-Type', 'application/json');
		if (req.url === '/healthz') return res.end(JSON.stringify({ capabilities: { publicationImageNames: true, writeProtocol: 2 } }));
		if (req.url === '/api/admin-standards') return res.end(JSON.stringify(standards));
		let body = ''; for await (const chunk of req) body += chunk;
		if (req.url === '/api/preflight-images') {
			preflights++;
			return res.end(JSON.stringify({ files: JSON.parse(body).files.map(f => ({ ...f, accepted: true })) }));
		}
		if (req.url === '/api/save-draft') {
			savedPayloads.push(JSON.parse(body));
			return res.end(JSON.stringify({ draft: { record: { core: { item_id: 'LJM-20000101-PST-001' } } } }));
		}
		res.writeHead(500); res.end('{}');
	});
	server.listen(0, '127.0.0.1'); await once(server, 'listening');
	t.after(() => new Promise(resolve => server.close(resolve)));
	let runs = 0;
	const run = async ({ codes, field = 'postal_mark_types', postcardType = 'PT-UNK', apply = false }) => {
		const directory = path.join(fixture, String(++runs));
		const imageDir = path.join(directory, 'images', 'T001');
		await mkdir(imageDir, { recursive: true });
		await writeFile(path.join(imageDir, 'front-public.jpg'), Buffer.from([0xff, 0xd8, 0xff, 0xd9]));
		await writeFile(path.join(directory, 'items.csv'), `temp_id,core.title,core.accession_date,core.object_type,core.batch_id,core.date_display,core.physical_location,dim.PC01.postcard_type,dim.PC19.${field},dim.PC19.postmark_transcription\nT001,合成明信片,2000-01-01,PST,TEST-B01,年代未知,测试柜,${postcardType},${codes},甲;乙\n`);
		const child = spawn(process.execPath, [fileURLToPath(new URL('../batch-intake.mjs', import.meta.url)), directory,
			...(apply ? ['--apply', '--confirmed-publication-copies'] : [])], {
			env: { ...process.env, LJM_ADMIN_URL: `http://127.0.0.1:${server.address().port}` }, windowsHide: true,
		});
		let output = ''; child.stdout.on('data', v => output += v); child.stderr.on('data', v => output += v);
		return { code: (await once(child, 'exit'))[0], output, directory };
	};
	const single = await run({ codes: 'PM-UNK', apply: true });
	assert.equal(single.code, 0, single.output);
	assert.deepEqual(savedPayloads[0].record.metadata.dimensions.PC19.postal_mark_types, ['PM-UNK']);
	assert.equal(savedPayloads[0].record.metadata.dimensions.PC19.postmark_transcription, '甲;乙', '未声明多值的原文仍保留字符串');
	const multi = await run({ codes: 'PM-DSP;PM-ARR', apply: true });
	assert.equal(multi.code, 0, multi.output);
	assert.deepEqual(savedPayloads[1].record.metadata.dimensions.PC19.postal_mark_types, ['PM-DSP', 'PM-ARR']);
	assert.equal(preflights, 2);
	for (const [options, error] of [
		[{ codes: 'PM-DSP;PM-INVENTED' }, /PM-INVENTED.*不在代码字典/],
		[{ codes: 'PM-UNK', postcardType: 'PT-INVENTED' }, /PT-INVENTED.*不在代码字典/],
		[{ codes: 'PM-UNK', field: 'postal_mark_typo' }, /postal_mark_typo.*不是该维度的字段/],
	]) {
		const rejected = await run(options);
		assert.equal(rejected.code, 2, rejected.output);
		assert.match(rejected.output, error);
		await assert.rejects(readFile(path.join(rejected.directory, '_result.csv')));
	}
	assert.equal(preflights, 2, '非法代码及未知字段不得进入图片预检');
	assert.equal(savedPayloads.length, 2, '干跑校验失败不得写草稿');
});
