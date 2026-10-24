import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fixture,operation} from './helpers/merge-fixture.mjs';

async function merged(t){
 const f=await fixture(t,{http:true,internal:true});
 const pf=(await f.post('/api/merge-preflight',{itemIds:f.ids})).body;
 const saved=await f.post('/api/merge-plan',f.payload(pf));assert.equal(saved.status,200,JSON.stringify(saved.body));
 const plan=saved.body.plan,review=(await f.post('/api/merge-review',{planId:plan.planId,planRevision:plan.planRevision})).body;
 const result=await f.post('/api/merge',{planId:plan.planId,planRevision:plan.planRevision,reviewId:review.reviewId,confirmPrimaryId:f.ids[0],confirmations:Array(13).fill(true),publicationAuthorization:{publishMergedPrimary:true,withdrawSecondary:true}});
 assert.equal(result.status,200,JSON.stringify(result.body));return{...f,mergeId:result.body.merge.merge_id,plan};
}

test('HTTP恢复草稿、图片权限、普通发布阻断、幂等、重新检查后恢复两件',async t=>{
 const f=await merged(t);
 assert.equal((await f.get('/api/merge-capabilities')).body.undoEnabled,true);
 let response=await f.post('/api/merge-undo-review',{mergeId:f.mergeId});assert.equal(response.status,200,JSON.stringify(response.body));let review=response.body;
 assert.equal(review.canPublish,true);const imageResponse=await fetch(f.origin+review.originals[0].images[0].url);assert.equal(imageResponse.status,200);assert.match(imageResponse.headers.get('content-type'),/^image\//);await imageResponse.arrayBuffer();
 assert.ok((await f.get(review.originals[0].images[0].url.replace(review.reviewId,crypto.randomUUID()))).status>=400);
 const payload={mergeId:f.mergeId,reviewId:review.reviewId,mode:'drafts'},op=operation();
 const first=await f.post('/api/merge-undo',payload,op);assert.equal(first.status,200,JSON.stringify(first.body));assert.equal(first.body.undo.status,'drafts-created');
 const replay=await f.post('/api/merge-undo',payload,op);assert.equal(replay.status,200,JSON.stringify(replay.body));assert.equal(replay.body.undo.undo_id,first.body.undo.undo_id);
 assert.equal((await f.get(`/api/merge-undo-result/drafts/${op.operationId}/${op.stepId}`)).body.undo.undo_id,first.body.undo.undo_id);
 const state=(await f.get('/api/record-version/'+f.ids[0])).body;
 const publish=await f.post('/api/publish',{itemId:f.ids[0],expectedRevision:state.revision,confirmations:Array(13).fill(true)});assert.ok(publish.status>=400);assert.match(publish.body.error,/恢复草稿|核对|确认/);
 response=await f.post('/api/merge-undo-review',{mergeId:f.mergeId});review=response.body;
 const body={mergeId:f.mergeId,reviewId:review.reviewId,mode:'republish',confirmPrimaryId:f.ids[0],confirmSecondaryId:f.ids[1],confirmations:Array(13).fill(true),publicationAuthorization:{restorePrimary:true,restoreSecondary:true,restoreReferences:true,consumeRecoveryDrafts:true}};
 assert.equal((await f.post('/api/merge-undo',{...body,confirmations:Array(13).fill(false)})).status,422);
 const undoOp=operation(),restored=await f.post('/api/merge-undo',body,undoOp);assert.equal(restored.status,200,JSON.stringify(restored.body));assert.equal(restored.body.undo.status,'committed');
 assert.equal((await f.post('/api/merge-undo',body,undoOp)).body.undo.merge_id,restored.body.undo.merge_id);
 assert.equal((await f.get('/api/merges/'+f.mergeId)).body.merge.status,'reverted');
 assert.equal((await f.get('/api/merge-plans')).body.plans.find(row=>row.planId===f.plan.planId).status,'reverted');
 assert.equal((await f.get('/api/merges')).body.merges.length,2);
 for(const id of f.ids)assert.equal(JSON.parse(await fs.readFile(path.join(f.archive,id+'.json'),'utf8')).core.use_status,'U3');
});

test('HTTP恢复检查不是授权：外站来源、伪造方式和缺少新确认均拒绝',async t=>{
 const f=await merged(t),review=(await f.post('/api/merge-undo-review',{mergeId:f.mergeId})).body;
 assert.equal((await f.post('/api/merge-undo-review',{mergeId:f.mergeId},operation(),{Origin:'https://invalid.example'})).status,403);
 assert.ok((await f.post('/api/merge-undo',{mergeId:f.mergeId,reviewId:review.reviewId,mode:'automatic'})).status>=400);
 assert.equal((await f.post('/api/merge-undo',{mergeId:f.mergeId,reviewId:review.reviewId,mode:'republish'})).status,422);
 assert.equal((await f.get('/api/merges/'+f.mergeId)).body.merge.status,'committed');
});
