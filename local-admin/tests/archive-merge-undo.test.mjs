import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {createMergeUndo} from '../archive-merge-undo.mjs';
import {executionFixture} from './helpers/merge-execution-fixture.mjs';
import {actor,operation} from './helpers/merge-fixture.mjs';
import {treeDigest} from '../archive-merge-files.mjs';

const undoFor=f=>createMergeUndo({...f.engineOptions,engine:f.engine,afterPhase:f.undoPhase??(async()=>{})});
const merge=async f=>{const {payload}=await f.prepare();return f.engine.execute(payload,actor,operation());};
const undoPayload=(review,ids)=>({mergeId:review.mergeId,reviewId:review.reviewId,mode:'republish',confirmPrimaryId:ids[0],confirmSecondaryId:ids[1],confirmations:Array(13).fill(true),publicationAuthorization:{restorePrimary:true,restoreSecondary:true,restoreReferences:true,consumeRecoveryDrafts:true}});

test('默认恢复仅生成SUS/Y/U0草稿，重复请求不重复生成，公开和收藏不变',async t=>{
 const f=await executionFixture(t),result=await merge(f),undo=undoFor(f),before=await f.state();
 let review=await undo.review({mergeId:result.mergeId},actor);assert.equal(review.canPublish,true);assert.equal(review.canCreateDrafts,true);
 const first=await undo.drafts({mergeId:result.mergeId,reviewId:review.reviewId,mode:'drafts'},actor,operation());assert.equal(first.status,'drafts-created');
 for(const id of f.ids){const draft=JSON.parse(await fs.readFile(path.join(f.privateRoot,'drafts',id+'.json'),'utf8'));assert.equal(draft.record.core.record_status,'SUS');assert.equal(draft.record.core.privacy_level,'Y');assert.equal(draft.record.core.use_status,'U0');assert.equal(draft.merge_undo.mergeId,result.mergeId);}
 assert.deepEqual(await f.state(),before);
 review=await undo.review({mergeId:result.mergeId},actor);const again=await undo.drafts({mergeId:result.mergeId,reviewId:review.reviewId,mode:'drafts'},actor,operation());assert.equal(again.undo_id,first.undo_id);assert.equal(again.unchanged,true);
});

test('无冲突恢复发布：两件恢复、别名解除、结构引用和双收藏原样返回，恢复草稿留有备份',async t=>{
 const f=await executionFixture(t);f.records[2].core.related_item_ids=[f.ids[1]];await fs.writeFile(path.join(f.archive,f.records[2].core.item_id+'.json'),JSON.stringify(f.records[2]));
 for(const[id,item,date]of [['user-one',f.ids[0],'2000-01-01'],['user-one',f.ids[1],'2000-01-02']])f.db.prepare('INSERT INTO favorites VALUES(?,?,?)').run(id,item,date);
 const originalFav=f.store.archiveMerge.inspect(f.ids).rows,result=await merge(f),undo=undoFor(f);
 let review=await undo.review({mergeId:result.mergeId},actor);await undo.drafts({mergeId:result.mergeId,reviewId:review.reviewId,mode:'drafts'},actor,operation());
 review=await undo.review({mergeId:result.mergeId},actor);assert.equal(review.canPublish,true,JSON.stringify(review.conflicts));
 const restored=await undo.publish(undoPayload(review,f.ids),actor,operation());assert.equal(restored.status,'committed');
 const rows=await f.readRecords();for(const id of f.ids){const row=rows.find(row=>row.core.item_id===id);assert.equal(row.core.record_status,'ACT');assert.equal(row.core.use_status,'U3');assert.equal(row.core.publication_file_path.length,1);}
 assert.deepEqual(rows[2].core.related_item_ids,[f.ids[1]]);assert.deepEqual(f.store.archiveMerge.inspect(f.ids).rows,originalFav);assert.equal(f.store.archiveMerge.resolveForWrite(f.ids[1]),f.ids[1]);
 assert.deepEqual((JSON.parse(await fs.readFile(path.join(f.site,'src/data/archive-merge-aliases.json'),'utf8'))).aliases,{});
 assert.equal((await f.engine.detail(result.mergeId,actor)).status,'reverted');assert.equal((await f.engine.detail(restored.mergeId,actor)).operation_kind,'undo');
 assert.equal((await fs.readdir(path.join(f.privateRoot,'drafts'))).length,0);
 await assert.rejects(undo.review({mergeId:result.mergeId},actor),{code:'MERGE_UNDO_NOT_AVAILABLE'});
});

test('后续新编辑、新收藏和新引用阻断恢复发布，但允许另建恢复草稿',async t=>{
 const f=await executionFixture(t),result=await merge(f),undo=undoFor(f);
 const rows=await f.readRecords();rows[0].core.title='后来新增的题名';rows[2].core.related_item_ids=[f.ids[0]];
 for(const row of [rows[0],rows[2]])await fs.writeFile(path.join(f.archive,row.core.item_id+'.json'),JSON.stringify(row));
 f.db.prepare('INSERT INTO favorites VALUES(?,?,?)').run('user-two',f.ids[0],'2026-10-24');
 const review=await undo.review({mergeId:result.mergeId},actor);assert.equal(review.canPublish,false);assert.ok(review.conflicts.some(row=>row.code==='RECORD_CHANGED'));assert.ok(review.conflicts.some(row=>row.code==='FAVORITES_CHANGED'));assert.ok(review.threeWay[0].changes.some(row=>row.path==='core.title'));
 await assert.rejects(undo.publish(undoPayload(review,f.ids),actor,operation()),{code:'MERGE_UNDO_CONFLICT'});
 const before=await f.state();assert.equal((await undo.drafts({mergeId:result.mergeId,reviewId:review.reviewId,mode:'drafts'},actor,operation())).status,'drafts-created');assert.deepEqual(await f.state(),before);
});

test('存在其他草稿时默认另存提案；明确替换才备份后生成恢复草稿',async t=>{
 const f=await executionFixture(t),result=await merge(f),undo=undoFor(f),draftFile=path.join(f.privateRoot,'drafts',f.ids[0]+'.json');
 const existing={record:{...(await f.readRecords())[0],public_view:{description:'现有草稿必须保留'}}};await fs.writeFile(draftFile,JSON.stringify(existing));const bytes=await fs.readFile(draftFile);
 let review=await undo.review({mergeId:result.mergeId},actor);const proposal=await undo.drafts({mergeId:result.mergeId,reviewId:review.reviewId,mode:'drafts'},actor,operation());assert.equal(proposal.status,'proposal-only');assert.deepEqual(await fs.readFile(draftFile),bytes);
 review=await undo.review({mergeId:result.mergeId},actor);const replaced=await undo.drafts({mergeId:result.mergeId,reviewId:review.reviewId,mode:'drafts',replaceExistingDrafts:true},actor,operation());assert.equal(replaced.status,'drafts-created');
 const backup=replaced.draftFiles.find(row=>row.relative===f.ids[0]+'.json').backup;assert.deepEqual(await fs.readFile(path.join(f.directory,...backup.split('/'))),bytes);
});

test('后续无关档案修改不会被恢复覆盖',async t=>{
 const f=await executionFixture(t),result=await merge(f),undo=undoFor(f),third=(await f.readRecords())[2];third.core.title='其他资料后来新补的题名';await fs.writeFile(path.join(f.archive,third.core.item_id+'.json'),JSON.stringify(third));
 let review=await undo.review({mergeId:result.mergeId},actor);assert.equal(review.canPublish,true);await undo.publish(undoPayload(review,f.ids),actor,operation());assert.equal((await f.readRecords())[2].core.title,third.core.title);
});

test('新点赞、后续合并和草稿引用各自阻断恢复发布',async t=>{
 const f=await executionFixture(t),result=await merge(f),undo=undoFor(f);
 await fs.writeFile(f.likesFile,JSON.stringify({version:1,items:{[f.ids[0]]:{voters:['a'.repeat(64)]}}}));
 let review=await undo.review({mergeId:result.mergeId},actor);assert.equal(review.canPublish,false);assert.ok(review.conflicts.some(row=>row.code==='NEW_LIKES'));
 await fs.writeFile(f.likesFile,JSON.stringify({version:1,items:{}}));
 const other=crypto.randomUUID();await fs.mkdir(path.join(f.directory,other));await fs.writeFile(path.join(f.directory,other,'manifest.json'),JSON.stringify({merge_id:other,status:'committed',primary_id:f.ids[0],secondary_id:'LJM-20000101-LET-099',created_at:'2999-01-01'}));
 review=await undo.review({mergeId:result.mergeId},actor);assert.ok(review.conflicts.some(row=>row.code==='DEPENDENT_MERGE'));
 await fs.writeFile(path.join(f.directory,other,'manifest.json'),JSON.stringify({status:'rolled-back'}));
 await fs.writeFile(path.join(f.privateRoot,'drafts',f.records[2].core.item_id+'.json'),JSON.stringify({record:{...f.records[2],core:{...f.records[2].core,related_item_ids:[f.ids[0]]}}}));
 review=await undo.review({mergeId:result.mergeId},actor);assert.ok(review.conflicts.some(row=>row.code==='OTHER_DRAFT_REFERENCE'));
 await assert.rejects(undo.publish(undoPayload(review,f.ids),actor,operation()),{code:'MERGE_UNDO_CONFLICT'});
});

test('从件新增译文不会被恢复覆盖；原收藏账号注销时不重建收藏',async t=>{
 const f=await executionFixture(t);
 f.db.prepare('INSERT INTO favorites VALUES(?,?,?)').run('user-one',f.ids[1],'2000-01-01');
 const result=await merge(f),undo=undoFor(f),file=path.join(f.translationDirectory,f.ids[1]+'.json');
 const newer={schema_version:1,item_id:f.ids[1],revision:1,draft:{locale:'en',fields:{'core.title':'Synthetic new translation'},status:'review'},published:null};
 await fs.writeFile(file,JSON.stringify(newer));
 let review=await undo.review({mergeId:result.mergeId},actor);assert.ok(review.conflicts.some(row=>row.code==='TRANSLATION_CHANGED'&&row.itemId===f.ids[1]));assert.equal(review.canPublish,false);assert.deepEqual(JSON.parse(await fs.readFile(file,'utf8')),newer);
 await fs.rm(file);f.db.prepare("UPDATE users SET status='pending_deletion' WHERE id='user-one'").run();
 review=await undo.review({mergeId:result.mergeId},actor);assert.ok(review.conflicts.some(row=>row.code==='FAVORITES_CHANGED'));assert.equal(review.canPublish,false);
});

for(const phase of ['file-written','favorites-applied','previous-dist-retained','dist-switched','verified'])test('撤销恢复故障 '+phase+'：回到合并后状态，不丢收藏和图片',async t=>{
 let fired=false;const f=await executionFixture(t,{afterPhase:async(value,log)=>{if(log.operation_kind==='undo'&&value===phase&&!fired){fired=true;throw new Error('synthetic undo failure');}}});
 const result=await merge(f),undo=undoFor(f),review=await undo.review({mergeId:result.mergeId},actor),before=await f.state(),draftsBefore=await treeDigest(path.join(f.privateRoot,'drafts'));
 await assert.rejects(undo.publish(undoPayload(review,f.ids),actor,operation()));assert.equal(fired,true);assert.deepEqual(await f.state(),before);assert.equal(await treeDigest(path.join(f.privateRoot,'drafts')),draftsBefore);assert.equal((await f.engine.detail(result.mergeId,actor)).status,'committed');
});

test('撤销令牌绑定身份与当前版本；快照损坏时不生成伪草稿',async t=>{
 const f=await executionFixture(t),result=await merge(f),undo=undoFor(f),review=await undo.review({mergeId:result.mergeId},actor);
 await assert.rejects(undo.publish(undoPayload(review,f.ids),'someone-else',operation()),{code:'MERGE_UNDO_REVIEW_EXPIRED'});
 const log=await f.engine.detail(result.mergeId,actor),snapshot=log.snapshots.find(row=>row.item_id===f.ids[0]);await fs.appendFile(path.join(f.historyDirectory,...snapshot.relative.split('/'),'record.json'),'corrupt');
 const next=await undo.review({mergeId:result.mergeId},actor);assert.equal(next.canCreateDrafts,false);await assert.rejects(undo.drafts({mergeId:result.mergeId,reviewId:next.reviewId,mode:'drafts'},actor,operation()));
});
