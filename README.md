🌍 GeoLedger

GeoLedger is a blockchain-powered land registry system designed to ensure secure, transparent, and tamper-proof land ownership management.

It eliminates fraud, enables public verification, and introduces nominee-based inheritance for seamless land transfer.

🚀 Features

✔ Secure land ownership registration using blockchain
✔ Wallet-based admin approval system
✔ Public land verification & search
✔ Nominee inheritance transfer system
✔ Tamper-proof land records
✔ Transparent ownership history
✔ Fraud prevention using smart contracts

🧱 System Architecture

Frontend: React.js

Blockchain: Ethereum / Hardhat

Smart Contracts: Solidity

Wallet Integration: MetaMask

Backend (optional): Node.js / Express

Storage: Blockchain ledger

👤 User Roles
🔹 Admin

Approves land registration requests

Verifies ownership data

🔹 Citizen/User

Submit land registration

Add nominee for inheritance

Verify land ownership

Search property details

🔐 Unique Innovation

GeoLedger introduces:

✅ Nominee-based blockchain inheritance transfer
✅ Public verification without compromising ownership security
✅ Admin wallet-based authorization
✅ Transparent ownership traceability

⚙️ Installation & Setup
1️⃣ Clone Repository
git clone https://github.com/yourusername/GeoLedger.git
cd GeoLedger
2️⃣ Install Dependencies
npm install
3️⃣ Start Local Blockchain
npx hardhat node
4️⃣ Deploy Smart Contracts
npx hardhat run scripts/deploy.js --network localhost
5️⃣ Run Frontend
npm start
🛡 Why GeoLedger?

Traditional land systems are vulnerable to fraud, manipulation, and document tampering. GeoLedger uses blockchain technology to create a secure and transparent land ownership ecosystem.

📌 Future Enhancements

GIS map integration

Government registry integration

Mobile app support

IPFS document storage

Biometric verification

👨‍💻 Author

Akshay Pokale

📜 License

MIT License

✅ 5️⃣ .gitignore

If not present, create one:

node_modules/
.env
artifacts/
cache/
dist/
build/
✅ 6️⃣ Suggested Folder Structure
GeoLedger/
 ├── blockchain/
 │   ├── contracts/
 │   ├── scripts/
 │   └── hardhat.config.js
 ├── frontend/
 │   ├── src/
 │   └── public/
 ├── README.md
 └── package.json
