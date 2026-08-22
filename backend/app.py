from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from datetime import datetime
from web3 import Web3
import json, os, time, base64

from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from webdriver_manager.chrome import ChromeDriverManager

app = Flask(__name__)
CORS(app)

# ── Paths ──────────────────────────────────────────────────────────────────
BASE_DIR      = os.path.dirname(os.path.abspath(__file__))
USERS_FILE    = os.path.join(BASE_DIR, "users.json")
DATA_FILE     = os.path.join(BASE_DIR, "data.json")
CONTRACT_FILE = os.path.join(BASE_DIR, "contract_config.json")
DOWNLOAD_DIR  = os.path.join(BASE_DIR, "downloads")
os.makedirs(DOWNLOAD_DIR, exist_ok=True)

# ── JSON helpers ───────────────────────────────────────────────────────────
def load_json(path, default):
    if not os.path.exists(path):
        save_json(path, default)
        return default
    with open(path) as f:
        return json.load(f)

def save_json(path, data):
    with open(path, "w") as f:
        json.dump(data, f, indent=2)

users      = load_json(USERS_FILE, [
    {"username": "admin", "password": "admin123", "role": "admin"},
    {"username": "user1", "password": "user123",  "role": "user"}
])
data_store = load_json(DATA_FILE, {"lands": [], "registrations": [], "sales": []})

# ── Blockchain ─────────────────────────────────────────────────────────────
w3       = Web3(Web3.HTTPProvider("http://127.0.0.1:8545"))
contract = None

if os.path.exists(CONTRACT_FILE):
    with open(CONTRACT_FILE) as f:
        cfg = json.load(f)
    contract = w3.eth.contract(address=cfg["address"], abi=cfg["abi"])

# ══════════════════════════════════════════════════════════════════════════
# AUTH
# ══════════════════════════════════════════════════════════════════════════

@app.route("/api/register", methods=["POST"])
def register_user():
    body     = request.json
    username = body.get("username","").strip()
    password = body.get("password","").strip()
    role     = body.get("role", "user")

    if not username or not password:
        return jsonify({"error": "Username and password required"}), 400
    if any(u["username"] == username for u in users):
        return jsonify({"error": "User already exists"}), 400

    users.append({"username": username, "password": password, "role": role})
    save_json(USERS_FILE, users)
    return jsonify({"message": "User registered successfully"}), 201


@app.route("/api/login", methods=["POST"])
def login():
    body     = request.json
    username = body.get("username","").strip()
    password = body.get("password","").strip()
    user     = next((u for u in users if u["username"]==username and u["password"]==password), None)
    if not user:
        return jsonify({"error": "Invalid credentials"}), 401
    return jsonify({"message": "Login successful", "role": user["role"], "username": username}), 200

# ══════════════════════════════════════════════════════════════════════════
# BLOCKCHAIN STATUS
# ══════════════════════════════════════════════════════════════════════════

@app.route("/api/blockchain/status", methods=["GET"])
def blockchain_status():
    connected = w3.is_connected()
    return jsonify({
        "connected":   connected,
        "accounts":    w3.eth.accounts if connected else [],
        "blockNumber": w3.eth.block_number if connected else None
    }), 200


@app.route("/api/blockchain/accounts", methods=["GET"])
def get_accounts():
    if not w3.is_connected():
        return jsonify({"error": "Blockchain not connected"}), 503
    return jsonify({"accounts": w3.eth.accounts}), 200

# ══════════════════════════════════════════════════════════════════════════
# SATBARA FETCH  (from friend's working approach)
# ══════════════════════════════════════════════════════════════════════════

def fetch_from_gov(vid):
    """Open the government portal, enter the verification ID, wait for PDF download."""
    target = os.path.join(DOWNLOAD_DIR, f"{vid}.pdf")
    if os.path.exists(target):
        os.remove(target)

    options = Options()
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-dev-shm-usage")
    options.add_argument("--disable-gpu")
    options.add_argument("--headless=new")          # add this for server environments
    options.binary_location = "/usr/bin/chromium"
    options.add_experimental_option("prefs", {
        "download.default_directory":         DOWNLOAD_DIR,
        "download.prompt_for_download":       False,
        "plugins.always_open_pdf_externally": True,
        "download.directory_upgrade":         True
    })

    service = Service(
        ChromeDriverManager(chrome_type="chromium").install()
    )
    driver = webdriver.Chrome(service=service, options=options)

    wait = WebDriverWait(driver, 15)
    try:
        driver.get("https://digitalsatbara.mahabhumi.gov.in/DSLR/Login/Verify712")
        input_box = wait.until(EC.presence_of_element_located((By.XPATH, "//input")))
        input_box.clear()
        input_box.send_keys(vid)
        input_box.send_keys(Keys.RETURN)

        # Wait up to 20 s for a PDF to appear in the downloads folder
        for _ in range(20):
            time.sleep(1)
            pdfs = [f for f in os.listdir(DOWNLOAD_DIR) if f.endswith(".pdf")]
            if pdfs:
                latest = max(pdfs, key=lambda f: os.path.getctime(os.path.join(DOWNLOAD_DIR, f)))
                new_name = f"{vid}.pdf"
                os.replace(os.path.join(DOWNLOAD_DIR, latest),
                           os.path.join(DOWNLOAD_DIR, new_name))
                return new_name

        return None
    except Exception as e:
        print("FETCH ERROR:", e)
        return None
    finally:
        driver.quit()


@app.route("/api/satbara/fetch", methods=["POST"])
def fetch_satbara():
    vid = request.json.get("verificationId","").strip()
    if not vid:
        return jsonify({"error": "Verification ID required"}), 400

    filename = fetch_from_gov(vid)

    if filename:
        pdf_path = os.path.join(DOWNLOAD_DIR, filename)
        with open(pdf_path, "rb") as f:
            pdf_b64 = base64.b64encode(f.read()).decode("utf-8")
        return jsonify({
            "status":         "success",
            "message":        "Satbara document fetched successfully",
            "verificationId": vid,
            "pdfUrl":         f"/api/downloads/{filename}",
            "pdfBase64":      pdf_b64
        }), 200

    return jsonify({"error": "PDF not downloaded. Check the verification ID."}), 404


@app.route("/api/downloads/<filename>")
def serve_pdf(filename):
    return send_from_directory(DOWNLOAD_DIR, filename)

# ══════════════════════════════════════════════════════════════════════════
# LAND REGISTRATION  (submit → pending → admin approves → on-chain)
# ══════════════════════════════════════════════════════════════════════════

@app.route("/api/register_land", methods=["POST"])
def register_land():
    d = request.json
    required = ["surveyNumber","village","taluka","district","owner","ownerAddress"]
    for f in required:
        if not d.get(f):
            return jsonify({"error": f"Missing: {f}"}), 400

    record = {
        "id":           len(data_store["registrations"]) + 1,
        "surveyNumber": d["surveyNumber"],
        "village":      d["village"],
        "taluka":       d["taluka"],
        "district":     d["district"],
        "owner":        d["owner"],
        "ownerAddress": d["ownerAddress"],
        "nominees":     d.get("nominees", []),
        "pdf_url":      d.get("pdf_url"),
        "status":       "Pending",
        "action":       "Register",
        "txHash":       None,
        "date":         str(datetime.now())
    }
    data_store["registrations"].append(record)
    save_json(DATA_FILE, data_store)
    return jsonify({"message": "Registration submitted for admin approval", "record": record}), 201


@app.route("/api/sell_land", methods=["POST"])
def sell_land():
    d = request.json

    # Find the original land's pdf_url from registrations
    original_pdf = None
    for reg in data_store["registrations"]:
        if (str(reg.get("id")) == str(d.get("landId")) or
            reg.get("owner") == d.get("currentOwner")):
            original_pdf = reg.get("pdf_url")
            break

    # Also check lands array
    if not original_pdf:
        for land in data_store["lands"]:
            if str(land.get("id")) == str(d.get("landId")):
                original_pdf = land.get("pdf_url")
                break

    record = {
        "id":           len(data_store["sales"]) + 1,
        "landId":       d.get("landId"),
        "currentOwner": d.get("currentOwner"),
        "buyer":        d.get("buyer"),
        "buyerAddress": d.get("buyerAddress"),
        "amount":       d.get("amount"),
        "area":         d.get("area"),
        "nominees":     d.get("nominees", []),
        "pdf_url":      original_pdf,
        "status":       "Pending",
        "action":       "Sell",
        "txHash":       None,
        "date":         str(datetime.now())
    }
    data_store["sales"].append(record)
    save_json(DATA_FILE, data_store)
    return jsonify({"message": "Sale request submitted for admin approval", "record": record}), 201

# ══════════════════════════════════════════════════════════════════════════
# ADMIN VERIFY  (approve / reject)
# ══════════════════════════════════════════════════════════════════════════

@app.route("/api/admin_verify", methods=["POST"])
def admin_verify():
    d      = request.json
    index  = d.get("index")
    status = d.get("status")   # "Approved" | "Rejected"
    type_  = d.get("type")     # "register" | "sell"

    try:
        tx_hash = None

        if type_ == "register":
            r = data_store["registrations"][index]
            r["status"] = status

            if status == "Approved" and contract and w3.is_connected():
                owner_addr = Web3.to_checksum_address(r["ownerAddress"])
                tx = contract.functions.registerLand(
                    r["surveyNumber"], r["village"], r["taluka"], r["district"],
                    r.get("area", "")
                ).transact({"from": owner_addr})
                receipt      = w3.eth.wait_for_transaction_receipt(tx)
                tx_hash      = receipt["transactionHash"].hex()
                r["txHash"]  = tx_hash
                land_id      = contract.functions.landCount().call()

                data_store["lands"].append({
                    "id":           land_id,
                    "surveyNumber": r["surveyNumber"],
                    "village":      r["village"],
                    "taluka":       r["taluka"],
                    "district":     r["district"],
                    "owner":        r["owner"],
                    "ownerAddress": r["ownerAddress"],
                    "txHash":       tx_hash,
                    "pdf_url":      r.get("pdf_url"),
                    "history":      [{"owner": r["owner"], "date": str(datetime.now())}]
                })

        elif type_ == "sell":
            s = data_store["sales"][index]
            s["status"] = status

            if status == "Approved" and contract and w3.is_connected():
                for land in data_store["lands"]:
                    if str(land.get("id")) == str(s["landId"]):
                        from_addr  = Web3.to_checksum_address(land["ownerAddress"])
                        to_addr    = Web3.to_checksum_address(s["buyerAddress"])

                        sold_area      = s.get("area", land.get("area", ""))
                        original_area  = land.get("area", "")

                        # Detect partial sale by comparing areas
                        is_partial = False
                        try:
                            # Extract numeric values for comparison
                            sold_num = float(''.join(filter(lambda x: x.isdigit() or x=='.', sold_area.split()[0]))) if sold_area else 0
                            orig_num = float(''.join(filter(lambda x: x.isdigit() or x=='.', original_area.split()[0]))) if original_area else 0
                            unit     = original_area.split()[-1] if original_area and len(original_area.split()) > 1 else ""
                            remaining_num = orig_num - sold_num
                            remaining_area = f"{remaining_num:.2f} {unit}".strip()
                            is_partial = sold_num > 0 and orig_num > 0 and sold_num < orig_num
                        except Exception:
                            remaining_area = original_area
                            is_partial = False

                        if is_partial:
                            # Partial transfer — seller keeps remaining, buyer gets new land entry
                            tx = contract.functions.partialTransfer(
                                int(land["id"]), to_addr, sold_area, remaining_area
                            ).transact({"from": from_addr})
                            receipt     = w3.eth.wait_for_transaction_receipt(tx)
                            tx_hash     = receipt["transactionHash"].hex()
                            new_land_id = contract.functions.landCount().call()

                            # Update original land — seller keeps remaining area
                            land["area"]    = remaining_area
                            land["history"].append({
                                "action":    "Partial Sale",
                                "soldArea":  sold_area,
                                "soldTo":    s["buyer"],
                                "remaining": remaining_area,
                                "date":      str(datetime.now())
                            })

                            # Create new land entry for buyer
                            data_store["lands"].append({
                                "id":           new_land_id,
                                "surveyNumber": land["surveyNumber"] + "-P",
                                "village":      land["village"],
                                "taluka":       land["taluka"],
                                "district":     land["district"],
                                "owner":        s["buyer"],
                                "ownerAddress": s["buyerAddress"],
                                "area":         sold_area,
                                "txHash":       tx_hash,
                                "pdf_url":      land.get("pdf_url"),
                                "history":      [{"owner": s["buyer"], "date": str(datetime.now())}]
                            })

                            s["txHash"]       = tx_hash
                            s["transferType"] = "Partial"
                            s["remainingArea"]= remaining_area
                            s["newLandId"]    = new_land_id

                        else:
                            # Full transfer
                            tx = contract.functions.transferOwnership(
                                int(land["id"]), to_addr, sold_area
                            ).transact({"from": from_addr})
                            receipt     = w3.eth.wait_for_transaction_receipt(tx)
                            tx_hash     = receipt["transactionHash"].hex()

                            land["history"].append({"owner": land["owner"], "date": str(datetime.now())})
                            land["owner"]        = s["buyer"]
                            land["ownerAddress"] = s["buyerAddress"]
                            land["area"]         = sold_area
                            land["txHash"]       = tx_hash
                            s["txHash"]          = tx_hash
                            s["transferType"]    = "Full"

                        break

        save_json(DATA_FILE, data_store)
        return jsonify({"message": f"Record {status}", "txHash": tx_hash}), 200

    except Exception as e:
        print("ADMIN VERIFY ERROR:", e)
        return jsonify({"error": str(e)}), 500

# ══════════════════════════════════════════════════════════════════════════
# DATA ROUTES
# ══════════════════════════════════════════════════════════════════════════

@app.route("/api/properties", methods=["GET"])
def get_properties():
    return jsonify(data_store["lands"]), 200


@app.route("/api/all_records", methods=["GET"])
def all_records():
    return jsonify({
        "lands":         data_store["lands"],
        "registrations": data_store["registrations"],
        "sales":         data_store["sales"]
    }), 200


@app.route("/api/track", methods=["GET"])
def track():
    result = []
    for r in data_store["registrations"]:
        result.append({**r, "action": "Register"})
    for s in data_store["sales"]:
        result.append({**s, "action": "Sell"})
    result.sort(key=lambda x: x.get("date",""), reverse=True)
    return jsonify(result), 200


@app.route("/api/search_land", methods=["GET"])
def search_land():
    q = request.args.get("q","").lower()
    results = [
        l for l in data_store["lands"]
        if q in l.get("surveyNumber","").lower()
        or q in l.get("owner","").lower()
        or q in l.get("village","").lower()
    ]
    return jsonify(results), 200


@app.route("/api/admin_data", methods=["GET"])
def admin_data():
    connected = w3.is_connected()
    return jsonify({
        "lands":         data_store["lands"],
        "registrations": data_store["registrations"],
        "sales":         data_store["sales"],
        "blockchain": {
            "connected":   connected,
            "blockNumber": w3.eth.block_number if connected else None,
            "accounts":    w3.eth.accounts if connected else []
        }
    }), 200

# ══════════════════════════════════════════════════════════════════════════

if __name__ == "__main__":
    app.run(debug=True, port=5000)