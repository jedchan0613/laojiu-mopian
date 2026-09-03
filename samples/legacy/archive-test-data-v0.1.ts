// 历史快照：本文件保留升级前的扁平数据结构和 FSA 测试编号（旧规则）。
// 不得把本文件重新接入正式网站；当前规则与新结构见 site/src/data/archive-schema.ts。
// V1.0 允许使用的档案类型。
export type ArchiveType =
	| 'photo'
	| 'postcard'
	| 'letter'
	| 'document'
	| 'card'
	| 'notebook'
	| 'object';

export type PrivacyLevel = 'green' | 'yellow' | 'red';
export type EvidenceLevel = 'known' | 'likely' | 'inference' | 'unknown';
export type ArchiveStatus = 'private' | 'restricted' | 'publishable' | 'published';

// 每件藏品共用的简单数据结构。图片和故事可在以后需要时再补充。
export interface ArchiveItem {
	id: string;
	title: string;
	type: ArchiveType;
	date: string;
	place: string;
	source: string;
	description: string;
	transcription: string;
	tags: string[];
	privacy: PrivacyLevel;
	evidence: EvidenceLevel;
	status: ArchiveStatus;
	images?: string[];
	story?: string;
}

// 从正式网站中移出的八件虚构测试资料，仅供以后测试和参考，不参与正式档案统计。
export const sampleArchiveItems = [
	{
		id: 'FSA-TEST-PHO-001',
		title: '老照相馆门前的合影',
		type: 'photo',
		date: '1986',
		place: '佛山',
		source: '虚构测试资料',
		description: '一张模拟的八十年代城市合影，用于测试老旧默片照片档案的页面展示。',
		transcription: '照片背面无文字。',
		tags: ['佛山', '1980年代', '合影', '照相馆'],
		privacy: 'green',
		evidence: 'known',
		status: 'published',
		images: ['./placeholders/photo-placeholder.svg'],
	},
	{
		id: 'FSA-TEST-PST-002',
		title: '一张寄往佛山的明信片',
		type: 'postcard',
		date: '1992',
		place: '广州 / 佛山',
		source: '虚构测试资料',
		description: '一张模拟九十年代明信片，用于测试正反面材料、文字转录和档案描述。',
		transcription: '这是完全虚构的测试文字，不对应任何真实人物或地址。',
		tags: ['明信片', '广州', '佛山', '1990年代'],
		privacy: 'green',
		evidence: 'known',
		status: 'published',
		images: ['./placeholders/postcard-placeholder.svg'],
	},
	{
		id: 'FSA-TEST-CARD-003',
		title: '九十年代的商店会员卡',
		type: 'card',
		date: '1998',
		place: '佛山',
		source: '虚构测试资料',
		description: '一张模拟的旧卡片，用于测试老信用卡、会员卡和其他卡片类型的档案展示方式。',
		transcription: '卡片内容为虚构测试信息。',
		tags: ['卡片', '商业', '佛山', '1990年代'],
		privacy: 'green',
		evidence: 'inference',
		status: 'published',
		images: ['./placeholders/card-placeholder.svg'],
	},
	{
		id: 'FSA-TEST-LTR-004',
		title: '一封关于近况的旧信',
		type: 'letter',
		date: '1975',
		place: '广州',
		source: '虚构测试资料',
		description: '一封模拟的七十年代私人信件，用于测试信件类型、年代和地点筛选。',
		transcription: '近来一切平静，街边的木棉已经开了。愿你安好。以上为完全虚构的测试文字。',
		tags: ['信件', '广州', '1970年代', '日常生活'],
		privacy: 'green',
		evidence: 'known',
		status: 'published',
		images: ['./placeholders/letter-placeholder.svg'],
	},
	{
		id: 'FSA-TEST-DOC-005',
		title: '一页八十年代的学习证明',
		type: 'document',
		date: '1983',
		place: '佛山',
		source: '虚构测试资料',
		description: '一份模拟的八十年代学习证明，用于测试老证件与纸本文书的档案展示。',
		transcription: '本页仅用于测试文书版式，不含真实姓名、编号、学校或单位资料。',
		tags: ['证件', '学习', '佛山', '1980年代'],
		privacy: 'green',
		evidence: 'likely',
		status: 'published',
		images: ['./placeholders/document-placeholder.svg'],
	},
	{
		id: 'FSA-TEST-NBK-006',
		title: '记录日常开支的旧笔记本',
		type: 'notebook',
		date: '1991',
		place: '顺德',
		source: '虚构测试资料',
		description: '一本模拟的九十年代日常笔记本，用于测试笔记、地点和标签信息。',
		transcription: '三月：纸张、墨水与车票。以上为完全虚构的测试记录。',
		tags: ['笔记本', '顺德', '1990年代', '日常记录'],
		privacy: 'green',
		evidence: 'inference',
		status: 'published',
		images: ['./placeholders/notebook-placeholder.svg'],
	},
	{
		id: 'FSA-TEST-PHO-007',
		title: '河堤旁的春日合影',
		type: 'photo',
		date: '1968',
		place: '南海',
		source: '虚构测试资料',
		description: '一张模拟的六十年代户外合影，用于测试更早年代的照片档案。',
		transcription: '照片背面写有“春日留影”。文字为完全虚构的测试内容。',
		tags: ['照片', '南海', '1960年代', '合影'],
		privacy: 'green',
		evidence: 'likely',
		status: 'published',
		images: ['./placeholders/photo-placeholder.svg'],
	},
	{
		id: 'FSA-TEST-PST-008',
		title: '新世纪初的城市明信片',
		type: 'postcard',
		date: '2001',
		place: '佛山',
		source: '虚构测试资料',
		description: '一张模拟的新世纪初城市明信片，用于测试二〇〇〇年代的档案记录。',
		transcription: '愿这座城的风景被好好记住。此内容为完全虚构的测试文字。',
		tags: ['明信片', '佛山', '2000年代', '城市'],
		privacy: 'green',
		evidence: 'known',
		status: 'published',
		images: ['./placeholders/postcard-placeholder.svg'],
	},
] satisfies ArchiveItem[];
