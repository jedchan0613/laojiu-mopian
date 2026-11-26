export function initLetterReader(reader: HTMLElement) {
  const toolbar = reader.querySelector<HTMLElement>('[data-reader-toolbar]');
  const text = reader.querySelector<HTMLElement>('[data-letter-text]');
  const gallery = reader.querySelector<HTMLElement>('[data-record-gallery]');
  const pages = Array.from(reader.querySelectorAll<HTMLElement>('[data-letter-page]'));
  const position = reader.querySelector<HTMLSelectElement>('[data-letter-position]');
  const modes = Array.from(reader.querySelectorAll<HTMLButtonElement>('[data-letter-mode-select]'));
  const sizes = Array.from(reader.querySelectorAll<HTMLButtonElement>('[data-letter-size-select]'));
  let imageIndex = 0;
  let bookmark: { anchor: HTMLElement | Range; index: number; top: number } | undefined;

  function visibleTextPage() {
    const edge = (toolbar?.getBoundingClientRect().bottom ?? 0) + 40;
    const firstVisible = pages.findIndex(page => page.getBoundingClientRect().bottom > edge);
    return firstVisible >= 0 ? firstVisible : Math.max(0, pages.length - 1);
  }

  function updatePosition() {
    if (!position) return;
    const page = (reader.dataset.letterMode === 'text' ? visibleTextPage() : imageIndex) + 1;
    if (position.value !== String(page)) position.value = String(page);
  }

  function savePlaceInText() {
    if (!text) return;
    const index = visibleTextPage();
    const element = pages[index] ?? text;
    bookmark = { anchor: element, index, top: element.getBoundingClientRect().top };
  }

  // 对照栏和整封阅读的行宽不同。用阅读线上的字符定位，切栏后仍看到同一句。
  function rememberUnpagedComparison() {
    const node = text?.firstChild;
    if (!(node instanceof Text) || !node.length || !text) return;
    const edge = Math.max(0, toolbar?.getBoundingClientRect().bottom ?? 0) + 24;
    const bounds = text.getBoundingClientRect();
    if (bounds.top >= edge || bounds.bottom <= edge) return;
    const range = document.createRange();
    function at(offset: number) {
      range.setStart(node!, offset);
      range.setEnd(node!, offset + 1);
      return range.getBoundingClientRect();
    }
    let first = 0;
    let last = node.length - 1;
    while (first < last) {
      const middle = Math.floor((first + last) / 2);
      if (at(middle).bottom < edge) first = middle + 1;
      else last = middle;
    }
    const rect = at(first);
    if (rect.height) bookmark = { anchor: range, index: 0, top: rect.top };
  }

  function showReaderContent(element: HTMLElement | Range | null, top: number) {
    if (element) window.scrollBy({ top: element.getBoundingClientRect().top - top, behavior: 'instant' });
  }

  const belowToolbar = () => (toolbar?.getBoundingClientRect().height ?? 0) + 12;
  const selectScan = (index: number) => gallery?.dispatchEvent(new CustomEvent('letter-select-image', { detail: index }));

  function setMode(next: string) {
    reader.dataset.letterMode = next;
    for (const button of modes) button.setAttribute('aria-pressed', String(button.dataset.letterModeSelect === next));
  }

  function showPageText(index: number, restore: boolean) {
    const page = pages[index];
    if (!page) return;
    if (restore && bookmark?.index === index) showReaderContent(bookmark.anchor, bookmark.top);
    else showReaderContent(page.parentElement, belowToolbar());
  }

  reader.addEventListener('letter-image-changed', (event) => {
    imageIndex = (event as CustomEvent<number>).detail;
    pages.forEach((page, index) => { page.dataset.currentPage = String(index === imageIndex); });
    updatePosition();
  });
  if (position) {
    position.addEventListener('change', () => {
      const index = Number(position.value) - 1;
      if (!pages[index]) return;
      bookmark = undefined;
      selectScan(index);
      if (reader.dataset.letterMode === 'text') showPageText(index, false);
      else showReaderContent(gallery, belowToolbar());
      updatePosition();
    });
    let frame = 0;
    const onViewportChange = () => {
      if (reader.dataset.letterMode !== 'text' || frame) return;
      frame = requestAnimationFrame(() => { frame = 0; updatePosition(); });
    };
    window.addEventListener('scroll', onViewportChange, { passive: true });
    window.addEventListener('resize', onViewportChange);
  }
  for (const button of modes) {
    button.addEventListener('click', () => {
      const nextMode = button.dataset.letterModeSelect;
      const oldMode = reader.dataset.letterMode;
      if (!nextMode || nextMode === oldMode) return;
      const readingBelowHeader = (toolbar?.getBoundingClientRect().top ?? 1) <= 1;
      if (oldMode === 'text') {
        savePlaceInText();
        if (pages.length && bookmark) selectScan(bookmark.index);
      } else if (oldMode === 'compare' && !pages.length && !bookmark) {
        rememberUnpagedComparison();
      }
      setMode(nextMode);
      const toolbarHeight = belowToolbar();
      if (nextMode === 'text' && bookmark && (!pages.length || bookmark.index === imageIndex)) {
        showReaderContent(bookmark.anchor, bookmark.top);
      } else if (nextMode === 'text' && pages[imageIndex] && imageIndex > 0) {
        showPageText(imageIndex, false);
      } else if (readingBelowHeader) {
        showReaderContent(nextMode === 'text' ? text : gallery, toolbarHeight);
      }
      updatePosition();
    });
  }

  reader.querySelector('[data-letter-read-page]')?.addEventListener('click', () => {
    if (reader.dataset.letterMode === 'original') setMode('text');
    showPageText(imageIndex, true);
    pages[imageIndex]?.focus({ preventScroll: true });
    updatePosition();
  });
  for (const link of reader.querySelectorAll<HTMLInputElement>('[data-letter-original-page]')) {
    link.addEventListener('click', () => {
      const index = Number(link.dataset.letterOriginalPage) - 1;
      const page = pages[index];
      if (!page) return;
      bookmark = { anchor: page, index, top: page.getBoundingClientRect().top };
      if (reader.dataset.letterMode === 'text') setMode('original');
      selectScan(index);
      showReaderContent(gallery, belowToolbar());
      gallery?.querySelector<HTMLElement>('[data-gallery-open]')?.focus({ preventScroll: true });
    });
  }

  function setSize(value?: string) {
    if (!sizes.some(button => button.dataset.letterSizeSelect === value)) return;
    reader.dataset.letterSize = value;
    for (const button of sizes) button.setAttribute('aria-pressed', String(button.dataset.letterSizeSelect === value));
    updatePosition();
  }
  for (const button of sizes) button.addEventListener('click', () => {
    const value = button.dataset.letterSizeSelect;
    setSize(value);
    try { if (value) localStorage.setItem('ljm-letter-size', value); } catch { /* 当前页面仍可调节。 */ }
  });
  try { setSize(localStorage.getItem('ljm-letter-size') ?? 'medium'); } catch { /* 默认中号。 */ }
  reader.dataset.letterReady = 'true';
}
