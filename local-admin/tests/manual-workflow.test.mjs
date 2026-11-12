import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {createRequire} from 'node:module';
import {randomBytes,createHash} from 'node:crypto';
import {createManualAccountFixture} from './helpers/manual-account-fixture.mjs';
import {manualConsentVersion,manualSubmissionProblems} from '../../shared/manual-workflow.mjs';
import {consentVersion} from '../submissions.mjs';
const sharp=createRequire(new URL('../../site/package.json',import.meta.url))('sharp');
const image=await sharp({create:{width:100,height:130,channels:3,background:'#b5a185'}}).jpeg().toBuffer();
const other=await sharp({create:{width:100,height:130,channels:3,background:'#749baa'}}).jpeg().toBuffer();
const key=()=>randomBytes(32).toString('hex'),hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const complete={schema_version:1,brand_name:'进度合成样例品牌',model_texts:['PROGRESS-12P'],category_key:'tools',document_kind:'user-guide',languages:['zh-CN'],completeness:'incomplete',missing_note:'合成样册缺少附页，需要补充',source_note:'开发验收合成资料',rights_basis:'own-work',sharing_scope:'reading-copy',people:'none',attribution:'anonymous'};
const submit=revision=>({action:'submit',revision,operation_id:key(),consent_version:manualConsentVersion,consents:{copies:true,rights:true,privacy:true,processing:true}});
async function fixture(t,{pages=2,manual=complete,...options}={}){
  const f=await createManualAccountFixture(options);t.after(()=>f.close());const created=await f.request('/api/account/manual-drafts',{method:'POST',body:{request_key:key(),manual}});assert.equal(created.status,200);
  const id=created.body.id,accountId=f.users[0].user.id;
  for(let revision=1;revision<=pages;revision++)await f.submissions.uploadAccountManualPage({id,accountId,payload:{operation_id:key(),revision,copies_confirmed:true,image:{name:'screened-copy.jpg',type:'image/jpeg',buffer:image}}});
  return {...f,id,accountId,base:'/api/account/manual-submissions/'+id,draft:'/api/account/manual-drafts/'+id,revision:pages+1};
}
const load=async f=>(await f.request(f.base)).body;
const operate=(f,body,options={})=>f.request(f.base+'/operate',{method:'POST',body,...options});

test('12页同一编号提交：生成完整只读快照，提交后禁止直接写入，私密图片仍可读取',async t=>{
  const f=await fixture(t,{pages:12}),response=await operate(f,submit(f.revision));assert.equal(response.status,200);assert.equal(response.body.status,'pending');assert.equal(response.body.status_label,'已提交，待核对');
  const record=await load(f);assert.equal(record.id,f.id);assert.equal(record.images.length,12);assert.equal(record.versions.length,1);assert.equal(record.versions[0].revision,14);assert.equal(record.versions[0].images.length,12);assert.equal(record.versions[0].manual_metadata.brand_name,complete.brand_name);assert.equal(record.consent.version,manualConsentVersion);assert.equal(record.linked_item_id,null);
  assert(record.versions[0].images.every(page=>/^[a-f0-9]{64}$/.test(page.sha256)));assert.equal(record.versions[0].digest.length,64);
  assert.equal((await f.request(f.draft,{method:'POST',body:{revision:14,manual:{...complete,brand_name:'不应写入'}}})).status,400);
  await assert.rejects(f.submissions.editAccountManualPages({id:f.id,accountId:f.accountId,payload:{action:'remove',operation_id:key(),revision:14,page_id:record.images[0].page_id}}),{statusCode:404});
  const page=record.images[0],versionImage=await fetch(f.origin+f.base+`/versions/14/images/${page.filename}`,{headers:{Cookie:f.cookie()}});assert.equal(versionImage.status,200);assert.equal(hash(Buffer.from(await versionImage.arrayBuffer())),record.versions[0].images[0].sha256);assert.match(versionImage.headers.get('Cache-Control'),/no-store/);
  const current=await fetch(f.origin+f.draft+'/images/'+page.filename,{headers:{Cookie:f.cookie()}});assert.equal(current.status,200);
});

test('重复提交与回执找回只保存一次；同一操作换版本或增加隐藏字段被拒绝',async t=>{
  const f=await fixture(t),body=submit(f.revision);assert.equal((await operate(f,body)).status,200);const repeated=await operate(f,body);assert.equal(repeated.body.repeated,true);
  const receipt=await f.request(f.base+'/operations/'+body.operation_id);assert.equal(receipt.body.applied,true);assert.equal((await f.request(f.base+'/operations/'+key())).body.applied,false);
  assert.equal((await operate(f,{...body,revision:f.revision+1})).status,409);assert.equal((await operate(f,{...body,rights_reviewed:true})).status,400);
  const record=await load(f);assert.equal(record.versions.length,1);assert.equal(record.history.filter(row=>row.action==='submitted').length,1);assert.equal(Object.hasOwn(record,'manual_workflow_receipts'),false);
});

test('待补充在原编号恢复草稿、补页再交；旧版文字、图片、页序与勾选留存不变',async t=>{
  const notifications=[],f=await fixture(t,{submissionOptions:{notifier:async event=>notifications.push(event)}});
  await operate(f,submit(f.revision));let record=await load(f);const old=structuredClone(record.versions[0]),oldPage=old.images[0];
  await f.submissions.review(f.id,{revision:record.revision,status:'needs_info',public_message:'请补充第3页并核对版本。',private_note:'ADMIN-PRIVATE-NOTE-MUST-NOT-LEAK'});record=await load(f);assert.equal(record.status,'needs_info');assert.equal(record.public_message,'请补充第3页并核对版本。');assert.equal(JSON.stringify(record).includes('ADMIN-PRIVATE-NOTE-MUST-NOT-LEAK'),false);
  const edit={action:'edit',operation_id:key(),revision:record.revision};assert.equal((await operate(f,edit)).status,200);record=await load(f);assert.equal(record.status,'draft');assert.equal(record.manual_draft_reason,'supplement');assert.equal(record.consent.rights,false);assert.deepEqual(record.versions[0],old);
  await f.submissions.uploadAccountManualPage({id:f.id,accountId:f.accountId,payload:{operation_id:key(),revision:record.revision,copies_confirmed:true,target_page_id:oldPage.page_id,image:{name:'replacement.jpg',type:'image/jpeg',buffer:other}}});record=await load(f);
  await f.submissions.uploadAccountManualPage({id:f.id,accountId:f.accountId,payload:{operation_id:key(),revision:record.revision,copies_confirmed:true,image:{name:'supplement-page.jpg',type:'image/jpeg',buffer:image}}});record=await load(f);
  const final=await operate(f,submit(record.revision));assert.equal(final.status,200);record=await load(f);assert.equal(record.id,f.id);assert.equal(record.status,'pending');assert.equal(record.images.length,3);assert.equal(record.versions.length,2);assert.equal(record.versions[1].action,'supplemented');assert.deepEqual(record.versions[0],old);assert.notEqual(record.images[0].filename,oldPage.filename);
  const oldImage=await fetch(f.origin+f.base+`/versions/${old.revision}/images/${oldPage.filename}`,{headers:{Cookie:f.cookie()}});assert.equal(oldImage.status,200);assert.equal(hash(Buffer.from(await oldImage.arrayBuffer())),oldPage.sha256);
  assert.equal((await fetch(f.origin+f.draft+'/images/'+oldPage.filename,{headers:{Cookie:f.cookie()}})).status,404);assert.equal(notifications.length,1);assert.equal(notifications[0].event,'needs_info');
});

test('撤回与恢复有版本检查、保留提交快照；暂停期间可撤回但不能新提交',async t=>{
  const f=await fixture(t);await operate(f,submit(f.revision));const before=await load(f);f.setUploadsOpen(false);
  assert.equal((await operate(f,{action:'withdraw',operation_id:key(),revision:before.revision-1})).status,409);
  const body={action:'withdraw',operation_id:key(),revision:before.revision};assert.equal((await operate(f,body)).status,200);assert.equal((await operate(f,body)).body.repeated,true);
  const record=await load(f);assert.equal(record.status,'draft');assert.equal(record.consent.processing,false);assert.deepEqual(record.versions,before.versions);assert.equal((await operate(f,submit(record.revision))).status,503);
});

test('说明和提交确认不完整时保留草稿；官方线索允许不附图片，阅读副本不允许空册',async t=>{
  const f=await fixture(t);for(const changed of [{consent_version:consentVersion},{consents:{copies:true,rights:true,privacy:false,processing:true}},{consents:{copies:true,rights:true,privacy:true,processing:true,download:true}}])assert.equal((await operate(f,{...submit(f.revision),...changed})).status,400);
  assert.equal((await load(f)).status,'draft');
  const empty=await fixture(t,{pages:0});assert.equal((await operate(empty,submit(1))).status,400);
  const official=await fixture(t,{pages:0,manual:{...complete,sharing_scope:'official-link',rights_basis:'official-link',official_url:'https://example.com/support/manual.pdf'}});assert.equal((await operate(official,submit(1))).status,200);assert.equal((await load(official)).versions[0].images.length,0);
  assert(manualSubmissionProblems({...complete,rights_basis:'unknown'},1).some(text=>text.includes('权利情况')));assert(manualSubmissionProblems({...complete,missing_note:''},1).some(text=>text.includes('缺页')));
});

test('账号与来源隔离覆盖进度、补充、回执及旧版图片，原普通送审/撤回不能旁路',async t=>{
  const f=await fixture(t),body=submit(f.revision);await operate(f,body);const record=await load(f),version=record.versions[0];
  for(const user of [null,f.users[1]]){const status=user?404:401;assert.equal((await f.request(f.base,{user})).status,status);assert.equal((await f.request(f.base+'/operations/'+body.operation_id,{user})).status,status);assert.equal((await operate(f,{action:'withdraw',operation_id:key(),revision:record.revision},{user})).status,status);assert.equal((await fetch(f.origin+f.base+`/versions/${version.revision}/images/${version.images[0].filename}`,{headers:user?{Cookie:f.cookie(user)}:{}})).status,status);}
  assert.equal((await operate(f,{action:'withdraw',operation_id:key(),revision:record.revision},{headers:{Origin:'https://other.example.invalid'}})).status,403);
  await assert.rejects(f.submissions.withdrawAccountSubmission({id:f.id,accountId:f.accountId}),{statusCode:409});
  await assert.rejects(f.submissions.submitAccountSubmission({id:f.id,accountId:f.accountId,revision:record.revision,payload:{consent_version:consentVersion,consents:{copies:true,rights:true,privacy:true,processing:true}}}),{statusCode:409});
  const anonymousKey=key(),manualDraft=await f.submissions.createAccountManualDraft({accountId:f.accountId,payload:{request_key:anonymousKey,manual:complete}});
  await assert.rejects(f.submissions.lookup({id:manualDraft.id,key:hash(`${f.accountId}:${anonymousKey}`)}),{statusCode:404});
});

test('每次重新提交仍计入既有每日10次额度；回到补充草稿仍遵守20件草稿上限',async t=>{
  const f=await fixture(t,{pages:1});let record=await load(f);
  for(let index=0;index<10;index++){
    assert.equal((await operate(f,submit(record.revision))).status,200);record=await load(f);
    assert.equal((await operate(f,{action:'withdraw',operation_id:key(),revision:record.revision})).status,200);record=await load(f);
  }
  assert.equal((await operate(f,submit(record.revision))).status,429);assert.equal((await load(f)).versions.length,10);
  const g=await fixture(t,{pages:1});await operate(g,submit(g.revision));const pending=await load(g);await g.submissions.review(g.id,{revision:pending.revision,status:'needs_info',public_message:'请补页'});
  for(let index=0;index<20;index++)await g.submissions.createAccountManualDraft({accountId:g.accountId,payload:{request_key:key(),manual:complete}});
  const needsInfo=await load(g);assert.equal((await operate(g,{action:'edit',operation_id:key(),revision:needsInfo.revision})).status,429);assert.equal((await load(g)).status,'needs_info');
});

test('并发操作只接受一个版本，文件变化后只读留存入口拒绝显示',async t=>{
  const f=await fixture(t),both=await Promise.all([operate(f,submit(f.revision)),operate(f,submit(f.revision))]);assert.deepEqual(both.map(result=>result.status).sort(),[200,409]);
  const record=await load(f),version=record.versions[0],page=version.images[0],filename=path.join(f.root,'submissions',f.id,page.filename),bytes=await fs.readFile(filename);bytes[bytes.length-5]^=1;await fs.writeFile(filename,bytes);
  assert.equal((await fetch(f.origin+f.base+`/versions/${version.revision}/images/${page.filename}`,{headers:{Cookie:f.cookie()}})).status,409);assert.equal((await fetch(f.origin+f.draft+'/images/'+page.filename,{headers:{Cookie:f.cookie()}})).status,409);
});

test('5.3不提前开放说明书普通初审或转档案；反馈可用且通知只在状态真正变化时发出',async t=>{
  const events=[],f=await fixture(t,{submissionOptions:{notifier:async value=>events.push(value)}});await operate(f,submit(f.revision));let record=await load(f);
  await assert.rejects(f.submissions.review(f.id,{revision:record.revision,status:'approved',rights_reviewed:true}),{statusCode:409});let transferred=false;await assert.rejects(f.submissions.transfer(f.id,{revision:record.revision},()=>{transferred=true;}),{statusCode:409});assert.equal(transferred,false);
  await f.submissions.review(f.id,{revision:record.revision,status:'declined',public_message:'合成验收：暂不采用',private_note:'私密备注'});record=await load(f);assert.equal(record.status,'declined');assert.equal(events.length,1);await assert.rejects(f.submissions.review(f.id,{revision:record.revision-1,status:'declined',public_message:'过期反馈'}),{statusCode:409});assert.equal(events.length,1);
  assert.equal((await operate(f,{action:'edit',operation_id:key(),revision:record.revision})).status,200);assert.equal((await load(f)).id,f.id);
});

test('普通账户图片地址同样核对说明书提交摘要，不能绕过专用读取保护',async t=>{
  const f=await fixture(t);await operate(f,submit(f.revision));const record=await load(f),page=record.images[0],route=`/api/account/submissions/${f.id}/images/${page.filename}`;
  assert.equal((await fetch(f.origin+route,{headers:{Cookie:f.cookie()}})).status,200);
  assert.equal((await fetch(f.origin+route,{headers:{Cookie:f.cookie(f.users[1])}})).status,404);
  const filename=path.join(f.root,'submissions',f.id,page.filename),bytes=await fs.readFile(filename);bytes[bytes.length-5]^=1;await fs.writeFile(filename,bytes);
  assert.equal((await fetch(f.origin+route,{headers:{Cookie:f.cookie()}})).status,409);
  assert(filename.startsWith(path.resolve(f.root)+path.sep));await fs.unlink(filename);
  for(const target of [route,f.draft+'/images/'+page.filename]){const response=await fetch(f.origin+target,{headers:{Cookie:f.cookie()}});assert.equal(response.status,404);assert.equal((await response.text()).includes(f.root),false);}
});

test('满20件草稿时可停止旧稿释放名额；同一编号恢复、重复操作及旧版本受保护',async t=>{
  const f=await fixture(t);for(let index=1;index<20;index++)await f.submissions.createAccountManualDraft({accountId:f.accountId,payload:{request_key:key(),manual:complete}});
  await assert.rejects(f.submissions.createAccountManualDraft({accountId:f.accountId,payload:{request_key:key(),manual:complete}}),{statusCode:429});
  const before=await load(f),body={action:'discard',operation_id:key(),revision:before.revision};
  f.setUploadsOpen(false);
  assert.equal((await operate(f,{...body,revision:before.revision-1})).status,409);assert.equal((await operate(f,body)).status,200);assert.equal((await operate(f,body)).body.repeated,true);
  let record=await load(f);assert.equal(record.status,'withdrawn');assert.deepEqual(record.images,before.images);assert.deepEqual(record.versions,before.versions);
  assert.equal((await f.request('/api/account/submissions')).body.quota.drafts_left,1);
  await assert.rejects(f.submissions.discardAccountSubmission({id:f.id,accountId:f.accountId}),{statusCode:409});
  f.setUploadsOpen(true);
  assert.equal((await operate(f,{action:'edit',operation_id:key(),revision:record.revision})).status,200);record=await load(f);assert.equal(record.id,before.id);assert.equal(record.status,'draft');
  const submitted=await operate(f,submit(record.revision));assert.equal(submitted.status,200);record=await load(f);assert.equal((await operate(f,{action:'discard',operation_id:key(),revision:record.revision})).status,409);
});
