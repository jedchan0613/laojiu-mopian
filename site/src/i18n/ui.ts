import english from './ui.en.json';

export type Locale = 'zh-CN' | 'en';
export function getLocale(pathname?: string): Locale {
 if (pathname !== undefined) return /^\/en(?:\/|$)/.test(pathname) || pathname === 'en' ? 'en' : 'zh-CN';
 return typeof document !== 'undefined' && document.documentElement.lang.startsWith('en') ? 'en' : 'zh-CN';
}
export function t(text: string, locale: Locale = getLocale(), params: Record<string, unknown> = {}): string {
 const key = text.trim().replace(/\s+/g, ' ');
 const value = locale === 'en' ? (english as Record<string,string>)[text] ?? (english as Record<string,string>)[key] ?? text : text;
 return value.replace(/\{([a-zA-Z0-9_]+)\}/g, (match, name) => Object.hasOwn(params,name) ? String(params[name] ?? '') : match);
}
export function localizePath(href: string, locale?: Locale): string;
export function localizePath(href: string | undefined, locale?: Locale): string | undefined;
export function localizePath(href: string | undefined, locale: Locale = getLocale()): string | undefined {
 if (typeof href !== 'string' || !href.startsWith('/') || href.startsWith('//')) return href;
 const [path] = href.split(/[?#]/);
 const canonical = path.replace(/^\/en(?=\/|$)/,'') || '/';
 if (/\.(?:jpe?g|png|webp|svg|gif|avif|mp3|mp4|woff2?|css|js|pdf|zip)$/i.test(canonical)) return href;
 if (!/^\/(?:$|archive(?:\/|$)|albums(?:\/|$)|about(?:\/|$)|contribute(?:\/|$)|corrections(?:\/|$)|login(?:\/|$)|me(?:\/|$)|404(?:\/|$)|records\.json$)/.test(canonical)) return href;
 const suffix=href.slice(path.length);
 return (locale==='en' ? '/en'+(canonical==='/'?'/':canonical) : canonical)+suffix;
}
export const canonicalPath = (path: string) => path.replace(/^\/en(?=\/|$)/,'') || '/';
