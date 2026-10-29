import source from '../site/src/data/archive-categories.json' with { type: 'json' };
import { getArchiveCategoryOptions } from './archive-reference.mjs';

// 投稿沿用原接口的中文值，但新选项由全站同一份访客分类生成。
export const submissionCategories = Object.freeze(getArchiveCategoryOptions(source.categories).map(({ label }) => label));
// 旧稿保持原值；尤其“证件与卡片”不能在没有人工判断时拆成证件或卡片。
export const legacySubmissionCategories = Object.freeze(['照片', '证件与卡片', '日记与笔记', '其他']);
const acceptedCategories = new Set([...submissionCategories, ...legacySubmissionCategories]);
export const isSubmissionCategory = (value) => typeof value === 'string' && acceptedCategories.has(value);

export const restoreSubmissionCategory = (select, value, labelFor = (label) => label) => {
  if (!select) return;
  // 只为正在打开的旧稿保留原分类，不把全部旧选项重新加入新稿菜单。
  for (const option of [...select.options]) {
    if (option.dataset.legacyCategory === 'true' && option.value !== value) option.remove();
  }
  if (legacySubmissionCategories.includes(value) && ![...select.options].some((option) => option.value === value)) {
    const option = select.ownerDocument.createElement('option');
    option.value = value;
    option.textContent = labelFor(value);
    option.dataset.legacyCategory = 'true';
    select.append(option);
  }
  select.value = value ?? '';
};
