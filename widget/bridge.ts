// Minimal MCP Apps bridge: the compact card needs no full MCP client bundle.
type Result={structuredContent?:any;isError?:boolean;content?:{text?:string}[]};
const pending=new Map<number,{resolve:(value:any)=>void;reject:(error:Error)=>void;timer:ReturnType<typeof setTimeout>}>();
let nextId=0,initialized=false;
export let output:any;
export let hostContext:any={};
const subscribers=new Set<()=>void>();
export function subscribe(fn:()=>void){subscribers.add(fn);return()=>{subscribers.delete(fn)}}
function changed(){for(const fn of subscribers)fn()}
function send(message:any){window.parent.postMessage({jsonrpc:'2.0',...message},'*')}
export function request(method:string,params:any={}):Promise<any>{return new Promise((resolve,reject)=>{const id=++nextId;const timer=setTimeout(()=>{pending.delete(id);reject(Error('O ChatGPT não respondeu. Tente atualizar; seu texto foi mantido.'))},15000);pending.set(id,{resolve,reject,timer});send({id,method,params})})}
window.addEventListener('message',event=>{
 if(event.source!==window.parent||event.data?.jsonrpc!=='2.0')return;
 const message=event.data;
 if(message.id!==undefined&&pending.has(message.id)){const p=pending.get(message.id)!;pending.delete(message.id);clearTimeout(p.timer);message.error?p.reject(Error(message.error.message||'Não foi possível conectar.')):p.resolve(message.result);return}
 if(message.method==='ui/notifications/tool-result'){output=message.params?.structuredContent;changed()}
 if(message.method==='ui/notifications/host-context-changed'){hostContext={...hostContext,...message.params};changed()}
});
window.addEventListener('openai:set_globals',(event:any)=>{const globals=event.detail?.globals;if(globals?.toolOutput){output=globals.toolOutput;changed()}if(globals?.theme){hostContext={...hostContext,theme:globals.theme};changed()}});
export async function connect(){
 output=window.openai?.toolOutput;
 const result=await request('ui/initialize',{protocolVersion:'2026-01-26',appInfo:{name:'Mamãe Mins · cartão',version:'2.0.0'},appCapabilities:{availableDisplayModes:['inline','fullscreen']}});
 hostContext=result.hostContext||{};initialized=true;
 send({method:'ui/notifications/initialized'});changed();
}
export async function call(name:string,args:any={}):Promise<any>{
 const result:Result=initialized?await request('tools/call',{name,arguments:args}):await window.openai?.callTool?.(name,args);
 if(!result||result.isError)throw Error(result?.content?.[0]?.text||'Não foi possível acessar seus registros.');
 if(!result.structuredContent)throw Error('O ChatGPT retornou uma resposta sem registros.');
 return result.structuredContent;
}
export function resize(){send({method:'ui/notifications/size-changed',params:{height:document.documentElement.scrollHeight}})}
export async function openSidebar(url:string){
 if(window.openai?.openExternal){await window.openai.openExternal({href:url});return}
 await request('ui/open-link',{url});
}
