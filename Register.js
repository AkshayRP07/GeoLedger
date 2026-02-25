import { useState } from "react";
import axios from "axios";

export default function Register() {
  const [owner, setOwner] = useState("");
  const [landId, setLandId] = useState("");
  const [location, setLocation] = useState("");
  const [nominees, setNominees] = useState([""]);

  const add = () => setNominees([...nominees, ""]);

  const submit = async () => {
    await axios.post("http://localhost:5000/register_land", {
      owner,
      landId,
      location,
      nominees,
    });
    alert("Submitted for approval");
  };

  return (
    <div className="content">
      <h2>Register Land</h2>

      <div className="form-box">
        <input
          placeholder="Owner Name"
          onChange={(e) => setOwner(e.target.value)}
        />

        <input
          placeholder="Land ID"
          onChange={(e) => setLandId(e.target.value)}
        />

        <input
          placeholder="Location"
          onChange={(e) => setLocation(e.target.value)}
        />

        <h4>Nominees</h4>
        {nominees.map((n, i) => (
          <input
            key={i}
            placeholder="Nominee Name"
            onChange={(e) => {
              const arr = [...nominees];
              arr[i] = e.target.value;
              setNominees(arr);
            }}
          />
        ))}

        <button onClick={add}>+ Add Nominee</button>
        <button onClick={submit}>Submit</button>
      </div>
    </div>
  );
}