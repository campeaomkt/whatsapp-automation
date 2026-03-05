const db = require("./src/database/db");
const { sendText } = require("./src/services/metaWhatsAppService");

function verificarCarrinhoAbandonado(){

const leads = db.prepare(`
SELECT *
FROM leads
WHERE comprou = 0
AND mensagem_enviada = 0
AND created_at <= datetime('now','-10 minutes')
`).all();

if(leads.length === 0) return;

console.log("Leads abandonados:", leads.length);

leads.forEach(lead => {

console.log("Carrinho abandonado:", lead.email);

const mensagem = `
Hola ${lead.nome} 👋

Vi que comenzaste la compra del pack de sonidos pero no la finalizaste.

Si todavía te quedó alguna duda, estoy aquí para ayudarte.
`;

const phoneNumberId = process.env.META_PHONE_NUMBER_ID;

if(lead.telefone){

const telefone = lead.telefone.replace(/\D/g,"");

sendText(phoneNumberId, telefone, mensagem);

}

db.prepare(`
UPDATE leads
SET mensagem_enviada = 1
WHERE id = ?
`).run(lead.id);

});

}

setInterval(verificarCarrinhoAbandonado, 600000);