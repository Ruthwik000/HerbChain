const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("HerbChain", function () {
  let herbChain;
  let owner, farmer, labOfficer, manufacturer, consumer;
  let FARMER_ROLE, LAB_ROLE, MANUFACTURER_ROLE;

  beforeEach(async function () {
    [owner, farmer, labOfficer, manufacturer, consumer] = await ethers.getSigners();

    const HerbChain = await ethers.getContractFactory("HerbChain");
    herbChain = await HerbChain.deploy();
    await herbChain.waitForDeployment();

    // Get role constants
    FARMER_ROLE = await herbChain.FARMER_ROLE();
    LAB_ROLE = await herbChain.LAB_ROLE();
    MANUFACTURER_ROLE = await herbChain.MANUFACTURER_ROLE();

    // Grant roles
    await herbChain.grantFarmerRole(farmer.address);
    await herbChain.grantLabRole(labOfficer.address);
    await herbChain.grantManufacturerRole(manufacturer.address);
  });

  describe("Role Management", function () {
    it("Should grant farmer role correctly", async function () {
      expect(await herbChain.hasRole(FARMER_ROLE, farmer.address)).to.be.true;
    });

    it("Should grant lab officer role correctly", async function () {
      expect(await herbChain.hasRole(LAB_ROLE, labOfficer.address)).to.be.true;
    });

    it("Should grant manufacturer role correctly", async function () {
      expect(await herbChain.hasRole(MANUFACTURER_ROLE, manufacturer.address)).to.be.true;
    });
  });

  describe("Batch Creation", function () {
    it("Should create a batch successfully", async function () {
      const tx = await herbChain.connect(farmer).createBatch(
        "Basil",
        "Farm Location A",
        15,
        "QmTestHash123",
        "Fresh organic basil"
      );

      await expect(tx)
        .to.emit(herbChain, "BatchCreated")
        .withArgs(1, farmer.address, "Basil");

      const batch = await herbChain.getBatch(1);
      expect(batch.herbName).to.equal("Basil");
      expect(batch.farmer).to.equal(farmer.address);
      expect(batch.status).to.equal(0); // Pending
    });

    it("Should fail if non-farmer tries to create batch", async function () {
      await expect(
        herbChain.connect(consumer).createBatch(
          "Basil",
          "Farm Location A",
          15,
          "QmTestHash123",
          "Fresh organic basil"
        )
      ).to.be.revertedWith("HerbChain: caller is not a farmer");
    });
  });

  describe("Batch Approval/Rejection", function () {
    beforeEach(async function () {
      // Create a test batch
      await herbChain.connect(farmer).createBatch(
        "Basil",
        "Farm Location A",
        15,
        "QmTestHash123",
        "Fresh organic basil"
      );
    });

    it("Should approve a batch successfully", async function () {
      const tx = await herbChain.connect(labOfficer).approveBatch(1);

      await expect(tx)
        .to.emit(herbChain, "BatchApproved");
      
      // Check event args manually
      const receipt = await tx.wait();
      const event = receipt.logs.find(log => {
        try {
          const parsed = herbChain.interface.parseLog(log);
          return parsed.name === 'BatchApproved';
        } catch {
          return false;
        }
      });
      const parsedEvent = herbChain.interface.parseLog(event);
      expect(parsedEvent.args.batchId).to.equal(1);
      expect(parsedEvent.args.labOfficer).to.equal(labOfficer.address);

      const batch = await herbChain.getBatch(1);
      expect(batch.status).to.equal(1); // Approved
      expect(batch.labOfficer).to.equal(labOfficer.address);
    });

    it("Should reject a batch successfully", async function () {
      const rejectionReason = "Moisture content too high";
      const tx = await herbChain.connect(labOfficer).rejectBatch(1, rejectionReason);

      await expect(tx)
        .to.emit(herbChain, "BatchRejected");
      
      // Check event args manually
      const receipt = await tx.wait();
      const event = receipt.logs.find(log => {
        try {
          const parsed = herbChain.interface.parseLog(log);
          return parsed.name === 'BatchRejected';
        } catch {
          return false;
        }
      });
      const parsedEvent = herbChain.interface.parseLog(event);
      expect(parsedEvent.args.batchId).to.equal(1);
      expect(parsedEvent.args.labOfficer).to.equal(labOfficer.address);
      expect(parsedEvent.args.reason).to.equal(rejectionReason);

      const batch = await herbChain.getBatch(1);
      expect(batch.status).to.equal(2); // Rejected
      expect(batch.rejectionReason).to.equal(rejectionReason);
    });

    it("Should fail if non-lab officer tries to approve", async function () {
      await expect(
        herbChain.connect(farmer).approveBatch(1)
      ).to.be.revertedWith("HerbChain: caller is not a lab officer");
    });
  });

  describe("Batch Processing", function () {
    beforeEach(async function () {
      // Create and approve a test batch
      await herbChain.connect(farmer).createBatch(
        "Basil",
        "Farm Location A",
        15,
        "QmTestHash123",
        "Fresh organic basil"
      );
      await herbChain.connect(labOfficer).approveBatch(1);
    });

    it("Should process a batch successfully", async function () {
      const qrCodeHash = "QmQRCodeHash456";
      const tx = await herbChain.connect(manufacturer).processBatch(1, qrCodeHash);

      await expect(tx)
        .to.emit(herbChain, "BatchProcessed");
      
      // Check event args manually
      const receipt = await tx.wait();
      const event = receipt.logs.find(log => {
        try {
          const parsed = herbChain.interface.parseLog(log);
          return parsed.name === 'BatchProcessed';
        } catch {
          return false;
        }
      });
      const parsedEvent = herbChain.interface.parseLog(event);
      expect(parsedEvent.args.batchId).to.equal(1);
      expect(parsedEvent.args.manufacturer).to.equal(manufacturer.address);
      expect(parsedEvent.args.qrCodeHash).to.equal(qrCodeHash);

      const batch = await herbChain.getBatch(1);
      expect(batch.status).to.equal(3); // Processed
      expect(batch.qrCodeHash).to.equal(qrCodeHash);
      expect(batch.manufacturer).to.equal(manufacturer.address);

      // Test QR code mapping
      const batchIdFromQR = await herbChain.getBatchIdFromQR(qrCodeHash);
      expect(batchIdFromQR).to.equal(1);
    });

    it("Should fail if trying to process non-approved batch", async function () {
      // Create a new pending batch
      await herbChain.connect(farmer).createBatch(
        "Mint",
        "Farm Location B",
        20,
        "QmTestHash789",
        "Fresh mint"
      );

      await expect(
        herbChain.connect(manufacturer).processBatch(2, "QmQRCodeHash789")
      ).to.be.revertedWith("HerbChain: batch is not approved");
    });
  });

  describe("Consumer Functions", function () {
    beforeEach(async function () {
      // Create, approve, and process a test batch
      await herbChain.connect(farmer).createBatch(
        "Basil",
        "Farm Location A",
        15,
        "QmTestHash123",
        "Fresh organic basil"
      );
      await herbChain.connect(labOfficer).approveBatch(1);
      await herbChain.connect(manufacturer).processBatch(1, "QmQRCodeHash456");
    });

    it("Should get batch by QR code", async function () {
      const batch = await herbChain.getBatchByQR("QmQRCodeHash456");
      expect(batch.herbName).to.equal("Basil");
      expect(batch.status).to.equal(3); // Processed
    });

    it("Should get farmer batches", async function () {
      const farmerBatches = await herbChain.getFarmerBatches(farmer.address);
      expect(farmerBatches.length).to.equal(1);
      expect(farmerBatches[0]).to.equal(1);
    });

    it("Should get pending batches", async function () {
      // Create another pending batch
      await herbChain.connect(farmer).createBatch(
        "Mint",
        "Farm Location B",
        20,
        "QmTestHash789",
        "Fresh mint"
      );

      const pendingBatches = await herbChain.getPendingBatches();
      expect(pendingBatches.length).to.equal(1);
      expect(pendingBatches[0]).to.equal(2);
    });

    it("Should get approved batches", async function () {
      // Create and approve another batch
      await herbChain.connect(farmer).createBatch(
        "Mint",
        "Farm Location B",
        20,
        "QmTestHash789",
        "Fresh mint"
      );
      await herbChain.connect(labOfficer).approveBatch(2);

      const approvedBatches = await herbChain.getApprovedBatches();
      expect(approvedBatches.length).to.equal(1);
      expect(approvedBatches[0]).to.equal(2);
    });
  });
});