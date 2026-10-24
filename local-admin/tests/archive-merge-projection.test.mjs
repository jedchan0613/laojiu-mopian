import test from 'node:test';
import assert from 'node:assert/strict';
import {resolveArchiveMergeProjection} from '../../shared/archive-merge-projection.mjs';
import {sample} from './helpers/merge-fixture.mjs';
test('旧链接按当前文件名重算页序，移除影像、撤下主件后不绕过公开状态',()=>{
 const primary=sample('001'),secondary=sample('002');primary.core.publication_file_path.push(`/archive/${primary.core.item_id}/detail-01-public.png`);
 const projection={schema_version:1,aliases:{[secondary.core.item_id]:{target_id:primary.core.item_id,images:[{source_position:1,target_filename:'detail-01-public.png'}]}}};
 assert.equal(resolveArchiveMergeProjection([primary],projection)[secondary.core.item_id].images[1],2);
 primary.core.publication_file_path.reverse();assert.equal(resolveArchiveMergeProjection([primary],projection)[secondary.core.item_id].images[1],1);
 primary.core.publication_file_path=primary.core.publication_file_path.slice(1);assert.equal(resolveArchiveMergeProjection([primary],projection)[secondary.core.item_id].images[1],null);
 primary.core.use_status='U4';assert.deepEqual(resolveArchiveMergeProjection([primary],projection),{});
});
test('公开别名拒绝循环、现有活跃旧号、路径和多余私密字段',()=>{
 const primary=sample('001'),secondary=sample('002');const base={schema_version:1,aliases:{[secondary.core.item_id]:{target_id:primary.core.item_id,images:[{source_position:1,target_filename:'front-public.png'}]}}};
 assert.throws(()=>resolveArchiveMergeProjection([primary,secondary],base));
 for(const patch of [{target_id:secondary.core.item_id},{operator:'private actor'},{images:[{source_position:1,target_filename:'../private.jpg'}]},{images:[{source_position:1,target_filename:'front-public.png',private_note:'hidden'}]}]){
   const value=structuredClone(base);Object.assign(value.aliases[secondary.core.item_id],patch);assert.throws(()=>resolveArchiveMergeProjection([primary],value));
 }
});
