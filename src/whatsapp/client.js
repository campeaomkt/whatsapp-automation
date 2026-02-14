const memoriaConversas = {};
const filaMensagens = {};

const { gerarResposta } = require('../../services/aiService');

const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

const client = new Client({
    authStrategy: new LocalAuth({
        dataPath: './sessions'
    }),
    puppeteer: {
        headless: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--single-process',
            '--disable-gpu'
        ]
    }
});

client.on('disconnected', async (reason) => {
    console.log('WhatsApp desconectado:', reason);

    try {
        await client.destroy();
    } catch (e) {}

    setTimeout(() => {
        client.initialize();
    }, 5000);
});




// =============================
// 🔍 DETECÇÃO DE IDIOMA
// =============================
function detectarIdioma(texto) {

    const palavrasEspanhol = [
        "hola", "precio", "dólar", "dolares", "comprar",
        "quiero", "funciona", "cómo", "como funciona",
        "interesado", "enlace", "garantía", "teclado"
    ];

    const textoLower = texto.toLowerCase();

    const encontrou = palavrasEspanhol.some(p =>
        textoLower.includes(p)
    );

    return encontrou ? "es" : "pt";
}


// =============================
// QR CODE
// =============================
client.on('qr', (qr) => {
    console.log('Escaneie o QR Code abaixo:');
    qrcode.generate(qr, { small: true });
});


// =============================
// READY
// =============================
client.on('ready', async () => {

    console.log('WhatsApp conectado com sucesso!');

    const numero = '5569992334407'; // coloque seu número aqui (sem @c.us)

    try {
        const numberId = await client.getNumberId(numero);

        if (!numberId) {
            console.log('Número não encontrado no WhatsApp.');
            return;
        }

        await client.sendMessage(
            numberId._serialized,
            'Sistema online 🚀'
        );

        console.log('Mensagem enviada com sucesso!');

    } catch (error) {
        console.error('Erro ao enviar mensagem:', error);
    }

});


// =============================
// REMOVE LISTENER DUPLICADO
// =============================
client.removeAllListeners('message');


// =============================
// EVENTO DE MENSAGEM
// =============================
client.on('message', async (message) => {

    if (message.fromMe) return;

    const usuario = message.from;

    console.log('Mensagem recebida:', message.body);

    // =============================
    // MEMÓRIA
    // =============================
    if (!memoriaConversas[usuario]) {
        memoriaConversas[usuario] = [];
    }

    // =============================
    // FILA (DEBOUNCE)
    // =============================
    if (!filaMensagens[usuario]) {
        filaMensagens[usuario] = {
            mensagens: [],
            timeout: null
        };
    }

    filaMensagens[usuario].mensagens.push(message.body);

    if (filaMensagens[usuario].timeout) {
        clearTimeout(filaMensagens[usuario].timeout);
    }

    // =============================
    // ESPERA 20s APÓS ÚLTIMA MSG
    // =============================
    filaMensagens[usuario].timeout = setTimeout(async () => {

        const textoCompleto = filaMensagens[usuario].mensagens.join(' ');

        delete filaMensagens[usuario];

        // =============================
        // ADICIONA MENSAGEM NA MEMÓRIA
        // =============================
        memoriaConversas[usuario].push({
            role: "user",
            content: textoCompleto
        });

        // Limita histórico (últimas 10 interações)
        if (memoriaConversas[usuario].length > 10) {
            memoriaConversas[usuario].shift();
        }

        const chat = await message.getChat();

        // =============================
        // DELAY DE LEITURA
        // =============================
        const delayLeitura = 5000;
        await new Promise(resolve =>
            setTimeout(resolve, delayLeitura)
        );

        // =============================
        // COMEÇA A DIGITAR
        // =============================
        await chat.sendStateTyping();

        // =============================
        // DETECTA IDIOMA
        // =============================
        const idioma = detectarIdioma(textoCompleto);

        // =============================
        // GERA RESPOSTA COM HISTÓRICO
        // =============================
        const resposta = await gerarResposta(
            memoriaConversas[usuario],
            idioma
        );

        // =============================
        // TEMPO DE DIGITAÇÃO PROPORCIONAL
        // =============================
        const tempoBase = 1500;
        const tempoPorCaracter = 40;

        const tempoDigitando =
            tempoBase + (resposta.length * tempoPorCaracter);

        await new Promise(resolve =>
            setTimeout(resolve, tempoDigitando)
        );

        // =============================
        // ENVIA RESPOSTA
        // =============================
        await client.sendMessage(usuario, resposta);

        // =============================
        // SALVA RESPOSTA NA MEMÓRIA
        // =============================
        memoriaConversas[usuario].push({
            role: "assistant",
            content: resposta
        });

    }, 20000); // 20 segundos após última mensagem

});


// =============================
client.initialize();

module.exports = client;
