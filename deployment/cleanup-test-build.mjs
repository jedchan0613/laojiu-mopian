import fs from 'node:fs/promises';
import { cleanTestBuild } from '../shared/build-artifact-cleanup.mjs';

// 仅在明确完成一个维护作业后调用；不按时间猜测、批量删除整个 build-work。
const [job, ...args] = process.argv.slice(2);
if (!job || args.some(arg => arg !== '--apply')) throw new Error('用法：cleanup-test-build.mjs 作业目录名 [--apply]');
const protectedPaths = await Promise.all([
	'/srv/laojiumopian-admin/app/current', '/srv/laojiumopian/releases/live',
].map(link => fs.realpath(link)));
console.log(JSON.stringify(await cleanTestBuild({ buildRoot: '/srv/laojiumopian-admin/build-work', job, protectedPaths, apply: args.includes('--apply') })));
