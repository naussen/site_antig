# 39 — Informática

## Checkpoint vigente — 23/11/2026 — Redes de Computadores 01–05 publicadas

Escopo exclusivo: `redes-de-computadores-sec-01` a `redes-de-computadores-sec-05`, com texto integral, três callouts, um diagrama, um mnemônico e tabelas. Nenhum cartão existente. As tabelas de topologias e OSI estavam indevidamente na seção 01; foram corrigidas e recompostas nas seções próprias 03 e 05. A seção 01 passou a conter apenas abrangência/classificação. Resultado: três tabelas e a fórmula de malha preservada em seu contexto correto. Identidades, títulos, ordem e mnemônico mantidos.

Cobertura acumulada: **18/52 seções existentes**, três tópicos integrais e Redes de Computadores **5/8**. Restam **34 seções existentes** e três pacotes de lacuna em dry-run. As seções Redes 06–08 não foram revisadas ou reaplicadas neste lote. Informática permanece parcial.

### Achados e correções

| Seção | Decisão aplicada |
| --- | --- |
| 01 — Dimensão | Removido limite universal de LAN a 10 km. Distinguida abrangência de tecnologia WLAN e de topologia. Relocadas as duas tabelas alheias ao assunto, sem excluir os temas do tópico. |
| 02 — Comutação | Circuito reserva recursos, sem exigir fio físico exclusivo. Mensagem inteira distinguida de pacote; diferenciados datagramas e circuitos virtuais. Retiradas analogias que tratavam todas as modalidades de pacotes como datagramas e a reunião ordenada como garantia automática. Callout e mapa alinhados; mapa sem rótulos quebrados palavra por palavra. |
| 03 — Topologias | Suprida tabela anunciada mas ausente na seção, recuperando o conteúdo deslocado. Corrigidas topologias híbridas como únicas possíveis, falha inevitável de anel, melhor desempenho/imunidade da malha e colisão como característica universal. Fórmula N(N−1)/2 preservada para malha completa simples bidirecional; exemplo de quatro nós validado: seis enlaces. Callout da estrela qualificado para redundância. |
| 04 — Equipamentos | Modem não limitado a discado; roteador condicionado à tabela/política. Switch aprende MAC e admite flooding; hub repete sinais. AP não é sinônimo de repetidor. Corrigidos nome de WPA2, AES como algoritmo, CCMP-128 e fragilidade de WEP como falha de projeto, não simples tamanho de chave. Acrescentada referência atual a WPA3, sem prometer segurança absoluta. Callout alinhado. |
| 05 — OSI | Recomposta tabela das sete camadas, corrigindo SQL/ZIP como exemplos de sessão, confiabilidade universal de transporte, fragmentação/segmentação e protocolos forçados a uma única camada. Independência de implementação condicionada aos serviços/interfaces preservados. Agrupamento rede/usuário mantido como recurso didático, sem determinar hardware/software. Mnemônico conferido e preservado. |

### Fontes primárias conferidas em 23/11/2026

- [ITU-T X.200 (1994), página oficial](https://www.itu.int/rec/T-REC-X.200-199407-I/en), com status “In force”, e [texto oficial em PDF](https://www.itu.int/rec/dologin_pub.asp?id=T-REC-X.200-199407-I%21%21PDF-E&lang=s&type=items): modelo OSI e serviços de camadas. O primeiro acesso ao PDF com outro parâmetro de idioma falhou; o endereço acima foi recuperado. Complemento de implementação: [Oracle — OSI](https://docs.oracle.com/cd/E19504-01/802-5886/intro-45828/index.html). Consultados trechos pertinentes, sem atribuir leitura integral das publicações.
- [RFC 768 — UDP](https://www.rfc-editor.org/rfc/rfc768.html) e [RFC 9293 — TCP](https://www.rfc-editor.org/rfc/rfc9293.html): diferenças de entrega/ordem e transporte. Fontes de 1980 e 2022, sem apresentá-las como novas publicações de 2026.
- [Cisco — campus LAN/WLAN](https://www.cisco.com/c/en/us/td/docs/solutions/CVD/Campus/cisco-campus-lan-wlan-design-guide.html): abrangência contextual e campus; [Cisco — topologias](https://www.cisco.com/site/us/en/learn/topics/networking/what-is-network-topology.html) e [IBM — topologias](https://www.ibm.com/think/topics/network-topology): organização física/lógica, redundância e limites. Material autoral dos fabricantes, sem universalizar produtos ou modelos de implantação.
- [Cisco — WAN e tecnologias de comutação](https://www.cisco.com/c/en/us/td/docs/routers/ios-xe/lan-wan/lan-wan/m_wan-lserv-overview-xe.html): circuitos, pacotes e tecnologias históricas com circuitos virtuais. O glossário IBM de z/OS retornou 403 no acesso direto e não foi tratado como leitura integral acessível.
- [Cisco — tabela MAC e flooding](https://www.cisco.com/c/en/us/td/docs/switches/lan/c9000/lyr2-fwd/cdp-lldp-mac-udld/cdp-lldp-mac-udld-configuration-guide/configure-mac.html), [access point](https://www.cisco.com/c/en/us/support/docs/smb/wireless/cisco-small-business-100-series-wireless-access-points/smb5530-set-up-a-wireless-network-using-a-wireless-access-point-wap.html) e [modem a cabo](https://www.cisco.com/en/US/docs/cable/modems/ubr904/installation/guide/cmprodo.html): características dos dispositivos. Documentação antiga usada apenas para fundamentos estáveis; sem recomendar equipamentos legados.
- [Apple — segurança de roteadores/APs](https://support.apple.com/en-us/102766) e [Microsoft — algoritmos DOT11](https://learn.microsoft.com/en-us/windows/win32/nativewifi/dot11-cipher-algorithm): WPA2/AES, WPA3, CCMP-128 e opções legadas inseguras. [NIST SP 800-48r1](https://nvlpubs.nist.gov/nistpubs/legacy/sp/nistspecialpublication800-48r1.pdf) usado somente como explicação histórica de WEP/IV: está explicitamente retirado desde 2018 e não fundamenta recomendação atual de configuração.

### Publicação e verificação

Pasta exclusiva: `orquestracao-03-54/saneamento-onda-7/39-informatica/redes-01-05-20261123/`; executor `../redes-01-05-lote.mjs`. SHA-256 da proposta: `7d9de49ddd019f2807e3e8c27af3a81a5e62b40e7e3a51612b2b1ce5231495bd`.

- Pré-imagem atual de 15 tópicos/52 seções preservada; paridade inicial com o resultado após Ameaças 06–09. Propostas amplas não rastreadas não aplicadas.
- Dry-run aprovado pelo CLI existente com oito seções para satisfazer `--preserve-flashcards`. Seções 06–08 copiadas intactas somente na validação. SQL conferido com exatamente cinco updates, nenhuma inserção; não foi aplicada carga de oito seções.
- Ensaio transacional com rollback aprovado; publicação atômica condicionada a revisão, identidade e tópico ativo, usando o mecanismo existente. Nenhum schema, código da aplicação, dependência, credencial ou dado pessoal alterado.
- Reconciliação integral posterior: 15 tópicos/52 seções sem ausentes, extras ou divergências; cinco novas revisões. Demais 47 seções preservadas. Rótulo genérico `target: preimagem` usa o estado esperado já corrigido como entrada, não significa rollback.
- 30/30 verificações locais: cinco seções × Light/Dark/Sepia × 375/1200 px. Incluídas nove checagens de rolagem interna das três tabelas no celular. Mapa com zoom/restauração/overlay exercitados nas seis combinações; validador compartilhado aprovou o código e rejeitou três controles maliciosos. Fórmula renderizada sem erro e mnemônico visualizado. Sem overflow global. Tabelas e mapa extenso usam navegação interna no celular; layout compartilhado preservado.
- Harness com componentes reais e CSS compilado de `questoes-experiencia-20261122`; conta de aluno dispensada. Isso não certifica toda a navegação autenticada. Sem lint/build globais porque a aplicação e os contratos não mudaram. Sintaxe do executor e diff verificados. Esta revisão não certifica cobertura de todos os editais possíveis.

Reprodução: CLI do site `import-batch <pasta deste lote/import> --dry-run --preserve-flashcards`; na raiz editorial, `node <pasta deste lote/validar-visual.cjs> <pasta deste lote/render.json>`. `reconcile` é somente leitura, mas o recibo existente é imutável. Não reaplicar SQL concluído.

Próximo prompt: “Revise somente Redes de Computadores 06–08, conforme relatório 39. Preserve os lotes publicados, publique com proteção de concorrência, reconcilie e pare.”

---

## Checkpoint anterior — 23/11/2026 — Ameaças Virtuais 06–09 publicadas

Escopo exclusivo: `ameacas-virtuais-sec-06` a `ameacas-virtuais-sec-09`, examinadas integralmente com três callouts e um diagrama estruturado; nenhum cartão, mnemônico ou tabela. As quatro seções foram corrigidas e publicadas. Ameaças Virtuais completa **9/9** no ciclo dos dois lotes, sem reaplicar 01–05. Cobertura acumulada comprovada de Informática: **13/52 seções em três tópicos integrais**. Restam **39 seções existentes** e três pacotes de lacuna em dry-run; disciplina parcial.

### Achados e correções

| Seção | Correção aplicada |
| --- | --- |
| 06 — Firewall | Corrigidos controle limitado a TCP/perímetro, ausência de política, liberação irrestrita de saída como regra geral e garantias contra DDoS. Explicitados tráfego interno que cruza o controle, política de entrada/saída, limites de visibilidade e ausência de garantia para detectar sniffer passivo. Callout alinhado. |
| 07 — Proxy | Qualificados encaminhamento e funções dependentes da implementação. Corrigida navegação sempre intermediada e separação exclusiva de políticas entre proxy/firewall; acrescentado proxy reverso para suprir omissão relevante, sem expandir para configuração operacional. Callout alinhado. |
| 08 — VPN | Retiradas economia universal, criptografia de todo tráfego e anonimato garantidos. Diferenciados túnel completo/dividido, extremos protegidos, importância de HTTPS e confiança no operador. PPTP qualificado como legado não recomendado; citados exemplos atuais. Nenhum callout novo. |
| 09 — IDS/IPS | IDS passa a indicar suspeita, sem provar intrusão; qualificadas implantação passiva, resposta integrada e prevenção inline. Acrescentados falsos positivos/negativos e limitações de observação. Atualizado callout e substituído mapa de um único título por distinção funcional de detecção/prevenção e análise. |

Sem exclusão de seção ou mudança de identidade, título ou ordem. O mapa anterior não acrescentava informação ao título; a substituição elimina essa redundância. Não foi identificada outra omissão que justificasse ampliar este lote.

### Fontes primárias conferidas em 23/11/2026

- [NIST SP 800-41r1 — firewalls e políticas](https://nvlpubs.nist.gov/nistpubs/Legacy/SP/nistspecialpublication800-41r1.pdf), especialmente política inbound/outbound e tipos de filtragem. Documento de 2009 usado para fundamentos; complementado pela [documentação atual Windows Firewall](https://learn.microsoft.com/en-us/windows/security/operating-system-security/network-security/windows-firewall/), sem universalizar padrões de um produto.
- [RFC 9110, seção 3.7 — intermediários](https://www.rfc-editor.org/rfc/rfc9110.html#section-3.7): proxy e gateway/proxy reverso, encaminhamento e cache.
- [Microsoft — protocolos VPN](https://learn.microsoft.com/en-us/windows-server/remote/remote-access/configure-vpn-protocols) e [roteamento VPN](https://learn.microsoft.com/en-us/windows/security/operating-system-security/network-security/vpn/vpn-routing): PPTP/L2TP não recomendados, alternativas e túnel completo/dividido. Exemplos de implementação, não exclusividade de Windows.
- [NIST SP 800-77r1 — VPN IPsec](https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-77r1.pdf): proteção e riscos dos extremos; [FTC — limitações de aplicativos VPN](https://www.ftc.gov/business-guidance/blog/2018/02/market-vpn-app) e [CSA Singapore — uso de VPN pessoal](https://www.csa.gov.sg/alerts-and-advisories/advisories/ad-2024-011/): confiança no operador e limites de privacidade. Fontes institucionais de 2020, 2018 e 2024 recuperadas nesta data, sem apresentá-las como novas publicações de 2026.
- [NIST SP 800-94 — IDPS](https://nvlpubs.nist.gov/nistpubs/Legacy/SP/nistspecialpublication800-94.pdf), seções de detecção, falsos positivos/negativos e sensores passivos/inline; complementado pelos verbetes CSRC [IDS](https://csrc.nist.gov/glossary/term/intrusion_detection_system) e [IPS](https://csrc.nist.gov/glossary/term/intrusion_prevention_system). Fundamentos de 2007, não levantamento do mercado atual. Consultados os trechos pertinentes, sem alegação de leitura integral das publicações.

A página oficial do SP 800-94 informa que a revisão preliminar de 2012 foi retirada e não se tornou publicação final. Foi usado o documento final de 2007 apenas para fundamentos, com essa limitação temporal explícita.

### Publicação e verificação

Pasta exclusiva: `orquestracao-03-54/saneamento-onda-7/39-informatica/ameacas-06-09-20261123/`; executor: `../ameacas-06-09-lote.mjs`. SHA-256 da proposta: `0b4e2927afaaa8e309db4cdbd5045d1e3159f57fc383b2fcc6ddc80f6b2a3b33`.

- Pré-imagem atual de 15 tópicos/52 seções preservada. Estado inicial coincidiu com o resultado do lote 01–05, incluindo Hardware e Internet/Intranet. Propostas amplas não rastreadas não foram aplicadas.
- CLI: dry-run aprovado com nove seções para satisfazer o contrato de `--preserve-flashcards`; 01–05 copiadas intactas apenas para validação. Conferência do SQL confirmou quatro updates (06–09), nenhuma inserção. Não houve aplicação do payload de nove seções.
- Ensaio SQL com rollback aprovado. Publicação atômica com metadados do tópico protegidos e comparação dos IDs de revisão/identidade. Recibos `ensaio-recibo.txt` e `aplicacao-recibo.txt`; nenhuma migration, dependência, credencial, código da aplicação ou dado pessoal alterado.
- Reconciliação posterior integral: 15 tópicos/52 seções sem ausentes, extras ou divergências; quatro novas revisões. Demais 48 seções preservadas. `target: preimagem` é rótulo do comparador genérico alimentado pelo estado esperado já corrigido, não indicação de rollback.
- 24/24 verificações locais (quatro seções × Light/Dark/Sepia × 375/1200 px); capturas examinadas. Nenhum overflow global ou erro KaTeX. Zoom, restauração e abrir/fechar overlay exercitados nas seis combinações do mapa da seção 09. Mermaid válido no validador compartilhado, que rejeitou três controles maliciosos. Sem alteração do renderizador ou de suas regras de segurança.
- Componentes reais e CSS compilado da worktree `questoes-experiencia-20261122`. Conta de aluno dispensada; validação local não certifica toda navegação autenticada. Sem lint/build globais: aplicação e contrato não mudaram. Sintaxe do executor e diff verificados.

Reprodução: CLI do site `import-batch <pasta deste lote/import> --dry-run --preserve-flashcards`; na raiz editorial, `node <pasta deste lote/validar-visual.cjs> <pasta deste lote/render.json>`. Executor `reconcile` é somente leitura, mas o recibo existente é imutável. Não reaplicar SQL já concluído.

Próximo prompt: “Revise somente Redes de Computadores, seções 01–05, conforme relatório 39. Preserve os três tópicos já publicados, publique com proteção de concorrência, reconcilie e pare.”

---

## Checkpoint anterior — 23/11/2026 — Ameaças Virtuais 01–05 publicadas

Escopo exclusivo: `ameacas-virtuais-sec-01` a `ameacas-virtuais-sec-05`, examinadas integralmente com três callouts e uma tabela. Nenhum cartão, mnemônico ou diagrama existente nessas cinco seções. Não foram criados componentes extras. As seções 06–09 continuam pendentes; seus textos não foram revisados neste lote. Cobertura acumulada: **9/52 seções em três tópicos**, sendo Hardware e Internet/Intranet integrais e Ameaças Virtuais **5/9**. Restam **43 seções existentes** e três pacotes de lacuna em dry-run. Disciplina parcial.

### Achados e decisões

| Seção | Correções publicadas |
| --- | --- |
| 01 — Visão geral | Retiradas restrições indevidas da intranet a uma única LAN e a cadastro em servidor específico. Conexão externa condicionada a conectividade e políticas. Reduzida duplicação conceitual com o tópico Internet e Intranet e acrescentado vínculo com ameaças internas. |
| 02 — Classificação | Grupos apresentados como organização didática não exaustiva, com sobreposição. Separados golpe, técnica e malware; botnet definida como rede. Varredura e captura não são necessariamente ataques quando autorizadas. |
| 03 — Tipos | Corrigidas ação consciente obrigatória para vírus, worm “autoprogramável”, phishing versus pharming, promessa de recuperação após resgate, trojan como vírus por suposta regra da banca e exemplo comercial sem fundamento. Qualificados bot, spyware, rootkit e sniffer. Separados infecção, ativação e carga útil; bomba lógica não é componente obrigatório de todo vírus. Reorganizada a tabela para eliminar pontuação/itens concatenados e alinhados os dois callouts. |
| 04 — Antivírus | Mantida a classificação histórica de quatro gerações como recurso didático, sem alegar norma de mercado ou prevalência atual. Corrigidas fronteiras rígidas da heurística, análise dinâmica e “proteção total”. Registradas combinação atual de técnicas e limitações; callout atualizado. |
| 05 — Antispyware | Retirada fronteira rígida de produtos e classificação automática de todo adware como spyware. Diferenciados publicidade, espionagem e aplicativos potencialmente indesejados. Função integrada não exige instalação redundante de produto residente. |

### Fontes primárias — conferência em 23/11/2026

- [CERT.br — fascículo Códigos Maliciosos](https://cartilha.cert.br/fasciculos/codigos-maliciosos/fasciculo-codigos-maliciosos.pdf), versão disponível no índice atual: tipos de malware, bot/botnet, espionagem e antimalware. As antigas URLs `/malware/`, `/golpes/` e `/ataques/` retornaram 404; não foram tratadas como fontes acessíveis.
- [NIST SP 800-83r1](https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-83r1.pdf), seções 2.1/2.2: categorias clássicas, ataques combinados e ferramentas. Documento histórico de 2013 usado para conceitos, complementado pelas fontes atuais; não foi apresentado como catálogo completo de ameaças de 2026.
- NIST CSRC: [intranet](https://csrc.nist.gov/glossary/term/intranet), [phishing](https://csrc.nist.gov/glossary/term/phishing), [pharming](https://csrc.nist.gov/glossary/term/pharming), [trojan](https://csrc.nist.gov/glossary/term/trojan_horse), [bomba lógica](https://csrc.nist.gov/glossary/term/logic_bomb) e [sniffer](https://csrc.nist.gov/glossary/term/sniffer). Consultados os verbetes pertinentes, sem atribuir leitura integral das normas referenciadas por eles.
- Microsoft: [motores de proteção](https://learn.microsoft.com/en-us/defender-endpoint/adv-tech-of-mdav), [monitoramento comportamental](https://learn.microsoft.com/en-us/defender-endpoint/behavior-monitor) e [critérios de malware/aplicativos indesejados](https://learn.microsoft.com/en-us/defender-xdr/criteria): heurística, emulação, sandbox, combinação de técnicas, consentimento e limitações. Exemplos atuais de implementação, sem universalizar a arquitetura do produto.

Não foi encontrada evidência primária para a alegação geral sobre CESPE nem para a prevalência de uma “4ª geração” no mercado; essas afirmações foram retiradas. A numeração histórica preexistente permanece expressamente didática.

### Publicação, verificação e limites

Pasta exclusiva: `orquestracao-03-54/saneamento-onda-7/39-informatica/ameacas-01-05-20261123/`; executor: `../ameacas-01-05-lote.mjs`. SHA-256 das cinco seções propostas: `effdeb2860c05bb74e85f0d1acacb8b1bcd9e18c0f19872cbbe1fef0f7c9e782`.

- Pré-imagem atual preservada com 15 tópicos e 52 seções. Leitura inicial coincidiu com o resultado após Internet/Intranet. Propostas amplas não rastreadas não foram aplicadas.
- Dry-run aprovado pelo CLI existente. Para `--preserve-flashcards`, o validador exige as nove seções do tópico: o payload contém as cinco corrigidas e cópias intactas de 06–09. Isso é validação de contrato, não revisão nem aplicação das quatro restantes. `aplicar.sql` contém exatamente cinco updates e nenhuma inserção; IDs conferidos antes de executar.
- Ensaio transacional com rollback aprovado. Publicação em produção condicionada aos IDs de revisão, identidade e tópico ativo, com proteção do catálogo, usando o mecanismo existente. Não houve schema, dependência, credencial, código do site ou dado pessoal alterado.
- Reconciliação posterior integral: 15 tópicos/52 seções sem ausências, extras ou divergências, e cinco novas revisões. Demais 47 seções, incluindo Hardware, Internet/Intranet e Ameaças 06–09, preservadas. O rótulo genérico `target: preimagem` usa como entrada o estado esperado já corrigido.
- 30/30 verificações locais: cinco seções × Light/Dark/Sepia × 375/1200 px. Três verificações adicionais confirmaram rolagem horizontal funcional da tabela em 375 px, com capturas da extremidade direita. Sem overflow global nem erros KaTeX. A tabela extensa mantém a navegação horizontal interna no celular; isso não foi convertido em alteração de layout fora do lote.
- Nenhum Mermaid alterado; testes de zoom/overlay não se aplicam a estas cinco seções. Harness usa componentes e CSS compilado da worktree `questoes-experiencia-20261122`. Conta de aluno dispensada; não certifica navegação autenticada completa. Lint/build globais não repetidos, pois aplicação e validadores não mudaram. Sintaxe do executor e diff verificados.

Para testar: no site, `node --env-file=.env.local scripts/content-admin.mjs import-batch <pasta deste lote/import> --dry-run --preserve-flashcards`. Na raiz editorial, `node <pasta deste lote/validar-visual.cjs> <pasta deste lote/render.json>`; rolagem: `node <pasta deste lote/validar-rolagem.cjs> <pasta deste lote/render-scroll.json>`. Reconciliação é somente leitura, mas o recibo existente não deve ser sobrescrito. Não reaplicar SQL concluído.

Próximo prompt: “Revise somente Ameaças Virtuais, seções 06–09, conforme relatório 39. Preserve Hardware, Internet/Intranet e Ameaças 01–05. Publique com proteção de concorrência, reconcilie e pare.”

---

## Checkpoint anterior — 23/11/2026 — Internet e Intranet publicado

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
