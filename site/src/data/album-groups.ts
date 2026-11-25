import { createHash } from 'node:crypto';
import { archiveItems, type ArchiveItem } from './archive';
import { isPublishedArchiveItem } from './archive-view';
import { correspondenceIndex, curatedLetterAlbum } from '../../../shared/correspondence-topics.mjs';
export { curatedLetterAlbum };

export interface AlbumGroup {
  albumId: string;
  isCorrespondence: boolean;
  slug: string;
  href: string;
  members: ArchiveItem[];
  albums: ArchiveItem[];
  photos: ArchiveItem[];
  letters: ArchiveItem[];
}

// 照片主题选览与信件选览同理：按已公开标签归集，不代表另有一件实物相册。
export const curatedPhotoAlbums = [
  {
    id: 'LJM-CUR-SHANGHAI-VIEWS',
    tag: '上海旧影',
    title: '上海旧影',
    description: '本辑按“上海旧影”标签归集已公开的城市风景照片，画面里有上海大厦、大世界、工人文化宫、国际饭店、黄浦江畔、龙华塔、闵行一号路、少年宫、豫园九曲桥和中百公司。楼、桥和街道还站在纸面上，日子已经往前走了很远。这里是网站的主题选览，并非另有一件实物相册。',
  },
] as const;

/** 按相册编号找到对应的线上主题选览配置；实物相册返回 undefined。 */
export const curatedAlbumForId = (albumId: string | undefined) => {
  if (!albumId) return undefined;
  return correspondenceIndex.forId(albumId) ?? curatedPhotoAlbums.find((album) => album.id === albumId);
};

export const albumIdForItem = (item: ArchiveItem): string | undefined => {
  const physical = ['ALB', 'PHO'].includes(item.core.object_type);
  const physicalAlbumId = physical && normalizeAlbumId(item.core.album_id);
  if (physicalAlbumId) return physicalAlbumId;
  const topic = correspondenceIndex.forRecord(item);
  if (topic) return topic.id;
  if (!physical) return undefined;
  const tags = item.public_view.tags ?? [];
  return curatedPhotoAlbums.find((album) => tags.includes(album.tag))?.id;
};

// 编号是管理关系，不能直接作为文件路径。旧编号中的中文、空格或下划线仍可关联。
const normalizeAlbumId = (value: unknown): string | undefined => {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed && !/[\u0000-\u001f\u007f]/.test(trimmed) ? trimmed : undefined;
};
export const albumSlug = (albumId: string) => `a-${createHash('sha256').update(albumId.trim()).digest('hex')}`;
export const albumHref = (albumId: string) => `/albums/${albumSlug(albumId)}/`;

/** 只归集已公开的实体相册照片与指定标签的线上信件选览。 */
export const buildAlbumGroups = (items: ArchiveItem[]): AlbumGroup[] => {
  const groups = new Map<string, ArchiveItem[]>();
  for (const item of items) {
    if (!item?.core || !isPublishedArchiveItem(item)) continue;
    const albumId = albumIdForItem(item);
    if (!albumId) continue;
    const members = groups.get(albumId) ?? [];
    members.push(item);
    groups.set(albumId, members);
  }
  return [...groups].sort(([left], [right]) => left.localeCompare(right, 'zh-CN')).map(([albumId, entries]) => {
    // 以永久编号稳定排序，多个总册时保持可见并让维护检查提示，避免输入次序决定标题。
    const members = [...entries].sort((left, right) => left.core.item_id.localeCompare(right.core.item_id, 'en'));
    return {
      albumId, isCorrespondence: Boolean(correspondenceIndex.forId(albumId)), slug: albumSlug(albumId), href: albumHref(albumId), members,
      albums: members.filter((item) => item.core.object_type === 'ALB'),
      photos: members.filter((item) => item.core.object_type === 'PHO'),
      letters: members.filter((item) => item.core.object_type === 'LET'),
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
