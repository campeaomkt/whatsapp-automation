const axios = require("axios");

async function sendText(phoneNumberId, to, message) {
  try {
    const response = await axios.post(
      `https://graph.facebook.com/v20.0/${phoneNumberId}/messages`,
      {
        messaging_product: "whatsapp",
        to,
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

    console.log("✅ Texto enviado:", response.data);
    return response.data;

  } catch (error) {
    console.error(
      "❌ Erro ao enviar texto:",
      error.response?.data || error.message
    );
    throw error;
  }
}

async function sendDocument(phoneNumberId, to, link, filename) {
  try {
    const response = await axios.post(
      `https://graph.facebook.com/v20.0/${phoneNumberId}/messages`,
      {
        messaging_product: "whatsapp",
        to,
        type: "document",
        document: {
          link,
          filename
        }
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.META_ACCESS_TOKEN}`,
          "Content-Type": "application/json"
        }
      }
    );

    console.log("📄 Documento enviado:", filename);
    return response.data;

  } catch (error) {
    console.error(
      "❌ Erro ao enviar documento:",
      error.response?.data || error.message
    );
    throw error;
  }
}

module.exports = {
  sendText,
  sendDocument
};
