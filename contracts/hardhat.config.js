require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

module.exports = {
  solidity: "0.8.19",
  networks: {
    localhost: {
      url: process.env.POLYGON_RPC_URL,
      accounts: [process.env.WALLET_PRIVATE_KEY],
    },
  },
};