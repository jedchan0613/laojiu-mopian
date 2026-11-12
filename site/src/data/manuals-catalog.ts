// 仅在Astro构建端/开发服务读取。浏览器只导入公开索引和当前详情的阅读页序。
import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {archiveItems} from './archive';
import {getResponsiveImage} from './responsive-images';
import {projectManualCatalog,manualSearchProjection} from '../../../shared/manual-catalog.mjs';
import {buildManualBrowse} from '../../../shared/manual-browse.mjs';

export const manualsDemo=process.env.LJM_MANUALS_DEMO==='1';
if(manualsDemo&&!import.meta.env.DEV)throw new Error('说明书演示资料仅允许在本机开发模式加载，正式构建已停止。请移除LJM_MANUALS_DEMO后重试。');
const empty={schema_version:1,brands:[],models:[],documents:[]};
const dataFile=manualsDemo?path.resolve(process.cwd(),'../samples/manuals-demo/catalog.json'):path.resolve(process.cwd(),'src/data/generated/manuals-catalog.json');
let source=empty;
try{source=JSON.parse(await fs.readFile(dataFile,'utf8'));}catch(error){if(manualsDemo||(error as NodeJS.ErrnoException).code!=='ENOENT')throw error;}
export const manualsCatalog=projectManualCatalog(source,archiveItems,{allowDemo:manualsDemo});
for(const document of manualsCatalog.documents){
  document.pages=document.pages.map(page=>{
    if(manualsDemo)return {...page,width:1200,height:1600,srcset:''};
    const image=getResponsiveImage(page.src);
    return {...page,width:image.width,height:image.height,srcset:image.srcset??''};
  });
}
export const manualsSearchJson=JSON.stringify(manualSearchProjection(manualsCatalog));
export const manualsBrowse=buildManualBrowse(manualsCatalog);
export const manualsSearchVersion=createHash('sha256').update(manualsSearchJson).digest('hex').slice(0,24);
export const manualsSearchUrl=`/manuals-search/${manualsSearchVersion}.json`;
export const manualsChineseOnly={en:false,th:false,ja:false,ko:false,'zh-Hant':false};

export function demoManualPageSvg(manualKey:string,page:number){
  if(!manualsDemo)throw new Error('本地演示未开启');
  const doc=manualsCatalog.documents.find(d=>d.manual_key===manualKey);
  if(!doc||!Number.isInteger(page)||page<1||page>doc.pages.length)throw new Error('不存在的演示页');
  const model=manualsCatalog.models.find(m=>m.model_key===doc.model_keys[0]);
  const xml=(v:unknown)=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]!));
  const label=doc.pages[page-1].label;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="1600" viewBox="0 0 1200 1600" role="img" aria-label="虚构说明书版面"><rect width="1200" height="1600" fill="#faf7ef"/><g fill="#2c2823" font-family="sans-serif"><text x="110" y="155" font-size="28" fill="#9a3f2e">本地演示 · 非真实产品资料</text><text x="110" y="350" font-size="65">${xml(label)}</text><text x="110" y="455" font-size="55">${xml(model?.model_text)}</text><path d="M110 550H1090M110 600H1090M110 650H870M110 700H1090" stroke="#c4b9a1" stroke-width="2"/><text x="110" y="920" font-size="32">这是用于检验翻页与清晰度的版面示意。</text><text x="110" y="990" font-size="32">不含真实设备操作步骤，不用于实际操作。</text><text x="110" y="1470" font-size="26" fill="#656056">第${page}张 · ${xml(label)}</text></g></svg>`;
}
