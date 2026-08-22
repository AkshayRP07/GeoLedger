import React, { useState, useEffect, useRef } from "react";
import axios from "axios";

// ── Animated blockchain background ──────────────────────────────────────────
function BlockchainBg() {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    let W = canvas.width = window.innerWidth;
    let H = canvas.height = window.innerHeight;
    const nodes = Array.from({length: 22}, () => ({
      x: Math.random()*W, y: Math.random()*H,
      vx: (Math.random()-0.5)*0.3, vy: (Math.random()-0.5)*0.3, r: Math.random()*2.5+1.5
    }));
    let raf;
    const draw = () => {
      ctx.clearRect(0,0,W,H);
      nodes.forEach((a,i) => nodes.slice(i+1).forEach(b => {
        const d = Math.hypot(a.x-b.x, a.y-b.y);
        if(d<150){ ctx.beginPath(); ctx.strokeStyle=`rgba(56,189,248,${0.1*(1-d/150)})`; ctx.lineWidth=0.7; ctx.moveTo(a.x,a.y); ctx.lineTo(b.x,b.y); ctx.stroke(); }
      }));
      nodes.forEach(n => {
        ctx.beginPath(); ctx.arc(n.x,n.y,n.r,0,Math.PI*2);
        ctx.fillStyle="rgba(56,189,248,0.2)"; ctx.fill();
        n.x+=n.vx; n.y+=n.vy;
        if(n.x<0||n.x>W) n.vx*=-1; if(n.y<0||n.y>H) n.vy*=-1;
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

// ── Detail Modal ─────────────────────────────────────────────────────────────
function DetailModal({ record, type, onClose, onApprove, onReject }) {
  const [pdfUrl, setPdfUrl] = useState(null);

  useEffect(() => {
    if (record?.pdf_url) {
      setPdfUrl(`http://localhost:5000${record.pdf_url}`);
    }
  }, [record]);

  if (!record) return null;

  const isReg  = type === "register";
  const isPending = record.status === "Pending";

  return (
    <div style={m.overlay} onClick={e => e.target===e.currentTarget && onClose()}>
      <div style={m.modal}>
        {/* Header */}
        <div style={m.header}>
          <div style={m.headerLeft}>
            <div style={m.headerIcon}>{isReg ? "📋" : "🔄"}</div>
            <div>
              <div style={m.headerTitle}>{isReg ? "Registration Request" : "Sale Request"}</div>
              <div style={m.headerSub}>
                ID #{record.id} &nbsp;·&nbsp;
                <span style={{color: record.status==="Approved" ? "#86efac" : record.status==="Rejected" ? "#fca5a5" : "#fbbf24"}}>
                  {record.status}
                </span>
                &nbsp;·&nbsp; {new Date(record.date).toLocaleString()}
              </div>
            </div>
          </div>
          <button style={m.closeBtn} onClick={onClose}>✕</button>
        </div>

        <div style={m.body}>
          {/* LEFT — Details */}
          <div style={m.detailCol}>
            <div style={m.detailSection}>
              <div style={m.detailSectionTitle}>
                {isReg ? "🏠 Land Details" : "🔄 Transfer Details"}
              </div>
              {isReg ? (
                <div style={m.detailGrid}>
                  <DetailRow label="Survey Number" value={record.surveyNumber} highlight />
                  <DetailRow label="Village"       value={record.village} />
                  <DetailRow label="Taluka"        value={record.taluka} />
                  <DetailRow label="District"      value={record.district} />
                </div>
              ) : (
                <div style={m.detailGrid}>
                  <DetailRow label="Land ID"       value={record.landId} highlight />
                  <DetailRow label="Current Owner" value={record.currentOwner} />
                  <DetailRow label="Buyer"         value={record.buyer} />
                  <DetailRow label="Amount"        value={record.amount ? `₹ ${record.amount}` : "—"} />
                  <DetailRow label="Area to Sell"  value={record.area || "—"} highlight />
                  <DetailRow label="Transfer Type" value={record.transferType || "Pending Review"} />
                  {record.remainingArea && (
                    <DetailRow label="Seller Retains" value={record.remainingArea} />
                  )}
                </div>
              )}
            </div>

            <div style={m.detailSection}>
              <div style={m.detailSectionTitle}>👤 Owner / Wallet</div>
              <div style={m.detailGrid}>
                {isReg ? (
                  <>
                    <DetailRow label="Owner Username" value={record.owner} />
                    <DetailRow label="Wallet Address" value={record.ownerAddress} mono />
                  </>
                ) : (
                  <>
                    <DetailRow label="Buyer Username"      value={record.buyer} />
                    <DetailRow label="Buyer Wallet"        value={record.buyerAddress} mono />
                  </>
                )}
              </div>
            </div>

            {record.nominees?.length > 0 && (
              <div style={m.detailSection}>
                <div style={m.detailSectionTitle}>👥 Nominees</div>
                {record.nominees.map((n,i) => (
                  <div key={i} style={m.nomineePill}>{n}</div>
                ))}
              </div>
            )}

            {record.txHash && (
              <div style={m.detailSection}>
                <div style={m.detailSectionTitle}>🔗 Blockchain TX</div>
                <div style={m.txHash}>{record.txHash}</div>
              </div>
            )}

            {/* Action buttons */}
            {isPending && (
              <div style={m.actionRow}>
                <button style={m.approveBtn} onClick={onApprove}>
                  ✅ Approve & Write to Blockchain
                </button>
                <button style={m.rejectBtn} onClick={onReject}>
                  ❌ Reject
                </button>
              </div>
            )}
            {!isPending && (
              <div style={{
                padding:"12px 16px", borderRadius:"10px", textAlign:"center",
                background: record.status==="Approved" ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)",
                border: `1px solid ${record.status==="Approved" ? "rgba(34,197,94,0.3)" : "rgba(239,68,68,0.3)"}`,
                color: record.status==="Approved" ? "#86efac" : "#fca5a5",
                fontWeight:"700", fontSize:"14px"
              }}>
                {record.status==="Approved" ? "✅ This record has been approved and written to blockchain" : "❌ This record has been rejected"}
              </div>
            )}
          </div>

          {/* RIGHT — PDF Viewer */}
          <div style={m.pdfCol}>
            <div style={m.pdfHeader}>
              <span style={{fontSize:"14px",fontWeight:"700",color:"#94a3b8"}}>📄 Satbara Document</span>
              {pdfUrl && (
                <a href={pdfUrl} download style={m.dlBtn}>⬇️ Download</a>
              )}
            </div>
            {pdfUrl ? (
              <iframe src={pdfUrl} style={m.pdfFrame} title="Satbara"/>
            ) : (
              <div style={m.noPdf}>
                <div style={{fontSize:"40px",marginBottom:"10px"}}>📭</div>
                <div style={{color:"#64748b",fontSize:"14px"}}>No Satbara document attached</div>
                <div style={{color:"#475569",fontSize:"12px",marginTop:"6px"}}>
                  User did not fetch a document before submitting
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function DetailRow({ label, value, highlight, mono }) {
  return (
    <div style={m.detailRow}>
      <span style={m.detailLabel}>{label}</span>
      <span style={{
        ...m.detailValue,
        color: highlight ? "#38bdf8" : "#e2e8f0",
        fontFamily: mono ? "monospace" : "inherit",
        fontSize: mono ? "11px" : "13px",
        wordBreak: "break-all"
      }}>{value || "—"}</span>
    </div>
  );
}

// ── Main Component ───────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const [tab, setTab]               = useState("overview");
  const [data, setData]             = useState({ lands:[], registrations:[], sales:[], blockchain:{} });
  const [selected, setSelected]     = useState(null);   // { record, type, index }
  const [msg, setMsg]               = useState({text:"",type:""});

  const fetchData = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/admin_data");
      setData(res.data);
    } catch(e) { console.error(e); }
  };

  useEffect(() => { fetchData(); }, []);

  const notify = (text, type="success") => {
    setMsg({text,type});
    setTimeout(()=>setMsg({text:"",type:""}), 4000);
  };

  const handleVerify = async (status) => {
    if (!selected) return;
    try {
      await axios.post("http://localhost:5000/api/admin_verify", {
        index:  selected.index,
        status: status,
        type:   selected.type
      });
      notify(`Record ${status} successfully${status==="Approved" ? " and written to blockchain" : ""}!`);
      setSelected(null);
      fetchData();
    } catch(e) {
      notify(e.response?.data?.error || "Action failed", "error");
    } finally {}
  };

  const pending_reg  = data.registrations.filter(r=>r.status==="Pending");
  const pending_sale = data.sales.filter(s=>s.status==="Pending");
  const totalPending = pending_reg.length + pending_sale.length;

  const navItems = [
    { id:"overview",       icon:"📊", label:"Overview"      },
    { id:"registrations",  icon:"📋", label:"Registrations", badge: pending_reg.length  },
    { id:"sales",          icon:"🔄", label:"Sale Requests", badge: pending_sale.length },
    { id:"lands",          icon:"🏠", label:"All Lands"     },
    { id:"blockchain",     icon:"⛓️", label:"Blockchain"    },
  ];

  const StatusBadge = ({status}) => (
    <span style={{
      padding:"3px 10px", borderRadius:"20px", fontSize:"11px", fontWeight:"700",
      background: status==="Approved" ? "rgba(34,197,94,0.12)" : status==="Rejected" ? "rgba(239,68,68,0.12)" : "rgba(245,158,11,0.12)",
      color:      status==="Approved" ? "#86efac"              : status==="Rejected" ? "#fca5a5"              : "#fbbf24"
    }}>{status}</span>
  );

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
              <div style={s.logoSub}>Admin Panel</div>
            </div>
          </div>
          <div style={s.adminCard}>
            <div style={s.adminAvatar}>A</div>
            <div>
              <div style={s.adminName}>Administrator</div>
              <div style={s.adminRole}>Full System Access</div>
            </div>
          </div>
          <nav style={s.nav}>
            {navItems.map(n => (
              <button key={n.id} style={tab===n.id ? s.navActive : s.navItem}
                onClick={() => setTab(n.id)}>
                <span style={s.navIcon}>{n.icon}</span>
                <span style={{flex:1,textAlign:"left"}}>{n.label}</span>
                {n.badge > 0 && <span style={s.badge}>{n.badge}</span>}
                {tab===n.id && <span style={s.navDot}/>}
              </button>
            ))}
          </nav>
        </div>
        <div style={s.sideBottom}>
          {totalPending > 0 && (
            <div style={s.pendingAlert}>
              ⚠️ {totalPending} pending request{totalPending>1?"s":""} need review
            </div>
          )}
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

        {/* ── OVERVIEW ── */}
        {tab==="overview" && (
          <div style={s.section}>
            <h2 style={s.pageTitle}>📊 System Overview</h2>
            <div style={s.statsGrid}>
              {[
                { label:"Registered Lands",      val: data.lands.length,          icon:"🏠", color:"#38bdf8" },
                { label:"Total Registrations",   val: data.registrations.length,  icon:"📋", color:"#818cf8" },
                { label:"Total Sale Requests",   val: data.sales.length,          icon:"🔄", color:"#34d399" },
                { label:"Pending Approvals",     val: totalPending,               icon:"⏳", color:"#fbbf24" },
              ].map(st => (
                <div key={st.label} style={s.statCard}>
                  <div style={{...s.statIcon, background:`${st.color}18`, color:st.color}}>{st.icon}</div>
                  <div style={{...s.statVal, color:st.color}}>{st.val}</div>
                  <div style={s.statLabel}>{st.label}</div>
                </div>
              ))}
            </div>

            {/* Blockchain status */}
            <div style={s.bcCard}>
              <div style={s.bcCardTitle}>⛓️ Blockchain Status</div>
              <div style={s.bcRow}>
                <div style={s.bcItem}>
                  <span style={s.bcLabel}>Connection</span>
                  <span style={{...s.bcVal, color: data.blockchain?.connected ? "#86efac":"#fca5a5"}}>
                    {data.blockchain?.connected ? "🟢 Connected":"🔴 Disconnected"}
                  </span>
                </div>
                <div style={s.bcItem}>
                  <span style={s.bcLabel}>Block Number</span>
                  <span style={s.bcVal}>{data.blockchain?.blockNumber ?? "—"}</span>
                </div>
                <div style={s.bcItem}>
                  <span style={s.bcLabel}>Accounts</span>
                  <span style={s.bcVal}>{data.blockchain?.accounts?.length ?? 0}</span>
                </div>
              </div>
            </div>

            {/* Recent activity */}
            {totalPending > 0 && (
              <div style={s.alertCard}>
                <div style={s.alertTitle}>⚠️ Pending Actions Required</div>
                {pending_reg.map((r,i) => (
                  <div key={i} style={s.alertRow}
                    onClick={() => setSelected({record:r, type:"register", index:data.registrations.indexOf(r)})}>
                    <span>📋 Registration — Survey {r.surveyNumber}, {r.village}</span>
                    <span style={s.alertBtn}>Review →</span>
                  </div>
                ))}
                {pending_sale.map((s2,i) => (
                  <div key={i} style={s.alertRow}
                    onClick={() => setSelected({record:s2, type:"sell", index:data.sales.indexOf(s2)})}>
                    <span>🔄 Sale — Land ID {s2.landId}, Buyer: {s2.buyer}</span>
                    <span style={s.alertBtn}>Review →</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── REGISTRATIONS ── */}
        {tab==="registrations" && (
          <div style={s.section}>
            <h2 style={s.pageTitle}>📋 Land Registration Requests</h2>
            {data.registrations.length === 0 ? (
              <div style={s.empty}><div style={{fontSize:"40px"}}>📭</div><div>No registration requests yet</div></div>
            ) : (
              <div style={s.tableWrap}>
                <table style={s.table}>
                  <thead>
                    <tr>
                      {["#","Survey No","Village","Taluka","District","Owner","Date","Status","Actions"].map(h=>(
                        <th key={h} style={s.th}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data.registrations.map((r,i) => (
                      <tr key={i} style={s.tr}>
                        <td style={s.td}>{r.id}</td>
                        <td style={{...s.td, color:"#38bdf8", fontWeight:"700"}}>{r.surveyNumber}</td>
                        <td style={s.td}>{r.village}</td>
                        <td style={s.td}>{r.taluka}</td>
                        <td style={s.td}>{r.district}</td>
                        <td style={s.td}>{r.owner}</td>
                        <td style={{...s.td, fontSize:"11px", color:"#64748b"}}>{new Date(r.date).toLocaleDateString()}</td>
                        <td style={s.td}><StatusBadge status={r.status}/></td>
                        <td style={s.td}>
                          <button style={s.reviewBtn}
                            onClick={() => setSelected({record:r, type:"register", index:i})}>
                            🔍 Review
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ── SALES ── */}
        {tab==="sales" && (
          <div style={s.section}>
            <h2 style={s.pageTitle}>🔄 Land Sale Requests</h2>
            {data.sales.length === 0 ? (
              <div style={s.empty}><div style={{fontSize:"40px"}}>📭</div><div>No sale requests yet</div></div>
            ) : (
              <div style={s.tableWrap}>
                <table style={s.table}>
                  <thead>
                    <tr>
                      {["#","Land ID","Current Owner","Buyer","Amount","Date","Status","Actions"].map(h=>(
                        <th key={h} style={s.th}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data.sales.map((sale,i) => (
                      <tr key={i} style={s.tr}>
                        <td style={s.td}>{sale.id}</td>
                        <td style={{...s.td,color:"#38bdf8",fontWeight:"700"}}>{sale.landId}</td>
                        <td style={s.td}>{sale.currentOwner}</td>
                        <td style={s.td}>{sale.buyer}</td>
                        <td style={s.td}>{sale.amount ? `₹${sale.amount}` : "—"}</td>
                        <td style={{...s.td,fontSize:"11px",color:"#64748b"}}>{new Date(sale.date).toLocaleDateString()}</td>
                        <td style={s.td}><StatusBadge status={sale.status}/></td>
                        <td style={s.td}>
                          <button style={s.reviewBtn}
                            onClick={() => setSelected({record:sale, type:"sell", index:i})}>
                            🔍 Review
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ── ALL LANDS ── */}
        {tab==="lands" && (
          <div style={s.section}>
            <h2 style={s.pageTitle}>🏠 All Registered Lands</h2>
            {data.lands.length === 0 ? (
              <div style={s.empty}>
                <div style={{fontSize:"40px"}}>🏚️</div>
                <div>No approved lands yet</div>
                <div style={{color:"#475569",fontSize:"13px",marginTop:"6px"}}>
                  Approve registration requests to see them here
                </div>
              </div>
            ) : (
              <div style={s.landsGrid}>
                {data.lands.map((land,i) => (
                  <div key={i} style={s.landCard}>
                    <div style={s.landCardTop}>
                      <span style={s.landId}>Land #{land.id}</span>
                      <span style={{...s.propBadge}}>✅ On-Chain</span>
                    </div>
                    <div style={s.landSurvey}>{land.surveyNumber}</div>
                    <div style={s.landLoc}>📍 {land.village}, {land.taluka}, {land.district}</div>
                    <div style={s.landDivider}/>
                    <div style={s.landMeta}>
                      <span style={{color:"#64748b",fontSize:"12px"}}>Owner</span>
                      <span style={{color:"#e2e8f0",fontSize:"12px",fontWeight:"700"}}>{land.owner}</span>
                    </div>
                    <div style={s.landMeta}>
                      <span style={{color:"#64748b",fontSize:"11px"}}>Wallet</span>
                      <span style={{color:"#475569",fontSize:"10px",fontFamily:"monospace"}}>
                        {land.ownerAddress?.slice(0,16)}...
                      </span>
                    </div>
                    {land.txHash && (
                      <div style={s.landTx}>🔗 {land.txHash.slice(0,22)}...</div>
                    )}
                    {land.history?.length > 1 && (
                      <div style={s.historyBadge}>🔄 {land.history.length} ownership changes</div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── BLOCKCHAIN ── */}
        {tab==="blockchain" && (
          <div style={s.section}>
            <h2 style={s.pageTitle}>⛓️ Blockchain Info</h2>
            <div style={s.bcDetailCard}>
              <div style={s.bcDetailRow}>
                <span style={s.bcDetailLabel}>Status</span>
                <span style={{color: data.blockchain?.connected ? "#86efac":"#fca5a5", fontWeight:"700"}}>
                  {data.blockchain?.connected ? "🟢 Connected to Ganache" : "🔴 Not Connected"}
                </span>
              </div>
              <div style={s.bcDetailRow}>
                <span style={s.bcDetailLabel}>RPC URL</span>
                <span style={{color:"#94a3b8", fontFamily:"monospace"}}>http://127.0.0.1:8545</span>
              </div>
              <div style={s.bcDetailRow}>
                <span style={s.bcDetailLabel}>Latest Block</span>
                <span style={{color:"#38bdf8", fontWeight:"700"}}>{data.blockchain?.blockNumber ?? "—"}</span>
              </div>
            </div>
            <h3 style={{color:"#94a3b8",marginTop:"28px",marginBottom:"16px",fontSize:"14px",textTransform:"uppercase",letterSpacing:"1px"}}>
              Available Accounts
            </h3>
            <div style={s.accountsList}>
              {(data.blockchain?.accounts||[]).map((acc,i) => (
                <div key={acc} style={s.accountRow}>
                  <span style={s.accountIndex}>{i}</span>
                  <span style={s.accountAddr}>{acc}</span>
                  <span style={s.accountBal}>1000 ETH</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* DETAIL MODAL */}
      {selected && (
        <DetailModal
          record={selected.record}
          type={selected.type}
          onClose={() => setSelected(null)}
          onApprove={() => handleVerify("Approved")}
          onReject={()  => handleVerify("Rejected")}
        />
      )}
    </div>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────
const s = {
  root:       { display:"flex", minHeight:"100vh", background:"#020817", fontFamily:"'Segoe UI',sans-serif", color:"#f1f5f9" },
  sidebar:    { width:"240px", background:"rgba(15,23,42,0.95)", borderRight:"1px solid rgba(51,65,85,0.5)", display:"flex", flexDirection:"column", justifyContent:"space-between", position:"sticky", top:0, height:"100vh", zIndex:10 },
  sideTop:    { padding:"24px 16px", display:"flex", flexDirection:"column", gap:"18px" },
  sideBottom: { padding:"16px" },
  logo:       { display:"flex", alignItems:"center", gap:"10px", paddingBottom:"16px", borderBottom:"1px solid rgba(51,65,85,0.4)" },
  logoName:   { fontSize:"16px", fontWeight:"800", color:"#f1f5f9" },
  logoSub:    { fontSize:"10px", color:"#f59e0b", textTransform:"uppercase", letterSpacing:"1.5px" },
  adminCard:  { display:"flex", alignItems:"center", gap:"12px", background:"rgba(245,158,11,0.08)", border:"1px solid rgba(245,158,11,0.2)", borderRadius:"10px", padding:"12px" },
  adminAvatar:{ width:"36px", height:"36px", borderRadius:"50%", background:"linear-gradient(135deg,#f59e0b,#ef4444)", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:"800", fontSize:"16px", color:"#0f172a", flexShrink:0 },
  adminName:  { fontSize:"14px", fontWeight:"700", color:"#fbbf24" },
  adminRole:  { fontSize:"11px", color:"#78716c", marginTop:"2px" },
  nav:        { display:"flex", flexDirection:"column", gap:"4px" },
  navItem:    { display:"flex", alignItems:"center", gap:"10px", padding:"10px 12px", background:"none", border:"none", borderRadius:"8px", color:"#94a3b8", fontSize:"14px", cursor:"pointer", position:"relative" },
  navActive:  { display:"flex", alignItems:"center", gap:"10px", padding:"10px 12px", background:"rgba(245,158,11,0.1)", border:"none", borderRadius:"8px", color:"#f59e0b", fontSize:"14px", cursor:"pointer", fontWeight:"700", position:"relative", borderLeft:"3px solid #f59e0b" },
  navIcon:    { fontSize:"16px", width:"20px", textAlign:"center" },
  navDot:     { width:"6px", height:"6px", borderRadius:"50%", background:"#f59e0b", marginLeft:"auto" },
  badge:      { background:"#ef4444", color:"#fff", borderRadius:"10px", padding:"1px 7px", fontSize:"11px", fontWeight:"700", marginLeft:"auto" },
  pendingAlert:{ background:"rgba(245,158,11,0.08)", border:"1px solid rgba(245,158,11,0.2)", borderRadius:"8px", padding:"10px 12px", color:"#fbbf24", fontSize:"12px", marginBottom:"10px", textAlign:"center" },
  logout:     { width:"100%", padding:"10px", background:"rgba(239,68,68,0.1)", border:"1px solid rgba(239,68,68,0.2)", borderRadius:"8px", color:"#fca5a5", cursor:"pointer", fontSize:"14px", fontWeight:"600" },
  main:       { flex:1, padding:"40px 48px", position:"relative", zIndex:1, overflowY:"auto" },
  toastOk:    { position:"fixed", top:"20px", right:"20px", zIndex:200, background:"rgba(34,197,94,0.15)", border:"1px solid rgba(34,197,94,0.4)", borderRadius:"10px", padding:"14px 20px", color:"#86efac", fontSize:"14px", fontWeight:"600" },
  toastErr:   { position:"fixed", top:"20px", right:"20px", zIndex:200, background:"rgba(239,68,68,0.15)", border:"1px solid rgba(239,68,68,0.4)", borderRadius:"10px", padding:"14px 20px", color:"#fca5a5", fontSize:"14px", fontWeight:"600" },
  section:    { maxWidth:"1100px", margin:"0 auto" },
  pageTitle:  { fontSize:"24px", fontWeight:"800", color:"#f1f5f9", marginBottom:"28px" },
  statsGrid:  { display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:"16px", marginBottom:"28px" },
  statCard:   { background:"rgba(15,23,42,0.8)", border:"1px solid rgba(51,65,85,0.5)", borderRadius:"14px", padding:"20px", textAlign:"center" },
  statIcon:   { width:"44px", height:"44px", borderRadius:"12px", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"20px", margin:"0 auto 12px" },
  statVal:    { fontSize:"32px", fontWeight:"800", marginBottom:"4px" },
  statLabel:  { fontSize:"12px", color:"#64748b", textTransform:"uppercase", letterSpacing:"0.5px" },
  bcCard:     { background:"rgba(15,23,42,0.8)", border:"1px solid rgba(51,65,85,0.5)", borderRadius:"14px", padding:"20px", marginBottom:"24px" },
  bcCardTitle:{ fontSize:"14px", fontWeight:"700", color:"#94a3b8", marginBottom:"16px", textTransform:"uppercase", letterSpacing:"1px" },
  bcRow:      { display:"flex", gap:"32px" },
  bcItem:     { display:"flex", flexDirection:"column", gap:"4px" },
  bcLabel:    { fontSize:"11px", color:"#475569", textTransform:"uppercase" },
  bcVal:      { fontSize:"16px", fontWeight:"700", color:"#e2e8f0" },
  alertCard:  { background:"rgba(245,158,11,0.06)", border:"1px solid rgba(245,158,11,0.2)", borderRadius:"14px", padding:"20px" },
  alertTitle: { fontSize:"14px", fontWeight:"700", color:"#fbbf24", marginBottom:"14px" },
  alertRow:   { display:"flex", justifyContent:"space-between", alignItems:"center", padding:"10px 14px", background:"rgba(15,23,42,0.6)", borderRadius:"8px", marginBottom:"8px", cursor:"pointer", fontSize:"13px", color:"#94a3b8" },
  alertBtn:   { color:"#f59e0b", fontWeight:"700", fontSize:"13px" },
  tableWrap:  { background:"rgba(15,23,42,0.8)", border:"1px solid rgba(51,65,85,0.5)", borderRadius:"14px", overflow:"auto" },
  table:      { width:"100%", borderCollapse:"collapse" },
  th:         { padding:"14px 16px", textAlign:"left", fontSize:"11px", color:"#64748b", textTransform:"uppercase", letterSpacing:"0.5px", borderBottom:"1px solid rgba(51,65,85,0.4)", whiteSpace:"nowrap" },
  tr:         { borderBottom:"1px solid rgba(51,65,85,0.2)" },
  td:         { padding:"13px 16px", fontSize:"13px", color:"#94a3b8" },
  reviewBtn:  { padding:"6px 14px", background:"rgba(56,189,248,0.1)", border:"1px solid rgba(56,189,248,0.3)", borderRadius:"6px", color:"#38bdf8", fontSize:"12px", cursor:"pointer", fontWeight:"600", whiteSpace:"nowrap" },
  landsGrid:  { display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:"16px" },
  landCard:   { background:"rgba(15,23,42,0.8)", border:"1px solid rgba(51,65,85,0.5)", borderRadius:"14px", padding:"18px", borderTop:"3px solid rgba(56,189,248,0.4)" },
  landCardTop:{ display:"flex", justifyContent:"space-between", marginBottom:"10px" },
  landId:     { fontSize:"12px", color:"#64748b", fontFamily:"monospace" },
  propBadge:  { fontSize:"11px", background:"rgba(34,197,94,0.1)", color:"#86efac", padding:"3px 8px", borderRadius:"20px" },
  landSurvey: { fontSize:"20px", fontWeight:"800", color:"#38bdf8", marginBottom:"6px" },
  landLoc:    { fontSize:"12px", color:"#94a3b8", marginBottom:"12px" },
  landDivider:{ height:"1px", background:"rgba(51,65,85,0.5)", marginBottom:"10px" },
  landMeta:   { display:"flex", justifyContent:"space-between", marginBottom:"4px" },
  landTx:     { marginTop:"8px", fontSize:"10px", color:"#334155", fontFamily:"monospace" },
  historyBadge:{ marginTop:"8px", fontSize:"11px", color:"#818cf8", background:"rgba(129,140,248,0.08)", padding:"3px 8px", borderRadius:"20px", display:"inline-block" },
  bcDetailCard:{ background:"rgba(15,23,42,0.8)", border:"1px solid rgba(51,65,85,0.5)", borderRadius:"14px", padding:"24px" },
  bcDetailRow: { display:"flex", justifyContent:"space-between", alignItems:"center", padding:"12px 0", borderBottom:"1px solid rgba(51,65,85,0.3)" },
  bcDetailLabel:{ fontSize:"13px", color:"#64748b", fontWeight:"600" },
  accountsList:{ background:"rgba(15,23,42,0.8)", border:"1px solid rgba(51,65,85,0.5)", borderRadius:"14px", overflow:"hidden" },
  accountRow:  { display:"flex", alignItems:"center", gap:"16px", padding:"12px 20px", borderBottom:"1px solid rgba(51,65,85,0.2)", fontSize:"13px" },
  accountIndex:{ width:"24px", height:"24px", borderRadius:"50%", background:"rgba(56,189,248,0.1)", color:"#38bdf8", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"11px", fontWeight:"700", flexShrink:0 },
  accountAddr: { flex:1, fontFamily:"monospace", color:"#94a3b8", fontSize:"12px" },
  accountBal:  { color:"#34d399", fontWeight:"700", fontSize:"12px" },
  empty:       { textAlign:"center", padding:"60px", background:"rgba(15,23,42,0.6)", borderRadius:"16px", border:"1px dashed rgba(51,65,85,0.5)", color:"#94a3b8", display:"flex", flexDirection:"column", alignItems:"center", gap:"10px" },
};

const m = {
  overlay:    { position:"fixed", inset:0, background:"rgba(0,0,0,0.75)", zIndex:100, display:"flex", alignItems:"center", justifyContent:"center", padding:"20px" },
  modal:      { background:"#0f172a", border:"1px solid rgba(51,65,85,0.6)", borderRadius:"20px", width:"100%", maxWidth:"1000px", maxHeight:"90vh", display:"flex", flexDirection:"column", overflow:"hidden" },
  header:     { display:"flex", justifyContent:"space-between", alignItems:"center", padding:"20px 28px", borderBottom:"1px solid rgba(51,65,85,0.4)", background:"rgba(15,23,42,0.9)" },
  headerLeft: { display:"flex", alignItems:"center", gap:"14px" },
  headerIcon: { fontSize:"32px", width:"52px", height:"52px", background:"rgba(56,189,248,0.1)", borderRadius:"12px", display:"flex", alignItems:"center", justifyContent:"center" },
  headerTitle:{ fontSize:"18px", fontWeight:"800", color:"#f1f5f9" },
  headerSub:  { fontSize:"12px", color:"#64748b", marginTop:"3px" },
  closeBtn:   { background:"rgba(51,65,85,0.4)", border:"none", borderRadius:"8px", color:"#94a3b8", width:"32px", height:"32px", cursor:"pointer", fontSize:"16px" },
  body:       { display:"flex", flex:1, overflow:"hidden" },
  detailCol:  { width:"380px", padding:"24px", borderRight:"1px solid rgba(51,65,85,0.4)", overflowY:"auto", display:"flex", flexDirection:"column", gap:"20px" },
  pdfCol:     { flex:1, display:"flex", flexDirection:"column" },
  pdfHeader:  { display:"flex", justifyContent:"space-between", alignItems:"center", padding:"14px 20px", borderBottom:"1px solid rgba(51,65,85,0.4)" },
  pdfFrame:   { flex:1, width:"100%", border:"none", background:"#fff" },
  noPdf:      { flex:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", color:"#64748b" },
  dlBtn:      { padding:"7px 14px", background:"linear-gradient(135deg,#38bdf8,#818cf8)", borderRadius:"8px", color:"#0f172a", fontWeight:"700", fontSize:"12px", textDecoration:"none" },
  detailSection:   { background:"rgba(30,41,59,0.5)", border:"1px solid rgba(51,65,85,0.4)", borderRadius:"12px", padding:"16px" },
  detailSectionTitle:{ fontSize:"12px", fontWeight:"700", color:"#64748b", textTransform:"uppercase", letterSpacing:"0.5px", marginBottom:"12px" },
  detailGrid:  { display:"flex", flexDirection:"column", gap:"8px" },
  detailRow:   { display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:"8px" },
  detailLabel: { fontSize:"12px", color:"#64748b", flexShrink:0, paddingTop:"1px" },
  detailValue: { fontSize:"13px", fontWeight:"600", textAlign:"right" },
  nomineePill: { display:"inline-block", background:"rgba(129,140,248,0.1)", border:"1px solid rgba(129,140,248,0.2)", borderRadius:"20px", padding:"3px 10px", fontSize:"12px", color:"#818cf8", marginRight:"6px", marginBottom:"4px" },
  txHash:      { fontFamily:"monospace", fontSize:"11px", color:"#475569", wordBreak:"break-all", background:"rgba(15,23,42,0.6)", padding:"8px", borderRadius:"6px" },
  actionRow:   { display:"flex", flexDirection:"column", gap:"10px" },
  approveBtn:  { padding:"13px", background:"linear-gradient(135deg,#22c55e,#16a34a)", border:"none", borderRadius:"10px", color:"#fff", fontWeight:"800", fontSize:"14px", cursor:"pointer" },
  rejectBtn:   { padding:"13px", background:"rgba(239,68,68,0.1)", border:"1px solid rgba(239,68,68,0.3)", borderRadius:"10px", color:"#fca5a5", fontWeight:"800", fontSize:"14px", cursor:"pointer" },
};