const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const dotenv = require("dotenv");
const apiKey = require("./middleware/apiKey");

// Load env vars
dotenv.config();

const app = express();

// Middlewares
app.use(cors());
app.use(morgan("dev"));
app.use(express.json());
// app.use(apiKey); // Apply the API key middleware
app.use("/api/uploads", express.static("uploads")); // serve images

// Routes
app.use("/api/test", require("./routes/testRoutes"));

app.use("/api/auth", require("./routes/authRoutes"));

app.use("/api/user", require("./routes/userRoutes"));

// Add more route imports as needed

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () =>
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`)
);
