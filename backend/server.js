const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

require("dotenv").config();

const userRoutes = require("./routes/userRoutes");
const jobRoutes = require("./routes/jobRoutes");



const app = express();
 
app.use(cors({ origin: "http://localhost:5173" }));
app.use(express.json());

app.get("/", (req, res) => {
  res.json({ message: "Job Portal API is running" });
});

app.use("/api/users", userRoutes);
app.use("/api/jobs", jobRoutes);

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB connected");

    app.listen(PORT, () => {
      console.log(`Server running at http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Server startup failed:", error.message);
    process.exit(1);
  }
}

startServer();