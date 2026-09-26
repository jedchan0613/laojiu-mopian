import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const root = new URL('../../', import.meta.url);
const server = (await readFile(new URL('local-admin/server.mjs', root), 'utf8')).replaceAll('\r\n', '\n');
const rules = JSON.parse(await readFile(new URL('site/src/data/standards/collection-code-rules.json', root), 'utf8'));
const dictionary = JSON.parse(await readFile(new URL('site/src/data/standards/code-dictionary.json', root), 'utf8'));
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

// 自动部署先测试程序，后接入服务器正式资料；测试不能读取尚不存在的
// archive.ts，也不能要求真实藏品一直固定为6件。只使用内存中的合成样例。
const createPostcardFixture = () => {
  const record = {
    core: { item_id: 'LJM-20000101-PST-001', object_type: 'PST', date_display: '年代未知' },
    metadata: { schema: 'postcard', dimensions: {} },
    public_view: {},
  };
  const setValue = (dimensionCode, field, value) => {
    const definition = typeof field === 'string' ? { field_code: field } : field;
    if (definition.scope === 'core') record.core[definition.field_code] = value;
    else {
      record.metadata.dimensions[dimensionCode] ??= {};
      record.metadata.dimensions[dimensionCode][definition.field_code] = value;
    }
  };
  for (const dimension of rules.schemas.postcard.required_dimensions) {
    setValue(dimension.dimension_code, dimension.fields[0], ['未知']);
    for (const field of dimension.code_fields) {
      const entry = dictionary.entries.find((candidate) =>
        candidate.enabled && candidate.dictionary_key === field.dictionary_key);
      assert.ok(entry, `测试样例需要正式字典 ${field.dictionary_key}`);
      setValue(dimension.dimension_code, field, [entry.code]);
    }
  }
  record.core.collection_code = evaluateRecord(record).code;
  assert.equal(evaluateRecord(record).complete, true);
  return record;
};

test('明信片缺少PC11或PC18时必须阻止发布；未知文字不编造代码或改动永久编号', () => {
  const original = createPostcardFixture();
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

test('PC18包含邮票图案字段；无真实藏品数据时仍能检查正式代码并拒绝无效值', () => {
  assert.ok(rules.schemas.postcard.required_dimensions.find((dimension) =>
    dimension.dimension_code === 'PC18').fields.includes('stamp_issue'));
  const record = createPostcardFixture();
  const original = structuredClone(record);
  record.metadata.dimensions.PC18 = { stamp_issue: ['测试图案'] };
  assert.equal(evaluateRecord(record).complete, true);
  assert.equal(evaluateRecord(record).code, original.core.collection_code);
  record.metadata.dimensions.PC01.postcard_type = ['INVALID-TEST-ONLY'];
  assert.equal(evaluateRecord(record).complete, false);
  assert.ok(evaluateRecord(record).issues.some((issue) =>
    issue.code.startsWith('collection_code_invalid_PC01_postcard_type')));
  assert.equal(record.core.item_id, original.core.item_id);
});
