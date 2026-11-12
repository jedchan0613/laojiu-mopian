#!/usr/bin/env bash
# 6.6只读盘点：不安装、不重启、不改配置，不读取账号数据库或投稿内容。
# 这份盘点不是Linux转换及隔离验收，不会生成“可上线”证明。
set -euo pipefail
printf 'CHECK_KIND=inventory_only\n'
printf 'UTC='; date -u '+%Y-%m-%dT%H:%M:%SZ'
printf '\nSYSTEM\n'; cat /etc/os-release
uname -m
systemd --version | head -n 1
printf '\nRESOURCES\n'
getconf _NPROCESSORS_ONLN
free -m
df -Pm /srv/laojiumopian-admin
printf '\nSERVICES\n'
for unit in laojiumopian-admin.service laojiumopian-accounts.service caddy.service; do
  printf '%s=' "$unit"; systemctl is-active "$unit" || true
done
systemctl show laojiumopian-accounts.service -p User -p Group -p MemoryMax -p TasksMax -p CPUQuotaPerSecUSec -p NoNewPrivileges -p ProtectControlGroups -p ProtectSystem -p PrivateTmp -p ReadWritePaths -p InaccessiblePaths
printf '\nVERSIONS\n'
readlink -f /srv/laojiumopian-admin/app/current
readlink -f /srv/laojiumopian/live
cat /srv/laojiumopian-admin/github-deploy/deployed-commit 2>/dev/null || true
for command_name in pdfinfo pdfdetach pdftoppm pdffonts bwrap prlimit unshare systemd-run; do
  command -v "$command_name" || printf '%s=MISSING\n' "$command_name"
done
printf '\nUSER_NAMESPACE\n'
sysctl kernel.unprivileged_userns_clone kernel.apparmor_restrict_unprivileged_userns 2>/dev/null || true
user_id=$(id -u ljmadmin)
if test -S "/run/user/$user_id/bus"; then echo USER_BUS=present; else echo USER_BUS=absent; fi
printf '\nDIRECTORY_PERMISSIONS_AND_SIZE\n'
for private_dir in /srv/laojiumopian-admin/data/accounts /srv/laojiumopian-admin/data/submissions; do
  stat -c '%a %U:%G %n' "$private_dir"
  du -sk "$private_dir"
done
printf '\nPACKAGE_CANDIDATES_FROM_EXISTING_CACHE\n'
apt-cache policy poppler-utils bubblewrap fonts-noto-cjk poppler-data fontconfig
printf '\nACCOUNT_PUBLIC_CAPABILITIES\n'
curl --max-time 10 -fsS -H 'Origin: https://laojiumopian.com' -H 'X-LJM-Account-Request: 1' -H 'X-LJM-Client-IP: 127.0.0.1' http://127.0.0.1:4177/api/account/config |
  /snap/node/current/bin/node --input-type=module -e 'let text="";for await(const part of process.stdin)text+=part;const c=JSON.parse(text);console.log(JSON.stringify(Object.fromEntries(["registration_open","uploads_open","manual_drafts_version","manual_page_uploads_version","manual_pdf_uploads_version","manual_pdf_generation_version","manual_pdf_workflow_version"].map(k=>[k,c[k]??null]))));'
printf '\nLINUX_PDF_ACCEPTANCE=NOT_PERFORMED_BY_THIS_SCRIPT\n'
