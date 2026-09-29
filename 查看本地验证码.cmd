@echo off
rem 显示本机最新的登录验证码（本地预览用）。
rem 本文件内容保持纯 ASCII，中文提示由 Node 脚本输出，避免 Windows 命令行编码问题。
cd /d "%~dp0"
chcp 65001 >nul
node local-admin\show-local-code.mjs
echo.
pause
