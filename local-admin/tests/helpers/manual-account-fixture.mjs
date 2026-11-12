// 只创建临时虚构账号与私密收件区，绝不使用项目中的真实账号或投稿。
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import {once} from 'node:events';
import {fileURLToPath} from 'node:url';
import assert from 'node:assert/strict';
import {createAccountStore,agreementVersion} from '../../accounts.mjs';
import {createMailer} from '../../mail.mjs';
import {createSubmissionStore} from '../../submissions.mjs';
import {createAccountHandler,sessionCookieName} from '../../account-server.mjs';

const siteDirectory=fileURLToPath(new URL('../../../site/',import.meta.url));

export async function createManualAccountFixture({serveSite=false,uploadsOpen=true,submissionOptions={},handlerOptions={}}={}){
  const root=await fs.mkdtemp(path.join(os.tmpdir(),'ljm-manual-accounts-'));
  const mailDirectory=path.join(root,'outbox');
  const accounts=createAccountStore({directory:path.join(root,'accounts'),mailer:createMailer({transport:'file',environment:'development',directory:mailDirectory}),environment:'development',ipSalt:'synthetic-manual-test'});
  const submissions=createSubmissionStore({...submissionOptions,root:path.join(root,'submissions'),siteDirectory});
  const register=async(email,nickname,ip)=>{
    const requested=await accounts.requestLoginCode({email,ip});
    const messages=await Promise.all((await fs.readdir(mailDirectory)).filter(f=>f.endsWith('.json')).map(async f=>JSON.parse(await fs.readFile(path.join(mailDirectory,f),'utf8'))));
    const message=messages.find(m=>m.to===email&&m.variables?.purpose==='login');
    const verified=await accounts.verifyLoginCode({email,ticket:requested.ticket,code:message.text.match(/\d{6}/)[0],client:'synthetic-test',ip});
    return accounts.completeOnboarding({onboardingTicket:verified.onboarding_ticket,agreement:agreementVersion,agreed:true,nickname,client:'synthetic-test',ip});
  };
  const users=[await register('manual-one@example.invalid','说明书测试甲','10.10.0.1'),await register('manual-two@example.invalid','说明书测试乙','10.10.0.2')];
  let handler,interceptor=null;
  const server=http.createServer(async(req,res)=>{
    try{
      if(interceptor&&await interceptor(req,res))return;
      if(await handler(req,res,new URL(req.url,'http://localhost').pathname))return;
      if(!serveSite){res.writeHead(404);res.end();return;}
      const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
      const dist=path.join(siteDirectory,'dist');
      const target=path.resolve(dist,'.'+pathname+(pathname.endsWith('/')?'index.html':''));
      if(!target.startsWith(dist+path.sep)){res.writeHead(404);res.end();return;}
      const data=await fs.readFile(target);
      const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.svg':'image/svg+xml','.woff2':'font/woff2','.jpg':'image/jpeg','.png':'image/png','.webp':'image/webp','.ico':'image/x-icon'};
      res.writeHead(200,{'Content-Type':types[path.extname(target)]||'application/octet-stream','Cache-Control':'no-store'});res.end(data);
    }catch{if(!res.headersSent)res.writeHead(404);res.end();}
  });
  server.listen(0,'127.0.0.1');await once(server,'listening');
  const origin=`http://127.0.0.1:${server.address().port}`;
  let uploadsEnabled=uploadsOpen, pdfOptions={...handlerOptions};
  const refresh=()=>{handler=createAccountHandler({store:accounts,submissionStore:submissions,origin,adminOrigin:origin,local:true,secureCookies:false,uploadsOpen:uploadsEnabled,ipRateLimit:{maximum:2000,windowSeconds:600},...pdfOptions});};
  const setUploadsOpen=value=>{uploadsEnabled=value;refresh();};
  const setPdfOpen=value=>{pdfOptions.pdfOpen=value;refresh();};
  refresh();
  const cookie=user=>`${sessionCookieName}=${(user??users[0]).token}`;
  const request=async(route,{user=users[0],method='GET',body,headers={}}={})=>{
    const multipart=body instanceof FormData;
    const response=await fetch(origin+route,{method,headers:{...(user?{Cookie:cookie(user)}:{}),Origin:origin,'X-LJM-Account-Request':'1',...(body!==undefined&&!multipart?{'Content-Type':'application/json'}:{}),...headers},body:body===undefined?undefined:multipart?body:JSON.stringify(body)});
    return {status:response.status,headers:response.headers,body:await response.json()};
  };
  return {root,origin,users,accounts,submissions,cookie,request,setUploadsOpen,setPdfOpen,setInterceptor:value=>{interceptor=value;},async close(){
    server.closeAllConnections();await new Promise(resolve=>server.close(resolve));accounts.close();
    const resolved=path.resolve(root);assert.equal(path.dirname(resolved),path.resolve(os.tmpdir()));assert(path.basename(resolved).startsWith('ljm-manual-accounts-'));
    await fs.rm(resolved,{recursive:true,force:true});
  }};
}
