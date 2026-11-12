// 本文件只在受限任务内执行。管道只接收固定操作，不接收程序、路径或命令行。
import fs from 'node:fs/promises';
import {spawn} from 'node:child_process';
import {createRequire} from 'node:module';
import {createPdfFrameReader,writePdfFrame,pdfFrameLimits} from './manual-pdf-frames.mjs';
import {createLinuxPdfProcessor} from './manual-pdf-linux-processor.mjs';
import {manualPdfProfiles,manualPdfGenerationLimits as limits} from '../shared/manual-pdf-generation.mjs';
const reader=createPdfFrameReader(process.stdin),source='/input/source.pdf';
let diagnostics=0,geometry=null,sequence=0;
async function command(_session,tool,args,{binary=false,timeout=10000}={}){
  if(!['pdfinfo','pdfdetach','pdffonts','pdftoppm'].includes(tool))throw new Error('fixed_tools_only');
  return new Promise((resolve,reject)=>{
    const child=spawn('/usr/bin/'+tool,args,{env:{PATH:'/usr/bin:/bin',LANG:'C.UTF-8',HOME:'/tmp'},stdio:['ignore','pipe','pipe']});let stdoutBytes=0,stderrBytes=0,limited=false,timed=false;const out=[],err=[];
    const timer=setTimeout(()=>{timed=true;child.kill('SIGKILL');},timeout);timer.unref();
    child.stdout.on('data',chunk=>{stdoutBytes+=chunk.length;if(stdoutBytes>(binary?limits.pageBytes:limits.diagnosticBytes)){limited=true;child.kill('SIGKILL');}else out.push(chunk);});
    child.stderr.on('data',chunk=>{stderrBytes+=chunk.length;if(diagnostics+stderrBytes>limits.diagnosticBytes){limited=true;child.kill('SIGKILL');}else err.push(chunk);});
    child.once('error',reject);child.once('close',code=>{clearTimeout(timer);diagnostics+=stderrBytes;const stderr=Buffer.concat(err).toString('utf8');if(code!==0||limited||timed){const pdfCode=timed?'timeout':limited?'diagnostic_limit':tool==='pdfinfo'&&/incorrect password|encrypted/i.test(stderr)?'encrypted':'processing_failed';reject(Object.assign(new Error(pdfCode),{pdfCode}));}else resolve({stdout:Buffer.concat(out),stderr,elapsed_ms:0});});
  });
}
const processor=createLinuxPdfProcessor({command,loadSharp:()=>createRequire('/runtime/package.json')('sharp')});
const status=await fs.readFile('/proc/self/status','utf8'),field=key=>status.match(new RegExp('^'+key+':\\s*(.+)$','m'))?.[1];
if(process.getuid()!==65534||process.getgid()!==65534||process.getgroups().some(g=>g!==65534)||field('CapEff')!=='0000000000000000'||field('CapBnd')!=='0000000000000000'||field('NoNewPrivs')!=='1')throw new Error('sandbox_identity');
await writePdfFrame(process.stdout,{ok:true,ready:true,uid:65534,capabilities:0,no_new_privileges:true});
try{
  for(;;){
    const {header,body}=await reader.frame(0);if(body.length||header.sequence!==++sequence)throw new Error('sequence');
    try{
      if(header.op==='inspect'&&Object.keys(header).every(k=>['op','sequence','bytes'].includes(k))){const result=await processor.inspect(null,source);geometry=result.geometry;await writePdfFrame(process.stdout,{ok:true,sequence,...result});}
      else if(header.op==='render'&&Object.keys(header).every(k=>['op','sequence','bytes','page','profile'].includes(k))&&geometry&&Number.isSafeInteger(header.page)&&header.page>=1&&header.page<=geometry.length&&Object.hasOwn(manualPdfProfiles,header.profile)){
        const result=await processor.render(null,source,header.page,header.profile,geometry[header.page-1]);await writePdfFrame(process.stdout,{ok:true,sequence,width:result.width,height:result.height,diagnostic_bytes:result.diagnostic_bytes,warning:result.warning},result.buffer);
      }else throw Object.assign(new Error('invalid_operation'),{pdfCode:'processing_failed'});
    }catch(error){await writePdfFrame(process.stdout,{ok:false,sequence,pdfCode:/^[a-z_]{1,40}$/.test(error.pdfCode??'')?error.pdfCode:'processing_failed'});break;}
  }
}catch{ /* 关闭或中断管道时退出；由systemd同时回收本任务全部子进程。 */ }
