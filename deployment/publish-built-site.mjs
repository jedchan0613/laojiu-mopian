import path from 'node:path';
import { createReleaseDeployer } from '../local-admin/release-deployer.mjs';
import { prepareManualReleaseGuard } from '../local-admin/manual-release-guard.mjs';

const [sourceDirectory, releasesDirectory, liveLink, releaseLabel] = process.argv.slice(2);

if (![sourceDirectory, releasesDirectory, liveLink, releaseLabel].every(Boolean)) {
	throw new Error('缺少构建目录、公开版本目录、live 链接或版本来源标签。');
}

for (const [label, value] of [
	['构建目录', sourceDirectory],
	['公开版本目录', releasesDirectory],
	['live 链接', liveLink],
]) {
	if (!path.isAbsolute(value)) throw new Error(`${label}必须使用绝对路径。`);
}

const adminDataRoot = process.env.LJM_ADMIN_DATA_ROOT ?? (path.resolve(releasesDirectory)==='/srv/laojiumopian/releases' ? '/srv/laojiumopian-admin/data' : undefined);
const manualGuard = await prepareManualReleaseGuard({
	adminDataRoot,
	submissionRoot: process.env.LJM_SUBMISSION_DATA_DIR,
	archiveDataDirectory: process.env.LJM_ARCHIVE_DATA_DIR,
	siteDirectory: path.dirname(sourceDirectory),
});
const result = await createReleaseDeployer({
	sourceDirectory,
	releasesDirectory,
	liveLink,
	releaseLabel,
	manualsRoot: adminDataRoot ? path.join(adminDataRoot, 'manuals') : null,
}).deploy({ onPrepared: manualGuard.validate, withCommit: manualGuard.withCommit });

console.log(JSON.stringify(result));
