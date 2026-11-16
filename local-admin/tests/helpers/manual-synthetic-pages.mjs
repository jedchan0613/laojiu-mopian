// 测试专用：固定16x24合成色块JPEG，不依赖sharp/PDF工具，不读取任何真实图片。
import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';

export const syntheticManualJpeg=Buffer.from('/9j/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAYABADASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAf/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFgEBAQEAAAAAAAAAAAAAAAAAAAID/8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAwDAQACEQMRAD8ArIDBYAD/2Q==','base64');
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
export const syntheticManualMetadata={schema_version:1,brand_name:'8.4隔离合成品牌',model_texts:['SYNTHETIC-84'],product_name:'合成测试物件',category_key:'tools',document_kind:'user-guide',languages:['zh-CN'],completeness:'complete',region_display:'地区未注明',edition_display:'合成第一版',source_note:'固定色块合成资料，仅用于隔离验收',rights_basis:'own-work',sharing_scope:'reading-copy',people:'none',attribution:'anonymous'};

// 仅建立已经筛选的测试私密页图；上传解码器由原有回归单独验证。
// 后续必须照常调用真实提交、审核、交接和发布门禁。
export async function seedSyntheticManualPages({submissionRoot,id,pages=3}){
  if(!/^TG-[A-F0-9]{24}$/.test(id)||!Number.isInteger(pages)||pages<1||pages>200)throw new Error('合成页参数无效');
  const root=path.resolve(submissionRoot),directory=path.join(root,id),file=path.join(directory,'record.json'),record=JSON.parse(await fs.readFile(file));
  if(record.id!==id||record.submission_kind!=='manual'||record.status!=='draft'||record.images.length||record.manual_handoff)throw new Error('只允许给全新合成说明书草稿建立测试页面');
  const images=[];
  for(let index=0;index<pages;index++){
    const tag=hash(Buffer.from(id+':synthetic-page:'+index)),filename='manual-'+tag+'.jpg';
    await fs.writeFile(path.join(directory,filename),syntheticManualJpeg,{flag:'wx',mode:0o600});
    images.push({filename,original_name:'synthetic-screened-'+(index+1)+'.jpg',bytes:syntheticManualJpeg.length,page_id:'MP-'+tag.slice(0,24),label:index===0?'封面':String(index),note:''});
  }
  Object.assign(record,{images,revision:record.revision+pages,updated_at:new Date().toISOString(),history:[...record.history,{at:new Date().toISOString(),action:'synthetic_test_pages_seeded',pages}]});
  await fs.writeFile(file,JSON.stringify(record,null,2),{mode:0o600});
  return record;
}
