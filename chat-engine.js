/*
 * Motor de respostas por regras (sem IA em execução, sem backend próprio).
 * Funciona no navegador (window.ChatEngine) e no Node (module.exports).
 * Licença MIT.
 */
(function (root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory();
  } else {
    root.ChatEngine = factory();
  }
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  var MAX_INPUT = 500; // caracteres considerados de cada mensagem
  var FUZZY_MIN_LEN = 5; // só palavras com 5 letras ou mais aceitam 1 letra trocada
  var NEGATION_WINDOW = 4; // palavras antes do pedido de pessoa em que uma negação o anula

  function normalize(text) {
    return String(text == null ? "" : text)
      .slice(0, MAX_INPUT)
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9ñ\s]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function tokens(text) {
    var n = normalize(text);
    return n ? n.split(" ") : [];
  }

  // Distância de edição limitada a 1 (troca, inclusão ou falta de uma letra).
  function withinOneEdit(a, b) {
    if (a === b) return true;
    var la = a.length, lb = b.length;
    if (Math.abs(la - lb) > 1) return false;
    var i = 0, j = 0, edits = 0;
    while (i < la && j < lb) {
      if (a[i] === b[j]) { i++; j++; continue; }
      if (++edits > 1) return false;
      if (la > lb) i++;
      else if (lb > la) j++;
      else { i++; j++; }
    }
    return edits + (la - i) + (lb - j) <= 1;
  }

  function wordMatches(word, keyword) {
    if (word === keyword) return true;
    if (keyword.length >= FUZZY_MIN_LEN && word.length >= FUZZY_MIN_LEN - 1) {
      return withinOneEdit(word, keyword);
    }
    return false;
  }

  function isObject(v) { return v !== null && typeof v === "object" && !Array.isArray(v); }
  function isText(v) { return typeof v === "string" && v.trim().length > 0; }

  // Lista opcional de textos: ausente vale como lista vazia; outro tipo é problema.
  function checkTextList(value, where, field, problems) {
    if (value === undefined) return [];
    if (!Array.isArray(value)) {
      problems.push(where + ": " + field + " precisa ser uma lista de textos");
      return [];
    }
    var ok = [];
    value.forEach(function (v, i) {
      if (!isText(v)) problems.push(where + ": " + field + "[" + i + "] precisa ser um texto não vazio");
      else ok.push(v);
    });
    return ok;
  }

  function checkRefs(list, where, field, ids, problems) {
    list.forEach(function (id) {
      if (!Object.prototype.hasOwnProperty.call(ids, id)) {
        problems.push(where + ": " + field + ' aponta para "' + id + '", que não existe');
      }
    });
  }

  /*
   * Confere a base de regras e devolve a lista de problemas, cada um com o motivo.
   * Nunca lança exceção por causa do conteúdo: tipos errados viram problemas na lista.
   * Erros de sintaxe no próprio arquivo JavaScript são outra classe e não chegam aqui.
   */
  function validateRules(config) {
    var problems = [];
    try {
      if (!isObject(config) || !Array.isArray(config.rules)) {
        return ["config.rules precisa ser uma lista"];
      }
      if (!isObject(config.fallback) || !isText(config.fallback.answer)) {
        problems.push("falta config.fallback.answer (resposta quando nada combina)");
      }
      var ids = {};
      var valid = [];
      config.rules.forEach(function (r, idx) {
        if (!isObject(r)) { problems.push("regra #" + idx + ": precisa ser um objeto"); return; }
        var where = "regra " + (isText(r.id) ? '"' + r.id + '"' : "#" + idx);
        if (!isText(r.id)) problems.push(where + ": falta id");
        else if (ids[r.id]) problems.push(where + ": id repetido");
        else ids[r.id] = true;
        if (!isText(r.answer)) problems.push(where + ": falta answer");
        if (r.label !== undefined && !isText(r.label)) problems.push(where + ": label precisa ser um texto não vazio");
        if (r.priority !== undefined && (typeof r.priority !== "number" || !isFinite(r.priority))) problems.push(where + ": priority precisa ser um número");
        ["handoff", "onlyAlone"].forEach(function (f) {
          if (r[f] !== undefined && typeof r[f] !== "boolean") problems.push(where + ": " + f + " precisa ser true ou false");
        });
        var kw = checkTextList(r.keywords, where, "keywords", problems);
        var ph = checkTextList(r.phrases, where, "phrases", problems);
        if (!kw.length && !ph.length) problems.push(where + ": precisa de keywords ou phrases");
        kw.forEach(function (k) {
          if (normalize(k).indexOf(" ") >= 0) problems.push(where + ': keyword "' + k + '" tem espaço; use phrases');
          if (normalize(k).length < 3) problems.push(where + ': keyword "' + k + '" curta demais (mínimo 3 letras)');
        });
        ph.forEach(function (p) {
          if (!normalize(p)) problems.push(where + ': phrase "' + p + '" fica vazia sem pontuação');
        });
        valid.push({ where: where, buttons: checkTextList(r.buttons, where, "buttons", problems) });
      });
      valid.forEach(function (v) { checkRefs(v.buttons, v.where, "buttons", ids, problems); });
      checkRefs(checkTextList(config.menu, "menu", "menu", problems), "menu", "atalho", ids, problems);
      if (isObject(config.fallback)) {
        checkRefs(checkTextList(config.fallback.buttons, "fallback", "buttons", problems), "fallback", "buttons", ids, problems);
      }
      if (config.human !== undefined) {
        if (!isObject(config.human)) problems.push("human precisa ser um objeto");
        else {
          if (!isText(config.human.ruleId) || !ids[config.human.ruleId]) problems.push("human.ruleId precisa apontar para uma regra existente");
          var hw = checkTextList(config.human.words, "human", "words", problems);
          var hp = checkTextList(config.human.phrases, "human", "phrases", problems);
          checkTextList(config.human.negations, "human", "negations", problems);
          if (!hw.length && !hp.length) problems.push("human precisa de words ou phrases");
        }
      }
    } catch (err) {
      problems.push("erro inesperado ao conferir a base: " + (err && err.message ? err.message : String(err)));
    }
    return problems;
  }

  function scoreRule(rule, words, normText) {
    var score = 0, hits = [];
    (rule.phrases || []).forEach(function (p) {
      var np = normalize(p);
      if (np && (" " + normText + " ").indexOf(" " + np + " ") >= 0) { score += 2; hits.push(np); }
    });
    // Cada palavra diferente da mensagem conta no máximo 1 ponto por regra,
    // mesmo que combine com várias palavras-chave (ex.: "troca" e "trocar").
    var kws = (rule.keywords || []).map(normalize);
    var seen = {};
    words.forEach(function (w) {
      if (seen[w]) return;
      seen[w] = true;
      for (var i = 0; i < kws.length; i++) {
        if (wordMatches(w, kws[i])) { score += 1; hits.push(w); break; }
      }
    });
    return { score: score, hits: hits };
  }

  function findRule(config, id) {
    for (var i = 0; i < config.rules.length; i++) if (config.rules[i].id === id) return config.rules[i];
    return null;
  }

  /*
   * Pedido explícito de pessoa (config.human): palavras fortes ("atendente", "humano")
   * ou expressões ("falar com uma pessoa"). Devolve:
   *   "request" se há pelo menos um sinal sem negação nas NEGATION_WINDOW palavras anteriores;
   *   "negated" se todos os sinais encontrados estão negados;
   *   "none" se não há sinal.
   * Não é compreensão geral de negação: só olha palavras como "não", "nem", "sem" logo antes.
   */
  function humanIntent(config, words) {
    var h = config.human;
    if (!h) return { state: "none", hits: [] };
    var neg = {};
    (h.negations || []).forEach(function (n) { neg[normalize(n)] = true; });
    function negatedAt(start) {
      for (var k = Math.max(0, start - NEGATION_WINDOW); k < start; k++) if (neg[words[k]]) return true;
      return false;
    }
    var found = 0, free = 0, hits = [];
    var strong = (h.words || []).map(normalize);
    words.forEach(function (w, i) {
      for (var s = 0; s < strong.length; s++) {
        if (wordMatches(w, strong[s])) { found++; hits.push(w); if (!negatedAt(i)) free++; break; }
      }
    });
    (h.phrases || []).forEach(function (p) {
      var pw = normalize(p).split(" ");
      for (var i = 0; i + pw.length <= words.length; i++) {
        var same = true;
        for (var j = 0; j < pw.length; j++) if (words[i + j] !== pw[j]) { same = false; break; }
        if (same) { found++; hits.push(pw.join(" ")); if (!negatedAt(i)) free++; }
      }
    });
    if (!found) return { state: "none", hits: [] };
    return { state: free ? "request" : "negated", hits: hits };
  }

  function fromRule(rule, hits) {
    return {
      type: rule.handoff ? "handoff" : "answer",
      ruleId: rule.id,
      answer: rule.answer,
      buttons: rule.buttons || [],
      hits: hits || []
    };
  }

  /*
   * Responde uma mensagem. Espera uma base que passou em validateRules.
   * Retorno: { type: "answer" | "clarify" | "handoff" | "empty", ruleId?, answer, buttons?, options?, hits?, human? }
   */
  function reply(config, text) {
    var normText = normalize(text);
    if (!normText) {
      return { type: "empty", answer: config.emptyAnswer || "Escreva sua pergunta, por favor." };
    }
    var words = normText.split(" ");

    // 1. Pedido explícito de pessoa tem precedência sobre as palavras do assunto.
    var intent = humanIntent(config, words);
    if (intent.state === "request") {
      var hr = findRule(config, config.human.ruleId);
      if (hr) { var out = fromRule(hr, intent.hits); out.human = true; return out; }
    }

    var minScore = config.minScore || 1;
    var scored = config.rules.map(function (r) {
      var s = scoreRule(r, words, normText);
      return { rule: r, score: s.score, hits: s.hits, priority: r.priority || 0 };
    }).filter(function (x) { return x.score >= minScore; });

    // 2. Pedido de pessoa negado ("não quero falar com atendente"): a regra de pessoa sai da disputa.
    if (intent.state === "negated") {
      scored = scored.filter(function (x) { return x.rule.id !== config.human.ruleId; });
    }

    // 3. Regras "onlyAlone" (ex.: saudação) só valem quando nenhuma outra combinou.
    var specific = scored.filter(function (x) { return !x.rule.onlyAlone; });
    if (specific.length) scored = specific;

    if (!scored.length) {
      return {
        type: "handoff",
        answer: config.fallback.answer,
        buttons: config.fallback.buttons || []
      };
    }
    scored.sort(function (a, b) {
      return b.score - a.score || b.priority - a.priority;
    });
    var top = scored[0];
    var tied = scored.filter(function (x) {
      return x.score === top.score && x.priority === top.priority;
    });
    if (tied.length > 1) {
      return {
        type: "clarify",
        answer: config.clarifyAnswer || "Você quis dizer:",
        options: tied.slice(0, 3).map(function (x) {
          return { id: x.rule.id, label: x.rule.label || x.rule.id };
        })
      };
    }
    return fromRule(top.rule, top.hits);
  }

  function answerById(config, id) {
    var r = findRule(config, id);
    if (r) return fromRule(r);
    return { type: "handoff", answer: config.fallback.answer, buttons: config.fallback.buttons || [] };
  }

  return {
    normalize: normalize,
    tokens: tokens,
    withinOneEdit: withinOneEdit,
    validateRules: validateRules,
    humanIntent: function (config, text) { return humanIntent(config, tokens(text)).state; },
    reply: reply,
    answerById: answerById,
    MAX_INPUT: MAX_INPUT,
    FUZZY_MIN_LEN: FUZZY_MIN_LEN,
    NEGATION_WINDOW: NEGATION_WINDOW
  };
});
