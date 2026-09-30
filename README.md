# Chat por regras (demonstração)

Atendimento automático para perguntas frequentes: cada assunto tem palavras-chave, expressões e **uma resposta aprovada pelo dono do negócio**. Quando nada combina, o chat **não inventa**: indica que uma pessoa precisaria assumir. Nesta demonstração, o encaminhamento é simulado: nenhuma conversa é enviada. Funciona em português e espanhol.

O motor responde por regras, sem usar IA em execução. Não possui backend próprio. A conversa permanece na memória desta aba e o código não a transmite nem persiste. A hospedagem pode manter seus próprios registros de acesso.

- Sem cookies e sem dependências externas.
- Sem dependências: três arquivos (`index.html`, `chat-engine.js`, `rules.js`).
- Negócio fictício ("Loja Exemplo" / "Tienda Ejemplo"); horários, prazos e condições são de exemplo.

## Como usar

Abra `index.html` no navegador.

Alterar `rules.js` permite adaptar a base de perguntas desta demonstração. Para uso operacional, também é preciso validar respostas, definir o canal e a passagem para atendimento humano, revisar requisitos de privacidade e testar o fluxo nas condições do cliente.

Cada regra:

```js
{
  id: "horario",                       // identificador único
  label: "Horário de atendimento",     // texto do botão de atalho
  keywords: ["horario", "abre", "fecha"],  // palavras soltas (1 ponto cada)
  phrases: ["que horas"],              // expressões (2 pontos cada)
  answer: "Atendemos de segunda a sexta, das 8h às 18h.",
  buttons: ["entrega"],                // atalhos mostrados depois da resposta
  priority: 0,                         // desempate entre assuntos com a mesma pontuação
  handoff: false,                      // true = sinaliza que o assunto exige atendimento humano; nesta demo não transmite a conversa
  onlyAlone: false                     // true = só vale se nenhum outro assunto combinar (saudações)
}
```

O pedido explícito de pessoa fica no campo `human` de cada idioma: `ruleId` (a regra de pessoa), `words` (palavras fortes, como "atendente" e "humano"), `phrases` ("falar com uma pessoa") e `negations` ("não", "nem", "sem"...).

Se a base tiver um problema (tipo errado em `keywords` ou `phrases`, regra nula, id repetido, resposta vazia, atalho que aponta para uma regra que não existe, palavra-chave curta demais), a página mostra o motivo no topo e **pausa o envio e os atalhos** até a base ser corrigida ou o idioma trocado para uma base válida. Um erro de sintaxe no próprio `rules.js` é outra classe de problema: o navegador não carrega o arquivo e a validação não chega a rodar.

## Como o chat decide

1. Normaliza a mensagem: minúsculas, sem acentos, sem pontuação, até 500 caracteres.
2. Soma pontos por assunto: expressão encontrada vale 2; cada palavra diferente da mensagem que combina com uma palavra-chave vale 1. Palavras de 5 letras ou mais aceitam **uma** letra trocada, a mais ou a menos; palavras curtas precisam ser exatas.
3. **Pedido explícito de pessoa vem primeiro:** uma palavra forte ou expressão de `human` sem negação nas 4 palavras anteriores leva à regra de pessoa, mesmo que a mensagem cite outro assunto ("quero humano para pagamento cartão crédito débito"). Se todos os sinais estiverem negados ("não quero falar com atendente, quero saber como pagar"), a regra de pessoa sai da disputa e vale o assunto. Isso não é compreensão geral de negação: só olha palavras como "não" logo antes.
4. Saudações só valem sozinhas: "oi, qual o horário?" responde o horário.
5. Vence a maior pontuação; em empate, a maior prioridade. Se ainda empatar, o chat pergunta qual assunto a pessoa quis dizer.
6. Sem nenhuma combinação, indica que uma pessoa precisaria assumir (simulado). Na página, a lista "Perguntas sem resposta nesta aba" mostra essas perguntas, para melhorar a base; ela é reiniciada ao recarregar ou trocar o idioma.

## Limites

- Não entende frases que não usam as palavras da base. É por isso que o encaminhamento a uma pessoa faz parte do desenho.
- A tolerância a erro de digitação é de uma letra, e só em palavras de 5 letras ou mais.
- Esta demonstração não se conecta a WhatsApp, redes sociais ou sistemas e não prova integração com nenhum canal nem atendimento humano real. Ligar o motor a um canal autorizado é uma etapa própria de cada projeto, com as contas e chaves no nome do cliente.
- A negação só é reconhecida por palavras como "não", "nem" e "sem" até 4 palavras antes do pedido de pessoa.

## Testes

```bash
npm test   # Node 20 ou mais novo; sem instalar nada
```

Os testes do motor cobrem acentos, erro de digitação, empate, saudação com pergunta, pedido explícito de pessoa (com e sem negação), encaminhamento simulado, mensagem vazia ou enorme, HTML na mensagem, a validação da base com tipos errados e os textos que não podem prometer envio. O comportamento da página no navegador (bloqueio com base inválida, teclado, contraste, temas e celular) foi conferido à parte com Chromium; veja o RELATORIO.md do pacote.

## Como foi feito

Desenvolvido com assistentes de IA sob a direção de Rafael Orlando Mendes, com revisão cruzada entre os assistentes antes de publicar. Licença MIT.

---

**ES.** Demostración de atención automática por reglas: cada tema tiene palabras clave, expresiones y una respuesta aprobada por el dueño; sin coincidencia, el chat no inventa e indica que una persona debería intervenir. En esta demostración, la derivación es simulada: no se envía ninguna conversación. El motor responde por reglas, sin usar IA durante la ejecución y sin backend propio. La conversación permanece en la memoria de esta pestaña; el código no la transmite ni la guarda de forma persistente. El alojamiento puede mantener sus propios registros de acceso. Cambiar `rules.js` adapta la base de esta demostración; el uso operativo requiere validar las respuestas, configurar el canal y la atención humana y probar el flujo según las condiciones del cliente.
