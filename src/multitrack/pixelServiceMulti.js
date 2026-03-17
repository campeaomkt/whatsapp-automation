const axios = require("axios");
const crypto = require("crypto");

// =============================
// HASH (META REQUIREMENT)
// =============================

function hash(value) {
    if (!value) return undefined;

    return crypto
        .createHash("sha256")
        .update(value.toString().trim().toLowerCase())
        .digest("hex");
}

// =============================
// ENVIO DINÂMICO
// =============================

async function sendEventMulti(data, config = {}) {

    const PIXEL_ID = config.pixel_id;
    const TOKEN = config.token;

    if (!PIXEL_ID || !TOKEN) {
        console.log("❌ [MULTI] Pixel ou token não definidos");
        return;
    }

    console.log("📡 [MULTI] Enviando para pixel:", PIXEL_ID);

    const url = `https://graph.facebook.com/v18.0/${PIXEL_ID}/events?access_token=${TOKEN}`;

    const payload = {
        data: [
            {
                event_name: data.event_name || "Purchase",
                event_time: Math.floor(Date.now() / 1000),
                event_id: data.event_id,

                action_source: "website",

                user_data: {
                    em: hash(data.email),
                    ph: hash(data.phone),
                    fn: hash(data.first_name),
                    ln: hash(data.last_name),
                    ct: hash(data.city),
                    st: hash(data.state),
                    zp: hash(data.zip),
                    country: hash(data.country),

                    client_ip_address: data.client_ip_address,
                    client_user_agent: data.client_user_agent,

                    fbp: data.fbp,
                    fbc: data.fbc
                },

                custom_data: {
                    value: data.value,
                    currency: data.currency,

                    content_name: data.content_name,
                    content_ids: data.content_ids,

                    utm_source: data.utm_source,
                    utm_campaign: data.utm_campaign,
                    utm_medium: data.utm_medium,
                    utm_content: data.utm_content,
                    utm_term: data.utm_term
                }
            }
        ]
    };

    try {
        const response = await axios.post(url, payload);

        console.log("✅ [MULTI] Evento enviado:", response.data);

    } catch (error) {

        console.log("❌ [MULTI] Erro ao enviar:", error.response?.data || error.message);

    }
}

module.exports = { sendEventMulti };