// Windows上的内部协议回归使用合成执行器；不能作为Linux隔离通过的证明。
import test from 'node:test';import assert from 'node:assert/strict';import fs from'node:fs/promises';import os from'node:os';import path from'node:path';import net from'node:net';import{PassThrough}from'node:stream';import{once}from'node:events';import{randomBytes,generateKeyPairSync}from'node:crypto';import{createRequire}from'node:module';
import{pdfSigningIdentity,verifyLinuxPdfOrigin,verifiedLinuxPdfGeneration}from'../manual-pdf-attestation.mjs';
import{createLinuxPdfBridge}from'../manual-pdf-linux-bridge.mjs';import{createLinuxManualPdfRuntime,jpegDimensions}from'../manual-pdf-linux-runtime.mjs';import{linuxPdfClientDigest,linuxPdfHash}from'../manual-pdf-linux-engine.mjs';import{createPdfFrameReader,writePdfFrame}from'../manual-pdf-frames.mjs';
import{createManualAccountFixture}from'./helpers/manual-account-fixture.mjs';import{addReviewPdf,key}from'./helpers/manual-pdf-review-fixture.mjs';
import{createSubmissionStore,privacyChecks}from'../submissions.mjs';import{manualReviewChecks}from'../../shared/manual-review.mjs';
import{createPdfPublicationFixture}from'./helpers/manual-pdf-publication-fixture.mjs';import{manualPublicationInput}from'../manuals.mjs';
import{execFile}from'node:child_process';import{promisify}from'node:util';
import{manualPdfReviewChecks,manualPdfConsentStatements,manualPdfConfirmationVersion}from'../../shared/manual-pdf-review.mjs';import{manualConsentVersion}from'../../shared/manual-workflow.mjs';import{fileURLToPath}from'node:url';
const sharp=createRequire(new URL('../../site/package.json',import.meta.url))('sharp'),digest='a'.repeat(64);
async function fixture(t,{hold=false}={}){
 const root=await fs.mkdtemp(path.join(os.tmpdir(),'ljm-pdf-bridge-')),socketFile=process.platform==='win32'?'\\\\.\\pipe\\ljm-pdf-bridge-'+randomBytes(12).toString('hex'):path.join(root,'bridge.sock');let ready,release;const entered=new Promise(r=>{ready=r;}),gate=new Promise(r=>{release=r;});let opens=0,proof=false;
 const jpeg=await sharp({create:{width:8,height:12,channels:3,background:'white'}}).jpeg().toBuffer(),children=new Map();
 const backend={async launch(_config,s){opens++;const child={stdin:new PassThrough(),stdout:new PassThrough(),stderr:new PassThrough()};children.set(s.unit,child);const reader=createPdfFrameReader(child.stdin);void(async()=>{await writePdfFrame(child.stdout,{ok:true,ready:true,uid:65534,capabilities:0,no_new_privileges:true});try{for(;;){const {header}=await reader.frame();if(header.op==='inspect'){const geometry=[{page:1,width:595,height:842,rotation:0}];await writePdfFrame(child.stdout,{ok:true,sequence:header.sequence,pages:1,geometry,warnings:[],diagnostic_bytes:0,pdf_version:'1.4',inspection:{checked_at:new Date().toISOString()},private_path:'SHOULD-NOT-LEAVE-WORKER'});}else{ready();if(hold)await gate;if(!child.stdout.destroyed)await writePdfFrame(child.stdout,{ok:true,sequence:header.sequence,width:8,height:12,diagnostic_bytes:0,warning:null,private_path:'SHOULD-NOT-LEAVE-WORKER'},jpeg);}}}catch{}})();return child;},async stop(unit){const child=children.get(unit);if(child){child.stdin.destroy();child.stdout.destroy();child.stderr.destroy();children.delete(unit);}return {cleanup:true};}};
 const {privateKey}=generateKeyPairSync('ed25519'),identity=pdfSigningIdentity(privateKey);
 const build=()=>createLinuxPdfBridge({config:{directory:path.join(root,'private'),socket_file:socketFile,installation_id:'b'.repeat(64),enabled:true},engine:async()=>({fingerprint:digest,version:'synthetic-linux',client_digest:await linuxPdfClientDigest(),production_verified:proof,attestation_key_id:identity.key_id}),backend,signingKey:privateKey,secureSocket:async()=>{}});let bridge=await build();await bridge.listen();
 const runtime=createLinuxManualPdfRuntime({socketFile,platform:'linux',verifySocket:async()=>{}});
 t.after(async()=>{release();await bridge.close();const resolved=path.resolve(root);assert.equal(path.dirname(resolved),path.resolve(os.tmpdir()));assert(path.basename(resolved).startsWith('ljm-pdf-bridge-'));await fs.rm(resolved,{recursive:true,force:true});});
 return {root,get bridge(){return bridge;},runtime,socketFile,jpeg,entered,release,identity,async restart(){bridge=await build();await bridge.listen();},get opens(){return opens;},setProof:value=>{proof=value;},get childCount(){return children.size;}};
}
async function channel(f){const socket=net.connect(f.socketFile);socket.on('error',()=>{});await once(socket,'connect');return {socket,reader:createPdfFrameReader(socket)};}
async function poll(check){const until=Date.now()+5000;while(!await check()){if(Date.now()>until)throw new Error('fixture_condition_timeout');await new Promise(r=>setTimeout(r,10));}}

test('Linux通道就绪不能自动通过生产验收；JPEG头尺寸检查不调用账号进程中的解码器',async t=>{
 const f=await fixture(t);assert.equal((await f.runtime.status()).available,true);assert.equal((await f.runtime.status()).production_verified,false);f.setProof(true);assert.equal((await f.runtime.status()).production_verified,true);assert.deepEqual(jpegDimensions(f.jpeg),{width:8,height:12});assert.throws(()=>jpegDimensions(Buffer.from('%PDF-SYNTHETIC')));
});
test('账号HTTP流程接入固定Linux通道，整册保存后临时源已清理，工作进程私密字段不返回账号',async t=>{
 const f=await fixture(t),account=await createManualAccountFixture({submissionOptions:{pdfGenerationRuntime:f.runtime}});t.after(()=>account.close());const book=await addReviewPdf(account),operation_id=key(),r=await account.submissions.getAccountManualSubmission(book);
 assert.equal((await account.request('/api/account/manual-drafts/'+book.id+'/pdf/generations',{method:'POST',body:{operation_id,revision:r.revision,profile:'standard'}})).status,200);await account.submissions.waitForPdfGenerationIdle();
 const result=await account.request('/api/account/manual-submissions/'+book.id);assert.equal(result.body.manual_pdf_generation.operation.state,'succeeded');assert.equal(result.body.images.length,1);assert.doesNotMatch(JSON.stringify(result.body),/SHOULD-NOT-LEAVE|linux-session|private_path/);assert.equal(f.childCount,0);assert.equal((await fs.readdir(path.join(f.root,'private/sessions'))).length,0);
 const job=JSON.parse(await fs.readFile(path.join(account.root,'submissions',book.id,'pdf/jobs',result.body.manual_pdf_generation.operation.job_id,'job.json'),'utf8'));assert.equal(job.transient_source_copies,1);assert.equal(job.budget_bytes,0);
 assert.equal(verifyLinuxPdfOrigin(job.origin_attestation,job,{...f.identity,engine_fingerprints:[digest]}),true);assert.doesNotMatch(JSON.stringify(result.body),/origin_attestation|attestation_public_key/);
 const secret=JSON.parse(await fs.readFile(path.join(account.root,'submissions',book.id,'pdf/jobs',job.job_id,'control/linux-session.json'),'utf8')).token;assert(!JSON.stringify(result.body).includes(secret));
});
test('生成进行中关闭PDF仍能取消；通道取消不等待当前页面回复，旧资料保留',async t=>{
 const f=await fixture(t,{hold:true}),account=await createManualAccountFixture({submissionOptions:{pdfGenerationRuntime:f.runtime}});t.after(()=>account.close());const book=await addReviewPdf(account),operation_id=key(),r=await account.submissions.getAccountManualSubmission(book),base='/api/account/manual-drafts/'+book.id+'/pdf';
 await account.request(base+'/generations',{method:'POST',body:{operation_id,revision:r.revision,profile:'standard'}});await f.entered;account.setPdfOpen(false);assert.equal((await account.request(base+'/generation-operations/'+operation_id+'/cancel',{method:'POST'})).status,200);f.release();await account.submissions.waitForPdfGenerationIdle();assert.equal((await account.request(base+'/generation-operations/'+operation_id)).body.state,'cancelled');assert.equal(f.childCount,0);
});
test('未完整上传已占用唯一任务；第二连接不能竞争源预算，取消可回收未开流任务',async t=>{
 const f=await fixture(t),first=await channel(f),token=key(),body=Buffer.from('%PDF-1.4\nSYNTHETIC'),header={op:'open',token,job_id:'PG-'+'1'.repeat(24),source_sha256:linuxPdfHash(body),engine_fingerprint:digest,profile:'standard',bytes:body.length};
 const bytes=Buffer.from(JSON.stringify(header)),prefix=Buffer.alloc(4);prefix.writeUInt32BE(bytes.length);first.socket.write(Buffer.concat([prefix,bytes]));await poll(()=>f.bridge.sessions.size===1);
 const second=await channel(f);await writePdfFrame(second.socket,{...header,token:key()},body);assert.equal((await second.reader.frame()).header.ok,false);second.socket.destroy();
 const cancel=await channel(f);await writePdfFrame(cancel.socket,{op:'cancel',token});assert.equal((await cancel.reader.frame()).header.cleanup,true);cancel.socket.destroy();first.socket.destroy();assert.equal(f.opens,0);await poll(()=>f.bridge.sessions.size===0);
});
test('外部不能提交程序、路径、额外字段或超大源；拒绝前不调用执行器',async t=>{
 const f=await fixture(t);
 for(const request of [{op:'exec',command:'/usr/bin/id'},{op:'open',path:'/etc/private'},{op:'status',path:'/tmp'},{op:'open',token:key(),job_id:'PG-'+'1'.repeat(24),source_sha256:'c'.repeat(64),engine_fingerprint:digest,profile:'standard',bytes:20*1024**2+1}]){const c=await channel(f),data=Buffer.from(JSON.stringify({bytes:0,...request})),prefix=Buffer.alloc(4);prefix.writeUInt32BE(data.length);c.socket.write(Buffer.concat([prefix,data]));const r=await c.reader.frame();assert.equal(r.header.ok,false);c.socket.destroy();}assert.equal(f.opens,0);
});
test('帧上限在分配负载前执行，部分前缀及合并数据包仍可准确读取',async()=>{
 const pipe=new PassThrough(),reader=createPdfFrameReader(pipe);await writePdfFrame(pipe,{op:'fixture'},Buffer.from('abc'));const r=await reader.frame(3);assert.equal(r.body.toString(),'abc');pipe.destroy();
 const malformed=new PassThrough(),bad=createPdfFrameReader(malformed),prefix=Buffer.alloc(4);prefix.writeUInt32BE(65537);malformed.end(prefix);await assert.rejects(bad.header());
});
test('处理通道在页面回复前断开即回收受限任务；清理结果未知时保留预留及待核对状态',async t=>{
 const f=await fixture(t,{hold:true}),account=await createManualAccountFixture({submissionOptions:{pdfGenerationRuntime:f.runtime}});t.after(()=>account.close());const book=await addReviewPdf(account),r=await account.submissions.getAccountManualSubmission(book),operation_id=key();
 await account.request('/api/account/manual-drafts/'+book.id+'/pdf/generations',{method:'POST',body:{operation_id,revision:r.revision,profile:'standard'}});await f.entered;await f.bridge.close();f.release();await account.submissions.waitForPdfGenerationIdle();
 const result=await account.submissions.getAccountManualSubmission(book);assert.equal(result.manual_pdf_generation.operation.state,'needs_review');assert(result.manual_pdf.reserved_bytes>0);assert.equal(f.childCount,0);assert.equal(result.manual_pdf.retained_sources,1);
 await f.restart();const recovered=await account.submissions.getAccountManualPdfGeneration({...book,operationId:operation_id});assert.equal(recovered.state,'interrupted');assert.equal((await account.submissions.getAccountManualSubmission(book)).manual_pdf.reserved_bytes,0);assert.equal(f.opens,1,'恢复不得自动重跑');
});
test('本地离线审核只接受预先信任的服务端签名，篡改或撤销信任暂停新审核；21项检查仍必填',async t=>{
 const f=await fixture(t),account=await createManualAccountFixture({submissionOptions:{pdfGenerationRuntime:f.runtime}});t.after(()=>account.close());const book=await addReviewPdf(account),r=await account.submissions.getAccountManualSubmission(book);
 await account.submissions.beginAccountManualPdfGeneration({...book,payload:{operation_id:key(),revision:r.revision,profile:'standard'}});await account.submissions.waitForPdfGenerationIdle();
 const trustFile=path.join(f.root,'trusted-linux.json'),trust={schema:1,servers:[{...f.identity,engine_fingerprints:[digest]}]},root=path.join(account.root,'submissions');
 const offline=createSubmissionStore({root,siteDirectory:fileURLToPath(new URL('../../site/',import.meta.url)),pdfGenerationRuntime:{configuration:async()=>{throw new Error('offline');},status:async()=>({available:false}),recover:async()=>({cleanup:true})},pdfGenerationOptions:{pdfGenerationTrustFile:trustFile}});
 assert.equal((await offline.getAccountManualSubmission(book)).manual_pdf_review.can_submit,false);await fs.writeFile(trustFile,JSON.stringify(trust));let draft=await offline.getAccountManualSubmission(book);assert.equal(draft.manual_pdf_review.can_submit,true);assert.equal(draft.manual_pdf_generation.preview.engine_current,true);
 const jobFile=path.join(root,book.id,'pdf/jobs',draft.manual_pdf_generation.operation.job_id,'job.json'),job=JSON.parse(await fs.readFile(jobFile,'utf8'));
 assert.equal(await verifiedLinuxPdfGeneration(job,{execution_platform:'linux',fingerprint:'e'.repeat(64),attestation_public_key:f.identity.public_key,attestation_key_id:f.identity.key_id},{trustFile}),false,'当前Linux配置变更不得由旧离线信任表覆盖');
 for(const mutate of [x=>{x.source.sha256='f'.repeat(64);},x=>{x.pages[0].sha256='f'.repeat(64);},x=>{x.profile='detail';},x=>{x.inspection.geometry[0].width=600;},x=>{x.origin_attestation.signature='A'.repeat(88);},x=>{x.tool_version='different';}]){const altered=structuredClone(job);mutate(altered);assert.equal(await verifiedLinuxPdfGeneration(altered,null,{trustFile}),false);}
 await offline.operateAccountManualSubmission({...book,payload:{action:'submit',operation_id:key(),revision:draft.revision,consent_version:manualConsentVersion,consents:{copies:true,rights:true,privacy:true,processing:true},pdf_confirmation:{version:manualPdfConfirmationVersion,token:draft.manual_pdf_review.confirmation_token,checks:Object.fromEntries(Object.keys(manualPdfConsentStatements).map(k=>[k,true]))}}});
 const rawFile=path.join(root,book.id,'record.json'),raw=JSON.parse(await fs.readFile(rawFile,'utf8')),v=raw.versions.at(-1),approval={revision:raw.revision,submitted_revision:raw.manual_submitted_revision,snapshot_digest:v.digest,status:'approved',public_message:'合成审核',private_note:'私密合成审核',model_basis:'合成依据',source_basis:'合成依据',rights_basis:'合成依据',checks:manualReviewChecks.map(()=>true),privacy_checks:privacyChecks.map(()=>true),pdf_checks:manualPdfReviewChecks.map(()=>true)};
 const missing={...approval};delete missing.pdf_checks;await assert.rejects(offline.reviewManualSubmission(book.id,missing));await offline.reviewManualSubmission(book.id,approval);
 assert.equal((await offline.getManualReview(book.id)).status,'approved');assert(v.pdf.origin_attestation);await fs.writeFile(trustFile,JSON.stringify({schema:1,servers:[]}));assert((await offline.getManualReview(book.id)).pdf_review.problems.length>0);
 const page=v.images[0];assert.equal(linuxPdfHash(await offline.getAccountManualVersionImage({...book,revision:v.revision,filename:page.filename})),page.sha256);
 await fs.writeFile(trustFile,JSON.stringify(trust));const altered=structuredClone(job);altered.origin_attestation.signature='B'.repeat(88);await fs.writeFile(jobFile,JSON.stringify(altered));assert((await offline.getManualReview(book.id)).pdf_review.problems.length>0);
});
test('带Linux来源签名的整册可通过原有人工审核与草稿交接，签名和私密源不进入公开投影',async t=>{
 const bridge=await fixture(t),f=await createPdfPublicationFixture(t,{runtime:bridge.runtime});await f.handoff();const r=await f.raw(),v=r.versions.at(-1);assert(v.pdf.origin_attestation);assert.equal(f.draft.manual_submission.pages.length,1);await f.store.guardPublication(f.catalog.id,async verify=>verify({draft:f.draft,images:await f.images()}));
 const projected=JSON.stringify(manualPublicationInput((await f.catalog.store.bootstrap()).state.draft));for(const privateValue of [v.pdf.origin_attestation.key_id,v.pdf.origin_attestation.signature,v.pdf.source.sha256,v.pdf.source.filename,'origin_attestation',f.accountId])assert(!projected.includes(privateValue));
});
test('通过版本目录链接启动仍进入CLI身份检查，不会静默退出并被误认为已启动',{skip:process.platform!=='win32'},async t=>{
 const root=await fs.mkdtemp(path.join(os.tmpdir(),'ljm-pdf-main-link-')),alias=path.join(root,'current'),project=fileURLToPath(new URL('../../',import.meta.url));await fs.symlink(project,alias,'junction');t.after(async()=>{assert.equal(path.dirname(root),path.resolve(os.tmpdir()));await fs.unlink(alias);await fs.rmdir(root);});
 await assert.rejects(promisify(execFile)(process.execPath,[path.join(alias,'local-admin/manual-pdf-linux-bridge.mjs')],{windowsHide:true}),error=>error.code===1&&error.stderr.includes('Linux root service required'));
});
