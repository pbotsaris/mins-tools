import React from 'react';
import {createRoot} from 'react-dom/client';
import {App} from '@modelcontextprotocol/ext-apps';
import Mins from '../app/mins';

async function boot(){
 // A compatibility bridge can exist before MCP Apps initialization. Always
 // complete the standard handshake so the host can mark the frame ready.
 const app=new App({name:'Mamãe Mins',version:'1.0.2'},{availableDisplayModes:['inline','fullscreen']});
 app.ontoolresult=result=>{
   window.minsToolOutput=result.structuredContent;
   window.dispatchEvent(new CustomEvent('mins-tool-result',{detail:result.structuredContent}));
 };
 app.onhostcontextchanged=ctx=>{if(ctx.theme)document.documentElement.dataset.theme=ctx.theme==='dark'?'dim':'silk'};
 try{
   await app.connect();
   window.minsApp=app;
 }catch(error){
   console.error('Mamãe Mins: card initialization failed',error);
   document.getElementById('root')!.textContent='Não foi possível conectar ao ChatGPT. Feche e abra o cartão novamente.';
   return;
 }
 createRoot(document.getElementById('root')!).render(<Mins embedded initialView={document.documentElement.dataset.view==='diary'?'diary':'lists'}/>);
}
boot();
