import assert from 'node:assert/strict';
import test from 'node:test';
import { createPublicationReviews } from '../publication-review.mjs';

const fixture = () => {
  const state = { revision: 'a'.repeat(64), draft: { record: {} } };
  let images = [{ filename: 'front.png', sha256: '1'.repeat(64) }, { filename: 'back.png', sha256: '2'.repeat(64) }], time = 0;
  const options = { readState: async () => state, readImages: async () => images, now: () => time, lifetime: 100 };
  return { state, options, reviews: createPublicationReviews(options), images: value => { images = value; }, clock: value => { time = value; } };
};
test('发布确认只绑定当前草稿和实际图片，成功后失效', async () => {
  const f = fixture(), review = await f.reviews.prepare('sample', f.state.revision);
  const payload = { itemId: 'sample', expectedRevision: f.state.revision, reviewId: review.reviewId };
  assert.equal((await f.reviews.verify(payload)).length, 2);
  await assert.rejects(f.reviews.verify({ ...payload, itemId: 'other' }), { code: 'PUBLICATION_REVIEW_REQUIRED' });
  f.reviews.complete(review.reviewId);
  await assert.rejects(f.reviews.verify(payload), { code: 'PUBLICATION_REVIEW_REQUIRED' });
});
for (const scenario of ['文字', '图片字节', '图片顺序', '过期', '重启', '没有草稿']) test(`${scenario}变化后不能沿用旧人工确认`, async () => {
  const f = fixture(), review = await f.reviews.prepare('sample', f.state.revision);
  if (scenario === '文字') f.state.revision = 'b'.repeat(64);
  if (scenario === '图片字节') f.images([{ filename: 'front.png', sha256: '3'.repeat(64) }]);
  if (scenario === '图片顺序') f.images([{ filename: 'back.png', sha256: '2'.repeat(64) }, { filename: 'front.png', sha256: '1'.repeat(64) }]);
  if (scenario === '过期') f.clock(101);
  if (scenario === '没有草稿') f.state.draft = null;
  const reviews = scenario === '重启' ? createPublicationReviews(f.options) : f.reviews;
  await assert.rejects(reviews.verify({ itemId: 'sample', expectedRevision: review.revision, reviewId: review.reviewId }), { code: 'PUBLICATION_REVIEW_REQUIRED' });
});
