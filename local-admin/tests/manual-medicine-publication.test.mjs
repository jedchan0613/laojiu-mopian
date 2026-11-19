import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {createManualFixture,manualFixtureCatalog} from './helpers/manuals-fixture.mjs';
import {createManualStore} from '../manuals.mjs';

function mixed() {
  const result=manualFixtureCatalog();
  const medicine={medicine_key:'medicine-a',generic_name:'合成验收药品',dosage_form:'合成剂型',strength:'合成规格甲',companies:[{role:'manufacturer',name:'虚构企业'}],legacy_model_key:'model-old'};
  result.schema_version=2;
  result.models.push({...result.models[0],category_key:'medicines',model_key:'model-old',model_text:'原资料型号',model_aliases:[]});
  result.medicines=[medicine,{...medicine,medicine_key:'medicine-b',strength:'合成规格乙',legacy_model_key:undefined},{medicine_key:'medicine-unused',original_title:'PRIVATE-UNUSED-NAME'}];
  const doc={...structuredClone(result.documents[0]),manual_key:'manual-medicine-one',model_keys:[],medicine_keys:['medicine-a','medicine-b'],approval_date_text:'原件未载',revision_date_text:'某年修订',collected_on:'2026-02-03'};
  result.documents.push(doc,{...structuredClone(doc),manual_key:'manual-medicine-two',edition_display:'第二版',medicine_keys:['medicine-a']});
  return result;
}

const inspect=async(store)=>store.prepare({expectedRevision:(await store.bootstrap()).revision});
async function save(store,catalog) {
  return store.save({medicineDraftVersion:1,catalog,expectedRevision:(await store.bootstrap()).revision});
}
async function release(store) {
  const {revision}=await store.bootstrap();
  const {issues,review_id}=await store.prepare({expectedRevision:revision});
  assert.deepEqual(issues,[]);
  return store.publish({expectedRevision:revision,review_id,confirmations:Array(5).fill(true)});
}

test('药品整份目录发布、两类逐版本变更、整册撤下、历史恢复及私密字段白名单',async t=>{
  const f=await createManualFixture(t), {store}=f;
  await f.save(); await f.publish();
  await save(store,mixed());
  let checked=await inspect(store);
  assert.deepEqual(checked.issues,[]);
  assert.deepEqual(checked.changes.objects,{added:[],modified:[],removed:[]});
  assert.deepEqual(checked.changes.medicines.added.map(d=>d.manual_key),['manual-medicine-one','manual-medicine-two']);
  await release(store);
  const publishedSource=await fs.readFile(f.source,'utf8');
  const publicData=JSON.parse(publishedSource);
  assert.equal(publicData.schema_version,2);
  assert.equal(publicData.medicines.length,2);
  assert.equal(publicData.documents[1].medicine_keys.length,2);
  assert(!/PRIVATE|legacy_model_key|collected_on|review_note|applicability_basis/.test(publishedSource));
  await store.sync(); assert.equal(await fs.readFile(f.source,'utf8'),publishedSource);
  const oldState=(await store.bootstrap()).state;
  const updated=structuredClone(oldState.published);
  updated.medicines[0].strength='修正的合成规格';
  updated.documents[0].edition_display='物件第二版';
  updated.documents[1].review_note='PRIVATE-CHANGED';
  updated.documents.pop();
  await save(store,updated);
  checked=await inspect(store);
  assert.deepEqual(checked.issues,[]);
  assert.deepEqual(checked.changes.objects.modified.map(x=>x.manual_key),['manual-test']);
  assert.deepEqual(checked.changes.medicines.modified.map(x=>x.manual_key),['manual-medicine-one']);
  assert.deepEqual(checked.changes.medicines.removed.map(x=>x.manual_key),['manual-medicine-two']);
  f.failBuild(true);
  await assert.rejects(release(store),{code:'MANUALS_BUILD_FAILED'});
  assert.equal(await fs.readFile(f.source,'utf8'),publishedSource);
  f.failBuild(false);
  await release(store);
  let boot=await store.bootstrap();
  const savedHistory=boot.history.find(h=>h.kind==='published-before-update' && h.count===3);
  assert(savedHistory);
  await store.withdraw({expectedRevision:boot.revision,manual_key:'manual-medicine-one',confirmed:true,reason:'合成验收'});
  assert.equal(JSON.parse(await fs.readFile(f.source)).documents.length,1);
  boot=await store.bootstrap();
  await store.restore({expectedRevision:boot.revision,history_id:savedHistory.history_id,medicineDraftVersion:1});
  assert.equal(JSON.parse(await fs.readFile(f.source)).documents.length,1);
  const restored=await store.bootstrap();
  assert.deepEqual(restored.state.draft,oldState.published);
});

test('仅调整私密记录不记为公开修改，新版药品转入受服务开关约束',async t=>{
  const f=await createManualFixture(t);
  await save(f.store,mixed()); await release(f.store);
  const data=(await f.store.bootstrap()).state.published;
  data.documents[1].collected_on='2026-03-04';
  data.documents[1].review_note='PRIVATE-REVIEW-UPDATE';
  await save(f.store,data);
  const checked=await inspect(f.store);
  for(const area of Object.values(checked.changes))assert.deepEqual(area,{added:[],modified:[],removed:[]});
  const disabled=createManualStore({root:f.root,siteDirectory:f.site,readArchives:async()=>[],build:async()=>assert.fail(),medicineDraftsEnabled:false});
  const input={version:{manual_metadata:{schema_version:2,category_key:'medicines'}}};
  for(const action of [disabled.planReviewedImport,disabled.importReviewed]) await assert.rejects(action(input),{code:'MANUALS_MEDICINE_DISABLED'});
});

test('已人工关联旧型号的药品更正规格时，发布清单列出受影响的新旧版本',async t=>{
  const {store}=await createManualFixture(t);
  const catalog=mixed();
  catalog.documents.push({...structuredClone(catalog.documents[0]),model_keys:['model-old'],manual_key:'manual-original',edition_display:'旧册'});
  await save(store,catalog);
  await release(store);
  catalog.medicines[0].strength='合成规格丙';
  await save(store,catalog);
  const check=await inspect(store);
  assert.deepEqual(check.issues,[]);
  assert.deepEqual(check.changes.medicines.modified.map(doc=>doc.manual_key).sort(),['manual-medicine-one','manual-medicine-two','manual-original']);
  assert.match(check.changes.medicines.modified.find(doc=>doc.manual_key==='manual-original').title,/合成规格丙/);
  assert.deepEqual(check.changes.objects.modified,[]);
});
