import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fixture,operation} from './helpers/merge-fixture.mjs';
const prepare=async f=>{
 const pf=(await f.post('/api/merge-preflight',{itemIds:f.ids})).body;
 const saved=await f.post('/api/merge-plan',f.payload(pf));assert.equal(saved.status,200,JSON.stringify(saved.body));
 const plan=saved.body.plan,review=await f.post('/api/merge-review',{planId:plan.planId,planRevision:plan.planRevision});assert.equal(review.status,200,JSON.stringify(review.body));
 return{plan,review:review.body,payload:{planId:plan.planId,planRevision:plan.planRevision,reviewId:review.body.reviewId,confirmPrimaryId:f.ids[0],confirmations:Array(13).fill(true),publicationAuthorization:{publishMergedPrimary:true,withdrawSecondary:true}}};
};

test('内部HTTP完整提交：13项版本门禁、原请求重放与操作详情找回',async t=>{
 const f=await fixture(t,{http:true,internal:true});
 assert.equal((await f.get('/api/merge-capabilities')).body.internalExecutionEnabled,true);
 const{payload}=await prepare(f);
 const beforeRejected=await Promise.all(f.ids.map(id=>fs.readFile(path.join(f.archive,id+'.json'),'utf8')));
 for(const invalid of [
   {confirmations:Array(13).fill(false)},
   {confirmPrimaryId:''},
   {confirmPrimaryId:f.ids[1]},
   {confirmations:Array(12).fill(true)},
   {confirmations:[...Array(12).fill(true),'true']},
   {publicationAuthorization:{publishMergedPrimary:true,withdrawSecondary:false}},
   {publicationAuthorization:{publishMergedPrimary:false,withdrawSecondary:true}},
 ])assert.equal((await f.post('/api/merge',{...payload,...invalid})).status,422);
 assert.deepEqual(await Promise.all(f.ids.map(id=>fs.readFile(path.join(f.archive,id+'.json'),'utf8'))),beforeRejected);
 const op=operation(),first=await f.post('/api/merge',payload,op);assert.equal(first.status,200,JSON.stringify(first.body));assert.equal(first.body.merge.status,'committed');
 const replay=await f.post('/api/merge',payload,op);assert.equal(replay.status,200,JSON.stringify(replay.body));assert.equal(replay.body.merge.merge_id,first.body.merge.merge_id);
 assert.equal((await f.get(`/api/merge-result/${op.operationId}/${op.stepId}`)).body.merge.status,'committed');
 const receipt=await f.get('/api/operations/'+op.operationId);assert.equal(receipt.body.operations[0].status,'succeeded');assert.ok(!JSON.stringify(receipt.body).includes('before_json'));
 const secondary=JSON.parse(await fs.readFile(path.join(f.archive,f.ids[1]+'.json'),'utf8'));assert.equal(secondary.core.use_status,'U4');
 assert.equal((await f.get('/api/merges/'+first.body.merge.merge_id)).status,200);
});

test('内部HTTP构建失败：仅留私密证据，正式文件和公开版本不变',async t=>{
 const f=await fixture(t,{http:true,internal:true}),before=await Promise.all(f.ids.map(id=>fs.readFile(path.join(f.archive,id+'.json'),'utf8')));
 await fs.writeFile(path.join(f.root,'build-fail'),'controlled');const{payload}=await prepare(f);
 const op=operation(),failed=await f.post('/api/merge',payload,op);assert.ok(failed.status>=400);
 assert.deepEqual(await Promise.all(f.ids.map(id=>fs.readFile(path.join(f.archive,id+'.json'),'utf8'))),before);
 assert.equal(await fs.readFile(path.join(f.site,'dist/index.html'),'utf8'),'SYNTHETIC ORIGINAL PUBLIC VERSION');
 assert.equal((await f.get('/api/operations/'+op.operationId)).body.operations[0].status,'failed');
 assert.equal((await f.get(`/api/merge-result/${op.operationId}/${op.stepId}`)).body.merge.status,'rolled-back');
});

test('内部HTTP取消：等候构建实际结束，再报告取消与恢复',async t=>{
 const f=await fixture(t,{http:true,internal:true});await fs.writeFile(path.join(f.root,'build-hold'),'hold');const{payload}=await prepare(f),op=operation();
 const running=f.post('/api/merge',payload,op);
 for(let i=0;i<200;i++){if(await fs.access(path.join(f.root,'build-started')).then(()=>true,()=>false))break;await new Promise(r=>setTimeout(r,30));}
 let ended=false;const cancelling=f.post('/api/cancel-operation',{operationId:op.operationId}).then(result=>{ended=true;return result;});
 await new Promise(resolve=>setTimeout(resolve,200));assert.equal(ended,false,'取消必须等实际构建退出');
 await fs.rm(path.join(f.root,'build-hold'));const [finished,cancelled]=await Promise.all([running,cancelling]);
 assert.ok(finished.status>=400);assert.equal(cancelled.status,200);assert.equal((await f.get('/api/operations/'+op.operationId)).body.operations[0].status,'cancelled');
 assert.equal(await fs.readFile(path.join(f.site,'dist/index.html'),'utf8'),'SYNTHETIC ORIGINAL PUBLIC VERSION');
});
