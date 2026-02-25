
from flask import Flask, request, jsonify
from flask_cors import CORS
from datetime import datetime
import uuid

app = Flask(__name__)
CORS(app)

users = {
    "admin@gov.in": {"password": "admin123", "role": "admin"},
    "user@test.com": {"password": "1234", "role": "user"}
}

lands = []
registrations = []
sales = []

@app.route("/login", methods=["POST"])
def login():
    data = request.json
    if data["email"] in users and users[data["email"]]["password"] == data["password"]:
        return jsonify({"role": users[data["email"]]["role"]})
    return jsonify({"error":"Invalid"}),401

@app.route("/register_land", methods=["POST"])
def register_land():
    data = request.json
    data["status"]="Pending"
    data["date"]=str(datetime.now())
    registrations.append(data)
    return jsonify({"msg":"sent"})

@app.route("/sell_land", methods=["POST"])
def sell_land():
    data=request.json
    data["status"]="Pending"
    data["date"]=str(datetime.now())
    sales.append(data)
    return jsonify({"msg":"sent"})

@app.route("/admin_data")
def admin_data():
    return jsonify({
        "registrations":registrations,
        "sales":sales,
        "lands":lands
    })

@app.route("/approve_registration", methods=["POST"])
def approve_registration():
    i=request.json["i"]
    rec=registrations[i]
    rec["status"]="Approved"
    lands.append(rec)
    return jsonify({"msg":"approved"})

@app.route("/approve_sale", methods=["POST"])
def approve_sale():
    i=request.json["i"]
    sale=sales[i]

    for land in lands:
        if land["landId"]==sale["landId"]:
            land["previousOwner"]=land["owner"]
            land["owner"]=sale["buyer"]
            land["nominees"]=sale["nominees"]

            email=f"{sale['buyer'].lower()}@user.com"
            pwd=str(uuid.uuid4())[:6]
            users[email]={"password":pwd,"role":"user"}

            return jsonify({"login":email,"password":pwd})

@app.route("/search/<landId>")
def search(landId):
    for l in lands:
        if l["landId"]==landId:
            return jsonify(l)
    return jsonify({"msg":"No land record found"})

@app.route("/track")
def track():
    return jsonify(registrations+sales)

if __name__=="__main__":
    app.run(debug=True)
