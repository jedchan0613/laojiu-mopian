#!/usr/bin/env bash
# --check只读核对；--apply仅在取得本机PDF服务安装授权后使用。首次安装专用，不覆盖既有安装。
set -Eeuo pipefail
umask 077
NODE=$(realpath -e /snap/node/current/bin/node)
SERVICE=ljm-manual-pdf-bridge.service
BASE=/opt/laojiumopian-manual-pdf
STATE=/var/lib/laojiumopian-manual-pdf
CONFIG=/etc/laojiumopian-manual-pdf.json
SOCKET=/run/laojiumopian-manual-pdf/bridge.sock
fail() { printf '[manual-pdf-install] %s\n' "$*" >&2; exit 1; }
[[ ${EUID:-$(id -u)} -eq 0 ]] || fail '必须由root执行。'
[[ $# -eq 3 && "$1" =~ ^--(check|apply)$ ]] || fail '用法：脚本 --check或--apply ROOT持有的已审源码目录 YYYYMMDD-HHMMSS-提交号'
mode=$1
source_directory=$(realpath -e -- "$2")
release=$3
[[ "$release" =~ ^[0-9]{8}-[0-9]{6}-[a-f0-9]{7,40}$ ]] || fail '版本标记格式无效。'
[[ -x "$NODE" ]] || fail '未找到既有Node.js。'
[[ "$NODE" =~ ^/snap/node/[0-9]+/bin/node$ ]] || fail 'Node实际版本目录与验收环境不同。'
id ljmadmin >/dev/null
client_gid=$(id -g ljmadmin)
[[ $(id -u nobody) -eq 65534 && $(id -g nobody) -eq 65534 ]] || fail '低权限处理身份与验收记录不同。'
for pair in 'poppler-utils:24.02.0-1ubuntu9.11' 'libpoppler134:24.02.0-1ubuntu9.11' 'bubblewrap:0.9.0-1ubuntu0.3' 'fonts-noto-cjk:1:20230817+repack1-3' 'poppler-data:0.4.12-1' 'fontconfig:2.15.0-1.1ubuntu2'; do
 package=${pair%%:*}; expected=${pair#*:}
 [[ $(dpkg-query -W -f='${Version}' "$package") == "$expected" ]] || fail "$package版本变化，需要重新验收。"
done
[[ $(df -PB1 /opt | awk 'NR==2 {print $4}') -ge 1342177280 ]] || fail '处理服务安装至少保留1.25 GiB空闲；应用部署和备份另算峰值。'
"$NODE" --input-type=module - "$source_directory" <<'NODE'
import fs from'node:fs/promises';import path from'node:path';import{pathToFileURL}from'node:url';
const source=process.argv[2];let parent=path.parse(source).root;for(const part of source.slice(parent.length).split(path.sep).filter(Boolean)){parent=path.join(parent,part);const s=await fs.lstat(parent);if(!s.isDirectory()||s.isSymbolicLink()||s.uid!==0||(s.mode&0o022)!==0)throw new Error('不得从业务账号可改写的目录加载特权程序。');}
for(const name of ['deployment/prepare-manual-pdf-linux.mjs','local-admin/manual-pdf-linux-engine.mjs']){const s=await fs.lstat(path.join(source,name));if(!s.isFile()||s.isSymbolicLink()||s.uid!==0||(s.mode&0o022)!==0)throw new Error('安装辅助源码不可信。');}
const {assertRootDirectory}=await import(pathToFileURL(path.join(source,'deployment/prepare-manual-pdf-linux.mjs'))),{linuxPdfEngineFiles}=await import(pathToFileURL(path.join(source,'local-admin/manual-pdf-linux-engine.mjs')));
await assertRootDirectory(source);for(const dir of ['/opt','/var/lib','/run'])await assertRootDirectory(dir);
for(const file of [...linuxPdfEngineFiles,'deployment/ljm-manual-pdf-bridge.service']){const stat=await fs.lstat(path.join(source,file));if(!stat.isFile()||stat.isSymbolicLink()||stat.uid!==0||(stat.mode&0o022)!==0)throw new Error('已审源码必须由root持有且不可由业务账号改写。');}
console.log(JSON.stringify({checked_code:linuxPdfEngineFiles.length,root_owned:true,new_node_packages:0}));
NODE
systemd-analyze verify "$source_directory/deployment/ljm-manual-pdf-bridge.service"
for target in "$BASE" "$STATE" "$CONFIG" "/etc/systemd/system/$SERVICE"; do
 [[ ! -e "$target" && ! -L "$target" ]] || fail "已存在安装入口，首次安装脚本不会覆盖：$target"
done
printf '[manual-pdf-install] 检查通过。不会修改账号环境、网站版本、Caddy或系统安全策略。\n'
[[ "$mode" == --apply ]] || exit 0
[[ ! -e "$BASE/releases/$release" ]] || fail '候选版本目录已存在，停止避免覆盖。'
install -d -o root -g root -m 0755 "$BASE" "$BASE/releases"
install -d -o root -g root -m 0700 "$STATE"
install -d -o root -g ljmadmin -m 0750 /run/laojiumopian-manual-pdf
prepared_config="$STATE/prepare-$release.json"
"$NODE" --input-type=module - "$source_directory" "$BASE/releases/$release" "$prepared_config" "$client_gid" <<'NODE'
import fs from'node:fs/promises';const [sourceRoot,destination,file,gid]=process.argv.slice(2);await fs.writeFile(file,JSON.stringify({sourceRoot,destination,siteDirectory:'/srv/laojiumopian-admin/app/current/site',stateDirectory:'/var/lib/laojiumopian-manual-pdf',socketFile:'/run/laojiumopian-manual-pdf/bridge.sock',serviceUnit:'ljm-manual-pdf-bridge.service',clientGid:Number(gid),enabled:false}),{flag:'wx',mode:0o600});
NODE
"$NODE" "$source_directory/deployment/prepare-manual-pdf-linux.mjs" "$prepared_config"
"$NODE" --input-type=module - "$BASE/releases/$release/bridge-config.json" "$NODE" <<'NODE'
import fs from'node:fs/promises';const c=JSON.parse(await fs.readFile(process.argv[2],'utf8'));if(c.node_binary!==process.argv[3])throw new Error('安装期间Node版本变化，停止采用。');
NODE
ln -s "releases/$release" "$BASE/current"
install -o root -g root -m 0600 "$BASE/releases/$release/bridge-config.json" "$CONFIG"
sed "s|/snap/node/current/bin/node|$NODE|g" "$source_directory/deployment/ljm-manual-pdf-bridge.service" > "$STATE/service-$release.prepared"
install -o root -g root -m 0644 "$STATE/service-$release.prepared" "/etc/systemd/system/$SERVICE"
installation_complete=false
trap 'status=$?; if [[ "$installation_complete" != true ]]; then systemctl disable --now "$SERVICE" >/dev/null 2>&1 || true; printf "安装未完成，已停用新PDF服务；私密文件保留供核对。\n" >&2; fi; exit "$status"' EXIT
systemctl daemon-reload
systemctl enable --now "$SERVICE"
systemctl is-active --quiet "$SERVICE"
for attempt in {1..15}; do test ! -S "$SOCKET" || break; sleep 1; done
[[ -S "$SOCKET" && $(stat -c '%u:%g:%a' "$SOCKET") == "0:$client_gid:660" ]] || fail '私密处理通道尚未就绪。'
"$NODE" --input-type=module - "$BASE/releases/$release" "$CONFIG" <<'NODE'
import fs from'node:fs/promises';import path from'node:path';import{pathToFileURL}from'node:url';const [root,file]=process.argv.slice(2),{verifyLinuxPdfEngine}=await import(pathToFileURL(path.join(root,'local-admin/manual-pdf-linux-engine.mjs'))),c=JSON.parse(await fs.readFile(file,'utf8')),e=await verifyLinuxPdfEngine(c);if(c.enabled!==false||e.production_verified)throw new Error('首次安装必须保持处理和生产证明关闭。');console.log(JSON.stringify({engine_fingerprint:e.fingerprint,pinned_files:e.manifest.files.length,processing_enabled:false,production_verified:false}));
NODE
installation_complete=true
trap - EXIT
printf '[manual-pdf-install] 本机服务已安装，处理保持关闭。下一步按验收清单做临时账号验证；不会自行开放网页PDF入口。\n'
