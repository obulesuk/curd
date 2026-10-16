import { useEffect, useState } from "react";
import { api } from "../api.js";

const emptyForm = {
  title: "",
  company: "",
  location: "",
  jobType: "Full-time",
  salary: "",
  description: "",
  postedBy: "",
};

export default function JobPost() {
  const [jobs, setJobs] = useState([]);
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function loadJobs() {
    try {
      const { data } = await api.get("/jobs");
      setJobs(Array.isArray(data) ? data : data.jobs || []);
    } catch (error) {
      setMessage(error.response?.data?.message || "Unable to load jobs. Check the backend.");
    }
  }

  async function loadUsers() {
    try {
      const { data } = await api.get("/users");
      const list = Array.isArray(data) ? data : data.users || [];
      setUsers(list);
      setForm((current) => {
        if (current.postedBy && list.some((u) => u._id === current.postedBy)) return current;
        return { ...current, postedBy: list[0]?._id || "" };
      });
    } catch (error) {
      setMessage(error.response?.data?.message || "Unable to load users. Create a user first.");
    }
  }

  useEffect(() => {
    loadJobs();
    loadUsers();
  }, []);

  function change(e) {
    setForm((current) => ({ ...current, [e.target.name]: e.target.value }));
  }

  function resetForm() {
    setEditingId(null);
    setForm({ ...emptyForm, postedBy: users[0]?._id || "" });
  }

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setMessage("");

    if (!form.postedBy) {
      setMessage("No users available. Open the Users tab and create a recruiter first.");
      setBusy(false);
      return;
    }

    try {
      const payload = {
        title: form.title.trim(),
        company: form.company.trim(),
        location: form.location.trim(),
        jobType: form.jobType,
        salary: Number(form.salary || 0),
        description: form.description.trim(),
        postedBy: form.postedBy,
      };

      if (editingId) {
        // postedBy is intentionally not changed by the update API.
        const { postedBy, ...updatePayload } = payload;
        await api.put(`/jobs/${editingId}`, updatePayload);
        setMessage("Job updated successfully.");
      } else {
        await api.post("/jobs", payload);
        setMessage("Job posted successfully.");
      }

      resetForm();
      await Promise.all([loadJobs(), loadUsers()]);
    } catch (error) {
      setMessage(error.response?.data?.message || "Unable to save job.");
    } finally {
      setBusy(false);
    }
  }

  function edit(job) {
    setEditingId(job._id);
    setForm({
      title: job.title || "",
      company: job.company || "",
      location: job.location || "",
      jobType: job.jobType || "Full-time",
      salary: String(job.salary ?? ""),
      description: job.description || "",
      postedBy: typeof job.postedBy === "object" ? job.postedBy?._id || "" : job.postedBy || "",
    });
    setMessage("Editing job. The existing recruiter is shown for reference.");
  }

  async function remove(id) {
    if (!window.confirm("Delete this job post?")) return;
    try {
      const { data } = await api.delete(`/jobs/${id}`);
      setMessage(data.message || "Job deleted.");
      await loadJobs();
    } catch (error) {
      setMessage(error.response?.data?.message || "Unable to delete job.");
    }
  }

  return (
    <section className="panel">
      <h2>{editingId ? "Update Job Post" : "Create Job Post"}</h2>
      <form onSubmit={submit} className="form-grid">
        <label>Job title
          <input name="title" value={form.title} onChange={change} required />
        </label>
        <label>Company
          <input name="company" value={form.company} onChange={change} required />
        </label>
        <label>Location
          <input name="location" value={form.location} onChange={change} required />
        </label>
        <label>Job type
          <select name="jobType" value={form.jobType} onChange={change}>
            <option>Full-time</option>
            <option>Part-time</option>
            <option>Contract</option>
            <option>Remote</option>
          </select>
        </label>
        <label>Salary
          <input name="salary" type="number" min="0" value={form.salary} onChange={change} />
        </label>
        <label>Posted by (select a user)
          <select name="postedBy" value={form.postedBy} onChange={change} required disabled={!!editingId || users.length === 0}>
            {users.length === 0 && <option value="">No users — create one in Users tab</option>}
            {users.map((user) => (
              <option value={user._id} key={user._id}>{user.name} — {user.email} ({user.role})</option>
            ))}
          </select>
        </label>
        {editingId && <p className="hint">The recruiter is fixed during editing in this demo.</p>}
        <label className="full-width">Job description
          <textarea name="description" value={form.description} onChange={change} rows="4" required />
        </label>
        <div className="actions full-width">
          <button type="submit" disabled={busy || (!editingId && users.length === 0)}>
            {busy ? "Saving..." : editingId ? "Update Job" : "Post Job"}
          </button>
          {editingId && <button type="button" className="secondary" onClick={resetForm}>Cancel</button>}
          <button type="button" className="secondary" onClick={() => { loadUsers(); loadJobs(); }}>Refresh</button>
        </div>
      </form>

      {message && <p className="message" role="status">{message}</p>}

      <h2>Available Jobs ({jobs.length})</h2>
      {jobs.length === 0 ? <p className="hint">No job posts yet. Create one above.</p> : (
        <div className="list">
          {jobs.map((job) => (
            <article className="item" key={job._id}>
              <div>
                <h3>{job.title}</h3>
                <p><strong>{job.company}</strong> · {job.location}</p>
                <p>{job.jobType} · Salary: {Number(job.salary || 0).toLocaleString()}</p>
                <p>{job.description}</p>
                <p>Posted by: {job.postedBy?.name || "Unknown user"} {job.postedBy?.email ? `(${job.postedBy.email})` : ""}</p>
              </div>
              <div className="actions">
                <button className="secondary" onClick={() => edit(job)}>Edit</button>
                <button className="danger" onClick={() => remove(job._id)}>Delete</button>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
