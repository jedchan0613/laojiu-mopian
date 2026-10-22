// 将固定服务器路径映射到临时目录，并模拟systemd；不调用任何正式服务。
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { execFile, execFileSync } from 'node:child_process';
import { promisify } from 'node:util';

const execute = promisify(execFile);
const skip = process.platform === 'win32' ? '安装事务的POSIX命令在Linux隔离环境执行' : false;
const source = new URL('../../deployment/', import.meta.url);

async function fixture(t) {
 const root = await fs.mkdtemp(path.join(os.tmpdir(), 'ljm-deploy-installer-'));
 t.after(async () => { assert.equal(path.dirname(root), path.resolve(os.tmpdir())); assert.ok(path.basename(root).startsWith('ljm-deploy-installer-')); await fs.rm(root, { recursive: true, force: true }); });
 const bin = path.join(root, 'bin'), scripts = path.join(root, 'source'), events = path.join(root, 'events');
 await fs.mkdir(bin); await fs.mkdir(scripts);
 const executable = async (name, text) => { await fs.writeFile(path.join(bin, name), '#!/usr/bin/env bash\nset -eu\n' + text, { mode: 0o755 }); };
 await executable('id', 'exit 0\n');
 const realInstall = execFileSync('which', ['install'], { encoding: 'utf8' }).trim();
 await executable('install', `args=()\nwhile [[ "$#" -gt 0 ]]; do\n case "$1" in -o|-g) shift 2;; *) args+=("$1"); shift;; esac\ndone\nif [[ "\u0024{LJM_INSTALL_TEST_FAIL:-}" == write && "\u0024{args[*]}" == *laojiumopian-github-deploy.timer.next-* ]]; then exit 9; fi\nexec "${realInstall}" "\u0024{args[@]}"\n`);
 await executable('systemd-analyze', `printf 'validate\\n' >> "${events}"\nif [[ "\u0024{LJM_INSTALL_TEST_FAIL:-}" == written && "$(wc -l < '${events}')" -gt 1 ]]; then exit 8; fi\n`);
 await executable('systemctl', `printf 'reload\\n' >> "${events}"\nif [[ "\u0024{LJM_INSTALL_TEST_FAIL:-}" == reload && ! -f "${root}/reload-failed" ]]; then touch "${root}/reload-failed"; exit 7; fi\n`);
 for (const name of ['deploy-change-plan.mjs', 'laojiumopian-github-deploy.sh', 'laojiumopian-github-deploy.service', 'laojiumopian-github-deploy.timer', 'laojiumopian-admin.service']) await fs.copyFile(new URL(name, source), path.join(scripts, name));
 let installer = await fs.readFile(new URL('install-github-auto-deploy.sh', source), 'utf8');
 installer = installer.replace('[[ "${EUID:-$(id -u)}" -eq 0 ]]', '[[ 0 -eq 0 ]]').replace('node_command=/snap/node/current/bin/node', `node_command='${process.execPath}'`);
 for (const prefix of ['/srv/laojiumopian-admin', '/usr/local', '/etc/systemd/system', '/run/lock']) installer = installer.replaceAll(prefix, root + prefix);
 await fs.writeFile(path.join(scripts, 'install.sh'), installer);
 const targetNames = ['usr/local/lib/laojiumopian-github-deploy/deploy-change-plan.mjs', 'usr/local/sbin/laojiumopian-github-deploy', 'etc/systemd/system/laojiumopian-github-deploy.service', 'etc/systemd/system/laojiumopian-github-deploy.timer', 'etc/systemd/system/laojiumopian-admin.service'];
 for (const name of targetNames.slice(1)) {
  const filename = path.join(root, name); await fs.mkdir(path.dirname(filename), { recursive: true });
  await fs.writeFile(filename, `original:${name}\n`, { mode: 0o640 });
  // 服务器预演可能使用umask 077；明确建立0640基线，随后仍严格检查恢复后的权限。
  await fs.chmod(filename, 0o640);
  assert.equal((await fs.stat(filename)).mode & 0o777, 0o640);
 }
 await fs.mkdir(path.join(root, 'srv/laojiumopian-admin/build-work'), { recursive: true }); await fs.mkdir(path.join(root, 'run/lock'), { recursive: true });
 const run = (args = [], fail = '') => execute('bash', [path.join(scripts, 'install.sh'), ...args], { env: { ...process.env, PATH: `${bin}:${process.env.PATH}`, LJM_INSTALL_TEST_FAIL: fail } });
 const assertRestored = async () => {
  await assert.rejects(fs.stat(path.join(root, targetNames[0])), { code: 'ENOENT' });
  for (const name of targetNames.slice(1)) { const filename = path.join(root, name); assert.equal(await fs.readFile(filename, 'utf8'), `original:${name}\n`); assert.equal((await fs.stat(filename)).mode & 0o777, 0o640); }
 };
 return { root, targetNames, run, assertRestored, events };
}

test('部署安装器默认只检查，既有程序、unit和状态均不改变', { skip }, async t => {
 const f = await fixture(t); const result = await f.run(); assert.match(result.stdout, /未改服务器文件/); await f.assertRestored(); assert.equal(await fs.readFile(f.events, 'utf8'), 'validate\n');
});
test('部署安装器先装独立helper，再原子换脚本，保留可恢复旧文件且不启停服务', { skip }, async t => {
 const f = await fixture(t); const result = await f.run(['--apply']); assert.match(result.stdout, /恢复备份/);
 assert.match(await fs.readFile(path.join(f.root, f.targetNames[0]), 'utf8'), /inspectDeploymentChange/);
 assert.match(await fs.readFile(path.join(f.root, f.targetNames[1]), 'utf8'), /last-checked\.json/);
 assert.equal((await fs.stat(path.join(f.root, f.targetNames[1]))).mode & 0o777, 0o755);
 assert.equal(await fs.readFile(f.events, 'utf8'), 'validate\nvalidate\nreload\n');
 const backups = await fs.readdir(path.join(f.root, 'srv/laojiumopian-admin/build-work'));
 assert.equal(backups.filter(name => name.startsWith('deploy-installer-')).length, 1);
});
for (const failure of ['write', 'written', 'reload']) test(`部署安装${failure}失败时恢复旧文件及权限，不遗留本次新helper`, { skip }, async t => {
 const f = await fixture(t); await assert.rejects(f.run(['--apply'], failure), error => { assert.match(error.stderr, /已恢复原部署程序/); return true; }); await f.assertRestored();
});
