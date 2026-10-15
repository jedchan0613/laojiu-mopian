import assert from 'node:assert/strict';
import test from 'node:test';
import {readFile} from 'node:fs/promises';
const source=await readFile(new URL('../../site/src/pages/archive/[id].astro',import.meta.url),'utf8');
const start=source.indexOf('const getImageRole =');
const end=source.indexOf('const galleryImages =',start);
assert.ok(start>=0 && end>start);
const declaration=source.slice(start,end).replace('(description: string, index: number)','(description, index)');
const getImageRole=new Function('t','locale',declaration+'\nreturn getImageRole;')((text,locale,params)=>text.replace('{0}',params?.[0]??''),'zh-CN');
test('册内选览和非实物封面不会被子串误识别为实物封面',()=>{
 assert.equal(getImageRole('册内影像选览，非实物封面。选取6幅发布副本组成。',0),'册内影像选览');
 assert.equal(getImageRole('非实物封面，仅为册内照片选览。',0),'册内影像选览');
});
test('真实封面、背面和无角色的组内照片仍保留原有角色',()=>{
 assert.equal(getImageRole('相册实物封面。',0),'封面');
 assert.equal(getImageRole('照片背面，含手写日期。',1),'背面');
 assert.equal(getImageRole('第2幅：室内并坐的两位女子。',1),'图片 2');
});
