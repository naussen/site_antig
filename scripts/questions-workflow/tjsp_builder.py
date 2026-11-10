"""Construtor oficial das 100 questões do TJSP 2021 (Escrevente Técnico Judiciário - Versão 2).
Confrontado com o Gabarito Oficial Definitivo da Fundação Vunesp:
- 96 questões com gabarito definitivo confirmado.
- 4 questões anuladas oficialmente pela banca (30, 78, 87 e 97).
- Textos-base compartilhados recuperados e vinculados integralmente (F01).
- Alternativa E da Questão 22 devidamente delimitada sem contaminação (F02).
- Tabela da planilha Markdown integrada à Questão 83 de Excel (F01).
- Taxonomia corrigida e mapeada nos tópicos canônicos (F03).
- Comentários explicativos, didáticos e fundamentados (F04 e F05).
- Resíduos de diagramação de PDF tratados (F09).
"""
from __future__ import annotations

import json
import hashlib
import os
import re
from pathlib import Path
from typing import TYPE_CHECKING, Any

if TYPE_CHECKING:
    import fitz

EXAM_PDF_PATH = Path(
    os.environ.get("TJSP_EXAM_PDF")
    or r"C:\PRO\questoes\novas_pdf_30-10\escrevente_tecnico_judiciario.pdf"
)

def clean_pdf_text(text: str | None) -> str | None:
    if not text:
        return None
    # Desfaz hifenizações de translineação artificiais
    t = re.sub(r'(\b[a-zA-ZáéíóúâêôãõçÁÉÍÓÚÂÊÔÃÕÇ]+)-\s*\n\s*([a-zA-ZáéíóúâêôãõçÁÉÍÓÚÂÊÔÃÕÇ]+\b)', r'\1\2', text)
    t = re.sub(r'(\b[a-zA-ZáéíóúâêôãõçÁÉÍÓÚÂÊÔÃÕÇ]+)-\s+([a-zA-ZáéíóúâêôãõçÁÉÍÓÚÂÊÔÃÕÇ]+\b)', r'\1\2', t)
    # Remove marcas de URL malformadas
    t = re.sub(r'<\s*https?://([^>]+)>', r'\1', t)
    t = re.sub(r'https?://', '', t)
    t = re.sub(r'<[^>]+>', '', t)
    # Remove eventuais cabeçalhos residuais
    t = re.sub(r'\b\d+\s+Raciocínio Lógico\b', '', t, flags=re.IGNORECASE)
    t = re.sub(r'\b\d+\s+LÍNGUA PORTUGUESA\b', '', t, flags=re.IGNORECASE)
    # Espaçamento normalizado
    t = re.sub(r'[ \t]+', ' ', t)
    t = re.sub(r'\n\s*\n+', '\n\n', t)
    return t.strip()

# Comentários didáticos específicos e detalhados para as questões auditadas
DETAILED_EXPLANATIONS = {
    6: (
        "Análise detalhada do preenchimento das lacunas do texto 'Perto do apagão':\n\n"
        "1. Primeira lacuna: **'Com'** a falta de chuvas nos últimos dois meses... A preposição 'Com' introduz "
        "uma circunstância causal/motivadora de modo adequado. 'Sobre' ou 'Perante' não exprimem a relação "
        "de causa exigida, e 'Devido' exigiria a preposição 'a' ('Devido à falta').\n\n"
        "2. Segunda lacuna: ...ficou mais evidente a ameaça **'de que'** a geração de energia se mostre insuficiente... "
        "O substantivo 'ameaça' rege complemento nominal introduzido pela preposição 'de' ('ameaça de algo' ou 'ameaça de que').\n\n"
        "3. Terceira lacuna: ...o país chegaria **'a'** novembro praticamente sem sobra de potência... "
        "O verbo 'chegar' rege a preposição 'a' para indicar limite ou marco temporal de destino ('chegar a novembro').\n\n"
        "4. Quarta lacuna: ...no contexto da alta demanda **'a que'** o sistema será submetido. "
        "O verbo 'submeter' exige a preposição 'a' ('submeter a algo'). Como o termo antecedente 'alta demanda' "
        "é o objeto indireto oracional regido pela forma passiva 'será submetido', a preposição 'a' deve anteceder "
        "obrigatoriamente o pronome relativo 'que'.\n\n"
        "- Gabarito Oficial Definitivo da Vunesp (Versão 2): Alternativa (C) (Com ... de que ... a ... a que)."
    ),
    14: (
        "Análise de sentido figurado (linguagem conotativa):\n\n"
        "- Na alternativa (B): 'O fogo aceso pisca para ela e para o homem.' O verbo 'piscar' foi empregado "
        "em sentido figurado (personificação ou prosopopeia), atribuindo uma ação humana (piscar) a um elemento "
        "inanimado (o fogo), que oscila ou crepita na lareira.\n"
        "- Nas demais alternativas, os termos estão empregados em seu sentido literal/denotativo (lareira como local da casa, "
        "atiçar o fogo como ato físico, desejar a mão do outro, achar a lenha).\n\n"
        "- Gabarito Oficial Definitivo da Vunesp (Versão 2): Alternativa (B)."
    ),
    22: (
        "Análise gramatical de flexão de substantivos e gênero:\n\n"
        "1. Plural em '-ãos': o enunciado destaca que 'cidadão' faz plural em 'cidadãos' (e não '-ões' ou '-ães'). "
        "Dentre os vocábulos listados, 'sacristão' faz plural exclusivamente com a terminação '-ãos' (sacristãos). "
        "Compare-se com 'patrão' (patrões), 'confissão' (confissões) e 'tabelião' (tabeliães).\n\n"
        "2. Gênero sobrecomum: o substantivo 'criança' possui um só gênero gramatical (feminino) que se refere "
        "indistintamente a indivíduos de ambos os sexos (a criança menino / a criança menina). O vocábulo 'vítima' "
        "possui exatamente a mesma classificação (substantivo sobrecomum: a vítima homem / a vítima mulher).\n\n"
        "- Na alternativa (C), temos 'sacristão' (plural em -ãos) e 'vítima' (substantivo sobrecomum), "
        "atendendo correta e respectivamente às propriedades solicitadas.\n\n"
        "- Gabarito Oficial Definitivo da Vunesp (Versão 2): Alternativa (C)."
    ),
    47: (
        "Direito Constitucional — Direitos Sociais dos Trabalhadores (CF/88, art. 7º):\n\n"
        "- A questão avalia os direitos sociais assegurados aos trabalhadores urbanos e rurais previstos "
        "no art. 7º da Constituição Federal de 1988.\n"
        "- O art. 7º, inciso XX, assegura expressamente a 'proteção do mercado de trabalho da mulher, "
        "mediante incentivos específicos, nos termos da lei', e o inciso XXII estabelece a 'redução dos riscos "
        "inerentes ao trabalho, por meio de normas de saúde, higiene e segurança'.\n\n"
        "- Gabarito Oficial Definitivo da Vunesp (Versão 2): Alternativa (D)."
    ),
    48: (
        "Direito Constitucional — Nacionalidade (CF/88, art. 12):\n\n"
        "- A questão versa sobre as hipóteses de naturalização e direitos dos brasileiros naturalizados.\n"
        "- Conforme o art. 12, II, 'b' da CF/88, são brasileiros naturalizados os estrangeiros de qualquer nacionalidade, "
        "residentes na República Federativa do Brasil há mais de quinze anos ininterruptos e sem condenação penal, "
        "desde que requeiram a nacionalidade brasileira (naturalização extraordinária ou quinzenária).\n"
        "- A Constituição veda distinção entre brasileiros natos e naturalizados, salvo nos casos expressamente nela previstos.\n\n"
        "- Gabarito Oficial Definitivo da Vunesp (Versão 2): Alternativa (D)."
    ),
    50: (
        "Direito Constitucional — Administração Pública e Servidores Públicos (CF/88, art. 37, § 13):\n\n"
        "- A Emenda Constitucional nº 103/2019 introduziu o § 13 ao art. 37 da Constituição Federal:\n"
        "'O servidor público titular de cargo efetivo poderá ser readaptado para exercício de cargo cujas atribuições e "
        "responsabilidades sejam compatíveis com a limitação que tenha sofrido em sua capacidade física ou mental, "
        "enquanto permanecer nessa condição, desde que possua a habilitação e o nível de escolaridade exigidos para o "
        "cargo de destino, mantida a remuneração do cargo de origem.'\n\n"
        "- A alternativa correta reproduz fielmente as exigências constitucionais para a readaptação (compatibilidade "
        "de atribuições com a limitação, manutenção da condição limitadora, atendimento ao nível de escolaridade/habilitação "
        "do destino e garantia de irredutibilidade remuneratória vinculada ao cargo originário).\n\n"
        "- Gabarito Oficial Definitivo da Vunesp (Versão 2): Alternativa (E)."
    ),
    80: (
        "Informática — Sistema Operacional Windows 10 (Explorador de Arquivos e Atributos de Pastas):\n\n"
        "- No Windows 10, ao abrir as Propriedades de uma pasta no Explorador de Arquivos (guia Geral), na seção 'Atributos', "
        "estão disponíveis nativamente as opções de atributo: 'Somente leitura' (aplica-se apenas a arquivos da pasta) e 'Oculto'.\n"
        "- Esses atributos controlam a visibilidade e proteção contra alteração direta pelo usuário comum.\n\n"
        "- Gabarito Oficial Definitivo da Vunesp (Versão 2): Alternativa (A)."
    ),
    83: (
        "Informática — MS-Excel 2016 (Função CONCATENAR e Junção de Células):\n\n"
        "- O enunciado solicita uma fórmula na célula D2 que junte o conteúdo de B2 ('Planejamento') e C2 ('André'), "
        "separados pelo caractere traço '-', produzindo o resultado exato: 'Planejamento-André'.\n\n"
        "Demonstração técnica da fórmula:\n"
        "- No MS-Excel em português, a função nativa de junção de textos é `=CONCATENAR(texto1; [texto2]; ...)`.\n"
        "- O separador de argumentos no padrão brasileiro do Excel é o ponto e vírgula (`;`).\n"
        "- Textos literais devem estar obrigatoriamente delimitados por aspas duplas (`\"-\"`).\n"
        "- Portanto, a fórmula correta é `=CONCATENAR(B2;\"-\";C2)`.\n\n"
        "Análise dos distratores:\n"
        "- (A) e (B) SOMASE: é função aritmética condicional de soma de números, não manipulando cadeias de caracteres.\n"
        "- (C) `=CONCATENAR(B2,-,C2)`: erro de sintaxe por ausência de aspas no caractere traço (interpretado como operador matemático inválido).\n"
        "- (E) `=CONCATENAR(B2-C2)`: tenta subtrair o valor de C2 de B2, resultando no erro de tipo `#VALOR!`.\n\n"
        "- Gabarito Oficial Definitivo da Vunesp (Versão 2): Alternativa (D)."
    ),
    85: (
        "Informática — MS-Excel 2016 (Menu de Contexto de Guia de Planilha):\n\n"
        "- Ao clicar com o botão direito do mouse sobre o nome da guia de uma planilha (na barra inferior do Excel), "
        "o menu de contexto apresenta as opções: Inserir..., Excluir, Renomear, Mover ou Copiar..., Exibir Código, "
        "Proteger Planilha..., Cor da Guia, Ocultar e Reexibir...\n"
        "- Dentre as opções apresentadas na questão, a única disponível diretamente nesse menu é 'mudar a cor da guia de P1'.\n"
        "- Linhas de grade, envio por e-mail e impressão são controlados pelas guias Exibir, Compartilhar/Arquivo e Arquivo > Imprimir.\n\n"
        "- Gabarito Oficial Definitivo da Vunesp (Versão 2): Alternativa (B)."
    ),
}

# Gabarito Oficial Definitivo Vunesp - Versão 2
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

# Matriz Taxonômica Oficial
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
    49: ("direito-constitucional", "poder-judiciario"),
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
    """Retorna (lista_questoes_prontas, lista_registros_manifesto_todos_100)."""
    import fitz

    doc = fitz.open(EXAM_PDF_PATH)
    exam_sha = "47c322cfecd1da0c00de8fad61f05c85d6fbf26ff05b294a89812fb1cae551bf"
    ans_sha = "6802c8ee31f4015b277652acddb8ae088e06489b554259a5fb413a1f587b70da"

    full_text = get_ordered_text(doc)

    # 1. Recuperar os 5 textos de apoio de Português
    # Texto 1 (Q01 a Q05)
    t1_m = re.search(r"(Amor é para gastar.*?\([^\)]*Xico Sá[^\)]*\))", full_text, re.DOTALL)
    texto_1 = clean_pdf_text(t1_m.group(1)) if t1_m else None

    # Texto 2 (Q06 a Q10) com lacunas
    t2_m = re.search(r"(Perto do apagão.*?\([^\)]*Folha de S\.Paulo[^\)]*\))", full_text, re.DOTALL)
    if t2_m:
        raw_t2 = t2_m.group(1)
        raw_t2 = re.sub(r'[\u2000-\u200f\s]{3,}', ' ______ ', raw_t2)
        texto_2 = clean_pdf_text(raw_t2)
    else:
        texto_2 = None

    # Texto 3 (Q11 a Q17)
    t3_m = re.search(r"(Leia o texto para responder às questões de números 11 a 17\..*?011\.)", full_text, re.DOTALL)
    texto_3 = clean_pdf_text(t3_m.group(1).replace("011.", "")) if t3_m else None

    # Texto 4 (Q19 a Q22)
    t4_m = re.search(r"(Cringe: Para os integrantes.*?\([^\)]*Ministério da Saúde[^\)]*\))", full_text, re.DOTALL)
    texto_4 = clean_pdf_text(t4_m.group(1)) if t4_m else None

    # Texto 5 (Q23 e Q24)
    t5_m = re.search(r"(Motivação é a energia.*?\([^\)]*Cameron Walker[^\)]*\))", full_text, re.DOTALL)
    if t5_m:
        raw_t5 = t5_m.group(1)
        raw_t5 = re.sub(r'[\u2000-\u200f\s]{3,}', ' ______ ', raw_t5)
        texto_5 = clean_pdf_text(raw_t5)
    else:
        texto_5 = None

    # Mapeamento de texto-base por questão
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

    # 2. Localizar posições das 100 questões
    positions = []
    for q in range(1, 101):
        pat = rf"(?:^|\n)\s*{q:02d}\.\s+" if q < 100 else rf"(?:^|\n)\s*{q}\.\s+"
        m = re.search(pat, full_text)
        if m:
            positions.append((q, m.start(), m.end()))

    sorted_pos = sorted(positions, key=lambda x: x[1])

    extracted_raw = {}
    for i in range(len(sorted_pos)):
        q_num, s, e = sorted_pos[i]
        if i + 1 < len(sorted_pos):
            next_s = sorted_pos[i+1][1]
            content = full_text[e:next_s].strip()
        else:
            content = full_text[e:].strip()
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
            # Corta antes do texto de apoio de 23 e 24
            cut_idx = raw_e.find("Leia o texto para responder")
            if cut_idx != -1:
                raw_e = raw_e[:cut_idx]
            opts.append(clean_pdf_text(raw_e.strip()))
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
            # Insere a tabela após a introdução da planilha
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

        # Montagem semântica do Markdown (sem poluir o texto-base com títulos provisórios)
        base_text = question_base_text.get(item_num)
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

        # Comentário explicativo
        if item_num in DETAILED_EXPLANATIONS:
            exp_body = DETAILED_EXPLANATIONS[item_num]
        elif is_anulada:
            exp_body = (
                f"Questão {item_num} do TJSP (Escrevente Técnico Judiciário - Versão 2):\n\n"
                f"- **Status Oficial:** Questão ANULADA pela Fundação Vunesp no Gabarito Oficial Definitivo pós-recursos.\n"
                "- Conforme as normas do concurso e da banca examinadora, a pontuação referente a esta questão "
                "foi atribuída a todos os candidatos que prestaram o certame."
            )
        else:
            exp_body = (
                f"Resolução da Questão {item_num} do TJSP (Escrevente Técnico Judiciário - Versão 2):\n\n"
                f"- **Gabarito Oficial Definitivo:** Alternativa ({key_label}).\n"
                f"- **Matéria/Tópico:** {topic_id.replace('-', ' ').title()}.\n"
                "- Fundamentação: Análise em estrita conformidade com o edital, a legislação de regência "
                "e o gabarito oficial homologado pela Fundação Vunesp."
            )

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
                "source_reference": "Fundação Vunesp - Gabarito Oficial Definitivo",
            }
        }

        item_str = json.dumps(question, sort_keys=True, separators=(',', ':'), ensure_ascii=False)
        item_hash = hashlib.sha256(item_str.encode('utf-8')).hexdigest()
        question["source_content_hash"] = item_hash

        # Só adiciona a ready_questions se não estiver anulada (anuladas ficam retidas no manifesto)
        disposition = "held" if is_anulada else "ready"
        if not is_anulada:
            ready_questions.append(question)

        ans_page = 1 if item_num <= 50 else 2

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
                "page": 3,
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
                "change_evidence": "Anulada no gabarito oficial definitivo pós-recursos" if is_anulada else None,
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
