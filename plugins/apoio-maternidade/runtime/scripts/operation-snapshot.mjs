// Operator-assisted bridge, not a hosted connection. Read latest Library content
// with native tools, provide it on stdin, then replace SAME file with version guard.
// No credentials or personal data are bundled with this script.
import {readFile, writeFile} from 'node:fs/promises';
import {Engine} from '../src/engine.mjs';
import {FixtureStore, MEMORY_ID} from '../src/store.mjs';
let input='';for await(const c of process.stdin)input+=c;
const request=JSON.parse(input);
if(request.libraryFileId!==MEMORY_ID)throw Error('Unexpected source');
const source=await readFile(request.sourcePath,'utf8');
const store=new FixtureStore(source,request.version);const engine=new Engine(store);
const results=[];for(const op of request.operations)results.push(await engine.mutate('operator-assisted-test',op));
await writeFile(request.outputPath,store.text,{mode:0o600});
console.log(JSON.stringify({libraryFileId:MEMORY_ID,expectedCurrentVersion:request.version,outputPath:request.outputPath,results,warning:'Snapshot prepared; persistence requires actual guarded native replacement and fresh read.'}));

