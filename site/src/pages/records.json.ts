// 公开档案摘要：只输出已正式发布档案的公开字段，供「我的收藏」展示标题与封面。
// 数据来源是构建时生成的公开档案数据，不含任何账号信息、私密收件内容或管理端字段。

import type { APIRoute } from 'astro';
import { archiveItems } from '../data/archive';
import { createArchiveRecordView, isPublishedArchiveItem } from '../data/archive-view';

export const GET: APIRoute = () => {
	const records = archiveItems
		.filter(isPublishedArchiveItem)
		.map((item) => {
			const view = createArchiveRecordView(item);
			return {
				id: view.id,
				title: view.title,
				type_label: view.typeLabel,
				date_display: view.dateDisplay,
				cover: view.images[0] ?? null,
				href: `/archive/${view.id}/`,
			};
		});
	return new Response(JSON.stringify({ records }), {
		headers: {
			'Content-Type': 'application/json; charset=utf-8',
			'Cache-Control': 'public, max-age=300',
		},
	});
};
