const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with:", deployer.address);

  const Contract = await ethers.getContractFactory("LoanApplicationContract");
  const contract = await Contract.deploy();
  await contract.waitForDeployment();

  const addr = await contract.getAddress();
  console.log("✅ LoanApplicationContract deployed to:", addr);
  console.log("\nPaste this into backend/.env:");
  console.log(`CONTRACT_ADDRESS=${addr}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
