const { ethers } = require("hardhat");

async function main() {
  console.log("Deploying HerbChain smart contract...");

  // Get the contract factory
  const HerbChain = await ethers.getContractFactory("HerbChain");

  // Deploy the contract
  const herbChain = await HerbChain.deploy();
  await herbChain.waitForDeployment();

  const contractAddress = await herbChain.getAddress();
  console.log("HerbChain deployed to:", contractAddress);

  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  console.log("Deployed by:", deployer.address);
  console.log("Deployer balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)));

  // Verify the contract has the correct roles
  const DEFAULT_ADMIN_ROLE = await herbChain.DEFAULT_ADMIN_ROLE();
  const hasAdminRole = await herbChain.hasRole(DEFAULT_ADMIN_ROLE, deployer.address);
  console.log("Deployer has admin role:", hasAdminRole);

  // Save deployment info
  const deploymentInfo = {
    contractAddress: contractAddress,
    deployer: deployer.address,
    network: hre.network.name,
    deployedAt: new Date().toISOString(),
    blockNumber: await ethers.provider.getBlockNumber()
  };

  console.log("\n=== Deployment Summary ===");
  console.log(JSON.stringify(deploymentInfo, null, 2));

  // Example role assignments (uncomment if needed)
  /*
  console.log("\nGranting example roles...");
  
  // Grant farmer role to an example address
  const farmerAddress = "0x..."; // Replace with actual farmer address
  await herbChain.grantFarmerRole(farmerAddress);
  console.log("Granted farmer role to:", farmerAddress);
  
  // Grant lab role to an example address
  const labAddress = "0x..."; // Replace with actual lab address
  await herbChain.grantLabRole(labAddress);
  console.log("Granted lab role to:", labAddress);
  
  // Grant manufacturer role to an example address
  const manufacturerAddress = "0x..."; // Replace with actual manufacturer address
  await herbChain.grantManufacturerRole(manufacturerAddress);
  console.log("Granted manufacturer role to:", manufacturerAddress);
  */

  return contractAddress;
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });