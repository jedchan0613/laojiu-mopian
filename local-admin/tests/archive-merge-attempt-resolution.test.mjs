import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {randomUUID} from 'node:crypto';
import {createWriteCoordinator,WriteSafetyError} from '../write-coordinator.mjs';
import {fixture as httpFixture,operation} from './helpers/merge-fixture.mjs';
import {acquireDeploymentLock} from '../archive-merge-production.mjs';

const actor='local:synthetic-attempt';
const ids=['LJM-20000101-LET-001','LJM-20000101-LET-002'];
const attempt=()=>({operationId:randomUUID(),stepId:randomUUID(),actor});
const original=a=>({operationId:a.operationId,stepId:a.stepId,kind:'merge-records',target:ids,payload:{synthetic:true}});
const gate=()=>{let resolve;return{promise:new Promise(done=>resolve=done),resolve:()=>resolve()};};
async function fixture(t,options={}){
 const directory=await fs.mkdtemp(path.join(os.tmpdir(),'ljm-attempt-fence-'));
 t.after(async()=>{assert.ok(path.resolve(directory).startsWith(path.resolve(os.tmpdir())+path.sep+'ljm-attempt-fence-'));await fs.rm(directory,{recursive:true,force:true,maxRetries:10,retryDelay:100});});
 return{directory,writes:await createWriteCoordinator({directory,...options}),file:a=>path.join(directory,a.operationId+'.'+a.stepId+'.json')};
}

test('空合并请求必须写持久取消收据；重复核对与重启后迟到请求均不执行',async t=>{
 const f=await fixture(t),a=attempt(),resolved=await f.writes.resolveMergeAttempt(a,async()=>null);
 assert.equal(resolved.state,'not-started');assert.equal(resolved.operation.kind,'merge-not-started');assert.equal(resolved.operation.status,'cancelled');
 const before=await fs.readFile(f.file(a),'utf8');assert.ok(!before.includes(actor));
 assert.deepEqual(await f.writes.resolveMergeAttempt(a,async()=>null),resolved);assert.equal(await fs.readFile(f.file(a),'utf8'),before);
 let called=false;await assert.rejects(f.writes.perform(original(a),async()=>{called=true;}),{code:'OPERATION_MISMATCH'});assert.equal(called,false);
 const restarted=await createWriteCoordinator({directory:f.directory});
 await assert.rejects(restarted.perform(original(a),async()=>{called=true;}),{code:'OPERATION_MISMATCH'});assert.equal(called,false);
 assert.equal((await restarted.resolveMergeAttempt(a,async()=>null)).state,'not-started');assert.equal(await fs.readFile(f.file(a),'utf8'),before);
 await assert.rejects(restarted.resolveMergeAttempt({...a,actor:'other:synthetic'},async()=>null),{statusCode:403});
});

test('核实期间的迟到原请求等待屏障并被拒绝，不覆盖取消收据',async t=>{
 const f=await fixture(t),a=attempt(),started=gate(),release=gate();let called=false;
 const resolving=f.writes.resolveMergeAttempt(a,async()=>{started.resolve();await release.promise;return null;});await started.promise;
 const late=f.writes.perform(original(a),async()=>{called=true;}),rejected=assert.rejects(late,{code:'OPERATION_MISMATCH'});
 release.resolve();assert.equal((await resolving).state,'not-started');await rejected;assert.equal(called,false);assert.equal(f.writes.query(a.operationId).length,1);
});

test('正在运行不解锁；完成有真实日志才返回终态且不改原收据',async t=>{
 const f=await fixture(t),a=attempt(),started=gate(),release=gate();
 const running=f.writes.perform(original(a),async()=>{started.resolve();await release.promise;return{};});await started.promise;
 const busy=await f.writes.resolveMergeAttempt(a,async()=>assert.fail('运行中不得认定不存在'));
 assert.equal(busy.state,'running');release.resolve();await running;
 const before=await fs.readFile(f.file(a),'utf8'),merge={status:'committed',merge_id:randomUUID()};
 assert.equal((await f.writes.resolveMergeAttempt(a,async()=>merge)).state,'finished');assert.equal(await fs.readFile(f.file(a),'utf8'),before);
 assert.equal((await f.writes.resolveMergeAttempt(a,async()=>null)).state,'needs-review');assert.equal(await fs.readFile(f.file(a),'utf8'),before);
});

test('明确失败无日志可重新核对，结果不一致、未知或读取失败不伪称未执行',async t=>{
 const f=await fixture(t),a=attempt();
 await assert.rejects(f.writes.perform(original(a),async()=>{throw new WriteSafetyError('合成提交前失败',422,'MERGE_REVIEW_EXPIRED');}));
 const before=await fs.readFile(f.file(a),'utf8');assert.equal((await f.writes.resolveMergeAttempt(a,async()=>null)).state,'not-started');
 assert.equal((await f.writes.resolveMergeAttempt(a,async()=>({status:'rolled-back'}))).state,'finished');
 assert.equal((await f.writes.resolveMergeAttempt(a,async()=>({status:'committed'}))).state,'needs-review');assert.equal(await fs.readFile(f.file(a),'utf8'),before);
 for(const inspect of [async()=>({status:'committed'}),async()=>{throw Error('合成读取失败');},async()=>undefined]){
  const unknown=attempt();assert.equal((await f.writes.resolveMergeAttempt(unknown,inspect)).state,'needs-review');await assert.rejects(fs.access(f.file(unknown)),{code:'ENOENT'});
 }
 const forbidden=attempt();await assert.rejects(f.writes.resolveMergeAttempt(forbidden,async()=>{throw new WriteSafetyError('合成其他身份日志',403,'MERGE_FORBIDDEN');}),{statusCode:403});await assert.rejects(fs.access(f.file(forbidden)),{code:'ENOENT'});
});

test('待核实收据保持防重；容量不足或其他未核实操作不能建立取消收据',async t=>{
 const f=await fixture(t),a=attempt();await assert.rejects(f.writes.perform(original(a),async context=>{context.markChanged();throw Error('合成不确定结果');}));
 const before=await fs.readFile(f.file(a),'utf8');assert.equal((await f.writes.resolveMergeAttempt(a,async()=>({status:'rolled-back'}))).state,'needs-review');assert.equal(await fs.readFile(f.file(a),'utf8'),before);
 const blocked=attempt();await assert.rejects(f.writes.resolveMergeAttempt(blocked,async()=>null),{code:'OPERATION_NEEDS_REVIEW'});await assert.rejects(fs.access(f.file(blocked)),{code:'ENOENT'});
 const small=await fixture(t,{maxEntries:1}),first=attempt();await small.writes.resolveMergeAttempt(first,async()=>null);
 const full=attempt();await assert.rejects(small.writes.resolveMergeAttempt(full,async()=>null),{code:'JOURNAL_LIMIT'});await assert.rejects(fs.access(small.file(full)),{code:'ENOENT'});
});

test('未登记的磁盘收据和其他操作类型均不覆盖',async t=>{
 const f=await fixture(t),a=attempt(),bytes='合成外部收据，不能覆盖';await fs.writeFile(f.file(a),bytes);
 await assert.rejects(f.writes.resolveMergeAttempt(a,async()=>null),{code:'JOURNAL_INVALID'});assert.equal(await fs.readFile(f.file(a),'utf8'),bytes);
 const other=attempt();await f.writes.perform({...original(other),kind:'save-merge-plan'},async()=>({}));const before=await fs.readFile(f.file(other),'utf8');
 await assert.rejects(f.writes.resolveMergeAttempt(other,async()=>null),{code:'MERGE_ATTEMPT_KIND_INVALID'});assert.equal(await fs.readFile(f.file(other),'utf8'),before);
});

test('HTTP安全解除空请求后迟到提交被拒绝，未改档案；校验身份和异常日志',async t=>{
 const f=await httpFixture(t,{http:true,internal:true}),a=operation(),before=await Promise.all(f.ids.map(id=>fs.readFile(path.join(f.archive,id+'.json'),'utf8')));
 const body={operationId:a.operationId,stepId:a.stepId};
 const response=await f.post('/api/merge-attempt/resolve',body);assert.equal(response.status,200,JSON.stringify(response.body));assert.equal(response.body.state,'not-started');
 const checked=await f.post('/api/merge-preflight',{itemIds:f.ids}),saved=await f.post('/api/merge-plan',f.payload(checked.body));assert.equal(saved.status,200);
 const review=await f.post('/api/merge-review',{planId:saved.body.plan.planId,planRevision:saved.body.plan.planRevision});assert.equal(review.status,200,JSON.stringify(review.body));
 const late=await f.post('/api/merge',{planId:saved.body.plan.planId,planRevision:saved.body.plan.planRevision,reviewId:review.body.reviewId,confirmPrimaryId:f.ids[0],confirmations:Array(13).fill(true),publicationAuthorization:{publishMergedPrimary:true,withdrawSecondary:true}},a);
 assert.equal(late.status,409);assert.equal(late.body.code,'OPERATION_MISMATCH');assert.deepEqual(await Promise.all(f.ids.map(id=>fs.readFile(path.join(f.archive,id+'.json'),'utf8'))),before);
 assert.equal((await f.post('/api/merge-attempt/resolve',{...body,actor:'spoof'})).status,400);assert.equal((await f.post('/api/merge-attempt/resolve',body,null,{origin:'https://foreign.example'})).status,403);
 const committedOp=operation(),committed=await f.post('/api/merge',{planId:saved.body.plan.planId,planRevision:saved.body.plan.planRevision,reviewId:review.body.reviewId,confirmPrimaryId:f.ids[0],confirmations:Array(13).fill(true),publicationAuthorization:{publishMergedPrimary:true,withdrawSecondary:true}},committedOp);assert.equal(committed.status,200,JSON.stringify(committed.body));
 const commitReceipt=path.join(f.privateRoot,'operations',committedOp.operationId+'.'+committedOp.stepId+'.json'),receiptBytes=await fs.readFile(commitReceipt,'utf8');
 const completed=await f.post('/api/merge-attempt/resolve',{operationId:committedOp.operationId,stepId:committedOp.stepId});assert.equal(completed.body.state,'finished');assert.equal(completed.body.merge.status,'committed');assert.equal(await fs.readFile(commitReceipt,'utf8'),receiptBytes);
 const manifest=path.join(f.directory,committed.body.merge.merge_id,'manifest.json'),manifestBytes=await fs.readFile(manifest,'utf8'),foreign={...JSON.parse(manifestBytes),actor:'other:synthetic'};await fs.writeFile(manifest,JSON.stringify(foreign));
 assert.equal((await f.post('/api/merge-attempt/resolve',{operationId:committedOp.operationId,stepId:committedOp.stepId})).status,403);await fs.writeFile(manifest,manifestBytes);
 const bad=operation(),folder=path.join(f.directory,randomUUID());await fs.mkdir(folder);await fs.writeFile(path.join(folder,'manifest.json'),'{broken-json');
 const unknown=await f.post('/api/merge-attempt/resolve',{operationId:bad.operationId,stepId:bad.stepId});assert.equal(unknown.status,200);assert.equal(unknown.body.state,'needs-review');assert.equal((await f.get('/api/operations/'+bad.operationId)).body.operations.length,0);
});

test('生产部署锁繁忙时不建立取消收据，解锁后才可安全核实', {skip:process.platform!=='linux'?'实际flock仅Linux验收':false},async t=>{
 const f=await httpFixture(t,{http:true,production:true}),a=operation(),lock=await acquireDeploymentLock(f.env.LJM_MERGE_DEPLOY_LOCK),body={operationId:a.operationId,stepId:a.stepId};
 try{const busy=await f.post('/api/merge-attempt/resolve',body);assert.equal(busy.status,423);assert.equal(busy.body.code,'MERGE_DEPLOYMENT_BUSY');assert.equal((await f.get('/api/operations/'+a.operationId)).body.operations.length,0);}finally{await lock.release();}
 const resolved=await f.post('/api/merge-attempt/resolve',body);assert.equal(resolved.status,200,JSON.stringify(resolved.body));assert.equal(resolved.body.state,'not-started');
});
