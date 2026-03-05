const express = require("express");
const router = express.Router();

const db = require("../database/db");

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
            INSERT OR IGNORE INTO leads 
            (nome, email, telefone, utm_source, utm_campaign, utm_content)
            VALUES (?, ?, ?, ?, ?, ?)
        `).run(
            nome,
            email,
            telefone,
            utm_source,
            utm_campaign,
            utm_content
        );

        console.log("Lead salvo no banco");

        // link do checkout
       const checkout = `https://pay.hotmart.com/F98850943F?checkoutMode=10&hideBillet=1&name=${encodeURIComponent(nome)}&email=${encodeURIComponent(email)}&phone=${encodeURIComponent(telefone)}`;

res.redirect(checkout);

    } catch (error) {

        console.error("Erro ao salvar lead:", error);
        res.status(500).send("Erro interno");

    }

});

module.exports = router;