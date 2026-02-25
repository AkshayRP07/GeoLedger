import { useEffect, useState } from "react";
import axios from "axios";

export default function Admin() {
  const [data, setData] = useState({ registrations: [], sales: [] });

  const loadData = async () => {
    const res = await axios.get("http://localhost:5000/admin_data");
    setData(res.data);
  };

  useEffect(() => {
    loadData();
  }, []);

  const approveReg = async (i) => {
    await axios.post("http://localhost:5000/approve_registration", { i });
    loadData();
  };

  const approveSale = async (i) => {
    const res = await axios.post("http://localhost:5000/approve_sale", { i });
    alert("Buyer Login:\n" + res.data.login + "\nPassword: " + res.data.password);
    loadData();
  };

  return (
    <div className="content">
      <h2>Approval Requests</h2>

      <table className="approval-table">
        <thead>
          <tr>
            <th>Owner</th>
            <th>Land ID</th>
            <th>Status</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {data.registrations.map((r, i) => (
            <tr key={i}>
              <td>{r.owner}</td>
              <td>{r.landId}</td>
              <td>{r.status}</td>
              <td>
                {r.status === "Pending" && (
                  <button onClick={() => approveReg(i)}>Approve</button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2 style={{ marginTop: "40px" }}>Sale Requests</h2>

      <table className="approval-table">
        <thead>
          <tr>
            <th>Land ID</th>
            <th>Buyer</th>
            <th>Status</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {data.sales.map((s, i) => (
            <tr key={i}>
              <td>{s.landId}</td>
              <td>{s.buyer}</td>
              <td>{s.status}</td>
              <td>
                {s.status === "Pending" && (
                  <button onClick={() => approveSale(i)}>Approve</button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}