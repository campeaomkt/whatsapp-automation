const express = require("express");
const router = express.Router();
const db = require("../database/db");

// =============================
// CRIAR PRODUTO (manual opcional)
// =============================

router.post("/", (req, res) => {

    const { name, platform, product_id, pixel_id, pixel_token } = req.body;

    try {

        db.prepare(`
        INSERT INTO products (name, platform, product_id, pixel_id, pixel_token)
        VALUES (?, ?, ?, ?, ?)
        `).run(name, platform, product_id, pixel_id, pixel_token);

        res.json({ message: "✅ Produto salvo!" });

    } catch (error) {

        res.json({ message: "❌ Erro: " + error.message });

    }

});

// =============================
// LISTAR PRODUTOS
// =============================

router.get("/", (req, res) => {

    const products = db.prepare(`
        SELECT * FROM products ORDER BY id DESC
    `).all();

    res.json(products);

});

// =============================
// ATUALIZAR PIXEL
// =============================

router.post("/pixel", (req, res) => {

    const { product_id, pixel_id, pixel_token } = req.body;

    try {

        db.prepare(`
        UPDATE products
        SET pixel_id = ?, pixel_token = ?
        WHERE id = ?
        `).run(pixel_id, pixel_token, product_id);

        res.json({ message: "✅ Pixel vinculado!" });

    } catch (error) {

        res.json({ message: "❌ Erro: " + error.message });

    }

});

module.exports = router;