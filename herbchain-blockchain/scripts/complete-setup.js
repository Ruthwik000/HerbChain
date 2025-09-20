const { ethers } = require("hardhat");

async function main() {
  console.log("🚀 Complete HerbChain Setup");
  console.log("=" .repeat(50));

  try {
    // Step 1: Deploy the contract
    console.log("📦 Step 1: Deploying HerbChain contract...");
    const HerbChain = await ethers.getContractFactory("HerbChain");
    const herbChain = await HerbChain.deploy();
    await herbChain.waitForDeployment();

    const contractAddress = await herbChain.getAddress();
    console.log("✅ Contract deployed to:", contractAddress);

    // Step 2: Get accounts
    const [admin, farmer, labOfficer, manufacturer] = await ethers.getSigners();
    console.log("\n👥 Step 2: Account setup");
    console.log("Admin:", admin.address);
    console.log("Farmer:", farmer.address);
    console.log("Lab Officer:", labOfficer.address);
    console.log("Manufacturer:", manufacturer.address);

    // Step 3: Grant roles
    console.log("\n🎭 Step 3: Granting roles...");
    
    const grantFarmerTx = await herbChain.grantFarmerRole(farmer.address);
    await grantFarmerTx.wait();
    console.log("✅ Farmer role granted");

    const grantLabTx = await herbChain.grantLabRole(labOfficer.address);
    await grantLabTx.wait();
    console.log("✅ Lab Officer role granted");

    const grantManufacturerTx = await herbChain.grantManufacturerRole(manufacturer.address);
    await grantManufacturerTx.wait();
    console.log("✅ Manufacturer role granted");

    // Step 4: Test the setup
    console.log("\n🧪 Step 4: Testing setup...");
    
    const totalBatches = await herbChain.getTotalBatches();
    console.log("Total batches:", totalBatches.toString());

    const farmerBatches = await herbChain.getFarmerBatches(farmer.address);
    console.log("Farmer batches:", farmerBatches.length);

    // Step 5: Create a test batch
    console.log("\n🌱 Step 5: Creating test batch...");
    const createTx = await herbChain.connect(farmer).createBatch(
      "Test Organic Basil",
      "Test Farm Location",
      15,
      "QmTestPhotoHash123",
      "Test batch for verification"
    );
    await createTx.wait();
    console.log("✅ Test batch created");

    const newTotal = await herbChain.getTotalBatches();
    console.log("New total batches:", newTotal.toString());

    // Step 6: Display results
    console.log("\n🎉 Setup Complete!");
    console.log("=" .repeat(50));
    console.log("Contract Address:", contractAddress);
    console.log("\nMetaMask Import Information:");
    console.log("Network: HerbChain Local");
    console.log("RPC URL: http://127.0.0.1:8545");
    console.log("Chain ID: 1337");
    console.log("\nTest Accounts (import to MetaMask):");
    console.log("Farmer Address:", farmer.address);
    console.log("Farmer Private Key: 0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d");
    console.log("\nLab Officer Address:", labOfficer.address);
    console.log("Lab Officer Private Key: 0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a");
    console.log("\nManufacturer Address:", manufacturer.address);
    console.log("Manufacturer Private Key: 0x7c852118294e51e653712a81e05800f419141751be58f605c371e15141b007a6");

    console.log("\n📝 Update your frontend .env file:");
    console.log(`VITE_HERBCHAIN_CONTRACT_ADDRESS=${contractAddress}`);

    return contractAddress;

  } catch (error) {
    console.error("❌ Setup failed:", error.message);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });