export default function Sidebar({ role, setPage }) {
  return (
    <div className="sidebar">
      <h2 className="logo">GeoLedger</h2>

      {role === "user" && (
        <>
          <button onClick={() => setPage("home")}>
            <span className="material-icons">dashboard</span> Dashboard
          </button>

          <button onClick={() => setPage("register")}>
            <span className="material-icons">description</span> Register
          </button>

          <button onClick={() => setPage("search")}>
            <span className="material-icons">search</span> Search
          </button>

          <button onClick={() => setPage("sell")}>
            <span className="material-icons">swap_horiz</span> Sell
          </button>

          <button onClick={() => setPage("track")}>
            <span className="material-icons">timeline</span> Track
          </button>
        </>
      )}

      {role === "admin" && (
        <>
          <button onClick={() => setPage("home")}>
            <span className="material-icons">dashboard</span> Dashboard
          </button>

          <button onClick={() => setPage("admin")}>
            <span className="material-icons">verified</span> Approvals
          </button>
        </>
      )}
    </div>
  );
}