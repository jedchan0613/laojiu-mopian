import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { cleanTestBuild } from '../../shared/build-artifact-cleanup.mjs';

test('只整理可重建目录，原发布副本、业务历史、备份保持完整', async () => {
	const temporary = await fs.mkdtemp(path.join(os.tmpdir(), 'ljm-test-cleanup-'));
	const buildRoot = await fs.realpath(temporary);
	const job = 'maintenance-20261021-abcd';
	const root = path.join(buildRoot, job);
	try {
		for (const relative of ['app/site/dist', 'app/site/public/archive-responsive', 'app/site/public/archive', 'data/history', 'production-before']) {
			await fs.mkdir(path.join(root, relative), { recursive: true });
			await fs.writeFile(path.join(root, relative, 'keep-or-rebuild.txt'), relative);
		}
		await assert.rejects(cleanTestBuild({ buildRoot, job: '../unsafe' }), /名称无效/);
		await assert.rejects(cleanTestBuild({ buildRoot, job, protectedPaths: [path.join(root, 'app')] }), /当前网站/);
		const plan = await cleanTestBuild({ buildRoot, job });
		assert.equal(plan.removable.length, 2); assert.equal(plan.removed.length, 0);
		const result = await cleanTestBuild({ buildRoot, job, apply: true });
		assert.equal(result.removed.length, 2);
		for (const relative of ['app/site/public/archive', 'data/history', 'production-before']) assert.equal(await fs.readFile(path.join(root, relative, 'keep-or-rebuild.txt'), 'utf8'), relative);
	} finally { await fs.rm(buildRoot, { recursive: true, force: true }); }
});
