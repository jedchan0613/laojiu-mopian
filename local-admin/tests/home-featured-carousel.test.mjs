import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { stripTypeScriptTypes } from 'node:module';
import test from 'node:test';
import { Script } from 'node:vm';

const source = await readFile(new URL('../../site/src/scripts/home-featured-carousel.ts', import.meta.url), 'utf8');
// 直接执行真实轮播源码；不读取档案、生成网站，也不加载浏览器或翻译依赖。
const script = new Script(stripTypeScriptTypes(source), { filename: 'home-featured-carousel.ts' });
const languages = [
  { locale: 'zh-CN', prefix: '', view: '查看精选档案：{0}', like: '为“{0}”点赞', announcement: '已显示第 {0} 张精选图片：{1}' },
  { locale: 'en', prefix: '/en', view: 'View featured record: {0}', like: 'Like “{0}”', announcement: 'Featured image {0}: {1}' },
  { locale: 'th', prefix: '/th', view: 'ดูรายการเด่น: {0}', like: 'ถูกใจ “{0}”', announcement: 'ภาพเด่น {0}: {1}' },
  { locale: 'ja', prefix: '/ja', view: '注目の資料を見る：{0}', like: '「{0}」にいいね', announcement: '注目の画像 {0}：{1}' },
  { locale: 'ko', prefix: '/ko', view: '추천 자료 보기: {0}', like: '“{0}” 좋아요', announcement: '추천 이미지 {0}: {1}' },
  { locale: 'zh-Hant', prefix: '/zh-hant', view: '查看精選檔案：{0}', like: '為「{0}」按讚', announcement: '已顯示第 {0} 張精選圖片：{1}' },
];
const fill = (template, ...values) => template.replace(/\{(\d+)\}/g, (_, index) => String(values[index]));

function createCarousel({ language = languages[0], withAnimate = true, reducedMotion = false, rawItems, count = 3, missingSelector } = {}) {
  const document = { documentElement: { lang: language.locale }, activeElement: null };
  class Element {
    dataset = {};
    attributes = new Map();
    listeners = new Map();
    dispatchedEvents = [];
    textContent = '';
    removed = false;
    addEventListener(type, listener) {
      const listeners = this.listeners.get(type) ?? [];
      listeners.push(listener);
      this.listeners.set(type, listeners);
    }
    setAttribute(name, value) { this.attributes.set(name, String(value)); }
    getAttribute(name) { return this.attributes.get(name) ?? null; }
    removeAttribute(name) { this.attributes.delete(name); delete this[name]; }
    remove() { this.removed = true; }
    focus() { document.activeElement = this; }
    dispatch(type, properties = {}) {
      const event = { type, defaultPrevented: false, preventDefault() { this.defaultPrevented = true; }, ...properties };
      for (const listener of this.listeners.get(type) ?? []) listener(event);
      return event;
    }
    dispatchEvent(event) { this.dispatchedEvents.push(event); return true; }
  }

  const items = Array.from({ length: count }, (_, index) => ({
    src: `/archive/TEST-${index}/front-public.jpg`,
    srcset: index === 1 ? '' : `/archive-responsive/TEST-${index}/front-640.jpg 640w`,
    width: 640 + index, height: 480 + index,
    description: `${language.locale} image ${index + 1}`,
    itemId: `TEST-${index}`, title: `${language.locale} title ${index + 1}`,
    dateDisplay: `190${index}`, recordInfo: `${language.locale} record ${index + 1}`,
    href: `${language.prefix}/archive/TEST-${index}/?from=home#images`,
  }));
  const image = new Element(), link = new Element(), date = new Element(), title = new Element(), info = new Element();
  const like = new Element(), previous = new Element(), next = new Element(), dotsContainer = new Element();
  const announcement = new Element(), controls = new Element(), carousel = new Element();
  const dots = items.map(() => new Element());
  const animationCalls = [];
  image.sizes = '(max-width: 760px) 100vw, 640px';
  if (withAnimate) image.animate = (...args) => animationCalls.push(args);
  title.textContent = items[0]?.title ?? 'Initial record';
  link.setAttribute('aria-label', fill(language.view, title.textContent));
  carousel.dataset = {
    carouselItems: rawItems ?? JSON.stringify(items),
    carouselViewLabel: language.view,
    carouselLikeLabel: language.like,
    carouselAnnouncementLabel: language.announcement,
  };
  dotsContainer.querySelectorAll = (selector) => {
    assert.equal(selector, '[data-home-carousel-dot]');
    return dots;
  };
  const elements = new Map([
    ['[data-home-carousel-image]', image], ['[data-home-carousel-link]', link],
    ['[data-home-carousel-date]', date], ['[data-home-carousel-title]', title],
    ['[data-home-carousel-info]', info], ['[data-archive-like]', like],
    ['[data-home-carousel-previous]', previous], ['[data-home-carousel-next]', next],
    ['[data-home-carousel-dots]', dotsContainer], ['[data-home-carousel-announcement]', announcement],
    ['.hero-carousel-controls', controls],
  ]);
  carousel.querySelector = (selector) => selector === missingSelector ? null : elements.get(selector) ?? null;
  document.querySelectorAll = (selector) => {
    assert.equal(selector, '[data-home-featured-carousel]');
    return [carousel];
  };
  const preloads = [], timers = [];
  const forbidTimer = (...args) => {
    timers.push(args);
    throw new Error('首页轮播应由访客主动翻阅，不应安排自动播放');
  };
  const context = {
    document,
    window: { matchMedia: () => ({ matches: reducedMotion }), setTimeout: forbidTimer, setInterval: forbidTimer },
    setTimeout: forbidTimer, setInterval: forbidTimer,
    Image: class extends Element { constructor() { super(); preloads.push(this); } },
    CustomEvent: class { constructor(type) { this.type = type; } },
  };
  return {
    run: () => script.runInNewContext(context, { timeout: 1000 }),
    items, document, carousel, image, link, date, title, info, like,
    previous, next, dots, dotsContainer, announcement, controls, preloads, timers, animationCalls,
  };
}

function assertActive(fixture, index) {
  const item = fixture.items[index];
  assert.equal(fixture.image.src, item.src);
  assert.equal(fixture.image.alt, item.description);
  assert.equal(fixture.image.width, item.width);
  assert.equal(fixture.image.height, item.height);
  assert.equal(fixture.link.href, item.href, '应原样保留已本地化路径、查询参数与锚点');
  assert.equal(fixture.date.textContent, item.dateDisplay);
  assert.equal(fixture.title.textContent, item.title);
  assert.equal(fixture.info.textContent, item.recordInfo);
  assert.deepEqual(fixture.dots.map((dot) => dot.getAttribute('aria-current')), fixture.dots.map((_, position) => String(position === index)));
}

test('六语言轮播保留构建时生成的链接与固定提示，并同步题名和点赞目标', () => {
  for (const language of languages) {
    const fixture = createCarousel({ language });
    fixture.run();
    assert.ok(Object.hasOwn(fixture.carousel.dataset, 'carouselReady'), language.locale);
    assert.equal(fixture.controls.removed, false);
    assertActive(fixture, 0);
    fixture.next.dispatch('click');
    assertActive(fixture, 1);
    assert.equal(fixture.link.getAttribute('aria-label'), fill(language.view, fixture.items[1].title));
    assert.equal(fixture.like.getAttribute('aria-label'), fill(language.like, fixture.items[1].title));
    assert.equal(fixture.like.dataset.itemId, fixture.items[1].itemId);
    assert.equal(fixture.like.dispatchedEvents.at(-1).type, 'archive-like-target-change');
    assert.equal(fixture.announcement.textContent, fill(language.announcement, 2, fixture.items[1].description));
    assert.equal(fixture.image.srcset, undefined, '没有响应式候选时不得沿用上一张图片');
    fixture.next.dispatch('click');
    assert.equal(fixture.image.srcset, fixture.items[2].srcset);
  }
});

test('上一张和下一张首尾循环，圆点可直接切换指定档案', () => {
  const fixture = createCarousel();
  fixture.run();
  fixture.previous.dispatch('click');
  assertActive(fixture, 2);
  fixture.next.dispatch('click');
  assertActive(fixture, 0);
  fixture.dots[1].dispatch('click');
  assertActive(fixture, 1);
  fixture.dots[2].dispatch('click');
  assertActive(fixture, 2);
  fixture.next.dispatch('click');
  assertActive(fixture, 0);
});

test('圆点支持左右方向键、Home和End，并移动键盘焦点', () => {
  const fixture = createCarousel();
  fixture.run();
  const press = (key, expectedIndex) => {
    const event = fixture.dotsContainer.dispatch('keydown', { key });
    assert.equal(event.defaultPrevented, true);
    assertActive(fixture, expectedIndex);
    assert.equal(fixture.document.activeElement, fixture.dots[expectedIndex]);
  };
  fixture.dots[0].focus();
  press('ArrowLeft', 2);
  press('ArrowRight', 0);
  press('End', 2);
  press('Home', 0);
  press('ArrowRight', 1);
  assert.equal(fixture.dotsContainer.dispatch('keydown', { key: 'Tab' }).defaultPrevented, false);
  fixture.document.activeElement = null;
  assert.equal(fixture.dotsContainer.dispatch('keydown', { key: 'End' }).defaultPrevented, false);
  assertActive(fixture, 1);
});

test('浏览器没有animate或启用减少动画时仍可正常切换', () => {
  const unavailable = createCarousel({ withAnimate: false });
  assert.doesNotThrow(() => unavailable.run());
  assert.doesNotThrow(() => unavailable.next.dispatch('click'));
  assertActive(unavailable, 1);
  const reduced = createCarousel({ reducedMotion: true });
  reduced.run();
  reduced.next.dispatch('click');
  assertActive(reduced, 1);
  assert.equal(reduced.animationCalls.length, 0);
});

test('仅预加载下一张图片，不安排自动轮播或预先下载全部图片', () => {
  const fixture = createCarousel();
  fixture.run();
  assert.equal(fixture.preloads.length, 1);
  assert.equal(fixture.preloads[0].src, fixture.items[1].src);
  fixture.next.dispatch('click');
  assert.equal(fixture.preloads.length, 2);
  assert.equal(fixture.preloads[1].src, fixture.items[2].src);
  fixture.dots[2].dispatch('click');
  assert.equal(fixture.preloads.at(-1).src, fixture.items[0].src);
  assert.equal(fixture.timers.length, 0);
});

test('轮播JSON损坏、仅有一张或缺少必要元素时安全隐藏控制栏', () => {
  for (const options of [{ rawItems: '{broken' }, { count: 1 }, { missingSelector: '[data-home-carousel-image]' }]) {
    const fixture = createCarousel(options);
    assert.doesNotThrow(() => fixture.run());
    assert.equal(fixture.controls.removed, true);
    assert.equal(Object.hasOwn(fixture.carousel.dataset, 'carouselReady'), false);
    assert.equal(fixture.preloads.length, 0);
    assert.equal(fixture.next.listeners.has('click'), false);
  }
});
