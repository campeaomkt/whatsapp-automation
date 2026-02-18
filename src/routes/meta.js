const express = require("express");
const router = express.Router();

const { gerarResposta } = require("../../services/aiService");
const { sendWhatsAppMessage } = require("../../services/metaWhatsAppService");


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
    const body = req.body;

    if (body.object !== "whatsapp_business_account") {
      return res.sendStatus(404);
    }

    const entry = body.entry?.[0];
    const changes = entry?.changes?.[0];
    const value = changes?.value;
    const message = value?.messages?.[0];

    if (!message) {
      return res.sendStatus(200);
    }

    const from = message.from; // número do usuário
    const text = message.text?.body;

    if (!text) {
      return res.sendStatus(200);
    }

    console.log(`📩 Mensagem recebida de ${from}: ${text}`);

    // Detecta idioma simples (pt/es)
    const idioma = detectarIdioma(text);

    // Gera resposta com histórico simples (sem memória persistente ainda)
    const resposta = await gerarResposta(
      [{ role: "user", content: text }],
      idioma
    );

    await sendWhatsAppMessage(from, resposta);

    return res.sendStatus(200);

  } catch (error) {
    console.error("Erro no webhook da Meta:", error);
    return res.sendStatus(500);
  }
});


// ========================================
// 🌎 DETECÇÃO SIMPLES DE IDIOMA
// ========================================
function detectarIdioma(texto) {
  const palavrasEspanhol = [
    "hola", "precio", "dólar", "dolares", "comprar",
    "quiero", "funciona", "cómo", "interesado",
    "enlace", "garantía"
  ];

  const textoLower = texto.toLowerCase();
  const encontrou = palavrasEspanhol.some(p => textoLower.includes(p));

  return encontrou ? "es" : "pt";
}

module.exports = router;
