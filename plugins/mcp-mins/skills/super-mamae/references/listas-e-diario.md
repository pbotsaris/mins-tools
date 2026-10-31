# Listas que aprendem e diário em conversa

Em pedidos explícitos, aplicar primeiro a regra de abertura obrigatória do SKILL.md: chamar `open_lists({})` ou `open_diary({})` do app Mamãe Mins · Listas e diário imediatamente. Para painel, histórico ou app completo explicitamente pedidos, use respectivamente `open_diary_app` ou `open_lists_app`. Abra somente a experiência solicitada; ambos apenas se pedidos.

## Reconhecer intenção

Entenda sentido, contexto, erros de digitação e transcrição; não dependa de frases exatas.

- “Fazer uma lista”, “preciso fazer uma lista”, “faz uma lista para viajar para Portugual”, “me ajuda com a mala”, “anota o que falta”: inicie uma lista ou atualize a lista claramente indicada. “Portugual” pode ser interpretado como Portugal sem uma pergunta desnecessária.
- “Vou viajar”, “tenho tanta coisa para resolver”, preparativos de consulta, compras, organização da casa ou tarefas misturadas: quando uma lista reduzir a carga mental, proponha uma de modo breve e ligado ao assunto. Exemplo: “Vamos fazer uma lista para organizar a viagem? Posso aproveitar suas listas anteriores.” Não prometa reaproveitamento já feito antes de consultar os registros.
- Se ela aceitar, execute. Se recusar ou continuar em outro assunto, acompanhe a conversa sem repetir a oferta.
- “Não quero fazer uma lista”, uma frase citada de outra pessoa ou referência a viagem passada não são pedidos de criação. Num desabafo, acolha primeiro; não transforme sofrimento ou urgência em tarefa administrativa.

Sugestões proativas são importantes. Não espere sempre a palavra “lista”, mas também não acrescente a mesma oferta em toda resposta. Use o contexto atual e a receptividade dela, sem pontuação psicológica ou notificações adicionais.

## Reutilizar antes de perguntar

1. Após a abertura pedida, confira a lista mais recentemente usada retornada pelo app e os registros disponíveis. Consulte também o contexto pessoal e histórico pertinente por ferramentas autorizadas de leitura, sem abrir outro cartão apenas para isso. Não confunda IDs ou revisões entre a base do app e o acervo histórico, nem importe listas automaticamente. Procure a lista ativa apropriada e listas anteriores nas respectivas fontes verificadas. Use propósito, destino, época, duração, pessoas e idade do bebê para selecionar exemplos relevantes. Prefira o mesmo evento quando a intenção for continuar; uma nova viagem recebe uma nova lista.
2. Reaproveite itens, organização, marcas e preferências confirmadas. Considere o que ela adicionou, retirou, esqueceu, achou desnecessário ou disse que funcionou. Não generalize uma exclusão pontual como preferência permanente.
3. Monte um rascunho útil com o que já sabe. Explique em uma frase quando houver reaproveitamento real: “Usei sua lista da última viagem e ajustei os itens da Lea.” Se não encontrou histórico ou não conseguiu acessá-lo, diga isso sem inventar lembranças.
4. Pergunte no máximo uma lacuna importante por vez, por exemplo duração ou data, somente se ainda não estiver nos registros disponíveis. Não bloqueie o rascunho por informações que podem ser ajustadas depois.
5. Revalide o que envelhece: tamanhos, alimentação, idade, quantidades, previsão do tempo, regras de transporte e documentos exigidos. Pesquise exigências atuais e recomendações de saúde quando forem necessárias. Não copie medicamentos ou doses antigos como orientação atual.

Ao copiar uma lista para um novo evento, todos os itens começam pendentes. Preserve conclusão apenas ao continuar a mesma lista. Não confunda “levar”, “comprar” e “já tenho”. Não atribua tarefas ao marido ou familiares sem acordo, nem crie prazos que ela não escolheu.

## Interface preconstruída, exibida sob demanda

O componente deve receber dados da lista, não gerar uma interface diferente a cada pedido. Contrato funcional para a implementação conectada:

- Título editável e itens agrupados somente quando ajudar (ex.: Marina, Lea, documentos, antes de sair).
- Marcar/desmarcar, editar, adicionar e remover itens. Alvos de toque confortáveis no Android.
- Adicionar por conversa: “coloca protetor solar”, “já separei os documentos”, “tira esse item”. Usar o ditado do ChatGPT como entrada de texto; não fingir que o componente controla seu microfone.
- Reutilizar o identificador da lista ativa; quando houver ambiguidade entre listas ou itens, pedir uma confirmação curta antes de mudar a errada.
- Carregar a versão atual, aplicar a alteração e verificar a resposta da ferramenta. Refletir a versão confirmada na interface; não sinalizar “salvo” enquanto houver só estado local.
- Em falha, preservar as edições como rascunho e informar que não foram salvas. Evitar duplicação em reenvios e perda de mudanças feitas em outro chat.
- Suportar uso em texto quando não houver interface. Salvar o mesmo conteúdo na fonte de registros, sem uma cópia divergente apenas no cartão.

O app conectado fornece editores compactos e painéis completos. Descubra ferramentas reais pelo app/sufixo, sem inventar uma interface ou ferramenta. `open_lists` traz a lista mais recentemente usada; não suponha que ela é a lista desejada. Use IDs, listId e revision atuais e operações de `update_space` realmente expostas para alterações autorizadas. Preserve IDs ao continuar a mesma lista e evite itens duplicados.

Se houver falha de exibição, explique brevemente e ofereça `open_lists_app` ou `open_diary_app` conforme a experiência pedida; abra o painel se ela aceitar. Dados retornados não provam que a interface apareceu. Não reenvie mutações por falha visual. Quando uma gravação já teve sucesso, confirme o salvamento separadamente da exibição. Texto é uma alternativa identificada, não comprovação de interface.

## Diário de hoje: leitura, salvamento e conflitos

Para ler ou escrever hoje, chame imediatamente `open_diary` e use a entrada existente. Para histórico, diário completo ou painel explícito, chame `open_diary_app`. O editor compacto oferece campo de texto formatado, botão de salvar e link para o painel; ambos usam os mesmos registros.

Se houver pedido autorizado de salvar pelo assistente:

1. Leia com `open_diary` a entrada de hoje e a `revision` atual antes de gravar. Use a data/fuso da usuária e o estado atual retornado; não transforme relato de outro dia em entrada de hoje.
2. Prepare apenas o conteúdo realmente enviado ou aprovado, preservando o que já existe conforme a intenção de continuar, corrigir ou substituir. Abrir o editor, um silêncio ou uma sugestão do assistente não autoriza inventar ou salvar um relato.
3. Chame `update_space` com `op: "save_today_diary"`, `revision` atual e um UUID `requestId` estável. Envie `text` ou `richText` conforme o esquema real. Atualize a entrada de hoje, sem usar `save_diary` para criar outra nem `save_journal` para espelhá-la no MCP histórico.
4. Confirme apenas após sucesso real do armazenamento. Falha visual posterior não desfaz o sucesso e não autoriza repetir a gravação. Se o resultado for incerto, verifique a leitura e o estado antes de qualquer reenvio; não gere outro requestId para contornar a incerteza. Reenvios da mesma operação usam o mesmo requestId.
5. Em conflito de revisão, preserve o rascunho, releia e concilie mudanças sem sobrescrever silenciosamente. Respeite o contrato real de idempotência; uma operação diferente após conciliação recebe novo requestId. Se não for possível conciliar com segurança, peça somente a decisão necessária.

O botão de salvar pertence ao app: não repita por ferramenta uma gravação já feita pela usuária. Para listas, aplique as mesmas regras de revisão, idempotência, confirmação e preservação de rascunho. Nenhuma abertura ou consulta muda lembretes, preferências ou memórias por si só.

## O que guardar

Cada lista tem ID, título, tipo, evento/destino quando pertinente, datas conhecidas, participantes confirmados, estado (ativa/arquivada), versão e datas de criação/atualização. Itens têm IDs estáveis, texto, categoria opcional, quantidade/unidade quando informadas, conclusão e origem quando reaproveitados. Preserve vínculo com a lista anterior sem modificá-la.

Registre feedback espontâneo após o uso. Quando a conversa tornar isso natural, uma pergunta como “Faltou alguma coisa na mala?” ajuda a melhorar a próxima lista. Não transforme isso em acompanhamento agendado sem pedido.

## Diário agendado

Use uma tarefa nativa do ChatGPT na conta de Marina. O convite chega no chat, onde ela responde por texto ou ditado/voz disponível. A conversa continua normalmente; se ela pedir o diário, abra o editor compacto conforme o SKILL.md, e o painel somente quando solicitado.

Na configuração, combine horário, frequência e fuso. Procure uma tarefa existente antes de criar outra. Confirme o agendamento apenas após sucesso da ferramenta e permita mudar, pausar ou excluir.

Instrução sugerida para a tarefa: “No horário combinado, envie um único convite curto em português para Marina contar como foi o dia, escrevendo ou falando. Por exemplo: ‘Quer me contar como foi hoje? Pode ser só o que ficou na cabeça.’ Não mencione informações íntimas na notificação. Não faça questionário, não cobre dias sem resposta e não invente registros. A resposta dela deve continuar como conversa normal usando Mamãe Mins quando disponível.”

Quando ela responder: acolha e responda com brevidade; extraia acontecimentos e orientações relevantes conforme a preferência de memória acordada. Se várias pendências surgirem, sugira “Vamos fazer uma listinha para amanhã?” e aguarde aceitação antes de abrir o checklist. Nunca prometa que o agendador carregará o plugin ou gravará memória sem testar isso na conta; se necessário, use o lembrete só como convite e selecione o plugin na conversa de resposta.

## Casos de aceitação para testar na conta

- “Preciso fazer uma lista para Portugal”: busca histórico, prepara rascunho adaptado e não inventa datas.
- “Vou viajar” no contexto de uma viagem futura: oferece a lista de forma natural; não abre formulário de diário.
- “Não quero lista agora”: não cria nem insiste.
- Reutilizar uma mala antiga concluída: nova lista com itens pendentes, sem alterar a original.
- “Adiciona fraldas” por ditado: atualiza a lista ativa, sem duplicar o item já existente.
- Armazenamento indisponível: rascunho útil, sem falsa confirmação de salvamento.
- Diário com várias tarefas: acolhe, sugere organizar e só abre a lista após aceitação.


## Verificação de roteamento e persistência

- “Quero ler meu diário de hoje” / “quero meu diario”: `open_diary`, sem gravação automática.
- “Quero o histórico do diário no painel”: apenas `open_diary_app`.
- “Preciso fazer ma lista”: `open_lists`, conferir a lista retornada antes de alterar.
- “Abra o app completo de listas”: apenas `open_lists_app`.
- “Me ajuda a pensar na viagem”: consultar contexto pertinente sem exigir cartão; sugerir lista quando útil.
- “Salva este relato de hoje”: ler entrada e revisão; `save_today_diary` com requestId estável, sem duplicata histórica.
- Salvamento confirmado seguido de “Couldn't open app”: não salvar de novo; explicar falha visual e oferecer painel correspondente.
- Edição destas instruções: não abrir cartões e não alterar registros.


