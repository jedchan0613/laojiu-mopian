import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { execFileSync } from 'node:child_process';
import { inspectDeploymentChange, isPreviouslyChecked, recordDeploymentCheck } from '../../deployment/deploy-change-plan.mjs';

async function fixture(t) {
 const root = await fs.mkdtemp(path.join(os.tmpdir(), 'ljm-deploy-plan-'));
 t.after(async () => { assert.equal(path.dirname(root), path.resolve(os.tmpdir())); assert.ok(path.basename(root).startsWith('ljm-deploy-plan-')); await fs.rm(root, { recursive: true, force: true }); });
 const git = (args, input) => execFileSync('git', ['-C', root, ...args], { input, encoding: 'utf8', windowsHide: true, stdio: ['pipe', 'pipe', 'pipe'] }).trim();
 git(['init']); git(['config', 'user.name', 'Synthetic Test']); git(['config', 'user.email', 'synthetic@example.invalid']); git(['config', 'core.autocrlf', 'false']);
 const write = async (name, value) => { const file = path.join(root, name); await fs.mkdir(path.dirname(file), { recursive: true }); await fs.writeFile(file, value); };
 const commit = () => { git(['add', '-A']); git(['commit', '-m', 'synthetic', '--allow-empty']); return git(['rev-parse', 'HEAD']); };
 await write('docs/guide.md', '# 原有文档\n'); await write('site/package-lock.json', '{}\n'); await write('deployment/program.mjs', 'export {};\n');
 const baseline = commit();
 return { root, git, write, commit, baseline, plan: candidate => inspectDeploymentChange({ repository: path.join(root, '.git'), deployedCommit: baseline, candidateCommit: candidate }) };
}

test('真实Git差异仅含普通UTF-8文档时免构建，新增、修改、删除及中文路径均可检查', async t => {
 const f = await fixture(t);
 await f.write('docs/guide.md', '# 修订文档\n普通文字与命令示例 `<script>` 不会执行。\n');
 await f.write('docs/阶段/检查记录.md', '# 中文记录\n');
 const first = f.commit();
 assert.equal(f.plan(first).mode, 'docs-only');
 await fs.rm(path.join(f.root, 'docs/guide.md'));
 assert.equal(f.plan(f.commit()).mode, 'docs-only');
});

test('代码、配置、锁文件、根说明、图片及未知文件即使混有文档也完整构建', async t => {
 for (const name of ['deployment/program.mjs', 'shared/config.json', 'site/package-lock.json', 'README.md', 'docs/reference/a.xlsx', 'docs/test.png', 'docs/AGENTS.md', 'docs/sync_冲突文件_1.md']) {
  await t.test(name, async t => { const f = await fixture(t); await f.write('docs/guide.md', '# 修改\n'); await f.write(name, 'changed\n'); assert.equal(f.plan(f.commit()).mode, 'build'); });
 }
});

test('二进制、无效UTF-8、控制字符、合并标记及大文件不能冒充安全文档', async t => {
 for (const [label, content] of [['binary', Buffer.from([65, 0, 66])], ['utf8', Buffer.from([0xff, 0xfe])], ['control', '# 文档\u001b[31m'], ['conflict', ['# 文档', '<'.repeat(7) + ' HEAD', '未解决', '='.repeat(7)].join('\n')], ['large', 'x'.repeat(4 * 1024 * 1024 + 1)]]) {
  await t.test(label, async t => { const f = await fixture(t); await f.write('docs/guide.md', content); assert.equal(f.plan(f.commit()).mode, 'build'); });
 }
});

test('执行模式、符号链接、提交不明及非祖先历史一律完整构建，强制入口保留', async t => {
 const f = await fixture(t);
 await f.write('docs/guide.md', '# 文档\n');
 f.git(['add', 'docs/guide.md']); f.git(['update-index', '--chmod=+x', 'docs/guide.md']); f.git(['commit', '-m', 'mode']);
 assert.equal(f.plan(f.git(['rev-parse', 'HEAD'])).mode, 'build');
 const blob = f.git(['hash-object', '-w', '--stdin'], '../deployment/program.mjs');
 f.git(['update-index', '--add', '--cacheinfo', `120000,${blob},docs/link.md`]); f.git(['commit', '-m', 'link']);
 assert.equal(f.plan(f.git(['rev-parse', 'HEAD'])).mode, 'build');
 for (const deployedCommit of ['', 'invalid', '0'.repeat(40)]) assert.equal(inspectDeploymentChange({ repository: path.join(f.root, '.git'), deployedCommit, candidateCommit: f.baseline }).mode, 'build');
 f.git(['checkout', '--orphan', 'diverged']); f.git(['rm', '-rf', '--cached', '.']); await f.write('docs/other.md', '# 另一历史');
 const diverged = f.commit(); assert.equal(f.plan(diverged).mode, 'build');
 assert.equal(inspectDeploymentChange({ repository: path.join(f.root, '.git'), deployedCommit: diverged, candidateCommit: diverged, force: true }).reason, 'forced');
});

test('免构建状态与实际部署编号分开保存，基线变化或损坏状态不得跳过检查', async t => {
 const f = await fixture(t), candidate = 'a'.repeat(40), file = path.join(f.root, 'last-checked.json');
 const actualFile = path.join(f.root, 'deployed-commit'); await fs.writeFile(actualFile, f.baseline + '\n');
 assert.equal(await isPreviouslyChecked(file, candidate, f.baseline), false);
 await recordDeploymentCheck(file, candidate, f.baseline, 'no-build');
 assert.equal(await fs.readFile(actualFile, 'utf8'), f.baseline + '\n');
 assert.equal(await isPreviouslyChecked(file, candidate, f.baseline), true);
 assert.equal(await isPreviouslyChecked(file, candidate, 'b'.repeat(40)), false);
 assert.equal(await isPreviouslyChecked(file, 'c'.repeat(40), f.baseline), false);
 await assert.rejects(recordDeploymentCheck(file, candidate, f.baseline, 'deployed'));
 await recordDeploymentCheck(file, candidate, candidate, 'deployed');
 assert.equal(await isPreviouslyChecked(file, candidate, candidate), false);
 await fs.writeFile(file, '{broken'); assert.equal(await isPreviouslyChecked(file, candidate, candidate), false);
});
