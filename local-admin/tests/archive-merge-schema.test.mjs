import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fixture,standards} from './helpers/merge-fixture.mjs';

// 从现行字典生成合成资料，不借用真实档案、号码、主图或人工批准例外。
async function configure(f,type,schema){
 const s=await standards(),multi=new Set(['themes','condition_details','carrier','color','process','verso_types','postal_mark_types','card_functions','card_technologies']);
 const entries=key=>s.codeDictionary.entries.filter(row=>row.enabled&&row.dictionary_key===key);
 for(const record of f.records){
   record.core.object_type=type;record.metadata={schema,dimensions:{}};
   for(const dimension of s.collectionCodeRules.schemas[schema]?.required_dimensions??[]){
     const fields=dimension.fields.map(row=>typeof row==='string'?{field_code:row}:row);
     const set=(field,value)=>{
       const core=field.scope==='core'||s.fieldRouting.core_canonical_fields.includes(field.field_code);
       const target=core?record.core:(record.metadata.dimensions[dimension.dimension_code]??={});
       if(target[field.field_code]===undefined)target[field.field_code]=value;
     };
     for(const field of dimension.code_fields??[]){const allowed=entries(field.dictionary_key),code=(allowed.find(row=>/-UNK$/.test(row.code))??allowed[0]).code;set(field,multi.has(field.field_code)?[code]:code);}
     const hasValue=fields.some(field=>(field.scope==='core'||s.fieldRouting.core_canonical_fields.includes(field.field_code)?record.core:record.metadata.dimensions[dimension.dimension_code])?.[field.field_code]!==undefined);
     if(!hasValue){const field=fields.find(row=>!/date$|_date$|missing_pages|_ids$/.test(row.field_code))??fields[0];set(field,'合成验收资料，未提供');}
   }
   if(schema==='card')record.metadata.dimensions.CD21={redaction_status:s.codeDictionary.entries.find(row=>row.enabled&&row.dictionary_key==='redaction_status'&&row.code==='RD-MASK').code};
   // 保留原永久号，模拟只调整分类元数据的既有记录，不重分配或复用永久编号。
   await fs.writeFile(path.join(f.archive,record.core.item_id+'.json'),JSON.stringify(record));
 }
}

for(const[type,schema]of [['PHO','photo'],['PST','postcard'],['NTB','diary_notebook'],['IDC','credential'],['CRD','card'],['LET','common'],['RPR','common'],['OTH','common']])test(type+'：真实管理字段校验、合并与恢复发布，永久号和schema不变',async t=>{
 const f=await fixture(t,{http:true,internal:true});await configure(f,type,schema);
 const pf=(await f.post('/api/merge-preflight',{itemIds:f.ids})).body;assert.equal(pf.canCompare,true,JSON.stringify(pf.blockers));
 const payload=f.payload(pf),saved=await f.post('/api/merge-plan',payload);assert.equal(saved.status,200,JSON.stringify(saved.body));
 const plan=saved.body.plan,review=await f.post('/api/merge-review',{planId:plan.planId,planRevision:plan.planRevision});assert.equal(review.status,200,JSON.stringify(review.body));
 const merged=await f.post('/api/merge',{planId:plan.planId,planRevision:plan.planRevision,reviewId:review.body.reviewId,confirmPrimaryId:f.ids[0],confirmations:Array(13).fill(true),publicationAuthorization:{publishMergedPrimary:true,withdrawSecondary:true}});assert.equal(merged.status,200,JSON.stringify(merged.body));
 const undo=await f.post('/api/merge-undo-review',{mergeId:merged.body.merge.merge_id});assert.equal(undo.status,200,JSON.stringify(undo.body));assert.equal(undo.body.canPublish,true,JSON.stringify(undo.body.conflicts));
 const restored=await f.post('/api/merge-undo',{mergeId:merged.body.merge.merge_id,reviewId:undo.body.reviewId,mode:'republish',confirmPrimaryId:f.ids[0],confirmSecondaryId:f.ids[1],confirmations:Array(13).fill(true),publicationAuthorization:{restorePrimary:true,restoreSecondary:true,restoreReferences:true}});assert.equal(restored.status,200,JSON.stringify(restored.body));
 for(const id of f.ids){const row=JSON.parse(await fs.readFile(path.join(f.archive,id+'.json'),'utf8'));assert.equal(row.core.item_id,id);assert.equal(row.core.object_type,type);assert.equal(row.metadata.schema,schema);assert.equal(row.core.use_status,'U3');assert.match(row.core.collection_code,new RegExp('^'+type+'_'));}
});
