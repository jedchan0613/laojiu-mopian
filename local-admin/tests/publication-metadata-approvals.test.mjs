import assert from 'node:assert/strict';
import test from 'node:test';
import { albumMissingMetadataNotice, dalianMissingMetadataNotice, graduationAlbumMissingBackNotice, october29PhotoMissingMetadataNotice, filterApprovedMetadataIssues } from '../../shared/publication-metadata-approvals.mjs';

const record = () => ({core:{item_id:'LJM-20260909-PHO-001',album_id:'LJM-A20260909-01',batch_id:'LJM-20260909-B01',accession_date:'2026-09-09',object_type:'PHO'},metadata:{schema:'photo',dimensions:{}},public_view:{description:albumMissingMetadataNotice}});
const issues = ['collection_required_D12','collection_required_D16','collection_required_D02','privacy_confirmation','images_empty','collection_code_invalid_D12_verso_types_FAKE'].map(code=>({code}));
test('本册已批准缺项可保留未知，地点、隐私、图片和非法代码仍阻断',()=>{
  assert.deepEqual(filterApprovedMetadataIssues(record(),issues),issues.slice(2));
});
test('授权不扩散到其他编号、批次、相册或缺少公开说明的档案',()=>{
  for(const [field,value] of [['item_id','LJM-20260909-PHO-056'],['album_id','other'],['batch_id','other'],['accession_date','2026-09-10'],['object_type','LET']]){
    const r=record();r.core[field]=value;assert.deepEqual(filterApprovedMetadataIssues(r,issues),issues);
  }
  const r=record();r.public_view.description='';assert.deepEqual(filterApprovedMetadataIssues(r,issues),issues);
});
test('已经填入值的字段不享受缺失豁免，合法补录无需继续依赖豁免',()=>{
  const r=record();r.metadata.dimensions.D12={verso_types:['FAKE']};r.core.condition_grade='FAKE';r.core.condition_details=['FAKE'];
  assert.deepEqual(filterApprovedMetadataIssues(r,issues),issues);
});
test('大连七张照片只认可缺失背面，总册才认可缺失实物评级，隐私与非法代码不豁免',()=>{
  const r={core:{item_id:'LJM-20261018-PHO-001',album_id:'LJM-20261018-ALB-001',batch_id:'FSA-20261018-B01',accession_date:'2026-10-18',object_type:'PHO'},metadata:{schema:'photo',dimensions:{}},public_view:{description:dalianMissingMetadataNotice}};
  assert.deepEqual(filterApprovedMetadataIssues(r,issues),issues.slice(1));
  r.core.item_id='LJM-20261018-ALB-001';r.core.object_type='ALB';
  assert.deepEqual(filterApprovedMetadataIssues(r,issues),issues.slice(2));
  for(const change of [{item_id:'LJM-20261018-PHO-008'},{album_id:'other'},{batch_id:'other'},{accession_date:'2026-10-19'}]){
    assert.deepEqual(filterApprovedMetadataIssues({...r,core:{...r.core,...change}},issues),issues);
  }
  assert.deepEqual(filterApprovedMetadataIssues({...r,public_view:{description:''}},issues),issues);
  r.metadata.dimensions.D12={verso_types:['FAKE']};
  assert.ok(filterApprovedMetadataIssues(r,issues).some(issue=>issue.code==='collection_code_invalid_D12_verso_types_FAKE'));
});

const graduationRecord = () => ({core:{item_id:'LJM-20260910-ALB-001',album_id:'LJM-A20260910-DOHTO-01',batch_id:'LJM-20260910-B02',accession_date:'2026-09-10',object_type:'ALB'},metadata:{schema:'photo',dimensions:{}},public_view:{description:graduationAlbumMissingBackNotice}});
test('毕业相册本次授权只允许缺失背面，不豁免保存评级、隐私、图片或非法代码',()=>{
  const r=graduationRecord();
  const pending=[{code:'collection_code_required_D12_verso_types'},...issues];
  assert.deepEqual(filterApprovedMetadataIssues(r,pending),issues.slice(1));
  r.metadata.dimensions.D12={verso_types:['FAKE']};
  assert.deepEqual(filterApprovedMetadataIssues(r,pending),pending);
});
test('毕业相册授权同时限定永久号、相册、批次、入藏日期、类型、schema和公开缺项说明',()=>{
  for(const change of [{item_id:'LJM-20260910-ALB-002'},{album_id:'other'},{batch_id:'other'},{accession_date:'2026-09-11'},{object_type:'PHO'}]){
    const r=graduationRecord();Object.assign(r.core,change);assert.deepEqual(filterApprovedMetadataIssues(r,issues),issues);
  }
  const r=graduationRecord();r.metadata.schema='common';assert.deepEqual(filterApprovedMetadataIssues(r,issues),issues);
  r.metadata.schema='photo';r.public_view.description='';assert.deepEqual(filterApprovedMetadataIssues(r,issues),issues);
});

const october29Record = () => ({core:{item_id:'LJM-20260910-PHO-002',batch_id:'LJM-20260910-B03',accession_date:'2026-09-10',object_type:'PHO',place_notes:'地点未知。'},metadata:{schema:'photo',dimensions:{}},public_view:{description:october29PhotoMissingMetadataNotice+'未提供可确认属于本件的照片背面，背面文字待核。'}});
const october29Issues=['collection_required_D02','collection_code_required_D12_verso_types','collection_code_required_D16_condition_grade','collection_code_required_D16_condition_details','privacy_confirmation','images_empty','collection_code_invalid_D12_verso_types_FAKE'].map(code=>({code}));
test('10月29日本批真实缺项限定授权只过滤已批准空项，不过滤隐私、图片及非法代码',()=>{
  assert.deepEqual(filterApprovedMetadataIssues(october29Record(),october29Issues),october29Issues.slice(4));
});
test('10月29日本批已有地点/背面的两件照片不享受相应缺项豁免',()=>{
  const r=october29Record();r.core.item_id='LJM-20260910-PHO-001';
  assert.deepEqual(filterApprovedMetadataIssues(r,october29Issues),[...october29Issues.slice(0,2),...october29Issues.slice(4)]);
  r.core.item_id='LJM-20260910-PHO-003';
  assert.deepEqual(filterApprovedMetadataIssues(r,october29Issues),[october29Issues[1],...october29Issues.slice(4)]);
});
test('10月29日限定授权不扩散到其他号、批次、日期、类型、schema或缺说明记录',()=>{
  for(const change of [{item_id:'LJM-20260910-PHO-021'},{batch_id:'LJM-20260910-B02'},{accession_date:'2026-10-29'},{object_type:'LET'}]){
    const r=october29Record();Object.assign(r.core,change);assert.deepEqual(filterApprovedMetadataIssues(r,october29Issues),october29Issues);
  }
  const r=october29Record();r.metadata.schema='common';assert.deepEqual(filterApprovedMetadataIssues(r,october29Issues),october29Issues);
  r.metadata.schema='photo';r.public_view.description='';assert.deepEqual(filterApprovedMetadataIssues(r,october29Issues),october29Issues);
});
test('10月29日已填值不享受缺项豁免，未知地点还须有公开说明',()=>{
  const r=october29Record();r.core.country='未知';r.metadata.dimensions.D12={verso_types:['FAKE']};r.core.condition_grade='FAKE';r.core.condition_details=['FAKE'];
  assert.deepEqual(filterApprovedMetadataIssues(r,october29Issues),october29Issues);
  const other=october29Record();other.core.place_notes='';assert.ok(filterApprovedMetadataIssues(other,october29Issues).some(i=>i.code==='collection_required_D02'));
});
