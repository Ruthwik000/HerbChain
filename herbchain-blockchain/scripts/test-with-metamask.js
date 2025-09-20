const { ethers } = require("hardhat");
require("dotenv").config();

async function main() {
  const contractAddress = process.env.CONTRACT_ADDRESS || process.argv[2];
  
  if (!contractAddress) {
    console.error("❌ Please provide contract address as argument or set CONTRACT_ADDRESS environment variable");
    process.exit(1);
  }

  console.log("🧪 Testing HerbChain with MetaMask accounts...");
  console.log("📍 Contract Address:", contractAddress);

  // Get the contract instance
  const HerbChain = await ethers.getContractFactory("HerbChain");
  const herbChain = HerbChain.attach(contractAddress);

  // Create wallets from private keys
  const adminWallet = new ethers.Wallet(process.env.PRIVATE_KEY, ethers.provider);
  
  let farmerWallet, labWallet, manufacturerWallet;
  
  if (process.env.FARMER_PRIVATE_KEY) {
    farmerWallet = new ethers.Wallet(process.env.FARMER_PRIVATE_KEY, ethers.provider);
  }
  
  if (process.env.LAB_PRIVATE_KEY) {
    labWallet = new ethers.Wallet(process.env.LAB_PRIVATE_KEY, ethers.provider);
  }
  
  if (process.env.MANUFACTURER_PRIVATE_KEY) {
    manufacturerWallet = new ethers.Wallet(process.env.MANUFACTURER_PRIVATE_KEY, ethers.provider);
  }

  console.log("\n👥 Account Information:");
  console.log("Admin:", adminWallet.address);
  if (farmerWallet) console.log("Farmer:", farmerWallet.address);
  if (labWallet) console.log("Lab Officer:", labWallet.address);
  if (manufacturerWallet) console.log("Manufacturer:", manufacturerWallet.address);

  try {
    // Check balances
    console.log("\n💰 Account Balances:");
    console.log("Admin:", ethers.formatEther(await ethers.provider.getBalance(adminWallet.address)), "ETH");
    if (farmerWallet) {
      console.log("Farmer:", ethers.formatEther(await ethers.provider.getBalance(farmerWallet.address)), "ETH");
    }
    if (labWallet) {
      console.log("Lab Officer:", ethers.formatEther(await ethers.provider.getBalance(labWallet.address)), "ETH");
    }
    if (manufacturerWallet) {
      console.log("Manufacturer:", ethers.formatEther(await ethers.provider.getBalance(manufacturerWallet.address)), "ETH");
    }

    // Check roles
    console.log("\n🎭 Role Verification:");
    const FARMER_ROLE = await herbChain.FARMER_ROLE();
    const LAB_ROLE = await herbChain.LAB_ROLE();
    const MANUFACTURER_ROLE = await herbChain.MANUFACTURER_ROLE();

    if (farmerWallet) {
      const hasFarmerRole = await herbChain.hasRole(FARMER_ROLE, farmerWallet.address);
      console.log("Farmer role:", hasFarmerRole ? "✅" : "❌");
    }

    if (labWallet) {
      const hasLabRole = await herbChain.hasRole(LAB_ROLE, labWallet.address);
      console.log("Lab Officer role:", hasLabRole ? "✅" : "❌");
    }

    if (manufacturerWallet) {
      const hasManufacturerRole = await herbChain.hasRole(MANUFACTURER_ROLE, manufacturerWallet.address);
      console.log("Manufacturer role:", hasManufacturerRole ? "✅" : "❌");
    }

    // Test workflow if all accounts are available
    if (farmerWallet && labWallet && manufacturerWallet) {
      console.log("\n🔄 Testing Complete Workflow...");

      // 1. Create batch as farmer
      console.log("1. Creating batch as farmer...");
      const createTx = await herbChain.connect(farmerWallet).createBatch(
        "MetaMask Test Basil",
        "Test Farm Location",
        18,
        "QmMetaMaskTestHash123",
        "Testing with MetaMask accounts"
      );
      await createTx.wait();
      console.log("✅ Batch created");

      // 2. Get batch details
      const batch = await herbChain.getBatch(1);
      console.log("📋 Batch details:", {
        id: batch.id.toString(),
        herbName: batch.herbName,
        farmer: batch.farmer,
        status: batch.status.toString()
      });

      // 3. Approve batch as lab officer
      console.log("2. Approving batch as lab officer...");
      const approveTx = await herbChain.connect(labWallet).approveBatch(1);
      await approveTx.wait();
      console.log("✅ Batch approved");

      // 4. Process batch as manufacturer
      console.log("3. Processing batch as manufacturer...");
      const processTx = await herbChain.connect(manufacturerWallet).processBatch(1, "QmMetaMaskQRHash456");
      await processTx.wait();
      console.log("✅ Batch processed");

      // 5. Get final batch details
      const finalBatch = await herbChain.getBatch(1);
      console.log("📋 Final batch details:", {
        id: finalBatch.id.toString(),
        herbName: finalBatch.herbName,
        status: finalBatch.status.toString(),
        qrCodeHash: finalBatch.qrCodeHash
      });

      console.log("\n🎉 Complete workflow test successful!");
    } else {
      console.log("\n⚠️  Not all accounts configured. Add private keys to .env for full testing.");
    }

    // Display MetaMask connection info
    console.log("\n🦊 === MetaMask Connection Info ===");
    console.log("Contract Address:", contractAddress);
    console.log("Network:", hre.network.name);
    console.log("Chain ID:", hre.network.config.chainId || "1337");
    
    if (hre.network.name === "hardhat") {
      console.log("RPC URL: http://127.0.0.1:8545");
    }

  } catch (error) {
    console.error("❌ Test failed:", error.message);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });