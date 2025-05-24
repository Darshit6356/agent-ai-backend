const express = require("express");
const multer = require("multer");
const router = express.Router();
const { auth, authorize } = require("../middleware/auth");
const {
  uploadResume,
  addJob,
  matchCandidates,
} = require("../controllers/resumeController");

const upload = multer();

// Routes
router.post(
  "/upload",
  auth,
  authorize("jobseeker"),
  upload.single("resume"),
  uploadResume
);
router.post("/job", auth, authorize("hrmanager"), addJob);
router.get("/match/:jobId", auth, authorize("hrmanager"), matchCandidates);

module.exports = router;
