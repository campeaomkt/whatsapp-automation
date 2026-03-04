const express = require("express");
const router = express.Router();

const { gerarResposta } = require("../../services/aiService");
const { sendText } = require("../../services/metaWhatsAppService");

const historicoUsuarios = {};
const timersUsuarios = {};
const etapaUsuarios = {};
const mensagensProcessadas = new Set();

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ========================================
// VALIDAÇÃO WEBHOOK
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
// RECEBER MENSAGENS
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

    const messageId = message?.id;

if (mensagensProcessadas.has(messageId)) {
  console.log("Mensagem duplicada ignorada:", messageId);
  return res.sendStatus(200);
}

mensagensProcessadas.add(messageId);

// limpa memória após 5 minutos
setTimeout(() => {
  mensagensProcessadas.delete(messageId);
}, 300000);

    if (!message) return res.sendStatus(200);

    const from = message.from;
    const text = message.text?.body;
    const phoneNumberId = value?.metadata?.phone_number_id;

    if (!text) return res.sendStatus(200);

    console.log("Mensagem recebida:", text);

    const textoLower = text.toLowerCase();

    // cria histórico se não existir
    if (!historicoUsuarios[from]) {
      historicoUsuarios[from] = [];
    }

    // cria etapa se não existir
    if (!etapaUsuarios[from]) {
      etapaUsuarios[from] = "inicio";
    }

    // DETECÇÃO DE ETAPA
    if (
      textoLower.includes("preço") ||
      textoLower.includes("precio") ||
      textoLower.includes("quanto custa") ||
      textoLower.includes("cuánto cuesta")
    ) {
      etapaUsuarios[from] = "preco_informado";
    }

    if (
      textoLower.includes("link") ||
      textoLower.includes("comprar") ||
      textoLower.includes("comprar ahora") ||
      textoLower.includes("quiero comprar")
    ) {
      etapaUsuarios[from] = "link_solicitado";
    }

    historicoUsuarios[from].push({
      role: "user",
      content: text
    });

    // limita histórico
    if (historicoUsuarios[from].length > 10) {
      historicoUsuarios[from].shift();
    }

    // limpa timer anterior
    if (timersUsuarios[from]) {
      clearTimeout(timersUsuarios[from]);
    }

    // cria novo timer (15 segundos)
    timersUsuarios[from] = setTimeout(async () => {

      try {

       const resposta = await gerarResposta(
  historicoUsuarios[from],
  null,
  etapaUsuarios[from]
);

        historicoUsuarios[from].push({
          role: "assistant",
          content: resposta
        });

        // tempo de digitação proporcional
        const tempoDigitando = Math.min(6000, resposta.length * 40);

        await delay(tempoDigitando);

        await sendText(phoneNumberId, from, resposta);

      } catch (err) {
        console.error("Erro ao responder:", err);
      }

    }, 15000);

    return res.sendStatus(200);

  } catch (error) {

    console.error("Erro webhook:", error);
    return res.sendStatus(500);

  }

});

module.exports = router;