param(
  [Parameter(Mandatory = $true)]
  [string]$ProjectDirectory,
  [Parameter(Mandatory = $true)]
  [string]$EnvironmentFile,
  [Parameter(Mandatory = $true)]
  [string]$OutputDirectory,
  [Parameter(Mandatory = $true)]
  [string]$OffsiteDirectory,
  [Parameter(Mandatory = $true)]
  [string]$RecoverySecretFile
)

$ErrorActionPreference = "Stop"

try {
  $node = (Get-Command node.exe -ErrorAction Stop).Source
  $backupScript = Join-Path $ProjectDirectory "scripts\backup-supabase.mjs"
  foreach ($requiredFile in @($EnvironmentFile, $backupScript, $RecoverySecretFile)) {
    if (-not (Test-Path -LiteralPath $requiredFile -PathType Leaf)) {
      throw "Arquivo obrigatório não encontrado: $requiredFile"
    }
  }
  if (-not (Test-Path -LiteralPath $OffsiteDirectory -PathType Container)) {
    throw "Diretório off-site não encontrado: $OffsiteDirectory"
  }

  Add-Type -AssemblyName System.Security
  $protectedBytes = [IO.File]::ReadAllBytes($RecoverySecretFile)
  $plainBytes = [Security.Cryptography.ProtectedData]::Unprotect(
    $protectedBytes,
    $null,
    [Security.Cryptography.DataProtectionScope]::CurrentUser
  )
  $passphrase = [Text.Encoding]::UTF8.GetString($plainBytes)
  if ([string]::IsNullOrWhiteSpace($passphrase) -or $passphrase.Length -lt 20) {
    throw "A frase de recuperação protegida é inválida."
  }

  $env:PRO_BACKUP_RECOVERY_PASSPHRASE = $passphrase
  $env:PRO_BACKUP_OFFSITE_DIRECTORY = $OffsiteDirectory
  & $node "--env-file-if-exists=$EnvironmentFile" $backupScript --output $OutputDirectory
  if ($LASTEXITCODE -ne 0) {
    throw "O backup terminou com código $LASTEXITCODE."
  }
} finally {
  Remove-Item Env:PRO_BACKUP_RECOVERY_PASSPHRASE -ErrorAction SilentlyContinue
  Remove-Item Env:PRO_BACKUP_OFFSITE_DIRECTORY -ErrorAction SilentlyContinue
  $passphrase = $null
  if ($null -ne $plainBytes) {
    [Array]::Clear($plainBytes, 0, $plainBytes.Length)
  }
  if ($null -ne $protectedBytes) {
    [Array]::Clear($protectedBytes, 0, $protectedBytes.Length)
  }
}
