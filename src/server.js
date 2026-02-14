require("dotenv").config();
const express = require("express");

require('./whatsapp/client');

const app = express();
app.use(express.json());

const webhookKiwify = require("./routes/webhookKiwify");
const webhookWhatsApp = require("./routes/webhookWhatsApp");

app.use("/webhook/kiwify", webhookKiwify);
app.use("/webhook/whatsapp", webhookWhatsApp);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});

console.log("TESTE VPS 123");
