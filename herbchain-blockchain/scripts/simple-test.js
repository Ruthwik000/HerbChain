const { ethers } = require("hardhat");

async function main() {
  console.log("Running simple HerbChain test...");

  // Deploy fresh contract
  const HerbChain = await ethers.getContractFactory("HerbChain");
  const herbChain = await HerbChain.deploy();
  await herbChain.waitForDeployment();

  const contractAddress = await herbChain.getAddress();
  console.log("HerbChain deployed to:", contractAddress);

  // Get signers
  const [admin, farmer, labOfficer, manufacturer] = await ethers.getSigners();

  try {
    // Setup roles
    console.log("\n1. Setting up roles...");
    await herbChain.grantFarmerRole(farmer.address);
    await herbChain.grantLabRole(labOfficer.address);
    await herbChain.grantManufacturerRole(manufacturer.address);
    console.log("✅ Roles granted");

    // Check total batches (should be 0)
    console.log("\n2. Checking initial batch count...");
    const initialCount = await herbChain.getTotalBatches();
    console.log(`Initial batch count: ${initialCount.toString()}`);

    // Create a batch
    console.log("\n3. Creating a batch...");
    const createTx = await herbChain.connect(farmer).createBatch(
      "Test Basil",
      "Test Farm",
      15,
      "QmTestHash123",
      "Test batch"
    );
    await createTx.wait();
    console.log("✅ Batch created");

    // Check total batches (should be 1)
    console.log("\n4. Checking batch count after creation...");
    const afterCreateCount = await herbChain.getTotalBatches();
    console.log(`Batch count after creation: ${afterCreateCount.toString()}`);

    // Get batch details
    console.log("\n5. Getting batch details...");
    const batch = await herbChain.getBatch(1);
    console.log("Batch details:", {
      id: batch.id.toString(),
      farmer: batch.farmer,
      herbName: batch.herbName,
      status: batch.status.toString()
    });

    // Approve batch
    console.log("\n6. Approving batch...");
    const approveTx = await herbChain.connect(labOfficer).approveBatch(1);
    await approveTx.wait();
    console.log("✅ Batch approved");

    // Process batch
    console.log("\n7. Processing batch...");
    const processTx = await herbChain.connect(manufacturer).processBatch(1, "QmQRHash456");
    await processTx.wait();
    console.log("✅ Batch processed");

    // Get final batch details
    console.log("\n8. Getting final batch details...");
    const finalBatch = await herbChain.getBatch(1);
    console.log("Final batch details:", {
      id: finalBatch.id.toString(),
      herbName: finalBatch.herbName,
      status: finalBatch.status.toString(),
      qrCodeHash: finalBatch.qrCodeHash
    });

    console.log("\n🎉 Simple test completed successfully!");

  } catch (error) {
    console.error("Error during test:", error.message);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });