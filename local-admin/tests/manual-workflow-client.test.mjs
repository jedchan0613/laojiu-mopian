// 用节点自带的隔离脚本环境检查客户端状态，不安装浏览器或测试依赖。
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {Script} from 'node:vm';
import {stripTypeScriptTypes} from 'node:module';
import {webcrypto} from 'node:crypto';
import {setImmediate as tick} from 'node:timers/promises';
import {manualConsentVersion,manualConsentStatements,manualSubmissionLabel,manualSubmissionProblems} from '../../shared/manual-workflow.mjs';

const source=await fs.readFile(new URL('../../site/src/scripts/manual-workflow.ts',import.meta.url),'utf8');
const script=new Script(stripTypeScriptTypes(source.replace(/^import .*;\r?\n/gm,'').replace(/^export /gm,'')),{filename:'manual-workflow.ts'});
class Element {
  constructor(tag='div'){this.tagName=tag;this.hidden=false;this.disabled=false;this.checked=false;this.dataset={};this.children=[];this.listeners={};this.value='';this.textContent='';}
  append(...children){this.children.push(...children);if(this.tagName==='select'&&!this.value)this.value=children[0]?.value??'';}
  replaceChildren(...children){this.children=[];this.value='';this.append(...children);}
  addEventListener(type,listener){(this.listeners[type]??=[]).push(listener);}
  emit(type){for(const listener of this.listeners[type]??[])listener({target:this});}
  click(){if(!this.disabled&&!this.hidden)this.emit('click');}
  scrollIntoView(){}
}
const metadata={schema_version:1,brand_name:'客户端合成品牌',model_texts:['CLIENT-TEST'],category_key:'tools',document_kind:'user-guide',languages:['en'],completeness:'complete',source_note:'自制合成测试',rights_basis:'own-work',sharing_scope:'reading-copy',people:'none',attribution:'anonymous'};
const record=(revision=3)=>({id:'TG-AAAAAAAAAAAAAAAAAAAAAAAA',submission_kind:'manual',revision,status:'draft',manual_metadata:metadata,images:[{filename:'synthetic.jpg'}],history:[],versions:[]});
const failure=status=>Object.assign(new Error('合成接口失败'),{status});
async function settle(condition){for(let count=0;count<30;count++){if(condition())return;await tick();}assert(condition(),'客户端操作没有到达预期状态');}
function controller({api=async()=>{throw new Error('unexpected request');}}={}){
  const elements=new Map(),checks=Object.keys(manualConsentStatements).map(key=>Object.assign(new Element('input'),{dataset:{manualConsent:key}}));
  const el=id=>{if(!elements.has(id))elements.set(id,new Element(id==='manual-workflow-version'?'select':'div'));return elements.get(id);};
  const document={getElementById:el,querySelectorAll:()=>checks,createElement:tag=>new Element(tag)};
  const context={document,crypto:webcrypto,manualConsentVersion,manualConsentStatements,manualSubmissionLabel,manualSubmissionProblems,
    accountFetch:api,setStatus:(element,text)=>{element.textContent=text;},renderManualMetadata:(body,data)=>{body.textContent=data.brand_name;},setTimeout,clearTimeout,AbortController};
  script.runInNewContext(context);let locked=false,accepted=null;
  const flow=context.createManualWorkflow({busy:()=>false,dirty:()=>false,ensureOwner:async()=>{},accept:value=>{accepted=value;},lock:value=>{locked=value;},unauthorized:()=>{},previewVersion:()=>{},previewCurrent:()=>{},refresh:()=>{}});
  flow.load(record(),true,false);
  return {flow,el,checks,get locked(){return locked;},get accepted(){return accepted;},consent(){for(const check of checks){check.checked=true;check.emit('change');}}};
}

test('响应未知后发现其他窗口已更新且无回执，应解除重试锁，允许用户读取新版',async()=>{
  let posts=0;
  const c=controller({api:async(path,options={})=>{
    if(options.method==='POST'){posts++;throw failure(posts===1?500:409);}
    if(path.includes('/operations/'))return {id:record().id,operation_id:path.split('/').at(-1),applied:false,revision:4,status:'draft'};
    throw new Error('不应覆盖本页内容');
  }});
  c.consent();c.el('manual-workflow-submit').click();await settle(()=>c.flow.hasUnsaved()&&c.el('manual-workflow-retry').hidden===false);
  c.el('manual-workflow-retry').click();await settle(()=>!c.el('manual-workflow-retry').disabled);
  assert.equal(c.flow.canReload(),true,'无回执且版本已更新后，不应要求用户无休止重试');
  assert.equal(c.locked,false);assert.equal(c.accepted,null);assert.equal(posts,1,'不能重发已过期的操作');assert.match(c.el('manual-workflow-status').textContent,/刷新状态/);
});

test('原操作仍在处理中时保留重试，取得回执后只读取结果，不再提交',async()=>{
  let posts=0,receipts=0;const submitted={...record(4),status:'pending'};
  const c=controller({api:async(path,options={})=>{
    if(options.method==='POST'){posts++;throw failure(posts===1?500:409);}
    if(path.includes('/operations/'))return {id:record().id,operation_id:path.split('/').at(-1),applied:++receipts>1,revision:receipts>1?4:3,status:receipts>1?'pending':'draft'};
    return submitted;
  }});
  c.consent();c.el('manual-workflow-submit').click();await settle(()=>!c.el('manual-workflow-retry').hidden);
  c.el('manual-workflow-retry').click();await settle(()=>!c.el('manual-workflow-retry').hidden&&!c.el('manual-workflow-retry').disabled);
  assert.equal(c.flow.canReload(),false);
  c.el('manual-workflow-retry').click();await settle(()=>c.accepted!==null);assert.equal(c.accepted.status,'pending');assert.equal(posts,2);assert.equal(c.flow.canReload(),true);
});

test('切换历史记录后，不得把上一版展开的信息当作新选中的版本',()=>{
  const c=controller(),old={revision:4,at:'2026-11-10T00:00:00Z',manual_metadata:{...metadata,brand_name:'旧版品牌'},images:[]},latest={...old,revision:7,manual_metadata:{...metadata,brand_name:'新版品牌'}};
  c.flow.load({...record(7),status:'pending',versions:[old,latest]},true,false);
  c.el('manual-workflow-version').value='4';c.el('manual-workflow-version').emit('change');c.el('manual-workflow-view-version').click();
  assert.equal(c.el('manual-workflow-version-preview').hidden,false);assert.equal(c.el('manual-workflow-version-metadata').textContent,'旧版品牌');
  c.el('manual-workflow-version').value='7';c.el('manual-workflow-version').emit('change');assert.equal(c.el('manual-workflow-version-preview').hidden,true,'切换时应收起旧信息，避免错认版本');
  c.el('manual-workflow-view-version').click();assert.equal(c.el('manual-workflow-version-metadata').textContent,'新版品牌');
});

test('草稿提供可恢复的停止入口，发送当前保存版本并禁止重复操作',async()=>{
  let body;
  const c=controller({api:async(_path,options={})=>{if(options.method==='POST'){body=options.body;return {id:record().id,operation_id:body.operation_id};}return {...record(4),status:'withdrawn'};}});
  assert.equal(c.el('manual-workflow-discard').hidden,false);c.el('manual-workflow-discard').click();await settle(()=>c.accepted!==null);
  assert.equal(body.action,'discard');assert.equal(body.revision,3);assert.equal(c.accepted.status,'withdrawn');
});
