const mongoose = require("mongoose");

const candidateSchema = new mongoose.Schema({
  name: String,
  email: String,
  resumeText: String,
  embedding: [Number],
});

module.exports = mongoose.model("Candidate", candidateSchema);
