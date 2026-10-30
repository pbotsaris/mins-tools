import {build} from 'esbuild';
import fs from 'node:fs/promises';
import postcss from 'postcss';
import tailwind from '@tailwindcss/postcss';
const js=await build({entryPoints:['widget/main.tsx'],bundle:true,write:false,minify:true,format:'iife',platform:'browser',define:{'process.env.NODE_ENV':'"production"'}});
const css=await postcss([tailwind()]).process(await fs.readFile('app/globals.css','utf8'),{from:'app/globals.css'});
await fs.writeFile('widget/app.html','<!doctype html><html lang="pt-BR" data-theme="silk"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><style>'+css.css+'</style></head><body><div id="root">Abrindo seu espaço…</div><script>'+js.outputFiles[0].text.replaceAll('</script','<\\/script')+'</script></body></html>');
console.log('Componente incorporável gerado.');
