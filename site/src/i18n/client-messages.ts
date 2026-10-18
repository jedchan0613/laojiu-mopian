// 仅在构建端使用：浏览器不得导入本模块或完整字典。
import english from './ui.en.json';
import {fixedTemplates} from '../../../shared/fixed-text.mjs';
import {interfaceText,clientMessageKeys} from './interface-text';
import type {ClientMessagePack} from './client';
import type {Locale} from './routing';

const cache=new Map<Locale,ClientMessagePack>();
export function getClientMessages(locale:Locale):ClientMessagePack {
 const previous=cache.get(locale); if(previous)return previous;
 const messages:Record<string,string>={},templates:Array<[string,string]>=[];
 if(locale!=='zh-CN'){
  const keys=new Set([...clientMessageKeys,...Object.keys(english)]);
  // 接口也可能返回英语固定错误；只收录这些已知固定文案的同语言别名。
  if(locale!=='en')for(const key of [...keys])keys.add(interfaceText(key,'en'));
  for(const key of keys){const value=interfaceText(key,locale);if(value!==key)messages[key]=value;}
  if(locale!=='en')for(const [pattern,key] of fixedTemplates){
   const sentinel='123456789',source=key.replace('{0}',sentinel),value=interfaceText(source,locale);
   if(value!==source)templates.push([pattern.source,value.replace(sentinel,'{0}')]);
  }
  if(locale==='th')templates.push(['^View Laojiu Mopian on (.+)$','ดู Laojiu Mopian บน {0}']);
 }
 const pack={locale,messages,templates};cache.set(locale,pack);return pack;
}
