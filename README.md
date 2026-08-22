# 🏡 GeoLedger — Blockchain-Based Land Registry System

![Status](https://img.shields.io/badge/status-active-success)
![Python](https://img.shields.io/badge/Python-3.11-blue?logo=python&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor black)
![Solidity](https://img.shields.io/badge/Solidity-0.8-363636?logo=solidity&logoColor=white)
![Flask](https://img.shields.io/badge/Flask-backend-000000?logo=flask&logoColor=white)

> A full-stack land registry platform that puts land ownership records on a blockchain — tamper-proof, transparent, and verifiable — with an admin approval workflow and live land-parcel mapping.

## 🎯 Problem → Solution

Land records in India are often paper-based, easy to forge, and hard to verify across departments. **GeoLedger** digitizes the registration process and anchors every ownership record and transfer on an immutable smart contract, so ownership history can never be silently altered.

## ✨ Features

- 🔐 **Role-based access** — separate Admin and User dashboards
- 📝 **Land registration workflow** — users submit land details, admins review & approve
- ⛓️ **On-chain ownership records** — registrations and transfers written to a Solidity smart contract
- 🔄 **Partial & full ownership transfer** — split and transfer land parcels with full transaction history
- 📍 **Interactive land map** — visualize registered parcels using Leaflet
- 📄 **Satbara (7/12 extract) auto-fetch** — Selenium-based fetch of official land records
- 📊 **Dashboard analytics** — Chart.js visualizations of registrations & transactions

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, React Router, Chart.js, Leaflet |
| Backend | Flask, Flask-CORS |
| Blockchain | Solidity, Web3.py, Ganache (local chain) |
| Automation | Selenium, WebDriver Manager |
| Deployment | Render (`render.yaml` included) |

## 🏗️ Architecture

```
Frontend (React) ──HTTP──▶ Backend (Flask) ──Web3──▶ Smart Contract (Ganache)
                                  │
                                  └── Selenium ──▶ Satbara record fetch
```

## 📸 Screenshots

### Admin Panel
<!-- Drag & drop admin screenshots here in GitHub's editor -->

### User Panel
<!-- Drag & drop user-panel screenshots here in GitHub's editor -->

## 🚀 Getting Started

**Prerequisites:** Node.js, Python 3.11+, Git, [Ganache](https://www.npmjs.com/package/ganache), Chrome/Chromium

```bash
# 1. Clone
git clone https://github.com/AkshayRP07/GeoLedger-System.git
cd GeoLedger-System

# 2. Backend setup
cd backend
python -m venv venv
venv\Scripts\activate        # Windows
pip install -r requirements.txt

# 3. Frontend setup
cd ../frontend
npm install
```

**Every run (3 terminals):**

```bash
# Terminal 1 — local blockchain
ganache

# Terminal 2 — deploy contract + start API
cd backend && venv\Scripts\activate
python deploy_contract.py     # only after each fresh Ganache start
python app.py

# Terminal 3 — frontend
cd frontend
npm start
```

App opens at `http://localhost:3000`.

**Demo credentials:**

| Role | Username | Password |
|---|---|---|
| Admin | admin | admin123 |
| User | user1 | user123 |

## 📂 Project Structure

```
GeoLedger-System/
├── frontend/          # React app (Admin/User dashboards, map view)
├── backend/           # Flask API + Web3 integration
├── contracts/         # LandRegistry.sol smart contract
└── render.yaml        # Deployment config
```

## 📜 License

MIT
