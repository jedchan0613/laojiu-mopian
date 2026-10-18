import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {fixedTemplates} from '../../shared/fixed-text.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const require=createRequire(path.join(root,'site/package.json')),esbuild=require('esbuild');
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
