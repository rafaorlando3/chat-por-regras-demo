/*
 * Base de regras de exemplo. Negócio fictício: "Loja Exemplo" / "Tienda Ejemplo".
 * Todos os horários, prazos e condições são de exemplo.
 * Alterar este arquivo adapta a base de perguntas desta demonstração. Para uso operacional,
 * também é preciso validar respostas, definir o canal e a passagem para atendimento humano,
 * revisar requisitos de privacidade e testar o fluxo nas condições do cliente.
 * Cada regra tem id, label (texto do botão), keywords (palavras soltas), phrases (expressões),
 * answer (resposta aprovada), buttons (atalhos), priority, onlyAlone e
 * handoff (true = sinaliza que o assunto exige atendimento humano; nesta demo não transmite a conversa).
 * "human" define o pedido explícito de pessoa, que tem precedência sobre as palavras do assunto.
 */
(function (root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory();
  } else {
    root.CHAT_RULES = factory();
  }
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  var pt = {
    lang: "pt",
    business: "Loja Exemplo (fictícia)",
    greeting: "Olá! Sou o atendimento automático da Loja Exemplo. Escreva sua dúvida ou escolha um atalho.",
    menu: ["horario", "entrega", "pagamento", "troca", "atendente"],
    emptyAnswer: "Escreva sua pergunta, por favor.",
    clarifyAnswer: "Encontrei mais de um assunto. Você quis dizer:",
    handoffNote: "Encaminhamento simulado. Um projeto real precisa de um canal autorizado e de um fluxo de atendimento configurado.",
    fallback: {
      answer: "Não encontrei uma resposta na base. Em um atendimento real, esta pergunta precisaria de uma pessoa. Aqui o encaminhamento é apenas demonstrado; nenhuma mensagem foi enviada.",
      buttons: ["atendente"]
    },
    rules: [
      {
        id: "saudacao", label: "Saudação", onlyAlone: true,
        keywords: ["ola", "opa"], phrases: ["oi", "bom dia", "boa tarde", "boa noite", "tudo bem"],
        answer: "Olá! Em que posso ajudar? Pergunte sobre horário, entrega, pagamento ou trocas.",
        buttons: ["horario", "entrega", "pagamento", "troca"]
      },
      {
        id: "horario", label: "Horário de atendimento",
        keywords: ["horario", "horarios", "abre", "abrem", "fecha", "fecham", "funcionamento", "aberto", "aberta"],
        phrases: ["que horas", "hora de abrir"],
        answer: "Atendemos de segunda a sexta, das 8h às 18h, e aos sábados, das 8h às 12h."
      },
      {
        id: "entrega", label: "Entrega e frete", priority: 1,
        keywords: ["entrega", "entregam", "entregar", "frete", "envio", "enviam", "delivery"],
        phrases: ["quanto tempo demora", "chega quando", "custa o frete", "valor do frete"],
        answer: "Entregamos na cidade em até 2 dias úteis. O frete aparece no carrinho antes de pagar.",
        buttons: ["rastreio"]
      },
      {
        id: "pagamento", label: "Formas de pagamento",
        keywords: ["pagamento", "pagar", "pix", "cartao", "credito", "debito", "boleto", "parcelar", "parcela", "parcelas"],
        phrases: ["formas de pagamento", "como pago"],
        answer: "Aceitamos Pix, cartão de débito e crédito (até 3 vezes sem juros) e boleto."
      },
      {
        id: "troca", label: "Trocas e devoluções",
        keywords: ["troca", "trocar", "devolucao", "devolver", "reembolso", "defeito", "estorno"],
        answer: "Você pode trocar ou devolver em até 7 dias após o recebimento. Com defeito, a troca é por nossa conta."
      },
      {
        id: "garantia", label: "Garantia",
        keywords: ["garantia"],
        answer: "Todos os produtos têm a garantia do fabricante, informada na página de cada item."
      },
      {
        id: "endereco", label: "Endereço",
        keywords: ["endereco", "localizacao", "fisica"],
        phrases: ["onde fica", "onde ficam", "onde voces ficam", "loja fisica"],
        answer: "A Loja Exemplo é só online nesta demonstração, sem loja física."
      },
      {
        id: "preco", label: "Preços e orçamento",
        keywords: ["preco", "precos", "valor", "valores", "orcamento", "custa"],
        phrases: ["quanto custa", "quanto sai"],
        answer: "Os preços estão na página de cada produto. Orçamento de quantidade precisaria de uma pessoa da equipe; nesta demonstração isso é simulado.",
        buttons: ["atendente"]
      },
      {
        id: "rastreio", label: "Onde está meu pedido", handoff: true,
        keywords: ["rastreio", "rastrear", "rastreamento", "codigo"],
        phrases: ["onde esta meu pedido", "status do pedido", "meu pedido"],
        answer: "Um pedido específico precisa ser conferido por uma pessoa. Esta demonstração não consulta pedidos e não envia mensagens para uma equipe."
      },
      {
        id: "atendente", label: "Falar com uma pessoa", handoff: true, priority: 1,
        keywords: ["atendente", "humano", "pessoa", "alguem"],
        phrases: ["falar com uma pessoa", "falar com atendente", "falar com alguem"],
        answer: "Você pediu para falar com uma pessoa. Esta demonstração mostra esse ponto do atendimento, mas não está conectada a uma equipe e não envia a conversa."
      }
    ],
    human: {
      ruleId: "atendente",
      words: ["atendente", "humano"],
      phrases: ["falar com uma pessoa", "falar com atendente", "falar com alguem", "falar com um humano", "quero uma pessoa"],
      negations: ["nao", "nem", "sem", "nunca", "jamais"]
    }
  };

  var es = {
    lang: "es",
    business: "Tienda Ejemplo (ficticia)",
    greeting: "¡Hola! Soy la atención automática de Tienda Ejemplo. Escriba su consulta o elija un atajo.",
    menu: ["horario", "entrega", "pago", "cambio", "persona"],
    emptyAnswer: "Escriba su pregunta, por favor.",
    clarifyAnswer: "Encontré más de un tema. ¿Quiso decir:",
    handoffNote: "Derivación simulada. Un proyecto real necesita un canal autorizado y un flujo de atención configurado.",
    fallback: {
      answer: "No encontré una respuesta en la base. En una atención real, esta consulta necesitaría una persona. Aquí la derivación solo se demuestra; no se ha enviado ningún mensaje.",
      buttons: ["persona"]
    },
    rules: [
      {
        id: "saludo", label: "Saludo", onlyAlone: true,
        keywords: ["hola", "buenas"], phrases: ["buen dia", "buenos dias", "buenas tardes", "buenas noches"],
        answer: "¡Hola! ¿En qué puedo ayudar? Pregunte por horario, entregas, pagos o cambios.",
        buttons: ["horario", "entrega", "pago", "cambio"]
      },
      {
        id: "horario", label: "Horario de atención",
        keywords: ["horario", "horarios", "abren", "cierran", "abierto", "abierta", "atienden"],
        phrases: ["a que hora", "que hora"],
        answer: "Atendemos de lunes a viernes, de 8 a 18 h, y los sábados, de 8 a 12 h."
      },
      {
        id: "entrega", label: "Entregas y envío", priority: 1,
        keywords: ["entrega", "entregas", "envio", "envios", "envian", "delivery", "despacho"],
        phrases: ["cuanto tarda", "cuando llega", "cuesta el envio", "costo del envio"],
        answer: "Entregamos en la ciudad en hasta 2 días hábiles. El costo de envío aparece en el carrito antes de pagar.",
        buttons: ["pedido"]
      },
      {
        id: "pago", label: "Formas de pago",
        keywords: ["pago", "pagos", "pagar", "tarjeta", "transferencia", "efectivo", "cuotas", "credito", "debito"],
        phrases: ["formas de pago", "como pago"],
        answer: "Aceptamos transferencia, tarjeta de débito y crédito (hasta 3 cuotas sin interés) y efectivo en la entrega."
      },
      {
        id: "cambio", label: "Cambios y devoluciones",
        keywords: ["cambio", "cambiar", "devolucion", "devolver", "reembolso", "defecto", "falla"],
        answer: "Puede cambiar o devolver en hasta 7 días desde que lo recibe. Si tiene defecto, el cambio corre por nuestra cuenta."
      },
      {
        id: "garantia", label: "Garantía",
        keywords: ["garantia"],
        answer: "Todos los productos tienen la garantía del fabricante, indicada en la página de cada artículo."
      },
      {
        id: "direccion", label: "Dirección",
        keywords: ["direccion", "ubicacion", "local"],
        phrases: ["donde estan", "donde queda", "tienda fisica"],
        answer: "Tienda Ejemplo es solo en línea en esta demostración, sin local físico."
      },
      {
        id: "precio", label: "Precios y cotización",
        keywords: ["precio", "precios", "valor", "costo", "cuesta", "cotizacion", "presupuesto"],
        phrases: ["cuanto cuesta", "cuanto sale"],
        answer: "Los precios están en la página de cada producto. Cotizar por cantidad necesitaría una persona del equipo; en esta demostración es simulado.",
        buttons: ["persona"]
      },
      {
        id: "pedido", label: "Dónde está mi pedido", handoff: true,
        keywords: ["seguimiento", "rastreo", "rastrear", "codigo"],
        phrases: ["donde esta mi pedido", "estado del pedido", "mi pedido"],
        answer: "Un pedido específico necesita revisión de una persona. Esta demostración no consulta pedidos ni envía mensajes a un equipo."
      },
      {
        id: "persona", label: "Hablar con una persona", handoff: true, priority: 1,
        keywords: ["persona", "humano", "asesor", "agente", "alguien"],
        phrases: ["hablar con una persona", "hablar con alguien", "hablar con un asesor"],
        answer: "Usted pidió hablar con una persona. Esta demostración muestra ese punto de la atención, pero no está conectada a un equipo ni envía la conversación."
      }
    ],
    human: {
      ruleId: "persona",
      words: ["humano", "asesor", "agente"],
      phrases: ["hablar con una persona", "hablar con alguien", "hablar con un asesor", "hablar con un humano", "quiero una persona"],
      negations: ["no", "ni", "sin", "nunca", "jamas"]
    }
  };

  return { pt: pt, es: es };
});
