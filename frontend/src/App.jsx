import User from "./components/User";
import JobPost from "./components/JobPost";
import "./App.css";

function App() {
  return (
    <div className="container">
      <header>
        <h1>Job Portal Application</h1>
        <p>Manage users and job postings</p>
      </header>

      <div className="layout">
        <div className="panel">
          <User />
        </div>

        <div className="panel">
          <JobPost />
        </div>
      </div>
    </div>
  );
}

export default App;