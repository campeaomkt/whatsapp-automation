const express = require("express");
const router = express.Router();

const { sendText } = require("../../services/metaWhatsAppService");

router.post("/", async (req, res) => {

    console.log("📩 Webhook Kiwify recebido:");

    const data = req.body;

    console.log(data);

    const phoneNumberId = process.env.META_PHONE_NUMBER_ID;

    // =============================
    // PIX GERADO
    // =============================

    if (
        data.order &&
        data.order.webhook_event_type === "pix_created" &&
        data.order.payment_method === "pix"
    ) {

        let telefone = data.order.Customer.mobile.replace(/\D/g, "");
        const nome = data.order.Customer.first_name || "Tudo bem";
        const checkoutLink = data.order.checkout_link;

        const link = `https://pay.kiwify.com.br/${checkoutLink}`;

        console.log("PIX gerado detectado:", telefone);

        setTimeout(async () => {

            try {

                await sendText(
                    phoneNumberId,
                    telefone,
`Oi ${nome}! Vi que você gerou o PIX para acessar o Aevo Pro.

Se precisar posso te enviar novamente o link de pagamento 🙂`
                );

                console.log("Mensagem PIX enviada");

            } catch (error) {

                console.log("Erro PIX:", error);

            }

        }, 900000);

    }

    // =============================
    // CARRINHO ABANDONADO
    // =============================

    if (data.status !== "abandoned") {
        return res.status(200).send("Evento ignorado");
    }

    let telefone = data.phone.replace(/\D/g, "");

    if (!telefone.startsWith("55")) {
        telefone = "55" + telefone;
    }

    console.log("Carrinho abandonado detectado:", telefone);

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