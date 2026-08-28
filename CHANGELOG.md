# Changelog

## Não publicado — landing e rodapés institucionais

- removidos da landing os blocos redundantes sobre assinatura, módulos futuros e o segundo CTA, reduzindo a extensão da página no celular;
- ampliado o rodapé público com identificação da marca e links funcionais para Termos, Privacidade, Suporte e Contato;
- adicionado ao dashboard um rodapé com acesso direto à assinatura e às orientações de cancelamento por provedor.

## Não publicado — comunicação comercial da landing

- removidas as referências a conta e acesso gratuitos, alinhando os CTAs ao modelo pago por assinatura mensal;
- destacada a oferta especial de lançamento sem fixar preço fora do fluxo de checkout;
- reposicionado no primeiro bloco o diferencial de resumos jurídicos estruturados e legislação oficial no mesmo ambiente.

## Não publicado — republicação de Contabilidade Geral e Avançada

- substituídos os materiais da disciplina por 32 tópicos e 142 seções revisados, com tabelas, fórmulas KaTeX, diagramas Mermaid e flashcards validados;
- preservados 26 `topic_id` existentes e removidas somente as oito versões antigas sem correspondência no novo conjunto;
- movido o tópico “Relatório de auditoria (NBC TA 700, 701, 705 e 706)” de Contabilidade para Auditoria, sem alterar Contabilidade de Custos.

## Não publicado — URLs canônicas dos resumos

- normalizados 30 `topic_id` fragmentados e os 89 `section_id` vinculados, preservando progresso, notas, realces e relações editoriais;
- mantidos redirecionamentos permanentes dos URLs antigos para os novos endereços canônicos;
- adicionada auditoria administrativa e validação compartilhada entre API e CLI para impedir novas palavras fragmentadas por hífens.

## Não publicado — altura adaptativa dos flashcards

- substituídas as cinco alturas estimadas pela quantidade de caracteres por dimensionamento baseado no conteúdo real da frente e do verso;
- removida a rolagem interna dos cartões, preservando o efeito 3D e um tamanho mínimo compacto em telas menores.

## Não publicado — identificação visual das disciplinas

- ampliada para 16 tons a paleta das disciplinas do Dashboard, com variações compatíveis com os temas Light, Dark e Sepia;
- adicionados ícones semânticos ao lado dos nomes das disciplinas, com fallback visual para novas matérias.

## Não publicado — paleta global Mermaid

- aplicada a todos os diagramas Mermaid a paleta azul-marinho, azul-claro e dourado suave, com equivalentes contrastados nos temas Dark e Sepia; setas, bordas e tipografia passaram a seguir a mesma hierarquia visual.

## Não publicado — flashcards de estudo

- renovado o deck de flashcards com superfícies de pergunta e gabarito mais claras, progresso visual, controles temáticos e feedback C/E integrado à paleta do site.

## Não publicado — mapas mentais

- redesenhado o painel Mermaid com paleta orientada pelos tokens do tema, canvas com grade sutil, controles refinados e acabamento consistente no modo ampliado.

## Não publicado — tabelas de estudo

- modernizado o acabamento das tabelas Markdown, com cabeçalho em gradiente aderente aos temas, divisões mais legíveis e destaque discreto da linha em foco.

## Não publicado — validação de títulos e Markdown importados

- bloqueia metadados técnicos, delimitadores de corte e tags `<br>` no conteúdo importado.

## Não publicado — fórmulas quantitativas

- adicionado suporte seguro a KaTeX no renderizador de Markdown, incluindo estilos responsivos para fórmulas em bloco.

## Não publicado — configuração de produção do Mercado Pago

- configurada a base pública de pagamentos como `https://proconcursos.com.br`, sem expor o módulo `/resumos` na URL comercial;
- mantidas as rotas internas do aplicativo somente nos retornos técnicos, login e reconciliação;
- definido provisoriamente o valor da assinatura em R$ 0,10 por mês;
- removida a rota de diagnóstico que realizava chamadas reais ao Mercado Pago.

## Não publicado — oferta e confiabilidade da assinatura

- separada a oferta para contas sem assinatura da página de gerenciamento já usada por assinantes;
- ampliado o botão do Mercado Pago, com cursor, estado de carregamento, preço de lançamento e vantagens enumeradas;
- explicitada na interface a renovação mensal automática após a primeira autorização;
- alinhado o payload de `/preapproval` ao contrato atual de assinaturas e adicionados diagnósticos seguros por categoria de erro;
- ajustado o webhook do Mercado Pago para confirmar o recebimento com HTTP 200.
- isolado o e-mail fictício exigido pelo Sandbox, impedindo seu uso quando o ambiente mudar para produção.
- adicionada classificação limitada do detalhe recusado pelo provedor, sem registrar payloads, e-mails ou mensagens integrais.
- removido da criação de assinatura o header de idempotência não documentado pelo endpoint `/preapproval` do Mercado Pago.

## Não publicado — pagamentos recorrentes

- definido em R$ 9,90 por mês o preço especial de lançamento da assinatura única;
- adicionados checkouts hospedados do Mercado Pago e PayPal para a assinatura mensal única do ecossistema;
- implementados webhooks com verificação de origem, reconsulta ao provedor, validação do plano e atualização server-side dos entitlements;
- adicionadas idempotência persistente, proteção contra eventos fora de ordem e validade defensiva do acesso;
- documentada a configuração segura de credenciais, planos, eventos e testes em sandbox.
- adicionada reconciliação diária autenticada para corrigir webhooks perdidos antes do vencimento defensivo do acesso.

## Não publicado — identidade visual do Dashboard

- adotados nos cabeçalhos do módulo Resumos e da configuração da biblioteca, nos títulos de disciplina e nos cards o estilo e a paleta atuais do PRO Legis: hero azul-escuro, base neutra, bordas superiores por categoria, ícones em fundos suaves e estados semânticos nos temas Light, Dark e Sepia.

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
