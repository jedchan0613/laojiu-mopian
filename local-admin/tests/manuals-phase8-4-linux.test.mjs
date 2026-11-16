import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {spawn,execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {once} from 'node:events';
import {fileURLToPath} from 'node:url';
import {createSubmissionStore} from '../submissions.mjs';
import {prepareManualReleaseGuard} from '../manual-release-guard.mjs';
import {createMergePublication} from '../archive-merge-production.mjs';
import {createReleaseDeployer,readLiveRelease} from '../release-deployer.mjs';
import {treeDigest} from '../archive-merge-files.mjs';
import {createSyntheticTransferFixture,syntheticKey,syntheticIdentity,syntheticApproval} from './helpers/manual-synthetic-transfer-fixture.mjs';
import {createManualOnlineFixture} from './helpers/manuals-online-fixture.mjs';
import {seedSyntheticManualPages,syntheticManualMetadata} from './helpers/manual-synthetic-pages.mjs';
import {manualConsentVersion} from '../../shared/manual-workflow.mjs';

if(process.env.LJM_REQUIRE_LINUX_ACCEPTANCE==='true'&&process.platform!=='linux')throw Error('要求真实Linux验收，不能将平台跳过计作通过');
if(process.env.LJM_REQUIRE_LINUX_ACCEPTANCE==='true'&&!process.env.LJM_REAL_ENOSPC_DIRECTORY)throw Error('真实资源不足验收缺少独立受限tmpfs，不能只用异常注入代替');
const linux={skip:process.platform!=='linux'?'必须在真实Linux合成目录执行，不把Windows跳过计通过':false,timeout:60000};
const run=promisify(execFile),until=async check=>{for(let n=0;n<500;n++){if(await check())return;await new Promise(resolve=>setTimeout(resolve,10));}throw Error('合成进程等待超时');};

test('无本机解码器的合成夹具仍走真实17项审核、200页交接及结果证明',{timeout:60000},async t=>{
  const f=await createSyntheticTransferFixture(t,{pages:200}),result=await f.handoff();
  assert.equal(result.manualTransferResult.pages,200);assert.equal((await f.load()).manual_handoff.copied_pages.length,200);
  assert.equal((await f.store.inspectManualTransfer(f.submissionId,f.context,f.inspect)).status,'succeeded');
  const repeated=await f.handoff();assert(repeated.repeated);assert.equal((await fs.readdir(f.copies)).length,200);
});

test('Linux非PDF真实HTTP审核、整册转入和重放成功，PDF所有线上能力仍为0',linux,async t=>{
  const f=await createManualOnlineFixture(t,{enabled:true,reviewEnabled:true,transferEnabled:true}),caps=(await f.get('/healthz')).body.capabilities;
  assert.equal(caps.manualReviewVersion,1);assert.equal(caps.manualTransferVersion,1);assert.equal(caps.manualPdfHandoffVersion,0);
  for(const [name,value]of Object.entries(caps))if(/^manualPdf.*Version$/.test(name))assert.equal(value,0,name);
  assert.equal((await f.save({schema_version:1,brands:[],models:[],documents:[]})).status,200);
  const store=createSubmissionStore({root:f.env.LJM_SUBMISSION_DATA_DIR,siteDirectory:f.site}),accountId='usr_'+'a'.repeat(24),created=await store.createAccountManualDraft({accountId,payload:{request_key:syntheticKey(),manual:syntheticManualMetadata}}),id=created.id;
  let r=await seedSyntheticManualPages({submissionRoot:f.env.LJM_SUBMISSION_DATA_DIR,id,pages:3});
  await store.operateAccountManualSubmission({id,accountId,payload:{action:'submit',revision:r.revision,operation_id:syntheticKey(),consent_version:manualConsentVersion,consents:{copies:true,rights:true,privacy:true,processing:true}}});
  const base='/api/admin/manual-submissions/'+id;let current=(await f.get(base)).body;
  assert.equal((await f.post(base+'/review',syntheticApproval(current.record))).status,200);current=(await f.get(base)).body;
  const payload={revision:current.record.revision,submitted_revision:current.record.manual_submitted_revision,snapshot_digest:current.record.versions.at(-1).digest,catalog_revision:(await f.get('/api/manuals')).body.revision,confirmed:true,title:'Linux8.4合成册',public_description:'仅隔离合成资料',product_name:syntheticManualMetadata.product_name,region_display:'地区未注明',edition_display:'合成第一版',object_type:'OTH',accession_date:'2000-01-01'},ids={operationId:crypto.randomUUID(),stepId:crypto.randomUUID()};
  const result=await f.post(base+'/transfer',payload,ids);assert.equal(result.status,200,JSON.stringify(result.body));assert(result.body.item_id);assert.equal((await f.post(base+'/transfer',payload,ids)).body.replayed,true);
  const after=(await f.get('/api/manuals')).body;assert.equal(after.state.published.documents.length,0);assert.equal(after.state.draft.documents[0].page_map.length,3);assert.equal((await f.get('/healthz')).body.capabilities.manualPdfHandoffVersion,0);
});

test('Linux逐册锁跨进程覆盖真正提交，同册停止被短锁保护且另一册不串锁',linux,async t=>{
  const f=await createSyntheticTransferFixture(t);await f.handoff();const record=await f.raw(),snapshot=path.join(f.dir,'synthetic-source-snapshot.json'),entered=path.join(f.dir,'commit-entered'),release=path.join(f.dir,'commit-release');await fs.writeFile(snapshot,JSON.stringify(record));
  const moduleUrl=new URL('../submissions.mjs',import.meta.url).href;
  const child=spawn(process.execPath,['--input-type=module','-e',`import fs from 'node:fs/promises';import {createSubmissionStore} from ${JSON.stringify(moduleUrl)};const [root,site,snapshot,entered,release]=process.argv.slice(1);const store=createSubmissionStore({root,siteDirectory:site});await store.createPublicationGuard([JSON.parse(await fs.readFile(snapshot))]).withCommit(async()=>{await fs.writeFile(entered,'entered');for(let n=0;n<500;n++){if(await fs.stat(release).catch(()=>null))return;await new Promise(r=>setTimeout(r,10));}throw Error('release timeout');});`,f.submissionRoot,f.site,snapshot,entered,release],{stdio:['ignore','pipe','pipe'],windowsHide:true});
  let output='';child.stderr.on('data',bytes=>output+=bytes);t.after(()=>{if(child.exitCode===null&&child.signalCode===null)child.kill('SIGKILL');});
  await until(()=>fs.stat(entered).catch(()=>null));await assert.rejects(f.stop(),{statusCode:409});
  const other=await f.store.createAccountManualDraft({accountId:f.accountId,payload:{request_key:syntheticKey(),manual:{...syntheticManualMetadata,sharing_scope:'official-link',rights_basis:'official-link',official_url:'https://support.example.com/manual'}}});
  await f.store.operateAccountManualSubmission({id:other.id,accountId:f.accountId,payload:{action:'submit',revision:1,operation_id:syntheticKey(),consent_version:manualConsentVersion,consents:{copies:true,rights:true,privacy:true,processing:true}}});let r=await f.store.getManualReview(other.id);await f.store.reviewManualSubmission(other.id,syntheticApproval(r),syntheticIdentity());r=JSON.parse(await fs.readFile(path.join(f.submissionRoot,other.id,'record.json')));
  assert.equal(await f.store.createPublicationGuard([r]).withCommit(()=>true),true);
  const exited=once(child,'exit');await fs.writeFile(release,'release');const [code]=await exited;assert.equal(code,0,output);
  assert.equal((await f.stop()).withdrawal_requested,true);await assert.rejects(f.store.guardManualCommit([record],()=>{throw Error('不应进入提交');}),{statusCode:409});
});

test('Linux独立1MiB tmpfs真实ENOSPC中断整册写入，编号和待核对状态保留',{...linux,skip:process.platform!=='linux'||!process.env.LJM_REAL_ENOSPC_DIRECTORY?'需独立私有命名空间的受限tmpfs；未配置不计通过':false},async t=>{
  const directory=path.resolve(process.env.LJM_REAL_ENOSPC_DIRECTORY);
  assert.equal(directory,'/var/tmp/ljm-manuals-8-4-20261116/enospc');
  const stat=await fs.statfs(directory);assert.equal(Number(stat.type),0x01021994,'必须是真实tmpfs');
  const available=Number(stat.bavail)*Number(stat.bsize);assert(available>=256*1024&&available<=2*1024*1024,'受限空间必须在预定小预算内');
  const filler=path.join(directory,'synthetic-fill'),page=path.join(directory,'synthetic-page.jpg');
  await fs.writeFile(filler,Buffer.alloc(available-128),{flag:'wx',mode:0o600});
  try{
    const f=await createSyntheticTransferFixture(t);
    await assert.rejects(f.store.transferManualSubmission(f.submissionId,f.payload,{...f.adapters,createArchive:async input=>{await input.onReserved(f.id);await fs.writeFile(page,await input.readImage(input.images[0].page_id),{flag:'wx',mode:0o600});throw Error('受限空间意外写入成功');}},f.context),error=>error.code==='ENOSPC');
    const r=await f.raw();assert.equal(r.manual_handoff.archive_item_id,f.id);assert.equal(r.manual_handoff.status,'needs_review');assert.equal(r.manual_handoff.copied_pages.length,0);assert.equal((await f.store.inspectManualTransfer(f.submissionId,f.context,f.inspect)).status,'needs_review');
  }finally{await fs.unlink(filler);await fs.unlink(page).catch(error=>{if(error.code!=='ENOENT')throw error;});}
});

for(const stopped of [false,true])test('Linux Git实际公开切换来源门禁：'+(stopped?'准备后已受理停止保留旧live':'CLI正常切换'),linux,async t=>{
  const f=await createSyntheticTransferFixture(t);await f.handoff();await f.expose();const p=await f.releaseFixture();
  if(!stopped){
    await run(process.execPath,[fileURLToPath(new URL('../../deployment/publish-built-site.mjs',import.meta.url)),f.dist,p.releases,p.live,'github-synthetic84'],{env:{...process.env,LJM_ADMIN_DATA_ROOT:f.privateRoot,LJM_SUBMISSION_DATA_DIR:f.submissionRoot,LJM_ARCHIVE_DATA_DIR:f.archiveDataDirectory},timeout:30000,maxBuffer:1024*1024});
    assert.notEqual((await readLiveRelease(p.releases,p.live)).resolvedTarget,p.previous);
  }else{
    const guard=await prepareManualReleaseGuard(f.releaseOptions),deployer=createReleaseDeployer({sourceDirectory:f.dist,releasesDirectory:p.releases,liveLink:p.live,manualsRoot:f.root});
    await assert.rejects(deployer.deploy({onPrepared:async()=>{assert.equal((await f.stop()).withdrawal_requested,true);await guard.validate();},withCommit:guard.withCommit}),/停止处理|投稿已变化/);assert.equal((await readLiveRelease(p.releases,p.live)).resolvedTarget,p.previous);
  }
});

for(const stopped of [false,true])test('Linux合并实际公开切换复用非PDF来源门禁：'+(stopped?'最终提交前停止不切站':'正常切换'),linux,async t=>{
  const f=await createSyntheticTransferFixture(t);await f.handoff();await f.expose();const p=await f.releaseFixture(),publication=createMergePublication({siteDirectory:f.site,releasesDirectory:p.releases,liveLink:p.live,applicationLink:f.dir,preparePublication:()=>prepareManualReleaseGuard(f.releaseOptions)}),log={publicationBefore:await publicationCapture(),distAfter:await treeDigest(f.dist)};
  async function publicationCapture(){return publication.capture();}
  const action=()=>publication.publish(log,async phase=>{if(stopped&&phase==='public-switch-intent')assert.equal((await f.stop()).withdrawal_requested,true);});
  if(stopped){await assert.rejects(action(),/停止处理|投稿已变化/);assert.equal((await readLiveRelease(p.releases,p.live)).resolvedTarget,p.previous);}else{await action();await publication.verify(log);assert.notEqual((await readLiveRelease(p.releases,p.live)).resolvedTarget,p.previous);}
});
