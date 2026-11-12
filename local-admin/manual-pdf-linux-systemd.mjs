// 唯一的特权执行边界；所有路径来自root配置／随机会话目录，外部不能提交命令或参数。
import fs from 'node:fs/promises';
import path from 'node:path';
import {spawn,execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {linuxPdfWorkerFiles,linuxPdfPolicy} from './manual-pdf-linux-engine.mjs';
const execute=promisify(execFile),safeUnit=/^ljm-(?:manual-pdf|pdf66)-[a-z0-9-]{1,90}\.service$/;
const env={PATH:'/usr/bin:/bin',LANG:'C.UTF-8'};
export async function linuxPdfUnitStatus(unit){
 if(!safeUnit.test(unit))throw new Error('invalid_unit');
 const {stdout}=await execute('/usr/bin/systemctl',['show',unit,'-p','LoadState','-p','SubState','-p','MainPID','-p','Result','-p','ControlGroup'],{env,maxBuffer:65536});
 return Object.fromEntries(stdout.trim().split('\n').map(line=>{const i=line.indexOf('=');return[line.slice(0,i),line.slice(i+1)];}));
}
export async function stopLinuxPdfUnit(unit){
 if(!safeUnit.test(unit))throw new Error('invalid_unit');
 try{await execute('/usr/bin/systemctl',['stop',unit],{env,timeout:12000,maxBuffer:65536});}catch(error){if(!/not loaded|not found/.test(error.stderr??''))throw error;}
 const status=await linuxPdfUnitStatus(unit);if(Number(status.MainPID)!==0||!['dead','failed','exited'].includes(status.SubState))throw new Error('unit_not_stopped');
 if(status.ControlGroup){const file=path.join('/sys/fs/cgroup',status.ControlGroup,'cgroup.procs');const pids=await fs.readFile(file,'utf8').catch(e=>{if(e.code==='ENOENT')return '';throw e;});if(pids.trim())throw new Error('worker_processes_remain');}
 await execute('/usr/bin/systemctl',['reset-failed',unit],{env,maxBuffer:65536}).catch(()=>{});return {cleanup:true,result:status.Result};
}
export async function launchLinuxPdfWorker(config,session){
 const code=path.join(session.directory,'engine');await fs.mkdir(code,{mode:0o755});await fs.chmod(code,0o755);
 for(const relative of linuxPdfWorkerFiles){const target=path.join(code,relative);await fs.mkdir(path.dirname(target),{recursive:true,mode:0o755});await fs.chmod(path.dirname(target),0o755);await fs.copyFile(path.join(config.code_directory,relative),target,fs.constants.COPYFILE_EXCL);await fs.chmod(target,0o444);}
 const props=[
  'Type=exec','RemainAfterExit=yes',`RuntimeMaxSec=${linuxPdfPolicy.book_seconds}`,'TimeoutStopSec=3','KillMode=control-group',
  `MemoryMax=${linuxPdfPolicy.memory_bytes}`,'MemorySwapMax=0','CPUQuota=50%','TasksMax=32','OOMPolicy=kill','MemoryAccounting=yes','CPUAccounting=yes','TasksAccounting=yes',
  'NoNewPrivileges=yes','ProtectSystem=strict','ProtectHome=yes','ProtectControlGroups=yes','PrivateTmp=yes','PrivateDevices=yes','ProtectKernelTunables=yes',
  `BindsTo=${config.service_unit}`,`After=${config.service_unit}`,
 ];
 const args=['--quiet','--wait','--pipe','--unit='+session.unit,...props.flatMap(p=>['-p',p]),'/usr/bin/bwrap',
  '--unshare-pid','--unshare-net','--unshare-ipc','--unshare-uts','--unshare-cgroup','--die-with-parent','--new-session',
  '--cap-drop','ALL','--cap-add','CAP_SETUID','--cap-add','CAP_SETGID','--cap-add','CAP_SETPCAP',
  '--ro-bind','/usr','/usr','--symlink','usr/bin','/bin','--symlink','usr/lib','/lib','--symlink','usr/lib64','/lib64',
  '--dir','/runtime','--chmod','0755','/runtime','--dir','/etc','--chmod','0755','/etc','--dir','/var','--chmod','0755','/var','--dir','/var/cache','--chmod','0755','/var/cache',
  '--ro-bind','/etc/fonts','/etc/fonts','--ro-bind','/var/cache/fontconfig','/var/cache/fontconfig',
  '--ro-bind',config.node_binary,'/runtime/node','--ro-bind',config.vendor_directory,'/runtime/node_modules','--ro-bind',path.join(code,'package.json'),'/runtime/package.json',
  '--ro-bind',code,'/engine','--ro-bind',path.join(session.directory,'input'),'/input','--proc','/proc','--dev','/dev',
  '--size',String(64*1024**2),'--perms','1777','--tmpfs','/tmp',
  '--clearenv','--setenv','PATH','/usr/bin:/bin','--setenv','LANG','C.UTF-8','--setenv','HOME','/tmp','--chdir','/',
  '/usr/bin/setpriv','--reuid=65534','--regid=65534','--clear-groups','--no-new-privs','--inh-caps=-all','--ambient-caps=-all','--bounding-set=-all',
  '/runtime/node','--max-old-space-size=128','/engine/local-admin/manual-pdf-linux-worker.mjs',
 ];
 await fs.writeFile(path.join(code,'package.json'),'{"type":"module"}',{flag:'wx',mode:0o444});
 await fs.chmod(path.join(code,'package.json'),0o444);
 const child=spawn('/usr/bin/systemd-run',args,{env,stdio:['pipe','pipe','pipe']});child.on('error',()=>{});return child;
}
