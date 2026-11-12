import {safeManualReturn,manualPageFromHash} from '../../../shared/manual-catalog.mjs';

const detail=document.querySelector<HTMLElement>('[data-manual-detail]');
if(detail){
  const returnUrl=safeManualReturn(new URLSearchParams(location.search).get('return'));
  const back=detail.querySelector<HTMLAnchorElement>('[data-manual-back]')!;
  back.href=returnUrl;
  if(returnUrl.startsWith('/manuals/brands/'))back.textContent='← 返回品牌资料';
  else if(returnUrl.startsWith('/manuals/categories/'))back.textContent='← 返回品类资料';
  detail.querySelectorAll<HTMLAnchorElement>('[data-manual-related]').forEach(link=>{const url=new URL(link.href,location.origin);url.searchParams.set('return',returnUrl);link.href=url.pathname+url.search;});
  detail.querySelectorAll('[data-manual-demo-source]').forEach(button=>button.addEventListener('click',()=>{const note=detail.querySelector<HTMLElement>('[data-manual-demo-source-note]')!;note.hidden=false;note.scrollIntoView({block:'nearest',behavior:'smooth'});}));
}
const reader=document.querySelector<HTMLElement>('[data-manual-reader]');
if(reader){
  const data=JSON.parse(document.getElementById('manual-reader-data')!.textContent!);
  const valid=data&&typeof data.demo==='boolean'&&typeof data.manual_key==='string'&&Array.isArray(data.pages)&&data.pages.length>0&&data.pages.length<=2000&&data.pages.every((p:any)=>{
    if(!p||typeof p.src!=='string'||typeof p.label!=='string'||typeof p.alt!=='string'||!Number.isFinite(p.width)||!Number.isFinite(p.height)||p.width<=0||p.height<=0)return false;
    return data.demo?new RegExp(`^/manuals-demo-pages/${data.manual_key}/[1-9][0-9]*\\.svg$`).test(p.src):/^LJM-\d{8}-(?:OTH|RPR)-\d{3}$/.test(data.archive_id)&&p.src.startsWith(`/archive/${data.archive_id}/`)&&/^\/archive\/LJM-\d{8}-(?:OTH|RPR)-\d{3}\/[a-zA-Z0-9_-]+\.(?:jpe?g|png|webp)$/.test(p.src);
  });
  if(!valid)throw new Error('说明书阅读页序无法核对，已停止加载。');
  const image=reader.querySelector<HTMLImageElement>('[data-reader-image]')!;
  const previous=reader.querySelector<HTMLButtonElement>('[data-reader-previous]')!,next=reader.querySelector<HTMLButtonElement>('[data-reader-next]')!;
  const select=reader.querySelector<HTMLSelectElement>('[data-reader-page]')!,zoom=reader.querySelector<HTMLButtonElement>('[data-reader-zoom]')!;
  const status=reader.querySelector<HTMLElement>('[data-reader-status]')!,warning=reader.querySelector<HTMLElement>('[data-reader-warning]')!,error=reader.querySelector<HTMLElement>('[data-reader-error]')!,stage=reader.querySelector<HTMLElement>('[data-reader-stage]')!;
  const download=reader.querySelector<HTMLAnchorElement>('[data-reader-download]');
  const prefetched=new Set<string>();let page=1;
  function showError(){image.hidden=true;error.hidden=false;}
  image.addEventListener('error',showError);image.addEventListener('load',()=>{image.hidden=false;error.hidden=true;});
  function render(nextPage:number,writeHash=true){
    page=Math.max(1,Math.min(data.pages.length,nextPage));const entry=data.pages[page-1];
    previous.disabled=page===1;next.disabled=page===data.pages.length;select.value=String(page);
    status.textContent=`第 ${page} / ${data.pages.length} 张 · ${entry.label}`;
    image.hidden=false;error.hidden=true;image.width=entry.width;image.height=entry.height;image.alt=entry.alt;
    if(image.getAttribute('src')!==entry.src)image.src=entry.src;
    if(download&&data.can_download===true)download.href=entry.src;
    reader.querySelectorAll<HTMLAnchorElement>('[data-reader-toc-page]').forEach(link=>{if(Number(link.dataset.readerTocPage)===page)link.setAttribute('aria-current','page');else link.removeAttribute('aria-current');});
    if(writeHash)history.replaceState(history.state,'',location.pathname+location.search+`#page=${page}`);
    // 只预取紧邻的下一页，不创建整册图片列表或一次请求全部页面。
    const adjacent=data.pages[page];if(adjacent&&!prefetched.has(adjacent.src)){const preload=new Image();preload.src=adjacent.src;prefetched.add(adjacent.src);}
  }
  previous.addEventListener('click',()=>{warning.hidden=true;render(page-1);});next.addEventListener('click',()=>{warning.hidden=true;render(page+1);});
  select.addEventListener('change',()=>{warning.hidden=true;render(Number(select.value));});
  reader.querySelectorAll<HTMLAnchorElement>('[data-reader-toc-page]').forEach(link=>link.addEventListener('click',event=>{event.preventDefault();warning.hidden=true;render(Number(link.dataset.readerTocPage));}));
  zoom.addEventListener('click',()=>{const expanded=stage.classList.toggle('is-zoomed');zoom.setAttribute('aria-pressed',String(expanded));zoom.textContent=expanded?'还原显示':'放大页面';});
  reader.querySelector('[data-reader-retry]')!.addEventListener('click',()=>{error.hidden=true;image.hidden=false;const url=new URL(data.pages[page-1].src,location.origin);url.searchParams.set('retry',String(Date.now()));image.src=url.pathname+url.search;});
  function fromHash(){if(['#manual-reader','#main-content'].includes(location.hash)){warning.hidden=true;render(page,false);return;}const parsed=manualPageFromHash(location.hash,data.pages.length);warning.hidden=!parsed.invalid;warning.textContent=parsed.invalid?'页码无法识别，已回到第一页。':'';render(parsed.page,parsed.invalid);}
  // 开始阅读的区块锚点不属于页码错误，保持正常进入阅读区。
  if(location.hash==='#manual-reader')render(1,false);else fromHash();
  window.addEventListener('hashchange',fromHash);
  reader.querySelector<HTMLElement>('[data-reader-controls]')!.hidden=false;
  if(image.complete&&image.naturalWidth===0)showError();
}
