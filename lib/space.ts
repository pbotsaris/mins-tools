import { env } from 'cloudflare:workers';
import { z } from 'zod';
export type Task={id:string;text:string;done:boolean;audio?:string};
export type List={id:string;title:string;items:Task[]};
import {diaryRichTextSchema,diaryPlainText,type DiaryRichText} from './diary-rich-text';
export type Entry={id:string;text:string;date:string;audio?:string;richText?:DiaryRichText};
export type Space={revision:number;lists:List[];entries:Entry[];requests:string[]};
const audio=z.object({base64:z.string().max(11000000),mime:z.enum(['audio/webm','audio/mp4','audio/ogg','audio/webm;codecs=opus','audio/ogg;codecs=opus'])}).optional();
export const actionSchema=z.object({op:z.enum(['create_list','rename_list','delete_list','add_task','update_task','delete_task','save_diary','edit_diary','delete_diary']),revision:z.number().int().nonnegative(),requestId:z.string().uuid(),id:z.string().max(100).optional(),listId:z.string().max(100).optional(),text:z.string().max(20000).optional(),richText:diaryRichTextSchema.optional(),done:z.boolean().optional(),date:z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),audio});
export async function readSpace(owner:string):Promise<Space>{
 const db=env.DB!; const row=await db.prepare('SELECT revision, data FROM spaces WHERE owner=?').bind(owner).first<{revision:number;data:string}>();
 return row ? {...JSON.parse(row.data),revision:row.revision} : {revision:0,lists:[{id:'inbox',title:'Meu dia a dia',items:[]}],entries:[],requests:[]};
}
export async function changeSpace(owner:string,input:unknown){
 const a=actionSchema.parse(input), s=await readSpace(owner);
 if(s.requests.includes(a.requestId))return s;
 if(s.revision!==a.revision)throw new Error('Sua lista mudou em outra janela. Atualize para continuar; seu rascunho foi mantido.');
 const list=s.lists.find(l=>l.id===a.listId), task=list?.items.find(t=>t.id===a.id), entry=s.entries.find(e=>e.id===a.id);
 const richText=(a.op==='save_diary'||a.op==='edit_diary')?a.richText:undefined;
 const text=richText?diaryPlainText(richText.doc).trim():a.text?.trim();
 if(richText && (text?.length||0)>20000)throw new Error('O registro precisa ter até 20.000 caracteres.'); let target:Task|Entry|undefined; let removed:string|undefined; let removedListAudio:string[]=[];
 switch(a.op){
 case 'create_list': if(!text||text.length>120)throw new Error('Dê um nome de até 120 caracteres à lista.');s.lists.push({id:crypto.randomUUID(),title:text,items:[]});break;
 case 'rename_list':if(!list||!text||text.length>120)throw new Error('Confira o nome e a lista.');list.title=text;break;
 case 'delete_list':if(!list)throw new Error('Lista não encontrada.');removedListAudio=list.items.flatMap(t=>t.audio?[t.audio]:[]);s.lists=s.lists.filter(l=>l!==list);break;
 case 'add_task':if(!list||(!text&&!a.audio))throw new Error('Escreva ou grave uma tarefa.');target={id:crypto.randomUUID(),text:text||'Nota de voz',done:false};list.items.push(target);break;
 case 'update_task':if(!task)throw new Error('Tarefa não encontrada.');if(a.text!==undefined){if(!text)throw new Error('Escreva a tarefa.');task.text=text;}if(a.done!==undefined)task.done=a.done;break;
 case 'delete_task':if(!list||!task)throw new Error('Tarefa não encontrada.');removed=task.audio;list.items=list.items.filter(t=>t!==task);break;
 case 'save_diary':if(!text&&!a.audio)throw new Error('Conte algo ou grave um áudio antes de salvar.');target={id:crypto.randomUUID(),text:text||'',...(richText?{richText}:{}),date:a.date||new Date().toLocaleDateString('en-CA',{timeZone:'America/Sao_Paulo'})};s.entries.unshift(target);break;
 case 'edit_diary':if(!entry||!text)throw new Error('Confira o registro e o texto.');if(richText)entry.richText=richText;else if(text!==entry.text)delete entry.richText;entry.text=text;break;
 case 'delete_diary':if(!entry)throw new Error('Registro não encontrado.');removed=entry.audio;s.entries=s.entries.filter(e=>e!==entry);break;
 }
 let key:string|undefined;
 if(a.audio&&target){const bytes=Uint8Array.from(atob(a.audio.base64),c=>c.charCodeAt(0));if(bytes.length>8000000)throw new Error('O áudio precisa ter até 8 MB.');key=encodeURIComponent(owner)+'/'+a.requestId;await env.BUCKET!.put(key,bytes,{httpMetadata:{contentType:a.audio.mime}});target.audio=key;}
 s.requests=[...s.requests.slice(-99),a.requestId];s.revision++;
 if(JSON.stringify(s).length>2000000)throw new Error('Este espaço atingiu o limite de texto. Exporte seus registros antes de continuar.');
 const payload=JSON.stringify({...s,revision:undefined});
 let ok=false;
 try {const result=a.revision===0 ? await env.DB!.prepare('INSERT INTO spaces(owner,revision,data) VALUES(?,?,?) ON CONFLICT(owner) DO UPDATE SET revision=excluded.revision,data=excluded.data WHERE spaces.revision=0').bind(owner,1,payload).run() : await env.DB!.prepare('UPDATE spaces SET revision=?,data=? WHERE owner=? AND revision=?').bind(s.revision,payload,owner,a.revision).run();ok=!!result.meta.changes;}catch(e){if(key)await env.BUCKET!.delete(key);throw e;}
 if(!ok){/* Keep uploaded retry data: another request with this id may have committed. */throw new Error('Outra alteração foi salva primeiro. Atualize e tente novamente.');}
 if(removed)removedListAudio.push(removed);if(removedListAudio.length)await env.BUCKET!.delete(removedListAudio).catch(()=>{});
 return s;
}
export const json=(data:unknown,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'private, no-store'}});
export function ownerOf(req:Request){const id=req.headers.get('oai-authenticated-user-id');if(!id)throw new Error('Entre com sua conta ChatGPT para acessar seus registros.');return id;}
export function checkOrigin(req:Request){const origin=req.headers.get('origin');if(!origin||origin!==new URL(req.url).origin)throw new Error('Origem não autorizada.');}
