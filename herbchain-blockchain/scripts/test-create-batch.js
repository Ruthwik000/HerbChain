const { ethers } = require("hardhat");

async function main() {
  const contractAddress = process.env.CONTRACT_ADDRESS || "0x5FbDB2315678afecb367f032d93F642f64180aa3";
  
  console.log("🧪 Testing batch creation...");
  console.log("Contract:", contractAddress);
  
  // Get the contract
  const HerbChain = await ethers.getContractFactory("HerbChain");
  const herbChain = HerbChain.attach(contractAddress);
  
  // Get signers
  const signers = await ethers.getSigners();
  const admin = signers[0];
  const farmer = signers[1];
  
  console.log("Admin:", admin?.address || "N/A");
  console.log("Farmer:", farmer?.address || "N/A");
  
  try {
    // Use the specific farmer address from .env
    const farmerAddress = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8";
    console.log("Using farmer address:", farmerAddress);
    
    // Check if farmer has farmer role
    const farmerRole = await herbChain.FARMER_ROLE();
    const hasFarmerRole = await herbChain.hasRole(farmerRole, farmerAddress);
    console.log("Farmer has farmer role:", hasFarmerRole);
    
    if (!hasFarmerRole) {
      console.log("❌ Farmer doesn't have farmer role. Granting role...");
      const grantTx = await herbChain.grantFarmerRole(farmerAddress);
      await grantTx.wait();
      console.log("✅ Farmer role granted");
    }
    
    // Test batch creation using impersonation
    console.log("\n🌱 Creating test batch...");
    
    // Impersonate the farmer account
    await network.provider.request({
      method: "hardhat_impersonateAccount",
      params: [farmerAddress],
    });
    
    const farmerSigner = await ethers.getSigner(farmerAddress);
    
    const createTx = await herbChain.connect(farmerSigner).createBatch(
      "Test Herb",
      "Test Location", 
      15,
      "QmTestPhotoHash123",
      "Test batch creation"
    );
    
    console.log("Transaction sent:", createTx.hash);
    const receipt = await createTx.wait();
    console.log("✅ Transaction confirmed in block:", receipt.blockNumber);
    console.log("Gas used:", receipt.gasUsed.toString());
    
    // Get total batches
    const totalBatches = await herbChain.getTotalBatches();
    console.log("Total batches after creation:", totalBatches.toString());
    
    // Get the created batch
    if (totalBatches > 0) {
      const batch = await herbChain.getBatch(totalBatches - 1);
      console.log("\n📋 Created batch details:");
      console.log("ID:", batch.id.toString());
      console.log("Farmer:", batch.farmer);
      console.log("Herb Name:", batch.herbName);
      console.log("Location:", batch.location);
      console.log("Moisture:", batch.moisturePercent.toString() + "%");
      console.log("Status:", batch.status);
    }
    
  } catch (error) {
    console.error("❌ Error:", error.message);
    if (error.reason) {
      console.error("Reason:", error.reason);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Script error:", error);
    process.exit(1);
  });