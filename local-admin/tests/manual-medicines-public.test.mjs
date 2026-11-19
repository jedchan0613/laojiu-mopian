import assert from 'node:assert/strict';
import test from 'node:test';
import {projectManualCatalog,manualSearchProjection,validateManualSearchIndex,searchManualCatalog,manualCountLabel,safeManualReturn} from '../../shared/manual-catalog.mjs';
import {manualPublicationInput} from '../manuals.mjs';
import {buildManualBrowse} from '../../shared/manual-browse.mjs';

const medicine=(key,strength,company)=>({
  medicine_key:key,generic_name:'示意药甲',dosage_form:'虚构剂型',strength,
  trade_name:'合成旧称',companies:[{role:'manufacturer',name:company}],approval_number:'QA-'+strength,
  legacy_model_key:'model-private-history'
});
const version=(key,medicines,edition)=>({
  manual_key:key,model_keys:[],medicine_keys:medicines,document_kind:'user-guide',
  publication_status:'published',publication_approved:true,official_sources:[{name:'合成官方入口',url:'https://example.com/guide',checked_on:'2020-01-01',available:true}],
  region_display:'合成地区',languages:['zh-CN'],edition_display:edition,edition_date:'',
  revision_date_text:'原件仅载年份',collected_on:'PRIVATE-DATE',completeness:'unverified'
});
function source(){
  const one='medicine-one',two='medicine-two',unpublished='medicine-three';
  return {schema_version:2,brands:[],models:[],medicines:[
    medicine(one,'5 mg','虚构甲厂'),medicine(two,'15 mg','虚构乙厂'),medicine(unpublished,'规格丙','PRIVATE-DRAFT')],
    documents:[
      version('manual-common',[one,two],'合订版'),version('manual-early',[one],'早期版'),
      {...version('manual-hidden',[unpublished],'PRIVATE-DRAFT'),publication_approved:false}
    ]};
}

test('公开投影保留一药多版、一版多规格与修订原文，清理未公开对象、私密关联和收录日期',()=>{
  const catalog=projectManualCatalog(source());
  const index=validateManualSearchIndex(manualSearchProjection(catalog));
  assert.equal(index.medicines.length,2);assert.equal(index.documents.length,2);
  assert.equal(index.documents[0].revision_date_text,'原件仅载年份');
  assert.equal(index.documents[0].medicine_keys.length,2);
  for(const object of [index,catalog])assert.doesNotMatch(JSON.stringify(object),/PRIVATE-|legacy_model_key|collected_on/);
  for(const invalid of [
    m=>{m.medicines[0].legacy_model_key='private';},m=>{m.medicines[0].companies[0].evidence='private';},
    m=>{m.documents[0].collected_on='private';},m=>{m.documents[0].medicine_keys=['medicine-missing'];},
    m=>{m.medicines.push({...m.medicines[0],medicine_key:'medicine-orphan'});}
  ]){const changed=structuredClone(index);invalid(changed);assert.throws(()=>validateManualSearchIndex(changed));}
});

test('以药名、规格、企业和旧称检索，同名药按对象分组、可用版本按文档去重，旧详情和品类返回链接稳定',()=>{
  const index=manualSearchProjection(projectManualCatalog(source()));
  const query=q=>searchManualCatalog(index,{q,category:'medicines'});
  const all=query('示意药甲');assert.equal(all.modelCount,0);assert.equal(all.medicineCount,2);assert.equal(all.documentCount,2);
  assert.equal(manualCountLabel(all),'2 条药品 · 2 份独立文档版本');
  assert.deepEqual(query('示意药甲 5 mg').groups.map(g=>g.medicine.medicine_key),['medicine-one']);
  assert.deepEqual(query('15 mg 乙厂').groups.map(g=>g.medicine.medicine_key),['medicine-two']);
  assert.equal(query('合成旧称').documentCount,2);assert.equal(query('合订版').documentCount,1);
  assert.equal(query('QA-15').groups.length,1);
  assert.equal(searchManualCatalog(index,{category:'tools'}).documentCount,0);
  assert.equal(searchManualCatalog(index,{brand:'brand-nonexistent'}).documentCount,0);
  assert.equal(searchManualCatalog(index,{language:'en'}).documentCount,0);
  const browse=buildManualBrowse(index);assert.deepEqual(browse.brands,[]);
  assert.equal(browse.categories[0].path,'/manuals/categories/medicines/');
  assert.equal(safeManualReturn('/manuals/categories/medicines/#medicine-two'),'/manuals/categories/medicines/#medicine-two');
});

test('药品单册撤下关联档案后不再进入公开索引，原本同时适用的其他药品及资料仍可访问',()=>{
  const data=source();Object.assign(data.documents[0],{linked_archive_id:'LJM-20200101-OTH-001',display_approved:true});
  const catalog=projectManualCatalog(data,[]);assert.deepEqual(catalog.documents.map(d=>d.manual_key),['manual-early']);
  assert.deepEqual(catalog.medicines.map(m=>m.medicine_key),['medicine-one']);
});


test('人工确认的旧型号与已公开药品只算一项，两个版本各自有原链接，品牌查询仍能定位旧册',()=>{
  const data=source(), item=data.medicines[0], oldKey='model-confirmed';
  item.legacy_model_key=oldKey;
  // 第二个规格没有这条私密旧型号关联。
  for(const other of data.medicines.slice(1))delete other.legacy_model_key;
  data.brands.push({brand_key:'brand-older',name:'旧品牌',aliases:[]});
  data.models.push({model_key:oldKey,model_text:'旧型号甲',model_aliases:[],product_name:'旧产品题名',brand_key:'brand-older',category_key:'medicines',product_era_display:'旧藏'});
  const oldDoc={...version('manual-legacy',[],'旧版'),model_keys:[oldKey]};
  delete oldDoc.medicine_keys;
  data.documents=[data.documents[1],oldDoc];
  const input=manualPublicationInput(data),catalog=projectManualCatalog(input);
  assert.equal(input.models[0].medicine_key,'medicine-one');
  const index=validateManualSearchIndex(manualSearchProjection(catalog));
  assert.equal(index.models[0].medicine_key,'medicine-one');
  for(const q of ['','旧型号甲','旧品牌','示意药甲']){
    const found=searchManualCatalog(index,{q,category:'medicines'});
    assert.equal(found.groups.length,1);
    assert.equal(found.medicineCount,1);assert.equal(found.modelCount,0);
    assert.deepEqual(found.groups[0].documents.map(d=>d.manual_key).sort(),['manual-early','manual-legacy']);
  }
  const oldBrand=searchManualCatalog(index,{brand:'brand-older'});
  assert.equal(oldBrand.groups[0].model.model_key,oldKey);assert.equal(oldBrand.documentCount,1);
  const category=buildManualBrowse(index).categories[0];
  assert.deepEqual(category.brands.map(b=>b.key),['brand-older']);
  assert.equal(safeManualReturn(category.path+'#'+oldKey),category.path+'#'+oldKey);
  assert.deepEqual(category.found.groups[0].legacyModels.map(m=>m.model_key),[oldKey]);

  // 已撤下的关联档案不应把私密药品记录、所属公司的名称或新编号带入目录。
  Object.assign(input.documents[0],{linked_archive_id:'LJM-20200101-OTH-001',page_map:[],display_approved:true});
  const hiddenIndex=validateManualSearchIndex(manualSearchProjection(projectManualCatalog(input,[])));
  assert.equal(hiddenIndex.medicines.length,0);assert.equal(hiddenIndex.models[0].medicine_key,undefined);
  data.documents=[oldDoc];
  const onlyOld=manualPublicationInput(data);
  assert.equal(onlyOld.schema_version,1);assert.equal(onlyOld.models[0].medicine_key,undefined);
  assert(!JSON.stringify(onlyOld).includes('medicine-one'));
});
