const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const dotenv = require("dotenv");

dotenv.config();

const app = express();
app.use(express.json());

// 🔒 Security middleware
app.use(helmet());
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
  })
);

// 🚦 Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit per IP
});
app.use(limiter);

// 📦 Body parsing middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// 🔗 MongoDB connection
mongoose
  .connect(
    process.env.MONGODB_URI ||
      process.env.MONGO_URI ||
      "mongodb://localhost:27017/jobportal",
    {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    }
  )
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB connection error:", err));

console.log("Registering auth routes");
app.use("/api/auth", require("./routes/authRoutes"));

console.log("Registering job routes");
app.use("/api/jobs", require("./routes/jobRoutes"));

console.log("Registering application routes");
app.use("/api/applications", require("./routes/applicationRoutes"));

console.log("Registering resume routes");
app.use("/api/resume", require("./routes/resumeRoutes"));

// ✅ Health check
app.get("/health", (req, res) => {
  res.json({ status: "OK", timestamp: new Date().toISOString() });
});

// 🛠 Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Something went wrong!" });
});

// 🚀 Server start
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;
