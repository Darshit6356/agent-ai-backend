const express = require("express");
const { body } = require("express-validator");
const router = express.Router();
const { auth } = require("../middleware/auth");
const {
  register,
  login,
  getProfile,
  updateProfile,
} = require("../controllers/authController");

// Validation middleware
const registerValidation = [
  body("name")
    .trim()
    .isLength({ min: 2 })
    .withMessage("Name must be at least 2 characters"),
  body("email").isEmail().withMessage("Please provide a valid email"),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters"),
  body("role")
    .isIn(["jobseeker", "hrmanager"])
    .withMessage("Role must be either jobseeker or hrmanager"),
];

const loginValidation = [
  body("email").isEmail().withMessage("Please provide a valid email"),
  body("password").notEmpty().withMessage("Password is required"),
];

// Routes
router.post("/register", registerValidation, register);
router.post("/login", login);
router.get("/profile", auth, getProfile);
router.put("/profile", auth, updateProfile);

module.exports = router;
