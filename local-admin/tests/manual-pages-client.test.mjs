// 验证真实客户端模块的断线恢复状态；仅使用Node内置隔离环境，不添加依赖。
import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs/promises';
import {Script} from 'node:vm';import {stripTypeScriptTypes} from 'node:module';import {webcrypto} from 'node:crypto';import {setImmediate as tick} from 'node:timers/promises';
import {manualPageLimits,manualPageIdPattern} from '../../shared/manual-pages.mjs';
import {manualSubmissionStates} from '../../shared/manual-workflow.mjs';
const source=await fs.readFile(new URL('../../site/src/scripts/manual-pages.ts',import.meta.url),'utf8');
const script=new Script(stripTypeScriptTypes(source.replace(/^import .*;\r?\n/gm,'').replace(/^export /gm,'')),{filename:'manual-pages.ts'});
class Element{
  hidden=false;disabled=false;checked=false;children=[];listeners={};value='';textContent='';files=[];dataset={};
  append(...items){this.children.push(...items);}replaceChildren(...items){this.children=[...items];}
  addEventListener(type,listener){(this.listeners[type]??=[]).push(listener);}emit(type){for(const fn of this.listeners[type]??[])fn({target:this});}
  click(){if(!this.hidden&&!this.disabled)this.emit('click');}querySelectorAll(){return [];}scrollIntoView(){}
}
const id='TG-AAAAAAAAAAAAAAAAAAAAAAAA',record=(revision=3,status='draft')=>({id,submission_kind:'manual',source_format:'images',revision,status,images:[]});
const failure=status=>Object.assign(new Error('合成接口暂不可用'),{status});
async function settle(check){for(let n=0;n<100;n++){if(check())return;await tick();}assert(check(),'客户端未到达预期状态');}
function controller(api){
  const elements=new Map(),el=id=>{if(!elements.has(id))elements.set(id,new Element());return elements.get(id);};el('manual-pages-reader').hidden=true;
  const context={document:{getElementById:el,createElement:()=>new Element()},crypto:webcrypto,accountFetch:api,manualPageLimits,manualPageIdPattern,manualSubmissionStates,FormData,AbortController,setTimeout,clearTimeout,setStatus:(element,text)=>{element.textContent=text;}};
  script.runInNewContext(context);let accepted=null,editor;const lockStates=[];
  editor=context.createManualPagesEditor({textBlocked:()=>false,textDirty:()=>false,ensureOwner:async()=>{},acceptRecord:data=>{accepted=data;},lockChanged:locked=>{lockStates.push({locked,canReload:editor?.canReload()??true});},unauthorized:()=>{}});
  editor.loadRecord(record(),true,false,true);
  return {editor,el,lockStates,get accepted(){return accepted;},start(){el('manual-pages-confirm').checked=true;el('manual-pages-confirm').emit('change');el('manual-pages-files').files=[new File(['synthetic image bytes'],'screened-audit.jpg',{type:'image/jpeg'})];el('manual-pages-files').emit('change');el('manual-pages-start').click();}};
}
test('图片响应未知且回执证明版本已更新时解除重试锁，不重发过期页面操作',async()=>{
  let posts=0;const c=controller(async(path,options={})=>{
    if(options.method==='POST'){posts++;throw failure(posts===1?500:409);}
    if(path.includes('/operations/'))return {id,operation_id:path.split('/').at(-1),applied:false,revision:4};
    throw new Error('不应自动覆盖本页队列');
  });
  c.start();await settle(()=>!c.el('manual-pages-retry').hidden);c.el('manual-pages-retry').click();await settle(()=>!c.el('manual-pages-retry').disabled);
  assert.equal(c.editor.canReload(),true);assert.equal(posts,1);assert.equal(c.accepted,null);assert.match(c.el('manual-pages-status').textContent,/读取最新状态/);
});
test('图片操作尚未确定时保留原凭证，回执成功后只读取结果，不重复上传',async()=>{
  let posts=0,receipts=0;const c=controller(async(path,options={})=>{
    if(options.method==='POST'){posts++;throw failure(posts===1?500:409);}
    if(path.includes('/operations/'))return {id,operation_id:path.split('/').at(-1),applied:++receipts>1,revision:receipts>1?4:3};
    return record(4,'pending');
  });
  c.start();await settle(()=>!c.el('manual-pages-retry').hidden);c.el('manual-pages-retry').click();await settle(()=>!c.el('manual-pages-retry').disabled);assert.equal(c.editor.canReload(),false);
  c.el('manual-pages-retry').click();await settle(()=>c.accepted!==null);assert.equal(posts,2);assert.equal(c.accepted.status,'pending');assert.equal(c.editor.canReload(),true);assert.match(c.el('manual-pages-status').textContent,/只读/);
});
test('图片回执的编号或操作凭证不匹配时保留待核对状态，不读取其他结果',async()=>{
  let posts=0;const c=controller(async(path,options={})=>{
    if(options.method==='POST'){posts++;throw failure(500);}
    if(path.includes('/operations/'))return {id:'TG-'+('B'.repeat(24)),operation_id:path.split('/').at(-1),applied:true,revision:4};
    return record(4);
  });
  c.start();await settle(()=>!c.el('manual-pages-retry').hidden);c.el('manual-pages-retry').click();await settle(()=>!c.el('manual-pages-retry').disabled);
  assert.equal(c.editor.canReload(),false);assert.equal(c.accepted,null);assert.equal(posts,1);
});
test('队列已锁定编辑时，进入未知保存结果仍应通知外层禁用重新读取按钮',async()=>{
  const c=controller(async()=>{throw failure(500);});c.start();await settle(()=>!c.el('manual-pages-retry').hidden);
  assert(c.lockStates.some(state=>state.canReload===false),'外层必须在回执待核对时同步禁用重新读取');
});
