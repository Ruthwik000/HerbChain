const { ethers } = require("hardhat");

async function main() {
  const contractAddress = process.env.CONTRACT_ADDRESS || "0x5FbDB2315678afecb367f032d93F642f64180aa3";
  const accountToCheck = process.argv[2] || "0x70997970C51812dc3A010C7d01b50e0d17dc79C8";
  
  console.log("🔍 Checking specific account role...");
  console.log("Contract:", contractAddress);
  console.log("Account:", accountToCheck);
  
  // Get the contract
  const HerbChain = await ethers.getContractFactory("HerbChain");
  const herbChain = HerbChain.attach(contractAddress);
  
  try {
    // Get role constants
    const farmerRole = await herbChain.FARMER_ROLE();
    const labRole = await herbChain.LAB_ROLE();
    const manufacturerRole = await herbChain.MANUFACTURER_ROLE();
    const adminRole = await herbChain.DEFAULT_ADMIN_ROLE();
    
    console.log("\n🎭 Role constants:");
    console.log("FARMER_ROLE:", farmerRole);
    console.log("LAB_ROLE:", labRole);
    console.log("MANUFACTURER_ROLE:", manufacturerRole);
    console.log("DEFAULT_ADMIN_ROLE:", adminRole);
    
    // Check roles for the specific account
    console.log(`\n✅ Role checks for ${accountToCheck}:`);
    
    const isFarmer = await herbChain.hasRole(farmerRole, accountToCheck);
    const isLabOfficer = await herbChain.hasRole(labRole, accountToCheck);
    const isManufacturer = await herbChain.hasRole(manufacturerRole, accountToCheck);
    const isAdmin = await herbChain.hasRole(adminRole, accountToCheck);
    
    console.log(`Farmer: ${isFarmer ? '✅' : '❌'}`);
    console.log(`Lab Officer: ${isLabOfficer ? '✅' : '❌'}`);
    console.log(`Manufacturer: ${isManufacturer ? '✅' : '❌'}`);
    console.log(`Admin: ${isAdmin ? '✅' : '❌'}`);
    
    // Determine role
    let role = 'consumer';
    if (isAdmin) role = 'admin';
    else if (isFarmer) role = 'farmer';
    else if (isLabOfficer) role = 'lab_officer';
    else if (isManufacturer) role = 'manufacturer';
    
    console.log(`\n🎯 Determined Role: ${role}`);
    
    // Test contract connection
    const totalBatches = await herbChain.getTotalBatches();
    console.log(`\n📊 Contract Status: Connected (Total batches: ${totalBatches})`);
    
  } catch (error) {
    console.error("❌ Error:", error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Script error:", error);
    process.exit(1);
  });