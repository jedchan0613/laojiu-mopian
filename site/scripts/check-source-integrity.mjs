import { fileURLToPath } from 'node:url';
import { findSourceIntegrityIssues } from '../../shared/source-integrity.mjs';

const root = fileURLToPath(new URL('../../',import.meta.url));
const issues = await findSourceIntegrityIssues(root);
if (issues.length) {
  console.error('程序目录含同步冲突或未完成的合并，已在生成图片和构建前停止：');
  for (const issue of issues) console.error(`${issue.code}: ${issue.path}`);
  process.exitCode = 1;
} else console.log('源码完整性检查通过：未混入同步冲突副本或合并标记。');
