# Backup externo do Supabase

## O que este backup cobre

O procedimento deriva automaticamente das migrations todas as tabelas do schema `public`, exporta usuários acessíveis pela Auth Admin API, buckets, objetos do Storage e as migrations versionadas. O pacote é um TAR criptografado com AES-256-GCM. A chave aleatória é protegida pelo DPAPI do usuário Windows que executou o backup.

O destino padrão é `C:\PRO\backups\pro-resumos`, fora do repositório e fora do Supabase. A retenção padrão é de 30 dias.

Limitações importantes:

- a API não fornece hashes de senha, segredos OAuth ou sessões ativas;
- o DPAPI exige o mesmo usuário Windows e, normalmente, o mesmo computador para recuperar a chave;
- guardar o arquivo e a chave apenas no mesmo disco não protege contra perda física do computador;
- a chave portátil opcional usa uma frase de recuperação com no mínimo 20 caracteres; essa frase nunca é salva no backup;
- o teste automatizado valida descriptografia, integridade, estrutura e contagens. A restauração remota deve ser ensaiada em um projeto Supabase isolado.

O teste `test:backup` compara o inventário com as migrations. Uma tabela nova não pode ser esquecida silenciosamente, como ocorreu com a primeira versão do módulo Questões.

## Execução manual

```powershell
cd C:\PRO\site
npm run backup:supabase
```

Para recuperação em outra máquina e cópia automática para um destino externo ou sincronizado, configure somente no ambiente operacional:

```text
PRO_BACKUP_RECOVERY_PASSPHRASE=<frase longa guardada separadamente>
PRO_BACKUP_OFFSITE_DIRECTORY=<unidade externa ou diretório sincronizado>
```

Quando `PRO_BACKUP_OFFSITE_DIRECTORY` estiver configurado, o backup recusa a cópia se não houver chave portátil. A cópia é feita por arquivo temporário, conferida por SHA-256 e somente então renomeada no destino.

No Windows, prefira o configurador interativo. Ele não imprime a frase, guarda somente uma cópia protegida pelo DPAPI do usuário atual e reinstala a tarefa agendada com o destino off-site:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\configure-supabase-backup-offsite.ps1
```

A frase ainda deve ser registrada pelo responsável em um gerenciador de senhas ou suporte físico separado. O arquivo DPAPI local não substitui esse registro, pois depende do mesmo usuário e computador.

O comando lê `NEXT_PUBLIC_SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` de `.env.local`, sem imprimir seus valores. Nunca copie essas credenciais para o repositório.

Para verificar e ensaiar a extração de um backup:

```powershell
npm run backup:verify -- --backup "C:\PRO\backups\pro-resumos\ARQUIVO.probackup"
```

O arquivo `.probackup.key.dpapi` correspondente deve estar ao lado do backup. A verificação falha se a autenticação AES-GCM, qualquer hash ou qualquer contagem divergir.

Em outra máquina, use a chave portátil e forneça a frase apenas pelo ambiente do processo:

```powershell
npm run backup:verify -- --backup "D:\backup\ARQUIVO.probackup" --recovery-key "D:\backup\ARQUIVO.probackup.key.recovery"
```

## Agendamento diário no Windows

Execute uma vez, com o usuário Windows que manterá a chave DPAPI:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\install-supabase-backup-task.ps1
```

A tarefa roda diariamente às 03:30 e tenta recuperar execuções perdidas quando o computador voltar a ficar disponível. Ela depende de o computador estar ligado, do repositório permanecer em `C:\PRO\site` e de `.env.local` continuar válido.

## Recuperação de desastre

Mantenha o `.probackup`, a chave `.key.recovery` e o `.summary.json` em armazenamento externo versionado. Guarde a frase de recuperação em local diferente. A chave DPAPI pode continuar local para restaurações rápidas, mas não deve ser a única forma de recuperação.

Antes de clientes pagantes, habilite backups nativos do Supabase e execute um restore em projeto isolado. O backup lógico não contém segredos OAuth, sessões ativas ou hashes de senha e não substitui integralmente o mecanismo nativo.
