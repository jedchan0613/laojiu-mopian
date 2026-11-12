// 复制打包脚本至全新合成项目，绝不对真实账号、投稿或档案运行导出。
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
const execute=promisify(execFile),skip=process.platform!=='win32'?'Windows本地PowerShell打包验收另行执行':false;
async function fixture(t){
  const root=await fs.mkdtemp(path.join(os.tmpdir(),'ljm-manual-package-'));
  t.after(async()=>{assert.equal(path.dirname(root),path.resolve(os.tmpdir()));assert(path.basename(root).startsWith('ljm-manual-package-'));await fs.rm(root,{recursive:true,force:true});});
  const write=async(name,data='SYNTHETIC PACKAGE FIXTURE')=>{const file=path.join(root,name);await fs.mkdir(path.dirname(file),{recursive:true});await fs.writeFile(file,data);};
  await write('deployment/create-online-admin-packages.ps1',await fs.readFile(new URL('../../deployment/create-online-admin-packages.ps1',import.meta.url)));
  for(const name of ['local-admin/server.mjs','local-admin/access-auth.mjs','local-admin/release-deployer.mjs','site/package-lock.json','shared/manual-pdf-upload.mjs','samples/manuals-demo/catalog.json','deployment/laojiumopian-admin.service','deployment/ljm-manual-pdf-bridge.service','deployment/prepare-manual-pdf-linux.mjs','deployment/install-manual-pdf-bridge.sh'])await write(name);
  const run=()=>execute('pwsh',['-NoProfile','-NonInteractive','-File',path.join(root,'deployment/create-online-admin-packages.ps1'),'-OutputDirectory',path.join(root,'packages')],{timeout:30000,maxBuffer:1024*1024});
  return {root,write,run};
}

test('默认只生成程序ZIP并保留共享规则和合成测试；不读取或打包真实数据路径',{skip},async t=>{
  const f=await fixture(t);
  for(const name of ['accounts','submissions','drafts','history','recycle-bin','manuals','pdf-runtime','translations','operations','merges','uploads','upload-staging','batch-import'])await f.write('local-admin/'+name+'/PRIVATE-SENTINEL.json');
  for(const name of ['site/dist/private.html','site/node_modules/private.json','site/public/archive/copy.jpg','site/public/archive-responsive/copy.webp','site/src/data/archive.ts','site/src/data/generated/manuals-catalog.json','site/src/data/generated/image-manifest.json'])await f.write(name);
  // 没有archive-data/inbox等数据导出源；默认运行仍必须成功。
  const result=JSON.parse((await f.run()).stdout);assert.equal(result.private_data,null);assert.equal(result.application.files,11);
  const inspection=await execute('pwsh',['-NoProfile','-NonInteractive','-Command','Add-Type -AssemblyName System.IO.Compression.FileSystem; $z=[IO.Compression.ZipFile]::OpenRead($env:LJM_TEST_ZIP); try { $z.Entries.FullName | ConvertTo-Json -Compress } finally { $z.Dispose() }'],{env:{...process.env,LJM_TEST_ZIP:result.application.path}});
  const names=JSON.parse(inspection.stdout);assert(names.includes('shared/manual-pdf-upload.mjs'));assert(names.includes('samples/manuals-demo/catalog.json'));assert(names.includes('PACKAGE-MANIFEST.json'));
  assert(!names.some(n=>/PRIVATE-SENTINEL|archive\.ts|manuals-catalog|image-manifest/.test(n)));
  const files=await fs.readdir(path.join(f.root,'packages'));assert.equal(files.filter(n=>n.endsWith('.zip')).length,1);
});

test('程序源意外含正式环境文件时拒绝打包，不产生可误用ZIP',{skip},async t=>{
  for(const name of ['.env.production','account.env']){
    const f=await fixture(t);await f.write('local-admin/'+name,'SYNTHETIC-SECRET');
    await assert.rejects(f.run(),e=>{assert.match(e.stderr,/环境密钥/);return true;});
    assert(!(await fs.readdir(path.join(f.root,'packages'))).some(n=>n.endsWith('.zip')));
  }
});

test('程序包拒绝链接，不能跟随到包外私密目录',{skip},async t=>{
  const f=await fixture(t);await fs.mkdir(path.join(f.root,'outside'));await f.write('outside/private.json');await fs.mkdir(path.join(f.root,'local-admin/public'));
  await fs.symlink(path.join(f.root,'outside'),path.join(f.root,'local-admin/public/linked'),'junction');
  await assert.rejects(f.run(),e=>{assert.match(e.stderr,/包含链接/);return true;});
  assert.equal(await fs.readFile(path.join(f.root,'outside/private.json'),'utf8'),'SYNTHETIC PACKAGE FIXTURE');
});

test('Git归档实际排除PDF运行目录、业务数据、发布投影，包含说明书合成样例',async t=>{
  const f=await fixture(t),script=await fs.readFile(new URL('../../deployment/laojiumopian-github-deploy.sh',import.meta.url),'utf8');
  await f.write('local-admin/server.mjs',"if(!process.argv.includes('--sync-site-data')||process.env.LJM_SITE_DIR!==process.env.LJM_TEST_EXPECTED_SITE)process.exit(2);\n");
  for(const name of ['local-admin/accounts/a.json','local-admin/submissions/s.json','local-admin/manuals/catalog.json','local-admin/pdf-runtime/local.json','local-admin/upload-staging/a.json','local-admin/batch-import/a.json','site/src/data/archive.ts','site/src/data/generated/manuals-catalog.json','site/src/data/generated/image-manifest.json'])await f.write(name);
  await execute('git',['init',f.root]);await execute('git',['-C',f.root,'add','.']);await execute('git',['-C',f.root,'-c','user.name=Synthetic','-c','user.email=package@example.invalid','commit','-m','synthetic-package-fixture']);
  const block=script.slice(script.indexOf('"$candidate_commit" -- deployment'),script.indexOf('run_as_admin tar -xf'));
  assert(block.startsWith('"$candidate_commit" -- deployment local-admin site shared samples/manuals-demo'));
  const exclusions=[...block.matchAll(/'(:\(exclude(?:,glob)?\)[^']+)'/g)].map(m=>m[1]);
  const archive=path.join(f.root,'source.tar');await execute('git',['-C',f.root,'archive','--format=tar','--output='+archive,'HEAD','--','deployment','local-admin','site','shared','samples/manuals-demo',...exclusions]);
  const names=(await execute('tar',['-tf',archive])).stdout;assert.match(names,/samples\/manuals-demo\/catalog.json/);assert.match(names,/shared\/manual-pdf-upload.mjs/);assert.doesNotMatch(names,/pdf-runtime|upload-staging|batch-import|accounts\/|submissions\/|manuals-catalog|image-manifest|data\/archive.ts/);
  if(process.platform==='linux'){
    const staging=path.join(f.root,'staging'),previous=path.join(f.root,'previous');await fs.mkdir(staging);await execute('tar',['-xf',archive,'-C',staging]);
    const generated=path.join(staging,'site/src/data/generated');assert.equal(await fs.lstat(generated).catch(()=>null),null,'排除所有生成文件后目录应为空缺');
    for(const [name,bytes]of [['site/public/archive/page.jpg','SYNTHETIC PAGE'],['site/public/archive-responsive/page.webp','SYNTHETIC RESPONSIVE'],['site/src/data/archive.ts','SYNTHETIC ARCHIVE'],['site/src/data/generated/image-manifest.json','{"synthetic":true}'],['site/src/data/generated/manuals-catalog.json','{"synthetic_manuals":true}']])await f.write('previous/'+name,bytes);
    const sync=script.slice(script.indexOf('sync_runtime_site_data() {'),script.indexOf('\nbuild_staged_application()'));
    await execute('/bin/bash',['-c',`set -eu\nprevious_app_directory="$LJM_TEST_PREVIOUS"\nstaging_directory="$LJM_TEST_STAGING"\nADMIN_USER="$(id -un)"\nADMIN_GROUP="$(id -gn)"\nRUNUSER=run_as_self\nNODE="$LJM_TEST_NODE"\nassert_staging_path(){ test "$staging_directory" = "$LJM_TEST_STAGING"; }\nrun_as_self(){ shift 4; "$@"; }\n${sync}\nsync_runtime_site_data\n`],{env:{...process.env,LJM_TEST_PREVIOUS:previous,LJM_TEST_STAGING:staging,LJM_TEST_NODE:process.execPath,LJM_SITE_DIR:path.join(f.root,'outside-site'),LJM_TEST_EXPECTED_SITE:path.join(staging,'site')}});
    assert.equal(await fs.readFile(path.join(generated,'image-manifest.json'),'utf8'),'{"synthetic":true}');assert.equal(await fs.readFile(path.join(generated,'manuals-catalog.json'),'utf8'),'{"synthetic_manuals":true}');
    assert.equal(await fs.readFile(path.join(staging,'site/public/archive/page.jpg'),'utf8'),'SYNTHETIC PAGE');
  }
});
