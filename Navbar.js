export default function Navbar({ role, setRole }) {

  const logout = () => {
    setRole("");        // return to login
    window.location.reload();  // reset app safely
  };

  return (
    <div className="navbar">
      <h2>GeoLedger</h2>

      <div>
        <span className="role">{role.toUpperCase()}</span>
        <button className="logout" onClick={logout}>
          Logout
        </button>
      </div>
    </div>
  );
}