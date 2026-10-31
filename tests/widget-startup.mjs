import {build} from 'esbuild';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const stubs={
 'react/jsx-runtime':`export const jsx=(type,props)=>({type,props});export const jsxs=jsx;`,
 'react':`export default {createElement:(type,props)=>({type,props})};`,
 'react-dom/client':`export function createRoot(){return {render:element=>globalThis.recordRender(element)}}`,
 '@modelcontextprotocol/ext-apps':`export class App {async connect(){globalThis.calls.push('connect');await Promise.resolve(); if(globalThis.failConnect)throw Error('Connection rejected');this.ontoolresult({structuredContent:{lists:[],entries:[],revision:0,view:'diary'}}); globalThis.calls.push('ready')}}`,
 '../app/mins':`export default function Mins(){}`,
};
const result=await build({entryPoints:['widget/main.tsx'],bundle:true,write:false,format:'iife',plugins:[{name:'host-test',setup(b){b.onResolve({filter:/.*/},a=>a.path in stubs?{path:a.path,namespace:'stub'}:undefined);b.onLoad({filter:/.*/,namespace:'stub'},a=>({contents:stubs[a.path],loader:'js'}));}}]});
for(const legacy of [true,false]){
 const calls=[],events=[],root={textContent:''};const bridge=legacy?Object.freeze({callTool:()=>{throw Error('Unexpected legacy call')}}):undefined;
 const window={dispatchEvent:event=>events.push(event)};
 Object.defineProperty(window,'openai',{value:bridge,writable:false});
 let rendered;
 const context=vm.createContext({window,document:{getElementById:()=>root,documentElement:{dataset:{view:'diary'}}},CustomEvent:class{constructor(type,{detail}){this.type=type;this.detail=detail}},calls,console,recordRender:element=>{calls.push('render');rendered=element;}});
 vm.runInContext(result.outputFiles[0].text,context);
 await new Promise(resolve=>setImmediate(resolve));
 assert.deepEqual(calls,['connect','ready','render']);
 assert.equal(rendered.props.initialView,'diary');
 assert.equal(window.minsToolOutput.view,'diary');
 assert.equal(window.openai,bridge);
 assert.equal(events[0].type,'mins-tool-result');
}
console.log('PASS: standard handshake with and without a read-only legacy bridge, initial diary result retained before mount.');
