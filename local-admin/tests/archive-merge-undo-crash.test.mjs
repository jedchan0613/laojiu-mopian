import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {spawn} from 'node:child_process';
import {openExecutionRecovery} from './helpers/merge-execution-fixture.mjs';
import {createMergeUndo} from '../archive-merge-undo.mjs';
import {actor} from './helpers/merge-fixture.mjs';

for(const[mode,phase]of [...['file-written','favorites-applied','previous-dist-retained','dist-switched','committed'].map(phase=>['republish',phase]),...['drafts-prepared','draft-written'].map(phase=>['drafts',phase])])test('撤销实际进程退出 '+mode+'/'+phase+'：日志恢复后保留原操作，不卡住收藏', {timeout:90000},async t=>{
 const control=await fs.mkdtemp(path.join(os.tmpdir(),'ljm-undo-crash-'));let fixtureRoot,recovered;
 t.after(async()=>{
   recovered?.store.close();
   if(fixtureRoot){assert.ok(path.resolve(fixtureRoot).startsWith(path.resolve(os.tmpdir())+path.sep+'ljm-merge-test-'));await fs.rm(fixtureRoot,{recursive:true,force:true,maxRetries:10,retryDelay:100});}
   assert.ok(path.resolve(control).startsWith(path.resolve(os.tmpdir())+path.sep+'ljm-undo-crash-'));await fs.rm(control,{recursive:true,force:true});
 });
 const info=path.join(control,'info.json'),worker=path.join(control,'worker.mjs');
 await fs.writeFile(worker,`import fs from 'node:fs/promises';import {randomUUID} from 'node:crypto';
import {executionFixture} from ${JSON.stringify(new URL('./helpers/merge-execution-fixture.mjs',import.meta.url).href)};
import {createMergeUndo} from ${JSON.stringify(new URL('../archive-merge-undo.mjs',import.meta.url).href)};
const f=await executionFixture({after(){}},{afterPhase:async(value,log)=>{if(log.operation_kind==='undo'&&value===${JSON.stringify(phase)})process.exit(91);}});
const op=()=>({operationId:randomUUID(),stepId:randomUUID(),markChanged(){}});
const {payload}=await f.prepare(),merged=await f.engine.execute(payload,'local:synthetic-test',op());
const undo=createMergeUndo({...f.engineOptions,engine:f.engine,afterPhase:async value=>{if(value===${JSON.stringify(phase)})process.exit(91);}});
const review=await undo.review({mergeId:merged.mergeId},'local:synthetic-test'),operation=op();
await fs.writeFile(${JSON.stringify(info)},JSON.stringify({root:f.root,ids:f.ids,mergeId:merged.mergeId,before:await f.state(),operation}));
if(${JSON.stringify(mode)}==='drafts')await undo.drafts({mergeId:merged.mergeId,reviewId:review.reviewId,mode:'drafts'},'local:synthetic-test',operation);
else await undo.publish({mergeId:merged.mergeId,reviewId:review.reviewId,mode:'republish',confirmPrimaryId:f.ids[0],confirmSecondaryId:f.ids[1],confirmations:Array(13).fill(true),publicationAuthorization:{restorePrimary:true,restoreSecondary:true,restoreReferences:true}},'local:synthetic-test',operation);
process.exit(0);`);
 const child=spawn(process.execPath,[worker],{windowsHide:true,stdio:['ignore','pipe','pipe']});let output='';child.stdout.on('data',b=>output+=b);child.stderr.on('data',b=>output+=b);
 const code=await new Promise((resolve,reject)=>{child.on('error',reject);child.on('exit',resolve);});assert.equal(code,91,output);
 const data=JSON.parse(await fs.readFile(info,'utf8'));fixtureRoot=data.root;recovered=openExecutionRecovery(fixtureRoot);
 if(mode==='drafts'){
   const undo=createMergeUndo({directory:path.join(fixtureRoot,'private/merges'),draftDirectory:path.join(fixtureRoot,'private/drafts'),engine:recovered.engine});
   const log=await undo.byOperation(data.operation.operationId,data.operation.stepId,actor);assert.equal((await undo.recoverDrafts(log.undo_id,actor)).status,'rolled-back');
   assert.deepEqual(await fs.readdir(path.join(fixtureRoot,'private/drafts')),[]);assert.deepEqual(await recovered.state(data.ids),data.before);
 }else{
   const log=await recovered.engine.byOperation(data.operation.operationId,data.operation.stepId,actor),result=await recovered.engine.recover(log.merge_id,actor);
   if(phase==='committed'){assert.equal(result.status,'committed');assert.equal((await recovered.engine.detail(data.mergeId,actor)).status,'reverted');assert.equal(recovered.store.archiveMerge.resolveForWrite(data.ids[1]),data.ids[1]);}
   else{assert.equal(result.status,'rolled-back');assert.deepEqual(await recovered.state(data.ids),data.before);assert.equal((await recovered.engine.detail(data.mergeId,actor)).status,'committed');assert.equal(recovered.store.archiveMerge.resolveForWrite(data.ids[1]),data.ids[0]);}
 }
});
