import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {randomUUID} from 'node:crypto';
import {createWriteCoordinator} from '../write-coordinator.mjs';
const target='TG-'+ 'A'.repeat(24),actor='admin@example.test';
const manualTransfer={submissionId:target,revision:8,submittedRevision:3,snapshotDigest:'a'.repeat(64),manualKey:'manual-'+ 'b'.repeat(24),itemId:null,pages:0,sharingScope:'official-link'};
async function fixture(t){const directory=await fs.mkdtemp(path.join(os.tmpdir(),'ljm-transfer-receipt-'));t.after(()=>fs.rm(directory,{recursive:true,force:true}));return {directory,writes:await createWriteCoordinator({directory})};}
function request(){return {operationId:randomUUID(),stepId:randomUUID(),kind:'manual-transfer',target,payload:{body:{confirmed:true},actor}};}
test('官网交接的完整回执持久保存并可重启查询，拒绝额外私密字段',async t=>{
  const {directory,writes}=await fixture(t),req=request();let calls=0;
  await writes.perform(req,async()=>{calls++;return {};},()=>({manualTransfer}));
  await writes.perform(req,()=>{calls++;},()=>({manualTransfer}));assert.equal(calls,1);
  const restarted=await createWriteCoordinator({directory});assert.deepEqual((await restarted.query(req.operationId))[0].result,{manualTransfer});
  const bad=request();await assert.rejects(writes.perform(bad,()=>({}),()=>({manualTransfer:{...manualTransfer,actor}})),/摘要格式/);
});
test('未知交接只有完整证据才能补回执，部分证据/跨投稿/不同类型均不能释放',async t=>{
  const {writes}=await fixture(t),req=request();
  await assert.rejects(writes.perform(req,context=>{context.markChanged();throw new Error('synthetic after handoff');}));
  const identity={...req,actor};
  assert.equal((await writes.resolveManualTransferAttempt(identity,()=>({status:'needs_review'}))).state,'needs-review');
  await assert.rejects(writes.resolveManualTransferAttempt({...identity,target:'TG-'+ 'B'.repeat(24)},()=>({status:'succeeded',result:{manualTransfer}})),/不属于/);
  await assert.rejects(writes.resolveManualTransferAttempt(identity,()=>({status:'succeeded',result:{}})),/摘要格式/);
  const resolved=await writes.resolveManualTransferAttempt(identity,()=>({status:'succeeded',result:{manualTransfer}}));assert.equal(resolved.state,'succeeded');
  assert.equal((await writes.query(req.operationId))[0].status,'succeeded');
  assert.equal((await writes.resolveManualTransferAttempt({...request(),actor},()=>null)).state,'needs-review');
});
test('核对进行中的原交接只返回running，不调用证据检查或重放',async t=>{
  const {writes}=await fixture(t),req=request();let done,start;const started=new Promise(r=>start=r),hold=new Promise(r=>done=r);
  const task=writes.perform(req,async()=>{start();await hold;return {};},()=>({manualTransfer}));await started;
  const result=await writes.resolveManualTransferAttempt({...req,actor},()=>assert.fail('不能核对正在运行的写入'));assert.equal(result.state,'running');done();await task;
});
