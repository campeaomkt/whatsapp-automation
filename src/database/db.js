const Database = require("better-sqlite3");

const db = new Database("./src/database/leads.db");

/* ================= CRIAR TABELA ================= */

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

/* ================= GARANTIR COLUNAS ================= */

try {
    db.prepare(`ALTER TABLE leads ADD COLUMN comprou INTEGER DEFAULT 0`).run();
} catch (e) {}

try {
    db.prepare(`ALTER TABLE leads ADD COLUMN mensagem_enviada INTEGER DEFAULT 0`).run();
} catch (e) {}

try {
    db.prepare(`ALTER TABLE leads ADD COLUMN utm_medium TEXT`).run();
} catch (e) {}

try {
    db.prepare(`ALTER TABLE leads ADD COLUMN utm_term TEXT`).run();
} catch (e) {}

try {
    db.prepare(`ALTER TABLE leads ADD COLUMN fbp TEXT`).run();
} catch (e) {}

try {
    db.prepare(`ALTER TABLE leads ADD COLUMN fbc TEXT`).run();
} catch (e) {}

try {
    db.prepare(`ALTER TABLE leads ADD COLUMN ip TEXT`).run();
} catch (e) {}

try {
    db.prepare(`ALTER TABLE leads ADD COLUMN user_agent TEXT`).run();
} catch (e) {}

// ================= PRODUCTS =================

db.prepare(`
CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    platform TEXT,
    product_id TEXT UNIQUE,
    pixel_id TEXT,
    pixel_token TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)
`).run();

// NOVA TABELA PIXELS
db.prepare(`
CREATE TABLE IF NOT EXISTS pixels (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    pixel_id TEXT,
    token TEXT
)
`).run();

// NOVA REFERÊNCIA NO PRODUCT
try {
    db.prepare(`ALTER TABLE products ADD COLUMN pixel_ref INTEGER`).run();
} catch (e) {}

// ================= EXPORT =================

module.exports = db;