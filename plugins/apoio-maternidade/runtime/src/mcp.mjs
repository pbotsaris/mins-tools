import {readFile} from 'node:fs/promises';
import {DomainError} from './store.mjs';
export const UI_URI = 'ui://mamae-mins/checklist-and-diary-v1';
const object = properties => ({type: 'object', properties, additionalProperties: false});
const str = {type: 'string'};
const ui = {ui: {resourceUri: UI_URI, visibility: ['model', 'app']}};
export const tools = [
  {name: 'find_lists', description: 'Consultar listas anteriores antes de criar ou retomar. Não inventa histórico.', inputSchema: object({query: str}), annotations: {readOnlyHint: true}},
  {name: 'open_list', description: 'Abrir a lista existente pelo mesmo ID no checklist do chat.', inputSchema: {...object({listId: str}), required: ['listId']}, annotations: {readOnlyHint: true}, _meta: ui},
  {name: 'create_list', description: 'Criar após pedido explícito ou aceitação; cloneFrom cria nova lista pendente sem modificar a anterior.', inputSchema: {...object({requestId: str, listId: str, title: str, event: str, cloneFrom: str, testOnly: {type:'boolean'}, items: {type: 'array', maxItems: 300, items: object({text: str, category: str})}}), required: ['requestId', 'title']}, annotations: {readOnlyHint: false, destructiveHint: false}, _meta: ui},
  {name: 'update_list', description: 'Editar título/itens, adicionar, marcar/desmarcar e remover na MESMA lista. Texto, transcrição e cliques usam este caminho. Requer versão atual.', inputSchema: {...object({requestId: str, listId: str, expectedVersion: {type: 'integer', minimum: 1}, operations: {type: 'array', minItems: 1, maxItems: 100, items: {type: 'object', properties: {type: {enum: ['rename', 'add', 'edit', 'set_completed', 'remove']}, itemId: str, text: str, title: str, category: str, completed: {type: 'boolean'}}, required: ['type'], additionalProperties: false}}}), required: ['requestId', 'listId', 'expectedVersion', 'operations']}, annotations: {readOnlyHint: false, destructiveHint: true}, _meta: ui},
  {name: 'open_diary', description: 'Abrir cartão opcional, com um único campo livre; não cria entrada.', inputSchema: object({}), annotations: {readOnlyHint: true}, _meta: ui},
  {name: 'save_journal', description: 'Registrar relato realmente fornecido; nunca inventar entrada quando não houver resposta. Reenvio usa o mesmo requestId.', inputSchema: {...object({requestId: str, entryId: str, text: str, eventDate: str, source: {enum: ['user', 'test']}}), required: ['requestId', 'text']}, annotations: {readOnlyHint: false, destructiveHint: false}, _meta: ui},
  {name: 'read_journal', description: 'Recuperar entrada por ID para confirmar gravação ou continuidade.', inputSchema: {...object({entryId: str}), required: ['entryId']}, annotations: {readOnlyHint: true}},
  {name: 'connection_status', description: 'Verificar acesso real à única fonte configurada, sem gravar dados.', inputSchema: object({}), annotations: {readOnlyHint: true}}
];
export async function callTool(engine, identity, name, args = {}) {
  if (!args || typeof args !== 'object' || Array.isArray(args)) throw new DomainError('invalid_input', 'Argumentos inválidos.');
  if (!identity) throw new DomainError('authentication_required', 'Entre com a conta proprietária dos registros.');
  const schema = tools.find(t => t.name === name)?.inputSchema;
  if (!schema) throw new DomainError('unknown_tool', 'Ferramenta não encontrada.');
  if (Object.keys(args).some(k => !Object.hasOwn(schema.properties, k)) || (schema.required || []).some(k => args[k] === undefined)) throw new DomainError('invalid_input', 'Argumentos ausentes ou desconhecidos.');
  if (name === 'find_lists') return engine.query(identity, args);
  if (name === 'open_list') return engine.query(identity, args);
  if (name === 'read_journal') return engine.journal(identity, args);
  if (name === 'open_diary') return {kind: 'journal', saved: false, empty: true};
  if (name === 'connection_status') { await engine.load(identity); return {kind: 'status', connected: true}; }
  const action = {create_list: 'create_list', update_list: 'update_list', save_journal: 'save_journal'}[name];
  return engine.mutate(identity, {...args, action});
}
export async function rpc(engine, identity, body, {fixture = false} = {}) {
  const reply = result => ({jsonrpc: '2.0', id: body.id ?? null, result});
  if (body.method === 'server/discover') return reply({supportedVersions: ['2026-07-28'], capabilities: {tools: {}, resources: {}}});
  if (body.method === 'initialize') return reply({protocolVersion: '2025-11-25', capabilities: {tools: {}, resources: {}}, serverInfo: {name: 'mamae-mins-runtime', version: '0.4.0'}});
  if (body.method?.startsWith('notifications/')) return null;
  if (body.method === 'tools/list') return reply({tools});
  if (body.method === 'resources/list') return reply({resources: [{uri: UI_URI, name: 'Mamãe Mins — listas e diário', mimeType: 'text/html;profile=mcp-app'}]});
  if (body.method === 'resources/read' && body.params?.uri === UI_URI) return reply({contents: [{uri: UI_URI, mimeType: 'text/html;profile=mcp-app', text: await readFile(new URL('./app.html', import.meta.url), 'utf8'), _meta: {ui: {prefersBorder: true, csp: {connectDomains: [], resourceDomains: []}}}}]});
  if (body.method === 'tools/call') {
    try {
      const value = await callTool(engine, identity, body.params?.name, body.params?.arguments);
      if (fixture) value.fixture = true;
      return reply({content: [{type: 'text', text: value.kind === 'journal' && value.entry ? 'Registro confirmado na fonte configurada.' : 'Resultado disponível nos dados estruturados.'}], structuredContent: value});
    } catch (error) {
      return reply({isError: true, content: [{type: 'text', text: error instanceof DomainError ? error.message : 'A operação não pôde ser confirmada. Seu rascunho foi mantido.'}], structuredContent: {saved: false, code: error.code || 'internal_error'}});
    }
  }
  return {jsonrpc: '2.0', id: body.id ?? null, error: {code: -32601, message: 'Method not found'}};
}

