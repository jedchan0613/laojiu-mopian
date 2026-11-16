// 只验证“药品”目录分类。全部对象为内存合成记录，不含真实药品或用药内容。
import test from 'node:test';
import assert from 'node:assert/strict';
import {randomBytes} from 'node:crypto';
import fs from 'node:fs/promises';
import {Script} from 'node:vm';
import {manualCategories,projectManualCatalog,manualSearchProjection,validateManualSearchIndex,searchManualCatalog,readManualQuery,manualQueryString,safeManualReturn} from '../../shared/manual-catalog.mjs';
import {manualDraftChoices,normalizeManualSubmission} from '../../shared/manual-submission.mjs';
import {buildManualBrowse,manualCategoryPath} from '../../shared/manual-browse.mjs';
import {createManualAccountFixture} from './helpers/manual-account-fixture.mjs';
import {createManualFixture} from './helpers/manuals-fixture.mjs';

function source(){
  const model=(suffix,category)=>({model_key:'model-qa-'+suffix,brand_key:'brand-qa-categories',model_text:'QA-'+suffix.toUpperCase(),model_aliases:[],product_name:'合成分类对象'+suffix,category_key:category,product_era_display:''});
  const document=suffix=>({manual_key:'manual-qa-'+suffix,model_keys:['model-qa-'+suffix],document_kind:'user-guide',languages:['zh-CN'],region_display:'地区未注明',edition_display:'合成分类验收版',edition_date:'',completeness:'unverified',missing_note:'',linked_archive_id:'',page_map:[],contents:[],keywords:[],catalogue_summary:'仅供内存分类测试，不含实际操作或医疗信息。',official_sources:[{name:'合成测试入口',url:'https://example.com/qa-only-'+suffix,checked_on:'2026-01-01',available:true}],publication_status:'published',publication_approved:true,display_approved:false});
  return {schema_version:1,brands:[{brand_key:'brand-qa-categories',name:'合成分类品牌',aliases:[]}],models:[model('medicines','medicines'),model('tools','tools')],documents:[document('medicines'),document('tools')]};
}

test('药品使用唯一稳定medicines键，投稿选项派生同一字典，旧品类含义保持',()=>{
  assert.equal(manualCategories.medicines,'药品');
  assert.equal(manualDraftChoices.categories,manualCategories);
  assert.equal(manualDraftChoices.categories.medicines,'药品');
  assert.equal(manualCategories.tools,'工具与设备');
  assert.equal(manualCategories['home-appliances'],'家用电器');
  assert.equal(Object.values(manualCategories).filter(label=>label==='药品').length,1);
  assert.equal(normalizeManualSubmission({schema_version:1,category_key:'medicines'}).category_key,'medicines');
  for(const invalid of ['medicine','drug','药品'])assert.throws(()=>normalizeManualSubmission({schema_version:1,category_key:invalid}));
});

test('公开投影及搜索索引接受药品，药品筛选只返回该品类且与型号查询相交',()=>{
  const input=source(),before=JSON.stringify(input),catalog=projectManualCatalog(input),index=manualSearchProjection(catalog);
  validateManualSearchIndex(index);
  assert.equal(index.models.find(model=>model.model_key==='model-qa-medicines').category_key,'medicines');
  const query=readManualQuery('?'+manualQueryString({category:'medicines',q:'QA-MEDICINES'}));
  const found=searchManualCatalog(index,query);
  assert.equal(found.modelCount,1);assert.equal(found.documentCount,1);
  assert.equal(found.groups[0].model.category_key,'medicines');
  assert.equal(found.groups[0].documents[0].manual_key,'manual-qa-medicines');
  assert.equal(searchManualCatalog(index,{category:'tools',q:'QA-MEDICINES'}).documentCount,0);
  assert.equal(JSON.stringify(input),before,'派生查询不修改原始输入');
});

test('药品浏览页、品牌品类链接和安全返回路径由正式分类派生',()=>{
  const catalog=projectManualCatalog(source()),browse=buildManualBrowse(catalog),category=browse.categories.find(row=>row.category_key==='medicines');
  assert.equal(category.name,'药品');assert.equal(category.path,'/manuals/categories/medicines/');
  assert.equal(category.documentCount,1);assert.equal(category.modelCount,1);
  assert.equal(category.found.groups[0].model.category_key,'medicines');
  assert(browse.brands[0].categories.some(row=>row.key==='medicines'&&row.name==='药品'));
  assert.equal(manualCategoryPath('medicines'),category.path);
  assert.equal(safeManualReturn(category.path+'?token=discard#model-qa-medicines'),category.path+'#model-qa-medicines');
});

test('新增药品定义不会虚构公开条目、空品类页或绕过草稿与批准门禁',()=>{
  assert.deepEqual(buildManualBrowse(projectManualCatalog({schema_version:1,brands:[],models:[],documents:[]})).categories,[]);
  for(const mutate of [doc=>{doc.publication_status='draft';},doc=>{doc.publication_approved=false;}]){
    const input=source();mutate(input.documents[0]);const catalog=projectManualCatalog(input),browse=buildManualBrowse(catalog);
    assert.equal(browse.categories.some(row=>row.category_key==='medicines'),false);
    assert.equal(catalog.models.some(model=>model.category_key==='medicines'),false);
    assert.equal(catalog.documents.some(doc=>doc.manual_key==='manual-qa-medicines'),false);
    assert.equal(browse.categories.find(row=>row.category_key==='tools').documentCount,1);
  }
});

test('实际查询组件在空目录和有资料时都提供已定义品类，选择空药品分类只得空结果',async()=>{
  const page=await fs.readFile(new URL('../../site/src/pages/manuals/index.astro',import.meta.url),'utf8');
  const declaration=page.match(/^const categories=.+;$/m)?.[0];assert(declaration,'查询组件应提供品类选项');
  const empty=projectManualCatalog({schema_version:1,brands:[],models:[],documents:[]});
  // 运行实际组件的前置品类表达式，防止空库筛掉药品，而不是复制筛选实现。
  const options=new Script(declaration+'\ncategories;');
  for(const catalog of [empty,projectManualCatalog(source())]){
    const result=options.runInNewContext({manualCategories,manualsCatalog:catalog});
    assert.deepEqual(Array.from(result,row=>Array.from(row)),Object.entries(manualCategories));
    assert(result.some(([key,label])=>key==='medicines'&&label==='药品'));
  }
  assert.equal(searchManualCatalog(empty,{category:'medicines'}).documentCount,0);
  assert.equal(buildManualBrowse(empty).categories.length,0,'空筛选选项不创建虚构品类页');
});

test('维护页后端提供药品选项，读取选项不会建立真实说明书数据',async t=>{
  const f=await createManualFixture(t),bootstrap=await f.store.bootstrap();
  assert.equal(bootstrap.choices.categories.medicines,'药品');
  assert.equal(bootstrap.state.published.documents.length,0);assert.equal(bootstrap.state.draft,null);
});

test('真实投稿HTTP接受药品私密草稿，重开与编辑保留品类，不生成档案或公开批准',async t=>{
  const f=await createManualAccountFixture();t.after(()=>f.close());
  const manual={schema_version:1,category_key:'medicines',brand_name:'合成分类验收品牌',product_name:'合成分类验收对象',model_texts:['QA-CATEGORY-ONLY'],languages:['zh-CN'],rights_basis:'own-work',sharing_scope:'official-link'};
  const created=await f.request('/api/account/manual-drafts',{method:'POST',body:{request_key:randomBytes(32).toString('hex'),manual}});
  assert.equal(created.status,200);const route='/api/account/manual-drafts/'+created.body.id;
  let opened=await f.request(route);assert.equal(opened.status,200);assert.equal(opened.body.manual_metadata.category_key,'medicines');
  const updated=await f.request(route,{method:'POST',body:{revision:opened.body.revision,manual:{...manual,edition_display:'合成修改版'}}});
  assert.equal(updated.status,200);opened=await f.request(route);
  assert.equal(opened.body.manual_metadata.category_key,'medicines');assert.equal(opened.body.status,'draft');
  assert.equal(opened.body.linked_item_id,null);assert.deepEqual(opened.body.images,[]);
  assert.equal(opened.body.consent.rights,false);assert.equal(opened.body.consent.privacy,false);
});
