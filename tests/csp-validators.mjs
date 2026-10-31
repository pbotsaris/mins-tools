import {build} from 'esbuild';
import {createRequire} from 'node:module';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {cspSafeValidators} from '../scripts/csp-safe-validators.mjs';
const require=createRequire(import.meta.url);
const appRequire=createRequire(require.resolve('@modelcontextprotocol/ext-apps'));
const clientRequire=createRequire(appRequire.resolve('@modelcontextprotocol/client'));
const copies=[...new Set([require.resolve('zod/v4'),clientRequire.resolve('zod/v4')])];
for(const modulePath of copies){
 const source=modulePath.replace(/\.cjs$/,'.js');
 const compiled=await build({stdin:{contents:`import * as z from ${JSON.stringify(source)};export const schema=z.object({name:z.string().min(1),count:z.number().int()});`,resolveDir:process.cwd()},bundle:true,write:false,format:'iife',globalName:'testSchema',platform:'browser',plugins:[cspSafeValidators()]});
 let evalAttempts=0;
 const context=vm.createContext({Function:new Proxy(Function,{construct(){evalAttempts++;throw new EvalError('Strict CSP')}})});
 vm.runInContext(compiled.outputFiles[0].text,context,{timeout:10000});
 assert.equal(context.testSchema.schema.safeParse({name:'Teste',count:2}).success,true);
 assert.equal(context.testSchema.schema.safeParse({name:'',count:2.5}).success,false);
 assert.equal(evalAttempts,0);
}
console.log('PASS: all bundled Zod versions validate valid/invalid data with zero dynamic-evaluation attempts.');
