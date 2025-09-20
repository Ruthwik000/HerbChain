const { ethers } = require("hardhat");

async function main() {
  console.log("🔍 Debugging role detection...");
  
  // Get the contract
  const contractAddress = process.env.CONTRACT_ADDRESS || "0x5FbDB2315678afecb367f032d93F642f64180aa3";
  const HerbChain = await ethers.getContractFactory("HerbChain");
  const herbChain = HerbChain.attach(contractAddress);
  
  // Get accounts
  const signers = await ethers.getSigners();
  const admin = signers[0];
  const farmer = signers[1];
  const labOfficer = signers[2];
  const manufacturer = signers[3];
  const consumer = signers[4];
  
  console.log("\n📋 Account addresses:");
  console.log("Admin:", admin?.address || "N/A");
  console.log("Farmer:", farmer?.address || "N/A");
  console.log("Lab Officer:", labOfficer?.address || "N/A");
  console.log("Manufacturer:", manufacturer?.address || "N/A");
  console.log("Consumer:", consumer?.address || "N/A");
  
  // Get role constants
  console.log("\n🎭 Role constants:");
  const farmerRole = await herbChain.FARMER_ROLE();
  const labRole = await herbChain.LAB_ROLE();
  const manufacturerRole = await herbChain.MANUFACTURER_ROLE();
  const adminRole = await herbChain.DEFAULT_ADMIN_ROLE();
  
  console.log("FARMER_ROLE:", farmerRole);
  console.log("LAB_ROLE:", labRole);
  console.log("MANUFACTURER_ROLE:", manufacturerRole);
  console.log("DEFAULT_ADMIN_ROLE:", adminRole);
  
  // Check roles for each account
  console.log("\n✅ Role checks:");
  
  const accounts = [
    { name: "Admin", address: admin?.address },
    { name: "Farmer", address: farmer?.address },
    { name: "Lab Officer", address: labOfficer?.address },
    { name: "Manufacturer", address: manufacturer?.address },
    { name: "Consumer", address: consumer?.address }
  ].filter(account => account.address); // Only include accounts that exist
  
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
    
    // Determine role
    let role = 'consumer';
    if (isAdmin) role = 'admin';
    else if (isFarmer) role = 'farmer';
    else if (isLabOfficer) role = 'lab_officer';
    else if (isManufacturer) role = 'manufacturer';
    
    console.log(`  → Detected Role: ${role}`);
  }
  
  console.log("\n🎯 Testing specific farmer account from .env:");
  const farmerAddress = process.env.FARMER_ADDRESS || "0x70997970C51812dc3A010C7d01b50e0d17dc79C8";
  console.log("Farmer address from .env:", farmerAddress);
  
  const envFarmerIsFarmer = await herbChain.hasRole(farmerRole, farmerAddress);
  const envFarmerIsLabOfficer = await herbChain.hasRole(labRole, farmerAddress);
  const envFarmerIsManufacturer = await herbChain.hasRole(manufacturerRole, farmerAddress);
  const envFarmerIsAdmin = await herbChain.hasRole(adminRole, farmerAddress);
  
  console.log(`  Farmer: ${envFarmerIsFarmer ? '✅' : '❌'}`);
  console.log(`  Lab Officer: ${envFarmerIsLabOfficer ? '✅' : '❌'}`);
  console.log(`  Manufacturer: ${envFarmerIsManufacturer ? '✅' : '❌'}`);
  console.log(`  Admin: ${envFarmerIsAdmin ? '✅' : '❌'}`);
  
  // Test with a random address (should be consumer)
  console.log("\n🎲 Testing random address (should be consumer):");
  const randomAddress = "0x1234567890123456789012345678901234567890";
  console.log("Random address:", randomAddress);
  
  const randomIsFarmer = await herbChain.hasRole(farmerRole, randomAddress);
  const randomIsLabOfficer = await herbChain.hasRole(labRole, randomAddress);
  const randomIsManufacturer = await herbChain.hasRole(manufacturerRole, randomAddress);
  const randomIsAdmin = await herbChain.hasRole(adminRole, randomAddress);
  
  console.log(`  Farmer: ${randomIsFarmer ? '✅' : '❌'}`);
  console.log(`  Lab Officer: ${randomIsLabOfficer ? '✅' : '❌'}`);
  console.log(`  Manufacturer: ${randomIsManufacturer ? '✅' : '❌'}`);
  console.log(`  Admin: ${randomIsAdmin ? '✅' : '❌'}`);
  
  console.log("\n✅ Role debugging complete!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Error:", error);
    process.exit(1);
  });