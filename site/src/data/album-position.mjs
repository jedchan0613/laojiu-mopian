// 公开相册与本地维护页使用同一份页序规则。模块内没有私密数据或管理功能。
export {
  parseAlbumPosition,
  albumPositionSortKey,
  compareAlbumPositions,
  albumPositionIdentity,
} from '../../../shared/album-position.mjs';
