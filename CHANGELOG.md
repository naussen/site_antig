# Changelog

## 2026-08-14

- Endurecidos os grants do Data API, o `search_path` do trigger e os padrões de senha/MFA.
- Separado o token HTTP administrativo da credencial Supabase Service Role.
- Adicionado cadastro e desafio TOTP obrigatório para contas administrativas.
- Reconciliado o histórico remoto das migrations `001` a `007` após auditoria estrutural.
- Registrado que a proteção contra senhas vazadas permanece pendente por exigir plano pago na Supabase.
- Adicionada área protegida de gerenciamento da assinatura, acessível pelo nome/e-mail no rodapé do menu lateral.
- Ampliada discretamente a largura do menu lateral no desktop.
- Reposicionado o botão de recolher/expandir para uma faixa própria entre o cabeçalho e os itens do menu.

## 2026-08-13

- Corrigidos no PYGEM os títulos dos metadados `@@` da série de Auditoria sem alterar os nomes dos arquivos.
- Adicionada operação administrativa por `topic_id` para corrigir a disciplina de módulos importados.
- Adicionada rota dedicada e protegida por papel para login administrativo.
- Adicionado bootstrap local e seguro para conta administrativa confirmada.
- Documentadas as configurações de autenticação e a separação para assinatura.
## Correções recentes

- Corrigido o posicionamento do botão de recolher/expandir o menu desktop, mantendo-o dentro da área visual do menu.
