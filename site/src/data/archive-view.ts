import type { ArchiveItem, ObjectType } from './archive-schema';
import { getCodeEntry, getCodeLabel } from './code-dictionary';
import { getDimensionsForItem } from './dimension-definitions';

// 搜索字段按用途分开保存，档案列表在构建时输出为 JSON 搜索索引，
// 访客搜索时按字段重要程度加权评分，并据此显示“匹配位置”。
// 所有字段值已统一转为小写，客户端不需要再次规范化大小写。
export interface ArchiveSearchFields {
	title: string;
	identifiers: string;
	typeLabel: string;
	dateDisplay: string;
	place: string;
	description: string;
	transcription: string;
	tags: string;
}

export interface ArchiveRecordView {
	item: ArchiveItem;
	id: string;
	collectionCode: string;
	title: string;
	objectType: ObjectType;
	typeLabel: string;
	dateDisplay: string;
	decade?: string;
	placeDisplay: string;
	placeFilters: string[];
	description: string;
	transcription: string;
	tags: string[];
	images: string[];
	imageDescriptions: string[];
	searchFields: ArchiveSearchFields;
}

export interface DisplayFact {
	label: string;
	value: string;
	code?: string;
}

const hasText = (value: unknown): value is string =>
	typeof value === 'string' && value.trim().length > 0;

const uniqueText = (values: Array<string | undefined>) =>
	[...new Set(values.filter(hasText).map((value) => value.trim()))];

export const getObjectTypeLabel = (type: ObjectType) =>
	type === 'card' ? '旧卡片' : getCodeLabel(type);

export const isPublishedArchiveItem = (item: ArchiveItem) =>
	item.core.record_status === 'ACT' &&
	item.core.use_status === 'U3' &&
	item.core.privacy_level === 'G';

export const getDecade = (dateDisplay: string) => {
	const yearMatch = dateDisplay.match(/(\d{4})/);
	if (!yearMatch) return undefined;

	const year = Number(yearMatch[1]);
	return String(Math.floor(year / 10) * 10);
};

export const createArchiveRecordView = (item: ArchiveItem): ArchiveRecordView => {
	const dateDisplay = item.core.date_display?.trim() ?? '';
	// 地点只有 core 结构化字段一个填写位置，展示文字和筛选值都由它推导。
	const placeFilters = uniqueText([
		item.core.country,
		item.core.province,
		item.core.city,
		item.core.district,
		item.core.street_town,
		item.core.specific_place,
	]);
	const placeDisplay = placeFilters.join(' / ');
	const tags = uniqueText(item.public_view.tags);
	const description = item.public_view.description?.trim() ?? '';
	const transcription = item.public_view.transcription?.trim() ?? '';
	const images = uniqueText(item.core.publication_file_path ?? []);
	const maintainedDescriptions = item.public_view.image_descriptions ?? [];
	const imageDescriptions = images.map((image, index) => {
		const maintained = maintainedDescriptions[index]?.trim();
		if (maintained) return maintained;
		const filename = image.split('/').at(-1)?.toLocaleLowerCase('en-US') ?? '';
		if (images.length === 1) return `${item.core.title}的档案图片`;
		if (filename.startsWith('front-')) return `${item.core.title}，正面`;
		if (filename.startsWith('back-')) return `${item.core.title}，背面`;
		return `${item.core.title}，细节图 ${index + 1}`;
	});
	const typeLabel = getObjectTypeLabel(item.core.object_type);
	const collectionCode = item.core.collection_code?.trim() ?? '';
	const toSearchValue = (value: string) => value.toLocaleLowerCase('zh-CN');
	const searchFields: ArchiveSearchFields = {
		title: toSearchValue(item.core.title),
		identifiers: toSearchValue([item.core.item_id, collectionCode, item.core.object_type].filter(Boolean).join(' ')),
		typeLabel: toSearchValue(typeLabel),
		dateDisplay: toSearchValue(dateDisplay),
		place: toSearchValue([placeDisplay, ...placeFilters].filter(Boolean).join(' ')),
		description: toSearchValue(description),
		transcription: toSearchValue(transcription),
		tags: toSearchValue(tags.join(' ')),
	};

	return {
		item,
		id: item.core.item_id,
		collectionCode,
		title: item.core.title,
		objectType: item.core.object_type,
		typeLabel,
		dateDisplay,
		decade: getDecade(dateDisplay),
		placeDisplay,
		placeFilters,
		description,
		transcription,
		tags,
		images,
		imageDescriptions,
		searchFields,
	};
};

const formatValue = (value: unknown, includeCodes: boolean): string => {
	if (Array.isArray(value)) {
		return value.map((entry) => formatValue(entry, includeCodes)).filter(Boolean).join('、');
	}
	if (typeof value === 'number') return String(value);
	if (typeof value !== 'string' || value.trim() === '') return '';

	const trimmed = value.trim();
	const entry = getCodeEntry(trimmed);
	return entry ? includeCodes ? `${entry.label}（${entry.code}）` : entry.label : trimmed;
};

export const getSpecificMetadataFacts = (
	item: ArchiveItem,
	options: { includeCodes?: boolean } = {},
): DisplayFact[] => {
	const includeCodes = options.includeCodes ?? false;
	const definitions = getDimensionsForItem(item);
	const visitorFirstFields = new Set([
		'people',
		'body_transcription',
		'message_transcription',
		'transcription',
	]);
	const values = item.metadata.dimensions as unknown as Record<
		string,
		Record<string, unknown> | undefined
	>;

	return definitions.flatMap((definition) => {
		const dimensionValue = values[definition.dimension_code];
		if (!dimensionValue) return [];

		const formattedValues = definition.fields
			.map((field) => visitorFirstFields.has(field) ? '' : formatValue(dimensionValue[field], includeCodes))
			.filter(Boolean);
		if (formattedValues.length === 0) return [];

		return [
			{
				label: definition.name,
				value: formattedValues.join('；'),
				code: includeCodes ? definition.dimension_code : undefined,
			},
		];
	});
};

export const displayCode = (code: string | undefined) =>
	hasText(code) ? `${getCodeLabel(code)}（${code}）` : '';
