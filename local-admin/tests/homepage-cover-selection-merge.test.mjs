import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {getHomepageCover, selectHomepageCover, remapHomepageCover} from '../../shared/homepage-cover.mjs';
import {buildMergeFields} from '../archive-merge-plans.mjs';
import {createMergeUndo} from '../archive-merge-undo.mjs';
import {sample, fixture, actor, operation} from './helpers/merge-fixture.mjs';
import {executionFixture} from './helpers/merge-execution-fixture.mjs';

const selectedAt = '2026-11-10T02:03:04.005Z';
const mark = (record, index=0, selected_at=selectedAt) => {
  record.public_view.homepage_cover = {image: record.core.publication_file_path[index], selected_at};
  return record;
};
const view = record => ({id:record.core.item_id, item:record, images:record.core.publication_file_path.slice()});

test('封面设置只接受本件图片、精确结构和有效ISO时间，旧档案无需新增字段', () => {
  const record=sample();
  assert.equal(getHomepageCover(record),undefined);
  mark(record);
  assert.deepEqual(getHomepageCover(record),record.public_view.homepage_cover);
  for(const changes of [
    {image:'/archive/LJM-20000101-LET-002/front-public.png'},
    {image:`/archive/${record.core.item_id}/absent-public.png`},
    {image:`/archive/${record.core.item_id}/../front-public.png`},
    {selected_at:'2026-02-30T02:03:04.005Z'},
    {selected_at:'2026-11-10T02:03:04Z'},
    {selected_at:'2026-11-10T10:03:04.005+08:00'},
    {extra:true},
  ]) {
    const bad=structuredClone(record);Object.assign(bad.public_view.homepage_cover,changes);
    assert.equal(getHomepageCover(bad),undefined,JSON.stringify(changes));
  }
  const bad=structuredClone(record);bad.public_view.homepage_cover=[];
  assert.equal(getHomepageCover(bad),undefined);
});

test('同类人工封面按选择时间优先，平时更新不抢位，相同时间按永久编号稳定排序', () => {
  const first=sample('003'), older=mark(sample('002')), newest=mark(sample('001'),0,'2026-11-10T03:00:00.000Z');
  newest.core.publication_file_path.push(`/archive/${newest.core.item_id}/back-public.png`);
  mark(newest,1,'2026-11-10T03:00:00.000Z');
  const views=[view(first),view(older),view(newest)],before=structuredClone(views);
  const selected=selectHomepageCover(views);
  assert.equal(selected.view,views[2]);assert.equal(selected.imageIndex,1);assert.equal(selected.manual,true);
  first.core.updated_date='2099-12-31';
  assert.equal(selectHomepageCover(views).view.id,newest.core.item_id);
  assert.deepEqual(views.map(row=>row.images),before.map(row=>row.images));
  mark(older,0,newest.public_view.homepage_cover.selected_at);
  assert.equal(selectHomepageCover([view(older),view(newest)]).view.id,newest.core.item_id);
});

test('失效或清除的封面沿用原自动首图，图片与说明可使用同一索引', () => {
  const first=sample('002'), broken=mark(sample('001'));
  broken.public_view.homepage_cover.image=`/archive/${broken.core.item_id}/absent-public.png`;
  const views=[view(first),view(broken)];
  assert.deepEqual(selectHomepageCover(views),{view:views[0],imageIndex:0,manual:false});
  assert.equal(selectHomepageCover([]),undefined);
  first.core.publication_file_path.push(`/archive/${first.core.item_id}/back-public.png`);
  first.public_view.image_descriptions=['正面说明','背面说明'];mark(first,1);
  const selected=selectHomepageCover([view(first)]);
  assert.equal(selected.view.images[selected.imageIndex],first.public_view.homepage_cover.image);
  assert.equal(selected.view.item.public_view.image_descriptions[selected.imageIndex],'背面说明');
});

test('恢复改名仅映射封面路径，保留选择时间；删除图片不转移到其他图', () => {
  const record=mark(sample()),oldPaths=record.core.publication_file_path.slice();
  const nextPaths=[`/archive/${record.core.item_id}/restored-01-front-public.png`];
  const before=structuredClone(record);remapHomepageCover(record,oldPaths,nextPaths);
  assert.deepEqual(record.core,before.core);
  assert.deepEqual(record.public_view.homepage_cover,{image:nextPaths[0],selected_at:selectedAt});
  record.core.publication_file_path=nextPaths;
  assert.ok(getHomepageCover(record));
  remapHomepageCover(record,nextPaths,[undefined]);
  assert.equal(Object.hasOwn(record.public_view,'homepage_cover'),false);
});

test('合并比较允许展示设置但不列为可拼接文字字段，从件封面不推广', async t => {
  const f=await fixture(t);mark(f.records[0]);mark(f.records[1],0,'2026-11-10T04:00:00.000Z');
  const fields=buildMergeFields(...f.records,f.standard,f.policies);
  assert.equal(fields.some(row=>row.path==='public_view.homepage_cover'),false);
  const pf=await f.planner.preflight(f.ids,actor);assert.equal(pf.canCompare,true);
  const plan=await f.planner.save(f.payload(pf),actor,operation());
  assert.deepEqual(plan.proposedRecord.public_view.homepage_cover,f.records[0].public_view.homepage_cover);
  delete f.records[0].public_view.homepage_cover;
  const noPrimary=await f.planner.preflight(f.ids,actor);
  const noPrimaryPlan=await f.planner.save(f.payload(noPrimary),actor,operation());
  assert.equal(noPrimaryPlan.proposedRecord.public_view.homepage_cover,undefined);
  f.records[0].public_view.unconfigured_display_setting=true;
  assert.throws(()=>buildMergeFields(...f.records,f.standard,f.policies),{code:'MERGE_POLICY_MISSING'});
});

test('合并排除主件封面时清除设置，不借用从件的人工封面', async t => {
  const f=await fixture(t);f.records.forEach(record=>mark(record));
  const pf=await f.planner.preflight(f.ids,actor),payload=f.payload(pf);
  const primaryImage=pf.images.find(row=>row.itemId===f.ids[0]);
  payload.attachmentOrder=pf.images.filter(row=>row.itemId!==f.ids[0]).map(row=>row.ref);
  payload.excludedImages=[{ref:primaryImage.ref,reason:'合成验收：不采用此重复页'}];
  const plan=await f.planner.save(payload,actor,operation());
  assert.equal(plan.proposedRecord.public_view.homepage_cover,undefined);
});

test('合并正式执行保留主件封面，撤销恢复两件原设置及其原选择时间', async t => {
  const f=await executionFixture(t);
  mark(f.records[0]);mark(f.records[1],0,'2026-11-10T04:00:00.000Z');
  for(const record of f.records.slice(0,2))await fs.writeFile(path.join(f.archive,record.core.item_id+'.json'),JSON.stringify(record));
  const {payload}=await f.prepare(),result=await f.engine.execute(payload,actor,operation());
  let rows=await f.readRecords();
  assert.deepEqual(rows[0].public_view.homepage_cover,f.records[0].public_view.homepage_cover);
  assert.ok(getHomepageCover(rows[0]));assert.equal(rows[1].core.record_status,'WDR');
  const undo=createMergeUndo({...f.engineOptions,engine:f.engine});
  const review=await undo.review({mergeId:result.mergeId},actor);assert.equal(review.canPublish,true,JSON.stringify(review.conflicts));
  await undo.publish({mergeId:result.mergeId,reviewId:review.reviewId,mode:'republish',confirmPrimaryId:f.ids[0],confirmSecondaryId:f.ids[1],confirmations:Array(13).fill(true),publicationAuthorization:{restorePrimary:true,restoreSecondary:true,restoreReferences:true,consumeRecoveryDrafts:true}},actor,operation());
  rows=await f.readRecords();
  for(let index=0;index<2;index++)assert.deepEqual(getHomepageCover(rows[index]),f.records[index].public_view.homepage_cover);
});

test('撤销合并生成恢复草稿遇同名冲突时，封面跟随另存图片且不重新抢位', async t => {
  const f=await executionFixture(t);mark(f.records[0]);
  await fs.writeFile(path.join(f.archive,f.ids[0]+'.json'),JSON.stringify(f.records[0]));
  const {payload}=await f.prepare(),result=await f.engine.execute(payload,actor,operation());
  await fs.writeFile(path.join(f.imageRoot,f.ids[0],'front-public.png'),'synthetic conflicting image bytes');
  const undo=createMergeUndo({...f.engineOptions,engine:f.engine}),review=await undo.review({mergeId:result.mergeId},actor);
  assert.equal(review.canPublish,false);assert.equal(review.canCreateDrafts,true);
  await undo.drafts({mergeId:result.mergeId,reviewId:review.reviewId,mode:'drafts'},actor,operation());
  const draft=JSON.parse(await fs.readFile(path.join(f.privateRoot,'drafts',f.ids[0]+'.json'),'utf8'));
  const cover=getHomepageCover(draft.record);
  assert.ok(cover);assert.notEqual(cover.image,f.records[0].public_view.homepage_cover.image);
  assert.equal(cover.selected_at,selectedAt);assert.equal(cover.image,draft.record.core.publication_file_path[0]);
});
