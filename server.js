import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import fs from "fs";
import path from "path";

const app = express();
const PORT = process.env.PORT || 3000;
const FILE = path.resolve("./blacklist.json");

app.use(bodyParser.json());
app.use(cors());

// Carrega blacklist do arquivo
let blackList = [];
if (fs.existsSync(FILE)) {
    try {
        blackList = JSON.parse(fs.readFileSync(FILE));
        console.log(`[BACKEND] Blacklist carregada com ${blackList.length} registros`);
    } catch (err) {
        console.error("Erro ao carregar blacklist:", err);
        blackList = [];
    }
}

// Função para salvar blacklist no arquivo
const saveBlacklist = () => {
    fs.writeFileSync(FILE, JSON.stringify(blackList, null, 2));
};

// --------------------
// Rotas
// --------------------

// Banir jogador
app.post("/minecraft-banir/:server", (req, res) => {
    const server = req.params.server;
    const { gamerTag, executor, motivo, timestamp } = req.body;

    // Remove se já existir para evitar duplicados
    blackList = blackList.filter(entry => !(entry.gamerTag === gamerTag && entry.server === server));
    blackList.push({ gamerTag, executor, motivo, timestamp: timestamp || Date.now(), server });

    saveBlacklist();
    console.log(`[BAN] ${gamerTag} banido por ${executor} | Motivo: ${motivo} | Servidor: ${server}`);
    res.json({ status: "ok", action: "ban", gamerTag });
});

// Desbanir jogador
app.post("/minecraft-desbanir/:server", (req, res) => {
    const server = req.params.server;
    const { gamerTag, executor } = req.body;

    const beforeCount = blackList.length;
    blackList = blackList.filter(entry => !(entry.gamerTag === gamerTag && entry.server === server));
    const afterCount = blackList.length;

    saveBlacklist();
    console.log(`[UNBAN] ${gamerTag} desbanido por ${executor} | Servidor: ${server} | Removed: ${beforeCount - afterCount}`);
    res.json({ status: "ok", action: "unban", gamerTag });
});

// Pegar blacklist de um servidor
app.get("/minecraft-banir/:server", (req, res) => {
    const server = req.params.server;
    const serverBans = blackList.filter(b => b.server === server);
    res.json(serverBans);
});

// Lista completa (debug)
app.get("/blacklist", (req, res) => {
    res.json(blackList);
});

app.listen(PORT, () => {
    console.log(`Backend Void Essentials rodando em http://127.0.0.1:${PORT}`);
});
