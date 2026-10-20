import english from './ui.en.json';
import {fixedText} from '../../../shared/fixed-text.mjs';
import { getLocale, type Locale } from './routing';
export * from './routing';
export function t(text:string,locale:Locale=getLocale(),params:Record<string,unknown>={}):string{
 const key=text.trim().replace(/\s+/g,' ');
 const translated=(english as Record<string,string>)[text]??(english as Record<string,string>)[key]??text;
 return fixedText(translated,locale,text).replace(/\{([a-zA-Z0-9_]+)\}/g,(match,name)=>Object.hasOwn(params,name)?String(params[name]??''):match);
}
