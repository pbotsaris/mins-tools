import fs from 'node:fs/promises';
// Zod's browser eval capability probe itself violates a strict CSP, even when
// its exception is caught. Select the existing interpreted validator path at
// bundle time, for every bundled Zod copy; never relax the iframe policy.
export function cspSafeValidators(){return {name:'csp-safe-validators',setup(build){
 build.onLoad({filter:/[/\\]zod[/\\]v4[/\\]core[/\\]util\.js$/},async({path})=>{
  const source=await fs.readFile(path,'utf8');
  const probe=/export const allowsEval =\s*(?:\/\*[^]*?\*\/\s*)?cached\(\(\) => \{/;
  if(!probe.test(source))throw Error('Zod eval probe changed; review CSP compatibility before bundling.');
  return {contents:source.replace(probe,'export const allowsEval = cached(() => { return false;'),loader:'js'};
 });
}}}
