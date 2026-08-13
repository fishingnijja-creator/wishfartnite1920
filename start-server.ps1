# Starts a local preview server if possible, otherwise opens index.html
$cwd = Split-Path -Path $MyInvocation.MyCommand.Definition -Parent
Set-Location $cwd

if (Get-Command python -ErrorAction SilentlyContinue) {
    Write-Host "Starting Python http.server on port 8000..."
    python -m http.server 8000
} elseif (Get-Command http-server -ErrorAction SilentlyContinue) {
    Write-Host "Starting http-server on port 8000..."
    http-server -p 8000
} else {
    Write-Host "No Python or http-server found; opening index.html in default browser."
    Start-Process index.html
}
