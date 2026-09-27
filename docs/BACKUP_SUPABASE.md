# Backup externo do Supabase

## O que este backup cobre

O procedimento exporta as tabelas do schema `public`, usuários acessíveis pela Auth Admin API, buckets e objetos do Storage e as migrations versionadas. O pacote é um TAR criptografado com AES-256-GCM. A chave aleatória é protegida pelo DPAPI do usuário Windows que executou o backup.

O destino padrão é `C:\PRO\backups\pro-resumos`, fora do repositório e fora do Supabase. A retenção padrão é de 30 dias.

Limitações importantes:

- a API não fornece hashes de senha, segredos OAuth ou sessões ativas;
- o DPAPI exige o mesmo usuário Windows e, normalmente, o mesmo computador para recuperar a chave;
- guardar o arquivo e a chave apenas no mesmo disco não protege contra perda física do computador;
- o teste automatizado valida descriptografia, integridade, estrutura e contagens. Uma restauração real em PostgreSQL separado ainda exige um projeto Supabase de homologação ou PostgreSQL local com Docker.

## Execução manual

```powershell
cd C:\PRO\site
npm run backup:supabase
```

O comando lê `NEXT_PUBLIC_SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` de `.env.local`, sem imprimir seus valores. Nunca copie essas credenciais para o repositório.

Para verificar e ensaiar a extração de um backup:

```powershell
npm run backup:verify -- --backup "C:\PRO\backups\pro-resumos\ARQUIVO.probackup"
```

O arquivo `.probackup.key.dpapi` correspondente deve estar ao lado do backup. A verificação falha se a autenticação AES-GCM, qualquer hash ou qualquer contagem divergir.

## Agendamento diário no Windows

Execute uma vez, com o usuário Windows que manterá a chave DPAPI:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\install-supabase-backup-task.ps1
```

A tarefa roda diariamente às 03:30 e tenta recuperar execuções perdidas quando o computador voltar a ficar disponível. Ela depende de o computador estar ligado, do repositório permanecer em `C:\PRO\site` e de `.env.local` continuar válido.

## Recuperação de desastre

Copie periodicamente cada par `.probackup` + `.probackup.key.dpapi` e o `.summary.json` para mídia ou armazenamento externo protegido. Como a chave DPAPI não é portável por si só, antes de considerar este mecanismo suficiente para desastre total deve-se criar uma chave de recuperação portável guardada separadamente, ou habilitar backups nativos/PITR em um plano futuro do Supabase.
