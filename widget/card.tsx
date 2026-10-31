import React,{useEffect,useRef,useState} from 'react';
import {DiaryEditor} from '../components/diary-editor';
import type {DiaryRichText} from '../lib/diary-rich-text';
import type {Space,List} from '../lib/space';
import * as bridge from './bridge';
const origin='https://mamae-mins-diario.mellowcrow7.chatgpt.site';
const plugin='plugin_asdk_app_sites_fd3f8c37899c81918d1d10e99f1ebbff';
const today=()=>new Date().toLocaleDateString('en-CA',{timeZone:'America/Sao_Paulo'});
export default function Card({view}:{view:'diary'|'lists'}){
 const [space,setSpace]=useState<Space|null>(null),[error,setError]=useState(''),[busy,setBusy]=useState(false),[status,setStatus]=useState('Conectando…');
 const [text,setText]=useState(''),[richText,setRichText]=useState<DiaryRichText|undefined>(),[task,setTask]=useState(''),[title,setTitle]=useState('');
 const dirty=useRef(false),selected=useRef<string|undefined>(undefined),draftRequest=useRef<{signature:string;requestId:string}|undefined>(undefined);
 const list=space?.lists.find(l=>l.id===(selected.current||space.lastListId))||space?.lists.at(-1);
 const entry=space?.entries.find(e=>e.date===today());
 function accept(s:Space){if(!s||!Array.isArray(s.lists)||!Array.isArray(s.entries))return;setSpace(s);if(!dirty.current){const e=s.entries.find(e=>e.date===today());setText(e?.text||'');setRichText(e?.richText);const l=s.lists.find(l=>l.id===(selected.current||s.lastListId))||s.lists.at(-1);setTitle(l?.title||'');}setStatus('Seu espaço privado')}
 async function refresh(){setError('');try{accept(await bridge.call(view==='diary'?'open_diary':'open_lists'))}catch(e){setError((e as Error).message)}}
 useEffect(()=>{
  const sync=()=>{if(bridge.output)accept(bridge.output);document.documentElement.dataset.theme=bridge.hostContext.theme==='dark'?'dark':'light'};
  const unsubscribe=bridge.subscribe(sync);sync();bridge.connect().then(()=>{sync();if(!bridge.output)refresh()}).catch(e=>{setError(e.message);if(window.openai?.callTool)refresh()});
  const observer=new ResizeObserver(bridge.resize);observer.observe(document.body);return()=>{unsubscribe();observer.disconnect()};
 },[]);
 async function mutate(op:string,args:any={}):Promise<boolean>{
  if(!space||busy)return false;setBusy(true);setError('');setStatus('Salvando…');
  const signature=JSON.stringify({op,...args});if(draftRequest.current?.signature!==signature)draftRequest.current={signature,requestId:crypto.randomUUID()};
  try{const s=await bridge.call('update_space',{op,...args,revision:space.revision,requestId:draftRequest.current.requestId});dirty.current=false;accept(s);draftRequest.current=undefined;setStatus('Salvo');return true}catch(e){setError((e as Error).message+' Seu rascunho foi mantido.');setStatus('Não salvo');return false}finally{setBusy(false)}
 }
 async function sidebar(event:React.MouseEvent<HTMLAnchorElement>){event.preventDefault();try{await bridge.openSidebar(event.currentTarget.href)}catch{setError('Não foi possível abrir o painel. Use “Abrir no navegador” abaixo.')}}
 const sideUrl='https://chatgpt.com/plugins/'+plugin+'/app/'+(view==='diary'?'open_diary_app':'open_lists_app');
 return <section className="card" role="dialog" aria-modal="false" aria-label={view==='diary'?'Diário de hoje':'Última lista'}>
  <header><div><span className="brand">Mamãe Mins</span><h1>{view==='diary'?'Meu diário de hoje':'Minha última lista'}</h1></div><button className="icon" aria-label="Atualizar registros" disabled={busy} onClick={refresh}>↻</button></header>
  {view==='diary'?<><p className="date">{new Date(today()+'T12:00:00').toLocaleDateString('pt-BR',{day:'numeric',month:'long',year:'numeric'})}</p><form onSubmit={async e=>{e.preventDefault();await mutate('save_today_diary',{text,richText})}}><DiaryEditor text={text} richText={richText} disabled={!space||busy} onChange={(t,r)=>{dirty.current=true;setText(t);setRichText(r);setStatus('Rascunho não salvo')}}/><div className="actions"><span className="hint">{entry?'Seu registro de hoje. Você pode continuar escrevendo.':'Como foi o seu dia?'}</span><button className="primary" disabled={!space||busy||!text.trim()||text.length>20000}>{busy?'Salvando…':entry?'Salvar alterações':'Registrar meu dia'}</button></div></form></>:
  <>{list?<><input key={list.id} className="list-title" aria-label="Nome da lista" value={title} disabled={busy} maxLength={120} onChange={e=>{dirty.current=true;setTitle(e.target.value)}} onBlur={()=>{if(title.trim()&&title!==list.title)mutate('rename_list',{listId:list.id,text:title})}}/>
   <div className="tasks">{list.items.map(item=><TaskRow key={item.id+item.text} item={item} disabled={busy} mutate={(op,args)=>mutate(op,{listId:list.id,...args})}/>)}{!list.items.length&&<p className="hint">Sua lista está pronta para o primeiro item.</p>}</div>
   <form className="add-task" onSubmit={async e=>{e.preventDefault();if(await mutate('add_task',{listId:list.id,text:task}))setTask('')}}><input aria-label="Nova tarefa" placeholder="Adicionar um item…" maxLength={20000} value={task} disabled={busy} onChange={e=>setTask(e.target.value)}/><button className="primary" disabled={busy||!task.trim()}>Adicionar</button></form></>:<form className="add-task" onSubmit={async e=>{e.preventDefault();await mutate('create_list',{text:title})}}><input aria-label="Nome da nova lista" placeholder="Nome da sua lista" maxLength={120} value={title} disabled={!space||busy} onChange={e=>setTitle(e.target.value)}/><button className="primary" disabled={!space||busy||!title.trim()}>Criar lista</button></form>}</>}
  {error&&<div role="alert" className="error">{error}<button disabled={busy} onClick={refresh}>Atualizar registros</button></div>}
  <footer><span role="status">{status}</span><a href={sideUrl} onClick={sidebar}>{view==='diary'?'Abrir diário completo no painel':'Abrir todas as listas no painel'} ↗</a></footer>
  <a className="browser-link" href={origin+(view==='diary'?'/diario':'/')} target="_blank" rel="noreferrer">Abrir no navegador</a>
 </section>
}
function TaskRow({item,disabled,mutate}:{item:List['items'][number];disabled:boolean;mutate:(op:string,args:any)=>Promise<boolean>}){
 const [text,setText]=useState(item.text);return <div className={'task '+(item.done?'done':'')}><input type="checkbox" aria-label={'Concluir '+item.text} checked={item.done} disabled={disabled} onChange={e=>mutate('update_task',{id:item.id,done:e.target.checked})}/><input aria-label={'Editar '+item.text} value={text} disabled={disabled} maxLength={20000} onChange={e=>setText(e.target.value)} onBlur={()=>{if(text.trim()&&text!==item.text)mutate('update_task',{id:item.id,text})}} onKeyDown={e=>{if(e.key==='Enter')e.currentTarget.blur()}}/><button className="icon" aria-label={'Excluir '+item.text} disabled={disabled} onClick={()=>mutate('delete_task',{id:item.id})}>×</button></div>
}
