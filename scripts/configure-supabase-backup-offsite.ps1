param(
  [string]$ProjectDirectory = (Split-Path -Parent $PSScriptRoot),
  [string]$EnvironmentFile = "C:\PRO\site\.env.local",
  [string]$OutputDirectory = "C:\PRO\backups\pro-resumos",
  [string]$OffsiteDirectory = "C:\Users\Naussen\OneDrive\PRO\Backups\PRO Resumos",
  [string]$RecoverySecretFile = "C:\PRO\backups\pro-resumos\.secrets\recovery-passphrase.dpapi",
  [string]$TaskName = "PRO Resumos - Backup Supabase",
  [string]$DailyAt = "03:30"
)

$ErrorActionPreference = "Stop"
$firstPointer = [IntPtr]::Zero
$secondPointer = [IntPtr]::Zero

try {
  Write-Host "A frase deve ter pelo menos 20 caracteres e ser guardada fora deste computador."
  $first = Read-Host "Digite a frase de recuperação" -AsSecureString
  $second = Read-Host "Repita a frase de recuperação" -AsSecureString

  $firstPointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($first)
  $secondPointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($second)
  $firstText = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($firstPointer)
  $secondText = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($secondPointer)

  if ($firstText.Length -lt 20) {
    throw "A frase de recuperação deve ter pelo menos 20 caracteres."
  }
  if (-not [string]::Equals($firstText, $secondText, [StringComparison]::Ordinal)) {
    throw "As frases informadas não coincidem."
  }
  if (-not (Test-Path -LiteralPath $OffsiteDirectory -PathType Container)) {
    throw "Diretório off-site não encontrado: $OffsiteDirectory"
  }

  $secretDirectory = Split-Path -Parent $RecoverySecretFile
  New-Item -ItemType Directory -Path $secretDirectory -Force | Out-Null
  Add-Type -AssemblyName System.Security
  $plainBytes = [Text.Encoding]::UTF8.GetBytes($firstText)
  $protectedBytes = [Security.Cryptography.ProtectedData]::Protect(
    $plainBytes,
    $null,
    [Security.Cryptography.DataProtectionScope]::CurrentUser
  )
  [IO.File]::WriteAllBytes($RecoverySecretFile, $protectedBytes)

  $identity = [Security.Principal.WindowsIdentity]::GetCurrent().Name
  $acl = [Security.AccessControl.FileSecurity]::new()
  $acl.SetAccessRuleProtection($true, $false)
  $rule = [Security.AccessControl.FileSystemAccessRule]::new(
    $identity,
    [Security.AccessControl.FileSystemRights]::FullControl,
    [Security.AccessControl.AccessControlType]::Allow
  )
  $acl.AddAccessRule($rule)
  Set-Acl -LiteralPath $RecoverySecretFile -AclObject $acl

  $installer = Join-Path $ProjectDirectory "scripts\install-supabase-backup-task.ps1"
  & $installer `
    -ProjectDirectory $ProjectDirectory `
    -EnvironmentFile $EnvironmentFile `
    -OutputDirectory $OutputDirectory `
    -OffsiteDirectory $OffsiteDirectory `
    -RecoverySecretFile $RecoverySecretFile `
    -TaskName $TaskName `
    -DailyAt $DailyAt

  Write-Host "Configuração concluída. A frase não foi exibida nem salva em texto puro."
} finally {
  $firstText = $null
  $secondText = $null
  $first = $null
  $second = $null
  if ($null -ne $plainBytes) {
    [Array]::Clear($plainBytes, 0, $plainBytes.Length)
  }
  if ($null -ne $protectedBytes) {
    [Array]::Clear($protectedBytes, 0, $protectedBytes.Length)
  }
  if ($firstPointer -ne [IntPtr]::Zero) {
    [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($firstPointer)
  }
  if ($secondPointer -ne [IntPtr]::Zero) {
    [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($secondPointer)
  }
}
