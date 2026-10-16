#!/usr/bin/env bash
# 仅为已部署的新语种增加对应的404页面；保留现有站点和访问保护。
set -Eeuo pipefail
umask 077
exec 9>/run/lock/laojiumopian-github-deploy.lock
flock -n 9 || { printf '已有发布操作，请稍后重试。\n'; exit 1; }
config=/etc/caddy/Caddyfile
next=/etc/caddy/.Caddyfile.languages-next
backup=/srv/laojiumopian-admin/build-work/languages-20261016/Caddyfile.before-extra-languages
live=$(readlink -f /srv/laojiumopian/releases/live)
[[ "$live" == /srv/laojiumopian/releases/* ]] || exit 1
for language in ja ko zh-hant; do [[ -f "$live/$language/404/index.html" ]] || { printf '新语言页面尚未部署。\n'; exit 1; }; done
python3 - <<'PY'
import pathlib,stat
p=pathlib.Path('/etc/caddy/Caddyfile');s=p.read_text()
markers=['@japaneseError','@koreanError','@traditionalError']
if any(m in s for m in markers):
 assert all(m in s for m in markers),'只存在部分规则，请人工检查'
 print('三种新语言缺页规则已存在，无需改动。')
 raise SystemExit(0)
anchor='handle_errors {\n\t\t@thaiError'
assert s.count(anchor)==1,'未找到唯一的既有多语言缺页配置'
backup=pathlib.Path('/srv/laojiumopian-admin/build-work/languages-20261016/Caddyfile.before-extra-languages')
assert not backup.exists(),'已有配置备份，停止覆盖'
backup.write_bytes(p.read_bytes());backup.chmod(0o600)
rules='handle_errors {\n'
for name,prefix in [('japanese','ja'),('korean','ko'),('traditional','zh-hant')]:
 rules+=f'\t\t@{name}Error path /{prefix}/*\n\t\thandle @{name}Error {{\n\t\t\trewrite * /{prefix}/404/index.html\n\t\t\tfile_server\n\t\t}}\n'
next=pathlib.Path('/etc/caddy/.Caddyfile.languages-next')
assert not next.exists()
next.write_text(s.replace(anchor,rules+'\t\t@thaiError'))
next.chmod(stat.S_IMODE(p.stat().st_mode))
PY
if [[ -f "$next" ]]; then
 caddy validate --config "$next" --adapter caddyfile
 mv -T "$next" "$config"
 restore(){ cp "$backup" "$next"; chmod --reference="$config" "$next"; mv -T "$next" "$config"; systemctl reload caddy; }
 if ! systemctl reload caddy; then restore; exit 1; fi
 trap 'restore; exit 1' ERR
 for pair in 'default:zh-CN' 'en:en' 'th:th' 'ja:ja' 'ko:ko' 'zh-hant:zh-Hant'; do
  prefix=${pair%%:*}; language=${pair#*:}; [[ "$prefix" != default ]] || prefix=''
  result=$(mktemp)
  status=$(curl -sS --resolve laojiumopian.com:443:127.0.0.1 -o "$result" -w '%{http_code}' "https://laojiumopian.com/${prefix:+$prefix/}language-check-not-found-20261016/")
  [[ "$status" == 404 ]]
  grep -q "<html lang=\"$language\"" "$result"
  rm -f "$result"
  printf '%s 404 正常\n' "$language"
 done
 trap - ERR
fi
