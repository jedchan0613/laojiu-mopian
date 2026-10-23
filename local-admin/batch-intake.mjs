// 批量入站脚本：从批次目录读取 items.csv 与图片文件夹，逐件调用本地管理后台接口保存草稿。
// 用法：
//   node local-admin/batch-intake.mjs <批次目录>                                  干跑（默认）：只检查和出报告，不写入任何数据
//   node local-admin/batch-intake.mjs <批次目录> --apply --confirmed-publication-copies   正式执行：逐件保存草稿
// 说明：
//   - 批次目录内需有 items.csv（每行一件藏品）和 images/<临时编号>/ 图片文件夹；
//   - 图片必须是你已经确认过、经过筛选和必要脱敏的发布副本，正式执行时必须加 --confirmed-publication-copies 表示本人确认；
//   - 已成功的行记录在批次目录的 _result.csv 中，中断后重新执行会自动跳过；
//   - 脚本只保存草稿，正式公开仍需在管理页面人工完成隐私确认后发布。

import { createHash, randomUUID } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const adminRoot = path.dirname(fileURLToPath(import.meta.url));
const serverUrl = (process.env.LJM_ADMIN_URL ?? 'http://127.0.0.1:4173').replace(/\/+$/, '');

const objectSchema = {
	PHO: 'photo', NEG: 'photo', SLD: 'photo', ALB: 'photo',
	PCD: 'postcard', PST: 'postcard',
	DIA: 'diary_notebook', NTB: 'diary_notebook',
	IDC: 'credential', CRD: 'card',
	LET: 'common', RPR: 'common', OTH: 'common',
};

const imageTypes = new Map([
	['.jpg', 'image/jpeg'], ['.jpeg', 'image/jpeg'],
	['.png', 'image/png'], ['.webp', 'image/webp'],
]);
const maximumImageBytes = 30 * 1024 * 1024;
const maximumItemPayloadBytes = 110 * 1024 * 1024;

// 由服务端统一管理的字段，CSV 中不允许填写。
const managedCoreFields = new Set([
	'item_id', 'record_status', 'privacy_level', 'use_status', 'collection_code',
	'publication_file_path', 'created_date', 'updated_date', 'master_file_path',
]);

const draftCoreDefaults = {
	title: '', accession_date: '', object_type: '', date_display: '年代未知',
	record_status: 'SUS', privacy_level: 'Y', rights_status: 'UNK', research_status: 'R0',
	evidence_level: 'D', digitization_status: 'DG0', transcription_status: 'TX0',
	use_status: 'U0', publication_file_path: [],
};

const usage = () => {
	console.log('用法：');
	console.log('  node local-admin/batch-intake.mjs <批次目录>                                   干跑检查，不写入数据');
	console.log('  node local-admin/batch-intake.mjs <批次目录> --apply --confirmed-publication-copies   正式保存草稿');
	process.exit(1);
};

// ---------- CSV 读取 ----------

const decodeCsvText = (buffer) => {
	if (buffer.length >= 3 && buffer[0] === 0xef && buffer[1] === 0xbb && buffer[2] === 0xbf) {
		return new TextDecoder('utf-8').decode(buffer.subarray(3));
	}
	try {
		return new TextDecoder('utf-8', { fatal: true }).decode(buffer);
	} catch {
		try {
			return new TextDecoder('gbk').decode(buffer);
		} catch {
			throw new Error('items.csv 无法识别文字编码，请在 Excel 中另存为“CSV UTF-8（逗号分隔）”。');
		}
	}
};

const parseCsv = (text) => {
	const rows = [];
	let field = '';
	let row = [];
	let inQuotes = false;
	for (let index = 0; index < text.length; index += 1) {
		const char = text[index];
		if (inQuotes) {
			if (char === '"') {
				if (text[index + 1] === '"') { field += '"'; index += 1; }
				else inQuotes = false;
			} else field += char;
			continue;
		}
		if (char === '"') { inQuotes = true; continue; }
		if (char === ',') { row.push(field); field = ''; continue; }
		if (char === '\r') continue;
		if (char === '\n') { row.push(field); rows.push(row); row = []; field = ''; continue; }
		field += char;
	}
	if (field !== '' || row.length) { row.push(field); rows.push(row); }
	return rows.filter((cells) => cells.some((cell) => cell.trim() !== ''));
};

const csvEscape = (value) => {
	const text = String(value ?? '');
	return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
};

// ---------- 批次读取 ----------

const imageNamePattern = /^(front-public|back-public|detail-(0[1-9]|[1-9]\d)-public)\.(jpg|jpeg|png|webp)$/i;

const imageSortWeight = (name) => {
	const lower = name.toLowerCase();
	if (lower.startsWith('front-public.')) return 0;
	if (lower.startsWith('back-public.')) return 1;
	const match = /^detail-(\d{2})-public\./i.exec(lower);
	return match ? 2 + Number(match[1]) / 100 : 99;
};

const loadBatchImages = async (batchDirectory) => {
	const imagesRoot = path.join(batchDirectory, 'images');
	const byTempId = new Map();
	let entries = [];
	try {
		entries = await fs.readdir(imagesRoot, { withFileTypes: true });
	} catch {
		throw new Error('批次目录中缺少 images/ 图片文件夹。');
	}
	for (const entry of entries) {
		if (!entry.isDirectory()) continue;
		const folderPath = path.join(imagesRoot, entry.name);
		const files = (await fs.readdir(folderPath, { withFileTypes: true }))
			.filter((file) => file.isFile())
			.map((file) => file.name);
		byTempId.set(entry.name, { folderPath, files });
	}
	return byTempId;
};

// ---------- 标准数据 ----------

const fetchJson = async (requestPath) => {
	const response = await fetch(`${serverUrl}${requestPath}`);
	if (!response.ok) throw new Error(`无法从管理服务读取数据（${requestPath}）：HTTP ${response.status}`);
	return response.json();
};

const loadStandards = async () => {
	const standards = await fetchJson('/api/admin-standards');
	const dictionaryByField = new Map();
	for (const entry of standards.codeDictionary?.entries ?? []) {
		if (!entry.enabled) continue;
		// 专属维度的 field 可能是“07_证件维度/ID21”，实际字段名由 dictionary_key 给出。
		for (const field of new Set([entry.dictionary_key, entry.field].filter(Boolean))) {
			if (!dictionaryByField.has(field)) dictionaryByField.set(field, { codes: new Set(), multi: false });
			const slot = dictionaryByField.get(field);
			slot.codes.add(entry.code);
			if ((entry.input_mode ?? '').includes('多')) slot.multi = true;
		}
	}
	const commonFieldByCode = new Map((standards.commonFields?.fields ?? []).map((field) => [field.field_code, field]));
	for (const field of standards.commonFields?.fields ?? []) {
		if ((field.dictionary_or_multi_value_rule ?? '').includes('｜是')) {
			const slot = dictionaryByField.get(field.field_code);
			if (slot) slot.multi = true;
			else dictionaryByField.set(field.field_code, { codes: null, multi: true });
		}
	}
	const dimensionsBySchema = new Map();
	for (const [schema, definition] of Object.entries(standards.dimensions ?? {})) {
		const byCode = new Map((definition?.dimensions ?? []).map((dim) => [dim.dimension_code, new Set(dim.fields ?? [])]));
		dimensionsBySchema.set(schema, byCode);
	}
	return {
		requiredCoreFields: (standards.commonFields?.fields ?? [])
			.filter((field) => field.required && !['record_status', 'item_id', 'privacy_level', 'created_date'].includes(field.field_code))
			.map((field) => ({ code: field.field_code, name: field.name })),
		commonFieldByCode,
		dictionaryByField,
		dimensionsBySchema,
		coreCanonicalFields: new Set(standards.fieldRouting?.core_canonical_fields ?? []),
	};
};

// ---------- 行解析与校验 ----------

const isMultiField = (fieldCode, standards) => {
	if (['tags', 'image_descriptions'].includes(fieldCode)) return true;
	return standards.dictionaryByField.get(fieldCode)?.multi ?? false;
};

const setCellValue = (target, fieldCode, rawValue, standards) => {
	const value = rawValue.trim();
	if (!value) return;
	if (isMultiField(fieldCode, standards)) {
		target[fieldCode] = value.split(';').map((part) => part.trim()).filter(Boolean);
		return;
	}
	const definition = standards.commonFieldByCode.get(fieldCode);
	if (definition?.data_type === '整数' && /^-?\d+$/.test(value)) {
		target[fieldCode] = Number(value);
		return;
	}
	target[fieldCode] = value;
};

const parseRow = (headers, cells, standards) => {
	const core = {};
	const dimensions = {};
	const view = {};
	const unknownColumns = [];
	for (const [index, header] of headers.entries()) {
		const value = cells[index] ?? '';
		if (!header || !value.trim()) continue;
		if (header === 'temp_id') continue;
		if (header.startsWith('core.')) {
			const fieldCode = header.slice(5);
			if (!standards.commonFieldByCode.has(fieldCode)) unknownColumns.push(header);
			else setCellValue(core, fieldCode, value, standards);
			continue;
		}
		const dimMatch = /^dim\.([A-Za-z]{1,3}\d{2})\.([A-Za-z0-9_]+)$/.exec(header);
		if (dimMatch) {
			const [, dimensionCode, fieldCode] = dimMatch;
			(dimensions[dimensionCode.toUpperCase()] ??= {});
			setCellValue(dimensions[dimensionCode.toUpperCase()], fieldCode, value, standards);
			continue;
		}
		if (header.startsWith('view.')) {
			const fieldCode = header.slice(5);
			if (!['description', 'transcription', 'tags', 'image_descriptions'].includes(fieldCode)) unknownColumns.push(header);
			else setCellValue(view, fieldCode, value, standards);
			continue;
		}
		unknownColumns.push(header);
	}
	return { core, dimensions, view, unknownColumns };
};

const validDate = (value) => {
	if (!/^\d{4}-\d{2}-\d{2}$/.test(value ?? '')) return false;
	return new Date(`${value}T00:00:00Z`).toISOString().slice(0, 10) === value;
};

const validateItem = (item, standards, imageIndex) => {
	const errors = [];
	const warnings = [];
	const { dimensions } = item.parsed;
	const core = { ...draftCoreDefaults, ...item.parsed.core };

	for (const column of item.parsed.unknownColumns) {
		warnings.push(`无法识别的列“${column}”，该列内容已被忽略（请检查列名是否写错）。`);
	}
	for (const fieldCode of Object.keys(item.parsed.core)) {
		if (managedCoreFields.has(fieldCode)) {
			errors.push(`core.${fieldCode} 由系统自动管理，请从表格中删除该列。`);
		}
	}
	if (!item.tempId) errors.push('temp_id（临时编号）不能为空。');
	if (!core.title?.trim()) errors.push('core.title（题名）不能为空。');
	if (!validDate(core.accession_date)) errors.push('core.accession_date（入藏日期）必须是真实的 YYYY-MM-DD 日期。');
	if (!objectSchema[core.object_type]) {
		errors.push(`core.object_type（藏品类型）“${core.object_type ?? ''}”无效，可选：${Object.keys(objectSchema).join('、')}。`);
	}
	for (const field of standards.requiredCoreFields) {
		const value = core[field.code];
		if (value === undefined || value === '' || (Array.isArray(value) && !value.length)) {
			errors.push(`core.${field.code}（${field.name}）是正式发布必填字段，请填写；不确定的年代填“年代未知”。`);
		}
	}

	const schema = objectSchema[core.object_type];
	const dimensionDefs = standards.dimensionsBySchema.get(schema) ?? new Map();
	for (const [dimensionCode, fields] of Object.entries(dimensions)) {
		const definition = dimensionDefs.get(dimensionCode);
		if (!definition) {
			errors.push(`dim.${dimensionCode}.* 不属于 ${core.object_type || '?'} 类型的维度，请检查维度编号。`);
			continue;
		}
		for (const fieldCode of Object.keys(fields)) {
			if (!definition.has(fieldCode)) {
				errors.push(`dim.${dimensionCode}.${fieldCode} 不是该维度的字段，请检查列名。`);
				continue;
			}
			if (/signatures?|fingerprints?/i.test(fieldCode)) {
				errors.push(`dim.${dimensionCode}.${fieldCode} 涉及签名或指纹，不得进入网站数据。`);
			}
		}
	}

	// 代码字段逐个对照代码字典。
	const checkCodes = (fieldCode, value, where) => {
		const slot = standards.dictionaryByField.get(fieldCode);
		if (!slot?.codes) return;
		const values = Array.isArray(value) ? value : [value];
		for (const code of values) {
			if (typeof code === 'string' && !slot.codes.has(code)) {
				errors.push(`${where} 的代码“${code}”不在代码字典中，请查阅规范或使用相应未知代码（如 EV-UNK、MK-NONE 等）。`);
			}
		}
	};
	for (const [fieldCode, value] of Object.entries(core)) checkCodes(fieldCode, value, `core.${fieldCode}`);
	for (const [dimensionCode, fields] of Object.entries(dimensions)) {
		for (const [fieldCode, value] of Object.entries(fields)) checkCodes(fieldCode, value, `dim.${dimensionCode}.${fieldCode}`);
	}

	// 同一字段在 core 与 dim 中填写不同内容会被服务端拒绝，提前提示。
	for (const [dimensionCode, fields] of Object.entries(dimensions)) {
		for (const [fieldCode, value] of Object.entries(fields)) {
			if (!standards.coreCanonicalFields.has(fieldCode)) continue;
			const coreValue = core[fieldCode];
			if (coreValue !== undefined && JSON.stringify(coreValue) !== JSON.stringify(value)) {
				errors.push(`core.${fieldCode} 与 dim.${dimensionCode}.${fieldCode} 填写了不同内容，同一字段只保留一处。`);
			}
		}
	}

	if (core.object_type === 'CRD') {
		const masked = dimensions.CD21?.redaction_status;
		if (!masked) warnings.push('旧卡片（CRD）发布前必须填写 dim.CD21.redaction_status（遮盖状态），建议现在填好。');
		const maskedNumber = dimensions.CD09?.card_number_masked;
		if (typeof maskedNumber === 'string' && (maskedNumber.match(/[A-Za-z0-9]/g) ?? []).length > 4) {
			errors.push('dim.CD09.card_number_masked 最多只能保留末四位，其余位置必须遮盖。');
		}
	}

	// 图片检查。
	const imageInfo = imageIndex.get(item.tempId);
	if (!imageInfo) {
		errors.push(`images/ 中缺少与 temp_id 对应的图片文件夹“${item.tempId}”。`);
	} else {
		const validFiles = imageInfo.files.filter((name) => imageNamePattern.test(name));
		const invalidFiles = imageInfo.files.filter((name) => !imageNamePattern.test(name));
		for (const name of invalidFiles) {
			errors.push(`图片“${name}”命名不符合规范，应为 front-public.jpg / back-public.jpg / detail-01-public.jpg 等。`);
		}
		if (!validFiles.length) errors.push('该图片文件夹中没有可用的规范命名图片。');
		if (validFiles.length && !validFiles.some((name) => name.toLowerCase().startsWith('front-public.'))) {
			warnings.push('建议提供 front-public.jpg 作为正面图。');
		}
		for (const name of validFiles) {
			if (/(master|original|raw|主档|原始)/i.test(name)) {
				errors.push(`图片“${name}”疑似主档或原始文件，请只放发布副本。`);
			}
		}
		item.imageFiles = validFiles.sort((a, b) => imageSortWeight(a) - imageSortWeight(b));
		item.imageFolder = imageInfo.folderPath;
	}
	return { errors, warnings };
};

// ---------- 接口调用 ----------

const adminHeaders = {
	'Content-Type': 'application/json',
	'X-Ljm-Admin-Request': '1',
};

const postJson = async (requestPath, payload, { retries = 0, operationId = randomUUID(), stepId = randomUUID() } = {}) => {
	for (let attempt = 0; attempt <= retries; attempt += 1) {
		try {
			const response = await fetch(`${serverUrl}${requestPath}`, {
				method: 'POST',
				headers: { ...adminHeaders, 'X-LJM-Operation-Id': operationId, 'X-LJM-Step-Id': stepId },
				body: JSON.stringify(payload),
			});
			const body = await response.json().catch(() => ({}));
			if (!response.ok) throw Object.assign(new Error(body.error ?? `HTTP ${response.status}`), { code: body.code, operation: body.operation });
			return body;
		} catch (error) {
			const isNetworkError = ['TypeError', 'SystemError'].includes(error?.constructor?.name) || error?.cause?.code;
			if (attempt >= retries || !isNetworkError) throw error;
			await new Promise((resolve) => setTimeout(resolve, 1000 * 2 ** attempt));
		}
	}
	return null;
};

const sha256File = async (filePath) => createHash('sha256').update(await fs.readFile(filePath)).digest('hex');

const preflightImages = async (items) => {
	const files = [];
	for (const item of items) {
		for (const name of item.imageFiles ?? []) {
			const filePath = path.join(item.imageFolder, name);
			const stat = await fs.stat(filePath);
			files.push({
				client_id: `${item.tempId}/${name}`,
				name,
				type: imageTypes.get(path.extname(name).toLowerCase()),
				size: stat.size,
				sha256: await sha256File(filePath),
			});
		}
	}
	const problems = [];
	for (let start = 0; start < files.length; start += 50) {
		const chunk = files.slice(start, start + 50);
		if (!chunk.length) break;
		const result = await postJson('/api/preflight-images', { files: chunk });
		for (const file of result.files ?? []) {
			if (!file.accepted) problems.push(`${file.client_id}：${file.messages.join('；')}`);
		}
	}
	return problems;
};

const buildDraftPayload = (item, confirmedPublicationCopies) => {
	const core = { ...draftCoreDefaults, ...item.parsed.core, item_id: '' };
	return {
		isNew: true,
		expectedRevision: 'new',
		confirmedPublicationCopies,
		record: {
			core,
			metadata: { schema: objectSchema[core.object_type], dimensions: item.parsed.dimensions },
			public_view: {
				description: item.parsed.view.description ?? '',
				transcription: item.parsed.view.transcription ?? '',
				tags: item.parsed.view.tags ?? [],
				...(item.parsed.view.image_descriptions ? { image_descriptions: item.parsed.view.image_descriptions } : {}),
			},
		},
		images: item.encodedImages,
	};
};

const encodeItemImages = async (item) => {
	const images = [];
	let totalBytes = 0;
	for (const name of item.imageFiles) {
		const filePath = path.join(item.imageFolder, name);
		const buffer = await fs.readFile(filePath);
		totalBytes += buffer.length;
		if (buffer.length === 0 || buffer.length > maximumImageBytes) {
			throw new Error(`图片“${name}”为空或超过 30 MB。`);
		}
		if (totalBytes > maximumItemPayloadBytes) {
			throw new Error('这件藏品的图片总量过大，请拆小后在管理页面单独补充。');
		}
		const mimeType = imageTypes.get(path.extname(name).toLowerCase());
		images.push({ kind: 'new', originalName: name, publicationName: name, data: `data:${mimeType};base64,${buffer.toString('base64')}` });
	}
	return images;
};

// ---------- 结果记录 ----------

const resultPath = (batchDirectory) => path.join(batchDirectory, '_result.csv');

// 编号与摘要写在批次私密目录；不保存题名、正文、图片或其他档案内容。
// 先以独占创建方式固定编号，再发请求。即使未收到响应或两个进程同时启动，也会使用同一项操作。
const operationPath = (batchDirectory, tempId) => path.join(batchDirectory, '_operations', `${createHash('sha256').update(tempId).digest('hex')}.json`);
const readBatchOperation = async (batchDirectory, tempId) => {
	try {
		const operation = JSON.parse(await fs.readFile(operationPath(batchDirectory, tempId), 'utf8'));
		if (operation.version !== 1 || operation.server !== serverUrl || !/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(operation.operationId ?? '') ||
			!/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(operation.stepId ?? '') || !/^[a-f0-9]{64}$/.test(operation.payloadHash ?? '')) {
			throw new Error('批次操作记录与当前服务不一致或已损坏，已停止重新建档。请先人工核对。');
		}
		return operation;
	} catch (error) { if (error.code === 'ENOENT') return null; throw error; }
};
const getBatchOperation = async (batchDirectory, tempId, payload) => {
	const payloadHash = createHash('sha256').update(JSON.stringify(payload)).digest('hex');
	const previous = await readBatchOperation(batchDirectory, tempId);
	if (previous) {
		if (previous.payloadHash !== payloadHash) throw new Error('该临时编号曾发起保存，本次内容与原操作不同。请先核对原操作结果，再为修正后的资料建立新批次。');
		return previous;
	}
	await fs.mkdir(path.dirname(operationPath(batchDirectory, tempId)), { recursive: true });
	try {
		await fs.writeFile(operationPath(batchDirectory, tempId), `${JSON.stringify({ version: 1, server: serverUrl, operationId: randomUUID(), stepId: randomUUID(), payloadHash })}\n`, { flag: 'wx', mode: 0o600 });
	} catch (error) { if (error.code !== 'EEXIST') throw error; }
	return getBatchOperation(batchDirectory, tempId, payload);
};
const batchOperationReceipt = async (operation) => {
	const data = await fetchJson(`/api/operations/${operation.operationId}`);
	return (data.operations ?? []).find((entry) => entry.stepId === operation.stepId && entry.kind === 'save-draft');
};
const successfulReceiptItemId = (receipt) => {
	const itemId = receipt?.status === 'succeeded' ? receipt.result?.itemId : '';
	return /^LJM-\d{8}-[A-Z]{3}-\d{3}$/.test(itemId ?? '') ? itemId : '';
};

const loadCompletedResults = async (batchDirectory) => {
	const completed = new Map();
	try {
		const rows = parseCsv(decodeCsvText(await fs.readFile(resultPath(batchDirectory))));
		for (const cells of rows.slice(1)) {
			if (cells[1] === '成功') completed.set(cells[0], cells[2]);
		}
	} catch { /* 首次执行没有结果文件 */ }
	return completed;
};

const writeResults = async (batchDirectory, results) => {
	const lines = ['临时编号,状态,永久编号,说明'];
	for (const row of results) {
		lines.push([row.tempId, row.status, row.itemId ?? '', row.message ?? ''].map(csvEscape).join(','));
	}
	await fs.writeFile(resultPath(batchDirectory), '\ufeff' + lines.join('\r\n') + '\r\n', 'utf8');
};

// ---------- 主流程 ----------

const main = async () => {
	const args = process.argv.slice(2).filter((arg) => arg !== '--');
	const batchDirectoryArg = args.find((arg) => !arg.startsWith('--'));
	const apply = args.includes('--apply');
	const confirmedPublicationCopies = args.includes('--confirmed-publication-copies');
	if (!batchDirectoryArg) usage();
	const batchDirectory = path.resolve(batchDirectoryArg);

	let health;
	try {
		health = await fetchJson('/healthz');
	} catch {
		throw new Error('本地档案管理服务没有运行。请先运行 node local-admin/server.mjs，再执行本脚本。');
	}
	if (!health?.capabilities?.publicationImageNames) {
		throw new Error('管理服务尚不支持保留批次图片的正背面命名。请更新并重启本地管理服务后重试，避免第二幅照片被误存为背面。');
	}
	if (health.capabilities.writeProtocol !== 2) throw new Error('管理服务尚未启用统一写入保护，请更新并重启管理服务后再入站。');

	const csvBuffer = await fs.readFile(path.join(batchDirectory, 'items.csv')).catch(() => {
		throw new Error('批次目录中缺少 items.csv。');
	});
	const rows = parseCsv(decodeCsvText(csvBuffer));
	if (rows.length < 2) throw new Error('items.csv 中没有藏品数据行。');
	const headers = rows[0].map((cell) => cell.trim());
	if (!headers.includes('temp_id')) throw new Error('items.csv 第一列必须是 temp_id（临时编号，与 images/ 下的图片文件夹同名）。');

	const [standards, imageIndex, completed] = await Promise.all([
		loadStandards(),
		loadBatchImages(batchDirectory),
		loadCompletedResults(batchDirectory),
	]);

	const items = rows.slice(1).map((cells, index) => ({
		tempId: (cells[headers.indexOf('temp_id')] ?? '').trim(),
		rowNumber: index + 2,
		parsed: parseRow(headers, cells, standards),
	}));
	// 在图片预检之前恢复已成功的收据，否则“已保存但响应丢失”的图片会被误报为重复。
	for (const item of items) {
		if (completed.has(item.tempId)) continue;
		const operation = await readBatchOperation(batchDirectory, item.tempId);
		if (!operation) continue;
		const receipt = await batchOperationReceipt(operation);
		const itemId = successfulReceiptItemId(receipt);
		if (itemId) completed.set(item.tempId, itemId);
		else if (receipt) throw new Error(`${item.tempId} 的原操作状态为 ${receipt.status}，本次停止重新建档。请先在管理页核对；未成功的修正资料需建立新批次。操作编号：${operation.operationId}`);
	}

	const seenTempIds = new Set();
	let errorCount = 0;
	let warningCount = 0;
	for (const item of items) {
		const { errors, warnings } = validateItem(item, standards, imageIndex);
		if (seenTempIds.has(item.tempId)) errors.push(`temp_id“${item.tempId}”在表格中重复。`);
		seenTempIds.add(item.tempId);
		item.errors = errors;
		item.warnings = warnings;
		errorCount += errors.length;
		warningCount += warnings.length;
	}

	console.log(`\n批次目录：${batchDirectory}`);
	console.log(`共读取 ${items.length} 件藏品，其中 ${completed.size} 件此前已成功保存草稿。\n`);
	for (const item of items) {
		const skip = completed.has(item.tempId);
		const mark = skip ? '⊘ 跳过' : item.errors.length ? '✗ 有问题' : '✓ 通过';
		console.log(`${mark}  第 ${item.rowNumber} 行  ${item.tempId}  ${item.parsed.core.title ?? ''}`);
		for (const message of item.errors) console.log(`      错误：${message}`);
		for (const message of item.warnings) console.log(`      提醒：${message}`);
		if (skip) console.log(`      已在草稿中：${completed.get(item.tempId)}`);
	}

	const pendingItems = items.filter((item) => !completed.has(item.tempId));
	if (pendingItems.length && !errorCount) {
		const preflightProblems = await preflightImages(pendingItems);
		if (preflightProblems.length) {
			errorCount += preflightProblems.length;
			console.log('\n图片预检发现问题：');
			for (const problem of preflightProblems) console.log(`      错误：${problem}`);
		}
	}

	console.log(`\n检查完成：${errorCount} 个错误，${warningCount} 个提醒。`);
	if (errorCount) {
		console.log('存在错误，本次不写入任何数据。请修改 items.csv 或图片后重新执行。');
		process.exitCode = 2;
		return;
	}

	if (!apply) {
		console.log('\n这是干跑检查，没有写入任何数据。');
		console.log('确认无误后，请执行：');
		console.log(`  node local-admin/batch-intake.mjs "${batchDirectoryArg}" --apply --confirmed-publication-copies`);
		console.log('其中 --confirmed-publication-copies 表示你本人确认：所有图片都是经过筛选和必要脱敏的发布副本。');
		return;
	}
	if (!confirmedPublicationCopies) {
		throw new Error('正式执行必须加上 --confirmed-publication-copies，表示你本人确认所有图片都是经过筛选和必要脱敏的发布副本。');
	}
	if (!pendingItems.length) {
		await writeResults(batchDirectory, items.map(item => ({ tempId: item.tempId, status: '成功', itemId: completed.get(item.tempId), message: '已核对原操作收据或既有结果，本次跳过' })));
		console.log('没有需要保存的新藏品，全部已在草稿中。');
		return;
	}

	console.log(`\n开始保存草稿（共 ${pendingItems.length} 件，逐件进行）……\n`);
	const results = items.filter(item => completed.has(item.tempId)).map(item => ({
		tempId: item.tempId, status: '成功', itemId: completed.get(item.tempId), message: '此前已成功，本次跳过',
	}));
	for (const item of items) {
		if (completed.has(item.tempId)) {
			continue;
		}
		try {
			item.encodedImages = await encodeItemImages(item);
			const payload = buildDraftPayload(item, confirmedPublicationCopies);
			const operation = await getBatchOperation(batchDirectory, item.tempId, payload);
			const saved = await postJson('/api/save-draft', payload, { retries: 2, ...operation });
			const itemId = saved.draft?.record?.core?.item_id ?? successfulReceiptItemId(saved.operation);
			if (!/^LJM-\d{8}-[A-Z]{3}-\d{3}$/.test(itemId ?? '')) throw new Error(`保存结果待核对，已停止重新建档。操作编号：${operation.operationId}`);
			results.push({ tempId: item.tempId, status: '成功', itemId, message: saved.replayed ? '已从原操作收据恢复，请核对草稿' : '' });
			console.log(`✓ ${item.tempId} → ${itemId}`);
		} catch (error) {
			results.push({ tempId: item.tempId, status: '失败', itemId: '', message: error.message });
			console.log(`✗ ${item.tempId}：${error.message}`);
		} finally {
			item.encodedImages = null;
			await writeResults(batchDirectory, results);
		}
	}
	await writeResults(batchDirectory, results);

	const succeeded = results.filter((row) => row.status === '成功').length;
	const failed = results.length - succeeded;
	console.log(`\n本次执行结束：成功 ${succeeded} 件，失败 ${failed} 件。结果已写入 ${resultPath(batchDirectory)}`);
	if (failed) {
		console.log('再次执行会先核对原操作收据，已成功的行自动跳过。结果待核对时不会重新建档；请先核对管理页，再处理失败资料。');
		process.exitCode = 3;
		return;
	}
	console.log('草稿已全部保存。请打开 http://127.0.0.1:4173/admin/ 逐件核对并完成隐私确认后再正式发布。');
};

main().catch((error) => {
	console.error(`\n执行中止：${error.message}`);
	process.exitCode = 1;
});
