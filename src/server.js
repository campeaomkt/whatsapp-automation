
require("dotenv").config();
const express = require("express");

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const webhookKiwify = require("./routes/webhookKiwify");
const webhookHotmart = require("./routes/webhookHotmart");
const metaWebhook = require("./routes/meta");
const leadRoute = require("./routes/lead");
const geoRoute = require("./routes/geo");

app.use("/webhook/kiwify", webhookKiwify);
app.use("/webhook/hotmart", webhookHotmart);
app.use("/webhook/whatsapp", metaWebhook);
app.use("/lead", leadRoute);
app.use("/geo", geoRoute);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});

console.log("Servidor iniciado 🚀");
