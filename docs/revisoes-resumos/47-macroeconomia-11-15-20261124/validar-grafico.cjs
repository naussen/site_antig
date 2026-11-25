const fs=require('node:fs'),os=require('node:os'),path=require('node:path'),assert=require('node:assert/strict');
const {pathToFileURL}=require('node:url');
const esbuild=require('C:/PRO/site/tmp/netlify-cli/node_modules/esbuild');
async function main(){
 const rows=JSON.parse(fs.readFileSync(path.join(__dirname,'proposta.json'),'utf8'));
 const body=rows.find(s=>s.section_id==='macroeconomia-sec-14').content_markdown;
 const source=body.match(/```quant-chart\n([\s\S]*?)\n```/)[1];
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'pro-chart-schema-'));
 await esbuild.build({entryPoints:['C:/PRO/site/.worktrees/informatica-hardware-20261123/src/lib/quantitative-chart.ts'],bundle:true,platform:'node',format:'esm',outfile:path.join(dir,'schema.mjs')});
 const {parseQuantitativeChart}=await import(pathToFileURL(path.join(dir,'schema.mjs')));
 const valid=parseQuantitativeChart(source);assert.ok(valid);assert.deepEqual(valid.data.map(s=>s.value),[800,850,850]);
 const bad=[JSON.stringify({...valid,url:'javascript:alert(1)'}),JSON.stringify({...valid,type:'script'}),JSON.stringify({...valid,data:[{label:'x',value:'<script>alert(1)</script>'}]})];
 for(const b of bad)assert.equal(parseQuantitativeChart(b),null);
 fs.writeFileSync(path.join(__dirname,'validacao-grafico.json'),JSON.stringify({ok:true,sharedSchema:true,validCharts:1,invalidRejected:3,values:valid.data.map(s=>s.value)},null,2)+'\n');
 console.log('Schema compartilhado: um grafico valido, tres controles invalidos rejeitados');
}
main().catch(e=>{console.error(e);process.exitCode=1});
