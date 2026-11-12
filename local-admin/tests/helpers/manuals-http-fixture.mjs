import fs from 'node:fs/promises';
import path from 'node:path';
import {createServer} from 'node:net';
import {spawn} from 'node:child_process';
import {once} from 'node:events';
import {fileURLToPath} from 'node:url';
import {randomUUID} from 'node:crypto';
import {createManualFixture} from './manuals-fixture.mjs';

export async function createManualHttpFixture(t=null){
  const hooks=[],fixture=await createManualFixture({after:hook=>hooks.push(hook)}),project=new URL('../../../',import.meta.url);
  const archiveDirectory=path.join(fixture.dir,'archive-data'),privateRoot=path.dirname(fixture.root),site=fixture.site;
  await fs.mkdir(archiveDirectory,{recursive:true});await fs.mkdir(path.join(site,'src/data'),{recursive:true});
  await fs.cp(new URL('site/src/data/standards/',project),path.join(site,'src/data/standards'),{recursive:true});await fs.copyFile(new URL('site/src/data/archive-categories.json',project),path.join(site,'src/data/archive-categories.json'));
  Object.assign(fixture.archive.core,{accession_date:'2000-01-01',date_display:'年代未知',batch_id:'SYNTHETIC-MANUALS-TEST',research_status:'R0',evidence_level:'D',digitization_status:'DG1',transcription_status:'TX0',physical_location:'隔离测试目录',created_date:'2000-01-01',updated_date:'2000-01-01'});
  await fs.writeFile(path.join(archiveDirectory,fixture.id+'.json'),JSON.stringify(fixture.archive));await fs.writeFile(path.join(site,'src/data/archive.ts'),'export const archiveItems=[];\n');
  await fs.cp(path.join(site,'public/archive'),path.join(site,'dist/archive'),{recursive:true});
  await fs.writeFile(path.join(site,'package.json'),JSON.stringify({type:'module',scripts:{build:'node build.mjs'}}));
  await fs.writeFile(path.join(site,'build.mjs'),`import fs from 'node:fs/promises';
const read=async p=>{try{return await fs.readFile(p,'utf8')}catch{return ''}};
const n=Number(await read('build-count'))+1;await fs.writeFile('build-count',String(n));await fs.mkdir('dist',{recursive:true});await fs.cp('public/archive','dist/archive',{recursive:true});await fs.writeFile('dist/index.html','ISOLATED-BUILD-'+n);
if(await read('build-fail'))throw new Error('SYNTHETIC-BUILD-FAIL');console.log('isolated build passed');`);
  const probe=createServer();probe.listen(0,'127.0.0.1');await once(probe,'listening');const port=probe.address().port;await new Promise(resolve=>probe.close(resolve));
  const origin=`http://127.0.0.1:${port}`,env=Object.fromEntries(Object.entries(process.env).filter(([key])=>!key.startsWith('LJM_')&&key!=='PUBLIC_SITE_URL'));
  Object.assign(env,{LJM_ADMIN_MODE:'local',LJM_ADMIN_HOST:'127.0.0.1',LJM_ADMIN_PORT:String(port),LJM_PROJECT_ROOT:fixture.dir,LJM_SITE_DIR:site,LJM_ARCHIVE_DATA_DIR:archiveDirectory,LJM_ADMIN_DATA_ROOT:privateRoot,LJM_ACCOUNT_DATA_DIR:path.join(privateRoot,'accounts'),LJM_SUBMISSION_DATA_DIR:path.join(privateRoot,'submissions'),LJM_INBOX_DIR:path.join(privateRoot,'inbox'),LJM_MAIL_TRANSPORT:'file'});
  const child=spawn(process.execPath,[fileURLToPath(new URL('local-admin/server.mjs',project))],{env,windowsHide:true,stdio:['ignore','pipe','pipe']});let output='';child.stdout.on('data',chunk=>output+=chunk);child.stderr.on('data',chunk=>output+=chunk);
  const stop=async()=>{if(child.exitCode===null&&child.signalCode===null){const ended=once(child,'exit');child.kill('SIGTERM');await ended;}};
  const dispose=async()=>{await stop();for(const hook of hooks.reverse())await hook();};if(t)t.after(dispose);
  let ready=false;for(let i=0;i<300&&child.exitCode===null;i++){try{ready=(await fetch(origin+'/healthz')).ok;}catch{}if(ready)break;await new Promise(resolve=>setTimeout(resolve,30));}
  if(!ready){await dispose();throw new Error('隔离说明书服务未启动：'+output);}
  const get=async route=>{const response=await fetch(origin+route);const raw=await response.text();let body;try{body=JSON.parse(raw);}catch{body=raw;}return {status:response.status,body,headers:response.headers};};
  const post=async(route,payload,ids={operationId:randomUUID(),stepId:randomUUID()},extra={})=>{const response=await fetch(origin+route,{method:'POST',headers:{'content-type':'application/json','x-ljm-admin-request':'1',origin,'x-ljm-operation-id':ids.operationId,'x-ljm-step-id':ids.stepId,...extra},body:JSON.stringify(payload)});return {status:response.status,body:await response.json()};};
  return {...fixture,child,origin,env,archiveDirectory,get,post,stop,dispose,output:()=>output};
}
