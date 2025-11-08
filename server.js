const express = require('express');
const cors = require('cors');
const app = express();
const PORT = 3000;

// Configuração CORS mais permissiva
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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

// Rota de teste
app.get('/api/test', (req, res) => {
    res.json({ success: true, message: 'API funcionando!' });
});

// Gerar key
app.post('/api/generate-key', authAdmin, (req, res) => {
    try {
        const { duration, maxUses } = req.body;
        
        const newKey = {
            key: generateKey(),
            createdAt: new Date(),
            expiresAt: new Date(Date.now() + (duration * 1000)),
            maxUses: maxUses || 1,
            usedCount: 0,
            isValid: true
        };

        keys.push(newKey);
        res.json({ success: true, key: newKey.key });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Validar key
app.post('/api/validate-key', (req, res) => {
    try {
        const { key } = req.body;
        const keyData = keys.find(k => k.key === key);
        
        if (!keyData) {
            return res.json({ success: false, message: 'Key não encontrada' });
        }
        
        if (!keyData.isValid) {
            return res.json({ success: false, message: 'Key inválida' });
        }
        
        if (keyData.usedCount >= keyData.maxUses) {
            keyData.isValid = false;
            return res.json({ success: false, message: 'Key já usada' });
        }
        
        if (new Date() > keyData.expiresAt) {
            keyData.isValid = false;
            return res.json({ success: false, message: 'Key expirada' });
        }
        
        res.json({ 
            success: true, 
            message: 'Key válida',
            usesLeft: keyData.maxUses - keyData.usedCount 
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Login
app.post('/api/keyauth/login', (req, res) => {
    try {
        const { username, password } = req.body;
        
        if (!username || !password) {
            return res.json({ success: false, message: 'Usuário e senha são obrigatórios' });
        }
        
        const user = users.find(u => u.username === username && u.password === password);
        
        if (user) {
            res.json({ success: true, message: 'Login realizado com sucesso' });
        } else {
            res.json({ success: false, message: 'Usuário ou senha incorretos' });
        }
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Registro
app.post('/api/keyauth/register', (req, res) => {
    try {
        const { username, password, key } = req.body;
        
        if (!username || !password || !key) {
            return res.json({ success: false, message: 'Todos os campos são obrigatórios' });
        }
        
        // Verificar key
        const keyData = keys.find(k => k.key === key);
        if (!keyData) {
            return res.json({ success: false, message: 'Key não encontrada' });
        }
        
        if (!keyData.isValid) {
            return res.json({ success: false, message: 'Key já foi utilizada' });
        }
        
        if (keyData.usedCount >= keyData.maxUses) {
            keyData.isValid = false;
            return res.json({ success: false, message: 'Key já foi utilizada' });
        }
        
        // Verificar usuário
        if (users.find(u => u.username === username)) {
            return res.json({ success: false, message: 'Usuário já existe' });
        }
        
        // Registrar usuário
        keyData.usedCount++;
        if (keyData.usedCount >= keyData.maxUses) {
            keyData.isValid = false;
        }
        
        users.push({ username, password, key, createdAt: new Date() });
        res.json({ success: true, message: 'Registro realizado com sucesso' });
        
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Listar keys
app.get('/api/keys', authAdmin, (req, res) => {
    res.json(keys);
});

// Deletar key
app.delete('/api/keys/:key', authAdmin, (req, res) => {
    const key = req.params.key;
    const index = keys.findIndex(k => k.key === key);
    
    if (index !== -1) {
        keys.splice(index, 1);
        res.json({ success: true, message: 'Key deletada' });
    } else {
        res.status(404).json({ success: false, error: 'Key não encontrada' });
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

// Servir arquivos estáticos
app.use(express.static('.'));

app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ Servidor rodando: http://localhost:${PORT}`);
    console.log(`🔑 Painel admin: http://localhost:${PORT}/index.html`);
    console.log(`🔄 Teste da API: http://localhost:${PORT}/api/test`);
});
