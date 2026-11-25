import json,math,re
from pathlib import Path
p=Path(__file__).parent
checks=[]
def check(name,actual,expected):
    assert math.isclose(actual,expected,rel_tol=1e-10,abs_tol=1e-10),(name,actual,expected)
    checks.append({'name':name,'actual':actual,'expected':expected})
check('estoque involuntario',100-90,10)
check('estoque total pode ser planejado',8+0,8)
C=20+.8*50; S=50-C
check('consumo com poupanca negativa',C,60);check('poupanca negativa',S,-10)
check('propensao media consumo',C/50,1.2);check('propensao media poupanca',S/50,-.2)
c=.75;t=.2;a=.1;m=.1
b=c*(1-t)+a-m;K=1/(1-b);A=20-c*10+30+50+40-10;Y=A*K
check('inclinacao',b,.6);check('multiplicador',K,2.5);check('autonomo',A,122.5);check('renda equilibrio',Y,306.25)
Yd=Y-(10+t*Y);C=20+c*Yd;I=30+a*Y;M=10+m*Y
check('substituicao independente na despesa',C+I+50+40-M,Y)
check('efeito gasto 10',K*10,25);check('efeito tributo 10',-c*K*10,-18.75)
check('efeito transferencia 10',c*K*10,18.75);check('efeito importacao autonoma 10',-K*10,-25)
check('variacao conjunta autonoma G T',K*(1-c)*10,6.25)
check('orcamento equilibrado caso basico',(1-c)/(1-c)*10,10)
checks.append({'name':'denominador nulo inadmissivel','actual':1-(.8+.2),'expected':0})
# Solve by substituting IS into LM; then independently test each equation.
scenarios=[]
for name,G,B,er,eY in [('Inicial',300,300,4,800),('Fiscal',350,300,5,850),('Monetaria',300,350,3,850)]:
    r=(.5*(400+2*G)-B)/50; y=400+2*G-50*r
    check(name+' juros',r,er);check(name+' renda',y,eY)
    check(name+' mercado bens',y-400-2*G+50*r,0);check(name+' mercado moeda',.5*y-25*r,B)
    scenarios.append({'name':name,'G':G,'B':B,'r':r,'Y':y})
check('fiscal com juros fixos',400+2*350-50*4,900)
check('moeda necessaria a juros fixos',.5*900-25*4,350)
rows=json.loads((p/'proposta.json').read_text(encoding='utf-8'))
chart=json.loads(re.search(r'```quant-chart\n(.*?)\n```',next(s['content_markdown'] for s in rows if s['section_id']=='macroeconomia-sec-14'),re.S)[1])
assert [pt['value'] for pt in chart['data']]==[s['Y'] for s in scenarios]
(p/'verificacao-numerica.json').write_text(json.dumps({'ok':True,'checks_count':len(checks),'checks':checks,'chart_points_match_equations':True,'scenarios':scenarios},ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(len(checks),'verificacoes numericas aprovadas e dados do grafico conferidos')
