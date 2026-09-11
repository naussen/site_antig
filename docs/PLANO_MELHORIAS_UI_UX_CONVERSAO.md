# Plano de melhorias — UI/UX, Design e Conversão

Atualizado em: 10 de setembro de 2026.

## Objetivos

- mostrar o produto já na primeira dobra;
- aumentar confiança antes do CTA de assinatura;
- reduzir dúvidas comerciais;
- unificar a identidade visual entre PRO Concursos, PRO Resumos e PRO Legis;
- medir o impacto das mudanças no funil de conversão.

## Progresso executivo

| Frente | Estado | Progresso |
|---|---|---:|
| Ativos e identidade visual | Em andamento | 60% |
| Cabeçalhos dos módulos | Em validação visual | 90% |
| Hero e mockup do produto | Concluído; captura real opcional | 95% |
| CTAs, microcopy e navegação | Não iniciado | 0% |
| Preço e prova social | Não iniciado | 0% |
| Instrumentação de conversão | Não iniciado | 0% |
| Acabamento visual e validação | Não iniciado | 0% |

Progresso global estimado: **31%**.

## 1. Ativos e identidade visual — em andamento

- [x] Auditar transparência e dimensões dos logos existentes.
- [x] Confirmar alfa real nos logos do PRO Resumos e do PRO Legis.
- [x] Remover a dependência de wrappers inconsistentes nos cabeçalhos dos módulos.
- [x] Padronizar tamanho, link para o início, foco visível e texto acessível.
- [ ] Substituir a marca corporativa `PRO Concursos` por arquivo com alfa real.
- [ ] Produzir variantes corporativas para fundos claros e escuros.

### Bloqueio conhecido

O arquivo `public/brand/pro-concursos-logo-transparent.png` possui fundo quadriculado incorporado e alfa opaco. Duas tentativas de extração com a ferramenta de imagem também retornaram arquivos RGB opacos. Não publicar esses resultados.

Para concluir, é necessário um dos seguintes insumos:

1. arquivo-fonte SVG, PDF vetorial, AI ou PNG com transparência verdadeira; ou
2. autorização explícita para usar o fluxo alternativo de edição por API.

Enquanto isso, os módulos utilizam seus próprios logos transparentes e válidos.

## 2. Cabeçalhos dos módulos — em validação visual

### PRO Resumos

- [x] Marca do módulo presente no menu lateral desktop.
- [x] Marca presente no cabeçalho mobile.
- [x] Marca presente no login e no acesso administrativo.
- [x] Logo navegável para a página inicial apropriada.
- [x] Foco de teclado padronizado.

### PRO Legis

- [x] Marca presente no catálogo, leitores, login, assinatura, editorial e administração.
- [x] Logos de cabeçalho navegáveis para o início do módulo.
- [x] Foco de teclado e rótulo acessível padronizados.
- [x] Preservado o tratamento de contraste nos temas Claro, Noturno e Sépia.
- [ ] Executar revisão visual autenticada em desktop e mobile nos três temas.

### Validações automatizadas desta etapa

- [x] `npm run lint` no PRO Resumos e no PRO Legis.
- [x] `npx tsc --noEmit` no PRO Resumos.
- [x] `npm run typecheck` no PRO Legis.
- [x] build de produção com webpack nos dois módulos.
- [x] 68 testes automatizados do PRO Legis.

## 3. Hero orientado à conversão — concluído com pendência opcional

- [x] Transformar a primeira dobra em duas colunas no desktop.
- [x] Posicionar proposta e CTAs à esquerda e mockup do produto à direita.
- [x] No mobile, posicionar o mockup abaixo dos CTAs sem overflow estrutural.
- [x] Reaproveitar a linguagem visual dos previews existentes de Resumos, Legis e flashcards.
- [ ] Usar captura real anonimizada da plataforma quando disponível.
- [x] Manter dimensões estáveis sem imagem externa ou JavaScript adicional.
- [x] Executar revisão visual em 320 px, tablet e desktop largo, sem overflow horizontal.

## 4. CTAs, microcopy e navegação — não iniciado

- [ ] Aumentar o contraste base do botão “Conhecer a plataforma”.
- [ ] Substituir o texto de apoio por redução de objeções comprovável.
- [ ] Validar comercialmente cancelamento e eventual garantia antes de publicar.
- [ ] Adicionar âncoras para Módulos, Funcionalidades, Depoimentos e Planos.
- [ ] Criar menu mobile acessível e `scroll-margin-top` para o header fixo.

## 5. Preço e prova social — não iniciado

- [ ] Criar seção de plano com preço, módulos incluídos e meios de pagamento reais.
- [ ] Explicar cancelamento e reembolso conforme as regras efetivamente praticadas.
- [ ] Publicar somente números de alunos verificáveis.
- [ ] Obter autorização para nomes, fotos e depoimentos.
- [ ] Na ausência de depoimentos, usar sinais objetivos de confiança.

## 6. Instrumentação — não iniciado

- [ ] Registrar `landing_view`.
- [ ] Registrar cliques nos CTAs principal e secundário.
- [ ] Registrar navegação por âncoras e visualização da seção de planos.
- [ ] Registrar início de checkout, login concluído e assinatura concluída.
- [ ] Não enviar e-mail, nome, token ou conteúdo pessoal aos eventos.
- [ ] Comparar mobile e desktop e estabelecer linha de base antes das mudanças.

## 7. Acabamento e validação — não iniciado

- [ ] Refinar brilhos e textura lateral sem competir com o conteúdo.
- [ ] Respeitar `prefers-reduced-motion`.
- [ ] Validar 320 px, tablet e monitores largos.
- [ ] Validar temas Light, Dark e Sepia.
- [ ] Verificar contraste AA, navegação por teclado, LCP, CLS e overflow.
- [ ] Executar lint, tipagem, build e revisão manual nos dois módulos.

## Critérios de aceite finais

- logo sem fundo opaco em superfícies escuras;
- identidade dos dois módulos consistente e navegável;
- mockup visível na primeira dobra em desktop;
- CTA secundário com contraste AA;
- nenhuma estatística, garantia ou condição comercial não comprovada;
- imagens sem dados pessoais;
- navegação por teclado e foco visível;
- eventos de conversão sem dados pessoais;
- validações automatizadas e manuais registradas.
