// 公开投影只允许永久编号与图片位置；每次构建按当前有效公开记录重新解析。
const idPattern=/^LJM-\d{8}-[A-Z]{3}-\d{3}$/;
const namePattern=/^[-A-Za-z0-9_.]+\.(?:jpe?g|png|webp)$/i;
export function resolveArchiveMergeProjection(records,projection={schema_version:1,aliases:{}}){
  if(projection.schema_version!==1||!projection.aliases||typeof projection.aliases!=='object'||Array.isArray(projection.aliases))throw new Error('公开合并映射格式无效');
  const active=new Map(records.filter(r=>r.core?.record_status==='ACT'&&r.core.privacy_level==='G'&&r.core.use_status==='U3').map(r=>[r.core.item_id,r]));
  const result={};
  for(const[source,row]of Object.entries(projection.aliases)){
    if(!idPattern.test(source)||!idPattern.test(row.target_id??'')||source===row.target_id||!Array.isArray(row.images)||Object.keys(row).some(key=>!['target_id','images'].includes(key)))throw new Error('公开合并映射含未允许的字段');
    if(active.has(source))throw new Error('已合并旧号仍在公开记录中');
    const target=active.get(row.target_id);if(!target)continue;
    const images={};
    for(const image of row.images){
      if(!Number.isSafeInteger(image.source_position)||image.source_position<1||Object.keys(image).some(key=>!['source_position','target_filename'].includes(key))||Object.hasOwn(images,image.source_position)||image.target_filename!==null&&!namePattern.test(image.target_filename??''))throw new Error('公开合并页序映射无效');
      const index=image.target_filename===null?-1:target.core.publication_file_path.indexOf(`/archive/${row.target_id}/${image.target_filename}`);
      images[image.source_position]=index<0?null:index+1;
    }
    result[source]={targetId:row.target_id,images};
  }
  return result;
}

export const archiveSourceForRecords=records=>`import type { ArchiveItem } from './archive-schema';\n\n// 正式发布数据；不包含草稿、合并日志或账号信息。\nexport const archiveItems = ${JSON.stringify(records.filter(r=>r.core.record_status==='ACT'&&r.core.privacy_level==='G'&&r.core.use_status==='U3').sort((a,b)=>a.core.item_id.localeCompare(b.core.item_id)),null,'\t')} satisfies ArchiveItem[];\n\nexport type { ArchiveItem } from './archive-schema';\n`;
