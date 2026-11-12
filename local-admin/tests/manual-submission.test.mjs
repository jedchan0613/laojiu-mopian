import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {randomBytes} from 'node:crypto';
import {normalizeManualSubmission,manualSubmissionNotes} from '../../shared/manual-submission.mjs';
import {consentVersion} from '../submissions.mjs';
import {createManualAccountFixture} from './helpers/manual-account-fixture.mjs';

const draft=(overrides={})=>({schema_version:1,brand_name:'合成测试品牌',model_texts:['TEST-0O','TEST-0O-JP'],languages:['zh-CN','en'],rights_basis:'permission',rights_note:'虚构许可说明，仅供测试',sharing_scope:'reading-copy',...overrides});
const payload=(manual=draft())=>({request_key:randomBytes(32).toString('hex'),manual});
async function fixture(t,options){const f=await createManualAccountFixture(options);t.after(()=>f.close());return f;}

test('文字草稿允许未填完；型号字母数字、多个语言及权利意向保持原样',()=>{
  const blank=normalizeManualSubmission({schema_version:1});assert.deepEqual(blank.model_texts,[]);assert.equal(blank.brand_name,'');
  const value=normalizeManualSubmission(draft({edition_date:'2024-02-29',completeness:'incomplete'}));
  assert.deepEqual(value.model_texts,['TEST-0O','TEST-0O-JP']);assert.deepEqual(value.languages,['zh-CN','en']);assert.equal(value.rights_basis,'permission');
  assert(manualSubmissionNotes(value).some(v=>v.includes('缺页')));
  const unsafe=normalizeManualSubmission(draft({official_url:'javascript:alert(1)'}));assert.equal(unsafe.official_url,'javascript:alert(1)');assert(manualSubmissionNotes(unsafe).some(v=>v.includes('只按文字')));
});

test('未知字段、图片、错误日期、非法选项、重复型号及超长内容拒绝保存',()=>{
  for(const value of [[],null,{schema_version:2},draft({images:[]}),draft({brand_name:42}),draft({model_texts:'A'}),draft({model_texts:['A','A']}),draft({model_texts:Array.from({length:21},(_,i)=>String(i))}),draft({languages:['invented']}),draft({edition_date:'2023-02-29'}),draft({edition_date:'2024-04-31'}),draft({rights_basis:'approved'}),draft({description:'x'.repeat(3001)}),draft({brand_name:'a\u0000b'})])assert.throws(()=>normalizeManualSubmission(value),{statusCode:400});
});

test('真实 HTTP 保存、重开、列表归属及重复创建；草稿不会自动批准或产生图片',async t=>{
  const f=await fixture(t),body=payload();
  const created=await f.request('/api/account/manual-drafts',{method:'POST',body});assert.equal(created.status,200);assert.equal(created.body.status,'draft');
  const id=created.body.id,route='/api/account/manual-drafts/'+id;
  const repeated=await f.request('/api/account/manual-drafts',{method:'POST',body});assert.equal(repeated.body.id,id);assert.equal(repeated.body.repeated,true);
  assert.equal((await f.request('/api/account/manual-drafts',{method:'POST',body:{...body,manual:draft({brand_name:'另一品牌'})}})).status,409);
  const opened=await f.request(route);assert.equal(opened.status,200);assert.deepEqual(opened.body.manual_metadata,normalizeManualSubmission(body.manual));
  assert.equal(opened.body.consent.rights,false);assert.equal(opened.body.consent.privacy,false);assert.equal(opened.body.linked_item_id,null);assert.deepEqual(opened.body.images,[]);
  for(const key of ['key_hash','fingerprint','manual_last_save','private_note'])assert.equal(Object.hasOwn(opened.body,key),false);
  const list=await f.request('/api/account/submissions');assert.equal(list.body.items.length,1);assert.equal(list.body.items[0].submission_kind,'manual');
  assert.deepEqual(await fs.readdir(path.join(f.root,'submissions',id)),['record.json']);
});

test('版本冲突不覆盖当前内容；相同编辑重试不生成多余版本；并发保存只成功一份',async t=>{
  const f=await fixture(t),created=await f.request('/api/account/manual-drafts',{method:'POST',body:payload()}),route='/api/account/manual-drafts/'+created.body.id;
  const edit={revision:1,manual:draft({edition_display:'第二版'})};
  const first=await f.request(route,{method:'POST',body:edit});assert.equal(first.status,200);assert.equal(first.body.revision,2);
  const repeat=await f.request(route,{method:'POST',body:edit});assert.equal(repeat.status,200);assert.equal(repeat.body.repeated,true);assert.equal(repeat.body.revision,2);
  assert.equal((await f.request(route,{method:'POST',body:{revision:1,manual:draft({edition_display:'错误覆盖'})}})).status,409);
  const concurrent=await Promise.all(['第三版甲','第三版乙'].map(edition_display=>f.request(route,{method:'POST',body:{revision:2,manual:draft({edition_display})}})));
  assert.deepEqual(concurrent.map(r=>r.status).sort(),[200,409]);
  const current=(await f.request(route)).body;assert.equal(current.revision,3);assert(['第三版甲','第三版乙'].includes(current.manual_metadata.edition_display));assert.equal(Object.hasOwn(current,'manual_last_save'),false);
});

test('不同账号和未登录请求无法读写；跨站请求及没有专用标记的写入被阻断',async t=>{
  const f=await fixture(t),created=await f.request('/api/account/manual-drafts',{method:'POST',body:payload()}),route='/api/account/manual-drafts/'+created.body.id;
  for(const method of ['GET','POST']){
    const body=method==='POST'?{revision:1,manual:draft()}:undefined;
    assert.equal((await f.request(route,{user:f.users[1],method,body})).status,404);
    assert.equal((await f.request(route,{user:null,method,body})).status,401);
  }
  assert.equal((await f.request('/api/account/submissions',{user:f.users[1]})).body.items.length,0);
  assert.equal((await f.request('/api/account/manual-drafts',{method:'POST',body:payload(),headers:{Origin:'https://other.example.invalid'}})).status,403);
  assert.equal((await f.request('/api/account/manual-drafts',{method:'POST',body:payload(),headers:{'X-LJM-Account-Request':''}})).status,403);
});

test('专用接口拒绝图片与送审参数；普通编辑、送审、审核和转档案均不能绕过阶段限制',async t=>{
  const f=await fixture(t),p=payload(),accountId=f.users[0].user.id;
  for(const extra of [{images:[]},{mode:'pending'},{consents:{rights:true}},{submission_kind:'photo'}])assert.equal((await f.request('/api/account/manual-drafts',{method:'POST',body:{...p,...extra}})).status,400);
  const created=await f.request('/api/account/manual-drafts',{method:'POST',body:p}),id=created.body.id;
  const manual=(await f.request('/api/account/manual-drafts/'+id)).body;
  await assert.rejects(f.submissions.saveAccountSubmission({id,accountId,revision:1,payload:{fields:manual.fields}}),{statusCode:409});
  await assert.rejects(f.submissions.submitAccountSubmission({id,accountId,revision:1,payload:{consent_version:consentVersion,consents:{copies:true,rights:true,privacy:true,processing:true}}}),{statusCode:409});
  await assert.rejects(f.submissions.review(id,{revision:1,status:'approved',rights_reviewed:true}),{statusCode:409});
  let transferred=false;await assert.rejects(f.submissions.transfer(id,{revision:1},()=>{transferred=true;}));assert.equal(transferred,false);
  assert.equal((await f.request('/api/account/manual-drafts/'+id,{method:'POST',body:{manual:draft()}})).status,428);
  assert.equal((await f.request('/api/account/manual-drafts/'+id)).body.revision,1);
  const ordinary=await f.submissions.createAccountSubmission({accountId,mode:'draft',payload:{request_key:randomBytes(32).toString('hex'),fields:{title:'普通测试',category:'其他',attribution:'anonymous'},images:[]}});
  assert.equal((await f.request('/api/account/manual-drafts/'+ordinary.id)).status,404);
  assert.equal((await f.request('/api/account/manual-drafts/'+ordinary.id,{method:'POST',body:{revision:1,manual:draft()}})).status,409);
});

test('暂停保存后原草稿可读，新建和编辑明确失败且不改变版本',async t=>{
  const f=await fixture(t),created=await f.request('/api/account/manual-drafts',{method:'POST',body:payload()}),route='/api/account/manual-drafts/'+created.body.id;
  f.setUploadsOpen(false);
  assert.equal((await f.request('/api/account/config')).body.uploads_open,false);assert.equal((await f.request(route)).status,200);
  assert.equal((await f.request(route,{method:'POST',body:{revision:1,manual:draft()}})).status,503);
  assert.equal((await f.request('/api/account/manual-drafts',{method:'POST',body:payload()})).status,503);
  assert.equal((await f.request(route)).body.revision,1);
});

test('文字草稿与普通投稿共用账号草稿配额，不因使用专用入口超额',async t=>{
  const f=await fixture(t),accountId=f.users[0].user.id;
  await f.submissions.createAccountSubmission({accountId,mode:'draft',payload:{request_key:randomBytes(32).toString('hex'),fields:{title:'普通测试',category:'其他',attribution:'anonymous'},images:[]}});
  for(let i=0;i<19;i++)assert.equal((await f.request('/api/account/manual-drafts',{method:'POST',body:payload({schema_version:1})})).status,200);
  assert.equal((await f.request('/api/account/manual-drafts',{method:'POST',body:payload()})).status,429);
  assert.equal((await f.request('/api/account/submissions')).body.items.length,20);
});
