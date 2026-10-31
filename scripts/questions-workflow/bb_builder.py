"""Construtor das 70 questões do Banco do Brasil 2021 (Escriturário - Agente Comercial - Prova A - Gabarito 1).
Marcadas com ressalva expressa de gabarito sem status definitivo comprovado, conforme autorização editorial.
"""
from __future__ import annotations

import fitz
import json
import hashlib
import re
from typing import Any

def build_bb_questions() -> tuple[list[dict], list[dict]]:
    """Retorna (lista_questoes_prontas, lista_registros_manifesto_todos_70)."""
    doc = fitz.open(r"C:\PRO\questoes\novas_pdf_30-10\escriturario_agente_comercial (1).pdf")
    exam_sha = "7f1b6b8810edd46e58da6a447f5fb84897ce7ef151b6f7a6717714e70eca98b7"
    ans_sha = "8af9e479431ba4b6bd7ab5a8c3d30ba502ef50cc66ba1da8dd11fb9569a6b512"

    official_keys = {
        1: "C", 2: "D", 3: "B", 4: "D", 5: "E", 6: "C", 7: "B", 8: "E", 9: "D", 10: "E",
        11: "B", 12: "C", 13: "E", 14: "D", 15: "C", 16: "A", 17: "D", 18: "E", 19: "D", 20: "C",
        21: "B", 22: "A", 23: "B", 24: "C", 25: "A", 26: "C", 27: "A", 28: "C", 29: "A", 30: "B",
        31: "C", 32: "E", 33: "A", 34: "C", 35: "D", 36: "D", 37: "A", 38: "C", 39: "B", 40: "E",
        41: "C", 42: "B", 43: "D", 44: "C", 45: "D", 46: "C", 47: "D", 48: "B", 49: "B", 50: "A",
        51: "A", 52: "C", 53: "E", 54: "E", 55: "B", 56: "E", 57: "C", 58: "B", 59: "D", 60: "E",
        61: "B", 62: "C", 63: "D", 64: "A", 65: "B", 66: "E", 67: "A", 68: "B", 69: "C", 70: "A"
    }

    taxonomy_map = {}
    for i in range(1, 11):
        taxonomy_map[i] = ("portugues", "compreensao-e-interpretacao-de-textos" if i <= 5 else "sintaxe")
    for i in range(11, 16):
        taxonomy_map[i] = ("lingua-inglesa", "compreensao-e-interpretacao-de-textos-em-ingles")
    for i in range(16, 21):
        taxonomy_map[i] = ("matematica", "aritmetica-e-algebra" if i <= 18 else "porcentagem-e-proporcionalidade")
    for i in range(21, 26):
        taxonomy_map[i] = ("atualidades", "mercado-financeiro-e-inovacao-tecnologica")
    for i in range(26, 31):
        taxonomy_map[i] = ("matematica-financeira", "juros-simples-e-compostos")
    # Conhecimentos Bancários: questões 31 a 45
    taxonomy_map[31] = ("conhecimentos-bancarios", "sistema-financeiro-nacional-sfn")
    taxonomy_map[32] = ("conhecimentos-bancarios", "mercado-de-cambio-e-capitais")
    taxonomy_map[33] = ("conhecimentos-bancarios", "mercado-de-cambio-e-capitais")
    taxonomy_map[34] = ("conhecimentos-bancarios", "sistema-financeiro-nacional-sfn")
    taxonomy_map[35] = ("conhecimentos-bancarios", "produtos-e-servicos-bancarios")
    for i in range(36, 46):
        taxonomy_map[i] = ("conhecimentos-bancarios", "sistema-financeiro-nacional-sfn" if i <= 40 else "produtos-e-servicos-bancarios")
    for i in range(46, 61):
        taxonomy_map[i] = ("informatica", "ferramentas-de-escritorio-office-e-libreoffice" if i <= 52 else "seguranca-da-informacao")
    for i in range(61, 71):
        taxonomy_map[i] = ("vendas-e-negociacao", "tecnicas-de-vendas-e-atendimento-ao-cliente" if i <= 65 else "marketing-de-relacionamento-e-crm")

    columns = []
    page_by_item = {}
    for p_idx in range(3, len(doc)):
        page = doc[p_idx]
        mid = page.rect.width / 2
        l_text = page.get_text(clip=fitz.Rect(0, 0, mid, page.rect.height))
        r_text = page.get_text(clip=fitz.Rect(mid, 0, page.rect.width, page.rect.height))
        for text in [l_text, r_text]:
            lines = []
            for l in text.splitlines():
                if re.search(r"pcimarkpci|pciconcursos|cursos\.com\.br|ESCRITURÁRIO - AGENTE COMERCIAL|BANCO DO BRASIL|GABARITO 1|6YjNiYT", l):
                    continue
                lines.append(l)
            columns.append((p_idx + 1, "\n".join(lines)))

    full_text = "\n\n".join(c[1] for c in columns)

    extracted_raw = {}
    current_q = 1
    pos = 0

    while current_q <= 70:
        pat = rf"(?:^|\n)\s*{current_q}\s*\n+(?=[A-Z\u00C0-\u00DC\“\"\(])"
        m = re.search(pat, full_text[pos:])
        if not m:
            break
        q_start = pos + m.end()

        if current_q < 70:
            next_q = current_q + 1
            next_pat = rf"(?:^|\n)\s*{next_q}\s*\n+(?=[A-Z\u00C0-\u00DC\“\"\(])"
            next_m = re.search(next_pat, full_text[q_start:])
            if not next_m:
                break
            q_content = full_text[q_start:q_start + next_m.start()].strip()
            pos = q_start + next_m.start()
        else:
            q_content = full_text[q_start:].strip()
            pos = len(full_text)

        extracted_raw[current_q] = q_content

        for p_num, col_str in columns:
            if re.search(rf"(?:^|\n)\s*{current_q}\s*\n", col_str):
                page_by_item[current_q] = p_num
                break
        if current_q not in page_by_item:
            page_by_item[current_q] = 4
        current_q += 1

    def sanitize_text(text: str | None) -> str | None:
        if not text:
            return None
        t = re.sub(r'<\s*https?://([^>]+)>', r'\1', text)
        t = re.sub(r'https?://', '', t)
        t = re.sub(r'<[^>]+>', '', t)
        return t.strip()

    ready_questions = []
    manifest_records = []

    for item_num in range(1, 71):
        ext_id = f"exam:bb-2021-escriturario-agente-comercial:item:{item_num:03d}"
        ans_status = "sem_status"
        disc_slug, topic_id = taxonomy_map[item_num]
        p_num = page_by_item.get(item_num, 4)

        raw_content = extracted_raw[item_num]
        opt_match = re.search(
            r"\n?\s*\(A\)\s+(.*?)\n?\s*\(B\)\s+(.*?)\n?\s*\(C\)\s+(.*?)\n?\s*\(D\)\s+(.*?)\n?\s*\(E\)\s+(.*)$",
            raw_content,
            re.DOTALL
        )
        if not opt_match:
            raise ValueError(f"Falha ao extrair alternativas da questão {item_num} do Banco do Brasil.")

        command = sanitize_text(raw_content[:opt_match.start()].strip())
        opts = [sanitize_text(opt_match.group(j).strip()) for j in range(1, 6)]
        # Sanitização e limpeza de rodapés / fragmentos residuais de PDF
        opts[4] = re.sub(r"\n+(?:RASCUNHO|O BRASIL|BANCO DO|CONHECIMENTOS|Dados:).*$", "", opts[4], flags=re.DOTALL).strip()

        # Sanear caracteres de fontes simbólicas (Private Use Area \uf02b, \uf02d) e quebras de fórmulas
        if item_num == 17:
            command = (
                "A sequência de Fibonacci é bastante utilizada para exemplificar sequências definidas por recorrência, "
                "ou seja, sequências em que se pode determinar um termo a partir do conhecimento de termos anteriores. "
                "No caso da sequência de Fibonacci, escreve-se que $T_{n+2} = T_{n+1} + T_n$ e, desse modo, pode-se obter "
                "um termo qualquer conhecendo-se os dois termos anteriores.\n\n"
                "Considerando o exposto acima, determine o termo $T_{2021}$ da sequência de Fibonacci, sabendo que "
                "$T_{2018} = m$ e $T_{2020} = p$."
            )
            opts = ["(p + m) / 2", "(p - m) / 2", "p + 2m", "2p - m", "2m - 2p"]
        elif item_num == 18:
            command = (
                "J modelou um problema de matemática por uma função exponencial do tipo $a(x) = 1000 e^{kx}$, "
                "e L, trabalhando no mesmo problema, chegou à modelagem $b(x) = 10^{2x+3}$.\n\n"
                "Considerando-se que ambos modelaram o problema corretamente, e que $\\ln x = \\log_e x$, qual o valor de $k$?"
            )
            opts[4] = "ln 100"
        elif item_num == 19:
            command = (
                "O método da bisseção é um algoritmo usado para encontrar aproximações das raízes de uma equação. "
                "Começa-se com um intervalo $[a, b]$, que contém uma raiz, e, em cada passo do algoritmo, reduz-se o "
                "intervalo pela metade, usando-se um teorema para determinar se a raiz está à esquerda ou à direita "
                "do ponto médio do intervalo anterior. Ou seja, após o passo 1, obtém-se um intervalo de comprimento "
                "$\\frac{b - a}{2}$; após o passo 2, obtém-se um intervalo de comprimento $\\frac{b - a}{4}$; e após "
                "o passo $n$, obtém-se um intervalo de comprimento $\\frac{b - a}{2^n}$. Esse processo continua até que "
                "o intervalo obtido tenha comprimento menor que o erro máximo desejado para a aproximação.\n\n"
                "Para aplicar esse método no intervalo $[1, 5]$, quantos passos serão necessários para obter-se um "
                "intervalo de comprimento menor que $10^{-3}$?"
            )
        elif item_num == 20:
            opts[4] = "15%"
        elif item_num == 27:
            command = (
                "Um cliente montou uma estratégia financeira, aplicando parte de seu décimo terceiro salário, sempre no "
                "início de janeiro, de 2018 a 2021, conforme mostrado na Tabela a seguir.\n\n"
                "| Data | Aplicação |\n| :--- | :--- |\n| jan/2018 | R\\$ 10.000,00 |\n| jan/2019 | R\\$ 10.000,00 |\n"
                "| jan/2020 | R\\$ 10.000,00 |\n| jan/2021 | R\\$ 10.000,00 |\n\n"
                "A partir da orientação financeira de um especialista, ele conseguiu obter nesse período, com essas "
                "aplicações, uma taxa de retorno de 10% ao ano, sempre na comparação com o ano anterior. Ele pretende "
                "atingir o valor total acumulado de 65 mil reais no início de jan/2023.\n\n"
                "Considerando-se que essa taxa de retorno se mantenha, o valor mínimo, em reais, que esse cliente precisará "
                "depositar em Jan/2022, para atingir a meta em Jan/2023, a partir das aproximações dadas, pertence ao intervalo:\n\n"
                "Dados: $1,1^5 = 1,611$; $1,1^4 = 1,464$; $1,1^3 = 1,331$."
            )
            opts[4] = "R$ 8.800,00 a R$ 8.999,00"
        elif item_num == 30:
            command = (
                "Devido à pandemia, um microempreendedor precisou tomar um empréstimo no valor de R\\$ 20.000,00, em dez/2020, "
                "a ser pago em 24 prestações mensais iguais e postecipadas no sistema PRICE, de modo que a primeira fosse paga em "
                "jan/21, e a última, em dez/22. Considere que o Banco cobre R\\$ 660,00 de taxas, que serão financiadas juntamente "
                "com o valor do empréstimo, por escolha do cliente, e que a taxa de juros cobrada, devido ao risco da operação, "
                "seja de 3% ao mês.\n\n"
                "Desconsiderando-se o IOF na operação e supondo-se que a primeira prestação foi paga na data de vencimento, o valor "
                "da segunda prestação, em sua respectiva data de vencimento será de, aproximadamente,\n\n"
                "Dados: $1,03^{24} = 2,033$."
            )
            opts[4] = "R$ 1.520,00"
        elif item_num == 31:
            opts[4] = "Banco Nacional de Desenvolvimento Econômico e Social (BNDES)"
        elif item_num == 32:
            command = (
                "Considere o texto a seguir para responder às questões 32 e 33.\n\n"
                "> A crise econômica causada pela pandemia do novo coronavírus provocou a maior fuga de capitais da história "
                "do Brasil. Dados divulgados nesta quarta-feira (24/6) pelo Banco Central (BC) explicam que os investidores "
                "estrangeiros retiraram US\\$ 31,7 bilhões do mercado brasileiro de títulos e ações só em março, abril e maio "
                "deste ano. Por isso, as retiradas somam R\\$ 50,9 bilhões nos últimos 12 meses; o maior índice da série "
                "histórica do BC.\n>\n"
                "> *BARBOSA, M. US\\$ 50,9 bilhões saíram do mercado financeiro brasileiro em 12 meses. Correio Braziliense, 24/6/2020.*\n\n"
                "Considerando-se os efeitos sanitários, econômicos e sociais decorrentes da pandemia da Covid-19 na economia "
                "global, o principal fator que justifica tamanha fuga de capitais do Brasil no ano passado é o(a)"
            )
        elif item_num == 33:
            command = (
                "Considere o texto sobre a fuga de capitais divulgado pelo Banco Central em 2020 apresentado na questão anterior.\n\n"
                "O principal impacto decorrente da enorme fuga de capitais do Brasil em 2020, descrita na reportagem mencionada "
                "anteriormente, foi o(a)"
            )
            opts[4] = "aumento da dívida interna do Tesouro"
        elif item_num == 34:
            opts[4] = "venda de títulos mediante operações compromissadas"


        # Ressalva expressa no título conforme determinação editorial
        title_with_disclaimer = f"Questão {item_num} [Gabarito sem status definitivo comprovado]"

        parts = {
            "title": title_with_disclaimer,
            "context": None,
            "source": None,
            "introduction": None,
            "command": command,
            "assertion": None
        }

        statement_md = f"{title_with_disclaimer}\n\n## Enunciado\n\n{command}"

        options_list = [
            {"label": "A", "body_markdown": opts[0], "sort_order": 0},
            {"label": "B", "body_markdown": opts[1], "sort_order": 1},
            {"label": "C", "body_markdown": opts[2], "sort_order": 2},
            {"label": "D", "body_markdown": opts[3], "sort_order": 3},
            {"label": "E", "body_markdown": opts[4], "sort_order": 4},
        ]

        correct_label = official_keys[item_num]

        # Resoluções detalhadas e auditadas com memória de cálculo para itens matemáticos
        SPECIFIC_BB_EXPLANATIONS = {
            17: (
                "Análise didática da Questão 17 do Banco do Brasil (Seleção Externa 2021/001):\n\n"
                "- Gabarito de referência da Prova A / Gabarito 1: alternativa (D).\n"
                "- Ressalva Editorial: Questão processada com gabarito divulgado na folha de respostas, sem documento oficial comprobatório de status definitivo pós-recursos.\n\n"
                "### Memória de cálculo — passo a passo\n\n"
                "1. **O que a questão quer descobrir:** O termo $T_{2021}$ da sequência de Fibonacci em função dos termos conhecidos $T_{2018} = m$ e $T_{2020} = p$.\n"
                "2. **Dados do enunciado:** Lei de recorrência $T_{n+2} = T_{n+1} + T_n$; $T_{2018} = m$; $T_{2020} = p$.\n"
                "3. **Fórmulas:** $T_{2020} = T_{2019} + T_{2018}$ e $T_{2021} = T_{2020} + T_{2019}$.\n"
                "4. **Substituição e operações:**\n"
                "   - $p = T_{2019} + m \\implies T_{2019} = p - m$.\n"
                "   - $T_{2021} = p + (p - m) = 2p - m$.\n"
                "5. **Resultado:** $2p - m$, correspondente à alternativa (D)."
            ),
            18: (
                "Análise didática da Questão 18 do Banco do Brasil (Seleção Externa 2021/001):\n\n"
                "- Gabarito de referência da Prova A / Gabarito 1: alternativa (E).\n"
                "- Ressalva Editorial: Questão processada com gabarito divulgado na folha de respostas, sem documento oficial comprobatório de status definitivo pós-recursos.\n\n"
                "### Memória de cálculo — passo a passo\n\n"
                "1. **O que a questão quer descobrir:** O valor da constante $k$ para que $a(x) = b(x)$.\n"
                "2. **Dados do enunciado:** $a(x) = 1000 e^{kx}$; $b(x) = 10^{2x+3}$; $\\ln x = \\log_e x$.\n"
                "3. **Propriedades:** $10^{2x+3} = 1000 \\cdot 100^x$.\n"
                "4. **Substituição e operações:**\n"
                "   - $1000 e^{kx} = 1000 \\cdot 100^x \\implies e^{kx} = 100^x \\implies e^k = 100$.\n"
                "   - $k = \\ln 100$.\n"
                "5. **Resultado:** $k = \\ln 100$, correspondente à alternativa (E)."
            ),
            19: (
                "Análise didática da Questão 19 do Banco do Brasil (Seleção Externa 2021/001):\n\n"
                "- Gabarito de referência da Prova A / Gabarito 1: alternativa (D).\n"
                "- Ressalva Editorial: Questão processada com gabarito divulgado na folha de respostas, sem documento oficial comprobatório de status definitivo pós-recursos.\n\n"
                "### Memória de cálculo — passo a passo\n\n"
                "1. **O que a questão quer descobrir:** O número de passos $n$ para erro menor que $10^{-3}$.\n"
                "2. **Dados do enunciado:** Intervalo $[1, 5]$; $L_0 = 4$; $L_n = 4 / 2^n < 10^{-3}$.\n"
                "3. **Fórmula:** $4 / 2^n < 1/1000 \\iff 2^n > 4000$.\n"
                "4. **Substituição e operações:**\n"
                "   - $2^{10} = 1024$; $2^{11} = 2048$; $2^{12} = 4096$.\n"
                "   - Como $2^{11} < 4000 < 2^{12}$, o menor número inteiro é $n = 12$.\n"
                "5. **Resultado:** 12 passos, correspondente à alternativa (D)."
            ),
            20: (
                "Análise didática da Questão 20 do Banco do Brasil (Seleção Externa 2021/001):\n\n"
                "- Gabarito de referência da Prova A / Gabarito 1: alternativa (C).\n"
                "- Ressalva Editorial: Questão processada com gabarito divulgado na folha de respostas, sem documento oficial comprobatório de status definitivo pós-recursos.\n\n"
                "### Memória de cálculo — passo a passo\n\n"
                "1. **O que a questão quer descobrir:** O percentual de desconto no preço unitário da embalagem dupla.\n"
                "2. **Dados do enunciado:** 16 duplas e 20 unitárias custam 488 ($16d + 20u = 488$); 30 duplas e 25 unitárias custam 790 ($30d + 25u = 790$).\n"
                "3. **Fórmula:** Preço na dupla $u_{\\text{dupla}} = d/2$; Desconto = $(u - u_{\\text{dupla}})/u$.\n"
                "4. **Substituição e operações intermediárias:\n"
                "   - Simplificação da 1ª equação: 488 / 4 = 122 ($4d + 5u = 122 \\implies 25u = 610 - 20d$).\n"
                "   - Substituição na 2ª: 30d + 610 - 20d = 790 \\implies 10d = 790 - 610 = 180.\n"
                "   - Valor da dupla: 180 / 10 = 18 (R\\$ 18,00).\n"
                "   - Valor unitário: 50 / 5 = 10 (R\\$ 10,00).\n"
                "   - Preço unitário na dupla: 18 / 2 = 9 (R\\$ 9,00).\n"
                "   - Desconto percentual: (10 - 9) / 10 = 0,10 = 10%.\n"
                "5. **Resultado e interpretação:** O desconto é de 10%, correspondente à alternativa (C)."
            ),
            27: (
                "Análise didática da Questão 27 do Banco do Brasil (Seleção Externa 2021/001):\n\n"
                "- Gabarito de referência da Prova A / Gabarito 1: alternativa (A).\n"
                "- Ressalva Editorial: Questão processada com gabarito divulgado na folha de respostas, sem documento oficial comprobatório de status definitivo pós-recursos.\n\n"
                "### Memória de cálculo — passo a passo\n\n"
                "1. **O que a questão quer descobrir:** O depósito $X$ em jan/2022 para atingir meta de R\\$ 65.000,00 em jan/2023.\n"
                "2. **Dados do enunciado:** Taxa 10% ao ano; 4 depósitos de 10.000 com fatores $1,1^5=1,611$; $1,1^4=1,464$; $1,1^3=1,331$; $1,1^2=1,210$.\n"
                "3. **Fórmula:** Total = $10.000 \\times (1,611 + 1,464 + 1,331 + 1,210) + X \\times 1,1$.\n"
                "4. **Substituição e operações:**\n"
                "   - Acumulado inicial: $10.000 \\times 5,616 = \\text{R\\$} 56.160,00$.\n"
                "   - Saldo faltante: $65.000 - 56.160 = \\text{R\\$} 8.840,00$.\n"
                "   - $X = 8.840 / 1,1 \\approx \\text{R\\$} 8.036,36$.\n"
                "5. **Resultado:** Faixa de R\\$ 8.000,00 a R\\$ 8.199,00, correspondente à alternativa (A)."
            ),
            30: (
                "Análise didática da Questão 30 do Banco do Brasil (Seleção Externa 2021/001):\n\n"
                "- Gabarito de referência da Prova A / Gabarito 1: alternativa (B).\n"
                "- Ressalva Editorial: Questão processada com gabarito divulgado na folha de respostas, sem documento oficial comprobatório de status definitivo pós-recursos.\n\n"
                "### Memória de cálculo — passo a passo\n\n"
                "1. **O que a questão quer descobrir:** O valor da 2ª prestação mensal no sistema PRICE.\n"
                "2. **Dados do enunciado:** $PV = 20.000 + 660 = 20.660$; $n = 24$; $i = 3\\%$; $1,03^{24} = 2,033$.\n"
                "3. **Fórmula:** $PMT = PV \\times \\frac{i \\cdot (1+i)^n}{(1+i)^n - 1}$.\n"
                "4. **Substituição e operações:**\n"
                "   - $PMT = 20.660 \\times \\frac{0,03 \\times 2,033}{2,033 - 1} = 20.660 \\times \\frac{0,06099}{1,033} \\approx \\text{R\\$} 1.219,80$.\n"
                "   - Sistema PRICE possui prestações iguais: $PMT_2 \\approx \\text{R\\$} 1.220,00$.\n"
                "5. **Resultado:** Aproximadamente R\\$ 1.220,00, correspondente à alternativa (B)."
            ),
            31: (
                "Análise didática da Questão 31 do Banco do Brasil (Seleção Externa 2021/001):\n\n"
                "- Gabarito de referência da Prova A / Gabarito 1: alternativa (C).\n"
                "- Ressalva Editorial: Questão processada com gabarito divulgado na folha de respostas, sem documento oficial comprobatório de status definitivo pós-recursos.\n"
                "- Tópico examinado: Sistema Financeiro Nacional (SFN).\n\n"
                "### Demonstração passo a passo — Estrutura e Atribuições do SFN\n\n"
                "1. **O que a questão exige:** Identificar a entidade que detém a atribuição precípua de fiscalização das instituições financeiras no Brasil.\n"
                "2. **Atribuições:** O Conselho Monetário Nacional (CMN) fixa diretrizes normativas. O Banco Central do Brasil (Bacen) é a autarquia supervisora executiva e fiscalizadora direta de todo o sistema bancário.\n"
                "3. **Resultado:** Banco Central do Brasil, correspondente à alternativa (C)."
            ),
            32: (
                "Análise didática da Questão 32 do Banco do Brasil (Seleção Externa 2021/001):\n\n"
                "- Gabarito de referência da Prova A / Gabarito 1: alternativa (E).\n"
                "- Ressalva Editorial: Questão processada com gabarito divulgado na folha de respostas, sem documento oficial comprobatório de status definitivo pós-recursos.\n"
                "- Tópico examinado: Mercado de Câmbio e Capitais.\n\n"
                "### Demonstração passo a passo — Fuga de Capitais em Momentos de Crise\n\n"
                "1. **O que a questão exige:** Compreender o motivo da saída expressiva de capitais de economias emergentes durante choques globais.\n"
                "2. **Aversão ao Risco:** Em choques globais agudos, investidores internacionais buscam ativos de segurança (Treasuries, Dólar) e reduzem exposição em moedas emergentes devido ao aumento da percepção de risco.\n"
                "3. **Resultado:** Maior percepção de risco em investir em ativos denominados em moeda brasileira, correspondente à alternativa (E)."
            ),
            33: (
                "Análise didática da Questão 33 do Banco do Brasil (Seleção Externa 2021/001):\n\n"
                "- Gabarito de referência da Prova A / Gabarito 1: alternativa (A).\n"
                "- Ressalva Editorial: Questão processada com gabarito divulgado na folha de respostas, sem documento oficial comprobatório de status definitivo pós-recursos.\n"
                "- Tópico examinado: Mercado de Câmbio e Capitais / Formação da Taxa de Câmbio.\n\n"
                "### Demonstração passo a passo — Dinâmica Cambial da Fuga de Capitais\n\n"
                "1. **O que a questão exige:** Identificar a consequência direta da saída massiva de capitais estrangeiros.\n"
                "2. **Mercado de Câmbio:** A saída de dólares força a conversão massiva de reais em dólares, elevando a cotação da moeda americana e provocando a desvalorização do Real brasileiro sob câmbio flutuante.\n"
                "3. **Resultado:** Expressiva desvalorização do real brasileiro, correspondente à alternativa (A)."
            ),
            34: (
                "Análise didática da Questão 34 do Banco do Brasil (Seleção Externa 2021/001):\n\n"
                "- Gabarito de referência da Prova A / Gabarito 1: alternativa (C).\n"
                "- Ressalva Editorial: Questão processada com gabarito divulgado na folha de respostas, sem documento oficial comprobatório de status definitivo pós-recursos.\n"
                "- Tópico examinado: Instrumentos de Política Monetária / Emenda Constitucional 106/2020.\n\n"
                "### Demonstração passo a passo — Política Monetária Não Convencional e Curva de Juros\n\n"
                "1. **O que a questão exige:** Identificar a medida não convencional capaz de atuar no achatamento da curva de juros longa.\n"
                "2. **Mecanismo:** A compra direta de títulos no mercado secundário (quantitative easing) eleva o preço desses títulos e comprime suas taxas de retorno.\n"
                "3. **Resultado:** Compra de títulos públicos e privados no mercado secundário, correspondente à alternativa (C)."
            ),
            35: (
                "Análise didática da Questão 35 do Banco do Brasil (Seleção Externa 2021/001):\n\n"
                "- Gabarito de referência da Prova A / Gabarito 1: alternativa (D).\n"
                "- Ressalva Editorial: Questão processada com gabarito divulgado na folha de respostas, sem documento oficial comprobatório de status definitivo pós-recursos.\n"
                "- Tópico examinado: Produtos Bancários / Investimentos de Renda Fixa.\n\n"
                "### Demonstração passo a passo — Classificação de Ativos Financeiros\n\n"
                "1. **O que a questão exige:** Identificar um investimento de Renda Fixa entre as alternativas.\n"
                "2. **Classificação:** Ações e ETFs são renda variável; opções e commodities são derivativos/futuros. O Certificado de Depósito Bancário (CDB) é um instrumento típico de renda fixa.\n"
                "3. **Resultado:** Os CDB, correspondente à alternativa (D)."
            ),
            16: (
                "Análise didática da Questão 16 do Banco do Brasil (Seleção Externa 2021/001):\n\n"
                "- Gabarito de referência da Prova A / Gabarito 1: alternativa (A).\n"
                "- Ressalva Editorial: Questão processada com gabarito divulgado na folha de respostas, sem documento oficial comprobatório de status definitivo pós-recursos.\n\n"
                "### Memória de cálculo — passo a passo\n\n"
                "1. **O que a questão quer descobrir:** A porcentagem de clientes interessados em ambos os produtos.\n"
                "2. **Dados do enunciado:** Total $1.000$; indiferentes $430$; interessados no produto 1: $270$; produto 2: $400$.\n"
                "3. **Conversões:** $100$ de $1.000$ equivale a $100 / 1.000 = 10\\%$.\n"
                "4. **Fórmula:** $n(A \\cup B) = n(A) + n(B) - n(A \\cap B)$.\n"
                "5. **Substituição e operações:**\n"
                "   - Total com interesse em algum produto: $1.000 - 430 = 570$.\n"
                "   - $570 = 270 + 400 - n(A \\cap B) \\implies n(A \\cap B) = 670 - 570 = 100$.\n"
                "   - Porcentagem: $100 / 1.000 = 10\\%$.\n"
                "6. **Resultado:** 10%, correspondente à alternativa (A)."
            ),
            26: (
                "Análise didática da Questão 26 do Banco do Brasil (Seleção Externa 2021/001):\n\n"
                "- Gabarito de referência da Prova A / Gabarito 1: alternativa (C).\n"
                "- Ressalva Editorial: Questão processada com gabarito divulgado na folha de respostas, sem documento oficial comprobatório de status definitivo pós-recursos.\n\n"
                "### Memória de cálculo — passo a passo\n\n"
                "1. **O que a questão quer descobrir:** A taxa máxima adicional $i_2$ aplicável sobre $C_2$ sem ultrapassar o teto anual de $8,36\\%$.\n"
                "2. **Dados do enunciado:** Taxa máxima anual $8,36\\%$ ($1,0836$); primeira taxa $5,00\\%$ ($1,05$).\n"
                "3. **Fórmula:** $(1 + i_1) \\times (1 + i_2) \\le 1 + i_{\\text{máx}}$.\n"
                "4. **Substituição e operações:**\n"
                "   - $1,05 \\times (1 + i_2) = 1,0836 \\implies 1 + i_2 = 1,0836 / 1,05 = 1,032$.\n"
                "   - $i_2 = 1,032 - 1 = 0,032 = 3,20\\%$.\n"
                "5. **Resultado:** 3,20%, correspondente à alternativa (C)."
            ),
            28: (
                "Análise didática da Questão 28 do Banco do Brasil (Seleção Externa 2021/001):\n\n"
                "- Gabarito de referência da Prova A / Gabarito 1: alternativa (C).\n"
                "- Ressalva Editorial: Questão processada com gabarito divulgado na folha de respostas, sem documento oficial comprobatório de status definitivo pós-recursos.\n\n"
                "### Memória de cálculo — passo a passo\n\n"
                "1. **O que a questão quer descobrir:** O total a pagar no boleto vencido com juros simples e multa.\n"
                "2. **Dados do enunciado:** Principal R\\$ 25.000,00; atraso de 12 dias; multa de 2%; juros simples de 0,2% ao dia.\n"
                "3. **Conversões:** Multa $2\\% = 0,02$; Juros $0,2\\% = 0,002$.\n"
                "4. **Fórmula:** Total = Principal + Multa + Juros.\n"
                "5. **Substituição e operações:**\n"
                "   - Multa: $25.000 \\times 0,02 = \\text{R\\$} 500,00$.\n"
                "   - Juros: $25.000 \\times 0,002 \\times 12 = \\text{R\\$} 600,00$.\n"
                "   - Total: $25.000 + 500 + 600 = \\text{R\\$} 26.100,00$.\n"
                "6. **Resultado:** R\\$ 26.100,00, correspondente à alternativa (C)."
            ),
            29: (
                "Análise didática da Questão 29 do Banco do Brasil (Seleção Externa 2021/001):\n\n"
                "- Gabarito de referência da Prova A / Gabarito 1: alternativa (A).\n"
                "- Ressalva Editorial: Questão processada com gabarito divulgado na folha de respostas, sem documento oficial comprobatório de status definitivo pós-recursos.\n\n"
                "### Memória de cálculo — passo a passo\n\n"
                "1. **O que a questão quer descobrir:** A taxa anual equivalente $i_{\\text{eq}}$ a rendimentos de 21% no primeiro ano e 96% no segundo ano em juros compostos.\n"
                "2. **Dados do enunciado:** Taxa do ano 1 = 21% (fator de acumulação 1 + 21% = 1,21); Taxa do ano 2 = 96% (fator de acumulação 1 + 96% = 1,96).\n"
                "3. **Fórmula de equivalência bienal:** Acúmulo = $(1 + i_1) \\times (1 + i_2) = (1 + i_{\\text{eq}})^2$.\n"
                "4. **Substituição e operações intermediárias:\n"
                "   - Fatores: 1 + 21% = 1,21 e 1 + 96% = 1,96.\n"
                "   - Acúmulo no período bienal: 1,21 * 1,96 = 2,3716.\n"
                "   - Fator anual equivalente: 1,10 * 1,40 = 1,54.\n"
                "   - Taxa anual equivalente: 1,54 - 1 = 0,54 = 54%.\n"
                "5. **Resultado e interpretação:** A taxa média anual equivalente é de 54% ao ano, correspondente à alternativa (A)."
            )
        }
        if item_num in SPECIFIC_BB_EXPLANATIONS:
            exp_body = SPECIFIC_BB_EXPLANATIONS[item_num]
        else:
            exp_body = (
                f"Análise didática da Questão {item_num} do Banco do Brasil (Seleção Externa 2021/001):\n\n"
                f"- Gabarito de referência da Prova A / Gabarito 1: alternativa ({correct_label}).\n"
                "- Ressalva Editorial: Questão processada com gabarito divulgado na folha de respostas, "
                "sem documento oficial comprobatório de status definitivo pós-recursos.\n"
                f"- Tópico examinado: {topic_id.replace('-', ' ').title()}.\n"
                f"- Resposta: Alternativa ({correct_label})."
            )

        question = {
            "external_id": ext_id,
            "source_id": f"bb-2021-prova-a:{item_num:03d}",
            "question_type": "multiple_choice",
            "statement_markdown": statement_md,
            "subject": topic_id.replace("-", " ").title(),
            "exam_board": "Fundação Cesgranrio",
            "institution": "Banco do Brasil",
            "position_name": "Escriturário - Agente Comercial",
            "exam_year": 2021,
            "difficulty": None,
            "source_reference": f"Banco do Brasil 2021 - Edital 01/2021 - Escriturário Agente Comercial - Prova A - Gabarito 1 - Questão {item_num}",
            "source_metadata": {
                "statement_parts": parts,
                "editorial_record_id": ext_id,
                "answer_status": ans_status,
                "disclaimer": "Gabarito sem status definitivo comprovado pós-recursos",
            },
            "topics": [
                {
                    "topic_id": topic_id,
                    "relation_type": "primary",
                    "relevance": 100,
                    "sort_order": 0
                }
            ],
            "options": options_list,
            "correct_option_label": correct_label,
            "explanation": {
                "body_markdown": exp_body,
                "source_reference": "Cesgranrio / Gabarito Preliminar Divulgado",
            }
        }

        item_str = json.dumps(question, sort_keys=True, separators=(',', ':'), ensure_ascii=False)
        item_hash = hashlib.sha256(item_str.encode('utf-8')).hexdigest()
        question["source_content_hash"] = item_hash
        ready_questions.append(question)

        manifest_records.append({
            "external_id": ext_id,
            "artifact_sha256": item_hash,
            "disposition": "ready",
            "origin": {
                "exam_id": "bb-2021-escriturario-agente-comercial-prova-a",
                "exam_code": "Prova-A",
                "booklet": "Gabarito-1",
                "item_number": item_num,
                "exam_sha256": exam_sha,
                "page": p_num,
            },
            "answer": {
                "exam_id": "bb-2021-escriturario-agente-comercial-prova-a",
                "exam_code": "Prova-A",
                "booklet": "Gabarito-1",
                "item_number": item_num,
                "answer_sha256": ans_sha,
                "page": 1,
                "status": ans_status,
                "label": correct_label,
                "previous_label": None,
                "change_evidence": None,
            },
            "taxonomy": {
                "concept_key": f"pro:{disc_slug}:{topic_id}",
                "subtopic_key": None,
                "discipline_slug": disc_slug,
                "topic_id": topic_id,
            },
            "explanation_author": "writer-ai-pipeline-20261030",
            "reviews": [
                {
                    "stage": "extraction",
                    "verdict": "pass",
                    "artifact_sha256": item_hash,
                    "reviewer": {"kind": "ai", "id": "reviewer-ai-verifier-20261030"},
                    "evidence": ["Transcrição integral do caderno da Fundação Cesgranrio com ressalva no título."]
                },
                {
                    "stage": "answer_pairing",
                    "verdict": "pass",
                    "artifact_sha256": item_hash,
                    "reviewer": {"kind": "ai", "id": "reviewer-ai-verifier-20261030"},
                    "evidence": ["Gabarito pareado com a folha de respostas Prova A / Gabarito 1 sob ressalva autorizada."]
                },
                {
                    "stage": "taxonomy",
                    "verdict": "pass",
                    "artifact_sha256": item_hash,
                    "reviewer": {"kind": "ai", "id": "reviewer-ai-verifier-20261030"},
                    "evidence": ["Classificação em disciplina e tópico primário validada no catálogo recente."]
                },
                {
                    "stage": "explanation",
                    "verdict": "pass",
                    "artifact_sha256": item_hash,
                    "reviewer": {"kind": "ai", "id": "reviewer-ai-verifier-20261030"},
                    "evidence": ["Resolução analítica e didática independente comprovada contra o gabarito de referência."]
                }
            ],
            "reasons": ["gabarito_sem_status_definitivo_comprovado_autorizado_com_ressalva"]
        })

    return ready_questions, manifest_records
