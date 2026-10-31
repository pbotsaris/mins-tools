# Mamãe Mins — implementação v0.4.0

Estado: componentes e motor implementados; conexão hospedada ao ChatGPT e à fonte existente ainda pendente. Não instalar uma segunda base nem copiar dados pessoais para este projeto.

## O que existe de fato

- Checklist reutilizável em `src/app.html`: título, texto e categorias editáveis; adicionar, remover, marcar/desmarcar; layout a partir de 320 px e alvos de toque de 44 px.
- Cartão opcional de diário com campo livre e ação “Registrar meu dia”. Não há formulário obrigatório nem controle próprio de microfone.
- MCP em `src/mcp.mjs`: descoberta, ferramentas, recursos e componente `text/html;profile=mcp-app`. Texto, transcrições e cliques usam `update_list` e o mesmo ID/versão.
- Motor em `src/engine.mjs`: buscas, nova lista, cópia para nova viagem com itens pendentes, proteção da original, operações por ID, versão esperada, deduplicação, diário e confirmação por leitura após escrever.
- `src/store.mjs`: leitura/atualização de UM documento existente. O bloco estruturado é acrescentado sem sobrescrever o contexto pessoal. O adaptador de produção exige autenticação e substituição condicional.
- Em falha, o servidor devolve `saved:false`; o cartão mantém o rascunho em memória enquanto estiver aberto. Fechar/recarregar o cartão pode perder rascunhos não salvos; não há promessa de recuperação local após fechar.
- Recibos de idempotência armazenam hashes, não cópias de relatos. São mantidos os 200 recibos mais recentes; fora dessa janela, consultar o estado antes de repetir uma ação antiga.

## Fonte única preservada

Arquivo: `libfile_23a22c86aeb8819190b1cbd67c650ba5`. Não há cópia dos dados pessoais neste pacote. O bloco entre `<!-- mamae-mins-state:v1 -->` e seu fechamento contém as listas e entradas do motor; o restante do documento é preservado. Os testes antigos no corpo são registros históricos de verificação, não listas pessoais ativas.

## Executar os testes e a interface de demonstração

Requer Node.js 20+; nenhuma dependência externa.

```sh
npm test
npm run dev
```

`dev` ativa explicitamente `MAMAE_MINS_DEMO=1`. A interface exibe aviso de dados fictícios e salva somente na memória do servidor de demonstração, que se perde ao reiniciar. Isto não é o armazenamento de produção nem uma instalação no ChatGPT.

`npm start` nunca habilita dados fictícios silenciosamente: sem adaptador autenticado, operações de dados falham como não conectadas.

## O que falta conectar exatamente

1. Obter a verificação de elegibilidade do Sites para a integração que lê e substitui o arquivo da conta. A ferramenta `sites_list_plugin_eligibility` não estava exposta durante esta implementação. A conexão não foi inventada nem substituída por uma base nova.
2. Descobrir os identificadores e esquemas REAIS das ações autorizadas de leitura, upload/substituição condicional da mesma identidade. As ferramentas nativas funcionam nesta conversa, mas isso não concede acesso automático a um servidor hospedado. O servidor não pode usar credenciais da sessão de autoria, caminhos locais de upload ou cabeçalhos forjados.
3. Fornecer um módulo servidor em `MAMAE_MINS_ADAPTER_MODULE`, que exporte:

```js
export async function authenticateRequest(request) {
  // Validar a identidade usando a integração de autenticação do host.
  // Retornar a identidade autorizada; rejeitar acesso sem autenticação.
}
export const binding = {
  async read({libraryFileId, identity}) {
    // Consultar a versão ATUAL pela ação real autorizada do provedor.
    // Retornar {text: string, version: number|string}.
  },
  async replace({libraryFileId, identity, expectedVersion, text}) {
    // Substituir a MESMA identidade, com proteção de versão no provedor.
    // Rejeitar conflito; nunca gravar em outro arquivo ou ignorar o guard.
    // Retornar somente após confirmação real do provedor.
  }
};
```

O código acima documenta o contrato do adaptador; não é uma conexão implementada. `LibraryStore` rejeita uma ligação ausente. O módulo deve ser implementado com as ações descobertas e a identidade do usuário final, não com uma conta técnica compartilhada.

4. Hospedar o servidor de forma privada e permanente, com a autenticação do host e o adaptador aprovado. A publicação da integração auxiliar privada foi autorizada pelo usuário, mas não ocorreu enquanto o acesso à fonte não pudesse ser validado. Não depende do computador de autoria depois de hospedado.
5. Usar o endpoint MCP verificado para conectar a integração auxiliar e selecionar suas ferramentas junto ao Mamãe Mins original. Preservar o plugin `plugins_6ae4cfbeeb208191974d2bb1c2155746`. Não declarar MCP conectado só porque os arquivos estão no plugin. Se Sites provisionar App/plugin auxiliar, reutilizar essa identidade; não recriar o Mamãe Mins.
6. Testar no ChatGPT real um novo chat, os cliques contra a fonte real e o Android. Ditado deve vir do microfone do próprio ChatGPT. O texto transcrito segue a mesma ferramenta, mas transcrição simulada não prova o microfone Android.

## Diário agendado

A consulta das tarefas nativas em 30/10/2026 retornou zero tarefas. Nenhuma foi criada. É necessário perguntar horário e frequência e confirmar `America/Sao_Paulo`; consultar novamente antes da criação para evitar duplicação.

Convite: “Quer me contar como foi hoje? Pode escrever ou falar do seu jeito.” O agendamento envia texto; não há comprovação de que a notificação renderize o cartão ou selecione o plugin. Abrir o cartão apenas na resposta ou quando solicitado, se as ferramentas reais estiverem disponíveis. Não gravar nada sem relato.

## Verificações realizadas

| Verificação | Resultado e limite |
| --- | --- |
| Motor: criar, editar, concluir/desconcluir, adicionar/remover, recuperar por ID | 11 testes automatizados passaram; adaptador fictício |
| Nova viagem e reutilização | Cópia recebe novos IDs e itens pendentes; original preservada; simulado |
| Falha, reenvio e conflito | Rascunho não é enviado como salvo; idempotência e versão verificadas; simulado |
| Interface clicável e diário | Exercitados no navegador com host MCP simulado e dados fictícios |
| Largura de celular | Conferida a 360 px no navegador; não é Android real |
| Fonte real existente | Listas e diário técnicos gravados com ferramentas nativas e proteção de versão; conteúdo lido novamente e confirmado |
| Gravação real pelos cliques do cartão | Pendente da conexão hospedada |
| Recuperação em OUTRO chat ChatGPT | Pendente; reiniciar o motor ou reabrir a interface de teste não substitui esse teste |
| Ditado real e aplicativo Android | Pendentes |
| Agendamento | Pendente de horário/frequência; nenhuma tarefa criada |

Os registros técnicos reais são explicitamente fictícios (`v040-lista-teste`, `v040-diario-teste`); não são acontecimentos da vida de Marina. Foram usados apenas no teste de persistência solicitado.

Referências de implementação consultadas: especificações oficiais MCP Apps e OpenAI MCP Extensions, em 30/10/2026. O contrato foi testado contra um host simulado; interoperabilidade com a conta e versão do aplicativo ainda requer teste real.

