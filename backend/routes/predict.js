const router  = require('express').Router();
const { spawn } = require('child_process');
const path     = require('path');
const Prediction = require('../models/Prediction');

const ML_ROOT  = path.join(__dirname, '../../');          // project root (where predict.py lives)
const HELPER   = path.join(__dirname, '../predict_helper.py');

const VALID_STATES = ['Punjab', 'Telangana', 'TamilNadu'];
const VALID_CROPS  = ['rice', 'wheat'];

// ── GET /api/predict/:state/:crop ────────────────────────────────────────────
router.get('/predict/:state/:crop', async (req, res) => {
  const { state, crop } = req.params;

  if (!VALID_STATES.includes(state))
    return res.status(400).json({ error: `Unknown state "${state}". Choose from: ${VALID_STATES.join(', ')}` });
  if (!VALID_CROPS.includes(crop))
    return res.status(400).json({ error: `Unknown crop "${crop}". Choose from: ${VALID_CROPS.join(', ')}` });

  const py = spawn('python', [HELPER, state, crop], { cwd: ML_ROOT });

  let stdout = '';
  let stderr = '';
  py.stdout.on('data', chunk => (stdout += chunk.toString()));
  py.stderr.on('data', chunk => (stderr += chunk.toString()));

  py.on('close', async (code) => {
    if (code !== 0) {
      return res.status(500).json({ error: 'Python prediction failed', detail: stderr.trim() });
    }

    try {
      // stdout may contain warning lines before the JSON — find the JSON line
      const jsonLine = stdout.trim().split('\n').find(l => l.trim().startsWith('{'));
      if (!jsonLine) throw new Error('No JSON found in output');
      const result = JSON.parse(jsonLine);

      // Save to MongoDB (best-effort; no crash if DB is unavailable)
      try {
        await Prediction.create({
          state:            result.state,
          crop:             result.crop,
          predicted_iwr_mm: result.predicted_iwr_mm,
          water_saved_pct:  result.water_saved_pct_vs_traditional,
          as_of_date:       result.as_of_date,
        });
      } catch { /* MongoDB offline — silent */ }

      return res.json(result);
    } catch (e) {
      return res.status(500).json({ error: 'Failed to parse prediction output', detail: e.message, raw: stdout });
    }
  });
});

// ── GET /api/history ─────────────────────────────────────────────────────────
router.get('/history', async (req, res) => {
  try {
    const docs = await Prediction.find().sort({ createdAt: -1 }).limit(20).lean();
    res.json(docs);
  } catch {
    res.json([]); // MongoDB offline
  }
});

module.exports = router;
