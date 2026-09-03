/**
 * 公开网站的人工策展配置。
 *
 * 这里只保存公开页面的展示选择，不修改任何档案元数据。
 * 当指定编号不存在或不再公开时，首页会自动回退到现有的安全选择规则。
 */
export const siteCuration = {
	homeFeaturedRecordId: 'LJM-20260808-PST-001',
} as const;

export interface ArchiveTopicCuration {
	slug: string;
	kicker: string;
	title: string;
	description: string;
	recordIds: string[];
}

// 专题只决定公开网站如何组织内容，不改写档案分类和元数据。
// 至少有两件仍在公开的档案时，列表页才会显示该专题。
export const archiveTopics: ArchiveTopicCuration[] = [
	{
		slug: 'posted-postcards',
		kicker: 'POSTED STORIES',
		title: '寄出的明信片',
		description: '从新年问候到跨越地域的寄递痕迹，把同一条纸上交流线索放在一起阅读。',
		recordIds: [
			'LJM-20260808-PCD-001',
			'LJM-20260808-PST-001',
		],
	},
];
