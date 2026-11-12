import test from 'node:test';import assert from 'node:assert/strict';
import {createPdfPublicationFixture} from './helpers/manual-pdf-publication-fixture.mjs';
import {reviewRuntime,key} from './helpers/manual-pdf-review-fixture.mjs';
import {createManualAccountFixture} from './helpers/manual-account-fixture.mjs';
import {seedManualMetadata} from './helpers/manual-review-fixture.mjs';
import {manualConsentVersion} from '../../shared/manual-workflow.mjs';
import {createRequire} from 'node:module';

test('目录逐页深检期间收到停止申请，结束检查前重新核对投稿状态',{timeout:10000},async t=>{
  const runtime=reviewRuntime(),configuration=runtime.configuration;let entered,release,block=false;
  const reached=new Promise(resolve=>entered=resolve),gate=new Promise(resolve=>release=resolve);
  runtime.configuration=async()=>{if(block){block=false;entered();await gate;}return configuration();};
  const f=await createPdfPublicationFixture(t,{runtime});await f.handoff();
  const catalog=(await f.catalog.store.bootstrap()).state.draft,owner=await f.get();block=true;
  const checking=f.store.manualCatalogPublicationIssues(catalog);await reached;
  try{await f.operate({action:'withdraw',operation_id:key(),revision:owner.revision});}finally{release();}
  const issues=await checking;assert.equal(issues.length,1);assert.equal(issues[0].where,catalog.documents[0].manual_key);
});

test('说明书提交后本人仍可查询先前图片操作回执，其他账号不可读取',async t=>{
  const f=await createManualAccountFixture();t.after(()=>f.close());
  const accountId=f.users[0].user.id,{id}=await f.submissions.createAccountManualDraft({accountId,payload:{request_key:key(),manual:seedManualMetadata}});
  const sharp=createRequire(new URL('../../site/package.json',import.meta.url))('sharp'),buffer=await sharp({create:{width:40,height:60,channels:3,background:'#b4aa8c'}}).jpeg().toBuffer(),operation_id=key();
  await f.submissions.uploadAccountManualPage({id,accountId,payload:{operation_id,revision:1,copies_confirmed:true,image:{name:'screened-audit.jpg',type:'image/jpeg',buffer}}});
  await f.submissions.operateAccountManualSubmission({id,accountId,payload:{action:'submit',operation_id:key(),revision:2,consent_version:manualConsentVersion,consents:{copies:true,rights:true,privacy:true,processing:true}}});
  const url='/api/account/manual-drafts/'+id+'/pages/operations/'+operation_id,result=await f.request(url);
  assert.equal(result.status,200);assert.equal(result.body.applied,true);assert.equal(result.body.revision,3);
  assert.equal((await f.request(url,{user:f.users[1]})).status,404);assert.equal((await f.request(url,{user:null})).status,401);
});
