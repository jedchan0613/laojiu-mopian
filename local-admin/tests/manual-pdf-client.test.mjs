// 用Node自带隔离环境验证回执状态转换，不增加浏览器测试依赖。
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {Script} from 'node:vm';
import {stripTypeScriptTypes} from 'node:module';
import {webcrypto} from 'node:crypto';
import {setImmediate as tick} from 'node:timers/promises';
import {manualPdfUploadLimits as limits} from '../../shared/manual-pdf-upload.mjs';
const source=await fs.readFile(new URL('../../site/src/scripts/manual-pdf.ts',import.meta.url),'utf8');
const script=new Script(stripTypeScriptTypes(source.replace(/^import .*;\r?\n/gm,'').replace(/^export /gm,'')));
const id='TG-AAAAAAAAAAAAAAAAAAAAAAAA',pdf=Buffer.from('%PDF-1.4\nSYNTHETIC\n');
class Element{
  hidden=false;disabled=false;checked=false;textContent='';value='';files=[];listeners={};
  setAttribute(){} addEventListener(type,fn){(this.listeners[type]??=[]).push(fn);}
  emit(type){for(const fn of this.listeners[type]??[])fn();}
  click(){if(!this.disabled&&!this.hidden)this.emit('click');}
}
async function settle(condition,details=()=>undefined){for(let i=0;i<100;i++){if(condition())return;await tick();}assert(condition(),'客户端未到达预期状态：'+details());}
function controller({lose=false,outage=false,dirty=false}={}){
  const nodes=new Map(),el=name=>{if(!nodes.has(name))nodes.set(name,new Element());return nodes.get(name);};
  let locked=false,saved=false,reserved=null,posts=0,streams=0,available=!outage,otherDirty=dirty;
  const record=()=>({id,submission_kind:'manual',revision:saved?3:2,status:'draft',source_format:'pdf',manual_metadata:{sharing_scope:'reading-copy'},images:[],manual_upload_usage:{stored_copies:0,account_remaining_bytes:200*1024**2},manual_pdf:{retained_sources:saved?1:0,pdf_stored_bytes:saved?pdf.length:0,temporary_bytes:0,reserved_bytes:reserved&&!saved?pdf.length:0,current:saved?{name:'synthetic-copy.pdf',bytes:pdf.length,saved_at:new Date().toISOString()}:null,operation:reserved?receipt(reserved.operation_id):null}});
  const receipt=key=>({id,revision:saved?3:2,found:Boolean(reserved),operation_id:key,state:saved?'saved':reserved?'reserved':'not_found',applied:saved,can_upload:Boolean(reserved&&!saved),upload_id:reserved?'PU-'+('a'.repeat(24)):'',name:reserved?.name??'',bytes:reserved?.bytes??0,sha256:reserved?.sha256??''});
  const api=async(route,options={})=>{
    if(!available)throw new Error('SYNTHETIC network interrupted');
    if(route.endsWith('/pdf/uploads')&&options.method==='POST'){posts++;reserved=options.body;return receipt(reserved.operation_id);}
    if(route.includes('/pdf/operations/'))return receipt(route.split('/').at(-1));
    return record();
  };
  class Xhr{
    upload={};status=200;responseText='';open(){}setRequestHeader(){}
    send(){streams++;saved=true;this.responseText=JSON.stringify(receipt(reserved.operation_id));queueMicrotask(()=>lose?this.onerror():this.onload());}
  }
  const context={document:{getElementById:el},crypto:webcrypto,limits,accountFetch:api,setStatus:(node,text)=>{node.textContent=text;},XMLHttpRequest:Xhr,setTimeout,clearTimeout,AbortController};
  script.runInNewContext(context);
  const editor=context.createManualPdfEditor({blocked:()=>false,dirty:()=>otherDirty,ensureOwner:async()=>{},accept:data=>editor.load(data,true,false),lock:value=>{locked=value;},unauthorized:()=>{}});
  editor.load(record(),true,false);
  return {editor,el,record,setDirty:value=>{otherDirty=value;},get locked(){return locked;},get streams(){return streams;},get posts(){return posts;},restore(){available=true;},select(){el('manual-pdf-file').files=[{name:'synthetic-copy.pdf',size:pdf.length,arrayBuffer:async()=>pdf.buffer.slice(pdf.byteOffset,pdf.byteOffset+pdf.length)}];el('manual-pdf-file').emit('change');el('manual-pdf-confirm').checked=true;el('manual-pdf-confirm').emit('change');}};
}

test('首次查询not_found后初始化并传输，保存后解锁且不再显示核对中进度',async()=>{
  const c=controller();c.select();c.el('manual-pdf-start').click();await settle(()=>c.el('manual-pdf-status').textContent.includes('PDF已私密保存'),()=>c.el('manual-pdf-status').textContent);
  assert.equal(c.posts,1);assert.equal(c.streams,1);assert.equal(c.locked,false);assert.equal(c.el('manual-pdf-progress-wrap').hidden,true);
});
test('字节已保存但连接失败时先查原回执，不自动重传',async()=>{
  const c=controller({lose:true});c.select();c.el('manual-pdf-start').click();await settle(()=>c.el('manual-pdf-status').textContent.includes('回执确认PDF保存成功'),()=>c.el('manual-pdf-status').textContent);
  assert.equal(c.posts,1);assert.equal(c.streams,1);assert.equal(c.locked,false);assert.equal(c.editor.hasUnsaved(),false);
});
test('结果未知时锁定其他操作；网络恢复后查询not_found解锁，不自动发送文件',async()=>{
  const c=controller({outage:true});c.select();c.el('manual-pdf-start').click();await settle(()=>c.el('manual-pdf-status').textContent.includes('暂未能核对'));
  assert.equal(c.locked,true);assert.equal(c.posts,0);assert.equal(c.streams,0);
  c.restore();c.el('manual-pdf-check').click();await settle(()=>c.el('manual-pdf-status').textContent.includes('尚未收到这次上传'),()=>c.el('manual-pdf-status').textContent);
  assert.equal(c.locked,false);assert.equal(c.streams,0);assert.equal(c.el('manual-pdf-start').disabled,false);
});
test('重开需维护者核对的草稿时显示原因，冻结上传和取消，仍允许查询回执',()=>{
  const c=controller(),r=c.record();r.manual_pdf.operation={operation_id:'a'.repeat(64),state:'needs_review',applied:false,message:'合成故障：留存信息需核对'};
  c.editor.load(r,true,false);assert.equal(c.el('manual-pdf-status').textContent,'合成故障：留存信息需核对');assert.equal(c.locked,true);
  assert.equal(c.el('manual-pdf-file').disabled,true);assert.equal(c.el('manual-pdf-cancel').disabled,true);assert.equal(c.el('manual-pdf-check').disabled,false);
});
test('其他编辑操作结束后文件提示同步刷新，已提交版本不提示保存草稿文字',()=>{
  const c=controller({dirty:true});assert.match(c.el('manual-material-note').textContent,/请先保存上方文字/);
  c.setDirty(false);c.editor.refreshControls();assert.doesNotMatch(c.el('manual-material-note').textContent,/请先保存上方文字/);
  const r=c.record();r.status='pending';c.setDirty(true);c.editor.load(r,true,false);assert.match(c.el('manual-material-note').textContent,/只读/);assert.doesNotMatch(c.el('manual-material-note').textContent,/请先保存/);
});
