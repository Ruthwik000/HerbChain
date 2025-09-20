const { ethers } = require("hardhat");

async function main() {
  console.log("🔍 Checking batches on blockchain...");
  
  // Get the contract
  const contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
  const HerbChain = await ethers.getContractFactory("HerbChain");
  const herbChain = HerbChain.attach(contractAddress);
  
  try {
    // Get total batches
    const totalBatches = await herbChain.getTotalBatches();
    console.log("📊 Total batches:", totalBatches.toString());
    
    if (totalBatches > 0) {
      console.log("\n📋 Batch Details:");
      
      for (let i = 1; i <= totalBatches; i++) {
        try {
          const batch = await herbChain.getBatch(i);
          console.log(`\n🌱 Batch ${i}:`);
          console.log("  - ID:", batch.id.toString());
          console.log("  - Farmer:", batch.farmer);
          console.log("  - Herb:", batch.herbName);
          console.log("  - Location:", batch.location);
          console.log("  - Moisture:", batch.moisturePercent.toString() + "%");
          console.log("  - Status:", batch.status); // 0=Pending, 1=Approved, 2=Rejected, 3=Processed
          console.log("  - Created:", new Date(Number(batch.createdAt) * 1000).toLocaleString());
        } catch (error) {
          console.log(`❌ Error getting batch ${i}:`, error.message);
        }
      }
    }
    
    // Check farmer batches specifically
    const farmerAddress = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8";
    console.log(`\n👨‍🌾 Checking batches for farmer: ${farmerAddress}`);
    
    try {
      const farmerBatchIds = await herbChain.getFarmerBatches(farmerAddress);
      console.log("📦 Farmer batch IDs:", farmerBatchIds.map(id => id.toString()));
    } catch (error) {
      console.log("❌ Error getting farmer batches:", error.message);
    }
    
  } catch (error) {
    console.error("❌ Error:", error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });