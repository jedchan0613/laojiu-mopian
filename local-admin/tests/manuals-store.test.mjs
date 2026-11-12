import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {createManualStore,normalizeManualDraft,manualPublicationInput,validateManualPublication} from '../manuals.mjs';
import {projectManualCatalog} from '../../shared/manual-catalog.mjs';
import {createManualFixture,manualFixtureCatalog} from './helpers/manuals-fixture.mjs';

test('草稿可保存缺项，审批字段、主档路径及演示标识不能成为发布依据',async t=>{
  const f=await createManualFixture(t),catalog=manualFixtureCatalog();catalog.documents[0].publication_approved=true;catalog.documents[0].master_file_path='DO-NOT-SHIP';catalog.models[0].model_text='';await f.save(catalog);
  const state=await f.store.bootstrap();assert.equal(state.state.draft.models[0].model_text,'');assert(!JSON.stringify(state).includes('DO-NOT-SHIP'));assert(!Object.hasOwn(state.state.draft.documents[0],'publication_approved'));
  assert((await f.store.prepare({expectedRevision:state.revision})).issues.length>0);await assert.rejects(fs.access(f.source));assert.equal(f.builds(),0);
  assert.throws(()=>normalizeManualDraft({...catalog,demo_only:true}));assert.throws(()=>normalizeManualDraft({...catalog,brands:[{brand_key:'demo-brand-001'}]}));
});
test('草稿、预览与正式目录隔离；发布源不含依据、备注及未引用的品牌型号',async t=>{
  const f=await createManualFixture(t),catalog=manualFixtureCatalog();catalog.brands.push({brand_key:'brand-unused',name:'',aliases:[],evidence:'PRIVATE-UNUSED'});await f.save(catalog);const saved=await f.store.bootstrap();
  const preview=await f.store.preview(saved.revision,'manual-test');assert.equal(preview.issues.length,0);assert.equal(preview.document.official_sources.length,1);assert(!JSON.stringify(preview).includes('PRIVATE-'));await assert.rejects(fs.access(f.source));
  await f.publish();const source=JSON.parse(await fs.readFile(f.source,'utf8'));assert(!JSON.stringify(source).includes('PRIVATE-'));assert.equal(source.brands.length,1);assert.equal(source.documents.length,1);assert.equal(projectManualCatalog(source,[]).documents.length,1);assert.equal((await f.store.bootstrap()).state.draft,null);assert.equal(f.builds(),1);
});
test('目录版本冲突拒绝覆盖，检查清单随修改失效，人工确认不能省略',async t=>{
  const f=await createManualFixture(t),initial=(await f.store.bootstrap()).revision;await f.save();await assert.rejects(f.store.save({expectedRevision:initial,catalog:manualFixtureCatalog()}),e=>e.statusCode===409);
  let current=await f.store.bootstrap(),review=await f.store.prepare({expectedRevision:current.revision});await assert.rejects(f.store.publish({expectedRevision:current.revision,review_id:review.review_id,confirmations:Array(5).fill(false)}),e=>e.statusCode===428);
  await f.save();current=await f.store.bootstrap();await assert.rejects(f.store.publish({expectedRevision:current.revision,review_id:review.review_id,confirmations:Array(5).fill(true)}),e=>e.statusCode===428);assert.equal(f.builds(),0);
});
test('发布检查要求型号和官方来源依据，拒绝无效网址、重复版本、缺页漏注与越界目录',()=>{
  const cases=[c=>c.brands[0].evidence='',c=>c.models[0].evidence='',c=>c.documents[0].applicability_basis='',c=>c.documents[0].official_sources[0].evidence='',c=>c.documents[0].official_sources[0].url='https://127.0.0.1/private',c=>c.documents[0].official_sources[0].checked_on='2026-02-30',c=>c.documents[0].official_sources[0].checked_on='2999-01-01',c=>{c.documents.push({...c.documents[0],manual_key:'manual-copy'});},c=>{c.documents[0].completeness='incomplete';c.documents[0].missing_note='';},c=>c.documents[0].contents=[{label:'错误目录',page:3}]];
  for(const change of cases){const catalog=manualFixtureCatalog();change(catalog);assert(validateManualPublication(normalizeManualDraft(catalog),[]).issues.length>0);}
});
test('馆藏阅读必须为已公开安全档案，且只能引用本档案真实发布图片',async t=>{
  const f=await createManualFixture(t);await f.save(f.readerCatalog());let current=await f.store.bootstrap();assert.equal((await f.store.prepare({expectedRevision:current.revision})).issues.length,0);
  for(const [key,value]of [['privacy_level','Y'],['record_status','WDR'],['use_status','U0'],['object_type','LET']]){const archive=structuredClone(f.archive);archive.core[key]=value;f.setArchives([archive]);assert((await f.store.prepare({expectedRevision:current.revision})).issues.length>0);}f.setArchives([f.archive]);
  const bad=f.readerCatalog();bad.documents[0].page_map[0].attachment_ref='/archive/LJM-20000101-OTH-002/front-public.png';await f.save(bad);current=await f.store.bootstrap();assert((await f.store.prepare({expectedRevision:current.revision})).issues.length>0);
  await f.save(f.readerCatalog());await fs.writeFile(f.image,'NOT-AN-IMAGE');current=await f.store.bootstrap();assert((await f.store.prepare({expectedRevision:current.revision})).issues.length>0);
});
test('检查后附件变化使原确认失效；构建中变化会回退页面和草稿',async t=>{
  const f=await createManualFixture(t);await f.save(f.readerCatalog());let current=await f.store.bootstrap(),review=await f.store.prepare({expectedRevision:current.revision});
  const before=await fs.readFile(f.image);await fs.writeFile(f.image,Buffer.concat([before,Buffer.from('changed')]));await assert.rejects(f.store.publish({expectedRevision:current.revision,review_id:review.review_id,confirmations:Array(5).fill(true)}),e=>e.statusCode===409);assert.equal(f.builds(),0);await fs.writeFile(f.image,before);
  f.onBuild(()=>fs.writeFile(f.image,Buffer.concat([before,Buffer.from('during-build')])));await assert.rejects(f.publish(),/已恢复/);assert.equal(await fs.readFile(path.join(f.dist,'index.html'),'utf8'),'PREVIOUS-SITE');assert((await f.store.bootstrap()).state.draft);assert.equal((await f.store.bootstrap()).pending.length,0);
});
test('构建失败保留上一份目录、页面与草稿，可重新核对后再次发布',async t=>{
  const f=await createManualFixture(t);await f.save();await f.publish();const oldSource=await fs.readFile(f.source),oldPage=await fs.readFile(path.join(f.dist,'index.html'));const edited=manualFixtureCatalog();edited.documents[0].edition_display='修改第二版';await f.save(edited);f.failBuild(true);await assert.rejects(f.publish(),e=>e.code==='MANUALS_BUILD_FAILED'&&e.safeToRetry===true);
  assert.deepEqual(await fs.readFile(f.source),oldSource);assert.deepEqual(await fs.readFile(path.join(f.dist,'index.html')),oldPage);let current=await f.store.bootstrap();assert.equal(current.state.draft.documents[0].edition_display,'修改第二版');assert.equal(current.state.published.documents[0].edition_display,'测试第一版');assert.equal(current.pending.length,0);
  f.failBuild(false);await f.publish();assert.equal((await f.store.bootstrap()).state.published.documents[0].edition_display,'修改第二版');
});
test('撤下移除公开资料并保留其他草稿、原附件与历史；恢复只生成草稿',async t=>{
  const f=await createManualFixture(t);await f.save(f.readerCatalog());await f.publish();const image=await fs.readFile(f.image),edited=f.readerCatalog();edited.brands[0].name='尚未发布的品牌修改';await f.save(edited);let current=await f.store.bootstrap();await f.store.withdraw({expectedRevision:current.revision,manual_key:'manual-test',reason:'合成撤下验收',confirmed:true});
  current=await f.store.bootstrap();assert.equal(current.state.draft.brands[0].name,'尚未发布的品牌修改');assert.equal(current.state.draft.documents[0].publication_status,'withdrawn');assert.equal(JSON.parse(await fs.readFile(f.source)).documents.length,0);assert.deepEqual(await fs.readFile(f.image),image);
  const history=current.history.find(h=>h.kind==='published-before-withdrawal');await f.store.restore({expectedRevision:current.revision,history_id:history.history_id});current=await f.store.bootstrap();assert.equal(current.state.draft.documents[0].publication_status,'draft');assert.equal(JSON.parse(await fs.readFile(f.source)).documents.length,0);assert(current.history.some(h=>h.kind==='draft-before-restore'));
});
test('同步保留既有公开目录，关联档案撤下后过滤全部文字、型号与入口',async t=>{
  const f=await createManualFixture(t);await f.save(f.readerCatalog());await f.publish();const raw=await fs.readFile(f.source);await f.store.sync();assert.deepEqual(await fs.readFile(f.source),raw);
  f.setArchives([]);await f.store.sync();const source=JSON.parse(await fs.readFile(f.source));assert.equal(source.documents.length,0);assert.equal(source.brands.length,0);assert.equal(source.models.length,0);
});
test('中断发布保留日志并停止后续写入，无法用新草稿绕过',async t=>{
  const f=await createManualFixture(t),job=path.join(f.root,'transactions','00000000-0000-4000-8000-000000000001');await fs.mkdir(job,{recursive:true});await fs.writeFile(path.join(job,'manifest.json'),JSON.stringify({status:'building',created_at:new Date().toISOString()}));assert.equal((await f.store.bootstrap()).pending.length,1);await assert.rejects(f.save(),e=>e.code==='MANUALS_TRANSACTION_UNCERTAIN');
});
test('历史与预览地址拒绝路径穿越，不允许私密目录设置到网站内',async t=>{
  const f=await createManualFixture(t);await f.save();const current=await f.store.bootstrap();await assert.rejects(f.store.restore({expectedRevision:current.revision,history_id:'../../state'}));await assert.rejects(f.store.preview(current.revision,'../../private'));
  assert(!JSON.stringify(manualPublicationInput(current.state.draft)).includes('PRIVATE-'));
  assert.throws(()=>createManualStore({root:path.join(f.site,'public/manuals'),siteDirectory:f.site,readArchives:async()=>[],build:async()=>{}}));
});

test('适用型号部分重叠的同版本不能重复，型号别名不能与同品牌其他型号冲突',()=>{
  const catalog=manualFixtureCatalog();catalog.models.push({...catalog.models[0],model_key:'model-second',model_text:'TEST-200',model_aliases:[]});catalog.documents[0].model_keys.push('model-second');catalog.documents.push({...structuredClone(catalog.documents[0]),manual_key:'manual-second',model_keys:['model-test']});
  assert(validateManualPublication(normalizeManualDraft(catalog),[]).issues.some(i=>i.message.includes('版本重复')));
  catalog.documents[1].edition_display='另一版本';catalog.models[1].model_aliases=['TEST-100'];
  assert(validateManualPublication(normalizeManualDraft(catalog),[]).issues.some(i=>i.message.includes('别名')));
});

test('无私密维护记录时核验并保留继承的公开投影，不会用空目录覆盖',async t=>{
  const f=await createManualFixture(t),source=JSON.stringify(manualPublicationInput(normalizeManualDraft(manualFixtureCatalog())));await fs.mkdir(path.dirname(f.source),{recursive:true});await fs.writeFile(f.source,source);await f.store.sync();assert.equal(await fs.readFile(f.source,'utf8'),source);await assert.rejects(fs.access(path.join(f.root,'state.json')));
});

test('私密历史目录不能通过文件链接指向其他位置',async t=>{
  const f=await createManualFixture(t),other=path.join(f.dir,'other-private');await fs.mkdir(other);await fs.mkdir(f.root,{recursive:true});await fs.symlink(other,path.join(f.root,'history'),process.platform==='win32'?'junction':'dir');await assert.rejects(f.store.bootstrap(),/文件链接/);assert.deepEqual(await fs.readdir(other),[]);
});
