const { ethers } = require("hardhat");

async function main() {
  // Get contract address from command line arguments or environment
  const contractAddress = process.env.CONTRACT_ADDRESS || process.argv[2];
  
  if (!contractAddress) {
    console.error("Please provide contract address as argument or set CONTRACT_ADDRESS environment variable");
    process.exit(1);
  }

  console.log("Interacting with HerbChain contract at:", contractAddress);

  // Get the contract instance
  const HerbChain = await ethers.getContractFactory("HerbChain");
  const herbChain = HerbChain.attach(contractAddress);

  // Get signers
  const [admin, farmer, labOfficer, manufacturer] = await ethers.getSigners();

  try {
    // Setup roles first
    console.log("\n1. Setting up roles...");
    await herbChain.grantFarmerRole(farmer.address);
    await herbChain.grantLabRole(labOfficer.address);
    await herbChain.grantManufacturerRole(manufacturer.address);
    console.log("✅ Roles granted");

    // Create a batch as farmer
    console.log("\n2. Creating a batch as farmer...");
    const createTx = await herbChain.connect(farmer).createBatch(
      "Organic Basil",
      "Green Valley Farm, California",
      12,
      "QmExamplePhotoHash123abc",
      "Premium organic basil, grown without pesticides"
    );
    const createReceipt = await createTx.wait();
    
    // Since we know this is the first batch, it will have ID 1
    const batchId = 1;
    console.log(`✅ Batch created with ID: ${batchId}`);

    // Check total batches first
    console.log("\n3. Checking total batches...");
    const totalBatches = await herbChain.getTotalBatches();
    console.log(`Total batches: ${totalBatches.toString()}`);
    
    if (totalBatches.toNumber() === 0) {
      console.log("❌ No batches found - batch creation may have failed");
      return;
    }
    
    // Get batch details
    console.log("\n4. Getting batch details...");
    const batch = await herbChain.getBatch(batchId);
    console.log("Batch details:", {
      id: batch.id.toNumber(),
      farmer: batch.farmer,
      herbName: batch.herbName,
      location: batch.location,
      moisturePercent: batch.moisturePercent.toNumber(),
      status: batch.status, // 0 = Pending
      createdAt: new Date(batch.createdAt.toNumber() * 1000).toISOString()
    });

    // Approve batch as lab officer
    console.log("\n5. Approving batch as lab officer...");
    const approveTx = await herbChain.connect(labOfficer).approveBatch(batchId);
    await approveTx.wait();
    console.log("✅ Batch approved");

    // Process batch as manufacturer
    console.log("\n6. Processing batch as manufacturer...");
    const processTx = await herbChain.connect(manufacturer).processBatch(
      batchId,
      "QmExampleQRCodeHash456def"
    );
    await processTx.wait();
    console.log("✅ Batch processed");

    // Get final batch details
    console.log("\n7. Getting final batch details...");
    const finalBatch = await herbChain.getBatch(batchId);
    console.log("Final batch details:", {
      id: finalBatch.id.toNumber(),
      herbName: finalBatch.herbName,
      status: finalBatch.status, // 3 = Processed
      farmer: finalBatch.farmer,
      labOfficer: finalBatch.labOfficer,
      manufacturer: finalBatch.manufacturer,
      qrCodeHash: finalBatch.qrCodeHash,
      createdAt: new Date(finalBatch.createdAt.toNumber() * 1000).toISOString(),
      approvedAt: new Date(finalBatch.approvedAt.toNumber() * 1000).toISOString(),
      processedAt: new Date(finalBatch.processedAt.toNumber() * 1000).toISOString()
    });

    // Test QR code lookup
    console.log("\n8. Testing QR code lookup...");
    const batchFromQR = await herbChain.getBatchByQR("QmExampleQRCodeHash456def");
    console.log(`✅ Batch found via QR code: ${batchFromQR.herbName} (ID: ${batchFromQR.id.toNumber()})`);

    // Get total batches
    console.log("\n9. Getting statistics...");
    const finalTotalBatches = await herbChain.getTotalBatches();
    const pendingBatches = await herbChain.getPendingBatches();
    const approvedBatches = await herbChain.getApprovedBatches();
    const farmerBatches = await herbChain.getFarmerBatches(farmer.address);

    console.log("Statistics:", {
      totalBatches: finalTotalBatches.toNumber(),
      pendingBatches: pendingBatches.length,
      approvedBatches: approvedBatches.length,
      farmerBatches: farmerBatches.length
    });

    console.log("\n🎉 Interaction completed successfully!");

  } catch (error) {
    console.error("Error during interaction:", error);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });