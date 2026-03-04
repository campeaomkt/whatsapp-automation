const express = require("express");
const router = express.Router();

const { gerarResposta } = require("../../services/aiService");
const { sendText } = require("../../services/metaWhatsAppService");

// histórico simples por usuário
const historicoUsuarios = {};

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

    // cria histórico se não existir
    if (!historicoUsuarios[from]) {
      historicoUsuarios[from] = [];
    }

    // adiciona mensagem do usuário
    historicoUsuarios[from].push({
      role: "user",
      content: text
    });

    // limita histórico (evita gastar tokens)
    if (historicoUsuarios[from].length > 10) {
      historicoUsuarios[from].shift();
    }

    // gera resposta da IA
    const resposta = await gerarResposta(historicoUsuarios[from], "pt");

    // salva resposta no histórico
    historicoUsuarios[from].push({
      role: "assistant",
      content: resposta
    });

    // envia resposta
    await sendText(phoneNumberId, from, resposta);

    return res.sendStatus(200);

  } catch (error) {

    console.error("Erro no webhook:", error);
    return res.sendStatus(500);

  }

});

module.exports = router;