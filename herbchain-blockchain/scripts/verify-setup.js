const { ethers } = require("hardhat");

async function main() {
  const contractAddress = process.env.CONTRACT_ADDRESS || "0x5FbDB2315678afecb367f032d93F642f64180aa3";
  
  console.log("🔍 Verifying HerbChain setup...");
  console.log("Contract Address:", contractAddress);

  try {
    // Get the contract instance
    const HerbChain = await ethers.getContractFactory("HerbChain");
    const herbChain = HerbChain.attach(contractAddress);

    // Test basic contract connection
    console.log("\n📡 Testing contract connection...");
    const totalBatches = await herbChain.getTotalBatches();
    console.log("✅ Contract connected - Total batches:", totalBatches.toString());

    // Test accounts
    const accounts = [
      { name: "Admin", address: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266" },
      { name: "Farmer", address: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8" },
      { name: "Lab Officer", address: "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC" },
      { name: "Manufacturer", address: "0x90F79bf6EB2c4f870365E785982E1f101E93b906" }
    ];

    console.log("\n👥 Account balances:");
    for (const account of accounts) {
      try {
        const balance = await ethers.provider.getBalance(account.address);
        console.log(`${account.name}: ${ethers.formatEther(balance)} ETH`);
      } catch (error) {
        console.log(`${account.name}: Error getting balance`);
      }
    }

    // Simple role check without using role constants
    console.log("\n🎭 Testing role functions...");
    
    try {
      // Try to call a farmer function with the farmer account
      const farmerSigner = await ethers.getImpersonatedSigner("0x70997970C51812dc3A010C7d01b50e0d17dc79C8");
      const farmerBatches = await herbChain.connect(farmerSigner).getFarmerBatches("0x70997970C51812dc3A010C7d01b50e0d17dc79C8");
      console.log("✅ Farmer can access farmer functions - Batches:", farmerBatches.length);
    } catch (error) {
      console.log("⚠️  Farmer role test failed:", error.message);
    }

    console.log("\n🎉 Basic verification complete!");
    console.log("\n💡 Next steps:");
    console.log("1. Import the farmer account to MetaMask:");
    console.log("   Address: 0x70997970C51812dc3A010C7d01b50e0d17dc79C8");
    console.log("   Private Key: 0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d");
    console.log("2. Add the localhost network to MetaMask:");
    console.log("   Network Name: HerbChain Local");
    console.log("   RPC URL: http://127.0.0.1:8545");
    console.log("   Chain ID: 1337");
    console.log("3. Refresh your frontend and try creating a batch!");

  } catch (error) {
    console.error("❌ Verification failed:", error.message);
    
    console.log("\n🔧 Troubleshooting steps:");
    console.log("1. Make sure Hardhat node is running:");
    console.log("   npx hardhat node");
    console.log("2. Deploy the contract:");
    console.log("   npx hardhat run scripts/deploy.js --network localhost");
    console.log("3. Update CONTRACT_ADDRESS in .env file");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });