import {build} from 'esbuild';
import {createRequire} from 'node:module';
import {readFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const require=createRequire(import.meta.url),wr=createRequire(require.resolve('wrangler/package.json'));
const {Miniflare}=wr('miniflare');
await build({stdin:{contents:"import {POST} from './app/mcp/route';export default {fetch:POST}",resolveDir:process.cwd(),loader:'ts'},outfile:'.sites-runtime/test-mcp.mjs',bundle:true,format:'esm',platform:'browser',external:['cloudflare:workers'],plugins:[{name:'raw-widget',setup(build){build.onResolve({filter:/app\.html\?raw$/},()=>({path:'widget/app.html',namespace:'raw-widget'}));build.onLoad({filter:/.*/,namespace:'raw-widget'},async()=>({contents:await readFile('widget/app.html','utf8'),loader:'text'}))}}]});
const mf=new Miniflare({modules:true,scriptPath:'.sites-runtime/test-mcp.mjs',compatibilityDate:'2026-05-15',compatibilityFlags:['nodejs_compat'],d1Databases:['DB'],r2Buckets:['BUCKET']});
try{const db=await mf.getD1Database('DB');await db.exec((await readFile('drizzle/0000_familiar_sister_grimm.sql','utf8')).replaceAll('\n',' '));
const rpc=async(method,params={})=>{const r=await mf.dispatchFetch('http://localhost/mcp',{method:'POST',headers:{'oai-authenticated-user-id':'local-test'},body:JSON.stringify({jsonrpc:'2.0',id:1,method,params})});assert.equal(r.status,200);return(await r.json()).result};
const {tools}=await rpc('tools/list');const list=tools.find(t=>t.name==='open_lists'),diary=tools.find(t=>t.name==='open_diary');
assert.notEqual(list._meta.ui.resourceUri,diary._meta.ui.resourceUri);
for(const [tool,view]of [[list,'lists'],[diary,'diary']]){const resource=await rpc('resources/read',{uri:tool._meta.ui.resourceUri});assert.ok(resource.contents[0].text.includes('data-view="'+view+'"'));const result=await rpc('tools/call',{name:tool.name});assert.equal(result.structuredContent.view,view);assert.equal(result._meta.ui.resourceUri,tool._meta.ui.resourceUri);}
const result=await rpc('tools/call',{name:'update_space',arguments:{op:'save_diary',revision:0,requestId:crypto.randomUUID(),text:'Registro técnico local.'}});
assert.equal(result.structuredContent.view,'diary');assert.equal(result.structuredContent.entries.length,1);assert.equal(result._meta,undefined);assert.equal(tools.find(t=>t.name==='update_space')._meta.ui,undefined);
console.log('PASS: distinct list and diary resources, correct view and metadata, diary save without opening list card.');
}finally{await mf.dispose()}
