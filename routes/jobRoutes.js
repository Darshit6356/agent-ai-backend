const express = require("express");
const { body } = require("express-validator");
const router = express.Router();
const { auth, authorize } = require("../middleware/auth");
const {
  createJob,
  getAllJobs,
  getJobById,
  getMyJobs,
  updateJob,
  deleteJob,
} = require("../controllers/jobController");

// Validation middleware
const jobValidation = [
  body("title")
    .trim()
    .isLength({ min: 3 })
    .withMessage("Title must be at least 3 characters"),
  body("description")
    .trim()
    .isLength({ min: 10 })
    .withMessage("Description must be at least 10 characters"),
  body("company")
    .trim()
    .isLength({ min: 2 })
    .withMessage("Company name is required"),
  body("location")
    .trim()
    .isLength({ min: 2 })
    .withMessage("Location is required"),
];

// Public routes
router.get("", getAllJobs);
router.get("/:id", getJobById);

// Protected routes
router.post("", auth, authorize("hrmanager"), jobValidation, createJob);
router.get("/my/jobs", auth, authorize("hrmanager"), getMyJobs);
router.put("/:id", auth, authorize("hrmanager"), updateJob);
router.delete("/:id", auth, authorize("hrmanager"), deleteJob);

module.exports = router;
