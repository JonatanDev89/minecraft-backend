const URL = "https://minecraft-backend-xevp.onrender.com/";
const server = "Void Essentials";

const lista = document.getElementById("blacklist");
const chatBox = document.getElementById("chat-box");
const chatMsg = document.getElementById("chat-msg");

// ==========================
// === BANIMENTO / DESBAN ===
// ==========================
async function carregarBlacklist() {
    try {
        const res = await fetch(`${URL}minecraft-banir/${encodeURIComponent(server)}`);
        const bans = await res.json();
        lista.innerHTML = "";
        bans.forEach(b => {
            const tr = document.createElement("tr");
            const date = new Date(b.timestamp);
            tr.innerHTML = `
                <td>${b.gamerTag}</td>
                <td>${b.motivo}</td>
                <td>${b.executor}</td>
                <td>${date.toLocaleString("pt-BR")}</td>
            `;
            lista.appendChild(tr);
        });
    } catch (e) {
        console.error("Erro ao carregar blacklist:", e);
    }
}

document.getElementById("ban-button").onclick = async () => {
    const gamerTag = document.getElementById("ban-gamertag").value;
    const motivo = document.getElementById("ban-motivo").value || "Sem motivo";
    await fetch(`${URL}minecraft-banir/${encodeURIComponent(server)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gamerTag, executor: "Painel", motivo })
    });
    await carregarBlacklist();
};

document.getElementById("unban-button").onclick = async () => {
    const gamerTag = document.getElementById("unban-gamertag").value;
    await fetch(`${URL}minecraft-desbanir/${encodeURIComponent(server)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gamerTag, executor: "Painel" })
    });
    await carregarBlacklist();
};

// ==========================
// ====== CHAT DO JOGO ======
// ==========================
async function carregarChat() {
    try {
        const res = await fetch(`${URL}minecraft-chat/${encodeURIComponent(server)}`);
        const mensagens = await res.json();
        chatBox.innerHTML = "";
        mensagens.forEach(m => {
            const div = document.createElement("div");
            div.classList.add("chat-message");
            div.innerHTML = `<span style="color:#00aaff;">${m.user}</span>: ${m.text}`;
            chatBox.appendChild(div);
        });
        chatBox.scrollTop = chatBox.scrollHeight;
    } catch (e) {
        console.error("Erro ao carregar chat:", e);
    }
}

document.getElementById("chat-send").onclick = async () => {
    const mensagem = chatMsg.value.trim();
    if (!mensagem) return;

    await fetch(`${URL}minecraft-chat/${encodeURIComponent(server)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user: "Painel", text: mensagem })
    });

    chatMsg.value = "";
    await carregarChat();
};

// ==========================
// ===== ATUALIZAÇÕES =======
// ==========================
carregarBlacklist();
carregarChat();

// Atualiza automaticamente
setInterval(carregarBlacklist, 10000);
setInterval(carregarChat, 5000);
