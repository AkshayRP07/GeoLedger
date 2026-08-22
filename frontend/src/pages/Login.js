import React, { useState } from "react";
import axios from "axios";

export default function Login() {
  const [mode, setMode]         = useState("login"); // "login" | "register"
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError]       = useState("");
  const [success, setSuccess]   = useState("");
  const [loading, setLoading]   = useState(false);

  const reset = () => {
    setUsername(""); setPassword(""); setConfirmPass("");
    setError(""); setSuccess(""); setShowPass(false); setShowConfirm(false);
  };

  const switchMode = (m) => { reset(); setMode(m); };

  const handleLogin = async () => {
    if (!username || !password) { setError("Please enter both fields"); return; }
    setLoading(true); setError("");
    try {
      const res = await axios.post("http://localhost:5000/api/login", { username, password });
      localStorage.setItem("geoledger_user", JSON.stringify(res.data));
      window.location.href = res.data.role === "admin" ? "/admin" : "/user";
    } catch (err) {
      setError(err.response?.data?.error || "Login failed. Is the backend running?");
    } finally { setLoading(false); }
  };

  const handleRegister = async () => {
    if (!username || !password || !confirmPass) { setError("All fields are required"); return; }
    if (password.length < 6) { setError("Password must be at least 6 characters"); return; }
    if (password !== confirmPass) { setError("Passwords do not match"); return; }
    setLoading(true); setError("");
    try {
      await axios.post("http://localhost:5000/api/register", { username, password, role: "user" });
      setSuccess("Account created! You can now log in.");
      setTimeout(() => switchMode("login"), 1800);
    } catch (err) {
      setError(err.response?.data?.error || "Registration failed");
    } finally { setLoading(false); }
  };

  const handleKey = (e) => { if (e.key === "Enter") mode === "login" ? handleLogin() : handleRegister(); };

  const features = [
    { icon: "🔗", title: "Blockchain Secured",   desc: "Every record is immutable and tamper-proof on Ethereum" },
    { icon: "📜", title: "Satbara Verified",      desc: "Fetch digitally signed 7/12 extracts from government portals" },
    { icon: "🔄", title: "Instant Transfer",      desc: "Transfer land ownership with full audit trail on-chain" },
    { icon: "🛡️", title: "Fraud Prevention",      desc: "Eliminate fake ownership claims through cryptographic proof" },
  ];

  const EyeIcon = ({ show, toggle }) => (
    <button onClick={toggle} style={s.eyeBtn} type="button" tabIndex={-1}>
      {show ? (
        // eye-off
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2">
          <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/>
          <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/>
          <line x1="1" y1="1" x2="23" y2="23"/>
        </svg>
      ) : (
        // eye
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2">
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
          <circle cx="12" cy="12" r="3"/>
        </svg>
      )}
    </button>
  );

  return (
    <div style={s.root}>
      <div style={s.bgGrid} />
      <div style={s.orb1} /><div style={s.orb2} />

      {/* LEFT PANEL */}
      <div style={s.left}>
        <div style={s.brand}>
          <span style={s.brandIcon}>⛓️</span>
          <div>
            <div style={s.brandName}>GeoLedger</div>
            <div style={s.brandSub}>Blockchain Land Registry</div>
          </div>
        </div>
        <div style={s.heroText}>
          Securing Land<br />
          <span style={s.heroHighlight}>Ownership</span><br />
          on the Blockchain
        </div>
        <p style={s.heroDesc}>
          A decentralized land registration platform that brings transparency,
          security, and trust to property ownership using Ethereum smart contracts
          and government-verified Satbara records.
        </p>
        <div style={s.featuresGrid}>
          {features.map(f => (
            <div key={f.title} style={s.featureCard}>
              <span style={s.featureIcon}>{f.icon}</span>
              <div>
                <div style={s.featureTitle}>{f.title}</div>
                <div style={s.featureDesc}>{f.desc}</div>
              </div>
            </div>
          ))}
        </div>
        <div style={s.chainRow}>
          {["Genesis","Block #1","Block #2","Block #3","Latest"].map((b,i,arr) => (
            <React.Fragment key={b}>
              <div style={s.block}>
                <div style={s.blockHash}>0x{Math.random().toString(16).slice(2,8)}</div>
                <div style={s.blockLabel}>{b}</div>
              </div>
              {i < arr.length-1 && <div style={s.chainArrow}>→</div>}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div style={s.right}>
        <div style={s.card}>

          {/* Tab switcher */}
          <div style={s.tabRow}>
            <button style={mode==="login" ? s.tabActive : s.tabInactive}
              onClick={() => switchMode("login")}>Sign In</button>
            <button style={mode==="register" ? s.tabActive : s.tabInactive}
              onClick={() => switchMode("register")}>Register</button>
          </div>

          {mode === "login" ? (
            <>
              <div style={s.cardTop}>
                <div style={s.cardIcon}>🌍</div>
                <h2 style={s.cardTitle}>Welcome Back</h2>
                <p style={s.cardSub}>Sign in to access the land registry</p>
              </div>

              {/* Username */}
              <div style={s.inputGroup}>
                <label style={s.label}>Username</label>
                <div style={s.inputWrap}>
                  <span style={s.inputIconLeft}>👤</span>
                  <input style={s.input} placeholder="Enter your username"
                    value={username} onChange={e => setUsername(e.target.value)} onKeyDown={handleKey} />
                </div>
              </div>

              {/* Password */}
              <div style={s.inputGroup}>
                <label style={s.label}>Password</label>
                <div style={s.inputWrap}>
                  <span style={s.inputIconLeft}>🔒</span>
                  <input style={s.input} placeholder="Enter your password"
                    type={showPass ? "text" : "password"}
                    value={password} onChange={e => setPassword(e.target.value)} onKeyDown={handleKey} />
                  <EyeIcon show={showPass} toggle={() => setShowPass(p => !p)} />
                </div>
              </div>

              {error   && <div style={s.errorBox}>⚠️ {error}</div>}

              <button style={loading ? s.btnDisabled : s.btn} onClick={handleLogin} disabled={loading}>
                {loading ? "Authenticating..." : "Login to GeoLedger"}
              </button>

              <div style={s.divider}><span style={s.dividerText}>Default Credentials</span></div>
              <div style={s.credRow}>
                <div style={s.credBox} onClick={() => { setUsername("admin"); setPassword("admin123"); }}>
                  <div style={s.credRole}>🛡️ Admin</div>
                  <div style={s.credHint}>admin / admin123</div>
                </div>
                <div style={s.credBox} onClick={() => { setUsername("user1"); setPassword("user123"); }}>
                  <div style={s.credRole}>👤 User</div>
                  <div style={s.credHint}>user1 / user123</div>
                </div>
              </div>
            </>
          ) : (
            <>
              <div style={s.cardTop}>
                <div style={s.cardIcon}>📝</div>
                <h2 style={s.cardTitle}>Create Account</h2>
                <p style={s.cardSub}>Register to access the land registry</p>
              </div>

              {/* Username */}
              <div style={s.inputGroup}>
                <label style={s.label}>Username</label>
                <div style={s.inputWrap}>
                  <span style={s.inputIconLeft}>👤</span>
                  <input style={s.input} placeholder="Choose a username"
                    value={username} onChange={e => setUsername(e.target.value)} onKeyDown={handleKey} />
                </div>
              </div>

              {/* Password */}
              <div style={s.inputGroup}>
                <label style={s.label}>Password</label>
                <div style={s.inputWrap}>
                  <span style={s.inputIconLeft}>🔒</span>
                  <input style={s.input} placeholder="Min. 6 characters"
                    type={showPass ? "text" : "password"}
                    value={password} onChange={e => setPassword(e.target.value)} onKeyDown={handleKey} />
                  <EyeIcon show={showPass} toggle={() => setShowPass(p => !p)} />
                </div>
              </div>

              {/* Confirm Password */}
              <div style={s.inputGroup}>
                <label style={s.label}>Confirm Password</label>
                <div style={s.inputWrap}>
                  <span style={s.inputIconLeft}>🔒</span>
                  <input style={s.input} placeholder="Re-enter your password"
                    type={showConfirm ? "text" : "password"}
                    value={confirmPass} onChange={e => setConfirmPass(e.target.value)} onKeyDown={handleKey} />
                  <EyeIcon show={showConfirm} toggle={() => setShowConfirm(p => !p)} />
                </div>
              </div>

              {/* Password strength hint */}
              {password.length > 0 && (
                <div style={s.strengthRow}>
                  <div style={{...s.strengthBar,
                    background: password.length < 6 ? "#ef4444"
                               : password.length < 10 ? "#f59e0b" : "#22c55e",
                    width: password.length < 6 ? "33%" : password.length < 10 ? "66%" : "100%"
                  }}/>
                  <span style={s.strengthLabel}>
                    {password.length < 6 ? "Weak" : password.length < 10 ? "Medium" : "Strong"}
                  </span>
                </div>
              )}

              {error   && <div style={s.errorBox}>⚠️ {error}</div>}
              {success && <div style={s.successBox}>✅ {success}</div>}

              <button style={loading ? s.btnDisabled : s.btn} onClick={handleRegister} disabled={loading}>
                {loading ? "Creating Account..." : "Create Account"}
              </button>

              <p style={s.switchHint}>
                Already have an account?{" "}
                <span style={s.switchLink} onClick={() => switchMode("login")}>Sign in</span>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

const s = {
  root: { display:"flex", minHeight:"100vh", background:"#020817",
    fontFamily:"'Segoe UI', sans-serif", position:"relative", overflow:"hidden" },
  bgGrid: { position:"fixed", inset:0, zIndex:0,
    backgroundImage:`linear-gradient(rgba(56,189,248,0.03) 1px,transparent 1px),
      linear-gradient(90deg,rgba(56,189,248,0.03) 1px,transparent 1px)`,
    backgroundSize:"40px 40px" },
  orb1: { position:"fixed", top:"-200px", left:"-200px", width:"600px", height:"600px",
    borderRadius:"50%", background:"radial-gradient(circle,rgba(56,189,248,0.08) 0%,transparent 70%)",
    zIndex:0, pointerEvents:"none" },
  orb2: { position:"fixed", bottom:"-200px", right:"300px", width:"500px", height:"500px",
    borderRadius:"50%", background:"radial-gradient(circle,rgba(139,92,246,0.07) 0%,transparent 70%)",
    zIndex:0, pointerEvents:"none" },

  left: { flex:1, padding:"48px 56px", display:"flex", flexDirection:"column",
    gap:"32px", position:"relative", zIndex:1 },
  brand: { display:"flex", alignItems:"center", gap:"14px" },
  brandIcon: { fontSize:"36px" },
  brandName: { fontSize:"24px", fontWeight:"800", color:"#f1f5f9", letterSpacing:"-0.5px" },
  brandSub: { fontSize:"12px", color:"#38bdf8", letterSpacing:"2px", textTransform:"uppercase" },
  heroText: { fontSize:"52px", fontWeight:"800", color:"#f1f5f9", lineHeight:"1.1", letterSpacing:"-1px" },
  heroHighlight: { background:"linear-gradient(135deg,#38bdf8,#818cf8)",
    WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" },
  heroDesc: { color:"#94a3b8", fontSize:"15px", lineHeight:"1.7", maxWidth:"480px", margin:0 },

  featuresGrid: { display:"grid", gridTemplateColumns:"1fr 1fr", gap:"16px", maxWidth:"520px" },
  featureCard: { background:"rgba(15,23,42,0.8)", border:"1px solid rgba(51,65,85,0.5)",
    borderRadius:"12px", padding:"16px", display:"flex", gap:"12px", alignItems:"flex-start" },
  featureIcon: { fontSize:"24px", flexShrink:0 },
  featureTitle: { fontSize:"13px", fontWeight:"700", color:"#e2e8f0", marginBottom:"4px" },
  featureDesc: { fontSize:"11px", color:"#64748b", lineHeight:"1.5" },

  chainRow: { display:"flex", alignItems:"center", gap:"8px",
    background:"rgba(15,23,42,0.6)", border:"1px solid rgba(56,189,248,0.1)",
    borderRadius:"12px", padding:"16px 20px", width:"fit-content" },
  block: { background:"rgba(56,189,248,0.08)", border:"1px solid rgba(56,189,248,0.2)",
    borderRadius:"8px", padding:"8px 12px", textAlign:"center" },
  blockHash: { fontSize:"10px", color:"#38bdf8", fontFamily:"monospace" },
  blockLabel: { fontSize:"10px", color:"#64748b", marginTop:"2px" },
  chainArrow: { color:"#334155", fontSize:"16px" },

  right: { width:"460px", display:"flex", alignItems:"center", justifyContent:"center",
    padding:"48px 40px", position:"relative", zIndex:1,
    background:"rgba(15,23,42,0.5)", borderLeft:"1px solid rgba(51,65,85,0.4)" },
  card: { width:"100%", maxWidth:"380px" },

  tabRow: { display:"flex", background:"rgba(15,23,42,0.8)", borderRadius:"12px",
    padding:"4px", marginBottom:"28px", border:"1px solid rgba(51,65,85,0.4)" },
  tabActive: { flex:1, padding:"10px", background:"linear-gradient(135deg,#38bdf8,#818cf8)",
    border:"none", borderRadius:"8px", color:"#0f172a", fontWeight:"700",
    fontSize:"14px", cursor:"pointer" },
  tabInactive: { flex:1, padding:"10px", background:"none", border:"none",
    borderRadius:"8px", color:"#64748b", fontWeight:"600", fontSize:"14px", cursor:"pointer" },

  cardTop: { textAlign:"center", marginBottom:"28px" },
  cardIcon: { fontSize:"44px", marginBottom:"10px" },
  cardTitle: { fontSize:"22px", fontWeight:"800", color:"#f1f5f9", margin:"0 0 6px" },
  cardSub: { color:"#64748b", fontSize:"13px", margin:0 },

  inputGroup: { marginBottom:"18px" },
  label: { display:"block", fontSize:"11px", color:"#94a3b8", marginBottom:"7px",
    fontWeight:"600", textTransform:"uppercase", letterSpacing:"0.5px" },
  inputWrap: { position:"relative", display:"flex", alignItems:"center" },
  inputIconLeft: { position:"absolute", left:"14px", fontSize:"15px", zIndex:1 },
  input: { width:"100%", padding:"13px 44px 13px 44px", background:"rgba(30,41,59,0.8)",
    border:"1px solid rgba(51,65,85,0.8)", borderRadius:"10px", color:"#f1f5f9",
    fontSize:"14px", boxSizing:"border-box", outline:"none" },
  eyeBtn: { position:"absolute", right:"12px", background:"none", border:"none",
    cursor:"pointer", padding:"4px", display:"flex", alignItems:"center", zIndex:1 },

  strengthRow: { display:"flex", alignItems:"center", gap:"10px", marginBottom:"14px", marginTop:"-8px" },
  strengthBar: { height:"4px", borderRadius:"2px", transition:"all 0.3s", flexShrink:0 },
  strengthLabel: { fontSize:"11px", color:"#94a3b8" },

  errorBox: { background:"rgba(239,68,68,0.1)", border:"1px solid rgba(239,68,68,0.3)",
    borderRadius:"8px", padding:"11px 14px", color:"#fca5a5",
    fontSize:"13px", marginBottom:"14px" },
  successBox: { background:"rgba(34,197,94,0.1)", border:"1px solid rgba(34,197,94,0.3)",
    borderRadius:"8px", padding:"11px 14px", color:"#86efac",
    fontSize:"13px", marginBottom:"14px" },

  btn: { width:"100%", padding:"13px",
    background:"linear-gradient(135deg,#38bdf8,#818cf8)",
    border:"none", borderRadius:"10px", color:"#0f172a",
    fontWeight:"800", fontSize:"15px", cursor:"pointer", marginBottom:"20px" },
  btnDisabled: { width:"100%", padding:"13px", background:"rgba(56,189,248,0.3)",
    border:"none", borderRadius:"10px", color:"#94a3b8",
    fontWeight:"800", fontSize:"15px", cursor:"not-allowed", marginBottom:"20px" },

  divider: { textAlign:"center", marginBottom:"14px" },
  dividerText: { background:"transparent", padding:"0 12px",
    color:"#475569", fontSize:"11px", textTransform:"uppercase", letterSpacing:"1px" },
  credRow: { display:"flex", gap:"12px" },
  credBox: { flex:1, background:"rgba(30,41,59,0.6)", border:"1px solid rgba(51,65,85,0.5)",
    borderRadius:"8px", padding:"12px", textAlign:"center", cursor:"pointer" },
  credRole: { fontSize:"13px", fontWeight:"700", color:"#e2e8f0", marginBottom:"4px" },
  credHint: { fontSize:"11px", color:"#64748b", fontFamily:"monospace" },

  switchHint: { textAlign:"center", color:"#64748b", fontSize:"13px", margin:0 },
  switchLink: { color:"#38bdf8", cursor:"pointer", fontWeight:"600" },
};