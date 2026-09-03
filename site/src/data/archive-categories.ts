import type { ObjectType } from './archive-schema';
import source from './archive-categories.json';

export type ArchiveCategorySlug =
	| 'photos'
	| 'postcards'
	| 'letters'
	| 'credentials'
	| 'cards'
	| 'notes'
	| 'other';

export interface ArchiveCategory {
	slug: ArchiveCategorySlug;
	label: string;
	objectTypes: ObjectType[];
}

// 访客分类用于公开网站导航，也供管理端给精确类型分组，不写回正式档案元数据。
// 管理端与数据层继续使用 Excel 规范中的精确 object_type 代码。
export const archiveCategories: ArchiveCategory[] = source.categories.map((category) => ({
	slug: category.slug as ArchiveCategorySlug,
	label: category.label,
	objectTypes: category.object_types as ObjectType[],
}));

const categoryByObjectType = new Map(
	archiveCategories.flatMap((category) =>
		category.objectTypes.map((objectType) => [objectType, category.slug] as const),
	),
);

export const getArchiveCategorySlug = (objectType: ObjectType) =>
	categoryByObjectType.get(objectType);
