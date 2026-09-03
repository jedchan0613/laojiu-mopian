const managedCoreFields = new Set([
	'record_status', 'item_id', 'collection_code', 'privacy_level', 'use_status', 'master_file_path',
	'access_file_path', 'publication_file_path', 'created_date', 'updated_date', 'id_check', 'required_check',
]);
const itemIdPattern = /^LJM-\d{8}-[A-Z]{3}-\d{3}$/;

const primaryCoreFields = [
	'accession_date', 'object_type', 'title', 'batch_id', 'date_display',
	'acquisition_method', 'source_name', 'source_place', 'provenance_notes', 'physical_location',
	'notes',
];

const hiddenCommonFieldCodes = new Set([
	'place_code', 'person_ids', 'people_count', 'relationships', 'organization_ids', 'evidence_basis',
]);

const hiddenSpecificFieldCodes = new Set(['place_code', 'evidence_basis', 'dispatch_post_office', 'stamp_issue']);
const administrativeRegionListIds = {
	province: 'administrative-province-options',
	city: 'administrative-city-options',
	district: 'administrative-district-options',
};
const administrativeRegionValueKeys = { province: 'provinces', city: 'cities', district: 'districts' };

const arrayFields = new Set([
	'tags', 'place_filters',
	'person_ids', 'people', 'relationships', 'identities', 'organization_ids', 'organizations',
	'event_scene', 'themes', 'studio_photographer', 'verso_types', 'mark_types', 'related_item_ids',
	'condition_details', 'access_file_path', 'publication_file_path', 'use_project', 'publication_reference',
	'image_place_code', 'image_place_text', 'dispatch_place', 'dispatch_post_office', 'transit_dates',
	'sender_person_id', 'sender_name', 'sender_address', 'recipient_person_id', 'recipient_name',
	'recipient_title', 'correspondence_relationship', 'publisher', 'publisher_place', 'publisher_id',
	'printer', 'manufacturer', 'printer_place', 'creator_name', 'creator_role', 'creator_id',
	'stamp_country', 'stamp_issue', 'stamp_value', 'stamp_status', 'postal_mark_types', 'language',
	'script', 'postal_route', 'date_gaps', 'creator_person_id', 'owner_person_ids', 'ownership_sequence',
	'mentioned_person_ids', 'mentioned_people', 'writing_place', 'mentioned_places', 'place_code',
	'content_genres', 'local_topics', 'life_stage', 'event_dates', 'section_titles', 'binding_type',
	'cover_material', 'leaf_structure', 'used_pages', 'writing_medium', 'ink_colors', 'inserts',
	'attachments', 'attachment_item_ids', 'annotation_layers', 'hands', 'later_additions',
	'missing_pages', 'sensitivity_types', 'restricted_ranges', 'credential_function',
	'issuing_organization_id', 'issuing_organization', 'aliases', 'occupation', 'qualification',
	'position', 'other_attributes', 'affiliation', 'rank', 'class_code', 'printed_handwritten',
	'security_features', 'seal_types', 'endorsements', 'amendments', 'cancellation_marks',
	'missing_parts', 'restricted_fields',
]);

const dateFields = new Set([
	'accession_date', 'date_start', 'date_end', 'source_date', 'last_research_date', 'scan_date',
	'created_date', 'updated_date', 'review_date', 'issue_date', 'writing_date', 'dispatch_date',
	'arrival_date', 'content_date_start', 'content_date_end', 'event_dates', 'registration_date',
	'valid_from', 'valid_to', 'birth_date',
]);

const numberFields = new Set(['width_mm', 'height_mm', 'scan_ppi']);
const integerFields = new Set(['item_seq', 'people_count', 'leaf_count', 'page_count']);
const longTextFields = new Set([
	'place_notes', 'provenance_notes', 'condition_details', 'treatment_notes', 'evidence_basis',
	'research_notes', 'next_action', 'notes', 'description', 'transcription', 'message_transcription',
	'postmark_transcription', 'image_subject', 'reuse_notes', 'portrait_notes', 'seal_transcription',
	'validity_text', 'address_masked', 'document_number_masked', 'revision_note',
]);

const specialDictionaryFields = {
	postcard_type: 'postcard_type', postcard_function: 'postcard_function', postcard_use: 'postcard_use',
	postal_mark_types: 'postal_mark', postcard_process: 'process', notebook_type: 'notebook_type',
	entry_structure: 'entry_structure', notebook_completeness: 'notebook_completeness',
	writing_medium: 'writing_medium', credential_type: 'credential_type', portrait_status: 'portrait_status',
	credential_status: 'credential_status', redaction_status: 'redaction_status',
	security_features: 'security_feature', carrier: 'carrier', color: 'color',
	process: 'process', event_scene: 'event_scene', themes: 'theme',
	privacy_level: 'privacy', transcription_status: 'transcription',
};

const wordLabels = {
	accession: '入藏', address: '地址', affiliation: '隶属', aliases: '别名', amendments: '变更',
	annotation: '批注', arrival: '到达', attachment: '附件', attachments: '附件', basis: '依据',
	binding: '装帧', birth: '出生', cancellation: '注销', carrier: '载体', class: '类别', code: '代码',
	color: '色彩', content: '内容', correspondence: '通信关系', country: '国家', cover: '封面',
	creator: '创作者', credential: '证件', date: '日期', destination: '目的地', dispatch: '寄出',
	district: '区县', document: '证件', endorsements: '签注', entry: '条目', event: '事件', evidence: '证据',
	description: '公开简介', display: '显示', file: '文件', filters: '筛选值', format: '版式', function: '功能', grade: '等级', hands: '书写者', height: '高度',
	holder: '持证人', household: '户籍', id: '编号', identities: '身份', image: '图像', ink: '墨水',
	inserts: '插页', issue: '签发／发行', issuing: '签发', language: '语言', later: '后加内容',
	leaf: '页叶', legibility: '可读性', level: '等级', life: '生活', local: '地方', manufacturer: '制造者',
	mark: '标记', masked: '已遮盖', material: '材料', message: '正文', mentioned: '涉及', method: '方式',
	missing: '缺失', name: '名称', nationality: '国籍', notebook: '册簿', notes: '说明', number: '号码',
	occupation: '职业', office: '邮局', organization: '机构', organizations: '机构', orientation: '方向',
	original: '原始', owner: '所有者', ownership: '所有权流转', page: '页', paper: '纸张', people: '人物',
	person: '人物', place: '地点', portrait: '肖像', position: '位置／职务', postal: '邮政', postcard: '明信片',
	printer: '印刷者', printed: '印刷', privacy: '隐私', process: '工艺', province: '省', publication: '发布',
	publisher: '发行者', qualification: '资格', rank: '级别', reason: '原因', recipient: '收件人',
	record: '记录', redaction: '遮盖', registration: '登记', relationships: '关系', restricted: '限制',
	return: '退回', reuse: '再利用', role: '角色', script: '文字', seal: '印章', security: '防伪', tags: '标签',
	sender: '寄件人', sensitivity: '敏感内容', serial: '序列', sex: '性别', shot: '拍摄', source: '来源',
	specific: '具体', stamp: '邮票', status: '状态', street: '街道', structure: '结构', studio: '摄影来源',
	subject: '主题', themes: '主题', time: '时间', title: '称谓／题名', town: '乡镇', transcription: '转录',
	transit: '经转', treatment: '处理', type: '类型', types: '类型', unit: '单位', use: '使用', used: '使用范围',
	valid: '有效', validity: '有效期', value: '面值', verso: '背面', width: '宽度', work: '工作', writing: '书写',
};

const privacyChecks = [
	'图片和公开文字中没有未遮盖的身份证号、护照号或其他身份识别号码。',
	'没有银行卡号、账户号码或其他完整卡号。',
	'没有电话号码或其他私人联系方式。',
	'没有门牌号、收件地址等精确私人住址。',
	'没有可以直接复制或辨认的清晰签名。',
	'没有病历、诊断、处方或其他医疗信息。',
	'没有未成年人及其私人信息。',
	'没有明显私人日记、亲密关系或其他极私密内容。',
	'不存在未经判断的可识别真实人物；如存在，我已人工判断并明确决定允许公开。',
	'没有未经确认的负面描述、指控或可能损害他人名誉的内容。',
	'已把已知事实、合理推测和未知内容清楚区分。',
	'所有图片都是经过筛选的 JPG、PNG 或 WebP 发布副本，不是 TIFF、RAW、原始扫描件或唯一主档。',
	'已完成必要遮盖，不再需要进一步脱敏处理。',
];

const state = {
	records: [], standards: null, dictionary: new Map(), commonFields: new Map(), activeId: null,
	current: null, isNew: false, dirty: false, search: '', activeTab: 'basic', images: [],
	confirmedPublicationCopies: false, workspaceMode: 'records', drafts: [], history: [], recycleBin: [],
	pendingRemovedImages: [], validationIssues: [], pendingObjectCategory: '', recordStatusFilter: 'normal',
	integrityReport: null, imagePreflight: [], adminMode: 'local', publicSiteUrl: '',
	query: {
		loaded: false, loading: false, error: '', records: [], selectedId: '', status: 'normal',
		search: '', category: '', objectType: '', decade: '', research: '', evidence: '', rights: '',
		imageStatus: '', page: 1, pageSize: 50,
	},
};

const publicPreviewUrl = (pathname = '/') => {
	if (state.adminMode !== 'online' || !state.publicSiteUrl) return pathname;
	const normalizedPath = pathname.startsWith('/') ? pathname : `/${pathname}`;
	return `${state.publicSiteUrl}${normalizedPath}`;
};

const elements = {
	recordList: document.querySelector('#record-list'), recordCount: document.querySelector('#record-count'),
	recordSearch: document.querySelector('#record-search'), recordTitle: document.querySelector('#record-title'),
	recordId: document.querySelector('#record-id'), recordKicker: document.querySelector('#record-kicker'),
	editorSurface: document.querySelector('#editor-surface'), previewLink: document.querySelector('#preview-link'),
	newRecordButton: document.querySelector('#new-record-button'), saveDraftButton: document.querySelector('#save-draft-button'),
	publishButton: document.querySelector('#publish-button'), toast: document.querySelector('#toast'),
	headerActions: document.querySelector('#header-actions'), recordActionDock: document.querySelector('#record-action-dock'),
	dockSaveState: document.querySelector('#dock-save-state'),
	dockSaveDraftButton: document.querySelector('#dock-save-draft-button'),
	dockPublishButton: document.querySelector('#dock-publish-button'),
	busyOverlay: document.querySelector('#busy-overlay'), busyTitle: document.querySelector('#busy-title'),
	busyDetail: document.querySelector('#busy-detail'), saveState: document.querySelector('#save-state'),
	recordsBadge: document.querySelector('#records-badge'), draftsBadge: document.querySelector('#drafts-badge'),
	queryBadge: document.querySelector('#query-badge'),
	maintenanceBadge: document.querySelector('#maintenance-badge'),
	recycleBadge: document.querySelector('#recycle-badge'), historyBadge: document.querySelector('#history-badge'),
	normalRecordsBadge: document.querySelector('#normal-records-badge'),
	withdrawnRecordsBadge: document.querySelector('#withdrawn-records-badge'),
	recordStatusNav: document.querySelector('#record-status-nav'), lifecycleButton: document.querySelector('#lifecycle-button'),
	similarRecordButton: document.querySelector('#similar-record-button'),
	recordMoreActions: document.querySelector('#record-more-actions'),
	recordMoreActionsLabel: document.querySelector('#record-more-actions-label'),
	mobileRecordBrowserToggle: document.querySelector('#mobile-record-browser-toggle'),
	recordBrowserContent: document.querySelector('#record-browser-content'),
	taskSummary: document.querySelector('#task-summary'), taskSummaryTitle: document.querySelector('#task-summary-title'),
	taskSummaryDetail: document.querySelector('#task-summary-detail'), taskChips: document.querySelector('#task-chips'),
	withdrawDialog: document.querySelector('#withdraw-dialog'), withdrawRecordLabel: document.querySelector('#withdraw-record-label'),
	withdrawReason: document.querySelector('#withdraw-reason'), withdrawConfirmation: document.querySelector('#withdraw-confirmation'),
	confirmWithdrawButton: document.querySelector('#confirm-withdraw-button'), tabs: document.querySelector('.tabs'),
};

const deepClone = (value) => JSON.parse(JSON.stringify(value));
const setMobileRecordBrowserOpen = (open) => {
	if (!elements.mobileRecordBrowserToggle || !elements.recordBrowserContent) return;
	elements.recordBrowserContent.classList.toggle('is-open', open);
	elements.mobileRecordBrowserToggle.setAttribute('aria-expanded', String(open));
	const stateLabel = elements.mobileRecordBrowserToggle.querySelector('small');
	if (stateLabel) stateLabel.textContent = open ? '收起' : '展开';
};
const escapeHtml = (value = '') => String(value).replace(/[&<>'"]/g, (character) =>
	({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[character]);
const today = () => new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Shanghai' });
const formatDateTime = (value) => {
	if (!value) return '时间未知';
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) return String(value);
	return new Intl.DateTimeFormat('zh-CN', {
		timeZone: 'Asia/Shanghai', year: 'numeric', month: '2-digit', day: '2-digit',
		hour: '2-digit', minute: '2-digit',
	}).format(date);
};
const schemaForType = (objectType) => {
	if (['PHO', 'NEG', 'SLD', 'ALB'].includes(objectType)) return 'photo';
	if (['PCD', 'PST'].includes(objectType)) return 'postcard';
	if (['DIA', 'NTB'].includes(objectType)) return 'diary_notebook';
	if (objectType === 'IDC') return 'credential';
	return 'common';
};

const specificSchemaLabels = {
	photo: '照片专属信息',
	postcard: '明信片专属信息',
	diary_notebook: '日记／笔记专属信息',
	credential: '证件专属信息',
};

const hasMeaningfulValue = (value) =>
	value !== undefined && value !== null && value !== '' &&
	(!Array.isArray(value) || value.some((entry) => hasMeaningfulValue(entry)));

const normalizeRuleField = (field) =>
	typeof field === 'string' ? { field_code: field, scope: 'metadata' } : field;

const coreCanonicalFieldCodes = () =>
	new Set(state.standards?.fieldRouting?.core_canonical_fields ?? []);

const dimensionFieldCodes = () => new Set(
	Object.values(state.standards?.dimensions ?? {})
		.flatMap((standard) => standard?.dimensions ?? [])
		.flatMap((dimension) => dimension.fields ?? []),
);

const basicFieldRule = (fieldCode) => {
	const matches = [];
	for (const dimension of currentCollectionRules()?.required_dimensions ?? []) {
		const fields = (dimension.fields ?? []).map(normalizeRuleField);
		const codeFields = (dimension.code_fields ?? []).map(normalizeRuleField);
		if (!fields.some((field) => field.field_code === fieldCode && field.scope === 'core')) continue;
		matches.push({
			dimension,
			isCodeField: codeFields.some((field) => field.field_code === fieldCode && field.scope === 'core'),
		});
	}
	if (!matches.length) return { required: false, context: '' };
	const required = matches.some((match) => match.isCodeField);
	const context = matches.map(({ dimension, isCodeField }) =>
		`${dimension.dimension_code} · ${dimension.name}：${isCodeField ? '对象专属必填编码字段' : '对象专属必填维度，同组至少填写一项'}`).join('；');
	return { required, context };
};

const currentCollectionRules = () =>
	state.standards?.collectionCodeRules?.schemas?.[state.current?.metadata?.schema] ?? null;

const collectionRuleFieldValue = (dimensionCode, field) => {
	const definition = normalizeRuleField(field);
	if (definition.scope === 'core') return state.current?.core?.[definition.field_code];
	const metadataValue = state.current?.metadata?.dimensions?.[dimensionCode]?.[definition.field_code];
	return hasMeaningfulValue(metadataValue)
		? metadataValue
		: state.current?.core?.[definition.field_code];
};

const toCollectionCodeToken = (code) => {
	const value = String(code ?? '');
	const separatorIndex = value.indexOf('-');
	return separatorIndex >= 0 ? value.slice(separatorIndex + 1) : value;
};

const toCollectionTextToken = (value) => String(value ?? '').trim().toUpperCase()
	.replace(/[\s_+\\/|]+/g, '-')
	.replace(/[‐‑‒–—―]+/g, '-')
	.replace(/-+/g, '-')
	.replace(/^-|-$/g, '');

const getCollectionCodeResult = () => {
	const rules = currentCollectionRules();
	const objectType = state.current?.core?.object_type;
	const allowedObjectTypes = new Set((state.dictionary.get('object_type') ?? []).map((entry) => entry.code));
	const segments = allowedObjectTypes.has(objectType) ? [objectType] : [];
	const issues = [];
	for (const field of state.standards?.collectionCodeRules?.global_code_fields ?? []) {
		const value = state.current?.core?.[field.field_code];
		if (!hasMeaningfulValue(value)) {
			if (field.required) issues.push({
				code: `collection_code_required_${field.field_code}`,
				tab: 'basic',
				field: field.field_code,
				message: `${field.name ?? humanFieldLabel(field.field_code)}是藏品编码组成字段，必须填写。`,
			});
			continue;
		}
		const token = field.encoding === 'normalized_text'
			? toCollectionTextToken(value)
			: String(value).trim();
		if (!token) {
			issues.push({
				code: `collection_code_invalid_${field.field_code}`,
				tab: 'basic',
				field: field.field_code,
				message: `${field.name ?? humanFieldLabel(field.field_code)}无法生成有效的藏品编码片段。`,
			});
			continue;
		}
		segments.push(token);
	}
	for (const dimension of rules?.required_dimensions ?? []) {
		const normalizedFields = (dimension.fields ?? []).map(normalizeRuleField);
		const hasDimensionValue = (dimension.fields ?? [])
			.some((field) => hasMeaningfulValue(collectionRuleFieldValue(dimension.dimension_code, field)));
		if (!hasDimensionValue) {
			const issueField = normalizedFields[0] ?? { field_code: '', scope: 'metadata' };
			const allCore = normalizedFields.length > 0 && normalizedFields.every((field) => field.scope === 'core');
			issues.push({
				code: `collection_required_${dimension.dimension_code}`,
				tab: allCore ? 'basic' : 'specific',
				field: issueField.field_code,
				message: `${dimension.dimension_code} · ${dimension.name}为必填维度，请至少填写一项。`,
			});
		}
		const dimensionCodes = [];
		for (const codeField of dimension.code_fields ?? []) {
			const value = collectionRuleFieldValue(dimension.dimension_code, codeField);
			const values = (Array.isArray(value) ? value : [value]).filter(hasMeaningfulValue);
			if (!values.length) {
				if (hasDimensionValue) issues.push({
					code: `collection_code_required_${dimension.dimension_code}_${codeField.field_code}`,
					tab: codeField.scope === 'core' ? 'basic' : 'specific',
					field: codeField.field_code,
					message: `${dimension.dimension_code} · ${dimension.name}需要填写可编码的${humanFieldLabel(codeField.field_code)}。`,
				});
				continue;
			}
			const allowed = new Set((state.dictionary.get(codeField.dictionary_key) ?? []).map((entry) => entry.code));
			for (const code of values) {
				if (!allowed.has(code)) {
					issues.push({
						code: `collection_code_invalid_${dimension.dimension_code}_${codeField.field_code}_${code}`,
						tab: codeField.scope === 'core' ? 'basic' : 'specific',
						field: codeField.field_code,
						message: `${dimension.dimension_code} · ${dimension.name}中的 ${code} 未匹配正式代码字典。`,
					});
					continue;
				}
				const shortCode = toCollectionCodeToken(code);
				if (!dimensionCodes.includes(shortCode)) dimensionCodes.push(shortCode);
			}
		}
		if (dimensionCodes.length) segments.push(dimensionCodes.join('+'));
	}
	return { code: segments.join('_'), issues };
};

const getCollectionCodeBreakdown = () => (currentCollectionRules()?.required_dimensions ?? [])
	.filter((dimension) => dimension.code_fields?.length)
	.map((dimension) => {
		const fields = dimension.code_fields.map((codeField) => {
			const rawValue = collectionRuleFieldValue(dimension.dimension_code, codeField);
			const values = (Array.isArray(rawValue) ? rawValue : [rawValue]).filter(hasMeaningfulValue);
			const options = state.dictionary.get(codeField.dictionary_key) ?? [];
			const selections = values.map((code) => {
				const option = options.find((candidate) => candidate.code === code);
				return {
					code,
					shortCode: toCollectionCodeToken(code),
					label: option?.label ?? '未匹配代码字典',
					matched: Boolean(option),
				};
			});
			return {
				fieldCode: codeField.field_code,
				fieldName: humanFieldLabel(codeField.field_code),
				dictionaryKey: codeField.dictionary_key,
				selections,
			};
		});
		const codes = [...new Set(fields.flatMap((field) =>
			field.selections.filter((selection) => selection.matched).map((selection) => selection.shortCode)))];
		return {
			dimensionCode: dimension.dimension_code,
			dimensionName: dimension.name,
			segment: codes.join('+'),
			fields,
		};
	});

const renderCollectionCodeLogic = () => {
	const breakdown = getCollectionCodeBreakdown();
	const objectType = state.current?.core?.object_type ?? '';
	const dateDisplay = state.current?.core?.date_display ?? '';
	const dateDisplayToken = toCollectionTextToken(dateDisplay);
	const objectTypeOption = (state.dictionary.get('object_type') ?? [])
		.find((option) => option.code === objectType);
	const objectTypeDetail = `<li>
		<div class="code-dimension-heading"><strong>藏品大类 · 正式对象类型</strong>
		<code>${escapeHtml(objectTypeOption ? objectType : '待填写')}</code></div>
		<ul><li><span>资料类型 <small>object_type · object_type</small></span>
			<strong>${objectTypeOption ? `${escapeHtml(objectTypeOption.label)}（${escapeHtml(objectType)}）` : '待填写'}</strong></li></ul>
	</li>`;
	const dateDisplayDetail = `<li>
		<div class="code-dimension-heading"><strong>显示年代 · 基本信息</strong>
		<code>${escapeHtml(dateDisplayToken || '待填写')}</code></div>
		<ul><li><span>显示年代 <small>date_display · 规范化文字</small></span>
			<strong>${dateDisplayToken ? `${escapeHtml(dateDisplay)} → ${escapeHtml(dateDisplayToken)}` : '待填写'}</strong></li></ul>
	</li>`;
	return `<details class="code-logic-details"><summary><span>编码生成逻辑</span><small>${breakdown.length + 2} 个组成项 · 点击查看</small></summary>
		<div class="code-logic-content"><div class="code-logic-intro">
		<p>第一段写入藏品大类的正式对象类型代码，例如明信片为 <code>PST</code>；第二段写入基本信息中必填的显示年代，例如 <code>1979</code>。显示年代会去除空格，并把斜线、下划线等分隔符规范为短横线。随后只取 Excel 打勾维度中能够匹配正式代码字典的必填字段；正式代码去掉第一个短横线及其前缀，例如 <code>PT-VIEW</code> 取 <code>VIEW</code>。不写入 <code>PC01</code> 等维度编号，各段用 <code>_</code> 连接，同一维度内多个代码仍用 <code>+</code>，不包含永久编号。</p></div>
		<ol class="code-logic-list">${objectTypeDetail}${dateDisplayDetail}${breakdown.map((dimension) => `<li>
			<div class="code-dimension-heading"><strong>${escapeHtml(dimension.dimensionCode)} · ${escapeHtml(dimension.dimensionName)}</strong>
			<code>${escapeHtml(dimension.segment || '待填写')}</code></div>
			<ul>${dimension.fields.map((field) => `<li><span>${escapeHtml(field.fieldName)} <small>${escapeHtml(field.fieldCode)} · ${escapeHtml(field.dictionaryKey)}</small></span>
				<strong>${field.selections.length ? field.selections.map((selection) =>
					`${escapeHtml(selection.label)}（${escapeHtml(selection.code)} → ${escapeHtml(selection.shortCode)}）`).join('、') : '待填写'}</strong></li>`).join('')}</ul>
		</li>`).join('')}</ol>${breakdown.length ? '' : '<p class="code-logic-empty">当前对象类型没有专属编码维度，因此收藏品编码由大类代码和显示年代组成。</p>'}</div></details>`;
};

const updateDerivedCollectionCode = () => {
	if (!state.current?.core) return;
	state.current.core.collection_code = getCollectionCodeResult().code;
};

const updateCollectionCodeDisplays = () => {
	const displayValue = state.current?.core?.collection_code || '请先填写收藏品编码组成字段';
	elements.editorSurface?.querySelectorAll('[data-collection-code-output]').forEach((element) => {
		if (element instanceof HTMLInputElement) element.value = displayValue;
		else element.textContent = displayValue;
	});
	elements.editorSurface?.querySelectorAll('[data-collection-code-logic]').forEach((element) => {
		const wasOpen = element.querySelector('details')?.open;
		element.innerHTML = renderCollectionCodeLogic();
		if (wasOpen) element.querySelector('details')?.setAttribute('open', '');
	});
};

let toastTimer;
const showToast = (message, isError = false) => {
	clearTimeout(toastTimer);
	elements.toast.textContent = message;
	elements.toast.classList.toggle('is-error', isError);
	elements.toast.setAttribute('role', isError ? 'alert' : 'status');
	elements.toast.setAttribute('aria-live', isError ? 'assertive' : 'polite');
	elements.toast.classList.add('is-visible');
	toastTimer = setTimeout(() => {
		elements.toast.classList.remove('is-visible');
		elements.toast.setAttribute('role', 'status');
		elements.toast.setAttribute('aria-live', 'polite');
	}, 4200);
};

const setBusy = (busy, title = '正在处理…', detail = '请保持这个窗口打开') => {
	elements.busyOverlay.hidden = !busy;
	elements.busyTitle.textContent = title;
	elements.busyDetail.textContent = detail;
};

const readApiJson = async (response) => {
	const contentType = response.headers.get('content-type') ?? '';
	if (!contentType.includes('application/json')) {
		if (response.redirected || response.status === 401 || response.status === 403) {
			throw new Error('登录状态已失效，请刷新页面并重新登录。');
		}
		throw new Error('管理服务返回了无法识别的内容，请刷新页面重试。');
	}
	return response.json();
};

const apiPost = async (url, payload) => {
	const response = await fetch(url, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json', 'X-LJM-Admin-Request': '1' },
		body: JSON.stringify(payload),
	});
	const data = await readApiJson(response);
	if (!response.ok) {
		const error = new Error(data.error ?? '管理操作没有完成。');
		error.issues = data.issues ?? [];
		throw error;
	}
	return data;
};

const isWithdrawn = () => state.current?.core?.record_status === 'WDR' && !state.current?._admin?.hasDraft;
const recordIsWithdrawn = (record) => record?.core?.record_status === 'WDR' && !record?._admin?.hasDraft;
const statusLabel = (record) => {
	if (record._admin?.restoredFromWithdrawal) return '恢复草稿';
	if (record._admin?.hasDraft) return record._admin.hasOfficial ? '有未发布修改' : '草稿';
	if (record.core.record_status === 'WDR') return '已撤销';
	if (record.core.use_status === 'U3') return '已发布';
	if (record.core.use_status === 'U1') return '候选';
	return '未发布';
};

const filteredRecords = () => {
	const query = state.search.trim().toLocaleLowerCase('zh-CN');
	const records = state.records.filter((record) =>
		state.recordStatusFilter === 'withdrawn' ? recordIsWithdrawn(record) : !recordIsWithdrawn(record));
	if (!query) return records;
	return records.filter((record) => [
		record.core.item_id, record.core.collection_code, record.core.title, record.core.object_type,
	]
		.join(' ').toLocaleLowerCase('zh-CN').includes(query));
};

const queryCodeLabel = (dictionaryKey, code) => {
	if (!code) return '未填写';
	const resolvedKey = ({ evidence_level: 'evidence', rights_status: 'rights' })[dictionaryKey] ?? dictionaryKey;
	return state.dictionary.get(resolvedKey)?.find((entry) => entry.code === code)?.label ?? code;
};

const queryStatusLabel = (record) => {
	if (record.record_status === 'WDR') return '已撤销';
	if (record.has_draft && record.has_official) return '有未发布修改';
	if (record.has_draft) return '草稿';
	if (record.is_published) return '已发布';
	return '未发布';
};

const queryStructureLabel = (status) => ({
	complete: '结构完整', warning: '需要检查', missing: '没有发布图片',
})[status] ?? '状态未知';

const queryFilteredRecords = () => {
	const queryState = state.query;
	const words = queryState.search.trim().toLocaleLowerCase('zh-CN').split(/\s+/).filter(Boolean);
	return queryState.records.filter((record) => {
		if (queryState.status === 'withdrawn' ? record.record_status !== 'WDR' : record.record_status === 'WDR') return false;
		if (queryState.category && record.category !== queryState.category) return false;
		if (queryState.objectType && record.object_type !== queryState.objectType) return false;
		if (queryState.decade && record.decade !== queryState.decade) return false;
		if (queryState.research && record.research_status !== queryState.research) return false;
		if (queryState.evidence && record.evidence_level !== queryState.evidence) return false;
		if (queryState.rights && record.rights_status !== queryState.rights) return false;
		if (queryState.imageStatus && record.publication_structure_status !== queryState.imageStatus) return false;
		if (!words.length) return true;
		const haystack = [
			record.item_id, record.collection_code, record.batch_id, record.title, record.category_label,
			record.object_type, record.object_type_label, record.date_display, record.place_summary,
			record.source_name, record.source_place, ...(record.people ?? []), ...(record.organizations ?? []),
			...(record.themes ?? []), ...(record.event_scene ?? []),
		].join(' ').toLocaleLowerCase('zh-CN');
		return words.every((word) => haystack.includes(word));
	});
};

const queryOptionMarkup = (records, field, currentValue, labelFor = (value) => value) =>
	[...new Set(records.map((record) => record[field]).filter(Boolean))]
		.sort((left, right) => String(left).localeCompare(String(right), 'zh-CN'))
		.map((value) => `<option value="${escapeHtml(value)}" ${value === currentValue ? 'selected' : ''}>${escapeHtml(labelFor(value))}</option>`)
		.join('');

const renderQueryDetails = (record) => {
	if (!record) return `<aside class="query-detail"><div class="empty-state">当前条件下没有可查看的档案。</div></aside>`;
	const detailRows = [
		['永久编号', record.item_id], ['收藏品编码', record.collection_code], ['批次编号', record.batch_id],
		['类型', `${record.category_label} · ${record.object_type_label}（${record.object_type}）`],
		['年代', record.date_display], ['地点', record.place_summary], ['人物', record.people?.join('、')],
		['机构', record.organizations?.join('、')], ['来源', [record.source_name, record.source_place].filter(Boolean).join(' · ')],
		['研究状态', queryCodeLabel('research_status', record.research_status)],
		['证据等级', queryCodeLabel('evidence_level', record.evidence_level)],
		['权利状态', queryCodeLabel('rights_status', record.rights_status)],
		['隐私等级', queryCodeLabel('privacy', record.privacy_level)],
	].filter(([, value]) => value);
	const specificRows = (record.specific_summary ?? []).map((entry) => {
		const value = Array.isArray(entry.value) ? entry.value.join('、') : entry.value;
		return `<div><dt>${escapeHtml(entry.dimension_code)} · ${escapeHtml(humanFieldLabel(entry.field_code))}</dt><dd>${escapeHtml(value)}</dd></div>`;
	}).join('');
	const imageRows = record.images.length ? record.images.map((image, index) => `<li>
		<div><strong>第 ${index + 1} 张 · ${escapeHtml(image.filename)}</strong><span>${escapeHtml(image.description || '图片说明待补')}</span></div>
		<small class="query-status is-${image.responsive_status}">${image.responsive_status === 'complete' ? '网页尺寸齐全' : '网页尺寸待补'}</small>
	</li>`).join('') : '<li class="is-empty">没有登记发布图片。</li>';
	return `<aside class="query-detail" aria-labelledby="query-detail-title">
		<div class="query-detail-heading"><div><p class="eyebrow">READ-ONLY DETAIL</p><h3 id="query-detail-title">${escapeHtml(record.title)}</h3><span>${escapeHtml(queryStatusLabel(record))} · 最近更新 ${escapeHtml(record.updated_date || '未知')}</span></div>
		<div class="query-detail-actions"><button class="quiet-button" data-query-action="copy-id" data-query-id="${escapeHtml(record.item_id)}" type="button">复制永久编号</button><button class="quiet-button" data-query-action="edit" data-query-id="${escapeHtml(record.item_id)}" type="button">在档案管理中打开</button></div></div>
		<dl class="query-detail-list">${detailRows.map(([label, value]) => `<div><dt>${escapeHtml(label)}</dt><dd>${escapeHtml(value)}</dd></div>`).join('')}</dl>
		${specificRows ? `<details class="query-detail-section"><summary>对象专属摘要 · ${(record.specific_summary ?? []).length} 项</summary><dl class="query-detail-list">${specificRows}</dl></details>` : ''}
		<details class="query-detail-section" open><summary>图片结构 · ${record.publication_image_count} 张</summary><p>${record.description_complete_count}/${record.publication_image_count} 张已填写说明 · ${queryStructureLabel(record.publication_structure_status)}</p><ul class="query-image-structure">${imageRows}</ul></details>
	</aside>`;
};

const renderQueryCenter = () => {
	const queryState = state.query;
	if (queryState.loading) return '<div class="loading-state"><div class="loading-line"></div><div class="loading-line short"></div></div>';
	if (queryState.error) return `<div class="empty-state">${escapeHtml(queryState.error)}<br /><button class="quiet-button" data-query-action="refresh" type="button">重新读取</button></div>`;
	if (!queryState.loaded) return '<div class="empty-state">资料查询尚未读取。</div>';
	const filtered = queryFilteredRecords();
	const pageCount = Math.max(1, Math.ceil(filtered.length / queryState.pageSize));
	queryState.page = Math.min(queryState.page, pageCount);
	const startIndex = (queryState.page - 1) * queryState.pageSize;
	const pageRecords = filtered.slice(startIndex, startIndex + queryState.pageSize);
	if (!pageRecords.some((record) => record.item_id === queryState.selectedId)) {
		queryState.selectedId = pageRecords[0]?.item_id ?? '';
	}
	const selected = queryState.records.find((record) => record.item_id === queryState.selectedId);
	const activeFilterCount = ['search', 'category', 'objectType', 'decade', 'research', 'evidence', 'rights', 'imageStatus']
		.filter((field) => queryState[field]).length;
	const allStatusRecords = queryState.records.filter((record) =>
		queryState.status === 'withdrawn' ? record.record_status === 'WDR' : record.record_status !== 'WDR');
	const rows = pageRecords.map((record) => `<tr class="${record.item_id === queryState.selectedId ? 'is-selected' : ''}">
		<td><button data-query-open="${escapeHtml(record.item_id)}" type="button"><strong>${escapeHtml(record.item_id)}</strong><small>${escapeHtml(queryStatusLabel(record))}</small></button></td>
		<td><strong>${escapeHtml(record.title)}</strong><small>${escapeHtml(record.collection_code || '藏品编码待生成')}</small></td>
		<td>${escapeHtml(record.category_label)}<small>${escapeHtml(record.object_type_label)} · ${escapeHtml(record.object_type)}</small></td>
		<td>${escapeHtml(record.date_display || '年代未知')}<small>${escapeHtml(record.place_summary || '地点未填写')}</small></td>
		<td>${escapeHtml(queryCodeLabel('research_status', record.research_status))}<small>${escapeHtml(queryCodeLabel('evidence_level', record.evidence_level))}</small></td>
		<td><span class="query-status is-${record.publication_structure_status}">${escapeHtml(queryStructureLabel(record.publication_structure_status))}</span><small>${record.publication_image_count} 张 · 说明 ${record.description_complete_count}/${record.publication_image_count}</small></td>
	</tr>`).join('');
	const cards = pageRecords.map((record) => `<button class="query-card ${record.item_id === queryState.selectedId ? 'is-selected' : ''}" data-query-open="${escapeHtml(record.item_id)}" type="button">
		<span><small>${escapeHtml(record.item_id)}</small><strong>${escapeHtml(record.title)}</strong></span>
		<span>${escapeHtml(record.category_label)} · ${escapeHtml(record.date_display || '年代未知')}</span>
		<span>${record.publication_image_count} 张 · ${escapeHtml(queryStructureLabel(record.publication_structure_status))}</span>
	</button>`).join('');
	return `<div class="query-workspace">
		<section class="query-controls" aria-labelledby="query-controls-title"><div class="query-controls-heading"><div><p class="eyebrow">STRUCTURED DATA ONLY</p><h3 id="query-controls-title">只查询结构化资料</h3><p>不显示、不加载图片；只读取文字字段和图片数量、说明、网页尺寸等结构状态。</p></div><button class="quiet-button" data-query-action="refresh" type="button">重新读取</button></div>
		<div class="query-status-switch" role="group" aria-label="档案状态"><button class="${queryState.status === 'normal' ? 'is-active' : ''}" data-query-status="normal" type="button">正常档案</button><button class="${queryState.status === 'withdrawn' ? 'is-active' : ''}" data-query-status="withdrawn" type="button">已撤销</button></div>
		<div class="query-filter-grid"><label class="query-search"><span>快速搜索</span><input type="search" data-query-search value="${escapeHtml(queryState.search)}" placeholder="编号、题名、人物、机构、地点或来源" /></label>
		<label><span>访客分类</span><select data-query-filter="category"><option value="">全部分类</option>${queryOptionMarkup(allStatusRecords, 'category', queryState.category, (value) => allStatusRecords.find((record) => record.category === value)?.category_label ?? value)}</select></label>
		<label><span>精确类型</span><select data-query-filter="objectType"><option value="">全部类型</option>${queryOptionMarkup(allStatusRecords, 'object_type', queryState.objectType, (value) => `${allStatusRecords.find((record) => record.object_type === value)?.object_type_label ?? value}（${value}）`)}</select></label>
		<label><span>年代</span><select data-query-filter="decade"><option value="">全部年代</option>${queryOptionMarkup(allStatusRecords, 'decade', queryState.decade, (value) => `${value}年代`)}</select></label>
		<label><span>研究状态</span><select data-query-filter="research"><option value="">全部状态</option>${queryOptionMarkup(allStatusRecords, 'research_status', queryState.research, (value) => queryCodeLabel('research_status', value))}</select></label>
		<label><span>证据等级</span><select data-query-filter="evidence"><option value="">全部等级</option>${queryOptionMarkup(allStatusRecords, 'evidence_level', queryState.evidence, (value) => queryCodeLabel('evidence_level', value))}</select></label>
		<label><span>权利状态</span><select data-query-filter="rights"><option value="">全部状态</option>${queryOptionMarkup(allStatusRecords, 'rights_status', queryState.rights, (value) => queryCodeLabel('rights_status', value))}</select></label>
		<label><span>图片结构</span><select data-query-filter="imageStatus"><option value="">全部状态</option><option value="complete" ${queryState.imageStatus === 'complete' ? 'selected' : ''}>结构完整</option><option value="warning" ${queryState.imageStatus === 'warning' ? 'selected' : ''}>需要检查</option><option value="missing" ${queryState.imageStatus === 'missing' ? 'selected' : ''}>没有发布图片</option></select></label></div>
		<div class="query-result-summary"><span>命中 <strong>${filtered.length}</strong> 条${activeFilterCount ? ` · 当前 ${activeFilterCount} 个条件` : ''}</span>${activeFilterCount ? '<button class="quiet-button" data-query-action="clear" type="button">清除条件</button>' : ''}</div></section>
		<div class="query-results-layout"><section class="query-results" aria-label="查询结果">${pageRecords.length ? `<div class="query-table-wrap"><table><thead><tr><th>永久编号</th><th>题名</th><th>类型</th><th>年代与地点</th><th>研究判断</th><th>图片结构</th></tr></thead><tbody>${rows}</tbody></table></div><div class="query-cards">${cards}</div>` : '<div class="empty-state">当前条件没有匹配档案。可以清除部分条件后再试。</div>'}
		${pageCount > 1 ? `<nav class="query-pagination" aria-label="查询结果分页"><button class="quiet-button" data-query-page="${queryState.page - 1}" type="button" ${queryState.page === 1 ? 'disabled' : ''}>上一页</button><span>第 ${queryState.page} / ${pageCount} 页</span><button class="quiet-button" data-query-page="${queryState.page + 1}" type="button" ${queryState.page === pageCount ? 'disabled' : ''}>下一页</button></nav>` : ''}</section>${renderQueryDetails(selected)}</div>
	</div>`;
};

const loadQueryRecords = async () => {
	state.query.loading = true;
	state.query.error = '';
	if (state.workspaceMode === 'query') renderWorkspaceCenter();
	try {
		const response = await fetch('/api/query-records');
		const data = await readApiJson(response);
		if (!response.ok) throw new Error(data.error ?? '结构化资料读取失败。');
		state.query.records = data.records ?? [];
		state.query.loaded = true;
		state.query.selectedId = queryFilteredRecords()[0]?.item_id ?? '';
	} catch (error) {
		state.query.error = error.message || '结构化资料读取失败。';
	} finally {
		state.query.loading = false;
		renderWorkspaceNavigation();
		if (state.workspaceMode === 'query') renderWorkspaceCenter();
	}
};

const recordImages = (record) => (record.core.publication_file_path ?? []).map((publicPath, index) => {
	const parts = publicPath.split('/').filter(Boolean);
	const imageItemId = parts.at(-2);
	const filename = parts.at(-1);
	return {
		id: `existing-${index}-${filename}`, kind: 'existing', filename,
		previewUrl: `/api/image/${encodeURIComponent(imageItemId)}/${encodeURIComponent(filename)}`,
		description: record.public_view?.image_descriptions?.[index] ?? '',
	};
});

const fallbackImageDescription = (record, image, index, total) => {
	const title = record?.core?.title?.trim() || '藏品';
	const filename = (image.filename ?? image.file?.name ?? '').toLocaleLowerCase('en-US');
	if (total === 1) return `${title}的档案图片`;
	if (filename.startsWith('front-')) return `${title}，正面`;
	if (filename.startsWith('back-')) return `${title}，背面`;
	return `${title}，细节图 ${index + 1}`;
};

const displayedImageDescription = (record, image, index, total) =>
	image.description?.trim() || fallbackImageDescription(record, image, index, total);

const qualityIssuesForRecord = (record) => {
	if (recordIsWithdrawn(record)) return [];
	const issues = [];
	const add = (code, group, label, tab = 'basic') => issues.push({ code, group, label, tab });
	const publicationPaths = Array.isArray(record.core.publication_file_path) ? record.core.publication_file_path : [];
	const descriptions = Array.isArray(record.public_view?.image_descriptions) ? record.public_view.image_descriptions : [];
	const missingImageDescriptions = publicationPaths.filter((_, index) => !descriptions[index]?.trim()).length;
	if (!record.public_view?.description?.trim()) add('public_description', 'content', '公开简介待补');
	if (missingImageDescriptions) add('image_descriptions', 'images', `${missingImageDescriptions} 张图片说明待补`, 'images');
	if (record.core.research_status !== 'R4') add('research_status', 'research', '研究尚未完成');
	if (!record.core.evidence_level || record.core.evidence_level === 'D') add('evidence_level', 'research', '证据等级待明确');
	if (!record.core.rights_status || record.core.rights_status === 'UNK') add('rights_status', 'rights', '权利状态待核验');
	if (record.core.backup_status !== 'BU3') add('backup_status', 'preservation', '备份未达到 3-2-1');
	const reviewDate = record.core.review_date?.trim();
	if (!reviewDate) add('review_date', 'review', '尚未安排下次复核');
	else if (!/^\d{4}-\d{2}-\d{2}$/.test(reviewDate)) add('review_date', 'review', '复核日期格式需要检查');
	else if (reviewDate <= today()) add('review_date', 'review', `复核日期已到（${reviewDate}）`);
	const publicationIssues = (record._admin?.issues ?? []).filter((issue) => issue.code !== 'privacy_confirmation');
	if (publicationIssues.length) {
		add('publication_issues', 'publication', `发布前待处理 ${publicationIssues.length} 项`, publicationIssues[0].tab ?? 'basic');
	}
	return issues;
};

const getMaintenanceOverview = () => {
	const activeRecords = state.records.filter((record) => !recordIsWithdrawn(record));
	const records = activeRecords.map((record) => ({ record, issues: qualityIssuesForRecord(record) }));
	return {
		records,
		attentionRecords: records.filter((entry) => entry.issues.length).length,
		missingImageDescriptions: records.reduce((total, entry) => total + entry.issues
			.filter((issue) => issue.code === 'image_descriptions')
			.reduce((count, issue) => count + Number.parseInt(issue.label, 10), 0), 0),
		researchPending: records.filter((entry) => entry.issues.some((issue) => issue.group === 'research')).length,
		backupPending: records.filter((entry) => entry.issues.some((issue) => issue.group === 'preservation')).length,
		reviewDue: records.filter((entry) => entry.issues.some((issue) => issue.group === 'review')).length,
		withdrawnRecords: state.records.filter(recordIsWithdrawn).length,
	};
};

const renderRecordList = () => {
	const records = filteredRecords();
	const statusName = state.recordStatusFilter === 'withdrawn' ? '已撤销' : '正常';
	elements.recordCount.textContent = `${statusName}档案 ${records.length} 条`;
	elements.recordList.innerHTML = records.length ? records.map((record) => `
		<button class="record-card ${record.core.item_id === state.activeId ? 'is-active' : ''}" data-id="${escapeHtml(record.core.item_id)}" type="button">
			<strong>${escapeHtml(record.core.title)}</strong><span>${escapeHtml(record.core.item_id)}</span>
			<small>${escapeHtml(statusLabel(record))}${record._admin?.issues?.length ? ` · 待处理 ${record._admin.issues.length} 项` : ''}</small>
		</button>`).join('') : `<div class="record-list-empty">${state.search ? '当前搜索没有匹配记录' : `暂无${statusName}档案`}</div>`;
};

const renderWorkspaceNavigation = () => {
	const normalCount = state.records.filter((record) => !recordIsWithdrawn(record)).length;
	const withdrawnCount = state.records.length - normalCount;
	elements.recordsBadge.textContent = String(state.records.length);
	elements.queryBadge.textContent = String(state.query.loaded ? state.query.records.length : state.records.length);
	elements.maintenanceBadge.textContent = String(getMaintenanceOverview().attentionRecords);
	elements.normalRecordsBadge.textContent = String(normalCount);
	elements.withdrawnRecordsBadge.textContent = String(withdrawnCount);
	elements.draftsBadge.textContent = String(state.drafts.length);
	elements.recycleBadge.textContent = String(state.recycleBin.length);
	elements.historyBadge.textContent = String(state.history.length);
	document.querySelectorAll('[data-workspace]').forEach((button) => {
		button.classList.toggle('is-active', button.dataset.workspace === state.workspaceMode);
	});
	elements.recordStatusNav.hidden = state.workspaceMode !== 'records';
	document.querySelectorAll('[data-record-status]').forEach((button) => {
		button.classList.toggle('is-active', button.dataset.recordStatus === state.recordStatusFilter);
	});
	elements.mobileRecordBrowserToggle.hidden = state.workspaceMode !== 'records';
	elements.recordBrowserContent.hidden = state.workspaceMode !== 'records';
	if (state.workspaceMode !== 'records') setMobileRecordBrowserOpen(false);
};

const renderDraftCenter = () => {
	if (!state.drafts.length) return '<div class="empty-state">当前没有草稿。已发布内容和本地草稿仍然分开保存。</div>';
	return `<div class="center-grid">${state.drafts.map((draft) => `
		<article class="center-card"><div><h4>${escapeHtml(draft.title || '未命名藏品')}</h4>
		<p>${escapeHtml(draft.item_id)} · ${escapeHtml(draft.object_type)} · 保存于 ${escapeHtml(formatDateTime(draft.saved_at))}</p>
		<div class="issue-summary">${draft.issues.length
			? `<span class="issue-chip">发布前还需处理 ${draft.issues.length} 项</span>`
			: '<span class="issue-chip">字段与图片已齐，仍需人工完成隐私检查</span>'}
		${draft.pending_removed_count ? `<span class="issue-chip">待回收图片 ${draft.pending_removed_count} 张</span>` : ''}</div></div>
		<div class="center-actions"><button class="quiet-button" data-center-action="continue" data-item-id="${escapeHtml(draft.item_id)}" type="button">继续编辑</button></div>
		</article>`).join('')}</div>`;
};

const renderRecycleCenter = () => {
	if (!state.recycleBin.length) return '<div class="empty-state">图片回收区为空。这里不会永久删除图片。</div>';
	return `<div class="center-grid">${state.recycleBin.map((entry) => `
		<article class="center-card has-thumb"><img class="recycle-thumb" src="${escapeHtml(entry.preview_url)}" alt="回收图片预览" />
		<div><h4>${escapeHtml(entry.filename)}</h4><p>${escapeHtml(entry.item_id)} · 移入回收区于 ${escapeHtml(formatDateTime(entry.removed_at))}</p>
		<div class="issue-summary"><span class="issue-chip">恢复后只会生成草稿，不会直接公开</span></div></div>
		<div class="center-actions"><button class="quiet-button" data-center-action="restore-recycle" data-item-id="${escapeHtml(entry.item_id)}" data-entry-id="${escapeHtml(entry.entry_id)}" type="button">恢复到草稿</button></div>
		</article>`).join('')}</div>`;
};

const renderHistoryCenter = () => {
	if (!state.history.length) return '<div class="empty-state">当前还没有历史版本。下次更新已发布档案时，会先在本机保存发布前版本。</div>';
	const snapshotLabel = (kind) => ({
		'draft-before-history-restore': '恢复前草稿备份',
		'published-before-withdrawal': '撤销前发布版本',
		'withdrawn-before-reactivation': '重新启用前撤销记录',
	})[kind] ?? '发布前版本';
	return `<div class="center-grid">${state.history.map((entry) => `
		<article class="center-card"><div><h4>${escapeHtml(entry.title || entry.item_id)}</h4>
		<p>${escapeHtml(entry.item_id)} · ${escapeHtml(snapshotLabel(entry.snapshot_kind))} · ${escapeHtml(formatDateTime(entry.created_at))} · ${entry.images?.length ?? 0} 张图片</p>
		${entry.withdrawal_reason ? `<p class="history-reason">撤销原因：${escapeHtml(entry.withdrawal_reason)}</p>` : ''}
		<div class="issue-summary"><span class="issue-chip">${['published-before-withdrawal', 'withdrawn-before-reactivation'].includes(entry.snapshot_kind) ? '撤销追溯快照保持只读' : '恢复后先进入草稿，可再次检查'}</span></div></div>
		<div class="center-actions">${['published-before-withdrawal', 'withdrawn-before-reactivation'].includes(entry.snapshot_kind)
			? '<button class="quiet-button" type="button" disabled>仅供追溯</button>'
			: `<button class="quiet-button" data-center-action="restore-history" data-item-id="${escapeHtml(entry.item_id)}" data-entry-id="${escapeHtml(entry.entry_id)}" type="button">恢复为草稿</button>`}</div>
		</article>`).join('')}</div>`;
};

const renderMaintenanceCenter = () => {
	const overview = getMaintenanceOverview();
	const integrity = state.integrityReport;
	const integrityPassed = integrity?.status === 'pass';
	const integrityFailures = integrity?.summary?.failures ?? 0;
	const issueGroupLabels = {
		content: '公开内容', images: '图片说明', research: '研究', rights: '权利',
		preservation: '备份', review: '复核', publication: '发布准备',
	};
	const attentionCards = overview.records.filter((entry) => entry.issues.length).map(({ record, issues }) => {
		const firstIssue = issues[0];
		return `<article class="maintenance-record-card">
			<div class="maintenance-record-heading"><div><p>${escapeHtml(statusLabel(record))}</p><h4>${escapeHtml(record.core.title || '未命名藏品')}</h4>
			<small>${escapeHtml(record.core.item_id)}</small></div>
			<button class="quiet-button" data-center-action="maintenance-open" data-item-id="${escapeHtml(record.core.item_id)}" data-target-tab="${escapeHtml(firstIssue.tab)}" type="button">打开处理</button></div>
			<div class="maintenance-issue-list">${issues.map((issue) => `<span class="maintenance-issue is-${escapeHtml(issue.group)}"><small>${escapeHtml(issueGroupLabels[issue.group] ?? '待办')}</small>${escapeHtml(issue.label)}</span>`).join('')}</div>
		</article>`;
	}).join('');
	const integrityIssues = integrity?.issues?.length
		? `<ul class="integrity-issue-list">${integrity.issues.map((issue) => `<li><div><strong>${escapeHtml(issue.area)}</strong><span>${issue.item_id ? `${escapeHtml(issue.title || issue.item_id)} · ` : ''}${escapeHtml(issue.message)}</span></div>${issue.item_id ? `<button class="quiet-button" data-center-action="maintenance-open" data-item-id="${escapeHtml(issue.item_id)}" data-target-tab="images" type="button">查看档案</button>` : ''}</li>`).join('')}</ul>`
		: '<div class="integrity-complete"><strong>发布层结构完整</strong><span>正式 JSON、发布图片、响应式副本、构建页面和管理端隔离检查均通过。</span></div>';
	return `<div class="maintenance-overview">
		<section class="maintenance-summary" aria-labelledby="maintenance-summary-heading">
			<div class="section-heading"><div><h3 id="maintenance-summary-heading">维护概览</h3><p>集中查看需要补充或复核的档案；这里只提供提示和入口，不会自动修改资料。</p></div></div>
			<div class="maintenance-summary-grid">
				<div><span>需要关注</span><strong>${overview.attentionRecords}</strong><small>条正常档案</small></div>
				<div><span>图片说明</span><strong>${overview.missingImageDescriptions}</strong><small>张待补</small></div>
				<div><span>研究状态</span><strong>${overview.researchPending}</strong><small>条未完成</small></div>
				<div><span>备份状态</span><strong>${overview.backupPending}</strong><small>条未达标</small></div>
				<div><span>复核安排</span><strong>${overview.reviewDue}</strong><small>条待安排／已到期</small></div>
				<div class="${integrityPassed ? 'is-pass' : 'is-alert'}"><span>完整性巡检</span><strong>${integrityPassed ? '通过' : integrityFailures}</strong><small>${integrityPassed ? `${integrity.summary.checks} 项检查` : '项异常'}</small></div>
			</div>
			<p class="maintenance-withdrawn-note">建议每次复核完成后，把“更多通用字段 → 利用与保管 → 复盘日期”安排在未来 12 个月内；到期或未安排会在这里提示。</p>
			${overview.withdrawnRecords ? `<p class="maintenance-withdrawn-note">另有 ${overview.withdrawnRecords} 条已撤销追溯记录，只纳入完整性检查，不计入日常补录任务。</p>` : ''}
		</section>
		<section class="maintenance-section" aria-labelledby="quality-records-heading">
			<div class="maintenance-section-heading"><div><p class="eyebrow">QUALITY TASKS</p><h3 id="quality-records-heading">需要处理的档案</h3><p>按当前资料状态自动归纳；处理完成后重新打开本页即可更新。</p></div></div>
			${attentionCards || '<div class="empty-state">当前正常档案没有需要补充的质量项目。</div>'}
		</section>
		<section class="maintenance-section" aria-labelledby="integrity-heading">
			<div class="maintenance-section-heading is-inline"><div><p class="eyebrow">READ-ONLY CHECK</p><h3 id="integrity-heading">本地完整性巡检</h3><p>${integrity ? `检查于 ${escapeHtml(formatDateTime(integrity.checked_at))}，覆盖 ${integrity.summary.records} 份正式 JSON、${integrity.summary.publication_images} 张发布图片和 ${integrity.summary.responsive_variants} 个网页尺寸副本。` : '尚未取得巡检结果。'}</p></div>
			<button class="quiet-button" data-center-action="maintenance-refresh" type="button">重新检查</button></div>
			${integrityIssues}
		</section>
	</div>`;
};

const renderWorkspaceCenter = () => {
	if (state.workspaceMode === 'query') elements.editorSurface.innerHTML = renderQueryCenter();
	else if (state.workspaceMode === 'maintenance') elements.editorSurface.innerHTML = renderMaintenanceCenter();
	else if (state.workspaceMode === 'drafts') elements.editorSurface.innerHTML = renderDraftCenter();
	else if (state.workspaceMode === 'recycle') elements.editorSurface.innerHTML = renderRecycleCenter();
	else elements.editorSurface.innerHTML = renderHistoryCenter();
};

const setWorkspaceMode = (mode) => {
	if (!['records', 'query', 'maintenance', 'drafts', 'recycle', 'history'].includes(mode)) return;
	state.workspaceMode = mode;
	renderWorkspaceNavigation();
	updateHeader();
	if (mode === 'records') renderEditor();
	else {
		renderWorkspaceCenter();
		if (mode === 'query' && !state.query.loaded && !state.query.loading) loadQueryRecords();
	}
};

const setRecordStatusFilter = (filter) => {
	if (!['normal', 'withdrawn'].includes(filter) || filter === state.recordStatusFilter) return;
	state.recordStatusFilter = filter;
	renderRecordList();
	renderWorkspaceNavigation();
	const visibleRecords = filteredRecords();
	if (visibleRecords.some((record) => record.core.item_id === state.activeId)) return;
	if (visibleRecords[0]) selectRecord(visibleRecords[0].core.item_id);
	else {
		state.activeId = null;
		state.current = null;
		updateHeader();
		renderEditor();
	}
};

const hideRecordActionDock = () => {
	elements.recordActionDock.hidden = true;
	document.body.classList.remove('has-record-action-dock');
};

const showRecordActionDock = ({ status, disabled, showPublish }) => {
	elements.recordActionDock.hidden = false;
	document.body.classList.add('has-record-action-dock');
	elements.dockSaveState.textContent = status;
	elements.dockSaveState.classList.toggle('is-dirty', state.dirty || disabled);
	elements.dockSaveDraftButton.disabled = disabled;
	elements.dockPublishButton.disabled = disabled;
	elements.dockPublishButton.hidden = !showPublish;
};

const updateHeader = () => {
	const centerTitles = {
		query: ['STRUCTURED DATA QUERY', '资料查询', '只读查询文字字段和图片结构，不加载图片'],
		maintenance: ['MAINTENANCE OVERVIEW', '维护概览', '质量待办与只读完整性巡检'],
		drafts: ['DRAFT CENTER', '草稿中心', `${state.drafts.length} 份尚未正式发布的草稿`],
		recycle: ['RECYCLE BIN', '图片回收区', `${state.recycleBin.length} 张可以恢复的发布副本`],
		history: ['VERSION HISTORY', '历史版本', `${state.history.length} 份发布前版本备份`],
	};
	if (state.workspaceMode !== 'records') {
		const [kicker, title, detail] = centerTitles[state.workspaceMode];
		elements.recordKicker.textContent = kicker;
		elements.recordTitle.textContent = title;
		elements.recordId.textContent = detail;
		elements.saveState.textContent = '这些内容只保存在本机';
		elements.saveState.classList.remove('is-dirty');
		elements.saveDraftButton.disabled = true;
		elements.publishButton.disabled = true;
		elements.saveDraftButton.hidden = true;
		elements.publishButton.hidden = true;
		elements.lifecycleButton.hidden = true;
		elements.similarRecordButton.hidden = true;
		elements.recordMoreActions.hidden = true;
		hideRecordActionDock();
		elements.taskSummary.hidden = true;
		elements.previewLink.href = publicPreviewUrl('/');
		elements.previewLink.textContent = '查看网站首页';
		elements.tabs.classList.add('is-hidden');
		return;
	}
	if (!state.current) {
		elements.recordKicker.textContent = state.recordStatusFilter === 'withdrawn' ? 'WITHDRAWN RECORDS' : 'ARCHIVE RECORDS';
		elements.recordTitle.textContent = state.recordStatusFilter === 'withdrawn' ? '暂无已撤销档案' : '暂无正常档案';
		elements.recordId.textContent = '';
		elements.saveState.textContent = '';
		elements.saveDraftButton.disabled = true;
		elements.publishButton.disabled = true;
		elements.saveDraftButton.hidden = true;
		elements.publishButton.hidden = true;
		elements.lifecycleButton.hidden = true;
		elements.similarRecordButton.hidden = true;
		elements.recordMoreActions.hidden = true;
		hideRecordActionDock();
		elements.taskSummary.hidden = true;
		elements.previewLink.href = publicPreviewUrl('/');
		elements.previewLink.textContent = '查看网站首页';
		elements.tabs.classList.add('is-hidden');
		return;
	}
	elements.tabs.classList.remove('is-hidden');
	elements.recordKicker.textContent = state.isNew ? 'NEW RECORD' : statusLabel(state.current).toUpperCase();
	elements.recordTitle.textContent = state.current.core.title || '未命名藏品';
	elements.recordId.textContent = state.current.core.item_id || '保存草稿时自动生成永久编号';
	const waitingForExactType = Boolean(state.pendingObjectCategory);
	const saveStateText = waitingForExactType
		? '请先选择精确类型'
		: state.dirty
		? '有尚未保存的修改'
		: state.current._admin?.hasDraft
			? `草稿已保存${state.current._admin.savedAt ? ` · ${formatDateTime(state.current._admin.savedAt)}` : ''}`
			: state.current.core.use_status === 'U3' ? '当前为已发布版本' : '当前没有未保存修改';
	elements.saveState.textContent = saveStateText;
	elements.saveState.classList.toggle('is-dirty', state.dirty || waitingForExactType);
	const readonly = isWithdrawn();
	elements.saveDraftButton.hidden = readonly;
	elements.publishButton.hidden = readonly || state.activeTab !== 'privacy';
	elements.saveDraftButton.disabled = readonly || waitingForExactType;
	elements.publishButton.disabled = readonly || waitingForExactType;
	elements.saveDraftButton.title = readonly
		? '撤销追溯记录在第一阶段保持只读'
		: waitingForExactType ? '请先完成精确类型选择' : '';
	elements.publishButton.title = readonly
		? '撤销追溯记录不能直接重新发布'
		: waitingForExactType ? '请先完成精确类型选择' : '';
	const officialStatus = state.current._admin?.officialRecordStatus;
	const canOfferWithdrawal = !state.isNew && officialStatus === 'ACT';
	const canOfferRestore = readonly;
	const canOfferSimilar = !state.isNew && !readonly;
	elements.recordMoreActions.hidden = !canOfferWithdrawal && !canOfferRestore && !canOfferSimilar;
	elements.recordMoreActionsLabel.textContent = canOfferRestore ? '恢复操作' : '更多操作';
	elements.similarRecordButton.hidden = !canOfferSimilar;
	elements.similarRecordButton.disabled = state.dirty;
	elements.similarRecordButton.title = state.dirty ? '请先保存或放弃当前修改，再从这条档案新建' : '只复用类型、批次、来源和行政区域';
	elements.lifecycleButton.hidden = !canOfferWithdrawal && !canOfferRestore;
	elements.lifecycleButton.classList.toggle('is-danger', canOfferWithdrawal);
	elements.lifecycleButton.classList.toggle('is-restore', canOfferRestore);
	if (canOfferWithdrawal) {
		elements.lifecycleButton.textContent = '撤销档案';
		const blockedByDraft = Boolean(state.current._admin?.hasDraft || state.dirty);
		elements.lifecycleButton.disabled = blockedByDraft;
		elements.lifecycleButton.title = blockedByDraft ? '请先处理当前未发布修改，再撤销已发布档案' : '从公开网站撤下，保留本地档案和图片';
	} else if (canOfferRestore) {
		elements.lifecycleButton.textContent = '恢复为草稿';
		elements.lifecycleButton.disabled = !state.current._admin?.canRestoreWithdrawn;
		elements.lifecycleButton.title = state.current._admin?.canRestoreWithdrawn
			? '生成一份隔离草稿，重新检查后才能发布'
			: state.current._admin?.restoreWithdrawnReason || '这条撤销记录不能恢复为独立草稿';
	}
	const itemId = state.current.core.item_id;
	const hasPublicPage = Boolean(itemId && state.current._admin?.hasOfficial && officialStatus === 'ACT');
	elements.previewLink.href = publicPreviewUrl(hasPublicPage ? `/archive/${encodeURIComponent(itemId)}/` : '/');
	elements.previewLink.textContent = hasPublicPage ? '查看公开档案' : '查看网站首页';
	if (readonly) hideRecordActionDock();
	else showRecordActionDock({
		status: saveStateText,
		disabled: waitingForExactType,
		showPublish: state.activeTab === 'privacy',
	});
	updateTaskSummary();
};

const selectRecord = (itemId) => {
	const record = state.records.find((candidate) => candidate.core.item_id === itemId);
	if (!record) return;
	state.activeId = itemId;
	state.workspaceMode = 'records';
	state.recordStatusFilter = recordIsWithdrawn(record) ? 'withdrawn' : 'normal';
	state.current = deepClone(record);
	setMobileRecordBrowserOpen(false);
	elements.recordMoreActions.open = false;
	state.pendingObjectCategory = '';
	updateDerivedCollectionCode();
	state.isNew = false;
	if (record.core.record_status === 'WDR' && !record._admin?.hasDraft) state.activeTab = 'basic';
	state.dirty = false;
	state.images = recordImages(record);
	state.pendingRemovedImages = (record._admin?.pendingRemovedImages ?? []).map((filename) => ({
		filename,
		previewUrl: `/api/image/${encodeURIComponent(record.core.item_id)}/${encodeURIComponent(filename)}`,
		description: record._admin?.pendingRemovedImageDescriptions?.[filename] ?? '',
	}));
	state.validationIssues = record._admin?.issues ?? [];
	state.imagePreflight = [];
	state.confirmedPublicationCopies = false;
	renderRecordList();
	renderWorkspaceNavigation();
	updateHeader();
	renderTabs();
	renderEditor();
};

const similarCoreFieldCodes = [
	'object_type', 'batch_id', 'acquisition_method', 'source_name', 'source_place',
	'country', 'province', 'city', 'district',
];

const startNewRecord = (templateRecord = null) => {
	state.activeId = null;
	state.workspaceMode = 'records';
	state.isNew = true;
	setMobileRecordBrowserOpen(false);
	state.dirty = false;
	state.images = [];
	state.pendingRemovedImages = [];
	state.validationIssues = [];
	state.imagePreflight = [];
	state.confirmedPublicationCopies = false;
	state.pendingObjectCategory = '';
	const reusableCore = templateRecord ? Object.fromEntries(similarCoreFieldCodes
		.filter((fieldCode) => templateRecord.core[fieldCode] !== undefined)
		.map((fieldCode) => [fieldCode, deepClone(templateRecord.core[fieldCode])])) : {};
	const objectType = reusableCore.object_type ?? 'PHO';
	state.current = {
		core: {
			record_status: 'SUS', item_id: '', accession_date: today(), object_type: 'PHO', title: '',
			date_display: '', privacy_level: 'Y', rights_status: 'UNK', research_status: 'R0',
			evidence_level: 'D', digitization_status: 'DG0', transcription_status: 'TX0', use_status: 'U0',
			publication_file_path: [], ...reusableCore, object_type: objectType,
		},
		metadata: { schema: schemaForType(objectType), dimensions: {} },
		public_view: { description: '', transcription: '', revision_note: '', tags: [], place_display: '', place_filters: [], image_descriptions: [] },
	};
	updateDerivedCollectionCode();
	state.activeTab = 'basic';
	renderRecordList();
	renderWorkspaceNavigation();
	updateHeader();
	renderTabs();
	renderEditor();
	if (templateRecord) showToast(`已复用“${templateRecord.core.title || templateRecord.core.item_id}”的类型、批次、来源和行政区域；编号、题名、年代、图片、专属信息与隐私确认均未复制。`);
};

const startSimilarRecord = () => {
	if (!state.current || state.isNew || isWithdrawn() || state.dirty) return;
	const confirmed = window.confirm('将复用当前藏品的类型、批次、获得方式、来源和省市区。永久编号、题名、年代、图片、专属信息、公开文字和隐私确认不会复制。是否继续？');
	if (!confirmed) return;
	const templateRecord = deepClone(state.current);
	elements.recordMoreActions.open = false;
	startNewRecord(templateRecord);
};

const commonDefinition = (fieldCode) => state.commonFields.get(fieldCode);
const dictionaryKeyFor = (definition, fieldCode) => {
	if (specialDictionaryFields[fieldCode]) return specialDictionaryFields[fieldCode];
	const key = (definition?.dictionary_or_multi_value_rule ?? '').split('｜')[0];
	return key && key !== '—' ? key : null;
};
const humanFieldLabel = (fieldCode) => commonDefinition(fieldCode)?.name ??
	fieldCode.split('_').map((word) => wordLabels[word] ?? word).join(' · ');
const fieldDataType = (definition, fieldCode) => {
	if (definition?.data_type) return definition.data_type;
	if (dateFields.has(fieldCode)) return '日期';
	if (integerFields.has(fieldCode)) return '整数';
	if (numberFields.has(fieldCode)) return '数值';
	if (longTextFields.has(fieldCode)) return '长文本';
	if (specialDictionaryFields[fieldCode]) return '代码';
	return '文本';
};

const objectTypeCategories = () => state.standards?.archiveCategories?.categories ?? [];

const categoryForObjectType = (objectType) =>
	objectTypeCategories().find((category) => category.object_types.includes(objectType));

const objectTypeOptionsForCategory = (category, options) => {
	const optionByCode = new Map(options.map((option) => [option.code, option]));
	return category ? category.object_types.map((code) => optionByCode.get(code)).filter(Boolean) : [];
};

const renderObjectTypeControl = (options, value, { readonly = false, required = false } = {}) => {
	const currentCategory = categoryForObjectType(value);
	const selectedCategorySlug = state.pendingObjectCategory || currentCategory?.slug || '';
	const selectedCategory = objectTypeCategories().find((category) => category.slug === selectedCategorySlug);
	const exactOptions = objectTypeOptionsForCategory(selectedCategory, options);
	const selectedExactType = exactOptions.some((option) => option.code === value) ? value : '';
	const categoryOptions = objectTypeCategories().map((category) => {
		const selectableTypes = objectTypeOptionsForCategory(category, options);
		return `<option value="${escapeHtml(category.slug)}" ${selectedCategorySlug === category.slug ? 'selected' : ''} ${selectableTypes.length ? '' : 'disabled'}>${escapeHtml(category.label)}</option>`;
	}).join('');
	let exactControl = '<p class="object-type-note">选择一个藏品分类后，系统会自动对应正式类型。</p>';
	if (exactOptions.length > 1) {
		exactControl = `<label class="object-type-detail"><span>精确类型 <small>仅用于内部编号和专属字段</small></span>
			<select class="field-control object-type-control" data-scope="core" data-dimension="" data-field="object_type"${required ? ' aria-required="true" required' : ''}${readonly ? ' disabled' : ''}>
				<option value="">请选择精确类型</option>${exactOptions.map((option) =>
					`<option value="${escapeHtml(option.code)}" ${selectedExactType === option.code ? 'selected' : ''}>${escapeHtml(option.label)}（${escapeHtml(option.code)}）</option>`).join('')}
			</select></label>`;
	} else if (exactOptions.length === 1) {
		const option = exactOptions[0];
		exactControl = `<p class="object-type-note">正式类型已自动对应为 <strong>${escapeHtml(option.label)}（${escapeHtml(option.code)}）</strong>。</p>`;
	} else if (selectedCategorySlug) {
		exactControl = '<p class="object-type-note is-warning">旧卡片尚无正式对象代码，当前不能新建；待数据规范扩展后再开放。</p>';
	}
	return `<div class="object-type-controls">
		<label class="object-category-detail"><span>首页分类</span>
			<select class="object-category-control" data-field="object_type"${required ? ' aria-required="true" required' : ''}${readonly ? ' disabled' : ''}>
				<option value="">请选择藏品分类</option>${categoryOptions}
			</select></label>
		${exactControl}
	</div>`;
};

const renderField = ({
	scope = 'core', dimension = '', fieldCode, definition, value, required = false, readonly = false,
	context = '', dictionaryKey = null,
}) => {
	const label = fieldCode === 'object_type' ? '藏品分类' : definition?.name ?? humanFieldLabel(fieldCode);
	const type = fieldDataType(definition, fieldCode);
	const options = state.dictionary.get(dictionaryKey ?? dictionaryKeyFor(definition, fieldCode)) ?? [];
	const multi = Array.isArray(value) || arrayFields.has(fieldCode) ||
		(definition?.dictionary_or_multi_value_rule ?? '').includes('是');
	const wide = type === '长文本' || multi;
	const attributes = `data-scope="${scope}" data-dimension="${escapeHtml(dimension)}" data-field="${escapeHtml(fieldCode)}"${required ? ' aria-required="true"' : ''}`;
	const requiredControlAttribute = required && !readonly ? ' required' : '';
	let control;
	if (fieldCode === 'object_type' && options.length) {
		control = renderObjectTypeControl(options, value, { readonly, required });
	} else if (readonly && options.length && !multi) {
		control = `<select ${attributes} disabled>${options.map((option) =>
			`<option value="${escapeHtml(option.code)}" ${value === option.code ? 'selected' : ''}>${escapeHtml(option.label)}（${escapeHtml(option.code)}）</option>`).join('')}</select>`;
	} else if (readonly) {
		const rawValues = Array.isArray(value) ? value : [value];
		const displayValue = rawValues.filter(hasMeaningfulValue).map((entry) => {
			const option = options.find((candidate) => candidate.code === entry);
			return option ? `${option.label}（${option.code}）` : entry;
		}).join('、');
		control = `<input type="text" value="${escapeHtml(displayValue || '自动维护')}" readonly />`;
	} else if (options.length && multi) {
		const selected = new Set(Array.isArray(value) ? value : []);
		control = `<div class="choice-grid" role="group" aria-label="${escapeHtml(label)}">${options.map((option) => `
			<label class="choice-option"><input type="checkbox" class="field-control" ${attributes} value="${escapeHtml(option.code)}" ${selected.has(option.code) ? 'checked' : ''} />
			<span>${escapeHtml(option.label)}（${escapeHtml(option.code)}）</span></label>`).join('')}</div>`;
	} else if (options.length) {
		control = `<select class="field-control" ${attributes}${requiredControlAttribute}><option value="">未填写</option>${options.map((option) =>
			`<option value="${escapeHtml(option.code)}" ${value === option.code ? 'selected' : ''}>${escapeHtml(option.label)}（${escapeHtml(option.code)}）</option>`).join('')}</select>`;
	} else if (multi) {
		control = `<textarea class="field-control" ${attributes}${requiredControlAttribute} data-array="true" placeholder="每行填写一项">${escapeHtml(Array.isArray(value) ? value.join('\n') : value ?? '')}</textarea>`;
	} else if (type === '长文本') {
		control = `<textarea class="field-control" ${attributes}${requiredControlAttribute}>${escapeHtml(value ?? '')}</textarea>`;
	} else if (administrativeRegionListIds[fieldCode]) {
		control = `<input class="field-control" type="text" list="${administrativeRegionListIds[fieldCode]}" autocomplete="off" ${attributes}${requiredControlAttribute} value="${escapeHtml(value ?? '')}" />`;
	} else {
		const inputType = type === '日期' ? 'date' : ['整数', '数值'].includes(type) ? 'number' : 'text';
		control = `<input class="field-control" type="${inputType}"${type === '数值' ? ' step="any"' : ''} ${attributes}${requiredControlAttribute} value="${escapeHtml(value ?? '')}" />`;
	}
	const wrapperTag = fieldCode === 'object_type' ? 'div' : 'label';
	const help = fieldCode === 'object_type'
		? '首页和管理端共用同一套七类；一个分类对应多个正式类型时，再选择精确类型。'
		: definition?.rule || (multi && !options.length ? '多项内容请每行填写一项。' : '');
	const notes = `${context ? `<span class="field-context">${escapeHtml(context)}</span>` : ''}${help ? `<span class="field-help">${escapeHtml(help)}</span>` : ''}`;
	return `<${wrapperTag} class="form-field ${wide ? 'is-wide' : ''} ${fieldCode === 'object_type' ? 'is-object-type' : ''}">
		<span class="field-label">${escapeHtml(label)}${required ? '<span class="required-mark">必填</span>' : ''}<small>${escapeHtml(fieldCode)}</small></span>
		${control}${notes ? `<span class="field-notes">${notes}</span>` : ''}
	</${wrapperTag}>`;
};

const renderBasic = () => {
	const primaryDefinitions = primaryCoreFields.map((fieldCode) => commonDefinition(fieldCode)).filter(Boolean)
		.filter((definition) => definition.field_code !== 'object_type')
		.sort((left, right) => Number(Boolean(right.required)) - Number(Boolean(left.required)));
	const objectTypeDefinition = commonDefinition('object_type');
	const objectTypeField = objectTypeDefinition ? renderField({
		fieldCode: objectTypeDefinition.field_code,
		definition: objectTypeDefinition,
		value: state.current.core.object_type,
		required: objectTypeDefinition.required,
	}) : '';
	const primary = primaryDefinitions
		.map((definition) => {
			const rule = basicFieldRule(definition.field_code);
			return renderField({ fieldCode: definition.field_code, definition,
				value: state.current.core[definition.field_code], required: definition.required || rule.required,
				context: rule.context });
		}).join('');
	const remainingBySection = new Map();
	const coreCanonical = coreCanonicalFieldCodes();
	const dimensionFields = dimensionFieldCodes();
	for (const definition of state.standards.commonFields.fields) {
		if (managedCoreFields.has(definition.field_code) || hiddenCommonFieldCodes.has(definition.field_code) ||
			primaryCoreFields.includes(definition.field_code) || definition.data_type === '公式' ||
			(dimensionFields.has(definition.field_code) && !coreCanonical.has(definition.field_code))) continue;
		if (!remainingBySection.has(definition.section)) remainingBySection.set(definition.section, []);
		remainingBySection.get(definition.section).push(definition);
	}
	const moreFieldGroups = [...remainingBySection.entries()].map(([section, definitions], originalIndex) => {
		const fields = definitions.map((definition) => {
			const rule = basicFieldRule(definition.field_code);
			return { definition, rule, required: Boolean(definition.required || rule.required) };
		}).sort((left, right) => Number(right.required) - Number(left.required));
		const requiredCount = fields.filter((field) => field.required).length;
		return { section, fields, requiredCount, originalIndex };
	}).sort((left, right) =>
		Number(right.requiredCount > 0) - Number(left.requiredCount > 0) ||
		left.originalIndex - right.originalIndex);
	const moreFields = moreFieldGroups.map(({ section, fields, requiredCount }) => {
		const requiredBadge = requiredCount
			? `<strong class="more-fields-required">必填 ${requiredCount} 项</strong>`
			: '';
		return `
		<details class="more-fields"><summary><span class="more-fields-summary-title">${escapeHtml(section)} · ${fields.length} 个字段</span>${requiredBadge}</summary><div class="form-grid">
		${fields.map(({ definition, rule, required }) => renderField({
			fieldCode: definition.field_code,
			definition,
			value: state.current.core[definition.field_code],
			required,
			context: rule.context,
		})).join('')}</div></details>`;
	}).join('');
	return `<section class="form-section">
		<div class="section-heading"><div><h3>常用档案信息</h3><p>必填字段已排在前面；永久编号首次保存后不变，收藏品编码由正式对象类型、显示年代和必填属性代码组成。</p></div></div>
		<div class="form-grid common-info-grid"><label class="form-field is-item-id"><span class="field-label">永久编号 <small>item_id</small></span>
		<input type="text" value="${escapeHtml(state.current.core.item_id || '尚未分配')}" readonly /></label>
		<label class="form-field is-code-output"><span class="field-label">收藏品编码 <small>collection_code</small></span>
		<input type="text" data-collection-code-output value="${escapeHtml(state.current.core.collection_code || '请先填写收藏品编码组成字段')}" readonly />
		<span class="field-notes"><span class="field-help">系统自动生成，不需要手工填写。</span></span></label>
		${objectTypeField}${primary}</div>
	</section>
	<section class="basic-code-logic-panel" aria-label="编码生成逻辑">
		<aside class="collection-code-logic is-inline" data-collection-code-logic>${renderCollectionCodeLogic()}</aside>
	</section>
	<section class="form-section"><div class="section-heading"><div><h3>访客看到的内容</h3><p>这些文字会进入公开页面，请不要填写敏感信息。</p></div></div>
		<div class="form-grid">${renderField({ scope: 'public', fieldCode: 'description', value: state.current.public_view.description })}
		${renderField({ scope: 'public', fieldCode: 'transcription', value: state.current.public_view.transcription })}
		${renderField({
			scope: 'public',
			fieldCode: 'revision_note',
			definition: {
				name: '公开修订说明',
				rule: '只有题名、判断、转录或来源说明发生实质变化时填写；一两句话说明改了什么，不记录内部操作过程。',
			},
			value: state.current.public_view.revision_note,
		})}
		${renderField({ scope: 'public', fieldCode: 'tags', value: state.current.public_view.tags })}
		${renderField({ scope: 'public', fieldCode: 'place_display', value: state.current.public_view.place_display })}
		${renderField({ scope: 'public', fieldCode: 'place_filters', value: state.current.public_view.place_filters })}</div>
	</section>
	<section class="form-section"><div class="section-heading"><div><h3>更多通用字段</h3><p>通用内容只在这里填写；对象专属必填规则会直接标在对应字段上，不再到专属页重复填写。</p></div></div>${moreFields}</section>`;
};

const renderImages = () => {
	const hasUnsavedImages = state.images.some((image) => image.kind === 'new');
	const needsPublicationCopyConfirmation = hasUnsavedImages && !state.confirmedPublicationCopies;
	const imageCards = state.images.map((image, index) => `
		<article class="image-card"><div class="image-preview"><img src="${escapeHtml(image.previewUrl)}" alt="发布图片 ${index + 1}" /></div>
		<div class="image-meta"><strong>${escapeHtml(image.filename ?? image.file?.name ?? '新图片')}</strong>
		<span>页面显示顺序：${index + 1}${image.kind === 'new' ? ' · 尚未保存' : ''}</span>
		<label class="image-description-field"><span>图片说明 <small>访客和屏幕阅读器可见</small></span>
		<textarea data-image-description data-image-id="${escapeHtml(image.id)}" maxlength="180" rows="3" placeholder="例如：明信片正面，富士山风景图">${escapeHtml(image.description ?? '')}</textarea>
		<small>只描述画面中能够确认的内容，不推断人物身份；不填时使用题名加正面、背面或细节图。</small></label>
		<div class="image-actions">
		<button class="small-button" data-image-action="up" data-image-id="${escapeHtml(image.id)}" type="button" ${index === 0 ? 'disabled' : ''}>向前</button>
		<button class="small-button" data-image-action="down" data-image-id="${escapeHtml(image.id)}" type="button" ${index === state.images.length - 1 ? 'disabled' : ''}>向后</button>
		${image.kind === 'existing' ? `<label class="replacement-label">替换<input class="replacement-input" data-image-id="${escapeHtml(image.id)}" type="file" accept="image/jpeg,image/png,image/webp" /></label>` : ''}
		<button class="small-button is-danger" data-image-action="remove" data-image-id="${escapeHtml(image.id)}" type="button">移除</button>
		</div></div></article>`).join('');
	const pendingRemoval = state.pendingRemovedImages.length ? `<div class="pending-removal-list">
		${state.pendingRemovedImages.map((image) => `<div class="pending-removal"><span>${escapeHtml(image.filename)} · 正式发布后进入本地回收区</span>
		<button class="small-button" data-image-action="undo-remove" data-image-filename="${escapeHtml(image.filename)}" type="button">撤销移除</button></div>`).join('')}
	</div>` : '';
	const preflight = state.imagePreflight.length ? `<section class="image-preflight ${state.imagePreflight.some((entry) => !entry.accepted) ? 'has-blocked' : 'is-clear'}" aria-label="图片上传前检查结果">
		<div><strong>上传前检查</strong><span>${state.imagePreflight.filter((entry) => entry.accepted).length} 张通过，${state.imagePreflight.filter((entry) => !entry.accepted).length} 张已拦截</span></div>
		<ul>${state.imagePreflight.map((entry) => `<li class="${entry.accepted ? 'is-accepted' : 'is-blocked'}"><strong>${escapeHtml(entry.name)}</strong><span>${escapeHtml(entry.messages.join('；'))}</span></li>`).join('')}</ul>
	</section>` : '';
	return `<section class="form-section"><div class="section-heading"><div><h3>发布图片</h3><p>一次选择多张图片，再用“向前 / 向后”调整页面顺序。</p></div></div>
		<label class="image-dropzone"><strong>选择 JPG、PNG 或 WebP 发布副本</strong>
		<span>单张不超过 30 MB；不接收 TIFF、RAW、PSD、DNG 或名称含“主档 / 原始”的文件。</span>
		<input id="image-input" type="file" accept="image/jpeg,image/png,image/webp" multiple /></label>
		${preflight}
		${hasUnsavedImages ? `<label class="confirm-box ${needsPublicationCopyConfirmation ? 'is-required' : ''}"><input id="publication-copy-confirm" type="checkbox" ${state.confirmedPublicationCopies ? 'checked' : ''} />
		<span>我确认新选择的图片是从原始档案中另行制作、经过筛选并完成必要脱敏的发布副本，不是唯一主档或原始扫描件。
		${needsPublicationCopyConfirmation ? '<strong class="confirm-save-note">保存草稿前必须确认这一项；未确认时不会保存，也不会生成永久编号。</strong>' : ''}</span></label>` : ''}
		${state.images.length ? `<div class="image-list">${imageCards}</div>` : '<div class="empty-state">还没有图片。草稿可以暂时无图保存，但正式发布前至少需要一张。</div>'}
		${pendingRemoval}
		<div class="privacy-warning">已保存图片的“移除”和“替换”会先记录在草稿中。只有正式发布成功后，旧发布副本才会进入本地回收区；不会永久删除，也不会影响原始档案主文件。</div>
	</section>`;
};

const renderWithdrawnImages = () => {
	const imageCards = state.images.map((image, index) => `
		<figure class="withdrawn-image-card"><img src="${escapeHtml(image.previewUrl)}" alt="${escapeHtml(displayedImageDescription(state.current, image, index, state.images.length))}" />
		<figcaption><strong>${escapeHtml(image.filename ?? `图片 ${index + 1}`)}</strong><span>${escapeHtml(displayedImageDescription(state.current, image, index, state.images.length))} · 原发布顺序 ${index + 1}</span></figcaption></figure>`).join('');
	return `<section class="form-section"><div class="section-heading"><div><h3>撤销前的发布图片</h3>
		<p>这里只读显示撤销时保留的发布副本，不提供替换、移除或重新公开操作。</p></div></div>
		${imageCards ? `<div class="withdrawn-image-grid">${imageCards}</div>` : '<div class="empty-state">这条撤销记录没有可显示的发布图片。</div>'}</section>`;
};

const renderSpecific = () => {
	const schema = state.current.metadata.schema;
	if (schema === 'common') {
		const typeCode = state.current.core.object_type;
		const typeOption = (state.dictionary.get('object_type') ?? []).find((option) => option.code === typeCode);
		const typeDisplay = typeOption ? `${typeOption.label}（${typeCode}）` : typeCode;
		return `<div class="empty-state">${escapeHtml(typeDisplay)}当前只使用通用管理元数据，不建立不存在的专属 21 维。</div>`;
	}
	const standard = state.standards.dimensions[schema];
	const coreCanonical = coreCanonicalFieldCodes();
	const requiredDimensions = currentCollectionRules()?.required_dimensions ?? [];
	const requiredByCode = new Map(requiredDimensions.map((dimension) => [dimension.dimension_code, dimension]));
	const collectionCodeFields = requiredDimensions.flatMap((dimension) =>
		(dimension.code_fields ?? []).map((codeField) => ({ dimension, codeField })));
	const collectionCodeFieldNames = new Map(requiredDimensions.map((dimension) => [
		dimension.dimension_code,
		new Set((dimension.code_fields ?? []).map((field) => field.field_code)),
	]));
	const globalCollectionCodeFieldNames = new Set(
		(state.standards.collectionCodeRules.global_code_fields ?? []).map((field) => field.field_code),
	);
	const localCollectionCodeFields = collectionCodeFields.filter(({ codeField }) =>
		codeField.scope !== 'core' && !coreCanonical.has(codeField.field_code));
	const encodingFields = localCollectionCodeFields.map(({ dimension, codeField }) => renderField({
		scope: codeField.scope === 'core' ? 'core' : 'metadata',
		dimension: dimension.dimension_code,
		fieldCode: codeField.field_code,
		definition: commonDefinition(codeField.field_code),
		value: collectionRuleFieldValue(dimension.dimension_code, codeField),
		required: true,
		readonly: codeField.scope === 'core',
		context: `${dimension.dimension_code} · ${dimension.name} · 代码字典：${codeField.dictionary_key}`,
		dictionaryKey: codeField.dictionary_key,
	})).join('');
	const orderedDimensions = [...standard.dimensions].sort((left, right) => {
		const leftRule = requiredByCode.get(left.dimension_code);
		const rightRule = requiredByCode.get(right.dimension_code);
		const leftRequiredWithoutCode = Boolean(leftRule && !leftRule.code_fields?.length);
		const rightRequiredWithoutCode = Boolean(rightRule && !rightRule.code_fields?.length);
		return Number(rightRequiredWithoutCode) - Number(leftRequiredWithoutCode);
	});
	const cards = orderedDimensions.map((dimension) => {
		const values = state.current.metadata.dimensions[dimension.dimension_code] ?? {};
		const requiredRule = requiredByCode.get(dimension.dimension_code);
		const codeFieldNames = collectionCodeFieldNames.get(dimension.dimension_code) ?? new Set();
		const visibleFieldCodes = dimension.fields.filter((fieldCode) =>
			!['master_file_path', 'access_file_path', 'publication_file_path', 'signatures', 'fingerprints'].includes(fieldCode) &&
			!hiddenSpecificFieldCodes.has(fieldCode) && !hiddenCommonFieldCodes.has(fieldCode) &&
			!coreCanonical.has(fieldCode) && !codeFieldNames.has(fieldCode) && !globalCollectionCodeFieldNames.has(fieldCode));
		const fields = visibleFieldCodes
			.map((fieldCode) => {
				const configuredField = (requiredRule?.fields ?? []).map(normalizeRuleField)
					.find((field) => field.field_code === fieldCode);
				const scope = configuredField?.scope === 'core' ? 'core' : 'metadata';
				const value = requiredRule
					? collectionRuleFieldValue(dimension.dimension_code, configuredField ?? fieldCode)
					: values[fieldCode];
				return renderField({
					scope,
					dimension: dimension.dimension_code,
					fieldCode,
					definition: commonDefinition(fieldCode),
					value,
				});
			}).join('');
		if (!fields) return '';
		const filled = visibleFieldCodes.filter((fieldCode) => hasMeaningfulValue(
			requiredRule ? collectionRuleFieldValue(dimension.dimension_code, fieldCode) : values[fieldCode],
		)).length;
		const localRequiredFields = (requiredRule?.fields ?? []).map(normalizeRuleField)
			.filter((field) => field.scope !== 'core' && !coreCanonical.has(field.field_code) &&
				!globalCollectionCodeFieldNames.has(field.field_code));
		const requiresOneField = Boolean(requiredRule && !requiredRule.code_fields?.length && localRequiredFields.length);
		const localCodeFieldCount = (requiredRule?.code_fields ?? []).map(normalizeRuleField)
			.filter((field) => field.scope !== 'core' && !coreCanonical.has(field.field_code)).length;
		const satisfiedByBasicField = Boolean(requiredRule &&
			(requiredRule.fields ?? []).map(normalizeRuleField)
				.some((field) => field.scope === 'core' || coreCanonical.has(field.field_code)));
		const badge = requiresOneField
			? '<span class="dimension-required">必填 · 至少一项</span>'
			: localCodeFieldCount ? '<span class="dimension-code-moved">编码字段已前置</span>'
				: satisfiedByBasicField ? '<span class="dimension-code-moved">必填 · 由基本信息满足</span>' : '';
		return `<details class="dimension-card ${requiresOneField ? 'is-required' : ''}" ${requiresOneField || filled ? 'open' : ''}><summary><span>${escapeHtml(dimension.dimension_code)} · ${escapeHtml(dimension.name)}${filled ? ` · 已填 ${filled} 项` : ''}</span>${badge}</summary>
		<div class="dimension-content">${requiresOneField ? '<p class="required-guidance">这是 Excel 中已打勾但当前没有正式字典代码的必填维度，其中至少填写一项。</p>' : ''}<p class="field-help">${escapeHtml(dimension.rule)}；不确定时：${escapeHtml(dimension.uncertainty_rule)}</p>
		<div class="form-grid">${fields}</div></div></details>`;
	}).join('');
	return `<section class="form-section"><div class="section-heading"><div><h3>${escapeHtml(specificSchemaLabels[schema] ?? standard.system)}</h3><p>这里只填写当前类型独有的信息；通用字段统一回到“基本信息”，此处不再重复显示。</p></div></div>
		<section class="collection-code-fields"><div class="collection-code-heading"><div><h4>收藏品编码组成字段</h4><p>以下字段全部必填，修改后会立即重新生成编码。</p></div><output data-collection-code-output>${escapeHtml(state.current.core.collection_code || '请先填写收藏品编码组成字段')}</output></div>
		<div class="form-grid">${encodingFields}</div><aside class="collection-code-logic is-inline" data-collection-code-logic>${renderCollectionCodeLogic()}</aside></section>
		<div class="section-heading secondary"><div><h4>其他属性字段</h4><p>其余必填维度已排在普通可选维度前面；只填写有依据的内容。</p></div></div>${cards}</section>`;
};

const renderPrivacy = () => {
	const core = state.current.core;
	const qualityWarnings = contentQualityWarnings();
	return `<section class="form-section"><div class="section-heading"><div><h3>隐私与正式发布</h3><p>每次发布都必须由你本人逐项检查，不能由程序代替判断。</p></div></div>
		<div class="status-grid"><div class="status-card"><span>档案状态</span><strong>${escapeHtml(core.record_status === 'ACT' ? '有效' : core.record_status === 'WDR' ? '已撤销' : '草稿／暂停')}</strong></div>
		<div class="status-card"><span>隐私等级</span><strong>${escapeHtml(core.privacy_level === 'G' ? '可公开' : core.privacy_level === 'R' ? '限制' : '待判断')}</strong></div>
		<div class="status-card"><span>使用状态</span><strong>${escapeHtml(core.use_status === 'U3' ? '已发布' : '未发布')}</strong></div></div>
		${renderContentQualityPanel(qualityWarnings, '发布前内容质量提示')}
		<label class="privacy-select-all"><input id="privacy-select-all" type="checkbox" checked /><span><strong>全选</strong><small>我已逐项阅读并确认以下全部检查内容。</small></span></label>
		<ol class="privacy-list">${privacyChecks.map((text, index) => `<li><label class="privacy-item"><input type="checkbox" data-privacy-index="${index}" checked /><span>${index + 1}. ${escapeHtml(text)}</span></label></li>`).join('')}</ol>
		<div class="privacy-warning">以下项目按你的设置默认选中。如果任何一项不能确认，请先取消该项，也不要发布。保存草稿不会把图片复制到网站公开目录。</div>
	</section>`;
};

const currentPreviewIssues = () => {
	const issues = [];
	const add = (code, tab, message, field = '') => issues.push({ code, tab, message, field });
	if (!state.current.core.item_id) add('item_id', 'basic', '保存一次草稿后才会生成永久编号。', 'item_id');
	for (const definition of state.standards.commonFields.fields.filter((candidate) => candidate.required)) {
		if (['record_status', 'item_id', 'privacy_level', 'created_date'].includes(definition.field_code)) continue;
		const value = state.current.core[definition.field_code];
		if (value === undefined || value === null || value === '' || (Array.isArray(value) && !value.length)) {
			add(`required_${definition.field_code}`, 'basic', `${definition.name}尚未填写。`, definition.field_code);
		}
	}
	if (state.current.metadata.schema !== schemaForType(state.current.core.object_type)) {
		add('schema', 'specific', '藏品类型与对象专属信息结构不一致。');
	}
	issues.push(...getCollectionCodeResult().issues);
	if (!state.images.length) add('images_empty', 'images', '正式发布前至少需要一张发布图片。');
	if (state.images.some((image) => image.kind === 'new') && !state.confirmedPublicationCopies) {
		add('publication_copy_confirmation', 'images', '请先确认新增图片是经过筛选、压缩并完成必要脱敏的发布副本；确认后才能保存草稿。', 'publication-copy-confirm');
	}
	add('privacy_confirmation', 'privacy', '正式发布时仍需由你本人完成全部 13 项隐私检查。');
	const serverIssues = state.validationIssues.filter((issue) =>
		!issues.some((candidate) => candidate.code === issue.code ||
			(candidate.field && candidate.field === issue.field && candidate.tab === issue.tab)));
	return [...issues, ...serverIssues];
};

const draftSavePrerequisiteIssues = () => {
	const issues = [];
	const add = (code, tab, message, field = '') => issues.push({ code, tab, message, field });
	if (!/^\d{4}-\d{2}-\d{2}$/.test(state.current?.core?.accession_date ?? '')) {
		add('draft_accession_date', 'basic', '草稿未保存：请先填写正确的入藏日期。', 'accession_date');
	}
	if (!state.current?.core?.object_type) {
		add('draft_object_type', 'basic', '草稿未保存：请先选择正式的藏品类型。', 'object_type');
	}
	if (!state.current?.core?.title?.trim()) {
		add('draft_title', 'basic', '草稿未保存：请先填写题名。', 'title');
	}
	if (state.images.some((image) => image.kind === 'new') && !state.confirmedPublicationCopies) {
		add('publication_copy_confirmation', 'images', '草稿未保存：请先确认新增图片是经过筛选、压缩并完成必要脱敏的发布副本。', 'publication-copy-confirm');
	}
	return issues;
};

const updateTaskSummary = () => {
	if (!state.current || state.workspaceMode !== 'records') {
		elements.taskSummary.hidden = true;
		return;
	}

	const readonly = isWithdrawn();
	const issues = readonly ? [] : currentPreviewIssues().filter((issue) => issue.code !== 'privacy_confirmation');
	const tabOrder = ['basic', 'images', 'specific'];
	const tabLabels = { basic: '基本资料', images: '发布图片', specific: '专属资料', privacy: '隐私确认' };
	const counts = new Map(tabOrder.map((tab) => [tab, issues.filter((issue) => issue.tab === tab).length]));
	const waitingForExactType = Boolean(state.pendingObjectCategory);
	let title = '完成隐私检查并发布';
	let detail = '资料与发布图片已齐备；发布前仍需由你本人逐项完成隐私判断。';

	if (readonly) {
		title = state.current._admin?.canRestoreWithdrawn ? '如需修改，先恢复为草稿' : '保留为只读撤销记录';
		detail = state.current._admin?.canRestoreWithdrawn
			? '恢复不会直接公开；完成内容、图片和隐私检查后才可以重新发布。'
			: state.current._admin?.restoreWithdrawnReason || '当前记录仅用于本地追溯。';
	} else if (waitingForExactType) {
		title = '先选择精确资料类型';
		detail = '完成精确类型后，系统才能套用正确的专属字段和编码规则。';
	} else if (state.dirty) {
		title = '先保存当前修改';
		detail = issues.length ? `保存后继续处理 ${issues.length} 个待补项目。` : '当前修改尚未保存到本地草稿。';
	} else if (issues.length) {
		const firstTab = tabOrder.find((tab) => (counts.get(tab) ?? 0) > 0) ?? issues[0].tab;
		title = `继续完善${tabLabels[firstTab] ?? '档案资料'}`;
		detail = `目前还有 ${issues.length} 个发布前待补项目，先从最靠前的一组开始。`;
	} else if (state.current.core.use_status === 'U3' && !state.current._admin?.hasDraft) {
		title = '当前档案已发布';
		detail = '可以直接查看公开档案；如需修改，保存草稿后再重新检查发布。';
	}

	elements.taskSummaryTitle.textContent = title;
	elements.taskSummaryDetail.textContent = detail;
	if (readonly) {
		elements.taskChips.innerHTML = '<span class="task-chip is-muted">基本资料 · 只读</span><span class="task-chip is-muted">发布图片 · 只读</span>';
	} else {
		elements.taskChips.innerHTML = `${tabOrder.map((tab) => {
			const count = counts.get(tab) ?? 0;
			return `<button class="task-chip ${count ? 'is-warning' : 'is-complete'}" type="button" data-task-tab="${tab}">${tabLabels[tab]} · ${count ? `待处理 ${count} 项` : '完成'}</button>`;
		}).join('')}<button class="task-chip is-pending" type="button" data-task-tab="privacy">隐私确认 · 待人工确认</button>`;
	}
	elements.taskSummary.hidden = false;
};

const contentQualityWarnings = () => {
	if (!state.current) return [];
	const record = state.current;
	const title = record.core.title?.trim() ?? '';
	const description = record.public_view.description?.trim() ?? '';
	const warnings = [];
	const add = (code, tab, field, message) => warnings.push({ code, tab, field, message });
	if (title && (title.length < 4 || /^(未命名|无题|老照片|照片|明信片|信件|证件|档案)$/.test(title))) {
		add('quality_title_generic', 'basic', 'title', '题名较宽泛，建议加入人物、地点、物件或事件线索，便于以后识别。');
	}
	if (title && state.records.some((candidate) =>
		candidate.core.item_id !== record.core.item_id && candidate.core.title?.trim() === title)) {
		add('quality_title_duplicate', 'basic', 'title', '题名与另一条档案完全相同，建议核对是否需要增加区分信息。');
	}
	if (description && description.length < 30) {
		add('quality_description_short', 'basic', 'description', '公开简介较短，建议补充资料内容、来源或仍待确认的线索。');
	}
	if (title && description && description.replace(/[，。；：、\s]/g, '') === title.replace(/\s/g, '')) {
		add('quality_description_repeats_title', 'basic', 'description', '公开简介与题名基本重复，建议补充题名之外的信息。');
	}
	const missingDescriptions = state.images.filter((image) => !image.description?.trim()).length;
	if (missingDescriptions) {
		add('quality_image_descriptions_missing', 'images', '', `${missingDescriptions} 张图片尚未填写人工说明；建议区分正面、背面或细节。`);
	}
	const filledDescriptions = state.images.map((image) => image.description?.trim()).filter(Boolean);
	if (filledDescriptions.length > 1 && new Set(filledDescriptions).size === 1) {
		add('quality_image_descriptions_duplicate', 'images', '', '多张图片使用了完全相同的说明，建议分别说明正反面或画面差异。');
	}
	const uncertaintyWords = /未知|不详|疑似|可能|约|待考|尚未|无法确认|暂不能确认/;
	if (record.core.evidence_level === 'D' && description.length >= 20 && !uncertaintyWords.test(description)) {
		add('quality_uncertainty_tone', 'basic', 'description', '证据等级仍为“未知”，但公开简介没有不确定性提示；请核对是否把推测写成了确定事实。');
	}
	return warnings;
};

const renderContentQualityPanel = (warnings, title = '内容质量提示') => `<section class="content-quality-panel ${warnings.length ? 'has-warning' : 'is-complete'}">
	<div><strong>${escapeHtml(title)}</strong><span>这些提示帮助人工复核，不会自动改写资料，也不阻止保存草稿。</span></div>
	${warnings.length ? `<ul>${warnings.map((warning) => `<li><button class="issue-button" data-issue-tab="${escapeHtml(warning.tab)}" data-issue-field="${escapeHtml(warning.field)}" type="button">${escapeHtml(warning.message)}</button></li>`).join('')}</ul>` : '<p>当前未发现明显的题名、简介或图片说明质量问题。</p>'}
</section>`;

const renderPreview = () => {
	const record = state.current;
	const issues = currentPreviewIssues();
	const qualityWarnings = contentQualityWarnings();
	const description = record.public_view.description || '尚未填写公开简介。';
	const transcription = record.public_view.transcription;
	const tags = record.public_view.tags ?? [];
	const place = record.public_view.place_display;
	const imageGallery = state.images.length
		? state.images.map((image, index) => `<figure><img src="${escapeHtml(image.previewUrl)}" alt="${escapeHtml(displayedImageDescription(record, image, index, state.images.length))}" />
			<figcaption>${escapeHtml(displayedImageDescription(record, image, index, state.images.length))}</figcaption></figure>`).join('')
		: '<div class="empty-state">访客页面暂时没有可显示的图片。</div>';
	return `<div class="preview-shell"><article class="visitor-preview">
		<p class="preview-label">VISITOR PAGE PREVIEW · 访客页面近似预览</p>
		<h3>${escapeHtml(record.core.title || '未命名藏品')}</h3>
		<p class="preview-id">永久编号：${escapeHtml(record.core.item_id || '尚未生成')}${place ? ` · ${escapeHtml(place)}` : ''}</p>
		<p class="preview-collection-code">收藏品编码：<span data-collection-code-output>${escapeHtml(record.core.collection_code || '请先填写收藏品编码组成字段')}</span></p>
		<div class="preview-gallery">${imageGallery}</div>
		<div class="preview-copy"><p>${escapeHtml(description)}</p>
		${transcription ? `<p><strong>文字记录：</strong>${escapeHtml(transcription)}</p>` : ''}
		${tags.length ? `<div class="preview-tags">${tags.map((tag) => `<span>${escapeHtml(tag)}</span>`).join('')}</div>` : ''}</div>
	</article><aside class="check-panel"><h4>发布前缺失项</h4>
		<p>点击一项可回到相应位置处理。预览不会把草稿公开。</p>
		${issues.length ? `<ul class="issue-list">${issues.map((issue) => `<li><button class="issue-button" data-issue-tab="${escapeHtml(issue.tab)}" data-issue-field="${escapeHtml(issue.field ?? '')}" type="button">${escapeHtml(issue.message)}</button></li>`).join('')}</ul>`
			: '<div class="check-complete">字段、图片与隐私检查均已通过，可以正式发布。</div>'}
		${renderContentQualityPanel(qualityWarnings)}
	</aside></div>`;
};

function renderEditor() {
	if (state.workspaceMode !== 'records') {
		renderWorkspaceCenter();
		return;
	}
	if (!state.current) {
		elements.editorSurface.innerHTML = '<div class="empty-state">点击“新建藏品”开始建立草稿。</div>';
		return;
	}
	updateTabCompletionBadges();
	if (isWithdrawn()) {
		const reason = state.current._admin?.withdrawalReason;
		const restoreMessage = state.current._admin?.canRestoreWithdrawn
			? '如需重新维护，请使用右上角“恢复为草稿”，重新完成检查后才能发布。'
			: state.current._admin?.restoreWithdrawnReason || '这条记录继续作为只读追溯记录保留。';
		elements.editorSurface.innerHTML = `<div class="withdrawn-record-notice"><strong>这是一条已撤销的只读档案</strong>
			<span>${reason ? `撤销原因：${escapeHtml(reason)}。` : ''}${escapeHtml(restoreMessage)}</span></div>${state.activeTab === 'images' ? renderWithdrawnImages() : renderBasic()}`;
		elements.editorSurface.querySelectorAll('input, textarea, select').forEach((control) => { control.disabled = true; });
		return;
	}
	if (state.activeTab === 'images') elements.editorSurface.innerHTML = renderImages();
	else if (state.activeTab === 'specific') elements.editorSurface.innerHTML = renderSpecific();
	else if (state.activeTab === 'preview') elements.editorSurface.innerHTML = renderPreview();
	else if (state.activeTab === 'privacy') elements.editorSurface.innerHTML = renderPrivacy();
	else elements.editorSurface.innerHTML = renderBasic();
}

const updateTabCompletionBadges = () => {
	const tabs = [...document.querySelectorAll('.tab')];
	if (!state.current) {
		tabs.forEach((tab) => { tab.querySelector('[data-tab-status]').textContent = ''; });
		return;
	}
	if (isWithdrawn()) {
		tabs.forEach((tab) => {
			const badge = tab.querySelector('[data-tab-status]');
			badge.textContent = ['basic', 'images'].includes(tab.dataset.tab) ? '只读' : '';
			badge.className = badge.textContent ? 'is-muted' : '';
		});
		return;
	}

	const issues = currentPreviewIssues();
	const actionableIssues = issues.filter((issue) => issue.code !== 'privacy_confirmation');
	const counts = new Map(['basic', 'images', 'specific', 'privacy'].map((tab) => [
		tab,
		actionableIssues.filter((issue) => issue.tab === tab).length,
	]));

	tabs.forEach((tab) => {
		const badge = tab.querySelector('[data-tab-status]');
		const tabName = tab.dataset.tab;
		const missingCount = tabName === 'preview'
			? actionableIssues.length
			: counts.get(tabName) ?? 0;
		if (missingCount > 0) {
			badge.textContent = `${missingCount} 项`;
			badge.className = 'is-warning';
		} else if (tabName === 'privacy') {
			badge.textContent = '待确认';
			badge.className = 'is-pending';
		} else if (tabName === 'preview') {
			badge.textContent = '可预览';
			badge.className = 'is-complete';
		} else {
			badge.textContent = '完成';
			badge.className = 'is-complete';
		}
	});
};

const renderTabs = () => {
	document.querySelectorAll('.tab').forEach((tab) => {
		const unavailableForWithdrawn = isWithdrawn() && !['basic', 'images'].includes(tab.dataset.tab);
		const isActive = tab.dataset.tab === state.activeTab;
		tab.classList.toggle('is-active', isActive);
		tab.disabled = unavailableForWithdrawn;
		tab.setAttribute('aria-selected', String(isActive));
		tab.tabIndex = isActive ? 0 : -1;
		tab.title = unavailableForWithdrawn ? '撤销追溯记录只提供基本信息和原发布图片查看' : '';
	});
	elements.editorSurface.setAttribute('aria-labelledby', `tab-${state.activeTab}`);
	updateTabCompletionBadges();
};

const cleanValue = (control) => {
	if (control.type === 'number') return control.value === '' ? undefined : Number(control.value);
	if (control.dataset.array === 'true') {
		const values = control.value.split(/\r?\n/).map((value) => value.trim()).filter(Boolean);
		return values.length ? values : undefined;
	}
	return control.value.trim() || undefined;
};

const setFieldValue = (scope, dimension, fieldCode, value) => {
	let target;
	if (scope === 'public') target = state.current.public_view;
	else if (scope === 'metadata') {
		state.current.metadata.dimensions[dimension] ??= {};
		target = state.current.metadata.dimensions[dimension];
	} else target = state.current.core;
	if (value === undefined || (Array.isArray(value) && value.length === 0)) delete target[fieldCode];
	else target[fieldCode] = value;
	if (scope === 'metadata' && Object.keys(target).length === 0) delete state.current.metadata.dimensions[dimension];
	updateDerivedCollectionCode();
	updateCollectionCodeDisplays();
	state.dirty = true;
	state.validationIssues = [];
	updateTabCompletionBadges();
	updateHeader();
};

const applyObjectTypeChange = (value) => {
	const previousObjectType = state.current.core.object_type;
	if (value === previousObjectType) return true;
	if (Object.keys(state.current.metadata.dimensions).length &&
		!window.confirm('更换藏品类型后，原来的对象专属字段会从这份草稿中清空。确定继续吗？')) {
		return false;
	}
	state.current.metadata = { schema: schemaForType(value), dimensions: {} };
	setFieldValue('core', '', 'object_type', value);
	return true;
};

const handleObjectCategoryChange = (control) => {
	const category = objectTypeCategories().find((candidate) => candidate.slug === control.value);
	const dictionaryOptions = state.dictionary.get('object_type') ?? [];
	const exactOptions = objectTypeOptionsForCategory(category, dictionaryOptions);
	const currentCategory = categoryForObjectType(state.current.core.object_type);
	if (!category || category.slug === currentCategory?.slug) {
		state.pendingObjectCategory = '';
		renderEditor();
		updateHeader();
		return;
	}
	if (exactOptions.length === 1) {
		if (!applyObjectTypeChange(exactOptions[0].code)) {
			state.pendingObjectCategory = '';
			renderEditor();
			updateHeader();
			return;
		}
		state.pendingObjectCategory = '';
		renderEditor();
		updateHeader();
		return;
	}
	state.pendingObjectCategory = category.slug;
	renderEditor();
	updateHeader();
	requestAnimationFrame(() => elements.editorSurface.querySelector('.object-type-control')?.focus());
};

const handleFieldChange = (control) => {
	const { scope, dimension, field: fieldCode } = control.dataset;
	if (!fieldCode) return;
	if (control.type === 'checkbox') {
		const selector = `.field-control[type="checkbox"][data-scope="${scope}"][data-dimension="${dimension}"][data-field="${fieldCode}"]`;
		const values = [...elements.editorSurface.querySelectorAll(selector)].filter((input) => input.checked).map((input) => input.value);
		setFieldValue(scope, dimension, fieldCode, values.length ? values : undefined);
		return;
	}
	const value = cleanValue(control);
	if (scope === 'core' && fieldCode === 'object_type') {
		if (!value || !applyObjectTypeChange(value)) {
			state.pendingObjectCategory = '';
			renderEditor();
			updateHeader();
			return;
		}
		state.pendingObjectCategory = '';
		renderEditor();
		updateHeader();
		return;
	}
	setFieldValue(scope, dimension, fieldCode, value);
};

const fileToDataUrl = (file) => new Promise((resolve, reject) => {
	const reader = new FileReader();
	reader.onload = () => resolve(reader.result);
	reader.onerror = () => reject(new Error(`无法读取图片：${file.name}`));
	reader.readAsDataURL(file);
});

const validateSelectedImage = (file) => {
	if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) return `不支持图片格式：${file.name}`;
	if (file.size > 30 * 1024 * 1024) return `图片超过 30 MB：${file.name}`;
	if (/(master|original|raw|主档|原始)/i.test(file.name)) return `文件名疑似主档或原始文件，已停止接收：${file.name}`;
	return '';
};

const fileSha256 = async (file) => {
	const digest = await crypto.subtle.digest('SHA-256', await file.arrayBuffer());
	return [...new Uint8Array(digest)].map((value) => value.toString(16).padStart(2, '0')).join('');
};

const createNewImage = (file, description = '', sha256 = '') => ({
	id: `new-${crypto.randomUUID()}`, kind: 'new', file, previewUrl: URL.createObjectURL(file), description, sha256,
});

const preflightSelectedImages = async (files) => {
	const results = [];
	const candidates = [];
	const pendingHashes = new Set(state.images.filter((image) => image.kind === 'new' && image.sha256).map((image) => image.sha256));
	let pendingUploadBytes = state.images
		.filter((image) => image.kind === 'new')
		.reduce((total, image) => total + (image.file?.size ?? 0), 0);
	const selectedHashes = new Set();
	for (const file of files) {
		const validationMessage = validateSelectedImage(file);
		if (validationMessage) {
			results.push({ name: file.name, accepted: false, messages: [validationMessage] });
			continue;
		}
		const sha256 = await fileSha256(file);
		if (pendingHashes.has(sha256) || selectedHashes.has(sha256)) {
			results.push({ name: file.name, accepted: false, messages: ['内容与当前尚未保存的图片相同。'] });
			continue;
		}
		if (state.adminMode === 'online' && pendingUploadBytes + file.size > 60 * 1024 * 1024) {
			results.push({
				name: file.name,
				accepted: false,
				messages: ['线上模式每次保存最多包含约 60 MB 新图片；请先保存已经选择的图片，再继续添加。'],
			});
			continue;
		}
		selectedHashes.add(sha256);
		pendingUploadBytes += file.size;
		candidates.push({ client_id: crypto.randomUUID(), file, name: file.name, type: file.type, size: file.size, sha256 });
	}
	if (!candidates.length) return { results, accepted: [] };
	const response = await apiPost('/api/preflight-images', {
		files: candidates.map(({ client_id, name, type, size, sha256 }) => ({ client_id, name, type, size, sha256 })),
	});
	const serverResults = new Map(response.files.map((entry) => [entry.client_id, entry]));
	const accepted = [];
	for (const candidate of candidates) {
		const serverResult = serverResults.get(candidate.client_id) ?? {
			name: candidate.name, accepted: false, messages: ['未取得上传前检查结果。'],
		};
		results.push(serverResult);
		if (serverResult.accepted) accepted.push(candidate);
	}
	return { results, accepted };
};

const saveDraft = async ({ reload = true, silent = false } = {}) => {
	if (!state.current) throw new Error('请先选择或新建一条记录。');
	const prerequisiteIssues = draftSavePrerequisiteIssues();
	if (prerequisiteIssues.length) {
		state.validationIssues = [
			...prerequisiteIssues,
			...state.validationIssues.filter((issue) =>
				!prerequisiteIssues.some((candidate) => candidate.code === issue.code)),
		];
		state.activeTab = prerequisiteIssues[0].tab;
		renderTabs();
		renderEditor();
		updateHeader();
		throw new Error(prerequisiteIssues[0].message);
	}
	const wasNewRecord = state.isNew;
	setBusy(true, '正在保存草稿…', '图片只会进入本地待入站区');
	try {
		const imageDescriptions = state.images.map((image) => image.description?.trim() ?? '');
		if (imageDescriptions.some(Boolean)) state.current.public_view.image_descriptions = imageDescriptions;
		else delete state.current.public_view.image_descriptions;
		const images = [];
		for (const image of state.images) {
			if (image.kind === 'existing') images.push({ kind: 'existing', filename: image.filename });
			else images.push({ kind: 'new', originalName: image.file.name, data: await fileToDataUrl(image.file) });
		}
		const data = await apiPost('/api/save-draft', {
			record: state.current, images, isNew: state.isNew,
			confirmedPublicationCopies: state.confirmedPublicationCopies,
			removedImages: state.pendingRemovedImages.map((image) => image.filename),
			removedImageDescriptions: Object.fromEntries(state.pendingRemovedImages
				.filter((image) => image.description?.trim())
				.map((image) => [image.filename, image.description.trim()])),
		});
		const assignedItemId = data.draft?.record?.core?.item_id ?? '';
		if (!itemIdPattern.test(assignedItemId)) {
			throw new Error('草稿没有返回有效的永久编号，已停止继续处理。');
		}
		state.current = data.draft.record;
		state.activeId = assignedItemId;
		state.isNew = false;
		state.dirty = false;
		state.images = recordImages(data.draft.record);
		state.pendingRemovedImages = (data.draft.removed_images ?? []).map((filename) => ({
			filename,
			previewUrl: `/api/image/${encodeURIComponent(data.draft.record.core.item_id)}/${encodeURIComponent(filename)}`,
			description: data.draft.removed_image_descriptions?.[filename] ?? '',
		}));
		state.imagePreflight = [];
		if (reload) await loadBootstrap(state.activeId);
		else updateHeader();
		if (!silent) showToast(wasNewRecord
			? `草稿已保存，永久编号 ${assignedItemId} 已生成。`
			: `草稿已保存，永久编号 ${assignedItemId} 保持不变。`);
		return data.draft;
	} finally {
		setBusy(false);
	}
};

const publishCurrent = async () => {
	if (state.activeTab !== 'privacy') {
		state.activeTab = 'privacy';
		renderTabs();
		renderEditor();
		showToast('请先逐项完成 13 项隐私与发布检查。', true);
		return;
	}
	const confirmations = privacyChecks.map((_, index) =>
		Boolean(elements.editorSurface.querySelector(`[data-privacy-index="${index}"]`)?.checked));
	if (confirmations.some((value) => !value)) {
		showToast('还有隐私检查项目未确认，当前不会发布。', true);
		return;
	}
	try {
		await saveDraft({ reload: false, silent: true });
		setBusy(true, '正在检查并构建网站…', '通过后才会进入公开目录，请稍候');
		const result = await apiPost('/api/publish', { itemId: state.current.core.item_id, confirmations });
		await loadBootstrap(state.current.core.item_id);
		showToast(result.warnings?.length
			? `发布已完成，但有提示：${result.warnings.join('；')}`
			: result.deployment?.releaseName
				? `发布完成：线上网站已切换到新版本 ${result.deployment.releaseName}。`
				: '发布完成：字段、隐私、图片路径和网站构建均已通过。', Boolean(result.warnings?.length));
	} catch (error) {
		if (error.issues?.length) {
			state.validationIssues = error.issues;
			state.activeTab = 'preview';
			renderTabs();
			renderEditor();
		}
		showToast(error.message, true);
	} finally {
		setBusy(false);
	}
};

const openWithdrawalDialog = () => {
	if (!state.current || state.current._admin?.officialRecordStatus !== 'ACT' || state.current._admin?.hasDraft || state.dirty) {
		showToast('请先处理当前未发布修改，再撤销已发布档案。', true);
		return;
	}
	elements.withdrawRecordLabel.textContent = `${state.current.core.title} · ${state.current.core.item_id}`;
	elements.withdrawReason.value = '';
	elements.withdrawConfirmation.checked = false;
	elements.withdrawDialog.showModal();
	requestAnimationFrame(() => elements.withdrawReason.focus());
};

const withdrawCurrent = async () => {
	const itemId = state.current?.core?.item_id;
	const reason = elements.withdrawReason.value.trim();
	if (reason.length < 2) {
		showToast('请填写明确的撤销原因。', true);
		elements.withdrawReason.focus();
		return;
	}
	if (!elements.withdrawConfirmation.checked) {
		showToast('请先确认本次撤销的影响。', true);
		elements.withdrawConfirmation.focus();
		return;
	}
	elements.withdrawDialog.close();
	setBusy(true, '正在安全撤销档案…', '保存历史版本并重新构建公开网站');
	try {
		const result = await apiPost('/api/withdraw-record', { itemId, reason, confirmed: true });
		state.recordStatusFilter = 'withdrawn';
		state.activeTab = 'basic';
		await loadBootstrap(itemId);
		showToast(result.warnings?.length
			? `档案已撤销，但有提示：${result.warnings.join('；')}`
			: result.deployment?.releaseName
				? `撤销完成：线上网站已切换到新版本 ${result.deployment.releaseName}，档案和历史均已保留。`
				: '档案已从公开网站撤下；本地记录、历史版本和图片均已保留。', Boolean(result.warnings?.length));
	} catch (error) {
		showToast(error.message, true);
	} finally {
		setBusy(false);
	}
};

const restoreWithdrawnCurrent = async () => {
	if (!state.current?._admin?.canRestoreWithdrawn) {
		showToast(state.current?._admin?.restoreWithdrawnReason || '这条撤销记录不能恢复为独立草稿。', true);
		return;
	}
	if (!window.confirm('确定恢复为草稿吗？这不会直接重新公开，仍需重新检查并正式发布。')) return;
	const itemId = state.current.core.item_id;
	setBusy(true, '正在恢复为草稿…', '撤销记录仍保持只读，恢复内容不会直接公开');
	try {
		await apiPost('/api/restore-withdrawn', { itemId });
		state.recordStatusFilter = 'normal';
		state.activeTab = 'basic';
		await loadBootstrap(itemId);
		showToast('已生成恢复草稿；请检查内容、图片和隐私后再发布。');
	} catch (error) {
		showToast(error.message, true);
	} finally {
		setBusy(false);
	}
};

const loadBootstrap = async (selectedId = state.activeId) => {
	const response = await fetch('/api/bootstrap');
	const data = await readApiJson(response);
	if (!response.ok) throw new Error(data.error ?? '无法读取档案。');
	state.records = data.records;
	state.drafts = data.drafts ?? [];
	state.history = data.history ?? [];
	state.recycleBin = data.recycle_bin ?? [];
	state.integrityReport = data.maintenance?.integrity ?? null;
	state.adminMode = data.paths?.adminMode ?? 'local';
	state.publicSiteUrl = (data.paths?.previewUrl ?? '').replace(/\/+$/, '');
	state.query.loaded = false;
	state.query.records = [];
	state.query.selectedId = '';
	state.standards = data.standards;
	state.commonFields = new Map(data.standards.commonFields.fields.map((field) => [field.field_code, field]));
	state.dictionary = new Map();
	for (const entry of data.standards.codeDictionary.entries) {
		if (!state.dictionary.has(entry.dictionary_key)) state.dictionary.set(entry.dictionary_key, []);
		state.dictionary.get(entry.dictionary_key).push(entry);
	}
	for (const [fieldCode, listId] of Object.entries(administrativeRegionListIds)) {
		const list = document.querySelector(`#${listId}`);
		const values = data.standards.administrativeRegions?.[administrativeRegionValueKeys[fieldCode]] ?? [];
		if (list) list.innerHTML = values.map((value) => `<option value="${escapeHtml(value)}"></option>`).join('');
	}
	elements.previewLink.href = publicPreviewUrl('/');
	renderRecordList();
	renderWorkspaceNavigation();
	const visibleRecords = filteredRecords();
	const targetId = selectedId === null || selectedId === undefined
		? null
		: visibleRecords.some((record) => record.core.item_id === selectedId)
			? selectedId
			: visibleRecords[0]?.core.item_id;
	if (targetId) selectRecord(targetId);
	else if (state.recordStatusFilter === 'normal') startNewRecord();
	else {
		state.activeId = null;
		state.current = null;
		updateHeader();
		renderEditor();
	}
};

elements.recordList.addEventListener('click', (event) => {
	const button = event.target.closest('.record-card');
	if (!button) return;
	if (state.dirty && !window.confirm('当前有尚未保存的修改。确定先放弃这些修改并打开另一条记录吗？')) return;
	selectRecord(button.dataset.id);
});

elements.recordSearch.addEventListener('input', (event) => {
	state.search = event.target.value;
	renderRecordList();
});

elements.newRecordButton.addEventListener('click', () => {
	if (state.dirty && !window.confirm('当前有尚未保存的修改。确定先放弃这些修改并新建藏品吗？')) return;
	startNewRecord();
});

elements.mobileRecordBrowserToggle.addEventListener('click', () => {
	setMobileRecordBrowserOpen(elements.mobileRecordBrowserToggle.getAttribute('aria-expanded') !== 'true');
});

elements.similarRecordButton.addEventListener('click', startSimilarRecord);

document.querySelector('.desk-nav').addEventListener('click', (event) => {
	const button = event.target.closest('[data-workspace]');
	if (!button) return;
	if (state.dirty && button.dataset.workspace !== 'records' &&
		!window.confirm('当前有尚未保存的修改。确定先离开编辑页面吗？')) return;
	setWorkspaceMode(button.dataset.workspace);
});

elements.recordStatusNav.addEventListener('click', (event) => {
	const button = event.target.closest('[data-record-status]');
	if (!button) return;
	if (state.dirty && !window.confirm('当前有尚未保存的修改。确定放弃这些修改并切换档案状态吗？')) return;
	setRecordStatusFilter(button.dataset.recordStatus);
});

elements.taskSummary.addEventListener('click', (event) => {
	const button = event.target.closest('[data-task-tab]');
	if (!button || button.disabled || isWithdrawn()) return;
	state.activeTab = button.dataset.taskTab;
	renderTabs();
	renderEditor();
	updateHeader();
	document.querySelector(`#tab-${CSS.escape(state.activeTab)}`)?.focus();
});

document.querySelector('.tabs').addEventListener('click', (event) => {
	const tab = event.target.closest('.tab');
	if (!tab || tab.disabled) return;
	state.activeTab = tab.dataset.tab;
	renderTabs();
	renderEditor();
	updateHeader();
});

document.querySelector('.tabs').addEventListener('keydown', (event) => {
	if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
	const tabs = [...document.querySelectorAll('.tab:not(:disabled)')];
	const currentIndex = tabs.indexOf(document.activeElement);
	if (currentIndex < 0) return;
	event.preventDefault();
	const targetIndex = event.key === 'Home'
		? 0
		: event.key === 'End'
			? tabs.length - 1
			: (currentIndex + (event.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length;
	tabs[targetIndex].focus();
	tabs[targetIndex].click();
});

elements.editorSurface.addEventListener('input', (event) => {
	if (state.workspaceMode === 'query' && event.target.matches('[data-query-search]')) {
		state.query.search = event.target.value;
		state.query.page = 1;
		renderWorkspaceCenter();
		requestAnimationFrame(() => {
			const search = elements.editorSurface.querySelector('[data-query-search]');
			search?.focus();
			search?.setSelectionRange(state.query.search.length, state.query.search.length);
		});
		return;
	}
	if (event.target.matches('[data-image-description]')) {
		const image = state.images.find((candidate) => candidate.id === event.target.dataset.imageId);
		if (!image) return;
		image.description = event.target.value;
		state.dirty = true;
		state.validationIssues = [];
		updateHeader();
		return;
	}
	if (event.target.matches('.field-control:not([type="checkbox"])')) handleFieldChange(event.target);
});

elements.editorSurface.addEventListener('change', async (event) => {
	const control = event.target;
	if (state.workspaceMode === 'query' && control.matches('[data-query-filter]')) {
		state.query[control.dataset.queryFilter] = control.value;
		state.query.page = 1;
		renderWorkspaceCenter();
		return;
	}
	if (control.matches('.object-category-control')) {
		handleObjectCategoryChange(control);
		return;
	}
	if (control.matches('.field-control[type="checkbox"]') || control.tagName === 'SELECT') handleFieldChange(control);
	if (control.id === 'publication-copy-confirm') {
		state.confirmedPublicationCopies = control.checked;
		state.validationIssues = state.validationIssues.filter((issue) => issue.code !== 'publication_copy_confirmation');
		renderEditor();
		updateHeader();
		return;
	}
	if (control.id === 'privacy-select-all') {
		elements.editorSurface.querySelectorAll('[data-privacy-index]').forEach((checkbox) => {
			checkbox.checked = control.checked;
		});
		control.indeterminate = false;
	}
	if (control.matches('[data-privacy-index]')) {
		const checkboxes = [...elements.editorSurface.querySelectorAll('[data-privacy-index]')];
		const selectAll = elements.editorSurface.querySelector('#privacy-select-all');
		const checkedCount = checkboxes.filter((checkbox) => checkbox.checked).length;
		selectAll.checked = checkedCount === checkboxes.length;
		selectAll.indeterminate = checkedCount > 0 && checkedCount < checkboxes.length;
	}
	if (control.matches('.replacement-input')) {
		const file = control.files?.[0];
		if (!file) return;
		setBusy(true, '正在检查替换图片…', '不会写入草稿或公开目录');
		let preflight;
		try { preflight = await preflightSelectedImages([file]); }
		catch (error) { showToast(error.message, true); return; }
		finally { setBusy(false); }
		state.imagePreflight = preflight.results;
		if (!preflight.accepted.length) {
			renderEditor();
			showToast('替换图片未通过上传前检查，当前图片保持不变。', true);
			return;
		}
		const index = state.images.findIndex((image) => image.id === control.dataset.imageId);
		if (index < 0 || state.images[index].kind !== 'existing') return;
		const previous = state.images[index];
		if (!state.pendingRemovedImages.some((image) => image.filename === previous.filename)) {
			state.pendingRemovedImages.push({ filename: previous.filename, previewUrl: previous.previewUrl,
				description: previous.description ?? '' });
		}
		state.images[index] = createNewImage(file, previous.description ?? '', preflight.accepted[0].sha256);
		state.confirmedPublicationCopies = false;
		state.validationIssues = [];
		state.dirty = true;
		updateHeader();
		renderEditor();
		showToast('替换已记录在草稿中。请确认新图片是发布副本后再保存。');
		return;
	}
	if (control.id === 'image-input') {
		const files = [...control.files];
		if (!files.length) return;
		setBusy(true, '正在检查图片…', '核对格式、大小、名称和重复内容');
		let preflight;
		try { preflight = await preflightSelectedImages(files); }
		catch (error) { showToast(error.message, true); return; }
		finally { setBusy(false); }
		state.imagePreflight = preflight.results;
		for (const candidate of preflight.accepted) state.images.push(createNewImage(candidate.file, '', candidate.sha256));
		if (preflight.accepted.length) {
			state.dirty = true;
			state.confirmedPublicationCopies = false;
		}
		state.validationIssues = [];
		updateHeader();
		renderEditor();
		const blockedCount = preflight.results.length - preflight.accepted.length;
		showToast(blockedCount
			? `${preflight.accepted.length} 张通过检查，${blockedCount} 张已拦截，请查看检查结果。`
			: `${preflight.accepted.length} 张图片已通过上传前检查。`, blockedCount > 0);
	}
});

elements.editorSurface.addEventListener('click', async (event) => {
	const queryOpenButton = event.target.closest('[data-query-open]');
	if (queryOpenButton) {
		state.query.selectedId = queryOpenButton.dataset.queryOpen;
		renderWorkspaceCenter();
		return;
	}
	const queryStatusButton = event.target.closest('[data-query-status]');
	if (queryStatusButton) {
		state.query.status = queryStatusButton.dataset.queryStatus;
		state.query.page = 1;
		state.query.selectedId = '';
		renderWorkspaceCenter();
		return;
	}
	const queryPageButton = event.target.closest('[data-query-page]');
	if (queryPageButton && !queryPageButton.disabled) {
		state.query.page = Number(queryPageButton.dataset.queryPage) || 1;
		state.query.selectedId = '';
		renderWorkspaceCenter();
		elements.editorSurface.scrollIntoView({ behavior: 'smooth', block: 'start' });
		return;
	}
	const queryActionButton = event.target.closest('[data-query-action]');
	if (queryActionButton) {
		const action = queryActionButton.dataset.queryAction;
		if (action === 'refresh') {
			state.query.loaded = false;
			await loadQueryRecords();
			return;
		}
		if (action === 'clear') {
			for (const field of ['search', 'category', 'objectType', 'decade', 'research', 'evidence', 'rights', 'imageStatus']) state.query[field] = '';
			state.query.page = 1;
			renderWorkspaceCenter();
			return;
		}
		if (action === 'edit') {
			selectRecord(queryActionButton.dataset.queryId);
			return;
		}
		if (action === 'copy-id') {
			try {
				await navigator.clipboard.writeText(queryActionButton.dataset.queryId);
				showToast('永久编号已复制。');
			} catch {
				showToast('浏览器未允许自动复制，请手工复制永久编号。', true);
			}
			return;
		}
	}
	const centerButton = event.target.closest('[data-center-action]');
	if (centerButton) {
		const { centerAction: action, itemId, entryId } = centerButton.dataset;
		if (action === 'continue') {
			selectRecord(itemId);
			return;
		}
		if (action === 'maintenance-open') {
			state.activeTab = centerButton.dataset.targetTab || 'basic';
			selectRecord(itemId);
			return;
		}
		if (action === 'maintenance-refresh') {
			setBusy(true, '正在重新检查…', '只读取正式 JSON、发布副本和公开构建，不会修改文件');
			try {
				await loadBootstrap(state.activeId);
				setWorkspaceMode('maintenance');
				showToast(state.integrityReport?.status === 'pass' ? '完整性巡检已完成，发布层结构正常。' : '巡检已完成，请查看异常项目。', state.integrityReport?.status !== 'pass');
			} catch (error) {
				showToast(error.message, true);
			} finally {
				setBusy(false);
			}
			return;
		}
		setBusy(true, action === 'restore-recycle' ? '正在恢复图片…' : '正在恢复历史版本…', '恢复内容只会进入本地草稿');
		try {
			await apiPost(action === 'restore-recycle' ? '/api/restore-recycle' : '/api/restore-history', { itemId, entryId });
			await loadBootstrap(itemId);
			state.activeTab = 'preview';
			renderTabs();
			renderEditor();
			showToast(action === 'restore-recycle' ? '图片已恢复到草稿，尚未公开。' : '历史版本已恢复为草稿，尚未公开。');
		} catch (error) {
			showToast(error.message, true);
		} finally {
			setBusy(false);
		}
		return;
	}
	const issueButton = event.target.closest('[data-issue-tab]');
	if (issueButton) {
		state.activeTab = issueButton.dataset.issueTab;
		renderTabs();
		renderEditor();
		const field = issueButton.dataset.issueField;
		if (field) requestAnimationFrame(() => {
			const control = elements.editorSurface.querySelector(`[data-field="${CSS.escape(field)}"]`);
			control?.scrollIntoView({ behavior: 'smooth', block: 'center' });
			control?.focus();
		});
		return;
	}
	const button = event.target.closest('[data-image-action]');
	if (!button) return;
	if (button.dataset.imageAction === 'undo-remove') {
		const filename = button.dataset.imageFilename;
		const removedIndex = state.pendingRemovedImages.findIndex((image) => image.filename === filename);
		if (removedIndex < 0) return;
		const [image] = state.pendingRemovedImages.splice(removedIndex, 1);
		state.images.push({ id: `restored-${crypto.randomUUID()}`, kind: 'existing', filename,
			previewUrl: image.previewUrl || `/api/image/${encodeURIComponent(state.current.core.item_id)}/${encodeURIComponent(filename)}`,
			description: image.description ?? '' });
		state.dirty = true;
		state.validationIssues = [];
		updateHeader();
		renderEditor();
		return;
	}
	const index = state.images.findIndex((image) => image.id === button.dataset.imageId);
	if (index < 0) return;
	if (button.dataset.imageAction === 'remove') {
		const [image] = state.images.splice(index, 1);
		if (image.kind === 'new') URL.revokeObjectURL(image.previewUrl);
		else if (!state.pendingRemovedImages.some((candidate) => candidate.filename === image.filename)) {
			state.pendingRemovedImages.push({ filename: image.filename, previewUrl: image.previewUrl,
				description: image.description ?? '' });
		}
	} else {
		const targetIndex = button.dataset.imageAction === 'up' ? index - 1 : index + 1;
		if (targetIndex < 0 || targetIndex >= state.images.length) return;
		[state.images[index], state.images[targetIndex]] = [state.images[targetIndex], state.images[index]];
	}
	state.dirty = true;
	state.validationIssues = [];
	updateHeader();
	renderEditor();
});

const saveDraftWithFeedback = async () => {
	try { await saveDraft(); }
	catch (error) { showToast(error.message, true); setBusy(false); }
};

elements.saveDraftButton.addEventListener('click', saveDraftWithFeedback);
elements.dockSaveDraftButton.addEventListener('click', saveDraftWithFeedback);
elements.publishButton.addEventListener('click', publishCurrent);
elements.dockPublishButton.addEventListener('click', publishCurrent);
elements.lifecycleButton.addEventListener('click', () => {
	if (isWithdrawn()) restoreWithdrawnCurrent();
	else openWithdrawalDialog();
});
elements.confirmWithdrawButton.addEventListener('click', withdrawCurrent);
elements.withdrawDialog.addEventListener('close', () => {
	elements.withdrawReason.value = '';
	elements.withdrawConfirmation.checked = false;
});

window.addEventListener('beforeunload', (event) => {
	if (!state.dirty) return;
	event.preventDefault();
	event.returnValue = '';
});

loadBootstrap().catch((error) => {
	console.error(error);
	elements.recordCount.textContent = '读取失败';
	elements.editorSurface.innerHTML = `<div class="empty-state">${escapeHtml(error.message || '暂时无法读取档案，请刷新页面后重试。')}</div>`;
});
