// 展示参照共用规则。分类及代码含义仍来自现有主数据，本模块只统一取值和顺序。
export const getDecade = (dateDisplay) => {
	const year = String(dateDisplay ?? '').match(/\d{4}/)?.[0];
	return year ? String(Math.floor(Number(year) / 10) * 10) : undefined;
};

export const getDecadeOptions = (dates) => [
	...[...new Set(dates.map(getDecade).filter(Boolean))]
		.sort((left, right) => Number(left) - Number(right))
		.map((value) => ({ value, label: `${value}年代` })),
	{ value: 'unknown', label: '年代未知' },
];

export const sortDictionaryEntries = (entries = []) => entries
	.filter((entry) => entry.enabled !== false)
	.map((entry, index) => ({ entry, index }))
	.sort((left, right) => (Number(left.entry.sort ?? Number.MAX_SAFE_INTEGER) -
		Number(right.entry.sort ?? Number.MAX_SAFE_INTEGER)) || left.index - right.index)
	.map(({ entry }) => entry);

export const getArchiveCategoryOptions = (categories = []) => categories.map((category) => ({
	value: category.slug,
	label: category.label,
	objectTypes: [...(category.object_types ?? category.objectTypes ?? [])],
}));

export const getArchiveTypeOrder = (categories = []) =>
	getArchiveCategoryOptions(categories).flatMap((category) => category.objectTypes);

export const compareReferenceValues = (left, right, order) => {
	const leftIndex = order.indexOf(left), rightIndex = order.indexOf(right);
	return (leftIndex < 0 ? order.length : leftIndex) - (rightIndex < 0 ? order.length : rightIndex)
		|| String(left).localeCompare(String(right), 'zh-CN', { numeric: true });
};

export const managementStatusOrder = ['草稿', '恢复草稿', '有未发布修改', '未发布', '候选', '已发布', '已撤销'];
export const getManagementStatus = (record) => {
	const core = record.core ?? record;
	const hasDraft = record._admin?.hasDraft ?? record.has_draft;
	const hasOfficial = record._admin?.hasOfficial ?? record.has_official;
	if (record._admin?.restoredFromWithdrawal || record.restored_from_withdrawal) return '恢复草稿';
	if (hasDraft) return hasOfficial ? '有未发布修改' : '草稿';
	if (core.record_status === 'WDR') return '已撤销';
	if (core.use_status === 'U3' || record.is_published) return '已发布';
	if (core.use_status === 'U1') return '候选';
	return '未发布';
};
