const express = require("express");
const router = express.Router();

const ofertas = require("../config/ofertas");
const prompts = require("../config/prompts");

const { sendText, sendDocument } = require("../../services/metaWhatsAppService");

const sessoes = {};
const mensagensProcessadas = new Set();
const lembretes = {};
const timers = {};

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

    // 🔒 Evita duplicação
    if (mensagensProcessadas.has(messageId)) {
      return res.sendStatus(200);
    }
    mensagensProcessadas.add(messageId);

    const from = message.from;
    const phoneNumberId = value?.metadata?.phone_number_id;

    const ofertaKey = ofertas[phoneNumberId];
    if (!ofertaKey) return res.sendStatus(200);

    if (ofertaKey !== "paulo") return res.sendStatus(200);

    if (!sessoes[from]) {
      sessoes[from] = { etapa: 1 };
    }

    const dados = prompts.paulo;

    // 🔥 Se já existe timer, cancela (reinicia contagem)
    if (timers[from]) {
      clearTimeout(timers[from]);
    }

    // ⏳ Espera 5 segundos após última mensagem
    timers[from] = setTimeout(async () => {

      const etapa = sessoes[from].etapa;

      // ================================
      // ETAPA 1 — APRESENTAÇÃO
      // ================================
      if (etapa === 1) {

        await sendText(phoneNumberId, from,
`👋 Que alegria ter você aqui!

Me chamo Eliab, servo de Deus, e preparei um material especial: o Estudo das Cartas de Paulo (PDF). Um conteúdo simples, prático e muito edificante.

📖 O envio é imediato e funciona assim:

✅ Você recebe o material primeiro.
❤️ Depois, faça sua contribuição simbólica.

As famílias costumam apoiar com R$15, R$20 ou R$25.

🎁 Bônus Inclusos:
1️⃣ Devocional 365 Dias
2️⃣ Estudo Especial do Apocalipse

Posso enviar o arquivo para você?`
        );

        sessoes[from].etapa = 2;
        return;
      }

      // ================================
      // ETAPA 2 — ENVIO DOS PDFs + PIX
      // ================================
      if (etapa === 2) {

        await sendText(phoneNumberId, from, "Perfeito! Estou te enviando agora... 📂🤍");

        await delay(2000);

        for (const material of dados.materiais) {
          await sendDocument(phoneNumberId, from, material.link, material.nome);
          await delay(2000);
        }

        await sendText(phoneNumberId, from,
`Sua decisão de abençoar essa obra já é uma semente de fé. 🙏

Em relação ao valor, é feito pelo Pix e você escolhe o valor que achar justo — que seja de coração 🙌🤍

Valor sugerido:
R$15, R$20 ou R$25

📲 Chave Pix - CPF (Nubank):
04143449285

Nome: Eliab Campos dos Santos

Se esse trabalho tem tocado sua vida, considere contribuir para que essa obra alcance mais vidas.`
        );

        sessoes[from].etapa = 3;

        // ⏰ LEMBRETE 10 MIN
        lembretes[from] = setTimeout(async () => {
          if (sessoes[from]?.etapa === 3) {
            await sendText(phoneNumberId, from,
`Passando para lembrar com carinho 🙏

Se o material já estiver te abençoando, considere contribuir para que essa obra continue alcançando mais vidas 🤍`);
          }
        }, 600000);

        return;
      }

      // ================================
      // ETAPA 3 — ENVIO DOS BÔNUS
      // ================================
      if (etapa === 3) {

        // Cancela lembrete se existir
        if (lembretes[from]) {
          clearTimeout(lembretes[from]);
          delete lembretes[from];
        }

        await sendText(phoneNumberId, from,
`Muito obrigado 🤍

🕊 Que alegria! Estou enviando agora seus bônus 🙌`
        );

        await delay(2000);

        for (const bonus of dados.bonus) {
          await sendDocument(phoneNumberId, from, bonus.link, bonus.nome);
          await delay(2000);
        }

        sessoes[from].etapa = 4;
        return;
      }

    }, 5000);

    return res.sendStatus(200);

  } catch (error) {
    console.error("Erro no webhook:", error);
    return res.sendStatus(500);
  }
});

module.exports = router;
