import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {projectManualCatalog,manualSearchProjection,safeManualReturn} from '../../shared/manual-catalog.mjs';
import {buildManualBrowse,manualBrandPath,manualCategoryPath,manualModelAnchor} from '../../shared/manual-browse.mjs';

const raw=JSON.parse(await fs.readFile(new URL('../../samples/manuals-demo/catalog.json',import.meta.url),'utf8'));
const catalog=()=>projectManualCatalog(structuredClone(raw),[],{allowDemo:true});

test('品牌和品类从公开投影生成，多型号共用一份文档时独立计数',()=>{
  const browse=buildManualBrowse(catalog());assert.equal(browse.brands.length,2);assert.equal(browse.categories.length,2);assert.equal(browse.modelCount,5);assert.equal(browse.documentCount,6);assert.equal(browse.unavailableDocumentCount,1);
  const brand=browse.brands.find(b=>b.brand_key==='demo-brand-001');assert.equal(brand.modelCount,3);assert.equal(brand.documentCount,4);assert.equal(brand.categories.length,1);
  const category=browse.categories.find(c=>c.category_key==='home-appliances');assert.equal(category.modelCount,4);assert.equal(category.documentCount,5);assert.equal(category.brands.length,2);
  assert.deepEqual(browse.categories.map(c=>c.category_key),['home-appliances','audio-photo']);
});
test('仅来源失效的品牌和品类仍可查看状态，可用数量始终为零',()=>{
  const source=catalog();source.documents=source.documents.filter(d=>!d.available);const browse=buildManualBrowse(source);assert.equal(browse.brands.length,1);assert.equal(browse.categories.length,1);assert.equal(browse.modelCount,0);assert.equal(browse.documentCount,0);assert.equal(browse.unavailableDocumentCount,1);assert.equal(browse.brands[0].brand_key,'demo-brand-002');assert.equal(browse.categories[0].category_key,'audio-photo');
});
test('空目录没有虚构品牌或品类详情，搜索索引与完整投影的统计一致',()=>{
  const empty=buildManualBrowse({brands:[],models:[],documents:[]});assert.deepEqual(empty,{brands:[],categories:[],modelCount:0,documentCount:0,unavailableModelCount:0,unavailableDocumentCount:0});
  const full=buildManualBrowse(catalog()),index=buildManualBrowse(manualSearchProjection(catalog()));for(const key of ['modelCount','documentCount','unavailableModelCount','unavailableDocumentCount'])assert.equal(full[key],index[key]);assert.deepEqual(full.brands.map(b=>b.path),index.brands.map(b=>b.path));
});
test('草稿、撤下资料与未使用品牌不会生成浏览详情页',()=>{
  const source=catalog();assert(!buildManualBrowse(source).brands.some(b=>b.found.groups.some(g=>g.documents.some(d=>['demo-manual-008','demo-manual-009'].includes(d.manual_key)))));
  source.brands.push({brand_key:'demo-brand-unused',name:'未使用品牌',aliases:[]});assert(!buildManualBrowse(source).brands.some(b=>b.brand_key==='demo-brand-unused'));
});
test('共享文档跨品类时全库去重，品类中分别列出明确适用型号',()=>{
  const source=catalog(),shared=source.documents.find(d=>d.manual_key==='demo-manual-002');shared.model_keys.push('demo-model-005');const browse=buildManualBrowse(source);assert.equal(browse.documentCount,6);assert.equal(browse.categories.find(c=>c.category_key==='audio-photo').documentCount,2);assert(browse.categories.reduce((n,c)=>n+c.documentCount,0)>browse.documentCount);
});
test('浏览路径和型号锚点拒绝任意网址、主档路径与无效品类',()=>{
  assert.equal(manualBrandPath('brand-test'),'/manuals/brands/brand-test/');assert.equal(manualCategoryPath('tools'),'/manuals/categories/tools/');assert.equal(manualModelAnchor('model-test',true),'unavailable-model-test');
  for(const value of ['../private','https://example.com','brand-test/../../','DEMO-BRAND-1'])assert.throws(()=>manualBrandPath(value));assert.throws(()=>manualCategoryPath('unknown'));assert.throws(()=>manualModelAnchor('brand-test'));
});
test('从详情返回品牌、品类和原型号位置，过滤额外参数与非法锚点',()=>{
  for(const route of ['/manuals/brands/brand-test/','/manuals/brands/demo-brand-001/','/manuals/categories/audio-photo/'])assert.equal(safeManualReturn(route+'?token=PRIVATE#model-test'),route+'#model-test');
  assert.equal(safeManualReturn('/manuals/categories/tools/#unavailable-model-test'),'/manuals/categories/tools/#unavailable-model-test');
  assert.equal(safeManualReturn('/manuals/brands/brand-test/#main-content'),'/manuals/brands/brand-test/');
  for(const route of ['/manuals/brands/','/manuals/categories/unknown/','/manuals/brands/brand-test/../../admin/','/manuals/brands/brand-test%2f..%2f/','//evil.example/manuals/brands/brand-test/','/manuals/brands/brand-test/\\private'])assert.equal(safeManualReturn(route),'/manuals/');
});
