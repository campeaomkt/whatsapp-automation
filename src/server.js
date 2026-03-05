
require("dotenv").config();
const express = require("express");
const cors = require("cors");

const app = express();

/* ===== CORS (permite requisição do seu site) ===== */
app.use(cors());

/* ===== BODY PARSER ===== */
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* ===== ROTAS ===== */
const webhookKiwify = require("./routes/webhookKiwify");
const webhookHotmart = require("./routes/webhookHotmart");
const metaWebhook = require("./routes/meta");
const leadRoute = require("./routes/lead");
const geoRoute = require("./routes/geo");

/* ===== ENDPOINTS ===== */
app.use("/webhook/kiwify", webhookKiwify);
app.use("/webhook/hotmart", webhookHotmart);
app.use("/webhook/whatsapp", metaWebhook);
app.use("/lead", leadRoute);
app.use("/geo", geoRoute);

module.exports = app;

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});

console.log("Servidor iniciado 🚀");

require("../abandonedCart");
