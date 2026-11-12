import fs from 'node:fs/promises';
import path from 'node:path';
import net from 'node:net';
import {randomBytes} from 'node:crypto';
import {once} from 'node:events';
import {createPdfFrameReader,writePdfFrame,pdfDeadline,pdfFrameLimits} from './manual-pdf-frames.mjs';
import {linuxPdfClientDigest,linuxPdfHash,linuxPdfRoot} from './manual-pdf-linux-engine.mjs';
import {pdfGenerationMessages} from '../shared/manual-pdf-errors.mjs';
import {verifyLinuxPdfOrigin} from './manual-pdf-attestation.mjs';
const fail=(code='processing_failed')=>{throw Object.assign(new Error(pdfGenerationMessages[code]??'PDF受限处理暂时不可用，已有文件仍保留。'),{name:'SubmissionError',statusCode:503,pdfCode:code});};
const stateFile=root=>path.join(root,'control','linux-session.json');
export function jpegDimensions(bytes){
 if(!Buffer.isBuffer(bytes)||bytes.length<12||bytes.length>pdfFrameLimits.image||bytes[0]!==255||bytes[1]!==216)fail('page_output');
 let position=2;while(position+4<=bytes.length){if(bytes[position++]!==255)fail('page_output');while(bytes[position]===255)position++;const marker=bytes[position++];if(marker===0xda||marker===0xd9)break;const length=bytes.readUInt16BE(position);if(length<2||position+length>bytes.length)fail('page_output');if(marker===0xc0||marker===0xc2){if(length<8)fail('page_output');const height=bytes.readUInt16BE(position+3),width=bytes.readUInt16BE(position+5);if(!width||!height||width*height>8_000_000||Math.max(width,height)>4096)fail('page_output');return {width,height};}position+=length;}
 fail('page_output');
}
export function createLinuxManualPdfRuntime({socketFile=process.env.LJM_MANUAL_PDF_SOCKET??'/run/laojiumopian-manual-pdf/bridge.sock',projectRoot=linuxPdfRoot,platform=process.platform,verifySocket=async()=>{
 const stat=await fs.lstat(socketFile),parent=await fs.lstat(path.dirname(socketFile));if(!stat.isSocket()||stat.uid!==0||(stat.mode&0o007)!==0||(stat.mode&0o600)!==0o600||!parent.isDirectory()||parent.isSymbolicLink()||parent.uid!==0||(parent.mode&0o022)!==0)throw new Error('untrusted_pdf_socket');
}}={}){
 async function connect(){await verifySocket();const socket=net.createConnection(socketFile);socket.on('error',()=>{});await pdfDeadline(once(socket,'connect'),5000,()=>socket.destroy());return {socket,reader:createPdfFrameReader(socket)};}
 async function exchange(channel,header,body=Buffer.alloc(0),ms=35000){
  const result=await pdfDeadline((async()=>{await writePdfFrame(channel.socket,header,body);return channel.reader.frame(header.op==='render'?pdfFrameLimits.image:0);})(),ms,()=>channel.socket.destroy());
  if(result.header.ok!==true)fail(/^[a-z_]{1,40}$/.test(result.header.pdfCode??'')?result.header.pdfCode:'processing_failed');return result;
 }
 async function control(header){const channel=await connect();try{return (await exchange(channel,header,Buffer.alloc(0),20000)).header;}finally{channel.socket.destroy();}}
 async function configuration(){
  if(platform!=='linux')fail('tools_not_ready');let response;try{response=await control({op:'status'});}catch{fail('tools_not_ready');}
  if(response.available!==true||!/^[a-f0-9]{64}$/.test(response.fingerprint??'')||response.client_digest!==await linuxPdfClientDigest(projectRoot)||typeof response.version!=='string'||response.version.length>80||typeof response.attestation_public_key!=='string'||response.attestation_public_key.length>2048||linuxPdfHash(Buffer.from(response.attestation_public_key,'base64'))!==response.attestation_key_id)fail('configuration_changed');
  return {fingerprint:response.fingerprint,version:response.version,transient_source_copies:1,production_verified:response.production_verified===true,execution_platform:'linux',requires_attestation:true,attestation_public_key:response.attestation_public_key,attestation_key_id:response.attestation_key_id};
 }
 async function status(){try{const config=await configuration();return {available:true,execution_platform:'linux',production_verified:config.production_verified,message:config.production_verified?'Linux受限生成可用，结果仍需逐页核对。':'Linux受限生成已连接，生产接入验收尚未确认。'};}catch{return {available:false,execution_platform:'linux',production_verified:false,message:'服务器PDF受限处理尚未就绪；已有文件和预览仍保留。'};}}
 async function recover(root){
  let state;try{state=JSON.parse(await fs.readFile(stateFile(root),'utf8'));}catch(error){if(error.code==='ENOENT')return {cleanup:true,never_started:true};fail();}
  if(state.schema!==1||!/^[a-f0-9]{64}$/.test(state.token??'')||!/^PG-[a-f0-9]{24}$/.test(state.job_id??'')||!/^[a-f0-9]{64}$/.test(state.source_sha256??'')||!/^[a-f0-9]{64}$/.test(state.engine_fingerprint??''))fail();const result=await control({op:'recover',token:state.token});if(result.cleanup!==true||result.reason!=='not_started'&&(result.job_id!==state.job_id||result.source_sha256!==state.source_sha256||result.engine_fingerprint!==state.engine_fingerprint))fail();return result;
 }
 async function open(root,job){
  const config=await configuration();if(config.fingerprint!==job.engine_fingerprint)fail('configuration_changed');
  const file=path.join(root,'work','input','source.pdf.part'),handle=await fs.open(file,fs.constants.O_RDONLY|fs.constants.O_NOFOLLOW);let body;
  try{const stat=await handle.stat();if(!stat.isFile()||stat.nlink!==1||stat.size!==job.source.bytes||stat.size>pdfFrameLimits.source)fail('source_changed');body=await handle.readFile();if(linuxPdfHash(body)!==job.source.sha256)fail('source_changed');}finally{await handle.close();}
  const token=randomBytes(32).toString('hex');await fs.mkdir(path.join(root,'control'),{recursive:true,mode:0o700});await fs.writeFile(stateFile(root),JSON.stringify({schema:1,token,job_id:job.job_id,source_sha256:job.source.sha256,engine_fingerprint:config.fingerprint}),{flag:'wx',mode:0o600});
  let channel;
  try{channel=await connect();await exchange(channel,{op:'open',token,job_id:job.job_id,source_sha256:job.source.sha256,engine_fingerprint:config.fingerprint,profile:job.profile},body,140000);}catch(error){channel?.socket.destroy();try{await recover(root);}catch{error.pdfCleanupUncertain=true;}throw error;}
  let closed=false,cancelled=false,closedResult;
  const originJob={...job,source:{...job.source},tool_version:config.version,pages:[]};
  return {root,profile:job.profile,originJob,async request(op,extra={}){if(closed)fail('cancelled');return exchange(channel,{op,...extra});},
   async cancel(){const result=await control({op:'cancel',token});if(result.cleanup!==true)fail();cancelled=true;closed=true;channel.socket.destroy();},
   async close(){if(closedResult)return closedResult;let result;
    if(!closed){try{result=(await exchange(channel,{op:'close'},Buffer.alloc(0),20000)).header;if(result.cleanup!==true)fail();}catch{result=await recover(root);}finally{closed=true;channel.socket.destroy();}}else result=await recover(root);
    if(!cancelled&&!verifyLinuxPdfOrigin(result.origin_attestation,originJob,{public_key:config.attestation_public_key,key_id:config.attestation_key_id,engine_fingerprints:[config.fingerprint]}))fail('page_output');
    closedResult={cleanup:true,...(!cancelled?{origin_attestation:result.origin_attestation}: {})};return closedResult;
   }
  };
 }
 async function inspect(session){const result=await session.request('inspect');const {ok,bytes,sequence,...info}=result.header;session.originJob.inspection=info.inspection;return info;}
 async function render(session,_source,page,profile){
  if(profile!==session.profile)fail('configuration_changed');const {header,body}=await session.request('render',{page,profile}),size=jpegDimensions(body);if(size.width!==header.width||size.height!==header.height)fail('page_output');
  session.originJob.pages.push({source_page:page,bytes:body.length,sha256:linuxPdfHash(body),...size});
  return {buffer:body,...size,diagnostic_bytes:header.diagnostic_bytes,warning:header.warning,peak_memory:0};
 }
 return {status,configuration,open,inspect,render,recover};
}
