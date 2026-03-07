param(
  [string]$Branch = "main"
)

$ErrorActionPreference = "Stop"

# Ensure this runs inside a git repository.
git rev-parse --is-inside-work-tree | Out-Null

$status = git status --porcelain
if ([string]::IsNullOrWhiteSpace($status)) {
  Write-Host "No changes to publish."
  exit 0
}

git add -A

$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
$message = "chore: auto publish $timestamp"

git commit -m $message | Out-Null
git push origin $Branch

Write-Host "Published to GitHub. Railway will auto-deploy from the connected branch."
