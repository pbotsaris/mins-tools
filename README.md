# Mamãe Mins · Listas e diário

Site privado com interface DaisyUI em português, temas Silk e Dim fornecidos pela usuária e componente MCP Apps autocontido.

## Dados

Novos registros deste Site ficam em D1 (texto) e R2 (áudio), vinculados à identidade autenticada do Sites. O site e suas ferramentas MCP usam a mesma base. A memória histórica do plugin Mamãe Mins na Library não foi importada nem substituída; não existe sincronização automática com ela.

## Uso

As listas ficam em `/`; o diário fica em `/diario`. As telas não têm abas de navegação entre si. No ChatGPT, `open_lists` mostra somente as listas sob demanda, e `open_diary` mostra somente o diário. O lembrete nativo é separado e depende de horário e frequência escolhidos; não há tarefa agendada configurada por este Site. Grave até dois minutos, ouça e salve. O botão só pede acesso ao microfone ao ser tocado. Dentro do ChatGPT, o host precisa permitir microfone; sem permissão, use o ditado da conversa ou abra o site. Não há transcrição automática nem chave de API externa.

O endpoint POST /mcp expõe open_lists, open_diary, update_space e read_audio, além do recurso ui://mamae-mins/lists.html e ui://mamae-mins/diary.html. Sites gerencia autenticação e conexão privada.

## Desenvolvimento

`pnpm build` gera o cartão autocontido e compila o site. `pnpm test` verifica D1 e R2 locais com Miniflare. O script build-widget.mjs incorpora CSS e JS, sem CDN. Migrações Drizzle são aplicadas pelo Sites na publicação.

## Verificação

Compilação, TypeScript e testes de persistência, idempotência, conflito, isolamento, validação, áudio, exclusão e identidade passaram. Prévia aberta em navegador, mas sem identidade autenticada disponível. Microfone real, interface dentro do ChatGPT e aplicativo Android ainda precisam de teste no dispositivo.
