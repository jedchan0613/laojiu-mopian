import test from 'node:test';
import assert from 'node:assert/strict';
import {randomBytes} from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import {createManualAccountFixture} from './helpers/manual-account-fixture.mjs';
import {createOnlineReviewFixture} from './helpers/manual-review-online-fixture.mjs';
import {medicineSubmissionsEnabled} from '../manual-review-access.mjs';

const key=()=>randomBytes(32).toString('hex');
const medicine={generic_name:'合成资料甲',strength:'甲规格',dosage_form:'示例剂型',companies:[{role:'manufacturer',name:'虚构企业'}]};
const version={schema_version:2,category_key:'medicines',brand_name:'',model_texts:[],product_name:'',medicine};
const existingKey='medicine-synthetic';

test('药品开关线上显式开启，本地默认开启，拼写错误停止启动',()=>{
  assert.equal(medicineSubmissionsEnabled({},true),false);
  assert.equal(medicineSubmissionsEnabled({},false),true);
  assert.equal(medicineSubmissionsEnabled({LJM_MANUAL_MEDICINES_ONLINE_ENABLED:'true'},true),true);
  assert.throws(()=>medicineSubmissionsEnabled({LJM_MANUAL_MEDICINES_ONLINE_ENABLED:'yes'},true),/true 或 false/);
});

test('账号药品开关独立于既有投稿和PDF，关停后保留归属、记录、图片与版本',async t=>{
  const f=await createManualAccountFixture({handlerOptions:{medicinesOpen:false,pdfOpen:false}});
  t.after(()=>f.close());
  const create=manual=>f.request('/api/account/manual-drafts',{method:'POST',body:{request_key:key(),manual}});
  const config=()=>f.request('/api/account/config');
  assert.equal((await config()).body.manual_medicines_version,0);
  assert.equal((await create(version)).status,503);
  assert.equal((await create({schema_version:1,category_key:'medicines',brand_name:'合成旧目录'})).status,200);
  f.setMedicinesOpen(true);
  const open=(await config()).body;
  assert.equal(open.manual_medicines_version,1);
  assert.equal(open.manual_pdf_uploads_version,0);
  const created=await create(version);
  assert.equal(created.status,200,JSON.stringify(created.body));
  const draft='/api/account/manual-drafts/'+created.body.id;
  const workflow='/api/account/manual-submissions/'+created.body.id;
  f.setMedicinesOpen(false);
  const before=(await f.request(draft)).body;
  assert.deepEqual(before.manual_metadata.medicine.strength,medicine.strength);
  assert.equal((await f.request(draft,{user:f.users[1]})).status,404);
  assert.equal((await f.request(draft,{method:'POST',body:{revision:before.revision,manual:version}})).status,503);
  assert.equal((await f.request(draft+'/pages',{method:'POST',body:{revision:before.revision}})).status,503);
  assert.equal((await f.request(workflow+'/operate',{method:'POST',body:{action:'submit',revision:before.revision,operation_id:key()}})).status,503);
  assert.deepEqual((await f.request(draft)).body,before);
  f.setMedicinesOpen(true);
  assert.equal((await f.request(draft,{method:'POST',body:{revision:before.revision,manual:{...version,medicine:{...medicine,strength:'乙规格'}}}})).status,200);
  assert.equal((await f.request(draft)).body.manual_metadata.medicine.strength,'乙规格');
});

test('线上目录、审核及转入使用独立药品开关，关停及重开保留相同私密草稿',async t=>{
  const f=await createOnlineReviewFixture(t,{enabled:true,transferEnabled:true,official:true,pages:0,metadata:version});
  const status=async()=>(await f.get('/healthz')).body.capabilities;
  const detail=async()=>(await f.get(f.base)).body;
  assert.equal((await status()).manualMedicineVersion,0);
  const closed=await detail();
  assert.equal(closed.record.versions[0].manual_metadata.medicine.strength,medicine.strength);
  assert.equal(closed.context.reviewWritable,false);
  assert.equal((await f.post(f.base+'/review',f.approval(await f.raw()))).status,409);
  f.env.LJM_MANUAL_MEDICINES_ONLINE_ENABLED='true';
  f.env.LJM_MANUAL_REVIEW_ONLINE_ENABLED='false';
  f.env.LJM_MANUAL_TRANSFER_ONLINE_ENABLED='false';
  await f.restart();
  const open=await status();
  assert.equal(open.manualMedicineVersion,1);
  assert.equal(open.manualPdfHandoffVersion,0);
  assert.equal((await f.get('/admin/manuals-medicines.js')).status,200);
  const catalogue={schema_version:2,brands:[],models:[],documents:[],medicines:[{...medicine,medicine_key:existingKey}]};
  const saved=await f.save(catalogue,{medicineDraftVersion:1});
  assert.equal(saved.status,200,JSON.stringify(saved.body));
  f.env.LJM_MANUAL_REVIEW_ONLINE_ENABLED='true';
  f.env.LJM_MANUAL_TRANSFER_ONLINE_ENABLED='true';
  await f.restart();
  const choice=await detail();
  assert.deepEqual(choice.medicine_candidates.map(m=>m.medicine_key),[existingKey]);
  assert.equal(choice.context.reviewWritable,process.platform==='linux');
  assert.equal(choice.context.transferWritable,process.platform==='linux');
  if(process.platform==='linux'){
    const approved=await f.post(f.base+'/review',f.approval(await f.raw()));
    assert.equal(approved.status,200,JSON.stringify(approved.body));
    const fresh=await detail(),snapshot=fresh.record.versions.at(-1);
    const transfer=await f.post(f.base+'/transfer',{
      revision:fresh.record.revision,submitted_revision:snapshot.revision,snapshot_digest:snapshot.digest,
      catalog_revision:fresh.catalog_revision,confirmed:true,title:'合成资料说明书',public_description:'合成测试资料。',
      region_display:'地区未注明',edition_display:'合成一版',official_source_name:'合成来源',
      checked_on:'2026-01-01',source_available:true,medicine_match:{mode:'existing',medicine_keys:[existingKey]}
    });
    assert.equal(transfer.status,200,JSON.stringify(transfer.body));
    const state=(await f.get('/api/manuals')).body.state;
    assert.deepEqual(state.draft.documents.at(-1).medicine_keys,[existingKey]);
    assert.equal(state.published.documents.length,0);
  }
  const stateFile=path.join(f.root,'state.json');
  const bytes=await fs.readFile(stateFile);
  f.env.LJM_MANUAL_MEDICINES_ONLINE_ENABLED='false';
  await f.restart();
  const frozen=await detail();
  assert.equal(frozen.context.transferWritable,false);
  assert.equal(frozen.context.transferWriteReason,'medicine_catalog_paused');
  if(process.platform!=='linux'){
    // Windows 没有线上跨进程发布锁，单独检查草稿模式下的数据保护。
    f.env.LJM_MANUAL_REVIEW_ONLINE_ENABLED='false';
    f.env.LJM_MANUAL_TRANSFER_ONLINE_ENABLED='false';
    await f.restart();
  }
  assert.equal((await status()).manualMedicineVersion,0);
  const blocked=await f.save({schema_version:1,brands:[],models:[],documents:[]});
  assert.equal(blocked.status,409);
  assert.equal(blocked.body.code,'MANUALS_MEDICINE_DISABLED');
  assert.deepEqual(await fs.readFile(stateFile),bytes);
  f.env.LJM_MANUAL_MEDICINES_ONLINE_ENABLED='true';
  await f.restart();
  assert.equal((await f.get('/api/manuals')).body.state.draft.medicines[0].medicine_key,existingKey);
  assert.deepEqual(await fs.readFile(stateFile),bytes);
});
