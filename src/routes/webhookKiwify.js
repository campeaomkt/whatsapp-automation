const express = require("express");

const router = express.Router();

router.post("/", async (req, res) => {

    console.log("📩 Webhook Kiwify recebido:");
    console.log(req.body);

    res.status(200).send("OK");

});

module.exports = router;
