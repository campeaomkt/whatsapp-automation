const express = require("express");
const router = express.Router();

const db = require("../database/db");
const { sendLeadEvent } = require("../../services/metaPixelService");

// rota que recebe o formulário
router.post("/", (req, res) => {

    try {

        const {
            nome,
            email,
            telefone,
            utm_source,
            utm_campaign,
            utm_content
        } = req.body;

        console.log("Novo lead recebido:", email);

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

       sendLeadEvent({

    email,
    phone: telefone,
    nome,

    utm_source,
    utm_campaign,
    utm_content,

    ip: req.ip,
    userAgent: req.headers["user-agent"]

});

        // link do checkout
       const checkout = `https://pay.hotmart.com/F98850943F?checkoutMode=10&hideBillet=1&name=${encodeURIComponent(nome)}&email=${encodeURIComponent(email)}&phone=${encodeURIComponent(telefone)}`;

res.redirect(checkout);

    } catch (error) {

        console.error("Erro ao salvar lead:", error);
        res.status(500).send("Erro interno");

    }

});

module.exports = router;