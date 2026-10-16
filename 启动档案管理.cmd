@echo off
setlocal

cd /d "%~dp0"
if errorlevel 1 (
  echo Cannot open the project folder.
  pause
  exit /b 1
)

where node >nul 2>nul
if errorlevel 1 (
  echo Node.js was not found. Please install or repair Node.js first.
  pause
  exit /b 1
)

set "LJM_ADMIN_MODE=local"
set "LJM_ADMIN_HOST=127.0.0.1"
set "LJM_ADMIN_PORT=4173"

node local-admin\refresh-preview.mjs
if errorlevel 1 (
  echo The preview could not be updated. Please keep this window for details.
  pause
  exit /b 1
)

powershell.exe -NoProfile -WindowStyle Hidden -Command "try { $r=Invoke-RestMethod -Uri 'http://127.0.0.1:4173/healthz' -TimeoutSec 2; if($r.ok -and $r.capabilities.publicationImageNames){ exit 0 } } catch {}; exit 1"
if not errorlevel 1 (
  start "" "http://127.0.0.1:4173/admin/"
  exit /b 0
)

start "" powershell.exe -NoProfile -WindowStyle Hidden -Command "$adminUrl='http://127.0.0.1:4173/admin/'; for($attempt=0; $attempt -lt 40; $attempt++){ try { $response=Invoke-WebRequest -UseBasicParsing -Uri $adminUrl -TimeoutSec 1; if($response.StatusCode -eq 200){ Start-Process $adminUrl; exit 0 } } catch {}; Start-Sleep -Milliseconds 250 }"

echo Starting the local archive manager...
echo The management page will open in your browser.
echo Keep this window open while using the manager.
echo To stop, close this window or press Ctrl+C.
echo.

node local-admin\server.mjs

if errorlevel 1 (
  echo.
  echo The local archive manager did not start correctly.
  pause
)

endlocal
