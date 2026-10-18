import { getLocale, localizePath, type Locale } from './routing';
export type ClientMessagePack = { locale: Locale; messages: Record<string,string>; templates: Array<[string,string]> };
const packs = new Map<Locale,ClientMessagePack>();
export const installClientMessages = (pack: ClientMessagePack) => {
 if (!pack || !pack.locale || !pack.messages || !Array.isArray(pack.templates)) throw new Error('Invalid interface messages');
 packs.set(pack.locale,pack);
};
export const clientLocale = () => getLocale();
export const clientPath = (href: string) => localizePath(href, clientLocale());
const requireMessages = (locale: Locale) => {
 if (!packs.has(locale) && typeof document !== 'undefined') {
  try {
   const element = document.getElementById?.('client-interface-messages');
   const pack = JSON.parse(element?.textContent ?? 'null');
   if (pack?.locale === locale) installClientMessages(pack);
  } catch { /* 统一进入可读失败提示，不以错误语言初始化交互。 */ }
 }
 const pack = packs.get(locale);
 if (!pack) {
  if (typeof document !== 'undefined') {
   const notice = document.getElementById?.('client-message-error'); if (notice) notice.hidden = false;
   document.querySelectorAll?.('form input, form select, form textarea, form button').forEach(control => { (control as HTMLInputElement).disabled = true; });
  }
  throw new Error('Interface messages unavailable; reload this page.');
 }
 return pack;
};
export const interfaceText = (text: string, locale: Locale, params: Record<string,unknown> = {}) => {
 const pack = requireMessages(locale);
 const key = text.trim().replace(/\s+/g,' ');
 let template = locale === 'zh-CN' ? text : Object.hasOwn(pack.messages,text) ? pack.messages[text] : Object.hasOwn(pack.messages,key) ? pack.messages[key] : text;
 if (locale !== 'zh-CN' && template === text) for (const [pattern,value] of pack.templates) {
  const match = text.match(new RegExp(pattern)); if (match) { const captured=locale==='th'&&pattern==='^View Laojiu Mopian on (.+)$'?match[1].replace(', opens in a new window',' (เปิดหน้าต่างใหม่)'):match[1];template = value.replace('{0}',captured); break; }
 }
 if (locale === 'en' && text === '{0} {1} 件档案{2}' && Number(params['1']) === 1) template = '{0} {1} record{2}';
 return template.replace(/\{(\w+)\}/g,(match,key)=>Object.hasOwn(params,key)?String(params[key]??''):match);
};
export const clientText = (text: string,params:Record<string,unknown>={}) => interfaceText(text,clientLocale(),params);
export const clientError = (message: unknown,fallback='暂时无法完成操作，请稍后再试。') => {
 const value=typeof message==='string'&&message?message:fallback, translated=clientText(value);
 return ['en','th','ko'].includes(clientLocale())&&/[\u3400-\u9fff]/.test(translated)?clientText(fallback):translated;
};
// 模块脚本延后执行，此时头部的同语言JSON已存在；任何依赖本模块的表单先经过校验。
if (typeof document !== 'undefined' && typeof document.getElementById === 'function') requireMessages(clientLocale());
