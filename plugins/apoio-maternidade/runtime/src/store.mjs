export const MEMORY_ID = 'libfile_23a22c86aeb8819190b1cbd67c650ba5';
export class DomainError extends Error {
  constructor(code, message) { super(message); this.code = code; }
}
const START = '<!-- mamae-mins-state:v1 -->';
const END = '<!-- /mamae-mins-state:v1 -->';
export function decodeMemory(text) {
  const start = text.indexOf(START), end = text.indexOf(END);
  if (start < 0 && end < 0) return {lists: {}, journals: {}, receipts: {}};
  if (start < 0 || end < start || text.indexOf(START, start + 1) >= 0) throw new DomainError('invalid_memory', 'O bloco de listas precisa de revisão; nenhum dado foi alterado.');
  const raw = text.slice(start + START.length, end).trim();
  let value;
  try { value = JSON.parse(raw); } catch { throw new DomainError('invalid_memory', 'Não foi possível ler as listas; os registros foram preservados.'); }
  if (!value || !value.lists || !value.journals || !value.receipts) throw new DomainError('invalid_memory', 'Formato de registros inválido.');
  return value;
}
export function encodeMemory(text, state) {
  const block = `${START}\n${JSON.stringify(state, null, 2)}\n${END}`;
  if (text.includes(START)) return text.slice(0, text.indexOf(START)) + block + text.slice(text.indexOf(END) + END.length);
  return text + '\n\n## Listas e diário — dados editáveis v1\n\n' + block + '\n';
}
// Production binding: implementation must supply authenticated read and conditional
// replacement of this exact Library file, never a second database or a static copy.
export class LibraryStore {
  constructor(binding) { this.binding = binding; }
  async read(identity) {
    if (!this.binding || !identity) throw new DomainError('storage_not_connected', 'O acesso autenticado ao armazenamento existente ainda não foi conectado. Seu rascunho não foi salvo.');
    const value = await this.binding.read({libraryFileId: MEMORY_ID, identity});
    if (typeof value?.text !== 'string' || value.version === undefined) throw new DomainError('invalid_storage_response', 'A fonte de registros não retornou conteúdo e versão verificáveis.');
    return value;
  }
  async replace(identity, expectedVersion, text) {
    if (!this.binding || !identity) throw new DomainError('storage_not_connected', 'Armazenamento não conectado.');
    return this.binding.replace({libraryFileId: MEMORY_ID, identity, expectedVersion, text});
  }
}
// Test-only adapter. Never selected silently in production.
export class FixtureStore {
  constructor(text = '# Documento fictício de testes\n', version = 0) { this.text = text; this.version = version; this.fail = false; this.readFail = false; this.writes = 0; }
  async read() { if (this.readFail) throw new DomainError('read_failed', 'Falha de leitura simulada.'); return {text: this.text, version: this.version}; }
  async replace(_identity, expectedVersion, text) {
    if (this.fail) throw new DomainError('save_failed', 'Falha de salvamento simulada.');
    if (expectedVersion !== this.version) throw new DomainError('conflict', 'Os registros mudaram em outra conversa. Reabra a versão atual; o rascunho foi mantido.');
    this.text = text; this.version++; this.writes++;
    return {version: this.version};
  }
}

