// 服务端签名仅证明处理来源与字节绑定，不能替代权利／隐私／逐页人工审核。
import fs from 'node:fs/promises';import path from 'node:path';import{createHash,createPublicKey,sign,verify}from'node:crypto';import{fileURLToPath}from'node:url';
import{linuxPdfPolicy}from'./manual-pdf-linux-engine.mjs';
const hash=v=>createHash('sha256').update(v).digest('hex'),hex=/^[a-f0-9]{64}$/;
export const defaultLinuxPdfTrustFile=fileURLToPath(new URL('./pdf-runtime/trusted-linux.json',import.meta.url));
export function pdfSigningIdentity(privateKey){const key=createPublicKey(privateKey).export({format:'der',type:'spki'});return {key_id:hash(key),public_key:key.toString('base64')};}
const inspectionIdentity=i=>({schema:i.schema,checked_at:i.checked_at,pages:i.pages,encrypted:i.encrypted,javascript:i.javascript,form:i.form,attachments:i.attachments,pdf_version:i.pdf_version,geometry:i.geometry.map(g=>({page:g.page,width:g.width,height:g.height,rotation:g.rotation})),warnings:[...i.warnings]});
export function linuxPdfOriginPayload(job){
 const pages=job.pages.map((p,index)=>{if(p.source_page!==index+1||!hex.test(p.sha256??'')||!Number.isSafeInteger(p.bytes)||p.bytes<1||p.bytes>5*1024**2||![p.width,p.height].every(n=>Number.isSafeInteger(n)&&n>0)||p.width*p.height>8_000_000)throw new Error('invalid_attested_page');return {source_page:p.source_page,bytes:p.bytes,sha256:p.sha256,width:p.width,height:p.height};});
 if(!/^PG-[a-f0-9]{24}$/.test(job.job_id??'')||!hex.test(job.engine_fingerprint??'')||!hex.test(job.source?.sha256??'')||!Number.isSafeInteger(job.source?.bytes)||job.source.bytes<5||job.source.bytes>20*1024**2||!['standard','detail'].includes(job.profile)||pages.length<1||pages.length>200||job.inspection?.pages!==pages.length)throw new Error('invalid_attested_job');
 return {schema:1,job_id:job.job_id,engine_fingerprint:job.engine_fingerprint,source_sha256:job.source.sha256,source_bytes:job.source.bytes,profile:job.profile,tool_version:job.tool_version,policy_digest:hash(JSON.stringify(linuxPdfPolicy)),inspection_digest:hash(JSON.stringify(inspectionIdentity(job.inspection))),pages};
}
export function signLinuxPdfOrigin(job,privateKey){const payload=linuxPdfOriginPayload(job),identity=pdfSigningIdentity(privateKey);return {schema:1,key_id:identity.key_id,payload,signature:sign(null,Buffer.from(JSON.stringify(payload)),privateKey).toString('base64')};}
export function verifyLinuxPdfOrigin(attestation,job,{public_key,key_id,engine_fingerprints}={}){
 try{if(attestation?.schema!==1||attestation.key_id!==key_id||!hex.test(key_id??'')||!Array.isArray(engine_fingerprints)||!engine_fingerprints.includes(job.engine_fingerprint)||typeof public_key!=='string'||public_key.length>2048||typeof attestation.signature!=='string'||attestation.signature.length>200)return false;
  const der=Buffer.from(public_key,'base64');if(hash(der)!==key_id)return false;const expected=linuxPdfOriginPayload(job);if(JSON.stringify(expected)!==JSON.stringify(attestation.payload))return false;
  return verify(null,Buffer.from(JSON.stringify(expected)),createPublicKey({key:der,format:'der',type:'spki'}),Buffer.from(attestation.signature,'base64'));
 }catch{return false;}
}
export async function verifiedLinuxPdfGeneration(job,configuration=null,{trustFile=defaultLinuxPdfTrustFile}={}){
 if(job.execution_platform!=='linux'&&!job.origin_attestation)return false;
 // 能连接当前Linux运行器时，以当前配置为准；不能用遗留的离线信任表绕过配置更新。
 if(configuration?.execution_platform==='linux')return configuration.fingerprint===job.engine_fingerprint&&verifyLinuxPdfOrigin(job.origin_attestation,job,{public_key:configuration.attestation_public_key,key_id:configuration.attestation_key_id,engine_fingerprints:[configuration.fingerprint]});
 if(configuration?.fingerprint===job.engine_fingerprint&&verifyLinuxPdfOrigin(job.origin_attestation,job,{public_key:configuration.attestation_public_key,key_id:configuration.attestation_key_id,engine_fingerprints:[configuration.fingerprint]}))return true;
 try{const handle=await fs.open(trustFile,fs.constants.O_RDONLY|fs.constants.O_NOFOLLOW);let trust;try{const stat=await handle.stat();if(!stat.isFile()||stat.size>128*1024)return false;trust=JSON.parse(await handle.readFile('utf8'));}finally{await handle.close();}
  if(trust.schema!==1||!Array.isArray(trust.servers)||trust.servers.length>10)return false;
  return trust.servers.some(server=>Array.isArray(server.engine_fingerprints)&&server.engine_fingerprints.length<=20&&verifyLinuxPdfOrigin(job.origin_attestation,job,server));
 }catch{return false;}
}
