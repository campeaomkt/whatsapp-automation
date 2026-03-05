const axios = require("axios");

async function sendText(phoneNumberId, to, message) {
  try {

    console.log("📤 Enviando mensagem para:", to);
    console.log("💬 Conteúdo da mensagem:");
    console.log(message);

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

    console.log("✅ Mensagem enviada");

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

    console.log("📤 Enviando documento para:", to);
    console.log("📄 Arquivo:", filename);

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