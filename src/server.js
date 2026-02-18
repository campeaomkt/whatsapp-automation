require("dotenv").config();
const express = require("express");

const app = express();

app.use(express.json());

const webhookKiwify = require("./routes/webhookKiwify");
const metaWebhook = require("./routes/meta");

app.use("/webhook/kiwify", webhookKiwify);
app.use("/webhook/whatsapp", metaWebhook);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});

console.log("Servidor iniciado 🚀");
