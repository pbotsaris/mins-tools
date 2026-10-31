import test from 'node:test';
import assert from 'node:assert/strict';
import {Engine} from '../src/engine.mjs';
import {FixtureStore, LibraryStore, decodeMemory} from '../src/store.mjs';
import {rpc, UI_URI} from '../src/mcp.mjs';
const actor='test-user';
async function setup() { const store=new FixtureStore('# Contexto original intacto\n');const engine=new Engine(store);const result=await engine.mutate(actor,{action:'create_list',requestId:'create-1',listId:'trip-1',title:'Mala Portugal',items:[{text:'Documentos',category:'Viagem'}]});return{store,engine,list:result.list}; }
test('create, edit title/category/text, complete, uncomplete, add/remove, reopen same ID',async()=>{
 const {engine,store,list}=await setup();const itemId=list.items[0].id;
 await engine.mutate(actor,{action:'update_list',requestId:'update-1',listId:list.id,expectedVersion:1,operations:[{type:'rename',title:'Mala Portugal — teste'},{type:'edit',itemId,text:'Documentos conferidos',category:'Antes de sair'},{type:'set_completed',itemId,completed:true},{type:'add',itemId:'fraldas-1',text:'Fraldas'}]});
 let reloaded=await new Engine(store).query(actor,{listId:list.id});assert.equal(reloaded.list.version,2);assert.equal(reloaded.list.items[0].completed,true);assert.equal(reloaded.list.items[0].category,'Antes de sair');assert.equal(reloaded.list.items[1].text,'Fraldas');
 await engine.mutate(actor,{action:'update_list',requestId:'update-2',listId:list.id,expectedVersion:2,operations:[{type:'set_completed',itemId,completed:false},{type:'remove',itemId:'fraldas-1'}]});
 reloaded=await new Engine(store).query(actor,{listId:list.id});assert.equal(reloaded.list.items.length,1);assert.equal(reloaded.list.items[0].completed,false);assert.ok(store.text.startsWith('# Contexto original intacto\n'));
});
test('duplicate retries and normalized item dedupe',async()=>{
 const {engine,store,list}=await setup();const request={action:'update_list',requestId:'same-retry',listId:list.id,expectedVersion:1,operations:[{type:'add',text:'Fraldas'},{type:'add',text:'  fraldas  '}]};await engine.mutate(actor,request);const writes=store.writes;await engine.mutate(actor,request);assert.equal(store.writes,writes);assert.equal((await engine.query(actor,{listId:list.id})).list.items.length,2);
 await assert.rejects(engine.mutate(actor,{...request,operations:[{type:'add',text:'Outro'}]}),{code:'request_id_reused'});
});
test('new journey clones all pending and original stays complete',async()=>{
 const {engine,list}=await setup();await engine.mutate(actor,{action:'update_list',requestId:'done',listId:list.id,expectedVersion:1,operations:[{type:'set_completed',itemId:list.items[0].id,completed:true}]});
 const cloned=await engine.mutate(actor,{action:'create_list',requestId:'clone',listId:'trip-2',title:'Nova viagem',cloneFrom:list.id});assert.equal(cloned.list.items[0].completed,false);assert.notEqual(cloned.list.items[0].id,list.items[0].id);assert.equal((await engine.query(actor,{listId:list.id})).list.items[0].completed,true);
});
test('transcribed-message operation uses same ID (transcription is simulated)',async()=>{
 const {engine,list}=await setup();const intent={listId:list.id,operations:[{type:'add',text:'Fraldas'}]};const result=await engine.mutate(actor,{action:'update_list',requestId:'transcription-simulation',expectedVersion:1,...intent});assert.equal(result.list.id,list.id);assert.equal(result.list.items.length,2);
});
test('journal save, read, and duplicate retry; no empty entries',async()=>{
 const {engine,store}=await setup();const req={action:'save_journal',requestId:'journal-req',entryId:'journal-test',text:'Entrada fictícia para teste, não relato pessoal.',source:'test'};await engine.mutate(actor,req);await engine.mutate(actor,req);const result=await new Engine(store).journal(actor,{entryId:'journal-test'});assert.equal(result.entry.source,'test');assert.equal(Object.keys(decodeMemory(store.text).journals).length,1);assert.equal(store.text.match(/Entrada fictícia/g).length,1);await assert.rejects(engine.mutate(actor,{...req,requestId:'empty',entryId:'empty',text:' '}),{code:'invalid_input'});
});
test('failed save leaves source unchanged; same request retry succeeds',async()=>{
 const {engine,store,list}=await setup();const original=store.text;store.fail=true;const req={action:'update_list',requestId:'failure',listId:list.id,expectedVersion:1,operations:[{type:'add',text:'Rascunho preservado'}]};const result=await rpc(engine,actor,{id:1,method:'tools/call',params:{name:'update_list',arguments:{requestId:req.requestId,listId:req.listId,expectedVersion:req.expectedVersion,operations:req.operations}}});assert.equal(result.result.isError,true);assert.equal(result.result.structuredContent.saved,false);assert.equal(store.text,original);store.fail=false;await engine.mutate(actor,req);assert.equal((await engine.query(actor,{listId:list.id})).list.items.length,2);
});
test('stale entity version and compare-and-swap conflict do not overwrite',async()=>{
 const {engine,store,list}=await setup();await engine.mutate(actor,{action:'update_list',requestId:'first',listId:list.id,expectedVersion:1,operations:[{type:'rename',title:'Outra conversa'}]});await assert.rejects(engine.mutate(actor,{action:'update_list',requestId:'stale',listId:list.id,expectedVersion:1,operations:[{type:'rename',title:'Perder atualização'}]}),{code:'conflict'});await assert.rejects(store.replace(actor,0,'wrong'),{code:'conflict'});assert.equal((await engine.query(actor,{listId:list.id})).list.title,'Outra conversa');
});
test('no saved success if backend silently skips a write',async()=>{
 const {engine,store,list}=await setup();store.replace=async()=>({version:2});await assert.rejects(engine.mutate(actor,{action:'update_list',requestId:'skip-write',listId:list.id,expectedVersion:1,operations:[{type:'rename',title:'Não gravado'}]}),{code:'readback_failed'});
});
test('missing production binding/auth never falls back to fixture',async()=>{
 const engine=new Engine(new LibraryStore(null));await assert.rejects(engine.query(actor,{}),{code:'storage_not_connected'});const result=await rpc(engine,null,{id:1,method:'tools/call',params:{name:'open_diary',arguments:{}}});assert.equal(result.result.structuredContent.saved,false);assert.equal(result.result.structuredContent.code,'authentication_required');
});
test('corrupt state and prototype keys are rejected without modification',async()=>{
 const {engine,store}=await setup();const before=store.text;await assert.rejects(engine.mutate(actor,{action:'create_list',requestId:'__proto__',title:'bad'}),{code:'invalid_input'});assert.equal(store.text,before);store.text+='<!-- mamae-mins-state:v1 -->';await assert.rejects(engine.query(actor,{}),{code:'invalid_memory'});
});
test('UI resource and tool metadata follow the same runtime contract',async()=>{
 const {engine}=await setup();const result=await rpc(engine,actor,{id:2,method:'resources/read',params:{uri:UI_URI}});assert.equal(result.result.contents[0].mimeType,'text/html;profile=mcp-app');assert.ok(result.result.contents[0].text.includes('Registrar meu dia'));const list=await rpc(engine,actor,{id:3,method:'tools/list'});assert.equal(list.result.tools.find(t=>t.name==='update_list')._meta.ui.resourceUri,UI_URI);
});

