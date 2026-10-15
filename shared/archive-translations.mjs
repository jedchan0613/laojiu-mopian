import { createHash } from 'node:crypto';
import dictionary from '../site/src/data/standards/code-dictionary.json' with { type: 'json' };
import photo from '../site/src/data/standards/photo-dimensions.json' with { type: 'json' };
import postcard from '../site/src/data/standards/postcard-dimensions.json' with { type: 'json' };
import notebook from '../site/src/data/standards/diary-notebook-dimensions.json' with { type: 'json' };
import credential from '../site/src/data/standards/credential-dimensions.json' with { type: 'json' };
import card from '../site/src/data/standards/card-dimensions.json' with { type: 'json' };

// One archive identity; translations contain only visitor-visible text.
export const TRANSLATION_SCHEMA_VERSION = 1;
export const TRANSLATION_LOCALE = 'en';
const coreFields = ['title', 'date_display', 'country', 'province', 'city', 'district', 'street_town', 'specific_place', 'people', 'source_place', 'provenance_notes'];
const publicFields = ['description', 'transcription', 'tags', 'revision_note'];
const standards = { photo, postcard, diary_notebook: notebook, credential, card };
const codeValues = new Set(dictionary.entries.map((entry) => entry.code));
const blockedFields = new Set(['master_file_path', 'access_file_path', 'publication_file_path', 'checksum_sha256', 'transcript_path', 'research_notes', 'next_action', 'review_date', 'restricted_fields', 'restricted_ranges', 'sensitivity_types', 'signatures', 'fingerprints', 'document_number', 'card_number', 'account_number', 'security_code', 'password', 'magnetic_stripe_data', 'chip_data', 'full_address', 'private_address']);
const allowedMetadataPaths = new Set(Object.values(standards).flatMap((standard) => standard.dimensions.flatMap((dimension) => dimension.fields.filter((field) => !blockedFields.has(field) && !/(?:_ids?|_paths?|_number_masked|_code)$/.test(field)).map((field) => 'metadata.dimensions.' + dimension.dimension_code + '.' + field))));
const isAllowedTranslationPath = (path) => coreFields.some((field) => path === 'core.' + field) || publicFields.some((field) => path === 'public_view.' + field) || allowedMetadataPaths.has(path);
const originalFields = /(?:^|\.)(?:\w*transcription|writing_date_text)$/;
const isRecord = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);
const trim = (value) => typeof value === 'string' ? value.trim() : '';
const isImmutableText = (value) => codeValues.has(value) || /^[-+\d.,%*/×: _]+$/.test(value) || /^\d{4}(?:-\d{2}){0,2}$/.test(value) || /^LJM-\d{8}-[A-Z]{3}-\d{3}$/.test(value);
const translatableValue = (value) => typeof value === 'string' ? Boolean(trim(value)) && !isImmutableText(trim(value)) : Array.isArray(value) && value.length > 0 && value.every((part) => typeof part === 'string') && value.some((part) => Boolean(trim(part)) && !isImmutableText(trim(part)));
const normalizeValue = (value) => Array.isArray(value) ? value.map(trim) : trim(value);
const stableValue = (value) => Array.isArray(value) ? value.map(stableValue) : isRecord(value) ? Object.fromEntries(Object.keys(value).sort().map((key) => [key, stableValue(value[key])])) : value;
export const getTranslationValueHash = (value) => createHash('sha256').update(JSON.stringify(stableValue(value))).digest('hex');
export const isTranslationEligible = (item) => item?.core?.record_status === 'ACT' && item?.core?.use_status === 'U3' && item?.core?.privacy_level === 'G';

export const getPublicTranslationSource = (item) => {
  const fields = {};
  const add = (path, value) => { if (translatableValue(value)) fields[path] = normalizeValue(value); };
  for (const field of coreFields) add(`core.${field}`, item?.core?.[field]);
  for (const field of publicFields) add(`public_view.${field}`, item?.public_view?.[field]);
  for (const dimension of standards[item?.metadata?.schema]?.dimensions ?? []) {
    const value = item.metadata.dimensions?.[dimension.dimension_code];
    for (const field of dimension.fields) {
      if (blockedFields.has(field) || /(?:_ids?|_paths?|_number_masked|_code)$/.test(field)) continue;
      add(`metadata.dimensions.${dimension.dimension_code}.${field}`, value?.[field]);
    }
  }
  const images = [...new Set((item?.core?.publication_file_path ?? []).filter((value) => typeof value === 'string'))];
  const captions = item?.public_view?.image_descriptions ?? [];
  const image_descriptions = Object.fromEntries(images.map((path, index) => {
    const filename = path.split('/').at(-1)?.toLowerCase() ?? '';
    const detail = filename.match(/^detail-(\d+)/)?.[1];
    const role = filename.startsWith('front-') ? '正面' : filename.startsWith('back-') ? '背面' : detail ? `细节图 ${Number(detail)}` : '档案图片';
    return [path, trim(captions[index]) || `${trim(item?.core?.title)}，${role}`];
  }));
  return { item_id: trim(item?.core?.item_id), fields, image_descriptions };
};
export const getTranslationSourceHash = (item) => getTranslationValueHash({ ...getPublicTranslationSource(item), eligibility: [item?.core?.record_status, item?.core?.use_status, item?.core?.privacy_level] });
export const getTranslationSourceFieldHashes = (item) => {
  const source = getPublicTranslationSource(item);
  return Object.fromEntries([...Object.entries(source.fields).map(([path, value]) => [path, getTranslationValueHash(value)]), ...Object.entries(source.image_descriptions).map(([path, value]) => [`image:${path}`, getTranslationValueHash(value)])]);
};
export const getRequiredTranslationFields = (item) => Object.keys(getPublicTranslationSource(item).fields).filter((path) => !originalFields.test(path));
export const getEffectiveTranslation = (item, translation) => {
  const source = getPublicTranslationSource(item);
  const hashes = getTranslationSourceFieldHashes(item);
  const fullMatch = translation?.source_hash === getTranslationSourceHash(item);
  const fieldMatch = (key) => translation?.source_hashes !== undefined ? translation.source_hashes?.[key] === hashes[key] : fullMatch;
  const fields = {};
  const image_descriptions = {};
  if (!isTranslationEligible(item) || translation?.status !== 'published') return { fields, image_descriptions, stale_fields: [], source_hashes: {} };
  const stale_fields = [];
  for (const [key, value] of Object.entries(translation.fields ?? {})) {
    if (Object.hasOwn(source.fields, key) && fieldMatch(key)) fields[key] = value;
    else stale_fields.push(key);
  }
  for (const [key, value] of Object.entries(translation.image_descriptions ?? {})) {
    if (Object.hasOwn(source.image_descriptions, key) && fieldMatch(`image:${key}`)) image_descriptions[key] = value;
    else stale_fields.push(`image:${key}`);
  }
  const source_hashes = Object.fromEntries([...Object.keys(fields), ...Object.keys(image_descriptions).map((key) => `image:${key}`)].map((key) => [key, hashes[key]]));
  return { fields, image_descriptions, stale_fields, source_hashes };
};
export const getTranslationState = (item, translation) => {
  if (!isTranslationEligible(item)) return 'ineligible';
  if (!translation) return 'missing';
  if (!['draft', 'review', 'published'].includes(translation.status)) return 'invalid';
  if (translation.status !== 'published') return translation.status;
  const effective = getEffectiveTranslation(item, translation);
  const count = Object.keys(effective.fields).length + Object.keys(effective.image_descriptions).length;
  const missing = getRequiredTranslationFields(item).filter((key) => !Object.hasOwn(effective.fields, key));
  const missingImages = Object.keys(getPublicTranslationSource(item).image_descriptions).filter((key) => !Object.hasOwn(effective.image_descriptions, key));
  return effective.stale_fields.length || missing.length || missingImages.length ? count ? 'partial' : 'stale' : 'published';
};
export const validateTranslationRecord = (item, translation) => {
  const errors = [], warnings = [], issues = [];
  const error = (message, field) => { errors.push(message); issues.push({ level: 'error', field, message }); };
  const warning = (message, field) => { warnings.push(message); issues.push({ level: 'warning', field, message }); };
  const source = getPublicTranslationSource(item);
  if (!isRecord(translation)) return { valid: false, errors: ['译文记录格式无效。'], warnings, issues, state: 'invalid' };
  if (translation.schema_version !== 1 || !['en', 'th'].includes(translation.locale) || translation.item_id !== source.item_id) error('译文版本、语言或永久编号不匹配。');
  if (!['draft', 'review', 'published'].includes(translation.status)) error('译文状态无效。');
  if (!/^[a-f0-9]{64}$/.test(translation.source_hash ?? '')) error('译文来源指纹无效。');
  if (!isRecord(translation.fields) || !isRecord(translation.image_descriptions ?? {})) error('译文内容必须使用字段映射。');
  if (translation.source_hashes !== undefined && !isRecord(translation.source_hashes)) error('逐字段来源指纹格式无效。');
  for (const [path, value] of Object.entries(translation.fields ?? {})) {
    const original = source.fields[path];
    if (original === undefined) {
      if (isAllowedTranslationPath(path) && (/^[a-f0-9]{64}$/.test(translation.source_hashes?.[path] ?? '') || (translation.source_hashes === undefined && /^[a-f0-9]{64}$/.test(translation.source_hash ?? '')))) warning(`原字段已移除或改为非文本，旧译文不会公开：${path}`, path);
      else error(`不允许翻译未公开或非文本字段：${path}`, path);
      continue;
    }
    const checkString = (part) => typeof part === 'string' && part.trim().length > 0 && part.length <= 100000 && !/<\/?[a-z][^>]*>/i.test(part);
    const savedHash = translation.source_hashes?.[path];
    if (translation.source_hashes !== undefined ? savedHash !== getTranslationValueHash(original) : translation.source_hash !== getTranslationSourceHash(item)) {
      if (!(Array.isArray(value) ? value.every(checkString) : checkString(value))) error(`旧译文必须是纯文本：${path}`, path);
      warning(`源字段类型或内容已变化，旧译文需复核：${path}`, path);
      continue;
    }
    if (Array.isArray(original)) {
      if (!Array.isArray(value) || value.length !== original.length || !value.every(checkString)) error(`译文数组必须与原字段逐项对应：${path}`, path);
      else for (let i = 0; i < original.length; i += 1) if (isImmutableText(original[i]) && value[i] !== original[i]) error(`译文不能改写代码或数字事实：${path}`, path);
    } else if (!checkString(value)) error(`译文必须是非空纯文本：${path}`, path);
  }
  for (const [path, value] of Object.entries(translation.image_descriptions ?? {})) {
    if (!Object.hasOwn(source.image_descriptions, path)) {
      const prefix = '/archive/' + source.item_id + '/';
      if (path.startsWith(prefix) && /^[-A-Za-z0-9_.]+$/.test(path.slice(prefix.length)) && /^[a-f0-9]{64}$/.test(translation.source_hashes?.['image:' + path] ?? '')) warning('公开图片已移除，旧图片译文不会公开。', 'image:' + path);
      else error(`图片说明不属于当前公开图片：${path}`, `image:${path}`);
    }
    else if (typeof value !== 'string' || !value.trim() || value.length > 2000 || /<\/?[a-z][^>]*>/i.test(value)) error('图片译文说明必须是非空纯文本。', `image:${path}`);
  }
  if (!['none', 'full', 'summary'].includes(translation.transcription_kind ?? 'none')) error('原文译文类型无效。');
  if (Object.hasOwn(translation.fields ?? {}, 'public_view.transcription') && !['full', 'summary'].includes(translation.transcription_kind)) error('原文译文必须标明全文翻译或摘要。', 'public_view.transcription');
  if (translation.status === 'published' && !/^\d{4}-\d{2}-\d{2}(?:T.*)?$/.test(translation.reviewed_at ?? '')) error('发布译文前必须记录审核日期。');
  const effective = getEffectiveTranslation(item, translation);
  for (const field of effective.stale_fields) warning(`源内容已变化，该字段译文需复核：${field}`, field);
  if (translation.status === 'published') for (const field of getRequiredTranslationFields(item)) if (!Object.hasOwn(effective.fields, field)) warning(`缺少有效译文：${field}`, field);
  return { valid: errors.length === 0, errors, warnings, issues, state: errors.length ? 'invalid' : getTranslationState(item, translation), source_hash: getTranslationSourceHash(item) };
};
export const createPublicTranslationLayer = (items, translations, locale = 'en') => {
  if (!['en','th'].includes(locale)) throw new Error('不支持的译文语言');
  const list = Array.isArray(translations) ? translations : Object.values(translations?.records ?? translations ?? {});
  const byId = new Map();
  for (const translation of list) {
    if (translation?.locale !== locale) continue;
    if (byId.has(translation?.item_id)) throw new Error(`存在重复译文记录：${translation.item_id}`);
    byId.set(translation?.item_id, translation);
  }
  const records = {};
  for (const item of items) {
    if (!isTranslationEligible(item)) continue;
    const translation = byId.get(item.core.item_id);
    if (!translation || translation.status !== 'published') continue;
    const validation = validateTranslationRecord(item, translation);
    if (!validation.valid) throw new Error(`档案译文校验失败：${item.core.item_id}：${validation.errors.join('；')}`);
    const effective = getEffectiveTranslation(item, translation);
    if (!Object.keys(effective.fields).length && !Object.keys(effective.image_descriptions).length) continue;
    records[item.core.item_id] = { schema_version: 1, item_id: item.core.item_id, locale, status: 'published', source_hash: translation.source_hash, source_hashes: effective.source_hashes, fields: effective.fields, image_descriptions: effective.image_descriptions, transcription_kind: translation.transcription_kind ?? 'none', translation_state: validation.state };
  }
  return { schema_version: 1, locale, records };
};
