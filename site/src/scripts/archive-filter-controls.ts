interface ChoiceGroup {
  element: HTMLElement;
  select: HTMLSelectElement;
  buttons: HTMLButtonElement[];
  search: HTMLInputElement | null;
  empty: HTMLElement | null;
  sortMenu: HTMLDetailsElement | null;
}

const normalizedLabel = (value: string) => value.trim().normalize('NFKC').toLocaleLowerCase();

/** 将文字选项与现有筛选状态连接，保留原节点和键盘焦点。 */
export function setupArchiveFilterControls(root: ParentNode = document) {
  const groups: ChoiceGroup[] = [];
  for (const element of root.querySelectorAll<HTMLElement>('[data-archive-choices]')) {
    const select = element.querySelector<HTMLSelectElement>('select');
    if (!select || select.id !== element.dataset.archiveChoices) continue;
    groups.push({
      element,
      select,
      buttons: Array.from(element.querySelectorAll<HTMLButtonElement>('button[data-filter-value]')),
      search: element.querySelector<HTMLInputElement>('input[data-choice-search]'),
      empty: element.querySelector<HTMLElement>('[data-choice-empty]'),
      sortMenu: element.closest<HTMLDetailsElement>('details[data-sort-menu]'),
    });
  }

  const filterChoices = (group: ChoiceGroup) => {
    const query = normalizedLabel(group.search?.value ?? '');
    const options = new Map(Array.from(group.select.options, option => [option.value, option]));
    let matches = 0;
    for (const button of group.buttons) {
      const value = button.dataset.filterValue ?? '';
      const option = options.get(value);
      const label = option?.label || option?.textContent || '';
      const matchesQuery = !query || normalizedLabel(label).includes(query);
      button.hidden = value !== '' && !matchesQuery;
      if (value !== '' && matchesQuery && !button.disabled) matches += 1;
    }
    if (group.empty) group.empty.hidden = !query || matches > 0;
  };

  const sync = () => {
    for (const group of groups) {
      const options = new Map(Array.from(group.select.options, option => [option.value, option]));
      for (const button of group.buttons) {
        const value = button.dataset.filterValue ?? '';
        const option = options.get(value);
        button.setAttribute('aria-pressed', String(group.select.value === value));
        button.disabled = !option || option.disabled || group.select.disabled;
      }
      const label = group.select.selectedOptions[0]?.textContent?.trim() ?? '';
      const labelContainer = group.sortMenu ?? group.element;
      for (const currentLabel of labelContainer.querySelectorAll<HTMLElement>('[data-choice-label]')) {
        currentLabel.textContent = label;
      }
      filterChoices(group);
    }
  };

  for (const group of groups) {
    group.search?.addEventListener('input', () => filterChoices(group));
    group.element.addEventListener('click', event => {
      const button = (event.target as Element | null)?.closest?.<HTMLButtonElement>('button[data-filter-value]');
      if (!button || !group.buttons.includes(button) || button.disabled || button.hidden) return;
      const value = button.dataset.filterValue ?? '';
      const option = Array.from(group.select.options).find(candidate => candidate.value === value);
      if (!option || option.disabled || group.select.disabled) return;
      group.select.value = value;
      group.select.dispatchEvent(new Event('change', { bubbles: true }));
      sync();
      if (group.sortMenu) {
        group.sortMenu.open = false;
        group.sortMenu.querySelector<HTMLElement>('summary')?.focus();
      }
    });

    if (!group.sortMenu) continue;
    const menu = group.sortMenu;
    menu.addEventListener('keydown', event => {
      if (event.key !== 'Escape' || !menu.open) return;
      event.preventDefault();
      menu.open = false;
      menu.querySelector<HTMLElement>('summary')?.focus();
    });
    const eventRoot = group.element.ownerDocument ?? root;
    eventRoot.addEventListener('click', event => {
      if (menu.open && event.target && !menu.contains(event.target as Node)) menu.open = false;
    });
  }

  const focus = (selectId: string) => {
    const group = groups.find(candidate => candidate.select.id === selectId);
    if (group) {
      const drawer = group.element.closest<HTMLDetailsElement>('#archive-more-filters');
      const closedPanel = drawer && !drawer.open ? drawer : group.sortMenu && !group.sortMenu.open ? group.sortMenu : null;
      if (closedPanel) {
        closedPanel.querySelector<HTMLElement>('summary')?.focus();
        return;
      }
      const selected = group.buttons.find(button =>
        button.dataset.filterValue === group.select.value && !button.disabled && !button.hidden);
      if (selected) {
        selected.focus();
        return;
      }
    }
    root.querySelector<HTMLInputElement>('#archive-search')?.focus();
  };

  sync();
  return { sync, focus };
}
