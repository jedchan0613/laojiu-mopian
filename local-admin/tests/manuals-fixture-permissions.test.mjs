import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {makeCopiedFixtureStandardsWritable} from './helpers/manuals-http-fixture.mjs';

test('只读标准源复制后仅新夹具副本恢复0700/0600并可清理，原源字节与权限不变',async t=>{
  const root=await fs.mkdtemp(path.join(os.tmpdir(),'ljm-manuals-phase3-permission-')),source=path.join(root,'synthetic-readonly-source'),sourceNested=path.join(source,'nested'),sourceFile=path.join(sourceNested,'synthetic.json'),target=path.join(root,'site/src/data/standards');
  t.after(async()=>{assert.equal(path.dirname(path.resolve(root)),path.resolve(os.tmpdir()));assert(path.basename(root).startsWith('ljm-manuals-phase3-permission-'));await fs.chmod(source,0o700);await fs.chmod(sourceNested,0o700);await fs.chmod(sourceFile,0o600);await fs.rm(root,{recursive:true,force:true});});
  await fs.mkdir(sourceNested,{recursive:true,mode:0o700});await fs.writeFile(sourceFile,'{"synthetic":true}\n',{mode:0o600});
  await fs.chmod(sourceFile,0o444);await fs.chmod(sourceNested,0o555);await fs.chmod(source,0o555);
  const before={bytes:await fs.readFile(sourceFile),fileMode:(await fs.stat(sourceFile)).mode,dirMode:(await fs.stat(sourceNested)).mode};
  await fs.mkdir(path.dirname(target),{recursive:true,mode:0o700});await fs.cp(source,target,{recursive:true});
  await makeCopiedFixtureStandardsWritable(root);
  if(process.platform!=='win32'){assert.equal((await fs.stat(target)).mode&0o777,0o700);assert.equal((await fs.stat(path.join(target,'nested'))).mode&0o777,0o700);assert.equal((await fs.stat(path.join(target,'nested/synthetic.json'))).mode&0o777,0o600);}
  await fs.writeFile(path.join(target,'nested/write-proof'),'synthetic',{mode:0o600});await fs.unlink(path.join(target,'nested/synthetic.json'));await fs.rm(path.join(root,'site'),{recursive:true,force:true});
  assert.deepEqual(await fs.readFile(sourceFile),before.bytes);assert.equal((await fs.stat(sourceFile)).mode,before.fileMode);assert.equal((await fs.stat(sourceNested)).mode,before.dirMode);
  await assert.rejects(makeCopiedFixtureStandardsWritable(source),/只允许处理/);
  await fs.symlink(source,path.join(root,'site'),process.platform==='win32'?'junction':'dir');await assert.rejects(makeCopiedFixtureStandardsWritable(root),/链接/);assert.deepEqual(await fs.readFile(sourceFile),before.bytes);assert.equal((await fs.stat(sourceFile)).mode,before.fileMode);
});
