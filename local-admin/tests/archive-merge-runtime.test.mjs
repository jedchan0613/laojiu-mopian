import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {createRequire} from 'node:module';
import {randomUUID} from 'node:crypto';
import {fixture,projectRoot} from './helpers/merge-fixture.mjs';
import {createMergeImageValidator} from '../archive-merge-runtime.mjs';
import {acquirePrivateFileGate,releasePrivateFileGate} from '../../shared/private-file-gate.mjs';
import {validateLikesSnapshot} from '../../shared/archive-merge-likes.mjs';

test('完整解码会拒绝损坏、超尺寸和隐藏EXIF信息；不修改原字节',async()=>{
 const sharp=createRequire(path.join(projectRoot,'site/package.json'))('sharp'),validate=createMergeImageValidator(path.join(projectRoot,'site'));
 const input=sharp({create:{width:30,height:40,channels:3,background:'#eae1cf'}}),valid=await input.png().toBuffer(),before=Buffer.from(valid);
 assert.equal((await validate(valid,'front-public.png')).width,30);assert.deepEqual(valid,before);
 await assert.rejects(validate(valid.subarray(0,20),'front-public.png'),{code:'MERGE_IMAGE_DECODE_INVALID'});
 const hidden=await input.clone().withMetadata().jpeg().toBuffer();await assert.rejects(validate(hidden,'front-public.jpg'),{code:'MERGE_IMAGE_METADATA_REVIEW'});
 const large=await sharp({create:{width:2001,height:3,channels:3,background:'white'}}).png().toBuffer();await assert.rejects(validate(large,'front-public.png'),{code:'MERGE_IMAGE_DECODE_INVALID'});
});
test('点赞快照严格遵守实际服务格式，异常或缺版本不能被当作0',()=>{
 assert.throws(()=>validateLikesSnapshot({items:{}}));assert.throws(()=>validateLikesSnapshot({version:1,items:{bad:{voters:[]}}}));
 assert.throws(()=>validateLikesSnapshot({version:1,items:{'LJM-20000101-LET-001':{voters:{}}}}));
 assert.equal(Object.keys(validateLikesSnapshot({version:1,items:{}}).items).length,0);
});
test('文件门禁拒绝重复取得和未知归属；错误令牌不能解除别人的门禁',async t=>{
 const f=await fixture(t),file=path.join(f.privateRoot,'likes.json');await fs.writeFile(file,'{}');
 const gate=await acquirePrivateFileGate(file,{role:'synthetic'});
 await assert.rejects(acquirePrivateFileGate(file),{code:'PRIVATE_FILE_GATE_BUSY'});
 assert.equal((await releasePrivateFileGate(file,randomUUID())).otherOwner,true);
 await gate.release();const next=await acquirePrivateFileGate(file);await next.release();
 await fs.mkdir(file+'.write-lock');await assert.rejects(releasePrivateFileGate(file,randomUUID()),{code:'PRIVATE_FILE_GATE_BUSY'});
});
