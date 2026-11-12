// 私密说明书长册：全部使用合成图片、虚构账号与临时目录。
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {createRequire} from 'node:module';
import {randomBytes,createHash} from 'node:crypto';
import {createManualAccountFixture} from './helpers/manual-account-fixture.mjs';
import {manualPageLimits} from '../../shared/manual-pages.mjs';
import {createSubmissionStore,consentVersion} from '../submissions.mjs';
const require=createRequire(new URL('../../site/package.json',import.meta.url)),sharp=require('sharp');
const jpeg=await sharp({create:{width:100,height:60,channels:3,background:'#b8a172'}}).jpeg().withMetadata({orientation:6}).toBuffer();
const replacement=await sharp({create:{width:96,height:64,channels:3,background:'#739db7'}}).png().toBuffer();
const key=()=>randomBytes(32).toString('hex'),sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const manual={schema_version:1,brand_name:'长册合成验收品牌',model_texts:['SYNTHETIC-12P']};
async function fixture(t,options){const f=await createManualAccountFixture(options);t.after(()=>f.close());const created=await f.request('/api/account/manual-drafts',{method:'POST',body:{request_key:key(),manual}});assert.equal(created.status,200);return {...f,id:created.body.id,base:'/api/account/manual-drafts/'+created.body.id,accountId:f.users[0].user.id};}
const uploadBody=(revision,extra={})=>({operation_id:key(),revision,copies_confirmed:true,image:{name:'screened-page.jpg',type:'image/jpeg',buffer:jpeg},...extra});
const formFor=payload=>{const form=new FormData();for(const field of ['operation_id','revision','target_page_id','copies_confirmed','website'])if(payload[field]!==undefined)form.set(field,String(payload[field]));form.set('images',new Blob([payload.image.buffer],{type:payload.image.type}),payload.image.name);return form;};
const get=async f=>(await f.request(f.base)).body;
const upload=async(f,revision,extra={})=>{const body=uploadBody(revision,extra);const response=await f.request(f.base+'/pages/upload',{method:'POST',body:formFor(body)});return {body,...response};};

test('超过八页可分批继续保存；重开与文字修改保留整册，仍未送审',async t=>{
  const f=await fixture(t),original=sha(jpeg);let revision=1;
  for(let i=0;i<12;i++){const result=await upload(f,revision);assert.equal(result.status,200);revision=result.body?.revision??result.revision;}
  const record=await get(f);assert.equal(record.images.length,12);assert.equal(record.revision,13);assert.equal(record.status,'draft');assert.equal(record.consent.rights,false);assert.equal(sha(jpeg),original);
  const saved=await f.request(f.base,{method:'POST',body:{revision:13,manual:{...manual,edition_display:'合成第二版'}}});assert.equal(saved.status,200);
  const reloaded=await get(f);assert.equal(reloaded.images.length,12);assert.deepEqual(reloaded.images.map(p=>p.page_id),record.images.map(p=>p.page_id));assert.equal(reloaded.manual_metadata.edition_display,'合成第二版');
  assert.equal((await f.request('/api/account/submissions')).body.items[0].image_count,12);
  await assert.rejects(f.submissions.submitAccountSubmission({id:f.id,accountId:f.accountId,revision:14,payload:{consent_version:consentVersion,consents:{copies:true,rights:true,privacy:true,processing:true}}}),{statusCode:409});
  await assert.rejects(f.submissions.review(f.id,{revision:14,status:'approved',rights_reviewed:true}),{statusCode:409});
});

test('上传重试与回执查询不重复加页；同一凭证内容改变和旧版本均被阻断',async t=>{
  const f=await fixture(t),payload=uploadBody(1);
  const first=await f.request(f.base+'/pages/upload',{method:'POST',body:formFor(payload)});assert.equal(first.status,200);
  const repeated=await f.request(f.base+'/pages/upload',{method:'POST',body:formFor(payload)});assert.equal(repeated.status,200);assert.equal(repeated.body.repeated,true);assert.equal(repeated.body.revision,2);
  const receipt=await f.request(f.base+'/pages/operations/'+payload.operation_id);assert.equal(receipt.body.applied,true);assert.equal(receipt.body.page_id,first.body.page_id);
  assert.equal((await f.request(f.base+'/pages/operations/'+key())).body.applied,false);
  assert.equal((await f.request(f.base+'/pages/upload',{method:'POST',body:formFor({...payload,image:{name:'different.png',type:'image/png',buffer:replacement}})})).status,409);
  assert.equal((await upload(f,1)).status,409);assert.equal((await get(f)).images.length,1);
});

test('页序、原文页码、说明可保存；替换保持页身份和位置，旧副本保留并计入容量',async t=>{
  const f=await fixture(t);for(let rev=1;rev<=3;rev++)assert.equal((await upload(f,rev)).status,200);
  const before=await get(f),ordered=[...before.images].reverse().map((p,i)=>({page_id:p.page_id,label:i===0?'封面':'i-'+i,note:'<b>合成原文</b>'}));
  const orderPayload={operation_id:key(),revision:4,action:'reorder',pages:ordered};assert.equal((await f.request(f.base+'/pages',{method:'POST',body:orderPayload})).status,200);
  assert.equal((await f.request(f.base+'/pages',{method:'POST',body:orderPayload})).body.repeated,true);
  const sorted=await get(f);assert.deepEqual(sorted.images.map(p=>p.page_id),ordered.map(p=>p.page_id));assert.equal(sorted.images[0].label,'封面');
  const old=sorted.images[0],changed=await upload(f,5,{target_page_id:old.page_id,image:{name:'new-screening-copy.png',type:'image/png',buffer:replacement}});assert.equal(changed.status,200);
  const replaced=await get(f);assert.equal(replaced.images[0].page_id,old.page_id);assert.equal(replaced.images[0].label,'封面');assert.equal(replaced.images[0].note,'<b>合成原文</b>');assert.notEqual(replaced.images[0].filename,old.filename);
  const oldFile=path.join(f.root,'submissions',f.id,old.filename);assert((await fs.stat(oldFile)).size>0);
  const removed=replaced.images[1],remove={operation_id:key(),revision:6,action:'remove',page_id:removed.page_id};assert.equal((await f.request(f.base+'/pages',{method:'POST',body:remove})).status,200);
  const record=await get(f);assert.equal(record.images.length,2);assert.equal(record.manual_upload_usage.stored_copies,4);assert((await fs.stat(path.join(f.root,'submissions',f.id,removed.filename))).size>0);
  const allFiles=(await fs.readdir(path.join(f.root,'submissions',f.id))).filter(file=>file.endsWith('.jpg'));const total=(await Promise.all(allFiles.map(async file=>(await fs.stat(path.join(f.root,'submissions',f.id,file))).size))).reduce((a,b)=>a+b,0);
  assert.equal(record.manual_upload_usage.stored_bytes,total);assert.equal((await f.submissions.accountUsage(f.accountId)).storage_left_bytes,200*1024*1024-total);
  for(const field of ['manual_page_receipts','manual_page_archive','manual_last_save','fingerprint','private_note'])assert.equal(Object.hasOwn(record,field),false);
  const retired=await fetch(f.origin+f.base+'/images/'+old.filename,{headers:{Cookie:f.cookie()}});assert.equal(retired.status,404);
});

test('私密图片仅本人当前草稿可读取，响应禁止缓存；未登录与其他账号无法读写或查回执',async t=>{
  const f=await fixture(t),result=await upload(f,1);assert.equal(result.status,200);const record=await get(f),file=record.images[0].filename;
  const response=await fetch(f.origin+f.base+'/images/'+file,{headers:{Cookie:f.cookie()}});assert.equal(response.status,200);assert.match(response.headers.get('Cache-Control'),/no-store/);assert.equal(response.headers.get('Cross-Origin-Resource-Policy'),'same-origin');
  const bytes=Buffer.from(await response.arrayBuffer()),info=await sharp(bytes).metadata();assert.equal(info.width,60);assert.equal(info.height,100);assert.equal(info.exif,undefined);
  for(const user of [null,f.users[1]]){
    const status=user?404:401;assert.equal((await f.request(f.base+'/pages/upload',{user,method:'POST',body:formFor(uploadBody(2))})).status,status);
    assert.equal((await f.request(f.base+'/pages/operations/'+result.body.operation_id,{user})).status,status);
    assert.equal((await fetch(f.origin+f.base+'/images/'+file,{headers:user?{Cookie:f.cookie(user)}:{}})).status,status);
  }
  assert.equal((await f.request(f.base+'/pages',{method:'POST',body:{action:'remove',operation_id:key(),revision:2,page_id:record.images[0].page_id},headers:{Origin:'https://other.example.invalid'}})).status,403);
});

test('文件伪装、SVG、PDF、TIFF、损坏图、缺少副本确认及批量请求均不能写入',async t=>{
  const f=await fixture(t);const invalid=[{name:'page.pdf',type:'application/pdf',buffer:Buffer.from('%PDF-1')},{name:'page.tiff',type:'image/tiff',buffer:jpeg},{name:'fake.jpg',type:'image/jpeg',buffer:Buffer.from('<svg/>')},{name:'broken.jpg',type:'image/jpeg',buffer:jpeg.subarray(0,20)},{name:'wrong.png',type:'image/png',buffer:jpeg},{name:'原始扫描.jpg',type:'image/jpeg',buffer:jpeg}];
  for(const image of invalid)assert.equal((await upload(f,1,{image})).status,400);
  assert.equal((await upload(f,1,{copies_confirmed:false})).status,400);
  const big=Buffer.alloc(manualPageLimits.imageBytes+1);jpeg.copy(big);assert.equal((await upload(f,1,{image:{name:'big.jpg',type:'image/jpeg',buffer:big}})).status,413);
  const many=formFor(uploadBody(1));many.append('images',new Blob([jpeg],{type:'image/jpeg'}),'second.jpg');assert.equal((await f.request(f.base+'/pages/upload',{method:'POST',body:many})).status,400);
  const hidden=formFor(uploadBody(1));hidden.set('mode','pending');assert.equal((await f.request(f.base+'/pages/upload',{method:'POST',body:hidden})).status,400);
  const tooBig=Buffer.alloc(manualPageLimits.requestBytes+1);assert.equal((await upload(f,1,{image:{name:'too-big.jpg',type:'image/jpeg',buffer:tooBig}})).status,413);
  assert.equal((await get(f)).revision,1);assert.deepEqual((await fs.readdir(path.join(f.root,'submissions',f.id))).sort(),['record.json']);
});

test('伪造或遗漏页序、重复页面、无效页码、额外权限字段及版本冲突不修改草稿',async t=>{
  const f=await fixture(t);await upload(f,1);await upload(f,2);const record=await get(f),pages=record.images.map(p=>({page_id:p.page_id,label:'',note:''}));
  for(const extra of [{pages:[pages[0]]},{pages:[pages[0],pages[0]]},{pages:[pages[0],{...pages[1],page_id:'MP-'+'f'.repeat(24)}]},{pages:[{...pages[0],label:'字'.repeat(41)},pages[1]]},{rights_reviewed:true}]){
    const response=await f.request(f.base+'/pages',{method:'POST',body:{operation_id:key(),revision:3,action:'reorder',pages,...extra}});assert([400,409].includes(response.status));
  }
  assert.equal((await f.request(f.base+'/pages',{method:'POST',body:{operation_id:key(),revision:2,action:'reorder',pages}})).status,409);
  assert.equal((await get(f)).revision,3);
});

test('中断在图片落盘与记录切换之间，重试复用同一副本；未引用图不可读取且占用计入容量',async t=>{
  const f=await fixture(t),payload=uploadBody(1),rename=fs.rename;
  const mocked=t.mock.method(fs,'rename',async(from,to)=>{if(to===path.join(f.root,'submissions',f.id,'record.json'))throw Object.assign(new Error('synthetic write interruption'),{code:'EIO'});return rename(from,to);});
  await assert.rejects(f.submissions.uploadAccountManualPage({id:f.id,accountId:f.accountId,payload}),/synthetic write interruption/);mocked.mock.restore();
  const interrupted=await get(f);assert.equal(interrupted.images.length,0);assert.equal(interrupted.manual_upload_usage.stored_copies,1);assert.equal((await f.request(f.base+'/pages/operations/'+payload.operation_id)).body.applied,false);
  const retry=await f.submissions.uploadAccountManualPage({id:f.id,accountId:f.accountId,payload});assert.equal(retry.revision,2);
  const completed=await get(f);assert.equal(completed.images.length,1);assert.equal(completed.manual_upload_usage.stored_copies,1);
});

test('并发与暂停都不绕过版本和配额；暂停期间可以读取图片与保存回执',async t=>{
  const f=await fixture(t),both=await Promise.all([upload(f,1),upload(f,1)]);assert.deepEqual(both.map(r=>r.status).sort(),[200,409]);
  const record=await get(f);f.setUploadsOpen(false);
  assert.equal((await upload(f,record.revision)).status,503);
  assert.equal((await f.request(f.base+'/pages',{method:'POST',body:{action:'remove',operation_id:key(),revision:2,page_id:record.images[0].page_id}})).status,503);
  assert.equal((await f.request(f.base)).status,200);assert.equal((await f.request(f.base+'/pages/operations/'+both.find(r=>r.status===200).body.operation_id)).body.applied,true);
  assert.equal((await fetch(f.origin+f.base+'/images/'+record.images[0].filename,{headers:{Cookie:f.cookie()}})).status,200);
});

test('每册200页及100 MB含保留副本的边界不允许超出',async t=>{
  const f=await fixture(t),filename=path.join(f.root,'submissions',f.id,'record.json');
  const raw=JSON.parse(await fs.readFile(filename,'utf8'));raw.images=Array.from({length:200},(_,i)=>({filename:`manual-${i.toString(16).padStart(64,'0')}.jpg`,page_id:'MP-'+i.toString(16).padStart(24,'0'),original_name:'合成容量页.jpg',bytes:0,label:'',note:''}));await fs.writeFile(filename,JSON.stringify(raw));
  assert.equal((await upload(f,1)).status,413);raw.images=[];await fs.writeFile(filename,JSON.stringify(raw));
  const reserve=path.join(f.root,'submissions',f.id,'manual-'+'f'.repeat(64)+'.jpg');const handle=await fs.open(reserve,'wx');await handle.truncate(manualPageLimits.bookBytes);await handle.close();
  assert.equal((await upload(f,1)).status,413);assert.equal((await get(f)).images.length,0);
});

test('账号200 MB和暂存区容量都包含私密保留副本，不能通过反复替换规避',async t=>{
  const f=await fixture(t),other=await f.request('/api/account/manual-drafts',{method:'POST',body:{request_key:key(),manual}});
  const reserve=path.join(f.root,'submissions',other.body.id,'manual-'+'e'.repeat(64)+'.jpg'),handle=await fs.open(reserve,'wx');await handle.truncate(200*1024*1024);await handle.close();
  assert.equal((await upload(f,1)).status,429);
  const tight=createSubmissionStore({root:path.join(f.root,'submissions'),siteDirectory:new URL('../../site/',import.meta.url).pathname.replace(/^\/([A-Z]:)/,'$1'),maxStorageBytes:200*1024*1024});
  // 用另一账号验证全收件区容量，不让同账号配额先遮蔽该门禁。
  const second=await tight.createAccountManualDraft({accountId:f.users[1].user.id,payload:{request_key:key(),manual}});
  await assert.rejects(tight.uploadAccountManualPage({id:second.id,accountId:f.users[1].user.id,payload:uploadBody(1)}),{statusCode:503});
});

test('说明书请求有独立有界配额，普通账号请求仍遵守原有限流',async t=>{
  const f=await fixture(t,{handlerOptions:{ipRateLimit:{maximum:2,windowSeconds:600},manualRateLimit:{maximum:5,windowSeconds:600}}});
  for(let i=0;i<4;i++)assert.equal((await f.request(f.base)).status,200);
  assert.equal((await f.request(f.base)).status,429);
  assert.equal((await f.request('/api/account/config')).status,200);assert.equal((await f.request('/api/account/me')).status,200);assert.equal((await f.request('/api/account/config')).status,429);
});
