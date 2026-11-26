import assert from 'node:assert/strict';
import test from 'node:test';
import { letterTranscriptionPages } from '../../site/src/data/letter-transcription-pages.mjs';

const source = '整理说明\r\n\r\n【第1页】\r\n第一段。〔接第2页〕\r\n\r\n【第2页】\r\n第二段。\r\n【第3页】\r\n落款。\r\n';
const descriptions = ['第1信页；书写页', '第2信页；续页', '末页；落款'];

test('按逐幅说明与独立页标对应，保留整理说明、原始换行及全部文字', () => {
  const pages = letterTranscriptionPages(source, descriptions, 3);
  assert.equal(pages.length, 3);
  assert.equal(pages.join(''), source);
  assert.ok(pages[0].includes('〔接第2页〕'));
  assert.ok(pages[1].startsWith('【第2页】'));
});

test('图数不符、说明顺序颠倒、未知页次、漏页或重复标记时保留整封', () => {
  for (const [text, captions, count] of [
    [source, descriptions, 2],
    [source, [descriptions[1], descriptions[0], descriptions[2]], 3],
    [source, ['封面', descriptions[1], descriptions[2]], 3],
    [source, undefined, 3],
    [source.replace('【第2页】', ''), descriptions, 3],
    [source.replace('【第3页】', '【第2页】'), descriptions, 3],
    [source.replace('【第2页】', '正文里提到【第2页】'), descriptions, 3],
  ]) assert.deepEqual(letterTranscriptionPages(text, captions, count), []);
});
