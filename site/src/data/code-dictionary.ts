import source from './standards/code-dictionary.json';
import english from '../i18n/archive-labels.en.json';

export interface CodeDictionaryEntry {
  dictionary_key: string; dimension_category: string; code: string; label: string;
  definition: string; field: string; input_mode: string; enabled: boolean; sort: number;
}
export const codeDictionary = source.entries as CodeDictionaryEntry[];
export const enabledCodeDictionary = codeDictionary.filter((entry) => entry.enabled);
const entriesByCode = new Map(enabledCodeDictionary.map((entry) => [entry.code, entry]));
const englishCodes = english.codes as Record<string, string>;
export const isEnglishArchiveLocale = (locale: string = 'zh-CN') => typeof locale === 'string' && (locale === 'en' || locale.startsWith('en-'));
export const getCodeEntry = (code: string, locale: string = 'zh-CN') => {
  const entry = entriesByCode.get(code);
  return entry && isEnglishArchiveLocale(locale) ? { ...entry, label: englishCodes[code] ?? entry.label } : entry;
};
export const getCodeLabel = (code: string, locale: string = 'zh-CN') => getCodeEntry(code, locale)?.label ?? code;
export const getDictionaryEntries = (dictionaryKey: string, locale: string = 'zh-CN') => enabledCodeDictionary
  .filter((entry) => entry.dictionary_key === dictionaryKey).sort((a, b) => a.sort - b.sort)
  .map((entry) => getCodeEntry(entry.code, locale)!);
export const getArchiveTermLabel = (value: string, locale: string = 'zh-CN') => isEnglishArchiveLocale(locale)
  ? (english.terms as Record<string, string>)[value] ?? value : value;
