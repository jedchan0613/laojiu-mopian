import { pruneReleases } from '../shared/release-retention.mjs';

// 生产入口只接受两个固定目录；默认预演。调用方必须持有现有部署锁。
const [kind, ...args] = process.argv.slice(2);
if (!['admin', 'public'].includes(kind) || args.some(arg => arg !== '--apply' && !arg.startsWith('--protect='))) throw new Error('用法：prune-releases.mjs admin|public [--apply] [--protect=绝对路径]');
const releasesDirectory = kind === 'admin' ? '/srv/laojiumopian-admin/app/releases' : '/srv/laojiumopian/releases';
const liveLink = kind === 'admin' ? '/srv/laojiumopian-admin/app/current' : `${releasesDirectory}/live`;
const protectedDirectories = args.filter(arg => arg.startsWith('--protect=')).map(arg => arg.slice('--protect='.length));
console.log(JSON.stringify(await pruneReleases({ releasesDirectory, liveLink, kind, protectedDirectories, apply: args.includes('--apply') })));
