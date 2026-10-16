const express = require("express");
const mongoose = require("mongoose");
const Job = require("../models/Job");
const User = require("../models/User");

const router = express.Router();
const JOB_TYPES = ["Full-time", "Part-time", "Contract", "Remote"];

function validText(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function validateJobFields(data, partial = false) {
  const required = ["title", "company", "location", "description"];
  if (!partial) required.push("postedBy");

  for (const field of required) {
    if (!validText(data[field])) return `${field} is required.`;
  }
  if (data.jobType !== undefined && !JOB_TYPES.includes(data.jobType)) {
    return "Invalid job type.";
  }
  if (
    data.salary !== undefined &&
    (data.salary === "" || !Number.isFinite(Number(data.salary)) || Number(data.salary) < 0)
  ) {
    return "Salary must be a non-negative number.";
  }
  return null;
}

// POST /api/jobs
router.post("/", async (req, res) => {
  try {
    const { title, company, location, jobType, salary, description, postedBy } = req.body;
    const errorMessage = validateJobFields(
      { title, company, location, description, jobType, salary, postedBy },
      false
    );
    if (errorMessage) return res.status(400).json({ message: errorMessage });

    // The React form now sends an ID from the users dropdown, not "1236".
    if (!mongoose.isValidObjectId(postedBy)) {
      return res.status(400).json({
        message: "Choose a recruiter from the dropdown. The selected User ID is invalid.",
      });
    }

    const user = await User.findById(postedBy).select("_id name email role");
    if (!user) {
      return res.status(404).json({
        message: "The selected user no longer exists. Refresh the user list and choose again.",
      });
    }

    const job = await Job.create({
      title: title.trim(),
      company: company.trim(),
      location: location.trim(),
      jobType: jobType || "Full-time",
      salary: salary === undefined || salary === "" ? 0 : Number(salary),
      description: description.trim(),
      postedBy: user._id,
    });

    const populatedJob = await Job.findById(job._id).populate("postedBy", "name email role");
    return res.status(201).json({
      message: "Job posted successfully.",
      job: populatedJob,
    });
  } catch (error) {
    console.error("Create job error:", error);
    if (error.name === "ValidationError" || error.name === "CastError") {
      return res.status(400).json({ message: error.message });
    }
    return res.status(500).json({ message: "Unable to create job." });
  }
});

// GET /api/jobs
router.get("/", async (_req, res) => {
  try {
    const jobs = await Job.find()
      .populate("postedBy", "name email role")
      .sort({ createdAt: -1 });
    return res.json({ count: jobs.length, jobs });
  } catch (error) {
    console.error("Get jobs error:", error);
    return res.status(500).json({ message: "Unable to retrieve jobs." });
  }
});

// GET /api/jobs/:id
router.get("/:id", async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid job ID." });
    }
    const job = await Job.findById(req.params.id).populate("postedBy", "name email role");
    if (!job) return res.status(404).json({ message: "Job not found." });
    return res.json(job);
  } catch (error) {
    console.error("Get job error:", error);
    return res.status(500).json({ message: "Unable to retrieve job." });
  }
});

// PUT /api/jobs/:id - update only allowed job fields, never postedBy
router.put("/:id", async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid job ID." });
    }
    const allowed = ["title", "company", "location", "jobType", "salary", "description"];
    const updates = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }
    if (!Object.keys(updates).length) {
      return res.status(400).json({ message: "Provide at least one field to update." });
    }

    const existing = await Job.findById(req.params.id);
    if (!existing) return res.status(404).json({ message: "Job not found." });

    const merged = {
      title: updates.title ?? existing.title,
      company: updates.company ?? existing.company,
      location: updates.location ?? existing.location,
      description: updates.description ?? existing.description,
      jobType: updates.jobType ?? existing.jobType,
      salary: updates.salary ?? existing.salary,
    };
    const errorMessage = validateJobFields(merged, true);
    if (errorMessage) return res.status(400).json({ message: errorMessage });

    for (const field of ["title", "company", "location", "description"]) {
      if (updates[field] !== undefined) {
        if (!validText(updates[field])) {
          return res.status(400).json({ message: `${field} cannot be empty.` });
        }
        updates[field] = updates[field].trim();
      }
    }
    if (updates.salary !== undefined) updates.salary = Number(updates.salary);

    const job = await Job.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { new: true, runValidators: true }
    ).populate("postedBy", "name email role");

    return res.json({ message: "Job updated successfully.", job });
  } catch (error) {
    console.error("Update job error:", error);
    if (error.name === "ValidationError" || error.name === "CastError") {
      return res.status(400).json({ message: error.message });
    }
    return res.status(500).json({ message: "Unable to update job." });
  }
});

// DELETE /api/jobs/:id
router.delete("/:id", async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid job ID." });
    }
    const job = await Job.findByIdAndDelete(req.params.id);
    if (!job) return res.status(404).json({ message: "Job not found." });
    return res.json({ message: "Job deleted successfully." });
  } catch (error) {
    console.error("Delete job error:", error);
    return res.status(500).json({ message: "Unable to delete job." });
  }
});

module.exports = router;
