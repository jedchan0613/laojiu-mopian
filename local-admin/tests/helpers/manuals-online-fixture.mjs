import fs from 'node:fs/promises';
import path from 'node:path';
import {spawn} from 'node:child_process';
import {once} from 'node:events';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {generateKeyPairSync,sign,randomUUID} from 'node:crypto';
import {createManualHttpFixture} from './manuals-http-fixture.mjs';

// 只在合成临时目录启动真实online服务。替换的是测试子进程的证书获取，
// JWT仍由正式Access核验代码逐项验证；生产服务没有测试身份或鉴权旁路。
export async function createManualOnlineFixture(t=null,{enabled=true}={}) {
  const base=await createManualHttpFixture(null);await base.stop();
  let child=null,output='';
  const privateRoot=path.dirname(base.root),releases=path.join(base.dir,'public-releases');
  for(const name of ['drafts','history','recycle-bin','inbox'])await fs.mkdir(path.join(privateRoot,name),{recursive:true});
  const deployLock=path.join(privateRoot,'deployment.lock');await fs.writeFile(deployLock,'');
  const previousRelease=path.join(releases,'previous'),live=path.join(releases,'live');
  await fs.mkdir(previousRelease,{recursive:true});await fs.writeFile(path.join(previousRelease,'index.html'),'PREVIOUS-PUBLIC-SITE');
  await fs.symlink(previousRelease,live,process.platform==='win32'?'junction':'dir');
  const adminOrigin='https://admin.example.test',publicOrigin='https://public.example.test';
  const teamDomain='https://manuals-test.cloudflareaccess.com',audience='manuals-isolated-audience',email='admin@example.test';
  const {privateKey,publicKey}=generateKeyPairSync('rsa',{modulusLength:2048});
  const jwk={...publicKey.export({format:'jwk'}),kid:'manuals-isolated-key',alg:'RS256',use:'sig'};
  const certs=teamDomain+'/cdn-cgi/access/certs',preload=path.join(base.dir,'isolated-access-certs.mjs');
  await fs.writeFile(preload,`const originalFetch=globalThis.fetch;globalThis.fetch=(input,options)=>String(input)===${JSON.stringify(certs)}?Promise.resolve(new Response(${JSON.stringify(JSON.stringify({keys:[jwk]}))},{headers:{'content-type':'application/json'}})):originalFetch(input,options);\n`);
  const token=(overrides={})=>{
    const encode=value=>Buffer.from(JSON.stringify(value)).toString('base64url'),now=Math.floor(Date.now()/1000);
    const input=encode({alg:'RS256',typ:'JWT',kid:jwk.kid})+'.'+encode({aud:[audience],iss:teamDomain,email,sub:'isolated-admin',type:'app',iat:now,nbf:now,exp:now+3600,...overrides});
    return input+'.'+sign('RSA-SHA256',Buffer.from(input),privateKey).toString('base64url');
  };
  const env={...base.env,LJM_ADMIN_MODE:'online',LJM_ADMIN_ORIGIN:adminOrigin,PUBLIC_SITE_URL:publicOrigin,LJM_CF_ACCESS_TEAM_DOMAIN:teamDomain,LJM_CF_ACCESS_AUD:audience,LJM_ADMIN_ALLOWED_EMAILS:email,LJM_MANUALS_ONLINE_ENABLED:String(enabled),LJM_PUBLIC_RELEASES_DIR:releases,LJM_PUBLIC_LIVE_LINK:live,LJM_MERGE_DEPLOY_LOCK:deployLock,LJM_NPM_COMMAND:'npm'};
  const stop=async()=>{if(child&&child.exitCode===null&&child.signalCode===null){const ended=once(child,'exit');child.kill('SIGTERM');await ended;}};
  const crash=async()=>{if(child&&child.exitCode===null&&child.signalCode===null){const ended=once(child,'exit');child.kill('SIGKILL');await ended;}};
  const dispose=async()=>{await fs.writeFile(path.join(env.LJM_SITE_DIR,'build-release'),'release').catch(()=>{});await stop();await base.dispose();};if(t)t.after(dispose);
  const start=async(site=base.site)=>{
    env.LJM_SITE_DIR=site;output='';
    child=spawn(process.execPath,['--import',pathToFileURL(preload).href,fileURLToPath(new URL('../../server.mjs',import.meta.url))],{env,windowsHide:true,stdio:['ignore','pipe','pipe']});
    child.stdout.on('data',bytes=>output+=bytes);child.stderr.on('data',bytes=>output+=bytes);
    for(let i=0;i<300&&child.exitCode===null;i++){
      try{if((await fetch(base.origin+'/healthz')).ok)return;}catch{}
      await new Promise(resolve=>setTimeout(resolve,30));
    }
    throw new Error('隔离线上服务未启动：'+output);
  };
  try{await start();}catch(error){await dispose();throw error;}
  const request=async(route,{headers={},...options}={})=>{
    const response=await fetch(base.origin+route,{...options,headers:{'cf-access-jwt-assertion':token(),...headers}});
    const bytes=Buffer.from(await response.arrayBuffer());let body;try{body=JSON.parse(bytes);}catch{body=bytes.toString('utf8');}
    return {status:response.status,body,bytes,headers:response.headers};
  };
  const post=(route,payload,ids={operationId:randomUUID(),stepId:randomUUID()},headers={})=>request(route,{method:'POST',headers:{origin:adminOrigin,'content-type':'application/json','x-ljm-admin-request':'1','x-ljm-operation-id':ids.operationId,'x-ljm-step-id':ids.stepId,...headers},body:JSON.stringify(payload)});
  const save=async(catalog=base.readerCatalog(),extra={})=>{
    const current=(await request('/api/manuals')).body;
    return post('/api/manuals/save',{expectedRevision:current.revision,catalog,...(current.readiness.status==='needs-initialization'?{initializeEmpty:true,expectedPublicRevision:current.readiness.publicRevision}:{}),...extra});
  };
  return {...base,privateRoot,releases,live,previousRelease,adminOrigin,publicOrigin,email,token,env,request,get:request,post,save,stop,crash,dispose,restart:async site=>{await stop();await start(site);},output:()=>output};
}
