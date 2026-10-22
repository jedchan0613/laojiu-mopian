#!/usr/bin/env bash
# 默认预演；正式应用前先部署含noindex及首页语言切换的新404页面。
set -Eeuo pipefail
mode="${1:---check}"
[[ "$#" -le 1 && ( "$mode" == --check || "$mode" == --apply ) ]] || { printf '用法：sudo bash install-public-security-headers.sh [--check|--apply]\n'; exit 1; }
[[ "${EUID:-$(id -u)}" -eq 0 ]] || { printf '请使用sudo；默认检查不会上线。\n'; exit 1; }
exec 9>/run/lock/laojiumopian-github-deploy.lock
flock -n 9 || { printf '已有发布或配置操作，请稍后重试。\n'; exit 1; }
script_directory="$(dirname "$(readlink -f -- "$0")")"
node_command=/snap/node/current/bin/node
[[ -x "$node_command" ]] || { printf '未找到既有Node，不自动安装。\n'; exit 1; }
exec "$node_command" "$script_directory/public-security-install.mjs" "$mode"
