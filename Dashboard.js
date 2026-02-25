import Register from "./Register";
import Search from "./Search";
import Sell from "./Sell";
import Track from "./Track";
import Admin from "./Admin";

export default function Dashboard({ role, page }) {

  // ADMIN PAGE
  if (role === "admin" && page === "admin") return <Admin />;

  // USER PAGES
  if (page === "register") return <Register />;
  if (page === "search") return <Search />;
  if (page === "sell") return <Sell />;
  if (page === "track") return <Track />;

  // DEFAULT DASHBOARD
  return (
    <div className="content">
      <h2 style={{fontWeight:"600"}}>Dashboard Overview</h2>

      <div className="card-container">

        <div className="dash-card gradient-blue">
          <h3>Land Records</h3>
          <p>Register & manage property ownership.</p>
        </div>

        <div className="dash-card gradient-purple">
          <h3>Search Records</h3>
          <p>Verify land ownership instantly.</p>
        </div>

        <div className="dash-card gradient-green">
          <h3>Ownership Transfer</h3>
          <p>Secure transfer of land ownership.</p>
        </div>

        <div className="dash-card gradient-orange">
          <h3>Track Applications</h3>
          <p>Monitor approval status easily.</p>
        </div>

      </div>
    </div>
  );
}