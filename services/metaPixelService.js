const axios = require("axios");
const crypto = require("crypto");

function hash(value) {
    if (!value) return undefined;

    return crypto
        .createHash("sha256")
        .update(value.trim().toLowerCase())
        .digest("hex");
}

async function sendLeadEvent(data, source = "hotmart") {

    let PIXEL_ID;
    let TOKEN;

    if (source === "kiwify") {
        PIXEL_ID = process.env.META_PIXEL_ID_KIWIFY;
        TOKEN = process.env.META_PIXEL_TOKEN_KIWIFY;
    } else {
        PIXEL_ID = process.env.META_PIXEL_ID;
        TOKEN = process.env.META_PIXEL_TOKEN;
    }

    const url = `https://graph.facebook.com/v18.0/${PIXEL_ID}/events?access_token=${TOKEN}`;
    const payload = {
        data: [
            {
                event_name: data.event_name || "Lead",
                event_time: Math.floor(Date.now() / 1000),

                // deduplicação entre browser pixel e servidor
                event_id: data.event_id || undefined,

                action_source: "website",

                user_data: {
                    em: hash(data.email),
                    ph: hash(data.phone),
                    fn: hash(data.nome),

                    client_ip_address: data.ip,
                    client_user_agent: data.userAgent,

                    external_id: hash(data.email),

                    // melhora atribuição do Facebook
                    fbp: data.fbp,
                    fbc: data.fbc
                },

                custom_data: {
                    utm_source: data.utm_source,
                    utm_campaign: data.utm_campaign,
                    utm_content: data.utm_content,

                    value: data.value,
                    currency: data.currency
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