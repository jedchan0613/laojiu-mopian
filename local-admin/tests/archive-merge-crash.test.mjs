import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {spawn} from 'node:child_process';
import {openExecutionRecovery} from './helpers/merge-execution-fixture.mjs';
import {actor} from './helpers/merge-fixture.mjs';

for(const phase of ['prepared','file-written','favorites-applied','previous-dist-retained','dist-switched','committed'])test('实际进程退出 '+phase+'：重启后按日志证明结果再恢复', {timeout:30000},async t=>{
 const control=await fs.mkdtemp(path.join(os.tmpdir(),'ljm-merge-crash-'));let fixtureRoot,recovered;
 t.after(async()=>{
   recovered?.store.close();
   if(fixtureRoot){assert.ok(path.resolve(fixtureRoot).startsWith(path.resolve(os.tmpdir())+path.sep+'ljm-merge-test-'));await fs.rm(fixtureRoot,{recursive:true,force:true,maxRetries:10,retryDelay:100});}
   assert.ok(path.resolve(control).startsWith(path.resolve(os.tmpdir())+path.sep+'ljm-merge-crash-'));await fs.rm(control,{recursive:true,force:true});
 });
 const info=path.join(control,'info.json'),worker=path.join(control,'worker.mjs');
 await fs.writeFile(worker,`import fs from 'node:fs/promises';import {randomUUID} from 'node:crypto';
import {executionFixture} from ${JSON.stringify(new URL('./helpers/merge-execution-fixture.mjs',import.meta.url).href)};
const f=await executionFixture({after(){}},{afterPhase:async value=>{if(value===${JSON.stringify(phase)})process.exit(91);}});
const {payload}=await f.prepare(),operation={operationId:randomUUID(),stepId:randomUUID(),markChanged(){}};
await fs.writeFile(${JSON.stringify(info)},JSON.stringify({root:f.root,ids:f.ids,before:await f.state(),operation}));
await f.engine.execute(payload,'local:synthetic-test',operation);process.exit(0);`);
 const child=spawn(process.execPath,[worker],{windowsHide:true,stdio:['ignore','pipe','pipe']});let output='';child.stdout.on('data',b=>output+=b);child.stderr.on('data',b=>output+=b);
 const code=await new Promise((resolve,reject)=>{child.on('error',reject);child.on('exit',resolve);});assert.equal(code,91,output);
 const data=JSON.parse(await fs.readFile(info,'utf8'));fixtureRoot=data.root;recovered=openExecutionRecovery(fixtureRoot);
 const log=await recovered.engine.byOperation(data.operation.operationId,data.operation.stepId,actor);
 if(['favorites-applied','previous-dist-retained','dist-switched','committed'].includes(phase))assert.throws(()=>recovered.store.archiveMerge.resolveForWrite(data.ids[1]),{code:'MERGE_FAVORITES_LOCKED'});
 const result=await recovered.engine.recover(log.merge_id,actor);
 if(phase==='committed'){
   assert.equal(result.status,'committed');assert.equal(recovered.store.archiveMerge.resolveForWrite(data.ids[1]),data.ids[0]);
 }else{
   assert.equal(result.status,'rolled-back');assert.deepEqual(await recovered.state(data.ids),data.before);assert.equal(recovered.store.archiveMerge.resolveForWrite(data.ids[1]),data.ids[1]);
 }
});
