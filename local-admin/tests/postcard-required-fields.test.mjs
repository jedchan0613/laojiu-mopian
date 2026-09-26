import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const root = new URL('../../', import.meta.url);
const server = (await readFile(new URL('local-admin/server.mjs', root), 'utf8')).replaceAll('\r\n', '\n');
const rules = JSON.parse(await readFile(new URL('site/src/data/standards/collection-code-rules.json', root), 'utf8'));
const dictionary = JSON.parse(await readFile(new URL('site/src/data/standards/code-dictionary.json', root), 'utf8'));
const projection = await readFile(new URL('site/src/data/archive.ts', root), 'utf8');
const records = JSON.parse(projection.slice(projection.indexOf('['), projection.indexOf(' satisfies ArchiveItem')));
const declaration = (name) => {
  const start = server.indexOf(`const ${name} =`);
  assert.notEqual(start, -1, `找不到实际发布规则函数 ${name}`);
  return server.slice(start, server.indexOf('\nconst ', start + 1));
};
// 使用正式发布流程中的实际函数，不以测试专用规则代替服务器检查。
const evaluate = new Function([
  'hasMeaningfulValue', 'normalizeRuleField', 'getRuleFieldValue',
  'toCollectionCodeToken', 'toCollectionTextToken', 'getCollectionCodeResult',
].map(declaration).join('\n') + '\nreturn getCollectionCodeResult;')();
const evaluateRecord = (record) => evaluate(record, rules, dictionary);

test('明信片缺少PC11或PC18时必须阻止发布；未知文字不编造代码或改动永久编号', () => {
  const original = records.find((record) => record.core.item_id === 'LJM-20260808-PST-001');
  assert.ok(original);
  const record = structuredClone(original);
  delete record.metadata.dimensions.PC11;
  delete record.metadata.dimensions.PC18;
  delete record.core.organizations;
  const missing = evaluateRecord(record);
  assert.deepEqual(missing.issues.map((issue) => issue.code).sort(), ['collection_required_PC11', 'collection_required_PC18']);
  record.metadata.dimensions.PC11 = { correspondence_relationship: ['未知'] };
  record.metadata.dimensions.PC18 = { stamp_status: ['未知'] };
  const repaired = evaluateRecord(record);
  assert.equal(repaired.complete, true);
  assert.equal(repaired.code, original.core.collection_code);
  assert.equal(record.core.item_id, original.core.item_id);
  assert.deepEqual(rules.schemas.postcard.required_dimensions.filter((dimension) =>
    ['PC11', 'PC18'].includes(dimension.dimension_code)).map((dimension) => dimension.code_fields), [[], []]);
  delete record.metadata.dimensions.PC11;
  record.core.organizations = ['测试机构'];
  assert.equal(evaluateRecord(record).complete, true, '规范允许关联机构满足PC11，不强制重复填写通信关系');
  delete record.metadata.dimensions.PC18;
  assert.deepEqual(evaluateRecord(record).issues.map((issue) => issue.code), ['collection_required_PC18']);
});

test('现有公开档案必填组与代码有效；补充说明不改变隐私状态和图片目录', () => {
  assert.equal(records.length, 6);
  for (const record of records) {
    assert.equal(evaluateRecord(record).complete, true, record.core.item_id);
    assert.equal(evaluateRecord(record).code, record.core.collection_code);
    assert.equal(record.core.privacy_level, 'G');
    assert.equal(record.core.use_status, 'U3');
    assert.ok(record.public_view.description.trim());
    assert.equal(record.public_view.image_descriptions.length, record.core.publication_file_path.length);
    assert.ok(record.public_view.image_descriptions.every((description) => description.trim()));
    for (const image of record.core.publication_file_path) assert.ok(image.startsWith(`/archive/${record.core.item_id}/`));
  }
});
