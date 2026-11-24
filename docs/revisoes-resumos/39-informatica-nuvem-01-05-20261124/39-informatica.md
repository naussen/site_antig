# 39 — Informática

## Checkpoint vigente — 24/11/2026 — Computação na Nuvem 01–05 publicadas

Escopo exclusivo: `computacao-na-nuvem-cloud-computing-sec-01` a `computacao-na-nuvem-cloud-computing-sec-05`, examinadas integralmente com um callout, uma tabela e um diagrama. Nenhum cartão ou mnemônico existente. Identidades, títulos e ordem preservados. Lotes publicados anteriores não reaplicados.

Cobertura acumulada: **45/52 seções existentes**, oito tópicos integrais. Computação na Nuvem **5/5** examinada neste lote. Restam **7 seções existentes** e três pacotes de lacuna em dry-run. Informática permanece parcial.

### Achados e correções

| Seção | Decisão aplicada |
| --- | --- |
| 01 — Conceito | Acesso por rede não limitado à internet pública. Consumo como serviço não obriga abandonar toda infraestrutura própria/licença; privada pode ser própria ou terceirizada. Virtualização isolada não define nuvem. Distinção armazenamento/computação preservada e callout simplificado. |
| 02 — Características Essenciais | Autoatendimento parte do consumidor, não de inferência das necessidades pelo provedor. Clientes não limitados a navegador. Agrupamento explicado com localização em nível amplo e isolamento. Elasticidade não garante instantaneidade ou recursos físicos ilimitados. Mensuração não significa precisão absoluta/única forma de cobrança ou ausência de custos fixos. |
| 03 — Modelos de Serviço | IaaS não entrega necessariamente hardware físico nem exige instalação manual em todo caso. Tabela agora diferencia oferta e controle em IaaS/PaaS/SaaS. SaaS pode usar cliente instalado; responsabilidades sobre dados/identidades/configuração permanecem. Retirados nomes genéricos/legados IBM SmartCloud e Windows Azure; usados serviços específicos e conferidos. Azure como marca não equivale a PaaS. |
| 04 — Benefícios e Riscos | Ganhos de capacidade/economia/pessoal e segurança qualificados como potenciais. Incluídos responsabilidade compartilhada, custo variável, saída/migração, continuidade e governança. Interrupção não implica automaticamente perda de integridade ou mudança de titularidade. Retirada expressão imprecisa “empresa profissional”. Sem recomendação de compra ou estimativa financeira. |
| 05 — Tipos de Nuvem | Privada definida por uso exclusivo, sem propriedade obrigatoriamente própria ou imunidade a acesso indevido. Pública não significa dados abertos. Comunitária mantém vínculo de interesses; híbrida pode combinar infraestruturas privadas/comunitárias/públicas distintas, não só pública+privada. Portabilidade exige integração. Mapa antigo de gênero/espécie estava deslocado e fazia processamento/bancos dependerem de armazenamento; substituído por síntese dos quatro modelos de implantação. |

A primeira proposta de mapa corrigia a taxonomia, mas tinha ramos longos pouco legíveis no celular. Foi compactada na versão final com disposição lateral e rótulos curtos, preservando as explicações no texto. Não houve alteração do renderizador ou da interface compartilhada.

### Fontes primárias conferidas em 24/11/2026

Consultados os trechos pertinentes, sem atribuir leitura integral de todos os documentos. Publicações antigas fundamentam conceitos, não são apresentadas como novidades de 2026.

- [NIST SP 800-145 — definição de nuvem](https://csrc.nist.gov/pubs/sp/800/145/final) e [texto oficial, seção 2, páginas 2–3](https://nvlpubs.nist.gov/nistpubs/Legacy/SP/nistspecialpublication800-145.pdf), de setembro/2011: definição, cinco características, três modelos de serviço e quatro de implantação. Classificação adotada explicitamente como referência; não como proibição de outras taxonomias comerciais. Sem impor internet pública, propriedade exclusiva ou combinação pública/privada como requisitos universais.
- [NIST SP 800-146 — Synopsis and Recommendations](https://csrc.nist.gov/pubs/sp/800/146/final) e [texto oficial](https://nvlpubs.nist.gov/nistpubs/Legacy/SP/nistspecialpublication800-146.pdf), de maio/2012, especialmente benefícios/riscos econômicos, continuidade e recomendações das seções 8–9: dependência de rede/provedor, portabilidade, disponibilidade e governança. Não usadas recomendações antigas de algoritmos, certificações ou produtos como orientação atual de implementação.
- [Microsoft — responsabilidade compartilhada](https://learn.microsoft.com/en-us/azure/security/fundamentals/shared-responsibility): divisão por IaaS/PaaS/SaaS, dados/identidades/configurações e exemplos. Regras contratuais concretas continuam dependentes do serviço; a matriz do Azure não foi universalizada como norma jurídica para todo fornecedor.
- [Microsoft — modelos de nuvem](https://learn.microsoft.com/en-us/training/modules/describe-cloud-compute/5-define-cloud-models): exemplos de privada/pública/híbrida e hospedagem terceirizada. A classificação completa e a definição mais ampla de híbrida são as do NIST; não foi reproduzida a promessa de controle/segurança total presente na comparação didática da página.
- [AWS — Amazon EC2](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/concepts.html), [Microsoft — Azure App Service](https://learn.microsoft.com/en-us/azure/app-service/overview), [Google — App Engine standard](https://docs.cloud.google.com/appengine/docs/standard/overview): exemplos atuais de serviços, sem recomendação comercial, preços ou SLA. SaaS Microsoft 365 e IaaS Azure Virtual Machines constam também na página de responsabilidade compartilhada. As páginas Microsoft tinham aviso genérico de autorização, mas conteúdo textual acessível. URL genérica AWS “what-is/cloud-computing” retornou 404 e não foi usada como leitura válida.

Os exemplos de custos, riscos e implantação são explicativos. Nenhum recurso de nuvem real foi provisionado, contratado ou alterado. O tópico permanece sujeito ao vocabulário e à data do edital, sem pretensão de cobrir todo serviço comercial existente.

### Publicação e verificação

**Versão publicada:** `orquestracao-03-54/saneamento-onda-7/39-informatica/nuvem-01-05-20261124-v2/`; executor `../nuvem-01-05-lote.mjs`. SHA-256 final: `99e617822bfd9cbb4cb92fde67dd0f151ec995a7d81b27b553799eb22d8e98bf`.

- Pré-imagem atual de 15 tópicos/52 seções preservada; paridade inicial com Segurança 01–04. Proposta ampla não rastreada consultada apenas no recorte deste tópico. Restante não aplicado.
- Pasta `nuvem-01-05-20261124/` preserva a preparação inicial, seus testes e capturas; **não foi publicada**. Após ajuste exclusivamente no mapa 05, a v2 recebeu nova preparação, dry-run e ensaio com rollback. Igualdade integral das primeiras quatro seções e igualdade dos demais campos da quinta foram verificadas para reaproveitamento proporcional.
- Dry-run final aprovado no CLI existente para um tópico/cinco seções, preservando flashcards. SQL decodificado e conferido: exatamente cinco updates 01–05, nenhuma inserção, um mapa alterado.
- Publicação atômica somente da v2, condicionada a revisão esperada, identidade e tópico ativo pelo mecanismo existente. Sem schema, segurança, código da aplicação, dependências, credenciais ou dados pessoais alterados.
- Reconciliação posterior integral aprovada: 15 tópicos/52 seções sem ausentes, extras ou divergências; cinco novas revisões. Conteúdo e IDs de revisão das demais **47 seções preservados**, com asserção explícita. `target: preimagem` compara o estado esperado corrigido, não indica rollback.
- **30 combinações visuais válidas do estado final:** cinco seções × Light/Dark/Sepia × 375/1200 px; 24 verificações das seções 01–04 reaproveitadas por igualdade integral e seis da seção 05 refeitas para o mapa final. Incluídas três checagens de rolagem interna da tabela no celular. Sem overflow global/erro KaTeX; callout e mapa conferidos. Zoom, restauração e overlay exercitados nas seis combinações do mapa final. `render-visual.json` final registra composição e proveniência das verificações.
- Uma fixture intermediária `render-mapa.json` foi gerada com leitura local sem UTF-8 explícito e produziu mojibake nas capturas. Foi **excluída do aceite** e substituída por `render-mapa-corrigido.json`; seis capturas corretas refeitas e inspecionadas. Conteúdo, import e SQL estavam íntegros; o erro não atingiu o banco. O recibo `render-mapa-visual.json` intermediário não é evidência de aceite, apesar das asserções geométricas aprovadas. Arquivos de diagnóstico preservados para rastreabilidade.
- Validador Mermaid compartilhado aprovou o mapa final e rejeitou três controles maliciosos na preparação. **49/49 testes `npm run test:content` aprovados** na preparação inicial e reaproveitados porque aplicação/validadores não mudaram. A mudança do mapa teve validação atual do payload e teste visual específico. Log copiado à v2 com origem na pasta inicial; não se declara segunda execução da suíte.
- Sintaxe do executor e diff verificados. Harness com componentes reais e CSS compilado de `questoes-experiencia-20261122`; não certifica navegação autenticada integral ou todos os editais. Conta de aluno dispensada. Sem lint/build/audit/auth globais, pois não houve mudança de aplicação/dependências/segurança.

Reprodução: CLI `import-batch <pasta v2/import> --dry-run --preserve-flashcards`; `node <pasta v2/validar-visual.cjs> <pasta v2/render.json>` reproduz as 30 combinações completas; `render-mapa-corrigido.json` restringe às seis do mapa. Recibos preservados. Não reaplicar SQL concluído.

Próximo prompt: “Revise somente Teoria Geral de Sistemas 01–03, conforme relatório 39. Preserve os lotes publicados, publique com proteção de concorrência, reconcilie e pare.”

---

## Checkpoint anterior — 23/11/2026 — Segurança da Informação 01–04 publicadas

Escopo exclusivo: `seguranca-da-informacao-sec-01` a `seguranca-da-informacao-sec-04`, examinadas integralmente com dois callouts, uma tabela de princípios e um mapa deslocado de assinatura na seção de certificado. Nenhum cartão ou mnemônico existente. Identidades, títulos e ordem preservados. Lotes anteriores não reaplicados.

Cobertura acumulada: **40/52 seções existentes**, sete tópicos integrais. Segurança da Informação **4/4** examinada neste lote. Restam **12 seções existentes** e três pacotes de lacuna em dry-run. Informática permanece parcial.

### Achados e correções

| Seção | Decisão aplicada |
| --- | --- |
| 01 — Princípios | Retiradas garantias absolutas de disponibilidade, sigilo, verdade material e responsabilidade jurídica. Integridade admite alterações autorizadas e não equivale a “confiabilidade” em todo contexto. Não repúdio tratado como evidência, não impossibilidade de contestação. Autenticidade exige validação; conformidade requer controles contínuos. Tabela reorganizada em objetivo/controles/limites, removendo a classificação indevida de mecanismos como “exceções”. |
| 02 — Criptografia | Diferenciadas cifragem, assinatura e estabelecimento de chaves; chave pública precisa ser autêntica e nem todo algoritmo assimétrico cifra. Hash não é único nem alfanumérico por natureza; colisões existem e resistências são computacionais. Explicitadas pré-imagem/segunda pré-imagem e limite do efeito avalanche; resumo isolado precisa de referência confiável. HTTPS atualizado para TLS, SSL legado e indicador visual variável; canal protegido não prova honestidade do site nem oculta todo metadado. Callout alinhado. |
| 03 — Assinatura Digital | Privada produz/pública verifica, sem generalizar “cifragem do hash” a todos os algoritmos. Assinatura detecta alterações cobertas, mas não impede editar uma cópia e não cifra o documento por si só. Atribuição de identidade e não repúdio condicionados à validação/chave/contexto. Callout alinhado; não prometidos efeitos jurídicos automáticos. |
| 04 — Certificado Digital | Certificado não contém a chave privada; associação de chave pública/identidade depende da política e validação. AC/AR distinguidas, ICP-Brasil não confundida com todos os certificados da Internet; corrigido “La emissão”. Armazenamento não limitado a HD/token/cartão: A3 pode ter HSM remoto. Tabela A/S explicitamente histórica; A4 não reduzido a mais bits. Acrescentada transição normativa para A3/A4 PF, SE PJ e AE, preservando distinção entre tipos e custódia em nuvem. Mapa anterior trazia “PRIVADA de Mar”, rótulos truncados e assinatura saindo diretamente do hash; substituído por fluxo próprio de emissão/validação do certificado. |

Mantida a tabela de princípios e criada tabela comparativa para organizar as quatro linhas históricas já existentes. Nenhuma funcionalidade de criptografia, certificado ou autenticação da aplicação foi alterada. Não se trata de correção de segurança do software nem de revisão do corpus PRO Legis. Inventário do próximo tópico consultado apenas por IDs/títulos para delimitar cinco seções, sem leitura de conteúdo.

### Fontes primárias conferidas em 23/11/2026

Consultados trechos pertinentes e definições no seu contexto, sem atribuir leitura integral das publicações.

- [NIST — Information Security](https://csrc.nist.gov/glossary/term/information_security) e [Confidentiality](https://csrc.nist.gov/glossary/term/confidentiality): confidencialidade, integridade, disponibilidade e restrições autorizadas. Exemplos de controles foram qualificados como apoio aos objetivos, sem prometer resultados absolutos.
- [NIST — Hash Function](https://csrc.nist.gov/glossary/term/hash_function) e [Cryptographic Hash Function](https://csrc.nist.gov/glossary/term/cryptographic_hash_function): resumo em bits, tamanho de saída e resistência computacional. A primeira página foi recuperada com as definições; consultas posteriores à segunda tiveram timeout. Não se declara ausência matemática de colisões.
- [NIST FIPS 186-5 — Digital Signature Standard, 03/02/2023](https://csrc.nist.gov/pubs/fips/186-5/final): assinatura, autenticação, detecção de alterações e evidência para não repúdio. Página informa nota de possíveis correções de 12/05/2025; não se certifica implementação de algoritmo. O texto não foi usado como fundamento de efeito jurídico automático.
- [RFC 8446 — TLS 1.3](https://www.rfc-editor.org/rfc/rfc8446.html), de 2018, [RFC 7568 — SSLv3](https://www.rfc-editor.org/rfc/rfc7568.html), de 2015, e [Chromium — atualização do indicador de conexão](https://blog.chromium.org/2023/05/an-update-on-lock-icon.html), de 2023: canal TLS, obsolescência SSL e limite da associação entre ícone e confiança. O conteúdo do blog recuperado tinha extração limitada; não foi declarado teste do navegador publicado. Variação do indicador não determina o protocolo em uso por si só.
- [RFC 5280 — X.509 e listas de revogação](https://www.rfc-editor.org/rfc/rfc5280.html), de 2008: certificado, chave pública, cadeia, uso e validação. Fonte de fundamentos, sem afirmar que o documento não recebeu atualizações posteriores.
- [ITI — DOC-ICP-04 consolidado, versão 8.3](https://repositorio.iti.gov.br/resolucoes/Resolucao179_DOC-ICP-04.htm), especialmente itens 1.1.5–1.1.9 e 6.1/6.2: tipos históricos e redações alteradas pela Resolução 211/2024 e atos posteriores. O documento exibe redações antigas junto às novas; elas não foram lidas como regras simultâneas. Não se reduziu nível de segurança a contagem de bits.
- [ITI — Certificação Digital](https://www.gov.br/iti/pt-br/acesso-a-informacao/perguntas-frequentes/certificacao-digital), especialmente quadro A1/A3 e pergunta 20: A3 em nuvem/HSM de prestador credenciado e participação da AR. [ITI — FAQ do Comitê Gestor](https://www.gov.br/iti/pt-br/assuntos/comite-gestor/perguntas-frequentes-cg-icp-brasil) e [catálogo oficial de resoluções](https://www.gov.br/iti/pt-br/assuntos/legislacao/resolucoes/resolucoes): transição para novos tipos. As FAQs apresentam recortes distintos de prazo (a FAQ geral menciona fevereiro/2029 para emissão PJ; a do CG menciona uso até 02/03/2029). Para não confundir emissão e uso ou antecipar descontinuação, o conteúdo registra a transição e remete aos atos/política, sem impor um prazo único a todos os tipos. Uma URL direta tentada para Resolução 211 não foi recuperada; alterações foram conferidas no consolidado oficial e FAQs.

A tabela A/S é material histórico para leitura de questões, não uma lista exaustiva dos tipos atuais nem recomendação de aquisição. Requisitos e transição continuam sujeitos à data do edital/ato aplicável. Nenhuma credencial ou certificado real foi criado, instalado ou alterado.

### Publicação e verificação

Pasta exclusiva: `orquestracao-03-54/saneamento-onda-7/39-informatica/seguranca-01-04-20261123/`; executor `../seguranca-01-04-lote.mjs`. SHA-256: `a2f1dc98e814e9a3be34797cc5ede14ce41bbc4560fa33117a8bccefdc9d49b6`.

- Pré-imagem atual de 15 tópicos/52 seções preservada; paridade inicial com Banco 11–14. Proposta ampla não rastreada consultada apenas neste tópico; demais itens não aplicados.
- Dry-run do CLI existente aprovado: um tópico/quatro seções, preservando flashcards. SQL decodificado e conferido: exatamente quatro updates 01–04, nenhuma inserção, um mapa alterado.
- Ensaio com rollback aprovado. Publicação atômica pelo mecanismo existente, condicionada à revisão esperada, identidade e tópico ativo. Sem schema, segurança, aplicação, dependências, credenciais ou dados pessoais alterados.
- Reconciliação integral posterior aprovada: 15 tópicos/52 seções, sem ausentes, extras ou divergências; quatro novas revisões. Conteúdo e IDs de revisão das demais **48 seções preservados**, com asserção explícita. `target: preimagem` compara o estado esperado corrigido, não significa rollback.
- **24/24 verificações visuais**: quatro seções × Light/Dark/Sepia × 375/1200 px. Incluídas seis checagens de rolagem interna das duas tabelas no celular. Sem overflow global ou erro KaTeX; tabelas largas mantêm navegação interna. Dois callouts e mapa conferidos em capturas; zoom, restauração e overlay exercitados nas seis combinações do mapa.
- Validador Mermaid compartilhado aprovou o novo mapa e rejeitou três controles maliciosos. **49/49 testes `npm run test:content` aprovados**, repetidos pela mudança concreta de conteúdo Mermaid; saída preservada. Sintaxe do executor e diff verificados.
- Harness com componentes reais e CSS compilado de `questoes-experiencia-20261122`; não certifica toda a navegação autenticada ou todos os editais. Conta de aluno dispensada. Sem lint/build/audit/auth globais porque não houve alteração de código, dependências ou controles de segurança da aplicação.

Reprodução: CLI `import-batch <pasta/import> --dry-run --preserve-flashcards`; `node <pasta/validar-visual.cjs> <pasta/render.json>` na raiz editorial; `npm run test:content` no site. Recibos preservados. Não reaplicar SQL concluído.

Próximo prompt: “Revise somente Computação na Nuvem 01–05, conforme relatório 39. Preserve os lotes publicados, publique com proteção de concorrência, reconcilie e pare.”

---

## Checkpoint anterior — 23/11/2026 — Banco de Dados 11–14 publicadas

Escopo exclusivo: `banco-de-dados-sec-11` a `banco-de-dados-sec-14`, examinadas integralmente com dois callouts. Nenhum cartão, mnemônico ou diagrama existente nessas quatro seções. Identidades, títulos e ordem preservados. Seções 01–10 e demais lotes publicados não reaplicados.

Cobertura acumulada: **36/52 seções existentes**, seis tópicos integrais. Banco de Dados fecha **14/14** no conjunto dos três lotes delimitados, não por amostragem. Restam **16 seções existentes** e três pacotes de lacuna em dry-run. Informática permanece parcial.

### Achados e correções

| Seção | Decisão aplicada |
| --- | --- |
| 11 — Modelagem dimensional | Supridas definições de fatos/dimensões e grão para dar contexto à estrela. Tamanho não define tipo de tabela. Floco de neve caracterizado pela normalização de dimensões, não apenas por acrescentar tabelas. Diferenciada estrela básica de ambiente com múltiplos fatos; sem promessa universal de desempenho. |
| 12 — Data mining | Mantida descoberta de padrões e distinção de consulta simples. Retirada interpretação de proibição de queries/SQL, que podem participar do processo. Acrescentadas tarefas usuais, avaliação e incerteza, sem prometer padrões úteis automaticamente nem inferir causalidade de associação. Retiradas caixas altas sem função didática; callout alinhado e desduplicado em relação à antiga repetição literal. |
| 13 — BI | BI definido como processos/práticas/ferramentas para apoiar decisão, não como o ato de decidir. Fontes DW/DM contextualizadas sem exclusividade. Acrescentados exemplos concisos de recursos e limites de interpretação, sem ampliar funcionalidade da aplicação. |
| 14 — OLTP × OLAP | Preservado contraste operacional/analítico, retiradas garantia universal de tempo real e desqualificação absoluta do valor decisório do OLTP. OLAP não implica somente inserção ou carga diária; separado de DW. Corrigido erro principal: slice/dice são recortes; troca de eixos é pivot. Drill-down/roll-up conferidos e preservados com exemplos. Callout ampliado para evitar a contradição anterior. |

Não foram acrescentados diagramas ou cartões para preencher artificialmente o lote. Exemplos são didáticos, sem dados pessoais reais. As quatro seções receberam correções; nenhum outro tópico teve conteúdo examinado. O inventário de IDs/títulos de Segurança da Informação foi consultado apenas para delimitar o próximo prompt (quatro seções).

### Fontes primárias conferidas em 23/11/2026

Consultados trechos pertinentes das fontes autorais/institucionais abaixo; não se atribui leitura integral. Recomendações específicas de produto não foram universalizadas.

- [Microsoft — Star schema e snowflake](https://learn.microsoft.com/en-us/power-bi/guidance/star-schema): fatos, dimensões, grão, estrela e normalização das dimensões no floco de neve. Conteúdo acessível apesar do aviso genérico de autorização no cabeçalho. Complemento autoral: [Ralph Kimball — Fact Tables, 05/11/2008](https://www.kimballgroup.com/2008/11/fact-tables/), declaração do grão e eventos de medição, usado como fundamento estável, não novidade de 2026.
- [IBM — Data mining](https://www.ibm.com/think/topics/data-mining): tarefas usuais, preparação e avaliação dos resultados. [Oracle 19 — What Is Data Mining?](https://docs.oracle.com/en/database/oracle/oracle-database/19/dmcon/what-is-data-mining.html): modelos, consulta simples, avaliação e integração a ferramentas de query/relatórios. URLs tentadas na versão 26 não foram recuperadas; usada a página 19 acessível para fundamentos, sem recomendação de versão ou afirmação de que seja a mais recente. A equiparação KDD/mineração presente na página não foi adotada, pois o escopo não revisa essa taxonomia.
- [NIST/SEMATECH — Scatter Plot, seção 1.3.3.26](https://www.itl.nist.gov/div898/handbook/eda/section3/scatterp.htm): associação observada não prova causalidade. Usado somente esse fundamento estatístico, sem acrescentar gráficos ao conteúdo.
- [IBM — Business Intelligence](https://www.ibm.com/think/topics/business-intelligence): processos de coleta/gestão/análise, fontes e apresentação para apoiar estratégias e operações. Qualificações sobre decisão e qualidade são síntese editorial conservadora, sem prometer resultados.
- [Microsoft — Online Analytical Processing](https://learn.microsoft.com/en-us/azure/architecture/data-guide/relational-data/online-analytical-processing), atualização indicada em 22/04/2025: perfil de carga, análise em tempo real e arquiteturas híbridas como contraponto a proibições absolutas. [IBM — OLAP](https://www.ibm.com/think/topics/olap), trechos sobre drill-down, roll-up, slice, dice e pivot: operações e exemplos. Não reproduzidas comparações absolutas de desempenho de produtos/implementações.

### Publicação e verificação

Pasta exclusiva: `orquestracao-03-54/saneamento-onda-7/39-informatica/banco-11-14-20261123/`; executor `../banco-11-14-lote.mjs`. SHA-256: `ec5f4f096125c913b7bbf4df821b72875f6076ea1f7c9da48cc0bbe9134f4782`.

- Pré-imagem atual de 15 tópicos/52 seções preservada, em paridade inicial com Banco 06–10. Proposta ampla não rastreada consultada somente no recorte 11–14; demais itens não aplicados.
- Dry-run do CLI existente aprovado com 14 seções por exigência de `--preserve-flashcards`. Seções 01–10 copiadas intactas apenas na validação. SQL decodificado e conferido: exatamente quatro updates 11–14, nenhuma inserção; não aplicada carga de 14 seções.
- Ensaio transacional com rollback aprovado. Publicação atômica pelo mecanismo existente, condicionada a revisão esperada, identidade e tópico ativo. Sem schema, segurança, código da aplicação, dependências, credenciais ou dados pessoais alterados.
- Reconciliação posterior integral aprovada: 15 tópicos/52 seções sem ausentes, extras ou divergências; quatro novas revisões. Conteúdo e IDs de revisão das demais **48 seções preservados**, com asserção explícita. `target: preimagem` compara o estado esperado já corrigido, não significa rollback.
- **24/24 verificações visuais**: quatro seções × Light/Dark/Sepia × 375/1200 px, sem overflow global ou erro de fórmula. Dois callouts e capturas conferidos. Nenhum mapa presente ou alterado no lote.
- Sintaxe do executor e diff conferidos. Os 49 testes de conteúdo já aprovados no lote 06–10 não foram repetidos: não houve mudança de contrato, validador, renderizador ou Mermaid. O novo payload passou pelo dry-run atual. Sem workflows globais/lint/build/audit/auth pela ausência de alterações de aplicação.
- Harness com componentes reais e CSS compilado de `questoes-experiencia-20261122`; não certifica toda a navegação autenticada nem todos os editais. Conta de aluno dispensada.

Reprodução: CLI `import-batch <pasta/import> --dry-run --preserve-flashcards`; `node <pasta/validar-visual.cjs> <pasta/render.json>` na raiz editorial. Recibos preservados. Não reaplicar SQL concluído.

Próximo prompt: “Revise somente Segurança da Informação 01–04, conforme relatório 39. Preserve os lotes publicados, publique com proteção de concorrência, reconcilie e pare.”

---

## Checkpoint anterior — 23/11/2026 — Banco de Dados 06–10 publicadas

Escopo exclusivo: `banco-de-dados-sec-06` a `banco-de-dados-sec-10`, examinadas integralmente com dois callouts e um diagrama ETL. Nenhum cartão ou mnemônico existente no lote. Identidades, títulos e ordem preservados. Seções 01–05 e 11–14 não reaplicadas; 11–14 permanecem pendentes.

Cobertura acumulada: **32/52 seções existentes**, cinco tópicos integrais e Banco de Dados **10/14**. Restam **20 seções existentes** e três pacotes de lacuna em dry-run. Informática permanece parcial.

### Achados e correções

| Seção | Decisão aplicada |
| --- | --- |
| 06 — Tupla / Registro | Esclarecido que a tupla reúne valores dos atributos, não as definições das colunas. Preservada equivalência didática com linha; acrescentado exemplo fictício simples com unidade/restrições dependentes do projeto. |
| 07 — Relacionamentos | Corrigidos binário como padrão obrigatório, representação universal por verbos e “simultâneo = ida e volta”. Grau, atributos de relacionamento e restrições de coexistência separados; retirada classificação rígida sustentada por exemplos tributários inadequados, preservando as noções de independência, dependência e exclusividade como regras de domínio. Máximos separados de mínimos; mantidos exemplos 1:1, 1:N, M:N e secretária/departamento sob regras explícitas. Hospedagens contextualizadas no histórico; matrícula condicionada ao projeto. A seção anunciava leitura de diagrama inexistente: leitura reformulada em texto e condicionada à notação/legenda, sem inventar um diagrama. |
| 08 — DW e DM | Integração lógica não confundida com única máquina. Mantidas quatro características clássicas; não volatilidade qualificada para não proibir manutenção, retenção ou correções. ETL não exclusivo, com referência a ELT. Data Mart pode ser dependente ou independente. Granularidade explicitada por grão fino/grosso e pelo significado de cada linha, evitando relação universal ambígua alta/baixa. Hierarquia País→Estado→Cidade→Bairro preservada em texto, sem fórmula matemática desnecessária; esclarecido que não define todo o grão do fato. Callout corrigido. |
| 09 — Abordagens de DW | Bottom-up não reduzido a juntar silos; incluídas integração planejada e dimensões conformadas da abordagem Kimball. Top-down não exige concluir todos os dados corporativos antes de qualquer entrega e marts não são obrigatoriamente somente sumarizados. Retirada desvantagem inevitável de consolidação. |
| 10 — ETL | Staging não imposta como repositório separado obrigatório; fases distinguidas de implementação e da execução paralela de partições. Mantidos exemplos com unidades quadradas, explicitando conversão numérica. Acrescentada distinção sucinta ELT. Corrigidos aspas/colchetes quebrados e rótulos fragmentados do mapa; fluxo simplificado sem staging obrigatório. Callout alinhado. |

### Fontes primárias conferidas em 23/11/2026

Consultados trechos pertinentes; não se declara leitura integral das publicações. Fontes antigas fundamentam conceitos estáveis, sem serem apresentadas como publicações de 2026.

- University of Cape Town, notas autorais de ensino: [modelo relacional/tupla](https://www.cs.uct.ac.za/mit_notes/database/htmls/chp02.html) e [relacionamentos e participação](https://www.cs.uct.ac.za/mit_notes/database/htmls/chp06.html); [PostgreSQL — Table Basics](https://www.postgresql.org/docs/current/ddl-basics.html): linha/valores, modelos, cardinalidades e participação. Complemento: [OpenDSA/Virginia Tech — ERD Components](https://opendsa-server.cs.vt.edu/ODSA/Books/Database/html/ERDComponents.html), trechos textuais sobre grau, atributos e relacionamentos. Widgets do OpenDSA não usados como prova funcional.
- [Database Management Systems — slides dos autores, capítulo 2](https://pages.cs.wisc.edu/~dbbook/openAccess/secondEdition/slides/slides2ed6-english/Chapter2-6.pdf): discussão binário/ternário e preservação de restrições. Texto extraído do PDF estava ilegível; uso limitado ao trecho indexado sobre escolha de representação. [Slides de Database System Concepts em Yale](https://codex.cs.yale.edu/avi/db-book/Previous-editions/db4/slide-dir/ch2-2.pdf) corroboram no índice a possibilidade de perder correspondência de instâncias; acesso direto retornou 502. Não se atribui leitura integral. Página de curso de Ontario Tech consultada foi excluída da fundamentação por expor geração por IA.
- [Oracle Database 26 — DW Concepts](https://docs.oracle.com/en/database/oracle/oracle-database/26/dwhsg/introduction-data-warehouse-concepts.html): finalidade analítica, quatro características, integração, atualizações de carga e arquiteturas. A definição clássica de não volatilidade foi contextualizada com tarefas operacionais, sem negar seu propósito de preservar histórico. URLs iniciais com “warehousing” retornaram 404; o endereço correto acima foi recuperado.
- [Oracle — Data Mart Concepts](https://docs.oracle.com/html/E10312_01/dm_concepts.htm), documentação histórica 10g: distinção entre marts dependentes/independentes. Não utilizados limites antigos de tamanho, prazos ou recomendações de produto.
- [Ralph Kimball — Fact Tables, 05/11/2008](https://www.kimballgroup.com/2008/11/fact-tables/): declaração do grão e detalhe; o próprio texto também descreve fatos de snapshot acumulado atualizados, afastando a proibição técnica universal de alteração.
- [Kimball Group — Enterprise DW Bus Architecture](https://www.kimballgroup.com/data-warehouse-business-intelligence-resources/kimball-techniques/kimball-data-warehouse-bus-architecture/) e [Margy Ross — Differences of Opinion, 03/03/2004](https://www.kimballgroup.com/2004/03/differences-of-opinion/): integração por dimensões conformadas, entrega incremental, arquitetura corporativa e apresentação detalhada/sumarizada. Esta última é a perspectiva da coautora de Kimball sobre as duas abordagens, não documento escrito por Inmon.
- [Microsoft — ETL/ELT, Azure Architecture Center](https://learn.microsoft.com/en-us/azure/architecture/data-guide/relational-data/etl): fases, transformações, staging frequente e processamento por partições; distinção ELT. Usado texto acessível apesar do aviso genérico de autorização no cabeçalho, sem universalizar produtos Azure.

Exemplos são didáticos e condicionados às regras do domínio. A preferência por declarar o grão e não usar “granularidade alta/baixa” isoladamente é uma decisão editorial de clareza; não se promete que todos os editais empreguem a mesma convenção. Nenhuma regra tributária foi revisada ou publicada neste lote.

### Publicação e verificação

Pasta exclusiva: `orquestracao-03-54/saneamento-onda-7/39-informatica/banco-06-10-20261123/`; executor `../banco-06-10-lote.mjs`. SHA-256: `5eb0793e9dcbc3ae24f528bf924297dd5ae606ce7fbe5a3c887ee94b8bd3e0e4`.

- Pré-imagem atual de 15 tópicos/52 seções preservada; paridade inicial com o resultado de Banco 01–05. Proposta ampla não rastreada consultada somente nas seções deste lote, sem aplicação dos demais itens.
- Dry-run existente aprovado com 14 seções por exigência de `--preserve-flashcards`; demais nove copiadas intactas apenas para validação. SQL decodificado: exatamente cinco updates 06–10, nenhuma inserção; nenhuma carga de 14 seções aplicada.
- Ensaio com rollback aprovado; publicação atômica condicionada a revisão esperada, identidade e tópico ativo pelo mecanismo existente. Sem schema, segurança, código da aplicação, dependências, credenciais ou dados pessoais alterados.
- Reconciliação integral posterior aprovada: 15 tópicos/52 seções, sem ausentes, extras ou divergências; cinco novas revisões. Conteúdo e IDs de revisão das demais **47 seções preservados**, com asserção explícita. `target: preimagem` compara o estado esperado corrigido, não indica rollback.
- **30/30 verificações visuais**: cinco seções × Light/Dark/Sepia × 375/1200 px, sem overflow global ou erro KaTeX. Fórmulas de unidades e dois callouts conferidos. Mapa ETL renderizado e exercitado com zoom, restauração e overlay nas seis combinações; validador compartilhado aprovou o payload e rejeitou três controles maliciosos.
- **49/49 testes `npm run test:content` aprovados** no worktree limpo do site, incluindo contrato e segurança Mermaid; saída preservada em `test-content.txt`. Sintaxe do executor e diff conferidos.
- Harness com componentes reais e CSS compilado de `questoes-experiencia-20261122`; não certifica toda a navegação autenticada ou todos os editais. Conta de aluno dispensada. Sem lint/build/audit/auth globais, pois não houve alteração de renderizador, aplicação, dependências ou autenticação; esta é revisão editorial, não correção de segurança da aplicação.

Reprodução: CLI `import-batch <pasta/import> --dry-run --preserve-flashcards`; `node <pasta/validar-visual.cjs> <pasta/render.json>` na raiz editorial; `npm run test:content` no site. Recibos preservados. Não reaplicar SQL concluído.

Próximo prompt: “Revise somente Banco de Dados 11–14, conforme relatório 39. Preserve os lotes publicados, publique com proteção de concorrência, reconcilie e pare.”

---

## Checkpoint anterior — 23/11/2026 — Banco de Dados 01–05 publicadas

Escopo exclusivo: `banco-de-dados-sec-01` a `banco-de-dados-sec-05`, examinadas integralmente com quatro callouts e um mnemônico ACID. Nenhum cartão ou diagrama existente. Identidades, títulos, ordem e ACID preservados. Seções 06–14 não revisadas nem reaplicadas.

Cobertura acumulada: **27/52 seções existentes**, cinco tópicos integrais e Banco de Dados **5/14**. Restam **25 seções existentes** e três pacotes de lacuna em dry-run. Informática permanece parcial.

### Achados e correções

| Seção | Decisão aplicada |
| --- | --- |
| 01 — Banco de dados e Sgbd | ACID definido como propriedades transacionais, não requisitos de qualquer BD. Corrigidas impossibilidade de concorrência e durabilidade como irreversibilidade absoluta; consistência vinculada a restrições e transação correta. Diferenciados tipo inteiro e restrição não negativa. Dicionário não limitado universalmente a tabelas somente de leitura; metadados atualizados por operações controladas. Soma SGBD+BD contextualizada como núcleo, removendo fórmula categórica contraditória com a descrição do ambiente. Removida tabela genérica “consulte as seções” sem conteúdo didático. Exemplos de regras rígidas de telefone/sexo substituídos por restrição de nota; lista de SGBDs mantida com exemplos atuais, sem Paradox legado. Callout alinhado. |
| 02 — Abstração | Esclarecidos esquemas externo, conceitual e interno. Retirada expressão ambígua “nível seguinte”; distinguidas independência física/lógica e necessidade de ajustar mapeamentos. Não prometida transparência para qualquer mudança. Visão arquitetural diferenciada de view SQL e das etapas de modelagem. Callout alinhado. |
| 03 — Modelagem | Retirada obrigação de CASE e de SGBD específico no modelo lógico. Implementação física não definida apenas por nomes/tipos de colunas. ER separado de relacional; tipo/ocorrência de entidade distinguidos. Entidade fraca descrita pela identificação com proprietária/chave parcial e participação obrigatória; dependência de existência isolada é insuficiente. Callout alinhado. |
| 04 — Tabela | Relação pertence ao modelo relacional, não ao MER. Corrigida promessa de uma tabela armazenar tudo sobre um elemento. Diferenciada relação matemática de tabela SQL quanto a repetição e ordem, sem ampliar para comandos de consulta. |
| 05 — Atributo / Campo | Atributos simples/compostos e mono/multivalorados dependem do modelo; endereço não é sempre composto/multivalorado. NULL distinguido de “valor vazio”. Corrigida multiplicidade de PK: uma restrição por tabela, possivelmente composta. Retirada regra inventada de PK no losango. Candidata como conjunto mínimo; alternativas e exemplos condicionados às regras do cadastro. FK pode ser composta, autorreferente, não única e nullable conforme restrições; referência não limitada exclusivamente a PK. Callout alinhado. |

### Fontes primárias conferidas em 23/11/2026

Consultados trechos pertinentes, sem atribuir leitura integral das publicações. Documentação de produto fundamenta exemplos de implementação, não regras universais sobre todo SGBD.

- PostgreSQL, documentação corrente: [transações](https://www.postgresql.org/docs/current/tutorial-transactions.html), [níveis de isolamento](https://www.postgresql.org/docs/current/transaction-iso.html), [restrições](https://www.postgresql.org/docs/current/ddl-constraints.html), [catálogos](https://www.postgresql.org/docs/current/catalogs.html) e [tabelas](https://www.postgresql.org/docs/current/ddl-basics.html). Atomicidade/durabilidade, concorrência, metadados, PK/FK/NULL e ausência de ordem implícita. Não houve alteração da versão do banco de produção.
- [Microsoft Learn — PK e FK](https://learn.microsoft.com/en-us/sql/relational-databases/tables/primary-and-foreign-key-constraints?view=sql-server-ver17): unicidade, composição e uma PK por tabela. Usado conteúdo acessível da página, apesar de aviso genérico de autorização no cabeçalho; não se atribuem limites específicos do SQL Server a outros sistemas.
- [IBM — Data Modeling](https://www.ibm.com/think/topics/data-modeling) e [IRS — Database Design Techniques and Deliverables](https://www.irs.gov/irm/part2/irm_02-005-013), especialmente item 2.5.13.5 de 12/12/2024: modelagem lógica independente de produto, física e variação terminológica entre métodos.
- Notas autorais de ensino da University of Cape Town: [arquitetura de três esquemas](https://www.cs.uct.ac.za/mit_notes/database/htmls/chp01.html), [modelo relacional](https://www.cs.uct.ac.za/mit_notes/database/htmls/chp02.html) e [ER, chaves e entidade fraca](https://www.cs.uct.ac.za/mit_notes/database/htmls/chp06.html). Material acadêmico de fundamentos. O trecho de independência física contém aparente lapso “not transparent”, contraditório com o parágrafo anterior; não foi reproduzido como regra. Aplicou-se a distinção conceitual confirmada pela arquitetura e pelos exemplos.
- [OpenDSA/Virginia Tech — ERD Basic Components](https://opendsa-server.cs.vt.edu/ODSA/Books/Database/html/ERDComponents.html), material com atualização indicada em 05/03/2023: atributos compostos/multivalorados, tipo/ocorrência e identificação fraca. Consultado texto acessível; widgets interativos exibiam erro e não foram usados como evidência de funcionamento. Página alternativa de Loyola sobre ER retornou 403, não usada como leitura acessível.

Exemplos de notas, apartamentos e itens de pedido são didáticos e condicionados ao domínio. Não foram criadas tabelas, entidades ou restrições reais no banco de produção.

### Publicação e verificação

Pasta exclusiva: `orquestracao-03-54/saneamento-onda-7/39-informatica/banco-01-05-20261123/`; executor `../banco-01-05-lote.mjs`. SHA-256: `37592af9314ed991e69bebf65ffd46f067a5b7a3cb690d20f179f8af300c0440`.

- Pré-imagem atual de 15 tópicos/52 seções preservada; paridade inicial com o resultado de Teoria da Informação. Proposta ampla não rastreada consultada apenas em 01–05, sem aplicar os outros itens.
- Dry-run aprovado pelo CLI existente com 14 seções por exigência de `--preserve-flashcards`. Seções 06–14 copiadas intactas apenas para validação. SQL decodificado e conferido: exatamente cinco updates 01–05, nenhuma inserção; não aplicada carga de 14 seções.
- Ensaio transacional com rollback aprovado; publicação atômica pelo mecanismo existente condicionada a revisão esperada, identidade e tópico ativo. Nenhuma alteração de schema, segurança, aplicação, dependência, credencial ou dado pessoal.
- Reconciliação posterior integral: 15 tópicos/52 seções sem ausentes, extras ou divergências; cinco novas revisões. Conteúdo e IDs de revisão das demais **47 seções preservados**, com asserção explícita. Rótulo `target: preimagem` compara o estado esperado corrigido, não significa rollback.
- **30/30 verificações visuais**: cinco seções × Light/Dark/Sepia × 375/1200 px, sem overflow global ou erro de fórmula. Quatro callouts e ACID conferidos. Nenhum Mermaid alterado ou presente no lote; não repetidos testes de mapas já válidos.
- Harness local com componentes reais e CSS compilado de `questoes-experiencia-20261122`; não certifica toda a navegação autenticada ou todos os editais. Conta de aluno dispensada. Sintaxe do executor e diff verificados; sem lint/build globais porque código e contratos da aplicação não mudaram.

Reprodução: CLI `import-batch <pasta/import> --dry-run --preserve-flashcards`; `node <pasta/validar-visual.cjs> <pasta/render.json>` na raiz editorial. Recibos preservados. Não reaplicar SQL concluído.

Próximo prompt: “Revise somente Banco de Dados 06–10, conforme relatório 39. Preserve os lotes publicados, publique com proteção de concorrência, reconcilie e pare.”

---

## Checkpoint anterior — 23/11/2026 — Teoria da Informação publicada

Escopo exclusivo: `teoria-da-informacao-sec-01` — Dado, Informação, Conhecimento e Inteligência. Examinados integralmente texto, callout e diagrama; nenhum cartão ou mnemônico existente. Identidades, título, ordem e código do mapa preservados. Nenhum lote anterior reaplicado.

Cobertura acumulada: **22/52 seções existentes**, cinco tópicos integrais. Teoria da Informação **1/1**. Restam **30 seções existentes** e três pacotes de lacuna em dry-run. Informática permanece parcial.

### Achados e correções

- A sequência dado–inteligência era apresentada como explicação universal e automática do entendimento humano. Passou a ser explicitamente um modelo didático da gestão da informação, preservando o recorte temático da seção.
- Dados semiestruturados eram confundidos com campos livres e estrutura estabelecida apenas depois. Corrigidos para organização por chaves, hierarquia ou marcações, com exemplos JSON/XML e possibilidade de esquema de validação.
- Dados não estruturados eram definidos como totalmente sem estrutura, com predominância atual não quantificada. Corrigida a distinção entre esquema tabular e formato interno; retirada a generalização sem contexto. Exemplo rígido de telefone numérico/nome limitado substituído por tabela didática de matrícula, data e nota.
- Retirada proibição absoluta de informação conter conclusões. Conhecimento tácito/explicito esclarecido, sem reduzir conhecimento a armazenamento de informação.
- Inteligência distinguida da própria decisão/execução. Removidas garantias de precisão e vantagem; acrescentado exemplo didático integrado e alinhado o callout. Mapa linear mantido como síntese da sequência, contextualizado no texto e callout como modelo didático.

### Fontes primárias conferidas em 23/11/2026

- [IBM — What is Data?](https://www.ibm.com/think/topics/data): material autoral do fabricante, trechos de definição e classificação (structured, semi-structured e unstructured). Fundamenta organização, exemplos e coexistência de tipos; não usado para estimar proporção universal de dados.
- [ENAGRO — Gestão do Conhecimento](https://enagro.agricultura.gov.br/gestao-do-conhecimento/gestao-do-conhecimento-1): página institucional publicada em 14/04/2020 e modificada em 15/04/2020, recuperada nesta conferência. Evidência da abordagem adotada pelo órgão sobre experiência, conhecimento tácito/explicito e mobilização para a ação; a página referencia autores, não foi apresentada como pesquisa original desses autores.
- [ABIN — Memórias da Pandemia](https://www.gov.br/abin/pt-br/centrais-de-conteudo/publicacoes/memorias-da-pandemia/memorias-da-pandemia-1/@@download/file): trecho indexado oficial distingue assessoramento de decisão. Complemento: [Doutrina da Atividade de Inteligência (2023)](https://www.gov.br/abin/pt-br/centrais-de-conteudo/publicacoes/doutrina/Doutrina-da-Atividade-de-Inteligencia-2023), trecho indexado sobre produção e difusão para assessorar. A página direta e o PDF da doutrina exigiram desafio antirobô; não se declara leitura integral desses documentos. Uso restrito ao assessoramento no contexto institucional, sem universalizar doutrina de inteligência de Estado para toda organização.

As formulações sobre inexistência de automatismo, fronteiras flexíveis e ausência de garantia são qualificações editoriais conservadoras da síntese adotada. O exemplo de notas é didático, não dado empírico. Não foi ampliado o tópico para teoria matemática da informação nem outros conteúdos ausentes do recorte coletado.

### Publicação e verificação

Pasta exclusiva: `orquestracao-03-54/saneamento-onda-7/39-informatica/teoria-informacao-20261123/`; executor `../teoria-informacao-lote.mjs`. SHA-256: `44c05a05aabaf751c646a0c41a011017e11dbc9afe21d829907fc7d4ceb31c9f`.

- Pré-imagem atual de 15 tópicos/52 seções preservada, em paridade inicial com Redes 06–08. Proposta ampla não rastreada consultada somente nesta seção, sem aplicar os demais itens.
- Dry-run do CLI existente aprovado para um tópico/uma seção, preservando flashcards. SQL decodificado e conferido: exatamente um update, nenhuma inserção.
- Ensaio transacional com rollback aprovado. Publicação atômica condicionada à revisão esperada, identidade e tópico ativo, pelo mecanismo existente. Sem schema, aplicação, dependências, credenciais ou dados pessoais alterados.
- Reconciliação integral posterior: 15 tópicos/52 seções, sem ausentes, extras ou divergências; uma nova revisão. Conteúdo e IDs de revisão das demais **51 seções preservados**, com asserção explícita no executor. O rótulo `target: preimagem` usa o estado esperado já corrigido e não indica rollback.
- **6/6 verificações visuais**: Light/Dark/Sepia × 375/1200 px, sem overflow global ou erro de fórmula. Mapa preservado exercitado com zoom, restauração e overlay nas seis combinações; callout e capturas conferidos. Nenhuma alteração Mermaid para justificar repetir testes maliciosos já válidos.
- Harness local com componentes reais e CSS compilado de `questoes-experiencia-20261122`; não certifica a navegação autenticada integral. Conta de aluno dispensada. Sintaxe do executor e diff verificados; sem lint/build globais porque código e contratos da aplicação não mudaram.

Reprodução: CLI `import-batch <pasta/import> --dry-run --preserve-flashcards`; `node <pasta/validar-visual.cjs> <pasta/render.json>` na raiz editorial. Recibos imutáveis preservados. Não reaplicar SQL concluído.

Próximo prompt: “Revise somente Banco de Dados 01–05, conforme relatório 39. Preserve os lotes publicados, publique com proteção de concorrência, reconcilie e pare.”

---

## Checkpoint anterior — 23/11/2026 — Redes de Computadores 06–08 publicadas

Escopo exclusivo: `redes-de-computadores-sec-06` a `redes-de-computadores-sec-08`, examinadas integralmente com dois callouts e um mnemônico RITA. Nenhum cartão ou diagrama existente nessas seções. Identidades, títulos, ordem e mnemônico preservados; três tabelas incluídas para organizar o conteúdo e suprir a comparação TCP/UDP anunciada e ausente.

Cobertura acumulada: **21/52 seções existentes**, quatro tópicos integrais, incluindo Redes de Computadores **8/8** nos dois lotes. Restam **31 seções existentes** e três pacotes de lacuna em dry-run. Informática permanece parcial. Hardware, Internet/Intranet, Ameaças Virtuais e Redes 01–05 não foram reaplicados.

### Achados e correções

| Seção | Decisão aplicada |
| --- | --- |
| 06 — Arquitetura TCP/IP | Contextualizado o modelo de quatro camadas e sua diferença em relação ao agrupamento didático em cinco. Acrescentadas funções/exemplos por camada, sem equivalência mecânica com OSI. RITA conferido e preservado. |
| 07 — IP e endereçamento | Corrigida atribuição automática de endereços ao IP e identificação permanente de dispositivo. Separadas fragmentação IPv4/IPv6 e limites em bytes: 65.535 no total IPv4, carga útil IPv6 e exceção de jumbogramas. Preservado exemplo binário correto. Faixas privadas expressas por prefixos; corrigidos 0.0.0.0, loopback /8, broadcast e dependência da máscara. IPv6 com compressão, exemplo reservado à documentação e ausência de broadcast. Callout alinhado. |
| 08 — TCP e UDP | Suprida tabela ausente. Diferenciados fluxo de bytes/datagramas, conexão, entrega/ordem e controle de fluxo/congestionamento. Retirada oposição absoluta entre confiabilidade e velocidade. Explicitados limites de falha, criptografia adicional e protocolos sobre UDP; callout alinhado. |

### Fontes primárias conferidas em 23/11/2026

Consultados os trechos pertinentes das especificações, não a integralidade de cada RFC. Datas abaixo são das publicações; a conferência é desta revisão.

- [RFC 1122 (1989)](https://www.rfc-editor.org/rfc/rfc1122.html): arquitetura, camadas e melhor esforço. Agrupamento em cinco camadas apresentado como convenção didática, não novo padrão obrigatório.
- [RFC 791 (1981)](https://www.rfc-editor.org/rfc/rfc791.html): IPv4, comprimento total e fragmentação; [RFC 2131 (1997)](https://www.rfc-editor.org/rfc/rfc2131.html): configuração por DHCP.
- [RFC 1918 (1996)](https://www.rfc-editor.org/rfc/rfc1918.html) e [registro IANA de IPv4 especial](https://www.iana.org/assignments/iana-ipv4-special-registry/): faixas privadas e endereços especiais. O registro consultado indica atualização em 09/10/2025.
- [RFC 8200 (2017)](https://www.rfc-editor.org/rfc/rfc8200.html), [RFC 4291 (2006)](https://www.rfc-editor.org/rfc/rfc4291.html), [RFC 2675 (1999)](https://www.rfc-editor.org/rfc/rfc2675.html) e [RFC 3849 (2004)](https://www.rfc-editor.org/rfc/rfc3849.html): IPv6, interfaces/sintaxe, fragmentação, jumbogramas e prefixo de documentação.
- [RFC 9293 (2022)](https://www.rfc-editor.org/rfc/rfc9293.html), [RFC 768 (1980)](https://www.rfc-editor.org/rfc/rfc768.html), [RFC 8085 (2017)](https://www.rfc-editor.org/rfc/rfc8085.html) e [RFC 9000 (2021)](https://www.rfc-editor.org/rfc/rfc9000.html): TCP, UDP, responsabilidades da aplicação e QUIC. RFC 9293 usada como especificação atual de TCP, em vez da substituída RFC 793.

### Publicação e verificação

Pasta exclusiva: `orquestracao-03-54/saneamento-onda-7/39-informatica/redes-06-08-20261123/`; executor `../redes-06-08-lote.mjs`. SHA-256: `4b5dc6bbc259d9bc589c90efb0caa1c5fd865f6032c478842046194dc9ba7cbc`.

- Pré-imagem atual de 15 tópicos/52 seções preservada e paridade inicial com o resultado de Redes 01–05. Propostas amplas não rastreadas não aplicadas.
- Dry-run aprovado com oito seções por exigência de `--preserve-flashcards`; 01–05 intactas apenas na validação. SQL decodificado e conferido: exatamente três updates 06–08, nenhuma inserção.
- Ensaio com rollback aprovado; publicação atômica pelo mecanismo existente, condicionada a revisão/identidade e tópico ativo. Sem alteração de schema, aplicação, dependências, credenciais ou dados pessoais.
- Reconciliação posterior integral aprovada: 15 tópicos/52 seções sem ausentes, extras ou divergências; três novas revisões. Demais 49 seções preservadas. O rótulo genérico `target: preimagem` compara o estado esperado já corrigido, não indica rollback.
- **18/18 verificações visuais**: três seções × Light/Dark/Sepia × 375/1200 px, incluindo nove checagens de tabela no celular. Sem overflow global nem erro de fórmula. Tabelas largas usam rolagem interna, exercitada pelo harness; callouts e RITA conferidos em capturas. Nenhum Mermaid alterado, portanto sem repetição de testes de mapas já válidos.
- Harness local com componentes reais e CSS compilado de `questoes-experiencia-20261122`; conta de aluno dispensada. Não certifica toda a navegação autenticada nem todos os editais. Sem lint/build globais porque código/contratos não mudaram; sintaxe do executor e diff verificados.

Reprodução: `import-batch <pasta/import> --dry-run --preserve-flashcards` pelo CLI do site; `node <pasta/validar-visual.cjs> <pasta/render.json>` na raiz editorial. Recibos preservados. Não reaplicar SQL concluído.

Próximo prompt: “Revise somente Teoria da Informação, conforme relatório 39, até cinco seções. Preserve os lotes publicados, publique com proteção de concorrência, reconcilie e pare.”

---

## Checkpoint anterior — 23/11/2026 — Redes de Computadores 01–05 publicadas

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
