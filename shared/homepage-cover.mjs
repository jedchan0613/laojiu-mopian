// 首页封面属于展示设置，不参与档案元数据、永久编号或详情页图片排序。
const itemIdPattern = /^LJM-\d{8}-[A-Z]{3}-\d{3}$/;
const imageFilenamePattern = /^[-A-Za-z0-9_]+[-A-Za-z0-9_.]*\.(?:jpe?g|png|webp)$/i;
const timestampPattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;

const imageBelongsTo = (image, itemId) => {
  if (typeof image !== 'string' || !itemIdPattern.test(itemId ?? '')) return false;
  const prefix = `/archive/${itemId}/`;
  return image.startsWith(prefix) && imageFilenamePattern.test(image.slice(prefix.length));
};

/** 只接受本件现有发布图片和服务端生成格式的有效时间；失效设置按自动选择处理。 */
export function getHomepageCover(record) {
  const cover = record?.public_view?.homepage_cover;
  if (!cover || typeof cover !== 'object' || Array.isArray(cover) ||
      Object.keys(cover).length !== 2 || Object.keys(cover).some(key => !['image', 'selected_at'].includes(key))) return undefined;
  if (!imageBelongsTo(cover.image, record?.core?.item_id) ||
      !Array.isArray(record?.core?.publication_file_path) || !record.core.publication_file_path.includes(cover.image)) return undefined;
  if (typeof cover.selected_at !== 'string' || !timestampPattern.test(cover.selected_at)) return undefined;
  const timestamp = Date.parse(cover.selected_at);
  if (!Number.isFinite(timestamp) || new Date(timestamp).toISOString() !== cover.selected_at) return undefined;
  return cover;
}

/**
 * 每类已有的完整度和时间排序保持不变；人工指定只覆盖本类首页封面。
 * @template {{id: string, images: string[], item: object}} T
 * @param {T[]} views 已经过公开条件过滤，并按原自动规则排序的同一分类档案。
 * @returns {{view: T, imageIndex: number, manual: boolean} | undefined}
 */
export function selectHomepageCover(views) {
  let selected;
  for (const view of views) {
    const cover = getHomepageCover(view.item);
    const imageIndex = cover ? view.images.indexOf(cover.image) : -1;
    if (imageIndex < 0) continue;
    if (!selected || cover.selected_at > selected.cover.selected_at ||
        cover.selected_at === selected.cover.selected_at && view.id < selected.view.id) selected = {view, imageIndex, cover};
  }
  if (selected) return {view: selected.view, imageIndex: selected.imageIndex, manual: true};
  const view = views[0];
  return view?.images[0] ? {view, imageIndex: 0, manual: false} : undefined;
}

/** 恢复或合并图片改名时按旧位置映射；被排除的图片清除设置，选择时间保持不变。 */
export function remapHomepageCover(record, previousPaths, nextPaths) {
  if (!record?.public_view || !Object.hasOwn(record.public_view, 'homepage_cover')) return;
  const cover = getHomepageCover({...record, core: {...record.core, publication_file_path: previousPaths}});
  const index = cover ? previousPaths.indexOf(cover.image) : -1;
  const image = index < 0 ? undefined : nextPaths[index];
  if (!cover || !imageBelongsTo(image, record.core.item_id)) delete record.public_view.homepage_cover;
  else record.public_view.homepage_cover = {image, selected_at: cover.selected_at};
}
