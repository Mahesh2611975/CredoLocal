"""Blockchain service — writes audit events to Polygon"""

import os
import hashlib
import json
from datetime import datetime

try:
    from web3 import Web3
    WEB3_AVAILABLE = True
except ImportError:
    WEB3_AVAILABLE = False

# Minimal ABI for LoanApplicationContract
CONTRACT_ABI = [
    {
        "inputs": [
            {"internalType": "uint256", "name": "appId", "type": "uint256"},
            {"internalType": "bytes32", "name": "dataHash", "type": "bytes32"}
        ],
        "name": "submitApplication",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {"internalType": "uint256", "name": "appId", "type": "uint256"},
            {"internalType": "string", "name": "status", "type": "string"}
        ],
        "name": "updateStatus",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "anonymous": False,
        "inputs": [
            {"indexed": True, "name": "appId", "type": "uint256"},
            {"indexed": False, "name": "dataHash", "type": "bytes32"}
        ],
        "name": "ApplicationSubmitted",
        "type": "event"
    }
]


def _get_web3():
    rpc = os.getenv("POLYGON_RPC_URL", "https://rpc-mumbai.maticvigil.com")
    return Web3(Web3.HTTPProvider(rpc))


def hash_application_data(data: dict) -> str:
    serialized = json.dumps(data, sort_keys=True, default=str)
    return "0x" + hashlib.sha256(serialized.encode()).hexdigest()


def write_application_to_chain(application_id: int, data: dict) -> dict:
    """
    Write application hash to blockchain.
    Returns tx_hash and data_hash. Falls back gracefully if web3 unavailable.
    """
    data_hash = hash_application_data(data)

    if not WEB3_AVAILABLE:
        return {"tx_hash": None, "data_hash": data_hash, "status": "skipped_no_web3"}

    contract_address = os.getenv("CONTRACT_ADDRESS")
    private_key      = os.getenv("WALLET_PRIVATE_KEY")

    if not contract_address or not private_key or contract_address.startswith("0x000"):
        return {"tx_hash": None, "data_hash": data_hash, "status": "skipped_not_configured"}

    try:
        w3       = _get_web3()
        account  = w3.eth.account.from_key(private_key)
        contract = w3.eth.contract(address=contract_address, abi=CONTRACT_ABI)

        data_bytes = bytes.fromhex(data_hash[2:])
        tx = contract.functions.submitApplication(application_id, data_bytes).build_transaction({
            "from":     account.address,
            "nonce":    w3.eth.get_transaction_count(account.address),
            "gas":      200000,
            "gasPrice": w3.to_wei("30", "gwei"),
        })
        signed    = w3.eth.account.sign_transaction(tx, private_key)
        tx_hash   = w3.eth.send_raw_transaction(signed.rawTransaction)
        receipt   = w3.eth.wait_for_transaction_receipt(tx_hash, timeout=60)
        return {
            "tx_hash":      tx_hash.hex(),
            "data_hash":    data_hash,
            "block_number": receipt.blockNumber,
            "status":       "success",
        }
    except Exception as e:
        return {"tx_hash": None, "data_hash": data_hash, "status": f"error: {str(e)}"}


def update_status_on_chain(application_id: int, status: str) -> dict:
    if not WEB3_AVAILABLE:
        return {"tx_hash": None, "status": "skipped_no_web3"}

    contract_address = os.getenv("CONTRACT_ADDRESS")
    private_key      = os.getenv("WALLET_PRIVATE_KEY")

    if not contract_address or not private_key or contract_address.startswith("0x000"):
        return {"tx_hash": None, "status": "skipped_not_configured"}

    try:
        w3       = _get_web3()
        account  = w3.eth.account.from_key(private_key)
        contract = w3.eth.contract(address=contract_address, abi=CONTRACT_ABI)

        tx = contract.functions.updateStatus(application_id, status).build_transaction({
            "from":     account.address,
            "nonce":    w3.eth.get_transaction_count(account.address),
            "gas":      100000,
            "gasPrice": w3.to_wei("30", "gwei"),
        })
        signed  = w3.eth.account.sign_transaction(tx, private_key)
        tx_hash = w3.eth.send_raw_transaction(signed.rawTransaction)
        w3.eth.wait_for_transaction_receipt(tx_hash, timeout=60)
        return {"tx_hash": tx_hash.hex(), "status": "success"}
    except Exception as e:
        return {"tx_hash": None, "status": f"error: {str(e)}"}
