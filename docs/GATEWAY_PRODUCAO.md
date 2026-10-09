# Gateway de produção do PRO Legis

## Diagnóstico confirmado em 09/10/2026

- `proconcursos.com.br` resolve para `54.232.119.62`.
- O SOA do domínio é administrado pela Netlify (`domains+netlify.netlify.com`).
- `https://proconcursos.com.br/resumos` é a URL canônica do aplicativo Next/Netlify.
- `https://proconcursos-resumos.netlify.app/resumos` pertence a um deploy legado e não deve ser usado em login, favoritos ou documentação.
- `https://pro-legis-mvp.netlify.app/legis` é o origin atualmente usado pelo gateway.
- `https://proconcursos.com.br/legis` está publicado e protegido por login.
- a sessão autenticada é compartilhada com o PRO Resumos;
- catálogo, leitura por artigo, leitura integral e temas Claro, Noturno e Sépia passaram no smoke desktop, tablet e celular;
- permanece obrigatório registrar o SHA efetivamente publicado do PRO Legis em cada release.

## Gateway ativo

O site que atende `proconcursos.com.br` publica as seguintes regras de proxy:

```toml
[[redirects]]
from = "/legis"
to = "https://pro-legis-mvp.netlify.app/legis"
status = 200
force = true

[[redirects]]
from = "/legis/*"
to = "https://pro-legis-mvp.netlify.app/legis/:splat"
status = 200
force = true
```

Em cada release, validar `/legis`, `/legis/_next/*`, `/legis/api/*`, RSC, login/logout cruzado e retorno ao caminho original. Confirmar também que os dois sites Netlify permanecem sob o mesmo controle operacional e registrar os SHAs publicados do Site e do PRO Legis.
