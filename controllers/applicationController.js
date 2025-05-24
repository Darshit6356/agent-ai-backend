const Application = require("../models/Application");
const Job = require("../models/Job");
const Candidate = require("../models/Candidate");
const { getEmbedding, cosineSimilarity } = require("../utils/geminiUtils");
const { validationResult } = require("express-validator");

const applyForJob = async (req, res) => {
  try {
    const { jobId, coverLetter } = req.body;

    // Check if job exists and is active
    const job = await Job.findOne({ _id: jobId, isActive: true });
    if (!job) {
      return res
        .status(404)
        .json({ error: "Job not found or no longer active" });
    }

    // Check if user already applied
    const existingApplication = await Application.findOne({
      jobId,
      candidateId: req.user._id,
    });

    if (existingApplication) {
      return res
        .status(400)
        .json({ error: "You have already applied for this job" });
    }

    // Get candidate data for matching
    const candidate = await Candidate.findOne({ userId: req.user._id });
    let matchScore = 0;

    if (candidate && candidate.embedding && job.embedding) {
      matchScore = cosineSimilarity(candidate.embedding, job.embedding);
    }

    // Create application
    const application = new Application({
      jobId,
      candidateId: req.user._id,
      candidateEmail: req.user.email,
      candidateName: req.user.name,
      resumeText: candidate?.resumeText || "",
      coverLetter,
      matchScore,
    });

    await application.save();

    // Update job applications count
    await Job.findByIdAndUpdate(jobId, { $inc: { applicationsCount: 1 } });

    res.status(201).json({
      message: "Application submitted successfully",
      application: {
        id: application._id,
        jobId: application.jobId,
        status: application.status,
        matchScore: application.matchScore,
        appliedAt: application.appliedAt,
      },
    });
  } catch (error) {
    console.error("Apply for job error:", error);
    res.status(500).json({ error: "Server error" });
  }
};

const getMyApplications = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const applications = await Application.find({ candidateId: req.user._id })
      .populate("jobId", "title company location jobType salary")
      .sort({ appliedAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Application.countDocuments({
      candidateId: req.user._id,
    });

    res.json({
      applications,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total,
      },
    });
  } catch (error) {
    console.error("Get my applications error:", error);
    res.status(500).json({ error: "Server error" });
  }
};

const getJobApplications = async (req, res) => {
  try {
    const { jobId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Verify job belongs to the HR manager
    const job = await Job.findOne({ _id: jobId, postedBy: req.user._id });
    if (!job) {
      return res.status(404).json({ error: "Job not found or unauthorized" });
    }

    const { status } = req.query;
    const filter = { jobId };

    if (status) {
      filter.status = status;
    }

    const applications = await Application.find(filter)
      .populate("candidateId", "name email profile")
      .sort({ matchScore: -1, appliedAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Application.countDocuments(filter);

    res.json({
      applications,
      job: {
        title: job.title,
        company: job.company,
      },
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total,
      },
    });
  } catch (error) {
    console.error("Get job applications error:", error);
    res.status(500).json({ error: "Server error" });
  }
};

const updateApplicationStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    const application = await Application.findById(id).populate("jobId");

    if (!application) {
      return res.status(404).json({ error: "Application not found" });
    }

    // Verify the job belongs to the HR manager
    if (application.jobId.postedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    application.status = status;
    application.notes = notes;
    application.reviewedAt = new Date();
    application.reviewedBy = req.user._id;

    await application.save();

    res.json({
      message: "Application status updated successfully",
      application,
    });
  } catch (error) {
    console.error("Update application status error:", error);
    res.status(500).json({ error: "Server error" });
  }
};

const getApplicationById = async (req, res) => {
  try {
    const application = await Application.findById(req.params.id)
      .populate("jobId")
      .populate("candidateId", "name email profile")
      .populate("reviewedBy", "name email");

    if (!application) {
      return res.status(404).json({ error: "Application not found" });
    }

    // Check authorization
    const isCandidate =
      application.candidateId._id.toString() === req.user._id.toString();
    const isHR =
      application.jobId.postedBy.toString() === req.user._id.toString();

    if (!isCandidate && !isHR) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    res.json(application);
  } catch (error) {
    console.error("Get application error:", error);
    res.status(500).json({ error: "Server error" });
  }
};

module.exports = {
  applyForJob,
  getMyApplications,
  getJobApplications,
  updateApplicationStatus,
  getApplicationById,
};
