const express = require("express");
const { body } = require("express-validator");
const router = express.Router();
const { auth, authorize } = require("../middleware/auth");
const {
  applyForJob,
  getMyApplications,
  getJobApplications,
  updateApplicationStatus,
  getApplicationById,
} = require("../controllers/applicationController");

// Validation middleware
const applyValidation = [
  body("jobId").isMongoId().withMessage("Valid job ID is required"),
];

const statusUpdateValidation = [
  body("status")
    .isIn(["pending", "reviewed", "shortlisted", "rejected", "hired"])
    .withMessage("Invalid status"),
];

// Routes
router.post(
  "/apply",
  auth,
  authorize("jobseeker"),
  applyValidation,
  applyForJob
);
router.get("/my", auth, authorize("jobseeker"), getMyApplications);
router.get("/job/:jobId", auth, authorize("hrmanager"), getJobApplications);
router.put(
  "/:id/status",
  auth,
  authorize("hrmanager"),
  statusUpdateValidation,
  updateApplicationStatus
);
router.get("/:id", auth, getApplicationById);

module.exports = router;
