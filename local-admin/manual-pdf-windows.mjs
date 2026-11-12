// Node与Windows原生边界的受控协议。仅后台调用，不接受浏览器传来的工具路径或参数。
import fs from 'node:fs/promises';
import path from 'node:path';
import {spawn} from 'node:child_process';
import {createHash,randomUUID} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {createInterface} from 'node:readline';
const nativeSource=fileURLToPath(new URL('./native/ManualPdfSandbox.cs',import.meta.url));
const builds=new Map();
const fail=message=>{throw Object.assign(new Error(message),{name:'SubmissionError',statusCode:503});};
export async function pdfFileDigest(file){const {createReadStream}=await import('node:fs');const h=createHash('sha256');for await(const chunk of createReadStream(file))h.update(chunk);return h.digest('hex');}
const present=file=>fs.lstat(file).then(s=>s.isFile()&&!s.isSymbolicLink(),e=>{if(e.code==='ENOENT')return false;throw e;});
function environment(){const env={};for(const name of ['SystemRoot','SystemDrive','windir','USERPROFILE','LOCALAPPDATA','APPDATA','ALLUSERSPROFILE','ProgramData','TEMP','TMP'])if(process.env[name])env[name]=process.env[name];env.PATH=path.join(process.env.SystemRoot??'C:\\Windows','System32');return env;}
async function boundedProcess(exe,args,{timeout=30000}={}){
  return new Promise((resolve,reject)=>{
    const child=spawn(exe,args,{windowsHide:true,shell:false,env:environment(),stdio:['ignore','pipe','pipe']});let bytes=0,out='',err='',limited=false;
    const timer=setTimeout(()=>child.kill(),timeout);timer.unref?.();
    for(const [channel,isOut] of [[child.stdout,true],[child.stderr,false]])channel.on('data',data=>{bytes+=data.length;if(bytes>65536){limited=true;child.kill();return;}if(isOut)out+=data.toString('utf8');else err+=data.toString('utf8');});
    child.once('error',error=>{clearTimeout(timer);reject(error);});child.once('close',code=>{clearTimeout(timer);if(code!==0||limited)reject(new Error('受限执行器未能完成。'));else resolve({out,err});});
  });
}
export async function compileManualPdfSandbox(cacheDirectory){
  if(process.platform!=='win32')fail('本地PDF隔离目前需要已验证的Windows环境。');
  const sourceHash=await pdfFileDigest(nativeSource),cache=path.resolve(cacheDirectory),key=cache+':'+sourceHash;
  if(builds.has(key))return builds.get(key);
  const promise=(async()=>{
    await fs.mkdir(cache,{recursive:true,mode:0o700});
    const target=path.join(cache,'sandbox-'+sourceHash+'.exe'),receipt=target+'.json';
    if(await present(target)){
      const record=JSON.parse(await fs.readFile(receipt,'utf8'));
      if(record.source_sha256!==sourceHash||record.binary_sha256!==await pdfFileDigest(target))fail('PDF执行器缓存发生变化，已暂停生成，请联系维护者。');
      return target;
    }
    const compiler=path.join(process.env.SystemRoot??'C:\\Windows','Microsoft.NET',process.arch==='arm64'?'FrameworkArm64':process.arch==='x64'?'Framework64':'Framework','v4.0.30319','csc.exe');
    if(!await present(compiler))fail('本机缺少Windows自带的受限执行器编译工具，PDF上传与图片功能仍可使用。');
    const temporary=path.join(cache,'build-'+randomUUID()+'.exe');
    await boundedProcess(compiler,['/nologo','/target:exe','/r:System.Web.Extensions.dll','/out:'+temporary,nativeSource]);
    const binaryHash=await pdfFileDigest(temporary);if(await present(target))fail('另一个窗口正在准备PDF执行器，请稍后重试。');
    await fs.rename(temporary,target);await fs.writeFile(receipt,JSON.stringify({source_sha256:sourceHash,binary_sha256:binaryHash}),{flag:'wx',mode:0o600});return target;
  })();
  builds.set(key,promise);try{return await promise;}catch(error){builds.delete(key);throw error;}
}
export async function verifyManualPdfBundle(toolRoot,pins){
  if(!pins||pins.schema!==1||!Array.isArray(pins.files)||pins.files.length<4)fail('PDF工具固定清单缺失。');
  toolRoot=path.resolve(toolRoot);const found=[];
  async function visit(dir){for(const e of await fs.readdir(dir,{withFileTypes:true})){if(e.isSymbolicLink())fail('PDF工具目录存在链接，已暂停生成。');const file=path.join(dir,e.name);if(e.isDirectory())await visit(file);else if(e.isFile())found.push(path.relative(toolRoot,file).split(path.sep).join('/'));else fail('PDF工具目录含未知文件。');}}
  await visit(toolRoot);if(found.length!==pins.files.length)fail('PDF工具完整文件清单已变化，已暂停生成。');
  const expected=new Set();
  for(const entry of pins.files){if(typeof entry.file!=='string'||entry.file.includes('\\')||entry.file.split('/').some(x=>!x||x==='.'||x==='..')||path.isAbsolute(entry.file)||!/^[a-f0-9]{64}$/.test(entry.sha256)||expected.has(entry.file))fail('PDF工具固定清单无效。');expected.add(entry.file);const file=path.join(toolRoot,...entry.file.split('/'));if(!found.includes(entry.file)||!await present(file)||(await fs.stat(file)).size!==entry.bytes||await pdfFileDigest(file)!==entry.sha256)fail('PDF工具文件与固定摘要不一致，已暂停生成。');}
  for(const name of ['pdfinfo','pdfdetach','pdftoppm','pdffonts'])if(!expected.has('Library/bin/'+name+'.exe'))fail('PDF必要检查工具不完整。');
  return createHash('sha256').update(JSON.stringify(pins)).digest('hex');
}
export async function openManualPdfWindowsSession({root,toolRoot,cacheDirectory,profile,verify=true,pins}){
  if(verify)await verifyManualPdfBundle(toolRoot,pins);
  root=path.resolve(root);const helper=await compileManualPdfSandbox(cacheDirectory);
  const control=path.join(root,'control'),output=path.join(root,'work','output');
  for(const directory of [control,output,path.join(root,'work','input')])await fs.mkdir(directory,{recursive:true,mode:0o700});
  const config=path.join(control,'native-config.json');await fs.writeFile(config,JSON.stringify({schema:1,root,tools:path.resolve(toolRoot),profile,parent_pid:process.pid}),{flag:'wx',mode:0o600});
  const child=spawn(helper,[config],{windowsHide:true,shell:false,env:environment(),stdio:['pipe','pipe','pipe']});
  let exited=false,exitCode=null,closedMessage=null,stderrBytes=0;const messages=[],waiters=[];
  const deliver=message=>{if(message.type==='closed')closedMessage=message;const waiting=waiters.shift();if(waiting)waiting.resolve(message);else messages.push(message);};
  const lines=createInterface({input:child.stdout,crlfDelay:Infinity});
  lines.on('line',line=>{if(Buffer.byteLength(line)>65536){child.kill();return;}try{deliver(JSON.parse(line));}catch{child.kill();}});
  child.stderr.on('data',data=>{stderrBytes+=data.length;if(stderrBytes>65536)child.kill();});
  const exit=new Promise(resolve=>{child.once('error',()=>{exited=true;for(const w of waiters.splice(0))w.reject(new Error('PDF执行器无法启动。'));resolve(-1);});child.once('close',code=>{exited=true;exitCode=code;for(const w of waiters.splice(0))w.reject(new Error('PDF执行器已结束。'));resolve(code);});});
  function next(timeout=15000){if(messages.length)return Promise.resolve(messages.shift());if(exited)return Promise.reject(new Error('PDF执行器已结束。'));return new Promise((resolve,reject)=>{const waiter={resolve:value=>{clearTimeout(timer);resolve(value);},reject:error=>{clearTimeout(timer);reject(error);}};const timer=setTimeout(()=>{const n=waiters.indexOf(waiter);if(n>=0)waiters.splice(n,1);reject(new Error('PDF执行器响应超时。'));},timeout);waiters.push(waiter);});}
  try{const ready=await next();if(ready.type!=='ready'||ready.capabilities!==0)throw new Error('隔离执行器尚未就绪。');}
  catch(error){child.kill();await exit;await boundedProcess(helper,[config,'recover']).catch(()=>{});throw error;}
  let running=false;
  return {pid:child.pid,config,async run(tool,args,{binary=false,timeout=10000}={}){
    if(running||exited)throw new Error('PDF执行器当前不可接收命令。');running=true;
    try{
      child.stdin.write(JSON.stringify({tool,args,binary,timeout_ms:timeout})+'\n');const result=await next(timeout+10000);
      if(result.type!=='result'||result.app_container!==true||result.capabilities!==0||result.active_after!==0||result.memory_limit!==512*1024*1024)throw new Error('PDF处理隔离结果无法核对。');
      for(const field of ['stdout','stderr'])if(!/^command-\d{4}\.(?:stdout|stderr)\.part$/.test(result[field]??''))throw new Error('PDF处理输出路径无法核对。');
      const stdoutFile=path.join(output,result.stdout),stderrFile=path.join(output,result.stderr);
      const max=binary?5*1024*1024:65536;
      if((await fs.stat(stdoutFile)).size>max||(await fs.stat(stderrFile)).size>65536)throw new Error('PDF处理输出超过边界。');
      return {...result,stdoutFile,stderrFile,stdout:await fs.readFile(stdoutFile),stderr:await fs.readFile(stderrFile,'utf8')};
    }finally{running=false;}
  },async cancel(){await fs.writeFile(path.join(control,'cancel.json'),'{}',{mode:0o600});},async close(){
    if(!exited){child.stdin.end('{"close":true}\n');const timer=setTimeout(()=>child.kill(),15000);try{await exit;}finally{clearTimeout(timer);}}
    if(closedMessage?.cleanup!==true){const recovery=await boundedProcess(helper,[config,'recover']);const rows=recovery.out.trim().split(/\r?\n/).map(x=>JSON.parse(x));if(!rows.some(x=>x.type==='closed'&&x.cleanup===true))throw new Error('PDF临时执行权限清理未完成。');}
    return {cleanup:true,exit_code:exitCode};
  }};
}
export async function recoverManualPdfWindowsSession({root,cacheDirectory}){
  const config=path.join(root,'control','native-config.json');if(!await present(config))return {cleanup:true,never_started:true};
  const helper=await compileManualPdfSandbox(cacheDirectory),result=await boundedProcess(helper,[config,'recover']);
  const rows=result.out.trim().split(/\r?\n/).map(x=>JSON.parse(x));if(!rows.some(x=>x.type==='closed'&&x.cleanup===true))fail('上次PDF执行环境尚未安全结束，请稍后核对。');return {cleanup:true};
}
