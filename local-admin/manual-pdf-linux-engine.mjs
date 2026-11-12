import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash,createPublicKey} from 'node:crypto';
import {fileURLToPath} from 'node:url';
export const linuxPdfEngineFiles=Object.freeze([
 'local-admin/manual-pdf-frames.mjs','local-admin/manual-pdf-linux-processor.mjs','local-admin/manual-pdf-linux-worker.mjs',
 'local-admin/manual-pdf-linux-engine.mjs','local-admin/manual-pdf-linux-systemd.mjs','local-admin/manual-pdf-linux-bridge.mjs',
 'local-admin/manual-pdf-linux-runtime.mjs','local-admin/manual-pdf-tools.mjs','local-admin/manual-pdf-jobs.mjs',
 'local-admin/manual-pdf-attestation.mjs','shared/manual-pdf-generation.mjs','shared/manual-pdf-review.mjs','shared/manual-pdf-errors.mjs',
]);
export const linuxPdfClientFiles=Object.freeze(['local-admin/manual-pdf-frames.mjs','local-admin/manual-pdf-linux-runtime.mjs','local-admin/manual-pdf-attestation.mjs','local-admin/manual-pdf-jobs.mjs','shared/manual-pdf-generation.mjs','shared/manual-pdf-review.mjs']);
export const linuxPdfWorkerFiles=Object.freeze(['local-admin/manual-pdf-frames.mjs','local-admin/manual-pdf-linux-processor.mjs','local-admin/manual-pdf-linux-worker.mjs','local-admin/manual-pdf-tools.mjs','shared/manual-pdf-generation.mjs','shared/manual-pdf-errors.mjs']);
export const linuxPdfPolicy=Object.freeze({schema:1,memory_bytes:512*1024**2,swap_bytes:0,cpu_percent:50,tasks:32,book_seconds:1200,diagnostic_bytes:65536,source_bytes:20*1024**2,image_bytes:5*1024**2,minimum_free_bytes:1024**3});
export const linuxPdfRoot=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
export const linuxPdfHash=value=>createHash('sha256').update(value).digest('hex');
export const linuxPdfCodeHash=bytes=>linuxPdfHash(Buffer.from(bytes.toString('utf8').replace(/\r\n/g,'\n')));
export async function linuxPdfFileHash(file){const h=createHash('sha256'),handle=await fs.open(file,fs.constants.O_RDONLY|fs.constants.O_NOFOLLOW);try{for await(const bytes of handle.createReadStream({autoClose:false}))h.update(bytes);return h.digest('hex');}finally{await handle.close();}}
export async function linuxPdfClientDigest(root=linuxPdfRoot){return linuxPdfHash(JSON.stringify(await Promise.all(linuxPdfClientFiles.map(async file=>({file,sha256:linuxPdfCodeHash(await fs.readFile(path.join(root,file)))})))));}
export async function readRootPdfJson(file){
 const handle=await fs.open(file,fs.constants.O_RDONLY|fs.constants.O_NOFOLLOW);try{const stat=await handle.stat();if(!stat.isFile()||stat.uid!==0||stat.nlink!==1||(stat.mode&0o022)!==0||stat.size>4*1024**2)throw new Error('unsafe_root_configuration');return JSON.parse(await handle.readFile('utf8'));}finally{await handle.close();}
}
export async function readRootPdfSigningKey(file){const handle=await fs.open(file,fs.constants.O_RDONLY|fs.constants.O_NOFOLLOW);try{const s=await handle.stat();if(!s.isFile()||s.uid!==0||s.nlink!==1||(s.mode&0o077)!==0||s.size>8192)throw new Error('unsafe_signing_key');return await handle.readFile('utf8');}finally{await handle.close();}}
export async function verifyLinuxPdfEngine(config,{full=true}={}){
 const manifest=await readRootPdfJson(config.manifest_file);
 if(manifest.schema!==1||!Array.isArray(manifest.files)||manifest.files.length<linuxPdfEngineFiles.length||manifest.files.length>6000||!/^[a-f0-9]{64}$/.test(manifest.client_digest??''))throw new Error('invalid_engine_manifest');
 const expected=new Set(linuxPdfEngineFiles.map(file=>path.join(config.code_directory,file))),seen=new Set();
 for(const entry of manifest.files){
  if(!path.isAbsolute(entry.path??'')||seen.has(entry.path)||!Number.isSafeInteger(entry.bytes)||entry.bytes<0||!/^[a-f0-9]{64}$/.test(entry.sha256??''))throw new Error('invalid_engine_entry');seen.add(entry.path);
  if(entry.lookup&&await fs.realpath(entry.lookup)!==entry.path)throw new Error('engine_link_changed');
  const handle=await fs.open(entry.path,fs.constants.O_RDONLY|fs.constants.O_NOFOLLOW);try{const stat=await handle.stat();if(!stat.isFile()||stat.uid!==0||(stat.mode&0o022)!==0||stat.size!==entry.bytes||stat.mtimeMs!==entry.mtime_ms||stat.ino!==entry.ino)throw new Error('engine_file_changed');if(full||expected.has(entry.path)){let digest;if(entry.code)digest=linuxPdfCodeHash(await handle.readFile());else{const h=createHash('sha256');for await(const bytes of handle.createReadStream({autoClose:false}))h.update(bytes);digest=h.digest('hex');}if(digest!==entry.sha256)throw new Error('engine_digest_changed');}}finally{await handle.close();}
 }
 if([...expected].some(file=>!seen.has(file)))throw new Error('engine_code_missing');
 if(!Array.isArray(manifest.aliases)||manifest.aliases.length>6000||!Array.isArray(manifest.directories)||manifest.directories.length>1000)throw new Error('engine_inventory_missing');
 for(const alias of manifest.aliases)if(!path.isAbsolute(alias.lookup??'')||!seen.has(alias.realpath)||await fs.realpath(alias.lookup)!==alias.realpath)throw new Error('engine_alias_changed');
 for(const directory of manifest.directories){if(!path.isAbsolute(directory.path??'')||await fs.realpath(directory.path)!==directory.realpath||JSON.stringify((await fs.readdir(directory.path)).sort())!==JSON.stringify(directory.names))throw new Error('engine_directory_changed');}
 if(manifest.client_digest!==await linuxPdfClientDigest(config.code_directory))throw new Error('client_code_changed');
 const publicKey=createPublicKey(await readRootPdfSigningKey(config.signing_key_file)).export({type:'spki',format:'der'}),keyId=linuxPdfHash(publicKey);
 const fingerprint=linuxPdfHash(JSON.stringify({files:manifest.files,aliases:manifest.aliases,directories:manifest.directories,client_digest:manifest.client_digest,policy:linuxPdfPolicy,installation_id:config.installation_id,service_unit:config.service_unit,version:manifest.version,key_id:keyId}));
 let proof=null;try{proof=await readRootPdfJson(config.proof_file);}catch{}
 return {fingerprint,version:manifest.version,client_digest:manifest.client_digest,production_verified:proof?.schema===1&&proof.engine_fingerprint===fingerprint&&proof.integration_verified===true,attestation_public_key:publicKey.toString('base64'),attestation_key_id:keyId,manifest};
}
