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
    const text = message.text?.body;

    if (!text) return res.sendStatus(200);

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
      const textoLower = text.toLowerCase();
      const dados = prompts.paulo;

      const palavrasPagamento = [
        "paguei", "enviei", "transferi",
        "pix feito", "já fiz", "comprovante"
      ];

      // ETAPA 1
      if (etapa === "inicio") {
        await sendText(
          phoneNumberId,
          from,
          "Que alegria ter você aqui 🙏\n\nPreparei um Estudo das Cartas de Paulo em PDF.\nPosso enviar agora para você?"
        );

        sessoes[from].etapa = "aguardando_confirmacao";
        return res.sendStatus(200);
      }

      // ETAPA 2 - CONFIRMAÇÃO
      if (
        etapa === "aguardando_confirmacao" &&
        (textoLower.includes("sim") || textoLower.includes("pode"))
      ) {

        await sendText(phoneNumberId, from, "Estou enviando agora 📖🙏");

        for (const material of dados.materiais) {
          await sendDocument(phoneNumberId, from, material.link, material.nome);
          await delay(400);
        }

        await sendText(
          phoneNumberId,
          from,
          `O envio é imediato 🙏\n\nVocê recebe o material primeiro.\nDepois, se desejar, pode contribuir.\n\nValor sugerido: R$ ${dados.valoresSugeridos.join(", R$ ")}.\n\nChave Pix (${dados.banco}):\n${dados.chavePix}\n\nNome: ${dados.nomeResponsavel}`
        );

        sessoes[from].etapa = "pix_enviado";
        return res.sendStatus(200);
      }

      // ETAPA 3 - PAGAMENTO
      if (
        etapa === "pix_enviado" &&
        palavrasPagamento.some(p => textoLower.includes(p))
      ) {

        await sendText(
          phoneNumberId,
          from,
          "Muito obrigado 🙏 Sua decisão é uma semente de fé.\nEstou enviando seus bônus agora."
        );

        for (const bonus of dados.bonus) {
          await sendDocument(phoneNumberId, from, bonus.link, bonus.nome);
          await delay(400);
        }

        sessoes[from].etapa = "bonus_enviado";
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
