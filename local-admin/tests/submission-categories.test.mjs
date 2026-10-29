import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { submissionCategories, legacySubmissionCategories, isSubmissionCategory, restoreSubmissionCategory } from '../../shared/submission-categories.mjs';
import { getArchiveCategoryOptions, sortDictionaryEntries } from '../../shared/archive-reference.mjs';

const categories = JSON.parse(await readFile(new URL('../../site/src/data/archive-categories.json', import.meta.url), 'utf8')).categories;
const dictionary = JSON.parse(await readFile(new URL('../../site/src/data/standards/code-dictionary.json', import.meta.url), 'utf8'));

test('投稿菜单按同一七类来源生成；旧分类可读取但不混入新稿菜单', () => {
  assert.deepEqual(submissionCategories, categories.map(category => category.label));
  for (const label of [...submissionCategories, ...legacySubmissionCategories]) assert.equal(isSubmissionCategory(label), true, label);
  assert.equal(isSubmissionCategory('任意新分类'), false);
  assert.equal(isSubmissionCategory(null), false);
  assert.equal(submissionCategories.includes('证件与卡片'), false);
  assert.equal(isSubmissionCategory('证件与卡片'), true);
});

test('旧投稿重开保留“证件与卡片”原值，切换新分类后不会残留旧选项', () => {
  const select = { options: [{ value: '', dataset: {} }, ...submissionCategories.map(value => ({ value, dataset: {} }))], value: '',
    ownerDocument: { createElement: () => ({ value: '', textContent: '', dataset: {} }) },
    append(option) { option.remove = () => this.options.splice(this.options.indexOf(option), 1); this.options.push(option); },
  };
  restoreSubmissionCategory(select, '证件与卡片');
  assert.equal(select.value, '证件与卡片');
  assert.equal(select.options.at(-1).value, '证件与卡片');
  assert.equal(select.options.at(-1).textContent, '证件与卡片');
  restoreSubmissionCategory(select, '证件与卡片');
  assert.equal(select.options.filter(option => option.value === '证件与卡片').length, 1);
  restoreSubmissionCategory(select, '旧卡片');
  assert.equal(select.value, '旧卡片');
  assert.equal(select.options.some(option => option.value === '证件与卡片'), false);
});

test('审核转草稿直接采用当前类型字典和分类顺序，包含正式卡片类型', async () => {
  const source = await readFile(new URL('../public/submissions.js', import.meta.url), 'utf8');
  const helper = source.slice(source.indexOf('const draftTypeOptions ='), source.indexOf('function renderDetail'));
  const options = new Function('standards', 'esc', 'getArchiveCategoryOptions', 'sortDictionaryEntries', `${helper}; return draftTypeOptions();`)({ archiveCategories: { categories }, codeDictionary: dictionary }, String, getArchiveCategoryOptions, sortDictionaryEntries);
  const expected = categories.flatMap(category => category.object_types);
  const values = [...options.matchAll(/<option value="([^"]+)"/g)].map(match => match[1]);
  assert.deepEqual(values, expected);
  assert.equal(values.filter(value => value === 'CRD').length, 1);
  assert.match(options, /商业与服务卡片（CRD）/);
  assert.deepEqual([...options.matchAll(/<optgroup label="([^"]+)"/g)].map(match => match[1]), submissionCategories);
});

test('实际审核详情中的正式类型菜单完整接入当前参照，移除过时卡片说明', async () => {
  const source = await readFile(new URL('../public/submissions.js', import.meta.url), 'utf8');
  const renderCode = source.slice(source.indexOf('const draftTypeOptions ='), source.indexOf('async function select'));
  const detail = { innerHTML: '', querySelectorAll: () => [] };
  const $ = selector => selector === '#review-detail' ? detail : { addEventListener() {} };
  const render = new Function('standards', 'esc', 'getArchiveCategoryOptions', 'sortDictionaryEntries', 'badge', 'date', 'states', 'checks', '$', 'historyLabels', 'saveReview', 'saveRequestReview', 'transfer',
    `${renderCode}; return renderDetail;`)(
    { archiveCategories: { categories }, codeDictionary: dictionary }, String, getArchiveCategoryOptions, sortDictionaryEntries,
    () => '', () => 'synthetic date', { approved: '初审通过' }, [], $, {}, () => {}, () => {}, () => {},
  );
  render({ id: 'TG-SYNTHETIC', status: 'approved', fields: { title: '合成投稿', category: '旧卡片', contact_type: 'email' }, consent: {}, images: [], history: [] });
  const menu = detail.innerHTML.match(/<select id="draft-type"[^>]*>([\s\S]*?)<\/select>/)?.[1];
  assert.ok(menu, '审核详情必须实际输出正式类型菜单');
  assert.deepEqual([...menu.matchAll(/<option value="([^"]+)"/g)].map(match => match[1]), categories.flatMap(category => category.object_types));
  assert.match(menu, /商业与服务卡片（CRD）/);
  assert.equal(detail.innerHTML.includes('卡片尚无正式专属类型'), false);
});
