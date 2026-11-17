# Publicação das correções de AFO — 17/11/2026

As correções autorizadas de Administração Financeira e Orçamentária foram aplicadas ao Supabase usado pelo site de produção. O conteúdo é consultado no banco pelas páginas de estudo; este commit registra a publicação, sem transportar os resumos para o Git.

## Evidências

- Aplicação pelo CLI administrativo com `--apply --preserve-flashcards`, concluída com código de saída zero.
- Reconciliação independente em 17/11/2026, às 13h11 de Brasília: 48 seções conferidas, 100 flashcards integralmente preservados e nenhuma divergência em relação à proposta aceita.
- Cinco seções alteradas: `despesa-publica-na-lrf-sec-04`, `orcamento-publico-constituicao-federal-e-lei-4-320-sec-01`, `orcamento-publico-constituicao-federal-e-lei-4-320-sec-04`, `orcamento-publico-constituicao-federal-e-lei-4-320-sec-08` e `tipos-de-orcamento-sec-05`.
- Metadados e identidades dos tópicos preservados; Administração de Recursos Materiais sem alterações nesta aplicação; contagens de notas, progresso e destaques de AFO sem alterações.
- O bundle público de login em `https://proconcursos.com.br/resumos/login` aponta para o mesmo projeto Supabase utilizado na aplicação e na reconciliação.
- Antes deste registro, a API do Netlify confirmou produção pronta, branch `main`, commit `a46c3b4dbe01dda7234ba9dc7e095714e0b694e3`, coincidente com `origin/main` naquele momento.

## Verificação e limites

Para conferir a experiência do aluno, acessar com conta autorizada os tópicos acima e verificar texto, callouts e flashcards. Não foi realizado smoke visual autenticado nesta publicação. A revisão editorial global de AFO permanece parcial: a aplicação das correções aceitas não certifica completude de toda a disciplina.

Os snapshots, pré-imagens de reversão e recibos completos permanecem no repositório local `C:\PRO\revisoes-resumos`, com checkpoint da aplicação `42e5c21`. Reversão de conteúdo exige procedimento administrativo controlado; reverter este commit documental não desfaz alterações no banco.
