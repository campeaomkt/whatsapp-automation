const express = require("express");
const router = express.Router();

const db = require("../database/db");
const { sendLeadEvent } = require("../../services/metaPixelService");
const crypto = require("crypto");

// rota que recebe o formulário
router.post("/", (req, res) => {

    try {

const {
    nome,
    email,
    telefone,
    utm_source,
    utm_campaign,
    utm_medium,
    utm_content,
    utm_term,
    fbclid
} = req.body;

        console.log("Novo lead recebido:", email);

        // gera event_id único para deduplicação
        const eventId = crypto.randomUUID();

        // captura cookies do facebook
        const fbclidFinal = fbclid || req.query.fbclid || "";
        const fbp = req.cookies?._fbp || "";
        const fbc = req.cookies?._fbc || (fbclidFinal ? `fb.1.${Date.now()}.${fbclidFinal}` : "");

        // salva no banco
        db.prepare(`
INSERT INTO leads 
(nome, email, telefone, utm_source, utm_campaign, utm_content, created_at)
VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
ON CONFLICT(email) DO UPDATE SET
nome = excluded.nome,
telefone = excluded.telefone,
utm_source = excluded.utm_source,
utm_campaign = excluded.utm_campaign,
utm_content = excluded.utm_content,
created_at = datetime('now'),
mensagem_enviada = 0
`).run(
            nome,
            email,
            telefone,
            utm_source,
            utm_campaign,
            utm_content
        );

        console.log("Lead salvo no banco");

        const eventData = {

            event_id: eventId,

            email,
            phone: telefone,
            nome,

            utm_source,
            utm_campaign,
            utm_content,

            ip: req.ip,
            userAgent: req.headers["user-agent"],

            fbp,
            fbc
        };

        // envia evento Lead
        sendLeadEvent(eventData);

        // envia evento InitiateCheckout
        sendLeadEvent({
            ...eventData,
            event_name: "InitiateCheckout"
        });

  const utmContentLimpo = (utm_content || "").split("::")[0];

const xcodFinal =
`FBhQwK21wXxR${utm_campaign || ""}` +
`hQwK21wXxR${utm_medium || ""}` +
`hQwK21wXxR${utmContentLimpo}` +
`hQwK21wXxR${utm_term || ""}`;

const sck = xcodFinal;

// link do checkout (versão limpa)
const checkout =
`https://pay.hotmart.com/F98850943F?checkoutMode=10&hideBillet=1` +
`&name=${encodeURIComponent(nome)}` +
`&email=${encodeURIComponent(email)}` +
`&phone=${encodeURIComponent(telefone)}`;

res.redirect(checkout);
    } catch (error) {

        console.error("Erro ao salvar lead:", error);
        res.status(500).send("Erro interno");

    }

});

module.exports = router;