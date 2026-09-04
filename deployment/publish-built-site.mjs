import path from 'node:path';
import { createReleaseDeployer } from '../local-admin/release-deployer.mjs';

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

const result = await createReleaseDeployer({
	sourceDirectory,
	releasesDirectory,
	liveLink,
	releaseLabel,
}).deploy();

console.log(JSON.stringify(result));
