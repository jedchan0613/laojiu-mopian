import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {createReviewHttpFixture} from './helpers/manual-review-fixture.mjs';
import {manualFixtureCatalog} from './helpers/manuals-fixture.mjs';
import {projectManualCatalog, manualSearchProjection, searchManualCatalog} from '../../shared/manual-catalog.mjs';

function drug(strength,company) {
  return {generic_name:'合成药品资料甲',dosage_form:'合成剂型',strength,companies:[{role:'manufacturer',name:company}]};
}
const metadata = {
  schema_version:2,category_key:'medicines',brand_name:'',product_name:'',model_texts:[],
  medicine:drug('规格甲','合成甲厂'),revision_date_text:'历史原件年份甲',
  rights_basis:'official-link',sharing_scope:'official-link',official_url:'https://support.example.com/leaflets'
};
async function approve(f) {
  const before = await f.detail();
  assert.equal(before.record.versions.at(-1).manual_metadata.schema_version,2);
  const accepted=await f.post(f.base+'/review',f.approval(before));
  assert.equal(accepted.status,200,JSON.stringify(accepted.body));
  const detail=await f.detail();
  const payload=f.transfer(detail);
  delete payload.product_name;
  return {detail,payload};
}

test('从药品投稿人工选定同名的两个规格，转入后仍私密，整份发布后查询按规格定位同一版',async t=>{
  const f=await createReviewHttpFixture(t,{metadata,pages:0});
  const initial=await f.get('/api/manuals');
  const catalog={...manualFixtureCatalog(),schema_version:2,medicines:[
    {medicine_key:'medicine-first',...metadata.medicine},{medicine_key:'medicine-second',...drug('规格乙','合成乙厂')}
  ]};
  const write=f.post;
  const saved=await write('/api/manuals/save',{catalog,expectedRevision:initial.body.revision,medicineDraftVersion:1});
  assert.equal(saved.status,200,JSON.stringify(saved.body));
  const {detail,payload}=await approve(f);
  assert.deepEqual(detail.medicine_candidates.map(m=>[m.medicine_key,m.strength,m.companies[0].name]),[
    ['medicine-first','规格甲','合成甲厂'],['medicine-second','规格乙','合成乙厂']]);
  assert.equal((await write(f.base+'/transfer',payload)).status,400);
  const keys=detail.medicine_candidates.map(m=>m.medicine_key);
  const transferred=await write(f.base+'/transfer',{...payload,medicine_match:{mode:'existing',medicine_keys:keys}});
  assert.equal(transferred.status,200,JSON.stringify(transferred.body));
  const key=transferred.body.manual_key;
  const privateState=(await f.get('/api/manuals')).body;
  assert.equal(privateState.state.published.documents.length,0);
  const doc=privateState.state.draft.documents.find(d=>d.manual_key===key);
  assert.deepEqual(doc.medicine_keys,keys);assert.deepEqual(doc.model_keys,[]);
  assert.equal(privateState.state.draft.medicines.length,2);
  const check=await write('/api/manuals/review',{expectedRevision:privateState.revision});
  assert.deepEqual(check.body.issues,[],JSON.stringify(check.body));
  assert.equal(check.body.changes.medicines.added.length,1);assert.equal(check.body.changes.objects.added.length,1);
  const published=await write('/api/manuals/publish',{expectedRevision:privateState.revision,review_id:check.body.review_id,confirmations:Array(5).fill(true)});
  assert.equal(published.status,200,JSON.stringify(published.body));
  const src=await fs.readFile(f.source,'utf8');
  assert(!src.includes(f.submissionId));assert(!src.includes('PRIVATE-'));
  const publicCatalog=projectManualCatalog(JSON.parse(src));
  const index=manualSearchProjection(publicCatalog);
  for(const search of ['规格甲','合成乙厂']){
    const found=searchManualCatalog(index,{category:'medicines',q:search});
    assert.equal(found.documentCount,1,search);
    assert.equal(found.groups[0].documents[0].manual_key,key);
  }
  const publishedDoc=publicCatalog.documents.find(d=>d.manual_key===key);
  assert.equal(publishedDoc.official_sources[0].href,metadata.official_url);assert.equal(publishedDoc.revision_date_text,metadata.revision_date_text);
});

test('审核员确认新建药品时采用投稿原文字段，错误或过期的候选不能转入',async t=>{
  const f=await createReviewHttpFixture(t,{metadata,pages:0});
  const {detail,payload}=await approve(f);
  assert.deepEqual(detail.medicine_candidates,[]);
  const absent=await f.post(f.base+'/transfer',{...payload,medicine_match:{mode:'existing',medicine_keys:['medicine-no-longer-here']}});
  assert.equal(absent.status,409,JSON.stringify(absent.body));
  const nextCatalog=await f.post('/api/manuals/save',{catalog:manualFixtureCatalog(),expectedRevision:detail.catalog_revision});
  assert.equal(nextCatalog.status,200,JSON.stringify(nextCatalog.body));
  const match={mode:'new',medicine_keys:[]};
  const stale=await f.post(f.base+'/transfer',{...payload,medicine_match:match});
  assert.equal(stale.status,409,JSON.stringify(stale.body));
  const refreshed=await f.detail();
  const made=await f.post(f.base+'/transfer',{...payload,catalog_revision:refreshed.catalog_revision,medicine_match:match});
  assert.equal(made.status,200,JSON.stringify(made.body));
  const {draft,published}=(await f.get('/api/manuals')).body.state;
  assert.equal(draft.medicines.length,1);
  assert.equal(draft.models.length,manualFixtureCatalog().models.length);
  assert.equal(draft.brands.length,manualFixtureCatalog().brands.length);
  assert.equal(draft.medicines[0].strength,metadata.medicine.strength);
  assert.deepEqual(draft.documents.find(doc=>doc.manual_key===made.body.manual_key).medicine_keys,[draft.medicines[0].medicine_key]);
  assert.equal(published.documents.length,0);
});
