import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs/promises';import path from 'node:path';import os from 'node:os';import {createRequire} from 'node:module';import {fileURLToPath} from 'node:url';
import {createTranslationStore} from '../translations.mjs';import {createMailer} from '../mail.mjs';import {localizeAccountPayload,normalizeAccountLanguage} from '../account-i18n.mjs';
const project=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..'),require=createRequire(path.join(project,'site/package.json')),esbuild=require('esbuild');
async function load(file){const built=await esbuild.build({absWorkingDir:project,entryPoints:[file],bundle:true,write:false,platform:'node',format:'cjs',tsconfigRaw:{},logLevel:'silent'});const module={exports:{}};new Function('require','module','exports',built.outputFiles[0].text)(require,module,module.exports);return module.exports;}
test('泰语路径在三种语言间往返，保留查询与锚点，不改接口和媒体地址',async()=>{
 const {getLocale,localizePath,dateLocale}=await load('site/src/i18n/ui.ts');
 assert.equal(getLocale('/th/archive/'),'th');assert.equal(getLocale('/'),'zh-CN');
 const suffix='/archive/LJM-20260101-PHO-001/?q=%E4%B8%AD&sort=oldest#images';
 assert.equal(localizePath('/en'+suffix,'th'),'/th'+suffix);assert.equal(localizePath('/th'+suffix,'en'),'/en'+suffix);assert.equal(localizePath('/th'+suffix,'zh-CN'),suffix);
 for(const url of ['/api/account/favorites','/archive/LJM-20260101-PHO-001/front-public.jpg','/social/wechat.png'])assert.equal(localizePath(url,'th'),url);
 assert.equal(localizePath('/records.json','th'),'/th/records.json');
 const date=new Intl.DateTimeFormat(dateLocale('th'),{year:'numeric',timeZone:'UTC'}).format(new Date('1993-01-01T00:00:00Z'));assert(date.includes('1993'));assert(!date.includes('2536'));
});
test('三种语言共用同一检索字段、编号与图片，泰语不覆盖原文',async()=>{
 const {createArchiveRecordView}=await load('site/src/data/archive-view.ts');
 // 自动部署在接入服务器档案之前运行测试，不能依赖被排除的真实 archive.ts。
 const archiveItems=['PHO','ALB'].map(object_type=>({core:{item_id:`LJM-20990101-${object_type}-001`,object_type,title:'测试家庭影像',date_display:'约1980年代',record_status:'ACT',privacy_level:'G',use_status:'U3',country:'中国',city:'北京',publication_file_path:['/archive/synthetic/front.jpg','/archive/synthetic/detail-01.jpg']},metadata:{schema:object_type==='PHO'?'photo':'common',dimensions:{}},public_view:{description:'地点待核',transcription:'原件手写文字',tags:['家庭'],image_descriptions:['第一幅','第二幅']}}));
 for(const item of archiveItems){
  const views=['zh-CN','en','th'].map(language=>createArchiveRecordView(item,language));
  assert.equal(views[2].id,views[0].id);assert.deepEqual(views[2].images,views[0].images);assert.deepEqual(views[2].searchFields,views[0].searchFields);assert.deepEqual(views[1].searchFields,views[0].searchFields);
  assert.equal(views[2].originalTranscription,item.public_view.transcription?.trim()??'');assert.equal(views[2].decade,views[0].decade);
  assert.notEqual(views[2].translationState,'published');assert.equal(views[2].title,item.core.title);assert.equal(views[2].description,item.public_view.description);
 }
});

test('相册浏览的泰语控件与动态逐件计数完整，语言切换保留相册模式',async()=>{
 const {t,localizePath}=await load('site/src/i18n/ui.ts');
 const {interfaceText}=await load('site/src/i18n/client.ts');
 for(const key of ['按相册浏览','查看全部相册 →','相册与单件','仅看相册','逐件查看全部档案','进入相册 →','浏览方式','同册档案默认收拢，进入相册后逐件查看。数量始终按真实档案件数统计，含相册总档案。']){
  const value=t(key,'th');assert(/[\u0e00-\u0e7f]/.test(value),key);assert(!/[\u3400-\u9fff]/.test(value),key);
 }
 const text=interfaceText('{0} {1} 件档案 · {2} 本相册、{3} 件未归册档案{4}','th',{0:'共',1:56,2:1,3:0,4:''});
 assert(text.includes('56'));assert(/[\u0e00-\u0e7f]/.test(text));assert(!/[\u3400-\u9fff]/.test(text));
 assert.equal(localizePath('/en/archive/?view=albums&q=test#archive-list','th'),'/th/archive/?view=albums&q=test#archive-list');
});
test('英语和泰语的同编号草稿、审核、回退与来源变化彼此独立',async t=>{
 const directory=await fs.mkdtemp(path.join(os.tmpdir(),'ljm-thai-'));t.after(()=>fs.rm(directory,{recursive:true,force:true}));
 const en=createTranslationStore({root:directory}),th=createTranslationStore({root:path.join(directory,'th'),locale:'th'});
 const item={core:{item_id:'LJM-20261015-PHO-001',title:'家庭合影',record_status:'ACT',privacy_level:'G',use_status:'U3',publication_file_path:['/archive/LJM-20261015-PHO-001/front.jpg']},metadata:{schema:'photo',dimensions:{}},public_view:{description:'年代待考',image_descriptions:['正面']}};
 async function publish(store,title){const detail=await store.detail(item),draft=await store.saveDraft(item,{revision:detail.revision,source_hash:detail.source_hash,status:'review',fields:{'core.title':title,'public_view.description':'Date unconfirmed'},image_descriptions:{[item.core.publication_file_path[0]]:'Front'},transcription_kind:'none'});await store.publish(item,{revision:draft.revision,confirmed:true},'Synthetic reviewer');}
 await publish(en,'Family portrait');const enBefore=await en.readRaw(item.core.item_id);await publish(th,'ภาพครอบครัว');assert.equal(await en.readRaw(item.core.item_id),enBefore);
 const previous=await th.readRaw(item.core.item_id),detail=await th.detail(item);assert.equal(detail.locale,'th');
 const saved=await th.saveDraft(item,{revision:detail.revision,source_hash:detail.source_hash,status:'draft',fields:{'core.title':'ร่างที่ยังไม่เผยแพร่'}});assert.equal((await th.publicLayer([item])).records[item.core.item_id].fields['core.title'],'ภาพครอบครัว');
 await th.restoreRaw(item.core.item_id,previous);assert.equal(await en.readRaw(item.core.item_id),enBefore);
 item.core.title='修改后的题名';const layer=await th.publicLayer([item]);assert.equal(layer.records[item.core.item_id].fields['core.title'],undefined);assert.equal(layer.records[item.core.item_id].fields['public_view.description'],'Date unconfirmed');
 item.core.privacy_level='Y';assert.deepEqual((await th.publicLayer([item])).records,{});assert.deepEqual((await en.publicLayer([item])).records,{});assert(saved.has_draft);
});
test('泰语账号响应与邮件翻译固定内容，人工回复和用户题名保持原文',async t=>{
 assert.equal(normalizeAccountLanguage('th'),'th');assert.equal(normalizeAccountLanguage('invalid'),'zh-CN');
 const result=localizeAccountPayload({error:'请输入正确的邮箱地址。',status_label:'待审核',message:'人工回复不翻译',title:'原始投稿题名'},'th',400);assert(/[\u0e00-\u0e7f]/.test(result.error));assert(/[\u0e00-\u0e7f]/.test(result.status_label));assert.equal(result.message,'人工回复不翻译');assert.equal(result.title,'原始投稿题名');
 const directory=await fs.mkdtemp(path.join(os.tmpdir(),'ljm-thai-mail-'));t.after(()=>fs.rm(directory,{recursive:true,force:true}));const mailer=createMailer({transport:'file',environment:'development',directory});
 for(const [template,variables]of [['login-code',{code:'123456',minutes:10,purpose:'login'}],['email-changed-notice',{newEmail:'new@example.invalid'}],['submission-progress',{event:'published',title:'人工题名'}]])await mailer.send({to:'synthetic@example.invalid',template,variables:{...variables,language:'th'}});
 const messages=await Promise.all((await fs.readdir(directory)).map(async file=>JSON.parse(await fs.readFile(path.join(directory,file),'utf8'))));assert.equal(messages.length,3);assert(messages.every(message=>/[\u0e00-\u0e7f]/.test(message.subject)));assert(messages.some(message=>message.text.includes('123456')));assert(messages.some(message=>message.text.includes('人工题名')));
});
