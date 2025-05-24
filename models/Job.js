const mongoose = require("mongoose");

const jobSchema = new mongoose.Schema({
  title: String,
  description: String,
  embedding: [Number],
});

module.exports = mongoose.model("Job", jobSchema);
