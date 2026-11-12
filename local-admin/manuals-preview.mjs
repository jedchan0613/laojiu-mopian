// 只启动已有Astro的本机演示，不写档案，不安装依赖，不替换其他正在运行的预览。
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';

const root=fileURLToPath(new URL('../',import.meta.url)),site=path.join(root,'site');
const cli=path.join(site,'node_modules','astro','bin','astro.mjs');
try{
  await fs.access(cli);
  const run=promisify(execFile);
  const {stdout}=await run(process.execPath,[cli,'dev','--background','--host','127.0.0.1','--port','4236'],{
    cwd:site,windowsHide:true,timeout:45000,maxBuffer:1024*1024,
    env:{...process.env,NODE_ENV:'development',LJM_MANUALS_DEMO:'1'},
  });
  const messages=stdout.split(/\r?\n/).map(line=>{try{return JSON.parse(line).message??'';}catch{return line;}}).join('\n');
  const address=messages.match(/http:\/\/127\.0\.0\.1:\d+\/?/)?.[0];
  if(!address)throw new Error('未获得说明书预览地址；如本项目已有其他预览，请保留它并请Codex核对。');
  const url=new URL('/manuals/',address);
  const response=await fetch(url,{signal:AbortSignal.timeout(15000)});
  if(!response.ok||!(await response.text()).includes('data-manual-demo'))throw new Error('现有预览没有开启说明书演示，未自动停止或替换它。请由Codex核对后再试。');
  console.log('MANUALS_PREVIEW_URL='+url.href);
}catch(error){
  console.error('说明书本地预览没有启动：'+(error?.code==='ENOENT'?'请先检查本项目现有Node.js和网站依赖。':error.message));
  process.exitCode=1;
}
