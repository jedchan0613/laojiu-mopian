import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const readJson = async (...segments) => JSON.parse(await readFile(path.join(projectRoot, ...segments), 'utf8'));
const readText = (...segments) => readFile(path.join(projectRoot, ...segments), 'utf8');

test('旧卡片具有正式类型、完整维度和收藏品编码规则', async () => {
	const [categories, dimensions, dictionary, rules] = await Promise.all([
		readJson('site', 'src', 'data', 'archive-categories.json'),
		readJson('site', 'src', 'data', 'standards', 'card-dimensions.json'),
		readJson('site', 'src', 'data', 'standards', 'code-dictionary.json'),
		readJson('site', 'src', 'data', 'standards', 'collection-code-rules.json'),
	]);

	const cardCategory = categories.categories.find((category) => category.slug === 'cards');
	assert.deepEqual(cardCategory?.object_types, ['CRD']);
	assert.equal(dimensions.system, 'card');
	assert.deepEqual(dimensions.applies_to, ['CRD']);
	assert.equal(dimensions.dimension_count, 21);
	assert.deepEqual(
		dimensions.dimensions.map((dimension) => dimension.dimension_code),
		Array.from({ length: 21 }, (_, index) => `CD${String(index + 1).padStart(2, '0')}`),
	);

	const enabledCodes = new Set(dictionary.entries.filter((entry) => entry.enabled).map((entry) => entry.code));
	for (const code of ['CRD', 'CT-UNK', 'KF-UNK', 'KS-UNK', 'KT-UNK', 'KC-UNK', 'MT-PLS', 'RD-CLEAR']) {
		assert.ok(enabledCodes.has(code), `代码字典缺少 ${code}`);
	}
	assert.deepEqual(
		rules.schemas.card.required_dimensions.map((dimension) => dimension.dimension_code),
		['CD01', 'CD02', 'CD12', 'CD16', 'CD17', 'CD20'],
	);
});

test('管理端路由并拦截旧卡片敏感字段', async () => {
	const [clientSource, serverSource] = await Promise.all([
		readText('local-admin', 'public', 'app.js'),
		readText('local-admin', 'server.mjs'),
	]);

	assert.match(clientSource, /objectType === 'CRD'\) return 'card'/);
	assert.match(clientSource, /card: '旧卡片专属信息'/);
	assert.match(serverSource, /CRD: 'card'/);
	assert.match(serverSource, /card-dimensions\.json/);
	assert.match(serverSource, /card_redaction_status/);
	assert.match(serverSource, /magnetic_stripe_data/);
	assert.match(serverSource, /公开卡号最多只能保留末四位/);
});
