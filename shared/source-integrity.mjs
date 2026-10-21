// 零依赖源码门禁：只检查程序目录，不读取档案、投稿、账号、草稿或图片。
import fs from 'node:fs/promises';
import path from 'node:path';

const roots = ['deployment', 'shared', 'local-admin', 'site/src', 'site/scripts'];
const runtimeNames = new Set(['node_modules', 'drafts', 'history', 'recycle-bin', 'upload-staging', 'uploads', 'translations', 'operations', 'accounts', 'submissions', 'batch-import', 'batch-maintenance', 'outputs']);
const codeExtension = /\.(?:m?js|cjs|ts|tsx|jsx|astro|json|css|sh|ps1)$/i;
const conflictName = /_冲突文件_|\.baiduyun\.uploading\.cfg$/i;
const marker = /^(?:<{7}(?: .*)?|={7}|>{7}(?: .*)?)\s*$/m;

export async function findSourceIntegrityIssues(projectRoot) {
  const root = path.resolve(projectRoot), issues = [];
  async function visit(file) {
    const relative = path.relative(root, file).split(path.sep).join('/');
    const stat = await fs.lstat(file).catch(error => { if (error.code === 'ENOENT') return null; throw error; });
    if (!stat) return;
    if (conflictName.test(path.basename(file))) {
      issues.push({path:relative,code:'sync_conflict'});
      return;
    }
    if (stat.isSymbolicLink()) {
      issues.push({path:relative,code:'source_symlink'});
      return;
    }
    if (stat.isDirectory()) {
      if (runtimeNames.has(path.basename(file))) return;
      for (const name of (await fs.readdir(file)).sort()) await visit(path.join(file,name));
    } else if (stat.isFile() && codeExtension.test(file)) {
      if (marker.test(await fs.readFile(file,'utf8'))) issues.push({path:relative,code:'merge_marker'});
    }
  }
  for (const name of roots) await visit(path.join(root,name));
  return issues;
}
