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
// ATUALIZAR PIXEL ANTIGO (mantido)
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

// =============================
// 🔥 CRIAR PIXEL (INDEPENDENTE)
// =============================

router.post("/create-pixel", (req, res) => {

    const { name, pixel_id, token } = req.body;

    try {

        db.prepare(`
            INSERT INTO pixels (name, pixel_id, token)
            VALUES (?, ?, ?)
        `).run(name, pixel_id, token);

        res.json({ message: "✅ Pixel criado!" });

    } catch (err) {
        res.json({ message: "❌ Erro: " + err.message });
    }

});

// =============================
// LISTAR PIXELS
// =============================

router.get("/pixels", (req, res) => {

    const pixels = db.prepare(`
        SELECT * FROM pixels ORDER BY id DESC
    `).all();

    res.json(pixels);

});

// =============================
// 🔗 VINCULAR PIXEL AO PRODUTO (Purchase)
// =============================

router.post("/link-pixel", (req, res) => {

    const { product_id, pixel_id } = req.body;

    try {

        db.prepare(`
            UPDATE products
            SET pixel_ref = ?
            WHERE id = ?
        `).run(pixel_id, product_id);

        res.json({ message: "🔗 Pixel vinculado ao Purchase!" });

    } catch (err) {
        res.json({ message: "❌ Erro: " + err.message });
    }

});


// =============================
// DELETAR PIXEL
// =============================

router.delete("/pixel/:id", (req, res) => {

    const { id } = req.params;

    try {

        // remove vínculo dos produtos primeiro
        db.prepare(`
            UPDATE products
            SET pixel_ref = NULL
            WHERE pixel_ref = ?
        `).run(id);

        // remove pixel
        db.prepare(`
            DELETE FROM pixels
            WHERE id = ?
        `).run(id);

        res.json({ message: "🗑️ Pixel excluído!" });

    } catch (err) {

        res.json({ message: "❌ Erro: " + err.message });

    }

});

module.exports = router;