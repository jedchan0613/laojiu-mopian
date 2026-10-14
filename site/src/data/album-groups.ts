import { createHash } from 'node:crypto';
import { archiveItems, type ArchiveItem } from './archive';
import { isPublishedArchiveItem } from './archive-view';

export interface AlbumGroup {
  albumId: string;
  slug: string;
  href: string;
  members: ArchiveItem[];
  albums: ArchiveItem[];
  photos: ArchiveItem[];
}

// 编号是管理关系，不能直接作为文件路径。旧编号中的中文、空格或下划线仍可关联。
const normalizeAlbumId = (value: unknown): string | undefined => {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed && !/[\u0000-\u001f\u007f]/.test(trimmed) ? trimmed : undefined;
};
export const albumSlug = (albumId: string) => `a-${createHash('sha256').update(albumId.trim()).digest('hex')}`;
export const albumHref = (albumId: string) => `/albums/${albumSlug(albumId)}/`;

/** 已公开照片/相册总档案的纯分组函数，不把私密、暂停、撤销或其他物件带入相册。 */
export const buildAlbumGroups = (items: ArchiveItem[]): AlbumGroup[] => {
  const groups = new Map<string, ArchiveItem[]>();
  for (const item of items) {
    if (!item?.core || !isPublishedArchiveItem(item) || !['ALB', 'PHO'].includes(item.core.object_type)) continue;
    const albumId = normalizeAlbumId(item.core.album_id);
    if (!albumId) continue;
    const members = groups.get(albumId) ?? [];
    members.push(item);
    groups.set(albumId, members);
  }
  return [...groups].sort(([left], [right]) => left.localeCompare(right, 'zh-CN')).map(([albumId, entries]) => {
    // 以永久编号稳定排序，多个总册时保持可见并让维护检查提示，避免输入次序决定标题。
    const members = [...entries].sort((left, right) => left.core.item_id.localeCompare(right.core.item_id, 'en'));
    return {
      albumId, slug: albumSlug(albumId), href: albumHref(albumId), members,
      albums: members.filter((item) => item.core.object_type === 'ALB'),
      photos: members.filter((item) => item.core.object_type === 'PHO'),
    };
  });
};
export const publishedAlbumGroups = (): AlbumGroup[] => buildAlbumGroups(archiveItems);
export const albumPhotoCount = (members: ArchiveItem[]) => members.filter((item) => item.core.object_type === 'PHO' && isPublishedArchiveItem(item)).length;

/** 仅汇总公开照片自己的年代，不将总册年代赋给照片，也不覆盖原字段。 */
export const albumDateSummary = (members: ArchiveItem[]) => {
  const photos = members.filter((item) => item.core.object_type === 'PHO' && isPublishedArchiveItem(item));
  const years: number[] = [];
  let unknownPhotoCount = 0;
  let uncertainPhotoCount = 0;
  for (const item of photos) {
    const dateText = [item.core.date_start, item.core.date_end, item.core.date_display].filter(Boolean).join(' ');
    const itemYears = [...dateText.matchAll(/(?<!\d)([12]\d{3})(?!\d)/g)].map((match) => Number(match[1]));
    for (const match of dateText.matchAll(/(?<!\d)([12]\d{2}0)\s*(?:年代|s\b)/g)) itemYears.push(Number(match[1]) + 9);
    for (const match of dateText.matchAll(/(\d{1,2})\s*世纪\s*(\d{2})\s*年代/g)) {
      const start = (Number(match[1]) - 1) * 100 + Number(match[2]);
      if (start >= 1000 && start <= 2990) itemYears.push(start, start + 9);
    }
    if (!itemYears.length) unknownPhotoCount += 1;
    else {
      years.push(...itemYears);
      if (/约|約|大概|前后|前後|年代|世纪|世紀|不详|不詳|未知|待考|circa|approx|\bca\.?\b|\d{4}s\b/i.test(dateText)) uncertainPhotoCount += 1;
    }
  }
  const knownYears = [...new Set(years)].sort((left, right) => left - right);
  const startYear = knownYears[0] ?? null;
  const endYear = knownYears.at(-1) ?? null;
  return {
    knownYears, startYear, endYear,
    range: startYear === null ? '' : startYear === endYear ? String(startYear) : `${startYear}—${endYear}`,
    datedPhotoCount: photos.length - unknownPhotoCount, unknownPhotoCount, uncertainPhotoCount,
    photoCount: photos.length,
  };
};
