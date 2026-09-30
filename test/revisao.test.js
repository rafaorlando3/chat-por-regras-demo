"use strict";
// Casos da revisão do Codex (renda/revisao-demo-chat-codex-2026-09-30-0440, CRITERIOS-NUVEM.md).
const test = require("node:test");
const assert = require("node:assert/strict");
const E = require("../chat-engine.js");
const RULES = require("../rules.js");

const pt = RULES.pt;
const es = RULES.es;
const clone = (o) => JSON.parse(JSON.stringify(o));

function withRule(cfg, id, patch) {
  const c = clone(cfg);
  const r = c.rules.find((x) => x.id === id);
  Object.assign(r, patch);
  return c;
}

test("keywords como texto vira problema na lista, sem exceção", () => {
  const bad = withRule(pt, "entrega", { keywords: "frete" });
  let p;
  assert.doesNotThrow(() => { p = E.validateRules(bad); });
  assert.ok(p.some((m) => m.includes('"entrega"') && m.includes("keywords precisa ser uma lista")), p.join(" | "));
});

test("phrases como objeto é rejeitado antes de pontuar", () => {
  const bad = withRule(pt, "horario", { phrases: {} });
  const p = E.validateRules(bad);
  assert.ok(p.some((m) => m.includes('"horario"') && m.includes("phrases precisa ser uma lista")), p.join(" | "));
});

test("regra nula e itens de tipo errado dentro das listas", () => {
  const c = clone(pt);
  c.rules.push(null);
  c.rules[1].keywords = ["horario", 42, ""];
  const p = E.validateRules(c);
  assert.ok(p.some((m) => m.includes("precisa ser um objeto")));
  assert.ok(p.some((m) => m.includes("keywords[1]")));
  assert.ok(p.some((m) => m.includes("keywords[2]")));
});

test("valores vazios e id repetido têm diagnóstico específico", () => {
  const c = clone(pt);
  c.fallback.answer = "   ";
  c.rules[2].answer = "";
  c.rules[3].id = c.rules[4].id;
  const p = E.validateRules(c);
  assert.ok(p.some((m) => m.includes("fallback.answer")));
  assert.ok(p.some((m) => m.includes("falta answer")));
  assert.ok(p.some((m) => m.includes("id repetido")));
});

test("referências inválidas no menu, nos botões e no pedido de pessoa", () => {
  const c = clone(pt);
  c.menu.push("nao-existe");
  c.rules[0].buttons = ["horario", { id: "x" }];
  c.fallback.buttons = "atendente";
  c.human.ruleId = "fantasma";
  const p = E.validateRules(c);
  assert.ok(p.some((m) => m.includes('"nao-existe"') && m.includes("não existe")), p.join(" | "));
  assert.ok(p.some((m) => m.includes("buttons[1]")));
  assert.ok(p.some((m) => m.includes("fallback: buttons precisa ser uma lista")));
  assert.ok(p.some((m) => m.includes("human.ruleId")));
});

test("configuração que não é objeto não lança exceção", () => {
  for (const v of [undefined, 0, "x", [], { rules: "x" }, { rules: [null, 3, "a"] }]) {
    assert.doesNotThrow(() => E.validateRules(v));
    assert.ok(E.validateRules(v).length > 0);
  }
});

test("pedido explícito de pessoa vence as palavras do assunto (PT e ES)", () => {
  const a = E.reply(pt, "quero humano para pagamento cartao credito debito");
  assert.equal(a.ruleId, "atendente");
  assert.equal(a.type, "handoff");
  assert.equal(a.human, true);
  const b = E.reply(es, "quiero humano para pago tarjeta credito debito");
  assert.equal(b.ruleId, "persona");
  assert.equal(b.human, true);
  assert.equal(E.reply(pt, "Quero falar com uma pessoa sobre o frete e a entrega").ruleId, "atendente");
});

test("sem pedido de pessoa, a FAQ de pagamento continua", () => {
  assert.equal(E.reply(pt, "pagamento cartao credito debito").ruleId, "pagamento");
  assert.equal(E.reply(es, "pago tarjeta credito debito").ruleId, "pago");
});

test("negação logo antes desfaz o pedido de pessoa (limite documentado)", () => {
  assert.equal(E.reply(pt, "não quero falar com atendente, quero saber como pagar").ruleId, "pagamento");
  assert.equal(E.reply(es, "no quiero hablar con una persona, quiero saber cómo pago").ruleId, "pago");
  assert.equal(E.humanIntent(pt, "não quero falar com atendente"), "negated");
  // negação longe do pedido não conta
  assert.equal(E.humanIntent(pt, "não achei no site, quero falar com uma pessoa"), "request");
});

test("palavra fraca solta (\"pessoa\") não força atendimento", () => {
  const r = E.reply(pt, "a entrega é para outra pessoa");
  assert.notEqual(r.human, true);
  assert.equal(E.humanIntent(pt, "a entrega é para outra pessoa"), "none");
});

test("nenhuma resposta promete envio ou transferência que não acontece", () => {
  const promessa = /vou (passar|encaminhar|transferir)|voy a (pasar|derivar|transferir)|responde uma pessoa|responde una persona/i;
  for (const cfg of [pt, es]) {
    const textos = [cfg.fallback.answer, cfg.handoffNote, ...cfg.rules.map((r) => r.answer)];
    for (const t of textos) assert.ok(!promessa.test(t), `${cfg.lang}: ${t}`);
  }
  assert.match(pt.handoffNote, /simulado/i);
  assert.match(es.handoffNote, /simulada/i);
  assert.match(pt.fallback.answer, /nenhuma mensagem foi enviada/);
  assert.match(es.fallback.answer, /no se ha enviado ningún mensaje/);
});
