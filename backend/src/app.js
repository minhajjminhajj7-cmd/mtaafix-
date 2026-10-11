const express = require("express");
const cors = require("cors");
const path = require("path");

const categoryRoutes = require("./routes/categoryRoutes");
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const reportRoutes = require("./routes/reportRoutes");
const incidentRoutes = require("./routes/incidentRoutes");
const problemTypeRoutes = require("./routes/problemTypeRoutes");
const serviceProviderRoutes = require("./routes/serviceProviderRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const analyticsRoutes = require("./routes/analyticsRoutes");

const app = express();

app.use(cors());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  "/uploads",
  express.static(
    path.join(process.cwd(), "uploads")
  )
);

app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "MtaaFix API is running"
  });
});

app.use("/api/categories", categoryRoutes);
app.use("/api/problem-types", problemTypeRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/incidents", incidentRoutes);
app.use("/api/service-providers", serviceProviderRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/analytics", analyticsRoutes);

// Upload/error handler
app.use((error, req, res, next) => {
  console.error("Request error:", error);

  if (error && error.name === "MulterError") {
    return res.status(400).json({
      success: false,
      message:
        error.code === "LIMIT_FILE_SIZE"
          ? "Media file exceeds the allowed size"
          : error.message
    });
  }

  if (
    error &&
    error.message &&
    error.message.startsWith(
      "Unsupported media format:"
    )
  ) {
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }

  return res.status(500).json({
    success: false,
    message: "Something went wrong while processing the request"
  });
});

module.exports = app;
