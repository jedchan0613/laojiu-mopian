import {localeDefinitions,normalizeLocale,pathForLocale,stripLocalePath} from '../../../shared/locale-config.mjs';
export type Locale='zh-CN'|'en'|'th'|'ja'|'ko'|'zh-Hant';
export const locales=localeDefinitions.map(entry=>entry.locale) as Locale[];
export const languageNames=Object.fromEntries(localeDefinitions.map(entry=>[entry.locale,entry.name])) as Record<Locale,string>;
export const dateLocale=(locale:Locale)=>localeDefinitions.find(entry=>entry.locale===locale)?.date??'zh-CN';
export function getLocale(pathname?:string):Locale{
 const value=pathname??(typeof document!=='undefined'?document.documentElement.lang:'zh-CN');
 return normalizeLocale(value.startsWith('/')?value.split('/')[1]:value) as Locale;
}
export function localizePath(href:string,locale?:Locale):string;
export function localizePath(href:string|undefined,locale?:Locale):string|undefined;
export function localizePath(href:string|undefined,locale:Locale=getLocale()):string|undefined{
 if(typeof href!=='string'||!href.startsWith('/')||href.startsWith('//'))return href;
 const [path]=href.split(/[?#]/),canonical=stripLocalePath(path);
 if(/\.(?:jpe?g|png|webp|svg|gif|avif|mp3|mp4|woff2?|css|js|pdf|zip)$/i.test(canonical))return href;
 if(!/^\/(?:$|archive(?:\/|$)|albums(?:\/|$)|about(?:\/|$)|contribute(?:\/|$)|corrections(?:\/|$)|login(?:\/|$)|me(?:\/|$)|404(?:\/|$)|records\.json$)/.test(canonical))return href;
 return pathForLocale(path,locale)+href.slice(path.length);
}
export const canonicalPath=stripLocalePath;
