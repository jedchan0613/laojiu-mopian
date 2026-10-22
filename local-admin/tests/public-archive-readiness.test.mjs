import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createRequire, stripTypeScriptTypes } from 'node:module';
import test from 'node:test';
import { Script } from 'node:vm';
import { fileURLToPath } from 'node:url';
import { groupArchiveMatches } from '../../site/src/data/archive-browse.mjs';

const root = new URL('../../', import.meta.url);
const require = createRequire(new URL('site/package.json', root));
const build = await require('esbuild').build({
  absWorkingDir: fileURLToPath(root),
  entryPoints: ['site/src/i18n/interface-text.ts'], bundle: true, write: false,
  platform: 'node', format: 'cjs', logLevel: 'silent',
});
const translations = { exports: {} };
new Function('require', 'module', 'exports', build.outputFiles[0].text)(require, translations, translations.exports);
const translate = translations.exports.interfaceText;
const withoutImports = (source) => source.replace(/^[ \t]*import[\s\S]*?;[ \t]*(?:\r?\n)?/gm, '').replace(/^export /gm, '');
const page = await readFile(new URL('site/src/pages/archive/index.astro', root), 'utf8');
const pageScript = page.match(/<script>\s*([\s\S]*?)<\/script>/)?.[1];
assert.ok(pageScript, '读取目录页实际执行的客户端脚本');
const sources = await Promise.all(['archive-search.ts', 'archive-card.ts'].map((name) => readFile(new URL('site/src/scripts/' + name, root), 'utf8')));
// 执行目录页、八字段计分和当前页卡片的真实源码；仅用合成公开数据与可控网络。
const script = new Script(stripTypeScriptTypes([...sources, pageScript].map(withoutImports).join('\n')), { filename: 'archive-client.ts' });
const loadingKey = '正在加载全文搜索，关键词已保留。可以清除关键词后继续浏览。';
const errorKey = '全文搜索暂时无法加载，关键词已保留。请重试，或清除关键词后继续浏览。';
const locales = ['zh-CN', 'en', 'th', 'ja', 'ko', 'zh-Hant'];
const flush = async () => { for (let index = 0; index < 12; index++) await Promise.resolve(); };

function fixture({ locale = 'zh-CN', query = '', restore = false } = {}) {
  const prefix = locale === 'zh-CN' ? '' : '/' + (locale === 'zh-Hant' ? 'zh-hant' : locale);
  const location = new URL('https://example.invalid' + prefix + '/archive/' + query);
  const storage = new Map(), scrolls = [], requests = [];
  const document = { activeElement: null };
  class Element {
    constructor(tagName = 'div') { this.tagName = tagName; }
    dataset = {};
    attributes = new Map();
    children = [];
    listeners = new Map();
    hidden = false;
    disabled = false;
    value = '';
    _text = '';
    className = '';
    parentElement = null;
    get textContent() { return this._text + this.children.map((child) => child.textContent).join(''); }
    set textContent(value) { this.replaceChildren(); this._text = String(value ?? ''); }
    get options() { return this.children.filter((child) => child.tagName === 'option'); }
    get selectedOptions() { return this.options.filter((child) => child.value === this.value); }
    setAttribute(name, value) { this.attributes.set(name, String(value)); }
    getAttribute(name) { return this.attributes.get(name) ?? null; }
    getAttributeNames() { return [...this.attributes.keys()]; }
    removeAttribute(name) { this.attributes.delete(name); }
    append(...children) {
      for (const child of children) {
        if (child.parentElement) child.parentElement.children = child.parentElement.children.filter((item) => item !== child);
        child.parentElement = this;
        this.children.push(child);
      }
    }
    replaceChildren(...children) {
      for (const child of this.children) child.parentElement = null;
      this.children = []; this._text = ''; this.append(...children);
    }
    matches(selector) {
      if (selector.includes(',')) return selector.split(',').some((part) => this.matches(part.trim()));
      if (selector.startsWith('#')) return this.id === selector.slice(1);
      if (selector.startsWith('.')) return this.className.split(' ').includes(selector.slice(1));
      const match = selector.match(/^(\w+)?\[([^=\]]+)(?:="([^"]*)")?\]$/);
      if (match) {
        if (match[1] && this.tagName !== match[1]) return false;
        const key = match[2].replace(/^data-/, '').replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
        const value = match[2].startsWith('data-') ? this.dataset[key] : this[match[2]];
        return value !== undefined && (match[3] === undefined || String(value) === match[3]);
      }
      return this.tagName === selector;
    }
    querySelectorAll(selector) {
      return this.children.flatMap((child) => [
        ...(child.matches(selector) ? [child] : []), ...child.querySelectorAll(selector),
      ]);
    }
    querySelector(selector) { return this.querySelectorAll(selector)[0] ?? null; }
    closest(selector) { return this.matches(selector) ? this : this.parentElement?.closest(selector) ?? null; }
    addEventListener(type, listener) {
      const listeners = this.listeners.get(type) ?? [];
      listeners.push(listener); this.listeners.set(type, listeners);
    }
    dispatch(type, properties = {}) {
      const event = { target: this, button: 0, preventDefault() {}, ...properties };
      for (const listener of this.listeners.get(type) ?? []) listener(event);
    }
    focus() { document.activeElement = this; this.dispatch('focus'); }
    scrollIntoView() {}
  }
  const body = new Element('body');
  const make = (id, tag = 'div', parent = body) => {
    const element = new Element(tag); element.id = id; parent.append(element); return element;
  };
  const index = make('archive-index'); index.className = 'archive-index'; index.dataset.archivePageSize = '12';
  const controls = make('archive-controls'); controls.className = 'archive-controls';
  const search = make('archive-search', 'input', controls);
  const select = (id, values) => {
    const element = make(id, 'select', controls);
    for (const value of values) { const option = new Element('option'); option.value = value; option.textContent = value; element.append(option); }
    element.value = values[0]; return element;
  };
  const category = select('archive-category', ['', 'photos', 'papers']);
  const sort = select('archive-sort', ['relevance', 'recent', 'likes', 'date-asc', 'date-desc', 'type']); sort.value = 'recent';
  const decade = select('archive-decade', ['', '1980', '1990']);
  const place = select('archive-place', ['', 'Beijing', 'Tokyo']);
  const tag = select('archive-tag', ['', 'family', 'travel']);
  const ids = [
    'archive-clear', 'archive-actions', 'archive-more-filters', 'archive-more-summary', 'archive-filter-chips',
    'archive-empty-state', 'archive-empty-title', 'archive-empty-description', 'archive-empty-clear',
    'archive-search-assist', 'archive-search-suggestions', 'archive-results-summary', 'archive-search-retry',
    'archive-pagination', 'archive-page-summary', 'archive-page-previous', 'archive-page-next', 'archive-page-numbers',
  ];
  const elements = Object.fromEntries(ids.map((id) => [id, make(id)]));
  const list = make('archive-list', 'ul');
  const album = make('', 'li', list); album.dataset.archiveAlbumCard = 'family-album'; album.dataset.albumRecordCount = '3';
  const albumSummary = make('', 'p', album); albumSummary.dataset.albumMatches = '';
  const matchedItems = make('', 'ul', album); matchedItems.dataset.albumMatchedItems = '';
  const albumLink = make('', 'a', album); albumLink.dataset.albumEntry = ''; albumLink.href = prefix + '/albums/family-album/';
  const entries = [], fields = [], cardData = {};
  for (let number = 0; number < 179; number++) {
    const id = 'TEST-' + String(number).padStart(3, '0');
    const entry = make('', 'li', list);
    entry.dataset = {
      archiveItem: '', archiveId: id, archiveCategory: number % 2 ? 'papers' : 'photos',
      archiveDecade: number % 2 ? '1990' : '1980', archivePlaces: number % 2 ? '|Tokyo|' : '|Beijing|',
      archiveTags: number % 2 ? '|travel|' : '|family|', archiveYear: number % 2 ? '1999' : '1981',
      archiveTypeLabel: number % 2 ? 'Paper' : 'Photo', archiveTitle: 'Record ' + number,
      archiveOriginalIndex: String(number), ...(number < 3 ? { archiveAlbumKey: 'family-album' } : {}),
    };
    const link = make('', 'a', entry); link.dataset.archiveEntry = ''; link.href = prefix + '/archive/' + id + '/';
    link.textContent = entry.dataset.archiveTitle;
    entries.push(entry);
    fields.push({ id, fields: { title: 'record ' + number, identifiers: id.toLowerCase(), tags: 'family travel',
      place: number % 2 ? 'tokyo' : 'beijing', typeLabel: 'photo paper', dateDisplay: '1980 1990',
      description: 'public description', transcription: number === 178 ? 'needleonlylast' : '',
    } });
    cardData[id] = { description: 'Public description ' + number, date: entry.dataset.archiveYear, place: number % 2 ? 'Tokyo' : 'Beijing', tags: ['family'] };
  }
  const data = make('archive-card-data', 'script'); data.textContent = JSON.stringify(cardData);
  const searchData = make('archive-search-index', 'script'); searchData.textContent = JSON.stringify({ url: '/archive-search/' + 'a'.repeat(24) + '.json' });
  const views = ['grouped', 'albums', 'items'].map((mode) => {
    const link = make('', 'a'); link.dataset.archiveView = mode; return link;
  });
  Object.assign(document, {
    querySelectorAll: (selector) => body.querySelectorAll(selector),
    querySelector: (selector) => body.querySelector(selector),
    createElement: (tagName) => new Element(tagName),
    createTextNode: (text) => { const node = new Element('#text'); node.textContent = text; return node; },
    addEventListener: (...args) => body.addEventListener(...args),
  });
  if (restore) storage.set('ljm-archive-browse-state', JSON.stringify({ href: location.pathname + location.search, scrollY: 742, restorePending: true }));
  const context = {
    document, URL, URLSearchParams, AbortSignal, groupArchiveMatches,
    ct: (key, values) => translate(key, locale, values), clientLocale: () => locale,
    clientPath: (path) => prefix + path,
    window: {
      location, scrollY: 742,
      matchMedia: () => ({ matches: false, addEventListener() {} }),
      sessionStorage: { getItem: (key) => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, value) },
      history: { replaceState: (_state, _title, href) => { location.href = new URL(href, location).href; } },
      requestAnimationFrame: (fn) => fn(), scrollTo: (options) => scrolls.push(options.top),
    },
    fetch: (url, options) => new Promise((resolve, reject) => requests.push({ url, options, resolve, reject })),
  };
  script.runInNewContext(context, { timeout: 1000 });
  return {
    document, body, search, category, sort, decade, place, tag, list, album, entries, fields, views, elements, requests, storage, scrolls, location, searchData,
    input: (text) => { search.value = text; search.dispatch('input'); },
    succeed: async (request = requests.at(-1), responseFields = fields) => { request.resolve({ ok: true, json: async () => responseFields }); await flush(); },
    visibleItems: () => entries.filter((entry) => !entry.hidden),
    visibleGroups: () => list.children.filter((entry) => !entry.hidden),
  };
}

test('六语言无关键词初始化不请求索引，立即分页、分组并恢复返回位置', () => {
  for (const locale of locales) {
    const f = fixture({ locale, query: '?page=2', restore: true });
    assert.equal(f.requests.length, 0, locale);
    for (const control of [f.search, f.category, f.sort, f.decade, f.place, f.tag]) assert.equal(control.disabled, false);
    assert.equal(f.list.hidden, false);
    assert.equal(f.visibleGroups().length, 12);
    assert.equal(f.elements['archive-page-summary'].textContent, translate('第 {0} 页，共 {1} 页', locale, { 0: 2, 1: 15 }));
    assert.deepEqual(f.scrolls, [742]);
    assert.equal(JSON.parse(f.storage.get('ljm-archive-browse-state')).restorePending, false);
    assert.equal(f.elements['archive-search-retry'].hidden, true);
    assert.equal(f.elements['archive-empty-state'].hidden, true);
    assert.equal(f.visibleItems().filter((entry) => entry.dataset.cardExpanded === 'true').length, 12);
  }
});

test('慢网下无关键词分类、年代、地点、标签、排序、分页和相册视图不等待索引', async () => {
  const f = fixture();
  f.search.focus(); await flush();
  assert.equal(f.requests.length, 1);
  f.category.value = 'photos'; f.category.dispatch('change');
  f.decade.value = '1980'; f.decade.dispatch('change');
  f.place.value = 'Beijing'; f.place.dispatch('change');
  f.tag.value = 'family'; f.tag.dispatch('change');
  f.sort.value = 'date-desc'; f.sort.dispatch('change');
  assert.equal(f.list.hidden, false);
  assert.equal(f.elements['archive-pagination'].hidden, false);
  f.elements['archive-page-next'].dispatch('click');
  assert.equal(f.location.searchParams.get('page'), '2');
  assert.ok(f.visibleItems().every((entry) => entry.dataset.archiveCategory === 'photos'));
  f.views[1].dispatch('click');
  assert.equal(f.visibleGroups().length, 1);
  assert.equal(f.visibleGroups()[0], f.album);
  assert.equal(f.location.searchParams.get('view'), 'albums');
  assert.equal(f.location.searchParams.has('page'), false);
  assert.equal(f.requests.length, 1);
  f.views[2].dispatch('click');
  assert.equal(f.visibleItems().length, 12);
  assert.ok(f.visibleItems().every((entry) => entry.dataset.archiveOriginalIndex % 2 === 0));
});

test('搜索框键盘聚焦预取和实际输入去重，完整179条原文可命中末条', async () => {
  const f = fixture();
  f.search.focus(); f.search.dispatch('focus'); f.input('needleonlylast'); await flush();
  assert.equal(f.requests.length, 1);
  assert.equal(f.search.value, 'needleonlylast');
  assert.equal(f.location.searchParams.get('q'), 'needleonlylast');
  assert.equal(f.list.hidden, true);
  assert.equal(f.list.getAttribute('aria-busy'), 'true');
  assert.equal(f.elements['archive-results-summary'].textContent, translate(loadingKey, 'zh-CN'));
  assert.equal(f.elements['archive-empty-state'].hidden, true);
  await f.succeed();
  assert.deepEqual(f.visibleItems().map((entry) => entry.dataset.archiveId), ['TEST-178']);
  assert.equal(f.list.hidden, false);
  assert.equal(f.list.getAttribute('aria-busy'), 'false');
  assert.match(f.visibleItems()[0].querySelector('[data-match-reason]').textContent, /原文/);
});

test('未先聚焦的输入也立即加载；清除关键词即刻恢复非关键词浏览且不被迟到结果覆盖', async () => {
  const f = fixture({ query: '?view=items&page=2' });
  f.input('needleonlylast'); await flush();
  assert.equal(f.requests.length, 1);
  f.input('');
  assert.equal(f.list.hidden, false);
  assert.equal(f.visibleItems().length, 12);
  assert.equal(f.location.searchParams.has('q'), false);
  await f.succeed();
  assert.equal(f.search.value, '');
  assert.equal(f.visibleItems().length, 12);
  assert.equal(f.location.searchParams.get('view'), 'items');
});

test('六语言带q直接访问立即加载，慢网保持页码与q，失败明确提示并允许去重重试', async () => {
  for (const locale of locales) {
    const f = fixture({ locale, query: '?q=record&view=items&sort=date-asc&page=2', restore: true });
    await flush();
    assert.equal(f.requests.length, 1);
    assert.equal(f.search.value, 'record');
    assert.equal(f.location.searchParams.get('page'), '2');
    assert.equal(f.elements['archive-results-summary'].textContent, translate(loadingKey, locale));
    assert.equal(f.elements['archive-empty-state'].hidden, true);
    assert.deepEqual(f.scrolls, []);
    f.requests[0].reject(new Error('simulated offline')); await flush();
    assert.equal(f.elements['archive-results-summary'].textContent, translate(errorKey, locale));
    assert.equal(f.elements['archive-search-retry'].hidden, false);
    assert.equal(f.elements['archive-empty-state'].hidden, true);
    assert.equal(f.search.value, 'record');
    assert.equal(f.location.searchParams.get('page'), '2');
    f.elements['archive-search-retry'].dispatch('click');
    f.elements['archive-search-retry'].dispatch('click'); await flush();
    assert.equal(f.requests.length, 2);
    await f.succeed();
    assert.equal(f.location.searchParams.get('page'), '2');
    assert.equal(f.location.searchParams.get('sort'), 'date-asc');
    assert.equal(f.visibleItems().length, 12);
    assert.deepEqual(f.scrolls, [742]);
    assert.equal(f.elements['archive-search-retry'].hidden, true);
  }
});

test('预取失败仍能使用筛选及返回链接；清除失败关键词恢复真实结果', async () => {
  const f = fixture();
  f.search.focus(); await flush(); f.requests[0].reject(new Error('offline')); await flush();
  assert.equal(f.list.hidden, false);
  assert.equal(f.elements['archive-search-retry'].hidden, true);
  f.category.value = 'papers'; f.category.dispatch('change');
  assert.ok(f.visibleItems().every((entry) => entry.dataset.archiveCategory === 'papers'));
  const target = f.visibleItems()[0].querySelector('[data-archive-entry]');
  f.list.dispatch('click', { target });
  assert.equal(JSON.parse(f.storage.get('ljm-archive-browse-state')).targetId, target.parentElement.dataset.archiveId);
  f.input('unmatched'); await flush();
  f.requests[1].reject(new Error('still offline')); await flush();
  assert.equal(f.elements['archive-empty-state'].hidden, true);
  const chip = f.elements['archive-filter-chips'].children.find((node) => node.dataset.clearFilter === 'q');
  f.elements['archive-filter-chips'].dispatch('click', { target: chip });
  assert.equal(f.search.value, '');
  assert.equal(f.list.hidden, false);
  assert.equal(f.category.value, 'papers');
  assert.ok(f.visibleItems().every((entry) => entry.dataset.archiveCategory === 'papers'));
});

test('不完整、重复编号或缺少八字段的索引均明确报错；完整重试后才报告零命中', async () => {
  for (const invalid of ['short', 'duplicate', 'missing-field']) {
    const f = fixture({ query: '?q=unmatched' }); await flush();
    const fields = structuredClone(f.fields);
    if (invalid === 'short') fields.pop();
    if (invalid === 'duplicate') fields[178] = fields[0];
    if (invalid === 'missing-field') delete fields[178].fields.transcription;
    await f.succeed(f.requests[0], fields);
    assert.equal(f.elements['archive-results-summary'].textContent, translate(errorKey, 'zh-CN'));
    assert.equal(f.elements['archive-empty-state'].hidden, true);
    f.elements['archive-search-retry'].dispatch('click'); await flush(); await f.succeed();
    assert.equal(f.elements['archive-empty-state'].hidden, false);
    assert.equal(f.list.hidden, false);
    assert.equal(f.visibleGroups().length, 0);
  }
});

test('索引配置损坏和HTTP失败都可重新尝试，慢网期间改词只应用最新关键词', async () => {
  const f = fixture();
  f.searchData.textContent = '{broken';
  f.input('old-query'); await flush();
  assert.equal(f.requests.length, 0);
  assert.equal(f.elements['archive-search-retry'].hidden, false);
  f.searchData.textContent = JSON.stringify({ url: '/archive-search/' + 'a'.repeat(24) + '.json' });
  f.elements['archive-search-retry'].dispatch('click'); await flush();
  assert.equal(f.requests.length, 1);
  f.requests[0].resolve({ ok: false, status: 503 }); await flush();
  assert.equal(f.elements['archive-results-summary'].textContent, translate(errorKey, 'zh-CN'));
  f.elements['archive-search-retry'].dispatch('click'); await flush();
  f.input('needleonlylast');
  assert.equal(f.requests.length, 2);
  await f.succeed();
  assert.equal(f.location.searchParams.get('q'), 'needleonlylast');
  assert.deepEqual(f.visibleItems().map((entry) => entry.dataset.archiveId), ['TEST-178']);
});

test('八字段权重与相册成员匹配继续用完整索引，q变化使用最新输入与当前视图', async () => {
  const f = fixture({ query: '?q=needle&view=items' }); await flush();
  const fields = structuredClone(f.fields);
  for (const row of fields) for (const key of Object.keys(row.fields)) row.fields[key] = '';
  const names = ['title', 'identifiers', 'tags', 'place', 'typeLabel', 'dateDisplay', 'description', 'transcription'];
  for (let index = 0; index < names.length; index++) fields[index].fields[names[index]] = 'needle';
  await f.succeed(f.requests[0], fields);
  assert.deepEqual(f.visibleItems().map((entry) => entry.dataset.archiveId), names.map((_, index) => 'TEST-' + String(index).padStart(3, '0')));
  f.views[1].dispatch('click');
  assert.equal(f.visibleGroups().length, 1);
  assert.match(f.album.querySelector('[data-album-matches]').textContent, /3/);
  assert.equal(f.album.querySelector('[data-album-matched-items]').children.length, 3);
  f.input('doesnotexist');
  assert.equal(f.requests.length, 1);
  assert.equal(f.elements['archive-empty-state'].hidden, false);
  f.elements['archive-clear'].dispatch('click');
  assert.equal(f.search.value, '');
  assert.equal(f.visibleGroups()[0], f.album);
});
