const express = require("express");
const router = express.Router();

const { sendText } = require("../../services/metaWhatsAppService");
const db = require("../database/db");

router.post("/", async (req, res) => {

    console.log("📩 Webhook Hotmart recebido:");

    const data = req.body;

    console.log(data);

    const phoneNumberId = process.env.META_PHONE_NUMBER_ID;

    // =============================
    // COMPRA APROVADA HOTMART
    // =============================

    if (data.event === "PURCHASE_APPROVED") {

        const email = data.data?.buyer?.email;

        if (email) {

            console.log("Compra aprovada para:", email);

            db.prepare(`
            UPDATE leads
            SET comprou = 1
            WHERE email = ?
            `).run(email);

        }

    }

    // =============================
    // CARRINHO ABANDONADO HOTMART
    // (caso você ainda queira usar)
    // =============================

    if (data.event === "ABANDONED_CART") {

        let telefone = data.data?.buyer?.phone?.replace(/\D/g, "");

        if (!telefone) {
            return res.status(200).send("Sem telefone");
        }

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