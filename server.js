const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const eventosRouter = require('./routes/eventos');

const app = express();

// ═══════════════════════════════════════════
// MIDDLEWARE
// ═══════════════════════════════════════════
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// ═══════════════════════════════════════════
// CONEXIÓN A MONGODB ATLAS
// ═══════════════════════════════════════════
const mongoURL = 'mongodb+srv://mariachi_user:mariachi2026@mariachi-cluster.vo4alil.mongodb.net/gestion_mariachi?appName=mariachi-cluster';

mongoose.connect(mongoURL)
  .then(() => console.log('✅ Conectado a MongoDB Atlas'))
  .catch(err => console.error('❌ Error conectando a MongoDB:', err));

// ═══════════════════════════════════════════
// RUTAS DE EVENTOS
// ═══════════════════════════════════════════
app.use('/api/eventos', eventosRouter);

// ═══════════════════════════════════════════
// NUEVA RUTA: AUTENTICACIÓN (Login)
// Lee credenciales desde MongoDB Atlas
// ═══════════════════════════════════════════
app.post('/api/auth/login', async (req, res) => {
  try {
    const { password } = req.body;

    // Leer credenciales desde la BD
    const credenciales = await mongoose.connection.collection('credenciales').findOne({ tipo: 'acceso' });

    // Si no existen credenciales en la BD, error
    if (!credenciales) {
      return res.status(500).json({
        success: false,
        mensaje: 'Error: credenciales no configuradas en la BD'
      });
    }

    const ADMIN_PASSWORD = credenciales.admin_password;
    const INTEGRANTE_CODE = credenciales.integrante_code;
    const JWT_SECRET = credenciales.jwt_secret;
    const TOKEN_DURATION = credenciales.token_duration;

    // Verificar si es ADMIN
    if (password === ADMIN_PASSWORD) {
      const token = jwt.sign(
        { rol: 'admin' },
        JWT_SECRET,
        { expiresIn: TOKEN_DURATION }
      );

      return res.json({
        success: true,
        token: token,
        rol: 'admin',
        mensaje: 'Acceso de administrador'
      });
    }

    // Verificar si es INTEGRANTE
    if (password === INTEGRANTE_CODE) {
      const token = jwt.sign(
        { rol: 'integrante' },
        JWT_SECRET,
        { expiresIn: TOKEN_DURATION }
      );

      return res.json({
        success: true,
        token: token,
        rol: 'integrante',
        mensaje: 'Acceso de integrante'
      });
    }

    // Si no coincide nada, error
    res.status(401).json({
      success: false,
      mensaje: 'Contraseña o código inválido'
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ═══════════════════════════════════════════
// SERVIDOR
// ═══════════════════════════════════════════
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`🎺 Servidor escuchando en http://localhost:${PORT}`);
});