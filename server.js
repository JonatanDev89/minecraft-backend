// backend.js
import express from "express";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

const PORT = 3000;

// Estrutura dinâmica para qualquer servidor
let servers = {};

// Função que garante servidor criado
function getServer(name) {
    if (!servers[name]) {
        servers[name] = { bans: [], chat: [], playersOnline: 0, uptime: 0, tps: 20 };
    }
    return servers[name];
}

// ========================
// ===== BAN / UNBAN ======
// ========================

// Banir jogador
app.post("/minecraft-banir/:server", (req, res) => {
    const serverName = req.params.server;
    const { gamerTag, executor, motivo } = req.body;
    const server = getServer(serverName);

    server.bans.push({ gamerTag, executor: executor || "Sistema", motivo: motivo || "Sem motivo", timestamp: Date.now() });
    res.json({ success: true });
});

// Desbanir jogador
app.post("/minecraft-desbanir/:server", (req, res) => {
    const serverName = req.params.server;
    const { gamerTag } = req.body;
    const server = getServer(serverName);

    server.bans = server.bans.filter(b => b.gamerTag !== gamerTag);
    res.json({ success: true });
});

// Listar banidos
app.get("/minecraft-banir/:server", (req, res) => {
    const serverName = req.params.server;
    const server = getServer(serverName);
    res.json(server.bans);
});

// ========================
// ===== CHAT SERVER ======
// ========================

// Enviar mensagem
app.post("/minecraft-chat/:server", (req, res) => {
    const serverName = req.params.server;
    const { user, text } = req.body;
    if (!user || !text) return res.status(400).json({ error: "User e text obrigatórios" });

    const server = getServer(serverName);
    server.chat.push({ user, text, timestamp: Date.now() });

    // Mantém apenas últimas 100 mensagens
    if (server.chat.length > 100) server.chat.shift();

    res.json({ success: true });
});

// Listar chat
app.get("/minecraft-chat/:server", (req, res) => {
    const serverName = req.params.server;
    const server = getServer(serverName);
    res.json(server.chat);
});

// ========================
// === PLAYERS ONLINE =====
// ========================
app.get("/minecraft-players/:server", (req, res) => {
    const serverName = req.params.server;
    const server = getServer(serverName);

    // Simulação de jogadores online, uptime e TPS
    server.playersOnline = Math.floor(Math.random() * 50) + 1;
    server.uptime = server.uptime + 1; // simples incremento a cada request
    server.tps = 20; // valor fixo ou simulado

    res.json({
        online: server.playersOnline,
        uptime: `${server.uptime}h`,
        tps: server.tps
    });
});

app.listen(PORT, () => console.log(`Servidor rodando em http://localhost:${PORT}`));
