import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {projectManualCatalog,manualSearchProjection,validateManualSearchIndex,searchManualCatalog,safeManualSourceUrl,readManualQuery,manualQueryString,safeManualReturn,manualPageFromHash} from '../../shared/manual-catalog.mjs';

const fixture=JSON.parse(await fs.readFile(new URL('../../samples/manuals-demo/catalog.json',import.meta.url),'utf8'));
const demo=()=>projectManualCatalog(structuredClone(fixture),[],{allowDemo:true});
const index=()=>manualSearchProjection(demo());
const find=(q,filters={})=>searchManualCatalog(index(),{q,...filters});
const firstIds=result=>result.groups[0]?.documents.map(d=>d.manual_key)??[];

test('演示资料必须显式开启，正式路径不能接收示例档案',()=>{
  assert.throws(()=>projectManualCatalog(fixture));
  assert.throws(()=>projectManualCatalog({schema_version:1,brands:[],models:[],documents:[]},[],{allowDemo:true}));
  assert.deepEqual(projectManualCatalog({schema_version:1,brands:[],models:[],documents:[]}),{schema_version:1,demo:false,brands:[],models:[],documents:[]});
});

test('Q01—Q06、Q18：品牌、大小写、全半角、别名与后缀分别核对',async t=>{
  for(const q of ['示例甲牌 EX-RC100','DEMO-A EX-RC100','示例甲牌 ex-rc100','示例甲牌 ＥＸ－ＲＣ１００','示例甲牌 EX RC100','  示例甲牌   EX-RC100  '])await t.test(q,()=>{
    const result=find(q);assert.equal(result.groups[0].model.model_key,'demo-model-001');assert.equal(result.groups[0].matchKind,'exact');assert.deepEqual(firstIds(result),['demo-manual-001','demo-manual-002','demo-manual-003']);
    assert(result.groups.filter(g=>g.model.model_text==='EX-RC100A').every(g=>g.matchKind!=='exact'));
  });
  const suffix=find('示例甲牌 EX-RC100A');assert.deepEqual(firstIds(suffix),['demo-manual-004']);assert.equal(suffix.groups[0].model.model_key,'demo-model-002');
});

test('Q07、Q08：跨品牌同名不合并，片段匹配不标准确',()=>{
  const result=find('EX-RC100'),matched=result.groups.filter(g=>g.matchKind==='model');assert.equal(matched.length,2);assert.equal(new Set(matched.map(g=>g.brand.brand_key)).size,2);
  const partial=find('RC100');assert(partial.groups.length>=3);assert(partial.groups.every(g=>!['exact','model'].includes(g.matchKind)));assert(partial.groups.filter(g=>g.model.model_text.includes('RC100')).every(g=>g.matchKind==='partial'));
});
test('Q09—Q12：共用手册、语言和文档用途筛选',()=>{
  assert.deepEqual(firstIds(find('示例甲牌 EX-RC200')),['demo-manual-002']);
  assert.deepEqual(firstIds(find('示例甲牌 EX-RC100',{language:'zh-CN'})),['demo-manual-001','demo-manual-002']);
  assert.deepEqual(firstIds(find('示例甲牌 EX-RC100',{language:'en'})),['demo-manual-002','demo-manual-003']);
  assert.deepEqual(firstIds(find('示例甲牌 EX-RC100',{kind:'installation'})),['demo-manual-003']);
});
test('Q13、Q14：不存在的完整型号不能短截，数字0和字母O不自动替换',()=>{
  for(const q of ['EX-RC1000','EX-RC10O']){const result=find(q);assert.equal(result.modelCount,0);assert.equal(result.hasExact,false);}
});
test('Q15、Q16、Q17：缺页和来源失效如实保留，撤下不进入索引',()=>{
  const missing=find('',{category:'audio-photo',complete:'incomplete'});assert.equal(missing.documentCount,1);assert.equal(missing.groups[0].documents[0].manual_key,'demo-manual-006');
  const lost=find('示例乙牌 EX-TC10');assert.equal(lost.modelCount,0);assert.equal(lost.unavailable.length,1);assert.equal(lost.unavailable[0].documents[0].manual_key,'demo-manual-007');
  assert(!JSON.stringify(index()).includes('demo-manual-008'));assert(!JSON.stringify(index()).includes('demo-manual-009'));
});
test('Q21、Q23：型号与文档分别计数，共用文档去重，清空后草稿不回流',()=>{
  const result=find('');assert.equal(result.modelCount,5);assert.equal(result.documentCount,6);assert.equal(result.unavailable.length,1);
  assert.equal(result.groups.flatMap(g=>g.documents).filter(d=>d.manual_key==='demo-manual-002').length,2);
  assert.equal(JSON.stringify(readManualQuery('')),JSON.stringify(readManualQuery(manualQueryString({q:'',brand:'',category:''}))));
});
test('Q22：无分隔符写法有歧义时，只展示格式候选，不擅自合并',()=>{
  const value=index(),base=value.models[0];value.models.push({...base,model_key:'demo-model-007',model_text:'EX-12-3',model_aliases:[]},{...base,model_key:'demo-model-008',model_text:'EX1-23',model_aliases:[]});
  value.documents.push({...value.documents[1],manual_key:'demo-manual-010',model_keys:['demo-model-007','demo-model-008']});
  const result=searchManualCatalog(value,{q:'示例甲牌 EX123'});assert.equal(result.modelCount,2);assert(result.groups.every(g=>g.matchKind==='format'));assert.equal(result.documentCount,1);assert.equal(result.hasExact,false);
});
test('Q24：纸面页码与页序分离，非法页码重置且不接受路径',()=>{
  assert.equal(demo().documents[0].pages[2].label,'印刷页1');assert.deepEqual(manualPageFromHash('#page=3',6),{page:3,invalid:false});
  for(const hash of ['#page=999','#page=0','#page=-1','#page=../private','#page=1&other=2'])assert.deepEqual(manualPageFromHash(hash,6),{page:1,invalid:true});
  assert.deepEqual(manualPageFromHash('',6),{page:1,invalid:false});
});
test('筛选互相一致，未知的条件不能变成无条件搜索',()=>{
  assert.equal(find('',{access:'reader'}).documentCount,3);assert.equal(find('',{access:'official'}).documentCount,3);
  for(const [key,value] of [['brand','not-existing'],['category','not-existing'],['language','not-existing'],['kind','not-existing'],['access','not-existing'],['region','not-existing']])assert.equal(find('',{[key]:value}).modelCount,0);
});

// 仅在内存中模拟格式有效的档案，用于验证发布边界；不写入或占用真实档案编号。
function realFixture(){
  const id='LJM-20000101-OTH-001',src=`/archive/${id}/front-public.jpg`;
  const archive={core:{item_id:id,object_type:'OTH',record_status:'ACT',privacy_level:'G',use_status:'U3',rights_status:'OWN',title:'已审说明书',publication_file_path:[src]},metadata:{schema:'common',dimensions:{}},public_view:{description:'已审核的公开简介'}};
  const record={manual_key:'manual-000001',model_keys:['model-000001'],document_kind:'user-guide',languages:['zh-CN'],region_display:'地区未注明',edition_display:'版本未注明',edition_date:null,completeness:'complete',missing_note:'',linked_archive_id:id,page_map:[{attachment_ref:src,printed_label:'封面'}],contents:[{label:'封面',page:1}],keywords:[],official_sources:[],publication_status:'published',publication_approved:true,display_approved:true};
  const source={schema_version:1,brands:[{brand_key:'brand-000001',name:'内存测试品牌',aliases:[]}],models:[{model_key:'model-000001',brand_key:'brand-000001',model_text:'TEST-1',model_aliases:[],product_name:'测试物件',category_key:'tools',product_era_display:''}],documents:[record]};
  return {source,archive,record};
}
test('馆藏必须同时满足现行ACT/G/U3，撤下后连题名及所属目录都不输出',()=>{
  for(const [field,value] of [['record_status','WDR'],['record_status','SUS'],['privacy_level','Y'],['privacy_level','R'],['use_status','U0']]){
    const f=realFixture();f.archive.core[field]=value;const result=projectManualCatalog(f.source,[f.archive]);assert.equal(result.documents.length,0);assert.equal(result.models.length,0);assert.equal(result.brands.length,0);
  }
  const f=realFixture();assert.equal(projectManualCatalog(f.source,[]).documents.length,0);
});
test('未知或仅持有实物不能被目录字段强行开放下载，缺展示依据不能输出阅读副本',()=>{
  const f=realFixture();f.record.can_download=true;for(const rights of ['OWN','UNK','LIC','RES']){f.archive.core.rights_status=rights;assert.equal(projectManualCatalog(f.source,[f.archive]).documents[0].can_download,false);}
  f.archive.core.rights_status='PD';assert.equal(projectManualCatalog(f.source,[f.archive]).documents[0].can_download,true);
  f.record.display_approved=false;assert.throws(()=>projectManualCatalog(f.source,[f.archive]));
});
test('未批准及草稿不输出，关联类型和schema不匹配不能用作阅读资料',()=>{
  const f=realFixture();f.record.publication_approved=false;assert.equal(projectManualCatalog(f.source,[f.archive]).documents.length,0);
  f.record.publication_approved=true;f.record.publication_status='draft';assert.equal(projectManualCatalog(f.source,[f.archive]).documents.length,0);
  f.record.publication_status='published';f.archive.metadata.schema='photo';assert.throws(()=>projectManualCatalog(f.source,[f.archive]));
});
test('图片只能引用本档案已公开附件，拒绝主档、其他档案与路径穿越',()=>{
  for(const src of ['/local-admin/private.jpg','/archive/LJM-20000101-OTH-002/front-public.jpg','/archive/LJM-20000101-OTH-001/../private.jpg','/archive/LJM-20000101-OTH-001/master.tiff','https://example.com/scan.jpg']){
    const f=realFixture();f.record.page_map[0].attachment_ref=src;f.archive.core.publication_file_path.push(src);assert.throws(()=>projectManualCatalog(f.source,[f.archive]));
  }
});
test('私密字段不流入公开投影，查询索引不携带附件或下载路径',()=>{
  const f=realFixture();f.record.reviewed_by='DO-NOT-SHIP';f.record.account_id='DO-NOT-SHIP';f.record.private_note='DO-NOT-SHIP';f.archive.core.master_file_path='DO-NOT-SHIP';
  const projected=projectManualCatalog(f.source,[f.archive]),raw=JSON.stringify(projected);assert(!raw.includes('DO-NOT-SHIP'));assert(!raw.includes('publication_approved'));
  const search=JSON.stringify(manualSearchProjection(projected));assert(!search.includes('/archive/'));assert(!search.includes('pages'));assert(!search.includes('can_download'));
});
test('来源地址拒绝脚本、内网、凭据和访问密钥，示例域名不能用于正式目录',()=>{
  assert.equal(safeManualSourceUrl('https://support.example.com/manual.pdf?file=123'),'https://support.example.com/manual.pdf?file=123');
  for(const url of ['javascript:alert(1)','data:text/html,abc','file:///C:/private','http://example.com/manual.pdf','https://localhost/a','https://127.0.0.1/a','https://2130706433/a','https://[::1]/a','https://user:password@example.com/a','https://example.com/?token=private','https://example.invalid/support'])assert.equal(safeManualSourceUrl(url),null,url);
  assert.equal(safeManualSourceUrl('https://example.invalid/support',{demo:true}),'https://example.invalid/support');
});
test('目录重复标识、同品牌重复型号、失效引用、缺页漏注和目录越界必须停止',()=>{
  for(const change of [f=>f.source.brands.push({...f.source.brands[0]}),f=>f.source.models.push({...f.source.models[0],model_key:'model-000002'}),f=>f.record.model_keys=['model-999999'],f=>{f.record.completeness='incomplete';f.record.missing_note='';},f=>f.record.contents[0].page=2,f=>f.source.documents.push({...f.record})]){const f=realFixture();change(f);assert.throws(()=>projectManualCatalog(f.source,[f.archive]));}
});
test('索引格式和演示标记不匹配时停止，不能当作正常无结果',()=>{
  const good=index();assert.equal(validateManualSearchIndex(good,{demo:true}),good);assert.throws(()=>validateManualSearchIndex(good));
  const bad=structuredClone(good);bad.documents[0].model_keys=['missing'];assert.throws(()=>validateManualSearchIndex(bad,{demo:true}));
});
test('查询返回地址保留筛选条件并去掉其他参数，不能转向站外或管理页',()=>{
  const q={q:'示例甲牌 EX-RC100',language:'zh-CN',brand:'demo-brand-001'};assert.equal(readManualQuery(manualQueryString(q)).q,q.q);
  const safe=safeManualReturn('/manuals/?'+manualQueryString(q)+'&token=DO-NOT-SHIP');assert(safe.startsWith('/manuals/?'));assert(!safe.includes('DO-NOT-SHIP'));
  for(const value of ['https://example.com/','//example.com/','/manuals/../login/','/manuals/%2e%2e/admin/','/manuals/\\private','/admin/'])assert.equal(safeManualReturn(value),'/manuals/');
});
