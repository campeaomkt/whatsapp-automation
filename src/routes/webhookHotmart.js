const express = require("express");
const router = express.Router();

const { sendText } = require("../../services/metaWhatsAppService");
const db = require("../database/db");
const { sendLeadEvent } = require("../../services/metaPixelService");
const crypto = require("crypto");

router.post("/", async (req, res) => {

    console.log("📩 Webhook Hotmart recebido:");

    const data = req.body;

    console.log(JSON.stringify(data, null, 2));

    const phoneNumberId = process.env.META_PHONE_NUMBER_ID;

   // =============================
// COMPRA APROVADA HOTMART
// =============================

if (data.event === "PURCHASE_APPROVED") {

    const email = data.data?.buyer?.email;
    const nome = data.data?.buyer?.name;
    const telefone = data.data?.buyer?.phone?.replace(/\D/g, "");

    // valor da venda (fallback)
    const valorVenda = parseFloat(data.data?.purchase?.price?.value || 0);

    // comissão real recebida
    const comissao = parseFloat(
        data.data?.purchase?.commissions?.producer?.value ||
        data.data?.purchase?.commission?.value ||
        0
    );

    // sempre prioriza comissão
    const valorFinal = comissao > 0 ? comissao : valorVenda;

    if (email) {

        console.log("💰 Compra aprovada para:", email);
        console.log("💰 Comissão detectada:", comissao);
        console.log("💰 Valor enviado ao Facebook:", valorFinal);

        // atualiza lead
        db.prepare(`
        UPDATE leads
        SET comprou = 1
        WHERE email = ?
        `).run(email);

        // gera event_id único
        const crypto = require("crypto");
        const eventId = crypto.randomUUID();

        // envia evento Purchase para Meta
        sendLeadEvent({

            event_id: eventId,

            email,
            phone: telefone,
            nome,

            event_name: "Purchase",

            value: Number(valorFinal),
            currency: "USD"

        });

        console.log("✅ Evento Purchase enviado para Meta");

    }

}

    // =============================
    // CARRINHO ABANDONADO HOTMART
    // =============================

    if (data.event === "ABANDONED_CART") {

        let telefone = data.data?.buyer?.phone?.replace(/\D/g, "");

        if (!telefone) {
            return res.status(200).send("Sem telefone");
        }

        console.log("🛒 Carrinho abandonado Hotmart:", telefone);

        setTimeout(async () => {

            try {

                await sendText(
                    phoneNumberId,
                    telefone,
`Hola! Vi que comenzaste tu inscripción en Aevo Pro pero no finalizaste el pago.

Si tienes alguna duda puedo ayudarte aquí 🙂`
                );

                console.log("📩 Mensaje de recuperación enviado.");

            } catch (error) {

                console.log("Erro Hotmart:", error);

            }

        }, 300000);

    }

    res.status(200).send("OK");

});

module.exports = router;