# T8 v1.1.1: correção focal da base inválida por idioma

30/09/2026, rodada do Claude das 05h51 (America/Asuncion). Responde X-0210 item 2 e o pacote renda/revisao-demo-chat-v11-codex-2026-09-30-0544. Base: renda/demo-chat-regras-v11-claude-2026-09-30-0455 (preservada, sem alteração).

## Reprodução do achado do Codex
Rodei o cenário novo contra a v1.1 sem correção, no Chromium da nuvem do Claude: com `CHAT_RULES.pt = null` ou sem `pt`, a página lança `Cannot read properties of null (reading 'business')`, não mostra diagnóstico, deixa campo e botão habilitados e, ao voltar de ES para PT, também não bloqueia. Achado estático do Codex confirmado. Saída em `evidencia/reproducao-v11.json`.

## Correção (só index.html, 3 pontos; motor e regras sem mudança)
1. `rulesFor(code)` lê o idioma sem supor que `CHAT_RULES` carregou; não cria objeto vazio: null ou ausente segue para `validateRules`, que já devolve "config.rules precisa ser uma lista".
2. Em `start()`, `validateRules(cfg)` roda antes de qualquer leitura de `cfg`; o título do chat usa `cfg.business` só com base válida e, com base inválida, o título neutro "Chat pausado" / "Chat en pausa".
3. A troca de idioma usa `rulesFor(lang)`. Os botões de idioma continuam ativos para recuperação.
package.json: versão 1.1.1. Diff completo contra a v1.1 em `DIFF-v111.patch`.

## Evidência na nuvem do Claude (não é execução no Mac)
- `node --test`: 28/28 (testes existentes sem alteração de expectativa).
- `evidencia/browser_check.py`: cenários 1 a 9 da v1.1 sem mudança, mais o cenário 10 (PT nulo e PT ausente). Em ambos: diagnóstico visível, título neutro, aviso de pausa, campo e botão desabilitados, sem atalhos, botões de idioma ativos; ES válido recupera e responde; voltar ao PT bloqueia de novo. Erros de console: zero no cenário e zero no total.
- Nenhum valor falso no JSON. Capturas refeitas; nova `capturas/t8-pt-nulo.png`.

## Limites
Sem backend, conta, rede ou canal novo. Nada publicado. Nome e destino (proposta do Codex: rafaorlando3/chat-por-regras-demo e GitHub Pages) seguem para o Rafael depois das 07h e da conferência do Codex.

## Nota de transferência
Na cópia para o Mac, as 6 PNG ganharam um bloco de metadados de procedência (chunk C2PA `caBX`) inserido pela ferramenta de transferência. Sem esse bloco, os bytes são idênticos aos gerados na nuvem (SHA256 conferido um a um). O SHA256SUMS abaixo foi recalculado no Mac sobre os arquivos como estão na pasta.
