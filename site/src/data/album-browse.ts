import type { ArchiveItem } from './archive';
import { buildAlbumGroups, albumDateSummary } from './album-groups';
import { createArchiveRecordView } from './archive-view';
import { t, type Locale } from '../i18n/ui';

/** 标题、封面与数量只从公开分组生成；未公开的总册不能提供任何展示信息。 */
export const createAlbumBrowseViews = (items: ArchiveItem[], locale: Locale) =>
  buildAlbumGroups(items).map((group) => {
    const albumView = group.albums[0] ? createArchiveRecordView(group.albums[0], locale) : undefined;
    const memberViews = group.members.map((item) => createArchiveRecordView(item, locale));
    const photoViews = memberViews.filter((view) => view.objectType === 'PHO');
    const coverView = albumView?.images[0] ? albumView : memberViews.find((view) => view.images[0]);
    return {
      slug: group.slug,
      href: group.href,
      title: albumView?.title || t('相册 {0}', locale, { 0: group.albumId }),
      description: albumView?.description || '',
      coverPath: coverView?.images[0],
      coverDescription: coverView?.imageDescriptions[0],
      memberIds: group.members.map((item) => item.core.item_id),
      recordCount: group.members.length,
      photoCount: photoViews.length,
      imageCount: photoViews.reduce((count, view) => count + view.images.length, 0),
      dateSummary: albumDateSummary(group.members),
      hasAlbumRecord: Boolean(albumView),
    };
  });

export type AlbumBrowseView = ReturnType<typeof createAlbumBrowseViews>[number];
