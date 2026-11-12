// 私密Unix通道：接收字节和固定操作。特权进程不解析PDF，不接收调用者路径或命令。
import fs from 'node:fs/promises';
import path from 'node:path';
import net from 'node:net';
import {randomBytes} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {createPdfFrameReader,writePdfFrame,pdfDeadline,pdfFrameLimits} from './manual-pdf-frames.mjs';
import {linuxPdfHash,linuxPdfPolicy,readRootPdfJson,readRootPdfSigningKey,verifyLinuxPdfEngine} from './manual-pdf-linux-engine.mjs';
import {signLinuxPdfOrigin,pdfSigningIdentity} from './manual-pdf-attestation.mjs';
import {launchLinuxPdfWorker,stopLinuxPdfUnit} from './manual-pdf-linux-systemd.mjs';
const hex=/^[a-f0-9]{64}$/;
const fail=(code='processing_failed')=>{throw Object.assign(new Error(code),{pdfCode:code});};
const exact=(value,keys)=>Object.keys(value).every(k=>keys.includes(k));
const atomic=async(file,value)=>{const tmp=file+'.'+randomBytes(12).toString('hex')+'.tmp';await fs.writeFile(tmp,JSON.stringify(value),{flag:'wx',mode:0o600});try{await fs.rename(tmp,file);}catch(error){await fs.unlink(tmp).catch(()=>{});throw error;}};
export async function createLinuxPdfBridge({config,engine=options=>verifyLinuxPdfEngine(config,options),backend={launch:launchLinuxPdfWorker,stop:stopLinuxPdfUnit},signingKey,secureSocket=async file=>{await fs.chmod(file,0o660);if(process.platform==='linux')await fs.chown(file,0,config.client_gid);}}){
 const privateKey=signingKey??await readRootPdfSigningKey(config.signing_key_file),identity=pdfSigningIdentity(privateKey);
 const sessions=new Map(),sockets=new Set();let active=null,stopping=false;
 const idFor=token=>{if(!hex.test(token??''))fail();return linuxPdfHash(config.installation_id+':'+token);};
 const unitFor=id=>'ljm-manual-pdf-'+id.slice(0,32)+'.service';
 const root=path.resolve(config.directory),sessionRoot=path.join(root,'sessions'),receiptRoot=path.join(root,'receipts');
 for(const dir of [root,sessionRoot,receiptRoot])await fs.mkdir(dir,{recursive:true,mode:0o700});
 const directoryFor=id=>{if(!hex.test(id))fail();const result=path.join(sessionRoot,id);if(path.dirname(result)!==sessionRoot)fail();return result;};
 async function receipt(id){try{return JSON.parse(await fs.readFile(path.join(receiptRoot,id+'.json'),'utf8'));}catch(error){if(error.code==='ENOENT')return null;throw error;}}
 async function removePrivateInput(id){
  const dir=directoryFor(id);const stat=await fs.lstat(dir).catch(e=>{if(e.code==='ENOENT')return null;throw e;});if(!stat)return;
  if(!stat.isDirectory()||stat.isSymbolicLink())fail();
  async function verify(folder){for(const row of await fs.readdir(folder,{withFileTypes:true})){if(row.isSymbolicLink())fail();const file=path.join(folder,row.name);if(row.isDirectory())await verify(file);else if(!row.isFile())fail();}}
  await verify(dir);await fs.rm(dir,{recursive:true,force:false});
 }
 async function closeSession(s,reason='closed'){
  if(s.cleanupPromise)return s.cleanupPromise;s.closing=true;s.reason=reason;s.socket?.destroy();
  s.cleanupPromise=(async()=>{
   if(s.priorReceipt){sessions.delete(s.id);if(active===s)active=null;return s.priorReceipt;}
   await backend.stop(s.unit);await s.opening?.catch(()=>{});await backend.stop(s.unit);
   s.child?.stdin.destroy();s.child?.stdout.destroy();s.child?.stderr.destroy();
   await removePrivateInput(s.id);
   const result={schema:1,cleanup:true,closed:true,reason,job_id:s.job_id,engine_fingerprint:s.engine_fingerprint,source_sha256:s.source_sha256};
   if(reason==='closed'&&s.inspected&&s.rendered?.length===s.pages)result.origin_attestation=signLinuxPdfOrigin({job_id:s.job_id,engine_fingerprint:s.engine_fingerprint,source:{sha256:s.source_sha256,bytes:s.source_bytes},profile:s.profile,tool_version:s.tool_version,inspection:s.inspection,pages:s.rendered},privateKey);
   await atomic(path.join(receiptRoot,s.id+'.json'),result);sessions.delete(s.id);if(active===s)active=null;return result;
  })();return s.cleanupPromise;
 }
 // 启动恢复只中止旧任务，绝不继续处理或重放结果。
 for(const row of await fs.readdir(sessionRoot,{withFileTypes:true})){
  if(!row.isDirectory()||!hex.test(row.name))fail();const state=JSON.parse(await fs.readFile(path.join(directoryFor(row.name),'session.json'),'utf8'));
  if(state.schema!==1||state.id!==row.name||state.unit!==unitFor(row.name))fail();await closeSession({...state,directory:directoryFor(row.name)},'interrupted');
 }
 async function recover(token,reason){
  const id=idFor(token),current=sessions.get(id);if(current)return closeSession(current,reason);
  const prior=await receipt(id);if(prior){if(prior.cleanup!==true)fail();return prior;}
  // 即使返回已确认不存在，也先核对对应的固定任务组已结束。
  await backend.stop(unitFor(id));await removePrivateInput(id);return {schema:1,cleanup:true,closed:true,reason:'not_started'};
 }
 async function open(socket,reader,header){
  if(!exact(header,['op','bytes','token','job_id','source_sha256','engine_fingerprint','profile'])||!/^PG-[a-f0-9]{24}$/.test(header.job_id??'')||!hex.test(header.source_sha256??'')||!hex.test(header.engine_fingerprint??'')||!['standard','detail'].includes(header.profile)||header.bytes<5||header.bytes>pdfFrameLimits.source)fail();
  if(active||stopping)fail('busy');const id=idFor(header.token);
  const s={schema:1,id,unit:unitFor(id),directory:directoryFor(id),socket,job_id:header.job_id,source_sha256:header.source_sha256,source_bytes:header.bytes,engine_fingerprint:header.engine_fingerprint,profile:header.profile,sequence:0,next_page:1,rendered:[]};active=s;sessions.set(id,s);
  socket.once('close',()=>void closeSession(s,s.reason??'interrupted').catch(()=>{}));
  s.opening=(async()=>{
   s.priorReceipt=await receipt(id);if(s.priorReceipt)fail('already_closed');
   const state=await engine();if(state.fingerprint!==header.engine_fingerprint||state.attestation_key_id!==identity.key_id)fail('configuration_changed');s.tool_version=state.version;
   const stat=await fs.statfs(root);if(Number(stat.bavail)*Number(stat.bsize)<linuxPdfPolicy.minimum_free_bytes+header.bytes+2*pdfFrameLimits.image)fail('capacity');
   if((await fs.readdir(receiptRoot)).length>=5000)fail('capacity');
   await fs.mkdir(s.directory,{mode:0o700});await atomic(path.join(s.directory,'session.json'),{schema:1,id,unit:s.unit,job_id:s.job_id,source_sha256:s.source_sha256,engine_fingerprint:s.engine_fingerprint});
   const body=await pdfDeadline(reader.body(header.bytes,pdfFrameLimits.source),120000,()=>socket.destroy());if(s.closing)fail('cancelled');
   if(body.subarray(0,5).toString()!=='%PDF-'||linuxPdfHash(body)!==header.source_sha256)fail('source_changed');
   const input=path.join(s.directory,'input');await fs.mkdir(input,{mode:0o755});await fs.chmod(input,0o755);await fs.writeFile(path.join(input,'source.pdf'),body,{flag:'wx',mode:0o444});await fs.chmod(path.join(input,'source.pdf'),0o444);
   if(s.closing)fail('cancelled');s.child=await backend.launch(config,s);s.worker=createPdfFrameReader(s.child.stdout);
   let diagnostics=0;s.child.stderr.on('data',chunk=>{diagnostics+=chunk.length;if(diagnostics>65536)void closeSession(s,'diagnostic_limit').catch(()=>{});});
   const ready=await pdfDeadline(s.worker.frame(0),15000,()=>s.child.kill());if(!ready.header.ok||ready.header.uid!==65534||ready.header.capabilities!==0||ready.header.no_new_privileges!==true||s.closing)fail('sandbox_not_ready');
   return state;
  })();
  try{
   await s.opening;await writePdfFrame(socket,{ok:true,opened:true,engine_fingerprint:s.engine_fingerprint});
   for(;;){
    const request=await pdfDeadline(reader.frame(0),60000,()=>socket.destroy()),h=request.header;
    if(h.op==='close'&&exact(h,['op','bytes'])){s.socket=null;const result=await closeSession(s);await writePdfFrame(socket,{ok:true,...result});return;}
    if(s.closing)fail('cancelled');
    if(h.op==='inspect'&&exact(h,['op','bytes'])&&!s.inspected){}
    else if(h.op==='render'&&exact(h,['op','bytes','page','profile'])&&s.inspected&&h.page===s.next_page&&h.page<=s.pages&&h.profile===s.profile){}
    else fail();
    const sequence=++s.sequence;await writePdfFrame(s.child.stdin,{...h,sequence});
    const response=await pdfDeadline(s.worker.frame(h.op==='render'?pdfFrameLimits.image:0),h.op==='render'?30000:10000,()=>void backend.stop(s.unit).catch(()=>{}));
    if(response.header.sequence!==sequence)fail();
    if(!response.header.ok){const code=/^[a-z_]{1,40}$/.test(response.header.pdfCode??'')?response.header.pdfCode:'processing_failed';await writePdfFrame(socket,{ok:false,pdfCode:code});fail(code);}
    const fields=response.header,allowedWarnings=new Set(['cropbox_differs','font_warning','tool_warning','font_check_needs_review','font_not_embedded','render_warning']);
    if(!Number.isSafeInteger(fields.diagnostic_bytes)||fields.diagnostic_bytes<0||fields.diagnostic_bytes>65536)fail();
    let safe;
    if(h.op==='inspect'){
     if(!Number.isSafeInteger(fields.pages)||fields.pages<1||fields.pages>200||!Array.isArray(fields.geometry)||fields.geometry.length!==fields.pages||!Array.isArray(fields.warnings)||fields.warnings.some(v=>!allowedWarnings.has(v))||typeof fields.pdf_version!=='string'||!/^\d\.\d{1,2}$/.test(fields.pdf_version))fail();
     const geometry=fields.geometry.map((g,index)=>{if(g.page!==index+1||!Number.isFinite(g.width)||!Number.isFinite(g.height)||g.width<=0||g.height<=0||Math.max(g.width,g.height)>14400||Math.max(g.width,g.height)/Math.min(g.width,g.height)>20||![0,90,180,270].includes(g.rotation))fail();return {page:g.page,width:g.width,height:g.height,rotation:g.rotation};});
     const checked=fields.inspection?.checked_at;if(typeof checked!=='string'||!Number.isFinite(Date.parse(checked)))fail();
     safe={ok:true,sequence,pages:fields.pages,geometry,warnings:fields.warnings,diagnostic_bytes:fields.diagnostic_bytes,pdf_version:fields.pdf_version,inspection:{schema:1,checked_at:checked,pages:fields.pages,encrypted:false,javascript:false,form:'none',attachments:0,pdf_version:fields.pdf_version,geometry,warnings:fields.warnings}};s.inspected=true;s.pages=fields.pages;s.inspection=safe.inspection;
    }else{
     if(response.body.length<4||response.body[0]!==255||response.body[1]!==216||!Number.isSafeInteger(fields.width)||!Number.isSafeInteger(fields.height)||fields.width<1||fields.height<1||fields.width*fields.height>8_000_000||fields.warning!=null&&!allowedWarnings.has(fields.warning))fail('page_output');s.next_page++;
     safe={ok:true,sequence,width:fields.width,height:fields.height,diagnostic_bytes:fields.diagnostic_bytes,warning:fields.warning??null};
     s.rendered.push({source_page:h.page,bytes:response.body.length,sha256:linuxPdfHash(response.body),width:fields.width,height:fields.height});
    }
    await writePdfFrame(socket,safe,response.body);
   }
  }finally{await closeSession(s,s.reason??'interrupted');}
 }
 const server=net.createServer({allowHalfOpen:true},socket=>{
  if(stopping||sockets.size>=8){socket.destroy();return;}sockets.add(socket);socket.on('error',()=>{});socket.setTimeout(125000,()=>socket.destroy());
  void(async()=>{
   const reader=createPdfFrameReader(socket);try{
    const h=await pdfDeadline(reader.header(),5000,()=>socket.destroy());
    if(h.op==='status'&&h.bytes===0&&exact(h,['op','bytes'])){const state=await engine({full:false});if(state.attestation_key_id!==identity.key_id)fail('configuration_changed');await writePdfFrame(socket,{ok:true,available:config.enabled===true,fingerprint:state.fingerprint,version:state.version,client_digest:state.client_digest,production_verified:state.production_verified,attestation_key_id:identity.key_id,attestation_public_key:identity.public_key});}
    else if(h.op==='open'&&config.enabled===true)await open(socket,reader,h);
    else if(['cancel','recover'].includes(h.op)&&h.bytes===0&&exact(h,['op','bytes','token']))await writePdfFrame(socket,{ok:true,...await recover(h.token,h.op==='cancel'?'cancelled':'interrupted')});
    else fail();
   }catch(error){if(!socket.destroyed)await writePdfFrame(socket,{ok:false,pdfCode:/^[a-z_]{1,40}$/.test(error.pdfCode??'')?error.pdfCode:'processing_failed'}).catch(()=>{});}
   finally{sockets.delete(socket);socket.end();}
  })();
 });
 return {server,async listen(){
  const before=await fs.lstat(config.socket_file).catch(e=>{if(e.code==='ENOENT')return null;throw e;});
  if(before){
   if(process.platform!=='linux'||!before.isSocket()||before.uid!==0||(before.mode&0o007)!==0)throw new Error('existing_socket_requires_recovery');
   const probe=net.createConnection(config.socket_file);let stale=false;try{await pdfDeadline(new Promise((resolve,reject)=>{probe.once('connect',resolve);probe.once('error',reject);}),1000,()=>probe.destroy());}catch(error){if(error.code==='ECONNREFUSED')stale=true;else throw error;}finally{probe.destroy();}
   if(!stale)throw new Error('another_pdf_bridge_is_running');const current=await fs.lstat(config.socket_file);if(current.ino!==before.ino||current.dev!==before.dev)throw new Error('socket_changed');await fs.unlink(config.socket_file);
  }
  await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(config.socket_file,resolve);});await secureSocket(config.socket_file);
 },async close(){stopping=true;for(const socket of sockets)socket.destroy();await Promise.all([...sessions.values()].map(s=>closeSession(s,'interrupted')));await new Promise(resolve=>server.close(resolve));},sessions};
}
if(process.argv[1]&&await fs.realpath(process.argv[1]).catch(()=>null)===await fs.realpath(fileURLToPath(import.meta.url))){
 if(process.platform!=='linux'||process.getuid()!==0)throw new Error('Linux root service required');
 const config=await readRootPdfJson(process.argv[2]??'/etc/laojiumopian-manual-pdf.json');
 const keys=['schema','enabled','socket_file','directory','code_directory','vendor_directory','node_binary','manifest_file','proof_file','signing_key_file','installation_id','service_unit','client_gid'];
 if(config.schema!==1||typeof config.enabled!=='boolean'||!exact(config,keys)||!Number.isSafeInteger(config.client_gid)||config.client_gid<1||!hex.test(config.installation_id??'')||!/^ljm-(?:manual-pdf|pdf66)-[a-z0-9-]+\.service$/.test(config.service_unit??''))throw new Error('invalid_root_configuration');
 for(const key of ['socket_file','directory','code_directory','vendor_directory','node_binary','manifest_file','proof_file','signing_key_file'])if(!path.isAbsolute(config[key]??''))throw new Error('absolute_root_configuration_required');
 const bridge=await createLinuxPdfBridge({config});await bridge.listen();
 for(const signal of ['SIGTERM','SIGINT'])process.once(signal,()=>void bridge.close().then(()=>process.exit(0),()=>process.exit(1)));
}
