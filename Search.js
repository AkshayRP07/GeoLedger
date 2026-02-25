import { useState } from "react";
import axios from "axios";

export default function Search() {
  const [id, setId] = useState("");
  const [data, setData] = useState(null);

  const search = async () => {
    const res = await axios.get(`http://localhost:5000/search/${id}`);
    setData(res.data);
  };

  return (
    <div className="content">
      <h2>Search Land</h2>

      <input
        placeholder="Enter Land ID"
        onChange={(e) => setId(e.target.value)}
      />

      <button onClick={search}>Search</button>

      {/* ✅ formatted result */}
      {data && !data.msg && (
        <div className="result-card">
          <p><strong>Owner:</strong> {data.owner}</p>
          <p><strong>Previous Owner:</strong> {data.previousOwner || "N/A"}</p>
          <p><strong>Location:</strong> {data.location}</p>
          <p><strong>Status:</strong> {data.status}</p>
        </div>
      )}

      {data?.msg && <p>{data.msg}</p>}
    </div>
  );
}