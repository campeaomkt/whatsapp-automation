const express = require("express");
const router = express.Router();

const ofertas = require("../config/ofertas");
const prompts = require("../config/prompts");

const { sendText, sendDocument } = require("../../services/metaWhatsAppService");

const sessoes = {};
const mensagensProcessadas = new Set();
const lembretes = {};
const timers = {};
const executando = {}; // 🔒 LOCK POR USUÁRIO

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ========================================
// 🔐 VALIDAÇÃO DO WEBHOOK
// ========================================
router.get("/", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === process.env.META_VERIFY_TOKEN) {
    console.log("Webhook verificado com sucesso.");
    return res.status(200).send(challenge);
  }

  return res.sendStatus(403);
});

// ========================================
// 📩 RECEBIMENTO DE MENSAGENS
// ========================================
router.post("/", async (req, res) => {
  try {

     console.log("🔥 EVENTO RECEBIDO 🔥");
    console.log(JSON.stringify(req.body, null, 2));


    const body = req.body;

    if (body.object !== "whatsapp_business_account") {
      return res.sendStatus(404);
    }

    const entry = body.entry?.[0];
    const changes = entry?.changes?.[0];
    const value = changes?.value;
    const message = value?.messages?.[0];

    if (!message) return res.sendStatus(200);

    const messageId = message.id;

    // 🔒 Evita duplicação do webhook
    if (mensagensProcessadas.has(messageId)) {
      return res.sendStatus(200);
    }
    mensagensProcessadas.add(messageId);

    const from = message.from;
    const phoneNumberId = value?.metadata?.phone_number_id;

    const ofertaKey = ofertas[phoneNumberId];
    if (!ofertaKey || ofertaKey !== "dicionario_acordes") {
      return res.sendStatus(200);
    }

    if (!sessoes[from]) {
      sessoes[from] = { etapa: 1 };
    }

    const dados = prompts.dicionario_acordes;

    // 🔥 Cancela timer anterior (debounce real)
    if (timers[from]) {
      clearTimeout(timers[from]);
    }

    timers[from] = setTimeout(async () => {

      if (executando[from]) return;
      executando[from] = true;

      try {

        const etapa = sessoes[from].etapa;

        // ================================
        // ETAPA 1 — APRESENTAÇÃO
        // ================================
        if (etapa === 1) {

          sessoes[from].etapa = 2;

          await sendText(phoneNumberId, from,
`👋 Que alegria ter você aqui!

Eu sou Eliab, tecladista há mais de 15 anos, e preparei algo que vai transformar sua forma de estudar e tocar: o Dicionário Completo de Acordes para Teclado (PDF).

🎹 O que você vai encontrar:

✅ 312 Diagramas Detalhados — 26 variações em todos os 12 tons  
✅ Visualização de Alta Performance — teclados ampliados mostrando exatamente onde posicionar os dedos  
✅ Do Básico ao Jazz — tríades, tétrades, 9ª, 11ª, 13ª e acordes alterados  
✅ Formato Inteligente A4 — ideal para imprimir ou usar no tablet

📂 O envio é imediato e funciona assim:

Você recebe o material primeiro.
Depois, realiza sua contribuição.

🚀 Pare de "caçar" notas e comece a tocar com confiança.

Posso enviar o arquivo para você?`
          );

          return;
        }

        // ================================
        // ETAPA 2 — ENVIO DO MATERIAL + PIX
        // ================================
        if (etapa === 2) {

          sessoes[from].etapa = 3;

          await sendText(phoneNumberId, from, "Perfeito! Estou te enviando agora seu material... 🎹📂");

          await delay(2000);

          for (const material of dados.materiais) {
            await sendDocument(phoneNumberId, from, material.link, material.nome);
            await delay(2000);
          }

          await sendText(phoneNumberId, from,
`Agora você tem em mãos o material de referência mais completo de 2026. 🚀

Se esse guia vai acelerar sua evolução no teclado, considere apoiar esse trabalho.

Valor sugerido:
R$15, R$20 ou R$25

📲 Chave Pix - CPF (Nubank):
04143449285

Nome: Eliab Campos dos Santos

Sua contribuição me ajuda a continuar produzindo materiais de alto nível para músicos que querem tocar com autoridade. 🎹🔥`
          );

          // ⏰ LEMBRETE 10 MIN
          lembretes[from] = setTimeout(async () => {
            if (sessoes[from]?.etapa === 3) {
              await sendText(phoneNumberId, from,
`Passando para lembrar 🙌

Se o Dicionário já estiver te ajudando, considere contribuir e fortalecer esse projeto para que mais tecladistas evoluam com um material realmente completo. 🎹🔥`
              );
            }
          }, 600000);

          return;
        }

        // ================================
        // ETAPA 3 — AGRADECIMENTO + POSSÍVEL BÔNUS FUTURO
        // ================================
        if (etapa === 3) {

          sessoes[from].etapa = 4;

          if (lembretes[from]) {
            clearTimeout(lembretes[from]);
            delete lembretes[from];
          }

          await sendText(phoneNumberId, from,
`Muito obrigado! 🙏🔥

Sua decisão fortalece esse projeto e me motiva a continuar criando materiais cada vez mais completos para tecladistas.

Qualquer dúvida sobre acordes, aplicação ou campo harmônico, pode me chamar aqui. Vamos evoluir sua harmonia para outro nível. 🎹🚀`
          );

          return;
        }

      } finally {
        executando[from] = false;
      }

    }, 5000);

    return res.sendStatus(200);

  } catch (error) {
    console.error("Erro no webhook:", error);
    return res.sendStatus(500);
  }
});

module.exports = router;