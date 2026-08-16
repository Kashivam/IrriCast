"""
Thin JSON bridge — called by the Node.js/Express backend.

This file does NOT modify predict.py, features.py, train.py or any other
existing Python file. It only adds a json.dumps() wrapper around the
function that already exists in predict.py.

Usage (from Node.js via child_process):
    python backend/predict_helper.py Punjab rice
"""
import sys
import json
import pathlib
import warnings

# Suppress statsmodels/sklearn convergence warnings from polluting stdout
warnings.filterwarnings('ignore')

# Add the project root to sys.path so predict.py's own imports work
_ROOT = pathlib.Path(__file__).resolve().parent.parent
sys.path.insert(0, str(_ROOT))

from predict import predict_next_day_iwr  # noqa: E402 — import after path fix

if __name__ == '__main__':
    state = sys.argv[1] if len(sys.argv) > 1 else 'Punjab'
    crop  = sys.argv[2] if len(sys.argv) > 2 else 'rice'
    result = predict_next_day_iwr(state, crop)
    # Print clean JSON (not Python dict repr) so Node.js can JSON.parse it
    print(json.dumps(result))
