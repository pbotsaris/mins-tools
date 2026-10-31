import {build} from 'esbuild';
import {createRequire} from 'node:module';
import {readFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const require=createRequire(import.meta.url),wr=createRequire(require.resolve('wrangler/package.json'));
const {Miniflare}=wr('miniflare');
await build({stdin:{contents:"import {readSpace,changeSpace,json,ownerOf} from './lib/space'; export default {async fetch(req){try{const owner=ownerOf(req);return json(req.method==='GET'?await readSpace(owner):await changeSpace(owner,await req.json()))}catch(e){return json({error:e.message},400)}}}",resolveDir:process.cwd(),loader:'ts'},outfile:'.sites-runtime/test-engine.mjs',bundle:true,format:'esm',platform:'browser',external:['cloudflare:workers']});
const mf=new Miniflare({modules:true,scriptPath:'.sites-runtime/test-engine.mjs',compatibilityDate:'2026-05-15',compatibilityFlags:['nodejs_compat'],d1Databases:['DB'],r2Buckets:['BUCKET']});
try{const db=await mf.getD1Database('DB');await db.exec((await readFile('drizzle/0000_familiar_sister_grimm.sql','utf8')).replaceAll('\n',' '));
const request=async(data,user='local-test-user')=>{const r=await mf.dispatchFetch('http://localhost/',{headers:{'oai-authenticated-user-id':user},...(data?{method:'POST',body:JSON.stringify(data)}:{})});return {status:r.status,body:await r.json()}};
let {body:s}=await request();assert.equal(s.revision,0);
const a={op:'add_task',revision:0,requestId:crypto.randomUUID(),listId:'inbox',text:'Teste técnico'};
let r=await request(a);assert.equal(r.status,200);s=r.body;assert.equal(s.lists[0].items.length,1);
r=await request(a);assert.equal(r.body.revision,1);assert.equal(r.body.lists[0].items.length,1);
r=await request({...a,requestId:crypto.randomUUID()});assert.equal(r.status,400);
r=await request(null,'another-user');assert.equal(r.body.lists[0].items.length,0);
r=await request({...a,op:'save_diary',revision:1,text:'',requestId:crypto.randomUUID()});assert.equal(r.status,400);
r=await request({...a,op:'save_diary',revision:1,text:'Um registro de teste.',date:'2026-10-30',audio:{base64:btoa('test-audio-bytes'),mime:'audio/webm'},requestId:crypto.randomUUID()});assert.equal(r.status,200);s=r.body;assert.equal(s.entries.length,1);
assert.ok(await(await mf.getR2Bucket('BUCKET')).get(s.entries[0].audio));
r=await request({op:'delete_diary',revision:s.revision,id:s.entries[0].id,requestId:crypto.randomUUID()});assert.equal(r.status,200);assert.equal(r.body.entries.length,0);assert.equal(await(await mf.getR2Bucket('BUCKET')).get(s.entries[0].audio),null);
// Rich text is additive: old records stay plain; rich documents round-trip with audio.
const rich={version:1,doc:{type:'doc',content:[
 {type:'heading',attrs:{level:2},content:[{type:'text',text:'Meu dia'}]},
 {type:'heading',attrs:{level:3},content:[{type:'text',text:'Detalhes'}]},
 {type:'paragraph',content:[{type:'text',text:'Bom',marks:[{type:'bold'},{type:'italic'}]},{type:'hardBreak'},{type:'text',text:'<img src=x onerror=alert(1)>'}]},
 {type:'bulletList',content:[{type:'listItem',content:[{type:'paragraph',content:[{type:'text',text:'Passeio'}]}]}]},
 {type:'orderedList',attrs:{start:2,type:null},content:[{type:'listItem',content:[{type:'paragraph',content:[{type:'text',text:'Descanso'}]}]}]}
]}};
s=r.body;
const saveRich={op:'save_diary',revision:s.revision,requestId:crypto.randomUUID(),text:'ignored plain representation',richText:rich,audio:{base64:btoa('audio-rich'),mime:'audio/webm'}};
r=await request(saveRich);assert.equal(r.status,200);s=r.body;
assert.deepEqual(s.entries[0].richText,rich);assert.ok(s.entries[0].text.includes('Passeio'));assert.ok(!s.entries[0].text.includes('ignored'));
const richId=s.entries[0].id,richAudio=s.entries[0].audio;
r=await request(saveRich);assert.equal(r.body.revision,s.revision);assert.equal(r.body.entries.length,1);
r=await request();assert.deepEqual(r.body.entries[0].richText,rich);
const editRich={...rich,doc:{...rich.doc,content:[...rich.doc.content,{type:'paragraph',content:[{type:'text',text:'Continuação'}]}]}};
r=await request({op:'edit_diary',revision:s.revision,requestId:crypto.randomUUID(),id:richId,text:'Continuação',richText:editRich});assert.equal(r.status,200);s=r.body;
assert.deepEqual(s.entries[0].richText,editRich);assert.equal(s.entries[0].audio,richAudio);
const invalidDocs=[
 {type:'doc',content:[{type:'script',text:'alert(1)'}]},
 {type:'doc',content:[{type:'paragraph',attrs:{onclick:'alert(1)'}}]},
 {type:'doc',content:[{type:'paragraph',content:[{type:'text',text:'x',marks:[{type:'link',attrs:{href:'javascript:alert(1)'}}]}]}]},
 {type:'doc',content:[{type:'heading',attrs:{level:1}}]},
 {type:'doc',content:[{type:'paragraph',content:[{type:'text',text:'x'.repeat(20001)}]}]},
 {type:'doc',content:Array.from({length:6001},()=>({type:'paragraph'}))}
];
let nested={type:'paragraph'};for(let i=0;i<20;i++)nested={type:'bulletList',content:[{type:'listItem',content:[{type:'paragraph'},nested]}]};
invalidDocs.push({type:'doc',content:[nested]});
for(const doc of invalidDocs){r=await request({op:'edit_diary',revision:s.revision,requestId:crypto.randomUUID(),id:richId,text:'x',richText:{version:1,doc}});assert.equal(r.status,400);}
r=await request();assert.deepEqual(r.body.entries[0].richText,editRich);assert.equal(r.body.revision,s.revision);
r=await request({op:'edit_diary',revision:s.revision,requestId:crypto.randomUUID(),id:richId,text:s.entries[0].text});assert.equal(r.status,200);s=r.body;assert.deepEqual(s.entries[0].richText,editRich);
r=await request({op:'edit_diary',revision:s.revision,requestId:crypto.randomUUID(),id:richId,text:'Alterado pela API de texto.'});assert.equal(r.status,200);s=r.body;assert.equal(s.entries[0].richText,undefined);assert.equal(s.entries[0].audio,richAudio);
r=await request({op:'save_diary',revision:s.revision,requestId:crypto.randomUUID(),text:'Texto antigo <b>literal</b>\nSegunda linha.'});assert.equal(r.status,200);assert.equal(r.body.entries[0].richText,undefined);assert.equal(r.body.entries[0].text,'Texto antigo <b>literal</b>\nSegunda linha.');
console.log('PASS: rich-text round trip, edit, idempotency, audio preservation, legacy API, hostile documents and limits.');
r=await request(null,'');assert.equal(r.status,400);
console.log('PASS: persistência D1, idempotência, conflito de versão, isolamento, validação, áudio R2, exclusão e acesso sem identidade.');
}finally{await mf.dispose()}
