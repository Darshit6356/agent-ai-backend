const mongoose = require("mongoose");

const applicationSchema = new mongoose.Schema({
  jobId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Job",
    required: true,
  },
  candidateId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  candidateEmail: {
    type: String,
    required: true,
  },
  candidateName: {
    type: String,
    required: true,
  },
  resumeText: String,
  coverLetter: String,
  status: {
    type: String,
    enum: ["pending", "reviewed", "shortlisted", "rejected", "hired"],
    default: "pending",
  },
  matchScore: {
    type: Number,
    default: 0,
  },
  appliedAt: {
    type: Date,
    default: Date.now,
  },
  reviewedAt: Date,
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  notes: String,
});

// Compound index to prevent duplicate applications
applicationSchema.index({ jobId: 1, candidateId: 1 }, { unique: true });

module.exports = mongoose.model("Application", applicationSchema);
