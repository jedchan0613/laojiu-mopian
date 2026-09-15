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
const municipalityNames = new Set(['北京市', '天津市', '上海市', '重庆市']);

const arrayFields = new Set([
	'tags',
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
	'missing_parts', 'restricted_fields', 'card_functions', 'issuer_id', 'issuer_name', 'issuer_place',
	'brand_name', 'merchant_name', 'service_network', 'service_area', 'face_value', 'currency',
	'benefit_text', 'usage_evidence', 'card_technologies', 'accessories',
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
	'validity_text', 'address_masked', 'document_number_masked', 'revision_note', 'holder_name_masked',
	'card_number_masked', 'usage_notes', 'front_subject', 'back_subject', 'front_transcription',
	'back_transcription', 'material_details',
]);

const specialDictionaryFields = {
	postcard_type: 'postcard_type', postcard_function: 'postcard_function', postcard_use: 'postcard_use',
	postal_mark_types: 'postal_mark', postcard_process: 'process', notebook_type: 'notebook_type',
	entry_structure: 'entry_structure', notebook_completeness: 'notebook_completeness',
	writing_medium: 'writing_medium', credential_type: 'credential_type', portrait_status: 'portrait_status',
	credential_status: 'credential_status', redaction_status: 'redaction_status',
	card_type: 'card_type', card_functions: 'card_function', card_status: 'card_status',
	card_technologies: 'card_technology', card_completeness: 'card_completeness',
	security_features: 'security_feature', carrier: 'carrier', color: 'color',
	process: 'process', event_scene: 'event_scene', themes: 'theme',
	privacy_level: 'privacy', transcription_status: 'transcription',
};

const wordLabels = {
	accession: '入藏', accessories: '附件', address: '地址', affiliation: '隶属', aliases: '别名', amendments: '变更',
	annotation: '批注', arrival: '到达', attachment: '附件', attachments: '附件', basis: '依据',
	binding: '装帧', birth: '出生', brand: '品牌', cancellation: '注销', card: '卡片', carrier: '载体', class: '类别', code: '代码',
	color: '色彩', content: '内容', correspondence: '通信关系', country: '国家', cover: '封面',
	creator: '创作者', credential: '证件', date: '日期', destination: '目的地', dispatch: '寄出',
	district: '区县', document: '证件', endorsements: '签注', entry: '条目', event: '事件', evidence: '证据',
	description: '公开简介', display: '显示', file: '文件', filters: '筛选值', format: '版式', function: '功能', functions: '功能', grade: '等级', hands: '书写者', height: '高度',
	holder: '持证人', household: '户籍', id: '编号', identities: '身份', image: '图像', ink: '墨水',
	inserts: '插页', issue: '签发／发行', issuer: '发行机构', issuing: '签发', language: '语言', later: '后加内容',
	leaf: '页叶', legibility: '可读性', level: '等级', life: '生活', local: '地方', manufacturer: '制造者',
	mark: '标记', masked: '已遮盖', material: '材料', message: '正文', mentioned: '涉及', method: '方式',
	merchant: '商户', missing: '缺失', name: '名称', nationality: '国籍', network: '网络', notebook: '册簿', notes: '说明', number: '号码',
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
	technologies: '技术', valid: '有效', validity: '有效期', value: '面值', verso: '背面', width: '宽度', work: '工作', writing: '书写',
};

const privacyChecks = [
	'图片和公开文字中没有未遮盖的身份证号、护照号或其他身份识别号码。',
	'没有银行卡号、账户号码、完整卡号、安全码、密码或磁条／芯片可读数据。',
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
	confirmedPublicationCopies: false, workspaceMode: 'records', recordViewMode: 'overview', drafts: [], history: [], recycleBin: [],
	pendingRemovedImages: [], validationIssues: [], pendingObjectCategory: '', recordStatusFilter: 'normal',
	recordSort: 'updated-desc', recordTypeFilter: '', recordDecadeFilter: '', recordQuickStatus: '',
	recordPage: 1, recordPageSize: 15,
	integrityReport: null, integrityLoading: false, imagePreflight: [], adminMode: 'local', publicSiteUrl: '',
	query: {
		loaded: false, loading: false, error: '', records: [], selectedId: '', status: 'normal',
		search: '', category: '', objectType: '', decade: '', research: '', evidence: '', rights: '',
		imageStatus: '', page: 1, pageSize: 15, sort: 'updated-desc', advancedOpen: false,
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
	recordSort: document.querySelector('#record-sort'),
	recordTypeFilter: document.querySelector('#record-type-filter'),
	recordDecadeFilter: document.querySelector('#record-decade-filter'),
	recordQuickStatusFilter: document.querySelector('#record-quick-status-filter'),
	recordPagination: document.querySelector('#record-pagination'),
	recordId: document.querySelector('#record-id'), recordKicker: document.querySelector('#record-kicker'),
	editorSurface: document.querySelector('#editor-surface'), previewLink: document.querySelector('#preview-link'),
	newRecordButton: document.querySelector('#new-record-button'), saveDraftButton: document.querySelector('#save-draft-button'),
	publishButton: document.querySelector('#publish-button'), toast: document.querySelector('#toast'),
	headerActions: document.querySelector('#header-actions'), recordActionDock: document.querySelector('#record-action-dock'),
	dockSaveState: document.querySelector('#dock-save-state'),
	dockSaveDraftButton: document.querySelector('#dock-save-draft-button'),
	dockPublishButton: document.querySelector('#dock-publish-button'),
	busyOverlay: document.querySelector('#busy-overlay'), busyTitle: document.querySelector('#busy-title'),
	busyDetail: document.querySelector('#busy-detail'), busyCancelButton: document.querySelector('#busy-cancel-button'),
	saveState: document.querySelector('#save-state'),
	recordsBadge: document.querySelector('#records-badge'), draftsBadge: document.querySelector('#drafts-badge'),
	queryBadge: document.querySelector('#query-badge'),
	maintenanceBadge: document.querySelector('#maintenance-badge'),
	recycleBadge: document.querySelector('#recycle-badge'), historyBadge: document.querySelector('#history-badge'),
	normalRecordsBadge: document.querySelector('#normal-records-badge'),
	withdrawnRecordsBadge: document.querySelector('#withdrawn-records-badge'),
	brandPending: document.querySelector('#brand-pending'),
	recordStatusNav: document.querySelector('#record-status-nav'), lifecycleButton: document.querySelector('#lifecycle-button'),
	similarRecordButton: document.querySelector('#similar-record-button'),
	recordMoreActions: document.querySelector('#record-more-actions'),
	recordMoreActionsLabel: document.querySelector('#record-more-actions-label'),
	mobileRecordBrowserToggle: document.querySelector('#mobile-record-browser-toggle'),
	recordBrowserContent: document.querySelector('#record-browser-content'),
	recordsPane: document.querySelector('.records-pane'), recordsPaneClose: document.querySelector('#records-pane-close'),
	backToLibraryButton: document.querySelector('#back-to-library-button'),
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
	const isCompactLayout = window.matchMedia('(max-width: 900px)').matches;
	elements.recordBrowserContent.setAttribute('aria-hidden', String(isCompactLayout ? !open : false));
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
	if (objectType === 'CRD') return 'card';
	return 'common';
};

const specificSchemaLabels = {
	photo: '照片专属信息',
	postcard: '明信片专属信息',
	diary_notebook: '日记／笔记专属信息',
	credential: '证件专属信息',
	card: '旧卡片专属信息',
};

const hasMeaningfulValue = (value) =>
	value !== undefined && value !== null && value !== '' &&
	(!Array.isArray(value) || value.some((entry) => hasMeaningfulValue(entry)));

const currentAdministrativeProvince = () => {
	const province = state.current?.core?.province;
	return (state.standards?.administrativeRegions?.hierarchy ?? [])
		.find((entry) => entry.province === province) ?? null;
};

const administrativeCitiesForProvince = (provinceEntry) => {
	if (!provinceEntry) return [];
	if (municipalityNames.has(provinceEntry.province)) return [provinceEntry.province];
	return (provinceEntry.cities ?? []).map((entry) => entry.city);
};

const administrativeDistrictsForSelection = (provinceEntry, city) => {
	if (!provinceEntry) return [];
	if (municipalityNames.has(provinceEntry.province) && city === provinceEntry.province) {
		return provinceEntry.direct_districts ?? [];
	}
	const cityEntry = (provinceEntry.cities ?? []).find((entry) => entry.city === city);
	if (cityEntry) return cityEntry.districts ?? [];
	return city ? [] : provinceEntry.direct_districts ?? [];
};

const setAdministrativeDatalist = (fieldCode, values) => {
	const list = document.querySelector(`#${administrativeRegionListIds[fieldCode]}`);
	if (list) list.innerHTML = values.map((value) => `<option value="${escapeHtml(value)}"></option>`).join('');
};

const refreshAdministrativeRegionOptions = () => {
	const regions = state.standards?.administrativeRegions;
	if (!regions) return;
	const provinceEntry = currentAdministrativeProvince();
	const city = state.current?.core?.city ?? '';
	setAdministrativeDatalist('province', regions.provinces ?? []);
	setAdministrativeDatalist('city', administrativeCitiesForProvince(provinceEntry));
	setAdministrativeDatalist('district', administrativeDistrictsForSelection(provinceEntry, city));
};

const administrativeRegionFieldState = (fieldCode, value) => {
	const provinceEntry = currentAdministrativeProvince();
	if (fieldCode === 'province') return {
		placeholder: '选择或输入省级行政区',
		message: '选择省级后，市级选项会自动缩小；历史地名仍可直接输入。',
		warning: false,
	};
	if (fieldCode === 'city') {
		if (!provinceEntry) return {
			placeholder: '请先选择省级',
			message: '请先选择省级，再从对应的市级范围中选择；历史地名仍可直接输入。',
			warning: Boolean(value && state.current?.core?.province),
		};
		const allowed = administrativeCitiesForProvince(provinceEntry);
		return {
			placeholder: `选择${provinceEntry.province}下属市级`,
			message: value && !allowed.includes(value)
				? `“${value}”不属于当前省级参照，请重新选择或确认它是历史地名。`
				: `当前只提示${provinceEntry.province}下属市级；历史地名仍可直接输入。`,
			warning: Boolean(value && !allowed.includes(value)),
		};
	}
	if (fieldCode === 'district') {
		const city = state.current?.core?.city ?? '';
		if (!provinceEntry) return {
			placeholder: '请先选择省级和市级',
			message: '请先选择上级行政区；历史地名仍可直接输入。',
			warning: Boolean(value),
		};
		const allowed = administrativeDistrictsForSelection(provinceEntry, city);
		const parentLabel = city || provinceEntry.province;
		return {
			placeholder: allowed.length ? `选择${parentLabel}下属区县` : '可输入区县或历史地名',
			message: value && allowed.length && !allowed.includes(value)
				? `“${value}”不属于当前上级行政区参照，请重新选择或确认它是历史地名。`
				: allowed.length
					? `当前只提示${parentLabel}下属区县；历史地名仍可直接输入。`
					: '当前上级没有下一级参照，可留空或输入历史地名。',
			warning: Boolean(value && allowed.length && !allowed.includes(value)),
		};
	}
	return null;
};

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

const setBusy = (busy, title = '正在处理…', detail = '请保持这个窗口打开', options = {}) => {
	elements.busyOverlay.hidden = !busy;
	elements.busyTitle.textContent = title;
	elements.busyDetail.textContent = detail;
	elements.busyCancelButton.hidden = !busy || !options.cancellable;
	elements.busyCancelButton.disabled = Boolean(options.cancelPending);
	elements.busyCancelButton.textContent = options.cancelPending ? '正在取消…' : '取消操作';
};

let activeOperation = null;

const operationCancelledError = () => {
	const error = new Error('操作已取消，页面中填写的内容仍然保留。');
	error.name = 'OperationCancelledError';
	error.cancelled = true;
	return error;
};

const throwIfOperationCancelled = (operation) => {
	if (operation?.controller.signal.aborted || operation?.cancelRequested) throw operationCancelledError();
};

const beginCancellableOperation = (kind, title, detail) => {
	if (activeOperation) throw new Error('已有一项操作正在进行，请稍候。');
	activeOperation = {
		id: crypto.randomUUID(), kind, controller: new AbortController(), cancelRequested: false,
	};
	setBusy(true, title, detail, { cancellable: true });
	return activeOperation;
};

const updateCancellableOperation = (operation, title, detail) => {
	if (activeOperation !== operation) return;
	setBusy(true, title, detail, { cancellable: true, cancelPending: operation.cancelRequested });
};

const finishCancellableOperation = (operation) => {
	if (activeOperation !== operation) return;
	activeOperation = null;
	setBusy(false);
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

const apiPost = async (url, payload, options = {}) => {
	const response = await fetch(url, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			'X-LJM-Admin-Request': '1',
			...(options.operation?.id ? { 'X-LJM-Operation-Id': options.operation.id } : {}),
		},
		body: JSON.stringify(payload),
		...(options.operation ? { signal: options.operation.controller.signal } : {}),
	});
	const data = await readApiJson(response);
	if (!response.ok) {
		const error = new Error(data.error ?? '管理操作没有完成。');
		error.issues = data.issues ?? [];
		error.cancelled = Boolean(data.cancelled);
		throw error;
	}
	return data;
};

const cancelActiveOperation = async () => {
	const operation = activeOperation;
	if (!operation || operation.cancelRequested) return;
	operation.cancelRequested = true;
	updateCancellableOperation(operation, '正在安全取消…', '正在停止上传或恢复到操作前状态，请稍候');
	try {
		const result = await apiPost('/api/cancel-operation', { operationId: operation.id });
		if (!result.cancelled) operation.controller.abort();
	} catch {
		operation.controller.abort();
	}
};

const isOperationCancellation = (error, operation = null) =>
	Boolean(error?.cancelled || error?.name === 'AbortError' || error?.name === 'OperationCancelledError' || operation?.cancelRequested);

const isWithdrawn = () => state.current?.core?.record_status === 'WDR' && !state.current?._admin?.hasDraft;

const refreshInboxPendingBadge = async () => {
	try {
		const [contactsResponse, submissionsResponse] = await Promise.all([
			fetch('/api/admin/contacts', { cache: 'no-store' }),
			fetch('/api/admin/submissions', { cache: 'no-store' }),
		]);
		if (!contactsResponse.ok || !submissionsResponse.ok) return;
		const contactsData = await readApiJson(contactsResponse);
		const submissionsData = await readApiJson(submissionsResponse);
		const pendingContacts = (contactsData.contacts ?? []).filter((record) => record.status === 'received').length;
		const pendingSubmissions = (submissionsData.submissions ?? []).filter((record) => record.status === 'pending').length;
		const parts = [];
		if (pendingContacts > 0) parts.push(`待处理来信 ${pendingContacts}`);
		if (pendingSubmissions > 0) parts.push(`待审核投稿 ${pendingSubmissions}`);
		elements.brandPending.textContent = parts.join(' · ');
		elements.brandPending.hidden = parts.length === 0;
	} catch {
		// 计数读取失败时不影响档案管理主流程，标记保持隐藏。
	}
};
const recordIsWithdrawn = (record) => record?.core?.record_status === 'WDR' && !record?._admin?.hasDraft;
const statusLabel = (record) => {
	if (record._admin?.restoredFromWithdrawal) return '恢复草稿';
	if (record._admin?.hasDraft) return record._admin.hasOfficial ? '有未发布修改' : '草稿';
	if (record.core.record_status === 'WDR') return '已撤销';
	if (record.core.use_status === 'U3') return '已发布';
	if (record.core.use_status === 'U1') return '候选';
	return '未发布';
};

const recordStatusTone = (record) => {
	if (recordIsWithdrawn(record)) return 'withdrawn';
	if (record._admin?.hasDraft) return 'draft';
	if (record._admin?.issues?.length) return 'attention';
	if (record.core.use_status === 'U3') return 'published';
	return 'neutral';
};

const recordDecade = (record) => {
	const year = String(record?.core?.date_display ?? '').match(/(?:18|19|20)\d{2}/)?.[0];
	return year ? `${year.slice(0, 3)}0` : '';
};

const recordsInCurrentStatusTab = () => state.records.filter((record) =>
	state.recordStatusFilter === 'withdrawn' ? recordIsWithdrawn(record) : !recordIsWithdrawn(record));

const filteredRecords = () => {
	const query = state.search.trim().toLocaleLowerCase('zh-CN');
	let records = recordsInCurrentStatusTab();
	if (state.recordTypeFilter) {
		records = records.filter((record) => record.core.object_type === state.recordTypeFilter);
	}
	if (state.recordDecadeFilter) {
		records = records.filter((record) => recordDecade(record) === state.recordDecadeFilter);
	}
	if (state.recordQuickStatus) {
		records = records.filter((record) => statusLabel(record) === state.recordQuickStatus);
	}
	if (!query) return records;
	return records.filter((record) => [
		record.core.item_id, record.core.collection_code, record.core.title, record.core.object_type,
		record.core.date_display, record.core.province, record.core.city, record.core.district,
		record.core.source_name, record.core.source_place,
	]
		.filter(Boolean).join(' ').toLocaleLowerCase('zh-CN').includes(query));
};

const chineseCollator = new Intl.Collator('zh-CN');

const normalizeRecordItemDate = (value) => {
	const match = String(value ?? '').trim().match(/^(\d{4})-(\d{2})-(\d{2})$/);
	return match ? match[0] : '';
};

const recordItemDateSortKey = (record) => {
	const core = record?.core ?? {};
	const dateStart = normalizeRecordItemDate(core.date_start);
	if (dateStart) return dateStart;
	const displayYear = String(core.date_display ?? '').match(/(?:18|19|20)\d{2}/)?.[0];
	if (displayYear) return `${displayYear}-01-01`;
	return normalizeRecordItemDate(core.date_end);
};

const compareRecordsByItemDate = (left, right) => {
	const leftDate = recordItemDateSortKey(left);
	const rightDate = recordItemDateSortKey(right);
	if (leftDate && rightDate && leftDate !== rightDate) return rightDate.localeCompare(leftDate);
	if (leftDate && !rightDate) return -1;
	if (!leftDate && rightDate) return 1;
	return chineseCollator.compare(String(left.core.item_id ?? ''), String(right.core.item_id ?? ''));
};

const sortedRecords = (records) => {
	const sorted = [...records];
	switch (state.recordSort) {
		case 'accession-desc':
			sorted.sort((left, right) => String(right.core.accession_date ?? right.core.created_date ?? '')
				.localeCompare(String(left.core.accession_date ?? left.core.created_date ?? '')));
			break;
		case 'item-date-desc':
			sorted.sort(compareRecordsByItemDate);
			break;
		case 'id-asc':
			sorted.sort((left, right) => chineseCollator.compare(String(left.core.item_id ?? ''), String(right.core.item_id ?? '')));
			break;
		case 'title-asc':
			sorted.sort((left, right) => chineseCollator.compare(String(left.core.title ?? ''), String(right.core.title ?? '')));
			break;
		default:
			sorted.sort((left, right) => String(right.core.updated_date ?? right.core.created_date ?? '')
				.localeCompare(String(left.core.updated_date ?? left.core.created_date ?? '')));
	}
	return sorted;
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

const sortQueryRecords = (records) => {
	const sorted = [...records];
	switch (state.query.sort) {
		case 'updated-asc':
			sorted.sort((left, right) => String(left.updated_date ?? '').localeCompare(String(right.updated_date ?? '')));
			break;
		case 'id-asc':
			sorted.sort((left, right) => chineseCollator.compare(String(left.item_id ?? ''), String(right.item_id ?? '')));
			break;
		case 'title-asc':
			sorted.sort((left, right) => chineseCollator.compare(String(left.title ?? ''), String(right.title ?? '')));
			break;
		case 'decade-asc':
			sorted.sort((left, right) => String(left.decade || '9999').localeCompare(String(right.decade || '9999')));
			break;
		default:
			sorted.sort((left, right) => String(right.updated_date ?? '').localeCompare(String(left.updated_date ?? '')));
	}
	return sorted;
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
		<div class="query-detail-heading"><div><h3 id="query-detail-title">${escapeHtml(record.title)}</h3><span>${escapeHtml(queryStatusLabel(record))} · 最近更新 ${escapeHtml(record.updated_date || '未知')}</span></div>
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
	const filtered = sortQueryRecords(queryFilteredRecords());
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
	const advancedFilterCount = ['objectType', 'research', 'evidence', 'rights', 'imageStatus']
		.filter((field) => queryState[field]).length;
	const cards = pageRecords.map((record) => `<button class="query-card ${record.item_id === queryState.selectedId ? 'is-selected' : ''}" data-query-open="${escapeHtml(record.item_id)}" type="button" aria-label="查看${escapeHtml(record.title)}的资料">
		<span class="query-card-heading"><span class="query-card-kicker"><small>${escapeHtml(record.item_id)}</small><em>${escapeHtml(queryStatusLabel(record))}</em></span><strong>${escapeHtml(record.title)}</strong><small>${escapeHtml(record.collection_code || '藏品编码待生成')}</small></span>
		<span class="query-card-facts">
			<span><small>类型</small><strong>${escapeHtml(record.category_label)}</strong><em>${escapeHtml(record.object_type_label)} · ${escapeHtml(record.object_type)}</em></span>
			<span><small>年代与地点</small><strong>${escapeHtml(record.date_display || '年代未知')}</strong><em>${escapeHtml(record.place_summary || '地点未填写')}</em></span>
			<span><small>图片结构</small><strong>${record.publication_image_count} 张 · ${escapeHtml(queryStructureLabel(record.publication_structure_status))}</strong><em>说明 ${record.description_complete_count}/${record.publication_image_count}</em></span>
		</span>
	</button>`).join('');
	return `<div class="query-workspace">
		<section class="query-controls" aria-labelledby="query-controls-title"><div class="query-controls-heading"><div><h3 id="query-controls-title">查找与筛选</h3><p>集中查找档案，点击下方结果即可查看资料或进入编辑。</p></div><div class="query-controls-actions"><div class="query-status-switch" role="group" aria-label="档案状态"><button class="${queryState.status === 'normal' ? 'is-active' : ''}" data-query-status="normal" type="button">正常档案</button><button class="${queryState.status === 'withdrawn' ? 'is-active' : ''}" data-query-status="withdrawn" type="button">已撤销</button></div><button class="quiet-button" data-query-action="refresh" type="button">刷新</button></div></div>
		<div class="query-filter-grid"><label class="query-search"><span>快速搜索</span><input type="search" data-query-search value="${escapeHtml(queryState.search)}" placeholder="编号、题名、人物、地点或来源" /></label>
		<label><span>访客分类</span><select data-query-filter="category"><option value="">全部分类</option>${queryOptionMarkup(allStatusRecords, 'category', queryState.category, (value) => allStatusRecords.find((record) => record.category === value)?.category_label ?? value)}</select></label>
		<label><span>年代</span><select data-query-filter="decade"><option value="">全部年代</option>${queryOptionMarkup(allStatusRecords, 'decade', queryState.decade, (value) => `${value}年代`)}</select></label>
		<label><span>排序</span><select data-query-sort>${[
		['updated-desc', '最后更新（新→旧）'], ['updated-asc', '最后更新（旧→新）'],
		['id-asc', '按编号'], ['title-asc', '按题名'], ['decade-asc', '按年代（旧→新）'],
	].map(([value, label]) => `<option value="${value}" ${queryState.sort === value ? 'selected' : ''}>${label}</option>`).join('')}</select></label></div>
		<details class="query-advanced" data-query-advanced ${queryState.advancedOpen ? 'open' : ''}><summary><span>更多筛选</span><small>${advancedFilterCount ? `已使用 ${advancedFilterCount} 项` : '精确类型、研究、证据、权利和图片结构'}</small></summary><div class="query-advanced-grid">
		<label><span>精确类型</span><select data-query-filter="objectType"><option value="">全部类型</option>${queryOptionMarkup(allStatusRecords, 'object_type', queryState.objectType, (value) => `${allStatusRecords.find((record) => record.object_type === value)?.object_type_label ?? value}（${value}）`)}</select></label>
		<label><span>研究状态</span><select data-query-filter="research"><option value="">全部状态</option>${queryOptionMarkup(allStatusRecords, 'research_status', queryState.research, (value) => queryCodeLabel('research_status', value))}</select></label>
		<label><span>证据等级</span><select data-query-filter="evidence"><option value="">全部等级</option>${queryOptionMarkup(allStatusRecords, 'evidence_level', queryState.evidence, (value) => queryCodeLabel('evidence_level', value))}</select></label>
		<label><span>权利状态</span><select data-query-filter="rights"><option value="">全部状态</option>${queryOptionMarkup(allStatusRecords, 'rights_status', queryState.rights, (value) => queryCodeLabel('rights_status', value))}</select></label>
		<label><span>图片结构</span><select data-query-filter="imageStatus"><option value="">全部状态</option><option value="complete" ${queryState.imageStatus === 'complete' ? 'selected' : ''}>结构完整</option><option value="warning" ${queryState.imageStatus === 'warning' ? 'selected' : ''}>需要检查</option><option value="missing" ${queryState.imageStatus === 'missing' ? 'selected' : ''}>没有发布图片</option></select></label>
		</div></details>
		<div class="query-result-summary"><span>命中 <strong>${filtered.length}</strong> 条${activeFilterCount ? ` · 当前 ${activeFilterCount} 个条件` : ''}</span>${activeFilterCount ? '<button class="quiet-button" data-query-action="clear" type="button">清除条件</button>' : ''}</div></section>
		<div class="query-results-layout"><section class="query-results" aria-label="查询结果"><div class="query-list-heading"><div><h3>档案列表</h3><p>点击一条档案查看详细资料。</p></div><span>本页 ${pageRecords.length} 条</span></div>${pageRecords.length ? `<div class="query-cards">${cards}</div>` : '<div class="empty-state">当前条件没有匹配档案。可以清除部分条件后再试。</div>'}
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
		previewUrl: `/api/image/${encodeURIComponent(imageItemId)}/${encodeURIComponent(filename)}?variant=preview`,
		thumbnailUrl: `/api/image/${encodeURIComponent(imageItemId)}/${encodeURIComponent(filename)}?variant=thumb`,
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

// 维护任务分三层，对应维护概览的三个分组：
//   urgent  需要立即处理：发布检查失败、图片缺失等会阻止正式发布的问题；
//   fill    现在可以补齐：公开简介、图片说明、备份与复核登记等可以直接填写的内容；
//   longterm 长期研究事项：年代待考、来源待核验等，无法考证是档案工作的正常状态，用于持续跟踪。
// 每条任务都带上 tab 和 field，点击后可直接定位到对应字段。
const maintenanceTasksForRecord = (record) => {
	if (recordIsWithdrawn(record)) return [];
	const tasks = [];
	const add = (code, tier, label, tab = 'basic', field = '') => tasks.push({ code, tier, label, tab, field });
	for (const issue of (record._admin?.issues ?? []).filter((candidate) => candidate.code !== 'privacy_confirmation')) {
		add(issue.code, 'urgent', issue.message, issue.tab ?? 'basic', issue.field ?? '');
	}
	const publicationPaths = Array.isArray(record.core.publication_file_path) ? record.core.publication_file_path : [];
	const descriptions = Array.isArray(record.public_view?.image_descriptions) ? record.public_view.image_descriptions : [];
	const missingImageDescriptions = publicationPaths.filter((_, index) => !descriptions[index]?.trim()).length;
	if (!record.public_view?.description?.trim()) add('public_description', 'fill', '公开简介还没有填写', 'basic', 'description');
	if (missingImageDescriptions) add('image_descriptions', 'fill', `${missingImageDescriptions} 张图片说明待补`, 'images');
	const backupStatus = record.core.backup_status?.trim();
	if (!backupStatus) {
		add('backup_status_unregistered', 'fill', '备份状态尚未登记，需核实', 'basic', 'backup_status');
	} else if (backupStatus !== 'BU3') {
		add('backup_status', 'longterm', `备份未达到 3-2-1（当前：${pvDisplayCode(backupStatus)}）`, 'basic', 'backup_status');
	}
	const reviewDate = record.core.review_date?.trim();
	if (!reviewDate) add('review_date', 'fill', '尚未安排下次复核', 'basic', 'review_date');
	else if (!/^\d{4}-\d{2}-\d{2}$/.test(reviewDate)) add('review_date_format', 'fill', '复核日期格式需要检查', 'basic', 'review_date');
	else if (reviewDate <= today()) add('review_date_due', 'fill', `复核日期已到（${reviewDate}），请安排重新复核`, 'basic', 'review_date');
	if (record.core.research_status !== 'R4') {
		add('research_status', 'longterm', `研究尚未完成（当前：${pvDisplayCode(record.core.research_status) || '未填写'}）`, 'basic', 'research_status');
	}
	if (!record.core.evidence_level || record.core.evidence_level === 'D') {
		add('evidence_level', 'longterm', '证据等级待明确（年代、来源等待考）', 'basic', 'evidence_level');
	}
	if (!record.core.rights_status || record.core.rights_status === 'UNK') {
		add('rights_status', 'longterm', '权利状态待核验', 'basic', 'rights_status');
	}
	return tasks;
};

const renderRecordOverview = (record) => {
	if (!record) {
		const hasVisibleRecords = sortedRecords(filteredRecords()).length > 0;
		return `<section class="record-overview-empty">
		<div class="record-overview-empty-icon" aria-hidden="true">⌁</div>
		<h3>${hasVisibleRecords ? '尚未选择档案' : '当前列表中没有档案'}</h3>
		<p>${hasVisibleRecords ? '从左侧列表选择一条档案，这里才会加载图片和档案速览。' : '可以调整左侧的搜索或筛选条件，也可以新建一条档案。'}</p>
		${hasVisibleRecords ? '' : '<button class="publish-button" data-record-overview-action="new" type="button">新建档案</button>'}
	</section>`;
	}
	const images = recordImages(record);
	const firstImage = images[0];
	const tasks = maintenanceTasksForRecord(record);
	const urgentCount = tasks.filter((task) => task.tier === 'urgent').length;
	const fillCount = tasks.filter((task) => task.tier === 'fill').length;
	const isReadonly = recordIsWithdrawn(record);
	const typeLabel = queryCodeLabel('object_type', record.core.object_type);
	const itemId = record.core.item_id;
	const hasPublicPage = Boolean(itemId && record._admin?.hasOfficial && record._admin?.officialRecordStatus === 'ACT');
	const detailRows = [
		['永久编号', itemId],
		['收藏编码', record.core.collection_code || '保存后自动生成'],
		['藏品类型', `${typeLabel}（${record.core.object_type || '未定'}）`],
		['显示年代', record.core.date_display || '年代未知'],
		['来源', [record.core.source_name, record.core.source_place].filter(Boolean).join(' · ') || '尚未填写'],
		['隐私等级', queryCodeLabel('privacy', record.core.privacy_level)],
		['权利状态', queryCodeLabel('rights_status', record.core.rights_status)],
		['最后更新', record.core.updated_date || record.core.created_date || '尚未记录'],
	];
	const taskMarkup = tasks.length ? tasks.slice(0, 4).map((task) => `<button class="record-overview-task is-${escapeHtml(task.tier)}" data-record-overview-action="task" data-target-tab="${escapeHtml(task.tab)}" data-target-field="${escapeHtml(task.field ?? '')}" type="button">
		<span>${escapeHtml(task.label)}</span><small>前往处理 →</small>
	</button>`).join('') : '<div class="record-overview-clear"><strong>当前没有待处理项目</strong><span>仍需在正式发布前完成人工隐私确认。</span></div>';
	const imageMarkup = firstImage
		? `<img src="${escapeHtml(firstImage.previewUrl)}" alt="${escapeHtml(displayedImageDescription(record, firstImage, 0, images.length))}" />`
		: '<div class="record-overview-image-empty"><span>暂无发布图片</span><small>进入编辑后可以添加经过筛选的发布副本</small></div>';
	return `<div class="record-overview">
		<section class="record-overview-hero">
			<div class="record-overview-media">${imageMarkup}${images.length > 1 ? `<span class="record-overview-image-count">共 ${images.length} 张</span>` : ''}</div>
			<div class="record-overview-intro">
				<div class="record-overview-heading"><span class="record-status-chip is-${recordStatusTone(record)}">${escapeHtml(statusLabel(record))}</span><small>${escapeHtml(itemId)}</small></div>
				<h3>${escapeHtml(record.core.title || '未命名藏品')}</h3>
				<p>${escapeHtml(record.public_view?.description || '这条档案还没有填写公开简介。进入编辑后可继续补充。')}</p>
				<div class="record-overview-actions">
					${isReadonly
						? `<button class="publish-button" data-record-overview-action="restore" type="button" ${record._admin?.canRestoreWithdrawn ? '' : 'disabled'}>恢复为草稿</button>`
						: '<button class="publish-button" data-record-overview-action="edit" type="button">继续编辑</button><button class="quiet-button" data-record-overview-action="preview" type="button">发布前预览</button>'}
					${hasPublicPage ? `<a class="quiet-button" href="${escapeHtml(publicPreviewUrl(`/archive/${encodeURIComponent(itemId)}/`))}">查看公开档案</a>` : ''}
				</div>
				${isReadonly && !record._admin?.canRestoreWithdrawn ? `<p class="record-overview-readonly-note">${escapeHtml(record._admin?.restoreWithdrawnReason || '这条撤销记录继续作为只读追溯记录保留。')}</p>` : ''}
			</div>
		</section>
		<div class="record-overview-grid">
			<section class="record-overview-card"><div class="record-overview-card-heading"><div><span>基本资料</span><h4>档案摘要</h4></div><button class="text-button" data-record-overview-action="edit" type="button" ${isReadonly ? 'hidden' : ''}>编辑资料</button></div>
				<dl class="record-overview-details">${detailRows.map(([label, value]) => `<div><dt>${escapeHtml(label)}</dt><dd>${escapeHtml(value)}</dd></div>`).join('')}</dl>
			</section>
			<section class="record-overview-card"><div class="record-overview-card-heading"><div><span>质量提醒</span><h4>${tasks.length ? `${tasks.length} 项需要留意` : '状态良好'}</h4></div>${tasks.length ? `<small>${urgentCount ? `${urgentCount} 项会阻止发布` : `${fillCount} 项可以补齐`}</small>` : ''}</div>
				<div class="record-overview-tasks">${taskMarkup}${tasks.length > 4 ? `<button class="record-overview-more" data-record-overview-action="edit" type="button">查看另外 ${tasks.length - 4} 项</button>` : ''}</div>
			</section>
		</div>
	</div>`;
};

const getMaintenanceOverview = () => {
	const activeRecords = state.records.filter((record) => !recordIsWithdrawn(record));
	const records = activeRecords.map((record) => ({ record, tasks: maintenanceTasksForRecord(record) }));
	const countTier = (tier) => records.reduce((total, entry) =>
		total + entry.tasks.filter((task) => task.tier === tier).length, 0);
	return {
		records,
		attentionRecords: records.filter((entry) => entry.tasks.length).length,
		urgentTasks: countTier('urgent'),
		fillTasks: countTier('fill'),
		longtermTasks: countTier('longterm'),
		missingImageDescriptions: records.reduce((total, entry) => total + entry.tasks
			.filter((task) => task.code === 'image_descriptions')
			.reduce((count, task) => count + Number.parseInt(task.label, 10), 0), 0),
		backupUnregistered: records.filter((entry) =>
			entry.tasks.some((task) => task.code === 'backup_status_unregistered')).length,
		withdrawnRecords: state.records.filter(recordIsWithdrawn).length,
	};
};

const syncRecordToolOptions = (tabRecords) => {
	const typeLabels = new Map((state.dictionary.get('object_type') ?? []).map((entry) => [entry.code, entry.label]));
	const types = [...new Set(tabRecords.map((record) => record.core.object_type).filter(Boolean))]
		.sort((left, right) => chineseCollator.compare(typeLabels.get(left) ?? left, typeLabels.get(right) ?? right));
	elements.recordTypeFilter.innerHTML = `<option value="">全部类型</option>${types
		.map((value) => `<option value="${escapeHtml(value)}" ${value === state.recordTypeFilter ? 'selected' : ''}>${escapeHtml(typeLabels.get(value) ?? value)}（${escapeHtml(value)}）</option>`)
		.join('')}`;
	const decades = [...new Set(tabRecords.map(recordDecade).filter(Boolean))]
		.sort((left, right) => right.localeCompare(left));
	elements.recordDecadeFilter.innerHTML = `<option value="">全部年代</option>${decades
		.map((value) => `<option value="${escapeHtml(value)}" ${value === state.recordDecadeFilter ? 'selected' : ''}>${escapeHtml(value)}年代</option>`)
		.join('')}`;
	const statusOrder = ['草稿', '恢复草稿', '有未发布修改', '未发布', '候选', '已发布', '已撤销'];
	const statuses = [...new Set(tabRecords.map(statusLabel))]
		.sort((left, right) => (statusOrder.indexOf(left) + statusOrder.length) % statusOrder.length
			- ((statusOrder.indexOf(right) + statusOrder.length) % statusOrder.length));
	elements.recordQuickStatusFilter.innerHTML = `<option value="">全部状态</option>${statuses
		.map((value) => `<option value="${escapeHtml(value)}" ${value === state.recordQuickStatus ? 'selected' : ''}>${escapeHtml(value)}</option>`)
		.join('')}`;
};

const renderRecordList = () => {
	const tabRecords = recordsInCurrentStatusTab();
	syncRecordToolOptions(tabRecords);
	const records = sortedRecords(filteredRecords());
	const statusName = state.recordStatusFilter === 'withdrawn' ? '已撤销' : '正常';
	const activeConditions = [state.search.trim(), state.recordTypeFilter, state.recordDecadeFilter, state.recordQuickStatus]
		.filter(Boolean).length;
	elements.recordCount.textContent = activeConditions
		? `${statusName}档案命中 ${records.length} / ${tabRecords.length} 条 · ${activeConditions} 个条件`
		: `${statusName}档案 ${records.length} 条`;
	const pageCount = Math.max(1, Math.ceil(records.length / state.recordPageSize));
	state.recordPage = Math.min(Math.max(1, state.recordPage), pageCount);
	const startIndex = (state.recordPage - 1) * state.recordPageSize;
	const pageRecords = records.slice(startIndex, startIndex + state.recordPageSize);
	elements.recordList.innerHTML = pageRecords.length ? pageRecords.map((record) => {
		const image = recordImages(record)[0];
		const issueCount = maintenanceTasksForRecord(record).length;
		const typeLabel = queryCodeLabel('object_type', record.core.object_type);
		return `<button class="record-card ${record.core.item_id === state.activeId ? 'is-active' : ''}" data-id="${escapeHtml(record.core.item_id)}" type="button">
			<span class="record-card-thumb">${image ? `<img src="${escapeHtml(image.thumbnailUrl || image.previewUrl)}" alt="" loading="lazy" decoding="async" />` : '<span aria-hidden="true">⌁</span>'}</span>
			<span class="record-card-copy"><span class="record-card-title"><strong>${escapeHtml(record.core.title || '未命名藏品')}</strong><em class="record-status-chip is-${recordStatusTone(record)}">${escapeHtml(statusLabel(record))}</em></span>
			<span class="record-card-meta">${escapeHtml(typeLabel)} · ${escapeHtml(record.core.date_display || '年代未知')}</span>
			<small>${escapeHtml(record.core.item_id)}${issueCount ? ` · ${issueCount} 项待处理` : ''}</small></span>
		</button>`;
	}).join('') : `<div class="record-list-empty">${activeConditions ? '当前搜索或筛选没有匹配记录，可以放宽部分条件' : `暂无${statusName}档案`}</div>`;
	elements.recordPagination.hidden = pageCount <= 1;
	elements.recordPagination.innerHTML = pageCount > 1 ? `
		<button class="record-page-button" data-record-page="${state.recordPage - 1}" type="button" ${state.recordPage === 1 ? 'disabled' : ''}>上一页</button>
		<span>第 ${state.recordPage} / ${pageCount} 页 · 每页 ${state.recordPageSize} 条</span>
		<button class="record-page-button" data-record-page="${state.recordPage + 1}" type="button" ${state.recordPage === pageCount ? 'disabled' : ''}>下一页</button>` : '';
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
	document.body.dataset.workspace = state.workspaceMode;
	document.body.dataset.recordView = state.recordViewMode;
	const recordsWorkspaceActive = state.workspaceMode === 'records';
	elements.recordsPane.hidden = !recordsWorkspaceActive;
	elements.recordStatusNav.hidden = !recordsWorkspaceActive;
	document.querySelectorAll('[data-record-status]').forEach((button) => {
		button.classList.toggle('is-active', button.dataset.recordStatus === state.recordStatusFilter);
	});
	elements.mobileRecordBrowserToggle.hidden = !recordsWorkspaceActive;
	elements.recordBrowserContent.hidden = !recordsWorkspaceActive;
	if (recordsWorkspaceActive) {
		const isCompactLayout = window.matchMedia('(max-width: 900px)').matches;
		elements.recordBrowserContent.setAttribute('aria-hidden', String(isCompactLayout && !elements.recordBrowserContent.classList.contains('is-open')));
	} else setMobileRecordBrowserOpen(false);
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
	const integrityLoading = state.integrityLoading;
	const integrityPassed = integrity?.status === 'pass';
	const integrityFailures = integrity?.summary?.failures ?? 0;
	const tierDefinitions = [
		{
			tier: 'urgent', title: '需要立即处理的问题',
			note: '图片缺失、发布检查失败等问题会阻止正式发布，请优先处理。',
			empty: '没有需要立即处理的问题。',
		},
		{
			tier: 'fill', title: '现在可以补齐的内容',
			note: '公开简介、图片说明、备份与复核登记等；点击一条即可直接定位到对应字段。',
			empty: '当前没有可以立即补齐的内容。',
		},
		{
			tier: 'longterm', title: '长期研究事项',
			note: '一张照片暂时无法考证，是档案工作的正常状态。这些事项用于持续跟踪，不需要立刻完成。',
			empty: '当前没有长期研究事项。',
		},
	];
	const renderTaskSection = ({ tier, title, note, empty }) => {
		const cards = overview.records.map(({ record, tasks }) => {
			const tierTasks = tasks.filter((task) => task.tier === tier);
			if (!tierTasks.length) return '';
			return `<article class="maintenance-record-card">
				<div class="maintenance-record-heading"><div><p>${escapeHtml(statusLabel(record))}</p><h4>${escapeHtml(record.core.title || '未命名藏品')}</h4>
				<small>${escapeHtml(record.core.item_id)}</small></div></div>
				<div class="maintenance-issue-list">${tierTasks.map((task) => `<button class="maintenance-issue is-${escapeHtml(tier)}" data-center-action="maintenance-open" data-item-id="${escapeHtml(record.core.item_id)}" data-target-tab="${escapeHtml(task.tab)}" data-target-field="${escapeHtml(task.field ?? '')}" type="button">${escapeHtml(task.label)}<small>定位到对应位置 →</small></button>`).join('')}</div>
			</article>`;
		}).join('');
		return `<section class="maintenance-section is-${escapeHtml(tier)}" aria-labelledby="maintenance-${escapeHtml(tier)}-heading">
			<div class="maintenance-section-heading"><div><h3 id="maintenance-${escapeHtml(tier)}-heading">${escapeHtml(title)}</h3><p>${escapeHtml(note)}</p></div></div>
			${cards || `<div class="empty-state">${escapeHtml(empty)}</div>`}
		</section>`;
	};
	const integrityIssues = integrityLoading
		? '<div class="loading-state"><div class="loading-line"></div><div class="loading-line short"></div></div>'
		: integrity?.issues?.length
		? `<ul class="integrity-issue-list">${integrity.issues.map((issue) => `<li><div><strong>${escapeHtml(issue.area)}</strong><span>${issue.item_id ? `${escapeHtml(issue.title || issue.item_id)} · ` : ''}${escapeHtml(issue.message)}</span></div>${issue.item_id ? `<button class="quiet-button" data-center-action="maintenance-open" data-item-id="${escapeHtml(issue.item_id)}" data-target-tab="images" type="button">查看档案</button>` : ''}</li>`).join('')}</ul>`
		: integrity
			? '<div class="integrity-complete"><strong>发布层结构完整</strong><span>正式 JSON、发布图片、响应式副本、构建页面和管理端隔离检查均通过。</span></div>'
			: '<div class="empty-state">完整性巡检已改为按需执行，因此打开管理页面时不会再扫描全部图片。</div>';
	return `<div class="maintenance-overview">
		<section class="maintenance-summary" aria-labelledby="maintenance-summary-heading">
			<div class="section-heading"><div><h3 id="maintenance-summary-heading">维护概览</h3><p>按轻重缓急分成三组任务；每条事项都可以直接定位到对应字段，这里不会自动修改资料。</p></div></div>
			<div class="maintenance-summary-grid">
				<div class="${overview.urgentTasks ? 'is-alert' : 'is-pass'}"><span>需要立即处理</span><strong>${overview.urgentTasks}</strong><small>项问题</small></div>
				<div><span>现在可以补齐</span><strong>${overview.fillTasks}</strong><small>项内容</small></div>
				<div><span>长期研究事项</span><strong>${overview.longtermTasks}</strong><small>项持续跟踪</small></div>
				<div><span>图片说明</span><strong>${overview.missingImageDescriptions}</strong><small>张待补</small></div>
				<div><span>备份登记</span><strong>${overview.backupUnregistered}</strong><small>条尚未登记，需核实</small></div>
				<div class="${integrityPassed ? 'is-pass' : 'is-alert'}"><span>完整性巡检</span><strong>${integrityPassed ? '通过' : integrityFailures}</strong><small>${integrityPassed ? `${integrity.summary.checks} 项检查` : '项异常'}</small></div>
			</div>
			<p class="maintenance-withdrawn-note">建议每次复核完成后，把“更多通用字段 → 利用与保管 → 复盘日期”安排在未来 12 个月内；到期或未安排会列在“现在可以补齐的内容”中。备份状态由人工登记：显示“尚未登记，需核实”时，表示程序没有检查过实际备份，请以你自己的备份记录为准。</p>
			${overview.withdrawnRecords ? `<p class="maintenance-withdrawn-note">另有 ${overview.withdrawnRecords} 条已撤销追溯记录，只纳入完整性检查，不计入日常补录任务。</p>` : ''}
		</section>
		${tierDefinitions.map(renderTaskSection).join('')}
		<section class="maintenance-section" aria-labelledby="integrity-heading">
			<div class="maintenance-section-heading is-inline"><div><h3 id="integrity-heading">本地完整性巡检</h3><p>${integrityLoading ? '正在读取正式 JSON、发布副本和公开构建…' : integrity ? `检查于 ${escapeHtml(formatDateTime(integrity.checked_at))}，覆盖 ${integrity.summary.records} 份正式 JSON、${integrity.summary.publication_images} 张发布图片和 ${integrity.summary.responsive_variants} 个网页尺寸副本。` : '进入维护概览后按需检查，不影响档案列表打开速度。'}</p></div>
			<button class="quiet-button" data-center-action="maintenance-refresh" type="button" ${integrityLoading ? 'disabled' : ''}>${integrity ? '重新检查' : '开始检查'}</button></div>
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

const loadIntegrityReport = async ({ notify = false } = {}) => {
	if (state.integrityLoading) return;
	state.integrityLoading = true;
	if (state.workspaceMode === 'maintenance') renderWorkspaceCenter();
	try {
		const response = await fetch('/api/integrity-report', { cache: 'no-store' });
		const data = await readApiJson(response);
		if (!response.ok) throw new Error(data.error ?? '完整性巡检没有完成。');
		state.integrityReport = data.integrity ?? null;
		if (notify) showToast(state.integrityReport?.status === 'pass'
			? '完整性巡检已完成，发布层结构正常。'
			: '巡检已完成，请查看异常项目。', state.integrityReport?.status !== 'pass');
	} catch (error) {
		if (notify) showToast(error.message, true);
		else console.error(error);
	} finally {
		state.integrityLoading = false;
		if (state.workspaceMode === 'maintenance') renderWorkspaceCenter();
	}
};

const setWorkspaceMode = (mode) => {
	if (!['records', 'query', 'maintenance', 'drafts', 'recycle', 'history'].includes(mode)) return;
	const previousMode = state.workspaceMode;
	state.workspaceMode = mode;
	renderWorkspaceNavigation();
	if (mode === 'records') {
		state.recordViewMode = 'overview';
		if (previousMode !== 'records') {
			state.activeId = null;
			state.current = null;
		}
		const visibleRecords = sortedRecords(filteredRecords());
		const targetId = previousMode === 'records' && visibleRecords.some((record) => record.core.item_id === state.activeId)
			? state.activeId
			: null;
		if (targetId) {
			previewRecord(targetId);
			return;
		}
		state.activeId = null;
		state.current = null;
		updateHeader();
		renderEditor();
	} else {
		updateHeader();
		renderWorkspaceCenter();
		if (mode === 'query' && !state.query.loaded && !state.query.loading) loadQueryRecords();
		if (mode === 'maintenance' && !state.integrityReport && !state.integrityLoading) loadIntegrityReport();
	}
};

const setRecordStatusFilter = (filter) => {
	if (!['normal', 'withdrawn'].includes(filter) || filter === state.recordStatusFilter) return;
	state.recordStatusFilter = filter;
	state.recordPage = 1;
	state.recordQuickStatus = '';
	renderRecordList();
	renderWorkspaceNavigation();
	const visibleRecords = sortedRecords(filteredRecords());
	const nextRecord = visibleRecords.find((record) => record.core.item_id === state.activeId);
	if (nextRecord) previewRecord(nextRecord.core.item_id);
	else {
		state.activeId = null;
		state.current = null;
		state.recordViewMode = 'overview';
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
		query: ['资料查询', '在这里集中搜索、筛选并打开档案'],
		maintenance: ['维护概览', '质量待办与只读完整性巡检'],
		drafts: ['草稿中心', `${state.drafts.length} 份尚未正式发布的草稿`],
		recycle: ['图片回收区', `${state.recycleBin.length} 张可以恢复的发布副本`],
		history: ['历史版本', `${state.history.length} 份发布前版本备份`],
	};
	if (state.workspaceMode !== 'records') {
		const [title, detail] = centerTitles[state.workspaceMode];
		elements.recordKicker.textContent = '';
		elements.recordKicker.hidden = true;
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
		elements.backToLibraryButton.hidden = true;
		hideRecordActionDock();
		elements.taskSummary.hidden = true;
		elements.previewLink.href = publicPreviewUrl('/');
		elements.previewLink.textContent = '查看网站首页';
		elements.tabs.classList.add('is-hidden');
		return;
	}
	if (state.recordViewMode === 'overview') {
		const normalCount = state.records.filter((record) => !recordIsWithdrawn(record)).length;
		const withdrawnCount = state.records.length - normalCount;
		elements.recordKicker.textContent = '本地档案库';
		elements.recordKicker.hidden = false;
		elements.recordTitle.textContent = '档案管理';
		elements.recordId.textContent = `${normalCount} 条正常档案${withdrawnCount ? ` · ${withdrawnCount} 条已撤销` : ''}`;
		elements.saveState.textContent = '从左侧选择档案查看速览，再进入正式编辑';
		elements.saveState.classList.remove('is-dirty');
		elements.saveDraftButton.disabled = true;
		elements.publishButton.disabled = true;
		elements.saveDraftButton.hidden = true;
		elements.publishButton.hidden = true;
		elements.lifecycleButton.hidden = true;
		elements.similarRecordButton.hidden = true;
		elements.recordMoreActions.hidden = true;
		elements.backToLibraryButton.hidden = true;
		hideRecordActionDock();
		elements.taskSummary.hidden = true;
		elements.previewLink.href = publicPreviewUrl('/');
		elements.previewLink.textContent = '查看网站首页';
		elements.tabs.classList.add('is-hidden');
		return;
	}
	if (!state.current) {
		elements.recordKicker.textContent = '';
		elements.recordKicker.hidden = true;
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
		elements.backToLibraryButton.hidden = true;
		hideRecordActionDock();
		elements.taskSummary.hidden = true;
		elements.previewLink.href = publicPreviewUrl('/');
		elements.previewLink.textContent = '查看网站首页';
		elements.tabs.classList.add('is-hidden');
		return;
	}
	elements.backToLibraryButton.hidden = false;
	elements.tabs.classList.remove('is-hidden');
	elements.recordKicker.hidden = false;
	elements.recordKicker.textContent = state.isNew ? '新建藏品' : statusLabel(state.current);
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

const openRecord = (itemId, viewMode = 'editor') => {
	const record = state.records.find((candidate) => candidate.core.item_id === itemId);
	if (!record) return;
	state.activeId = itemId;
	state.workspaceMode = 'records';
	state.recordViewMode = viewMode;
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

const selectRecord = (itemId) => openRecord(itemId, 'editor');
const previewRecord = (itemId) => openRecord(itemId, 'overview');

const enterRecordEditor = (tab = 'basic', targetField = '') => {
	if (!state.current) return;
	state.recordViewMode = 'editor';
	state.activeTab = isWithdrawn() && !['basic', 'images'].includes(tab) ? 'basic' : tab;
	renderWorkspaceNavigation();
	updateHeader();
	renderTabs();
	renderEditor();
	if (!targetField) return;
	requestAnimationFrame(() => {
		const control = elements.editorSurface.querySelector(`[data-field="${CSS.escape(targetField)}"]`);
		if (!control) return;
		control.closest('details')?.setAttribute('open', '');
		control.scrollIntoView({ behavior: 'smooth', block: 'center' });
		control.focus();
	});
};

const similarCoreFieldCodes = [
	'object_type', 'batch_id', 'acquisition_method', 'source_name', 'source_place',
	'country', 'province', 'city', 'district',
];

const startNewRecord = (templateRecord = null) => {
	state.activeId = null;
	state.workspaceMode = 'records';
	state.recordViewMode = 'editor';
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
		public_view: { description: '', transcription: '', revision_note: '', tags: [], image_descriptions: [] },
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
		exactControl = '<p class="object-type-note is-warning">该分类尚无正式对象代码，当前不能新建。</p>';
	}
	return `<div class="object-type-controls">
		<label class="object-category-detail"><span>首页分类</span>
			<select class="object-category-control" data-field="object_type"${required ? ' aria-required="true" required' : ''}${readonly ? ' disabled' : ''}>
				<option value="">请选择藏品分类</option>${categoryOptions}
			</select></label>
		${exactControl}
	</div>`;
};

// 发布后会直接显示在公开档案页上的通用字段（对应 site/src/pages/archive/[id].astro 的展示范围：
// 基本信息、资料状态、档案信息（研究用元数据）、故事与原文）。
// 不在这个清单里的通用字段只用于档案维护，不会显示在公开页面。
// 注意：公开页只显示字段的中文标签，不显示代码值；item_id 仍通过页面地址和
// “引用与分享”区块公开，collection_code 则完全不公开，只用于内部管理。
// 获得方式、研究状态、证据等级、数字化状态、转录状态、隐私等级、权利状态、
// 利用状态、档案状态属于内部工作记录，同样不在公开页展示。
const publicCoreFieldCodes = new Set([
	'object_type', 'title', 'date_display', 'people',
	'country', 'province', 'city', 'district', 'street_town', 'specific_place',
	'item_id', 'source_place',
	'backup_status', 'condition_grade',
	'provenance_notes', 'updated_date', 'publication_file_path',
]);
const fieldVisibilityBadge = (scope, fieldCode) => {
	// 对象专属字段（metadata）会进入公开页面的“藏品细节 / 档案信息”；
	// 访客内容（public）同样会公开显示。
	const isPublic = scope === 'metadata'
		|| scope === 'public'
		|| (scope === 'core' && publicCoreFieldCodes.has(fieldCode));
	return isPublic
		? '<span class="field-visibility is-public" title="发布会显示在公开档案页">会公开</span>'
		: '<span class="field-visibility is-internal" title="只用于档案维护，不会显示在公开页面">仅用于维护</span>';
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
	const regionState = administrativeRegionListIds[fieldCode]
		? administrativeRegionFieldState(fieldCode, value)
		: null;
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
		control = `<input class="field-control administrative-region-control${regionState?.warning ? ' is-invalid' : ''}" type="text" list="${administrativeRegionListIds[fieldCode]}" autocomplete="off" placeholder="${escapeHtml(regionState?.placeholder ?? '')}" data-initial-value="${escapeHtml(value ?? '')}" ${attributes}${requiredControlAttribute}${regionState?.warning ? ' aria-invalid="true"' : ''} value="${escapeHtml(value ?? '')}" />`;
	} else {
		// 日期字段改用文本输入 + JS 自定义分段，避免依赖浏览器原生 <input type="date">
		// 的自动跳段行为（部分浏览器不会在年度输满 4 位后自动跳到月份）。
		const isDateInput = type === '日期';
		const inputType = isDateInput ? 'text' : ['整数', '数值'].includes(type) ? 'number' : 'text';
		const dateAttributes = isDateInput
			? ' inputmode="numeric" maxlength="10" autocomplete="off" placeholder="YYYY-MM-DD" data-mask="date"'
			: '';
		const stepAttribute = type === '数值' ? ' step="any"' : '';
		control = `<input class="field-control" type="${inputType}"${stepAttribute}${dateAttributes} ${attributes}${requiredControlAttribute} value="${escapeHtml(value ?? '')}" />`;
	}
	const wrapperTag = fieldCode === 'object_type' ? 'div' : 'label';
	const help = fieldCode === 'object_type'
		? '首页和管理端共用同一套七类；一个分类对应多个正式类型时，再选择精确类型。'
		: definition?.rule || (multi && !options.length ? '多项内容请每行填写一项。' : '');
	const notes = `${context ? `<span class="field-context">${escapeHtml(context)}</span>` : ''}${regionState?.message ? `<span class="field-context${regionState.warning ? ' is-warning' : ''}">${escapeHtml(regionState.message)}</span>` : ''}${help ? `<span class="field-help">${escapeHtml(help)}</span>` : ''}`;
	return `<${wrapperTag} class="form-field ${wide ? 'is-wide' : ''} ${fieldCode === 'object_type' ? 'is-object-type' : ''}">
		<span class="field-label">${escapeHtml(label)}${required ? '<span class="required-mark">必填</span>' : ''}${fieldVisibilityBadge(scope, fieldCode)}<small>${escapeHtml(fieldCode)}</small></span>
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
		const sectionFieldCodes = new Set(definitions.map((definition) => definition.field_code));
		const groupRequirements = (currentCollectionRules()?.required_dimensions ?? []).filter((dimension) => {
			const dimensionFields = (dimension.fields ?? []).map(normalizeRuleField);
			return dimensionFields.length > 1 &&
				dimensionFields.every((field) => field.scope === 'core' && sectionFieldCodes.has(field.field_code)) &&
				!(dimension.code_fields ?? []).length;
		});
		return { section, fields, requiredCount, groupRequirements, originalIndex };
	}).sort((left, right) =>
		Number(right.requiredCount > 0 || right.groupRequirements.length > 0) -
			Number(left.requiredCount > 0 || left.groupRequirements.length > 0) ||
		left.originalIndex - right.originalIndex);
	const moreFields = moreFieldGroups.map(({ section, fields, requiredCount, groupRequirements }) => {
		const requiredBadge = groupRequirements.length
			? `<strong class="more-fields-required" title="${escapeHtml(groupRequirements.map((rule) => `${rule.dimension_code} · ${rule.name}`).join('；'))}">必填 · 至少一项</strong>`
			: requiredCount
			? `<strong class="more-fields-required">必填 ${requiredCount} 项</strong>`
			: '';
		return `
		<details class="more-fields ${groupRequirements.length ? 'is-required-group' : ''}"><summary><span class="more-fields-summary-title">${escapeHtml(section)} · ${fields.length} 个字段</span>${requiredBadge}</summary><div class="form-grid">
		${fields.map(({ definition, rule, required }) => renderField({
			fieldCode: definition.field_code,
			definition,
			value: state.current.core[definition.field_code],
			required,
			context: rule.context,
		})).join('')}</div></details>`;
	}).join('');
	const publicTranscriptionDefinition = state.current.core.object_type === 'LET'
		? {
			name: '信件电子文字',
			rule: '按原件逐字录入并保留称呼、段落、换行、落款和日期；无法辨认写〔不清〕，缺失文字写□。私人地址、电话、证件号码和清晰签名等敏感内容不得进入公开文字。',
		}
		: undefined;
	return `<section class="form-section">
		<div class="section-heading"><div><h3>常用档案信息</h3><p>必填字段已排在前面；永久编号首次保存后不变，收藏品编码由正式对象类型、显示年代和必填属性代码组成。</p></div></div>
	<div class="form-grid common-info-grid"><label class="form-field is-item-id"><span class="field-label">永久编号 ${fieldVisibilityBadge('core', 'item_id')} <small>item_id</small></span>
	<input type="text" value="${escapeHtml(state.current.core.item_id || '尚未分配')}" readonly /></label>
	<label class="form-field is-code-output"><span class="field-label">收藏品编码 ${fieldVisibilityBadge('core', 'collection_code')} <small>collection_code</small></span>
		<input type="text" data-collection-code-output value="${escapeHtml(state.current.core.collection_code || '请先填写收藏品编码组成字段')}" readonly />
		<span class="field-notes"><span class="field-help">系统自动生成，不需要手工填写。</span></span></label>
		${objectTypeField}${primary}</div>
	</section>
	<section class="basic-code-logic-panel" aria-label="编码生成逻辑">
		<aside class="collection-code-logic is-inline" data-collection-code-logic>${renderCollectionCodeLogic()}</aside>
	</section>
	<section class="form-section"><div class="section-heading"><div><h3>访客看到的内容</h3><p>这些文字会进入公开页面，请不要填写敏感信息。</p></div></div>
		<div class="form-grid">${renderField({ scope: 'public', fieldCode: 'description', value: state.current.public_view.description })}
		${renderField({ scope: 'public', fieldCode: 'transcription', definition: publicTranscriptionDefinition, value: state.current.public_view.transcription })}
		${renderField({
			scope: 'public',
			fieldCode: 'revision_note',
			definition: {
				name: '公开修订说明',
				rule: '只有题名、判断、转录或来源说明发生实质变化时填写；一两句话说明改了什么，不记录内部操作过程。',
			},
			value: state.current.public_view.revision_note,
		})}
		${renderField({ scope: 'public', fieldCode: 'tags', value: state.current.public_view.tags })}</div>
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

// —— 发布前真实预览 ————————————————————————————————————————————
// 以下函数逐条对应正式网站的实现，保证预览与访客页面一致：
//   site/src/data/archive-view.ts       → pvCreateRecordView / pvSpecificMetadataFacts / pvDisplayCode
//   site/src/data/archive-rights.ts     → pvPublicUsagePolicy
//   site/src/data/archive-categories.ts → pvCategorySlug
//   site/src/pages/archive/[id].astro   → renderPreview 输出的页面结构与样式
// 正式页面的展示规则变化时，需要同步修改这里。

const pvHasText = (value) => typeof value === 'string' && value.trim().length > 0;
const pvUniqueText = (values) => [...new Set(values.filter(pvHasText).map((value) => value.trim()))];

let pvCodeIndex = null;
const pvCodeEntry = (code) => {
	if (!pvHasText(code)) return undefined;
	if (!pvCodeIndex) {
		pvCodeIndex = new Map();
		for (const entries of state.dictionary.values()) {
			for (const entry of entries) if (!pvCodeIndex.has(entry.code)) pvCodeIndex.set(entry.code, entry);
		}
	}
	return pvCodeIndex.get(code.trim());
};
const pvCodeLabel = (code) => pvCodeEntry(code)?.label ?? code;
const pvDisplayCode = (code) => (pvHasText(code) ? `${pvCodeLabel(code)}（${code.trim()}）` : '');
const pvTypeLabel = (type) => pvCodeLabel(type);
const pvIsPublished = (record) =>
	record.core.record_status === 'ACT' && record.core.use_status === 'U3' && record.core.privacy_level === 'G';
const pvDecade = (dateDisplay) => {
	const match = dateDisplay?.match(/(\d{4})/);
	return match ? String(Math.floor(Number(match[1]) / 10) * 10) : undefined;
};

// 对应 createArchiveRecordView；gallery 传入时用编辑器当前图片（含未保存草稿图）替代正式发布路径。
const pvCreateRecordView = (record, gallery = null) => {
	const core = record.core;
	const publicView = record.public_view ?? {};
	const dateDisplay = core.date_display?.trim() ?? '';
	// 地点只有 core 结构化字段一个填写位置，展示文字和筛选值都由它推导。
	const placeFilters = pvUniqueText([
		core.country, core.province, core.city, core.district, core.street_town, core.specific_place,
	]);
	const placeDisplay = placeFilters.join(' / ');
	const images = gallery ? gallery.map((image) => image.previewUrl) : pvUniqueText(core.publication_file_path ?? []);
	const maintainedDescriptions = publicView.image_descriptions ?? [];
	const fallbackDescription = (index) => {
		const title = core.title?.trim() || '藏品';
		const source = gallery ? (gallery[index]?.filename ?? '') : (images[index] ?? '');
		const filename = source.split('/').at(-1)?.toLocaleLowerCase('en-US') ?? '';
		if (images.length === 1) return `${title}的档案图片`;
		if (filename.startsWith('front-')) return `${title}，正面`;
		if (filename.startsWith('back-')) return `${title}，背面`;
		return `${title}，细节图 ${index + 1}`;
	};
	const imageDescriptions = images.map((_, index) => {
		const maintained = gallery ? gallery[index]?.description?.trim() : maintainedDescriptions[index]?.trim();
		return maintained || fallbackDescription(index);
	});
	return {
		record,
		id: core.item_id,
		collectionCode: core.collection_code?.trim() ?? '',
		title: core.title,
		objectType: core.object_type,
		typeLabel: pvTypeLabel(core.object_type),
		dateDisplay,
		decade: pvDecade(dateDisplay),
		placeDisplay,
		placeFilters,
		description: publicView.description?.trim() ?? '',
		transcription: publicView.transcription?.trim() ?? '',
		tags: pvUniqueText(publicView.tags ?? []),
		images,
		imageDescriptions,
	};
};

const pvFormatValue = (value, includeCodes) => {
	if (Array.isArray(value)) {
		return value.map((entry) => pvFormatValue(entry, includeCodes)).filter(Boolean).join('、');
	}
	if (typeof value === 'number') return String(value);
	if (typeof value !== 'string' || value.trim() === '') return '';
	const trimmed = value.trim();
	const entry = pvCodeEntry(trimmed);
	return entry ? (includeCodes ? `${entry.label}（${entry.code}）` : entry.label) : trimmed;
};

const pvSpecificMetadataFacts = (record, { includeCodes = false } = {}) => {
	const definitions = state.standards?.dimensions?.[record.metadata?.schema]?.dimensions ?? [];
	const visitorFirstFields = new Set(['people', 'body_transcription', 'message_transcription', 'transcription']);
	const values = record.metadata?.dimensions ?? {};
	return definitions.flatMap((definition) => {
		const dimensionValue = values[definition.dimension_code];
		if (!dimensionValue) return [];
		const formattedValues = (definition.fields ?? [])
			.map((field) => (visitorFirstFields.has(field) ? '' : pvFormatValue(dimensionValue[field], includeCodes)))
			.filter(Boolean);
		if (!formattedValues.length) return [];
		return [{
			label: definition.name,
			value: formattedValues.join('；'),
			code: includeCodes ? definition.dimension_code : undefined,
		}];
	});
};

// 对应 archive-rights.ts 的公开使用政策。
const pvUsagePolicies = {
	PD: {
		canDownloadPublicationCopy: true,
		title: '可下载网页发布副本',
		description: '这件档案已核验为公版或无著作权限制，可下载网站使用的压缩发布副本。',
		attribution: '转载或研究引用时，建议保留题名、永久编号与“老旧默片”来源。',
	},
	LIC: {
		canDownloadPublicationCopy: false,
		title: '已获展示许可，暂不开放下载',
		description: '现有许可足以支持网页展示，但下载与再利用范围没有单独确认。',
		attribution: '如需使用，请先核对具体许可范围，并在引用中保留题名、永久编号与来源。',
	},
	OWN: {
		canDownloadPublicationCopy: false,
		title: '持有实物，暂不开放下载',
		description: '持有实物不等同于拥有著作权，因此网站不主动提供图片下载。',
		attribution: '页面可用于浏览和规范引用，不代表授权复制或再发布。',
	},
	RES: {
		canDownloadPublicationCopy: false,
		title: '权利受限，不提供下载',
		description: '这件档案存在明确的合同、隐私或著作权限制。',
		attribution: '页面内容仅供当前公开展示范围内浏览。',
	},
	UNK: {
		canDownloadPublicationCopy: false,
		title: '权利尚未核验，不提供下载',
		description: '在权利情况明确前，网站只提供在线浏览和规范引用。',
		attribution: '公开展示不等于授权复制、下载或再发布。',
	},
};
const pvPublicUsagePolicy = (rightsStatus) => {
	const normalizedStatus = rightsStatus?.trim() || 'UNK';
	const policy = pvUsagePolicies[normalizedStatus] ?? pvUsagePolicies.UNK;
	return { statusLabel: pvCodeEntry(normalizedStatus)?.label ?? '权利不明', ...policy };
};

const pvCategorySlug = (objectType) =>
	objectTypeCategories().find((category) => (category.object_types ?? []).includes(objectType))?.slug;
const pvCategoryLabel = (slug) =>
	objectTypeCategories().find((category) => category.slug === slug)?.label ?? '';
const pvImageRole = (description, index) =>
	['正面', '背面', '封面', '内页', '全景', '细节'].find((role) => description.includes(role)) ?? `图片 ${index + 1}`;
const pvFormatDisplayDate = (value) => {
	const match = value?.match(/^(\d{4})-(\d{2})-(\d{2})$/);
	return match ? `${match[1]}年${Number(match[2])}月${Number(match[3])}日` : value?.trim() ?? '';
};
const pvNormalizePlaceLabel = (value) => value.trim().replace(/[省市区县]$/, '');

const renderPreview = () => {
	const record = state.current;
	const issues = currentPreviewIssues();
	const qualityWarnings = contentQualityWarnings();
	const isLetter = record.core.object_type === 'LET';
	const view = pvCreateRecordView(record, state.images);
	const currentCategorySlug = pvCategorySlug(view.objectType);
	const currentCategoryLabel = pvCategoryLabel(currentCategorySlug);
	const hasPublicTranscription = pvHasText(view.transcription);
	const hasPublicOriginal = view.images.length > 0;
	const initialLetterMode = hasPublicTranscription ? 'text' : 'original';
	const letterReadingModes = [
		hasPublicTranscription ? { value: 'text', label: '文字阅读' } : undefined,
		hasPublicTranscription && hasPublicOriginal ? { value: 'compare', label: '原件对照' } : undefined,
		hasPublicOriginal ? { value: 'original', label: '只看原件' } : undefined,
	].filter(Boolean);
	const compactFacts = (facts) => facts.filter((fact) => pvHasText(fact.value));
	const joinText = (value) => (value ?? []).filter(pvHasText).join('、');
	const archiveFilterHref = (name, value) => publicPreviewUrl(`/archive/?${name}=${encodeURIComponent(value)}`);
	const recordUrl = publicPreviewUrl(`/archive/${encodeURIComponent(view.id || '')}/`);
	// “地点”行的同地点链接取最能定位的一层结构化地点（优先市级），含“未知”的层级跳过。
	const placeLinkLevels = ['city', 'district', 'street_town', 'specific_place', 'province', 'country'];
	const preferredPlace = placeLinkLevels
		.map((field) => record.core[field]?.trim())
		.find((value) => value && !value.includes('未知'));
	const preferredPlaceFilter = preferredPlace
		? view.placeFilters.find((place) => place === preferredPlace)
			?? view.placeFilters.find((place) => pvNormalizePlaceLabel(place) === pvNormalizePlaceLabel(preferredPlace))
		: undefined;
	const basicFacts = compactFacts([
		{ label: '类型', value: view.typeLabel, href: currentCategorySlug ? archiveFilterHref('category', currentCategorySlug) : '' },
		{ label: '年代', value: view.dateDisplay, href: view.decade ? archiveFilterHref('decade', view.decade) : '' },
		{ label: '地点', value: view.placeDisplay, href: preferredPlaceFilter ? archiveFilterHref('place', preferredPlaceFilter) : '' },
		{ label: '人物', value: joinText(record.core.people) },
	]);
	const codeStatusFact = (label, code) => {
		if (!code) return undefined;
		const entry = pvCodeEntry(code);
		return { label, value: entry?.label ?? code, description: entry?.definition ?? '以当前档案记录为准。' };
	};
	const recordStatusFacts = [
		codeStatusFact('研究状态', record.core.research_status),
		codeStatusFact('证据等级', record.core.evidence_level),
		record.core.updated_date
			? { label: '最后更新', value: pvFormatDisplayDate(record.core.updated_date), description: '公开档案最近一次修改的日期。' }
			: undefined,
	].filter(Boolean);
	const specificFacts = pvSpecificMetadataFacts(record);
	const specificTechnicalFacts = pvSpecificMetadataFacts(record, { includeCodes: true });
	const researchManagementFacts = compactFacts([
		{ label: '永久编号', value: view.id },
		{ label: '收藏品编码', value: view.collectionCode },
		{ label: '对象类型', value: view.typeLabel, code: record.core.object_type },
		{ label: '获得方式', value: pvDisplayCode(record.core.acquisition_method) },
		{ label: '来源地点', value: record.core.source_place ?? '' },
		{ label: '研究状态', value: pvDisplayCode(record.core.research_status) },
		{ label: '证据等级', value: pvDisplayCode(record.core.evidence_level) },
		{ label: '数字化状态', value: pvDisplayCode(record.core.digitization_status) },
		{ label: '转录状态', value: pvDisplayCode(record.core.transcription_status) },
		{ label: '备份状态', value: pvDisplayCode(record.core.backup_status) },
		{ label: '保存等级', value: pvDisplayCode(record.core.condition_grade) },
		{ label: '隐私等级', value: pvDisplayCode(record.core.privacy_level) },
		{ label: '权利状态', value: pvDisplayCode(record.core.rights_status) },
		{ label: '利用状态', value: pvDisplayCode(record.core.use_status) },
		{ label: '档案状态', value: pvDisplayCode(record.core.record_status) },
		...specificTechnicalFacts.map((fact) => ({ label: `专属维度 · ${fact.label}`, value: fact.value, code: fact.code })),
	]);
	const galleryImages = view.images.map((src, index) => ({
		src,
		description: view.imageDescriptions[index],
		role: pvImageRole(view.imageDescriptions[index], index),
	}));
	const galleryItemsJson = escapeHtml(JSON.stringify(galleryImages));
	const revisionNote = record.public_view?.revision_note?.trim() ?? '';
	const hasNarrativeContent = (!isLetter && hasPublicTranscription) || pvHasText(record.core.provenance_notes);
	const usagePolicy = pvPublicUsagePolicy(record.core.rights_status);
	const downloadableImages = usagePolicy.canDownloadPublicationCopy
		? view.images.map((source, index) => ({
			source,
			description: view.imageDescriptions[index],
			filename: `${view.id || 'draft'}-${String(index + 1).padStart(2, '0')}.jpg`,
		}))
		: [];
	// 对应正式页面“沿着线索继续看”：共同标签 4 分、共同地点 3 分、同年代 2 分、同分类 2 分、跨类型 0.25 分，取前 3 条。
	const relatedRecords = state.records
		.filter(pvIsPublished)
		.filter((candidate) => candidate.core.item_id !== view.id)
		.map((candidate) => {
			const candidateView = pvCreateRecordView(candidate);
			const sharedTags = candidateView.tags.filter((tag) => view.tags.includes(tag));
			const sharedPlaces = candidateView.placeFilters.filter((place) => view.placeFilters.includes(place));
			const sameDecade = Boolean(view.decade && candidateView.decade === view.decade);
			const sameCategory = Boolean(currentCategorySlug && pvCategorySlug(candidateView.objectType) === currentCategorySlug);
			const reasons = [
				sharedTags.length ? `共同线索：${sharedTags.slice(0, 2).join('、')}` : '',
				sharedPlaces.length ? `关联地点：${sharedPlaces.slice(0, 2).join('、')}` : '',
				sameDecade ? `同属${view.decade}年代` : '',
				sameCategory ? `同属${currentCategoryLabel || '相近类型'}` : '',
			].filter(Boolean);
			const score = sharedTags.length * 4 + sharedPlaces.length * 3 + Number(sameDecade) * 2
				+ Number(sameCategory) * 2 + Number(candidateView.objectType !== view.objectType) * 0.25;
			return { view: candidateView, score, reason: reasons[0] ?? '', cover: recordImages(candidate)[0]?.previewUrl ?? '' };
		})
		.filter((entry) => entry.score > 0 && entry.reason)
		.sort((left, right) => right.score - left.score || left.view.title.localeCompare(right.view.title, 'zh-CN'))
		.slice(0, 3);

	const galleryMarkup = galleryImages.length ? `
		<div class="record-gallery" data-record-gallery data-gallery-index="0"
			data-gallery-items="${galleryItemsJson}" aria-label="档案图片">
			<figure class="record-image">
				<button class="record-image-open" type="button" data-gallery-open aria-label="放大查看：${escapeHtml(galleryImages[0].description)}">
					<img data-gallery-main src="${escapeHtml(galleryImages[0].src)}" alt="${escapeHtml(galleryImages[0].description)}" />
					<span class="record-image-hint">放大查看</span>
				</button>
				<figcaption>
					<span class="record-image-caption"><strong data-gallery-role>${escapeHtml(galleryImages[0].role)}</strong><span data-gallery-caption>${escapeHtml(galleryImages[0].description)}</span></span>
					<small data-gallery-counter>第 1 张，共 ${galleryImages.length} 张</small>
				</figcaption>
			</figure>
			${galleryImages.length > 1 ? `
			<div class="record-gallery-controls" aria-label="切换当前档案图片">
				<button class="gallery-step gallery-step-previous" type="button" data-gallery-previous-inline><span aria-hidden="true">←</span> 上一张</button>
				<span>点击主图可进入大图查看</span>
				<button class="gallery-step gallery-step-next" type="button" data-gallery-next-inline>下一张 <span aria-hidden="true">→</span></button>
			</div>
			<div class="record-thumbnails" aria-label="切换档案图片">
				${galleryImages.map((image, index) => `
				<button type="button" aria-label="查看第 ${index + 1} 张图片：${escapeHtml(image.description)}" aria-current="${index === 0 ? 'true' : 'false'}" data-gallery-thumbnail data-gallery-index="${index + 1}">
					<img src="${escapeHtml(image.src)}" alt="" loading="lazy" /><span>${escapeHtml(image.role)}</span>
				</button>`).join('')}
			</div>` : ''}
			<dialog class="record-lightbox" data-gallery-lightbox aria-label="放大查看档案图片">
				<div class="lightbox-shell">
					<button class="lightbox-close" type="button" data-gallery-close aria-label="关闭放大图片">关闭 ×</button>
					${galleryImages.length > 1 ? '<button class="lightbox-previous" type="button" data-gallery-previous aria-label="查看上一张图片"><span aria-hidden="true">←</span><small>上一张</small></button>' : ''}
					<figure class="lightbox-figure">
						<img data-lightbox-main src="${escapeHtml(galleryImages[0].src)}" alt="${escapeHtml(galleryImages[0].description)}" />
						<figcaption>
							<span class="lightbox-caption-copy"><strong data-lightbox-role>${escapeHtml(galleryImages[0].role)}</strong><span data-lightbox-caption>${escapeHtml(galleryImages[0].description)}</span></span>
							<small data-lightbox-counter>第 1 张，共 ${galleryImages.length} 张</small>
						</figcaption>
					</figure>
					${galleryImages.length > 1 ? '<button class="lightbox-next" type="button" data-gallery-next aria-label="查看下一张图片"><span aria-hidden="true">→</span><small>下一张</small></button>' : ''}
				</div>
			</dialog>
		</div>` : '';

	const letterHeader = isLetter ? `
		<header class="letter-reading-header">
			<div><h2>信件阅读</h2></div>
			${letterReadingModes.length > 1 ? `
			<div class="letter-reading-modes" role="group" aria-label="选择信件查看方式">
				${letterReadingModes.map((mode) => `<button type="button" data-letter-mode-select="${escapeHtml(mode.value)}" aria-pressed="${String(mode.value === initialLetterMode)}">${escapeHtml(mode.label)}</button>`).join('')}
			</div>` : ''}
			<p class="letter-reading-introduction">${hasPublicTranscription
				? '以下为经过公开与隐私检查的电子转录，保留原有段落与换行；原件图片是最终核对依据。'
				: '这封信暂未提供公开电子转录，当前仅展示经过检查的原件发布副本。'}</p>
		</header>` : '';
	const letterTranscription = isLetter && hasPublicTranscription ? `
		<article class="letter-transcription" aria-labelledby="letter-transcription-heading">
			<header>
				<div><h2 id="letter-transcription-heading">电子文字</h2></div>
				<span>${record.core.transcription_status ? escapeHtml(pvCodeLabel(record.core.transcription_status)) : '公开转录'}</span>
			</header>
			<div class="letter-transcription-text">${escapeHtml(view.transcription)}</div>
			<footer><span>〔不清〕表示原件难以辨认</span><span>□ 表示原件文字缺失</span></footer>
		</article>` : '';

	const pageMarkup = `
	<article class="record-page">
		<nav class="record-breadcrumb" aria-label="面包屑（预览示意，正式页面可点击）">
			<span class="breadcrumb-link">首页</span><span class="breadcrumb-sep" aria-hidden="true">/</span>
			<span class="breadcrumb-link">档案</span>
			${currentCategoryLabel ? `<span class="breadcrumb-sep" aria-hidden="true">/</span><span class="breadcrumb-link">${escapeHtml(currentCategoryLabel)}</span>` : ''}
			<span class="breadcrumb-sep" aria-hidden="true">/</span>
			<span class="breadcrumb-current">${escapeHtml(view.title || '未命名藏品')}</span>
		</nav>
		<span class="back-link ui-text-link">← 返回档案</span>
		<header class="record-heading">
			<p class="section-mark">${escapeHtml(view.typeLabel)}</p>
			<h1>${escapeHtml(view.title || '未命名藏品')}</h1>
			${pvHasText(view.description) ? `<p class="record-lead">${escapeHtml(view.description)}</p>` : ''}
		</header>
		<div class="record-sheet ${isLetter ? 'record-sheet--letter' : ''}" ${isLetter ? `data-letter-reader="true" data-letter-mode="${escapeHtml(initialLetterMode)}"` : ''}>
			${letterHeader}
			${letterTranscription}
			${galleryMarkup}
			<section class="record-basic-information" aria-labelledby="preview-basic-heading">
				<h2 class="facts-heading" id="preview-basic-heading">基本信息</h2>
				<dl class="record-facts">
					${basicFacts.map((fact) => `<div><dt>${escapeHtml(fact.label)}</dt><dd>${fact.href
						? `<a class="fact-filter-link" href="${escapeHtml(fact.href)}" target="_blank" rel="noopener">${escapeHtml(fact.value)}<small>查看相关档案 →</small></a>`
						: escapeHtml(fact.value)}</dd></div>`).join('')}
				</dl>
			</section>
		</div>
		${recordStatusFacts.length ? `
		<aside class="record-status" aria-labelledby="preview-status-heading">
			<div class="record-status-heading"><div><h2 id="preview-status-heading">资料状态</h2></div>
				<a href="${escapeHtml(publicPreviewUrl('/about/#research'))}" target="_blank" rel="noopener">了解整理与判断方式 →</a></div>
			<dl>${recordStatusFacts.map((fact) => `<div><dt>${escapeHtml(fact.label)}</dt><dd>${escapeHtml(fact.value)}<small>${escapeHtml(fact.description)}</small></dd></div>`).join('')}</dl>
			${pvHasText(revisionNote) ? `<div class="record-revision-note"><strong>最近修订</strong><p>${escapeHtml(revisionNote)}</p></div>` : ''}
		</aside>` : ''}
		<div class="record-notes">
			${hasNarrativeContent ? `
			<section class="record-section" aria-labelledby="preview-description-heading">
				<h2 id="preview-description-heading">${isLetter ? '流传与来源' : '故事与原文'}</h2>
				<div class="section-content">
					${pvHasText(record.core.provenance_notes) ? `<div class="subsection"><h3>流传线索</h3><p>${escapeHtml(record.core.provenance_notes)}</p></div>` : ''}
					${!isLetter && hasPublicTranscription ? `<div class="subsection"><h3>原文 / 转录</h3><p class="transcription">${escapeHtml(view.transcription)}</p></div>` : ''}
				</div>
			</section>` : ''}
			${view.tags.length ? `
			<section class="record-section" aria-labelledby="preview-tags-heading">
				<h2 id="preview-tags-heading">标签</h2>
				<div class="section-content"><ul class="record-tags">
					${view.tags.map((tag) => `<li><a href="${escapeHtml(archiveFilterHref('tag', tag))}" target="_blank" rel="noopener">${escapeHtml(tag)}</a></li>`).join('')}
				</ul></div>
			</section>` : ''}
			${specificFacts.length ? `
			<section class="record-section" aria-labelledby="preview-specific-heading">
				<h2 id="preview-specific-heading">藏品细节</h2>
				<dl class="section-facts">${specificFacts.map((fact) => `<div><dt>${escapeHtml(fact.label)}</dt><dd>${escapeHtml(fact.value)}</dd></div>`).join('')}</dl>
			</section>` : ''}
			${researchManagementFacts.length ? `
			<details class="management-information">
				<summary><span>更多信息</span><small>研究用元数据 · ${researchManagementFacts.length} 项 · 包含编号与技术代码</small></summary>
				<dl class="section-facts">${researchManagementFacts.map((fact) => `<div><dt>${escapeHtml(fact.label)}${fact.code ? `<small>${escapeHtml(fact.code)}</small>` : ''}</dt><dd>${escapeHtml(fact.value)}</dd></div>`).join('')}</dl>
			</details>` : ''}
		</div>
		${relatedRecords.length ? `
		<section class="record-related" aria-labelledby="preview-related-heading">
			<div class="record-related-heading"><h2 id="preview-related-heading">沿着线索继续看</h2><span>根据共同标签、地点、年代或分类自动关联。</span></div>
			<div class="record-related-grid">${relatedRecords.map((entry) => `
				<a href="${escapeHtml(publicPreviewUrl(`/archive/${encodeURIComponent(entry.view.id)}/`))}" target="_blank" rel="noopener">
					<figure>${entry.cover ? `<img src="${escapeHtml(entry.cover)}" alt="${escapeHtml(entry.view.imageDescriptions[0] ?? '')}" loading="lazy" />` : ''}</figure>
					<div><small>${escapeHtml(entry.reason)}</small><strong>${escapeHtml(entry.view.title)}</strong><span>${escapeHtml(entry.view.typeLabel)} · ${escapeHtml(entry.view.dateDisplay)}</span></div>
				</a>`).join('')}
			</div>
		</section>` : ''}
		<section class="record-usage" aria-labelledby="preview-usage-heading">
			<div class="record-usage-heading"><h2 id="preview-usage-heading">使用与下载</h2></div>
			<div class="record-usage-content">
				<div class="record-usage-summary">
					<span>权利状态 · ${escapeHtml(usagePolicy.statusLabel)}</span>
					<strong>${escapeHtml(usagePolicy.title)}</strong>
					<p>${escapeHtml(usagePolicy.description)}</p>
					<small>${escapeHtml(usagePolicy.attribution)}</small>
				</div>
				${downloadableImages.length ? `
				<div class="record-downloads" aria-label="可下载的网页发布副本">
					${downloadableImages.map((image, index) => `<a class="ui-action ui-action--primary" href="${escapeHtml(image.source)}" download="${escapeHtml(image.filename)}">下载发布副本 ${downloadableImages.length > 1 ? index + 1 : ''}<small>${escapeHtml(image.description)}</small></a>`).join('')}
					<p>下载内容是网站使用的压缩发布副本，不是原始扫描件或档案主文件。</p>
				</div>` : ''}
			</div>
		</section>
		<section class="record-citation" aria-labelledby="preview-citation-heading" data-record-citation
			data-record-title="${escapeHtml(view.title || '未命名藏品')}" data-record-identifier="${escapeHtml(view.id || '尚未生成')}" data-record-url="${escapeHtml(recordUrl)}">
			<div class="record-citation-heading"><h2 id="preview-citation-heading">引用与分享</h2></div>
			<div class="record-citation-content">
				<p class="citation-preview">《${escapeHtml(view.title || '未命名藏品')}》（${escapeHtml(view.id || '尚未生成')}），老旧默片。复制时会自动补充当前页面地址和访问日期。</p>
				<div class="citation-actions">
					<button class="ui-action ui-action--secondary" type="button" data-copy-record-link>复制页面链接</button>
					<button class="ui-action ui-action--secondary" type="button" data-copy-record-citation>复制规范引用</button>
				</div>
				<p class="citation-feedback" role="status" aria-live="polite" data-citation-feedback></p>
			</div>
		</section>
		<p class="preview-neighbors-note">正式发布后，页面底部还会按同类已发布档案自动出现“上一件 / 下一件”导航；顺序由正式发布数据决定，不在预览中模拟。</p>
	</article>`;

	return `<div class="preview-shell">
	<div class="preview-main">
		<div class="preview-toolbar">
			<div class="preview-toolbar-copy"><strong>发布前真实预览</strong>
				<span>与正式档案页使用同一套数据和排版规则，完整显示将要公开的文字、图片、来源和专属资料；全站页首、页脚不在此重复。预览不会把草稿公开。</span></div>
			<div class="preview-viewport-toggle" role="group" aria-label="切换预览设备">
				<button type="button" data-preview-viewport="desktop" aria-pressed="true">电脑</button>
				<button type="button" data-preview-viewport="mobile" aria-pressed="false">手机</button>
			</div>
		</div>
		<div class="preview-viewport is-desktop" data-preview-viewport-shell>
			<div class="preview-frame pv-site">${pageMarkup}</div>
		</div>
	</div>
	<aside class="check-panel"><h4>发布前缺失项</h4>
		<p>点击一项可回到相应位置处理。预览不会把草稿公开。</p>
		${issues.length ? `<ul class="issue-list">${issues.map((issue) => `<li><button class="issue-button" data-issue-tab="${escapeHtml(issue.tab)}" data-issue-field="${escapeHtml(issue.field ?? '')}" type="button">${escapeHtml(issue.message)}</button></li>`).join('')}</ul>`
			: '<div class="check-complete">字段、图片与隐私检查均已通过，可以正式发布。</div>'}
		${renderContentQualityPanel(qualityWarnings)}
	</aside></div>`;
};

// 预览内的画廊交互：与正式页面同一套切换逻辑（缩略图、上一张／下一张、灯箱）。
const previewGallerySelect = (gallery, index) => {
	const items = JSON.parse(gallery.dataset.galleryItems ?? '[]');
	if (!items.length) return;
	const active = ((index % items.length) + items.length) % items.length;
	gallery.dataset.galleryIndex = String(active);
	const item = items[active];
	const counterText = `第 ${active + 1} 张，共 ${items.length} 张`;
	const mainImage = gallery.querySelector('[data-gallery-main]');
	if (mainImage) { mainImage.src = item.src; mainImage.alt = item.description; }
	const openButton = gallery.querySelector('[data-gallery-open]');
	openButton?.setAttribute('aria-label', `放大查看：${item.description}`);
	const caption = gallery.querySelector('[data-gallery-caption]');
	if (caption) caption.textContent = item.description;
	const role = gallery.querySelector('[data-gallery-role]');
	if (role) role.textContent = item.role;
	const counter = gallery.querySelector('[data-gallery-counter]');
	if (counter) counter.textContent = counterText;
	const lightboxImage = gallery.querySelector('[data-lightbox-main]');
	if (lightboxImage) { lightboxImage.src = item.src; lightboxImage.alt = item.description; }
	const lightboxCaption = gallery.querySelector('[data-lightbox-caption]');
	if (lightboxCaption) lightboxCaption.textContent = item.description;
	const lightboxRole = gallery.querySelector('[data-lightbox-role]');
	if (lightboxRole) lightboxRole.textContent = item.role;
	const lightboxCounter = gallery.querySelector('[data-lightbox-counter]');
	if (lightboxCounter) lightboxCounter.textContent = counterText;
	gallery.querySelectorAll('[data-gallery-thumbnail]').forEach((button, thumbnailIndex) =>
		button.setAttribute('aria-current', String(thumbnailIndex === active)));
};

// 预览区域的事件：设备切换、信件阅读方式、画廊灯箱和引用复制，不影响编辑器其他功能。
elements.editorSurface.addEventListener('click', async (event) => {
	const viewportButton = event.target.closest('[data-preview-viewport]');
	if (viewportButton) {
		const shell = viewportButton.closest('.preview-main')?.querySelector('[data-preview-viewport-shell]');
		const isMobile = viewportButton.dataset.previewViewport === 'mobile';
		shell?.classList.toggle('is-mobile', isMobile);
		shell?.classList.toggle('is-desktop', !isMobile);
		viewportButton.parentElement?.querySelectorAll('[data-preview-viewport]').forEach((button) =>
			button.setAttribute('aria-pressed', String(button === viewportButton)));
		return;
	}
	const letterButton = event.target.closest('[data-letter-mode-select]');
	if (letterButton) {
		const reader = letterButton.closest('[data-letter-reader]');
		if (!reader) return;
		reader.dataset.letterMode = letterButton.dataset.letterModeSelect ?? 'text';
		reader.querySelectorAll('[data-letter-mode-select]').forEach((button) =>
			button.setAttribute('aria-pressed', String(button === letterButton)));
		return;
	}
	const galleryAction = event.target.closest('[data-gallery-thumbnail], [data-gallery-open], [data-gallery-close], [data-gallery-previous-inline], [data-gallery-next-inline], [data-gallery-previous], [data-gallery-next]');
	if (galleryAction) {
		const gallery = galleryAction.closest('[data-record-gallery]');
		if (!gallery) return;
		const current = Number(gallery.dataset.galleryIndex ?? '0');
		if (galleryAction.hasAttribute('data-gallery-thumbnail')) {
			previewGallerySelect(gallery, (Number(galleryAction.dataset.galleryIndex) || 1) - 1);
		} else if (galleryAction.hasAttribute('data-gallery-previous-inline') || galleryAction.hasAttribute('data-gallery-previous')) {
			previewGallerySelect(gallery, current - 1);
		} else if (galleryAction.hasAttribute('data-gallery-next-inline') || galleryAction.hasAttribute('data-gallery-next')) {
			previewGallerySelect(gallery, current + 1);
		} else if (galleryAction.hasAttribute('data-gallery-open')) {
			gallery.querySelector('[data-gallery-lightbox]')?.showModal();
		} else if (galleryAction.hasAttribute('data-gallery-close')) {
			gallery.querySelector('[data-gallery-lightbox]')?.close();
		}
		return;
	}
	const copyButton = event.target.closest('[data-copy-record-link], [data-copy-record-citation]');
	if (copyButton) {
		const citation = copyButton.closest('[data-record-citation]');
		const feedback = citation?.querySelector('[data-citation-feedback]');
		const link = citation?.dataset.recordUrl ?? '';
		const isLinkCopy = copyButton.hasAttribute('data-copy-record-link');
		const accessDate = new Intl.DateTimeFormat('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' }).format(new Date());
		const text = isLinkCopy ? link
			: `《${citation?.dataset.recordTitle ?? ''}》（${citation?.dataset.recordIdentifier ?? ''}），老旧默片，${link}，访问日期：${accessDate}。`;
		try {
			await navigator.clipboard.writeText(text);
			if (feedback) feedback.textContent = isLinkCopy ? '页面链接已复制（预览地址，正式发布后生效）。' : '规范引用已复制。';
		} catch {
			if (feedback) feedback.textContent = '复制失败，请手工选择上方引用信息。';
		}
	}
});

// 记录编辑器内所有折叠区（<details>）当前的展开状态。
// 仅在同标签页内重新渲染时使用，避免切到其他标签页后把旧展开状态误恢复。
const captureEditorDetailsOpenState = () => [...elements.editorSurface.querySelectorAll('details')].map((details) => details.open);
const restoreEditorDetailsOpenState = (previousOpen) => {
	elements.editorSurface.querySelectorAll('details').forEach((details, index) => {
		if (previousOpen[index]) details.setAttribute('open', '');
	});
};

function renderEditor() {
	if (state.workspaceMode !== 'records') {
		renderWorkspaceCenter();
		return;
	}
	if (state.recordViewMode === 'overview') {
		elements.editorSurface.innerHTML = renderRecordOverview(state.current);
		elements.editorSurface.dataset.renderedTab = 'overview';
		return;
	}
	if (!state.current) {
		elements.editorSurface.innerHTML = '<div class="empty-state">点击“新建藏品”开始建立草稿。</div>';
		refreshAdministrativeRegionOptions();
		return;
	}
	updateTabCompletionBadges();
	const previousTab = elements.editorSurface.dataset.renderedTab ?? '';
	const preserveDetailsOpen = previousTab === state.activeTab;
	const previousDetailsOpen = preserveDetailsOpen ? captureEditorDetailsOpenState() : [];
	if (isWithdrawn()) {
		const reason = state.current._admin?.withdrawalReason;
		const restoreMessage = state.current._admin?.canRestoreWithdrawn
			? '如需重新维护，请使用右上角“恢复为草稿”，重新完成检查后才能发布。'
			: state.current._admin?.restoreWithdrawnReason || '这条记录继续作为只读追溯记录保留。';
		elements.editorSurface.innerHTML = `<div class="withdrawn-record-notice"><strong>这是一条已撤销的只读档案</strong>
			<span>${reason ? `撤销原因：${escapeHtml(reason)}。` : ''}${escapeHtml(restoreMessage)}</span></div>${state.activeTab === 'images' ? renderWithdrawnImages() : renderBasic()}`;
		elements.editorSurface.querySelectorAll('input, textarea, select').forEach((control) => { control.disabled = true; });
		elements.editorSurface.dataset.renderedTab = state.activeTab;
		restoreEditorDetailsOpenState(previousDetailsOpen);
		refreshAdministrativeRegionOptions();
		return;
	}
	if (state.activeTab === 'images') elements.editorSurface.innerHTML = renderImages();
	else if (state.activeTab === 'specific') elements.editorSurface.innerHTML = renderSpecific();
	else if (state.activeTab === 'preview') elements.editorSurface.innerHTML = renderPreview();
	else if (state.activeTab === 'privacy') elements.editorSurface.innerHTML = renderPrivacy();
	else elements.editorSurface.innerHTML = renderBasic();
	elements.editorSurface.dataset.renderedTab = state.activeTab;
	restoreEditorDetailsOpenState(previousDetailsOpen);
	refreshAdministrativeRegionOptions();
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

// 日期字段（data-mask="date"）的实时格式化：把任何非数字字符过滤掉，
// 按 4/2/2 自动加 -，让用户输完 4 位年份自动跳到月份、输满月份 2 位自动跳到日。
// 不依赖浏览器原生 <input type="date"> 的自动跳段行为（部分浏览器不支持）。
const formatDateMaskInput = (input) => {
	if (input?.dataset?.mask !== 'date') return;
	const oldValue = input.value;
	const oldCursorStart = input.selectionStart ?? oldValue.length;
	const digits = oldValue.replace(/\D/g, '').slice(0, 8);
	let formatted;
	if (digits.length <= 4) formatted = digits;
	else if (digits.length <= 6) formatted = `${digits.slice(0, 4)}-${digits.slice(4)}`;
	else formatted = `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6)}`;
	if (oldValue === formatted) return;
	const digitsBeforeCursor = oldValue.slice(0, oldCursorStart).replace(/\D/g, '').length;
	let newCursor = digitsBeforeCursor;
	if (digitsBeforeCursor > 4) newCursor += 1;
	if (digitsBeforeCursor > 6) newCursor += 1;
	input.value = formatted;
	try {
		input.setSelectionRange(newCursor, newCursor);
	} catch (_error) {
		// 某些浏览器/场景下 setSelectionRange 不可用，忽略即可
	}
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

const handleAdministrativeRegionCommit = (control) => {
	const fieldCode = control.dataset.field;
	if (!administrativeRegionListIds[fieldCode]) return false;
	const previousValue = control.dataset.initialValue ?? '';
	handleFieldChange(control);
	const value = state.current.core[fieldCode] ?? '';
	if (value === previousValue) {
		refreshAdministrativeRegionOptions();
		return true;
	}

	let changedChildren = false;
	let nextField = fieldCode === 'province' ? 'city' : 'district';
	if (fieldCode === 'province') {
		const provinceEntry = currentAdministrativeProvince();
		if (provinceEntry) {
			const allowedCities = administrativeCitiesForProvince(provinceEntry);
			if (municipalityNames.has(provinceEntry.province)) {
				if (state.current.core.city !== provinceEntry.province) {
					state.current.core.city = provinceEntry.province;
					changedChildren = true;
				}
				nextField = 'district';
			} else if (state.current.core.city && !allowedCities.includes(state.current.core.city)) {
				delete state.current.core.city;
				delete state.current.core.district;
				changedChildren = true;
			}
			const allowedDistricts = administrativeDistrictsForSelection(provinceEntry, state.current.core.city ?? '');
			if (state.current.core.district && allowedDistricts.length && !allowedDistricts.includes(state.current.core.district)) {
				delete state.current.core.district;
				changedChildren = true;
			}
		}
	} else if (fieldCode === 'city') {
		const provinceEntry = currentAdministrativeProvince();
		const allowedDistricts = administrativeDistrictsForSelection(provinceEntry, value);
		if (state.current.core.district && allowedDistricts.length && !allowedDistricts.includes(state.current.core.district)) {
			delete state.current.core.district;
			changedChildren = true;
		}
	}

	if (changedChildren) {
		updateDerivedCollectionCode();
		updateCollectionCodeDisplays();
		state.validationIssues = [];
	}
	renderEditor();
	requestAnimationFrame(() => elements.editorSurface
		.querySelector(`.administrative-region-control[data-field="${nextField}"]`)?.focus());
	if (changedChildren) showToast('已根据上级行政区更新后续选项，原有的不匹配值已清空。');
	return true;
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

const stageImageUpload = async (image, operation, position, total) => {
	throwIfOperationCancelled(operation);
	updateCancellableOperation(
		operation,
		`正在上传图片 ${position} / ${total}…`,
		`${image.file.name} · 图片按原始二进制传输，不再转成超大文本`,
	);
	const response = await fetch('/api/stage-image', {
		method: 'POST',
		headers: {
			'Content-Type': image.file.type,
			'X-LJM-Admin-Request': '1',
			'X-LJM-Operation-Id': operation.id,
			'X-LJM-File-Name': encodeURIComponent(image.file.name),
			'X-LJM-File-Sha256': image.sha256,
		},
		body: image.file,
		signal: operation.controller.signal,
	});
	const data = await readApiJson(response);
	if (!response.ok) {
		const error = new Error(data.error ?? `图片上传失败：${image.file.name}`);
		error.cancelled = Boolean(data.cancelled);
		throw error;
	}
	return {
		kind: 'staged', uploadToken: data.upload.token, originalName: image.file.name,
	};
};

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

const saveDraft = async ({ reload = true, silent = false, operation = null } = {}) => {
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
	const ownsOperation = !operation;
	const currentOperation = operation ?? beginCancellableOperation(
		'save-draft', '正在保存草稿…', '图片只会进入私有待入站区；可以随时取消',
	);
	try {
		throwIfOperationCancelled(currentOperation);
		const imageDescriptions = state.images.map((image) => image.description?.trim() ?? '');
		if (imageDescriptions.some(Boolean)) state.current.public_view.image_descriptions = imageDescriptions;
		else delete state.current.public_view.image_descriptions;
		const images = [];
		const newImages = state.images.filter((image) => image.kind !== 'existing');
		let uploadIndex = 0;
		for (const image of state.images) {
			if (image.kind === 'existing') images.push({ kind: 'existing', filename: image.filename });
			else {
				uploadIndex += 1;
				if (!image.sha256) image.sha256 = await fileSha256(image.file);
				images.push(await stageImageUpload(image, currentOperation, uploadIndex, newImages.length));
			}
		}
		throwIfOperationCancelled(currentOperation);
		updateCancellableOperation(currentOperation, '正在写入草稿…', '正在核对编号和隐私规则，原表单内容会一直保留');
		const data = await apiPost('/api/save-draft', {
			record: state.current, images, isNew: state.isNew,
			confirmedPublicationCopies: state.confirmedPublicationCopies,
			removedImages: state.pendingRemovedImages.map((image) => image.filename),
			removedImageDescriptions: Object.fromEntries(state.pendingRemovedImages
				.filter((image) => image.description?.trim())
				.map((image) => [image.filename, image.description.trim()])),
		}, { operation: currentOperation });
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
			previewUrl: `/api/image/${encodeURIComponent(data.draft.record.core.item_id)}/${encodeURIComponent(filename)}?variant=preview`,
			description: data.draft.removed_image_descriptions?.[filename] ?? '',
		}));
		state.imagePreflight = [];
		if (reload) {
			updateCancellableOperation(currentOperation, '草稿已保存，正在刷新…', '正在重新读取轻量档案列表');
			await loadBootstrap(state.activeId, { operation: currentOperation });
		}
		else updateHeader();
		if (!silent) showToast(wasNewRecord
			? `草稿已保存，永久编号 ${assignedItemId} 已生成。`
			: `草稿已保存，永久编号 ${assignedItemId} 保持不变。`);
		return data.draft;
	} finally {
		if (ownsOperation) finishCancellableOperation(currentOperation);
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
	let operation;
	try {
		operation = beginCancellableOperation('publish', '正在保存并提交档案…', '先保存草稿，再执行发布检查；可以安全取消');
		await saveDraft({ reload: false, silent: true, operation });
		throwIfOperationCancelled(operation);
		updateCancellableOperation(operation, '正在检查并构建网站…', '取消时会停止构建，并恢复到提交前的公开状态');
		const result = await apiPost('/api/publish', { itemId: state.current.core.item_id, confirmations }, { operation });
		setBusy(true, '发布已完成，正在刷新…', '公开版本已经安全切换，请稍候');
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
		showToast(isOperationCancellation(error, operation) ? '操作已取消，填写内容仍保留在当前页面。' : error.message,
			!isOperationCancellation(error, operation));
	} finally {
		if (operation) finishCancellableOperation(operation);
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

let standardsRequestPromise = null;
const loadAdminStandards = async (signal) => {
	if (state.standards) return state.standards;
	if (!standardsRequestPromise) {
		standardsRequestPromise = (async () => {
			const response = await fetch('/api/admin-standards', { signal });
			const data = await readApiJson(response);
			if (!response.ok) throw new Error(data.error ?? '无法读取档案填写标准。');
			return data;
		})();
	}
	try {
		return await standardsRequestPromise;
	} catch (error) {
		standardsRequestPromise = null;
		throw error;
	}
};

const loadBootstrap = async (selectedId = state.activeId, options = {}) => {
	const signal = options.operation?.controller.signal;
	const [response, separatelyLoadedStandards] = await Promise.all([
		fetch('/api/bootstrap?format=split-v1', { ...(signal ? { signal } : {}) }),
		loadAdminStandards(signal).catch(() => null),
	]);
	const data = await readApiJson(response);
	if (!response.ok) throw new Error(data.error ?? '无法读取档案。');
	const standards = separatelyLoadedStandards ?? data.standards;
	if (!standards?.commonFields?.fields || !standards?.codeDictionary?.entries) {
		throw new Error('档案填写标准没有完整加载，请刷新页面后重试。');
	}
	refreshInboxPendingBadge();
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
	state.standards = standards;
	state.commonFields = new Map(standards.commonFields.fields.map((field) => [field.field_code, field]));
	state.dictionary = new Map();
	for (const entry of standards.codeDictionary.entries) {
		if (!state.dictionary.has(entry.dictionary_key)) state.dictionary.set(entry.dictionary_key, []);
		state.dictionary.get(entry.dictionary_key).push(entry);
	}
	pvCodeIndex = null;
	refreshAdministrativeRegionOptions();
	elements.previewLink.href = publicPreviewUrl('/');
	renderRecordList();
	renderWorkspaceNavigation();
	const visibleRecords = sortedRecords(filteredRecords());
	const targetId = selectedId === null || selectedId === undefined
		? null
		: visibleRecords.some((record) => record.core.item_id === selectedId)
			? selectedId
			: null;
	if (targetId) selectRecord(targetId);
	else {
		state.activeId = null;
		state.current = null;
		state.recordViewMode = 'overview';
		updateHeader();
		renderEditor();
	}
};

elements.recordList.addEventListener('click', (event) => {
	const button = event.target.closest('.record-card');
	if (!button) return;
	if (state.dirty && !window.confirm('当前有尚未保存的修改。确定先放弃这些修改并打开另一条记录吗？')) return;
	previewRecord(button.dataset.id);
});

elements.recordSearch.addEventListener('input', (event) => {
	state.search = event.target.value;
	state.recordPage = 1;
	renderRecordList();
});

elements.recordSort.addEventListener('change', (event) => {
	state.recordSort = event.target.value;
	state.recordPage = 1;
	renderRecordList();
});

elements.recordTypeFilter.addEventListener('change', (event) => {
	state.recordTypeFilter = event.target.value;
	state.recordPage = 1;
	renderRecordList();
});

elements.recordDecadeFilter.addEventListener('change', (event) => {
	state.recordDecadeFilter = event.target.value;
	state.recordPage = 1;
	renderRecordList();
});

elements.recordQuickStatusFilter.addEventListener('change', (event) => {
	state.recordQuickStatus = event.target.value;
	state.recordPage = 1;
	renderRecordList();
});

elements.recordPagination.addEventListener('click', (event) => {
	const button = event.target.closest('[data-record-page]');
	if (!button || button.disabled) return;
	const nextPage = Number(button.dataset.recordPage);
	if (!Number.isInteger(nextPage) || nextPage < 1) return;
	state.recordPage = nextPage;
	renderRecordList();
});

elements.newRecordButton.addEventListener('click', () => {
	if (state.dirty && !window.confirm('当前有尚未保存的修改。确定先放弃这些修改并新建藏品吗？')) return;
	startNewRecord();
});

elements.mobileRecordBrowserToggle.addEventListener('click', () => {
	setMobileRecordBrowserOpen(elements.mobileRecordBrowserToggle.getAttribute('aria-expanded') !== 'true');
});

elements.recordsPaneClose.addEventListener('click', () => setMobileRecordBrowserOpen(false));

elements.backToLibraryButton.addEventListener('click', () => {
	if (state.dirty && !window.confirm('当前有尚未保存的修改。确定放弃这些修改并返回档案速览吗？')) return;
	const targetId = state.activeId ?? sortedRecords(filteredRecords())[0]?.core.item_id;
	if (targetId) previewRecord(targetId);
	else {
		state.recordViewMode = 'overview';
		state.current = null;
		renderWorkspaceNavigation();
		updateHeader();
		renderEditor();
	}
	if (window.matchMedia('(max-width: 900px)').matches) setMobileRecordBrowserOpen(true);
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

elements.editorSurface.addEventListener('toggle', (event) => {
	if (state.workspaceMode !== 'query' || !event.target.matches('[data-query-advanced]')) return;
	state.query.advancedOpen = event.target.open;
}, true);

elements.editorSurface.addEventListener('input', (event) => {
	if (event.target?.dataset?.mask === 'date') {
		formatDateMaskInput(event.target);
	}
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
	if (state.workspaceMode === 'query' && control.matches('[data-query-sort]')) {
		state.query.sort = control.value;
		state.query.page = 1;
		renderWorkspaceCenter();
		return;
	}
	if (control.matches('.object-category-control')) {
		handleObjectCategoryChange(control);
		return;
	}
	if (control.matches('.administrative-region-control')) {
		handleAdministrativeRegionCommit(control);
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
	const overviewActionButton = event.target.closest('[data-record-overview-action]');
	if (overviewActionButton) {
		const action = overviewActionButton.dataset.recordOverviewAction;
		if (action === 'new') {
			startNewRecord();
			return;
		}
		if (action === 'restore') {
			await restoreWithdrawnCurrent();
			return;
		}
		if (action === 'preview') {
			enterRecordEditor('preview');
			return;
		}
		if (action === 'task') {
			enterRecordEditor(overviewActionButton.dataset.targetTab || 'basic', overviewActionButton.dataset.targetField || '');
			return;
		}
		enterRecordEditor('basic');
		return;
	}
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
			const targetField = centerButton.dataset.targetField;
			requestAnimationFrame(() => {
				// 指定字段：展开所在折叠区并聚焦；图片标签页没有字段控件时，定位到第一张待补说明的图片。
				const control = targetField
					? elements.editorSurface.querySelector(`[data-field="${CSS.escape(targetField)}"]`)
					: state.activeTab === 'images'
						? [...elements.editorSurface.querySelectorAll('[data-image-description]')]
							.find((textarea) => !textarea.value.trim())
						: null;
				if (!control) return;
				control.closest('details')?.setAttribute('open', '');
				control.scrollIntoView({ behavior: 'smooth', block: 'center' });
				control.focus();
			});
			return;
		}
		if (action === 'maintenance-refresh') {
			await loadIntegrityReport({ notify: true });
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
			control?.closest('details')?.setAttribute('open', '');
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
	catch (error) {
		showToast(isOperationCancellation(error) ? '操作已取消，填写内容仍保留在当前页面。' : error.message,
			!isOperationCancellation(error));
		setBusy(false);
	}
};

elements.saveDraftButton.addEventListener('click', saveDraftWithFeedback);
elements.dockSaveDraftButton.addEventListener('click', saveDraftWithFeedback);
elements.publishButton.addEventListener('click', publishCurrent);
elements.dockPublishButton.addEventListener('click', publishCurrent);
elements.busyCancelButton.addEventListener('click', cancelActiveOperation);
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

const requestedItem = new URLSearchParams(window.location.search).get('item');
loadBootstrap(itemIdPattern.test(requestedItem ?? '') ? requestedItem : undefined).catch((error) => {
	console.error(error);
	elements.recordCount.textContent = '读取失败';
	elements.editorSurface.innerHTML = `<div class="empty-state">${escapeHtml(error.message || '暂时无法读取档案，请刷新页面后重试。')}</div>`;
});
