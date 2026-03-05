const Database = require("better-sqlite3");

const db = new Database("./src/database/leads.db");

db.prepare(`
CREATE TABLE IF NOT EXISTS leads (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT,
    email TEXT UNIQUE,
    telefone TEXT,
    utm_source TEXT,
    utm_campaign TEXT,
    utm_content TEXT,
    status TEXT DEFAULT 'lead',
    comprou INTEGER DEFAULT 0,
    mensagem_enviada INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)
`).run();

module.exports = db;