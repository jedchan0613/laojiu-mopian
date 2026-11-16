// 执行正式脚本的EXIT处理和提交尾段；所有服务、切换与清理均替换为无副作用命令。
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
const execute=promisify(execFile);
const bash=process.platform==='win32'?path.join(process.env.ProgramFiles??'C:/Program Files','Git/bin/bash.exe'):'/bin/bash';
const skip=await fs.access(bash).then(()=>false,()=> '当前环境没有既有Bash；部署Linux必须实际执行');
const source=await fs.readFile(new URL('../../deployment/laojiumopian-github-deploy.sh',import.meta.url),'utf8');
const cleanup=source.slice(source.indexOf('cleanup() {'),source.indexOf('\ntrap cleanup EXIT'));
const baseline=`
set -Eeuo pipefail
deployment_committed=false
candidate_commit=''
staging_directory=''
release_directory=''
archive_file=''
previous_app_target=old-app
previous_public_target=old-web
APP_CURRENT=app-link
PUBLIC_LIVE=web-link
ADMIN_SERVICE=admin
LIKE_SERVICE=likes
SUBMISSION_SERVICE=submissions
ACCOUNT_SERVICE=accounts
service_stopped=false
app_switched=true
public_switched=true
like_service_installed=true
submission_service_installed=true
account_service_installed=true
log(){ printf '%s\\n' "$*"; }
switch_link(){ printf 'SWITCH:%s:%s\\n' "$1" "$2"; }
systemctl(){ printf 'SERVICE:%s:%s\\n' "$1" "$2"; }
${cleanup}
trap cleanup EXIT
`;
async function failed(script){try{await execute(bash,['-c',script],{timeout:10000,maxBuffer:128*1024});assert.fail('应保留原失败退出码');}catch(e){assert.equal(e.code,1);return e.stdout;}}
test('部署提交前失败会回切程序/网页并重启原服务',{skip},async()=>{
  const output=await failed(baseline+'false\n');
  assert.match(output,/SWITCH:web-link:old-web/);assert.match(output,/SWITCH:app-link:old-app/);
  for(const unit of ['admin','likes','submissions','accounts'])assert(output.includes('SERVICE:restart:'+unit));
});
test('部署标记提交后清理失败保持新版本与标记一致',{skip},async()=>{
  const start=source.indexOf('mv -f -- "$DEPLOYED_COMMIT_FILE.tmp" "$DEPLOYED_COMMIT_FILE"');
  const end=source.indexOf('\n# 公开切换和所有健康检查完成后',start);
  assert(start>0&&end>start);
  // 不创建任何部署文件：mv只确认真实尾段的提交动作，rm注入提交后失败。
  const tail=`\nDEPLOYED_COMMIT_FILE=synthetic-marker\nFAILED_ATTEMPT_FILE=synthetic-failure\nmv(){ printf 'MARKER:committed\\n'; }\nrm(){ return 1; }\n`+source.slice(start,end)+'\n';
  const output=await failed(baseline+tail);
  assert.match(output,/MARKER:committed/);assert.match(output,/发布已提交/);assert.doesNotMatch(output,/SWITCH:|SERVICE:/);
});
