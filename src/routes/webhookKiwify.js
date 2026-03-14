const express = require("express");
const router = express.Router();

const { sendText } = require("../../services/metaWhatsAppService");
const { sendLeadEvent } = require("../../services/metaPixelService");

router.post("/", async (req, res) => {

    console.log("📩 Webhook Kiwify recebido:");

    const data = req.body;

    console.log(JSON.stringify(data, null, 2));

    const phoneNumberId = process.env.META_PHONE_NUMBER_ID;

 // =============================
// VENDA APROVADA (CAPI)
// =============================

if (data.webhook_event_type === "order_approved") {

    const email = data.Customer?.email;
    const nome = data.Customer?.full_name || data.Customer?.first_name;
    const telefone = data.Customer?.mobile?.replace(/\D/g, "");

    const firstName = data.Customer?.first_name;
    const country = data.Customer?.country;
    const ip = data.Customer?.ip;

    // comissão real recebida
    const valor = data.Commissions?.my_commission
        ? Number(data.Commissions.my_commission) / 100
        : 0;

    const transactionId = data.order_id;

    const eventId = "purchase_" + transactionId;

    console.log("💰 Venda aprovada detectada:", email);
    console.log("💰 Valor:", valor);
    console.log("🧾 Transaction:", transactionId);

    sendLeadEvent({

        event_id: eventId,

        external_id: transactionId,

        email,
        phone: telefone,
        nome,

        first_name: firstName,

        country,

        client_ip_address: ip,
        client_user_agent: req.headers["user-agent"],

        content_name: data.Product?.product_name,
        content_ids: [data.Product?.product_id],

        utm_source: data.TrackingParameters?.utm_source,
        utm_campaign: data.TrackingParameters?.utm_campaign,
        utm_medium: data.TrackingParameters?.utm_medium,
        utm_content: data.TrackingParameters?.utm_content,
        utm_term: data.TrackingParameters?.utm_term,

        event_name: "Purchase",

        value: Number(valor),
        currency: "BRL"

    });

    console.log("✅ Evento Purchase enviado para Meta");

}

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

    if (data.status === "abandoned") {

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

    }

    res.status(200).send("OK");

});

module.exports = router;