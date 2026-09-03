param(
	[string]$OutputDirectory = (Join-Path ([Environment]::GetFolderPath('UserProfile')) 'Downloads')
)

$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
$outputRoot = [IO.Path]::GetFullPath($OutputDirectory)
$temporaryBase = [IO.Path]::GetFullPath([IO.Path]::GetTempPath())
$temporaryRoot = Join-Path $temporaryBase ("ljm-online-package-{0}" -f [guid]::NewGuid().ToString('N'))
$timestamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$appName = "laojiumopian-admin-app-$timestamp"
$dataName = "laojiumopian-admin-data-$timestamp"
$appStage = Join-Path $temporaryRoot 'app'
$dataStage = Join-Path $temporaryRoot 'data'
$appZip = Join-Path $outputRoot "$appName.zip"
$dataZip = Join-Path $outputRoot "$dataName.zip"

function Assert-SafeTemporaryPath {
	$resolved = [IO.Path]::GetFullPath($temporaryRoot)
	if (-not $resolved.StartsWith($temporaryBase, [StringComparison]::OrdinalIgnoreCase) -or
		-not (Split-Path -Leaf $resolved).StartsWith('ljm-online-package-', [StringComparison]::Ordinal)) {
		throw "临时目录不在系统临时位置，已停止打包：$resolved"
	}
}

function Copy-FilePreservingPath {
	param([string]$SourceRoot, [string]$RelativePath, [string]$DestinationRoot)
	$source = Join-Path $SourceRoot $RelativePath
	$destination = Join-Path $DestinationRoot $RelativePath
	$destinationParent = Split-Path -Parent $destination
	if (-not (Test-Path -LiteralPath $destinationParent)) {
		New-Item -ItemType Directory -Path $destinationParent -Force | Out-Null
	}
	Copy-Item -LiteralPath $source -Destination $destination
}

function Copy-TreeFiles {
	param(
		[string]$SourceRoot,
		[string]$DestinationRoot,
		[string[]]$ExcludedPrefixes = @(),
		[string[]]$ExcludedFiles = @()
	)
	$sourcePath = [IO.Path]::GetFullPath($SourceRoot)
	Get-ChildItem -LiteralPath $sourcePath -File -Recurse | ForEach-Object {
		$relative = $_.FullName.Substring($sourcePath.Length).TrimStart('\', '/').Replace('/', '\')
		$excludedByPrefix = $false
		foreach ($prefix in $ExcludedPrefixes) {
			if ($relative.StartsWith($prefix, [StringComparison]::OrdinalIgnoreCase)) {
				$excludedByPrefix = $true
				break
			}
		}
		if (-not $excludedByPrefix -and $ExcludedFiles -notcontains $relative) {
			Copy-FilePreservingPath -SourceRoot $sourcePath -RelativePath $relative -DestinationRoot $DestinationRoot
		}
	}
}

function New-PackageManifest {
	param([string]$StageRoot, [string]$PackageType)
	$stagePath = [IO.Path]::GetFullPath($StageRoot)
	$files = @(Get-ChildItem -LiteralPath $stagePath -File -Recurse |
		Where-Object { $_.Name -ne 'PACKAGE-MANIFEST.json' } |
		Sort-Object FullName |
		ForEach-Object {
			[ordered]@{
				path = $_.FullName.Substring($stagePath.Length).TrimStart('\', '/').Replace('\', '/')
				size = $_.Length
				sha256 = (Get-FileHash -LiteralPath $_.FullName -Algorithm SHA256).Hash
			}
		})
	$aggregateText = ($files | ForEach-Object { '{0}|{1}|{2}' -f $_.path, $_.size, $_.sha256 }) -join "`n"
	$aggregateBytes = [Text.Encoding]::UTF8.GetBytes($aggregateText)
	$sha = [Security.Cryptography.SHA256]::Create()
	try { $aggregateHash = [Convert]::ToHexString($sha.ComputeHash($aggregateBytes)) }
	finally { $sha.Dispose() }
	$manifest = [ordered]@{
		format_version = 1
		package_type = $PackageType
		created_at = (Get-Date).ToUniversalTime().ToString('o')
		file_count = $files.Count
		total_bytes = [long](($files | Measure-Object -Property size -Sum).Sum)
		aggregate_sha256 = $aggregateHash
		files = $files
	}
	$manifestPath = Join-Path $stagePath 'PACKAGE-MANIFEST.json'
	$manifest | ConvertTo-Json -Depth 6 | Set-Content -LiteralPath $manifestPath -Encoding utf8
	return $manifest
}

function Assert-PackageContents {
	param([string]$AppRoot, [string]$DataRoot)
	$forbiddenAppPaths = @('local-admin\drafts', 'local-admin\history', 'local-admin\recycle-bin',
		'site\node_modules', 'site\dist', 'site\.astro', 'site\public\archive-responsive')
	foreach ($forbidden in $forbiddenAppPaths) {
		if (Test-Path -LiteralPath (Join-Path $AppRoot $forbidden)) {
			throw "管理程序包混入了不应打包的目录：$forbidden"
		}
	}
	$forbiddenExtensions = @('.tif', '.tiff', '.raw', '.dng', '.psd')
	$unsafeFiles = @(Get-ChildItem -LiteralPath $AppRoot, $DataRoot -File -Recurse |
		Where-Object { $forbiddenExtensions -contains $_.Extension.ToLowerInvariant() })
	if ($unsafeFiles.Count -gt 0) {
		throw "部署包中出现 TIFF、RAW、DNG 或 PSD 主档格式，已停止打包。"
	}
	foreach ($required in @(
		(Join-Path $AppRoot 'local-admin\server.mjs'),
		(Join-Path $AppRoot 'local-admin\access-auth.mjs'),
		(Join-Path $AppRoot 'local-admin\release-deployer.mjs'),
		(Join-Path $AppRoot 'site\package-lock.json'),
		(Join-Path $DataRoot 'archive-data\metadata-template.json')
	)) {
		if (-not (Test-Path -LiteralPath $required -PathType Leaf)) { throw "部署包缺少必要文件：$required" }
	}
}

function New-VerifiedZip {
	param([string]$StageRoot, [string]$ZipPath, $Manifest)
	if (Test-Path -LiteralPath $ZipPath) { throw "输出文件已经存在，已停止覆盖：$ZipPath" }
	[IO.Compression.ZipFile]::CreateFromDirectory(
		$StageRoot,
		$ZipPath,
		[IO.Compression.CompressionLevel]::Optimal,
		$false
	)
	$archive = [IO.Compression.ZipFile]::OpenRead($ZipPath)
	try {
		$fileEntries = @($archive.Entries | Where-Object { $_.Name })
		$entryMap = @{}
		foreach ($entry in $fileEntries) { $entryMap[$entry.FullName.Replace('\', '/')] = $entry }
		if (-not $entryMap.ContainsKey('PACKAGE-MANIFEST.json')) { throw "ZIP 缺少 PACKAGE-MANIFEST.json：$ZipPath" }
		if ($fileEntries.Count -ne ($Manifest.file_count + 1)) { throw "ZIP 文件数量与清单不一致：$ZipPath" }
		foreach ($expected in $Manifest.files) {
			if (-not $entryMap.ContainsKey($expected.path)) { throw "ZIP 缺少清单文件：$($expected.path)" }
			$entry = $entryMap[$expected.path]
			if ($entry.Length -ne $expected.size) { throw "ZIP 文件大小不一致：$($expected.path)" }
			$stream = $entry.Open()
			$sha = [Security.Cryptography.SHA256]::Create()
			try { $actualHash = [Convert]::ToHexString($sha.ComputeHash($stream)) }
			finally { $sha.Dispose(); $stream.Dispose() }
			if ($actualHash -ne $expected.sha256) { throw "ZIP 文件校验值不一致：$($expected.path)" }
		}
	} finally {
		$archive.Dispose()
	}
	$zipHash = (Get-FileHash -LiteralPath $ZipPath -Algorithm SHA256).Hash
	Set-Content -LiteralPath "$ZipPath.sha256.txt" -Encoding ascii -Value "$zipHash  $(Split-Path -Leaf $ZipPath)"
	return [ordered]@{
		path = $ZipPath
		size = (Get-Item -LiteralPath $ZipPath).Length
		sha256 = $zipHash
		files = $Manifest.file_count + 1
		aggregate_sha256 = $Manifest.aggregate_sha256
	}
}

Assert-SafeTemporaryPath
New-Item -ItemType Directory -Path $outputRoot -Force | Out-Null
if ((Test-Path -LiteralPath $appZip) -or (Test-Path -LiteralPath $dataZip)) {
	throw '同一秒生成的部署包已经存在，请稍后重新运行，程序不会覆盖旧包。'
}

Add-Type -AssemblyName System.IO.Compression.FileSystem

try {
	New-Item -ItemType Directory -Path $appStage, $dataStage | Out-Null

	$localAdminSource = Join-Path $projectRoot 'local-admin'
	Copy-TreeFiles -SourceRoot $localAdminSource -DestinationRoot (Join-Path $appStage 'local-admin') `
		-ExcludedPrefixes @('drafts\', 'history\', 'recycle-bin\')

	$siteSource = Join-Path $projectRoot 'site'
	Copy-TreeFiles -SourceRoot $siteSource -DestinationRoot (Join-Path $appStage 'site') `
		-ExcludedPrefixes @('node_modules\', 'dist\', '.astro\', '.vscode\', 'public\archive-responsive\') `
		-ExcludedFiles @('.gitignore', 'AGENTS.md', 'CLAUDE.md')

	Copy-FilePreservingPath -SourceRoot $projectRoot -RelativePath 'deployment\laojiumopian-admin.service' -DestinationRoot $appStage

	foreach ($directory in @('archive-data', 'inbox', 'drafts', 'history', 'recycle-bin')) {
		New-Item -ItemType Directory -Path (Join-Path $dataStage $directory) | Out-Null
	}
	Copy-TreeFiles -SourceRoot (Join-Path $projectRoot 'archive-data') -DestinationRoot (Join-Path $dataStage 'archive-data')
	Copy-TreeFiles -SourceRoot (Join-Path $projectRoot 'public-assets\inbox') -DestinationRoot (Join-Path $dataStage 'inbox')
	Copy-TreeFiles -SourceRoot (Join-Path $projectRoot 'local-admin\drafts') -DestinationRoot (Join-Path $dataStage 'drafts')
	Copy-TreeFiles -SourceRoot (Join-Path $projectRoot 'local-admin\history') -DestinationRoot (Join-Path $dataStage 'history')
	Copy-TreeFiles -SourceRoot (Join-Path $projectRoot 'local-admin\recycle-bin') -DestinationRoot (Join-Path $dataStage 'recycle-bin')

	Assert-PackageContents -AppRoot $appStage -DataRoot $dataStage
	$appManifest = New-PackageManifest -StageRoot $appStage -PackageType 'laojiumopian-admin-application'
	$dataManifest = New-PackageManifest -StageRoot $dataStage -PackageType 'laojiumopian-admin-private-data'
	$appResult = New-VerifiedZip -StageRoot $appStage -ZipPath $appZip -Manifest $appManifest
	$dataResult = New-VerifiedZip -StageRoot $dataStage -ZipPath $dataZip -Manifest $dataManifest

	[ordered]@{ application = $appResult; private_data = $dataResult } | ConvertTo-Json -Depth 4
} finally {
	Assert-SafeTemporaryPath
	if (Test-Path -LiteralPath $temporaryRoot) {
		Remove-Item -LiteralPath $temporaryRoot -Recurse -Force
	}
}
