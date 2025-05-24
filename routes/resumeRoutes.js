const express = require("express");
const multer = require("multer");
const router = express.Router();
const {
  uploadResume,
  addJob,
  matchCandidates
} = require("../controllers/resumeController");

const upload = multer();

router.post("/upload", upload.single("resume"), uploadResume);
router.post("/job", addJob);
router.get("/match/:jobId", matchCandidates);

module.exports = router;
