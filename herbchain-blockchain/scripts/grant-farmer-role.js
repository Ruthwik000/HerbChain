const { ethers } = require("hardhat");

async function main() {
  // Contract address
  const contractAddress = process.env.CONTRACT_ADDRESS || "0x5FbDB2315678afecb367f032d93F642f64180aa3";
  
  // Your MetaMask account address - REPLACE THIS WITH YOUR ACTUAL ADDRESS
  const farmerAddress = process.argv[2] || "YOUR_METAMASK_ADDRESS_HERE";
  
  if (farmerAddress === "YOUR_METAMASK_ADDRESS_HERE") {
    console.error("❌ Please provide your MetaMask address as an argument:");
    console.error("npx hardhat run scripts/grant-farmer-role.js --network hardhat YOUR_METAMASK_ADDRESS");
    process.exit(1);
  }

  console.log("🎭 Granting farmer role...");
  console.log("Contract:", contractAddress);
  console.log("Farmer Address:", farmerAddress);

  // Get the contract instance
  const HerbChain = await ethers.getContractFactory("HerbChain");
  const herbChain = HerbChain.attach(contractAddress);

  // Get the admin account (deployer)
  const [admin] = await ethers.getSigners();
  console.log("Admin Address:", admin.address);

  try {
    // Grant farmer role
    console.log("\n🌱 Granting farmer role...");
    const tx = await herbChain.grantFarmerRole(farmerAddress);
    await tx.wait();
    console.log("✅ Farmer role granted successfully!");

    // Verify the role was granted
    const FARMER_ROLE = await herbChain.FARMER_ROLE();
    const hasRole = await herbChain.hasRole(FARMER_ROLE, farmerAddress);
    console.log("✅ Role verification:", hasRole ? "SUCCESS" : "FAILED");

    console.log("\n🎉 Done! You can now create batches as a farmer.");
    console.log("💡 Refresh your frontend page to see the updated role.");

  } catch (error) {
    console.error("❌ Error granting farmer role:", error.message);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });