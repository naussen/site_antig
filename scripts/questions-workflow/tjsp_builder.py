"""Construtor oficial das 100 questões do TJSP 2021 (Escrevente Técnico Judiciário - Versão 2).
Confrontado com o Gabarito Oficial Definitivo da Fundação Vunesp (DJE / Vunesp 2021-2022):
- 96 questões com gabarito definitivo confirmado e comentários individualizados aprofundados.
- 4 questões anuladas oficialmente pela banca (30, 78, 87 e 97), mantidas com disposition held.
- 23 questões dependentes de contexto com todos os 5 textos-base recuperados integralmente (F01).
- Alternativa E da Questão 22 devidamente delimitada sem contaminação (F02).
- Tabela da planilha Markdown integrada à Questão 83 de Excel (F01).
- Taxonomia corrigida e mapeada nos tópicos canônicos (F03), incluindo Q49 em nacionalidade.
- Comentários explicativos, didáticos e fundamentados para todos os 96 itens publicáveis (F04).
- Mapeamento determinístico da página física real no caderno de prova e no gabarito (F05/R09).
- Des-hifenização conservadora preservando clíticos e compostos (F09/R11).
"""
from __future__ import annotations

import fitz
import json
import hashlib
import re
from typing import Any

from tjsp_explanations import TJSP_DETAILED_EXPLANATIONS

CLITICS = {'me', 'te', 'se', 'nos', 'vos', 'o', 'a', 'os', 'as', 'lhe', 'lhes', 'lo', 'la', 'los', 'las', 'no', 'na', 'nos', 'nas'}
PREFIXES = {'pré', 'pós', 'pró', 'recém', 'vice', 'ex', 'auto', 'semi', 'super', 'anti', 'sub'}

def clean_pdf_text(text: str | None) -> str | None:
    if not text:
        return None

    def replace_hyphen(m: re.Match) -> str:
        w1, w2 = m.group(1), m.group(2)
        lower1 = w1.lower()
        lower2 = w2.lower()
        # Se a segunda palavra é um pronome clítico (ex: aplica-se, prendê-la), preserva hífen
        if lower2 in CLITICS:
            return f"{w1}-{w2}"
        # Se a primeira palavra é um prefixo que exige hífen (ex: pré-escola), preserva hífen
        if lower1 in PREFIXES:
            return f"{w1}-{w2}"
        # Translineação artificial em palavra simples (ex: remune-ração -> remuneração)
        return f"{w1}{w2}"

    # Desfaz hifenizações de translineação artificiais conservadoramente
    t = re.sub(r'(\b[a-zA-ZáéíóúâêôãõçÁÉÍÓÚÂÊÔÃÕÇ]+)-\s*\n\s*([a-zA-ZáéíóúâêôãõçÁÉÍÓÚÂÊÔÃÕÇ]+\b)', replace_hyphen, text)
    # Remove marcas de URL malformadas preservando o conteúdo
    t = re.sub(r'<\s*https?://([^>]+)>', r'\1', t)
    t = re.sub(r'<[^>]+>', '', t)
    # Remove eventuais cabeçalhos residuais
    t = re.sub(r'\b\d+\s+Raciocínio Lógico\b', '', t, flags=re.IGNORECASE)
    t = re.sub(r'\b\d+\s+LÍNGUA PORTUGUESA\b', '', t, flags=re.IGNORECASE)
    t = re.sub(r'\b\d+\s+Direito Processual Penal\b', '', t, flags=re.IGNORECASE)
    # Espaçamento normalizado
    t = re.sub(r'[ \t]+', ' ', t)
    t = re.sub(r'\n\s*\n+', '\n\n', t)
    return t.strip()

# Gabarito Oficial Definitivo Vunesp - Versão 2 (Caderno 100 questões)
OFFICIAL_KEYS = {
    1: "E", 2: "B", 3: "D", 4: "A", 5: "A", 6: "C", 7: "B", 8: "D", 9: "E", 10: "B",
    11: "C", 12: "C", 13: "A", 14: "B", 15: "E", 16: "D", 17: "C", 18: "A", 19: "C", 20: "B",
    21: "A", 22: "C", 23: "D", 24: "E", 25: "B", 26: "C", 27: "D", 28: "A", 29: "E", 30: "ANULADA",
    31: "C", 32: "A", 33: "C", 34: "D", 35: "E", 36: "A", 37: "B", 38: "C", 39: "C", 40: "A",
    41: "D", 42: "E", 43: "A", 44: "B", 45: "C", 46: "E", 47: "D", 48: "D", 49: "A", 50: "E",
    51: "C", 52: "D", 53: "B", 54: "A", 55: "A", 56: "E", 57: "D", 58: "C", 59: "A", 60: "E",
    61: "B", 62: "D", 63: "E", 64: "C", 65: "A", 66: "B", 67: "C", 68: "E", 69: "D", 70: "A",
    71: "B", 72: "B", 73: "E", 74: "C", 75: "A", 76: "D", 77: "E", 78: "ANULADA", 79: "B", 80: "A",
    81: "D", 82: "E", 83: "D", 84: "B", 85: "B", 86: "A", 87: "ANULADA", 88: "C", 89: "C", 90: "C",
    91: "E", 92: "B", 93: "B", 94: "A", 95: "D", 96: "A", 97: "ANULADA", 98: "E", 99: "E", 100: "B"
}

# Matriz Taxonômica Oficial Canônica (coerente com question_discipline_relations e question_topic_relations)
TAXONOMY_MAP = {
    # Língua Portuguesa (1 a 24)
    1: ("portugues", "compreensao-e-interpretacao-de-textos"),
    2: ("portugues", "compreensao-e-interpretacao-de-textos"),
    3: ("portugues", "sintaxe"),
    4: ("portugues", "sintaxe"),
    5: ("portugues", "semantica-e-significacao-das-palavras"),
    6: ("portugues", "sintaxe"),
    7: ("portugues", "compreensao-e-interpretacao-de-textos"),
    8: ("portugues", "morfologia"),
    9: ("portugues", "sintaxe"),
    10: ("portugues", "semantica-e-significacao-das-palavras"),
    11: ("portugues", "compreensao-e-interpretacao-de-textos"),
    12: ("portugues", "semantica-e-significacao-das-palavras"),
    13: ("portugues", "compreensao-e-interpretacao-de-textos"),
    14: ("portugues", "semantica-e-significacao-das-palavras"),
    15: ("portugues", "semantica-e-significacao-das-palavras"),
    16: ("portugues", "sintaxe"),
    17: ("portugues", "sintaxe"),
    18: ("portugues", "ortografia-e-acentuacao-grafica"),
    19: ("portugues", "compreensao-e-interpretacao-de-textos"),
    20: ("portugues", "compreensao-e-interpretacao-de-textos"),
    21: ("portugues", "compreensao-e-interpretacao-de-textos"),
    22: ("portugues", "morfologia"),
    23: ("portugues", "sintaxe"),
    24: ("portugues", "morfologia"),
    # Direito Penal (25 a 30)
    25: ("direito-penal", "crimes-contra-a-administracao-publica"),
    26: ("direito-penal", "crimes-contra-a-administracao-publica"),
    27: ("direito-penal", "crimes-contra-a-administracao-publica"),
    28: ("direito-penal", "crimes-contra-a-administracao-publica"),
    29: ("direito-penal", "crimes-contra-a-administracao-publica"),
    30: ("direito-penal", "crimes-contra-a-administracao-publica"),
    # Direito Processual Penal (31 a 37)
    31: ("direito-processual-penal", "inquerito-policial"),
    32: ("direito-processual-penal", "inquerito-policial"),
    33: ("direito-processual-penal", "inquerito-policial"),
    34: ("direito-processual-penal", "acao-penal-ap"),
    35: ("direito-processual-penal", "acao-penal-ap"),
    36: ("direito-processual-penal", "acao-penal-ap"),
    37: ("direito-processual-penal", "acao-penal-ap"),
    # Direito Processual Civil (38 a 44)
    38: ("direito-processual-civil", "atos-processuais"),
    39: ("direito-processual-civil", "atos-processuais"),
    40: ("direito-processual-civil", "atos-processuais"),
    41: ("direito-processual-civil", "atos-processuais"),
    42: ("direito-processual-civil", "procedimento-comum"),
    43: ("direito-processual-civil", "procedimento-comum"),
    44: ("direito-processual-civil", "procedimento-comum"),
    # Direito Constitucional (45 a 50)
    45: ("direito-constitucional", "administracao-publica"),
    46: ("direito-constitucional", "administracao-publica"),
    47: ("direito-constitucional", "direitos-e-garantias-fundamentais"),
    48: ("direito-constitucional", "nacionalidade-e-direitos-politicos"),
    49: ("direito-constitucional", "nacionalidade-e-direitos-politicos"), # F03/R03: cargos privativos de brasileiro nato em Nacionalidade
    50: ("direito-constitucional", "administracao-publica"),
    # Direito Administrativo (51 a 58)
    51: ("direito-administrativo", "regime-juridico-dos-servidores-lei-8112"),
    52: ("direito-administrativo", "regime-juridico-dos-servidores-lei-8112"),
    53: ("direito-administrativo", "regime-juridico-dos-servidores-lei-8112"),
    54: ("direito-administrativo", "regime-juridico-dos-servidores-lei-8112"),
    55: ("direito-administrativo", "improbidade-administrativa"),
    56: ("direito-administrativo", "improbidade-administrativa"),
    57: ("direito-administrativo", "improbidade-administrativa"),
    58: ("direito-administrativo", "improbidade-administrativa"),
    # Normas da Corregedoria (59 a 64)
    59: ("direito-administrativo", "atos-administrativos"),
    60: ("direito-administrativo", "atos-administrativos"),
    61: ("direito-administrativo", "atos-administrativos"),
    62: ("direito-administrativo", "atos-administrativos"),
    63: ("direito-administrativo", "atos-administrativos"),
    64: ("direito-administrativo", "atos-administrativos"),
    # Atualidades (65 a 68)
    65: ("atualidades", "atualidades"),
    66: ("atualidades", "atualidades"),
    67: ("atualidades", "atualidades"),
    68: ("atualidades", "atualidades"),
    # Pessoa com Deficiência (69 e 70)
    69: ("direito-da-pessoa-com-deficiencia", "estatuto-da-pessoa-com-deficiencia-lei-13-146-15"),
    70: ("direito-da-pessoa-com-deficiencia", "estatuto-da-pessoa-com-deficiencia-lei-13-146-15"),
    # Matemática (71 a 76)
    71: ("matematica", "aritmetica-e-algebra"),
    72: ("matematica", "aritmetica-e-algebra"),
    73: ("matematica", "aritmetica-e-algebra"),
    74: ("matematica", "geometria-plana-e-espacial"),
    75: ("matematica", "geometria-plana-e-espacial"),
    76: ("matematica", "geometria-plana-e-espacial"),
    # Informática (77 a 90)
    77: ("informatica", "sistemas-operacionais-windows-e-linux"),
    78: ("informatica", "sistemas-operacionais-windows-e-linux"),
    79: ("informatica", "sistemas-operacionais-windows-e-linux"),
    80: ("informatica", "sistemas-operacionais-windows-e-linux"),
    81: ("informatica", "ferramentas-de-escritorio-office-e-libreoffice"),
    82: ("informatica", "ferramentas-de-escritorio-office-e-libreoffice"),
    83: ("informatica", "ferramentas-de-escritorio-office-e-libreoffice"),
    84: ("informatica", "ferramentas-de-escritorio-office-e-libreoffice"),
    85: ("informatica", "ferramentas-de-escritorio-office-e-libreoffice"),
    86: ("informatica", "conceitos-de-internet-navegadores-e-pesquisa"),
    87: ("informatica", "conceitos-de-internet-navegadores-e-pesquisa"),
    88: ("informatica", "conceitos-de-internet-navegadores-e-pesquisa"),
    89: ("informatica", "conceitos-de-internet-navegadores-e-pesquisa"),
    90: ("informatica", "seguranca-da-informacao"),
    # Raciocínio Lógico (91 a 100)
    91: ("raciocinio-logico", "proposicoes-e-conectivos-logicos"),
    92: ("raciocinio-logico", "proposicoes-e-conectivos-logicos"),
    93: ("raciocinio-logico", "proposicoes-e-conectivos-logicos"),
    94: ("raciocinio-logico", "proposicoes-e-conectivos-logicos"),
    95: ("raciocinio-logico", "proposicoes-e-conectivos-logicos"),
    96: ("raciocinio-logico", "proposicoes-e-conectivos-logicos"),
    97: ("raciocinio-logico", "estruturas-logicas-e-diagramas-logicos"),
    98: ("raciocinio-logico", "estruturas-logicas-e-diagramas-logicos"),
    99: ("raciocinio-logico", "estruturas-logicas-e-diagramas-logicos"),
    100: ("raciocinio-logico", "estruturas-logicas-e-diagramas-logicos"),
}

def get_ordered_text(doc: fitz.Document) -> str:
    pages_text = []
    for p_idx in range(2, len(doc)):
        page = doc[p_idx]
        blocks = page.get_text("blocks")
        col1 = [b for b in blocks if b[0] < 300 and b[1] > 20 and b[1] < 805]
        col2 = [b for b in blocks if b[0] >= 300 and b[1] > 20 and b[1] < 805]
        col1.sort(key=lambda b: b[1])
        col2.sort(key=lambda b: b[1])
        lines = []
        for b in col1 + col2:
            for line in b[4].splitlines():
                if not re.search(r"pcimarkpci|pciconcursos|cursos\.com\.br|TJSP2101|EscreventeTécnicoJudiciário|Confidencial", line):
                    lines.append(line)
        pages_text.append("\n".join(lines))
    return "\n\n".join(pages_text)

def build_tjsp_questions() -> tuple[list[dict], list[dict]]:
    """Retorna (lista_questoes_prontas_96, lista_registros_manifesto_todos_100)."""
    doc = fitz.open(r"C:\PRO\questoes\novas_pdf_30-10\escrevente_tecnico_judiciario.pdf")
    exam_sha = "47c322cfecd1da0c00de8fad61f05c85d6fbf26ff05b294a89812fb1cae551bf"
    ans_sha = "6802c8ee31f4015b277652acddb8ae088e06489b554259a5fb413a1f587b70da"

    # Mapear determinísticamente a página física real (1-based, 1 a 28) de cada uma das 100 questões no PDF da prova
    item_physical_pages = {}
    for p_idx in range(len(doc)):
        txt = doc[p_idx].get_text()
        for q in range(1, 101):
            if q in item_physical_pages:
                continue
            pat = rf'(?:^|\n)\s*{q:02d}\.\s+' if q < 100 else rf'(?:^|\n)\s*{q}\.\s+'
            if re.search(pat, txt):
                item_physical_pages[q] = p_idx + 1

    if len(item_physical_pages) != 100:
        missing = [q for q in range(1, 101) if q not in item_physical_pages]
        raise RuntimeError(f"Falha ao localizar páginas físicas de todas as questões: {missing}")

    full_text = get_ordered_text(doc)

    # 1. Recuperar os 5 textos de apoio de Português
    # Texto 1 (Q01 a Q05)
    t1_m = re.search(r"(Amor é para gastar.*?\([^\)]*Xico Sá[^\)]*\))", full_text, re.DOTALL)
    texto_1 = clean_pdf_text(t1_m.group(1)) if t1_m else None
    if not texto_1:
        raise RuntimeError("Texto-base 1 (Q01-Q05, 'Amor é para gastar') não foi extraído.")

    # Texto 2 (Q06 a Q10) com as 4 lacunas
    t2_m = re.search(r"(Perto do apagão.*?\([^\)]*Folha de S\.Paulo[^\)]*\))", full_text, re.DOTALL)
    if not t2_m:
        raise RuntimeError("Texto-base 2 (Q06-Q10, 'Perto do apagão') não foi extraído.")
    raw_t2 = re.sub(r'[\u2000-\u200f\s]{3,}', ' ______ ', t2_m.group(1))
    texto_2 = clean_pdf_text(raw_t2)

    # Texto 3 (Q11 a Q17) - "Vida ao natural" (Clarice Lispector) na página física 5
    t3_m = re.search(r"(Vida ao natural\b.*?\([^\)]*Clarice Lispector[^\)]*\)\s*\*\s*pequeno pedaço de madeira usado para lenha)", full_text, re.DOTALL)
    if not t3_m:
        raise RuntimeError("Texto-base 3 (Q11-Q17, 'Vida ao natural') não foi extraído.")
    texto_3 = clean_pdf_text(t3_m.group(1))

    # Texto 4 (Q19 a Q22) - Campanha antitabagista e nota explicativa de Cringe na página física 6
    t4_m = re.search(r"(O Dia Nacional de Combate ao Fumo.*?\(https://g1\.globo\.com\))", full_text, re.DOTALL)
    if not t4_m:
        raise RuntimeError("Texto-base 4 (Q19-Q22, Dia Nacional de Combate ao Fumo + Cringe) não foi extraído.")
    texto_4 = clean_pdf_text(t4_m.group(1))

    # Texto 5 (Q23 e Q24) - Motivação (Cameron Walker)
    t5_m = re.search(r"(Motivação é a energia.*?\([^\)]*Cameron Walker[^\)]*\))", full_text, re.DOTALL)
    if not t5_m:
        raise RuntimeError("Texto-base 5 (Q23-Q24, 'Motivação') não foi extraído.")
    raw_t5 = re.sub(r'[\u2000-\u200f\s]{3,}', ' ______ ', t5_m.group(1))
    texto_5 = clean_pdf_text(raw_t5)

    # Mapeamento estrito dos 23 itens que exigem texto-base
    question_base_text = {}
    for i in range(1, 6):
        question_base_text[i] = texto_1
    for i in range(6, 11):
        question_base_text[i] = texto_2
    for i in range(11, 18):
        question_base_text[i] = texto_3
    for i in range(19, 23):
        question_base_text[i] = texto_4
    for i in range(23, 25):
        question_base_text[i] = texto_5

    # 2. Localizar posições das 100 questões no texto ordenado
    positions = []
    for q in range(1, 101):
        pat = rf"(?:^|\n)\s*{q:02d}\.\s+" if q < 100 else rf"(?:^|\n)\s*{q}\.\s+"
        m = re.search(pat, full_text)
        if m:
            positions.append((q, m.start(), m.end()))

    sorted_pos = sorted(positions, key=lambda x: x[1])
    if len(sorted_pos) != 100:
        raise RuntimeError(f"Esperadas 100 posições de questões, encontradas {len(sorted_pos)}")

    extracted_raw = {}
    for i in range(len(sorted_pos)):
        q_num, s, e = sorted_pos[i]
        next_s = sorted_pos[i+1][1] if i + 1 < len(sorted_pos) else len(full_text)
        content = full_text[e:next_s].strip()
        extracted_raw[q_num] = content

    ready_questions = []
    manifest_records = []

    for item_num in range(1, 101):
        ext_id = f"exam:tjsp-2021-escrevente-tecnico:item:{item_num:03d}"
        key_label = OFFICIAL_KEYS[item_num]
        is_anulada = key_label == "ANULADA"
        ans_status = "anulada" if is_anulada else "definitivo"
        disc_slug, topic_id = TAXONOMY_MAP[item_num]

        raw_content = extracted_raw[item_num]

        # Tratamento individual de alternativas
        if item_num == 22:
            # Limpeza cirúrgica da Questão 22: alternativa E termina antes do cabeçalho das questões 23 e 24
            opt_match = re.search(
                r"\n?\s*\(A\)\s+(.*?)\n?\s*\(B\)\s+(.*?)\n?\s*\(C\)\s+(.*?)\n?\s*\(D\)\s+(.*?)\n?\s*\(E\)\s+(.*)$",
                raw_content,
                re.DOTALL
            )
            command = clean_pdf_text(raw_content[:opt_match.start()].strip())
            opts = [clean_pdf_text(opt_match.group(j).strip()) for j in range(1, 5)]
            raw_e = opt_match.group(5)
            # Corta rigorosamente antes de qualquer chamada para a questão 23/24
            for cut_marker in ["Leia o texto para responder", "Motivação é a energia"]:
                cut_idx = raw_e.find(cut_marker)
                if cut_idx != -1:
                    raw_e = raw_e[:cut_idx]
            opts.append(clean_pdf_text(raw_e.strip()))
        elif item_num == 30:
            # Limpeza cirúrgica de resíduo de cabeçalho da Questão 30 na alternativa E
            opt_match = re.search(
                r"\n?\s*\(A\)\s+(.*?)\n?\s*\(B\)\s+(.*?)\n?\s*\(C\)\s+(.*?)\n?\s*\(D\)\s+(.*?)\n?\s*\(E\)\s+(.*)$",
                raw_content,
                re.DOTALL
            )
            command = clean_pdf_text(raw_content[:opt_match.start()].strip())
            opts = [clean_pdf_text(opt_match.group(j).strip()) for j in range(1, 5)]
            raw_e = opt_match.group(5)
            # Remove cabeçalho residual "Direito Processual Penal"
            raw_e = re.sub(r'Direito Processual Penal\s*$', '', raw_e, flags=re.IGNORECASE).strip()
            opts.append(clean_pdf_text(raw_e))
        elif item_num == 74:
            opt_idx = raw_content.find("(A)")
            command = clean_pdf_text(raw_content[:opt_idx].strip()) if opt_idx != -1 else clean_pdf_text(raw_content)
            opts = ["1/5", "1/2", "1/4", "1/6", "1/3"]
        elif item_num == 83:
            # Inclusão da tabela Markdown da planilha de Excel
            opt_match = re.search(
                r"\n?\s*\(A\)\s+(.*?)\n?\s*\(B\)\s+(.*?)\n?\s*\(C\)\s+(.*?)\n?\s*\(D\)\s+(.*?)\n?\s*\(E\)\s+(.*)$",
                raw_content,
                re.DOTALL
            )
            raw_cmd = raw_content[:opt_match.start()].strip()
            table_md = (
                "\n\n| | A | B | C | D |\n"
                "|---|---|---|---|---|\n"
                "| **1** | **Atividade** | **Descrição** | **Responsável** | |\n"
                "| **2** | AT1 | Planejamento | André | |\n"
                "| **3** | AT2 | Projeto | Manoel | |\n"
                "| **4** | AT3 | Teste | João | |\n\n"
            )
            cut_pt = raw_cmd.find("Deseja-se inserir")
            if cut_pt != -1:
                cmd_p1 = clean_pdf_text(raw_cmd[:cut_pt].strip())
                cmd_p2 = clean_pdf_text(raw_cmd[cut_pt:].strip())
                command = f"{cmd_p1}{table_md}{cmd_p2}"
            else:
                command = f"{clean_pdf_text(raw_cmd)}{table_md}"
            opts = [clean_pdf_text(opt_match.group(j).strip()) for j in range(1, 6)]
        elif item_num == 97:
            opt_idx = raw_content.find("(A)")
            command = clean_pdf_text(raw_content[:opt_idx].strip()) if opt_idx != -1 else clean_pdf_text(raw_content)
            opts = [
                "Vértice superior esquerdo",
                "Vértice superior direito",
                "Vértice inferior direito",
                "Vértice inferior central",
                "Vértice inferior esquerdo"
            ]
        elif item_num == 89:
            opt_match = re.search(
                r"\n?\s*\(A\)\s+(.*?)\n?\s*\(B\)\s+(.*?)\n?\s*\(C\)\s+(.*?)\n?\s*\(D\)\s+(.*?)\n?\s*\(E\)\s+(.*)$",
                raw_content,
                re.DOTALL
            )
            command = clean_pdf_text(raw_content[:opt_match.start()].strip())
            opts = [
                "caminho :// protocolo / domínio",
                "domínio :// caminho / protocolo",
                "protocolo :// domínio / caminho",
                "domínio :// protocolo / caminho",
                "protocolo :// caminho / domínio"
            ]
        else:
            opt_match = re.search(
                r"\n?\s*\(A\)\s+(.*?)\n?\s*\(B\)\s+(.*?)\n?\s*\(C\)\s+(.*?)\n?\s*\(D\)\s+(.*?)\n?\s*\(E\)\s+(.*)$",
                raw_content,
                re.DOTALL
            )
            if not opt_match:
                raise ValueError(f"Falha ao extrair alternativas da questão {item_num} do TJSP.")
            command = clean_pdf_text(opt_match.group(0) and raw_content[:opt_match.start()].strip())
            opts = [clean_pdf_text(opt_match.group(j).strip()) for j in range(1, 6)]

        # Montagem do Markdown e validação de contexto obrigatório
        base_text = question_base_text.get(item_num)
        if item_num in question_base_text and not base_text:
            raise RuntimeError(f"Questão {item_num} declaradamente dependente de texto-base não possui contexto válido.")

        if base_text:
            statement_md = f"## Texto-base\n\n{base_text}\n\n## Enunciado\n\n{command}"
            parts_context = base_text
        else:
            statement_md = f"## Enunciado\n\n{command}"
            parts_context = None

        parts = {
            "title": f"Questão {item_num}",
            "context": parts_context,
            "source": None,
            "introduction": None,
            "command": command,
            "assertion": None
        }

        options_list = [
            {"label": "A", "body_markdown": opts[0], "sort_order": 0},
            {"label": "B", "body_markdown": opts[1], "sort_order": 1},
            {"label": "C", "body_markdown": opts[2], "sort_order": 2},
            {"label": "D", "body_markdown": opts[3], "sort_order": 3},
            {"label": "E", "body_markdown": opts[4], "sort_order": 4},
        ]

        # Comentário explicativo individualizado e fundamentado
        if is_anulada:
            exp_body = (
                f"Questão {item_num} do TJSP (Escrevente Técnico Judiciário - Versão 2):\n\n"
                f"- **Status Oficial:** Questão ANULADA pela Fundação Vunesp no Gabarito Oficial Definitivo pós-recursos.\n"
                "- Conforme as normas do edital e da banca examinadora, a pontuação referente a esta questão "
                "foi atribuída a todos os candidatos que prestaram o certame no Diário da Justiça Eletrônico de SP."
            )
        elif item_num in TJSP_DETAILED_EXPLANATIONS:
            exp_body = TJSP_DETAILED_EXPLANATIONS[item_num]
        else:
            raise RuntimeError(f"Questão {item_num} sem comentário didático específico em TJSP_DETAILED_EXPLANATIONS.")

        question = {
            "external_id": ext_id,
            "source_id": f"tjsp-2021-escrevente:{item_num:03d}",
            "question_type": "multiple_choice",
            "statement_markdown": statement_md,
            "subject": topic_id.replace("-", " ").title(),
            "exam_board": "Vunesp",
            "institution": "Tribunal de Justiça do Estado de São Paulo",
            "position_name": "Escrevente Técnico Judiciário",
            "exam_year": 2021,
            "difficulty": None,
            "source_reference": f"TJSP 2021 - Escrevente Técnico Judiciário - Caderno Versão 2 - Questão {item_num}",
            "source_metadata": {
                "statement_parts": parts,
                "editorial_record_id": ext_id,
                "answer_status": ans_status,
                "disclaimer": "Questão anulada pela banca" if is_anulada else "Gabarito Oficial Definitivo Vunesp / Caderno Versão 2",
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
            "correct_option_label": "N" if is_anulada else key_label,
            "explanation": {
                "body_markdown": exp_body,
                "source_reference": "Fundação Vunesp - Gabarito Oficial Definitivo pós-recursos (DJE SP)",
            }
        }

        item_str = json.dumps(question, sort_keys=True, separators=(',', ':'), ensure_ascii=False)
        item_hash = hashlib.sha256(item_str.encode('utf-8')).hexdigest()
        question["source_content_hash"] = item_hash

        disposition = "held" if is_anulada else "ready"
        if not is_anulada:
            ready_questions.append(question)

        # Na tabela da Versão 2 de gabarito (5).pdf, todas as 100 questões estão na Página 1
        ans_page = 1
        # Página física real no caderno de prova (1 a 28)
        exam_real_page = item_physical_pages[item_num]

        manifest_records.append({
            "external_id": ext_id,
            "artifact_sha256": item_hash,
            "disposition": disposition,
            "origin": {
                "exam_id": "tjsp-2021-escrevente-tecnico-judiciario",
                "exam_code": "Escrevente-SP",
                "booklet": "Versao-2",
                "item_number": item_num,
                "exam_sha256": exam_sha,
                "page": exam_real_page,
            },
            "answer": {
                "exam_id": "tjsp-2021-escrevente-tecnico-judiciario",
                "exam_code": "Escrevente-SP",
                "booklet": "Versao-2",
                "item_number": item_num,
                "answer_sha256": ans_sha,
                "page": ans_page,
                "status": ans_status,
                "label": "N" if is_anulada else key_label,
                "previous_label": None,
                "change_evidence": "Anulada oficialmente no gabarito definitivo pós-recursos pela Fundação Vunesp (DJE SP)" if is_anulada else "Gabarito definitivo confirmado pós-recursos",
            },
            "taxonomy": {
                "concept_key": f"pro:{disc_slug}:{topic_id}",
                "discipline_slug": disc_slug,
                "topic_id": topic_id,
                "classification_origin": "edital_oficial_tjsp_2021",
                "catalog_resolved": True,
            }
        })

    return ready_questions, manifest_records
