// 仅迁移已核实的019六语言固定跳转；其他Caddy内容逐字保留。
const escape=value=>value.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
export function removeLegacy019Redirects(text){
 const prefixes=['','/en','/th','/ja','/ko','/zh-hant'];let output=text,count=0;
 for(const[prefixIndex,prefix]of prefixes.entries()){
  const name='ljm_merge_019_'+prefixIndex,old=prefix+'/archive/LJM-20260910-LET-019',target=prefix+'/archive/LJM-20260910-LET-020/#image-2';
  const pattern=new RegExp('^[ \\t]*@'+name+' \\{\\r?\\n[ \\t]*host laojiumopian\\.com\\r?\\n[ \\t]*method GET HEAD\\r?\\n[ \\t]*path '+escape(old)+' '+escape(old+'/')+'\\r?\\n[ \\t]*\\}\\r?\\n[ \\t]*redir @'+name+' "'+escape(target)+'" 302\\r?\\n','gm');
  const matches=[...output.matchAll(pattern)];if(matches.length>1)throw Error('旧跳转规则重复，未迁移。');if(matches.length){count++;output=output.replace(pattern,'');}
 }
 if(count!==0&&count!==6||/@ljm_merge_019_/.test(output))throw Error('旧跳转规则与核对样本不同，未迁移。');
 return{changed:count===6,text:output,count};
}
