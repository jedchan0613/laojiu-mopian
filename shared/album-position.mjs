// original_position 保持原始自由文本；解析只用于浏览排序和维护提醒，绝不改写档案。
const numeralText = '[0-9零〇一二三四五六七八九十百千两]+';
const chineseDigits = { 零: 0, 〇: 0, 一: 1, 二: 2, 两: 2, 三: 3, 四: 4, 五: 5, 六: 6, 七: 7, 八: 8, 九: 9 };
const units = { 十: 10, 百: 100, 千: 1000 };
const slotNames = ['左上', '右上', '左下', '右下', '上中', '下中', '左中', '右中', '中间', '上', '下', '左', '右'];
const numberValue = (text) => {
  if (/^\d+$/.test(text)) return Number(text);
  if (!Object.keys(units).some((unit) => text.includes(unit))) {
    const digits = [...text].map((character) => chineseDigits[character]);
    return digits.some((digit) => digit === undefined) ? NaN : Number(digits.join(''));
  }
  let total = 0;
  let digit = 0;
  for (const character of text) {
    if (Object.hasOwn(chineseDigits, character)) digit = chineseDigits[character];
    else if (Object.hasOwn(units, character)) { total += (digit || 1) * units[character]; digit = 0; }
    else return NaN;
  }
  return total + digit;
};
const validNumber = (number) => Number.isSafeInteger(number) && number > 0 && number <= 100000;
const normalizedText = (value) => typeof value === 'string' ? value.trim().normalize('NFKC') : '';

export const parseAlbumPosition = (value) => {
  const text = normalizedText(value);
  const empty = { kind: text ? 'unknown' : 'empty', page: null, slot: null, photoNumber: null, text, parsed: false };
  if (!text) return empty;
  // 多页/跨页位置不能当作某一页的唯一照片位置，也不能误取末尾页码。
  if (new RegExp(`${numeralText}\\s*[-—–~～至到]\\s*${numeralText}\\s*[页頁]`).test(text)) return empty;
  const pageMatches = [...text.matchAll(new RegExp(`(?:第\\s*)?(${numeralText})\\s*[页頁]`, 'g'))];
  if (pageMatches.length > 1) return empty;
  let pageMatch = pageMatches[0] ?? text.match(/\b(?:page|p\.?)[\s:]*(\d+)\b/i);
  // 仅单独的数字，以及明确的「页码-页内序号」简写才作为页码。
  const compact = text.match(/^(\d+)\s*[-.]\s*(\d+)$/);
  if (!pageMatch && /^\d+$/.test(text)) pageMatch = [text, text];
  if (!pageMatch && compact) pageMatch = [compact[0], compact[1]];
  if (pageMatch) {
    const page = numberValue(pageMatch[1]);
    if (!validNumber(page)) return empty;
    const suffix = compact ? '' : text.slice((pageMatch.index ?? 0) + pageMatch[0].length);
    const numberMatches = [...suffix.matchAll(new RegExp(`(?:第\\s*)?(${numeralText})\\s*(?:张|幅|号|號|位)`, 'g'))];
    const numberMatch = numberMatches.length === 1 ? numberMatches[0] : null;
    const photoNumber = compact ? Number(compact[2]) : numberMatch ? numberValue(numberMatch[1]) : null;
    // 先匹配完整位置词，去除后再查短词，避免「左上」同时被识别为「左」和「上」。
    let remaining = suffix.replace(/中央|正中/g, '中间');
    const slots = [];
    for (const name of slotNames) {
      if (remaining.includes(name)) { slots.push(name); remaining = remaining.replaceAll(name, ''); }
    }
    const slot = slots.length === 1 && !/整页|整頁|全页|全頁/.test(suffix) ? slots[0] : null;
    return { kind: 'page', page, slot: numberMatches.length > 1 ? null : slot, photoNumber: validNumber(photoNumber) ? photoNumber : null, text, parsed: true };
  }
  if (/封底|封三|后衬页|後襯頁|back\s*cover/i.test(text)) return { ...empty, kind: 'back-cover', parsed: true };
  if (/封面|封二|扉页|扉頁|前衬页|前襯頁|front\s*cover/i.test(text)) return { ...empty, kind: 'front-cover', parsed: true };
  return empty;
};

export const albumPositionSortKey = (value) => {
  const position = parseAlbumPosition(value);
  const sections = { 'front-cover': 0, page: 1, 'back-cover': 2, unknown: 3, empty: 4 };
  const slotOrder = position.slot !== null ? slotNames.indexOf(position.slot)
    : position.photoNumber !== null ? 100 : 1000000;
  return [sections[position.kind], position.page ?? 0, slotOrder, position.photoNumber ?? 0, position.text];
};

export const compareAlbumPositions = (left, right) => {
  const a = albumPositionSortKey(left);
  const b = albumPositionSortKey(right);
  for (let index = 0; index < a.length; index += 1) {
    if (a[index] === b[index]) continue;
    return typeof a[index] === 'number' ? a[index] - b[index] : a[index].localeCompare(b[index], 'zh-CN');
  }
  return 0;
};

// 同一页可以有多个照片；只填「第3页」或「整页」不足以断言位置重复。
// 封面/扉页可能有多个附件，亦不作为照片唯一位置。
export const albumPositionIdentity = (value) => {
  const position = parseAlbumPosition(value);
  if (position.kind !== 'page') return null;
  if (position.photoNumber !== null) return `page:${position.page}:${position.slot ? `slot:${position.slot}:` : ''}photo:${position.photoNumber}`;
  return position.slot !== null ? `page:${position.page}:slot:${position.slot}` : null;
};
