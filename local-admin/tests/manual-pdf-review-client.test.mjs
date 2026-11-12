// Node内置VM验证真实前端脚本的确认与回执行为，不添加开发依赖。
import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs/promises';import {Script} from 'node:vm';import {stripTypeScriptTypes} from 'node:module';import {webcrypto} from 'node:crypto';import {setImmediate as tick} from 'node:timers/promises';
import {manualConsentVersion,manualConsentStatements,manualSubmissionLabel,manualSubmissionProblems} from '../../shared/manual-workflow.mjs';
import {isManualPdfReading,manualPdfConfirmationVersion,manualPdfConsentStatements} from '../../shared/manual-pdf-review.mjs';
const compile=async file=>new Script(stripTypeScriptTypes((await fs.readFile(new URL('../../site/src/scripts/'+file,import.meta.url),'utf8')).replace(/^import .*;\r?\n/gm,'').replace(/^export /gm,'')));
const workflowScript=await compile('manual-workflow.ts'),labelScript=await compile('manual-pdf-labels.ts');
class Element{hidden=false;disabled=false;checked=false;dataset={};children=[];listeners={};value='';textContent='';constructor(tag='div'){this.tagName=tag;}append(...v){this.children.push(...v);if(this.tagName==='select'&&!this.value)this.value=v[0]?.value??'';}replaceChildren(...v){this.children=[];this.value='';this.append(...v);}addEventListener(name,fn){(this.listeners[name]??=[]).push(fn);}emit(name){for(const fn of this.listeners[name]??[])fn({target:this});}click(){if(!this.hidden&&!this.disabled)this.emit('click');}scrollIntoView(){}}
const metadata={schema_version:1,brand_name:'合成客户端品牌',model_texts:['SYNTHETIC-CLIENT-64'],category_key:'tools',document_kind:'user-guide',languages:['zh-CN'],completeness:'complete',source_note:'合成私密客户端测试',rights_basis:'own-work',sharing_scope:'reading-copy',people:'none',attribution:'anonymous'};
const id='TG-AAAAAAAAAAAAAAAAAAAAAAAA',book=(revision=4)=>({id,submission_kind:'manual',source_format:'pdf',status:'draft',revision,manual_metadata:metadata,images:[{page_id:'MP-'+('a'.repeat(24)),filename:'manual-'+('a'.repeat(64))+'.jpg',source_page:1,label:'',note:''}],history:[],versions:[],manual_pdf_review:{can_submit:true,labels_enabled:true,confirmation_token:'b'.repeat(64),problems:[]}});
async function settle(check){for(let n=0;n<100;n++){if(check())return;await tick();}assert(check(),'Client did not reach expected state');}
function surface(){const elements=new Map(),el=id=>{if(!elements.has(id))elements.set(id,new Element(id.includes('version')||id==='manual-pdf-label-page'?'select':'div'));return elements.get(id);};return {el,document:{getElementById:el,createElement:tag=>new Element(tag)},elements};}
function workflow({api=async()=>{throw new Error('unexpected request');}}={}){
  const s=surface(),checks=Object.keys(manualConsentStatements).map(key=>Object.assign(new Element('input'),{dataset:{manualConsent:key}})),pdfChecks=Object.keys(manualPdfConsentStatements).map(key=>Object.assign(new Element('input'),{dataset:{manualPdfConsent:key}}));
  s.document.querySelectorAll=selector=>selector==='[data-manual-consent]'?checks:selector==='[data-manual-pdf-consent]'?pdfChecks:[];
  const context={document:s.document,crypto:webcrypto,manualConsentVersion,manualConsentStatements,manualSubmissionLabel,manualSubmissionProblems,isManualPdfReading,manualPdfConfirmationVersion,manualPdfConsentStatements,accountFetch:api,setStatus:(element,text)=>{element.textContent=text;},renderManualMetadata:(el,m)=>{el.textContent=m.brand_name;},setTimeout,clearTimeout,AbortController};workflowScript.runInNewContext(context);let accepted=null,locked=false;
  const flow=context.createManualWorkflow({busy:()=>false,dirty:()=>false,ensureOwner:async()=>{},accept:value=>{accepted=value;flow.load(value,true,false,true);},lock:value=>{locked=value;},unauthorized:()=>{},previewVersion:()=>{},previewCurrent:()=>{},refresh:()=>{}});flow.load(book(),true,false,true);
  const consent=(items=[...checks,...pdfChecks])=>{for(const c of items){c.checked=true;c.emit('change');}};
  return {...s,checks,pdfChecks,flow,consent,get accepted(){return accepted;},get locked(){return locked;}};
}
test('PDF需要7项投稿确认，提交携带当前整册绑定；保存后确认全部重置',async()=>{
  let body=null;const c=workflow({api:async(route,options={})=>{if(options.method==='POST'){body=options.body;return {id,operation_id:body.operation_id};}return {...book(5),status:'pending'};}});
  assert(c.el('manual-workflow-submit').disabled);assert([...c.checks,...c.pdfChecks].every(x=>!x.checked));c.consent(c.checks);assert(c.el('manual-workflow-submit').disabled);c.consent(c.pdfChecks);assert(!c.el('manual-workflow-submit').disabled);c.el('manual-workflow-submit').click();await settle(()=>c.accepted);
  assert.equal(body.pdf_confirmation.token,'b'.repeat(64));assert.equal(body.pdf_confirmation.version,manualPdfConfirmationVersion);assert(Object.values(body.pdf_confirmation.checks).every(Boolean));assert([...c.checks,...c.pdfChecks].every(x=>!x.checked));
  c.flow.load({...book(6),manual_pdf_review:{...book().manual_pdf_review,confirmation_token:'c'.repeat(64)}},true,false,true);assert(c.el('manual-workflow-submit').disabled);
});
test('整册未就绪或服务未开放时不能送审；官网线索不携带PDF整册确认',async()=>{
  let body=null;const c=workflow({api:async(route,options={})=>{if(options.method==='POST'){body=options.body;return {id,operation_id:body.operation_id};}return {...book(5),status:'pending'};}});
  c.flow.load({...book(),manual_pdf_review:{can_submit:false,problems:['请重新生成当前PDF']}},true,false,true);assert(c.checks.every(x=>x.disabled));c.consent();assert(c.el('manual-workflow-submit').disabled);
  c.flow.load(book(),true,false,false);c.consent();assert(c.el('manual-workflow-submit').disabled);
  const official={...book(),manual_metadata:{...metadata,sharing_scope:'official-link',rights_basis:'official-link',official_url:'https://example.com/support/synthetic.pdf'},images:[],manual_pdf_review:{can_submit:true,problems:[],official_only:true}};c.flow.load(official,true,false,true);assert(c.el('manual-workflow-pdf-confirmations').hidden);c.consent(c.checks);c.el('manual-workflow-submit').click();await settle(()=>body);assert.equal(body.pdf_confirmation,undefined);
});
test('PDF送审丢失响应后只查询原回执并读取结果，不重复提交',async()=>{
  let posts=0,operation=null;const calls=[];const c=workflow({api:async(route,options={})=>{calls.push(route);if(options.method==='POST'){posts++;operation=options.body.operation_id;throw new Error('synthetic lost response');}if(route.includes('/operations/'))return {id,operation_id:operation,applied:true,revision:5};return {...book(5),status:'pending'};}});
  c.consent();c.el('manual-workflow-submit').click();await settle(()=>!c.el('manual-workflow-retry').hidden&&!c.el('manual-workflow-retry').disabled);assert(c.locked);c.el('manual-workflow-retry').click();await settle(()=>c.accepted);assert.equal(posts,1);assert(calls[1].includes('/operations/'+operation));assert.equal(c.accepted.status,'pending');assert(!c.locked);
});
test('配置失效后明确提示旧审核失效，历史摘要不暴露源文件信息',()=>{
  const c=workflow(),r={...book(6),status:'approved',manual_pdf_review:{can_submit:false,problems:['处理配置已更新']},versions:[{revision:5,at:'2026-11-12T00:00:00Z',images:book().images,manual_metadata:metadata,source_format:'pdf',pdf_summary:{pages:1,profile:'standard'}}]};c.flow.load(r,true,false,true);assert(!c.el('manual-workflow-pdf-note').hidden);assert.match(c.el('manual-workflow-pdf-note').textContent,/旧PDF审核已失效/);c.el('manual-workflow-version').value='5';c.el('manual-workflow-view-version').click();assert(c.el('manual-workflow-version-metadata').children.some(x=>x.textContent.includes('PDF制作')));
});
function labels({lose=false,invalid=false,ownerFailure=false}={}){
  const s=surface();let r=book(),savedOperation='',posts=0,accepted=null,locked=false,unsavedWhenAccepted=null;const calls=[];
  const accountFetch=async(route,options={})=>{calls.push({route,method:options.method??'GET'});if(route.includes('/label-operations/'))return {id,operation_id:route.split('/').at(-1),applied:route.endsWith(savedOperation)&&Boolean(savedOperation),revision:r.revision};if(options.method==='POST'){posts++;if(invalid)throw Object.assign(new Error('页码过长'),{status:400});const p=options.body;savedOperation=p.operation_id;r={...r,revision:r.revision+1,images:r.images.map(image=>({...image,label:p.label,note:p.note}))};if(lose)throw new Error('synthetic lost response');return {id,operation_id:savedOperation};}return r;};
  const context={document:s.document,crypto:webcrypto,accountFetch,setStatus:(element,text)=>{element.textContent=text;},setTimeout,clearTimeout,AbortController};labelScript.runInNewContext(context);
  const flow=context.createManualPdfLabels({blocked:()=>false,dirty:()=>false,ensureOwner:async()=>{if(ownerFailure)throw new Error('账号已改变');},accept:value=>{unsavedWhenAccepted=flow.hasUnsaved();accepted=value;flow.load(value,true,false);},lock:value=>{locked=value;},unauthorized:()=>{}});flow.load(r,true,false);return {...s,flow,calls,get posts(){return posts;},get accepted(){return accepted;},get locked(){return locked;},get unsavedWhenAccepted(){return unsavedWhenAccepted;}};
}
test('PDF纸面页码保存先查询原回执，仅发送文字，未保存填写锁住其他任务',async()=>{
  const c=labels();c.el('manual-pdf-label-value').value='封面';c.el('manual-pdf-label-value').emit('input');assert(c.locked);assert(c.el('manual-pdf-label-page').disabled);c.el('manual-pdf-label-save').click();await settle(()=>c.accepted);assert.equal(c.posts,1);assert(c.calls[0].route.includes('/label-operations/'));assert.equal(c.accepted.images[0].label,'封面');assert.equal(c.unsavedWhenAccepted,false,'其他区域读取成功结果时，不能仍把页码保存视为未完成');assert(!c.flow.hasUnsaved());assert(!c.locked);
});
test('纸面页码保存丢响应保留本页，重试先查原回执且不重复写入',async()=>{
  const c=labels({lose:true});c.el('manual-pdf-label-note').value='合成本页说明';c.el('manual-pdf-label-note').emit('input');c.el('manual-pdf-label-save').click();await settle(()=>!c.el('manual-pdf-label-retry').hidden&&!c.el('manual-pdf-label-retry').disabled);assert(!c.flow.canReload());c.el('manual-pdf-label-retry').click();await settle(()=>c.accepted);assert.equal(c.posts,1);assert.equal(c.accepted.images[0].note,'合成本页说明');assert(!c.locked);
});
test('页码校验失败或账号改变后保留填写，可继续修改或放弃，不陷入回执死锁',async()=>{
  for(const options of [{invalid:true},{ownerFailure:true}]){const c=labels(options);c.el('manual-pdf-label-value').value='填写保留';c.el('manual-pdf-label-value').emit('input');c.el('manual-pdf-label-save').click();await settle(()=>!c.el('manual-pdf-label-reset').disabled);assert(c.flow.canReload());assert.equal(c.el('manual-pdf-label-value').value,'填写保留');assert.equal(c.posts,options.invalid?1:0);c.el('manual-pdf-label-reset').click();assert(!c.flow.hasUnsaved());assert(!c.locked);}
});
