const router = require('express').Router();
const path   = require('fs');
const fs     = require('fs');

const RESULTS = require('path').join(__dirname, '../../results');

function send(filename) {
  return (req, res) => {
    try {
      res.json(JSON.parse(fs.readFileSync(`${RESULTS}/${filename}`, 'utf8')));
    } catch (e) {
      res.status(500).json({ error: `Could not read ${filename}`, detail: e.message });
    }
  };
}

router.get('/results/metrics',            send('metrics.json'));
router.get('/results/historical',         send('historical.json'));
router.get('/results/feature_importance', send('feature_importance.json'));
router.get('/results/water_savings',      send('water_savings.json'));

module.exports = router;
