import type { ArchiveItem, ObjectType } from './archive-schema';
import { getCodeEntry, getCodeLabel, getArchiveTermLabel, isEnglishArchiveLocale } from './code-dictionary';
import { getDimensionsForItem } from './dimension-definitions';
import { getArchiveTranslation, getLocalizedArchiveCore, getLocalizedArchiveText, getLocalizedArchiveValue, getOriginalTranscriptionLanguage } from './archive-localization';

export interface ArchiveSearchFields { title: string; identifiers: string; typeLabel: string; dateDisplay: string; place: string; description: string; transcription: string; tags: string; }
export interface ArchiveRecordView {
  item: ArchiveItem; id: string; collectionCode: string; title: string; objectType: ObjectType;
  typeLabel: string; dateDisplay: string; decade?: string; placeDisplay: string; placeFilters: string[];
  canonicalPlaceFilters: string[]; placeFilterLabels: Record<string, string>; canonicalTags: string[]; tagLabels: Record<string, string>;
  localizedCore: ArchiveItem['core']; description: string; transcription: string; originalTranscription: string;
  transcriptionTranslation: string; transcriptionKind: 'none' | 'full' | 'summary'; originalLanguage: string; translationState: string;
  revisionNote: string; tags: string[]; images: string[]; imageDescriptions: string[]; searchFields: ArchiveSearchFields;
}
export interface DisplayFact { label: string; value: string; code?: string; originalText?: boolean; }
const hasText = (value: unknown): value is string => typeof value === 'string' && value.trim().length > 0;
const uniqueText = (values: Array<string | undefined>) => [...new Set(values.filter(hasText).map((value) => value.trim()))];
export const getObjectTypeLabel = (type: ObjectType, locale: string = 'zh-CN') => getCodeLabel(type, locale);
export const isPublishedArchiveItem = (item: ArchiveItem) => item.core.record_status === 'ACT' && item.core.use_status === 'U3' && item.core.privacy_level === 'G';
export const getDecade = (dateDisplay: string) => { const match = dateDisplay.match(/(\d{4})/); return match ? String(Math.floor(Number(match[1]) / 10) * 10) : undefined; };
export const createArchiveRecordView = (item: ArchiveItem, requestedLocale: string | number = 'zh-CN'): ArchiveRecordView => {
  const locale = typeof requestedLocale === 'string' ? requestedLocale : 'zh-CN';
  const english = isEnglishArchiveLocale(locale);
  const translation = getArchiveTranslation(item);
  const localizedCore = getLocalizedArchiveCore(item, locale);
  const fields = ['country', 'province', 'city', 'district', 'street_town', 'specific_place'] as const;
  const canonicalPlaceFilters = uniqueText(fields.map((field) => item.core[field]));
  const placeFilterLabels = Object.fromEntries(fields.filter((field) => hasText(item.core[field])).map((field) => [item.core[field]!.trim(), localizedCore[field]?.trim() ?? item.core[field]!.trim()]));
  const placeDisplay = uniqueText(fields.map((field) => localizedCore[field])).join(' / ');
  const canonicalTags = uniqueText(item.public_view.tags);
  const rawLocalizedTags = getLocalizedArchiveValue(item, 'public_view.tags', locale);
  const tags = Array.isArray(rawLocalizedTags) ? uniqueText(rawLocalizedTags) : canonicalTags;
  const tagLabels = Object.fromEntries((item.public_view.tags ?? []).map((tag, index) => [tag.trim(), Array.isArray(rawLocalizedTags) ? String(rawLocalizedTags[index] ?? tag).trim() : tag.trim()]));
  const title = localizedCore.title;
  const dateDisplay = localizedCore.date_display?.trim() ?? '';
  const description = getLocalizedArchiveText(item, 'public_view.description', locale);
  // Original transcription stays original. A translated full text or summary is a separate field.
  const transcription = item.public_view.transcription?.trim() ?? '';
  const transcriptionTranslation = typeof translation.fields['public_view.transcription'] === 'string' ? translation.fields['public_view.transcription'] : '';
  const images = uniqueText(item.core.publication_file_path ?? []);
  const imageDescriptions = images.map((image, index) => {
    if (english && translation.image_descriptions[image]) return translation.image_descriptions[image];
    const maintained = item.public_view.image_descriptions?.[index]?.trim();
    if (maintained) return maintained;
    const filename = image.split('/').at(-1)?.toLowerCase() ?? '';
    if (images.length === 1) return english ? `${title}, archive image` : `${title}的档案图片`;
    if (filename.startsWith('front-')) return english ? `${title}, front` : `${title}，正面`;
    if (filename.startsWith('back-')) return english ? `${title}, back` : `${title}，背面`;
    return english ? `${title}, detail ${index + 1}` : `${title}，细节图 ${index + 1}`;
  });
  const typeLabel = getObjectTypeLabel(item.core.object_type, locale);
  const collectionCode = item.core.collection_code?.trim() ?? '';
  const joinSearch = (...values: (string | string[])[]) => [...new Set(values.flat().filter(Boolean))].join(' ').toLocaleLowerCase('en-US');
  const translated = translation.fields;
  const searchFields: ArchiveSearchFields = {
    title: joinSearch(item.core.title, String(translated['core.title'] ?? '')),
    identifiers: joinSearch(item.core.item_id, collectionCode, item.core.object_type),
    typeLabel: joinSearch(getObjectTypeLabel(item.core.object_type), getObjectTypeLabel(item.core.object_type, 'en')),
    dateDisplay: joinSearch(item.core.date_display ?? '', String(translated['core.date_display'] ?? '')),
    place: joinSearch(canonicalPlaceFilters, ...fields.map((field) => { const value = translated[`core.${field}`]; return typeof value === 'string' ? value : ''; }), canonicalPlaceFilters.join(' / '), fields.map((field) => typeof translated[`core.${field}`] === 'string' ? String(translated[`core.${field}`]) : item.core[field] ?? '').filter(Boolean).join(' / ')),
    description: joinSearch(item.public_view.description ?? '', String(translated['public_view.description'] ?? '')),
    transcription: joinSearch(transcription, transcriptionTranslation),
    tags: joinSearch(canonicalTags, Array.isArray(translated['public_view.tags']) ? translated['public_view.tags'] : []),
  };
  return { item, id: item.core.item_id, collectionCode, title, objectType: item.core.object_type, typeLabel, dateDisplay,
    decade: getDecade(item.core.date_display ?? ''), placeDisplay, placeFilters: canonicalPlaceFilters, canonicalPlaceFilters,
    placeFilterLabels, localizedCore, canonicalTags, tagLabels, description, transcription, originalTranscription: transcription,
    transcriptionTranslation, transcriptionKind: translation.transcriptionKind, originalLanguage: getOriginalTranscriptionLanguage(item), translationState: translation.state,
    revisionNote: getLocalizedArchiveText(item, 'public_view.revision_note', locale), tags, images, imageDescriptions, searchFields };
};
const formatValue = (value: unknown, includeCodes: boolean, locale: string): string => {
  const english = isEnglishArchiveLocale(locale);
  if (Array.isArray(value)) return value.map((entry) => formatValue(entry, includeCodes, locale)).filter(Boolean).join(english ? ', ' : '、');
  if (typeof value === 'number') return String(value);
  if (!hasText(value)) return '';
  const entry = getCodeEntry(value.trim(), locale);
  return entry ? includeCodes ? english ? `${entry.label} (${entry.code})` : `${entry.label}（${entry.code}）` : entry.label : getArchiveTermLabel(value.trim(), locale);
};
export const getSpecificMetadataFacts = (item: ArchiveItem, options: { includeCodes?: boolean; locale?: string } = {}): DisplayFact[] => {
  const { includeCodes = false, locale = 'zh-CN' } = options;
  const visitorFirstFields = new Set(['people', 'body_transcription', 'message_transcription', 'transcription']);
  const values = item.metadata.dimensions as unknown as Record<string, Record<string, unknown> | undefined>;
  return getDimensionsForItem(item, locale).flatMap((definition) => {
    const dimension = values[definition.dimension_code];
    if (!dimension) return [];
    const formatted = definition.fields.map((field) => visitorFirstFields.has(field) ? '' : formatValue(getLocalizedArchiveValue(item, `metadata.dimensions.${definition.dimension_code}.${field}`, locale), includeCodes, locale)).filter(Boolean);
    if (!formatted.length) return [];
    return [{ label: definition.name, value: formatted.join(isEnglishArchiveLocale(locale) ? '; ' : '；'), code: includeCodes ? definition.dimension_code : undefined,
      originalText: definition.fields.some((field) => field.endsWith('transcription') && hasText(dimension[field])) }];
  });
};
export const displayCode = (code: string | undefined, locale: string = 'zh-CN') => hasText(code) ? isEnglishArchiveLocale(locale) ? `${getCodeLabel(code, locale)} (${code})` : `${getCodeLabel(code, locale)}（${code}）` : '';
