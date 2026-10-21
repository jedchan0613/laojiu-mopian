import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { pruneReleases, releaseTimestamp } from '../../shared/release-retention.mjs';

test('两种部署时间格式正确排序，占位与异常日期不算版本', () => {
	assert.equal(releaseTimestamp('20261014071742-bilingual-a5eca854'), '20261014071742');
	assert.equal(releaseTimestamp('20261019-183515-github-777691d8366f'), '20261019183515');
	for (const name of ['empty', '.github-staging-20261021', '20260230-010101-admin-abc', '../20261019-183515-admin-abc']) assert.equal(releaseTimestamp(name), null);
});

const fixture = async (run) => {
	const temporaryRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'ljm-retention-'));
	const root = await fs.realpath(temporaryRoot);
	try {
		const releasesDirectory = path.join(root, 'releases');
		await fs.mkdir(releasesDirectory);
		const names = ['20261014071742-bilingual-aaaa', '20261015114807-thai-bbbb', '20261019-094538-github-cccc', '20261019-183515-github-dddd'];
		for (const name of [...names, 'empty']) {
			await fs.mkdir(path.join(releasesDirectory, name));
			await fs.writeFile(path.join(releasesDirectory, name, 'index.html'), name);
		}
		const liveLink = path.join(releasesDirectory, 'live');
		const makeLink = target => fs.symlink(target, liveLink, process.platform === 'win32' ? 'junction' : 'dir');
		await makeLink(path.join(releasesDirectory, names.at(-1)));
		await run({ releasesDirectory, liveLink, names, makeLink, root });
	} finally { await fs.rm(root, { recursive: true, force: true }); }
};

test('默认预演；正式清理只删最旧版本，空目录不占保留名额', async () => fixture(async ({ releasesDirectory, liveLink, names }) => {
	const options = { releasesDirectory, liveLink, kind: 'public' };
	const plan = await pruneReleases(options);
	assert.deepEqual(plan.removable, [names[0]]);
	assert.equal((await fs.stat(path.join(releasesDirectory, names[0]))).isDirectory(), true);
	const result = await pruneReleases({ ...options, apply: true });
	assert.deepEqual(result.removed, [names[0]]);
	assert.equal(await fs.readFile(path.join(liveLink, 'index.html'), 'utf8'), names.at(-1));
	assert.equal((await fs.stat(path.join(releasesDirectory, 'empty'))).isDirectory(), true);
}));

test('当前运行旧版额外保护，目录内夹带业务历史时跳过', async () => fixture(async ({ releasesDirectory, liveLink, names, makeLink }) => {
	await fs.unlink(liveLink);
	await makeLink(path.join(releasesDirectory, names[0]));
	assert.deepEqual((await pruneReleases({ releasesDirectory, liveLink, kind: 'public', apply: true })).removed, []);
	await fs.unlink(liveLink); await makeLink(path.join(releasesDirectory, names.at(-1)));
	const history = path.join(releasesDirectory, names[0], 'local-admin/history');
	await fs.mkdir(history, { recursive: true }); await fs.writeFile(path.join(history, 'protected.json'), '{}');
	const result = await pruneReleases({ releasesDirectory, liveLink, kind: 'public', apply: true });
	assert.deepEqual(result.skipped, [names[0]]);
	assert.equal(await fs.readFile(path.join(history, 'protected.json'), 'utf8'), '{}');
}));

test('拒绝目录外的当前链接与过小保留数', async () => fixture(async ({ releasesDirectory, liveLink, makeLink, root }) => {
	await assert.rejects(pruneReleases({ releasesDirectory, liveLink, kind: 'public', keep: 1 }), /至少保留/);
	await fs.unlink(liveLink); await makeLink(root);
	await assert.rejects(pruneReleases({ releasesDirectory, liveLink, kind: 'public', apply: true }), /目录内部/);
}));
