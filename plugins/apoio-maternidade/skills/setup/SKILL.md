---
name: setup
description: Configure o plugin Apoio à maternidade quando a usuária iniciar a configuração ou pedir para conectar seus registros e lembrete de diário.
---

# Configuração do acompanhamento

## Memória compartilhada autorizada

Marina autorizou que ChatGPT selecione informações importantes para recuperar depois e as salve no mcp-mins, mantendo os dados próprios dos apps em seus armazenamentos. Depois de interações relevantes e de salvamentos confirmados no app, registre no mcp-mins somente fatos úteis, preferências, decisões, pendências relevantes e resumos breves do que foi realmente informado. Não peça autorização novamente a cada gravação dentro desse escopo; respeite pedidos de não guardar e o contrato de memória. Não copie listas ou diários inteiros. Inclua origem, data e ID do registro do app quando disponível, para recuperar a fonte atual. Um resumo de planejamento não comprova que a viagem ou tarefa aconteceu. Evite duplicação: leia o contexto, atualize o trecho apropriado usando update_context, sourceVersion atual e requestId estável; confirme o resultado. Quando a informação mudar ou for excluída, corrija ou remova também o resumo derivado sob controle do plugin. Não preserve em memória algo que a usuária pediu para esquecer.

O contexto do mcp-mins deve informar a ajuda nos apps por meio do ChatGPT: leia-o antes de personalizar listas, diário e planejamento, e use os registros atuais do app quando relevantes. Estas instruções conectam o fluxo mediado pelo ChatGPT; não implementam consulta direta do servidor do app ao servidor mcp-mins nem sincronização em segundo plano. Se uma gravação de memória falhar, informe separadamente: o salvamento confirmado no app continua válido.

## Integração ativa dos três plugins — 31/10/2026

Esta seção e a memória compartilhada abaixo prevalecem sobre regras antigas de roteamento, indisponibilidade e registro nas referências legadas. Mamãe Mins é o acompanhamento; mcp-mins é a memória pessoal viva; Mamãe Mins · Listas e diário é a fonte principal para listas e diário atuais. Use os três em conjunto quando o pedido precisar de contexto. Não exige mencionar os três plugins a cada mensagem.

- Antes de respostas pessoais ou planejamento, consulte `read_context({})` do app **mcp-mins**. Na primeira utilização ou após erro, verifique `connection_status({})`. Identifique ferramentas pelo app e sufixo; não confunda seus `open_diary` homônimos.
- Para listas e diário atuais, use **Mamãe Mins · Listas e diário**: `open_lists`, `open_diary`, `open_lists_app`, `open_diary_app` e `update_space`. Os resultados estruturados de abertura incluem listas, entradas e revisão: use esses registros como contexto vivo do pedido, não somente como interface. Leia a entrada/lista existente antes de alterar e preserve seus IDs. A base do app prevalece para esses registros.
- No início de uma conversa relevante, carregue o contexto do mcp-mins; quando o pedido envolver listas, preparativos ou acontecimentos registrados no diário, recupere também a fonte do app correspondente. Não releia ambas em cada mensagem se os dados atuais já estiverem disponíveis. Não abra os dois editores em um pedido de apenas um deles. Não existe ferramenta de leitura silenciosa do app nesta versão: se precisar consultar esses registros, a abertura correspondente pode mostrar a interface; não invente um endpoint silencioso.
- Atualize listas existentes com `update_space` usando revisão atual e IDs retornados. Para hoje, `op: "save_today_diary"`, data local America/Sao_Paulo e UUID requestId estável. Preserve o texto já salvo e as correções; não substitua o dia inteiro por um novo fragmento. Em conflito, releia, concilie o pedido e preserve o rascunho; não force revisão antiga.
- Use `update_context` do **mcp-mins** para contexto pessoal duradouro autorizado: primeiro leia sourceVersion, use fragmento anterior único e expectedSourceVersion atual. Não copie entradas inteiras ou listas para lá. Só grave informação distinta e mínima conforme o contrato de memória; a instrução de conectar plugins não é relato para o diário.
- `find_lists`, `open_list`, `update_list`, `save_journal` e `read_journal` do mcp-mins continuam disponíveis para acervo histórico explicitamente identificado. Não crie novas listas/diários paralelos como alternativa ao app nem interprete histórico técnico como relato pessoal.
- As bases permanecem distintas, com leitura combinada na conversa e gravação na fonte responsável. Isto não é sincronização automática de bancos. Nunca afirme que alteração feita em um banco apareceu no outro. Não use títulos ou resumos antigos como substituto de leitura atual, nem restaure informações corrigidas/excluídas a partir do pacote.
- Só confirme gravação após sucesso; releia quando necessário para confirmar continuidade. Conexão e leitura foram verificadas em 31/10/2026; ativação automática em novo chat e uso real no telefone precisam de teste. Não prometa execução universal ou em segundo plano.


Leia [a skill principal](../super-mamae/SKILL.md) e [a fonte e migração](../super-mamae/references/armazenamento.md). Aproveite respostas anteriores e faça uma pergunta de cada vez, somente quando necessária.

1. Explique brevemente que a conversa é o principal, com listas e cartão opcional de diário. Respeite as preferências já dadas sobre guardar registros; não peça a mesma autorização em toda conversa.
2. Use a conexão OAuth do MCP já declarada no plugin. O proprietário entra na página do próprio servidor e autoriza; não peça senhas nem tokens no chat. Se a ferramenta não estiver disponível, oriente a conectar o plugin sem inventar menus ou afirmar que está conectado.
3. Descubra ferramentas reais pelo app e pelo sufixo. No MCP histórico, chame connection_status e read_context somente se disponíveis. O app Listas e diário usa base distinta: preserve ambas, sem supor sincronização ou importar registros. Para contexto pessoal, use leitura autorizada sem exigir cartão; para interface pedida, siga a abertura imediata da skill principal. Preserve o contexto, correções, exclusões, listas e diário atuais. Se a importação estiver pendente, siga armazenamento.md, conserve a fonte anterior e não migre sem instrução explícita. Não crie outra base nem reinicialize pelo contexto inicial empacotado.
4. Verifique continuidade com uma preferência inofensiva fornecida pela usuária: salvar, ler novamente e recuperar em novo chat. Só declare persistência entre chats após esse teste.
5. Se ela quiser diário agendado, reaproveite informações dadas sobre horário e frequência, confirme o fuso e consulte as tarefas existentes. Use a ferramenta nativa do ChatGPT. Convite: “Quer contar como foi hoje? Pode escrever ou falar do seu jeito.” Não inclua dados íntimos na notificação, não crie entrada sem resposta e não afirme agendamento sem confirmação.
6. Para voz, use o ditado nativo do ChatGPT. Texto transcrito, cliques e conversa usam as mesmas listas e ferramentas. Confirme nomes, doses e datas ambíguas. Se o cartão conectado estiver indisponível, ajude em texto e preserve o rascunho.

Ao terminar, diga o que foi confirmado, qual fonte está ativa e o que ainda precisa de teste. Consulte [a integração](../super-mamae/references/integracao-v040.md) para os limites do cartão, ditado e uso entre chats.


