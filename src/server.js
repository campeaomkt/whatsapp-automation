require("dotenv").config();

const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");

const app = express();

/* ===== CORS (permite requisição do seu site) ===== */
app.use(cors());

/* ===== COOKIE PARSER ===== */
app.use(cookieParser());

/* ===== BODY PARSER ===== */
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* ===== ROTAS ===== */
const webhookKiwify = require("./routes/webhookKiwify");
const webhookHotmart = require("./routes/webhookHotmart");
const metaWebhook = require("./routes/meta");
const leadRoute = require("./routes/lead");
const geoRoute = require("./routes/geo");
const webhookKiwifyMulti = require("./multitrack/webhookKiwifyMulti");
const webhookHotmartMulti = require("./multitrack/webhookHotmartMulti");
const productsRoute = require("./routes/products");


/* ===== ENDPOINTS ===== */
app.use("/webhook/kiwify", webhookKiwify);
app.use("/webhook/hotmart", webhookHotmart);
app.use("/webhook/whatsapp", metaWebhook);
app.use("/lead", leadRoute);
app.use("/geo", geoRoute);
app.use("/multi/kiwify", webhookKiwifyMulti);
app.use("/multi/hotmart", webhookHotmartMulti);
app.use("/products", productsRoute);
app.use(express.static("public"));

module.exports = app;

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});

console.log("Servidor iniciado 🚀");

require("../abandonedCart");