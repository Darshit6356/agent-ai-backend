const pdfParse = require("pdf-parse");
const Candidate = require("../models/Candidate");
const Application = require("../models/Application");
const Job = require("../models/Job");
const {
  getEmbedding,
  cosineSimilarity,
  callGeminiLLM,
} = require("../utils/geminiUtils");

const uploadResume = async (req, res) => {
  try {
    const { name, email } = req.body;

    if (!req.file) {
      return res.status(400).json({ error: "No resume file uploaded." });
    }

    const pdfBuffer = req.file.buffer;
    const data = await pdfParse(pdfBuffer);
    const text = data.text;

    // Summarize important info using Gemini
    const summary = await callGeminiLLM(text);
    const embedding = await getEmbedding(summary);

    // Check if candidate already exists for this user
    let candidate = await Candidate.findOne({
      userId: req.user._id,
    });

    if (candidate) {
      // Update existing candidate
      candidate.name = name || req.user.name;
      candidate.email = email || req.user.email;
      candidate.resumeText = summary;
      candidate.embedding = embedding;
    } else {
      // Create new candidate
      candidate = new Candidate({
        userId: req.user._id,
        name: name || req.user.name,
        email: email || req.user.email,
        resumeText: summary,
        embedding,
      });
    }

    await candidate.save();

    res.status(200).json({
      message: "Resume uploaded successfully",
      candidate: {
        id: candidate._id,
        name: candidate.name,
        email: candidate.email,
      },
    });
  } catch (err) {
    console.error("Resume upload failed:", err);
    res.status(500).json({ error: "Resume upload failed" });
  }
};

const addJob = async (req, res) => {
  try {
    const { title, description } = req.body;
    const embedding = await getEmbedding(description);

    const job = new Job({
      title,
      description,
      embedding,
      postedBy: req.user._id,
      company: req.user.profile?.company || "Unknown Company",
    });

    await job.save();

    res.status(201).json({
      message: "Job saved successfully",
      jobId: job._id,
    });
  } catch (error) {
    console.error("Add job error:", error);
    res.status(500).json({ error: "Failed to add job" });
  }
};

const matchCandidates = async (req, res) => {
  try {
    const job = await Job.findById(req.params.jobId);

    if (!job) {
      return res.status(404).json({ error: "Job not found" });
    }

    // Verify job belongs to the HR manager
    if (job.postedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    if (!Array.isArray(job.embedding)) {
      return res
        .status(400)
        .json({ error: "Job embedding is missing or invalid." });
    }
    const applications = await Application.find({ jobId: job._id }).populate({
      path: "candidateId",
      select: "name email embedding userId", // Make sure embedding is selected
    });

    const scores = applications
      .map((app) => {
        console.log(app);
        const candidate = app.candidateId;
        if (!candidate || !Array.isArray(candidate.embedding)) {
          console.warn(
            `Skipping application ${app._id}: Invalid candidate or embedding.`
          );
          return null;
        }

        const score = cosineSimilarity(candidate.embedding, job.embedding);
        console.log(score);
        return {
          applicationId: app._id,
          candidateId: candidate._id,
          userId: candidate.userId,
          name: candidate.name,
          email: candidate.email,
          score: score,
        };
      })
      .filter(Boolean); // remove null entries

    scores.sort((a, b) => b.score - a.score);

    res.json({
      job: {
        title: job.title,
        description: job.description,
      },
      matches: scores,
    });
  } catch (error) {
    console.error("Match candidates error:", error);
    res.status(500).json({ error: "Failed to match candidates" });
  }
};

module.exports = { uploadResume, addJob, matchCandidates };
