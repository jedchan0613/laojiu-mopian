// 仅在构建端使用：浏览器不得导入本模块或完整字典。
import english from './ui.en.json';
import {fixedTemplates} from '../../../shared/fixed-text.mjs';
import {clientMessageGroups,clientApiMessageKeys} from '../../../shared/client-message-groups.mjs';
import {interfaceText,clientMessageKeys} from './interface-text';
import type {ClientMessagePack} from './client';
import {canonicalPath,type Locale} from './routing';

export type ClientMessageGroup = keyof typeof clientMessageGroups | 'full';
// 只转换已经逐项检查过的页面。账户、投稿及以后新增的页面继续使用完整包。
export function getClientMessageGroups(pathname:string):readonly ClientMessageGroup[] {
 const path=canonicalPath(pathname);
 if(path==='/')return ['home'];
 if(/^\/archive\/?$/.test(path))return ['archive'];
 if(/^\/archive\/[^/]+\/?$/.test(path))return ['detail'];
 return ['full'];
}

const cache=new Map<string,ClientMessagePack>();
export function getClientMessages(locale:Locale,groups:readonly ClientMessageGroup[]=['full']):ClientMessagePack {
 const selected=[...new Set<ClientMessageGroup>(['common',...groups])].sort();
 const full=selected.includes('full');
 const cacheKey=locale+':'+(full?'full':selected.join(','));
 const previous=cache.get(cacheKey); if(previous)return previous;
 const messages:Record<string,string>={},templates:Array<[string,string]>=[];
 if(locale!=='zh-CN'){
  const keys=new Set<string>(full?[...clientMessageKeys,...Object.keys(english)]:selected.flatMap(group=>clientMessageGroups[group as keyof typeof clientMessageGroups]));
  for(const key of clientApiMessageKeys)keys.add(key);
  // 接口也可能返回英语固定错误；只收录这些已知固定文案的同语言别名。
  if(locale!=='en')for(const key of [...keys])keys.add(interfaceText(key,'en'));
  for(const key of keys){const value=interfaceText(key,locale);if(value!==key)messages[key]=value;}
  if(locale!=='en')for(const [pattern,key] of fixedTemplates){
   const sentinel='123456789',source=key.replace('{0}',sentinel),value=interfaceText(source,locale);
   if(value!==source)templates.push([pattern.source,value.replace(sentinel,'{0}')]);
  }
  if(locale==='th')templates.push(['^View Laojiu Mopian on (.+)$','ดู Laojiu Mopian บน {0}']);
 }
 const pack={locale,messages,templates};cache.set(cacheKey,pack);return pack;
}
