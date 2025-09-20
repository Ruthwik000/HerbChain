const { ethers } = require("hardhat");

async function main() {
  // Get contract address from command line arguments or environment
  const contractAddress = process.env.CONTRACT_ADDRESS || process.argv[2];

  if (!contractAddress) {
    console.error("Please provide contract address as argument or set CONTRACT_ADDRESS environment variable");
    process.exit(1);
  }

  console.log("Setting up roles for HerbChain contract at:", contractAddress);

  // Get the contract instance
  const HerbChain = await ethers.getContractFactory("HerbChain");
  const herbChain = HerbChain.attach(contractAddress);

  // Get signers
  const [admin] = await ethers.getSigners();
  console.log("Admin address:", admin.address);

  // Addresses from .env file - matching the correct roles
  const farmerAddresses = [
    "0x70997970C51812dc3A010C7d01b50e0d17dc79C8", // Farmer account
  ];

  const labOfficerAddresses = [
    "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC", // Lab Officer account
  ];

  const manufacturerAddresses = [
    "0x90F79bf6EB2c4f870365E785982E1f101E93b906", // Manufacturer account
  ];

  try {
    // Grant farmer roles
    console.log("\nGranting farmer roles...");
    for (const farmerAddress of farmerAddresses) {
      const tx = await herbChain.grantFarmerRole(farmerAddress);
      await tx.wait();
      console.log(`✅ Granted farmer role to: ${farmerAddress}`);
    }

    // Grant lab officer roles
    console.log("\nGranting lab officer roles...");
    for (const labAddress of labOfficerAddresses) {
      const tx = await herbChain.grantLabRole(labAddress);
      await tx.wait();
      console.log(`✅ Granted lab officer role to: ${labAddress}`);
    }

    // Grant manufacturer roles
    console.log("\nGranting manufacturer roles...");
    for (const manufacturerAddress of manufacturerAddresses) {
      const tx = await herbChain.grantManufacturerRole(manufacturerAddress);
      await tx.wait();
      console.log(`✅ Granted manufacturer role to: ${manufacturerAddress}`);
    }

    console.log("\n🎉 All roles granted successfully!");

    // Verify roles
    console.log("\nVerifying roles...");
    const FARMER_ROLE = await herbChain.FARMER_ROLE();
    const LAB_ROLE = await herbChain.LAB_ROLE();
    const MANUFACTURER_ROLE = await herbChain.MANUFACTURER_ROLE();

    for (const farmerAddress of farmerAddresses) {
      const hasRole = await herbChain.hasRole(FARMER_ROLE, farmerAddress);
      console.log(`Farmer ${farmerAddress}: ${hasRole ? '✅' : '❌'}`);
    }

    for (const labAddress of labOfficerAddresses) {
      const hasRole = await herbChain.hasRole(LAB_ROLE, labAddress);
      console.log(`Lab Officer ${labAddress}: ${hasRole ? '✅' : '❌'}`);
    }

    for (const manufacturerAddress of manufacturerAddresses) {
      const hasRole = await herbChain.hasRole(MANUFACTURER_ROLE, manufacturerAddress);
      console.log(`Manufacturer ${manufacturerAddress}: ${hasRole ? '✅' : '❌'}`);
    }

  } catch (error) {
    console.error("Error setting up roles:", error);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });