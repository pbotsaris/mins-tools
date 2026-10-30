import {readSpace,changeSpace,json,ownerOf,checkOrigin} from '@/lib/space';
export const dynamic='force-dynamic';
export async function GET(req:Request){try{return json(await readSpace(ownerOf(req)))}catch(e){return json({error:(e as Error).message},401)}}
export async function POST(req:Request){try{checkOrigin(req);if(Number(req.headers.get('content-length'))>12000000)return json({error:'Áudio muito grande.'},413);return json(await changeSpace(ownerOf(req),await req.json()))}catch(e){return json({error:(e as Error).message},400)}}
