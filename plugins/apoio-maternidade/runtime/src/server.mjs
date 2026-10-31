import http from 'node:http';
import {readFile} from 'node:fs/promises';
import {Engine} from './engine.mjs';
import {FixtureStore, LibraryStore} from './store.mjs';
import {rpc} from './mcp.mjs';
const fixture = process.env.MAMAE_MINS_DEMO === '1';
const portFlag = process.argv.indexOf('--port');
const port = Number(portFlag >= 0 ? process.argv[portFlag + 1] : process.env.PORT || 3000);
if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('Invalid port');
// No default fixture or database in production. Hosted Library access must be
// injected by the authorized connector integration; no account tokens in source.
const adapter = !fixture && process.env.MAMAE_MINS_ADAPTER_MODULE ? await import(process.env.MAMAE_MINS_ADAPTER_MODULE) : null;
if(adapter && (typeof adapter.authenticateRequest !== 'function' || !adapter.binding)) throw new Error('Adapter must supply binding and authenticateRequest');
const store = fixture ? new FixtureStore() : new LibraryStore(adapter?.binding);
const engine = new Engine(store);
if(fixture)await engine.mutate('fixture-user',{action:'create_list',requestId:'seed-demo',listId:'lista-demo',title:'Lista de teste',items:[{text:'Item de teste'},{text:'Segundo item',category:'Exemplo'}]});
const json=(res,code,value)=>{res.writeHead(code,{'content-type':'application/json','cache-control':'no-store'});res.end(JSON.stringify(value))};
http.createServer(async(req,res)=>{
 try{
  const origin=req.headers.origin;if(origin&&origin!==`http://${req.headers.host}`&&origin!==`https://${req.headers.host}`){json(res,403,{error:'origin_not_allowed'});return}
  if(req.method==='POST'&&req.url==='/mcp'){
   let raw='';for await(const chunk of req){raw+=chunk;if(raw.length>50000){json(res,413,{error:'request_too_large'});return}}
   let body;try{body=JSON.parse(raw)}catch{json(res,400,{error:'invalid_json'});return}
   if(body?.jsonrpc!=='2.0'||typeof body.method!=='string'){json(res,400,{error:'invalid_request'});return}
   // In a hosted Site use only its trusted, dispatch-validated identity. A direct
   // Node deployment must supply a verified authentication adapter instead.
   const identity=fixture?'fixture-user':adapter?await adapter.authenticateRequest(req):null;
   const result=await rpc(engine,identity,body,{fixture});if(result===null){res.writeHead(202);res.end();return}json(res,200,result);return;
  }
  if(fixture&&req.method==='POST'&&req.url==='/fixture/fail'){store.fail=!store.fail;json(res,200,{failure:store.fail});return}
  if(req.method==='GET'&&req.url==='/app'){res.writeHead(200,{'content-type':'text/html;charset=utf-8','cache-control':'no-store','content-security-policy':"default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'"});res.end(await readFile(new URL('./app.html',import.meta.url)));return}
  if(req.method==='GET'&&req.url==='/'){
   res.writeHead(200,{'content-type':'text/html;charset=utf-8','cache-control':'no-store'});
   res.end(fixture?await readFile(new URL('./fixture-host.html',import.meta.url)):'<!doctype html><html lang="pt-BR"><meta charset="utf-8"><title>Mamãe Mins — conexão pendente</title><p>O servidor ainda precisa de autenticação e acesso autorizado ao armazenamento existente. Nenhum salvamento está ativo.</p></html>');return;
  }
  json(res,404,{error:'not_found'});
 }catch{json(res,500,{error:'unconfirmed_operation',saved:false})}
}).listen(port,'0.0.0.0',()=>console.log(JSON.stringify({ready:true,fixture,port,storage:fixture?'fixture-only':'not-connected'})));

