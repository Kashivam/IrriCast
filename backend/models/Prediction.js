const mongoose = require('mongoose');

const predictionSchema = new mongoose.Schema(
  {
    state:           { type: String, required: true },
    crop:            { type: String, required: true },
    predicted_iwr_mm:{ type: Number, required: true },
    water_saved_pct: { type: Number },
    as_of_date:      { type: String },
  },
  { timestamps: true }   // adds createdAt + updatedAt automatically
);

module.exports = mongoose.model('Prediction', predictionSchema);
