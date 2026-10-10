param(
  [string]$TaskName = "PRO Resumos - Backup Supabase",
  [int]$MaximumAgeHours = 26
)

$ErrorActionPreference = "Stop"

function Get-TaskArgumentValue {
  param(
    [Parameter(Mandatory = $true)]
    [string]$Arguments,
    [Parameter(Mandatory = $true)]
    [string]$Name
  )

  $match = [regex]::Match($Arguments, "-$([regex]::Escape($Name))\s+`"([^`"]+)`"")
  if (-not $match.Success) {
    return $null
  }
  return $match.Groups[1].Value
}

function Test-SameSha256 {
  param(
    [Parameter(Mandatory = $true)]
    [string]$First,
    [Parameter(Mandatory = $true)]
    [string]$Second
  )

  try {
    if (-not (Test-Path -LiteralPath $First -PathType Leaf)) {
      return $false
    }
    if (-not (Test-Path -LiteralPath $Second -PathType Leaf)) {
      return $false
    }
    return (Get-FileHash -LiteralPath $First -Algorithm SHA256).Hash -eq
      (Get-FileHash -LiteralPath $Second -Algorithm SHA256).Hash
  } catch {
    return $false
  }
}

$checks = [ordered]@{
  scheduled_task = $false
  recent_backup = $false
  local_artifacts = $false
  portable_recovery_key = $false
  encrypted_backup_verified = $false
  offsite_backup = $false
  offsite_recovery_key = $false
  offsite_summary = $false
}
$stage = "scheduled_task"

try {
  $task = Get-ScheduledTask -TaskName $TaskName -ErrorAction Stop
  $action = $task.Actions | Select-Object -First 1
  $arguments = [string]$action.Arguments
  $projectDirectory = Get-TaskArgumentValue -Arguments $arguments -Name "ProjectDirectory"
  $outputDirectory = Get-TaskArgumentValue -Arguments $arguments -Name "OutputDirectory"
  $offsiteDirectory = Get-TaskArgumentValue -Arguments $arguments -Name "OffsiteDirectory"
  $recoverySecretFile = Get-TaskArgumentValue -Arguments $arguments -Name "RecoverySecretFile"

  $checks.scheduled_task = $task.State -in @("Ready", "Running")
  if (-not $projectDirectory -or -not $outputDirectory -or -not $offsiteDirectory -or -not $recoverySecretFile) {
    throw "A tarefa de backup não possui todos os argumentos operacionais esperados."
  }

  $stage = "configuration_paths"
  foreach ($directory in @($projectDirectory, $outputDirectory, $offsiteDirectory)) {
    if (-not (Test-Path -LiteralPath $directory -PathType Container)) {
      throw "Um diretório obrigatório do backup não está disponível."
    }
  }
  if (-not (Test-Path -LiteralPath $recoverySecretFile -PathType Leaf)) {
    throw "O segredo DPAPI de recuperação não está disponível."
  }

  $stage = "latest_backup"
  $latest = Get-ChildItem -LiteralPath $outputDirectory -Filter "*.probackup" -File |
    Sort-Object LastWriteTimeUtc -Descending |
    Select-Object -First 1
  if (-not $latest) {
    throw "Nenhum backup lógico foi encontrado."
  }

  $age = (Get-Date).ToUniversalTime() - $latest.LastWriteTimeUtc
  $checks.recent_backup = $age.TotalHours -le $MaximumAgeHours
  $dpapiKey = "$($latest.FullName).key.dpapi"
  $recoveryKey = "$($latest.FullName).key.recovery"
  $summary = Join-Path $outputDirectory ($latest.BaseName + ".summary.json")
  $checks.local_artifacts =
    (Test-Path -LiteralPath $dpapiKey -PathType Leaf) -and
    (Test-Path -LiteralPath $summary -PathType Leaf)
  $checks.portable_recovery_key = Test-Path -LiteralPath $recoveryKey -PathType Leaf

  $stage = "encrypted_backup_verification"
  if ($checks.local_artifacts) {
    $verifyScript = Join-Path $projectDirectory "scripts\verify-supabase-backup.mjs"
    & node.exe $verifyScript --backup $latest.FullName *> $null
    $checks.encrypted_backup_verified = $LASTEXITCODE -eq 0
  }

  $stage = "offsite_copy"
  $checks.offsite_backup = Test-SameSha256 `
    -First $latest.FullName `
    -Second (Join-Path $offsiteDirectory $latest.Name)
  $checks.offsite_recovery_key = Test-SameSha256 `
    -First $recoveryKey `
    -Second (Join-Path $offsiteDirectory ([IO.Path]::GetFileName($recoveryKey)))
  $checks.offsite_summary = Test-SameSha256 `
    -First $summary `
    -Second (Join-Path $offsiteDirectory ([IO.Path]::GetFileName($summary)))
} catch {
  $checks.error = "backup_preflight_failed"
  $checks.error_stage = $stage
}

$ready = -not ($checks.Values -contains $false)
[ordered]@{
  ready = $ready
  checks = $checks
} | ConvertTo-Json -Depth 3 -Compress

if (-not $ready) {
  exit 1
}
