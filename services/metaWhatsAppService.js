const axios = require("axios");

const GRAPH_URL = `https://graph.facebook.com/v19.0/${process.env.META_PHONE_NUMBER_ID}/messages`;

async function sendWhatsAppMessage(to, message) {
  try {
    const response = await axios.post(
      GRAPH_URL,
      {
        messaging_product: "whatsapp",
        to: to,
        type: "text",
        text: {
          body: message
        }
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.META_ACCESS_TOKEN}`,
          "Content-Type": "application/json"
        }
      }
    );

    console.log("✅ Mensagem enviada com sucesso:", response.data);

    return response.data;

  } catch (error) {
    console.error(
      "❌ Erro ao enviar mensagem:",
      error.response?.data || error.message
    );

    throw error;
  }
}

module.exports = { sendWhatsAppMessage };
