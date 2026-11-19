import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {createManualStore,normalizeManualDraft,manualPublicationInput} from '../manuals.mjs';
import {createManualFixture,manualFixtureCatalog} from './helpers/manuals-fixture.mjs';
import {createManualStore as createLegacyStore} from './helpers/legacy-manuals-1e84c27.mjs';

function mixedCatalog() {
  const catalog = manualFixtureCatalog();
  // 旧目录的药品仍有原来的型号、品牌及多对象适用关系。
  catalog.models.push({...catalog.models[0],model_key:'model-legacy',model_text:'旧署名',category_key:'medicines',model_aliases:[]});
  catalog.documents.push({...structuredClone(catalog.documents[0]),manual_key:'manual-legacy',model_keys:['model-legacy','model-test'],edition_display:'旧目录版'});
  catalog.schema_version = 2;
  catalog.medicines = [
    {medicine_key:'medicine-first', generic_name:'合成验收甲', dosage_form:'剂型甲', strength:'规格甲',
      companies:[{role:'holder',name:'虚构甲方'},{role:'manufacturer',name:'虚构乙方'}],
      approval_label:'原件编号', approval_number:'TEST-001', package_spec:'测试包装'},
    {medicine_key:'medicine-second', generic_name:'合成验收甲', strength:'规格乙',
      companies:[{role:'unverified',name:'虚构丙方'}]},
    {medicine_key:'medicine-old', original_title:'仅有旧题名'}
  ];
  const version = {manual_key:'manual-drug-a', model_keys:[], medicine_keys:['medicine-first','medicine-second'],
    edition_display:'早期版', approval_date_text:'原件载某年', revision_date_text:'月份未载', collected_on:'2026-01-10'};
  catalog.documents.push(version,{...version,manual_key:'manual-drug-b',edition_display:'后续版',medicine_keys:['medicine-first']});
  return catalog;
}

const saveNew = async (store,catalog,expectedRevision) => store.save({
  expectedRevision:expectedRevision ?? (await store.bootstrap()).revision,catalog,medicineDraftVersion:1
});

test('独立药品草稿无需品牌型号；重开后保留历史题名、同名不同对象和多版本关联',async t=>{
  const f=await createManualFixture(t), input=mixedCatalog();
  input.brands=[];input.models=[];input.documents=input.documents.filter(doc=>doc.medicine_keys);
  await saveNew(f.store,input);
  const reopened=createManualStore({root:f.root,siteDirectory:f.site,readArchives:async()=>[],build:async()=>assert.fail('草稿不触发构建')});
  const {state,choices}=await reopened.bootstrap();
  assert.equal(choices.medicineDraftVersion,1);
  assert.deepEqual(state.draft,normalizeManualDraft(input));
  assert.equal(state.draft.medicines[0].companies.length,2);
  assert.equal(state.draft.medicines[2].original_title,'仅有旧题名');
  assert.equal(state.published.documents.length,0);
  await assert.rejects(fs.access(f.source),{code:'ENOENT'});
});

test('整份目录保存与历史往返保留新旧药品；旧客户端、降低格式及过期版本无法覆盖',async t=>{
  const f=await createManualFixture(t);
  const v1=manualFixtureCatalog();await f.save(v1);
  const input=mixedCatalog(), original=normalizeManualDraft(input);
  await saveNew(f.store,input);
  const saved=await f.store.bootstrap(), stateFile=path.join(f.root,'state.json'), bytes=await fs.readFile(stateFile);
  const legacyHistory=saved.history[0].history_id;
  await assert.rejects(f.store.save({expectedRevision:saved.revision,catalog:v1}),{code:'MANUALS_MEDICINE_CLIENT_REQUIRED'});
  await assert.rejects(f.store.save({expectedRevision:saved.revision,catalog:input}),{code:'MANUALS_MEDICINE_CLIENT_REQUIRED'});
  await assert.rejects(saveNew(f.store,v1,saved.revision),{code:'MANUALS_MEDICINE_FORMAT_REQUIRED'});
  await assert.rejects(f.store.restore({expectedRevision:saved.revision,history_id:legacyHistory}),{code:'MANUALS_MEDICINE_CLIENT_REQUIRED'});
  assert.deepEqual(await fs.readFile(stateFile),bytes);
  const edited=structuredClone(saved.state.draft);
  edited.documents[0].edition_display='物件第二版';await saveNew(f.store,edited);
  await assert.rejects(saveNew(f.store,input,saved.revision),{code:'MANUALS_REVISION_CONFLICT'});
  const changed=await f.store.bootstrap();
  assert.deepEqual(changed.state.draft.medicines,original.medicines);
  assert.deepEqual(changed.state.draft.documents.slice(1),original.documents.slice(1));
  await f.store.restore({expectedRevision:changed.revision,history_id:legacyHistory,medicineDraftVersion:1});
  const restoredLegacy=await f.store.bootstrap();
  assert.deepEqual(restoredLegacy.state.draft,normalizeManualDraft(v1));
  const preserved=restoredLegacy.history.find(h=>h.kind==='draft-before-restore');
  await f.store.restore({expectedRevision:restoredLegacy.revision,history_id:preserved.history_id,medicineDraftVersion:1});
  assert.deepEqual((await f.store.bootstrap()).state.draft,changed.state.draft);
});

test('草稿校验拒绝悬空、重复、混用的关联，以及用旧格式悄然丢弃药品资料',()=>{
  const cases=[
    c=>{c.medicines[0].generic_name=' ';},
    c=>{c.medicines[1].medicine_key=c.medicines[0].medicine_key;},
    c=>{c.medicines[0].companies[0].role='unknown-code';},
    c=>{c.documents[2].medicine_keys=[];},
    c=>{c.documents[2].medicine_keys=['medicine-missing'];},
    c=>{c.documents[2].medicine_keys=['medicine-first','medicine-first'];},
    c=>{c.documents[2].model_keys=['model-test'];},
    c=>{c.documents[2].collected_on='2026-02-30';},
    c=>{c.schema_version=1;},
    c=>{c.schema_version=1;delete c.medicines;},
    c=>{delete c.medicines;}
  ];
  for (const change of cases) {
    const catalog=mixedCatalog();change(catalog);
    assert.throws(()=>normalizeManualDraft(catalog),{statusCode:400});
  }
});

test('旧药品逐条整理只建立一份私密对应关系，原型号与旧说明书的适用关系保留',async t=>{
  const f=await createManualFixture(t);
  const catalog=mixedCatalog(), legacy=manualFixtureCatalog();
  legacy.models=structuredClone(catalog.models);
  legacy.documents=structuredClone(catalog.documents.filter(doc=>!doc.medicine_keys));
  await f.save(legacy);
  catalog.medicines[0].legacy_model_key='model-legacy';
  await saveNew(f.store,catalog);
  const saved=await f.store.bootstrap();
  assert.deepEqual(saved.state.draft.models,normalizeManualDraft(legacy).models);
  assert.deepEqual(saved.state.draft.documents.filter(doc=>!doc.medicine_keys),normalizeManualDraft(legacy).documents);
  const edit=structuredClone(saved.state.draft), linked=edit.medicines.find(row=>row.legacy_model_key==='model-legacy');
  linked.trade_name='原件商品名';await saveNew(f.store,edit);
  const current=await f.store.bootstrap();
  assert.deepEqual(current.state.draft.medicines.filter(row=>row.legacy_model_key).map(row=>row.medicine_key),['medicine-first']);
  assert.equal(current.state.draft.medicines[0].trade_name,'原件商品名');
  const rejectChanges=[
    data=>{data.medicines[1].legacy_model_key='model-legacy';},
    data=>{data.medicines[1].legacy_model_key='model-test';},
    data=>{data.medicines[1].legacy_model_key='model-missing';},
    data=>{data.models.find(row=>row.model_key==='model-legacy').category_key='tools';},
    data=>{data.models=data.models.filter(row=>row.model_key!=='model-legacy');},
    data=>{delete data.medicines[0].legacy_model_key;},
    data=>{delete data.medicines[0].legacy_model_key;data.models.pop();},
    data=>{delete data.medicines[0].legacy_model_key;data.medicines[1].legacy_model_key='model-legacy';}
  ];
  for (const mutate of rejectChanges) {
    const attempted=structuredClone(current.state.draft);mutate(attempted);
    await assert.rejects(saveNew(f.store,attempted,current.revision),/旧药品|旧型号|对应关系/);
    assert.equal((await f.store.bootstrap()).revision,current.revision);
  }
  assert.equal((await f.store.preview(current.revision,'manual-drug-a')).medicines.some(row=>Object.hasOwn(row,'legacy_model_key')),false);
});

test('服务关闭药品能力时仍可保存旧目录，但药品写入、恢复和旧程序回退均不能抹除新版草稿',async t=>{
  const f=await createManualFixture(t);
  const config={root:f.root,siteDirectory:f.site,readArchives:async()=>[],build:async()=>assert.fail('草稿不触发构建')};
  const disabled=createManualStore({...config,medicineDraftsEnabled:false}), legacy=createLegacyStore(config);
  const catalog=manualFixtureCatalog(), fresh=await disabled.bootstrap();
  assert.equal(fresh.choices.medicineDraftVersion,0);
  await disabled.save({catalog,expectedRevision:fresh.revision});
  const saved=await disabled.bootstrap();
  await assert.rejects(saveNew(disabled,catalog,saved.revision),{code:'MANUALS_MEDICINE_DISABLED'});
  await assert.rejects(disabled.save({catalog:mixedCatalog(),expectedRevision:saved.revision}),{code:'MANUALS_MEDICINE_DISABLED'});
  await saveNew(f.store,mixedCatalog());
  const opened=await f.store.bootstrap(), stateFile=path.join(f.root,'state.json');
  const bytes=await fs.readFile(stateFile), v1History=opened.history[0].history_id;
  const restoreV1={history_id:v1History,expectedRevision:opened.revision};
  await assert.rejects(disabled.save({catalog,expectedRevision:opened.revision}),{code:'MANUALS_MEDICINE_DISABLED'});
  await assert.rejects(disabled.restore(restoreV1),{code:'MANUALS_MEDICINE_DISABLED'});
  await assert.rejects(legacy.save({catalog,expectedRevision:opened.revision}),{code:'MANUALS_STATE_INVALID'});
  assert.deepEqual(await fs.readFile(stateFile),bytes);
  await f.store.restore({...restoreV1,medicineDraftVersion:1});
  const reverted=await disabled.bootstrap(), v2History=reverted.history.find(row=>row.kind==='draft-before-restore');
  await assert.rejects(disabled.restore({history_id:v2History.history_id,expectedRevision:reverted.revision}),{code:'MANUALS_MEDICINE_DISABLED'});
});

test('药品版本缺少原文与核对依据时阻止发布，已有物件的预览和撤下仍可用',async t=>{
  const f=await createManualFixture(t);await f.save();await f.publish();
  const sourceBefore=await fs.readFile(f.source);const input=mixedCatalog();await saveNew(f.store,input);
  const current=await f.store.bootstrap();
  const check=await f.store.prepare({expectedRevision:current.revision});
  assert(check.issues.some(issue=>issue.where==='manual-drug-a'&&issue.message.includes('依据')));assert.equal(check.review_id,undefined);
  assert.equal(manualPublicationInput(current.state.draft).schema_version,2);
  const preview=await f.store.preview(current.revision,'manual-test');
  assert.equal(preview.issues.length,0);assert.equal(preview.document.manual_key,'manual-test');
  await f.store.sync();assert.deepEqual(await fs.readFile(f.source),sourceBefore);
  const withdrawal={expectedRevision:current.revision,manual_key:'manual-test',reason:'合成撤下检查',confirmed:true};
  f.failBuild(true);
  await assert.rejects(f.store.withdraw(withdrawal),{code:'MANUALS_BUILD_FAILED'});
  const reverted=await f.store.bootstrap();
  assert.equal(reverted.revision,current.revision);
  assert.deepEqual(reverted.state,current.state);
  assert.deepEqual(await fs.readFile(f.source),sourceBefore);
  f.failBuild(false);
  await f.store.withdraw(withdrawal);
  const after=await f.store.bootstrap();
  assert.deepEqual(after.state.draft.medicines,current.state.draft.medicines);
  assert.deepEqual(after.state.draft.documents.filter(doc=>doc.medicine_keys),current.state.draft.documents.filter(doc=>doc.medicine_keys));
  assert.equal(JSON.parse(await fs.readFile(f.source)).documents.length,0);
});
