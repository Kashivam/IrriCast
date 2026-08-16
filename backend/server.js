require('dotenv').config();
const express  = require('express');
const cors     = require('cors');
const mongoose = require('mongoose');

const app  = express();
const PORT = process.env.PORT || 5000;

// ── Middleware ───────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());

// ── MongoDB ──────────────────────────────────────────────────────────────────
const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/irricast';
mongoose
  .connect(MONGO_URI)
  .then(() => console.log('✅  MongoDB connected →', MONGO_URI))
  .catch(err => console.warn('⚠️   MongoDB unavailable (prediction history disabled).\n    ', err.message));

// ── Routes ───────────────────────────────────────────────────────────────────
app.use('/api', require('./routes/predict'));
app.use('/api', require('./routes/rain'));
app.use('/api', require('./routes/results'));

// Health-check
app.get('/api/health', (_, res) =>
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
);

// ── Start ────────────────────────────────────────────────────────────────────
app.listen(PORT, () =>
  console.log(`\n🚀  IrriCast.in Backend  →  http://localhost:${PORT}\n`)
);
