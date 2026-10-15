import english from './ui.en.json';
import { thaiText } from '../../../shared/thai-text.mjs';

export type Locale = 'zh-CN' | 'en' | 'th';
export const locales: Locale[] = ['zh-CN','en','th'];
export const languageNames = {'zh-CN':'简体中文',en:'English',th:'ไทย'};
export const dateLocale = (locale: Locale) => locale === 'th' ? 'th-TH-u-ca-gregory' : locale === 'en' ? 'en-GB' : 'zh-CN';
export function getLocale(pathname?: string): Locale {
 const path = pathname ?? (typeof document !== 'undefined' ? document.documentElement.lang : 'zh-CN');
 if (/^(?:\/)?th(?:\/|$|-)/.test(path)) return 'th';
 return /^(?:\/)?en(?:\/|$|-)/.test(path) ? 'en' : 'zh-CN';
}
export function t(text: string, locale: Locale = getLocale(), params: Record<string, unknown> = {}): string {
 const key = text.trim().replace(/\s+/g, ' ');
 const translated = (english as Record<string,string>)[text] ?? (english as Record<string,string>)[key] ?? text;
 const value = locale === 'th' ? thaiText(translated) : locale === 'en' ? translated : text;
 return value.replace(/\{([a-zA-Z0-9_]+)\}/g, (match, name) => Object.hasOwn(params,name) ? String(params[name] ?? '') : match);
}
export function localizePath(href: string, locale?: Locale): string;
export function localizePath(href: string | undefined, locale?: Locale): string | undefined;
export function localizePath(href: string | undefined, locale: Locale = getLocale()): string | undefined {
 if (typeof href !== 'string' || !href.startsWith('/') || href.startsWith('//')) return href;
 const [path] = href.split(/[?#]/);
 const canonical = path.replace(/^\/(?:en|th)(?=\/|$)/,'') || '/';
 if (/\.(?:jpe?g|png|webp|svg|gif|avif|mp3|mp4|woff2?|css|js|pdf|zip)$/i.test(canonical)) return href;
 if (!/^\/(?:$|archive(?:\/|$)|albums(?:\/|$)|about(?:\/|$)|contribute(?:\/|$)|corrections(?:\/|$)|login(?:\/|$)|me(?:\/|$)|404(?:\/|$)|records\.json$)/.test(canonical)) return href;
 const suffix=href.slice(path.length);
 return (locale!=='zh-CN' ? '/'+locale+(canonical==='/'?'/':canonical) : canonical)+suffix;
}
export const canonicalPath = (path: string) => path.replace(/^\/(?:en|th)(?=\/|$)/,'') || '/';
