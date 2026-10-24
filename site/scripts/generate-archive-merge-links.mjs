import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {localeDefinitions,pathForLocale} from '../../shared/locale-config.mjs';
import {resolveArchiveMergeProjection} from '../../shared/archive-merge-projection.mjs';
import {serializeHtmlJson} from '../../shared/html-json.mjs';
const site=fileURLToPath(new URL('../',import.meta.url));
const source=await fs.readFile(path.join(site,'src/data/archive.ts'),'utf8');
const start=source.indexOf('export const archiveItems = '),end=source.lastIndexOf(' satisfies ArchiveItem[];');
if(start<0||end<start)throw new Error('公开档案生成源格式异常，不能生成旧号去向。');
const records=JSON.parse(source.slice(start+'export const archiveItems = '.length,end));
const projection=JSON.parse(await fs.readFile(path.join(site,'src/data/archive-merge-aliases.json'),'utf8'));
const aliases=resolveArchiveMergeProjection(records,projection);
const words={
 'zh-CN':['档案已合并','这件资料已整理到另一档案中，原编号继续保留去向。','查看当前档案','原第','页 → 现第','页'],
 en:['Record merged','This record is now part of another record. Its original identifier remains traceable.','View current record','Previous page ',' → current page ',''],
 th:['รวมระเบียนแล้ว','ระเบียนนี้รวมอยู่ในระเบียนอื่น โดยยังตรวจสอบหมายเลขเดิมได้','ดูระเบียนปัจจุบัน','หน้าเดิม ',' → หน้าปัจจุบัน ',''],
 ja:['資料を統合しました','この資料は別の資料に統合されました。旧番号から引き続き参照できます。','現在の資料を見る','旧ページ',' → 現在のページ',''],
 ko:['기록이 병합되었습니다','이 자료는 다른 기록에 통합되었으며 이전 번호로도 추적할 수 있습니다.','현재 기록 보기','이전 페이지 ',' → 현재 페이지 ',''],
 'zh-Hant':['檔案已合併','這件資料已整理到另一檔案中，原編號繼續保留去向。','查看目前檔案','原第','頁 → 現第','頁'],
};
let count=0;
for(const[sourceId,row]of Object.entries(aliases))for(const locale of localeDefinitions){
 const text=words[locale.locale],target=pathForLocale(`/archive/${row.targetId}/`,locale.locale),first=Object.values(row.images).find(index=>index!==null);
 const links=Object.entries(row.images).filter(([,index])=>index!==null).map(([old,index])=>`<li><a href="${target}#image-${index}">${text[3]}${old}${text[4]}${index}${text[5]}</a></li>`).join('');
 const absolute=process.env.PUBLIC_SITE_URL?new URL(target,process.env.PUBLIC_SITE_URL).href:null;
 const html=`<!doctype html><html lang="${locale.locale}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><meta name="robots" content="noindex, follow">${absolute?`<link rel="canonical" href="${absolute}">`:''}<title>${text[0]} · 老旧默片</title><style>body{max-width:46rem;margin:8vh auto;padding:1.5rem;background:#faf7ef;color:#403b31;font:1.1rem/1.8 system-ui}a{color:#65512e}li{margin:.6rem 0}code{overflow-wrap:anywhere}</style></head><body data-archive-merge-alias="${sourceId}"><main><h1>${text[0]}</h1><p>${text[1]}</p><p><code>${sourceId}</code> → <code>${row.targetId}</code></p><p><a data-current-archive href="${target}${first?'#image-'+first:''}">${text[2]}</a></p><ul>${links}</ul><p role="status" id="merge-link-status"></p></main><script type="application/json" id="merge-link-data">${serializeHtmlJson({sourceId,target,images:row.images,records:pathForLocale('/records.json',locale.locale)})}</script><script type="module" src="/archive-merge-link.js"></script></body></html>`;
 const output=path.join(site,'dist',...pathForLocale(`/archive/${sourceId}/`,locale.locale).split('/').filter(Boolean),'index.html');
 try{await fs.access(output);throw new Error('旧号页面与现有页面冲突，不能覆盖：'+sourceId);}catch(error){if(error.code!=='ENOENT')throw error;}
 await fs.mkdir(path.dirname(output),{recursive:true});await fs.writeFile(output,html);count++;
}
console.log(`合并旧号去向：${count}页；不计入档案件数和站点地图。`);
