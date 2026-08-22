import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { MapContainer, TileLayer, Marker, Popup, Circle } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl:       "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl:     "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

function BlockchainBg() {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    let W = canvas.width = window.innerWidth;
    let H = canvas.height = window.innerHeight;
    const nodes = Array.from({length: 28}, () => ({
      x: Math.random()*W, y: Math.random()*H,
      vx: (Math.random()-0.5)*0.4, vy: (Math.random()-0.5)*0.4,
      r: Math.random()*3+2
    }));
    let raf;
    const draw = () => {
      ctx.clearRect(0,0,W,H);
      nodes.forEach((a,i) => nodes.slice(i+1).forEach(b => {
        const d = Math.hypot(a.x-b.x, a.y-b.y);
        if (d < 160) {
          ctx.beginPath();
          ctx.strokeStyle = `rgba(56,189,248,${0.12*(1-d/160)})`;
          ctx.lineWidth = 0.8;
          ctx.moveTo(a.x,a.y); ctx.lineTo(b.x,b.y); ctx.stroke();
        }
      }));
      nodes.forEach(n => {
        ctx.beginPath();
        ctx.arc(n.x,n.y,n.r,0,Math.PI*2);
        ctx.fillStyle = "rgba(56,189,248,0.25)";
        ctx.fill();
        n.x+=n.vx; n.y+=n.vy;
        if(n.x<0||n.x>W) n.vx*=-1;
        if(n.y<0||n.y>H) n.vy*=-1;
      });
      raf = requestAnimationFrame(draw);
    };
    draw();
    const onResize = () => { W=canvas.width=window.innerWidth; H=canvas.height=window.innerHeight; };
    window.addEventListener("resize", onResize);
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize",onResize); };
  }, []);
  return <canvas ref={canvasRef} style={{position:"fixed",inset:0,zIndex:0,pointerEvents:"none"}}/>;
}

export default function UserDashboard() {
  const user = JSON.parse(localStorage.getItem("geoledger_user") || "{}");
  const [tab, setTab]               = useState("register");
  const [properties, setProperties] = useState([]);
  const [accounts, setAccounts]     = useState([]);
  const [msg, setMsg]               = useState({text:"",type:""});
  const [trackData, setTrackData]   = useState([]);

  const [form, setForm] = useState({
    surveyNumber:"", village:"", taluka:"", district:"", ownerAddress:"",
    area:"", unit:"", nominees:[], nomineeInput:"",
    verificationId:"", pdfUrl:null, pdfBase64:null,
    fetchSuccess:false, fetchingPdf:false
  });

  const [query, setQuery]       = useState("");
  const [results, setResults]   = useState([]);
  const [transfer, setTransfer] = useState({
    landId:"", newOwner:"", newOwnerAddress:"", fromAddress:"",
    area:"", unit:"", amount:"", nominees:""
  });
  const [mapData, setMapData]     = useState(null);
  const [mapLoading, setMapLoading] = useState(false);
  const [mapQuery, setMapQuery]   = useState({ village:"", taluka:"", district:"", surveyNumber:"" });
  const [mapError, setMapError]   = useState("");

  useEffect(() => {
    axios.get("http://localhost:5000/api/properties").then(r => setProperties(r.data));
    axios.get("http://localhost:5000/api/blockchain/accounts")
      .then(r => setAccounts(r.data.accounts||[])).catch(()=>{});
  }, []);

  useEffect(() => {
    if (tab === "properties") {
      axios.get("http://localhost:5000/api/properties").then(r => setProperties(r.data));
      axios.get("http://localhost:5000/api/track")
        .then(r => setTrackData(r.data.filter(
          rec => rec.owner === user.username ||
                 rec.currentOwner === user.username ||
                 rec.buyer === user.username
        ))).catch(()=>{});
    }
  }, [tab, user.username]);

  const notify = (text, type="success") => {
    setMsg({text,type});
    setTimeout(()=>setMsg({text:"",type:""}),4000);
  };

  const registerProperty = async () => {
    if (!form.surveyNumber || !form.village || !form.taluka || !form.district || !form.ownerAddress) {
      notify("Please fill all required land details", "error"); return;
    }
    try {
      await axios.post("http://localhost:5000/api/register_land", {
        surveyNumber: form.surveyNumber,
        village:      form.village,
        taluka:       form.taluka,
        district:     form.district,
        owner:        user.username,
        ownerAddress: form.ownerAddress,
        area:         form.area ? `${form.area} ${form.unit||""}`.trim() : "",
        nominees:     form.nominees || [],
        pdf_url:      form.pdfUrl ? form.pdfUrl.replace("http://localhost:5000","") : null,
      });
      notify("Registration submitted for admin approval!");
      setForm({
        surveyNumber:"", village:"", taluka:"", district:"", ownerAddress:"",
        area:"", unit:"", nominees:[], nomineeInput:"",
        verificationId:"", pdfUrl:null, pdfBase64:null,
        fetchSuccess:false, fetchingPdf:false
      });
    } catch(e) { notify(e.response?.data?.error || "Registration failed", "error"); }
  };

  const searchProperty = async () => {
    const res = await axios.get(`http://localhost:5000/api/search_land?q=${query}`);
    setResults(res.data);
  };

  const transferOwnership = async () => {
    if (!transfer.landId || !transfer.newOwner || !transfer.newOwnerAddress || !transfer.fromAddress) {
      notify("Please fill all required fields", "error"); return;
    }
    try {
      await axios.post("http://localhost:5000/api/sell_land", {
        landId:       transfer.landId,
        currentOwner: user.username,
        buyer:        transfer.newOwner,
        buyerAddress: transfer.newOwnerAddress,
        fromAddress:  transfer.fromAddress,
        area:         transfer.area ? `${transfer.area} ${transfer.unit||""}`.trim() : "",
        amount:       transfer.amount,
        nominees:     transfer.nominees ? transfer.nominees.split(",").map(n=>n.trim()) : []
      });
      notify("Sale request submitted! Waiting for admin approval.");
      setTransfer({ landId:"", newOwner:"", newOwnerAddress:"", fromAddress:"", area:"", unit:"", amount:"", nominees:"" });
    } catch(e) { notify(e.response?.data?.error || "Submission failed", "error"); }
  };

  const searchOnMap = async () => {
    if (!mapQuery.village && !mapQuery.taluka && !mapQuery.district) {
      setMapError("Please enter at least Village or Taluka name"); return;
    }
    setMapLoading(true); setMapError(""); setMapData(null);
    const queries = [
      [mapQuery.village, mapQuery.taluka, mapQuery.district, "Maharashtra", "India"].filter(Boolean).join(", "),
      [mapQuery.taluka,  mapQuery.district, "Maharashtra", "India"].filter(Boolean).join(", "),
      [mapQuery.district, "Maharashtra", "India"].filter(Boolean).join(", "),
    ];
    for (const q of queries) {
      try {
        const res  = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=1&addressdetails=1`,
          { headers: { "Accept-Language": "en" } }
        );
        const data = await res.json();
        if (data.length > 0) {
          setMapData({
            lat:         parseFloat(data[0].lat),
            lon:         parseFloat(data[0].lon),
            displayName: data[0].display_name,
            query:       q,
          });
          setMapLoading(false);
          return;
        }
      } catch(e) { console.error(e); }
    }
    setMapError("Location not found. Try different village/taluka/district names.");
    setMapLoading(false);
  };

  const navItems = [
    { id:"register",   icon:"📋", label:"Register"   },
    { id:"properties", icon:"🏠", label:"Properties" },
    { id:"search",     icon:"🔍", label:"Search"     },
    { id:"transfer",   icon:"🔄", label:"Transfer"   },
    { id:"map",        icon:"🗺️", label:"Land Map"   },
  ];

  const myProps = (properties || []).filter(p => p && p.owner === user.username);

  return (
    <div style={s.root}>
      <BlockchainBg />

      {/* SIDEBAR */}
      <div style={s.sidebar}>
        <div style={s.sideTop}>
          <div style={s.logo}>
            <span style={{fontSize:"22px"}}>⛓️</span>
            <div>
              <div style={s.logoName}>GeoLedger</div>
              <div style={s.logoSub}>Land Registry</div>
            </div>
          </div>
          <div style={s.userCard}>
            <div style={s.avatar}>{user.username?.[0]?.toUpperCase()}</div>
            <div>
              <div style={s.userName}>{user.username}</div>
              <div style={s.userRole}>Registered User</div>
            </div>
          </div>
          <nav style={s.nav}>
            {navItems.map(n => (
              <button key={n.id} style={tab===n.id ? s.navActive : s.navItem}
                onClick={() => { setTab(n.id); setMsg({text:"",type:""}); }}>
                <span style={s.navIcon}>{n.icon}</span>
                <span>{n.label}</span>
                {tab===n.id && <span style={s.navDot}/>}
              </button>
            ))}
          </nav>
        </div>
        <div style={s.sideBottom}>
          <div style={s.statMini}>
            <div style={s.statMiniVal}>{myProps.length}</div>
            <div style={s.statMiniLabel}>My Properties</div>
          </div>
          <button style={s.logout}
            onClick={() => { localStorage.clear(); window.location.href="/"; }}>
            🚪 Logout
          </button>
        </div>
      </div>

      {/* MAIN */}
      <div style={s.main}>
        {msg.text && (
          <div style={msg.type==="error" ? s.toastErr : s.toastOk}>
            {msg.type==="error" ? "❌" : "✅"} {msg.text}
          </div>
        )}

        {/* ── REGISTER ── */}
        {tab==="register" && (
          <div style={s.section}>
            <div style={s.sectionHeader}>
              <div style={s.sectionIcon}>📋</div>
              <div>
                <h2 style={s.sectionTitle}>Register Land</h2>
                <p style={s.sectionDesc}>Fetch your Satbara document, fill land details, add nominees and submit for admin approval</p>
              </div>
            </div>
            <div style={s.formCard}>

              {/* STEP 1 */}
              <div style={reg.stepBlock}>
                <div style={reg.stepHeader}>
                  <div style={reg.stepNum}>1</div>
                  <div>
                    <div style={reg.stepTitle}>Fetch Satbara / 7-12 Document</div>
                    <div style={reg.stepDesc}>Enter your verification ID to fetch the official government land record</div>
                  </div>
                </div>
                <div style={{display:"flex", gap:"12px"}}>
                  <input style={{...s.fieldInput, flex:1}}
                    placeholder="Enter Verification ID e.g. 3108100001959045"
                    value={form.verificationId || ""}
                    onChange={e => setForm({...form, verificationId: e.target.value})}/>
                  <button
                    style={form.fetchingPdf ? s.btnLoading : reg.fetchBtn}
                    disabled={form.fetchingPdf}
                    onClick={async () => {
                      if (!form.verificationId) { notify("Enter a verification ID first", "error"); return; }
                      setForm(f => ({...f, fetchingPdf:true, pdfUrl:null, pdfBase64:null}));
                      try {
                        const res = await axios.post("http://localhost:5000/api/satbara/fetch",
                          { verificationId: form.verificationId }, { timeout: 60000 });
                        setForm(f => ({...f,
                          fetchingPdf:  false,
                          pdfUrl:       res.data.pdfUrl ? `http://localhost:5000${res.data.pdfUrl}` : null,
                          pdfBase64:    res.data.pdfBase64 || null,
                          fetchSuccess: true
                        }));
                        notify("Satbara fetched! Now fill the land details below.");
                      } catch(e) {
                        setForm(f => ({...f, fetchingPdf:false, fetchSuccess:false}));
                        notify(e.response?.data?.error || "Failed to fetch Satbara", "error");
                      }
                    }}>
                    {form.fetchingPdf ? (
                      <span style={{display:"flex",alignItems:"center",gap:"8px"}}>
                        <span style={s.spinner}/> Fetching...
                      </span>
                    ) : "📜 Fetch 7/12 PDF"}
                  </button>
                </div>
                {form.pdfUrl && (
                  <div style={reg.pdfPreview}>
                    <div style={reg.pdfPreviewHeader}>
                      <span style={{color:"#86efac",fontWeight:"700"}}>✅ Satbara document fetched</span>
                      <a href={form.pdfUrl} download style={reg.dlBtn}>⬇️ Download</a>
                    </div>
                    <iframe src={form.pdfUrl} style={reg.pdfFrame} title="Satbara Preview"/>
                  </div>
                )}
              </div>

              {/* STEP 2 */}
              <div style={reg.stepBlock}>
                <div style={reg.stepHeader}>
                  <div style={reg.stepNum}>2</div>
                  <div>
                    <div style={reg.stepTitle}>Land Details</div>
                    <div style={reg.stepDesc}>Fill in the details as shown in your Satbara document</div>
                  </div>
                </div>
                <div style={s.formGrid}>
                  <div style={s.field}>
                    <label style={s.fieldLabel}>Survey / Gat Number</label>
                    <input style={s.fieldInput} placeholder="e.g. 87/2"
                      value={form.surveyNumber}
                      onChange={e=>setForm({...form,surveyNumber:e.target.value})}/>
                  </div>
                  <div style={s.field}>
                    <label style={s.fieldLabel}>Village</label>
                    <input style={s.fieldInput} placeholder="e.g. Khed"
                      value={form.village}
                      onChange={e=>setForm({...form,village:e.target.value})}/>
                  </div>
                  <div style={s.field}>
                    <label style={s.fieldLabel}>Taluka</label>
                    <input style={s.fieldInput} placeholder="e.g. Haveli"
                      value={form.taluka}
                      onChange={e=>setForm({...form,taluka:e.target.value})}/>
                  </div>
                  <div style={s.field}>
                    <label style={s.fieldLabel}>District</label>
                    <input style={s.fieldInput} placeholder="e.g. Pune"
                      value={form.district}
                      onChange={e=>setForm({...form,district:e.target.value})}/>
                  </div>
                </div>
                <div style={s.field}>
                  <label style={s.fieldLabel}>Land Area</label>
                  <div style={{display:"flex", gap:"12px"}}>
                    <input style={{...s.fieldInput, flex:1}} placeholder="e.g. 2.5"
                      type="number" min="0" step="0.01"
                      value={form.area || ""}
                      onChange={e=>setForm({...form,area:e.target.value})}/>
                    <select style={{...s.fieldSelect, width:"160px"}}
                      value={form.unit || ""}
                      onChange={e=>setForm({...form,unit:e.target.value})}>
                      <option value="">Select Unit</option>
                      <option value="Acre">Acre</option>
                      <option value="Guntha">Guntha</option>
                      <option value="Sq. Feet">Sq. Feet</option>
                      <option value="Sq. Meter">Sq. Meter</option>
                      <option value="Hectare">Hectare</option>
                    </select>
                  </div>
                </div>
                <div style={s.field}>
                  <label style={s.fieldLabel}>Blockchain Account (Ganache)</label>
                  <select style={s.fieldSelect}
                    value={form.ownerAddress}
                    onChange={e=>setForm({...form,ownerAddress:e.target.value})}>
                    <option value="">Select your Ganache wallet address</option>
                    {accounts.map(a=><option key={a} value={a}>{a}</option>)}
                  </select>
                </div>
              </div>

              {/* STEP 3 */}
              <div style={reg.stepBlock}>
                <div style={reg.stepHeader}>
                  <div style={reg.stepNum}>3</div>
                  <div>
                    <div style={reg.stepTitle}>
                      Nominees <span style={{color:"#475569",fontWeight:"400",fontSize:"12px"}}>(Optional)</span>
                    </div>
                    <div style={reg.stepDesc}>Add persons who inherit ownership rights for this land</div>
                  </div>
                </div>
                {(form.nominees || []).map((n,i) => (
                  <div key={i} style={reg.nomineeRow}>
                    <span style={reg.nomineePill}>👤 {n}</span>
                    <button style={reg.removeBtn}
                      onClick={() => setForm(f => ({...f, nominees: f.nominees.filter((_,j)=>j!==i)}))}>
                      ✕
                    </button>
                  </div>
                ))}
                <div style={{display:"flex", gap:"12px", marginTop:"8px"}}>
                  <input style={{...s.fieldInput, flex:1}}
                    placeholder="Nominee name e.g. Ravi Sharma"
                    value={form.nomineeInput || ""}
                    onChange={e=>setForm({...form, nomineeInput:e.target.value})}
                    onKeyDown={e => {
                      if (e.key==="Enter" && form.nomineeInput?.trim()) {
                        setForm(f => ({...f,
                          nominees:     [...(f.nominees||[]), f.nomineeInput.trim()],
                          nomineeInput: ""
                        }));
                      }
                    }}/>
                  <button style={reg.addBtn}
                    onClick={() => {
                      if (form.nomineeInput?.trim()) {
                        setForm(f => ({...f,
                          nominees:     [...(f.nominees||[]), f.nomineeInput.trim()],
                          nomineeInput: ""
                        }));
                      }
                    }}>+ Add</button>
                </div>
                <div style={{fontSize:"11px",color:"#475569",marginTop:"6px"}}>
                  Press Enter or click + Add after each name
                </div>
              </div>

              <button style={s.primaryBtn} onClick={registerProperty}>
                ⛓️ Submit for Admin Approval
              </button>
            </div>
          </div>
        )}

        {/* ── PROPERTIES ── */}
        {tab==="properties" && (
          <div style={s.section}>
            <div style={s.sectionHeader}>
              <div style={s.sectionIcon}>🏠</div>
              <div>
                <h2 style={s.sectionTitle}>My Properties</h2>
                <p style={s.sectionDesc}>{myProps.length} propert{myProps.length===1?"y":"ies"} approved on blockchain</p>
              </div>
            </div>

            {/* Approved lands */}
            {myProps.length === 0 ? (
              <div style={s.emptyState}>
                <div style={{fontSize:"48px",marginBottom:"12px"}}>🏚️</div>
                <div style={{color:"#94a3b8",fontSize:"16px"}}>No approved properties yet</div>
                <div style={{color:"#475569",fontSize:"13px",marginTop:"6px"}}>
                  Register a property and wait for admin approval
                </div>
              </div>
            ) : (
              <div style={s.cardsGrid}>
                {myProps.map(p => (
                  <div key={p.id} style={s.propCard}>
                    <div style={s.propCardTop}>
                      <span style={s.propId}>#{p.id}</span>
                      <span style={s.propBadge}>✅ On-Chain</span>
                    </div>
                    <div style={s.propSurvey}>{p.surveyNumber}</div>
                    <div style={s.propLocation}>📍 {p.village}, {p.taluka}, {p.district}</div>
                    <div style={s.propDivider}/>
                    <div style={s.propMeta}>
                      <span style={s.propMetaLabel}>Owner</span>
                      <span style={s.propMetaVal}>{p.owner}</span>
                    </div>
                    {p.area && (
                      <div style={{...s.propMeta, marginTop:"4px"}}>
                        <span style={s.propMetaLabel}>Area</span>
                        <span style={s.propMetaVal}>{p.area}</span>
                      </div>
                    )}
                    {p.txHash && (
                      <div style={s.propTx}>🔗 {p.txHash.slice(0,20)}...{p.txHash.slice(-6)}</div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Request history */}
            {trackData.length > 0 && (
              <div style={{marginTop:"32px"}}>
                <h3 style={{color:"#94a3b8",fontSize:"13px",marginBottom:"16px",
                  textTransform:"uppercase",letterSpacing:"1px",fontWeight:"700"}}>
                  📋 My Requests &amp; History
                </h3>
                {trackData.map((rec,i) => (
                  <div key={i} style={{
                    background:"rgba(15,23,42,0.6)",
                    border:`1px solid ${rec.status==="Approved"?"rgba(34,197,94,0.25)":rec.status==="Rejected"?"rgba(239,68,68,0.25)":"rgba(245,158,11,0.25)"}`,
                    borderRadius:"10px", padding:"14px 18px", marginBottom:"8px",
                    display:"flex", justifyContent:"space-between", alignItems:"center"
                  }}>
                    <div>
                      <div style={{fontSize:"13px",fontWeight:"700",color:"#e2e8f0"}}>
                        {rec.action==="Register" ? "📋 Registration" : "🔄 Sale/Transfer"} — {rec.surveyNumber || `Land ID ${rec.landId}`}
                      </div>
                      <div style={{fontSize:"11px",color:"#64748b",marginTop:"3px"}}>
                        {rec.area && `Area: ${rec.area} · `}
                        {rec.village && `${rec.village}, `}{rec.district || ""} · {new Date(rec.date).toLocaleDateString()}
                      </div>
                      {rec.action==="Sell" && rec.buyer && (
                        <div style={{fontSize:"11px",color:"#818cf8",marginTop:"2px"}}>
                          Buyer: {rec.buyer}
                          {rec.remainingArea ? ` · You retain: ${rec.remainingArea}` : ""}
                        </div>
                      )}
                    </div>
                    <span style={{
                      padding:"4px 12px", borderRadius:"20px", fontSize:"11px",
                      fontWeight:"700", flexShrink:0, marginLeft:"12px",
                      background: rec.status==="Approved"?"rgba(34,197,94,0.1)":rec.status==="Rejected"?"rgba(239,68,68,0.1)":"rgba(245,158,11,0.1)",
                      color: rec.status==="Approved"?"#86efac":rec.status==="Rejected"?"#fca5a5":"#fbbf24"
                    }}>{rec.status}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── SEARCH ── */}
        {tab==="search" && (
          <div style={s.section}>
            <div style={s.sectionHeader}>
              <div style={s.sectionIcon}>🔍</div>
              <div>
                <h2 style={s.sectionTitle}>Search Property</h2>
                <p style={s.sectionDesc}>Find any registered land record by survey number, owner or village</p>
              </div>
            </div>
            <div style={s.formCard}>
              <div style={s.searchRow}>
                <input style={s.searchInput}
                  placeholder="Search by Survey No, Owner name, or Village..."
                  value={query} onChange={e=>setQuery(e.target.value)}
                  onKeyDown={e=>e.key==="Enter"&&searchProperty()}/>
                <button style={s.primaryBtn} onClick={searchProperty}>Search</button>
              </div>
            </div>
            {results.length > 0 && (
              <div style={s.cardsGrid}>
                {results.map(p => (
                  <div key={p.id} style={s.propCard}>
                    <div style={s.propCardTop}>
                      <span style={s.propId}>#{p.id}</span>
                      <span style={s.propBadge}>✅ Registered</span>
                    </div>
                    <div style={s.propSurvey}>{p.surveyNumber}</div>
                    <div style={s.propLocation}>📍 {p.village}, {p.taluka}, {p.district}</div>
                    <div style={s.propDivider}/>
                    <div style={s.propMeta}>
                      <span style={s.propMetaLabel}>Owner</span>
                      <span style={s.propMetaVal}>{p.owner}</span>
                    </div>
                    {p.area && (
                      <div style={{...s.propMeta, marginTop:"4px"}}>
                        <span style={s.propMetaLabel}>Area</span>
                        <span style={s.propMetaVal}>{p.area}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
            {results.length === 0 && query && (
              <div style={s.emptyState}>
                <div style={{fontSize:"40px",marginBottom:"10px"}}>🔎</div>
                <div style={{color:"#94a3b8"}}>No properties found for "{query}"</div>
              </div>
            )}
          </div>
        )}

        {/* ── TRANSFER / SELL ── */}
        {tab==="transfer" && (
          <div style={s.section}>
            <div style={s.sectionHeader}>
              <div style={s.sectionIcon}>🔄</div>
              <div>
                <h2 style={s.sectionTitle}>Sell / Transfer Land</h2>
                <p style={s.sectionDesc}>Submit a sale request — admin will verify and approve before blockchain update</p>
              </div>
            </div>
            <div style={s.formCard}>
              <div style={s.formGrid}>
                <div style={s.field}>
                  <label style={s.fieldLabel}>Land ID</label>
                  <input style={s.fieldInput} placeholder="e.g. 1"
                    value={transfer.landId}
                    onChange={e=>setTransfer({...transfer,landId:e.target.value})}/>
                </div>
                <div style={s.field}>
                  <label style={s.fieldLabel}>Buyer Username</label>
                  <input style={s.fieldInput} placeholder="Recipient's username"
                    value={transfer.newOwner}
                    onChange={e=>setTransfer({...transfer,newOwner:e.target.value})}/>
                </div>
                <div style={s.field}>
                  <label style={s.fieldLabel}>Buyer Wallet Address</label>
                  <input style={s.fieldInput} placeholder="0x..."
                    value={transfer.newOwnerAddress}
                    onChange={e=>setTransfer({...transfer,newOwnerAddress:e.target.value})}/>
                </div>
                <div style={s.field}>
                  <label style={s.fieldLabel}>Your Wallet Address (From)</label>
                  <select style={s.fieldSelect}
                    value={transfer.fromAddress}
                    onChange={e=>setTransfer({...transfer,fromAddress:e.target.value})}>
                    <option value="">Select your Ganache address</option>
                    {accounts.map(a=><option key={a} value={a}>{a}</option>)}
                  </select>
                </div>
              </div>
              <div style={s.field}>
                <label style={s.fieldLabel}>Land Area to Sell</label>
                <div style={{display:"flex", gap:"12px"}}>
                  <input style={{...s.fieldInput, flex:1}} placeholder="e.g. 2.5"
                    type="number" min="0" step="0.01"
                    value={transfer.area || ""}
                    onChange={e=>setTransfer({...transfer,area:e.target.value})}/>
                  <select style={{...s.fieldSelect, width:"160px"}}
                    value={transfer.unit || ""}
                    onChange={e=>setTransfer({...transfer,unit:e.target.value})}>
                    <option value="">Select Unit</option>
                    <option value="Acre">Acre</option>
                    <option value="Guntha">Guntha</option>
                    <option value="Sq. Feet">Sq. Feet</option>
                    <option value="Sq. Meter">Sq. Meter</option>
                    <option value="Hectare">Hectare</option>
                  </select>
                </div>
              </div>
              <div style={s.field}>
                <label style={s.fieldLabel}>Amount Paid (₹)</label>
                <input style={s.fieldInput} placeholder="e.g. 500000"
                  type="number" min="0"
                  value={transfer.amount || ""}
                  onChange={e=>setTransfer({...transfer,amount:e.target.value})}/>
              </div>
              <div style={s.field}>
                <label style={s.fieldLabel}>Nominees (comma separated)</label>
                <input style={s.fieldInput} placeholder="e.g. Ravi Sharma, Priya Patil"
                  value={transfer.nominees || ""}
                  onChange={e=>setTransfer({...transfer,nominees:e.target.value})}/>
                <span style={{fontSize:"11px",color:"#475569",marginTop:"4px"}}>
                  Optional — persons who inherit ownership rights
                </span>
              </div>
              <div style={s.warningBox}>
                ⚠️ Sale request will be sent to admin for verification. Ownership transfers on blockchain only after admin approval.
                {(() => {
                  if (!transfer.area || !transfer.unit) return null;
                  const soldNum = parseFloat(transfer.area);
                  const land = properties.find(p => String(p.id) === String(transfer.landId));
                  if (land && land.area) {
                    const origNum = parseFloat(land.area);
                    const unit = land.area.split(" ").slice(1).join(" ");
                    if (!isNaN(soldNum) && !isNaN(origNum) && soldNum < origNum) {
                      const remaining = (origNum - soldNum).toFixed(2);
                      return (
                        <div style={{marginTop:"10px",color:"#86efac",fontSize:"13px"}}>
                          🔀 <b>Partial Sale:</b> Selling {transfer.area} {transfer.unit} — you retain {remaining} {unit}
                        </div>
                      );
                    }
                  }
                  return null;
                })()}
              </div>
              <button style={s.dangerBtn} onClick={transferOwnership}>
                🔄 Submit Sale Request
              </button>
            </div>
          </div>
        )}

        {/* ── LAND MAP ── */}
        {tab==="map" && (
          <div style={s.section}>
            <div style={s.sectionHeader}>
              <div style={s.sectionIcon}>🗺️</div>
              <div>
                <h2 style={s.sectionTitle}>Land Map Visualization</h2>
                <p style={s.sectionDesc}>Visually verify land location using OpenStreetMap — free, no API key required</p>
              </div>
            </div>
            <div style={mp.infoRow}>
              {[
                { icon:"🔍", title:"Visual Verification",  desc:"View actual land area on an interactive map instead of relying only on text records" },
                { icon:"🛡️", title:"Fraud Prevention",     desc:"Compare government land details with real geographic location to detect fake claims" },
                { icon:"🌍", title:"Real-World Visibility", desc:"Explore surrounding area and gain clarity about property before registration or transfer" },
              ].map(c => (
                <div key={c.title} style={mp.infoCard}>
                  <span style={mp.infoIcon}>{c.icon}</span>
                  <div>
                    <div style={mp.infoTitle}>{c.title}</div>
                    <div style={mp.infoDesc}>{c.desc}</div>
                  </div>
                </div>
              ))}
            </div>
            <div style={s.formCard}>
              <div style={mp.formHeader}>
                <span style={mp.formTitle}>📍 Enter Land Location Details</span>
              </div>
              <div style={s.formGrid}>
                <div style={s.field}>
                  <label style={s.fieldLabel}>Survey / Gat Number</label>
                  <input style={s.fieldInput} placeholder="e.g. 87/2"
                    value={mapQuery.surveyNumber}
                    onChange={e=>setMapQuery({...mapQuery,surveyNumber:e.target.value})}/>
                </div>
                <div style={s.field}>
                  <label style={s.fieldLabel}>Village <span style={{color:"#ef4444"}}>*</span></label>
                  <input style={s.fieldInput} placeholder="e.g. Khed"
                    value={mapQuery.village}
                    onChange={e=>setMapQuery({...mapQuery,village:e.target.value})}/>
                </div>
                <div style={s.field}>
                  <label style={s.fieldLabel}>Taluka <span style={{color:"#ef4444"}}>*</span></label>
                  <input style={s.fieldInput} placeholder="e.g. Haveli"
                    value={mapQuery.taluka}
                    onChange={e=>setMapQuery({...mapQuery,taluka:e.target.value})}/>
                </div>
                <div style={s.field}>
                  <label style={s.fieldLabel}>District <span style={{color:"#ef4444"}}>*</span></label>
                  <input style={s.fieldInput} placeholder="e.g. Pune"
                    value={mapQuery.district}
                    onChange={e=>setMapQuery({...mapQuery,district:e.target.value})}/>
                </div>
              </div>
              {mapError && <div style={s.warningBox}>⚠️ {mapError}</div>}
              <button style={mapLoading ? s.btnLoading : s.primaryBtn}
                onClick={searchOnMap} disabled={mapLoading}>
                {mapLoading ? (
                  <span style={{display:"flex",alignItems:"center",gap:"10px",justifyContent:"center"}}>
                    <span style={s.spinner}/> Locating on Map...
                  </span>
                ) : "🗺️ Show Land on Map"}
              </button>
            </div>
            {mapData && (
              <div style={mp.mapSection}>
                <div style={mp.mapHeader}>
                  <div>
                    <div style={mp.mapTitle}>
                      📍 {mapQuery.village}{mapQuery.taluka ? `, ${mapQuery.taluka}` : ""}{mapQuery.district ? `, ${mapQuery.district}` : ""}
                    </div>
                    {mapQuery.surveyNumber && (
                      <div style={mp.mapSub}>Survey / Gat No: {mapQuery.surveyNumber}</div>
                    )}
                    <div style={mp.mapAddress}>{mapData.displayName}</div>
                  </div>
                  <div style={mp.coordBox}>
                    <div style={mp.coordItem}>
                      <span style={mp.coordLabel}>Latitude</span>
                      <span style={mp.coordVal}>{mapData.lat.toFixed(6)}</span>
                    </div>
                    <div style={mp.coordItem}>
                      <span style={mp.coordLabel}>Longitude</span>
                      <span style={mp.coordVal}>{mapData.lon.toFixed(6)}</span>
                    </div>
                  </div>
                </div>
                <div style={mp.mapWrap}>
                  <MapContainer
                    center={[mapData.lat, mapData.lon]}
                    zoom={14}
                    style={{width:"100%",height:"100%",borderRadius:"0 0 14px 14px"}}
                    key={`${mapData.lat}-${mapData.lon}`}
                  >
                    <TileLayer
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    />
                    <Marker position={[mapData.lat, mapData.lon]}>
                      <Popup>
                        <div style={{fontFamily:"sans-serif",fontSize:"13px",lineHeight:"1.6"}}>
                          <b>📍 {mapQuery.village || mapQuery.taluka}</b><br/>
                          {mapQuery.surveyNumber && <span>Survey No: {mapQuery.surveyNumber}<br/></span>}
                          {mapQuery.taluka && <span>Taluka: {mapQuery.taluka}<br/></span>}
                          {mapQuery.district && <span>District: {mapQuery.district}</span>}
                        </div>
                      </Popup>
                    </Marker>
                    <Circle
                      center={[mapData.lat, mapData.lon]}
                      radius={300}
                      pathOptions={{color:"#38bdf8",fillColor:"#38bdf8",fillOpacity:0.1,weight:2}}
                    />
                  </MapContainer>
                </div>
                <div style={mp.osmNote}>
                  🗺️ Map data © OpenStreetMap contributors — Free &amp; open source, no API key required
                </div>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}

const s = {
  root:         { display:"flex", minHeight:"100vh", background:"#020817", fontFamily:"'Segoe UI',sans-serif", color:"#f1f5f9" },
  sidebar:      { width:"240px", background:"rgba(15,23,42,0.95)", borderRight:"1px solid rgba(51,65,85,0.5)", display:"flex", flexDirection:"column", justifyContent:"space-between", position:"sticky", top:0, height:"100vh", zIndex:10 },
  sideTop:      { padding:"24px 16px", display:"flex", flexDirection:"column", gap:"20px" },
  sideBottom:   { padding:"16px" },
  logo:         { display:"flex", alignItems:"center", gap:"10px", paddingBottom:"16px", borderBottom:"1px solid rgba(51,65,85,0.4)" },
  logoName:     { fontSize:"16px", fontWeight:"800", color:"#f1f5f9" },
  logoSub:      { fontSize:"10px", color:"#38bdf8", textTransform:"uppercase", letterSpacing:"1.5px" },
  userCard:     { display:"flex", alignItems:"center", gap:"12px", background:"rgba(30,41,59,0.6)", borderRadius:"10px", padding:"12px" },
  avatar:       { width:"36px", height:"36px", borderRadius:"50%", background:"linear-gradient(135deg,#38bdf8,#818cf8)", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:"800", fontSize:"16px", color:"#0f172a", flexShrink:0 },
  userName:     { fontSize:"14px", fontWeight:"700", color:"#e2e8f0" },
  userRole:     { fontSize:"11px", color:"#64748b", marginTop:"2px" },
  nav:          { display:"flex", flexDirection:"column", gap:"4px" },
  navItem:      { display:"flex", alignItems:"center", gap:"10px", padding:"10px 12px", background:"none", border:"none", borderRadius:"8px", color:"#94a3b8", fontSize:"14px", cursor:"pointer", textAlign:"left", position:"relative" },
  navActive:    { display:"flex", alignItems:"center", gap:"10px", padding:"10px 12px", background:"rgba(56,189,248,0.1)", border:"none", borderRadius:"8px", color:"#38bdf8", fontSize:"14px", cursor:"pointer", textAlign:"left", fontWeight:"700", position:"relative", borderLeft:"3px solid #38bdf8" },
  navIcon:      { fontSize:"16px", width:"20px", textAlign:"center" },
  navDot:       { width:"6px", height:"6px", borderRadius:"50%", background:"#38bdf8", marginLeft:"auto" },
  statMini:     { background:"rgba(56,189,248,0.08)", border:"1px solid rgba(56,189,248,0.15)", borderRadius:"10px", padding:"12px 16px", textAlign:"center", marginBottom:"12px" },
  statMiniVal:  { fontSize:"24px", fontWeight:"800", color:"#38bdf8" },
  statMiniLabel:{ fontSize:"11px", color:"#64748b", marginTop:"2px" },
  logout:       { width:"100%", padding:"10px", background:"rgba(239,68,68,0.1)", border:"1px solid rgba(239,68,68,0.2)", borderRadius:"8px", color:"#fca5a5", cursor:"pointer", fontSize:"14px", fontWeight:"600" },
  main:         { flex:1, padding:"40px 48px", position:"relative", zIndex:1, overflowY:"auto" },
  toastOk:      { position:"fixed", top:"20px", right:"20px", zIndex:100, background:"rgba(34,197,94,0.15)", border:"1px solid rgba(34,197,94,0.4)", borderRadius:"10px", padding:"14px 20px", color:"#86efac", fontSize:"14px", fontWeight:"600", boxShadow:"0 4px 20px rgba(0,0,0,0.4)" },
  toastErr:     { position:"fixed", top:"20px", right:"20px", zIndex:100, background:"rgba(239,68,68,0.15)", border:"1px solid rgba(239,68,68,0.4)", borderRadius:"10px", padding:"14px 20px", color:"#fca5a5", fontSize:"14px", fontWeight:"600", boxShadow:"0 4px 20px rgba(0,0,0,0.4)" },
  section:      { maxWidth:"760px", margin:"0 auto" },
  sectionHeader:{ display:"flex", alignItems:"flex-start", gap:"16px", marginBottom:"28px" },
  sectionIcon:  { fontSize:"36px", width:"56px", height:"56px", background:"rgba(56,189,248,0.1)", border:"1px solid rgba(56,189,248,0.2)", borderRadius:"14px", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 },
  sectionTitle: { fontSize:"26px", fontWeight:"800", color:"#f1f5f9", margin:"0 0 6px" },
  sectionDesc:  { color:"#64748b", fontSize:"14px", margin:0 },
  formCard:     { background:"rgba(15,23,42,0.8)", border:"1px solid rgba(51,65,85,0.5)", borderRadius:"16px", padding:"28px", marginBottom:"24px" },
  formGrid:     { display:"grid", gridTemplateColumns:"1fr 1fr", gap:"16px", marginBottom:"16px" },
  field:        { display:"flex", flexDirection:"column", gap:"8px", marginBottom:"16px" },
  fieldLabel:   { fontSize:"11px", color:"#94a3b8", fontWeight:"700", textTransform:"uppercase", letterSpacing:"0.5px" },
  fieldInput:   { padding:"12px 16px", background:"rgba(30,41,59,0.8)", border:"1px solid rgba(51,65,85,0.8)", borderRadius:"10px", color:"#f1f5f9", fontSize:"14px", outline:"none", boxSizing:"border-box" },
  fieldSelect:  { padding:"12px 16px", background:"rgba(30,41,59,0.8)", border:"1px solid rgba(51,65,85,0.8)", borderRadius:"10px", color:"#f1f5f9", fontSize:"14px", outline:"none", cursor:"pointer" },
  primaryBtn:   { padding:"13px 28px", background:"linear-gradient(135deg,#38bdf8,#818cf8)", border:"none", borderRadius:"10px", color:"#0f172a", fontWeight:"800", fontSize:"15px", cursor:"pointer" },
  dangerBtn:    { padding:"13px 28px", background:"rgba(239,68,68,0.15)", border:"1px solid rgba(239,68,68,0.4)", borderRadius:"10px", color:"#fca5a5", fontWeight:"800", fontSize:"15px", cursor:"pointer" },
  btnLoading:   { padding:"13px 28px", background:"rgba(56,189,248,0.2)", border:"none", borderRadius:"10px", color:"#94a3b8", fontWeight:"800", fontSize:"15px", cursor:"not-allowed", width:"100%" },
  warningBox:   { background:"rgba(245,158,11,0.08)", border:"1px solid rgba(245,158,11,0.2)", borderRadius:"10px", padding:"12px 16px", color:"#fbbf24", fontSize:"13px", marginBottom:"16px" },
  searchRow:    { display:"flex", gap:"12px", alignItems:"flex-end" },
  searchInput:  { flex:1, padding:"12px 16px", background:"rgba(30,41,59,0.8)", border:"1px solid rgba(51,65,85,0.8)", borderRadius:"10px", color:"#f1f5f9", fontSize:"14px", outline:"none" },
  cardsGrid:    { display:"grid", gridTemplateColumns:"1fr 1fr", gap:"16px" },
  propCard:     { background:"rgba(15,23,42,0.8)", border:"1px solid rgba(51,65,85,0.5)", borderRadius:"14px", padding:"20px", borderTop:"3px solid rgba(56,189,248,0.4)" },
  propCardTop:  { display:"flex", justifyContent:"space-between", marginBottom:"10px" },
  propId:       { fontSize:"12px", color:"#64748b", fontFamily:"monospace" },
  propBadge:    { fontSize:"11px", background:"rgba(34,197,94,0.1)", color:"#86efac", padding:"3px 8px", borderRadius:"20px" },
  propSurvey:   { fontSize:"20px", fontWeight:"800", color:"#38bdf8", marginBottom:"6px" },
  propLocation: { fontSize:"13px", color:"#94a3b8", marginBottom:"12px" },
  propDivider:  { height:"1px", background:"rgba(51,65,85,0.5)", marginBottom:"12px" },
  propMeta:     { display:"flex", justifyContent:"space-between", fontSize:"12px" },
  propMetaLabel:{ color:"#64748b" },
  propMetaVal:  { color:"#e2e8f0", fontWeight:"600" },
  propTx:       { marginTop:"8px", fontSize:"11px", color:"#475569", fontFamily:"monospace" },
  emptyState:   { textAlign:"center", padding:"60px 20px", background:"rgba(15,23,42,0.6)", borderRadius:"16px", border:"1px dashed rgba(51,65,85,0.5)" },
  spinner:      { width:"16px", height:"16px", border:"2px solid rgba(56,189,248,0.3)", borderTop:"2px solid #38bdf8", borderRadius:"50%", display:"inline-block", animation:"spin 0.8s linear infinite" },
  satbaraResult:      { background:"rgba(34,197,94,0.08)", border:"1px solid rgba(34,197,94,0.2)", borderRadius:"12px", padding:"16px 20px", marginBottom:"20px" },
  satbaraResultHeader:{ display:"flex", alignItems:"center", gap:"12px" },
  satbaraError:       { background:"rgba(239,68,68,0.08)", border:"1px solid rgba(239,68,68,0.2)", borderRadius:"12px", padding:"16px 20px", color:"#fca5a5", marginBottom:"20px" },
  pdfSection:   { background:"rgba(15,23,42,0.8)", border:"1px solid rgba(51,65,85,0.5)", borderRadius:"16px", overflow:"hidden" },
  pdfHeader:    { display:"flex", justifyContent:"space-between", alignItems:"center", padding:"16px 20px", borderBottom:"1px solid rgba(51,65,85,0.4)", color:"#94a3b8", fontSize:"14px", fontWeight:"600" },
  downloadBtn:  { padding:"8px 16px", background:"linear-gradient(135deg,#38bdf8,#818cf8)", borderRadius:"8px", color:"#0f172a", fontWeight:"700", fontSize:"13px", textDecoration:"none" },
  pdfViewer:    { width:"100%", height:"600px", border:"none", background:"#fff" },
};

const reg = {
  stepBlock:        { background:"rgba(30,41,59,0.4)", border:"1px solid rgba(51,65,85,0.4)", borderRadius:"12px", padding:"20px", marginBottom:"20px" },
  stepHeader:       { display:"flex", alignItems:"flex-start", gap:"12px", marginBottom:"16px" },
  stepNum:          { width:"28px", height:"28px", borderRadius:"50%", flexShrink:0, background:"linear-gradient(135deg,#38bdf8,#818cf8)", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:"800", fontSize:"13px", color:"#0f172a" },
  stepTitle:        { fontSize:"14px", fontWeight:"700", color:"#e2e8f0", marginBottom:"3px" },
  stepDesc:         { fontSize:"12px", color:"#64748b" },
  fetchBtn:         { padding:"12px 20px", background:"linear-gradient(135deg,#38bdf8,#818cf8)", border:"none", borderRadius:"10px", color:"#0f172a", fontWeight:"800", fontSize:"14px", cursor:"pointer", whiteSpace:"nowrap" },
  pdfPreview:       { marginTop:"16px", background:"rgba(15,23,42,0.6)", border:"1px solid rgba(51,65,85,0.4)", borderRadius:"10px", overflow:"hidden" },
  pdfPreviewHeader: { display:"flex", justifyContent:"space-between", alignItems:"center", padding:"12px 16px", borderBottom:"1px solid rgba(51,65,85,0.3)" },
  pdfFrame:         { width:"100%", height:"320px", border:"none", background:"#fff" },
  dlBtn:            { padding:"6px 14px", background:"linear-gradient(135deg,#38bdf8,#818cf8)", borderRadius:"8px", color:"#0f172a", fontWeight:"700", fontSize:"12px", textDecoration:"none" },
  nomineeRow:       { display:"flex", alignItems:"center", gap:"10px", marginBottom:"8px" },
  nomineePill:      { background:"rgba(129,140,248,0.1)", border:"1px solid rgba(129,140,248,0.25)", borderRadius:"20px", padding:"6px 14px", color:"#818cf8", fontSize:"13px", fontWeight:"600" },
  removeBtn:        { background:"rgba(239,68,68,0.1)", border:"1px solid rgba(239,68,68,0.2)", borderRadius:"6px", color:"#fca5a5", cursor:"pointer", padding:"4px 10px", fontSize:"12px" },
  addBtn:           { padding:"12px 20px", background:"rgba(56,189,248,0.1)", border:"1px solid rgba(56,189,248,0.3)", borderRadius:"10px", color:"#38bdf8", fontWeight:"700", fontSize:"14px", cursor:"pointer", whiteSpace:"nowrap" },
};

const mp = {
  infoRow:    { display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:"14px", marginBottom:"24px" },
  infoCard:   { background:"rgba(15,23,42,0.8)", border:"1px solid rgba(51,65,85,0.4)", borderRadius:"12px", padding:"16px", display:"flex", gap:"12px", alignItems:"flex-start" },
  infoIcon:   { fontSize:"22px", flexShrink:0 },
  infoTitle:  { fontSize:"13px", fontWeight:"700", color:"#e2e8f0", marginBottom:"4px" },
  infoDesc:   { fontSize:"11px", color:"#64748b", lineHeight:"1.5" },
  formHeader: { display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"16px" },
  formTitle:  { fontSize:"14px", fontWeight:"700", color:"#94a3b8" },
  hintBtn:    { padding:"7px 14px", background:"rgba(56,189,248,0.1)", border:"1px solid rgba(56,189,248,0.2)", borderRadius:"8px", color:"#38bdf8", fontSize:"12px", cursor:"pointer", fontWeight:"600" },
  mapSection: { background:"rgba(15,23,42,0.8)", border:"1px solid rgba(51,65,85,0.5)", borderRadius:"14px", overflow:"hidden" },
  mapHeader:  { display:"flex", justifyContent:"space-between", alignItems:"flex-start", padding:"18px 20px", borderBottom:"1px solid rgba(51,65,85,0.4)" },
  mapTitle:   { fontSize:"16px", fontWeight:"700", color:"#f1f5f9", marginBottom:"4px" },
  mapSub:     { fontSize:"12px", color:"#38bdf8", marginBottom:"4px" },
  mapAddress: { fontSize:"11px", color:"#64748b", maxWidth:"480px", lineHeight:"1.4" },
  coordBox:   { display:"flex", gap:"20px", flexShrink:0 },
  coordItem:  { display:"flex", flexDirection:"column", gap:"3px", textAlign:"right" },
  coordLabel: { fontSize:"10px", color:"#475569", textTransform:"uppercase", letterSpacing:"0.5px" },
  coordVal:   { fontSize:"14px", fontWeight:"700", color:"#38bdf8", fontFamily:"monospace" },
  mapWrap:    { height:"480px" },
  osmNote:    { padding:"10px 20px", fontSize:"11px", color:"#334155", borderTop:"1px solid rgba(51,65,85,0.3)", textAlign:"center" },
};