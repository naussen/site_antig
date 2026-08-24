# Changelog

## Não publicado — identidade visual do Dashboard

- refinada a paleta do Dashboard com títulos de disciplina em azul-marinho, ícones roxos e cards de módulo com acentos laranja mais discretos, preservando os temas Light, Dark e Sepia.

## Não publicado — dados pessoais do PRO Legis

- adicionada a tabela canônica de realces jurídicos com RLS por usuário e validações de offsets, cores e contexto;
- reconciliado o histórico canônico das migrations remotas `015` e `016` antes da otimização;
- adicionada função autenticada que retorna notas e realces do artigo em uma única ida ao banco;
- criado índice composto para acelerar a leitura dos realces por usuário, fragmento e intervalo.

## Não publicado — navegação mobile da leitura

- corrigido o módulo de Resumos para ocupar toda a largura disponível em telas pequenas;
- convertido o acesso à navegação da página de estudo em uma aba sobreposta, retrátil e ancorada à esquerda, sem reservar espaço do conteúdo.
- reforçado o layout da leitura como coluna no mobile e linha somente no desktop, impedindo qualquer navegação futura de comprimir horizontalmente o conteúdo.

## Não publicado — integração entre Legis e Resumos

- adicionado filtro temporário por disciplina no Dashboard via query string, sem alterar as preferências salvas do usuário;
- preparado o destino direto do PRO Legis para os resumos de Direito Constitucional.

## Não publicado — landing do ecossistema PRO Concursos

- promovida a landing pública de `/resumos/landing` para o domínio principal por reescrita na borda, preservando o aplicativo em `/resumos`;
- adotada a nova marca PRO Concursos na página pública;
- adicionadas prévias visuais dos módulos Resumos e Legis, flashcards, anotações, marca-texto e temas Light, Dark e Sepia;
- comunicada a assinatura mensal única e a expansão futura do ecossistema.
- adicionada uma faixa clara na apresentação dos módulos para equilibrar a paleta escura e melhorar o descanso visual.

## Não publicado — correção da leitura e carregamento

- remove o sumário antigo e redundante da área de conteúdo, mantendo o progresso somente como checkbox no menu esquerdo;
- move o acesso ao marca-texto para o cabeçalho fixo da leitura, com rótulo sempre visível;
- confirma o salvamento dos realces por uma API autenticada antes de informar sucesso ao usuário;
- paraleliza a busca inicial do tópico e das seções e adiciona skeleton imediato durante navegações;
- corrige a documentação de autenticação para não direcionar usuários ao deploy Netlify legado.

## Não publicado — leitura e marca-texto

- removida da área de conteúdo a ação redundante de marcar seção como lida;
- convertidos os controles de progresso do menu lateral em checkboxes nativos;
- adicionada ferramenta de marca-texto com dez cores, remoção e salvamento automático;
- persistidos os realces por usuário e seção, com RLS e reancoragem textual defensiva.

## Não publicado — gateway Legis

- confirmado que o apex `proconcursos.com.br` é servido pela Netlify e que o 404 de `/legis` ocorre porque as regras ainda estão somente no deploy da branch de preview;
- documentado o procedimento de promoção das regras para produção.

## 2026-08-18

- Corrigido o retorno seguro do login e callback entre `/resumos` e `/legis`, preservando query de fragmento e rejeitando destinos externos.
- Adicionada regra de proxy do `/legis` para o origin Netlify do PRO Legis somente na branch de trabalho, ainda não promovida à produção.
- Adicionado link de navegação do Dashboard para o PRO Legis, com recarga completa entre zonas no mesmo domínio.
- Adicionada a migration segura e versionada do PRO Legis, com workflow editorial AAL2, RLS, progresso e respostas C/E calculadas no servidor.
- Atualizados os tipos compartilhados e o roteiro de validação RLS para cobrir o novo acervo e o isolamento entre usuários.
- Adicionada a migration de importação idempotente e workflow editorial do PRO Legis, sem conceder publicação à automação.
- Substituída a identidade visual do PRO Resumos por uma marca responsiva, com variantes horizontal, compacta e de alto contraste.
- Adicionado controle acessível para expandir ou recolher os resumos de cada disciplina no Dashboard.
- Endurecida a renderização Mermaid contra XSS persistente com validação compartilhada, modo estrito e sanitização explícita do SVG.
- Adicionada exclusão defensiva de arquivos `.env*` nos bundles de Functions da Netlify e documentada a exigência de deploy por checkout limpo.
- Configuradas na Netlify as chaves modernas publishable/secret do Supabase, com a credencial administrativa marcada como segredo.
- Consolidada em `TODO.md` a fila futura de segurança, pagamentos, webhooks, operação e privacidade.
- Reconciliadas as pendências com os hardenings já concluídos para evitar regressões e retrabalho.
- Registradas as recomendações futuras contra IDOR, enumeração e abuso das APIs administrativas.

## 2026-08-17

- Adicionada fonte de verdade server-side para direitos de acesso ao acervo.
- Restringida a leitura de tópicos e seções a assinaturas ativas ou administradores com MFA AAL2.
- Centralizada a autorização do acervo em uma DAL server-only, incluindo a Server Action de preferências.
- Corrigida a tela de assinatura para não declarar plano gratuito ativo sem confirmação do backend.

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
