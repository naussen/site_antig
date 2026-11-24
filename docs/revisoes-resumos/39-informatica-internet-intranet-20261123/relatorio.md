# 39 — Informática

## Checkpoint vigente — 23/11/2026 — Internet e Intranet publicado

Escopo: somente `internet-e-intranet-sec-01`, próximo tópico após Hardware na ordem do catálogo; uma seção, um callout, uma tabela e um diagrama, todos examinados integralmente. Não há cartões nem mnemônicos. Cobertura acumulada comprovada: **4/52 seções existentes em 2/15 tópicos**. Restam **48 seções** e três pacotes de lacuna em dry-run; disciplina parcial. Hardware não foi reaplicado.

### Achados e correções deste lote

- Omissão confirmada: o tópico “Internet e Intranet” só explicava Internet. Acrescentadas definições de intranet e extranet, exemplos e comparação por finalidade/controle de acesso. Nenhum tópico ou seção novo foi criado.
- Generalização incorreta: conectividade não concede acesso a qualquer recurso. Explicitadas permissões e autenticação por serviço.
- Confusão de protocolos: HTTP/HTTPS não são requisitos de toda comunicação Internet. Separadas família TCP/IP, transporte e aplicação, e Web como um serviço da Internet.
- Contradição entre título, tabela, callout e mapa: alinhados os quatro componentes. A tabela anterior repetia uma única definição; agora compara os três conceitos. O mapa anterior reforçava acesso público sem ressalvas e misturava protocolos; substituído por três ramos paralelos, sem falsa sequência ou hierarquia de inclusão.
- Diferenciadas classificação de acesso e extensão geográfica; admitido acesso remoto autorizado à intranet, sem impor VPN como único mecanismo. Sem outras omissões relevantes identificadas dentro desta seção; não certifica cobertura integral de edital.

### Fontes primárias conferidas em 23/11/2026

- [NIST — intranet](https://csrc.nist.gov/glossary/term/intranet) e [extranet](https://csrc.nist.gov/glossary/term/extranet): definições de uso interno e comunicação com parceiros; contexto CNSSI 4009-2022.
- [RFC 9110 — HTTP Semantics](https://www.rfc-editor.org/rfc/rfc9110.html): protocolo de aplicação, HTTP/HTTPS e autenticação; consultados os trechos pertinentes, sem afirmar leitura integral.
- [RFC 9000 — QUIC](https://www.rfc-editor.org/rfc/rfc9000.html): exemplo atual de transporte sobre UDP, refutando a necessidade universal de TCP em toda aplicação. O conteúdo publicado limita-se a TCP/UDP, sem ampliar para aula de QUIC.
- [RFC 4949 — glossário](https://www.rfc-editor.org/rfc/rfc4949.html): apoio terminológico para Internet/redes privadas; documento informativo histórico, complementado pelas definições NIST atuais e pelos padrões HTTP/QUIC.

### Publicação, verificação e reprodução

Pasta exclusiva: `orquestracao-03-54/saneamento-onda-7/39-informatica/internet-intranet-20261123/`; executor: `../internet-intranet-lote.mjs`. SHA-256 da proposta: `91a9c7dc36f20429edcbce8938545bf89961047d61802c07c9b6a4773cf4f57b`.

- Leitura inicial: 15 tópicos/52 seções, com paridade ao estado após Hardware. Preservada pré-imagem atual com revisão da seção selecionada. Propostas amplas não rastreadas continuaram fora da aplicação.
- Dry-run do CLI existente aprovado: um módulo/uma seção, `--preserve-flashcards`; recibo `dry-run.txt`. Mermaid válido e três controles maliciosos rejeitados pelo validador compartilhado, sem alterar segurança.
- Ensaio SQL com rollback aprovado (`ensaio-recibo.txt`). Publicação transacional com bloqueio de catálogo e comparação de `current_revision_id`, identidade e tópico; nenhuma migration, credencial, dependência ou aplicação alterada. Recibo `aplicacao-recibo.txt`.
- Reconciliação de produção: 15 tópicos/52 seções sem diferenças do esperado; nova revisão da seção confirmada. As outras 51 seções, inclusive Hardware, permaneceram idênticas. `target: preimagem` é o rótulo do comparador alimentado com o estado esperado já corrigido, não indicação de rollback.
- Visual: 6/6 combinações Light/Dark/Sepia × 375/1200 px, com componentes reais da worktree `questoes-experiencia-20261122`; zoom, restauração e abrir/fechar overlay exercitados nas seis. Capturas inspecionadas; sem erro de fórmula ou overflow global. Tabela e mapa usam navegação interna no celular. Repetida somente a captura necessária para aguardar a animação do mapa após fechar o overlay; conteúdo não foi alterado nessa repetição.
- Conta de aluno dispensada. Harness local não certifica toda navegação autenticada. Sem lint/build globais, pois nenhum código da aplicação mudou. Sintaxe do executor e `git diff --check` verificados.

Para testar: no site, `node --env-file=.env.local scripts/content-admin.mjs import-batch <pasta deste lote/import> --dry-run --preserve-flashcards`. Na raiz editorial, `node <pasta deste lote/validar-visual.cjs> <pasta deste lote/render.json>`. Reconciliação é somente leitura, mas seu recibo é imutável: reexecução não deve sobrescrever o arquivo existente. Não executar `aplicar.sql` novamente.

Próximo prompt: “Resumos — Informática: revise somente Ameaças Virtuais, seções 01–05 e seus componentes, preservando as seções 06–09 para outro lote. Consulte o relatório 39; não reaplique Hardware nem Internet e Intranet. Confira estado atual, fundamente, publique com proteção de concorrência, reconcilie e pare.”

---

## Checkpoint de 23/11/2026 — Hardware publicado; disciplina parcial

Um único agente. Escopo integral do tópico `hardware`: `hardware-sec-01`, `hardware-sec-02`, `hardware-sec-03`; três callouts, um Mermaid, uma tabela, duas expressões matemáticas; nenhum cartão ou mnemônico. Todos foram examinados. Não foi retomada outra frente.

Diagnóstico: propostas amplas não rastreadas em `orquestracao-03-54/saneamento-onda-7/39-informatica/` e `preparacao-v2/` eram preparação, não recibos de aplicação. O estado atual confirmou os erros anteriores de Hardware. Nenhuma dessas cargas amplas foi executada. A fotografia original foi preservada.

## Achados e correções aplicadas

| Seção | Achados e decisão |
| --- | --- |
| CPU | Erro material: 64 bits não equivale a 16 GB. Corrigidos espaço teórico de 16 EiB e 4 GiB para 32 bits com endereçamento por byte; separados limites práticos e velocidade de processamento. Qualificado o modelo didático de Von Neumann e retirada a equiparação de registradores com o ritmo do processador. Callout e mapa coerentes, preservados. |
| Memórias | Corrigidas mistura entre CMOS, ROM e mídia óptica, permanência absoluta dos dados, L2 normalmente externa e definição de memória virtual como mera extensão da RAM em disco. Acrescentadas ressalvas de implementação, L3, instruções/dados e localidade. Atualizado o callout sobre espaços de endereços. Tabela preservada. |
| Placa-mãe | Atualizados BIOS tradicional versus UEFI, firmware regravável e distinção entre firmware e carregador do SO. Corrigida atribuição de todo fluxo de dados ao chipset, pois controladores podem estar na CPU. Atualizado callout. |

Não identificada redundância que justificasse excluir seção ou componente. Omissões relevantes tratadas dentro desses três registros; isso não certifica cobertura integral de edital.

## Fontes primárias — conferência em 23/11/2026

- [Microsoft — espaços virtuais](https://learn.microsoft.com/en-us/windows-hardware/drivers/gettingstarted/virtual-address-spaces): tradução de endereços, isolamento, paginação e limites teóricos versus implementados.
- [Intel — caches L1 e L2, datasheet de arquitetura](https://edc.intel.com/content/www/us/en/design/products/platforms/details/raptor-lake-s/13th-generation-core-processors-datasheet-volume-1-of-2/006/ia-cores-level-1-and-level-2-caches/): caches de instruções/dados, níveis internos e organização específica. Documento de família, não promessa universal para toda CPU.
- [Intel — BIOS e UEFI](https://www.intel.com/content/www/us/en/gaming/resources/how-to-update-bios.htm): firmware, POST, atualização e UEFI em equipamentos atuais.
- [UEFI 2.11 — visão geral](https://uefi.org/specs/UEFI/2.11/02_Overview.html) e [gerenciador de boot](https://uefi.org/specs/UEFI/2.11/03_Boot_Manager.html): carregamento de aplicações e carregadores. Conteúdo conferido nos resultados oficiais indexados; abertura direta retornou 403. Complementado pela documentação Microsoft e Intel acessível, sem alegação de leitura integral da especificação.

## Persistência e verificação

Evidências exclusivas em `orquestracao-03-54/saneamento-onda-7/39-informatica/hardware-20261123/` e executor `../hardware-lote.mjs`.

- Pré-imagem atual preservada com 15 tópicos e 52 seções, incluindo IDs de revisão. Payload publicado SHA-256 `3de093a2f721d50bb7f809a064622fa0ddc9cd54ed18536063d20b63529e7a52`.
- Dry-run do CLI existente aprovado: um tópico, três seções, preservação de cartões. Ensaio SQL em transação com rollback aprovado; recibos consolidados em `verificacoes.json`.
- Publicação atômica no banco configurado de produção, condicionada a `current_revision_id`, identidade permanente e tópico ativo, com bloqueio compartilhado dos metadados do tópico. SQL reaproveita o mecanismo existente; nenhuma migration, credencial, dependência ou código da aplicação mudou.
- Reconciliação posterior integral: 15 tópicos/52 seções, sem ausentes, extras ou divergências; três revisões novas. IDs, títulos, ordem, cartões, mnemônicos e diagrama preservados. `target: preimagem` é rótulo do comparador genérico, alimentado com o estado esperado já corrigido.
- 18/18 verificações locais: três seções × Light/Dark/Sepia × 375/1200 px. Capturas finais aguardam estabilização da animação; a primeira passagem capturava opacidade transitória. Sem erro KaTeX nem overflow global do artigo. Tabela usa rolagem interna no celular; mapa mantém controles e navegação interna existentes.
- Harness usa os componentes reais e CSS compilado da worktree `questoes-experiencia-20261122`. É validação local da apresentação, não atestado de navegação autenticada em produção. Conferência com conta de aluno dispensada. Lint/build globais não executados: sem alteração de aplicação. Não repetidos workflows globais.

Reprodução proporcional: CLI `import-batch <pasta hardware-20261123/import> --dry-run --preserve-flashcards`; `node hardware-20261123/validar-visual.cjs <hardware-20261123/render.json>` a partir da raiz editorial. `node --env-file=C:/PRO/site/.env.local <hardware-lote.mjs> reconcile` é somente leitura, mas o recibo imutável existente impede sobrescrita. Não executar SQL de aplicação novamente.

## Pendências e próximo lote

Cobertura comprovada nesta retomada: 3/52 seções existentes e 1/15 tópicos. Restam 49 seções existentes nos demais tópicos e três pacotes de lacuna em dry-run, não aplicados. As propostas amplas continuam sem aceite desta revisão. Não marcar a disciplina concluída.

Prompt: “Resumos — Informática: execute somente o próximo tópico pendente, até cinco seções, com todos os componentes. Leia o relatório 39 e este checkpoint; não reaplique Hardware. Confira banco e propostas não rastreadas, fundamente, valide, publique com proteção de concorrência e reconcilie. Atualize os registros e pare.”
