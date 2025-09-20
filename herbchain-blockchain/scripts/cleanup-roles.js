const { ethers } = require("hardhat");

async function main() {
  const contractAddress = process.env.CONTRACT_ADDRESS || "0x5FbDB2315678afecb367f032d93F642f64180aa3";
  
  console.log("🧹 Cleaning up incorrect role assignments...");
  console.log("Contract:", contractAddress);
  
  // Get the contract
  const HerbChain = await ethers.getContractFactory("HerbChain");
  const herbChain = HerbChain.attach(contractAddress);
  
  // Get admin signer
  const [admin] = await ethers.getSigners();
  console.log("Admin address:", admin.address);
  
  // Get role constants
  const farmerRole = await herbChain.FARMER_ROLE();
  const labRole = await herbChain.LAB_ROLE();
  const manufacturerRole = await herbChain.MANUFACTURER_ROLE();
  
  try {
    // Revoke incorrect farmer role from lab officer account
    console.log("\n🔄 Revoking farmer role from lab officer account...");
    const revokeFarmerFromLab = await herbChain.revokeRole(farmerRole, "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC");
    await revokeFarmerFromLab.wait();
    console.log("✅ Revoked farmer role from lab officer");
    
    // Revoke incorrect lab role from manufacturer account
    console.log("\n🔄 Revoking lab officer role from manufacturer account...");
    const revokeLabFromManufacturer = await herbChain.revokeRole(labRole, "0x90F79bf6EB2c4f870365E785982E1f101E93b906");
    await revokeLabFromManufacturer.wait();
    console.log("✅ Revoked lab officer role from manufacturer");
    
    // Revoke incorrect manufacturer role from consumer account
    console.log("\n🔄 Revoking manufacturer role from consumer account...");
    const revokeManufacturerFromConsumer = await herbChain.revokeRole(manufacturerRole, "0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65");
    await revokeManufacturerFromConsumer.wait();
    console.log("✅ Revoked manufacturer role from consumer");
    
    console.log("\n🎉 Role cleanup complete!");
    
  } catch (error) {
    console.error("❌ Error during cleanup:", error.message);
    console.log("\nNote: Some revoke operations may fail if the contract doesn't have a revokeRole function.");
    console.log("In that case, we may need to redeploy the contract with clean roles.");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Script error:", error);
    process.exit(1);
  });