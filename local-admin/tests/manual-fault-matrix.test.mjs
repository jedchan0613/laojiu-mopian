import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {fork} from 'node:child_process';
import {once} from 'node:events';
import {createWriteCoordinator} from '../write-coordinator.mjs';
import {createFaultFixture,openFaultFixture} from './helpers/manual-fault-fixture.mjs';
async function fixture(t,pages=3){const directory=await fs.mkdtemp(path.join(os.tmpdir(),'ljm-manual-fault84-'));t.after(()=>fs.rm(directory,{recursive:true,force:true}));return {directory,config:await createFaultFixture(directory,{pages})};}
for(const point of ['started','reserved','page-1','page-2','page-3','draft-written','archive-recorded','catalog-written','complete'])test('真实子进程强杀后保留检查点：'+point,{timeout:15000},async t=>{
  const {directory,config}=await fixture(t),child=fork(new URL('./helpers/manual-fault-child.mjs',import.meta.url),[directory,point],{stdio:['ignore','ignore','pipe','ipc'],windowsHide:true});
  let errors='';child.stderr.on('data',b=>errors+=b);const ended=once(child,'exit');
  t.after(async()=>{if(child.exitCode===null&&child.signalCode===null)child.kill('SIGKILL');await ended;});
  const marker=await Promise.race([once(child,'message').then(([m])=>m),ended.then(()=>{throw new Error('未抵达检查点：'+errors);})]);assert.equal(marker.checkpoint,point);child.kill('SIGKILL');await ended;
  const f=await openFaultFixture(config),record=await f.read(),h=record.manual_handoff;
  assert.equal(h.status,point==='complete'?'complete':'in-progress');
  if(point!=='started')assert.equal(h.archive_item_id,f.itemId);
  const writes=await createWriteCoordinator({directory:path.join(directory,'private','operations')}),op=(await writes.query(config.context.operationId))[0];assert.equal(op.status,'needs_review');
  assert.equal(await fs.stat(f.lock).then(s=>s.isDirectory()),true,'强杀留下逐册锁，不自动删除');
  await assert.rejects(f.review.inspectTransfer(config.id,config.context,f.inspect),{code:'EEXIST'});
  // 独立合成目录：父进程已wait确认唯一持锁子进程死亡，再人工核对并移开该锁；不是生产自动回收。
  await fs.rmdir(f.lock);
  const proof=await f.review.inspectTransfer(config.id,config.context,f.inspect);assert.equal(proof.status,point==='complete'?'succeeded':'needs_review');
  const result=await writes.resolveManualTransferAttempt({...config.context,target:config.id},()=>proof);assert.equal(result.state,point==='complete'?'succeeded':'needs-review');
  const before=JSON.stringify(await f.read());await assert.rejects(f.review.transfer(config.id,config.payload,f.adapters,{...config.context,operationId:'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'}));assert.equal(JSON.stringify(await f.read()),before,'核对不重写或补全部分交接');
});
for(const point of ['reserved','page-1','draft-written','catalog-written'])test('空间耗尽异常保留部分结果且不允许安全重试：'+point,async t=>{
  const {directory,config}=await fixture(t);let injected=false;
  const f=await openFaultFixture(config,{checkpoint:async name=>{if(!injected&&name===point){injected=true;throw Object.assign(new Error('合成磁盘满'),{code:'ENOSPC'});}}}),writes=await createWriteCoordinator({directory:path.join(directory,'private','operations')});
  await assert.rejects(writes.perform({...config.context,kind:'manual-transfer',target:config.id,payload:config.payload},ctx=>f.review.transfer(config.id,config.payload,f.adapters,{...ctx,...config.context}),r=>({manualTransfer:r.manualTransferResult})),{code:'OPERATION_NEEDS_REVIEW'});
  assert.equal((await f.read()).manual_handoff.status,'needs_review');assert.equal((await writes.query(config.context.operationId))[0].status,'needs_review');assert.equal((await f.review.inspectTransfer(config.id,config.context,f.inspect)).status,'needs_review');
});
for(const point of ['before-write','page-1','draft-written','catalog-written'])test('取消边界只在可证明无写入时结束：'+point,async t=>{
  const {directory,config}=await fixture(t),controller=new AbortController();
  const f=await openFaultFixture(config,{checkpoint:async name=>{if(name===point)controller.abort();}}),writes=await createWriteCoordinator({directory:path.join(directory,'private','operations')});if(point==='before-write')controller.abort();
  const req={...config.context,kind:'manual-transfer',target:config.id,payload:config.payload};
  let result,error;try{result=await writes.perform(req,ctx=>f.review.transfer(config.id,config.payload,f.adapters,{...ctx,...config.context,signal:controller.signal}),r=>({manualTransfer:r.manualTransferResult}));}catch(e){error=e;}
  const r=await f.read(),op=(await writes.query(config.context.operationId))[0];
  if(point==='before-write'){assert(error);assert.equal(r.manual_handoff,undefined);assert.equal(op.status,'failed');}
  else{assert.equal(error.code,'OPERATION_NEEDS_REVIEW');assert.equal(r.manual_handoff.status,'needs_review');assert.equal(op.status,'needs_review');if(point==='page-1'){assert.equal(r.manual_handoff.copied_pages.length,1);assert.equal((await fs.readdir(f.inbox)).length,1);}if(point==='catalog-written')assert.equal((await f.catalog.bootstrap()).state.draft.documents.length,1);}
});
test('可用空间不足在复制和编号预留前拒绝，私密投稿保持原样',async t=>{
  const {directory,config}=await fixture(t),f=await openFaultFixture(config),before=JSON.stringify(await f.read()),original=fs.statfs;
  try{fs.statfs=async()=>({bavail:0n,bsize:4096n});await assert.rejects(f.review.transfer(config.id,config.payload,f.adapters,config.context),/空间不足/);}
  finally{fs.statfs=original;}
  assert.equal(JSON.stringify(await f.read()),before);await assert.rejects(fs.access(f.inbox),{code:'ENOENT'});await assert.rejects(fs.access(f.draftFile),{code:'ENOENT'});
});
