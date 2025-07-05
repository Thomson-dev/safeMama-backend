// models/Visit.js
const mongoose = require("mongoose");

const visitSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  type: {
    type: String,
    enum: ["ANC1", "ANC2", "ANC3", "ANC4", "DELIVERY", "POSTNATAL"],
    required: true,
  },
  date: {
    type: Date,
    default: Date.now,
  },

  healthWorker: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' // Reference to the User model (health worker)
  },
});

export default mongoose.model("Visit", visitSchema);
