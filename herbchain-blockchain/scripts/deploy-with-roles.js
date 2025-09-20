const { ethers } = require("hardhat");
require("dotenv").config();

async function main() {
  console.log("🚀 Deploying HerbChain with MetaMask accounts...");

  // Get the contract factory
  const HerbChain = await ethers.getContractFactory("HerbChain");

  // Deploy the contract
  console.log("📦 Deploying contract...");
  const herbChain = await HerbChain.deploy();
  await herbChain.waitForDeployment();

  const contractAddress = await herbChain.getAddress();
  console.log("✅ HerbChain deployed to:", contractAddress);

  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  console.log("👤 Deployed by:", deployer.address);
  console.log("💰 Deployer balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)));

  // Verify admin role
  const DEFAULT_ADMIN_ROLE = await herbChain.DEFAULT_ADMIN_ROLE();
  const hasAdminRole = await herbChain.hasRole(DEFAULT_ADMIN_ROLE, deployer.address);
  console.log("🔐 Deployer has admin role:", hasAdminRole);

  // Set up additional signers if private keys are provided
  const accounts = {
    admin: deployer.address,
    farmer: null,
    labOfficer: null,
    manufacturer: null
  };

  // Create signers from private keys if provided
  if (process.env.FARMER_PRIVATE_KEY) {
    const farmerWallet = new ethers.Wallet(process.env.FARMER_PRIVATE_KEY, ethers.provider);
    accounts.farmer = farmerWallet.address;
    console.log("👨‍🌾 Farmer account:", accounts.farmer);
  }

  if (process.env.LAB_PRIVATE_KEY) {
    const labWallet = new ethers.Wallet(process.env.LAB_PRIVATE_KEY, ethers.provider);
    accounts.labOfficer = labWallet.address;
    console.log("🔬 Lab Officer account:", accounts.labOfficer);
  }

  if (process.env.MANUFACTURER_PRIVATE_KEY) {
    const manufacturerWallet = new ethers.Wallet(process.env.MANUFACTURER_PRIVATE_KEY, ethers.provider);
    accounts.manufacturer = manufacturerWallet.address;
    console.log("🏭 Manufacturer account:", accounts.manufacturer);
  }

  // Grant roles if accounts are available
  console.log("\n🎭 Setting up roles...");
  
  if (accounts.farmer) {
    try {
      const tx = await herbChain.grantFarmerRole(accounts.farmer);
      await tx.wait();
      console.log("✅ Granted farmer role to:", accounts.farmer);
    } catch (error) {
      console.log("❌ Failed to grant farmer role:", error.message);
    }
  }

  if (accounts.labOfficer) {
    try {
      const tx = await herbChain.grantLabRole(accounts.labOfficer);
      await tx.wait();
      console.log("✅ Granted lab officer role to:", accounts.labOfficer);
    } catch (error) {
      console.log("❌ Failed to grant lab officer role:", error.message);
    }
  }

  if (accounts.manufacturer) {
    try {
      const tx = await herbChain.grantManufacturerRole(accounts.manufacturer);
      await tx.wait();
      console.log("✅ Granted manufacturer role to:", accounts.manufacturer);
    } catch (error) {
      console.log("❌ Failed to grant manufacturer role:", error.message);
    }
  }

  // Save deployment info
  const deploymentInfo = {
    contractAddress: contractAddress,
    network: "localhost",
    deployedAt: new Date().toISOString(),
    blockNumber: await ethers.provider.getBlockNumber(),
    accounts: accounts,
    gasUsed: "~2.2M gas"
  };

  console.log("\n📋 === Deployment Summary ===");
  console.log(JSON.stringify(deploymentInfo, null, 2));

  // MetaMask connection instructions
  console.log("\n🦊 === MetaMask Setup Instructions ===");
  console.log("1. Add this network to MetaMask:");
  
  if (hre.network.name === "hardhat") {
    console.log("   Network Name: Hardhat Local");
    console.log("   RPC URL: http://127.0.0.1:8545");
    console.log("   Chain ID: 1337");
    console.log("   Currency Symbol: ETH");
  } else if (hre.network.name === "sepolia") {
    console.log("   Network Name: Sepolia Testnet");
    console.log("   RPC URL: https://sepolia.infura.io/v3/YOUR_KEY");
    console.log("   Chain ID: 11155111");
    console.log("   Currency Symbol: ETH");
  }

  console.log("\n2. Import these accounts to MetaMask:");
  console.log("   Admin:", accounts.admin);
  if (accounts.farmer) console.log("   Farmer:", accounts.farmer);
  if (accounts.labOfficer) console.log("   Lab Officer:", accounts.labOfficer);
  if (accounts.manufacturer) console.log("   Manufacturer:", accounts.manufacturer);

  console.log("\n3. Contract Address for frontend:");
  console.log("   ", contractAddress);

  return contractAddress;
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });