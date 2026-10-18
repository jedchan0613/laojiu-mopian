import {clientText as ct} from '../i18n/client';
export interface ArchiveCardData {
 description:string; date:string; place:string; tags:string[];
 image?:{src:string;srcset?:string;width:number;height:number;alt:string};
}
// 只创建当前页的卡片；文字一律使用textContent，不解析档案HTML。
export function showArchiveCard(entry:HTMLElement,data:ArchiveCardData|undefined,expanded:boolean){
 const link=entry.querySelector<HTMLAnchorElement>('[data-archive-entry]');if(!link||!data)return;
 if(!expanded){if(entry.dataset.cardExpanded!=='true')return;link.replaceChildren();link.className='archive-entry archive-entry--compact';link.textContent=entry.dataset.archiveTitle??'';delete entry.dataset.cardExpanded;return;}
 if(entry.dataset.cardExpanded==='true')return;
 const scope=entry.getAttributeNames().filter(name=>name.startsWith('data-astro-cid-'));
 const element=(tag:string,className='',text?:string,highlight=false)=>{const node=document.createElement(tag);for(const name of scope)node.setAttribute(name,'');if(className)node.className=className;if(text!==undefined)node.textContent=text;if(highlight)node.dataset.searchHighlight='';return node;};
 const figure=element('figure','archive-image');
 if(data.image){const image=element('img') as HTMLImageElement;image.src=data.image.src;if(data.image.srcset)image.srcset=data.image.srcset;image.sizes='(max-width: 700px) calc(100vw - 32px), 400px';image.width=data.image.width;image.height=data.image.height;image.alt=data.image.alt;image.loading='lazy';image.decoding='async';figure.append(image);}
 const info=element('div','archive-information');info.append(element('h2','',entry.dataset.archiveTitle??'',true));
 if(data.description)info.append(element('p','archive-description',data.description,true));
 const facts=element('dl','archive-facts');
 for(const [label,value]of [[ct('类型'),entry.dataset.archiveTypeLabel??''],[ct('年代'),data.date],[ct('地点'),data.place]]){const row=element('div');row.append(element('dt','',label),element('dd','',value,true));facts.append(row);}info.append(facts);
 const tags=element('ul','archive-tags');tags.setAttribute('aria-label',ct('标签'));for(const tag of data.tags)tags.append(element('li','',tag,true));info.append(tags);
 const reason=element('p','archive-match-reason');reason.dataset.matchReason='';reason.hidden=true;info.append(reason);
 const action=element('span','archive-entry-action',ct('查看档案 →'));action.setAttribute('aria-hidden','true');info.append(action);
 link.className='archive-entry';link.replaceChildren(figure,info);entry.dataset.cardExpanded='true';
}
