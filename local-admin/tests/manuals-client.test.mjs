import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import vm from 'node:vm';
import {randomUUID} from 'node:crypto';

const source=await fs.readFile(new URL('../public/manuals.js',import.meta.url),'utf8');
const response=(body,status=200)=>({ok:status<400,status,json:async()=>body});
function client(fetch,pending=null){
  const elements=new Map(),memory=new Map(pending?[['ljm-manuals-pending-v1',JSON.stringify(pending)]]:[]);
  const document={getElementById(id){if(!elements.has(id))elements.set(id,{textContent:'',dataset:{},disabled:false,hidden:false,replaceChildren(){}});return elements.get(id);},querySelectorAll(){return [];}};
  const context=vm.createContext({document,fetch,crypto:{randomUUID},AbortController,structuredClone,checkPending:async()=>{},sessionStorage:{getItem:key=>memory.get(key),setItem:(key,value)=>memory.set(key,value),removeItem:key=>memory.delete(key)},setTimeout:callback=>setImmediate(callback)});
  const stop=source.slice(source.indexOf('async function requestStop()'),source.indexOf("$('operation-stop').onclick=requestStop;"));
  vm.runInContext(source.slice(0,source.indexOf('async function load()'))+'\n'+stop+'\nglobalThis.client={request,state,readPending,requestStop};',context);
  return {...context.client,elements,memory};
}

test('服务器503且查不到回执时结束等待，保留编号、私密输入并阻止重复POST',async()=>{
  let posts=0,queries=0;
  const c=client(async(url,options)=>{if(url.startsWith('/api/operations/')){queries++;return response({operations:[]});}posts++;assert.equal(options.method,'POST');return response({error:'SYNTHETIC-UNAVAILABLE'},503);});
  c.state.catalog={private_note:'UNSAVED-PRIVATE-INPUT'};
  await assert.rejects(c.request('/publish',{expectedRevision:'a'.repeat(64)}),/操作编号已保留/);
  assert.equal(posts,1);assert.equal(queries,3);assert(c.state.pending);assert.equal(c.state.uncertain,true);assert.equal(c.state.catalog.private_note,'UNSAVED-PRIVATE-INPUT');
  const saved=JSON.parse(c.memory.get('ljm-manuals-pending-v1'));assert.deepEqual(Object.keys(saved).sort(),['action','operationId','stepId']);assert(!JSON.stringify(saved).includes('PRIVATE'));
  await assert.rejects(c.request('/publish',{}),/上次维护结果尚未核对/);assert.equal(posts,1);
});

test('成功响应丢失后只查询原编号，收到成功回执不再POST',async()=>{
  let posts=0;const c=client(async(url,options)=>{
    if(url.startsWith('/api/operations/'))return response({operations:[{stepId:c.state.pending.stepId,status:'succeeded',result:{revision:'b'.repeat(64)}}]});
    posts++;throw new Error('SYNTHETIC-DROPPED-RESPONSE');
  });
  const result=await c.request('/publish',{});assert.equal(result.revision,'b'.repeat(64));assert.equal(posts,1);assert.equal(c.state.pending,null);assert.equal(c.memory.size,0);
});

test('服务503但已登记的操作继续查询至成功，不把服务器错误当作未发布',async()=>{
  let posts=0,queries=0;const c=client(async(url)=>{
    if(url.startsWith('/api/operations/')){queries++;return response({operations:[{stepId:c.state.pending.stepId,status:queries<5?'running':'succeeded',result:{revision:'c'.repeat(64)}}]});}
    posts++;return response({error:'SYNTHETIC-PROXY-503'},503);
  });
  assert.equal((await c.request('/publish',{})).operation.status,'succeeded');assert.equal(posts,1);assert.equal(queries,5);assert.equal(c.state.uncertain,false);
});

test('重新载入仅恢复操作编号，不恢复目录正文或检查凭据',async()=>{
  const pending={operationId:randomUUID(),stepId:randomUUID(),action:'publish'},c=client(async()=>{throw new Error('SHOULD-NOT-FETCH');},pending);
  assert.equal(c.state.pending.operationId,pending.operationId);assert.equal(c.state.catalog,null);assert.equal(c.state.review,null);assert.equal(c.state.pending.action,'publish');
});

test('重新进入后可停止服务端确认的原操作，不需要重发发布或伪造会话记录',async()=>{
  const requests=[],operationId=randomUUID(),stepId=randomUUID(),c=client(async(url,options)=>{requests.push({url,...options});return response({requested:true});});
  c.state.observed={operationId,stepId,action:'publish'};await c.requestStop();assert.equal(requests.length,1);assert.equal(requests[0].url,'/api/cancel-operation');assert.equal(JSON.parse(requests[0].body).operationId,operationId);assert.equal(c.elements.get('operation-stop').hidden,false);assert.equal(c.state.pending,null);assert.equal(c.memory.size,0);
});
