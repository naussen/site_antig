import fs from 'node:fs';import {createHash} from 'node:crypto';import assert from 'node:assert/strict';
import {createClient} from 'file:///C:/PRO/site/node_modules/@supabase/supabase-js/dist/index.mjs';
import {fetchState,compareState} from '../../../saneamento-onda-5/manifesto-preparacao-onda5.mjs';
import {normalizeSectionContent,sha256} from '../../../saneamento-onda-4/manifesto_saneamento_onda4.mjs';
const folder=import.meta.dirname,read=n=>JSON.parse(fs.readFileSync(`${folder}/${n}`,'utf8'));
const save=(n,d)=>fs.writeFileSync(`${folder}/${n}`,JSON.stringify(d,null,2)+'\n',{flag:'wx'});
const batches=['teoricos-01-20261125','legislacao-01-04-20261125','legislacao-05-09-20261125','legislacao-10-14-20261125','legislacao-15-18-20261125','cidadania-democracia-01-20261125'];
const expectedRows=[],matrix=[],batchEvidence=[];
for(const batch of batches){
 const rows=read(`../${batch}/secoes-revisadas.json`),receipt=read(`../${batch}/reconciliacao.json`),cp=read(`../${batch}/checkpoint.json`),visual=read(`../${batch}/render-visual.json`),application=read(`../${batch}/aplicacao-recibo.json`);
 assert.ok(receipt.ok);assert.ok(visual.checks.every(c=>c.ok));assert.equal(visual.checks.length,rows.length*6);assert.equal(visual.manifest_sha256,sha256(rows));
 assert.ok(fs.existsSync(`${folder}/../${batch}/fontes.json`));
 const revisions=receipt.revisions||[receipt.revision];
 const previous=read(`../${batch}/preimagem.json`).sections;
 for(const row of rows){
  const revision=revisions.find(r=>r?.section_id===row.section_id)?.current_revision_id||previous.find(r=>r.section_id===row.section_id)?.current_revision_id;assert.ok(revision);
  expectedRows.push({...row,current_revision_id:revision});
  matrix.push({section_id:row.section_id,topic_id:row.topic_id,title:row.title,content_unit_id:row.content_unit_id,stable_key:row.stable_key,current_revision_id:revision,content_sha256:sha256(normalizeSectionContent(row)),review_batch:batch,disposition:revisions.some(r=>r?.section_id===row.section_id)?(batch.startsWith('cidadania')?'adicionada_publicada':'corrigida_publicada'):'conferida_sem_edicao',visual_combinations:visual.checks.filter(c=>c.id===row.section_id).length,components:{callouts:row.callouts.length,maps:Number(Boolean(row.mermaid_mindmap)),flashcards:row.flashcards.length,mnemonics:row.mnemonics.length}});
 }
 if(batch.startsWith('cidadania')){assert.equal(application.rows.length,1);assert.equal(application.rows[0].current_revision_id,revisions[0].current_revision_id);}
 else assert.equal(application.status,'completed');
 batchEvidence.push({batch,sections:rows.length,visual_passed:visual.checks.length,reconciled:true,application_receipt:true,checkpoint_status:cp.status,evidence_hashes:Object.fromEntries(['checkpoint.json','secoes-revisadas.json','reconciliacao.json','render-visual.json','fontes.json','aplicacao-recibo.json'].map(n=>[n,createHash('sha256').update(fs.readFileSync(`${folder}/../${batch}/${n}`)).digest('hex')]))});
}
assert.equal(expectedRows.length,20);assert.equal(new Set(expectedRows.map(s=>s.section_id)).size,20);
const sb=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY,{auth:{persistSession:false,autoRefreshToken:false}});
const actual=await fetchState(sb,[{discipline:'Ética no Serviço Público'}]);
const base=read('../cidadania-democracia-01-20261125/preimagem.json');
const parity=compareState({disciplines:[{...base,sections:expectedRows}]},{operations:[]},actual);assert.ok(parity.ok,JSON.stringify(parity));assert.equal(actual.topics.length,3);assert.equal(actual.sections.length,20);
for(const row of expectedRows)assert.equal(actual.sections.find(s=>s.section_id===row.section_id).current_revision_id,row.current_revision_id);
const before=read('../cidadania-democracia-01-20261125/vinculos-depois.json'),ids=before.topics.map(t=>t.topic_id),links={};
for(const [key,table] of [['topics','topics'],['relations','question_topic_relations'],['disciplines','topic_discipline_relations']]){const r=await sb.from(table).select('*').in('topic_id',ids);assert.ifError(r.error);links[key]=r.data;}
const r=await sb.from('topic_id_redirects').select('*').or(ids.flatMap(id=>[`old_topic_id.eq.${id}`,`new_topic_id.eq.${id}`]).join(','));assert.ifError(r.error);links.redirects=r.data;
const norm=a=>a.map(x=>JSON.stringify(x)).sort();for(const k of Object.keys(links))assert.deepEqual(norm(links[k]),norm(before[k]));
const empty=actual.topics.filter(t=>!actual.sections.some(s=>s.topic_id===t.topic_id));assert.equal(empty.length,0);
const totals={sections:20,topics_active:3,topics_physical:links.topics.length,callouts:matrix.reduce((n,s)=>n+s.components.callouts,0),maps:matrix.reduce((n,s)=>n+s.components.maps,0),flashcards:matrix.reduce((n,s)=>n+s.components.flashcards,0),mnemonics:matrix.reduce((n,s)=>n+s.components.mnemonics,0),visual_passed:batchEvidence.reduce((n,b)=>n+b.visual_passed,0),corrected:matrix.filter(s=>s.disposition==='corrigida_publicada').length,unchanged:matrix.filter(s=>s.disposition==='conferida_sem_edicao').length,added:matrix.filter(s=>s.disposition==='adicionada_publicada').length};
save('matriz-aceite.json',{date:'2026-11-25',mode:'consolidacao_documental_sem_revisao_editorial_nova',totals,batches:batchEvidence,sections:matrix});
save('conferencia-atual.json',{checked_at:new Date().toISOString(),database_writes:0,parity,revision_ids_preserved:20,revision_fingerprint:sha256(actual.sections.map(({section_id,current_revision_id})=>({section_id,current_revision_id}))),content_fingerprint:sha256(actual.sections.map(normalizeSectionContent)),topics:actual.topics.map(t=>({...t,sections:actual.sections.filter(s=>s.topic_id===t.topic_id).length})),empty_topics:empty,bindings_and_physical_catalog_preserved:true,decree_redirect_preserved:true,archived_topics:links.topics.filter(t=>t.archived_at).map(({topic_id,title,archived_at})=>({topic_id,title,archived_at})),questions_relations_count:links.relations.length,discipline_relations_count:links.disciplines.length});
console.log(JSON.stringify({parity,totals,bindings_preserved:true,database_writes:0}));
