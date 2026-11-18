# Plano de revisão das disciplinas — PRO Resumos

Atualizado em 17/11/2026. Escopo: resumos e seus componentes didáticos. A fila alfabética completa está em `disciplinas.txt`; as quantidades são da coleta de 15/11/2026 e precisam ser revalidadas ao iniciar cada disciplina.

## Situação consolidada

54 disciplinas: nenhuma com revisão integral encerrada, duas com revisão parcial e 52 não iniciadas. Aplicar correções e publicar não significa concluir a revisão editorial.

| Ordem | Disciplina | Estado confirmado | Trabalho restante |
|---|---|---|---|
| 01 | Administração de Recursos Materiais (ARM) | Correções conferidas no banco em 15/11; 11 tópicos, 33 seções. Fotografia original sem flashcards. | Revalidar o estado atual; concluir fontes por achado, exemplos calculados, coerência entre componentes e inspeção dos 14 diagramas nos três temas, conforme relatório 01. |
| 02 | Administração Financeira e Orçamentária (AFO) | Correções aplicadas em 17/11; reconciliação às 13h11: 48 seções, cinco seções alteradas e 100 flashcards preservados. Publicação registrada na main em `949c636`, com deploy de produção confirmado às 13h13. | Conferência visual autenticada em produção; completar rastreabilidade das afirmações relevantes, avaliar omissões e tópicos sem seções. Manter os limites dos testes visuais anteriores. |
| 03 | Administração Geral | Não iniciada; 13 tópicos na coleta inicial. | Primeira nova disciplina da fila, após o registro de encerramento ou das pendências expressas de ARM e AFO. |
| 04–54 | Demais disciplinas | Não iniciadas. | Seguir exatamente a ordem alfabética de `disciplinas.txt`, com um relatório próprio por disciplina. |

A correspondência entre o Supabase da aplicação e o utilizado pelo site público foi conferida na publicação de AFO. O site e o login responderam HTTP 200; a página protegida redirecionou para login sem sessão. Isso não substitui a conferência visual com conta autorizada. ARM permaneceu inalterada durante a aplicação de AFO; essa comparação não encerra sua revisão editorial.

## Sequência de execução

1. Retomar ARM e classificar cada pendência do relatório 01 como verificada, corrigida ou ainda aberta, com evidência. Não repetir a carga já aplicada por causa de instruções históricas.
2. Encerrar as verificações remanescentes de AFO no relatório 02. Não repetir as cinco correções aceitas sem novo achado. Os recibos de aplicação prevalecem sobre os estados históricos de “não aplicada”.
3. Para cada disciplina com tópicos sem seções, registrar separadamente a lacuna de cobertura. Não classificar ausência de conteúdo como conteúdo revisado; eventual produção de material novo exige fontes e revisão próprias.
4. Iniciar Administração Geral e, depois, as demais disciplinas da lista. Cada iteração deve trabalhar uma disciplina identificada pelo nome exato e pelos IDs do inventário.

Não é necessário refazer pareceres aceitos sem mudança de conteúdo, fonte ou evidência que justifique nova análise. Pendências impeditivas permanecem visíveis; não marcar conclusão por simples passagem à próxima disciplina.

## Protocolo de cada iteração

- Revalidar inventário ativo e preservar fotografia, hashes, IDs e histórico anterior. Não executar o coletor inicial sobre os snapshots existentes.
- Registrar população, seções efetivamente lidas, componentes conferidos, fontes consultadas e limites de eventual amostragem.
- Conferir legislação e referências atuais em fontes primárias, anotando dispositivo, âmbito de aplicação e data de consulta; distinguir regra vigente, histórica e doutrinária.
- Apontar erros, discrepâncias, desatualizações, redundâncias e possíveis omissões. Cada achado deve ter ID, gravidade, seção, evidência, proposta e critério de aceite.
- Preservar a separação entre ARM e AFO e as identidades de tópicos/seções. Conferir exemplos, cálculos, flashcards, callouts, mnemônicos e diagramas existentes.
- Após correção autorizada: comparar antes/depois, validar contrato e componentes afetados, reconciliar o banco e registrar publicação e limites. Alteração apenas documental não exige nova importação.
- Atualizar o relatório da disciplina, `disciplinas.txt`, este plano quando necessário e `CHANGELOG.md`; concluir com um prompt autocontido para a próxima iteração.

## Critérios de encerramento

`[x]` exige cobertura de todas as seções e componentes existentes na fotografia, confronto das afirmações relevantes com fontes atuais, tratamento dos achados e registro explícito de lacunas de cobertura. Se faltar verificação necessária, manter `[~]`.

Controlar separadamente: revisão editorial, correção preparada, aplicação ao banco, reconciliação, publicação Git/deploy e conferência autenticada em produção. Nenhum desses estados deve ser inferido dos demais. A vigência das fontes deve ser conferida novamente em cada iteração; não há certificação de atualização permanente.

## Prompt para a próxima iteração

```text
Continue o plano de revisão em C:\PRO\revisoes-resumos, exclusivamente na disciplina 01, Administração de Recursos Materiais (ARM). Leia PLANO_REVISAO_DISCIPLINAS.md, disciplinas.txt e o estado atual do relatório 01 antes dos pareceres históricos. Não use arquivos 02 de AFO como entrada de correção de ARM.

Revalide o conteúdo ativo em consulta somente leitura, preservando snapshots, IDs e dados pessoais. As correções de ARM já foram conferidas no banco em 15/11; não repita a importação automaticamente. Confira fontes primárias atuais por achado, exemplos calculados, coerência de texto/callouts/mnemônicos e os 14 diagramas nos temas Light, Dark e Sepia, revalidando a quantidade existente. Distinga teste local de conferência autenticada em produção.

Registre o que foi revisado e os limites da cobertura. Aponte erros, discrepâncias, conteúdo desatualizado, redundâncias e possíveis omissões, com seção/ID, evidência, fonte, proposta e critério de aceite. Se surgir correção nova, prepare o delta mínimo e documente antes/depois, sem gravar no banco nesta etapa de revisão. Não fabrique flashcards, fontes ou evidências.

Atualize o relatório 01, a linha 01 da lista e o changelog. Marque [x] somente se os critérios do plano forem atendidos; caso contrário mantenha [~] e enumere as pendências. Termine com um novo prompt autocontido. Não inicie AFO ou Administração Geral nesta mesma iteração.
```

## Evidências e versionamento

Consultar `APLICACAO_AFO_2026-11-17.md`, `aplicacao-afo-reconciliacao.json` e os relatórios 01/02. No site, `docs/PUBLICACAO_AFO_2026-11-17.md` registra a publicação. Este plano é espelhado em `docs/PLANO_REVISAO_DISCIPLINAS.md` no repositório do site; os snapshots e os payloads integrais permanecem no repositório local de revisões.
