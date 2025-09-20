const { ethers } = require("hardhat");
require("dotenv").config();

// Your deployed contract addresses
const CONTRACTS = {
  HERBCHAIN: "0x5FbDB2315678afecb367f032d93F642f64180aa3",
  IPFS_STORAGE: "0xa513E6E4b8f2a923D98304ec87F64353C4D5C853",
  ACCESS_CONTROL: "0x0165878A594ca255338adfa4d48449f69242Eb8F"
};

const NETWORK_CONFIG = {
  NETWORK_ID: 1337,
  NETWORK_NAME: "localhost",
  RPC_URL: "http://127.0.0.1:8545"
};

async function main() {
  console.log("🧪 Testing Deployed HerbChain Contracts...");
  console.log("=" .repeat(60));
  
  console.log("📍 Contract Addresses:");
  console.log(`   HerbChain: ${CONTRACTS.HERBCHAIN}`);
  console.log(`   IPFS Storage: ${CONTRACTS.IPFS_STORAGE}`);
  console.log(`   Access Control: ${CONTRACTS.ACCESS_CONTROL}`);
  console.log(`   Network: ${NETWORK_CONFIG.NETWORK_NAME} (${NETWORK_CONFIG.NETWORK_ID})`);
  console.log("");

  try {
    // Connect to the HerbChain contract
    const HerbChain = await ethers.getContractFactory("HerbChain");
    const herbChain = HerbChain.attach(CONTRACTS.HERBCHAIN);

    // Get signers (accounts)
    const [admin, farmer, labOfficer, manufacturer, consumer] = await ethers.getSigners();

    console.log("👥 Available Accounts:");
    console.log(`   Admin: ${admin.address}`);
    console.log(`   Farmer: ${farmer.address}`);
    console.log(`   Lab Officer: ${labOfficer.address}`);
    console.log(`   Manufacturer: ${manufacturer.address}`);
    console.log(`   Consumer: ${consumer.address}`);
    console.log("");

    // Check account balances
    console.log("💰 Account Balances:");
    const accounts = [
      { name: "Admin", signer: admin },
      { name: "Farmer", signer: farmer },
      { name: "Lab Officer", signer: labOfficer },
      { name: "Manufacturer", signer: manufacturer },
      { name: "Consumer", signer: consumer }
    ];

    for (const account of accounts) {
      const balance = await ethers.provider.getBalance(account.signer.address);
      console.log(`   ${account.name}: ${ethers.formatEther(balance)} ETH`);
    }
    console.log("");

    // Check if contract is accessible
    console.log("🔍 Contract Status Check:");
    try {
      const totalBatches = await herbChain.getTotalBatches();
      console.log(`   ✅ Contract accessible - Total batches: ${totalBatches.toString()}`);
    } catch (error) {
      console.log(`   ❌ Contract not accessible: ${error.message}`);
      return;
    }

    // Check roles
    console.log("🎭 Role Status:");
    const FARMER_ROLE = await herbChain.FARMER_ROLE();
    const LAB_ROLE = await herbChain.LAB_ROLE();
    const MANUFACTURER_ROLE = await herbChain.MANUFACTURER_ROLE();
    const DEFAULT_ADMIN_ROLE = await herbChain.DEFAULT_ADMIN_ROLE();

    const hasAdminRole = await herbChain.hasRole(DEFAULT_ADMIN_ROLE, admin.address);
    const hasFarmerRole = await herbChain.hasRole(FARMER_ROLE, farmer.address);
    const hasLabRole = await herbChain.hasRole(LAB_ROLE, labOfficer.address);
    const hasManufacturerRole = await herbChain.hasRole(MANUFACTURER_ROLE, manufacturer.address);

    console.log(`   Admin role (${admin.address}): ${hasAdminRole ? '✅' : '❌'}`);
    console.log(`   Farmer role (${farmer.address}): ${hasFarmerRole ? '✅' : '❌'}`);
    console.log(`   Lab Officer role (${labOfficer.address}): ${hasLabRole ? '✅' : '❌'}`);
    console.log(`   Manufacturer role (${manufacturer.address}): ${hasManufacturerRole ? '✅' : '❌'}`);
    console.log("");

    // Grant roles if not already granted
    if (!hasFarmerRole) {
      console.log("🔧 Granting farmer role...");
      const tx = await herbChain.connect(admin).grantFarmerRole(farmer.address);
      await tx.wait();
      console.log("   ✅ Farmer role granted");
    }

    if (!hasLabRole) {
      console.log("🔧 Granting lab officer role...");
      const tx = await herbChain.connect(admin).grantLabRole(labOfficer.address);
      await tx.wait();
      console.log("   ✅ Lab officer role granted");
    }

    if (!hasManufacturerRole) {
      console.log("🔧 Granting manufacturer role...");
      const tx = await herbChain.connect(admin).grantManufacturerRole(manufacturer.address);
      await tx.wait();
      console.log("   ✅ Manufacturer role granted");
    }

    // Test complete workflow
    console.log("🔄 Testing Complete Workflow:");
    console.log("=" .repeat(40));

    // 1. Create batch as farmer
    console.log("1. 👨‍🌾 Creating batch as farmer...");
    const createTx = await herbChain.connect(farmer).createBatch(
      "Premium Organic Basil",
      "Green Valley Farm, California",
      15,
      "QmExamplePhotoHash123abc456def",
      "High-quality organic basil, pesticide-free, harvested at optimal moisture content"
    );
    const createReceipt = await createTx.wait();
    console.log(`   ✅ Batch created - Gas used: ${createReceipt.gasUsed.toString()}`);

    // Get the batch ID (should be the next available ID)
    const totalBatchesAfterCreate = await herbChain.getTotalBatches();
    const batchId = totalBatchesAfterCreate.toNumber();
    console.log(`   📦 Batch ID: ${batchId}`);

    // 2. Get batch details
    console.log("2. 📋 Getting batch details...");
    const batch = await herbChain.getBatch(batchId);
    console.log("   Batch Info:", {
      id: batch.id.toString(),
      herbName: batch.herbName,
      location: batch.location,
      moisturePercent: batch.moisturePercent.toString() + "%",
      farmer: batch.farmer,
      status: ["Pending", "Approved", "Rejected", "Processed"][batch.status],
      createdAt: new Date(batch.createdAt.toNumber() * 1000).toISOString()
    });

    // 3. Approve batch as lab officer
    console.log("3. 🔬 Approving batch as lab officer...");
    const approveTx = await herbChain.connect(labOfficer).approveBatch(batchId);
    const approveReceipt = await approveTx.wait();
    console.log(`   ✅ Batch approved - Gas used: ${approveReceipt.gasUsed.toString()}`);

    // 4. Process batch as manufacturer
    console.log("4. 🏭 Processing batch as manufacturer...");
    const qrCodeHash = "QmExampleQRCodeHash789ghi012jkl";
    const processTx = await herbChain.connect(manufacturer).processBatch(batchId, qrCodeHash);
    const processReceipt = await processTx.wait();
    console.log(`   ✅ Batch processed - Gas used: ${processReceipt.gasUsed.toString()}`);

    // 5. Get final batch details
    console.log("5. 📊 Final batch status...");
    const finalBatch = await herbChain.getBatch(batchId);
    console.log("   Final Batch Info:", {
      id: finalBatch.id.toString(),
      herbName: finalBatch.herbName,
      status: ["Pending", "Approved", "Rejected", "Processed"][finalBatch.status],
      farmer: finalBatch.farmer,
      labOfficer: finalBatch.labOfficer,
      manufacturer: finalBatch.manufacturer,
      qrCodeHash: finalBatch.qrCodeHash,
      processedAt: new Date(finalBatch.processedAt.toNumber() * 1000).toISOString()
    });

    // 6. Test consumer functions
    console.log("6. 👤 Testing consumer functions...");
    
    // Get batch by QR code
    const batchByQR = await herbChain.getBatchByQR(qrCodeHash);
    console.log(`   ✅ Batch found by QR code: ${batchByQR.herbName}`);

    // Get farmer batches
    const farmerBatches = await herbChain.getFarmerBatches(farmer.address);
    console.log(`   ✅ Farmer has ${farmerBatches.length} batch(es)`);

    // Get statistics
    const totalBatches = await herbChain.getTotalBatches();
    const pendingBatches = await herbChain.getPendingBatches();
    const approvedBatches = await herbChain.getApprovedBatches();

    console.log("📈 Contract Statistics:");
    console.log(`   Total Batches: ${totalBatches.toString()}`);
    console.log(`   Pending Batches: ${pendingBatches.length}`);
    console.log(`   Approved Batches: ${approvedBatches.length}`);

    console.log("");
    console.log("🎉 All tests completed successfully!");
    console.log("");

    // MetaMask connection info
    console.log("🦊 MetaMask Connection Info:");
    console.log("=" .repeat(40));
    console.log("Network Configuration:");
    console.log(`   Network Name: ${NETWORK_CONFIG.NETWORK_NAME}`);
    console.log(`   RPC URL: ${NETWORK_CONFIG.RPC_URL}`);
    console.log(`   Chain ID: ${NETWORK_CONFIG.NETWORK_ID}`);
    console.log(`   Currency Symbol: ETH`);
    console.log("");
    console.log("Contract Addresses for Frontend:");
    console.log(`   VITE_HERBCHAIN_CONTRACT_ADDRESS=${CONTRACTS.HERBCHAIN}`);
    console.log(`   VITE_IPFS_STORAGE_CONTRACT_ADDRESS=${CONTRACTS.IPFS_STORAGE}`);
    console.log(`   VITE_ACCESS_CONTROL_CONTRACT_ADDRESS=${CONTRACTS.ACCESS_CONTROL}`);
    console.log(`   VITE_NETWORK_ID=${NETWORK_CONFIG.NETWORK_ID}`);
    console.log(`   VITE_NETWORK_NAME=${NETWORK_CONFIG.NETWORK_NAME}`);

  } catch (error) {
    console.error("❌ Test failed:", error.message);
    if (error.reason) {
      console.error("Reason:", error.reason);
    }
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });