// 浏览足迹：把访客最近看过的公开档案保存在其自己的浏览器（localStorage）里，
// 供首页「您最近看过」继续浏览使用。数据不会上传、不会进入网址，可随时清空。

export type ViewHistoryEntry = {
	id: string;
	title: string;
	typeLabel: string;
	dateDisplay: string;
	imageSrc: string;
	imageAlt: string;
	imageWidth: number;
	imageHeight: number;
	viewedAt: number;
};

const STORAGE_KEY = 'ljm-view-history';
const MAX_ENTRIES = 12;
// 与点赞服务一致的永久编号格式，避免把无效数据写入足迹。
const ID_PATTERN = /^LJM-\d{8}-[A-Z0-9]{2,5}-\d{3}$/;

const isValidEntry = (value: unknown): value is ViewHistoryEntry => {
	if (!value || typeof value !== 'object') return false;
	const entry = value as Partial<ViewHistoryEntry>;
	if (typeof entry.id !== 'string' || !ID_PATTERN.test(entry.id)) return false;
	if (typeof entry.title !== 'string' || !entry.title.trim()) return false;
	if (typeof entry.typeLabel !== 'string' || typeof entry.dateDisplay !== 'string') return false;
	if (typeof entry.imageSrc !== 'string' || typeof entry.imageAlt !== 'string') return false;
	const hasImage = entry.imageSrc.length > 0;
	const dimensionsValid = !hasImage
		|| (Number.isFinite(entry.imageWidth) && (entry.imageWidth ?? 0) > 0
			&& Number.isFinite(entry.imageHeight) && (entry.imageHeight ?? 0) > 0);
	if (!dimensionsValid) return false;
	return Number.isFinite(entry.viewedAt) && (entry.viewedAt ?? 0) > 0;
};

export function readViewHistory(): ViewHistoryEntry[] {
	try {
		const parsed = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? '[]');
		if (!Array.isArray(parsed)) return [];
		return parsed.filter(isValidEntry).slice(0, MAX_ENTRIES);
	} catch {
		return [];
	}
}

export function recordView(entry: Omit<ViewHistoryEntry, 'viewedAt'>): void {
	if (!isValidEntry({ ...entry, viewedAt: Date.now() })) return;
	try {
		const current = readViewHistory().filter((item) => item.id !== entry.id);
		const next: ViewHistoryEntry = { ...entry, viewedAt: Date.now() };
		window.localStorage.setItem(STORAGE_KEY, JSON.stringify([next, ...current].slice(0, MAX_ENTRIES)));
	} catch {
		// 浏览器禁用本地存储时，浏览足迹静默不可用，不影响页面其他内容。
	}
}

export function clearViewHistory(): void {
	try {
		window.localStorage.removeItem(STORAGE_KEY);
	} catch {
		// 清理失败时无需提示，页面会按空足迹处理。
	}
}
