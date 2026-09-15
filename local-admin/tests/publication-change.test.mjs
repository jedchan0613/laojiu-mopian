// 单元测试：发布前变更对照（更新已发布档案时展示“这次改了哪些字段”）。
// 覆盖：服务端附带正式版本快照、快照随记录打开与新建重置、
// 对照逻辑（基本信息 / 专属资料 / 公开内容 / 发布图片）与预览、隐私页的展示入口。
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const projectRoot = new URL('../../', import.meta.url);

const pvIsPublishedMock = (record) => record?.core?.record_status === 'ACT' && record?.core?.use_status === 'U3'
	&& record?.core?.privacy_level === 'G';

// 从 app.js 中切出“发布前变更对照”整段逻辑，注入 mock 依赖后返回可调用对象。
const loadHelper = async (state, { labels = {}, codes = {} } = {}) => {
	const script = await readFile(new URL('local-admin/public/app.js', projectRoot), 'utf8');
	const sliceStart = script.indexOf('// —— 发布前变更对照');
	const sliceEnd = script.indexOf('const renderPreview = () => {');
	assert.ok(sliceStart >= 0 && sliceEnd > sliceStart, '应能从 app.js 中读取发布前变更对照逻辑');
	const factory = new Function(
		'state', 'pvIsPublished', 'humanFieldLabel', 'pvCodeEntry', 'escapeHtml',
		`${script.slice(sliceStart, sliceEnd)}\n` +
			'return { publicationChangeEntries, renderPublicationChangeReview, sameCompareValue, compareValueText };',
	);
	return factory(
		state,
		pvIsPublishedMock,
		(code) => labels[code] ?? code,
		(code) => codes[code],
		(text) => String(text ?? ''),
	);
};

test('服务端在有草稿修改时附带正式版本快照', async () => {
	const source = await readFile(new URL('local-admin/server.mjs', projectRoot), 'utf8');
	assert.match(source, /officialSnapshot: draft && official \? official : null,/);
});

test('打开记录时保存快照、新建记录时清空快照', async () => {
	const script = await readFile(new URL('local-admin/public/app.js', projectRoot), 'utf8');
	assert.match(script, /state\.officialSnapshot = record\._admin\?\.officialSnapshot\s*\n\s*\? deepClone\(record\._admin\.officialSnapshot\) : null;/);
	assert.match(script, /state\.officialSnapshot = null;\s*\n\s*const reusableCore/);
});

test('对照逻辑：识别基本信息、专属资料、公开内容与图片修改', async () => {
	const state = {
		officialSnapshot: {
			core: {
				record_status: 'ACT', privacy_level: 'G', use_status: 'U3', title: '旧题名',
				date_display: '1930年代', updated_date: '2026-09-01', research_status: 'R1',
				publication_file_path: ['/archive/x/a.jpg', '/archive/x/b.jpg'],
			},
			metadata: { schema: 'postcard', dimensions: { PC01: { postcard_type: 'PT-PHO' } } },
			public_view: {
				description: '旧简介', transcription: '', revision_note: '', tags: [],
				place_display: '静冈县', place_filters: ['静冈县'], image_descriptions: ['正面', '背面'],
			},
		},
		current: {
			core: {
				record_status: 'ACT', privacy_level: 'G', use_status: 'U3', title: '新题名',
				date_display: '1930年代', updated_date: '2026-09-15', research_status: 'R1',
				publication_file_path: ['/archive/x/b.jpg', '/archive/x/a.jpg'],
			},
			metadata: { schema: 'postcard', dimensions: { PC01: { postcard_type: 'PT-GRT' } } },
			public_view: {
				description: '新简介', transcription: '', revision_note: '', tags: ['新年'],
				image_descriptions: ['正面', '新的背面说明'],
			},
		},
		images: [
			{ filename: 'b.jpg', description: '正面' },
			{ filename: 'a.jpg', description: '新的背面说明' },
		],
		standards: { dimensions: { postcard: { dimensions: [{ dimension_code: 'PC01', name: '明信片类型' }] } } },
	};
	const helper = await loadHelper(state, {
		labels: { title: '题名', postcard_type: '明信片类型' },
		codes: { 'PT-PHO': { label: '照相明信片' }, 'PT-GRT': { label: '贺年明信片' } },
	});
	const entries = helper.publicationChangeEntries();
	const codes = entries.map((entry) => `${entry.group}:${entry.code}`);
	assert.ok(codes.includes('basic:title'), '应识别题名修改');
	assert.ok(!codes.some((code) => code.endsWith('updated_date')), '应忽略自动维护的 updated_date');
	assert.ok(!codes.some((code) => code.endsWith('research_status')), '未变化的字段不应出现');
	assert.ok(codes.includes('specific:PC01.postcard_type'), '应识别专属维度字段修改');
	assert.ok(codes.includes('public:description'), '应识别公开简介修改');
	assert.ok(codes.includes('public:tags'), '应识别标签修改');
	assert.ok(!codes.some((code) => code.includes('place_display') || code.includes('place_filters')),
		'不应比较服务器派生的地点显示文字与筛选值');
	assert.ok(codes.includes('images:publication_file_path'), '应识别图片清单顺序调整');
	assert.ok(codes.some((code) => code.startsWith('images:image_descriptions')), '应识别图片说明修改');
	// 条目保存原始值（代码不提前翻译），字段使用中文名称
	const titleEntry = entries.find((entry) => entry.code === 'title');
	assert.equal(titleEntry.label, '题名');
	assert.equal(titleEntry.from, '旧题名');
	assert.equal(titleEntry.to, '新题名');
	const typeEntry = entries.find((entry) => entry.code === 'PC01.postcard_type');
	assert.equal(typeEntry.from, 'PT-PHO');
	assert.equal(typeEntry.to, 'PT-GRT');
	assert.equal(typeEntry.label, '明信片类型');
	// 空值与未填写视为相同
	assert.equal(helper.sameCompareValue('', undefined), true);
	assert.equal(helper.sameCompareValue([], undefined), true);
	assert.equal(helper.sameCompareValue('a', ''), false);
	// 渲染：有修改时输出对照表，代码值翻译为“标签（代码）”
	const markup = helper.renderPublicationChangeReview();
	assert.match(markup, /共修改 \d+ 项/);
	assert.match(markup, /<table class="publication-change-table">/);
	assert.match(markup, /已发布版本/);
	assert.match(markup, /本次修改/);
	assert.match(markup, /照相明信片（PT-PHO）/);
	assert.match(markup, /贺年明信片（PT-GRT）/);
});

test('未发布或无快照时不显示对照；一致时提示没有修改', async () => {
	// 没有快照（首次发布）→ 不渲染
	const noSnapshot = await loadHelper({ officialSnapshot: null, current: { core: {} }, images: [], standards: {} });
	assert.equal(noSnapshot.renderPublicationChangeReview(), '');
	assert.deepEqual(noSnapshot.publicationChangeEntries(), []);
	// 快照不是已发布状态（例如已撤销）→ 不渲染
	const withdrawnOfficial = await loadHelper({
		officialSnapshot: { core: { record_status: 'WDR', use_status: 'U3', privacy_level: 'G' } },
		current: { core: {} }, images: [], standards: {},
	});
	assert.equal(withdrawnOfficial.renderPublicationChangeReview(), '');
	// 已发布且内容一致（仅 updated_date 不同）→ 提示没有修改，不输出表格
	const identical = await loadHelper({
		officialSnapshot: {
			core: {
				record_status: 'ACT', privacy_level: 'G', use_status: 'U3', title: '题名',
				updated_date: '2026-09-01', publication_file_path: ['/archive/x/a.jpg'],
			},
			metadata: { dimensions: {} },
			public_view: { description: '简介', image_descriptions: ['正面'] },
		},
		current: {
			core: {
				record_status: 'ACT', privacy_level: 'G', use_status: 'U3', title: '题名',
				updated_date: '2026-09-15', publication_file_path: ['/archive/x/a.jpg'],
			},
			metadata: { dimensions: {} },
			public_view: { description: '简介', image_descriptions: ['正面'] },
		},
		images: [{ filename: 'a.jpg', description: '正面' }],
		standards: {},
	});
	assert.deepEqual(identical.publicationChangeEntries(), []);
	const markup = identical.renderPublicationChangeReview();
	assert.match(markup, /没有发现修改/);
	assert.doesNotMatch(markup, /<table/);
});

test('预览页与隐私页都提供对照入口', async () => {
	const script = await readFile(new URL('local-admin/public/app.js', projectRoot), 'utf8');
	// 发布前预览：对照区块插在页面顶部
	assert.match(script, /\$\{renderPublicationChangeReview\(\)\}/);
	// 隐私与发布：修改数量摘要 + 跳转预览按钮
	assert.match(script, /相对当前已发布版本修改了 \$\{changeCount\} 项/);
	assert.match(script, /data-issue-tab="preview" type="button">查看发布前预览<\/button>/);
});
