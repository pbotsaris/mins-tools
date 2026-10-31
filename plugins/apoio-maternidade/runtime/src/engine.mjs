import {randomUUID, createHash} from 'node:crypto';
import {DomainError, decodeMemory, encodeMemory} from './store.mjs';
const LIMIT = 300;
const id = value => {
  if (typeof value !== 'string' || !/^[a-zA-Z0-9_-]{1,100}$/.test(value) || value.startsWith('__') || Object.hasOwn(Object.prototype, value)) throw new DomainError('invalid_input', 'Identificador inválido.');
  return value;
};
const text = (value, max = 500) => {
  if (typeof value !== 'string' || !value.trim() || value.length > max || value.includes('<!-- /mamae-mins-state:v1 -->')) throw new DomainError('invalid_input', 'Informe um texto válido dentro do limite.');
  return value.trim();
};
const normalize = value => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/\s+/g, ' ').trim();
export class Engine {
  constructor(store, {clock = () => new Date().toISOString()} = {}) { this.store = store; this.clock = clock; }
  async load(identity) { const doc = await this.store.read(identity); return {doc, state: decodeMemory(doc.text)}; }
  async query(identity, {listId, query = ''} = {}) {
    const {state} = await this.load(identity);
    if (listId) {
      const list = state.lists[id(listId)];
      if (!list) throw new DomainError('not_found', 'Lista não encontrada.');
      return {kind: 'list', list, saved: true};
    }
    const terms = normalize(String(query)).split(' ').filter(Boolean);
    const lists = Object.values(state.lists).filter(l => !l.testOnly && terms.every(t => normalize(l.title + ' ' + (l.event || '')).includes(t)));
    return {kind: 'lists', lists, saved: true};
  }
  async journal(identity, {entryId} = {}) {
    const {state} = await this.load(identity);
    if (entryId) {
      const entry = state.journals[id(entryId)];
      if (!entry) throw new DomainError('not_found', 'Registro não encontrado.');
      return {kind: 'journal', entry, saved: true};
    }
    return {kind: 'journal', entries: Object.values(state.journals), saved: true};
  }
  async mutate(identity, request) {
    const {doc, state} = await this.load(identity);
    const requestId = id(request.requestId);
    const digest = createHash('sha256').update(JSON.stringify({...request, requestId: undefined})).digest('hex');
    const receipt = state.receipts[requestId];
    if (receipt) {
      if (receipt.digest !== digest) throw new DomainError('request_id_reused', 'Esta ação já foi usada com outro conteúdo.');
      return this.confirm(identity, receipt);
    }
    const now = this.clock(); let entity, kind;
    if (request.action === 'create_list') {
      const listId = id(request.listId || randomUUID());
      if (state.lists[listId]) throw new DomainError('already_exists', 'Esta lista já existe; use o identificador para retomá-la.');
      let items = [];
      if (request.cloneFrom) {
        const origin = state.lists[id(request.cloneFrom)];
        if (!origin) throw new DomainError('not_found', 'Lista anterior não encontrada.');
        items = origin.items.map(i => ({...i, id: randomUUID(), completed: false, originListId: origin.id, originItemId: i.id}));
      } else {
        if (!Array.isArray(request.items || []) || (request.items || []).length > LIMIT) throw new DomainError('invalid_input', 'Itens inválidos.');
        for (const item of request.items || []) {
          const value = text(item.text);
          if (!items.some(i => normalize(i.text) === normalize(value))) items.push({id: randomUUID(), text: value, category: item.category ? text(item.category, 80) : '', completed: false});
        }
      }
      entity = {id: listId, title: text(request.title, 160), event: request.event ? text(request.event, 200) : '', status: 'active', version: 1, createdAt: now, updatedAt: now, items};
      if (request.testOnly === true) entity.testOnly = true;
      if (request.cloneFrom) entity.originListId = request.cloneFrom;
      state.lists[listId] = entity; kind = 'list';
    } else if (request.action === 'update_list') {
      entity = state.lists[id(request.listId)]; kind = 'list';
      if (!entity) throw new DomainError('not_found', 'Lista não encontrada.');
      if (request.expectedVersion !== entity.version) throw new DomainError('conflict', 'A lista mudou em outra conversa. Seu rascunho foi mantido; consulte a versão atual.');
      if (!Array.isArray(request.operations) || !request.operations.length || request.operations.length > 100) throw new DomainError('invalid_input', 'Operações inválidas.');
      for (const op of request.operations) {
        if (op.type === 'rename') entity.title = text(op.title, 160);
        else if (op.type === 'add') {
          const value = text(op.text);
          if (!entity.items.some(i => normalize(i.text) === normalize(value))) {
            if (entity.items.length >= LIMIT) throw new DomainError('limit', 'A lista atingiu o limite de itens.');
            const itemId = id(op.itemId || randomUUID());
            if (entity.items.some(i => i.id === itemId)) throw new DomainError('already_exists', 'Identificador de item já usado.');
            entity.items.push({id: itemId, text: value, category: op.category ? text(op.category, 80) : '', completed: false});
          }
        } else {
          const index = entity.items.findIndex(i => i.id === id(op.itemId));
          if (index < 0) throw new DomainError('not_found', 'Item não encontrado.');
          if (op.type === 'remove') entity.items.splice(index, 1);
          else if (op.type === 'set_completed') {
            if (typeof op.completed !== 'boolean') throw new DomainError('invalid_input', 'Conclusão inválida.');
            entity.items[index].completed = op.completed;
          } else if (op.type === 'edit') {
            if (op.text !== undefined) entity.items[index].text = text(op.text);
            if (op.category !== undefined) entity.items[index].category = op.category ? text(op.category, 80) : '';
          } else throw new DomainError('invalid_input', 'Operação desconhecida.');
        }
      }
      entity.version++; entity.updatedAt = now;
    } else if (request.action === 'save_journal') {
      const body = text(request.text, 12000);
      if (request.eventDate && !/^\d{4}-\d{2}-\d{2}$/.test(request.eventDate)) throw new DomainError('invalid_input', 'Data inválida.');
      const entryId = id(request.entryId || randomUUID());
      if (state.journals[entryId]) throw new DomainError('already_exists', 'Este registro já existe.');
      entity = {id: entryId, text: body, eventDate: request.eventDate || null, recordedAt: now, source: request.source === 'test' ? 'test' : 'relato da usuária', version: 1};
      state.journals[entryId] = entity; kind = 'journal';
    } else throw new DomainError('invalid_input', 'Ação desconhecida.');
    // Receipts keep only the request fingerprint, not extra copies of journal text.
    const receiptValue = {kind, entityId: entity.id, digest, requestId, version: entity.version};
    state.receipts[requestId] = receiptValue;
    const keys = Object.keys(state.receipts); for (const key of keys.slice(0, Math.max(0, keys.length - 200))) delete state.receipts[key];
    const replacement = encodeMemory(doc.text, state);
    await this.store.replace(identity, doc.version, replacement);
    return this.confirm(identity, receiptValue);
  }
  async confirm(identity, receipt) {
    const {state} = await this.load(identity);
    const entity = receipt.kind === 'list' ? state.lists[receipt.entityId] : state.journals[receipt.entityId];
    if (!entity || entity.version < receipt.version || state.receipts[receipt.requestId]?.digest !== receipt.digest) throw new DomainError('readback_failed', 'A gravação precisa de verificação. Mantenha o rascunho e tente consultar antes de reenviar.');
    return receipt.kind === 'list' ? {kind: 'list', list: entity, saved: true} : {kind: 'journal', entry: entity, saved: true};
  }
}

