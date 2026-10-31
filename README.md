# Mamãe Mins · Listas e diário

Site privado em português. Texto em D1 e áudio em R2, vinculados à identidade autenticada do Sites. O Site e as ferramentas MCP usam a mesma base. A memória histórica do plugin não é importada automaticamente.

## Cartões na conversa

`open_diary` abre um diálogo inline com um único editor formatado para o dia atual em America/Sao_Paulo, botão de envio e link para o diário completo no painel. Se já houver um registro hoje, ele é carregado para leitura e continuação. `save_today_diary` atualiza esse registro (preservando áudio existente) ou cria um, sem gerar outra entrada a cada envio. A revisão e o requestId protegem contra conflitos e reenvios. Se existirem vários registros antigos no mesmo dia, o cartão continua o mais recente e preserva os demais.

`open_lists` abre um diálogo inline com a última lista alterada, ou a última criada quando ainda não há essa informação. Permite renomear, editar itens, marcar feitos, adicionar e excluir itens. Os campos de texto são salvos ao sair do campo ou pressionar Enter. O link abre todas as listas no painel.

Os cartões usam `widget/card-main.tsx`, `widget/card.tsx`, `widget/bridge.ts` e CSS próprio, sem carregar o app inteiro. `widget/card.html` é gerado pelo build. O bridge inicia MCP Apps, recebe resultados e faz chamadas pelo host; não acessa a base diretamente. O modo inicial é explicitamente inline. Não há acesso ao microfone nem a recursos de rede no cartão compacto.

## Apps completos

`open_diary_app` e `open_lists_app` têm entrypoints global e de conversa com recursos próprios em fullscreen. Mantêm o app completo, histórico, busca, listas, temas e gravação de áudio. No navegador, `/diario` abre o diário e `/` abre listas. Os links de painel usam o deep link do plugin provisionado pelo Sites. Há também links diretos ao navegador para hosts que não suportam painéis.

URIs de recursos anteriores continuam disponíveis. Recursos HTML e descoberta não consultam dados pessoais; toda ferramenta que lê ou altera registros exige identidade. A política privada do Sites continua protegendo o endpoint.

## Dados e segurança

Novos registros formatados usam o campo opcional `richText` com documento validado e texto para busca/exportação. Registros antigos mantêm seu formato e editor anteriores no app completo. Não há HTML arbitrário nos registros. Áudio usa até 8 MB; não há transcrição automática.

O lembrete de diário é uma automação separada. Abrir um cartão ou painel não cria nem altera agendamento.

## Desenvolvimento

Código em um repositório em `~/dev/mins-tools`. `pnpm build` gera o app incorporável, os cartões compactos e o Site. `pnpm test` verifica inicialização do bridge, formatação, persistência, isolamento, conflitos, áudio, diário de hoje, lista recente e recursos inline/fullscreen. `tsc --noEmit` verifica tipos.

A prévia usa dados isolados. A exibição final no ChatGPT e o comportamento de painel do host precisam ser confirmados no cliente após publicação; testes locais não substituem essa confirmação.
