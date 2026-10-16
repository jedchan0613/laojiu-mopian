// 本机启动前更新过期页面；只重新生成发布层，不保存或发布档案。
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawn} from 'node:child_process';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const site=path.join(root,'site'),dist=path.join(site,'dist');
const exists=async p=>fs.access(p).then(()=>true,()=>false);
const newest=async p=>{
  if(!await exists(p))return 0;
  const info=await fs.stat(p);
  if(!info.isDirectory())return info.mtimeMs;
  let time=info.mtimeMs;
  for(const entry of await fs.readdir(p,{withFileTypes:true})){
    if(entry.isSymbolicLink())continue;
    time=Math.max(time,await newest(path.join(p,entry.name)));
  }
  return time;
};
const run=(file,args,cwd,env=process.env)=>new Promise((resolve,reject)=>{
  const child=spawn(file,args,{cwd,env,stdio:'inherit',windowsHide:true});
  child.once('error',reject);
  child.once('exit',code=>code===0?resolve():reject(new Error(`本地预览更新失败（退出码 ${code}）。`)));
});

try{
  const inputs=['site/src','site/public','site/scripts','site/astro.config.mjs','site/package.json','site/package-lock.json','shared','archive-data','local-admin/translations','local-admin/server.mjs','local-admin/translations.mjs','local-admin/refresh-preview.mjs'];
  const pages=['index.html','en/index.html','th/index.html','ja/index.html','ko/index.html','zh-hant/index.html','archive/index.html'];
  const complete=(await Promise.all(pages.map(p=>exists(path.join(dist,p))))).every(Boolean);
  const built=complete?(await fs.stat(path.join(dist,'index.html'))).mtimeMs:0;
  if(complete&&Math.max(...await Promise.all(inputs.map(p=>newest(path.join(root,p)))))<=built){
    console.log('本地页面已是最新版本：http://127.0.0.1:4173/');
  }else{
    console.log('正在更新本地页面，地址仍为 http://127.0.0.1:4173/，请等待检查完成。');
    const backup=path.join(root,'outputs','local-preview-backups',new Date().toISOString().replace(/[:.]/g,'-'));
    await fs.mkdir(backup,{recursive:true});
    const generated=['src/data/archive.ts','src/data/archive-translations.json','src/data/archive-translations.th.json','src/data/archive-translations.ja.json','src/data/archive-translations.ko.json','src/data/archive-translations.zh-Hant.json','src/data/generated/image-manifest.json'];
    const saved=[];
    for(const p of generated){const source=path.join(site,p);if(await exists(source)){const target=path.join(backup,p);await fs.mkdir(path.dirname(target),{recursive:true});await fs.copyFile(source,target);saved.push(p);}}
    const hadDist=await exists(dist);
    if(hadDist)await fs.rename(dist,path.join(backup,'dist'));
    try{
      await run(process.execPath,[path.join(root,'local-admin/server.mjs'),'--sync-site-data'],root,{
        ...process.env,LJM_ADMIN_MODE:'local',LJM_ADMIN_HOST:'127.0.0.1',LJM_ADMIN_PORT:'4173',
        LJM_PROJECT_ROOT:root,LJM_SITE_DIR:site,LJM_ARCHIVE_DATA_DIR:path.join(root,'archive-data'),LJM_ADMIN_DATA_ROOT:path.join(root,'local-admin'),
      });
      await run(process.platform==='win32'?(process.env.ComSpec??'C:\\Windows\\System32\\cmd.exe'):'npm',process.platform==='win32'?['/d','/s','/c','npm run build']:['run','build'],site);
      console.log('本地页面更新完成：http://127.0.0.1:4173/');
    }catch(error){
      if(await exists(dist))await fs.rename(dist,path.join(backup,'failed-dist'));
      if(hadDist)await fs.rename(path.join(backup,'dist'),dist);
      for(const p of saved)await fs.copyFile(path.join(backup,p),path.join(site,p));
      throw error;
    }
  }
}catch(error){console.error(error.message);process.exitCode=1;}
