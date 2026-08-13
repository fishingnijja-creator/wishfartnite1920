# Run this after installing Git. Initializes a repo and makes the first commit.
if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
    Write-Host "Git not found. Install Git and re-run this script." -ForegroundColor Yellow
    exit 1
}

git init
git add .
git commit -m "Initial commit"
Write-Host "Committed changes." -ForegroundColor Green
