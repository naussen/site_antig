import json
from fractions import Fraction

# Equilibrium without tax: S(p) = -400 + 400p, D(p) = 5000 - 500p
p_e = Fraction(5400, 900)
q_e = -400 + 400 * p_e
assert p_e == 6 and q_e == 2000

# 1. Specific tax T = 0.9 = 9/10
t_spec = Fraction(9, 10)
# -400 + 400*(pc - t_spec) = 5000 - 500*pc => 900*pc = 5400 + 360 = 5760
pc_spec = Fraction(5760, 900)
pp_spec = pc_spec - t_spec
q_spec = 5000 - 500 * pc_spec
rev_spec = t_spec * q_spec
cb_spec = pc_spec - p_e
pb_spec = p_e - pp_spec
dwl_spec = Fraction(1, 2) * t_spec * (q_e - q_spec)
assert pc_spec == Fraction(32, 5) and pp_spec == Fraction(11, 2)
assert q_spec == 1800 and rev_spec == 1620
assert cb_spec + pb_spec == t_spec

# 2. Ad valorem por dentro: tau = 10% = 1/10 -> pp = (1 - tau)*pc = (9/10)*pc
tau_in = Fraction(1, 10)
# -400 + 400*(9/10)*pc = 5000 - 500*pc => (360 + 500)*pc = 5400 => 860*pc = 5400
pc_in = Fraction(5400, 860)
pp_in = (1 - tau_in) * pc_in
unit_in = pc_in - pp_in
q_in = 5000 - 500 * pc_in
rev_in = unit_in * q_in
cb_in = pc_in - p_e
pb_in = p_e - pp_in
dwl_in = Fraction(1, 2) * unit_in * (q_e - q_in)
assert pc_in == Fraction(270, 43) and pp_in == Fraction(243, 43)
assert q_in == Fraction(80000, 43) and unit_in == Fraction(27, 43)
assert rev_in == Fraction(2160000, 1849)
assert cb_in == Fraction(12, 43) and pb_in == Fraction(15, 43)
assert cb_in + pb_in == unit_in

# 3. Ad valorem por fora: tau = 10% = 1/10 -> pc = (1 + tau)*pp = (11/10)*pp => pp = (10/11)*pc
tau_out = Fraction(1, 10)
# -400 + 400*(10/11)*pc = 5000 - 500*pc => (4000/11 + 5500/11)*pc = 5400 => (9500/11)*pc = 5400
pc_out = Fraction(5400 * 11, 9500)
pp_out = pc_out / (1 + tau_out)
unit_out = pc_out - pp_out
q_out = 5000 - 500 * pc_out
rev_out = unit_out * q_out
cb_out = pc_out - p_e
pb_out = p_e - pp_out
dwl_out = Fraction(1, 2) * unit_out * (q_e - q_out)
assert pc_out == Fraction(594, 95) and pp_out == Fraction(108, 19)
assert q_out == Fraction(35600, 19) and unit_out == Fraction(54, 95)
assert rev_out == Fraction(384480, 361)
assert cb_out == Fraction(24, 95) and pb_out == Fraction(6, 19)
assert cb_out + pb_out == unit_out

# 4. Progressive hypothetical examples
tax_3500 = 1000 * Fraction(10, 100) + 1000 * Fraction(20, 100) + 1500 * Fraction(25, 100)
avg_3500 = (tax_3500 / 3500) * 100
assert tax_3500 == 675 and round(float(avg_3500), 2) == 19.29

tax_4000 = 1000 * Fraction(10, 100) + 2000 * Fraction(20, 100) + 1000 * Fraction(25, 100)
avg_4000 = (tax_4000 / 4000) * 100
assert tax_4000 == 750 and float(avg_4000) == 18.75

# 5. Regressive consumption tax example
tax_ind = Fraction(170, 1)
w_5000 = (tax_ind / 5000) * 100
w_20000 = (tax_ind / 20000) * 100
assert float(w_5000) == 3.4 and float(w_20000) == 0.85

# 6. Section 07 fiscal examples
rev_ex = 250 + 10 + 100
exp_ex = 300 + 80 + 20
saldo_prim = rev_ex - exp_ex
nfsp_prim = exp_ex - rev_ex
assert rev_ex == 360 and exp_ex == 400 and saldo_prim == -40 and nfsp_prim == 40

# Below-the-line reconciliation example:
# Delta_DLSP = +100, Ajustes patrimoniais e metodologicos = +30 (ex.: variacao cambial líquida +40, reconhecimento +10, privatizacao -20 => liquido +30)
# NFSP_nominal = Delta_DLSP - Ajustes = 100 - 30 = 70 (deficit nominal de 70; saldo nominal = -70)
# Se juros nominais liquidos = 50, NFSP_primaria = 70 - 50 = 20 (deficit primario de 20; saldo primario = -20)
delta_dlsp = 100
ajustes_liq = 40 + 10 - 20
nfsp_nom = delta_dlsp - ajustes_liq
juros_nom = 50
nfsp_pri = nfsp_nom - juros_nom
assert ajustes_liq == 30 and nfsp_nom == 70 and nfsp_pri == 20
assert nfsp_pri + juros_nom + ajustes_liq == delta_dlsp

def fmt_case(name, pc, pp, q, unit, rev, cb, pb, dwl):
    return {
        "case": name,
        "pc": {"exact": f"{pc.numerator}/{pc.denominator}", "decimal_7": round(float(pc), 7), "decimal_4": round(float(pc), 4), "decimal_2": round(float(pc), 2)},
        "pp": {"exact": f"{pp.numerator}/{pp.denominator}", "decimal_7": round(float(pp), 7), "decimal_4": round(float(pp), 4), "decimal_2": round(float(pp), 2)},
        "quantity": {"exact": f"{q.numerator}/{q.denominator}", "decimal_6": round(float(q), 6), "decimal_2": round(float(q), 2)},
        "unit_tax": {"exact": f"{unit.numerator}/{unit.denominator}", "decimal_7": round(float(unit), 7), "decimal_4": round(float(unit), 4)},
        "revenue": {"exact": f"{rev.numerator}/{rev.denominator}", "decimal_6": round(float(rev), 6), "decimal_2": round(float(rev), 2)},
        "consumer_burden": {"exact": f"{cb.numerator}/{cb.denominator}", "decimal_7": round(float(cb), 7), "decimal_4": round(float(cb), 4)},
        "producer_burden": {"exact": f"{pb.numerator}/{pb.denominator}", "decimal_7": round(float(pb), 7), "decimal_4": round(float(pb), 4)},
        "deadweight_loss": {"exact": f"{dwl.numerator}/{dwl.denominator}", "decimal_6": round(float(dwl), 6)}
    }

out = {
    "checked_on": "2026-11-26",
    "method": "Aritmética racional exata (Python fractions.Fraction), sem arredondamento intermediário.",
    "initial_equilibrium": {"pe": 6, "qe": 2000},
    "tax_incidence": [
        fmt_case("especifico_0_90", pc_spec, pp_spec, q_spec, t_spec, rev_spec, cb_spec, pb_spec, dwl_spec),
        fmt_case("ad_valorem_por_dentro_10pct", pc_in, pp_in, q_in, unit_in, rev_in, cb_in, pb_in, dwl_in),
        fmt_case("ad_valorem_por_fora_10pct", pc_out, pp_out, q_out, unit_out, rev_out, cb_out, pb_out, dwl_out),
    ],
    "reference_match": {
        "por_dentro_pc_6_2790698": round(float(pc_in), 7) == 6.2790698,
        "por_dentro_q_1860_465116": round(float(q_in), 6) == 1860.465116,
        "por_dentro_rev_1168_199027": round(float(rev_in), 6) == 1168.199027,
        "por_fora_pc_6_2526316": round(float(pc_out), 7) == 6.2526316,
        "por_fora_q_1873_684211": round(float(q_out), 6) == 1873.684211,
        "por_fora_rev_1065_041551": round(float(rev_out), 6) == 1065.041551,
    },
    "progressive_examples": {
        "income_3500": {"tax": int(tax_3500), "avg_pct_2dec": round(float(avg_3500), 2), "marginal_pct": 25},
        "income_4000": {"tax": int(tax_4000), "avg_pct_2dec": round(float(avg_4000), 2), "marginal_pct": 25}
    },
    "regressive_example": {
        "tax_amount": 170,
        "share_5000_pct": float(w_5000),
        "share_20000_pct": float(w_20000)
    },
    "lump_sum_algebra": {
        "formula": "T(y) = K (K > 0)",
        "marginal_rate": "dT/dy = 0",
        "average_rate": "T(y)/y = K/y (decrescente para y > 0)"
    },
    "fiscal_examples_sec07": {
        "above_the_line": {"revenues": rev_ex, "expenses": exp_ex, "primary_balance": saldo_prim, "primary_nfsp": nfsp_prim},
        "below_the_line_reconciliation": {
            "delta_dlsp": delta_dlsp,
            "net_adjustments": ajustes_liq,
            "nominal_nfsp": nfsp_nom,
            "nominal_interest": juros_nom,
            "primary_nfsp": nfsp_pri,
            "nominal_balance": -nfsp_nom,
            "primary_balance": -nfsp_pri
        }
    }
}
assert all(out["reference_match"].values())
with open(r"C:\PRO\revisoes-resumos\orquestracao-03-54\saneamento-onda-7\36-financas-publicas\secoes-05-07-20261126\verificacao-numerica.json", "w", encoding="utf-8") as f:
    json.dump(out, f, ensure_ascii=False, indent=2)
    f.write("\n")
print("OK: verificacao-numerica.json gravado e todas as asserções passaram.")
