// 只允许明确的纯文档变化免构建；任何未知情况都返回完整构建。
// 此文件只用Node内置模块，安装到固定路径，不依赖app/current的新版本。
import fs from 'node:fs/promises';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';

const commitPattern = /^[0-9a-f]{40}$/;
const maxDocumentBytes = 4 * 1024 * 1024;
const documentPath = /^docs\/(?:[\p{L}\p{N}_-]+\/)*[\p{L}\p{N}_.-]+\.md$/u;
const mergeMarker = /^(?:<{7}(?: .*)?|={7}|>{7}(?: .*)?)\s*$/m;
const decode = bytes => new TextDecoder('utf-8', { fatal: true }).decode(bytes);
const fullBuild = reason => ({ mode: 'build', reason });

export function inspectDeploymentChange({ repository, deployedCommit, candidateCommit, force = false }) {
 if (force) return fullBuild('forced');
 if (!commitPattern.test(deployedCommit ?? '') || !commitPattern.test(candidateCommit ?? '')) return fullBuild('missing-or-invalid-baseline');
 try {
  const git = args => execFileSync('git', ['--git-dir', repository, ...args], { windowsHide: true, maxBuffer: 16 * 1024 * 1024, stdio: ['ignore', 'pipe', 'pipe'] });
  for (const commit of [deployedCommit, candidateCommit]) git(['cat-file', '-e', `${commit}^{commit}`]);
  git(['merge-base', '--is-ancestor', deployedCommit, candidateCommit]);
  const tokens = decode(git(['diff', '--raw', '--abbrev=40', '-z', '--no-renames', '--no-ext-diff', '--no-textconv', deployedCommit, candidateCommit, '--'])).split('\0');
  if (tokens.pop() !== '') return fullBuild('unknown-diff-format');
  if (!tokens.length || tokens.length % 2) return fullBuild('empty-or-unknown-diff');
  const paths = [];
  for (let index = 0; index < tokens.length; index += 2) {
   const match = /^:(\d{6}) (\d{6}) ([0-9a-f]{40}) ([0-9a-f]{40}) ([AMD])$/.exec(tokens[index]);
   const filename = tokens[index + 1];
   if (!match || !documentPath.test(filename) || filename.split('/').some(part => part === '.' || part === '..') || /_冲突文件_|AGENTS\.md$/i.test(filename)) return fullBuild('non-document-or-unknown-change');
   const [, oldMode, newMode, oldHash, newHash, status] = match;
   if ((status === 'A' ? oldMode !== '000000' : oldMode !== '100644') || (status === 'D' ? newMode !== '000000' : newMode !== '100644')) return fullBuild('non-regular-document');
   for (const hash of new Set([oldHash, newHash].filter(hash => !/^0+$/.test(hash)))) {
    if (decode(git(['cat-file', '-t', hash])).trim() !== 'blob') return fullBuild('non-blob-document');
    const size = Number(decode(git(['cat-file', '-s', hash])).trim());
    if (!Number.isSafeInteger(size) || size > maxDocumentBytes) return fullBuild('oversized-document');
    const content = decode(git(['cat-file', 'blob', hash]));
    if (content.includes('\0') || /[\u0001-\u0008\u000B\u000C\u000E-\u001F]/.test(content) || mergeMarker.test(content)) return fullBuild('unsafe-document-content');
   }
   paths.push(filename);
  }
  return { mode: 'docs-only', reason: 'only-regular-utf8-markdown', paths };
 } catch { return fullBuild('git-or-content-inspection-failed'); }
}

export async function isPreviouslyChecked(file, candidateCommit, deployedCommit) {
 try {
  const state = JSON.parse(await fs.readFile(file, 'utf8'));
  return commitPattern.test(candidateCommit) && commitPattern.test(deployedCommit) && state.checked_commit === candidateCommit && state.deployed_commit === deployedCommit && state.status === 'no-build';
 } catch { return false; }
}

export async function recordDeploymentCheck(file, candidateCommit, deployedCommit, status) {
 if (!commitPattern.test(candidateCommit) || !commitPattern.test(deployedCommit) || !['no-build', 'deployed'].includes(status) || (status === 'deployed' && candidateCommit !== deployedCommit)) throw new Error('部署检查状态无效。');
 const temporary = `${file}.next-${randomUUID()}`;
 try {
  await fs.writeFile(temporary, JSON.stringify({ checked_commit: candidateCommit, deployed_commit: deployedCommit, status, checked_at: new Date().toISOString() }) + '\n', { mode: 0o640, flag: 'wx' });
  await fs.chmod(temporary, 0o640);
  await fs.rename(temporary, file);
 } finally { await fs.rm(temporary, { force: true }); }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
 const [action, ...args] = process.argv.slice(2);
 if (action === 'plan' && args.length === 4 && ['0', '1'].includes(args[3])) console.log(inspectDeploymentChange({ repository: args[0], deployedCommit: args[1], candidateCommit: args[2], force: args[3] === '1' }).mode);
 else if (action === 'checked' && args.length === 3) console.log(await isPreviouslyChecked(...args) ? 'yes' : 'no');
 else if (action === 'record' && args.length === 4) await recordDeploymentCheck(...args);
 else throw new Error('部署判定工具参数无效。');
}
