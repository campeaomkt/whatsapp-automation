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

// =============================
// DELETAR PRODUTO
// =============================

router.delete("/:id", (req, res) => {

    const { id } = req.params;

    try {

        db.prepare(`
        DELETE FROM products
        WHERE id = ?
        `).run(id);

        res.json({ message: "🗑️ Produto excluído!" });

    } catch (error) {

        res.json({ message: "❌ Erro: " + error.message });

    }

});

router.post("/create-pixel", (req, res) => {

    const { name, pixel_id, token } = req.body;

    db.prepare(`
        INSERT INTO pixels (name, pixel_id, token)
        VALUES (?, ?, ?)
    `).run(name, pixel_id, token);

    res.json({ message: "✅ Pixel criado!" });

});

router.get("/pixels", (req, res) => {

    const pixels = db.prepare(`
        SELECT * FROM pixels ORDER BY id DESC
    `).all();

    res.json(pixels);

});

router.post("/link-pixel", (req, res) => {

    const { product_id, pixel_id } = req.body;

    db.prepare(`
        UPDATE products
        SET pixel_ref = ?
        WHERE id = ?
    `).run(pixel_id, product_id);

    res.json({ message: "🔗 Pixel vinculado!" });

});

module.exports = router;