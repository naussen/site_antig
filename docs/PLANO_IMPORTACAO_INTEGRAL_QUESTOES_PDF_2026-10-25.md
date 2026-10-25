# Plano de importação integral do acervo de questões de PDF

Data: 25/10/2026. Escopo: PROQuestões, banco compartilhado do PRO Resumos e artefatos em `C:\PRO\questoes`. Este documento é o roteiro de execução; **nenhuma migration nem questão foi aplicada ao banco nesta revisão**.

## 1. Decisão operacional

O acervo original possui 1.360 questões. Há 75 publicadas, 60 excluídas por decisão editorial e 38 anuladas pela banca. Restam 1.187 IDs distintos em 227 lotes locais. A meta é publicar **todas as 1.187 que passarem pelos gates abaixo**, sem publicar anuladas ou reintroduzir excluídas. Isso levaria a 1.262 questões de origem PDF publicadas, caso todas sejam comprovadas. Não confundir esse total com o acervo completo do site, que também contém questões QPYGEM anteriores.

**Veredito atual: NÃO IMPORTAR OS 227 LOTES EM BLOCO.** A validação Zod confirma formato, não procedência do gabarito, qualidade jurídica, adequação taxonômica nem disponibilidade de imagem. O relatório `C:\Users\Naussen\.gemini\antigravity\brain\975275e4-79d8-49cd-bcdb-42bbfe570e3b\relatorio_status_para_ia.md` é evidência de trabalho declarado, não atestado de publicação segura.

## 2. Estado conferido em 25/10/2026

| Verificação | Resultado observado | Consequência |
| --- | --- | --- |
| Banco remoto, snapshot somente leitura | 32 disciplinas, 340 tópicos, 187 questões publicadas no total; a migration 037 não aparece refletida nesse catálogo | Aplicar uma migration revisada antes dos lotes que dependem da nova taxonomia. |
| Lotes nas quatro pastas de `C:\PRO\questoes\scratch` | 22/80, 76/403, 22/48, 107/656; total 227/1.187, sem `external_id` duplicado entre eles nem interseção com 60 excluídas ou 75 já publicadas | A reconciliação de IDs é consistente; revalidar ao congelar os arquivos. |
| `answer_status` nos 1.187 payloads | 911 `definitivo`, 4 `definitivo_alterado`, 209 `preliminar`, 24 `preliminar_com_ressalva`, 39 ausentes | **272 candidatas ainda não têm status definitivo comprovado**. Retê-las até conciliação com a fonte da banca. Os quatro status alterados exigem evidência individual. |
| Divergência do relatório | Relatório cita 25 itens da PRF com ressalva e cinco gabaritos alterados; lotes contêm 24 e quatro com esses status | Localizar os IDs faltantes no registro de decisões e corrigir contagens ou payloads, sem presumir qual número está certo. |
| Migration 037 local, ainda não commitada no worktree | SQL contém 16 novos slugs de disciplina e 100 linhas de tópico. O relatório apresenta uma **lista divergente** de 16 slugs e prevê 47 disciplinas/434 tópicos. A migration, se aplicada ao catálogo observado, projeta 48 disciplinas e 438 tópicos: 98 tópicos novos e dois `topic_id` existentes. | Corrigir relatório, inventário e migration antes de qualquer `db push`. |
| Conflitos reais da migration 037 | `direitos-e-garantias-fundamentais` e `funcoes-essenciais-a-justica` já existem em Direito Constitucional. O SQL usa `ON CONFLICT DO UPDATE` e mudaria seus títulos; também reativaria disciplinas arquivadas e desarquivaria tópicos conflitantes. | Trocar por migração aditiva que não altera conteúdos existentes e falha em conflito inesperado. Auditar todos os IDs globais. |
| Worktree de importação | Contém alteração local em `excluded.json`, migration 037 e dezenas de PNGs ainda não commitados, além de outros arquivos gerados | Preservar tudo, congelar hashes e integrar somente após revisão. Não misturar com a checkout principal `C:\PRO\site`, que também está suja. |

As contagens de status vieram da leitura dos arquivos de lote, não da aceitação editorial das respostas. Os 336 comentários novos citados no relatório exigem revisão amostral e revisão integral dos casos jurídicos, matemáticos e com gabarito alterado. O registro `C:\PRO\questoes\scratch\registro_decisoes_1251.json` tem 1.251 entradas, mas também precisa ser confrontado com os lotes e com as fontes oficiais por ID.

## 3. Gate A — congelar e reconciliar artefatos

1. Registrar `git status`, `git diff`, commits exclusivos da branch e SHA de `origin/main`. Não limpar as alterações de outras tarefas nem copiar a migration não revisada de `C:\PRO\site`.
2. Gerar um inventário **imutável por rodada** com caminho, SHA-256, `batch_key`, fonte, fase, `external_id`, `source_content_hash`, `answer_status`, disciplina, tópico, imagem e resultado de validação dos 227 lotes. Conferir 1.187 IDs únicos, 60 exclusões, 38 anuladas e 75 publicadas; `75 + 60 + 38 + 1.187 = 1.360`. Nenhum ID pode ocupar duas classes.
3. Confrontar cada decisão em `registro_decisoes_1251.json` com o JSON de origem, PDF da prova, gabarito e lote. Localizar os itens responsáveis pelas divergências 25×24 e 5×4. Reconciliar também as quatro fases, sem confiar em totais impressos por scripts.
4. Verificar que cada `source.sha256` corresponde aos bytes do snapshot `_ATUALIZADO.json`, que o `original_source_sha256` identifica a fonte intacta e que todo asset de comentário existe. Não registrar `.env`, JWT, cookie, token ou payload integral em logs.

**Aceite:** relatório determinístico de reconciliação por ID, zero duplicatas e zero arquivos faltantes. Mudanças de lote após o congelamento exigem nova rodada completa; não aproveitar `batch_key` antigo com bytes diferentes.

## 4. Gate B — gabaritos e revisão editorial

1. **Retirar provisoriamente 272 questões do conjunto importável:** 209 preliminares, 24 `preliminar_com_ressalva` e 39 sem status. A ressalva visual no enunciado não transforma gabarito preliminar em definitivo. O próprio site só mostra comentário após responder; uma nota sobre incerteza não evita que o usuário receba correção possivelmente errada.
2. Para cada uma, localizar o gabarito definitivo da banca e identificar prova, cargo, caderno, tipo, número e eventual anulação/retificação. Registrar URL/arquivo oficial, hash, página, resposta preliminar e final. Nos 24 itens da PRF, homologar caderno 3 **item a item** com o definitivo correspondente; se não houver correspondência verificável, manter retido.
3. Conferir individualmente os quatro `definitivo_alterado` e os IDs citados no relatório como cinco. Corrigir alternativa, comentário e metadados somente com prova documental. Não marcar como definitiva uma resposta sustentada apenas por fundamentação teórica de IA.
4. Auditar os 336 comentários novos contra o gabarito validado e as fontes primárias na data da prova. Priorizar todos os itens com lei alterada, saúde, finanças, cálculo, imagem e divergência de banca. Texto de IA não equivale a revisão humana; registrar revisor, data e decisão. Reter afirmações sem suporte verificável, comentários contraditórios e conteúdo legal superado.
5. Confirmar as 38 anuladas diretamente na documentação da banca e mantê-las fora da RPC atual, que exige resposta e explicação publicadas. Não fabricar opção correta para fechar contagem.

**Aceite:** cada candidata tem gabarito final rastreável, comentário coerente e marcação editorial verdadeira. O total importável será recalculado; **1.187 é teto, não promessa**. Se os 272 ainda estiverem pendentes, o teto imediato é 915 candidatas, sujeito aos demais gates.

## 5. Gate C — taxonomia e migration 037

1. Exportar novamente catálogo remoto com `scripts/export-question-catalog.mjs` em modo somente leitura. Comparar **todos** os 16 slugs e 100 `topic_id` propostos com `disciplines`, `topics`, `topic_discipline_relations`, conteúdo de PRO Resumos e questões já existentes. `topic_id` é global, não apenas por disciplina.
2. Corrigir a migration para ser aditiva: não usar `ON CONFLICT DO UPDATE` para reativar disciplina, mudar título/disciplina ou limpar `archived_at`. Para os dois IDs já existentes, reutilizar exatamente o registro canônico se a relação for pertinente; em qualquer conflito sem equivalência, criar ID específico ou reter a questão. Inserir relações primárias somente quando não violarem a unicidade por tópico.
3. Resolver a divergência entre os 16 slugs do relatório e os 16 slugs reais do SQL. Gerar matriz `disciplina/tópico proposto → existe no banco? → novo? → questões dependentes → decisão editorial`. Não criar disciplinas genéricas como atalho para categorias `A classificar`/`Conhecimentos Específicos`.
4. Testar migration em banco descartável com cópia de schema/catálogo, inclusive repetição idempotente, dois IDs conflitantes, tópicos arquivados e disciplina arquivada. Comparar antes/depois. Se houver mudança estrutural de tabela, atualizar `src/types/database.ts` e migration correspondente. O histórico canônico permanece em `C:\PRO\site\supabase\migrations`.
5. Aplicar somente a migration revisada, em sequência controlada, depois de verificar `supabase migration list` e pendências. **Não usar `npx supabase db push` às cegas**, pois pode aplicar outras migrations pendentes. Confirmar catálogo remoto resultante e RLS antes de importar qualquer questão.

**Aceite:** nenhum tópico ou disciplina anterior foi renomeado, reativado ou desarquivado sem decisão documentada; todas as candidatas importáveis referenciam disciplina ativa e tópico primário da mesma disciplina. Contagem final de catálogo deriva do SQL revisado aplicado, não do relatório.

## 6. Gate D — payloads, mídia e deploy

1. Regenerar **somente os lotes novos afetados** por ajustes de gabarito, comentário ou taxonomia. Preservar os 19 lotes e 75 questões já publicados. Cada lote deve ter fonte `_ATUALIZADO.json` com hash real, `external_id` estável, `source_content_hash` atualizado, um tópico primário válido, explicação não vazia e chave de lote nova quando o conteúdo transformado mudar.
2. Executar `node scripts/questions-admin.mjs validate --file <lote>` para todos os lotes finais; depois `import --file <lote>` sem `--apply` para o dry-run. Comparar texto, resposta e metadados com a trilha de evidências. Zod não verifica gabarito oficial nem coerência jurídica.
3. Validar os 47 PNGs declarados: magic bytes, decodificação, dimensões, caminho usado pelo Markdown, ausência de dados locais e necessidade efetiva em lotes aprovados. Publicar assets em `public/questions/calculations/`, integrar a branch e esperar deploy. Testar **todas as URLs efetivamente referenciadas** com HTTP 200 e `image/png` antes de importar o primeiro lote dependente.
4. Executar os testes proporcionais ao que mudou: testes de importação, conteúdo e autenticação, Python, `npm run lint`, `npx tsc --noEmit`, `npm run build -- --webpack`, `npm audit --omit=dev` e inspeção dos novos sinks inseguros. Registrar riscos preexistentes separadamente. Não atualizar dependências por conveniência.
5. Confirmar commit e SHA de `origin/main`, deploy desse SHA e smoke público de imagens. Push, deploy e banco são estados diferentes.

**Aceite:** lotes finais estáveis e validados, fontes e imagens verificadas, deploy comprovado. Qualquer correção posterior retorna ao Gate A.

## 7. Gate E — importação progressiva e verificação

1. Fazer preflight remoto imediatamente antes da escrita: contar questões publicadas, IDs já presentes, `batch_key` existente, taxonomia ativa e relações. Falhar se algum `external_id` tiver hash diferente do planejado. Guardar snapshot de contagens e trilha de execução, sem segredo.
2. Importar primeiro um lote pequeno sem itens controversos. Cada `import_questions_batch` é atômica **por lote**, mas os 227 lotes não formam transação única. Após cada `--apply --confirm <batch_key>`, executar `verify --file <lote>` e conferir questão, alternativas, gabarito, explicação publicada, tópico, disciplina, hash e `question_import_items`. Parar na primeira divergência; não executar loop cego com continuação após erro.
3. Prosseguir em blocos: Fase 1 (até 80), Fase 2 (até 403), Fase 3 (até 48), Fase 4 em sublotes, sempre excluindo IDs ainda retidos. Conciliar IDs e contagens ao fim de cada bloco. Não inserir `service_role` no cliente nem nos logs.
4. Definir antes da escrita o procedimento de contenção: suspender novos lotes, guardar IDs e `batch_key` do bloco, avaliar arquivamento editorial em vez de exclusão física de questões respondidas, preservar tentativas e auditoria. Não prometer rollback transacional do conjunto.
5. Smoke autenticado no PROQuestões após o canário e após cada fase: filtro por disciplina, busca por enunciado/assunto, navegação até questão nova, ausência do gabarito antes da resposta, comentário e imagem após responder, estatísticas e isolamento de dois usuários. Confirmar que as disciplinas novas aparecem no filtro e que as 75 questões anteriores continuam disponíveis.

**Aceite:** todo ID efetivamente importado está `published` e passa no verificador por lote; diferença entre inventário, banco e interface é zero. Registrar itens retidos com motivo e evidência, sem chamá-los de publicados.

## 8. Entrega final

Atualizar `CHANGELOG.md`, relatório de importação, registro de decisões e este plano com: contagens finais por prova/fase/disciplina, hashes e SHAs, migrations aplicadas, lotes importados/verificados, URLs de mídia, testes executados, evidência de smoke e IDs retidos. O número **1.187** só pode ser apresentado como publicado se os 1.187 passarem pelos gates e constarem no banco com verificação concluída. Caso contrário, publicar o total real e a lista objetiva de bloqueios restantes.
