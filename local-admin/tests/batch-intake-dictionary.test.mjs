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
