import type { ArchiveSearchFields } from '../data/archive-view';

// 档案列表搜索：不引入外部分词库。
// 精确匹配优先；对 3 字及以上的中文关键词退化为二元组（bigram）覆盖匹配，
// 允许自然语言长句中间插入个别字（例如“从日本寄出的明信片”命中
// “一张从日本寄出的旧明信片照片”），同时避免短词造成大量误配。

export interface ArchiveSearchMatch {
	score: number;
	matchedFields: Array<keyof ArchiveSearchFields>;
}

// 字段顺序即匹配位置的显示顺序，权重体现“题名比原文更重要”的直觉。
const FIELD_WEIGHTS: Array<[keyof ArchiveSearchFields, number]> = [
	['title', 10],
	['identifiers', 8],
	['tags', 7],
	['place', 6],
	['typeLabel', 5],
	['dateDisplay', 4],
	['description', 3],
	['transcription', 2],
];

export const SEARCH_FIELD_LABELS: Record<keyof ArchiveSearchFields, string> = {
	title: '题名',
	identifiers: '编号',
	tags: '标签',
	place: '地点',
	typeLabel: '类型',
	dateDisplay: '年代',
	description: '简介',
	transcription: '原文',
};

export const normalizeSearchText = (value: string) => value.trim().toLocaleLowerCase('zh-CN');

export const searchTermsFrom = (value: string) =>
	normalizeSearchText(value).split(/\s+/).filter(Boolean);

// CJK 统一表意文字、扩展区与兼容表意文字、日文假名；用于判断是否启用二元组匹配。
const cjkCharacter = /[⺀-鿿豈-﫿぀-ヿ]/;
const cjkRun = /[⺀-鿿豈-﫿぀-ヿ]+/g;

const bigramsOf = (text: string): Set<string> => {
	const result = new Set<string>();
	for (const run of text.matchAll(cjkRun)) {
		const value = run[0];
		for (let index = 0; index + 2 <= value.length; index += 1) {
			result.add(value.slice(index, index + 2));
		}
	}
	return result;
};

const fuzzyCoverage = (term: string, fieldText: string): number => {
	const termBigrams = bigramsOf(term);
	if (termBigrams.size === 0) return 0;
	const fieldBigrams = bigramsOf(fieldText);
	let hit = 0;
	for (const bigram of termBigrams) if (fieldBigrams.has(bigram)) hit += 1;
	return hit / termBigrams.size;
};

// 3 字及以上的中文关键词才启用模糊匹配；2 字词本身就是完整二元组，直接走精确匹配。
const FUZZY_MIN_TERM_LENGTH = 3;
const FUZZY_MIN_COVERAGE = 0.6;
const FUZZY_SCORE_FACTOR = 0.5;

// 每个关键词必须在至少一个字段中命中（精确或模糊），档案才算匹配；
// 总得分为各关键词得分之和，同一关键词在多个字段命中会累计，体现“多处相关”。
export const scoreEntryAgainstFields = (
	terms: string[],
	fields: ArchiveSearchFields,
): ArchiveSearchMatch | null => {
	let score = 0;
	const matchedFields = new Set<keyof ArchiveSearchFields>();
	for (const term of terms) {
		let termScore = 0;
		for (const [field, weight] of FIELD_WEIGHTS) {
			const text = fields[field] ?? '';
			if (!text) continue;
			let fieldScore = 0;
			if (text.includes(term)) {
				fieldScore = weight;
			} else if (term.length >= FUZZY_MIN_TERM_LENGTH && cjkCharacter.test(term)) {
				const coverage = fuzzyCoverage(term, text);
				if (coverage >= FUZZY_MIN_COVERAGE) fieldScore = weight * FUZZY_SCORE_FACTOR * coverage;
			}
			if (fieldScore > 0) {
				termScore += fieldScore;
				matchedFields.add(field);
			}
		}
		if (termScore === 0) return null;
		score += termScore;
	}
	const orderedFields = FIELD_WEIGHTS.map(([field]) => field).filter((field) =>
		matchedFields.has(field),
	);
	return { score, matchedFields: orderedFields };
};
