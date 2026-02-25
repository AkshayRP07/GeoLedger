
import {useEffect,useState} from "react";
import axios from "axios";

export default function Track(){
 const [data,setData]=useState([]);

 useEffect(()=>{
  axios.get("http://localhost:5000/track")
   .then(res=>setData(res.data));
 },[]);

 return(
  <div className="content">
   <h2>Status</h2>
   {data.map((d,i)=>
    <div key={i} className="card">
     {d.landId} — {d.status}
    </div>)}
  </div>
 );
}
