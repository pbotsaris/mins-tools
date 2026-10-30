import {env} from 'cloudflare:workers';
import {readSpace,ownerOf,json} from '@/lib/space';
export const dynamic='force-dynamic';
export async function GET(req:Request){try{const owner=ownerOf(req),key=new URL(req.url).searchParams.get('key');const s=await readSpace(owner);if(!key||![...s.entries,...s.lists.flatMap(l=>l.items)].some(x=>x.audio===key))return json({error:'Áudio não encontrado.'},404);const obj=await env.BUCKET!.get(key);if(!obj)return json({error:'Áudio indisponível.'},404);return new Response(obj.body,{headers:{'Content-Type':obj.httpMetadata?.contentType||'audio/webm','Cache-Control':'private, no-store'}})}catch{return json({error:'Entre na sua conta.'},401)}}
