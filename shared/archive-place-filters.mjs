// 目录筛选的展示别名，不改变档案中的地点原文或地理层级。
// 只列明确同义的城市写法，避免用“去掉省市区县后缀”误合并不同地点。
const cityNames = [
  '北京', '天津', '上海', '重庆',
  '广州', '深圳', '珠海', '佛山', '肇庆', '汕头', '梅州',
  '大连', '秦皇岛', '哈尔滨', '厦门', '桂林', '长沙', '宜昌',
  '丽江', '昆明', '杭州', '南京', '苏州', '宁波', '连云港',
];
const cityAliases = new Map(cityNames.map(name => [`${name}市`, name]));
const placeFields = ['country', 'province', 'city', 'district', 'street_town', 'specific_place'];

const placeText = value => typeof value === 'string' ? value.trim() : '';

/** 仅统一明确同义写法；历史地名、区县和其他未登记名称保留。 */
export const normalizeArchivePlace = value => {
  const text = placeText(value).normalize('NFKC').replace(/\s+/g, ' ');
  return cityAliases.get(text) ?? text;
};

/** 未知值、多地点清单和考证说明仍可检索，但不成为常规地点选项。 */
export const isBrowseableArchivePlace = value => {
  const text = normalizeArchivePlace(value);
  if (!text || text.length > 48) return false;
  if (/^(?:(?:地点)?(?:未知|不详|不明|未详|待核|待考|不确定|无法判断|无法确定)(?:地点)?|不适用|无|unknown(?: place| location)?|location unknown|not known|unidentified(?: place| location)?|undetermined|n\/a|none|[-—])$/i.test(text)) return false;
  if (/[，,；;、。\r\n|]/.test(placeText(value))) return false;
  if (/待核|待考|未确认|未核实|无法确认|推定|可能|仅本|详见|见照片档案|原照片题字|历史题字|第\s*[一二三四五六七八九十\d]+\s*[图页]/.test(text)) return false;
  if (/https?:\/\/|^\d[\d\s.\-]*$/i.test(text)) return false;
  return true;
};

/**
 * 为目录生成地点选项与兼容旧链接的匹配值。
 * 原始字符串保留在 matchingValues，显示用 values 只包含可浏览的规范地点。
 * @param {Record<string, unknown> | null | undefined} core
 * @param {Record<string, unknown> | null | undefined} [localizedCore]
 * @returns {{ values: string[], labels: Record<string, string>, matchingValues: string[] }}
 */
export const createArchivePlaceFacets = (core, localizedCore = core) => {
  const values = new Set();
  const rawValues = new Set();
  const labels = new Map();
  for (const field of placeFields) {
    const raw = placeText(core?.[field]);
    if (!raw) continue;
    rawValues.add(raw);
    const value = normalizeArchivePlace(raw);
    if (!isBrowseableArchivePlace(raw)) continue;
    values.add(value);
    const translated = placeText(localizedCore?.[field]);
    const label = !translated || normalizeArchivePlace(translated) === value ? value : translated;
    if (!labels.has(value) || labels.get(value) === value) labels.set(value, label);
  }
  return {
    values: [...values],
    labels: Object.fromEntries(labels),
    matchingValues: [...new Set([...values, ...rawValues, ...[...rawValues].map(normalizeArchivePlace)])],
  };
};
