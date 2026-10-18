import {createHash} from 'node:crypto';
import {archiveItems} from './archive';
import {createArchiveRecordView,isPublishedArchiveItem} from './archive-view';
// 同一公开字段集合供六语言检索共用，不含草稿、私密元数据或额外转录。
export const archiveSearchJson=JSON.stringify(archiveItems.filter(isPublishedArchiveItem).map(item=>{
 const view=createArchiveRecordView(item,'zh-CN');return {id:view.id,fields:view.searchFields};
}));
export const archiveSearchVersion=createHash('sha256').update(archiveSearchJson).digest('hex').slice(0,24);
export const archiveSearchUrl=`/archive-search/${archiveSearchVersion}.json`;
