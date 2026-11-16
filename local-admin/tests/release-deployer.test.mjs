import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { createReleaseDeployer, readLiveRelease } from '../release-deployer.mjs';

const makeLink = (target, linkPath) => fs.symlink(
	process.platform === 'win32' ? path.resolve(target) : path.basename(target),
	linkPath,
	process.platform === 'win32' ? 'junction' : 'dir',
);

const withFixture = async (callback) => {
	const root = await fs.mkdtemp(path.join(os.tmpdir(), 'ljm-release-test-'));
	try {
		const source = path.join(root, 'source');
		const releases = path.join(root, 'releases');
		const previous = path.join(releases, 'previous-production');
		const live = path.join(releases, 'live');
		await fs.mkdir(source);
		await fs.mkdir(previous, { recursive: true });
		await fs.writeFile(path.join(previous, 'index.html'), 'previous');
		await makeLink(previous, live);
		await callback({ root, source, releases, previous, live });
	} finally {
		await fs.rm(root, { recursive: true, force: true });
	}
};

test('只接受指向公开版本目录内部的 live 软链接', async () => {
	await withFixture(async ({ releases, previous, live }) => {
		const result = await readLiveRelease(releases, live);
		assert.equal(result.resolvedTarget, previous);
	});
});

test('新版本缺少必要文件时不切换 live，并清理未完成版本', async () => {
	await withFixture(async ({ source, releases, previous, live }) => {
		await fs.writeFile(path.join(source, 'index.html'), 'new');
		const deployer = createReleaseDeployer({
			sourceDirectory: source,
			releasesDirectory: releases,
			liveLink: live,
			now: () => new Date('2026-09-03T12:00:00+08:00'),
			randomId: () => '1234abcd',
		});
		await assert.rejects(deployer.deploy(), /缺少 404\.html/);
		assert.equal((await readLiveRelease(releases, live)).resolvedTarget, previous);
		await assert.rejects(fs.stat(path.join(releases, '20260903-120000-admin-1234abcd')));
	});
});

test('拒绝不安全的公开版本来源标签', async () => {
	await withFixture(async ({ source, releases, live }) => {
		const deployer = createReleaseDeployer({
			sourceDirectory: source,
			releasesDirectory: releases,
			liveLink: live,
			releaseLabel: '../outside',
		});
		await assert.rejects(deployer.deploy(), /来源标签无效/);
	});
});

test('取消版本准备时保留当前 live，并清理未完成版本', async () => {
	await withFixture(async ({ source, releases, previous, live }) => {
		for (const [name, content] of [
			['index.html', 'new'], ['404.html', 'not found'], ['robots.txt', 'robots'], ['sitemap.xml', 'map'],
		]) await fs.writeFile(path.join(source, name), content);
		const deployer = createReleaseDeployer({
			sourceDirectory: source,
			releasesDirectory: releases,
			liveLink: live,
			now: () => new Date('2026-09-03T12:00:00+08:00'),
			randomId: () => '1234abcd',
		});
		const controller = new AbortController();
		controller.abort();

		await assert.rejects(deployer.deploy({ signal: controller.signal }), /操作已取消/);
		assert.equal((await readLiveRelease(releases, live)).resolvedTarget, previous);
		await assert.rejects(fs.stat(path.join(releases, '20260903-120000-admin-1234abcd')));
	});
});

test('构建完整时复制独立版本并原子切换 live', { skip: process.platform === 'win32' }, async () => {
	await withFixture(async ({ source, releases, previous, live }) => {
		for (const [name, content] of [
			['index.html', 'new'], ['404.html', 'not found'], ['robots.txt', 'robots'], ['sitemap.xml', 'map'],
		]) await fs.writeFile(path.join(source, name), content);
		const deployer = createReleaseDeployer({
			sourceDirectory: source,
			releasesDirectory: releases,
			liveLink: live,
			now: () => new Date('2026-09-03T12:00:00+08:00'),
			randomId: () => '1234abcd',
			releaseLabel: 'github-abcdef12',
		});
		const result = await deployer.deploy();
		assert.equal(result.releaseName, '20260903-120000-github-abcdef12-1234abcd');
		assert.equal(result.previousReleaseName, path.basename(previous));
		assert.equal((await readLiveRelease(releases, live)).releaseName, result.releaseName);
		assert.equal(await fs.readFile(path.join(result.releaseDirectory, 'index.html'), 'utf8'), 'new');
		assert.equal(await fs.readFile(path.join(previous, 'index.html'), 'utf8'), 'previous');
	});
});

test('最终提交守卫可以拒绝切站，拒绝后清理候选且保留当前 live', async () => {
	await withFixture(async ({ source, releases, previous, live }) => {
		for (const name of ['index.html', '404.html', 'robots.txt', 'sitemap.xml']) await fs.writeFile(path.join(source, name), 'new');
		const deployer = createReleaseDeployer({ sourceDirectory: source, releasesDirectory: releases, liveLink: live });
		let prepared = false, guarded = false;
		await assert.rejects(deployer.deploy({
			onPrepared: async () => { prepared = true; },
			withCommit: async () => { assert(prepared); guarded = true; throw new Error('SYNTHETIC-STOP-ACCEPTED'); },
		}), /SYNTHETIC-STOP-ACCEPTED/);
		assert(guarded);
		assert.equal((await readLiveRelease(releases, live)).resolvedTarget, previous);
		assert.deepEqual(await fs.readdir(releases), ['live', 'previous-production']);
	});
});

test('最终守卫在切换后报错时保留实际新版本，不能误删 live 目标', { skip: process.platform === 'win32' }, async () => {
	await withFixture(async ({ source, releases, previous, live }) => {
		for (const name of ['index.html', '404.html', 'robots.txt', 'sitemap.xml']) await fs.writeFile(path.join(source, name), 'new');
		const deployer = createReleaseDeployer({ sourceDirectory: source, releasesDirectory: releases, liveLink: live });
		await assert.rejects(deployer.deploy({ withCommit: async commit => { await commit(); throw new Error('SYNTHETIC-UNLOCK-FAIL'); } }), /公开指针已切换.*SYNTHETIC-UNLOCK-FAIL/);
		const current = await readLiveRelease(releases, live);
		assert.notEqual(current.resolvedTarget, previous);
		assert.equal(await fs.readFile(path.join(current.resolvedTarget, 'index.html'), 'utf8'), 'new');
		assert.equal(await fs.readFile(path.join(previous, 'index.html'), 'utf8'), 'previous');
	});
});
