const express = require("express");
const router = express.Router();

const ofertas = require("../config/ofertas");
const prompts = require("../config/prompts");

const { sendText, sendDocument } = require("../../services/metaWhatsAppService");

// Controle simples de sessão em memória
const sessoes = {};

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ========================================
// 🔐 VALIDAÇÃO DO WEBHOOK (GET)
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
// 📩 RECEBIMENTO DE MENSAGENS (POST)
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

    const from = message.from;
    const phoneNumberId = value?.metadata?.phone_number_id;
    const ofertaKey = ofertas[phoneNumberId];

    if (!ofertaKey) {
      console.log("Número não mapeado.");
      return res.sendStatus(200);
    }

    if (ofertaKey === "paulo") {

      if (!sessoes[from]) {
        sessoes[from] = { etapa: "inicio" };
      }

      const etapa = sessoes[from].etapa;
      const dados = prompts.paulo;

      // ================================
      // ETAPA 1 - ABORDAGEM INICIAL
      // ================================
      if (etapa === "inicio") {

        await delay(2000);

        await sendText(
          phoneNumberId,
          from,
          "Que alegria ter você aqui 🙏\n\nPreparei um Estudo das Cartas de Paulo em PDF.\nPosso enviar agora para você?"
        );

        sessoes[from].etapa = "envio_material";
        return res.sendStatus(200);
      }

      // ================================
      // ETAPA 2 - ENVIO DOS PDFs
      // ================================
      if (etapa === "envio_material") {

        await delay(2000);

        await sendText(phoneNumberId, from, "Estou enviando agora 📖🙏");

        for (const material of dados.materiais) {
          await sendDocument(phoneNumberId, from, material.link, material.nome);
          await delay(1500);
        }

        await delay(2000);

        await sendText(
          phoneNumberId,
          from,
          `O envio é imediato 🙏

Você recebe o material primeiro.
Depois, se desejar, pode contribuir.

Valor sugerido: R$ ${dados.valoresSugeridos.join(", R$ ")}.

Chave Pix (${dados.banco}):
${dados.chavePix}

Nome: ${dados.nomeResponsavel}

Toda oferta é preciosa e ajuda essa obra a continuar 🙏`
        );

        sessoes[from].etapa = "aguardando_bonus";
        return res.sendStatus(200);
      }

      // ================================
      // ETAPA 3 - ENVIO DOS BÔNUS
      // ================================
      if (etapa === "aguardando_bonus") {

        await delay(2000);

        await sendText(
          phoneNumberId,
          from,
          "Muito obrigado 🙏 Sua decisão é uma semente de fé.\nEstou enviando seus bônus agora."
        );

        for (const bonus of dados.bonus) {
          await sendDocument(phoneNumberId, from, bonus.link, bonus.nome);
          await delay(1500);
        }

        sessoes[from].etapa = "finalizado";
        return res.sendStatus(200);
      }

      return res.sendStatus(200);
    }

    return res.sendStatus(200);

  } catch (error) {
    console.error("Erro no webhook:", error);
    return res.sendStatus(500);
  }
});

module.exports = router;
