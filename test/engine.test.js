"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const E = require("../chat-engine.js");
const RULES = require("../rules.js");

const pt = RULES.pt;
const es = RULES.es;

test("as duas bases de exemplo passam na validação", () => {
  assert.deepEqual(E.validateRules(pt), []);
  assert.deepEqual(E.validateRules(es), []);
});

test("todo botão e todo atalho do menu aponta para uma regra que existe", () => {
  for (const cfg of [pt, es]) {
    const ids = new Set(cfg.rules.map((r) => r.id));
    for (const id of cfg.menu) assert.ok(ids.has(id), `${cfg.lang}: menu ${id}`);
    for (const id of cfg.fallback.buttons) assert.ok(ids.has(id), `${cfg.lang}: fallback ${id}`);
    for (const r of cfg.rules) for (const b of r.buttons || []) assert.ok(ids.has(b), `${cfg.lang}: ${r.id} -> ${b}`);
  }
});

test("normaliza acentos, maiúsculas e pontuação", () => {
  assert.equal(E.normalize("  Qual o HORÁRIO?!  "), "qual o horario");
  assert.equal(E.normalize("¿Dónde está mi pedido?"), "donde esta mi pedido");
  assert.equal(E.normalize(null), "");
});

test("responde com e sem acento", () => {
  assert.equal(E.reply(pt, "Qual o horário?").ruleId, "horario");
  assert.equal(E.reply(pt, "qual o horario").ruleId, "horario");
  assert.equal(E.reply(es, "¿Cuál es el horario?").ruleId, "horario");
});

test("aceita uma letra errada só em palavras de 5 letras ou mais", () => {
  assert.equal(E.reply(pt, "voces fazem entrga?").ruleId, "entrega"); // falta 1 letra
  assert.equal(E.reply(pt, "aceita cartao de credto").ruleId, "pagamento");
  assert.equal(E.withinOneEdit("pix", "pax"), true); // a função aceita...
  assert.equal(E.reply(pt, "aceita pax").type, "handoff"); // ...mas palavra curta não usa tolerância
  assert.equal(E.reply(pt, "horrrario").type, "handoff"); // 2 letras a mais: não combina
});

test("sem correspondência, oferece uma pessoa (não inventa resposta)", () => {
  const r = E.reply(pt, "vocês vendem passagens de avião?");
  assert.equal(r.type, "handoff");
  assert.equal(r.answer, pt.fallback.answer);
  assert.deepEqual(r.buttons, ["atendente"]);
});

test("saudação só vale sozinha; com pergunta junto, responde a pergunta", () => {
  assert.equal(E.reply(pt, "oi").ruleId, "saudacao");
  assert.equal(E.reply(pt, "oi, qual o horário?").ruleId, "horario");
  assert.equal(E.reply(es, "hola, ¿aceptan tarjeta?").ruleId, "pago");
});

test("empate entre assuntos pede esclarecimento com opções", () => {
  const r = E.reply(pt, "troca e garantia");
  assert.equal(r.type, "clarify");
  assert.deepEqual(r.options.map((o) => o.id).sort(), ["garantia", "troca"]);
});

test("expressão vale mais que palavra solta", () => {
  // "meu pedido" (expressão do rastreio, 2 pontos) vence "entrega" (1 ponto)
  assert.equal(E.reply(pt, "a entrega do meu pedido").ruleId, "rastreio");
});

test("pedido de pessoa e consulta de pedido viram encaminhamento", () => {
  assert.equal(E.reply(pt, "quero falar com uma pessoa").type, "handoff");
  assert.equal(E.reply(pt, "onde está meu pedido?").type, "handoff");
  assert.equal(E.reply(es, "quiero hablar con un asesor").type, "handoff");
});

test("mensagem vazia não quebra", () => {
  assert.equal(E.reply(pt, "   ").type, "empty");
  assert.equal(E.reply(pt, "?!").type, "empty");
});

test("mensagem enorme é cortada e não trava", () => {
  const long = "horario ".repeat(10000);
  const t0 = Date.now();
  const r = E.reply(pt, long);
  assert.ok(Date.now() - t0 < 200);
  assert.equal(r.ruleId, "horario");
  assert.ok(E.normalize(long).length <= E.MAX_INPUT);
});

test("HTML na mensagem vira texto comum", () => {
  assert.equal(E.normalize("<script>alert(1)</script> horario"), "script alert 1 script horario");
});

test("atalho por id devolve a resposta aprovada; id desconhecido vai para uma pessoa", () => {
  assert.equal(E.answerById(pt, "pagamento").answer, pt.rules.find((r) => r.id === "pagamento").answer);
  assert.equal(E.answerById(pt, "nao-existe").type, "handoff");
});

test("validação aponta o motivo de cada problema", () => {
  const bad = {
    fallback: {},
    rules: [
      { id: "a", answer: "x", keywords: ["ok"] },
      { id: "a", answer: "", keywords: [] },
      { answer: "y", keywords: ["duas palavras"] }
    ]
  };
  const p = E.validateRules(bad);
  assert.ok(p.some((m) => m.includes("fallback")));
  assert.ok(p.some((m) => m.includes("curta demais")));
  assert.ok(p.some((m) => m.includes("id repetido")));
  assert.ok(p.some((m) => m.includes("falta answer")));
  assert.ok(p.some((m) => m.includes("keywords ou phrases")));
  assert.ok(p.some((m) => m.includes("falta id")));
  assert.ok(p.some((m) => m.includes("tem espaço")));
  assert.deepEqual(E.validateRules(null), ["config.rules precisa ser uma lista"]);
});

test("a mesma palavra não soma várias vezes na mesma regra", () => {
  // "troca" combina com "troca" e, com uma letra de diferença, com "trocar": vale 1 ponto só
  const r = E.reply(pt, "troca e garantia");
  assert.equal(r.type, "clarify");
});

test("pergunta sobre o custo do frete vai para entrega, não para preços", () => {
  assert.equal(E.reply(pt, "quanto custa o frete?").ruleId, "entrega");
  assert.equal(E.reply(es, "¿cuánto cuesta el envío?").ruleId, "entrega");
  assert.equal(E.reply(pt, "quanto custa a camiseta?").ruleId, "preco");
});
