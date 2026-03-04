const express = require("express");
const router = express.Router();

const { sendText } = require("../../services/metaWhatsAppService");

router.post("/", async (req, res) => {

    console.log("📩 Webhook Kiwify recebido:");

    const data = req.body;

    console.log(data);

    // verifica se é carrinho abandonado
    if (data.status !== "abandoned") {
        return res.status(200).send("Evento ignorado");
    }

    // limpa telefone
    let telefone = data.phone.replace(/\D/g, "");

    // adiciona DDI Brasil se necessário
    if (!telefone.startsWith("55")) {
        telefone = "55" + telefone;
    }

    const phoneNumberId = process.env.META_PHONE_NUMBER_ID;

    console.log("Carrinho abandonado detectado:", telefone);

    // espera 5 minutos
    setTimeout(async () => {

        try {

            await sendText(
                phoneNumberId,
                telefone,
`Oi ${data.name}! Vi que você iniciou sua inscrição no Aevo Pro mas não finalizou.

Se ficou alguma dúvida posso te ajudar por aqui 🙂`
            );

            console.log("Mensagem de recuperação enviada.");

        } catch (error) {

            console.log("Erro ao enviar mensagem:", error);

        }

    }, 300000);

    res.status(200).send("OK");

});

module.exports = router;