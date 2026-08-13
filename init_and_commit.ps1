# Run this after installing Git. Initializes a repo and makes the first commit.
# Optionally launches a game executable after a successful commit.
if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
    Write-Host "Git not found. Install Git and re-run this script." -ForegroundColor Yellow
    exit 1
}

# Initialize repository if needed
if (-not (Test-Path -Path ".git")) {
    git init
    Write-Host "Initialized git repository." -ForegroundColor Green
} else {
    Write-Host "Git repository already initialized." -ForegroundColor Yellow
}

# Stage changes
git add .

# Only commit if there are changes
$status = git status --porcelain
if ([string]::IsNullOrWhiteSpace($status)) {
    Write-Host "No changes to commit." -ForegroundColor Yellow
} else {
    # Use a sensible default message; you can change this interactively
    $commitMsg = "Initial commit"
    git commit -m $commitMsg
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Committed changes." -ForegroundColor Green
    } else {
        Write-Host "Commit failed with exit code $LASTEXITCODE." -ForegroundColor Red
        exit $LASTEXITCODE
    }
}

# Optionally launch a game executable after committing
$launch = Read-Host "Launch a game after completing? (Y/N)"
if ($launch -match '^[Yy]') {
    # Try to detect a candidate game executable in the repo
    $detected = Get-ChildItem -Path . -Filter *.exe -Recurse -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($detected) {
        $defaultPath = $detected.FullName
    } else {
        $defaultPath = ""
    }

    $input = Read-Host "Enter path to game executable (leave empty to use detected: $defaultPath)"
    if ([string]::IsNullOrWhiteSpace($input)) {
        $gamePath = $defaultPath
    } else {
        $gamePath = $input
    }

    if ([string]::IsNullOrWhiteSpace($gamePath)) {
        Write-Host "No game executable specified or detected; skipping launch." -ForegroundColor Yellow
        exit 0
    }

    if (-not (Test-Path $gamePath)) {
        Write-Host "Game not found at $gamePath" -ForegroundColor Yellow
        exit 1
    }

    try {
        Start-Process -FilePath $gamePath -WorkingDirectory (Split-Path $gamePath) -WindowStyle Normal
        Write-Host "Launched game: $gamePath" -ForegroundColor Green
    } catch {
        Write-Host "Failed to launch game: $_" -ForegroundColor Red
        exit 1
    }
}
