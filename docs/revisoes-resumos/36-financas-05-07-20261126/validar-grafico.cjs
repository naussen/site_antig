const fs=require('node:fs'),os=require('node:os'),path=require('node:path'),assert=require('node:assert/strict');
const {pathToFileURL}=require('node:url');
const esbuild=require('C:/PRO/site/tmp/netlify-cli/node_modules/esbuild');
async function main(){
 const rows=JSON.parse(fs.readFileSync(path.join(__dirname,'proposta.json'),'utf8'));
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'pro-chart-schema-'));
 await esbuild.build({entryPoints:['C:/PRO/site/.worktrees/informatica-hardware-20261123/src/lib/quantitative-chart.ts'],bundle:true,platform:'node',format:'esm',outfile:path.join(dir,'schema.mjs')});
 const {parseQuantitativeChart}=await import(pathToFileURL(path.join(dir,'schema.mjs')));
 const extracted=[];
 for(const row of rows){
  const matches=[...row.content_markdown.matchAll(/```quant-chart\n([\s\S]*?)\n```/g)];
  for(const m of matches){
   const parsed=parseQuantitativeChart(m[1]);
   assert.ok(parsed,`Gráfico inválido em ${row.section_id}`);
   extracted.push({section_id:row.section_id,title:parsed.title,type:parsed.type,points:parsed.data.length,values:parsed.data.map(d=>d.value)});
  }
 }
 assert.equal(extracted.length,4);
 assert.deepEqual(extracted[0].values,[2000,1800,1860.47,1873.68]);
 assert.deepEqual(extracted[1].values,[1,2]);
 assert.deepEqual(extracted[2].values,[0,3,0,-3,0,3,0]);
 assert.deepEqual(extracted[3].values,[0,1,0,-1,0,1,0]);
 const sample=JSON.parse(rows[0].content_markdown.match(/```quant-chart\n([\s\S]*?)\n```/)[1]);
 const bad=[JSON.stringify({...sample,url:'javascript:alert(1)'}),JSON.stringify({...sample,type:'script'}),JSON.stringify({...sample,data:[{label:'x',value:'<script>alert(1)</script>'}]}),JSON.stringify({...sample,data:[{label:'unico',value:1}]})];
 for(const b of bad)assert.equal(parseQuantitativeChart(b),null);
 fs.writeFileSync(path.join(__dirname,'validacao-grafico.json'),JSON.stringify({ok:true,sharedSchema:true,validCharts:extracted.length,invalidRejected:bad.length,charts:extracted},null,2)+'\n');
 console.log('Schema compartilhado: 4 gráficos válidos, 4 controles inválidos rejeitados');
}
main().catch(e=>{console.error(e);process.exitCode=1});
