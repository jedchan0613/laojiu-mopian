// 网站、账户和译文维护共用的语言清单；中文原档案不经过此处改写。
export const localeDefinitions=[
 {locale:'zh-CN',prefix:'',name:'简体中文',date:'zh-CN',og:'zh_CN'},
 {locale:'en',prefix:'en',name:'English',date:'en-GB',og:'en_US'},
 {locale:'th',prefix:'th',name:'ไทย',date:'th-TH-u-ca-gregory',og:'th_TH'},
 {locale:'ja',prefix:'ja',name:'日本語',date:'ja-JP-u-ca-gregory',og:'ja_JP'},
 {locale:'ko',prefix:'ko',name:'한국어',date:'ko-KR-u-ca-gregory',og:'ko_KR'},
 {locale:'zh-Hant',prefix:'zh-hant',name:'繁體中文',date:'zh-Hant-u-ca-gregory',og:'zh_TW'},
];
export const supportedLocales=localeDefinitions.map(entry=>entry.locale);
export const translationLocales=supportedLocales.filter(locale=>locale!=='zh-CN');
export const normalizeLocale=value=>{
 const text=typeof value==='string'?value.toLowerCase():'';
 return localeDefinitions.find(entry=>text===entry.locale.toLowerCase()||text===entry.prefix||text.startsWith(entry.locale.toLowerCase()+'-'))?.locale??'zh-CN';
};
export const localeDefinition=value=>localeDefinitions.find(entry=>entry.locale===normalizeLocale(value));
export const stripLocalePath=pathname=>pathname.replace(/^\/(?:en|th|ja|ko|zh-hant)(?=\/|$)/i,'')||'/';
export const prefixForLocale=locale=>localeDefinition(locale).prefix;
export const pathForLocale=(pathname,locale)=>{
 const canonical=stripLocalePath(pathname),prefix=prefixForLocale(locale);
 return prefix?'/'+prefix+(canonical==='/'?'/':canonical):canonical;
};
