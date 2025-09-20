const { ethers } = require("hardhat");
require("dotenv").config();

async function main() {
  console.log("🧪 Testing HerbChain with MetaMask Configuration...");
  console.log("=" .repeat(60));

  // Deploy fresh contract for testing
  console.log("📦 Deploying fresh contract...");
  const HerbChain = await ethers.getContractFactory("HerbChain");
  const herbChain = await HerbChain.deploy();
  await herbChain.waitForDeployment();

  const contractAddress = await herbChain.getAddress();
  console.log("✅ Contract deployed to:", contractAddress);

  // Create wallets from the private keys in .env
  const adminWallet = new ethers.Wallet(process.env.PRIVATE_KEY, ethers.provider);
  const farmerWallet = new ethers.Wallet(process.env.FARMER_PRIVATE_KEY, ethers.provider);
  const labWallet = new ethers.Wallet(process.env.LAB_PRIVATE_KEY, ethers.provider);
  const manufacturerWallet = new ethers.Wallet(process.env.MANUFACTURER_PRIVATE_KEY, ethers.provider);

  console.log("\n👥 MetaMask Account Information:");
  console.log(`Admin: ${adminWallet.address}`);
  console.log(`Farmer: ${farmerWallet.address}`);
  console.log(`Lab Officer: ${labWallet.address}`);
  console.log(`Manufacturer: ${manufacturerWallet.address}`);

  // Check balances
  console.log("\n💰 Account Balances:");
  const adminBalance = await ethers.provider.getBalance(adminWallet.address);
  const farmerBalance = await ethers.provider.getBalance(farmerWallet.address);
  const labBalance = await ethers.provider.getBalance(labWallet.address);
  const manufacturerBalance = await ethers.provider.getBalance(manufacturerWallet.address);

  console.log(`Admin: ${ethers.formatEther(adminBalance)} ETH`);
  console.log(`Farmer: ${ethers.formatEther(farmerBalance)} ETH`);
  console.log(`Lab Officer: ${ethers.formatEther(labBalance)} ETH`);
  console.log(`Manufacturer: ${ethers.formatEther(manufacturerBalance)} ETH`);

  try {
    // Setup roles
    console.log("\n🎭 Setting up roles...");
    
    // Grant farmer role
    const grantFarmerTx = await herbChain.connect(adminWallet).grantFarmerRole(farmerWallet.address);
    await grantFarmerTx.wait();
    console.log("✅ Farmer role granted");

    // Grant lab officer role
    const grantLabTx = await herbChain.connect(adminWallet).grantLabRole(labWallet.address);
    await grantLabTx.wait();
    console.log("✅ Lab Officer role granted");

    // Grant manufacturer role
    const grantManufacturerTx = await herbChain.connect(adminWallet).grantManufacturerRole(manufacturerWallet.address);
    await grantManufacturerTx.wait();
    console.log("✅ Manufacturer role granted");

    // Test complete workflow
    console.log("\n🔄 Testing Complete Workflow with MetaMask Accounts:");
    console.log("=" .repeat(50));

    // 1. Create batch as farmer
    console.log("1. 👨‍🌾 Creating batch as farmer...");
    const createTx = await herbChain.connect(farmerWallet).createBatch(
      "MetaMask Test Basil",
      "Green Valley Farm, California",
      18,
      "QmMetaMaskTestPhotoHash123",
      "Testing HerbChain with MetaMask accounts - Premium organic basil"
    );
    const createReceipt = await createTx.wait();
    console.log(`   ✅ Batch created - Gas used: ${createReceipt.gasUsed.toString()}`);

    // 2. Get batch details
    const batch = await herbChain.getBatch(1);
    console.log("   📋 Batch Info:", {
      id: batch.id.toString(),
      herbName: batch.herbName,
      location: batch.location,
      moisturePercent: batch.moisturePercent.toString() + "%",
      farmer: batch.farmer,
      status: ["Pending", "Approved", "Rejected", "Processed"][batch.status]
    });

    // 3. Approve batch as lab officer
    console.log("2. 🔬 Approving batch as lab officer...");
    const approveTx = await herbChain.connect(labWallet).approveBatch(1);
    const approveReceipt = await approveTx.wait();
    console.log(`   ✅ Batch approved - Gas used: ${approveReceipt.gasUsed.toString()}`);

    // 4. Process batch as manufacturer
    console.log("3. 🏭 Processing batch as manufacturer...");
    const qrCodeHash = "QmMetaMaskQRCodeHash456";
    const processTx = await herbChain.connect(manufacturerWallet).processBatch(1, qrCodeHash);
    const processReceipt = await processTx.wait();
    console.log(`   ✅ Batch processed - Gas used: ${processReceipt.gasUsed.toString()}`);

    // 5. Get final batch details
    console.log("4. 📊 Final batch status...");
    const finalBatch = await herbChain.getBatch(1);
    console.log("   📋 Final Batch Info:", {
      id: finalBatch.id.toString(),
      herbName: finalBatch.herbName,
      status: ["Pending", "Approved", "Rejected", "Processed"][finalBatch.status],
      farmer: finalBatch.farmer,
      labOfficer: finalBatch.labOfficer,
      manufacturer: finalBatch.manufacturer,
      qrCodeHash: finalBatch.qrCodeHash
    });

    // 6. Test consumer functions
    console.log("5. 👤 Testing consumer functions...");
    const batchByQR = await herbChain.getBatchByQR(qrCodeHash);
    console.log(`   ✅ Batch found by QR code: ${batchByQR.herbName}`);

    const farmerBatches = await herbChain.getFarmerBatches(farmerWallet.address);
    console.log(`   ✅ Farmer has ${farmerBatches.length} batch(es)`);

    console.log("\n🎉 All MetaMask tests completed successfully!");

    // Display MetaMask setup information
    console.log("\n🦊 MetaMask Setup Information:");
    console.log("=" .repeat(50));
    console.log("Network Configuration:");
    console.log(`   Network Name: HerbChain Local`);
    console.log(`   RPC URL: http://127.0.0.1:8545`);
    console.log(`   Chain ID: 1337`);
    console.log(`   Currency Symbol: ETH`);
    console.log("");

    console.log("Import these private keys to MetaMask (with 0x prefix):");
    console.log(`   Admin: 0x${process.env.PRIVATE_KEY}`);
    console.log(`   Farmer: 0x${process.env.FARMER_PRIVATE_KEY}`);
    console.log(`   Lab Officer: 0x${process.env.LAB_PRIVATE_KEY}`);
    console.log(`   Manufacturer: 0x${process.env.MANUFACTURER_PRIVATE_KEY}`);
    console.log("");

    console.log("Contract Address for Frontend:");
    console.log(`   ${contractAddress}`);
    console.log("");

    console.log("Frontend .env Configuration:");
    console.log(`   VITE_HERBCHAIN_CONTRACT_ADDRESS=${contractAddress}`);
    console.log(`   VITE_NETWORK_ID=1337`);
    console.log(`   VITE_NETWORK_NAME=localhost`);
    console.log(`   VITE_RPC_URL=http://127.0.0.1:8545`);

    // Update the .env file with the new contract address
    console.log("\n📝 Updating .env file with new contract address...");
    
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