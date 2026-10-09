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
$plainTextPointer = [IntPtr]::Zero

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

  $protectedValue = [IO.File]::ReadAllText($RecoverySecretFile).Trim()
  $securePassphrase = ConvertTo-SecureString $protectedValue
  $plainTextPointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($securePassphrase)
  $passphrase = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($plainTextPointer)
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
  $securePassphrase = $null
  if ($plainTextPointer -ne [IntPtr]::Zero) {
    [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($plainTextPointer)
  }
}
