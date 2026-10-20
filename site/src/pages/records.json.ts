// 公开档案摘要：只输出已正式发布档案的公开字段，供「我的收藏」展示标题与封面。
// 数据来源是构建时生成的公开档案数据，不含任何账号信息、私密收件内容或管理端字段。

import type { APIRoute } from 'astro';
import { archiveItems } from '../data/archive';
import { createArchiveRecordView, isPublishedArchiveItem } from '../data/archive-view';
import { getLocale, localizePath } from '../i18n/ui';
import { getResponsiveImage } from '../data/responsive-images';

export const GET: APIRoute = ({url}) => {
	const locale = getLocale(url.pathname);
	const records = archiveItems
		.filter(isPublishedArchiveItem)
		.map((item) => {
			const view = createArchiveRecordView(item, locale);
			const image = view.images[0] ? getResponsiveImage(view.images[0]) : undefined;
			return {
				id: view.id,
				title: view.title,
				type_label: view.typeLabel,
				date_display: view.dateDisplay,
				cover: image?.src ?? null,
				cover_alt: view.imageDescriptions[0] ?? '',
				cover_width: image?.width ?? 0,
				cover_height: image?.height ?? 0,
				href: localizePath(`/archive/${view.id}/`, locale),
			};
		});
	return new Response(JSON.stringify({ locale, records }), {
		headers: {
			'Content-Type': 'application/json; charset=utf-8',
			'Cache-Control': 'public, max-age=300',
		},
	});
};
