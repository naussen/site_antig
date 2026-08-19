# Gateway de produção do PRO Legis

## Diagnóstico confirmado em 19/08/2026

- `proconcursos.com.br` resolve para `54.232.119.62`.
- O SOA do domínio é administrado pela Netlify (`domains+netlify.netlify.com`).
- `https://proconcursos.com.br/resumos` e `https://proconcursos-resumos.netlify.app/resumos` respondem pelo mesmo aplicativo Next/Netlify.
- `https://pro-legis-mvp.netlify.app/legis` está publicado e protegido por login.
- `https://proconcursos.com.br/legis` ainda retorna 404 no contexto de produção.

## Ativação pendente

Promover para o deploy de produção do site que atende `proconcursos.com.br` as regras já presentes em `netlify.toml` nesta branch:

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

Depois do deploy, validar `/legis`, `/legis/_next/*`, `/legis/api/*`, RSC, login/logout cruzado e retorno ao caminho original. A promoção deve ocorrer somente após confirmar que os dois sites Netlify pertencem ao mesmo team e que o origin não está acessível com cookies divergentes.
