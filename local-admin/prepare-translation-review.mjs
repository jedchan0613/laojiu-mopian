// 从私密一致性快照生成独立的待审核材料，不调用真实译文保存或发布入口。
import fs from 'node:fs/promises';import path from 'node:path';import {fileURLToPath} from 'node:url';
import {createTranslationReview} from './translation-review.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const [snapshotFile,outputDirectory,overrideFile]=process.argv.slice(2);
if(!snapshotFile||!outputDirectory)throw Error('用法：node local-admin/prepare-translation-review.mjs 私密快照.json outputs/新材料目录 [修订建议.json]');
const output=path.resolve(outputDirectory),outputs=await fs.realpath(path.join(root,'outputs'));
if(!output.startsWith(outputs+path.sep)||await fs.realpath(path.dirname(output))!==outputs)throw Error('复核材料只能写入outputs下新的独立私密目录');
const snapshot=JSON.parse(await fs.readFile(snapshotFile,'utf8')),overrides=overrideFile?JSON.parse(await fs.readFile(overrideFile,'utf8')):{},report=createTranslationReview(snapshot,overrides);
await fs.mkdir(output,{mode:0o700});
const save=(name,value)=>fs.writeFile(path.join(output,name),value,{flag:'wx',mode:0o600});
const quote=value=>JSON.stringify(value,null,2).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;');
const names={en:'英语',th:'泰语',ja:'日语',ko:'韩语','zh-Hant':'繁体中文'};
await save('review.json',JSON.stringify(report,null,2));
await save('source-version.json',JSON.stringify({created_at:snapshot.created_at,input_manifest_hash:snapshot.input_manifest_hash,public_count:snapshot.public_count},null,2));
for(const [locale,name]of Object.entries(names)){
 const packets=report.packets.filter(packet=>packet.locale===locale),lines=[`# ${name}逐字段待审核清单`,'','这些是未发布的修订建议。既有有效译文不改；“相同来源复用”仍需人工确认，不能视为已审核。',`快照：${snapshot.created_at}；公开档案：${snapshot.public_count}件。`,''];
 await fs.mkdir(path.join(output,locale),{mode:0o700});
 for(const packet of packets){
  await save(path.join(locale,packet.item_id+'.json'),JSON.stringify(packet,null,2));
  lines.push(`## ${packet.item_id}｜${packet.title}`,'',`优先级：${['首页精选','主要相册分件','其他档案'][packet.priority]}；当前正式译文：${packet.published_state}；已有人工草稿：${packet.has_existing_draft?'有，保留不覆盖':'无'}。`,'');
  for(const target of packet.targets){lines.push(`### ${target.key}（${target.reason}）`,'',`中文来源：${quote(target.source)}`,'',`旧译文：${quote(target.previous)}`,'',target.candidate?`待审建议：${quote(target.candidate.value)}（${target.candidate.method}）`:'待审建议：尚缺，需要人工翻译或判断；不使用中文冒充译文。','');if(target.uncertainty)lines.push('核对重点：必须保留年代/地点/人物关系等不确定性，不可把推测写成确定事实。','');if(target.blocked_candidate)lines.push('数字表达不同，候选已停止自动复用，需人工对照。','');}
  if(packet.removed_fields.length)lines.push(`已移除来源的旧字段：${packet.removed_fields.join('、')}；公开层已经自动排除，本材料不删除正式记录。`,'');
 }
 await save(locale+'.md',lines.join('\n'));
}
const missing=report.packets.flatMap(packet=>packet.targets.filter(target=>!target.candidate).map(target=>({item_id:packet.item_id,locale:packet.locale,key:target.key,source:target.source,previous:target.previous,blocked_candidate:target.blocked_candidate})));
await save('pending-fields.json',JSON.stringify(missing,null,2));
await save('README.md',[ '# 第⑤项私密复核材料','',`当前${snapshot.public_count}件公开档案，${report.summary.records}组“编号＋语言”，${report.summary.fields}个失效/缺失字段。已有${report.summary.candidates}个待审候选，${missing.length}个尚无候选；所有候选仍须人工审核。`, '', '所有JSON均为draft，不含人工确认或审核人；这些文件未写入真实译文目录，也不会直接进入网站。', '', ...Object.entries(names).map(([locale,name])=>`- [${name}逐字段对照](${locale}.md)`),'', '审核顺序：先首页精选，再相册分件；确认事实、不确定性、数字、地点和图片说明。已有人工草稿须先保留备份，不能整体覆盖。', '', '保存与发布：必须回到既有译文维护入口，保留有效字段并合并选定修订；不要直接把patch当完整API表单。保存前再次核对source_hash、每字段指纹、revision及store_sha256；变化即重做清单。人工逐项批准后才走现有审核发布/历史门禁，不能自动填confirmed_fields。', '', '相册是分件派生状态，不手工标全通过；英泰主题选览另有编辑审核待办。未经批准的页面继续原文回退、noindex及排除站点地图。', '', `来源一致性摘要：${snapshot.input_manifest_hash}`,''].join('\n'));
console.log(JSON.stringify({...report.summary,pending_fields:missing.length,output},null,2));
