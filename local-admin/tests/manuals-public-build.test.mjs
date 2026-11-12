import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {createHash} from 'node:crypto';
import {checkManualsPublicBuild} from '../../site/scripts/manuals-public-build.mjs';

async function fixture(t,index={schema_version:1,demo:false,brands:[],models:[],documents:[]}){
  const root=await fs.mkdtemp(path.join(os.tmpdir(),'ljm-manual-build-'));
  t.after(async()=>{assert.equal(path.dirname(root),path.resolve(os.tmpdir()));assert(path.basename(root).startsWith('ljm-manual-build-'));await fs.rm(root,{recursive:true,force:true});});
  const raw=JSON.stringify(index),filename=`manuals-search/${createHash('sha256').update(raw).digest('hex').slice(0,24)}.json`;
  await fs.mkdir(path.join(root,'manuals-search'));await fs.writeFile(path.join(root,filename),raw);
  const pages=[{relativePath:'manuals/index.html',html:`<script id="manual-search-config">${JSON.stringify({demo:false,url:'/'+filename})}</script>`},{relativePath:'manuals/help/index.html',html:''},{relativePath:'manuals/brands/index.html',html:''},{relativePath:'manuals/categories/index.html',html:''},{relativePath:'manuals/contribute/index.html',html:'<meta name="robots" content="noindex, nofollow">'}];
  const files=[filename,...pages.map(p=>p.relativePath)].map(f=>path.join(root,f));
  return {root,pages,files,async check(){const issues=[];await checkManualsPublicBuild({distRoot:root,distFiles:files,htmlEntries:pages,check:(ok,message)=>{if(!ok)issues.push(message);}});return issues;}};
}
test('正式空目录可构建，页面和索引版本一致',async t=>{const f=await fixture(t);assert.deepEqual(await f.check(),[]);});

test('PDF私密源文件、处理目录和序列化来源绑定不能进入正式产物',async t=>{
  const f=await fixture(t),file=path.join(f.root,'pdf-runtime/config.json');await fs.mkdir(path.dirname(file));await fs.writeFile(file,'{}');f.files.push(file);assert((await f.check()).some(s=>s.includes('PDF源文件')));
  f.files.pop();const script=path.join(f.root,'leak.json');await fs.writeFile(script,JSON.stringify({source_pdf_digest:'b'.repeat(64)}));f.files.push(script);assert((await f.check()).some(s=>s.includes('PDF公开页面')));
  await fs.writeFile(script,JSON.stringify({source:'source-'+('a'.repeat(64))+'.pdf'}));assert((await f.check()).some(s=>s.includes('PDF公开页面')));
  await fs.writeFile(script,JSON.stringify({value:'TG-'+('A'.repeat(24))}));assert((await f.check()).some(s=>s.includes('PDF公开页面')));
  await fs.writeFile(script,'{}');f.files.push(path.join(f.root,'separately-authorised.pdf'));assert.deepEqual(await f.check(),[]);
});

test('说明书草稿页面必须生成且禁止搜索引擎收录',async t=>{
  const f=await fixture(t),page=f.pages.find(p=>p.relativePath==='manuals/contribute/index.html');
  page.html='';assert((await f.check()).some(s=>s.includes('禁止搜索引擎收录')));
  page.html='<meta name="robots" content="noindex, nofollow"><img src="/api/account/manual-drafts/TG-0123456789ABCDEF01234567/images/private.jpg">';
  assert((await f.check()).some(s=>s.includes('不能预置私密草稿')));
  const missing=await fixture(t);missing.files.splice(missing.files.findIndex(file=>file.endsWith(path.join('contribute','index.html'))),1);
  assert((await missing.check()).some(s=>s.includes('专用投稿页面未生成')));
});
test('演示索引不能进入正式构建，即使文件版本摘要有效',async t=>{const f=await fixture(t,{schema_version:1,demo:true,brands:[],models:[],documents:[]});assert((await f.check()).some(s=>s.includes('演示')));});
test('演示图片和已编译脚本中的样例同样阻断正式构建',async t=>{
  const f=await fixture(t);f.files.push(path.join(f.root,'manuals-demo-pages/demo-manual-001/1.svg'));
  const script=path.join(f.root,'leak.js');await fs.writeFile(script,'const leaked="demo-manual-001"');f.files.push(script);
  const issues=await f.check();assert(issues.some(s=>s.includes('演示页面')));assert(issues.some(s=>s.includes('虚构样例')));
});
test('私密字段、坏索引以及不存在的导航都不能静默通过',async t=>{
  const f=await fixture(t,{schema_version:1,demo:false,brands:[],models:[],documents:[],reviewed_by:'PRIVATE-NOTE-ONLY'});
  f.pages[1].html='<a href="/manuals/manual-999999/">无效入口</a>';
  const issues=await f.check();assert(issues.some(s=>s.includes('私密字段')));assert(issues.some(s=>s.includes('入口不存在')));
});

test('说明书维护页面、私密保存目录不能混入公开产物',async t=>{
  const f=await fixture(t);f.files.push(path.join(f.root,'admin/manuals.html'),path.join(f.root,'local-admin/manuals/state.json'));
  await fs.mkdir(path.join(f.root,'local-admin/manuals'),{recursive:true});await fs.writeFile(path.join(f.root,'local-admin/manuals/state.json'),'{}');
  assert((await f.check()).some(s=>s.includes('私密维护文件')));
  f.files.push(path.join(f.root,'manuals/state.json'));await fs.mkdir(path.join(f.root,'manuals'),{recursive:true});await fs.writeFile(path.join(f.root,'manuals/state.json'),'{}');
  assert((await f.check()).some(s=>s.includes('非公开页面文件')));
});

test('品牌和品类详情必须与已审核索引相符，漏页或多出空详情均阻断',async t=>{
  const index={schema_version:1,demo:false,brands:[{brand_key:'brand-test',name:'合成品牌',aliases:[]}],models:[{model_key:'model-test',brand_key:'brand-test',model_text:'TEST-1',model_aliases:[],product_name:'测试物件',category_key:'tools',product_era_display:''}],documents:[{manual_key:'manual-test',model_keys:['model-test'],document_kind:'user-guide',languages:['zh-CN'],region_display:'地区未注明',edition_display:'版本未注明',edition_date:'',completeness:'unverified',missing_note:'',title:'合成说明书',summary:'',keywords:[],available:true,has_reader:false,has_official:true}]};
  const f=await fixture(t,index);
  const add=file=>{f.files.push(path.join(f.root,file));f.pages.push({relativePath:file,html:''});};
  add('manuals/manual-test/index.html');
  assert((await f.check()).filter(s=>s.includes('缺少浏览页')).length===2);
  add('manuals/brands/brand-test/index.html');add('manuals/categories/tools/index.html');
  assert.deepEqual(await f.check(),[]);
  add('manuals/brands/brand-ghost/index.html');assert((await f.check()).some(s=>s.includes('没有对应已审核资料')));
});
