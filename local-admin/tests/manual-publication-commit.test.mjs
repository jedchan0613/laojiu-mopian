import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {randomBytes} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {createSubmissionStore} from '../submissions.mjs';
import {createReleaseDeployer,readLiveRelease} from '../release-deployer.mjs';

const key=()=>randomBytes(32).toString('hex');
const accountId='usr_'+'a'.repeat(24);
const siteDirectory=fileURLToPath(new URL('../../site/',import.meta.url));
const metadata={schema_version:1,brand_name:'合成来源',model_texts:['COMMIT-TEST'],product_name:'合成物件',category_key:'tools',document_kind:'user-guide',languages:['zh-CN'],completeness:'complete',region_display:'地区未注明',edition_display:'合成版',source_note:'合成测试',rights_basis:'official-link',sharing_scope:'official-link',official_url:'https://example.invalid/manual',people:'none',attribution:'anonymous'};

async function fixture(t){
  const root=await fs.mkdtemp(path.join(os.tmpdir(),'ljm-manual-commit-'));
  t.after(async()=>{assert.equal(path.dirname(path.resolve(root)),path.resolve(os.tmpdir()));assert(path.basename(root).startsWith('ljm-manual-commit-'));await fs.rm(root,{recursive:true,force:true});});
  const submissions=path.join(root,'submissions'),store=createSubmissionStore({root:submissions,siteDirectory});
  // 此测试只验证已核验快照的提交锁；整册审核证明由专门的图片/PDF审核测试覆盖。
  const created=await store.createAccountManualDraft({accountId,payload:{request_key:key(),manual:metadata}}),recordFile=path.join(submissions,created.id,'record.json');
  const record=JSON.parse(await fs.readFile(recordFile));Object.assign(record,{status:'approved',linked_item_id:'LJM-20000101-RPR-001'});await fs.writeFile(recordFile,JSON.stringify(record));
  const stop=()=>store.operateAccountManualSubmission({id:record.id,accountId,payload:{action:'withdraw',revision:record.revision,operation_id:key()}});
  return {root,submissions,store,record,recordFile,stop};
}

test('最终来源锁覆盖实际异步提交，提交失败释放锁后可以正常申请停止',async t=>{
  const f=await fixture(t),guard=f.store.createPublicationGuard([f.record,f.record]);
  assert.equal(guard.records.length,1,'同册重复快照只加一次锁');
  await assert.rejects(guard.withCommit(async()=>{
    await fs.access(path.join(f.submissions,'.'+f.record.id+'.lock'));
    await assert.rejects(f.stop(),{statusCode:409});
    throw new Error('SYNTHETIC-COMMIT-FAIL');
  }),/SYNTHETIC-COMMIT-FAIL/);
  await assert.rejects(fs.access(path.join(f.submissions,'.'+f.record.id+'.lock')));
  assert.equal((await f.stop()).withdrawal_requested,true);
  let switched=false;await assert.rejects(guard.withCommit(()=>{switched=true;}),{statusCode:409});assert.equal(switched,false);
});

test('快照不能由调用者改写，内容变化或同册冲突快照均阻止提交',async t=>{
  const f=await fixture(t),guard=f.store.createPublicationGuard([f.record]);
  f.record.private_note='CHANGED-SYNTHETIC';guard.records[0].private_note='CHANGED-SYNTHETIC';
  await fs.writeFile(f.recordFile,JSON.stringify(f.record));
  await assert.rejects(guard.validate(),{statusCode:409});
  assert.throws(()=>f.store.createPublicationGuard([f.record,{...f.record,revision:f.record.revision+1}]),{statusCode:409});
});

test('版本准备后已受理的停止申请在真正切站前拦截，保留当前公开版本',async t=>{
  const f=await fixture(t),guard=f.store.createPublicationGuard([f.record]),source=path.join(f.root,'source'),releases=path.join(f.root,'releases'),previous=path.join(releases,'previous'),live=path.join(releases,'live');
  await fs.mkdir(source);await fs.mkdir(previous,{recursive:true});await fs.writeFile(path.join(previous,'index.html'),'OLD');
  await fs.symlink(process.platform==='win32'?previous:path.basename(previous),live,process.platform==='win32'?'junction':'dir');
  for(const name of ['index.html','404.html','robots.txt','sitemap.xml'])await fs.writeFile(path.join(source,name),'NEW');
  const deployer=createReleaseDeployer({sourceDirectory:source,releasesDirectory:releases,liveLink:live});let accepted=false;
  await assert.rejects(deployer.deploy({onPrepared:async()=>{accepted=(await f.stop()).withdrawal_requested;},withCommit:guard.withCommit}),/停止处理|投稿已变化/);
  assert.equal(accepted,true);assert.equal((await readLiveRelease(releases,live)).resolvedTarget,previous);
  assert.equal(await fs.readFile(path.join(live,'index.html'),'utf8'),'OLD');assert.deepEqual(await fs.readdir(releases),['live','previous']);
});
