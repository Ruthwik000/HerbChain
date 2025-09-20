const { ethers } = require("hardhat");

async function main() {
  const contractAddress = process.env.CONTRACT_ADDRESS || "0x5FbDB2315678afecb367f032d93F642f64180aa3";
  
  console.log("🔍 Verifying all role assignments...");
  console.log("Contract:", contractAddress);
  
  // Get the contract
  const HerbChain = await ethers.getContractFactory("HerbChain");
  const herbChain = HerbChain.attach(contractAddress);
  
  // Get role constants
  const farmerRole = await herbChain.FARMER_ROLE();
  const labRole = await herbChain.LAB_ROLE();
  const manufacturerRole = await herbChain.MANUFACTURER_ROLE();
  const adminRole = await herbChain.DEFAULT_ADMIN_ROLE();
  
  // Test accounts from .env
  const accounts = [
    { name: "Admin", address: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266", expectedRole: "admin" },
    { name: "Farmer", address: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8", expectedRole: "farmer" },
    { name: "Lab Officer", address: "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC", expectedRole: "lab_officer" },
    { name: "Manufacturer", address: "0x90F79bf6EB2c4f870365E785982E1f101E93b906", expectedRole: "manufacturer" },
    { name: "Consumer", address: "0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65", expectedRole: "consumer" }
  ];
  
  console.log("\n✅ Role verification:");
  
  for (const account of accounts) {
    console.log(`\n${account.name} (${account.address}):`);
    
    const isFarmer = await herbChain.hasRole(farmerRole, account.address);
    const isLabOfficer = await herbChain.hasRole(labRole, account.address);
    const isManufacturer = await herbChain.hasRole(manufacturerRole, account.address);
    const isAdmin = await herbChain.hasRole(adminRole, account.address);
    
    console.log(`  Farmer: ${isFarmer ? '✅' : '❌'}`);
    console.log(`  Lab Officer: ${isLabOfficer ? '✅' : '❌'}`);
    console.log(`  Manufacturer: ${isManufacturer ? '✅' : '❌'}`);
    console.log(`  Admin: ${isAdmin ? '✅' : '❌'}`);
    
    // Determine actual role
    let actualRole = 'consumer';
    if (isAdmin) actualRole = 'admin';
    else if (isFarmer) actualRole = 'farmer';
    else if (isLabOfficer) actualRole = 'lab_officer';
    else if (isManufacturer) actualRole = 'manufacturer';
    
    const roleMatch = actualRole === account.expectedRole;
    console.log(`  → Expected: ${account.expectedRole}, Actual: ${actualRole} ${roleMatch ? '✅' : '❌'}`);
  }
  
  console.log("\n🎉 Role verification complete!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Error:", error);
    process.exit(1);
  });