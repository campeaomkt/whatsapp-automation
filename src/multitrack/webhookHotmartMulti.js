const express = require("express");
const router = express.Router();

const db = require("../database/db");
const { sendEventMulti } = require("./pixelServiceMulti");

router.post("/", async (req, res) => {

    console.log("🧪 [MULTI] Webhook Hotmart recebido");

    const data = req.body;

    console.log(JSON.stringify(data, null, 2));

    // =============================
    // COMPRA APROVADA
    // =============================

    if (data.event === "PURCHASE_APPROVED") {

        const email = data.data?.buyer?.email;
        const nome = data.data?.buyer?.name;
        const telefone = data.data?.buyer?.phone?.replace(/\D/g, "");

        const firstName = data.data?.buyer?.first_name;
        const lastName = data.data?.buyer?.last_name;

        const cidade = data.data?.buyer?.address?.city;
        const estado = data.data?.buyer?.address?.state;
        const zip = data.data?.buyer?.address?.zipcode;
        const country = data.data?.buyer?.address?.country_iso;

        const transactionId = data.data?.purchase?.transaction;
        const eventId = `purchase_${transactionId}`;

        const valorVenda = parseFloat(data.data?.purchase?.price?.value || 0);

        let comissao = 0;

        if (data.data?.commissions && Array.isArray(data.data.commissions)) {
            const producerCommission = data.data.commissions.find(
                c => c.source === "PRODUCER"
            );
            if (producerCommission) {
                comissao = parseFloat(producerCommission.value);
            }
        }

        const valorFinal = comissao > 0 ? comissao : valorVenda;

        console.log("💰 [MULTI] Compra:", email);
        console.log("💰 Valor:", valorFinal);

        // =============================
        // BUSCAR PRODUTO
        // =============================

        let product = db.prepare(`
            SELECT * FROM products WHERE product_id = ?
        `).get(data.data?.product?.id);

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
                data.data?.product?.name,
                "hotmart",
                data.data?.product?.id
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
        // ENVIO PARA META
        // =============================

        sendEventMulti({

            event_id: eventId,

            email,
            phone: telefone,
            nome,

            first_name: firstName,
            last_name: lastName,

            city: cidade,
            state: estado,
            zip,
            country,

            utm_source: lead?.utm_source,
            utm_campaign: lead?.utm_campaign,
            utm_medium: lead?.utm_medium,
            utm_content: lead?.utm_content,
            utm_term: lead?.utm_term,

            fbp: lead?.fbp,
            fbc: lead?.fbc,

            client_ip_address: lead?.ip,
            client_user_agent: lead?.user_agent,

            event_name: "Purchase",

            value: Number(valorFinal),
            currency: "USD"

        }, {
            pixel_id: product.pixel_id,
            token: product.pixel_token
        });

        console.log("✅ [MULTI] Evento enviado para pixel:", product.pixel_id);
    }

    res.status(200).send("OK");
});

module.exports = router;