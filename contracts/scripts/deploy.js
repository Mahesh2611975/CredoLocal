const { ethers } = require("hardhat");

async function main() {
  console.log("Starting deployment...");

  const signers = await ethers.getSigners();
  console.log("Signers:", signers.length);

  const deployer = signers[0];
  console.log("Deploying with:", deployer.address);

  const Contract = await ethers.getContractFactory("LoanApplicationContract");

  console.log("Deploying contract...");
  const contract = await Contract.deploy();

  console.log("Waiting for deployment...");
  await contract.waitForDeployment();

  const addr = await contract.getAddress();

  console.log("✅ Contract deployed to:", addr);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});