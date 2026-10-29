// 跨挂载目录切换回归：全部使用可丢弃合成文件，不读取生产档案。
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {spawn,execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {moveVerifiedDirectory,copyTree,treeDigest,exists} from '../archive-merge-files.mjs';
import {executionFixture} from './helpers/merge-execution-fixture.mjs';
import {actor,operation} from './helpers/merge-fixture.mjs';
import {createMergeUndo} from '../archive-merge-undo.mjs';

async function fixture(t,sourceRelative='site/dist',targetRelative='private/previous-dist'){
  const root=await fs.mkdtemp(path.join(os.tmpdir(),'ljm-merge-transfer-'));
  t.after(async()=>{
    assert.equal(path.dirname(path.resolve(root)),path.resolve(os.tmpdir()));
    assert.ok(path.basename(root).startsWith('ljm-merge-transfer-'));
    await fs.rm(root,{recursive:true,force:true,maxRetries:10,retryDelay:100});
  });
  const source=path.join(root,sourceRelative),target=path.join(root,targetRelative);
  await fs.mkdir(path.join(source,'nested'),{recursive:true});
  await fs.mkdir(path.dirname(target),{recursive:true});
  await fs.writeFile(path.join(source,'index.html'),'SYNTHETIC PUBLICATION ONLY');
  await fs.writeFile(path.join(source,'nested','image.bin'),Buffer.from([0,1,2,3,255]));
  const expected=await treeDigest(source);
  let crossings=0;
  const rename=async(from,to)=>{
    if(path.resolve(from)===source&&path.resolve(to)===target){
      crossings++;throw Object.assign(new Error('synthetic bind mount EXDEV'),{code:'EXDEV'});
    }
    return fs.rename(from,to);
  };
  return{root,source,target,expected,rename,crossings:()=>crossings};
}

test('同挂载移动完整目录：摘要一致且源位置消失',async t=>{
  const f=await fixture(t);let copies=0;
  await moveVerifiedDirectory(f.source,f.target,f.expected,{copy:async(...args)=>{copies++;return copyTree(...args);}});
  assert.equal(await exists(f.source),false);
  assert.equal(await treeDigest(f.target),f.expected);
  assert.equal(copies,0,'正常 rename 不必复制整个构建产物');
});

for(const[source,target]of [
  ['site/dist','private/previous-dist'],
  ['private/candidate/site/dist','site/dist'],
  ['site/dist','private/failed-dist'],
  ['private/previous-dist','site/dist'],
])test('跨挂载完整移动及恢复方向：'+source+' → '+target,async t=>{
  const f=await fixture(t,source,target);
  await moveVerifiedDirectory(f.source,f.target,f.expected,{rename:f.rename});
  assert.equal(f.crossings(),1);
  assert.equal(await exists(f.source),false);
  assert.equal(await treeDigest(f.target),f.expected);
  assert.deepEqual(await fs.readdir(path.dirname(f.source)),[],'成功后只清理自身源目录和退休副本');
  assert.deepEqual(await fs.readdir(path.dirname(f.target)),[path.basename(f.target)],'成功后不残留目标临时目录');
});

test('跨挂载复制中途失败：原目录和无关文件保留，半份目标不落位',async t=>{
  const f=await fixture(t),keep=path.join(path.dirname(f.target),'keep.txt');
  await fs.writeFile(keep,'UNRELATED KEEP');
  const error=Object.assign(new Error('synthetic copy failure after first file'),{code:'EIO'});
  await assert.rejects(moveVerifiedDirectory(f.source,f.target,f.expected,{
    rename:f.rename,copy:async(_source,temporary)=>{
      await fs.mkdir(temporary,{recursive:true});
      await fs.copyFile(path.join(f.source,'index.html'),path.join(temporary,'index.html'));
      throw error;
    },
  }),e=>e===error);
  assert.equal(await treeDigest(f.source),f.expected);
  assert.equal(await exists(f.target),false);
  assert.deepEqual(await fs.readdir(path.dirname(f.target)),['keep.txt']);
  assert.equal(await fs.readFile(keep,'utf8'),'UNRELATED KEEP');
});

test('跨挂载复制摘要不符：不把缺文件副本当成完整目标',async t=>{
  const f=await fixture(t);
  await assert.rejects(moveVerifiedDirectory(f.source,f.target,f.expected,{
    rename:f.rename,copy:async(_source,temporary)=>{
      await fs.mkdir(temporary,{recursive:true});
      await fs.copyFile(path.join(f.source,'index.html'),path.join(temporary,'index.html'));
    },
  }));
  assert.equal(await treeDigest(f.source),f.expected);
  assert.equal(await exists(f.target),false);
  assert.deepEqual(await fs.readdir(path.dirname(f.target)),[]);
});

test('来源摘要错误时不移动或复制，不能把未知目录当候选版本',async t=>{
  const f=await fixture(t);let mutated=false;
  await assert.rejects(moveVerifiedDirectory(f.source,f.target,'0'.repeat(64),{
    rename:async()=>{mutated=true;},copy:async()=>{mutated=true;},
  }));
  assert.equal(mutated,false);
  assert.equal(await treeDigest(f.source),f.expected);
  assert.equal(await exists(f.target),false);
});

test('非 EXDEV 错误不触发复制降级，也不隐瞒权限问题',async t=>{
  const f=await fixture(t);let copied=false;
  const error=Object.assign(new Error('synthetic permission denial'),{code:'EACCES'});
  await assert.rejects(moveVerifiedDirectory(f.source,f.target,f.expected,{
    rename:async()=>{throw error;},copy:async()=>{copied=true;},
  }),e=>e===error);
  assert.equal(copied,false);
  assert.equal(await treeDigest(f.source),f.expected);
  assert.equal(await exists(f.target),false);
});

test('既有目标目录禁止覆盖，外部内容和来源都保持完整',async t=>{
  const f=await fixture(t);
  await fs.mkdir(f.target);await fs.writeFile(path.join(f.target,'external.txt'),'EXTERNAL CONTENT');
  const targetBefore=await treeDigest(f.target);
  await assert.rejects(moveVerifiedDirectory(f.source,f.target,f.expected,{rename:f.rename}));
  assert.equal(await treeDigest(f.source),f.expected);
  assert.equal(await treeDigest(f.target),targetBefore);
});

for(const phase of ['copy-verified','target-installed','source-retired'])test('跨挂载在 '+phase+' 中断，仍有完整来源或目标可供恢复',async t=>{
  const f=await fixture(t);let fired=false;
  const error=new Error('synthetic interrupted transfer at '+phase);
  await assert.rejects(moveVerifiedDirectory(f.source,f.target,f.expected,{
    rename:f.rename,afterTransferPhase:async value=>{if(value===phase){fired=true;throw error;}},
  }),e=>e===error);
  assert.equal(fired,true);
  if(phase==='copy-verified'){
    assert.equal(await treeDigest(f.source),f.expected);
    assert.equal(await exists(f.target),false);
    assert.deepEqual(await fs.readdir(path.dirname(f.target)),[]);
  }else{
    assert.equal(await treeDigest(f.target),f.expected);
    if(phase==='target-installed')assert.equal(await treeDigest(f.source),f.expected);
    else{
      assert.equal(await exists(f.source),false);
      const retained=(await fs.readdir(path.dirname(f.source),{withFileTypes:true})).filter(row=>row.isDirectory());
      assert.equal(retained.length,1,'退休来源保留独立完整副本，以便异常后核对');
      assert.equal(await treeDigest(path.join(path.dirname(f.source),retained[0].name)),f.expected);
    }
  }
});

test('目标已完整落位但源退休失败：保留两份完整数据，不能删除原来源',async t=>{
  const f=await fixture(t),error=Object.assign(new Error('synthetic cannot retire source'),{code:'EACCES'});
  await assert.rejects(moveVerifiedDirectory(f.source,f.target,f.expected,{
    rename:async(from,to)=>{
      if(path.resolve(from)===f.source){if(path.resolve(to)===f.target)return f.rename(from,to);throw error;}
      return fs.rename(from,to);
    },
  }),e=>e===error);
  assert.equal(await treeDigest(f.source),f.expected);
  assert.equal(await treeDigest(f.target),f.expected);
});

test('复制核验后出现外部目标目录：禁止覆盖，只清理本次临时副本',async t=>{
  const f=await fixture(t);
  await assert.rejects(moveVerifiedDirectory(f.source,f.target,f.expected,{
    rename:f.rename,afterTransferPhase:async phase=>{
      if(phase==='copy-verified'){
        await fs.mkdir(f.target);await fs.writeFile(path.join(f.target,'external.txt'),'NEW EXTERNAL TARGET');
      }
    },
  }));
  assert.equal(await treeDigest(f.source),f.expected);
  assert.equal(await fs.readFile(path.join(f.target,'external.txt'),'utf8'),'NEW EXTERNAL TARGET');
  assert.deepEqual(await fs.readdir(path.dirname(f.target)),[path.basename(f.target)]);
});

test('目标落位后来源有新修改：新内容保留，不能退休或清理未知来源',async t=>{
  const f=await fixture(t);
  await assert.rejects(moveVerifiedDirectory(f.source,f.target,f.expected,{
    rename:f.rename,afterTransferPhase:async phase=>{
      if(phase==='target-installed')await fs.writeFile(path.join(f.source,'external.txt'),'NEW SOURCE MUST SURVIVE');
    },
  }));
  assert.equal(await fs.readFile(path.join(f.source,'external.txt'),'utf8'),'NEW SOURCE MUST SURVIVE');
  assert.equal(await treeDigest(f.target),f.expected);
  assert.deepEqual(await fs.readdir(path.dirname(f.source)),[path.basename(f.source)]);
});

for(const phase of ['target-installed','source-retired'])test('跨挂载真实进程退出 '+phase+'：保留完整目标和可核对来源',async t=>{
  const f=await fixture(t);
  const script=`import fs from 'node:fs/promises';import path from 'node:path';
import {moveVerifiedDirectory} from ${JSON.stringify(new URL('../archive-merge-files.mjs',import.meta.url).href)};
const source=${JSON.stringify(f.source)},target=${JSON.stringify(f.target)};
await moveVerifiedDirectory(source,target,${JSON.stringify(f.expected)},{
rename:async(from,to)=>{if(from===source&&to===target)throw Object.assign(new Error('synthetic EXDEV'),{code:'EXDEV'});return fs.rename(from,to);},
afterTransferPhase:async value=>{if(value===${JSON.stringify(phase)})process.exit(93);}
});process.exit(0);`;
  const child=spawn(process.execPath,['--input-type=module','--eval',script],{windowsHide:true,stdio:['ignore','pipe','pipe']});
  let output='';child.stdout.on('data',b=>output+=b);child.stderr.on('data',b=>output+=b);
  const code=await new Promise((resolve,reject)=>{child.on('error',reject);child.on('exit',resolve);});
  assert.equal(code,93,output);
  assert.equal(await treeDigest(f.target),f.expected);
  if(phase==='target-installed')assert.equal(await treeDigest(f.source),f.expected);
  else{
    assert.equal(await exists(f.source),false);
    const preserved=(await fs.readdir(path.dirname(f.source),{withFileTypes:true})).filter(row=>row.isDirectory());
    assert.equal(preserved.length,1);
    assert.equal(await treeDigest(path.join(path.dirname(f.source),preserved[0].name)),f.expected);
  }
});

// 显式启用时必须由 root 在独立 mount namespace 执行，例如：
// unshare --mount --fork --propagation private env LJM_TEST_BIND_MOUNTS=1 node --test 此文件
// 不依靠 st_dev 不同模拟跨盘：两个自绑定目录仍同 dev，却真实返回 EXDEV。
const bindTest={skip:process.platform!=='linux'||process.env.LJM_TEST_BIND_MOUNTS!=='1'
  ?'真实 bind mount 测试需 Linux 独立命名空间及显式 LJM_TEST_BIND_MOUNTS=1':false};
const run=promisify(execFile);
async function withBindMounts(f,exercise){
  assert.equal(process.getuid(),0,'必须由 root 在独立 namespace 内建立合成挂载');
  assert.notEqual(await fs.readlink('/proc/self/ns/mnt'),await fs.readlink('/proc/1/ns/mnt'),
    '禁止在系统全局 mount namespace 中进行测试');
  const root=await fs.realpath(f.root),targets=[await fs.realpath(f.site),await fs.realpath(f.privateRoot)];
  assert.equal(path.dirname(root),await fs.realpath(os.tmpdir()));
  assert.ok(path.basename(root).startsWith('ljm-merge-test-'));
  for(const target of targets)assert.ok(target.startsWith(root+path.sep),'只能绑定本次合成夹具内的目录');
  // 仅包装本夹具实例；公共 fixture 的 t.after 再次 close 时仍安全。
  // SQLite 在新绑定路径下建立的 WAL/SHM 句柄须在 umount 之前关闭。
  const resources=[['direct-db',f.db],['account-store',f.store]];
  for(const[,resource]of resources){
    const originalClose=resource.close.bind(resource);let closed=false;
    resource.close=()=>{if(closed)return;const result=originalClose();closed=true;return result;};
  }
  const mounted=[];let primaryError;
  const diagnostic=message=>console.log('synthetic bind diagnostic: '+message);
  const describe=error=>[error.code,error.message,error.stderr?.trim()].filter(Boolean).join(' | ');
  const mountCommand=(command,args)=>run(command,args,{timeout:10_000,killSignal:'SIGTERM'});
  try{
    for(const target of targets){
      diagnostic('mount begin '+target);
      await mountCommand('mount',['--bind',target,target]);mounted.push(target);
      diagnostic('mount ready '+target);
    }
    assert.equal((await fs.stat(f.site)).dev,(await fs.stat(f.privateRoot)).dev);
    const probe=path.join(f.site,'.cross-mount-probe'),destination=path.join(f.privateRoot,'.cross-mount-probe');
    await fs.writeFile(probe,'SYNTHETIC EXDEV PROBE');
    try{await assert.rejects(fs.rename(probe,destination),{code:'EXDEV'});}
    finally{await fs.unlink(probe).catch(error=>{if(error.code!=='ENOENT')throw error;});}
    diagnostic('same-device EXDEV probe passed; exercise begins');
    await exercise();
    diagnostic('exercise completed');
  }catch(error){
    primaryError=error;
    diagnostic('primary failure '+describe(error));
    throw error;
  }finally{
    // 必须先解除挂载，再由 executionFixture 的 t.after 安全清理合成目录。
    const errors=[];
    for(const[label,resource]of resources)try{
      resource.close();diagnostic('closed '+label);
    }catch(error){errors.push(error);diagnostic('close failure '+label+' '+describe(error));}
    for(const target of mounted.reverse())try{
      diagnostic('umount begin '+target);
      await mountCommand('umount',['--',target]);
      diagnostic('umount completed '+target);
    }catch(error){
      errors.push(error);diagnostic('umount failure '+target+' '+describe(error));
    }
    if(errors.length)throw new AggregateError(primaryError?[primaryError,...errors]:errors,
      '合成 bind mount 清理未完成；'+(primaryError?'原始错误：'+describe(primaryError)+'；':'')+
      '清理错误：'+errors.map(describe).join('；'));
  }
}

test('真实同 dev 不同 bind 挂载：完整合并、收藏迁移和重新核对撤销成功',bindTest,async t=>{
  const f=await executionFixture(t);
  await withBindMounts(f,async()=>{
    f.db.prepare('INSERT INTO favorites VALUES(?,?,?)').run('user-one',f.ids[1],'2000-01-01');
    const beforeFavorites=f.store.archiveMerge.inspect(f.ids).rows,{payload}=await f.prepare();
    const result=await f.engine.execute(payload,actor,operation());
    assert.equal(result.status,'committed');
    assert.equal((await f.readRecords()).find(row=>row.core.item_id===f.ids[1]).core.record_status,'WDR');
    assert.equal(f.store.archiveMerge.resolveForWrite(f.ids[1]),f.ids[0]);
    const log=await f.engine.detail(result.mergeId,actor);
    assert.equal(await treeDigest(path.join(f.site,'dist')),log.distAfter);
    assert.equal(await treeDigest(path.join(f.directory,result.mergeId,'previous-dist')),log.distBefore);
    const undo=createMergeUndo({...f.engineOptions,engine:f.engine});
    const review=await undo.review({mergeId:result.mergeId},actor);
    assert.equal(review.canPublish,true,JSON.stringify(review.conflicts));
    const restored=await undo.publish({mergeId:result.mergeId,reviewId:review.reviewId,mode:'republish',
      confirmPrimaryId:f.ids[0],confirmSecondaryId:f.ids[1],confirmations:Array(13).fill(true),
      publicationAuthorization:{restorePrimary:true,restoreSecondary:true,restoreReferences:true}},actor,operation());
    assert.equal(restored.status,'committed');
    for(const id of f.ids)assert.equal((await f.readRecords()).find(row=>row.core.item_id===id).core.record_status,'ACT');
    assert.deepEqual(f.store.archiveMerge.inspect(f.ids).rows,beforeFavorites);
    assert.equal(f.store.archiveMerge.resolveForWrite(f.ids[1]),f.ids[1]);
    assert.equal((await f.engine.detail(result.mergeId,actor)).status,'reverted');
  });
});

test('真实同 dev 不同 bind 挂载：切换构建后失败，跨挂载回退恢复全部原状态',bindTest,async t=>{
  const error=new Error('synthetic failure after real bind transfer');let fired=false;
  const f=await executionFixture(t,{afterPhase:async phase=>{if(phase==='dist-switched'&&!fired){fired=true;throw error;}}});
  await withBindMounts(f,async()=>{
    f.db.prepare('INSERT INTO favorites VALUES(?,?,?)').run('user-one',f.ids[1],'2000-01-01');
    const {payload}=await f.prepare(),before=await f.state();
    await assert.rejects(f.engine.execute(payload,actor,operation()),e=>e===error);
    assert.equal(fired,true);
    assert.deepEqual(await f.state(),before);
    assert.equal(f.store.archiveMerge.resolveForWrite(f.ids[1]),f.ids[1]);
    const folders=(await fs.readdir(f.directory)).filter(name=>/^[a-f0-9-]{36}$/.test(name));
    assert.equal(folders.length,1);
    assert.equal((await f.engine.detail(folders[0],actor)).status,'rolled-back');
  });
});
