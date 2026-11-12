// 安装辅助只从root持有的已审源码复制代码及既有sharp依赖，不安装任何包。
import fs from 'node:fs/promises';import path from 'node:path';import{execFile}from'node:child_process';import{promisify}from'node:util';import{randomBytes,generateKeyPairSync}from'node:crypto';import{fileURLToPath}from'node:url';
import{readRootPdfSigningKey}from'../local-admin/manual-pdf-linux-engine.mjs';
import{linuxPdfEngineFiles,linuxPdfClientDigest,linuxPdfHash,linuxPdfCodeHash,linuxPdfFileHash}from'../local-admin/manual-pdf-linux-engine.mjs';
const execute=promisify(execFile),npmName=/^(?:@[a-z0-9][a-z0-9._-]*\/)?[a-z0-9][a-z0-9._-]*$/;
export async function assertRootDirectory(directory){
 const absolute=path.resolve(directory);let current=path.parse(absolute).root;
 for(const segment of absolute.slice(current.length).split(path.sep).filter(Boolean)){current=path.join(current,segment);const stat=await fs.lstat(current);if(!stat.isDirectory()||stat.isSymbolicLink()||stat.uid!==0||(stat.mode&0o022)!==0)throw new Error('目录必须由root持有且不能由其他账号改写。');}
}
export async function copySharpVendor(siteDirectory,destination){
 const versions=new Map(),root=path.resolve(siteDirectory);await fs.mkdir(destination,{mode:0o755});
 async function locate(name,from){if(!npmName.test(name))throw new Error('依赖名称无效。');let dir=from;while(dir===root||dir.startsWith(root+path.sep)){const candidate=path.join(dir,'node_modules',name);try{await fs.access(path.join(candidate,'package.json'));return candidate;}catch{}if(dir===root)break;dir=path.dirname(dir);}return null;}
 async function safeTree(source,target,base,depth=0){
  if(depth>30)throw new Error('依赖层级超限。');await fs.mkdir(target,{recursive:true,mode:0o755});await fs.chmod(target,0o755);
  for(const entry of await fs.readdir(source,{withFileTypes:true})){
   if(entry.name==='node_modules')continue;const file=path.join(source,entry.name),dest=path.join(target,entry.name);if(entry.isSymbolicLink())throw new Error('依赖目录出现链接，停止复制。');
   if(entry.isDirectory())await safeTree(file,dest,base,depth+1);else if(entry.isFile()){await fs.copyFile(file,dest,fs.constants.COPYFILE_EXCL);await fs.chown(dest,0,0);const stat=await fs.stat(file);await fs.chmod(dest,(stat.mode&0o111)?0o555:0o444);}else throw new Error('依赖目录含特殊文件。');
  }
 }
 async function include(name,from,optional=false){
  const source=await locate(name,from);if(!source){if(optional)return;throw new Error('缺少现有依赖：'+name);}
  const pkg=JSON.parse(await fs.readFile(path.join(source,'package.json'),'utf8'));if(pkg.name!==name||typeof pkg.version!=='string')throw new Error('依赖清单不匹配。');
  if(versions.has(name)){if(versions.get(name)!==pkg.version)throw new Error('依赖版本存在冲突，不能平铺复制。');return;}
  versions.set(name,pkg.version);const target=path.join(destination,name);await fs.mkdir(path.dirname(target),{recursive:true,mode:0o755});await fs.chmod(path.dirname(target),0o755);await safeTree(source,target,source);
  for(const child of Object.keys(pkg.dependencies??{}))await include(child,source);
  for(const child of Object.keys(pkg.optionalDependencies??{}))await include(child,source,true);
 }
 await include('sharp',root);await fs.chmod(destination,0o755);return Object.fromEntries(versions);
}
export async function prepareLinuxPdfInstallation({sourceRoot,siteDirectory,destination,serviceUnit,socketFile,stateDirectory,clientGid=111,enabled=false}){
 if(process.platform!=='linux'||process.getuid()!==0)throw new Error('只允许Linux root准备安装。');
 for(const directory of [sourceRoot,path.dirname(destination),path.dirname(stateDirectory),path.dirname(socketFile)])await assertRootDirectory(directory);
 if(!/^ljm-(?:manual-pdf|pdf66)-[a-z0-9-]+\.service$/.test(serviceUnit)||!Number.isSafeInteger(clientGid)||clientGid<1)throw new Error('服务配置无效。');
 await fs.mkdir(destination,{mode:0o755});await fs.chmod(destination,0o755);
 for(const relative of linuxPdfEngineFiles){const source=path.join(sourceRoot,relative),stat=await fs.lstat(source);if(!stat.isFile()||stat.isSymbolicLink()||stat.uid!==0||(stat.mode&0o022)!==0)throw new Error('待安装代码不是root持有的已审副本。');const target=path.join(destination,relative);await fs.mkdir(path.dirname(target),{recursive:true,mode:0o755});await fs.chmod(path.dirname(target),0o755);await fs.copyFile(source,target,fs.constants.COPYFILE_EXCL);await fs.chmod(target,0o444);}
 const vendor=path.join(destination,'vendor'),dependencies=await copySharpVendor(siteDirectory,vendor),files=[],lookups=new Map();
 for(const relative of linuxPdfEngineFiles){const file=path.join(destination,relative),bytes=await fs.readFile(file);files.push({path:file,bytes:bytes.length,code:true,sha256:linuxPdfCodeHash(bytes)});}
 async function inventory(directory){for(const row of await fs.readdir(directory,{withFileTypes:true})){const file=path.join(directory,row.name);if(row.isDirectory())await inventory(file);else if(row.isFile()){const bytes=await fs.readFile(file);files.push({path:file,bytes:bytes.length,sha256:linuxPdfHash(bytes)});}else throw new Error('复制后的依赖目录包含链接或特殊文件。');}}
 await inventory(vendor);
 const node=await fs.realpath('/snap/node/current/bin/node'),tools=['/usr/bin/pdfinfo','/usr/bin/pdfdetach','/usr/bin/pdftoppm','/usr/bin/pdffonts','/usr/bin/bwrap','/usr/bin/setpriv',node];
 for(const tool of tools){lookups.set(tool,await fs.realpath(tool));const {stdout}=await execute('/usr/bin/ldd',[tool],{env:{PATH:'/usr/bin:/bin',LANG:'C.UTF-8'},maxBuffer:65536});for(const match of stdout.matchAll(/(?:=>\s+|^\s*)(\/[^\s(]+)/gm))lookups.set(match[1],await fs.realpath(match[1]));}
 for(const [lookup,file]of lookups){const stat=await fs.stat(file);files.push({path:file,lookup,bytes:stat.size,sha256:await linuxPdfFileHash(file)});}
 // 字体及其配置也进入版本绑定；系统配置中的可信链接解析到固定目标。
 const fontPaths=new Map(),directories=[];async function fonts(directory,depth=0){if(depth>12)throw new Error('字体配置层级超限。');const names=(await fs.readdir(directory)).sort();directories.push({path:directory,realpath:await fs.realpath(directory),names});for(const name of names){const logical=path.join(directory,name),real=await fs.realpath(logical),stat=await fs.stat(real);if(stat.isDirectory())await fonts(logical,depth+1);else if(stat.isFile())fontPaths.set(logical,real);else throw new Error('字体配置出现特殊文件。');}}
 await fonts('/etc/fonts');await fonts('/usr/share/fonts');await fonts('/usr/local/share/fonts');await fonts('/usr/share/poppler');await fonts('/var/cache/fontconfig');
 for(const [lookup,file]of fontPaths){const stat=await fs.stat(file);if(!files.some(e=>e.path===file))files.push({path:file,lookup,bytes:stat.size,sha256:await linuxPdfFileHash(file)});}
 const unique=[];for(const entry of files){const prior=unique.find(e=>e.path===entry.path);if(prior){if(prior.sha256!==entry.sha256)throw new Error('安装期间文件变化。');continue;}unique.push(entry);}unique.sort((a,b)=>a.path.localeCompare(b.path,'en'));
 for(const entry of unique){const stat=await fs.stat(entry.path);entry.mtime_ms=stat.mtimeMs;entry.ino=stat.ino;}
 const version=(await execute('/usr/bin/pdfinfo',['-v'],{env:{PATH:'/usr/bin:/bin',LANG:'C.UTF-8'}})).stderr.split('\n')[0];
 const aliases=[...new Map([...lookups,...fontPaths]).entries()].map(([lookup,realpath])=>({lookup,realpath})).sort((a,b)=>a.lookup.localeCompare(b.lookup,'en'));
 const manifest={schema:1,version,client_digest:await linuxPdfClientDigest(destination),dependencies,files:unique,aliases,directories},manifestFile=path.join(destination,'engine-manifest.json');await fs.writeFile(manifestFile,JSON.stringify(manifest,null,2),{flag:'wx',mode:0o600});
 await fs.mkdir(stateDirectory,{recursive:true,mode:0o700});await assertRootDirectory(stateDirectory);await fs.chmod(stateDirectory,0o700);
 const signingKeyFile=path.join(stateDirectory,'signing-key.pem');
 try{await readRootPdfSigningKey(signingKeyFile);}catch(error){if(error.code!=='ENOENT')throw error;const {privateKey}=generateKeyPairSync('ed25519');await fs.writeFile(signingKeyFile,privateKey.export({type:'pkcs8',format:'pem'}),{flag:'wx',mode:0o600});}
 const config={schema:1,enabled,socket_file:socketFile,directory:stateDirectory,code_directory:destination,vendor_directory:vendor,node_binary:node,manifest_file:manifestFile,proof_file:path.join(stateDirectory,'acceptance.json'),signing_key_file:signingKeyFile,installation_id:randomBytes(32).toString('hex'),service_unit:serviceUnit,client_gid:clientGid};
 await fs.writeFile(path.join(destination,'bridge-config.json'),JSON.stringify(config,null,2),{flag:'wx',mode:0o600});return {config,manifest};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const settings=JSON.parse(await fs.readFile(process.argv[2],'utf8'));const result=await prepareLinuxPdfInstallation(settings);console.log(JSON.stringify({configuration:path.join(settings.destination,'bridge-config.json'),pinnedFiles:result.manifest.files.length,dependencies:result.manifest.dependencies,enabled:result.config.enabled}));
}
