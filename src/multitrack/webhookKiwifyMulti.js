const express = require("express");
const router = express.Router();

const db = require("../database/db");
const { sendEventMulti } = require("./pixelServiceMulti");

router.post("/", async (req, res) => {

    console.log("🧪 [MULTI] Webhook Kiwify recebido");

    const data = req.body;

    console.log(JSON.stringify(data, null, 2));

    // =============================
    // VENDA APROVADA
    // =============================

    if (data.webhook_event_type === "order_approved") {

        const email = data.Customer?.email;
        const nome = data.Customer?.full_name || data.Customer?.first_name;
        const telefone = data.Customer?.mobile?.replace(/\D/g, "");

        const firstName = data.Customer?.first_name;
        const country = data.Customer?.country;
        const ip = data.Customer?.ip;
        const userAgent = req.headers["user-agent"];

        const transactionId = data.order_id;
        const eventId = "purchase_" + transactionId;

        const valor = data.Commissions?.my_commission
            ? Number(data.Commissions.my_commission) / 100
            : 0;

        // =============================
        // BUSCAR PRODUTO
        // =============================

        let product = db.prepare(`
            SELECT * FROM products WHERE product_id = ?
        `).get(data.Product?.product_id);

        console.log("🧩 Produto:", product?.name || "NÃO ENCONTRADO");

        // =============================
        // AUTO CADASTRO
        // =============================

        if (!product) {

            console.log("🆕 [MULTI] Novo produto detectado, cadastrando...");

            db.prepare(`
                INSERT INTO products (name, platform, product_id)
                VALUES (?, ?, ?)
            `).run(
                data.Product?.product_name,
                "kiwify",
                data.Product?.product_id
            );

            return res.status(200).send("Produto criado, configure o pixel no painel");
        }

        // =============================
        // VALIDAR PIXEL
        // =============================

        if (!product.pixel_id || !product.pixel_token) {
            console.log("❌ [MULTI] Produto sem pixel/token → aguardando configuração");
            return res.status(200).send("Pixel não configurado ainda");
        }

        // =============================
        // BUSCAR LEAD
        // =============================

        const lead = db.prepare(`
            SELECT utm_source, utm_campaign, utm_content, utm_medium, utm_term, fbp, fbc, ip, user_agent
            FROM leads
            WHERE email = ?
        `).get(email);

        // =============================
        // FBCLID (fallback)
        // =============================

        let fbclid = "";

        if (data.TrackingParameters?.utm_content) {
            const parts = data.TrackingParameters.utm_content.split("::");
            if (parts.length > 1) {
                fbclid = parts[1];
            }
        }

        const fbcFromWebhook = fbclid
            ? `fb.1.${Date.now()}.${fbclid}`
            : undefined;

        // =============================
        // ENVIO PARA META
        // =============================

        sendEventMulti({

            event_id: eventId,
            external_id: transactionId,

            email,
            phone: telefone,
            nome,

            first_name: firstName,
            country,

            utm_source: lead?.utm_source,
            utm_campaign: lead?.utm_campaign,
            utm_medium: lead?.utm_medium,
            utm_content: lead?.utm_content,
            utm_term: lead?.utm_term,

            fbp: lead?.fbp,
            fbc: lead?.fbc || fbcFromWebhook,

            client_ip_address: lead?.ip || ip,
            client_user_agent: lead?.user_agent || userAgent,

            content_name: data.Product?.product_name,
            content_ids: [data.Product?.product_id],

            event_name: "Purchase",

            value: Number(valor),
            currency: "BRL"

        }, {
            pixel_id: product.pixel_id,
            token: product.pixel_token
        });

        console.log("✅ [MULTI] Evento enviado para pixel:", product.pixel_id);
    }

    res.status(200).send("OK");
});

module.exports = router;