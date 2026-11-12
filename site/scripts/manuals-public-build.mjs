import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {validateManualSearchIndex,safeManualSourceUrl} from '../../shared/manual-catalog.mjs';
import {buildManualBrowse} from '../../shared/manual-browse.mjs';

// 接入现有正式构建检查；正式产物绝不能携带本地演示、草稿或审核数据。
export async function checkManualsPublicBuild({distRoot,distFiles,htmlEntries,check}) {
  const files=new Set(distFiles.map(file=>path.relative(distRoot,file).split(path.sep).join('/')));
  check(![...files].some(file=>/(?:^|\/)(?:local-admin|manuals-private|manuals-history)(?:\/|$)/.test(file)||/^admin\/manuals(?:[.-]|\/)/.test(file)), '说明书私密维护文件混入公开产物。');
  check(![...files].some(file=>/(?:^|\/)(?:pdf-runtime|pdf-builds|submissions|mail-outbox)(?:\/|$)|(?:^|\/)source-[a-f0-9]{64}\.pdf$/i.test(file)), 'PDF源文件或私密处理目录混入公开产物。');
  for(const file of distFiles.filter(file=>/\.(?:html|js|json|css|txt|xml|svg|map)$/i.test(file))){const page=htmlEntries.find(p=>p.relativePath===path.relative(distRoot,file).split(path.sep).join('/'));let raw;try{raw=page?.html??await fs.readFile(file,'utf8');}catch{check(false,'PDF公开产物中的文件无法读取，不能完成隔离检查。');continue;}check(!/source-[a-f0-9]{64}\.pdf|TG-[A-F0-9]{24}|P[SG]-[a-f0-9]{24}|"(?:source_pdf_digest|manual_pdf_sources|manual_pdf_render_saved|manual_pdf_saved_operations)"\s*:/.test(raw),'PDF公开页面含私密来源或处理记录。');}
  check(![...files].some(file=>file.startsWith('manuals/')&&!/^(?:manuals\/(?:index|help\/index|contribute\/index|brands\/index|categories\/index)|manuals\/manual-[a-z0-9-]+\/index|manuals\/brands\/brand-[a-z0-9-]+\/index|manuals\/categories\/[a-z0-9-]+\/index)\.html$/.test(file)), '说明书目录混入了非公开页面文件。');
  const home=htmlEntries.find(p=>p.relativePath==='manuals/index.html');
  check(Boolean(home),'说明书库首页未生成。');
  check(files.has('manuals/help/index.html'),'说明书型号查找帮助未生成。');
  check(files.has('manuals/brands/index.html'),'说明书品牌目录未生成。');
  check(files.has('manuals/categories/index.html'),'说明书品类目录未生成。');
  check(files.has('manuals/contribute/index.html'),'说明书专用投稿页面未生成。');
  check(![...files].some(file=>file.startsWith('manuals-demo-pages/')||file.startsWith('manuals/demo-')),'正式构建混入说明书本地演示页面。');
  for(const file of distFiles.filter(file=>/\.(?:js|json)$/.test(file))){const raw=await fs.readFile(file,'utf8');check(!/demo-manual-\d|demo-model-\d|demo-brand-\d/.test(raw),'正式脚本或数据文件混入说明书虚构样例。');}
  const indexFiles=[...files].filter(file=>/^manuals-search\/[a-f0-9]{24}\.json$/.test(file));
  check(indexFiles.length===1,'说明书公开查询索引数量异常。');
  const indexed=new Map();let publicIndex=null;
  for(const file of indexFiles){
    const raw=await fs.readFile(path.join(distRoot,file),'utf8');
    check(file===`manuals-search/${createHash('sha256').update(raw).digest('hex').slice(0,24)}.json`,'说明书查询索引版本与内容不一致。');
    try{const index=validateManualSearchIndex(JSON.parse(raw));publicIndex=index;for(const doc of index.documents)indexed.set(doc.manual_key,doc);}catch{check(false,'说明书查询索引混入演示、私密字段或无效引用。');}
  }
  if(publicIndex){
    const browse=buildManualBrowse(publicIndex),expected=new Set([...browse.brands,...browse.categories].map(entry=>entry.path.slice(1)+'index.html'));
    const actual=[...files].filter(file=>/^manuals\/(?:brands|categories)\/[^/]+\/index\.html$/.test(file));
    for(const file of expected)check(files.has(file),'已收录品牌或品类缺少浏览页。');
    for(const file of actual)check(expected.has(file),'品牌或品类浏览页没有对应已审核资料。');
  }
  const detailPages=htmlEntries.filter(p=>/^manuals\/manual-[a-z0-9-]+\/index\.html$/.test(p.relativePath));
  check(detailPages.length===indexed.size,'说明书详情页与公开索引集合不一致。');
  for(const page of htmlEntries){
    for(const match of page.html.matchAll(/<a\b[^>]*href="(\/manuals\/[^"?#]*)/g)){
      const target=match[1].replace(/^\//,'').replace(/\/$/,'')+'/index.html';
      check(files.has(target),`${page.relativePath} 的说明书入口不存在。`);
    }
    if(!page.relativePath.startsWith('manuals/'))continue;
    if(page.relativePath==='manuals/contribute/index.html'){
      check(/<meta\b[^>]*name="robots"[^>]*content="noindex, nofollow"/.test(page.html),'说明书草稿填写页必须禁止搜索引擎收录。');
      check(!/<img\b[^>]*src=["']\/api\/account\//.test(page.html)&&!/TG-[A-F0-9]{24}|manual_page_receipts|manual_page_archive/.test(page.html),'说明书填写页不能预置私密草稿、图片或操作记录。');
    }
    check(!/\bdata-manual-demo(?:\s|=|>)/.test(page.html),`${page.relativePath} 混入演示标识。`);
    check(!/demo-manual-\d|demo-model-\d|demo-brand-\d/.test(page.html),`${page.relativePath} 混入演示资料。`);
    const head=page.html.split('</head>')[0];
    check(!/hreflang="(?:en|th|ja|ko|zh-Hant)"/.test(head),`${page.relativePath} 声明了未开发的说明书译文。`);
    check(!/href="\/(?:en|th|ja|ko|zh-hant)\/manuals(?:\/|["?])/.test(page.html),`${page.relativePath} 指向不存在的说明书译文。`);
  }
  if(home){
    const config=home.html.match(/id="manual-search-config"[^>]*>([\s\S]*?)<\/script>/)?.[1];
    try{const data=JSON.parse(config);check(data.demo===false&&files.has(data.url.slice(1)),'说明书首页索引配置指向演示或不存在的索引。');}catch{check(false,'说明书首页查询配置无效。');}
  }
  for(const page of detailPages){
    const id=page.relativePath.split('/')[1],doc=indexed.get(id);check(Boolean(doc),`${page.relativePath} 未列入公开索引。`);
    const reader=page.html.match(/id="manual-reader-data"[^>]*>([\s\S]*?)<\/script>/)?.[1];
    if(!reader){check(!doc?.has_reader,`${page.relativePath} 缺少已声明的阅读区。`);continue;}
    let data;try{data=JSON.parse(reader);}catch{check(false,`${page.relativePath} 的阅读数据无效。`);continue;}
    check(data.demo===false&&data.manual_key===id,`${page.relativePath} 的阅读数据不是正式公开资料。`);
    check(Boolean(doc?.has_reader)&&Array.isArray(data.pages)&&data.pages.length>0,`${page.relativePath} 的阅读页数与索引不一致。`);
    for(const entry of data.pages??[]){
      const valid=/^LJM-\d{8}-(?:OTH|RPR)-\d{3}$/.test(data.archive_id)&&typeof entry.src==='string'&&entry.src.startsWith(`/archive/${data.archive_id}/`)&&/^\/archive\/LJM-\d{8}-(?:OTH|RPR)-\d{3}\/[a-zA-Z0-9_-]+\.(?:jpe?g|png|webp)$/.test(entry.src);
      check(valid,`${page.relativePath} 的阅读页引用不是本档案发布副本。`);
      if(valid)check(files.has(entry.src.slice(1)),`${page.relativePath} 的阅读图片不存在。`);
    }
    check(page.html.includes('data-reader-download')===(data.can_download===true),`${page.relativePath} 的下载入口与公开策略不一致。`);
  }
  // 只检查标为官方来源的链接，站内导航和全站社交入口继续由原有规则处理。
  for(const page of detailPages)for(const tag of page.html.match(/<a\b[^>]*data-manual-official\b[^>]*>/g)??[]){
    const href=tag.match(/href="([^"]*)"/)?.[1]?.replaceAll('&amp;','&');
    check(Boolean(safeManualSourceUrl(href)),`${page.relativePath} 含不安全的官方来源地址。`);
    check(/target="_blank"/.test(tag)&&/rel="[^"]*noopener/.test(tag)&&/rel="[^"]*noreferrer/.test(tag),`${page.relativePath} 的外站入口缺少隔离设置。`);
  }
}
