import { getHomepageCover } from '../shared/homepage-cover.mjs';

// 只接收图集中的位置；最终公开路径由保存流程分配，不接收任意路径或客户端时间。
export const validateHomepageCoverRequest = (request, images) => {
	if (request === undefined) return undefined;
	if (!request || typeof request !== 'object' || Array.isArray(request) ||
		Object.keys(request).some((key) => !['imageIndex', 'promote'].includes(key)) ||
		!Object.hasOwn(request, 'imageIndex') || typeof request.promote !== 'boolean') {
		throw new Error('首页封面设置格式不正确，请重新选择图片。');
	}
	if (!Array.isArray(images)) throw new Error('首页封面需要有效的发布图片列表。');
	if (request.imageIndex !== null && (!Number.isSafeInteger(request.imageIndex) ||
		request.imageIndex < 0 || request.imageIndex >= images.length)) {
		throw new Error('首页封面图片已不在当前图集中，请重新选择。');
	}
	if (request.imageIndex === null && request.promote) {
		throw new Error('取消首页封面时不能同时设置优先显示。');
	}
	return { imageIndex: request.imageIndex, promote: request.promote };
};

export const resolveDraftHomepageCover = (record, previousRecord, request, now = () => new Date()) => {
	const previous = getHomepageCover(previousRecord);
	if (request?.imageIndex === null) return undefined;
	if (request === undefined) {
		// 旧客户端不会提交这个新设置；仍在图集中的已有设置原样保留。
		return previous && getHomepageCover({ ...record, public_view: { ...record.public_view, homepage_cover: previous } });
	}
	const image = record.core.publication_file_path[request.imageIndex];
	const selectedAt = !request.promote && previous?.image === image
		? previous.selected_at
		: now().toISOString();
	const cover = getHomepageCover({ ...record, public_view: { ...record.public_view, homepage_cover: { image, selected_at: selectedAt } } });
	if (!cover) throw new Error('首页封面只能使用本件档案的有效发布图片。');
	return cover;
};
