const express = require("express");
const router = express.Router();

const { sendText } = require("../../services/metaWhatsAppService");

router.post("/", async (req, res) => {

    console.log("📩 Webhook Hotmart recebido:");

    const data = req.body;

    console.log(data);

    const phoneNumberId = process.env.META_PHONE_NUMBER_ID;

    // =============================
    // CARRINHO ABANDONADO HOTMART
    // =============================

    if (data.event === "ABANDONED_CART") {

        let telefone = data.data.buyer.phone.replace(/\D/g, "");

        console.log("Carrinho abandonado Hotmart:", telefone);

        setTimeout(async () => {

            try {

                await sendText(
                    phoneNumberId,
                    telefone,
`Hola! Vi que comenzaste tu inscripción en Aevo Pro pero no finalizaste el pago.

Si tienes alguna duda puedo ayudarte aquí 🙂`
                );

                console.log("Mensaje de recuperación enviado.");

            } catch (error) {

                console.log("Erro Hotmart:", error);

            }

        }, 300000);

    }

    res.status(200).send("OK");

});

module.exports = router;