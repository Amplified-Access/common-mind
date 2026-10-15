# setup.ps1 -- first-run setup for new contributors (Windows / PowerShell)
# Usage: .\scripts\setup.ps1
# Run once after cloning the repo.

$ErrorActionPreference = "Continue"
$ScriptDir = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Definition)
$Errors = 0

# Banner
Write-Host ""
Write-Host "============================================================" -ForegroundColor Blue
Write-Host "          CommonMind -- First-Run Setup                     " -ForegroundColor Blue
Write-Host "============================================================" -ForegroundColor Blue
Write-Host ""

# Helpers
function Pass   { param($msg) Write-Host "  [OK] $msg" -ForegroundColor Green }
function Fail   { param($msg) Write-Host "  [!!] $msg" -ForegroundColor Red; $script:Errors++ }
function Info   { param($msg) Write-Host "  --> $msg" -ForegroundColor Yellow }
function Header { param($msg) Write-Host ""; Write-Host "$msg" -ForegroundColor White }

# 1. Prerequisite checks
Header "Checking prerequisites..."

# go >= 1.25
try {
    $goRaw = & go version 2>&1
    if ($goRaw -match 'go(\d+)\.(\d+)') {
        $major = [int]$Matches[1]; $minor = [int]$Matches[2]
        if ($major -gt 1 -or ($major -eq 1 -and $minor -ge 25)) {
            Pass "go $major.$minor (>= 1.25)"
        } else {
            Fail "go $major.$minor found -- need >= 1.25. Install from https://go.dev/dl/"
        }
    } else {
        Fail "Could not parse go version output. Install from https://go.dev/dl/"
    }
} catch {
    Fail "go not found. Install from https://go.dev/dl/"
}

# node >= 22
try {
    $nodeRaw = & node --version 2>&1
    if ($nodeRaw -match 'v(\d+)') {
        $nodeMajor = [int]$Matches[1]
        if ($nodeMajor -ge 22) {
            Pass "node v$nodeMajor (>= 22)"
        } else {
            Fail "node v$nodeMajor found -- need >= 22. Install from https://nodejs.org/"
        }
    } else {
        Fail "Could not parse node version. Install from https://nodejs.org/"
    }
} catch {
    Fail "node not found. Install from https://nodejs.org/"
}

# pnpm (any version)
try {
    $pnpmVersion = & pnpm --version 2>&1
    Pass "pnpm $pnpmVersion"
} catch {
    Fail "pnpm not found. Install with: npm install -g pnpm"
}

# docker (running)
try {
    $null = & docker info 2>$null
    if ($LASTEXITCODE -eq 0) {
        Pass "docker (running)"
    } else {
        Fail "Could not connect to Docker. Start Docker Desktop if you have it, or install from https://www.docker.com/products/docker-desktop/ then re-run."
    }
} catch {
    Fail "Could not connect to Docker. Start Docker Desktop if you have it, or install from https://www.docker.com/products/docker-desktop/ then re-run."
}

# Abort on failures
if ($Errors -gt 0) {
    Write-Host ""
    Write-Host "$Errors prerequisite(s) failed. Fix the issues above and re-run .\scripts\setup.ps1." -ForegroundColor Red
    Write-Host ""
    exit 1
}

# 2. Install web dependencies
Header "Installing web dependencies (pnpm install)..."
Set-Location "$ScriptDir\web"
& pnpm install
Set-Location $ScriptDir
Pass "web dependencies installed"

# 3. Copy env files (if not already present)
Header "Copying environment files..."

$backendEnv     = "$ScriptDir\backend\.env"
$backendExample = "$ScriptDir\backend\.env.example"
if (Test-Path $backendEnv) {
    Info "backend\.env already exists -- skipping"
} else {
    Copy-Item $backendExample $backendEnv
    Pass "backend\.env.example -> backend\.env"
}

$webEnvLocal = "$ScriptDir\web\.env.local"
$webExample  = "$ScriptDir\web\.env.example"
if (Test-Path $webEnvLocal) {
    Info "web\.env.local already exists -- skipping"
} else {
    Copy-Item $webExample $webEnvLocal
    Pass "web\.env.example -> web\.env.local"
}

# 4. Start Postgres and run migrations
Header "Starting Postgres and Redis (Docker Compose) in a background window..."
Start-Process powershell -ArgumentList "-NoExit", "-ExecutionPolicy", "Bypass", "-Command", "Set-Location '$ScriptDir\backend'; make docker-run" `
    -WindowStyle Minimized

Info "Waiting 5s for Postgres to be healthy..."
Start-Sleep 5

Header "Running database migrations..."
Set-Location "$ScriptDir\backend"
& make migrate-up
Set-Location $ScriptDir
Pass "Migrations applied"

# 5. Ready summary
Write-Host ""
Write-Host "============================================================" -ForegroundColor Green
Write-Host "   You're all set! Run these commands to start developing:  " -ForegroundColor Green
Write-Host "============================================================" -ForegroundColor Green
Write-Host ""
Write-Host "  Quickstart (all services in separate windows):" -ForegroundColor White
Write-Host "    .\scripts\dev.ps1" -ForegroundColor Yellow
Write-Host ""
Write-Host "  Or start each service individually:" -ForegroundColor White
Write-Host "    cd backend; make docker-run   # Postgres + Redis" -ForegroundColor Blue
Write-Host "    cd backend; make watch        # Go backend -> http://localhost:8080" -ForegroundColor Green
Write-Host "    cd web; pnpm dev              # Next.js web -> http://localhost:3000" -ForegroundColor Yellow
Write-Host ""
Write-Host "  Edit your env files before starting:" -ForegroundColor White
Write-Host "    backend\.env    -- set BLUEPRINT_DB_USERNAME/PASSWORD; Firebase is optional locally"
Write-Host "    web\.env.local  -- Playground inference URL and key (optional)"
Write-Host ""
