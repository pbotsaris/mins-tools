import {env} from 'cloudflare:workers';
import {zodToJsonSchema} from 'zod-to-json-schema';
import {actionSchema,readSpace,changeSpace,json,ownerOf} from '@/lib/space';
// @ts-ignore Vite bundles the self-contained component as a server string.
import html from '../../widget/app.html?raw';
export const dynamic='force-dynamic';
const uri='ui://mamae-mins/space.html';
const ui={ui:{resourceUri:uri},'openai/outputTemplate':uri,'openai/widgetAccessible':true};
const resource={uri,name:'Mamãe Mins · Listas e diário',mimeType:'text/html;profile=mcp-app'};
const readAnnotations={readOnlyHint:true,destructiveHint:false,openWorldHint:false};
const tools=[
 {name:'open_lists',description:'Abrir as listas privadas da usuária em um cartão interativo. Retorna os registros atuais desta nova base; não inclui a memória antiga.',inputSchema:{type:'object',properties:{},additionalProperties:false},annotations:readAnnotations,_meta:ui},
 {name:'open_diary',description:'Abrir o diário privado com campo livre, áudio e registros salvos. Não cria entrada sem relato enviado.',inputSchema:{type:'object',properties:{},additionalProperties:false},annotations:readAnnotations,_meta:ui},
 {name:'update_space',description:'Salvar uma alteração explicitamente solicitada na lista ou diário. Leia open_lists antes para obter IDs e revision atual. Use requestId UUID estável para reenvios; preserve o rascunho em conflito. Não importar a memória antiga nem criar relatos inventados.',inputSchema:zodToJsonSchema(actionSchema),annotations:{readOnlyHint:false,destructiveHint:true,openWorldHint:false},_meta:ui},
 {name:'read_audio',description:'Ouvir um áudio já salvo neste espaço privado.',inputSchema:{type:'object',properties:{key:{type:'string',maxLength:300}},required:['key'],additionalProperties:false},annotations:readAnnotations,_meta:{ui:{visibility:['app']},'openai/widgetAccessible':true}}
];
export async function POST(req:Request){let rpc:any;try{rpc=await req.json();const owner=ownerOf(req);const ok=(result:unknown)=>json({jsonrpc:'2.0',id:rpc.id,result});switch(rpc.method){
 case 'server/discover':return ok({supportedVersions:['2026-07-28'],capabilities:{tools:{},resources:{}}});
 case 'initialize':return ok({protocolVersion:rpc.params?.protocolVersion||'2025-06-18',capabilities:{tools:{},resources:{}},serverInfo:{name:'mamae-mins',version:'1.0.0'},instructions:'Use português. Os registros deste Site são novos, separados da memória antiga. Nunca importar ou reconstituir dados pessoais automaticamente. Execute alterações apenas por pedido da usuária. Para cartão visual use open_lists ou open_diary.'});
 case 'notifications/initialized':return new Response(null,{status:202});
 case 'ping':return ok({});
 case 'tools/list':return ok({tools});
 case 'resources/list':return ok({resources:[resource]});
 case 'resources/templates/list':return ok({resourceTemplates:[]});
 case 'resources/read':if(rpc.params?.uri!==uri)throw Error('Componente não encontrado.');return ok({contents:[{...resource,text:html,_meta:{ui:{prefersBorder:false,permissions:{microphone:{}},csp:{connectDomains:[],resourceDomains:['blob:','data:']}},'openai/widgetDescription':'Listas e diário privados, em português, com edição e áudio.','openai/widgetPrefersBorder':false}}]});
 case 'tools/call':{const name=rpc.params?.name,args=rpc.params?.arguments||{};try{if(name==='read_audio'){const s=await readSpace(owner),key=args.key;if(typeof key!=='string'||![...s.entries,...s.lists.flatMap(l=>l.items)].some(x=>x.audio===key))throw Error('Áudio não encontrado.');const obj=await env.BUCKET!.get(key);if(!obj)throw Error('Áudio indisponível.');const bytes=new Uint8Array(await obj.arrayBuffer());let binary='';for(let i=0;i<bytes.length;i+=8192)binary+=String.fromCharCode(...bytes.subarray(i,i+8192));return ok({content:[{type:'text',text:'Áudio recuperado.'}],structuredContent:{base64:btoa(binary),mime:obj.httpMetadata?.contentType||'audio/webm'}});}
 if(!['open_lists','open_diary','update_space'].includes(name))throw Error('Ferramenta não encontrada.');const s=name==='update_space'?await changeSpace(owner,args):await readSpace(owner);return ok({content:[{type:'text',text:name==='update_space'?'Alteração salva.':'Espaço privado carregado.'}],structuredContent:{...s,view:name==='open_diary'?'diary':'lists'},_meta:ui});}catch(e){return ok({isError:true,content:[{type:'text',text:(e as Error).message}]});}}
 default:return json({jsonrpc:'2.0',id:rpc.id,error:{code:-32601,message:'Método não encontrado.'}});
 }}catch(e){return json({jsonrpc:'2.0',id:rpc?.id||null,error:{code:-32000,message:(e as Error).message}},400)}}
