const express = require('express');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Banco de dados em memória
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

// Middleware admin
function authAdmin(req, res, next) {
    const authHeader = req.headers.authorization;
    if (authHeader === 'admin123') {
        next();
    } else {
        res.status(401).json({ success: false, error: 'Não autorizado' });
    }
}

// Rotas da API

// Gerar key
app.post('/api/generate-key', authAdmin, (req, res) => {
    try {
        const { duration = 3600, maxUses = 1 } = req.body;
        
        const newKey = {
            key: generateKey(),
            createdAt: new Date(),
            expiresAt: new Date(Date.now() + (duration * 1000)),
            maxUses: parseInt(maxUses),
            usedCount: 0,
            isValid: true
        };

        keys.push(newKey);
        res.json({ 
            success: true, 
            key: newKey.key,
            expiresAt: newKey.expiresAt
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Validar key
app.post('/api/validate-key', (req, res) => {
    try {
        const { key } = req.body;
        
        // Simulação - sempre válida se começar com zryder
        if (key && key.startsWith('zryder')) {
            res.json({ 
                success: true, 
                message: 'Key válida',
                usesLeft: 1
            });
        } else {
            res.json({ 
                success: false, 
                message: 'Key inválida' 
            });
        }
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Login
app.post('/api/keyauth/login', (req, res) => {
    try {
        const { username, password } = req.body;
        const user = users.find(u => u.username === username && u.password === password);
        
        if (user) {
            res.json({ success: true, message: 'Login realizado com sucesso' });
        } else {
            res.json({ success: false, message: 'Credenciais inválidas' });
        }
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Registro
app.post('/api/keyauth/register', (req, res) => {
    try {
        const { username, password, key } = req.body;
        
        // Verificar se key é válida
        if (!key.startsWith('zryder')) {
            return res.json({ success: false, message: 'Key inválida' });
        }
        
        // Verificar se usuário já existe
        if (users.find(u => u.username === username)) {
            return res.json({ success: false, message: 'Usuário já existe' });
        }
        
        // Registrar usuário
        users.push({ username, password, key, createdAt: new Date() });
        res.json({ success: true, message: 'Registro realizado com sucesso' });
        
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Listar keys
app.get('/api/keys', authAdmin, (req, res) => {
    res.json({ success: true, keys: keys });
});

// Deletar key
app.delete('/api/keys/:key', authAdmin, (req, res) => {
    try {
        const key = req.params.key;
        const index = keys.findIndex(k => k.key === key);
        
        if (index !== -1) {
            keys.splice(index, 1);
            res.json({ success: true, message: 'Key deletada' });
        } else {
            res.status(404).json({ success: false, error: 'Key não encontrada' });
        }
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Estatísticas
app.get('/api/stats', authAdmin, (req, res) => {
    res.json({
        success: true,
        totalKeys: keys.length,
        validKeys: keys.filter(k => k.isValid).length,
        usedKeys: keys.filter(k => !k.isValid).length,
        totalUsers: users.length
    });
});

// Health check
app.get('/api/health', (req, res) => {
    res.json({ 
        success: true, 
        message: 'API Online',
        timestamp: new Date().toISOString()
    });
});

app.listen(PORT, () => {
    console.log(`✅ Servidor rodando: https://minecraft-backend-xevp.onrender.com`);
    console.log(`🔑 Admin Token: admin123`);
});
