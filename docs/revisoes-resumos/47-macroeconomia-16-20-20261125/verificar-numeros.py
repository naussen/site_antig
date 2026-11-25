from pathlib import Path
import json,math
checks=[]
def check(name,a,e):
    assert math.isclose(a,e,rel_tol=1e-10,abs_tol=1e-10),(name,a,e)
    checks.append({'name':name,'actual':a,'expected':e})
C,D,R=20,80,16
M=C+D;BM=C+R;c=C/M;d=D/M;r=R/D;kappa=C/D
check('M1',M,100);check('BM',BM,36);check('caixa e reservas BC',6+10,R)
check('c',c,.2);check('d',d,.8);check('c mais d',c+d,1);check('r',r,.2);check('kappa',kappa,.25)
check('k razao direta',M/BM,25/9);check('k c rd',1/(c+r*d),25/9)
check('k forma d',1/(1-d*(1-r)),25/9);check('k forma kappa',(1+kappa)/(kappa+r),25/9)
check('sem numerario publico',(0+100)/(0+20),5);check('r igual um',(C+D)/(C+D),1)
check('todo dinheiro com publico',(100+0)/(100+0),1)
check('saque preserva M1',(C+10)+(D-10),M);check('saque preserva BM',(C+10)+(R-10),BM)
check('credito novo eleva M1',C+(D+50),150);check('pagamento principal reduz M1',C+(D-20),80)
check('transferencia poupanca M1',C+D-20,80);check('transferencia poupanca M2',(M-20)+(10+20),M+10)
check('conversao cambial',5*100,500);check('alta cotacao direta pct',100*(5.5/5-1),10)
check('queda cotacao inversa pct',100*((1/5.5)/(1/5)-1),-100/11)
check('CF passivos 30',10-30,-20);check('CF passivos 40',10-40,-30)
check('PPC absoluta inicial',100/20,5);check('q inicial',5*20/100,1)
E1=5*1.06/1.02
check('PPC relativa exata',E1,5.196078431372549)
check('taxa depreciacao exata pct',100*(E1/5-1),3.92156862745098)
check('q final constante',E1*(20*1.02)/(100*1.06),1)
check('aproximacao inflacao diferencial pct',100*(.06-.02),4)
# Identity and causal assumptions must be distinguished.
check('MV igual PY',100*4,2*200)
p=Path(__file__).parent
(p/'verificacao-numerica.json').write_text(json.dumps({'ok':True,'checks_count':len(checks),'checks':checks},ensure_ascii=False,indent=2)+chr(10),encoding='utf-8')
print(len(checks),'verificacoes numericas aprovadas')
