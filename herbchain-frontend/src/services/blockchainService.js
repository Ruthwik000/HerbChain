import { ethers } from 'ethers';

// Smart Contract ABIs (you'll need to add the full ABIs after compilation)
const HERBCHAIN_ABI = [
  // Add your compiled contract ABI here
  "function createBatch(string batchId, string herb, string location, string coordinates, uint256 moisture, uint256 harvestDate, string photoIPFS, string notes) external returns (uint256)",
  "function approveBatch(string batchId, string approvalNotes) external",
  "function rejectBatch(string batchId, string reason) external",
  "function processBatch(string batchId, string processingNotes, string qrCodeIPFS) external",
  "function getBatch(string batchId) external view returns (tuple)",
  "function getBatchTimeline(string batchId) external view returns (tuple[])",
  "function getAllBatches() external view returns (tuple[])",
  "function registerUser(address userAddress, string name, string role) external",
  "event BatchCreated(uint256 indexed batchId, string batchIdString, address indexed farmer)",
  "event BatchApproved(uint256 indexed batchId, address indexed labOfficer)",
  "event BatchRejected(uint256 indexed batchId, address indexed labOfficer, string reason)",
  "event BatchProcessed(uint256 indexed batchId, address indexed manufacturer)"
];

const IPFS_STORAGE_ABI = [
  "function uploadFile(string hash, string fileName, uint256 fileSize, string fileType) external",
  "function getFile(string hash) external view returns (tuple)",
  "function getUserFiles(address user) external view returns (string[])",
  "function isFileActive(string hash) external view returns (bool)"
];

// Contract addresses (update after deployment)
const HERBCHAIN_ADDRESS = process.env.REACT_APP_HERBCHAIN_CONTRACT_ADDRESS;
const IPFS_STORAGE_ADDRESS = process.env.REACT_APP_IPFS_STORAGE_CONTRACT_ADDRESS;

class BlockchainService {
  constructor() {
    this.provider = null;
    this.signer = null;
    this.herbChainContract = null;
    this.ipfsStorageContract = null;
    this.isConnected = false;
  }

  // Initialize Web3 connection
  async initialize() {
    try {
      if (typeof window.ethereum !== 'undefined') {
        this.provider = new ethers.providers.Web3Provider(window.ethereum);
        await this.provider.send("eth_requestAccounts", []);
        this.signer = this.provider.getSigner();
        
        this.herbChainContract = new ethers.Contract(
          HERBCHAIN_ADDRESS,
          HERBCHAIN_ABI,
          this.signer
        );
        
        this.ipfsStorageContract = new ethers.Contract(
          IPFS_STORAGE_ADDRESS,
          IPFS_STORAGE_ABI,
          this.signer
        );
        
        this.isConnected = true;
        return true;
      } else {
        throw new Error('MetaMask not found');
      }
    } catch (error) {
      console.error('Failed to initialize blockchain connection:', error);
      return false;
    }
  }

  // User Management
  async registerUser(userAddress, name, role) {
    try {
      const tx = await this.herbChainContract.registerUser(userAddress, name, role);
      await tx.wait();
      return { success: true, txHash: tx.hash };
    } catch (error) {
      console.error('Error registering user:', error);
      return { success: false, error: error.message };
    }
  }

  async getUser(address) {
    try {
      const user = await this.herbChainContract.getUser(address);
      return {
        address: user.userAddress,
        name: user.name,
        role: user.role,
        isActive: user.isActive,
        registeredAt: user.registeredAt.toNumber()
      };
    } catch (error) {
      console.error('Error getting user:', error);
      return null;
    }
  }

  // Batch Management
  async createBatch(batchData) {
    try {
      const tx = await this.herbChainContract.createBatch(
        batchData.batchId,
        batchData.herb,
        batchData.location,
        batchData.coordinates,
        batchData.moisture,
        Math.floor(new Date(batchData.harvestDate).getTime() / 1000),
        batchData.photoIPFS,
        batchData.notes
      );
      
      const receipt = await tx.wait();
      return { success: true, txHash: tx.hash, receipt };
    } catch (error) {
      console.error('Error creating batch:', error);
      return { success: false, error: error.message };
    }
  }

  async approveBatch(batchId, notes) {
    try {
      const tx = await this.herbChainContract.approveBatch(batchId, notes);
      await tx.wait();
      return { success: true, txHash: tx.hash };
    } catch (error) {
      console.error('Error approving batch:', error);
      return { success: false, error: error.message };
    }
  }

  async rejectBatch(batchId, reason) {
    try {
      const tx = await this.herbChainContract.rejectBatch(batchId, reason);
      await tx.wait();
      return { success: true, txHash: tx.hash };
    } catch (error) {
      console.error('Error rejecting batch:', error);
      return { success: false, error: error.message };
    }
  }

  async processBatch(batchId, processingNotes, qrCodeIPFS) {
    try {
      const tx = await this.herbChainContract.processBatch(batchId, processingNotes, qrCodeIPFS);
      await tx.wait();
      return { success: true, txHash: tx.hash };
    } catch (error) {
      console.error('Error processing batch:', error);
      return { success: false, error: error.message };
    }
  }

  async getBatch(batchId) {
    try {
      const batch = await this.herbChainContract.getBatch(batchId);
      return this.formatBatchData(batch);
    } catch (error) {
      console.error('Error getting batch:', error);
      return null;
    }
  }

  async getAllBatches() {
    try {
      const batches = await this.herbChainContract.getAllBatches();
      return batches.map(batch => this.formatBatchData(batch));
    } catch (error) {
      console.error('Error getting all batches:', error);
      return [];
    }
  }

  async getBatchTimeline(batchId) {
    try {
      const timeline = await this.herbChainContract.getBatchTimeline(batchId);
      return timeline.map(entry => ({
        stage: entry.stage,
        status: entry.status,
        timestamp: entry.timestamp.toNumber(),
        actor: entry.actor,
        notes: entry.notes
      }));
    } catch (error) {
      console.error('Error getting batch timeline:', error);
      return [];
    }
  }

  // IPFS File Management
  async uploadFileMetadata(hash, fileName, fileSize, fileType) {
    try {
      const tx = await this.ipfsStorageContract.uploadFile(hash, fileName, fileSize, fileType);
      await tx.wait();
      return { success: true, txHash: tx.hash };
    } catch (error) {
      console.error('Error uploading file metadata:', error);
      return { success: false, error: error.message };
    }
  }

  async getFileInfo(hash) {
    try {
      const file = await this.ipfsStorageContract.getFile(hash);
      return {
        hash: file.hash,
        fileName: file.fileName,
        fileSize: file.fileSize.toNumber(),
        fileType: file.fileType,
        uploader: file.uploader,
        uploadedAt: file.uploadedAt.toNumber(),
        isActive: file.isActive
      };
    } catch (error) {
      console.error('Error getting file info:', error);
      return null;
    }
  }

  // Helper Methods
  formatBatchData(batch) {
    return {
      id: batch.id.toNumber(),
      batchId: batch.batchId,
      farmer: batch.farmer,
      herb: batch.herb,
      location: batch.location,
      coordinates: batch.coordinates,
      moisture: batch.moisture.toNumber(),
      harvestDate: new Date(batch.harvestDate.toNumber() * 1000).toISOString(),
      photoIPFS: batch.photoIPFS,
      notes: batch.notes,
      status: this.getStatusString(batch.status),
      createdAt: new Date(batch.createdAt.toNumber() * 1000).toISOString(),
      approvedAt: batch.approvedAt.toNumber() > 0 ? new Date(batch.approvedAt.toNumber() * 1000).toISOString() : null,
      rejectedAt: batch.rejectedAt.toNumber() > 0 ? new Date(batch.rejectedAt.toNumber() * 1000).toISOString() : null,
      processedAt: batch.processedAt.toNumber() > 0 ? new Date(batch.processedAt.toNumber() * 1000).toISOString() : null,
      labOfficer: batch.labOfficer,
      manufacturer: batch.manufacturer,
      rejectionReason: batch.rejectionReason,
      processingNotes: batch.processingNotes,
      qrCodeIPFS: batch.qrCodeIPFS
    };
  }

  getStatusString(statusNumber) {
    const statuses = ['Pending', 'Approved', 'Rejected', 'Processed'];
    return statuses[statusNumber] || 'Unknown';
  }

  // Event Listeners
  onBatchCreated(callback) {
    if (this.herbChainContract) {
      this.herbChainContract.on('BatchCreated', callback);
    }
  }

  onBatchApproved(callback) {
    if (this.herbChainContract) {
      this.herbChainContract.on('BatchApproved', callback);
    }
  }

  onBatchRejected(callback) {
    if (this.herbChainContract) {
      this.herbChainContract.on('BatchRejected', callback);
    }
  }

  onBatchProcessed(callback) {
    if (this.herbChainContract) {
      this.herbChainContract.on('BatchProcessed', callback);
    }
  }

  // Cleanup
  removeAllListeners() {
    if (this.herbChainContract) {
      this.herbChainContract.removeAllListeners();
    }
  }
}

export default new BlockchainService();