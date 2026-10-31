import React from 'react';
import {createRoot} from 'react-dom/client';
import {App} from '@modelcontextprotocol/ext-apps';
import Mins from '../app/mins';
async function boot(){if(!window.openai?.callTool){const app=new App({name:'Mamãe Mins',version:'1.0.0'},{});window.minsApp=app;app.ontoolresult=result=>{window.openai={...window.openai,toolOutput:result.structuredContent};window.dispatchEvent(new CustomEvent('mins-tool-result',{detail:result.structuredContent}))};app.onhostcontextchanged=ctx=>{if(ctx.theme)document.documentElement.dataset.theme=ctx.theme==='dark'?'dim':'silk'};try{await app.connect()}catch{document.getElementById('root')!.textContent='Não foi possível conectar ao ChatGPT. Feche e abra o cartão novamente.';return;}}createRoot(document.getElementById('root')!).render(<Mins embedded initialView={document.documentElement.dataset.view==='diary'?'diary':'lists'}/>)}boot();
