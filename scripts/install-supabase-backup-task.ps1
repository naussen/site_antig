param(
  [string]$ProjectDirectory = "C:\PRO\site",
  [string]$EnvironmentFile = "C:\PRO\site\.env.local",
  [string]$OutputDirectory = "C:\PRO\backups\pro-resumos",
  [string]$TaskName = "PRO Resumos - Backup Supabase",
  [string]$DailyAt = "03:30"
)

$ErrorActionPreference = "Stop"

$node = (Get-Command node.exe -ErrorAction Stop).Source
$script = Join-Path $ProjectDirectory "scripts\backup-supabase.mjs"
if (-not (Test-Path -LiteralPath $script -PathType Leaf)) {
  throw "Script de backup não encontrado em $script"
}
if (-not (Test-Path -LiteralPath $EnvironmentFile -PathType Leaf)) {
  throw "Arquivo de ambiente não encontrado em $EnvironmentFile"
}

$arguments = "--env-file-if-exists=`"$EnvironmentFile`" `"$script`" --output `"$OutputDirectory`""
$action = New-ScheduledTaskAction -Execute $node -Argument $arguments -WorkingDirectory $ProjectDirectory
$trigger = New-ScheduledTaskTrigger -Daily -At $DailyAt
$settings = New-ScheduledTaskSettingsSet -StartWhenAvailable -ExecutionTimeLimit (New-TimeSpan -Hours 2)
$principal = New-ScheduledTaskPrincipal -UserId $env:USERNAME -LogonType Interactive -RunLevel Limited

Register-ScheduledTask `
  -TaskName $TaskName `
  -Action $action `
  -Trigger $trigger `
  -Settings $settings `
  -Principal $principal `
  -Description "Backup lógico diário, criptografado e verificável do Supabase do PRO Resumos." `
  -Force | Out-Null

Write-Output "Tarefa '$TaskName' instalada para execução diária às $DailyAt."
