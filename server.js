const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Banco de dados em memória (em produção use um banco real)
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
    const adminToken = process.env.ADMIN_TOKEN || 'admin123';
    
    if (authHeader === adminToken) {
        next();
    } else {
        res.status(401).json({ 
            success: false, 
            error: 'Não autorizado' 
        });
    }
}

// Health Check
app.get('/health', (req, res) => {
    res.json({ 
        success: true, 
        message: 'API Online', 
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development'
    });
});

// Rota raiz
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// API Routes

// Gerar key
app.post('/api/generate-key', authAdmin, (req, res) => {
    try {
        const { duration = 3600, maxUses = 1 } = req.body;
        
        if (!duration || duration < 1) {
            return res.status(400).json({ 
                success: false, 
                error: 'Duração deve ser maior que 0' 
            });
        }

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
            expiresAt: newKey.expiresAt,
            message: 'Key gerada com sucesso'
        });
        
    } catch (error) {
        console.error('Erro ao gerar key:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Erro interno do servidor' 
        });
    }
});

// Validar key
app.post('/api/validate-key', (req, res) => {
    try {
        const { key } = req.body;
        
        if (!key) {
            return res.json({ 
                success: false, 
                message: 'Key é obrigatória' 
            });
        }

        const keyData = keys.find(k => k.key === key);
        
        if (!keyData) {
            return res.json({ 
                success: false, 
                message: 'Key não encontrada' 
            });
        }
        
        if (!keyData.isValid) {
            return res.json({ 
                success: false, 
                message: 'Key inválida' 
            });
        }
        
        if (keyData.usedCount >= keyData.maxUses) {
            keyData.isValid = false;
            return res.json({ 
                success: false, 
                message: 'Key já foi utilizada' 
            });
        }
        
        if (new Date() > keyData.expiresAt) {
            keyData.isValid = false;
            return res.json({ 
                success: false, 
                message: 'Key expirada' 
            });
        }
        
        res.json({ 
            success: true, 
            message: 'Key válida',
            usesLeft: keyData.maxUses - keyData.usedCount,
            expiresAt: keyData.expiresAt
        });
        
    } catch (error) {
        console.error('Erro ao validar key:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Erro interno do servidor' 
        });
    }
});

// Login
app.post('/api/keyauth/login', (req, res) => {
    try {
        const { username, password } = req.body;
        
        if (!username || !password) {
            return res.status(400).json({
                success: false,
                message: 'Usuário e senha são obrigatórios'
            });
        }
        
        const user = users.find(u => u.username === username && u.password === password);
        
        if (user) {
            res.json({ 
                success: true, 
                message: 'Login realizado com sucesso',
                user: {
                    username: user.username,
                    createdAt: user.createdAt
                }
            });
        } else {
            res.status(401).json({
                success: false,
                message: 'Usuário ou senha incorretos'
            });
        }
    } catch (error) {
        console.error('Erro no login:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Erro interno do servidor' 
        });
    }
});

// Registro
app.post('/api/keyauth/register', (req, res) => {
    try {
        const { username, password, key } = req.body;
        
        if (!username || !password || !key) {
            return res.status(400).json({
                success: false,
                message: 'Todos os campos são obrigatórios'
            });
        }
        
        // Validar key
        const keyData = keys.find(k => k.key === key);
        if (!keyData) {
            return res.status(400).json({
                success: false,
                message: 'Key não encontrada'
            });
        }
        
        if (!keyData.isValid) {
            return res.status(400).json({
                success: false,
                message: 'Key já foi utilizada ou está inválida'
            });
        }
        
        if (keyData.usedCount >= keyData.maxUses) {
            keyData.isValid = false;
            return res.status(400).json({
                success: false,
                message: 'Key já foi utilizada'
            });
        }
        
        // Verificar se usuário já existe
        if (users.find(u => u.username === username)) {
            return res.status(400).json({
                success: false,
                message: 'Usuário já existe'
            });
        }
        
        // Registrar usuário e usar key
        keyData.usedCount++;
        if (keyData.usedCount >= keyData.maxUses) {
            keyData.isValid = false;
        }
        
        const newUser = {
            username,
            password,
            key,
            createdAt: new Date(),
            expiresAt: keyData.expiresAt
        };
        
        users.push(newUser);
        
        res.json({
            success: true,
            message: 'Registro realizado com sucesso',
            user: {
                username: newUser.username,
                expiresAt: newUser.expiresAt
            }
        });
        
    } catch (error) {
        console.error('Erro no registro:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Erro interno do servidor' 
        });
    }
});

// Listar keys (admin)
app.get('/api/keys', authAdmin, (req, res) => {
    try {
        res.json({
            success: true,
            keys: keys
        });
    } catch (error) {
        console.error('Erro ao listar keys:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Erro interno do servidor' 
        });
    }
});

// Deletar key (admin)
app.delete('/api/keys/:key', authAdmin, (req, res) => {
    try {
        const key = req.params.key;
        const index = keys.findIndex(k => k.key === key);
        
        if (index !== -1) {
            keys.splice(index, 1);
            res.json({ 
                success: true, 
                message: 'Key deletada com sucesso' 
            });
        } else {
            res.status(404).json({ 
                success: false, 
                error: 'Key não encontrada' 
            });
        }
    } catch (error) {
        console.error('Erro ao deletar key:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Erro interno do servidor' 
        });
    }
});

// Estatísticas (admin)
app.get('/api/stats', authAdmin, (req, res) => {
    try {
        res.json({
            success: true,
            stats: {
                totalKeys: keys.length,
                validKeys: keys.filter(k => k.isValid).length,
                usedKeys: keys.filter(k => !k.isValid).length,
                totalUsers: users.length,
                serverUptime: process.uptime(),
                timestamp: new Date().toISOString()
            }
        });
    } catch (error) {
        console.error('Erro ao obter stats:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Erro interno do servidor' 
        });
    }
});

// Rota 404
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        error: 'Rota não encontrada'
    });
});

// Error handler
app.use((error, req, res, next) => {
    console.error('Erro não tratado:', error);
    res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
    });
});

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando na porta ${PORT}`);
    console.log(`🌐 Ambiente: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🔗 Health Check: http://localhost:${PORT}/health`);
    console.log(`🔑 Admin Token: ${process.env.ADMIN_TOKEN || 'admin123'}`);
});

module.exports = app;
