import fs from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import {
	getPublicTranslationSource, getTranslationSourceHash, getTranslationSourceFieldHashes,
	getTranslationState, validateTranslationRecord, createPublicTranslationLayer,
} from '../shared/archive-translations.mjs';

const itemIdPattern = /^LJM-\d{8}-[A-Z]{3}-\d{3}$/;
const equal = (left, right) => JSON.stringify(left) === JSON.stringify(right);
const fail = (message, statusCode = 400) => {
	const error = new Error(message);
	error.name = 'RequestError';
	error.statusCode = statusCode;
	throw error;
};
const safeId = (itemId) => {
	if (!itemIdPattern.test(itemId ?? '')) fail('永久编号无效。');
	return itemId;
};

// 译文草稿、已审核版本和历史均留在私有管理目录。只有公开层导出函数可以向网站写入内容。
export const createTranslationStore = ({ root }) => {
	const filePath = (itemId) => path.join(root, `${safeId(itemId)}.json`);
	const readRaw = async (itemId) => {
		try { return await fs.readFile(filePath(itemId), 'utf8'); }
		catch (error) { if (error.code === 'ENOENT') return null; throw error; }
	};
	const read = async (itemId) => {
		const raw = await readRaw(itemId);
		if (!raw) return { schema_version: 1, item_id: itemId, revision: 0, draft: null, published: null };
		const record = JSON.parse(raw);
		// 兼容经审核的首批导入记录；之后写入统一的草稿/正式双版本结构。
		if (record.locale === 'en') return {
			schema_version: 1, item_id: itemId, revision: record.revision ?? 1,
			draft: record.status === 'published' ? null : record,
			published: record.status === 'published' ? record : null,
		};
		if (record.item_id !== itemId || !Number.isInteger(record.revision)) fail('英文维护记录格式无效，已停止覆盖。');
		return record;
	};
	const write = async (itemId, value) => {
		await fs.mkdir(root, { recursive: true });
		const target = filePath(itemId);
		const temporary = `${target}.${randomUUID()}.tmp`;
		try {
			await fs.writeFile(temporary, `${JSON.stringify(value, null, 2)}\n`, { encoding: 'utf8', mode: 0o600 });
			await fs.rename(temporary, target);
		} finally { await fs.rm(temporary, { force: true }); }
	};
	const assertPublic = (item) => {
		if (!item || item.core?.record_status !== 'ACT' || item.core?.privacy_level !== 'G' || item.core?.use_status !== 'U3') {
			fail('英文维护只处理已经通过隐私检查并公开发布的档案。');
		}
	};
	const assertRevision = (current, payload) => {
		if (payload.revision !== current.revision) fail('译文已在其他页面修改，请刷新英文面板后再保存。', 409);
	};
	const detail = async (item) => {
		assertPublic(item);
		const stored = await read(item.core.item_id);
		const active = stored.draft ?? stored.published;
		const source = getPublicTranslationSource(item);
		const hashes = getTranslationSourceFieldHashes(item);
		const staleFields = active ? Object.keys(active.fields ?? {}).filter((key) =>
			active.source_hashes ? active.source_hashes[key] !== hashes[key] : active.source_hash !== getTranslationSourceHash(item)) : [];
		const staleImages = active ? Object.keys(active.image_descriptions ?? {}).filter((key) =>
			active.source_hashes ? active.source_hashes[`image:${key}`] !== hashes[`image:${key}`] : active.source_hash !== getTranslationSourceHash(item)) : [];
		return {
			item_id: item.core.item_id, revision: stored.revision, source,
			source_hash: getTranslationSourceHash(item), source_hashes: hashes,
			translation: active, has_draft: Boolean(stored.draft),
			state: getTranslationState(item, active), published_state: getTranslationState(item, stored.published),
			stale_fields: staleFields, stale_images: staleImages,
		};
	};
	const saveDraft = async (item, payload) => {
		assertPublic(item);
		const itemId = item.core.item_id;
		const current = await read(itemId);
		assertRevision(current, payload);
		const sourceHash = getTranslationSourceHash(item);
		if (payload.source_hash !== sourceHash) fail('中文公开内容已经变化，请刷新英文面板再对照保存。', 409);
		if (!['draft', 'review'].includes(payload.status)) fail('英文保存状态无效。');
		const fields = payload.fields ?? {};
		const imageDescriptions = payload.image_descriptions ?? {};
		const currentHashes = getTranslationSourceFieldHashes(item);
		const previous = current.draft ?? current.published;
		const confirmed = new Set(Array.isArray(payload.confirmed_fields) ? payload.confirmed_fields : []);
		const sourceHashes = {};
		for (const [key, value] of [...Object.entries(fields), ...Object.entries(imageDescriptions).map(([key, value]) => [`image:${key}`, value])]) {
			const previousValue = key.startsWith('image:') ? previous?.image_descriptions?.[key.slice(6)] : previous?.fields?.[key];
			// 原文发生变化而译文没改时，不能因一次“保存”就自动成为有效；必须逐项重新确认。
			const previousHash = previous?.source_hashes?.[key] ?? (previous?.source_hash === sourceHash ? currentHashes[key] : '');
			sourceHashes[key] = !equal(value, previousValue) || confirmed.has(key) || !previous ? currentHashes[key] : previousHash;
		}
		const draft = {
			schema_version: 1, item_id: itemId, locale: 'en', source_hash: sourceHash,
			source_hashes: sourceHashes, status: payload.status, fields,
			image_descriptions: imageDescriptions, transcription_kind: payload.transcription_kind ?? 'none',
			updated_at: new Date().toISOString(),
		};
		const validation = validateTranslationRecord(item, draft);
		if (!validation.valid) fail(validation.errors.join('；'));
		await write(itemId, { ...current, revision: current.revision + 1, draft });
		return detail(item);
	};
	const publish = async (item, payload, reviewedBy) => {
		assertPublic(item);
		const itemId = item.core.item_id;
		const current = await read(itemId);
		assertRevision(current, payload);
		if (payload.confirmed !== true) fail('请先确认已逐项核对英文事实、原文不确定性和隐私范围。');
		if (!current.draft) fail('请先保存英文草稿，再审核发布。');
		if (current.draft.source_hash !== getTranslationSourceHash(item)) fail('中文公开内容已经变化，请重新对照译文。', 409);
		const hashes = getTranslationSourceFieldHashes(item);
		for (const key of [...Object.keys(current.draft.fields ?? {}), ...Object.keys(current.draft.image_descriptions ?? {}).map((key) => `image:${key}`)]) {
			if (current.draft.source_hashes?.[key] !== hashes[key]) fail('仍有来源变化的译文未复核，请逐项确认后保存。');
		}
		const published = { ...current.draft, status: 'published', reviewed_at: new Date().toISOString(), reviewed_by: reviewedBy };
		const validation = validateTranslationRecord(item, published);
		if (!validation.valid) fail(validation.errors.join('；'));
		if (!Object.keys(published.fields).length && !Object.keys(published.image_descriptions).length) fail('请至少填写一项英文内容。');
		if (current.published) {
			const history = path.join(root, 'history', safeId(itemId));
			await fs.mkdir(history, { recursive: true });
			await fs.writeFile(path.join(history, `${new Date().toISOString().replace(/[:.]/g, '-')}-${randomUUID()}.json`), `${JSON.stringify(current.published, null, 2)}\n`, { encoding: 'utf8', mode: 0o600 });
		}
		await write(itemId, { ...current, revision: current.revision + 1, draft: null, published });
		return detail(item);
	};
	const publicLayer = async (items) => {
		const translations = {};
		for (const item of items) {
			const stored = await read(item.core.item_id);
			if (stored.published) translations[item.core.item_id] = stored.published;
		}
		return createPublicTranslationLayer(items, translations);
	};
	const restoreRaw = async (itemId, raw) => {
		if (raw === null) { await fs.rm(filePath(itemId), { force: true }); return; }
		await write(itemId, JSON.parse(raw));
	};
	return { detail, saveDraft, publish, publicLayer, readRaw, restoreRaw };
};
