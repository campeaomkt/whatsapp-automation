const axios = require("axios");
const crypto = require("crypto");

function hash(value) {
    if (!value) return undefined;

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
                    em: hash(data.email),
                    ph: hash(data.phone),
                    fn: hash(data.nome),
                    client_ip_address: data.ip,
                    client_user_agent: data.userAgent,
                    external_id: hash(data.email)
                },

                custom_data: {
                    utm_source: data.utm_source,
                    utm_campaign: data.utm_campaign,
                    utm_content: data.utm_content
                }
            }
        ]
    };

    try {

        const response = await axios.post(url, payload);

        console.log("Evento enviado para Meta:", response.data);

    } catch (err) {

        console.error("Erro Meta:", err.response?.data || err.message);

    }
}

module.exports = { sendLeadEvent };