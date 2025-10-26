<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Void Essentials - MultiServer Dashboard</title>
<style>
  * { box-sizing:border-box; margin:0; padding:0; font-family:'Inter',sans-serif;}
  body { background:#0e0e0e; color:#e0e0e0; min-height:100vh;}
  header { background:#121212; padding:20px; text-align:center; color:#00d4ff; font-size:22px; font-weight:bold; box-shadow:0 2px 10px rgba(0,0,0,0.5);}
  main { max-width:1100px; margin:0 auto; padding:30px; }

  .server-list { display:flex; flex-wrap:wrap; justify-content:center; gap:20px; margin-top:30px; }
  .server-card { background:#1b1b1b; padding:20px; border-radius:15px; width:260px; text-align:center; box-shadow:0 4px 20px rgba(0,0,0,0.6); transition:transform 0.2s, background 0.3s; cursor:pointer; }
  .server-card:hover { transform:scale(1.05); background:#222; }
  .server-card h3 { color:#00d4ff; margin-bottom:10px; font-size:18px; }
  .server-card p { margin:6px 0; font-size:14px; }

  .server-panel { display:none; }
  .back-btn { background:#0078ff; color:#fff; padding:8px 16px; border:none; border-radius:8px; cursor:pointer; margin-bottom:15px; transition:0.2s; }
  .back-btn:hover { background:#005fcc; }

  .info-cards { display:flex; flex-wrap:wrap; gap:15px; justify-content:center; margin-bottom:20px; }
  .info-card { background:#1b1b1b; padding:15px; border-radius:10px; width:160px; text-align:center; box-shadow:0 4px 12px rgba(0,0,0,0.5); }
  .info-card h3 { color:#00d4ff; margin-bottom:8px; font-size:15px; }
  .info-card p { font-size:20px; font-weight:bold; }

  .top-players { background:#1b1b1b; border-radius:10px; padding:15px; box-shadow:0 4px 15px rgba(0,0,0,0.5); margin-bottom:20px; text-align:center; }
  .top-players h3 { color:#00d4ff; margin-bottom:10px; }
  .top-players ul { list-style:none; padding:0; }
  .top-players li { margin:5px 0; font-weight:bold; }
  .top-players li span { color:#ffd700; }

  .card { background:#1b1b1b; padding:15px; border-radius:10px; margin-bottom:20px; box-shadow:0 4px 15px rgba(0,0,0,0.5); }
  input, textarea, button { width:100%; padding:8px; margin-top:6px; border-radius:5px; border:1px solid #333; background:#2a2a2a; color:#fff; font-size:14px;}
  button { background:#0078ff; border:none; font-weight:bold; cursor:pointer; transition:0.2s;}
  button:hover { background:#005fcc; }

  table { width:100%; border-collapse: collapse; font-size:13px; margin-top:10px; }
  th, td { padding:8px; border-bottom:1px solid #333; text-align:left; }
  th { background:#2c2c2c; text-transform:uppercase; }
  tr:nth-child(even) { background:#1f1f1f; }
  tr:hover { background:#333; }

  #chat-box { height:200px; overflow-y:auto; background:#121212; border:1px solid #333; border-radius:6px; padding:10px; font-size:13px; }
  .chat-message span { color:#00d4ff; font-weight:bold; }
</style>
</head>
<body>

<header>Void Essentials Dashboard</header>
<main>

  <!-- Lista de servidores -->
  <section id="servers">
    <h2 style="text-align:center; color:#00d4ff;">Selecione um Servidor</h2>
    <div class="server-list" id="server-list">
      <p>Carregando servidores...</p>
    </div>
  </section>

  <!-- Painel de servidor -->
  <section id="server-panel" class="server-panel">
    <button class="back-btn" onclick="voltar()">← Voltar</button>
    <h2 id="server-title" style="text-align:center; color:#00d4ff; margin-bottom:20px;"></h2>

    <div class="info-cards">
      <div class="info-card"><h3>Online</h3><p id="players-online">0</p></div>
      <div class="info-card"><h3>Banidos</h3><p id="total-bans">0</p></div>
      <div class="info-card"><h3>Uptime</h3><p id="server-uptime">0h</p></div>
      <div class="info-card"><h3>TPS</h3><p id="server-tps">20</p></div>
    </div>

    <div class="top-players">
      <h3>🏆 Top Jogadores</h3>
      <ul id="top-list">
        <li><span>🥇</span> <span id="top1">---</span></li>
        <li><span>🥈</span> <span id="top2">---</span></li>
        <li><span>🥉</span> <span id="top3">---</span></li>
      </ul>
    </div>

    <div class="card">
      <h3>Banimentos</h3>
      <input id="ban-gamertag" placeholder="Gamertag para banir">
      <input id="ban-motivo" placeholder="Motivo (opcional)">
      <button id="ban-button">Banir</button>
      <input id="unban-gamertag" placeholder="Gamertag para desbanir" style="margin-top:10px;">
      <button id="unban-button">Desbanir</button>

      <h4 style="margin-top:15px;">Lista de Banidos</h4>
      <table>
        <thead><tr><th>Jogador</th><th>Motivo</th><th>Executor</th><th>Data</th></tr></thead>
        <tbody id="blacklist"></tbody>
      </table>
    </div>

    <div class="card">
      <h3>Chat</h3>
      <div id="chat-box"></div>
      <textarea id="chat-msg" placeholder="Digite uma mensagem..." style="height:60px;"></textarea>
      <button id="chat-send" style="margin-top:5px;">Enviar</button>
    </div>
  </section>
</main>

<script>
const URL = "https://minecraft-backend-xevp.onrender.com/";
const serverListElem = document.getElementById("server-list");
const panel = document.getElementById("server-panel");
const hub = document.getElementById("servers");
let currentServer = null;

// ====================
// Carrega lista de servidores
// ====================
async function carregarServidores() {
  try {
    const res = await fetch(`${URL}minecraft-servers`);
    const servers = await res.json();
    serverListElem.innerHTML = "";
    servers.forEach(s => {
      const div = document.createElement("div");
      div.className = "server-card";
      div.innerHTML = `
        <h3>${s.name}</h3>
        <p>Jogadores: ${s.online}</p>
        <p>Banidos: ${s.bans}</p>
        <p>TPS: ${s.tps}</p>
      `;
      div.onclick = () => abrirPainel(s.name);
      serverListElem.appendChild(div);
    });
  } catch(e) {
    serverListElem.innerHTML = "<p>Erro ao carregar servidores.</p>";
  }
}

// ====================
// Abrir painel do servidor
// ====================
function voltar() {
  panel.style.display = "none";
  hub.style.display = "block";
  currentServer = null;
}

async function abrirPainel(serverName) {
  currentServer = serverName;
  hub.style.display = "none";
  panel.style.display = "block";
  document.getElementById("server-title").textContent = serverName;
  atualizarTudo();
}

// ====================
// Atualiza todas informações
// ====================
async function atualizarTudo() {
  if (!currentServer) return;

  try {
    // 1️⃣ Status do servidor
    const statusRes = await fetch(`${URL}minecraft-players/${encodeURIComponent(currentServer)}`);
    const statusData = await statusRes.json();
    document.getElementById("players-online").textContent = statusData.online || 0;
    document.getElementById("server-uptime").textContent = statusData.uptime || "0h";
    document.getElementById("server-tps").textContent = statusData.tps || 20;

    // 2️⃣ Ban list
    const banRes = await fetch(`${URL}minecraft-banir/${encodeURIComponent(currentServer)}`);
    const bans = await banRes.json();
    document.getElementById("total-bans").textContent = bans.length;
    const tbody = document.getElementById("blacklist");
    tbody.innerHTML = "";
    bans.forEach(b => {
      const tr = document.createElement("tr");
      const d = new Date(b.timestamp);
      tr.innerHTML = `<td>${b.gamerTag}</td><td>${b.motivo}</td><td>${b.executor}</td><td>${d.toLocaleString('pt-BR')}</td>`;
      tbody.appendChild(tr);
    });

    // 3️⃣ Top players
    const topRes = await fetch(`${URL}minecraft-top/${encodeURIComponent(currentServer)}`);
    const topData = await topRes.json();
    document.getElementById("top1").textContent = topData[0]?.name || "---";
    document.getElementById("top2").textContent = topData[1]?.name || "---";
    document.getElementById("top3").textContent = topData[2]?.name || "---";

    // 4️⃣ Chat
    const chatRes = await fetch(`${URL}minecraft-chat/${encodeURIComponent(currentServer)}`);
    const chatData = await chatRes.json();
    const chat = document.getElementById("chat-box");
    chat.innerHTML = "";
    chatData.forEach(m => {
      const div = document.createElement("div");
      div.className = "chat-message";
      div.innerHTML = `<span>${m.user}</span>: ${m.text}`;
      chat.appendChild(div);
    });
    chat.scrollTop = chat.scrollHeight;

  } catch (e) {
    console.error("Erro ao atualizar:", e);
  }
}


// ====================
// Ban / Unban
// ====================
document.getElementById("ban-button").onclick = async () => {
  const name = document.getElementById("ban-gamertag").value.trim();
  const motivo = document.getElementById("ban-motivo").value.trim() || "Sem motivo";
  if (!name || !currentServer) return;
  await fetch(`${URL}minecraft-banir/${encodeURIComponent(currentServer)}`, {
    method:"POST", headers:{"Content-Type":"application/json"},
    body:JSON.stringify({gamerTag:name, motivo, executor:"Painel"})
  });
  atualizarTudo();
};

document.getElementById("unban-button").onclick = async () => {
  const name = document.getElementById("unban-gamertag").value.trim();
  if (!name || !currentServer) return;
  await fetch(`${URL}minecraft-desbanir/${encodeURIComponent(currentServer)}`, {
    method:"POST", headers:{"Content-Type":"application/json"},
    body:JSON.stringify({gamerTag:name, executor:"Painel"})
  });
  atualizarTudo();
};

// ====================
// Chat enviar
// ====================
document.getElementById("chat-send").onclick = async () => {
  const msg = document.getElementById("chat-msg").value.trim();
  if (!msg || !currentServer) return;
  await fetch(`${URL}minecraft-chat/${encodeURIComponent(currentServer)}`, {
    method:"POST", headers:{"Content-Type":"application/json"},
    body:JSON.stringify({user:"Painel", text:msg})
  });
  document.getElementById("chat-msg").value = "";
  atualizarTudo();
};

// Atualizações automáticas a cada 10s
setInterval(()=>{ if(currentServer) atualizarTudo(); }, 10000);

carregarServidores();
</script>
</body>
</html>
