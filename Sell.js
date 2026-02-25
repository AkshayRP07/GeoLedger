
import {useState} from "react";
import axios from "axios";

export default function Sell(){
 const [landId,setLandId]=useState("");
 const [buyer,setBuyer]=useState("");

 const send=async()=>{
  await axios.post("http://localhost:5000/sell_land",
   {landId,buyer,nominees:[]});
  alert("Request sent");
 };

 return(
  <div className="content">
   <h2>Sell Land</h2>
   <input placeholder="Land ID" onChange={e=>setLandId(e.target.value)}/>
   <input placeholder="Buyer Name" onChange={e=>setBuyer(e.target.value)}/>
   <button onClick={send}>Submit</button>
  </div>
 );
}
