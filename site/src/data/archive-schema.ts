// 本文件定义网站发布层的数据结构。字段名称以
// docs/reference/archive-metadata-standard-v1.xlsx 为依据。

export type OfficialObjectType =
	| 'PHO'
	| 'NEG'
	| 'SLD'
	| 'ALB'
	| 'PCD'
	| 'PST'
	| 'DIA'
	| 'NTB'
	| 'IDC'
	| 'LET'
	| 'RPR'
	| 'OTH';

// card 是网站旧有类型，Excel v1 尚未为它定义正式代码和专属维度。
export type PendingObjectType = 'card';
export type ObjectType = OfficialObjectType | PendingObjectType;

export type RecordStatus = 'ACT' | 'SUS' | 'WDR';
export type PrivacyLevel = 'G' | 'Y' | 'R';
export type EvidenceLevel = 'A' | 'B' | 'C' | 'D';
export type ResearchStatus = 'R0' | 'R1' | 'R2' | 'R3' | 'R4';
export type UseStatus = 'U0' | 'U1' | 'U2' | 'U3' | 'U4';
export type Code = string;
export type DateText = string;

/**
 * 通用档案管理字段。数组对应 Excel 中允许多值的字段。
 * 网站项目只保存发布层所需资料；master_file_path 明确禁止写入网站数据。
 */
export interface ArchiveItemCore {
	record_status: RecordStatus;
	item_id: string;
	/** 由正式对象类型、显示年代和 Excel 打勾维度中的正式属性代码自动生成。 */
	collection_code?: string;
	batch_id?: string;
	accession_date?: DateText;
	object_type: ObjectType;
	item_seq?: number;
	title: string;
	date_display: string;
	date_start?: DateText;
	date_end?: DateText;
	time_notes?: string;
	place_code?: string;
	country?: string;
	province?: string;
	city?: string;
	district?: string;
	street_town?: string;
	specific_place?: string;
	place_notes?: string;
	person_ids?: string[];
	people?: string[];
	people_count?: number;
	relationships?: string[];
	identities?: string[];
	organization_ids?: string[];
	organizations?: string[];
	event_scene?: Code[];
	themes?: Code[];
	photo_function?: Code;
	shot_form?: Code;
	photography_source?: Code;
	studio_photographer?: string[];
	carrier?: Code;
	color?: Code;
	process?: Code;
	width_mm?: number;
	height_mm?: number;
	size_notes?: string;
	verso_types?: Code[];
	verso_transcription?: string;
	mark_types?: Code[];
	mark_transcription?: string;
	acquisition_method?: Code;
	source_name?: string;
	source_date?: DateText;
	source_place?: string;
	provenance_notes?: string;
	collection_id?: string;
	album_id?: string;
	series_id?: string;
	original_position?: string;
	related_item_ids?: string[];
	condition_grade?: Code;
	condition_details?: Code[];
	treatment_notes?: string;
	privacy_level: PrivacyLevel;
	rights_status?: Code;
	research_status: ResearchStatus;
	evidence_level: EvidenceLevel;
	evidence_basis?: string;
	research_notes?: string;
	last_research_date?: DateText;
	digitization_status?: Code;
	scan_date?: DateText;
	scan_ppi?: number;
	master_file_path?: never;
	access_file_path?: string[];
	publication_file_path?: string[];
	transcription_status?: Code;
	backup_status?: Code;
	checksum_sha256?: string;
	filename_notes?: string;
	use_status: UseStatus;
	use_project?: string[];
	publication_reference?: string[];
	physical_location?: string;
	storage_box?: string;
	storage_sleeve?: string;
	record_creator?: string;
	created_date?: DateText;
	updated_date?: DateText;
	next_action?: string;
	review_date?: DateText;
	notes?: string;
	id_check?: string;
	required_check?: string;
}

export interface PhotoMetadata {
	D01?: {
		date_display?: string;
		date_start?: DateText;
		date_end?: DateText;
	};
	D02?: {
		place_code?: string;
		country?: string;
		province?: string;
		city?: string;
		district?: string;
		street_town?: string;
		specific_place?: string;
	};
	D03?: {
		person_ids?: string[];
		people?: string[];
		people_count?: number;
		relationships?: string[];
		identities?: string[];
	};
	D04?: { organization_ids?: string[]; organizations?: string[] };
	D05?: { event_scene?: Code[] };
	D06?: { themes?: Code[] };
	D07?: { photo_function?: Code };
	D08?: { shot_form?: Code };
	D09?: { photography_source?: Code; studio_photographer?: string[] };
	D10?: { carrier?: Code; color?: Code; process?: Code };
	D11?: { width_mm?: number; height_mm?: number; size_notes?: string };
	D12?: { verso_types?: Code[]; verso_transcription?: string };
	D13?: { mark_types?: Code[]; mark_transcription?: string };
	D14?: {
		acquisition_method?: Code;
		source_name?: string;
		source_date?: DateText;
		source_place?: string;
		provenance_notes?: string;
	};
	D15?: {
		batch_id?: string;
		collection_id?: string;
		album_id?: string;
		series_id?: string;
		original_position?: string;
		related_item_ids?: string[];
	};
	D16?: {
		condition_grade?: Code;
		condition_details?: Code[];
		treatment_notes?: string;
	};
	D17?: { privacy_level?: PrivacyLevel };
	D18?: {
		research_status?: ResearchStatus;
		research_notes?: string;
		last_research_date?: DateText;
		next_action?: string;
		review_date?: DateText;
	};
	D19?: { evidence_level?: EvidenceLevel; evidence_basis?: string };
	D20?: {
		digitization_status?: Code;
		transcription_status?: Code;
		backup_status?: Code;
		master_file_path?: never;
		access_file_path?: string[];
		publication_file_path?: string[];
		checksum_sha256?: string;
	};
	D21?: { use_status?: UseStatus; use_project?: string[]; publication_reference?: string[] };
}

export interface PostcardMetadata {
	PC01?: { postcard_type?: Code };
	PC02?: { postcard_function?: Code };
	PC03?: { issue_date?: DateText };
	PC04?: { writing_date?: DateText; writing_date_text?: string };
	PC05?: { dispatch_date?: DateText; transit_dates?: DateText[]; arrival_date?: DateText };
	PC06?: { image_place_code?: string[]; image_place_text?: string[] };
	PC07?: { dispatch_place?: string[]; dispatch_post_office?: string[] };
	PC08?: { destination_place?: string; recipient_address?: string };
	PC09?: { sender_person_id?: string[]; sender_name?: string[]; sender_address?: string[] };
	PC10?: { recipient_person_id?: string[]; recipient_name?: string[]; recipient_title?: string[] };
	PC11?: { correspondence_relationship?: string[]; organizations?: string[] };
	PC12?: { image_subject?: string; themes?: Code[]; event_scene?: Code[] };
	PC13?: { publisher?: string[]; publisher_place?: string[]; publisher_id?: string[] };
	PC14?: { printer?: string[]; manufacturer?: string[]; printer_place?: string[] };
	PC15?: { creator_name?: string[]; creator_role?: string[]; creator_id?: string[] };
	PC16?: { postcard_process?: Code; color?: Code; paper_stock?: string };
	PC17?: {
		postcard_format?: string;
		orientation?: string;
		width_mm?: number;
		height_mm?: number;
	};
	PC18?: {
		stamp_country?: string[];
		stamp_issue?: string[];
		stamp_value?: string[];
		stamp_status?: string[];
	};
	PC19?: { postal_mark_types?: Code[]; postmark_transcription?: string };
	PC20?: { language?: string[]; script?: string[]; message_transcription?: string };
	PC21?: { postcard_use?: Code; postal_route?: string[]; return_reason?: string };
}

export interface DiaryNotebookMetadata {
	DN01?: { notebook_type?: Code };
	DN02?: {
		content_date_start?: DateText;
		content_date_end?: DateText;
	};
	DN03?: { entry_frequency?: string; date_gaps?: string[] };
	DN04?: { creator_person_id?: string[]; creator_name?: string[]; creator_role?: string[] };
	DN05?: { owner_person_ids?: string[]; ownership_sequence?: string[] };
	DN06?: {
		mentioned_person_ids?: string[];
		mentioned_people?: string[];
		relationships?: string[];
	};
	DN07?: { organization_ids?: string[]; organizations?: string[] };
	DN08?: { writing_place?: string[]; mentioned_places?: string[]; place_code?: string[] };
	DN09?: { language?: string[]; script?: string[]; writing_direction?: string[] };
	DN10?: { content_genres?: Code[] };
	DN11?: { themes?: Code[]; local_topics?: string[] };
	DN12?: { event_scene?: Code[]; life_stage?: string[]; event_dates?: DateText[] };
	DN13?: { entry_structure?: Code; section_titles?: string[] };
	DN14?: { binding_type?: string[]; cover_material?: string[]; leaf_structure?: string[] };
	DN15?: { original_pagination?: string; leaf_count?: number; used_pages?: string[] };
	DN16?: { writing_medium?: Code[]; ink_colors?: string[] };
	DN17?: { inserts?: string[]; attachments?: string[]; attachment_item_ids?: string[] };
	DN18?: { annotation_layers?: string[]; hands?: string[]; later_additions?: string[] };
	DN19?: { notebook_completeness?: Code; missing_pages?: string[]; reuse_notes?: string };
	DN20?: { legibility_grade?: string; transcription_status?: Code; transcript_path?: string };
	DN21?: {
		sensitivity_types?: string[];
		privacy_level?: PrivacyLevel;
		restricted_ranges?: string[];
	};
}

export interface CredentialMetadata {
	ID01?: { credential_type?: Code };
	ID02?: { credential_function?: string[] };
	ID03?: { issuing_organization_id?: string[]; issuing_organization?: string[] };
	ID04?: { issuing_place_code?: string; issuing_place?: string };
	ID05?: { issue_date?: DateText; registration_date?: DateText };
	ID06?: { valid_from?: DateText; valid_to?: DateText; validity_text?: string };
	ID07?: { holder_person_id?: string; holder_name?: string; aliases?: string[] };
	ID08?: { document_number_masked?: string; number_type?: string };
	ID09?: { portrait_status?: Code; portrait_item_id?: string; portrait_notes?: string };
	ID10?: {
		birth_date?: DateText;
		sex_text?: string;
		nationality?: string;
		other_attributes?: string[];
	};
	ID11?: { occupation?: string[]; qualification?: string[]; position?: string[] };
	ID12?: { address_masked?: string; household?: string; work_unit?: string };
	ID13?: { affiliation?: string[]; rank?: string[]; class_code?: string[] };
	ID14?: { language?: string[]; script?: string[]; printed_handwritten?: string[] };
	ID15?: {
		credential_format?: string;
		width_mm?: number;
		height_mm?: number;
		page_count?: number;
	};
	ID16?: { carrier?: Code; cover_material?: string[]; color?: Code; process?: Code };
	ID17?: { security_features?: Code[]; serial_pattern?: string };
	ID18?: {
		seal_types?: Code[];
		seal_transcription?: string;
		// 完整签名和指纹不得进入公开网站数据。
		signatures?: never;
		fingerprints?: never;
	};
	ID19?: { endorsements?: string[]; amendments?: string[]; cancellation_marks?: string[] };
	ID20?: { credential_status?: Code; missing_parts?: string[] };
	ID21?: {
		privacy_level?: PrivacyLevel;
		redaction_status?: Code;
		restricted_fields?: string[];
	};
}

/** 访客可见的文字投影，不属于另一套档案元数据。 */
export interface ArchivePublicView {
	description?: string;
	transcription?: string;
	/** 只在发生实质修订时填写，面向访客简要说明改了什么。 */
	revision_note?: string;
	tags: string[];
	place_display?: string;
	place_filters?: string[];
	/** 与 publication_file_path 顺序一致；空项由页面使用中性的正面／背面／细节图说明。 */
	image_descriptions?: string[];
}

interface ArchiveItemBase<TCore extends ArchiveItemCore, TSchema extends string, TDimensions> {
	core: TCore;
	metadata: {
		schema: TSchema;
		dimensions: TDimensions;
	};
	public_view: ArchivePublicView;
}

export type PhotoArchiveItem = ArchiveItemBase<
	ArchiveItemCore & { object_type: 'PHO' | 'NEG' | 'SLD' | 'ALB' },
	'photo',
	PhotoMetadata
>;

export type PostcardArchiveItem = ArchiveItemBase<
	ArchiveItemCore & { object_type: 'PST' | 'PCD' },
	'postcard',
	PostcardMetadata
>;

export type DiaryNotebookArchiveItem = ArchiveItemBase<
	ArchiveItemCore & { object_type: 'DIA' | 'NTB' },
	'diary_notebook',
	DiaryNotebookMetadata
>;

export type CredentialArchiveItem = ArchiveItemBase<
	ArchiveItemCore & { object_type: 'IDC' },
	'credential',
	CredentialMetadata
>;

export type CommonOnlyArchiveItem = ArchiveItemBase<
	ArchiveItemCore & { object_type: 'LET' | 'RPR' | 'OTH' | 'card' },
	'common',
	Record<string, never>
>;

export type ArchiveItem =
	| PhotoArchiveItem
	| PostcardArchiveItem
	| DiaryNotebookArchiveItem
	| CredentialArchiveItem
	| CommonOnlyArchiveItem;
