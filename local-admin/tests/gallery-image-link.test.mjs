import assert from 'node:assert/strict';
import test from 'node:test';
import { galleryImageIndexFromHash } from '../../site/src/data/gallery-image-link.mjs';

test('整册第1幅、第17幅链接选择对应附件而不是相邻照片', () => {
  assert.equal(galleryImageIndexFromHash('#image-1', 17), 0);
  assert.equal(galleryImageIndexFromHash('#image-17', 17), 16);
});

test('无关锚点、非法和越界图片链接不触发附件切换', () => {
  for (const hash of ['', '#record-metadata', '#image-0', '#image--1', '#image-01', '#image-18', '#image-9999999', '#image-1<script>', '#image-1.5']) {
    assert.equal(galleryImageIndexFromHash(hash, 17), undefined, hash);
  }
  assert.equal(galleryImageIndexFromHash('#image-1', 0), undefined);
});
