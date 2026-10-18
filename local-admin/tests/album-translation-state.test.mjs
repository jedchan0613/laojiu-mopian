import test from 'node:test';import assert from 'node:assert/strict';
import {albumTranslationAvailable} from '../../site/src/data/album-translation-state.mjs';
test('相册语言链接与正文提示共用审核状态，总册或任一分件失效都不标为已译完',()=>{
 for(const locale of ['en','th','ja','ko','zh-Hant']){
  assert(albumTranslationAvailable(locale,{memberStates:['published','published']}));
  for(const state of ['draft','missing','partial','stale'])assert.equal(albumTranslationAvailable(locale,{memberStates:['published',state]}),false);
 }
 assert(albumTranslationAvailable('zh-CN',{memberStates:['source']}));
 assert.equal(albumTranslationAvailable('en',{memberStates:[]}),false);
});
test('主题选览既有英泰编辑审核门禁保留，不因分件全过而自动清除',()=>{
 for(const locale of ['en','th'])assert.equal(albumTranslationAvailable(locale,{curated:true,memberStates:['published']}),false);
 for(const locale of ['ja','ko','zh-Hant'])assert(albumTranslationAvailable(locale,{curated:true,memberStates:['published']}));
});
