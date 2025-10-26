// backend.js
import express from "express";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

const PORT = 3000;

// Estrutura dinâmica para múltiplos servidores
let servers = {};

// Garante que o servidor exista
function getServer(name) {
    if (!servers[name]) {
        servers[name] = { 
            name,
            bans: [], 
            chat: [], 
            playersOnline: 0, 
            uptime: 0, 
            tps: 20,
            lastUpdate: Date.now(),
            topPlayers: [] // <- aqui vamos armazenar top 1, 2, 3 se quiser depois
        };
    }
    return servers[name];
}

// =============================
// ===== LISTAR SERVIDORES =====
// =============================
app.get("/minecraft-servers", (req, res) => {
    try {
        const list = Object.keys(servers);
        res.json(list.length ? list : ["Void Essentials"]);
    } catch (err) {
        console.error("Erro ao carregar servidores:", err);
        res.status(500).json({ error: "Erro ao carregar servidores." });
    }
});

// ========================
// ===== BAN / UNBAN ======
// ========================

// Banir jogador
app.post("/minecraft-banir/:server", (req, res) => {
    const serverName = req.params.server;
    const { gamerTag, executor, motivo } = req.body;
    const server = getServer(serverName);

    server.bans.push({
        gamerTag,
        executor: executor || "Sistema",
        motivo: motivo || "Sem motivo",
        timestamp: Date.now()
    });

    res.json({ success: true, total: server.bans.length });
});

// Desbanir jogador
app.post("/minecraft-desbanir/:server", (req, res) => {
    const serverName = req.params.server;
    const { gamerTag } = req.body;
    const server = getServer(serverName);

    server.bans = server.bans.filter(b => b.gamerTag !== gamerTag);
    res.json({ success: true, total: server.bans.length });
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

    if (server.chat.length > 100) server.chat.shift();
    res.json({ success: true });
});

// Listar chat
app.get("/minecraft-chat/:server", (req, res) => {
    const serverName = req.params.server;
    const server = getServer(serverName);
    res.json(server.chat);
});

// =============================
// === ATUALIZAÇÃO DE STATUS ===
// =============================

// Minecraft envia dados reais (ex: players online)
app.post("/minecraft-players/:server", (req, res) => {
    const serverName = req.params.server;
    const { online, uptime, tps } = req.body;
    const server = getServer(serverName);

    if (typeof online === "number") server.playersOnline = online;
    if (typeof uptime === "number") server.uptime = uptime;
    if (typeof tps === "number") server.tps = tps;

    server.lastUpdate = Date.now();

    res.json({ success: true, playersOnline: server.playersOnline });
});

// Consultar status atual
app.get("/minecraft-players/:server", (req, res) => {
    const serverName = req.params.server;
    const server = getServer(serverName);

    res.json({
        online: server.playersOnline,
        uptime: `${server.uptime}h`,
        tps: server.tps,
        lastUpdate: new Date(server.lastUpdate).toLocaleTimeString()
    });
});

// =============================
// === TOP PLAYERS POR SERVER ===
// =============================

// Atualizar top players (ex: chamado pelo Minecraft)
app.post("/minecraft-top/:server", (req, res) => {
    const serverName = req.params.server;
    const { topPlayers } = req.body; // ex: [{name:"Player1",score:100},...]
    const server = getServer(serverName);
    server.topPlayers = topPlayers || [];
    res.json({ success: true });
});

// Consultar top 1, 2 e 3
app.get("/minecraft-top/:server", (req, res) => {
    const serverName = req.params.server;
    const server = getServer(serverName);
    res.json(server.topPlayers.slice(0, 3));
});

app.listen(PORT, () => console.log(`✅ Servidor rodando em http://localhost:${PORT}`));
