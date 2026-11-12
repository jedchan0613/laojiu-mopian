// 复用本地发布的私密历史区；只备份构建产物，不复制或提供源PDF。
import fs from 'node:fs/promises';import path from 'node:path';import {randomUUID,createHash} from 'node:crypto';import {createReadStream} from 'node:fs';
import {atomicWrite} from './write-coordinator.mjs';
const fail=message=>{throw Object.assign(new Error(message),{name:'SubmissionError',statusCode:409});};
const inside=(root,file)=>{const r=path.relative(root,file);return !r.startsWith('..')&&!path.isAbsolute(r);};
async function exists(file){try{return await fs.lstat(file);}catch(e){if(e.code==='ENOENT')return null;throw e;}}
async function noLinks(base,file){if(!inside(base,file))fail('PDF发布备份位置无效。');let target=base;for(const part of ['',...path.relative(base,file).split(path.sep).filter(Boolean)]){if(part)target=path.join(target,part);if((await exists(target))?.isSymbolicLink())fail('PDF发布及备份不接受文件链接。');}}
async function tree(root,files=[]){for(const row of await fs.readdir(root,{withFileTypes:true})){const file=path.join(root,row.name);if(row.isSymbolicLink())fail('PDF发布及备份不接受文件链接。');if(row.isDirectory())await tree(file,files);else if(row.isFile())files.push(file);else fail('PDF公开产物含无法核对的文件。');}return files;}
export function createManualPdfPublicationBackup({root,siteDirectory}){
  root=path.resolve(root);siteDirectory=path.resolve(siteDirectory);const dist=path.join(siteDirectory,'dist');
  if(inside(root,siteDirectory)||inside(siteDirectory,root))fail('PDF页面备份必须保存在网站之外的私密历史区。');
  return async function prepare(){
    await noLinks(path.dirname(root),root);await fs.mkdir(root,{recursive:true,mode:0o700});
    for(const name of await fs.readdir(root)){if(!/^[a-f0-9-]{36}$/.test(name))continue;const file=path.join(root,name,'manifest.json');await noLinks(root,file);const raw=await exists(file);if(!raw)fail('有PDF发布备份尚未完成，需要先核对。');const m=JSON.parse(await fs.readFile(file,'utf8'));if(!['complete','rolled-back'].includes(m.status))fail('有中断的PDF发布需要核对，旧页面备份已保留，不能自动重放。');}
    await noLinks(siteDirectory,dist);const hadDist=Boolean(await exists(dist)),directory=path.join(root,randomUUID());await fs.mkdir(directory,{mode:0o700});
    const manifest={version:1,status:'preparing',created_at:new Date().toISOString(),had_dist:hadDist};
    const save=async(status,extra={})=>{Object.assign(manifest,{status,...extra});await atomicWrite(path.join(directory,'manifest.json'),JSON.stringify(manifest,null,2)+'\n');};
    await save('preparing');if(hadDist){await tree(dist);await fs.cp(dist,path.join(directory,'previous-dist'),{recursive:true,errorOnExist:true,force:false,preserveTimestamps:true});}await save('prepared');
    return {directory,async complete(){await save('complete',{finished_at:new Date().toISOString()});},async restore(){if(manifest.status==='rolled-back')return;await noLinks(siteDirectory,dist);await noLinks(root,directory);if(hadDist){await noLinks(root,path.join(directory,'previous-dist'));await tree(path.join(directory,'previous-dist'));}if(await exists(dist)){await tree(dist);await fs.rename(dist,path.join(directory,'failed-dist'));}if(hadDist)await fs.rename(path.join(directory,'previous-dist'),dist);await save('rolled-back',{finished_at:new Date().toISOString()});}};
  };
}
// 构建程序不读取私密数据。由本地发布端带入已知的私密值，在采用结果前扫描。
export async function assertManualPdfPublicArtifacts({dist,privateValues=[],sourceFiles=[]}){
  dist=path.resolve(dist);await noLinks(path.dirname(dist),dist);if(!await exists(dist))fail('PDF公开构建没有生成页面。');
  const values=new Set(privateValues.filter(v=>typeof v==='string'&&v.length>=16)),sources=new Set(sourceFiles.map(s=>s.sha256)),sizes=new Set(sourceFiles.map(s=>s.bytes));
  for(const file of await tree(dist)){
    const relative=path.relative(dist,file).split(path.sep).join('/');
    if(/(?:^|\/)(?:pdf-runtime|manuals-private|manuals-history|pdf-builds|submissions|mail-outbox)(?:\/|$)|(?:^|\/)source-[a-f0-9]{64}\.pdf$/i.test(relative))fail('PDF私密文件或目录混入公开构建。');
    if(/\.(?:html|js|json|css|txt|xml|svg|map)$/i.test(file)){const raw=await fs.readFile(file,'utf8');if([...values].some(v=>raw.includes(v))||/source-[a-f0-9]{64}\.pdf|TG-[A-F0-9]{24}|P[SG]-[a-f0-9]{24}|linux-session\.json|signing-key\.pem/.test(raw)||/"(?:source_pdf_digest|manual_pdf_sources|manual_pdf_render_saved|manual_pdf_saved_operations|origin_attestation|attestation_key_id|attestation_public_key)"\s*:/.test(raw))fail('PDF公开页面含私密来源、账号或处理信息，已停止采用。');}
    if(sizes.has((await fs.stat(file)).size)){const h=createHash('sha256');for await(const chunk of createReadStream(file))h.update(chunk);if(sources.has(h.digest('hex')))fail('源PDF字节混入公开构建，已停止采用。');}
  }
}
