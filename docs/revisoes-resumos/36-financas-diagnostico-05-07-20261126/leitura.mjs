import fs from 'node:fs';import assert from 'node:assert/strict';
import {createClient} from 'file:///C:/PRO/site/node_modules/@supabase/supabase-js/dist/index.mjs';
import {fetchState} from '../../../saneamento-onda-5/manifesto-preparacao-onda5.mjs';
import {normalizeSectionContent,sha256} from '../../../saneamento-onda-4/manifesto_saneamento_onda4.mjs';
const folder=import.meta.dirname,read=n=>JSON.parse(fs.readFileSync(`${folder}/${n}`,'utf8'));
const sb=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY,{auth:{persistSession:false,autoRefreshToken:false}});
const [actual,ethics]=await Promise.all([fetchState(sb,[{discipline:'Finanças Públicas'}]),fetchState(sb,[{discipline:'Ética no Serviço Público'}])]);
const accepted=read('../../35-etica-no-servico-publico/aceite-documental-20261125/matriz-aceite.json');assert.equal(ethics.sections.length,20);
for(const row of accepted.sections){const s=ethics.sections.find(x=>x.section_id===row.section_id);assert.ok(s);assert.equal(s.current_revision_id,row.current_revision_id);assert.equal(sha256(normalizeSectionContent(s)),row.content_sha256);}
assert.equal(actual.topics.length,1);assert.equal(actual.sections.length,7);
const selected=actual.sections.filter(s=>[5,6,7].some(n=>s.section_id===`financas-publicas-sec-0${n}`));assert.equal(selected.length,3);
const previous=read('../secoes-01-04-20261126-v2/preimagem.json'),reviewed=read('../secoes-01-04-20261126-v2/secoes-revisadas.json'),receipt=read('../secoes-01-04-20261126-v2/reconciliacao.json');
for(const s of actual.sections){const expected=reviewed.find(x=>x.section_id===s.section_id)||previous.sections.find(x=>x.section_id===s.section_id);assert.equal(sha256(normalizeSectionContent(s)),sha256(normalizeSectionContent(expected)));const rev=receipt.revisions.find(x=>x.section_id===s.section_id)||expected;assert.equal(s.current_revision_id,rev.current_revision_id);}
const proposals=read('../secoes-revisadas.json').filter(x=>selected.some(s=>s.section_id===x.section_id));
const result={checked_at:new Date().toISOString(),date:'2026-11-26',mode:'diagnostico_somente_select',database_writes:0,topics:actual.topics,total_sections:7,selected_sections:selected,current_revisions:actual.sections.map(({section_id,current_revision_id})=>({section_id,current_revision_id})),published01_04_preserved:true,all7_contents_and_revisions_preserved:true,ethics20_contents_and_revisions_preserved:true,local_proposals:proposals.map(p=>({section_id:p.section_id,same_as_current:sha256(normalizeSectionContent(p))===sha256(normalizeSectionContent(selected.find(s=>s.section_id===p.section_id)))})),components:{texts:3,callouts:selected.reduce((n,s)=>n+s.callouts.length,0),maps:selected.filter(s=>s.mermaid_mindmap).length,flashcards:selected.reduce((n,s)=>n+s.flashcards.length,0),mnemonics:selected.reduce((n,s)=>n+s.mnemonics.length,0)}};
fs.writeFileSync(`${folder}/estado-atual.json`,JSON.stringify(result,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify(result,null,2));
