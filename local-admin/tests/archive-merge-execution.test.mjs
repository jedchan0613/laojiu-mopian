import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {executionFixture} from './helpers/merge-execution-fixture.mjs';
import {actor,operation} from './helpers/merge-fixture.mjs';
import {createArchiveMergeExecution} from '../archive-merge-execution.mjs';

test('第二阶段真实文件提交：两件变一件、正式撤销、引用迁移、双收藏去重与私密快照',async t=>{
 const f=await executionFixture(t),third=f.records[2];third.core.related_item_ids=[...f.ids];await fs.writeFile(path.join(f.archive,third.core.item_id+'.json'),JSON.stringify(third));
 for(const[id,item,date]of [['user-one',f.ids[0],'2000-01-03'],['user-one',f.ids[1],'2000-01-01'],['user-two',f.ids[1],'2000-01-02']])f.db.prepare('INSERT INTO favorites VALUES(?,?,?)').run(id,item,date);
 const privateTranslation={schema_version:1,item_id:f.ids[0],revision:2,draft:null,published:{item_id:f.ids[0],locale:'en',status:'published',fields:{'core.title':'Synthetic old title'},source_hash:'old'}};
 await fs.writeFile(path.join(f.translationDirectory,f.ids[0]+'.json'),JSON.stringify(privateTranslation));
 const {review,payload}=await f.prepare();assert.equal(review.beforePublicCount,3);assert.equal(review.afterPublicCount,2);assert.equal(review.affectedIds.length,3);
 const result=await f.engine.execute(payload,actor,operation());assert.equal(result.status,'committed');
 const records=await f.readRecords(),primary=records.find(r=>r.core.item_id===f.ids[0]),secondary=records.find(r=>r.core.item_id===f.ids[1]);
 assert.equal(primary.core.publication_file_path.length,2);assert.equal(primary.core.item_id,f.ids[0]);assert.equal(secondary.core.record_status,'WDR');assert.equal(secondary.core.use_status,'U4');
 assert.deepEqual(records.find(r=>r.core.item_id===third.core.item_id).core.related_item_ids,[f.ids[0]]);
 const favorites=f.store.archiveMerge.inspect(f.ids).rows;assert.equal(favorites.length,2);assert.ok(favorites.every(row=>row.item_id===f.ids[0]));assert.equal(favorites.find(row=>row.user_id==='user-one').created_at,'2000-01-01');
 assert.equal(f.store.archiveMerge.resolveForWrite(f.ids[1]),f.ids[0]);
 const translation=JSON.parse(await fs.readFile(path.join(f.translationDirectory,f.ids[0]+'.json'),'utf8'));assert.equal(translation.published,null);assert.equal(translation.draft.status,'review');assert.equal(translation.revision,3);
 const log=await f.engine.detail(result.mergeId,actor);assert.equal(log.snapshots.length,3);assert.ok(log.files.length>3);assert.equal(log.status,'committed');
 for(const id of f.ids)assert.ok((await fs.readdir(path.join(f.historyDirectory,id))).length);
 const projection=JSON.parse(await fs.readFile(path.join(f.site,'src/data/archive-merge-aliases.json'),'utf8'));assert.equal(projection.aliases[f.ids[1]].target_id,f.ids[0]);
 await assert.rejects(fs.access(path.join(f.site,'public/archive',f.ids[1],'front-public.png')));
 assert.ok(await fs.readFile(path.join(f.imageRoot,f.ids[1],'front-public.png'))); // 私密来源仍在。
 await assert.rejects(f.engine.detail(result.mergeId,'other-actor'),{code:'MERGE_FORBIDDEN'});
});

for(const phase of ['snapshots-complete','candidate-ready','build-complete','files-prepared','likes-lock-intent','likes-locked','favorites-locked','file-written','files-applied','favorites-applied','previous-dist-retained','dist-switched','verified'])test('故障注入 '+phase+'：恢复正式记录、图片、译文、收藏和公开产物',async t=>{
 let fired=false;const f=await executionFixture(t,{afterPhase:async value=>{if(value===phase&&!fired){fired=true;throw new Error('synthetic injected failure');}}});
 f.db.prepare('INSERT INTO favorites VALUES(?,?,?)').run('user-one',f.ids[1],'2000-01-01');
 const {payload}=await f.prepare(),before=await f.state();
 await assert.rejects(f.engine.execute(payload,actor,operation()));assert.equal(fired,true);assert.deepEqual(await f.state(),before);
 const folders=(await fs.readdir(f.directory)).filter(name=>/^[a-f0-9-]{36}$/.test(name));const log=await f.engine.detail(folders[0],actor);assert.equal(log.status,'rolled-back');assert.equal(f.store.archiveMerge.resolveForWrite(f.ids[1]),f.ids[1]);
});

for(const phase of ['files-prepared','files-applied'])test('临近提交 '+phase+' 的非目标新修改仍会阻断，且新内容保留',async t=>{
 let f;f=await executionFixture(t,{afterPhase:async value=>{if(value===phase){const row=f.records[2];row.core.title='提交时外部新修改';await fs.writeFile(path.join(f.archive,row.core.item_id+'.json'),JSON.stringify(row));}}});
 const {payload}=await f.prepare(),before=await fs.readFile(path.join(f.archive,f.ids[0]+'.json'));
 await assert.rejects(f.engine.execute(payload,actor,operation()),{code:'MERGE_BASELINE_CHANGED'});assert.deepEqual(await fs.readFile(path.join(f.archive,f.ids[0]+'.json')),before);assert.equal((await f.readRecords())[2].core.title,'提交时外部新修改');
});

test('关联正式件已有草稿、或其他草稿引用从件时均不静默覆盖',async t=>{
 const f=await executionFixture(t),third=f.records[2];third.core.related_item_ids=[f.ids[1]];await fs.writeFile(path.join(f.archive,third.core.item_id+'.json'),JSON.stringify(third));
 const draftFile=path.join(f.privateRoot,'drafts',third.core.item_id+'.json');await fs.writeFile(draftFile,JSON.stringify({record:third}));
 await assert.rejects(f.prepare(),{code:'MERGE_RELATED_DRAFT_EXISTS'});
 delete third.core.related_item_ids;await fs.writeFile(path.join(f.archive,third.core.item_id+'.json'),JSON.stringify(third));
 await assert.rejects(f.prepare(),{code:'MERGE_RELATED_DRAFT_EXISTS'});
});

test('同名待入站图片与当前发布副本不同，不能生成虚假的发布前快照',async t=>{
 const f=await executionFixture(t);await fs.appendFile(path.join(f.site,'public/archive',f.ids[1],'front-public.png'),'different publication bytes');
 await assert.rejects(f.prepare(),{code:'MERGE_PUBLIC_COPY_MISMATCH'});
});

test('整站非目标变更使旧候选失效，且不覆盖他人的新记录',async t=>{
 let f;f=await executionFixture(t,{afterPhase:async phase=>{if(phase==='build-complete'){const record=f.records[2];record.core.title='外部刚改的新题名';await fs.writeFile(path.join(f.archive,record.core.item_id+'.json'),JSON.stringify(record));}}});
 const {payload}=await f.prepare(),oldPrimary=await fs.readFile(path.join(f.archive,f.ids[0]+'.json'));
 await assert.rejects(f.engine.execute(payload,actor,operation()),{code:'MERGE_BASELINE_CHANGED'});
 assert.deepEqual(await fs.readFile(path.join(f.archive,f.ids[0]+'.json')),oldPrimary);
 assert.equal((await f.readRecords())[2].core.title,'外部刚改的新题名');
});

test('取消等待实际构建结束并恢复；13项、编号和审核过期均不能绕过',async t=>{
 const controller=new AbortController();const f=await executionFixture(t,{afterPhase:async phase=>{if(phase==='build-complete')controller.abort();}});
 const {payload}=await f.prepare(),before=await f.state();
 await assert.rejects(f.engine.execute({...payload,confirmations:Array(13).fill(false)},actor,operation()),{code:'MERGE_CONFIRMATION_REQUIRED'});
 await assert.rejects(f.engine.execute({...payload,confirmPrimaryId:f.ids[1]},actor,operation()),{code:'MERGE_CONFIRMATION_REQUIRED'});
 const restarted=createArchiveMergeExecution(f.engineOptions);await assert.rejects(restarted.execute(payload,actor,operation()),{code:'MERGE_REVIEW_EXPIRED'});
 await assert.rejects(f.engine.execute(payload,actor,{...operation(),signal:controller.signal}),error=>error.name==='OperationCancelledError');assert.deepEqual(await f.state(),before);
});

test('恢复冲突不盲目覆盖外部数据，证据保留并冻结待核对',async t=>{
 let f,fired=false;f=await executionFixture(t,{afterPhase:async(phase,log)=>{if(phase==='files-applied'&&!fired){fired=true;await fs.writeFile(path.join(f.archive,f.ids[0]+'.json'),'EXTERNAL CHANGE MUST SURVIVE');throw new Error('synthetic crash-like conflict');}}});
 const {payload}=await f.prepare();await assert.rejects(f.engine.execute(payload,actor,operation()));
 assert.equal(await fs.readFile(path.join(f.archive,f.ids[0]+'.json'),'utf8'),'EXTERNAL CHANGE MUST SURVIVE');
 const folder=(await fs.readdir(f.directory)).find(name=>/^[a-f0-9-]{36}$/.test(name));const log=await f.engine.detail(folder,actor);assert.equal(log.status,'needs_review');
 await assert.rejects(f.engine.recover(folder,actor),{code:'MERGE_RECOVERY_CONFLICT'});assert.equal(f.store.archiveMerge.status(folder).status,'locked');
});
