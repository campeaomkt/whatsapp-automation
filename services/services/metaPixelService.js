const axios = require("axios");
const crypto = require("crypto");

function hash(value) {
    return crypto
        .createHash("sha256")
        .update(value.trim().toLowerCase())
        .digest("hex");
}

async function sendLeadEvent(data) {

    const url = `https://graph.facebook.com/v18.0/${process.env.META_PIXEL_ID}/events?access_token=${process.env.META_PIXEL_TOKEN}`;

    const payload = {
        data: [
            {
                event_name: "Lead",
                event_time: Math.floor(Date.now() / 1000),
                action_source: "website",

                user_data: {
                    em: data.email ? hash(data.email) : undefined,
                    ph: data.phone ? hash(data.phone) : undefined
                }
            }
        ]
    };

    try {

        const response = await axios.post(url, payload);
        console.log("Evento enviado para Meta:", response.data);

    } catch (err) {

        console.error("Erro ao enviar evento:", err.response?.data || err.message);

    }

}

module.exports = { sendLeadEvent };