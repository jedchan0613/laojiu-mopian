import { randomUUID } from 'node:crypto';
import { digest, WriteSafetyError } from './write-coordinator.mjs';

// 人工核对只对明确的草稿与图片字节有效；重启、过期或改动后必须重新核对。
export const createPublicationReviews = ({ readState, readImages, now = Date.now, lifetime = 30 * 60 * 1000 }) => {
  const reviews = new Map();
  const fail = message => { throw new WriteSafetyError(message, 428, 'PUBLICATION_REVIEW_REQUIRED'); };
  const snapshot = async itemId => {
    const state = await readState(itemId);
    if (!state.draft) fail('请先保存草稿，再生成发布检查清单。');
    const images = await readImages(state.draft.record);
    return { ...state, images, imageDigest: digest(images) };
  };
  const prepare = async (itemId, expectedRevision) => {
    const state = await snapshot(itemId);
    if (state.revision !== expectedRevision) fail('草稿版本已变化，请先重新核对当前内容。');
    for (const [id, review] of reviews) if (review.expiresAt <= now()) reviews.delete(id);
    if (reviews.size >= 200) throw new WriteSafetyError('同时等待确认的发布检查过多，请稍后重新生成。', 503);
    const reviewId = randomUUID();
    const review = { itemId, revision: state.revision, imageDigest: state.imageDigest, expiresAt: now() + lifetime };
    reviews.set(reviewId, review);
    return { reviewId, revision: state.revision, imageDigest: state.imageDigest, expiresAt: review.expiresAt };
  };
  const verify = async (payload) => {
    const review = reviews.get(payload.reviewId);
    if (!review || review.itemId !== payload.itemId || review.expiresAt <= now()) fail('请重新生成检查清单，并逐项确认本次图文版本。');
    const current = await snapshot(payload.itemId);
    if (review.revision !== payload.expectedRevision || review.revision !== current.revision || review.imageDigest !== current.imageDigest) {
      reviews.delete(payload.reviewId);
      fail('草稿文字、图片或顺序已变化，原隐私确认失效，请重新逐项检查。');
    }
    return current.images;
  };
  return { prepare, verify, complete: reviewId => reviews.delete(reviewId) };
};
