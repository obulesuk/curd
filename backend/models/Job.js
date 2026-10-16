const mongoose = require("mongoose");

const jobSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    company: { type: String, required: true, trim: true },
    location: { type: String, required: true, trim: true },
    jobType: {
      type: String,
      enum: ["Full-time", "Part-time", "Contract", "Remote"],
      default: "Full-time",
    },
    salary: { type: Number, min: 0, default: 0 },
    description: { type: String, required: true, trim: true },
    postedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Job", jobSchema);
