// HerbChain Frontend Integration Example
// This file shows how to integrate the smart contract with your React frontend

import { ethers } from 'ethers';

// Contract ABI (you'll get this after compilation)
const HERBCHAIN_ABI = [
  // Add your contract ABI here after compilation
  // This is just a sample structure
];

const CONTRACT_ADDRESS = "YOUR_DEPLOYED_CONTRACT_ADDRESS";

class HerbChainService {
  constructor() {
    this.provider = null;
    this.signer = null;
    this.contract = null;
  }

  // Initialize Web3 connection
  async connect() {
    if (typeof window.ethereum !== 'undefined') {
      try {
        // Request account access
        await window.ethereum.request({ method: 'eth_requestAccounts' });
        
        this.provider = new ethers.providers.Web3Provider(window.ethereum);
        this.signer = this.provider.getSigner();
        this.contract = new ethers.Contract(CONTRACT_ADDRESS, HERBCHAIN_ABI, this.signer);
        
        console.log('Connected to HerbChain contract');
        return true;
      } catch (error) {
        console.error('Failed to connect:', error);
        return false;
      }
    } else {
      console.error('MetaMask not found');
      return false;
    }
  }

  // Farmer Functions
  async createBatch(herbName, location, moisturePercent, photoIpfsHash, notes) {
    try {
      const tx = await this.contract.createBatch(
        herbName,
        location,
        moisturePercent,
        photoIpfsHash,
        notes
      );
      
      const receipt = await tx.wait();
      
      // Extract batch ID from event
      const event = receipt.events.find(e => e.event === 'BatchCreated');
      const batchId = event.args.batchId.toNumber();
      
      return { success: true, batchId, txHash: receipt.transactionHash };
    } catch (error) {
      console.error('Error creating batch:', error);
      return { success: false, error: error.message };
    }
  }

  async getFarmerBatches(farmerAddress) {
    try {
      const batchIds = await this.contract.getFarmerBatches(farmerAddress);
      const batches = [];
      
      for (const id of batchIds) {
        const batch = await this.contract.getBatch(id);
        batches.push(this.formatBatch(batch));
      }
      
      return batches;
    } catch (error) {
      console.error('Error getting farmer batches:', error);
      return [];
    }
  }

  // Lab Officer Functions
  async approveBatch(batchId) {
    try {
      const tx = await this.contract.approveBatch(batchId);
      const receipt = await tx.wait();
      
      return { success: true, txHash: receipt.transactionHash };
    } catch (error) {
      console.error('Error approving batch:', error);
      return { success: false, error: error.message };
    }
  }

  async rejectBatch(batchId, reason) {
    try {
      const tx = await this.contract.rejectBatch(batchId, reason);
      const receipt = await tx.wait();
      
      return { success: true, txHash: receipt.transactionHash };
    } catch (error) {
      console.error('Error rejecting batch:', error);
      return { success: false, error: error.message };
    }
  }

  async getPendingBatches() {
    try {
      const batchIds = await this.contract.getPendingBatches();
      const batches = [];
      
      for (const id of batchIds) {
        const batch = await this.contract.getBatch(id);
        batches.push(this.formatBatch(batch));
      }
      
      return batches;
    } catch (error) {
      console.error('Error getting pending batches:', error);
      return [];
    }
  }

  // Manufacturer Functions
  async processBatch(batchId, qrCodeHash) {
    try {
      const tx = await this.contract.processBatch(batchId, qrCodeHash);
      const receipt = await tx.wait();
      
      return { success: true, txHash: receipt.transactionHash };
    } catch (error) {
      console.error('Error processing batch:', error);
      return { success: false, error: error.message };
    }
  }

  async getApprovedBatches() {
    try {
      const batchIds = await this.contract.getApprovedBatches();
      const batches = [];
      
      for (const id of batchIds) {
        const batch = await this.contract.getBatch(id);
        batches.push(this.formatBatch(batch));
      }
      
      return batches;
    } catch (error) {
      console.error('Error getting approved batches:', error);
      return [];
    }
  }

  // Consumer Functions
  async getBatch(batchId) {
    try {
      const batch = await this.contract.getBatch(batchId);
      return this.formatBatch(batch);
    } catch (error) {
      console.error('Error getting batch:', error);
      return null;
    }
  }

  async getBatchByQR(qrCodeHash) {
    try {
      const batch = await this.contract.getBatchByQR(qrCodeHash);
      return this.formatBatch(batch);
    } catch (error) {
      console.error('Error getting batch by QR:', error);
      return null;
    }
  }

  // Event Listeners
  setupEventListeners(callbacks) {
    if (!this.contract) return;

    // Listen for BatchCreated events
    this.contract.on('BatchCreated', (batchId, farmer, herbName, event) => {
      if (callbacks.onBatchCreated) {
        callbacks.onBatchCreated({
          batchId: batchId.toNumber(),
          farmer,
          herbName,
          txHash: event.transactionHash
        });
      }
    });

    // Listen for BatchApproved events
    this.contract.on('BatchApproved', (batchId, labOfficer, timestamp, event) => {
      if (callbacks.onBatchApproved) {
        callbacks.onBatchApproved({
          batchId: batchId.toNumber(),
          labOfficer,
          timestamp: timestamp.toNumber(),
          txHash: event.transactionHash
        });
      }
    });

    // Listen for BatchRejected events
    this.contract.on('BatchRejected', (batchId, labOfficer, reason, timestamp, event) => {
      if (callbacks.onBatchRejected) {
        callbacks.onBatchRejected({
          batchId: batchId.toNumber(),
          labOfficer,
          reason,
          timestamp: timestamp.toNumber(),
          txHash: event.transactionHash
        });
      }
    });

    // Listen for BatchProcessed events
    this.contract.on('BatchProcessed', (batchId, manufacturer, qrCodeHash, timestamp, event) => {
      if (callbacks.onBatchProcessed) {
        callbacks.onBatchProcessed({
          batchId: batchId.toNumber(),
          manufacturer,
          qrCodeHash,
          timestamp: timestamp.toNumber(),
          txHash: event.transactionHash
        });
      }
    });
  }

  // Helper function to format batch data
  formatBatch(batch) {
    return {
      id: batch.id.toNumber(),
      farmer: batch.farmer,
      herbName: batch.herbName,
      location: batch.location,
      moisturePercent: batch.moisturePercent.toNumber(),
      photoIpfsHash: batch.photoIpfsHash,
      notes: batch.notes,
      status: this.getStatusString(batch.status),
      statusCode: batch.status,
      rejectionReason: batch.rejectionReason,
      createdAt: new Date(batch.createdAt.toNumber() * 1000),
      approvedAt: batch.approvedAt.toNumber() > 0 ? new Date(batch.approvedAt.toNumber() * 1000) : null,
      processedAt: batch.processedAt.toNumber() > 0 ? new Date(batch.processedAt.toNumber() * 1000) : null,
      labOfficer: batch.labOfficer !== ethers.constants.AddressZero ? batch.labOfficer : null,
      manufacturer: batch.manufacturer !== ethers.constants.AddressZero ? batch.manufacturer : null,
      qrCodeHash: batch.qrCodeHash
    };
  }

  getStatusString(status) {
    const statuses = ['Pending', 'Approved', 'Rejected', 'Processed'];
    return statuses[status] || 'Unknown';
  }

  // IPFS Helper Functions
  async uploadToIPFS(file) {
    // This is a placeholder - implement with your preferred IPFS service
    // Examples: Pinata, Infura IPFS, or local IPFS node
    
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      const response = await fetch('YOUR_IPFS_UPLOAD_ENDPOINT', {
        method: 'POST',
        body: formData,
        headers: {
          'Authorization': 'Bearer YOUR_IPFS_API_KEY'
        }
      });
      
      const result = await response.json();
      return result.IpfsHash; // Return the IPFS hash
    } catch (error) {
      console.error('Error uploading to IPFS:', error);
      throw error;
    }
  }

  getIPFSUrl(hash) {
    return `https://ipfs.io/ipfs/${hash}`;
    // Or use your preferred IPFS gateway
  }
}

// Usage Example in React Component
export const useHerbChain = () => {
  const [herbChainService] = useState(() => new HerbChainService());
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const connect = async () => {
      const connected = await herbChainService.connect();
      setIsConnected(connected);
      
      if (connected) {
        // Setup event listeners
        herbChainService.setupEventListeners({
          onBatchCreated: (data) => {
            console.log('New batch created:', data);
            // Update UI state
          },
          onBatchApproved: (data) => {
            console.log('Batch approved:', data);
            // Update UI state
          },
          onBatchRejected: (data) => {
            console.log('Batch rejected:', data);
            // Update UI state
          },
          onBatchProcessed: (data) => {
            console.log('Batch processed:', data);
            // Update UI state
          }
        });
      }
    };
    
    connect();
  }, [herbChainService]);

  return {
    herbChainService,
    isConnected
  };
};

export default HerbChainService;