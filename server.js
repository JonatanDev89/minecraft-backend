const express = require('express');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // IMPORTANTE para dados simples

// Banco de dados
let keys = [];
let users = [];

// Gerar key
function generateKey() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let key = 'zryder';
    for (let i = 0; i < 26; i++) {
        key += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return key;
}

// Login - aceita dados simples
app.post('/api/keyauth/login', (req, res) => {
    const { username, password } = req.body;
    
    console.log('Login attempt:', username); // Debug
    
    const user = users.find(u => u.username === username && u.password === password);
    
    if (user) {
        res.json({ success: true, message: "Login ok" });
    } else {
        res.json({ success: false, message: "Login falhou" });
    }
});

// Registro - aceita dados simples
app.post('/api/keyauth/register', (req, res) => {
    const { username, password, key } = req.body;
    
    console.log('Register attempt:', username, key); // Debug
    
    // Verifica se key existe
    const keyExists = keys.some(k => k.key === key) || key.startsWith('zryder');
    
    if (!keyExists) {
        return res.json({ success: false, message: "Key inválida" });
    }
    
    // Verifica se usuário já existe
    if (users.some(u => u.username === username)) {
        return res.json({ success: false, message: "Usuário já existe" });
    }
    
    // Adiciona usuário
    users.push({ username, password, key });
    res.json({ success: true, message: "Conta criada" });
});

// Validar key
app.post('/api/validate-key', (req, res) => {
    const { key } = req.body;
    
    // Simulação - sempre retorna válida se começar com zryder
    if (key && key.startsWith('zryder')) {
        res.json({ success: true, message: "Key válida" });
    } else {
        res.json({ success: false, message: "Key inválida" });
    }
});

// Gerar key de teste
app.post('/api/generate-test-key', (req, res) => {
    const newKey = generateKey();
    keys.push({ key: newKey, used: false });
    res.json({ success: true, key: newKey });
});

// Estatísticas
app.get('/api/stats', (req, res) => {
    res.json({
        success: true,
        totalKeys: keys.length,
        totalUsers: users.length
    });
});

app.listen(PORT, () => {
    console.log(`✅ Servidor rodando: http://localhost:${PORT}`);
});
