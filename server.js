import express from "express";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;
let servers = {};

// ===== Função base =====
function getServer(name) {
  const key = name.toLowerCase();
  if (!servers[key]) {
    servers[key] = {
      name,
      bans: [],
      chat: [],
      playersOnline: 0,
      uptime: 0,
      tps: 20,
      lastUpdate: Date.now(),
      topPlayers: []
    };
  }
  return servers[key];
}

// ===== PÁGINA INICIAL =====
app.get("/", (req, res) => {
  res.send("✅ Backend Minecraft Void Essentials ativo e rodando!");
});

// ===== LISTA DE SERVIDORES =====
app.get("/minecraft-servers", (req, res) => {
  const list = Object.values(servers).map(s => ({
    name: s.name,
    online: s.playersOnline,
    bans: s.bans.length,
    tps: s.tps
  }));
  res.json(list.length ? list : [{ name: "Void Essentials", online: 0, bans: 0, tps: 20 }]);
});

// ===== BANIR =====
app.post("/minecraft-banir/:server", (req, res) => {
  const server = getServer(req.params.server);
  const { gamerTag, executor, motivo } = req.body;
  if (!gamerTag) return res.status(400).json({ error: "gamerTag obrigatório" });

  server.bans.push({
    gamerTag,
    executor: executor || "Sistema",
    motivo: motivo || "Sem motivo",
    timestamp: Date.now()
  });

  res.json({ success: true, total: server.bans.length });
});

// ===== DESBANIR =====
app.post("/minecraft-desbanir/:server", (req, res) => {
  const server = getServer(req.params.server);
  const { gamerTag } = req.body;
  if (!gamerTag) return res.status(400).json({ error: "gamerTag obrigatório" });

  server.bans = server.bans.filter(b => b.gamerTag !== gamerTag);
  res.json({ success: true, total: server.bans.length });
});

// ===== LISTAR BANS =====
app.get("/minecraft-banir/:server", (req, res) => {
  const server = getServer(req.params.server);
  res.json(server.bans || []);
});

// ===== CHAT =====
app.post("/minecraft-chat/:server", (req, res) => {
  const server = getServer(req.params.server);
  const { user, text } = req.body;
  if (!user || !text) return res.status(400).json({ error: "user e text obrigatórios" });

  server.chat.push({ user, text, timestamp: Date.now() });
  if (server.chat.length > 100) server.chat.shift();
  res.json({ success: true });
});

app.get("/minecraft-chat/:server", (req, res) => {
  const server = getServer(req.params.server);
  res.json(server.chat || []);
});

// ===== STATUS =====
app.post("/minecraft-players/:server", (req, res) => {
  const server = getServer(req.params.server);
  const { online, uptime, tps } = req.body;

  if (typeof online === "number") server.playersOnline = online;
  if (typeof uptime === "number") server.uptime = uptime;
  if (typeof tps === "number") server.tps = tps;
  server.lastUpdate = Date.now();

  res.json({ success: true, playersOnline: server.playersOnline });
});

app.get("/minecraft-players/:server", (req, res) => {
  const server = getServer(req.params.server);
  res.json({
    online: server.playersOnline || 0,
    uptime: `${server.uptime || 0}h`,
    tps: server.tps || 20,
    lastUpdate: server.lastUpdate ? new Date(server.lastUpdate).toLocaleTimeString() : "N/A",
    banList: server.bans,
    chat: server.chat,
    topPlayers: server.topPlayers
  });
});

// ===== TOP PLAYERS =====
app.post("/minecraft-top/:server", (req, res) => {
  const server = getServer(req.params.server);
  const { topPlayers } = req.body;
  if (!Array.isArray(topPlayers)) return res.status(400).json({ error: "topPlayers deve ser um array" });

  server.topPlayers = topPlayers.slice(0, 3);
  res.json({ success: true, topPlayers: server.topPlayers });
});

app.get("/minecraft-top/:server", (req, res) => {
  const server = getServer(req.params.server);
  res.json(server.topPlayers || []);
});

// ===== INICIAR SERVIDOR =====
app.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ Servidor iniciado na porta ${PORT}`);
});
