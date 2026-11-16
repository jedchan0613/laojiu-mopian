import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {randomUUID} from 'node:crypto';
import {createSubmissionStore} from '../submissions.mjs';
import {createManualStore} from '../manuals.mjs';
import {createWriteCoordinator} from '../write-coordinator.mjs';
import {createWriteCoordinator as createLegacyWrites} from './helpers/legacy-write-coordinator-1e84c27.mjs';
import {createManualStore as createLegacyCatalog} from './helpers/legacy-manuals-1e84c27.mjs';
import {manualFixtureCatalog} from './helpers/manuals-fixture.mjs';
import {createSyntheticRecoveryFixture,temporaryRecoveryDirectory,fileManifest,emptyCatalog,syntheticIdentity,createSyntheticBackup,restoreSyntheticBackup,sha} from './helpers/manual-upgrade-fixture.mjs';

const programCatalog=(root,site,extra={})=>createManualStore({root,siteDirectory:site,readArchives:async()=>[],build:async()=>{throw new Error('只读升级不得触发构建');},requireInitialization:true,...extra});
const content=files=>files.map(({path,bytes,sha256})=>({path,bytes,sha256}));
test('旧基线已保存的空目录和非空正式目录升级后原字节保留，不重新初始化或替换已有草稿',async t=>{
  for(const nonempty of [false,true]){
    const root=await temporaryRecoveryDirectory(t),privateRoot=path.join(root,'manuals'),site=path.join(root,'site');await fs.mkdir(site,{recursive:true});
    const previous=createLegacyCatalog({root:privateRoot,siteDirectory:site,readArchives:async()=>[],build:async()=>{await fs.mkdir(path.join(site,'dist'),{recursive:true});await fs.writeFile(path.join(site,'dist','index.html'),'SYNTHETIC-LEGACY-SITE');return 'SYNTHETIC';}});
    await previous.save({expectedRevision:(await previous.bootstrap()).revision,catalog:nonempty?manualFixtureCatalog():emptyCatalog()});
    if(nonempty){let state=await previous.bootstrap(),review=await previous.prepare({expectedRevision:state.revision});assert.equal(review.issues.length,0);await previous.publish({expectedRevision:state.revision,review_id:review.review_id,confirmations:Array(5).fill(true)});state=await previous.bootstrap();const draft=structuredClone(state.state.published);draft.documents[0].review_note='SYNTHETIC-LEGACY-DRAFT-MUST-STAY';await previous.save({expectedRevision:state.revision,catalog:draft});}
    const before=await fileManifest(root),reopened=await programCatalog(privateRoot,site).bootstrap();assert.equal(reopened.readiness.status,'ready');assert.equal(reopened.state.published.documents.length,Number(nonempty));assert.equal(reopened.state.draft.documents.length,Number(nonempty));if(nonempty)assert.equal(reopened.state.draft.documents[0].review_note,'SYNTHETIC-LEGACY-DRAFT-MUST-STAY');
    assert.deepEqual(await fileManifest(root),before,'读取新版不应重写旧正式目录、历史、草稿或公开输入');
  }
});
test('旧基线审核、完整交接和待核对记录升级只读保留，不补签审核、不解除未决或重分编号',async t=>{
  for(const scenario of [{transfer:false,interrupted:false},{transfer:true,interrupted:false},{transfer:true,interrupted:true}]){
    const f=await createSyntheticRecoveryFixture(t,{legacy:true,...scenario}),original=await f.readRecord();
    const before=await Promise.all(Object.values(f.roots).map(fileManifest));
    const reopened=createSubmissionStore({root:f.roots.submissions,siteDirectory:f.site});
    const current=await reopened.getManualReview(f.id),online=await reopened.getManualReview(f.id,{online:true});assert.equal(current.status,'approved');assert.deepEqual(current.manual_review_binding,original.manual_review_binding);assert.deepEqual(current.manual_handoff,original.manual_handoff);assert.equal(online.review_validity.valid,false,'旧审核没有当前服务器身份凭证，不能自动补签为线上有效');
    const catalog=await programCatalog(f.roots.manuals,f.site).bootstrap();assert.equal(catalog.readiness.status,'ready');assert.equal(catalog.state.draft.documents.length,Number(scenario.transfer&&!scenario.interrupted));
    const writes=await createWriteCoordinator({directory:f.roots.operations});
    if(scenario.interrupted){assert.throws(()=>writes.assertReady(),{code:'OPERATION_NEEDS_REVIEW'});assert.equal(writes.query(f.identity.operationId)[0].status,'needs_review');assert.equal(current.manual_handoff.status,'needs_review');}
    else writes.assertReady();
    if(scenario.transfer)await assert.rejects(reopened.transferManualSubmission(f.id,{...f.payload,revision:current.revision},{planCatalog:()=>{throw new Error('升级不得重新写目录');},createArchive:()=>{throw new Error('升级不得重新分号或复制');},importCatalog:()=>{throw new Error('升级不得覆盖目录');}},syntheticIdentity()),{statusCode:409});
    assert.deepEqual(await Promise.all(Object.values(f.roots).map(fileManifest)),before);
  }
});
test('旧程序读取新整册交接回执失败封闭，不静默丢掉新字段或修改回执；新版仍可读取',async t=>{
  const f=await createSyntheticRecoveryFixture(t),before=await fileManifest(f.roots.operations);
  assert.equal(f.result.operation.result.manualTransfer.submissionId,f.id);
  await assert.rejects(createLegacyWrites({directory:f.roots.operations}),{code:'JOURNAL_INVALID'});
  assert.deepEqual(await fileManifest(f.roots.operations),before,'旧程序拒绝时不得修造、清空或改写新回执');
  const restored=await createWriteCoordinator({directory:f.roots.operations});assert.deepEqual(restored.query(f.identity.operationId)[0].result.manualTransfer,f.result.manualTransferResult);restored.assertReady();
});

async function recoveredFixture(t,{interrupted=false}={}){
  const f=await createSyntheticRecoveryFixture(t,{interrupted}),backup=path.join(f.root,'backup'),restored=path.join(f.root,'restored');
  const manifest=await createSyntheticBackup(f,backup);assert(manifest.length>0&&manifest.length<30);assert(manifest.every(row=>/^(?:config|submissions|manuals|operations|drafts|inbox)\//.test(row.path)));assert(!manifest.some(row=>/(?:^|\/)(?:accounts|outbox|site|dist|node_modules|archive-data)(?:\/|$)/.test(row.path)));assert(manifest.reduce((n,row)=>n+row.bytes,0)<512*1024);
  await restoreSyntheticBackup(backup,restored);assert.deepEqual(content(await fileManifest(restored)),content(manifest).sort((a,b)=>a.path.localeCompare(b.path)));
  // 让原副本不可供新实例读取，证明恢复没有暗中依赖原路径或原进程内存。
  for(const source of Object.values(f.roots)){
    const resolved=path.resolve(source),relative=path.relative(path.resolve(os.tmpdir()),resolved);assert(!relative.startsWith('..')&&!path.isAbsolute(relative));assert(/^(?:ljm-manual-recovery84-|ljm-manual-accounts-)/.test(relative));assert(['submissions','manuals','drafts','inbox','operations','config'].includes(path.basename(resolved)));await fs.rename(resolved,resolved+'.source-unavailable');
  }
  const site=path.join(restored,'application-site');await fs.mkdir(site,{recursive:true});
  const store=createSubmissionStore({root:path.join(restored,'submissions'),siteDirectory:site}),catalog=programCatalog(path.join(restored,'manuals'),site),writes=await createWriteCoordinator({directory:path.join(restored,'operations')});
  const record=await store.getManualReview(f.id);assert.equal(record.status,'approved');assert.equal(record.manual_handoff.status,interrupted?'needs_review':'complete');assert.equal(record.manual_review_binding.digest,f.payload.snapshot_digest);assert.equal(record.manual_submitted_revision,f.payload.submitted_revision);assert.equal((await catalog.bootstrap()).readiness.status,'ready');
  const adapters={inspectCatalog:()=>catalog.bootstrap(),inspectArchive:async itemId=>{const draft=JSON.parse(await fs.readFile(path.join(restored,'drafts',itemId+'.json'),'utf8')),images=[];for(const ref of draft.record.core.publication_file_path){const filename=path.basename(ref),bytes=await fs.readFile(path.join(restored,'inbox',itemId,filename));images.push({filename,sha256:sha(bytes),bytes:bytes.length});}return {draft,images};}};
  const proof=await store.inspectManualTransfer(f.id,f.identity,adapters);
  if(interrupted){assert.throws(()=>writes.assertReady(),{code:'OPERATION_NEEDS_REVIEW'});assert.equal(proof.status,'needs_review');assert.equal(writes.query(f.identity.operationId)[0].status,'needs_review');assert.equal((await fileManifest(path.join(restored,'inbox'))).length,1);}
  else {writes.assertReady();assert.equal(proof.status,'succeeded');assert.deepEqual(proof.result.manualTransfer,f.result.manualTransferResult);assert.equal((await catalog.bootstrap()).state.draft.documents[0].source_submission_digest,record.manual_review_binding.digest);const draft=(await adapters.inspectArchive(f.itemId)).draft;assert.equal(draft.record.core.record_status,'SUS');assert.equal(draft.record.core.privacy_level,'Y');assert.equal(draft.record.core.use_status,'U0');assert.equal(draft.record.core.rights_status,'UNK');assert.equal(draft.record.metadata.schema,'common');assert.equal(draft.source_submission_id,f.id);assert.equal(draft.manual_submission.digest,record.manual_review_binding.digest);}
  t.diagnostic(`合成${interrupted?'部分交接':'完整交接'}备份：${manifest.length}个业务文件，${manifest.reduce((n,row)=>n+row.bytes,0)}字节；备份与独立恢复合计${2*manifest.reduce((n,row)=>n+row.bytes,0)}字节（另加小型清单）。`);
  return {f,manifest,backup,restored};
}
test('最小相关合成备份独立恢复后整册、目录草稿和应用来源证明均一致，不包含全站或账号备份',async t=>{await recoveredFixture(t);});
test('部分交接和needs_review合成备份独立恢复后仍冻结，已复制页和原操作编号完整保留',async t=>{await recoveredFixture(t,{interrupted:true});});
test('合成备份摘要被修改时拒绝采用损坏副本，不用原业务目录补齐',async t=>{
  const f=await createSyntheticRecoveryFixture(t),backup=path.join(f.root,'backup'),manifest=await createSyntheticBackup(f,backup);await fs.appendFile(path.join(backup,manifest[0].path),'SYNTHETIC-TAMPER');await assert.rejects(restoreSyntheticBackup(backup,path.join(f.root,'invalid-restore')));assert.equal((await f.readRecord()).manual_handoff.status,'complete');
});
test('Linux实测：独立合成恢复文件权限及uid/gid与清单一致，所有私密目录保持0700',{skip:process.platform!=='linux'},async t=>{
  const {manifest,restored}=await recoveredFixture(t);
  for(const file of manifest){const stat=await fs.stat(path.join(restored,file.path));assert.equal(stat.mode&0o777,file.mode);assert.equal(stat.uid,file.uid);assert.equal(stat.gid,file.gid);assert.equal(stat.uid,process.getuid());}
  for(const directory of ['config','submissions','manuals','operations','drafts','inbox']){const stat=await fs.stat(path.join(restored,directory));assert.equal(stat.mode&0o777,0o700);assert.equal(stat.uid,process.getuid());assert.equal(stat.gid,process.getgid());}
  t.diagnostic('Linux uid/gid及POSIX权限为当前低权限进程的实际stat结果；本测试不具备、也不声称跨owner恢复或提权chown。');
});
