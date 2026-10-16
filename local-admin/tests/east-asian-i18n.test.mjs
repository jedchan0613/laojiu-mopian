import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {localeDefinitions,translationLocales,normalizeLocale} from '../../shared/locale-config.mjs';
import {fixedText} from '../../shared/fixed-text.mjs';
import {createTranslationStore} from '../translations.mjs';
import {localizeAccountPayload} from '../account-i18n.mjs';
import {createMailer} from '../mail.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..'),require=createRequire(path.join(root,'site/package.json'));
async function load(file){const build=await require('esbuild').build({absWorkingDir:root,entryPoints:[file],bundle:true,write:false,platform:'node',format:'cjs',logLevel:'silent'});const module={exports:{}};new Function('require','module','exports',build.outputFiles[0].text)(require,module,module.exports);return module.exports;}
const item=()=>({core:{item_id:'LJM-20990101-PHO-001',object_type:'PHO',title:'家庭合影',date_display:'约1980年代',record_status:'ACT',privacy_level:'G',use_status:'U3',publication_file_path:['/archive/LJM-20990101-PHO-001/front.jpg']},metadata:{schema:'photo',dimensions:{}},public_view:{description:'地点待核',transcription:'亲爱的家人：\n原件文字不改写',tags:['家庭'],image_descriptions:['正面']}});
test('六语言在当前页面往返，保留筛选和锚点，并保持接口、媒体和公历日期',async()=>{
 const {getLocale,localizePath,dateLocale}=await load('site/src/i18n/ui.ts');
 const suffix='/archive/LJM-20990101-PHO-001/?view=albums&q=%E4%B8%AD#images';
 for(const from of localeDefinitions)for(const to of localeDefinitions){const start=(from.prefix?'/'+from.prefix:'')+suffix,expected=(to.prefix?'/'+to.prefix:'')+suffix;assert.equal(getLocale(start),from.locale);assert.equal(localizePath(start,to.locale),expected);}
 for(const {locale}of localeDefinitions){for(const url of ['/api/account/me','/archive/LJM-20990101-PHO-001/front.jpg','/social/code.png','https://example.invalid/a','//example.invalid/a'])assert.equal(localizePath(url,locale),url);assert.match(new Intl.DateTimeFormat(dateLocale(locale),{year:'numeric',timeZone:'UTC'}).format(new Date('1993-01-01T00:00:00Z')),/1993/);}
 assert.equal(normalizeLocale('zh-Hant-TW'),'zh-Hant');assert.equal(normalizeLocale('unknown'),'zh-CN');
});
test('三种新语言覆盖既有界面词表，模板参数保持完整，访客输入不自动转写',async()=>{
 const en=JSON.parse(await fs.readFile(path.join(root,'site/src/i18n/ui.en.json'),'utf8'));
 for(const locale of ['ja','ko','zh-Hant']){const messages=JSON.parse(await fs.readFile(path.join(root,'shared/messages.'+locale+'.json'),'utf8'));for(const [original,key]of Object.entries(en)){assert.ok(Object.hasOwn(messages,key),locale+' '+key);const slots=s=>[...s.matchAll(/\{\w+\}/g)].map(m=>m[0]).sort();assert.deepEqual(slots(messages[key]),slots(locale==='zh-Hant'?original:key),key);}
  assert.notEqual(fixedText('Choose language',locale),'Choose language');assert.notEqual(fixedText('Wait 23 seconds before requesting another code.',locale),'Wait 23 seconds before requesting another code.');assert.match(fixedText('Wait 23 seconds before requesting another code.',locale),/23/);
  const result=localizeAccountPayload({error:'请输入正确的邮箱地址。',status_label:'待审核',title:'我的原始投稿题名',message:'人工回复保留原文'},locale,400);assert.notEqual(result.error,'请输入正确的邮箱地址。');assert.notEqual(result.status_label,'待审核');assert.equal(result.title,'我的原始投稿题名');assert.equal(result.message,'人工回复保留原文');}
 assert.equal(fixedText('not a fixed message','zh-Hant','用户写的开发日记'),'用户写的开发日记');
});
test('五种译文独立维护、草稿不覆盖公开版本，来源变化与隐私门禁逐语言生效',async t=>{
 const dir=await fs.mkdtemp(path.join(os.tmpdir(),'ljm-six-languages-'));t.after(()=>fs.rm(dir,{recursive:true,force:true}));const record=item(),before=JSON.stringify(record),stores={},snapshots={};
 for(const locale of translationLocales){const store=createTranslationStore({root:path.join(dir,locale),locale});stores[locale]=store;let d=await store.detail(record);d=await store.saveDraft(record,{revision:d.revision,source_hash:d.source_hash,status:'review',fields:{'core.title':locale+' family','core.date_display':'1980s','public_view.description':'Place unconfirmed','public_view.tags':['Family']},image_descriptions:{[record.core.publication_file_path[0]]:'Front'},transcription_kind:'none'});await store.publish(record,{revision:d.revision,confirmed:true},'Synthetic reviewer');snapshots[locale]=await store.readRaw(record.core.item_id);}
 const ja=stores.ja,d=await ja.detail(record);await ja.saveDraft(record,{revision:d.revision,source_hash:d.source_hash,status:'draft',fields:{'core.title':'未公開下書き'}});assert.equal((await ja.publicLayer([record])).records[record.core.item_id].fields['core.title'],'ja family');for(const locale of translationLocales.filter(x=>x!=='ja'))assert.equal(await stores[locale].readRaw(record.core.item_id),snapshots[locale]);assert.equal(JSON.stringify(record),before);
 record.core.title='原题名已变化';for(const store of Object.values(stores)){const publicRecord=(await store.publicLayer([record])).records[record.core.item_id];assert.equal(publicRecord.fields['core.title'],undefined);assert.equal(publicRecord.fields['public_view.description'],'Place unconfirmed');}
 record.core.privacy_level='Y';for(const store of Object.values(stores))assert.deepEqual((await store.publicLayer([record])).records,{});
 const wrong=createTranslationStore({root:path.join(dir,'ko'),locale:'ja'});await assert.rejects(wrong.detail(record),/隐私|公开/);record.core.privacy_level='G';await assert.rejects(wrong.detail(record),/语言/);
});
test('新语言共用相同检索内容、永久编号和图片，原文转录不被译文替换',async()=>{
 const {createArchiveRecordView}=await load('site/src/data/archive-view.ts');const record=item(),views=localeDefinitions.map(({locale})=>createArchiveRecordView(record,locale));for(const view of views){assert.equal(view.id,record.core.item_id);assert.deepEqual(view.images,record.core.publication_file_path);assert.deepEqual(view.searchFields,views[0].searchFields);assert.equal(view.originalTranscription,record.public_view.transcription);assert.equal(view.decade,'1980');}
});
test('新增语言的三类邮件仅以文件模拟发送，动态值保持原文',async t=>{
 const dir=await fs.mkdtemp(path.join(os.tmpdir(),'ljm-six-mail-'));t.after(()=>fs.rm(dir,{recursive:true,force:true}));const mailer=createMailer({transport:'file',environment:'development',directory:dir});for(const language of ['ja','ko','zh-Hant'])for(const [template,variables]of [['login-code',{code:'987654',minutes:10,purpose:'login'}],['email-changed-notice',{newEmail:'new@example.invalid'}],['submission-progress',{event:'published',title:'原始投稿题名'}]])await mailer.send({to:'synthetic@example.invalid',template,variables:{...variables,language}});const messages=await Promise.all((await fs.readdir(dir)).map(async f=>JSON.parse(await fs.readFile(path.join(dir,f),'utf8'))));assert.equal(messages.length,9);assert.equal(messages.filter(m=>m.text.includes('987654')).length,3);assert.equal(messages.filter(m=>m.text.includes('原始投稿题名')).length,3);assert.ok(messages.some(m=>m.subject.includes('投稿の進捗')));assert.ok(messages.some(m=>m.subject.includes('투고 진행')));assert.ok(messages.some(m=>m.subject.includes('投稿進度')));
});
