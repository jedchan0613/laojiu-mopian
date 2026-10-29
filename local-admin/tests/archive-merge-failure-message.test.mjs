import test from 'node:test';
import assert from 'node:assert/strict';
import {getMergeFailureMessage} from '../public/merge-execution.js';

test('恢复结果保留已知失败原因，旧日志不伪造原因，未知错误不透露路径',()=>{
 assert.match(getMergeFailureMessage({status:'rolled-back',failure:{code:'EXDEV'}}),/跨目录.*已恢复/);
 assert.match(getMergeFailureMessage({status:'rolled-back',events:[{errorCode:'ENOSPC'},{phase:'rolled-back'}]}),/空间不足/);
 assert.match(getMergeFailureMessage({status:'rolled-back'}),/旧记录未保存/);
 const unknown=getMergeFailureMessage({status:'rolled-back',failure:{code:'<script>/private/path',message:'/secret/database'}});
 assert.doesNotMatch(unknown,/script|private|secret/);
 assert.equal(getMergeFailureMessage({status:'committed',failure:{code:'EXDEV'}}),'');
});
