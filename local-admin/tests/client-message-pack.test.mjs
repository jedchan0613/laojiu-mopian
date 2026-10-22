import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {fixedTemplates} from '../../shared/fixed-text.mjs';
import {clientMessageGroups,clientApiMessageKeys} from '../../shared/client-message-groups.mjs';
import {pathForLocale} from '../../shared/locale-config.mjs';
import english from '../../site/src/i18n/ui.en.json' with {type:'json'};
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const require=createRequire(path.join(root,'site/package.json')),esbuild=require('esbuild'),parser=require('@babel/parser');
async function compile(file,document){const built=await esbuild.build({absWorkingDir:root,entryPoints:[file],bundle:true,write:false,platform:'browser',format:'cjs',metafile:true,logLevel:'silent'});const module={exports:{}};new Function('module','exports','document',built.outputFiles[0].text)(module,module.exports,document);return {...module.exports,inputs:Object.keys(built.metafile.inputs)};}
test('浏览器消息包与构建端六语言固定文案一致，参数和动态错误不再翻译',async()=>{
 const server=await compile('site/src/i18n/interface-text.ts'),builder=await compile('site/src/i18n/client-messages.ts'),client=await compile('site/src/i18n/client.ts');
 const keys=[...server.clientMessageKeys,...server.clientMessageKeys.map(key=>server.interfaceText(key,'en')),'申请模板已复制。','浏览器未允许自动复制，请手工选择模板文字。','View Laojiu Mopian on Facebook, opens in a new window',...fixedTemplates.map(([,key])=>key.replace('{0}','37'))];
 for(const locale of ['zh-CN','en','th','ja','ko','zh-Hant']){
  const pack=builder.getClientMessages(locale);client.installClientMessages(pack);
  for(const key of keys)assert.equal(client.interfaceText(key,locale,{0:'原文 <img> {1}',1:2,2:'尾部'}),server.interfaceText(key,locale,{0:'原文 <img> {1}',1:2,2:'尾部'}),`${locale}: ${key}`);
  assert.equal(pack.locale,locale);
 }
 assert.equal(client.interfaceText('{0} {1} 件档案{2}','en',{0:'Total',1:1,2:''}),'Total 1 record');
 assert(!client.inputs.some(file=>/messages\.|thai-text|ui\.en|fixed-text|interface-text|client-messages/.test(file)),client.inputs.join('\n'));
});
test('消息缺失先停止绑定并显示可读错误，表单不假装可以操作',async()=>{
 const notice={hidden:true},control={disabled:false},document={documentElement:{lang:'en'},getElementById:id=>id==='client-message-error'?notice:null,querySelectorAll:()=>[control]};
 await assert.rejects(compile('site/src/i18n/client.ts',document),/Interface messages unavailable/);
 assert.equal(notice.hidden,false);assert.equal(control.disabled,true);
});
test('当前语言消息准备后模块才继续，不接受别的语言消息包',async()=>{
 const builder=await compile('site/src/i18n/client-messages.ts'),pack=builder.getClientMessages('ja');
 const document={documentElement:{lang:'ja'},getElementById:()=>({textContent:JSON.stringify(pack)}),querySelectorAll:()=>[]};
 const client=await compile('site/src/i18n/client.ts',document);assert.equal(client.clientText('类型'),pack.messages['类型']);
 document.documentElement.lang='ko';await assert.rejects(compile('site/src/i18n/client.ts',document),/Interface messages unavailable/);
});

const locales=['zh-CN','en','th','ja','ko','zh-Hant'];
const sourceText=file=>fs.readFileSync(path.join(root,file),'utf8');
function visit(node,callback){
 if(!node||typeof node!=='object')return;
 callback(node);
 for(const value of Object.values(node))if(Array.isArray(value))value.forEach(entry=>visit(entry,callback));else if(value&&typeof value==='object')visit(value,callback);
}
function scriptKeys(file){
 const raw=sourceText(file),sources=file.endsWith('.astro')?[...raw.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(match=>match[1]):[raw],keys=new Set();
 for(const source of sources)visit(parser.parse(source,{sourceType:'module',plugins:['typescript']}),node=>{
  if(node.type!=='CallExpression'||!['ct','clientText','clientError'].includes(node.callee?.name))return;
  for(const argument of node.arguments.slice(0,node.callee.name==='clientError'?2:1))if(argument.type==='StringLiteral')keys.add(argument.value);
 });
 return [...keys];
}
function objectValues(file,name){
 const values=[];
 visit(parser.parse(sourceText(file),{sourceType:'module'}),node=>{
  if(node.type==='VariableDeclarator'&&node.id?.name===name){
   const object=node.init?.type==='ObjectExpression'?node.init:node.init?.arguments?.[0];
   for(const property of object?.properties??[])if(property.value?.type==='StringLiteral')values.push(property.value.value);
  }
 });
 return values;
}

test('已转换页面按当前路径选组，账号投稿及未转换页面保留完整包',async()=>{
 const builder=await compile('site/src/i18n/client-messages.ts');
 for(const prefix of ['','/en','/th','/ja','/ko','/zh-Hant']){
  assert.deepEqual(builder.getClientMessageGroups(prefix+'/'),['home']);
  assert.deepEqual(builder.getClientMessageGroups(prefix+'/archive/'),['archive']);
  assert.deepEqual(builder.getClientMessageGroups(prefix+'/archive/LJM-20261018-PHO-007/'),['detail']);
  for(const page of ['/login/','/me/','/me/contributions/','/contribute/','/about/','/corrections/','/albums/example/','/404/','/future-page/'])assert.deepEqual(builder.getClientMessageGroups(prefix+page),['full'],prefix+page);
 }
 const layout=sourceText('site/src/layouts/BaseLayout.astro');
 assert.match(layout,/getClientMessages\(locale,\s*getClientMessageGroups\(pathWithoutLocale\)\)/);
 assert.match(layout,/type="application\/json" id="client-interface-messages" set:html=\{serializeHtmlJson/);
});

test('消息缓存同时按语言和分组隔离，组顺序或重复不产生不同包',async()=>{
 const {getClientMessages}=await compile('site/src/i18n/client-messages.ts');
 for(const locale of locales){
  const home=getClientMessages(locale,['home']);
  assert.equal(home,getClientMessages(locale,['common','home','home']));
  assert.equal(getClientMessages(locale,['archive','home']),getClientMessages(locale,['home','archive']));
  assert.equal(getClientMessages(locale),getClientMessages(locale,['home','full']));
  assert.notEqual(home,getClientMessages(locale,['archive']));
  assert.notEqual(home,getClientMessages(locale,['detail']));
  assert.notEqual(home,getClientMessages(locale));
 }
 assert.notEqual(getClientMessages('en',['home']),getClientMessages('ja',['home']));
});

test('完整包回退保留旧选取逻辑的每一个键、英语别名与模板',async()=>{
 const server=await compile('site/src/i18n/interface-text.ts'),builder=await compile('site/src/i18n/client-messages.ts');
 for(const locale of locales){
  const legacyMessages={},legacyTemplates=[],keys=new Set([...server.clientMessageKeys,...Object.keys(english)]);
  if(locale!=='zh-CN'){
   if(locale!=='en')for(const key of [...keys])keys.add(server.interfaceText(key,'en'));
   for(const key of keys){const value=server.interfaceText(key,locale);if(value!==key)legacyMessages[key]=value;}
   if(locale!=='en')for(const [pattern,key]of fixedTemplates){
    const sentinel='123456789',source=key.replace('{0}',sentinel),value=server.interfaceText(source,locale);
    if(value!==source)legacyTemplates.push([pattern.source,value.replace(sentinel,'{0}')]);
   }
   if(locale==='th')legacyTemplates.push(['^View Laojiu Mopian on (.+)$','ดู Laojiu Mopian บน {0}']);
  }
  const pack=builder.getClientMessages(locale);
  for(const [key,value]of Object.entries(legacyMessages))assert.equal(pack.messages[key],value,`${locale} 完整包旧文案: ${key}`);
  assert.deepEqual(pack.templates,legacyTemplates,`${locale} 完整包旧模板`);
 }
});

test('精简包覆盖页面及公共脚本所有固定文案、联系动态状态，参数原文不变',async()=>{
 const server=await compile('site/src/i18n/interface-text.ts'),builder=await compile('site/src/i18n/client-messages.ts'),client=await compile('site/src/i18n/client.ts');
 const commonFiles=['site/src/scripts/account-nav.ts','site/src/scripts/contact-widget.ts','site/src/scripts/archive-likes.ts','site/src/components/ContactWidget.astro','site/src/components/BackgroundMusic.astro'];
 const files={
  home:['site/src/pages/index.astro'],
  archive:['site/src/pages/archive/index.astro','site/src/scripts/archive-card.ts','site/src/scripts/archive-search.ts'],
  detail:['site/src/pages/archive/[id].astro','site/src/scripts/archive-favorite.ts','site/src/scripts/account-client.ts'],
 };
 const statuses=objectValues('local-admin/contacts.mjs','contactStates');
 assert.equal(statuses.length,5);
 const params={0:'用户原文 <img> {1}',1:2,2:'尾部',3:'2026-10-22'};
 for(const [group,groupFiles]of Object.entries(files)){
  const required=[...new Set([...commonFiles,...groupFiles].flatMap(scriptKeys).concat(statuses,clientMessageGroups[group],clientMessageGroups.common))];
  const declared=new Set([...clientMessageGroups.common,...clientMessageGroups[group]]);
  assert.deepEqual(required.filter(key=>!declared.has(key)),[],`${group}: 未加入分组的脚本文案`);
  for(const locale of locales){
   const pack=builder.getClientMessages(locale,[group]);client.installClientMessages(pack);
   for(const key of required){
    assert.equal(client.interfaceText(key,locale,params),server.interfaceText(key,locale,params),`${group}/${locale}: ${key}`);
    const alias=server.interfaceText(key,'en');
    assert.equal(client.interfaceText(alias,locale,params),server.interfaceText(alias,locale,params),`${group}/${locale} 英语别名: ${alias}`);
   }
   if(locale!=='zh-CN'){
    assert(!Object.hasOwn(pack.messages,'正在开通账号…'),`${group}/${locale}: 不应内嵌账号开通文案`);
    assert(!Object.hasOwn(pack.messages,'今日还可提交 {0} 件 · 草稿还能保存 {1} 件 · 私密空间剩余约 {2} MB'),`${group}/${locale}: 不应内嵌投稿额度文案`);
    assert(Buffer.byteLength(JSON.stringify(pack))<Buffer.byteLength(JSON.stringify(builder.getClientMessages(locale)))/2,`${group}/${locale}: 精简包应小于完整包的一半`);
   }
  }
 }
});

test('精简包保留API英语固定错误、通用失败提示及全部动态模板',async()=>{
 const server=await compile('site/src/i18n/interface-text.ts'),builder=await compile('site/src/i18n/client-messages.ts');
 const errors=objectValues('local-admin/account-i18n.mjs','errors');
 assert(errors.length>40);
 assert.deepEqual(errors.filter(key=>!clientApiMessageKeys.includes(key)),[],'服务端新增固定错误时必须同步保留客户端别名');
 const document={documentElement:{lang:'zh-CN'},getElementById:()=>({textContent:JSON.stringify(builder.getClientMessages('zh-CN',['home']))}),querySelectorAll:()=>[]};
 const client=await compile('site/src/i18n/client.ts',document);
 const templates=[...fixedTemplates.map(([,key])=>key.replace('{0}','37')),'View Laojiu Mopian on Facebook, opens in a new window'];
 const fallback='暂时无法完成操作，请稍后再试。';
 for(const group of ['home','archive','detail'])for(const locale of locales){
  document.documentElement.lang=locale;client.installClientMessages(builder.getClientMessages(locale,[group]));
  for(const key of [...clientApiMessageKeys,...templates])assert.equal(client.interfaceText(key,locale),server.interfaceText(key,locale),`${group}/${locale}: ${key}`);
  assert.equal(client.clientError(undefined),server.interfaceText(fallback,locale),`${group}/${locale}: 通用错误兜底`);
  if(['en','th','ko'].includes(locale))assert.equal(client.clientError('未登记的中文接口错误'),server.interfaceText(fallback,locale),`${group}/${locale}: 未知错误兜底`);
 }
});

test('五种服务端英语兜底保持具体原因并具备六语固定译文',async()=>{
 const builder=await compile('site/src/i18n/client-messages.ts'),server=await compile('site/src/i18n/interface-text.ts'),client=await compile('site/src/i18n/client.ts');
 const sources={
  '请重新登录。':'Please sign in again.',
  '不允许此操作，请检查账号后重试。':'This action is not permitted. Check your account and try again.',
  '请求过于频繁，请稍后再试。':'Too many requests. Please try again later.',
  '服务暂时不可用，请稍后再试。':'The service is temporarily unavailable. Please try again later.',
  '请求未能完成，请检查表单后重试。':'The request could not be completed. Check the form and try again.',
 };
 for(const group of ['home','archive','detail','full'])for(const locale of locales){
  const pack=builder.getClientMessages(locale,[group]);client.installClientMessages(pack);
  for(const [source,english]of Object.entries(sources)){
   const expected=server.interfaceText(source,locale);
   assert.equal(client.interfaceText(source,locale),expected,`${group}/${locale}: ${source}`);
   assert.notEqual(expected,server.interfaceText('暂时无法完成操作，请稍后再试。',locale),'不能用通用失败覆盖具体原因');
   if(locale==='zh-CN')assert.equal(expected,source);
   else if(locale==='en')assert.equal(expected,english);
   else{
    assert.notEqual(expected,source);assert.notEqual(expected,english);
    assert.equal(client.interfaceText(english,locale),expected,`${group}/${locale}: API英语兜底`);
   }
  }
 }
});

test('精简包实际驱动六语导航登录状态，合成离线请求保留登录入口',async()=>{
 const builder=await compile('site/src/i18n/client-messages.ts'),server=await compile('site/src/i18n/interface-text.ts');
 const built=await esbuild.build({absWorkingDir:root,entryPoints:['site/src/scripts/account-nav.ts'],bundle:true,write:false,platform:'browser',format:'cjs',logLevel:'silent'});
 for(const locale of locales)for(const signedIn of [true,false]){
  const attributes={},link={textContent:server.interfaceText('登录',locale),setAttribute:(name,value)=>{attributes[name]=value;}},pack=builder.getClientMessages(locale,['home']);
  const document={documentElement:{lang:locale},readyState:'complete',querySelector:()=>link,getElementById:()=>({textContent:JSON.stringify(pack)})};
  let requested='';
  const fetch=async url=>{requested=url;return {ok:signedIn,json:async()=>({user:{nickname:'合成账号'}})};};
  const module={exports:{}};
  new Function('module','exports','document','fetch','window',built.outputFiles[0].text)(module,module.exports,document,fetch,{});
  await new Promise(setImmediate);
  assert.equal(requested,'/api/account/me');
  assert.equal(link.textContent,server.interfaceText(signedIn?'我的':'登录',locale),`${locale}: ${signedIn}`);
  if(signedIn)assert.equal(attributes.href,pathForLocale('/me/contributions/',locale));
  else assert.equal(attributes.href,undefined);
 }
});
