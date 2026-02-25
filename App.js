import { useState } from "react";
import Login from "./Login";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";
import Dashboard from "./Dashboard";

export default function App() {
  const [role, setRole] = useState("");
  const [page, setPage] = useState("home");

  if (!role) return <Login setRole={setRole} />;

  return (
    <div className="layout">
      <Sidebar role={role} setPage={setPage} />
      <Navbar role={role} setRole={setRole} />
      <Dashboard role={role} page={page} />
    </div>
  );
}