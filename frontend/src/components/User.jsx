import { useEffect, useState } from "react";
import axios from "axios";

const API = "http://localhost:5000/api/users";

function User() {
  const [users, setUsers] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [message, setMessage] = useState("");

  const emptyForm = {
    name: "",
    email: "",
    password: "",
    role: "user",
  };

  const [form, setForm] = useState(emptyForm);

  const loadUsers = async () => {
    try {
      const response = await axios.get(API);
      setUsers(response.data);
    } catch {
      setMessage("Unable to load users.");
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (editingId) {
        const { name, email, role } = form;

        await axios.put(`${API}/${editingId}`, {
          name,
          email,
          role,
        });

        setMessage("User updated successfully.");
      } else {
        await axios.post(API, form);
        setMessage("User created successfully.");
      }

      setForm(emptyForm);
      setEditingId(null);
      await loadUsers();
    } catch (error) {
      setMessage(
        error.response?.data?.message || "Unable to save user."
      );
    }
  };

  const editUser = (user) => {
    setEditingId(user._id);
    setForm({
      name: user.name,
      email: user.email,
      password: "",
      role: user.role,
    });
  };

  const deleteUser = async (id) => {
    if (!window.confirm("Delete this user?")) return;

    try {
      await axios.delete(`${API}/${id}`);
      setMessage("User deleted successfully.");
      await loadUsers();
    } catch {
      setMessage("Unable to delete user.");
    }
  };

  return (
    <section>
      <h2>{editingId ? "Update User" : "Register User"}</h2>

      <form onSubmit={handleSubmit}>
        <input
          name="name"
          placeholder="Full Name"
          value={form.name}
          onChange={handleChange}
          required
        />

        <input
          name="email"
          type="email"
          placeholder="Email Address"
          value={form.email}
          onChange={handleChange}
          required
        />

        {!editingId && (
          <input
            name="password"
            type="password"
            placeholder="Password"
            value={form.password}
            onChange={handleChange}
            required
          />
        )}

        <select
          name="role"
          value={form.role}
          onChange={handleChange}
        >
          <option value="user">User</option>
          <option value="recruiter">Recruiter</option>
          <option value="admin">Admin</option>
        </select>

        <button type="submit">
          {editingId ? "Update User" : "Create User"}
        </button>

        {editingId && (
          <button
            type="button"
            onClick={() => {
              setEditingId(null);
              setForm(emptyForm);
            }}
          >
            Cancel
          </button>
        )}
      </form>

      <p role="status" style={{ color: message.includes("successfully") ? "green" : "red" }}>
        {message}
      </p>

      <h2>Users List</h2>

      {users.map((user) => (
        <article key={user._id} className="item">
          <h3>{user.name}</h3>
          <p>Email: {user.email}</p>
          <p>Role: {user.role}</p>

          <button onClick={() => editUser(user)}>Edit</button>
          <button onClick={() => deleteUser(user._id)}>
            Delete
          </button>
        </article>
      ))}
    </section>
  );
}

export default User;