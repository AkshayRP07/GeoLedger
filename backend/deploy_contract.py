import json
from web3 import Web3
from solcx import compile_standard, install_solc

install_solc("0.8.0")

with open("../contracts/LandRegistry.sol", "r") as f:
    source_code = f.read()

compiled = compile_standard({
    "language": "Solidity",
    "sources": {"LandRegistry.sol": {"content": source_code}},
    "settings": {
        "outputSelection": {
            "*": {"*": ["abi", "metadata", "evm.bytecode", "evm.sourceMap"]}
        }
    },
}, solc_version="0.8.0")

with open("compiled_contract.json", "w") as f:
    json.dump(compiled, f)

abi = compiled["contracts"]["LandRegistry.sol"]["LandRegistry"]["abi"]
bytecode = compiled["contracts"]["LandRegistry.sol"]["LandRegistry"]["evm"]["bytecode"]["object"]

w3 = Web3(Web3.HTTPProvider("http://127.0.0.1:8545"))
w3.eth.default_account = w3.eth.accounts[0]

LandRegistry = w3.eth.contract(abi=abi, bytecode=bytecode)
tx_hash = LandRegistry.constructor().transact()
receipt = w3.eth.wait_for_transaction_receipt(tx_hash)

contract_address = receipt["contractAddress"]
print(f"Contract deployed at: {contract_address}")

with open("contract_config.json", "w") as f:
    json.dump({"address": contract_address, "abi": abi}, f)

print("contract_config.json saved.")