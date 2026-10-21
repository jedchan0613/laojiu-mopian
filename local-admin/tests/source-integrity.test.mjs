import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import assert from 'node:assert/strict';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { findSourceIntegrityIssues } from '../../shared/source-integrity.mjs';

async function fixture(t) {
  const root = await fs.mkdtemp(path.join(os.tmpdir(),'ljm-source-integrity-'));
  t.after(async()=>{
    assert.equal(path.dirname(root),path.resolve(os.tmpdir()));
    assert.ok(path.basename(root).startsWith('ljm-source-integrity-'));
    await fs.rm(root,{recursive:true,force:true});
  });
  const write = async (name,value='export {};')=>{
    const file=path.join(root,name);await fs.mkdir(path.dirname(file),{recursive:true});await fs.writeFile(file,value);
  };
  return {root,write};
}

test('真实程序目录不得包含同步冲突副本或合并标记',async()=>{
  assert.deepEqual(await findSourceIntegrityIssues(fileURLToPath(new URL('../../',import.meta.url))),[]);
});

test('源码中的百度云冲突文件与上传中标记阻止构建',async t=>{
  const {root,write}=await fixture(t);
  await write('site/src/pages/index_冲突文件_35171_20261020143451.astro');
  await write('shared/.baiduyun.uploading.cfg','{}');
  assert.deepEqual((await findSourceIntegrityIssues(root)).map(x=>x.code),['sync_conflict','sync_conflict']);
});

test('未解决合并标记被拒绝，普通比较运算和中文不误报',async t=>{
  const {root,write}=await fixture(t);
  await write('shared/valid.mjs','export const result = 9 > 7; // 普通文字');
  await write('local-admin/tests/example.mjs',['<'.repeat(7)+' HEAD','const value=1;','='.repeat(7),'const value=2;','>'.repeat(7)+' branch'].join('\n'));
  assert.deepEqual(await findSourceIntegrityIssues(root),[{path:'local-admin/tests/example.mjs',code:'merge_marker'}]);
});

test('不读取运行资料或输出区，也不把文档备份作为网页源码',async t=>{
  const {root,write}=await fixture(t);
  for(const folder of ['local-admin/accounts','local-admin/drafts','local-admin/translations','outputs','docs']) await write(folder+'/private_冲突文件_1_2.json','{}');
  await write('site/src/pages/index.astro','<p>安全样例</p>');
  assert.deepEqual(await findSourceIntegrityIssues(root),[]);
});
