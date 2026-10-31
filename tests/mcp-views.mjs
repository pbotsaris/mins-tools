import {build} from 'esbuild';
import {createRequire} from 'node:module';
import {readFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const require=createRequire(import.meta.url),wr=createRequire(require.resolve('wrangler/package.json'));
const {Miniflare}=wr('miniflare');
await build({stdin:{contents:"import {POST} from './app/mcp/route';export default {fetch:POST}",resolveDir:process.cwd(),loader:'ts'},outfile:'.sites-runtime/test-mcp.mjs',bundle:true,format:'esm',platform:'browser',external:['cloudflare:workers'],plugins:[{name:'raw-widget',setup(build){build.onResolve({filter:/(app|card)\.html\?raw$/},a=>({path:a.path.replace('../../','').replace('?raw',''),namespace:'raw-widget'}));build.onLoad({filter:/.*/,namespace:'raw-widget'},async(args)=>({contents:await readFile('widget/'+(args.path.includes('card.html')?'card.html':'app.html'),'utf8'),loader:'text'}))}}]});
const mf=new Miniflare({modules:true,scriptPath:'.sites-runtime/test-mcp.mjs',compatibilityDate:'2026-05-15',compatibilityFlags:['nodejs_compat'],d1Databases:['DB'],r2Buckets:['BUCKET']});
try{const db=await mf.getD1Database('DB');await db.exec((await readFile('drizzle/0000_familiar_sister_grimm.sql','utf8')).replaceAll('\n',' '));
const rpc=async(method,params={},identified=true)=>{const r=await mf.dispatchFetch('http://localhost/mcp',{method:'POST',headers:identified?{'oai-authenticated-user-id':'local-test'}:{},body:JSON.stringify({jsonrpc:'2.0',id:1,method,params})});assert.equal(r.status,200);return(await r.json()).result};
const {tools}=await rpc('tools/list');const list=tools.find(t=>t.name==='open_lists'),diary=tools.find(t=>t.name==='open_diary');
assert.notEqual(list._meta.ui.resourceUri,diary._meta.ui.resourceUri);
assert.equal(diary._meta['openai/ui'],undefined);
assert.equal(diary._meta['openai/outputTemplate'],diary._meta.ui.resourceUri);
for(const [tool,view]of [[list,'lists'],[diary,'diary']]){const resource=await rpc('resources/read',{uri:tool._meta.ui.resourceUri});assert.deepEqual(resource.contents[0]._meta.ui.csp,{connectDomains:[],resourceDomains:[]});assert.deepEqual(resource.contents[0]._meta['openai/ui'].availableDisplayModes,['inline']);assert.equal(resource.contents[0]._meta['openai/ui'].preferredDisplayMode,'inline');assert.ok(Buffer.byteLength(resource.contents[0].text)<800000);assert.ok(resource.contents[0].text.includes('data-view="'+view+'"'));const result=await rpc('tools/call',{name:tool.name});assert.equal(result.structuredContent.view,view);assert.equal(result._meta.ui.resourceUri,tool._meta.ui.resourceUri);}
assert.ok((await rpc('resources/read',{uri:'ui://mamae-mins/diary.html'})).contents[0].text.includes('data-view="diary"'));
assert.ok((await rpc('resources/read',{uri:'ui://mamae-mins/diary-v2.html'})).contents[0].text.includes('data-view="diary"'));
const result=await rpc('tools/call',{name:'update_space',arguments:{op:'save_diary',revision:0,requestId:crypto.randomUUID(),text:'Registro técnico local.'}});
assert.equal(result.structuredContent.view,'diary');assert.equal(result.structuredContent.entries.length,1);assert.equal(result._meta,undefined);assert.equal(tools.find(t=>t.name==='update_space')._meta.ui,undefined);
const today=new Date().toLocaleDateString('en-CA',{timeZone:'America/Sao_Paulo'});
const before=result.structuredContent.entries[0];
const action={op:'save_today_diary',revision:result.structuredContent.revision,requestId:crypto.randomUUID(),text:'Continuação de hoje.',date:'2000-01-01'};
const saved=await rpc('tools/call',{name:'update_space',arguments:action});
assert.equal(saved.structuredContent.entries.length,1);assert.equal(saved.structuredContent.entries[0].id,before.id);assert.equal(saved.structuredContent.entries[0].date,today);
assert.equal((await rpc('tools/call',{name:'update_space',arguments:action})).structuredContent.revision,saved.structuredContent.revision);
assert.equal((await rpc('tools/call',{name:'update_space',arguments:{...action,requestId:crypto.randomUUID()}})).isError,true);
const made=await rpc('tools/call',{name:'update_space',arguments:{op:'create_list',text:'Mais recente',revision:saved.structuredContent.revision,requestId:crypto.randomUUID()}});
assert.equal(made.structuredContent.lastListId,made.structuredContent.lists.at(-1).id);
const used=await rpc('tools/call',{name:'update_space',arguments:{op:'add_task',text:'Retomar outra lista',listId:'inbox',revision:made.structuredContent.revision,requestId:crypto.randomUUID()}});
assert.equal(used.structuredContent.lastListId,'inbox');
for(const name of ['open_diary_app','open_lists_app']){const tool=tools.find(t=>t.name===name);assert.deepEqual(tool._meta['openai/ui'].entrypoints,[{type:'global'},{type:'thread'}]);const r=await rpc('resources/read',{uri:tool._meta.ui.resourceUri},false);assert.deepEqual(r.contents[0]._meta['openai/ui'].availableDisplayModes,['fullscreen']);}
assert.ok((await rpc('resources/read',{uri:diary._meta.ui.resourceUri},false)).contents[0].text.includes('data-view="diary"'));
assert.equal((await rpc('tools/call',{name:'open_diary'},false)).isError,true);
const rich={version:1,doc:{type:'doc',content:[{type:'paragraph',content:[{type:'text',text:'Hoje com formatação',marks:[{type:'bold'}]}]}]}};
const richSaved=await rpc('tools/call',{name:'update_space',arguments:{op:'save_today_diary',richText:rich,revision:used.structuredContent.revision,requestId:crypto.randomUUID()}});
assert.equal(richSaved.structuredContent.entries.length,1);assert.equal(richSaved.structuredContent.entries[0].id,before.id);assert.deepEqual(richSaved.structuredContent.entries[0].richText,rich);
console.log('PASS: distinct list and diary resources, correct view and metadata, diary save without opening list card.');
}finally{await mf.dispose()}
