import type { ArchiveItem } from './archive-schema';
import source from './archive-translations.json';
import thaiSource from './archive-translations.th.json';
import { getEffectiveTranslation, getTranslationState } from '../../../shared/archive-translations.mjs';
import { isTranslatedArchiveLocale } from './code-dictionary';

export type ArchiveLocale = 'zh-CN' | 'en' | 'th' | string;
export type ArchiveTranslationValue = string | string[];
interface PublishedTranslation {
  schema_version: number; item_id: string; locale: string; status: string;
  source_hash: string; source_hashes?: Record<string, string>;
  fields: Record<string, ArchiveTranslationValue>;
  image_descriptions: Record<string, string>;
  transcription_kind?: 'none' | 'full' | 'summary';
  translation_state?: string;
}
const layers = {en: source.records as Record<string, PublishedTranslation>, th: thaiSource.records as Record<string, PublishedTranslation>};
const caches = {en: new WeakMap(), th: new WeakMap()};
export const getArchiveTranslation = (item: ArchiveItem, locale: ArchiveLocale = 'en') => {
 const selected = locale.startsWith('th') ? 'th' : 'en';
 const records = layers[selected], cache = caches[selected];
 let effective = cache.get(item);
 if (!effective) { effective = getEffectiveTranslation(item, records[item.core.item_id]); cache.set(item,effective); }
 return {...effective, state:getTranslationState(item,records[item.core.item_id]), transcriptionKind:records[item.core.item_id]?.transcription_kind ?? 'none'};
};
export const getOriginalArchiveValue = (item: ArchiveItem, path: string): unknown => path.split('.').reduce<unknown>((value, key) => value !== null && typeof value === 'object' ? (value as Record<string, unknown>)[key] : undefined, item);
export const getLocalizedArchiveValue = (item: ArchiveItem, path: string, locale: ArchiveLocale = 'zh-CN'): unknown => isTranslatedArchiveLocale(locale)
  ? getArchiveTranslation(item, locale).fields[path] ?? getOriginalArchiveValue(item, path) : getOriginalArchiveValue(item, path);
export const getLocalizedArchiveText = (item: ArchiveItem, path: string, locale: ArchiveLocale = 'zh-CN') => {
  const value = getLocalizedArchiveValue(item, path, locale);
  return typeof value === 'string' ? value.trim() : '';
};
export const getLocalizedArchiveCore = (item: ArchiveItem, locale: ArchiveLocale = 'zh-CN'): ArchiveItem['core'] => {
  if (!isTranslatedArchiveLocale(locale)) return item.core;
  const core = { ...item.core };
  for (const [path, value] of Object.entries(getArchiveTranslation(item, locale).fields)) {
    if (path.startsWith('core.')) (core as unknown as Record<string, unknown>)[path.slice(5)] = value;
  }
  return core;
};

// Declare a language only where metadata or the actual Chinese salutation supports it.
// Latin-script text alone is not assumed to be English.
export const getOriginalTranscriptionLanguage = (item: ArchiveItem) => {
  const languages = [...new Set(Object.values(item.metadata.dimensions).flatMap((dimension: unknown) => {
    const value = (dimension as { language?: unknown })?.language;
    return Array.isArray(value) ? value.filter((entry): entry is string => typeof entry === 'string') : typeof value === 'string' ? [value] : [];
  }))];
  const tags: Record<string, string> = { '中文': 'zh-Hans', '日文': 'ja', '英文': 'en', '俄文': 'ru' };
  if (languages.length === 1 && tags[languages[0]]) return tags[languages[0]];
  const text = item.public_view.transcription ?? '';
  if (/[\u3040-\u30ff]/.test(text)) return 'ja';
  if (/(?:您好|你和|来信|孩子|叔叔|作业|唔知)/.test(text)) return 'zh-Hans';
  return 'und';
};
