const pdfParse = require("pdf-parse");
const Candidate = require("../models/Candidate");
const Job = require("../models/Job");
const { getEmbedding, cosineSimilarity , callGeminiLLM } = require("../utils/geminiUtils");

const uploadResume = async (req, res) => {
  const { name, email } = req.body;
  // if (!req.file) {
  //   return res.status(400).json({ error: "No resume file uploaded." });
  // }
  const pdfBuffer = req.file.buffer;

  try {
    const data = await pdfParse(pdfBuffer);
    const text = data.text;
    const summary = await callGeminiLLM(text);       // 👈 summarize important info
    const embedding = await getEmbedding(summary);

    const candidate = new Candidate({ name, email, resumeText: summary, embedding });
    await candidate.save();
  } catch (err) {
    console.error("PDF parsing failed:", err);
  }

  

  res.status(200).json({ message: "Resume uploaded successfully" });
};

const addJob = async (req, res) => {
  const { title, description } = req.body;
  const embedding = await getEmbedding(description);

  const job = new Job({ title, description, embedding });
  await job.save();

  res.status(201).json({ message: "Job saved successfully", jobId: job._id });
};

const matchCandidates = async (req, res) => {
  const job = await Job.findById(req.params.jobId);
  const candidates = await Candidate.find();

  const scores = candidates.map(candidate => {
    const score = cosineSimilarity(candidate.embedding, job.embedding);
    return { email:candidate.email, score:score };
  });

  scores.sort((a, b) => b.score - a.score);
  res.json(scores);
};

module.exports = { uploadResume, addJob, matchCandidates };
