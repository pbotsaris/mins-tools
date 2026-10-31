import {env} from 'cloudflare:workers';
import {zodToJsonSchema} from 'zod-to-json-schema';
import {actionSchema,readSpace,changeSpace,json,ownerOf} from '@/lib/space';
// @ts-ignore Vite bundles the self-contained component as a server string.
import html from '../../widget/app.html?raw';
// @ts-ignore Self-contained compact conversation card.
import cardHtml from '../../widget/card.html?raw';
export const dynamic='force-dynamic';
const listUri='ui://mamae-mins/lists-card-v1.html',diaryUri='ui://mamae-mins/diary-card-v1.html';
const listAppUri='ui://mamae-mins/lists-app-v1.html',diaryAppUri='ui://mamae-mins/diary-app-v1.html';
const uiFor=(view:string,full=false)=>{const uri=view==='diary'?(full?diaryAppUri:diaryUri):(full?listAppUri:listUri);return {ui:{resourceUri:uri},'openai/outputTemplate':uri,'openai/widgetAccessible':true,...(full?{'openai/ui':{entrypoints:[{type:'global'},{type:'thread'}]}}:{})}};
const resources=[{uri:listUri,name:'Última lista · cartão',mimeType:'text/html;profile=mcp-app'},{uri:diaryUri,name:'Diário de hoje · cartão',mimeType:'text/html;profile=mcp-app'},{uri:listAppUri,name:'Todas as listas',mimeType:'text/html;profile=mcp-app'},{uri:diaryAppUri,name:'Diário completo',mimeType:'text/html;profile=mcp-app'}];
const readAnnotations={readOnlyHint:true,destructiveHint:false,openWorldHint:false};
const tools=[
 {name:'open_lists',description:'Abrir o diálogo compacto inline com a última lista para editar itens. O link no cartão abre todas as listas no painel. Usar quando a usuária pedir uma lista ou aceitar uma sugestão. Não abrir junto com o diário. Retorna os registros atuais desta nova base, sem importar memória antiga.',inputSchema:{type:'object',properties:{},additionalProperties:false},annotations:readAnnotations,_meta:uiFor('lists')},
 {name:'open_diary',title:'Meu diário',description:'Abrir o diálogo compacto inline com um único campo de texto formatado para o diário de hoje. Carrega o registro de hoje se já existir; a usuária pode ler, continuar escrevendo e salvar. O link no cartão abre o diário completo no painel. Não cria entrada sem envio explícito nem agenda lembretes.',inputSchema:{type:'object',properties:{},additionalProperties:false},annotations:readAnnotations,_meta:uiFor('diary')},
 {name:'open_lists_app',title:'Minhas listas',description:'Abrir todas as listas no painel lateral quando a usuária pedir o app completo. Para editar rapidamente na conversa, preferir open_lists.',inputSchema:{type:'object',properties:{},additionalProperties:false},annotations:readAnnotations,_meta:uiFor('lists',true)},
 {name:'open_diary_app',title:'Meu diário completo',description:'Abrir o diário completo e os registros anteriores no painel lateral. Para escrever o registro de hoje na conversa, preferir open_diary.',inputSchema:{type:'object',properties:{},additionalProperties:false},annotations:readAnnotations,_meta:uiFor('diary',true)},
 {name:'update_space',description:'Salvar uma alteração explicitamente solicitada na lista ou diário. Leia open_lists para tarefas ou open_diary para diário antes, para obter IDs e revision atual. Use requestId UUID estável para reenvios; preserve o rascunho em conflito. Não importar a memória antiga nem criar relatos inventados.',inputSchema:zodToJsonSchema(actionSchema),annotations:{readOnlyHint:false,destructiveHint:true,openWorldHint:false},_meta:{'openai/widgetAccessible':true}},
 {name:'read_audio',description:'Ouvir um áudio já salvo neste espaço privado.',inputSchema:{type:'object',properties:{key:{type:'string',maxLength:300}},required:['key'],additionalProperties:false},annotations:readAnnotations,_meta:{ui:{visibility:['app']},'openai/widgetAccessible':true}}
];
export async function POST(req:Request){let rpc:any;try{rpc=await req.json();const ok=(result:unknown)=>json({jsonrpc:'2.0',id:rpc.id,result});switch(rpc.method){
 case 'server/discover':return ok({supportedVersions:['2026-07-28'],capabilities:{tools:{},resources:{}}});
 case 'initialize':return ok({protocolVersion:rpc.params?.protocolVersion||'2025-06-18',capabilities:{tools:{},resources:{}},serverInfo:{name:'mamae-mins',version:'1.0.0'},instructions:'Use português. Os registros deste Site são novos, separados da memória antiga. Nunca importar ou reconstituir dados pessoais automaticamente. Execute alterações apenas por pedido da usuária. Listas e diário são experiências separadas. Mostre open_lists apenas quando ela pedir uma lista ou aceitar a sugestão. Use open_diary sozinho, quando ela pedir ou responder ao convite agendado. Não abra os dois juntos, nem crie tarefas agendadas sem horário e frequência escolhidos. Nunca prometa que uma notificação renderizará o cartão automaticamente.'});
 case 'notifications/initialized':return new Response(null,{status:202});
 case 'ping':return ok({});
 case 'tools/list':return ok({tools});
 case 'resources/list':return ok({resources});
 case 'resources/templates/list':return ok({resourceTemplates:[]});
 case 'resources/read':{
 const uri=rpc.params?.uri;
 const legacyLists=['ui://mamae-mins/space.html','ui://mamae-mins/lists.html','ui://mamae-mins/lists-v2.html','ui://mamae-mins/lists-v3.html'];
 const legacyDiary=['ui://mamae-mins/diary.html','ui://mamae-mins/diary-v2.html','ui://mamae-mins/diary-v3.html','ui://mamae-mins/diary-v4.html'];
 const resource=resources.find(r=>r.uri===uri)||(legacyLists.includes(uri)?resources[2]:legacyDiary.includes(uri)?resources[3]:null);
 if(!resource)throw Error('Componente não encontrado.');
 const full=[listAppUri,diaryAppUri].includes(resource.uri),view=[diaryUri,diaryAppUri].includes(resource.uri)?'diary':'lists';
 const domains=full?['blob:','data:']:[];
 return ok({contents:[{...resource,uri,text:(full?html:cardHtml).replace('<html lang="pt-BR" data-theme="silk">','<html lang="pt-BR" data-theme="silk" data-view="'+view+'">'),_meta:{ui:{prefersBorder:false,...(full?{permissions:{microphone:{}}}:{}),csp:{connectDomains:[],resourceDomains:domains}},'openai/widgetCSP':{connect_domains:[],resource_domains:domains,redirect_domains:['https://chatgpt.com','https://mamae-mins-diario.mellowcrow7.chatgpt.site']},'openai/ui':{availableDisplayModes:full?['fullscreen']:['inline'],preferredDisplayMode:full?'fullscreen':'inline'},'openai/widgetDescription':full?'Seu espaço privado completo.':view==='diary'?'Diálogo com o registro de hoje, editor formatado, botão salvar e link para o diário completo.':'Diálogo com a última lista editável e link para todas as listas.','openai/widgetPrefersBorder':false}}]});
 }
 case 'tools/call':{const name=rpc.params?.name,args=rpc.params?.arguments||{};try{const owner=ownerOf(req);if(name==='read_audio'){const s=await readSpace(owner),key=args.key;if(typeof key!=='string'||![...s.entries,...s.lists.flatMap(l=>l.items)].some(x=>x.audio===key))throw Error('Áudio não encontrado.');const obj=await env.BUCKET!.get(key);if(!obj)throw Error('Áudio indisponível.');const bytes=new Uint8Array(await obj.arrayBuffer());let binary='';for(let i=0;i<bytes.length;i+=8192)binary+=String.fromCharCode(...bytes.subarray(i,i+8192));return ok({content:[{type:'text',text:'Áudio recuperado.'}],structuredContent:{base64:btoa(binary),mime:obj.httpMetadata?.contentType||'audio/webm'}});}
 if(!['open_lists','open_diary','open_lists_app','open_diary_app','update_space'].includes(name))throw Error('Ferramenta não encontrada.');const s=name==='update_space'?await changeSpace(owner,args):await readSpace(owner);return ok({content:[{type:'text',text:name==='update_space'?'Alteração salva.':'Espaço privado carregado.'}],structuredContent:{...s,view:name.startsWith('open_diary')||(name==='update_space'&&String(args.op).endsWith('diary'))?'diary':'lists'},...(name==='update_space'?{}:{_meta:uiFor(name.startsWith('open_diary')?'diary':'lists',name.endsWith('_app'))})});}catch(e){return ok({isError:true,content:[{type:'text',text:(e as Error).message}]});}}
 default:return json({jsonrpc:'2.0',id:rpc.id,error:{code:-32601,message:'Método não encontrado.'}});
 }}catch(e){return json({jsonrpc:'2.0',id:rpc?.id||null,error:{code:-32000,message:(e as Error).message}},400)}}
