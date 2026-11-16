import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {prepareManualReleaseGuard} from '../manual-release-guard.mjs';
import {createSyntheticTransferFixture} from './helpers/manual-synthetic-transfer-fixture.mjs';

for(const change of ['replace','truncate','delete','directory-link','hard-link'])test('准备后公开图片变化仍阻止通用及Git最终提交：'+change,async t=>{
  const f=await createSyntheticTransferFixture(t,{pages:1});await f.handoff();const archive=await f.expose();
  const sourceGuard=await f.store.prepareManualPublication([archive]),combined=f.store.createPublicationGuard(sourceGuard.records,{additionalGuards:[sourceGuard]}),gitGuard=await prepareManualReleaseGuard(f.releaseOptions);
  let normal=0;await combined.withCommit(()=>{normal++;});await gitGuard.withCommit(()=>{normal++;});assert.equal(normal,2,'未变化的真实合成副本可正常提交');
  const file=path.join(f.site,'public',archive.core.publication_file_path[0]),bytes=await fs.readFile(file);
  if(change==='replace'){const changed=Buffer.from(bytes);changed[changed.length-5]^=1;await fs.writeFile(file,changed);}
  if(change==='truncate')await fs.writeFile(file,bytes.subarray(0,-2));
  if(change==='delete')await fs.unlink(file);
  if(change==='directory-link'){const directory=path.dirname(file),moved=path.join(f.dir,'synthetic-linked-public');await fs.rename(directory,moved);await fs.symlink(moved,directory,process.platform==='win32'?'junction':'dir');}
  if(change==='hard-link'){const saved=path.join(f.dir,'synthetic-hardlink.jpg');await fs.writeFile(saved,bytes);await fs.unlink(file);await fs.link(saved,file);}
  for(const guard of [sourceGuard,combined,gitGuard]){
    await assert.rejects(guard.validate(),{statusCode:409});let committed=false;
    await assert.rejects(guard.withCommit(()=>{committed=true;}),{statusCode:409});assert.equal(committed,false,'图片变化后不得进入真正提交');
  }
});
