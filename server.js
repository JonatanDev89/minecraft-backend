const express = require('express');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3000;

// Configuração CORS mais permissiva
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
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
    console.log('Auth header:', authHeader); // Debug
    
    if (authHeader === 'admin123') {
        next();
    } else {
        res.status(401).json({ 
            success: false, 
            error: 'Não autorizado - Token: ' + (authHeader || 'vazio')
        });
    }
}

// Health Check - SEM AUTENTICAÇÃO
app.get('/api/health', (req, res) => {
    res.json({ 
        success: true, 
        message: '✅ API Online e Funcionando!',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development'
    });
});

// Stats - COM AUTENTICAÇÃO
app.get('/api/stats', authAdmin, (req, res) => {
    try {
        const stats = {
            success: true,
            totalKeys: keys.length,
            validKeys: keys.filter(k => k.isValid).length,
            usedKeys: keys.filter(k => !k.isValid).length,
            totalUsers: users.length,
            serverTime: new Date().toISOString()
        };
        
        console.log('Stats requested:', stats); // Debug
        res.json(stats);
        
    } catch (error) {
        console.error('Stats error:', error);
        res.status(500).json({ success: false, error: 'Erro interno' });
    }
});

// Gerar key
app.post('/api/generate-key', authAdmin, (req, res) => {
    try {
        const { duration = 3600, maxUses = 1 } = req.body;
        
        console.log('Generate key request:', { duration, maxUses }); // Debug
        
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
        
        console.log('Key generated:', newKey.key); // Debug
        
        res.json({ 
            success: true, 
            key: newKey.key,
            expiresAt: newKey.expiresAt,
            message: 'Key gerada com sucesso!'
        });
        
    } catch (error) {
        console.error('Generate key error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Erro interno do servidor' 
        });
    }
});

// Validar key - SEM AUTENTICAÇÃO
app.post('/api/validate-key', (req, res) => {
    try {
        const { key } = req.body;
        
        console.log('Validate key request:', key); // Debug
        
        if (!key) {
            return res.json({ 
                success: false, 
                message: 'Key é obrigatória' 
            });
        }

        // Simulação - sempre válida se começar com zryder
        if (key && key.startsWith('zryder')) {
            res.json({ 
                success: true, 
                message: '✅ Key válida!',
                usesLeft: 1,
                expiresAt: new Date(Date.now() + 86400000) // 1 dia
            });
        } else {
            res.json({ 
                success: false, 
                message: '❌ Key inválida' 
            });
        }
        
    } catch (error) {
        console.error('Validate key error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Erro interno do servidor' 
        });
    }
});

// Login - SEM AUTENTICAÇÃO
app.post('/api/keyauth/login', (req, res) => {
    try {
        const { username, password } = req.body;
        
        console.log('Login attempt:', username); // Debug
        
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
                message: '✅ Login realizado com sucesso!',
                user: {
                    username: user.username,
                    createdAt: user.createdAt
                }
            });
        } else {
            res.status(401).json({
                success: false,
                message: '❌ Usuário ou senha incorretos!'
            });
        }
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Erro interno do servidor' 
        });
    }
});

// Registro - SEM AUTENTICAÇÃO
app.post('/api/keyauth/register', (req, res) => {
    try {
        const { username, password, key } = req.body;
        
        console.log('Register attempt:', username, key); // Debug
        
        if (!username || !password || !key) {
            return res.status(400).json({
                success: false,
                message: 'Todos os campos são obrigatórios'
            });
        }
        
        // Verificar key - sempre válida se começar com zryder
        if (!key.startsWith('zryder')) {
            return res.status(400).json({
                success: false,
                message: '❌ Key inválida!'
            });
        }
        
        // Verificar se usuário já existe
        if (users.find(u => u.username === username)) {
            return res.status(400).json({
                success: false,
                message: '❌ Usuário já existe!'
            });
        }
        
        // Registrar usuário
        const newUser = {
            username,
            password,
            key,
            createdAt: new Date()
        };
        
        users.push(newUser);
        
        console.log('User registered:', username); // Debug
        
        res.json({
            success: true,
            message: '✅ Registro realizado com sucesso!',
            user: {
                username: newUser.username
            }
        });
        
    } catch (error) {
        console.error('Register error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Erro interno do servidor' 
        });
    }
});

// Listar keys - COM AUTENTICAÇÃO
app.get('/api/keys', authAdmin, (req, res) => {
    try {
        console.log('Keys list requested'); // Debug
        res.json({
            success: true,
            keys: keys
        });
    } catch (error) {
        console.error('List keys error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Erro interno do servidor' 
        });
    }
});

// Deletar key - COM AUTENTICAÇÃO
app.delete('/api/keys/:key', authAdmin, (req, res) => {
    try {
        const key = req.params.key;
        console.log('Delete key request:', key); // Debug
        
        const index = keys.findIndex(k => k.key === key);
        
        if (index !== -1) {
            keys.splice(index, 1);
            res.json({ 
                success: true, 
                message: '✅ Key deletada com sucesso!' 
            });
        } else {
            res.status(404).json({ 
                success: false, 
                error: '❌ Key não encontrada' 
            });
        }
    } catch (error) {
        console.error('Delete key error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Erro interno do servidor' 
        });
    }
});

// Rota padrão
app.get('/', (req, res) => {
    res.json({
        success: true,
        message: '🚀 API Key System Online!',
        endpoints: {
            health: '/api/health',
            stats: '/api/stats',
            generateKey: '/api/generate-key',
            validateKey: '/api/validate-key',
            login: '/api/keyauth/login',
            register: '/api/keyauth/register',
            listKeys: '/api/keys'
        },
        adminToken: 'admin123'
    });
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
app.listen(PORT, '0.0.0.0', () => {
    console.log('🚀 =================================');
    console.log('✅ SERVIDOR INICIADO COM SUCESSO!');
    console.log('🚀 =================================');
    console.log(`📡 Porta: ${PORT}`);
    console.log(`🌐 URL: http://localhost:${PORT}`);
    console.log(`🔑 Token Admin: admin123`);
    console.log(`🩺 Health Check: http://localhost:${PORT}/api/health`);
    console.log('🚀 =================================');
    
    // Adicionar algumas keys de exemplo
    const exampleKey = {
        key: 'zryder' + 'A'.repeat(26),
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 86400000),
        maxUses: 1,
        usedCount: 0,
        isValid: true
    };
    keys.push(exampleKey);
    console.log('🔑 Key de exemplo criada:', exampleKey.key);
});

module.exports = app;
