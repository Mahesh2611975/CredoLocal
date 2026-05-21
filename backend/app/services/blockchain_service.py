"""Blockchain service — writes AI underwriting results to local Hardhat blockchain"""

import os
import hashlib
import json

try:
    from web3 import Web3

    WEB3_AVAILABLE = True
except ImportError:
    WEB3_AVAILABLE = False


# Smart Contract ABI
CONTRACT_ABI = [
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "appId",
                "type": "uint256",
            },
            {
                "internalType": "bytes32",
                "name": "dataHash",
                "type": "bytes32",
            },
            {
                "internalType": "uint256",
                "name": "trustScore",
                "type": "uint256",
            },
            {
                "internalType": "uint256",
                "name": "safeLoanAmount",
                "type": "uint256",
            },
            {
                "internalType": "uint256",
                "name": "anomalyRisk",
                "type": "uint256",
            },
            {
                "internalType": "string",
                "name": "riskCategory",
                "type": "string",
            },
        ],
        "name": "submitApplication",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function",
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "appId",
                "type": "uint256",
            },
            {
                "internalType": "string",
                "name": "status",
                "type": "string",
            },
        ],
        "name": "updateStatus",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function",
    },
]


def _get_web3():

    rpc = os.getenv(
        "POLYGON_RPC_URL",
        "http://127.0.0.1:8545"
    )

    print("\n================ BLOCKCHAIN CONNECTION ================")
    print(f"Connecting to RPC: {rpc}")

    w3 = Web3(Web3.HTTPProvider(rpc))

    if w3.is_connected():
        print("✅ Blockchain connected successfully")
        print(f"Current Block Number: {w3.eth.block_number}")
    else:
        print("❌ Blockchain connection failed")

    print("=======================================================\n")

    return w3


def hash_application_data(data: dict) -> str:

    serialized = json.dumps(
        data,
        sort_keys=True,
        default=str
    )

    return "0x" + hashlib.sha256(
        serialized.encode()
    ).hexdigest()


def write_application_to_chain(
    application_id: int,
    data: dict,

    trust_score: int,
    safe_loan_amount: int,
    anomaly_risk: int,

    risk_category: str
) -> dict:
    """
    Stores AI underwriting results on blockchain
    """

    print("\n================ WRITING TO BLOCKCHAIN ================")

    data_hash = hash_application_data(data)

    print(f"Application ID    : {application_id}")
    print(f"Generated Hash    : {data_hash}")

    print(f"Trust Score       : {trust_score}")
    print(f"Loan Amount       : ₹{safe_loan_amount}")
    print(f"Anomaly Risk      : {anomaly_risk}%")
    print(f"Risk Category     : {risk_category}")

    if not WEB3_AVAILABLE:

        print("❌ Web3 not installed")

        return {
            "tx_hash": None,
            "data_hash": data_hash,
            "status": "skipped_no_web3",
        }

    contract_address = os.getenv("CONTRACT_ADDRESS")
    private_key = os.getenv("WALLET_PRIVATE_KEY")

    print(f"Contract Address  : {contract_address}")

    if (
        not contract_address
        or not private_key
        or contract_address.startswith("0x000")
    ):

        print("❌ Blockchain not configured properly")

        return {
            "tx_hash": None,
            "data_hash": data_hash,
            "status": "skipped_not_configured",
        }

    try:

        w3 = _get_web3()

        account = w3.eth.account.from_key(private_key)

        print(f"Using Wallet      : {account.address}")

        contract = w3.eth.contract(
            address=Web3.to_checksum_address(contract_address),
            abi=CONTRACT_ABI,
        )

        data_bytes = bytes.fromhex(data_hash[2:])

        nonce = w3.eth.get_transaction_count(account.address)

        print(f"Current Nonce     : {nonce}")

        tx = contract.functions.submitApplication(
            int(application_id),
            data_bytes,

            int(trust_score),
            int(safe_loan_amount),
            int(anomaly_risk),

            str(risk_category)
        ).build_transaction(
            {
                "from": account.address,
                "nonce": nonce,
                "gas": 300000,
                "gasPrice": w3.to_wei("1", "gwei"),
                "chainId": 31337,
            }
        )

        print("⏳ Signing transaction...")

        signed_tx = w3.eth.account.sign_transaction(
            tx,
            private_key
        )

        print("🚀 Sending transaction to blockchain...")

        tx_hash = w3.eth.send_raw_transaction(
            signed_tx.rawTransaction
        )

        print(f"Transaction Hash  : {tx_hash.hex()}")

        print("⛏ Waiting for transaction confirmation...")

        receipt = w3.eth.wait_for_transaction_receipt(
            tx_hash,
            timeout=60,
        )

        print("\n=============== BLOCKCHAIN SUCCESS ====================")
        print("✅ AI Results Stored Successfully")
        print(f"Block Number      : {receipt.blockNumber}")
        print(f"Gas Used          : {receipt.gasUsed}")
        print(f"Tx Hash           : {tx_hash.hex()}")
        print("=======================================================\n")

        return {
            "tx_hash": tx_hash.hex(),
            "data_hash": data_hash,
            "block_number": receipt.blockNumber,
            "gas_used": receipt.gasUsed,
            "status": "success",
        }

    except Exception as e:

        print("\n❌ BLOCKCHAIN ERROR")
        print(str(e))
        print("=======================================================\n")

        return {
            "tx_hash": None,
            "data_hash": data_hash,
            "status": f"error: {str(e)}",
        }


def update_status_on_chain(
    application_id: int,
    status: str
) -> dict:
    """
    Updates loan status on blockchain
    """

    print("\n=============== STATUS UPDATE ON BLOCKCHAIN ===========")

    if not WEB3_AVAILABLE:

        return {
            "tx_hash": None,
            "status": "skipped_no_web3",
        }

    contract_address = os.getenv("CONTRACT_ADDRESS")
    private_key = os.getenv("WALLET_PRIVATE_KEY")

    if (
        not contract_address
        or not private_key
        or contract_address.startswith("0x000")
    ):

        return {
            "tx_hash": None,
            "status": "skipped_not_configured",
        }

    try:

        w3 = _get_web3()

        account = w3.eth.account.from_key(private_key)

        contract = w3.eth.contract(
            address=Web3.to_checksum_address(contract_address),
            abi=CONTRACT_ABI,
        )

        nonce = w3.eth.get_transaction_count(account.address)

        tx = contract.functions.updateStatus(
            application_id,
            status,
        ).build_transaction(
            {
                "from": account.address,
                "nonce": nonce,
                "gas": 100000,
                "gasPrice": w3.to_wei("1", "gwei"),
                "chainId": 31337,
            }
        )

        signed_tx = w3.eth.account.sign_transaction(
            tx,
            private_key
        )

        tx_hash = w3.eth.send_raw_transaction(
            signed_tx.rawTransaction
        )

        receipt = w3.eth.wait_for_transaction_receipt(
            tx_hash,
            timeout=60,
        )

        print(f"✅ Status Updated : {status}")
        print(f"Block Number      : {receipt.blockNumber}")
        print(f"Tx Hash           : {tx_hash.hex()}")

        print("=======================================================\n")

        return {
            "tx_hash": tx_hash.hex(),
            "block_number": receipt.blockNumber,
            "status": "success",
        }

    except Exception as e:

        print("\n❌ STATUS UPDATE ERROR")
        print(str(e))
        print("=======================================================\n")

        return {
            "tx_hash": None,
            "status": f"error: {str(e)}",
        }