// 页面提示、noindex和语言替代链接必须使用同一个判定；不代替内容审核。
export const albumTranslationAvailable=(locale,{curated=false,memberStates=[]}={})=>locale==='zh-CN'||(
 !(curated&&['en','th'].includes(locale))&&memberStates.length>0&&memberStates.every(state=>state==='published')
);
