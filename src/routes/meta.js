const express = require("express");
const router = express.Router();

const ofertas = require("../config/ofertas");
const prompts = require("../config/prompts");

const { sendText, sendDocument } = require("../../services/metaWhatsAppService");

const sessoes = {};

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

    const from = message.from;
    const text = message.text?.body?.toLowerCase() || "";
    const phoneNumberId = value?.metadata?.phone_number_id;

    const ofertaKey = ofertas[phoneNumberId];
    if (!ofertaKey) return res.sendStatus(200);

    if (ofertaKey === "paulo") {

      if (!sessoes[from]) {
        sessoes[from] = { etapa: "inicio" };
      }

      const etapa = sessoes[from].etapa;
      const dados = prompts.paulo;

      const palavrasPagamento = [
        "paguei", "enviei", "transferi",
        "pix feito", "já fiz", "comprovante"
      ];

      // ================================
      // ETAPA 1 — APRESENTAÇÃO
      // ================================
      if (etapa === "inicio") {

        await sendText(phoneNumberId, from,
`👋 Que alegria ter você aqui!

Me chamo Eliab, servo de Deus, e preparei um material especial: o Estudo das Cartas de Paulo (PDF). Um conteúdo simples, prático e muito edificante.

📖 O envio é imediato e funciona assim:

✅ Você recebe o material primeiro.
❤️ Depois, faça sua contribuição simbólica.

As famílias costumam apoiar com R$15, R$20 ou R$25, mas o valor quem decide é você, baseado na sua sinceridade e compromisso cristão.

🎁 Bônus Inclusos:
1️⃣ Devocional 365 Dias
2️⃣ Estudo Especial do Apocalipse

Este é um trabalho de fé. Só aceite se estiver disposto a contribuir com essa obra que abençoa tantos irmãos.

Posso enviar o arquivo para você?`
        );

        sessoes[from].etapa = "aguardando_envio";
        return res.sendStatus(200);
      }

      // ================================
      // ETAPA 2 — ENVIO DOS PDFs
      // ================================
      if (etapa === "aguardando_envio") {

        await delay(2000);

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

📲 Chave Pix (Nubank):
04143449285

Nome: Eliab Campos dos Santos

Se esse trabalho tem tocado sua vida ou se você acredita que mais pessoas precisam receber essa palavra, peço uma humilde contribuição.

Sinta-se à vontade para contribuir com o valor que o Espírito Santo colocar no seu coração.`);

        sessoes[from].etapa = "aguardando_bonus";

        // ⏰ LEMBRETE AUTOMÁTICO EM 10 MIN
        setTimeout(async () => {
          if (sessoes[from]?.etapa === "aguardando_bonus") {
            await sendText(phoneNumberId, from,
`Passando para lembrar com carinho 🙏

Se o material já estiver te abençoando, considere contribuir para que essa obra continue alcançando mais vidas 🤍`);
          }
        }, 600000);

        return res.sendStatus(200);
      }

      // ================================
      // ETAPA 3 — LIBERAÇÃO DOS BÔNUS
      // ================================
      if (
        etapa === "aguardando_bonus" &&
        palavrasPagamento.some(p => text.includes(p))
      ) {

        await delay(2000);

        await sendText(phoneNumberId, from,
`Muito obrigado 🤍

🕊 Que alegria! Sua decisão de abençoar essa obra já é uma semente de fé.

Estou enviando agora seus conteúdos e bônus 🙌`);

        await delay(2000);

        for (const bonus of dados.bonus) {
          await sendDocument(phoneNumberId, from, bonus.link, bonus.nome);
          await delay(2000);
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
