import { ethers } from 'ethers';

// HerbChain Smart Contract ABI - Updated to match deployed contract
const HERBCHAIN_ABI = [
  // Constructor
  "constructor()",
  
  // Role constants
  "function FARMER_ROLE() view returns (bytes32)",
  "function LAB_ROLE() view returns (bytes32)",
  "function MANUFACTURER_ROLE() view returns (bytes32)",
  "function DEFAULT_ADMIN_ROLE() view returns (bytes32)",
  
  // Role management functions
  "function grantFarmerRole(address farmer)",
  "function grantLabRole(address labOfficer)",
  "function grantManufacturerRole(address manufacturer)",
  "function hasRole(bytes32 role, address account) view returns (bool)",
  
  // Farmer functions
  "function createBatch(string herbName, string location, uint256 moisturePercent, string photoIpfsHash, string notes) returns (uint256)",
  "function getFarmerBatches(address farmer) view returns (uint256[])",
  
  // Lab Officer functions
  "function approveBatch(uint256 batchId)",
  "function rejectBatch(uint256 batchId, string reason)",
  "function getPendingBatches() view returns (uint256[])",
  
  // Manufacturer functions
  "function processBatch(uint256 batchId, string qrCodeHash)",
  "function getApprovedBatches() view returns (uint256[])",
  
  // Consumer functions
  "function getBatch(uint256 batchId) view returns (tuple(uint256 id, address farmer, string herbName, string location, uint256 moisturePercent, string photoIpfsHash, string notes, uint8 status, string rejectionReason, uint256 createdAt, uint256 approvedAt, uint256 processedAt, address labOfficer, address manufacturer, string qrCodeHash))",
  "function getBatchByQR(string qrCodeHash) view returns (tuple(uint256 id, address farmer, string herbName, string location, uint256 moisturePercent, string photoIpfsHash, string notes, uint8 status, string rejectionReason, uint256 createdAt, uint256 approvedAt, uint256 processedAt, address labOfficer, address manufacturer, string qrCodeHash))",
  "function getBatchIdFromQR(string qrCodeHash) view returns (uint256)",
  "function getTotalBatches() view returns (uint256)",
  
  // Events
  "event BatchCreated(uint256 indexed batchId, address indexed farmer, string herbName)",
  "event BatchApproved(uint256 indexed batchId, address indexed labOfficer, uint256 timestamp)",
  "event BatchRejected(uint256 indexed batchId, address indexed labOfficer, string reason, uint256 timestamp)",
  "event BatchProcessed(uint256 indexed batchId, address indexed manufacturer, string qrCodeHash, uint256 timestamp)",
  "event RoleGranted(bytes32 indexed role, address indexed account, address indexed sender)"
];

// Contract addresses (update after deployment)
const HERBCHAIN_ADDRESS = import.meta.env.VITE_HERBCHAIN_CONTRACT_ADDRESS || "0x5FbDB2315678afecb367f032d93F642f64180aa3";
const NETWORK_ID = parseInt(import.meta.env.VITE_NETWORK_ID || "1337");
const NETWORK_NAME = import.meta.env.VITE_NETWORK_NAME || "localhost";

console.log('🔗 HerbChain Config:', {
  contract: HERBCHAIN_ADDRESS,
  networkId: NETWORK_ID,
  networkName: NETWORK_NAME
});

// Batch status enum
const BATCH_STATUS = {
  0: 'Pending',
  1: 'Approved', 
  2: 'Rejected',
  3: 'Processed'
};

// User roles enum
const USER_ROLES = {
  ADMIN: 'admin',
  FARMER: 'farmer',
  LAB_OFFICER: 'lab_officer',
  MANUFACTURER: 'manufacturer',
  CONSUMER: 'consumer'
};

class BlockchainService {
  constructor() {
    this.provider = null;
    this.signer = null;
    this.herbChainContract = null;
    this.isConnected = false;
    this.currentAccount = null;
    this.currentRole = null;
  }

  // Initialize Web3 connection
  async initialize() {
    try {
      if (typeof window.ethereum !== 'undefined') {
        // Request account access
        const accounts = await window.ethereum.request({ 
          method: 'eth_requestAccounts' 
        });

        if (accounts.length === 0) {
          throw new Error('No accounts found. Please connect MetaMask.');
        }

        // Initialize provider and signer
        this.provider = new ethers.providers.Web3Provider(window.ethereum);
        this.signer = this.provider.getSigner();
        this.currentAccount = accounts[0];

        // Initialize contract
        this.herbChainContract = new ethers.Contract(
          HERBCHAIN_ADDRESS,
          HERBCHAIN_ABI,
          this.signer
        );

        // Verify network
        await this.checkNetwork();

        // Wait a moment for the connection to stabilize
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Determine user role
        await this.determineUserRole();

        this.isConnected = true;
        
        console.log('✅ Connected to HerbChain:', {
          account: this.currentAccount,
          role: this.currentRole,
          contract: HERBCHAIN_ADDRESS,
          network: NETWORK_NAME
        });

        return {
          success: true,
          account: this.currentAccount,
          role: this.currentRole,
          contract: HERBCHAIN_ADDRESS
        };
      } else {
        throw new Error('MetaMask not found. Please install MetaMask.');
      }
    } catch (error) {
      console.error('Failed to initialize blockchain connection:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Check if connected to correct network
  async checkNetwork() {
    const network = await this.provider.getNetwork();
    
    if (Number(network.chainId) !== NETWORK_ID) {
      // Try to switch network
      try {
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: `0x${NETWORK_ID.toString(16)}` }],
        });
      } catch (switchError) {
        // Network doesn't exist, add it
        if (switchError.code === 4902) {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: `0x${NETWORK_ID.toString(16)}`,
              chainName: `HerbChain ${NETWORK_NAME}`,
              rpcUrls: ['http://127.0.0.1:8545'],
              nativeCurrency: {
                name: 'ETH',
                symbol: 'ETH',
                decimals: 18
              }
            }]
          });
        } else {
          throw switchError;
        }
      }
    }
  }

  // Determine current user's role in the system
  async determineUserRole() {
    if (!this.herbChainContract || !this.currentAccount) {
      console.log('❌ Cannot determine role: missing contract or account');
      console.log('  - Contract:', !!this.herbChainContract);
      console.log('  - Account:', this.currentAccount);
      this.currentRole = USER_ROLES.CONSUMER;
      return this.currentRole;
    }

    console.log('🔍 Determining role for account:', this.currentAccount);
    console.log('  - Contract address:', HERBCHAIN_ADDRESS);
    console.log('  - Network:', NETWORK_NAME, NETWORK_ID);

    try {
      // Test contract connection first
      console.log('🧪 Testing contract connection...');
      const totalBatches = await this.herbChainContract.getTotalBatches();
      console.log('✅ Contract connected, total batches:', totalBatches.toString());

      console.log('📞 Getting role constants...');
      const [farmerRole, labRole, manufacturerRole, adminRole] = await Promise.all([
        this.herbChainContract.FARMER_ROLE(),
        this.herbChainContract.LAB_ROLE(),
        this.herbChainContract.MANUFACTURER_ROLE(),
        this.herbChainContract.DEFAULT_ADMIN_ROLE()
      ]);

      console.log('✅ Role constants retrieved:', {
        farmerRole,
        labRole,
        manufacturerRole,
        adminRole
      });

      console.log('🔍 Checking roles for account:', this.currentAccount);
      
      // Check roles one by one for better debugging
      console.log('  - Checking farmer role...');
      const isFarmer = await this.herbChainContract.hasRole(farmerRole, this.currentAccount);
      console.log('  - Farmer result:', isFarmer);
      
      console.log('  - Checking lab role...');
      const isLabOfficer = await this.herbChainContract.hasRole(labRole, this.currentAccount);
      console.log('  - Lab result:', isLabOfficer);
      
      console.log('  - Checking manufacturer role...');
      const isManufacturer = await this.herbChainContract.hasRole(manufacturerRole, this.currentAccount);
      console.log('  - Manufacturer result:', isManufacturer);
      
      console.log('  - Checking admin role...');
      const isAdmin = await this.herbChainContract.hasRole(adminRole, this.currentAccount);
      console.log('  - Admin result:', isAdmin);

      console.log('✅ All role check results for', this.currentAccount, ':', {
        isFarmer,
        isLabOfficer,
        isManufacturer,
        isAdmin
      });

      let determinedRole;
      if (isAdmin) {
        determinedRole = USER_ROLES.ADMIN;
        console.log('🎭 Role determined: ADMIN');
      } else if (isFarmer) {
        determinedRole = USER_ROLES.FARMER;
        console.log('🎭 Role determined: FARMER');
      } else if (isLabOfficer) {
        determinedRole = USER_ROLES.LAB_OFFICER;
        console.log('🎭 Role determined: LAB_OFFICER');
      } else if (isManufacturer) {
        determinedRole = USER_ROLES.MANUFACTURER;
        console.log('🎭 Role determined: MANUFACTURER');
      } else {
        determinedRole = USER_ROLES.CONSUMER;
        console.log('🎭 Role determined: CONSUMER (default - no roles found)');
        
        // Additional debugging for consumer case
        console.log('🔍 CONSUMER DEBUG INFO:');
        console.log('  - Expected farmer address:', '0x70997970C51812dc3A010C7d01b50e0d17dc79C8');
        console.log('  - Current account:', this.currentAccount);
        console.log('  - Addresses match:', this.currentAccount.toLowerCase() === '0x70997970C51812dc3A010C7d01b50e0d17dc79C8'.toLowerCase());
        console.log('  - This suggests the farmer role was not granted to this address');
        console.log('  - Please run the setup script to grant roles');
      }

      this.currentRole = determinedRole;
      console.log('🎭 Final determined role:', this.currentRole);

      return this.currentRole;

    } catch (error) {
      console.error('❌ Could not determine user role:', error);
      console.error('  - Error details:', error.message);
      console.error('  - Stack:', error.stack);
      this.currentRole = USER_ROLES.CONSUMER;
      return this.currentRole;
    }
  }

  // Get current connection status
  getConnectionStatus() {
    return {
      isConnected: this.isConnected,
      account: this.currentAccount,
      role: this.currentRole,
      contract: HERBCHAIN_ADDRESS,
      network: NETWORK_NAME
    };
  }

  /**
   * Get batch timeline from blockchain events
   */
  async getBatchTimeline(batchId) {
    try {
      console.log('📅 Fetching timeline for batch:', batchId);
      
      if (!this.isConnected || !this.herbChainContract) {
        throw new Error('Not connected to blockchain');
      }

      const timeline = [];
      
      // Get all events for this batch
      const filter = this.herbChainContract.filters.BatchCreated(batchId);
      const createdEvents = await this.herbChainContract.queryFilter(filter);
      
      const approvedFilter = this.herbChainContract.filters.BatchApproved(batchId);
      const approvedEvents = await this.herbChainContract.queryFilter(approvedFilter);
      
      const rejectedFilter = this.herbChainContract.filters.BatchRejected(batchId);
      const rejectedEvents = await this.herbChainContract.queryFilter(rejectedFilter);
      
      const processedFilter = this.herbChainContract.filters.BatchProcessed(batchId);
      const processedEvents = await this.herbChainContract.queryFilter(processedFilter);

      // Process BatchCreated events
      for (const event of createdEvents) {
        const block = await event.getBlock();
        timeline.push({
          stage: 'Batch Created',
          status: 'Completed',
          date: new Date(block.timestamp * 1000).toISOString(),
          actor: `Farmer: ${event.args.farmer.substring(0, 6)}...${event.args.farmer.substring(event.args.farmer.length - 4)}`,
          notes: `${event.args.herbName} batch submitted for review`,
          blockNumber: event.blockNumber,
          transactionHash: event.transactionHash
        });
      }

      // Process BatchApproved events
      for (const event of approvedEvents) {
        const block = await event.getBlock();
        timeline.push({
          stage: 'Lab Approved',
          status: 'Completed',
          date: new Date(block.timestamp * 1000).toISOString(),
          actor: `Lab Officer: ${event.args.labOfficer.substring(0, 6)}...${event.args.labOfficer.substring(event.args.labOfficer.length - 4)}`,
          notes: 'Quality checks passed successfully',
          blockNumber: event.blockNumber,
          transactionHash: event.transactionHash
        });
      }

      // Process BatchRejected events
      for (const event of rejectedEvents) {
        const block = await event.getBlock();
        timeline.push({
          stage: 'Lab Rejected',
          status: 'Rejected',
          date: new Date(block.timestamp * 1000).toISOString(),
          actor: `Lab Officer: ${event.args.labOfficer.substring(0, 6)}...${event.args.labOfficer.substring(event.args.labOfficer.length - 4)}`,
          notes: event.args.reason,
          blockNumber: event.blockNumber,
          transactionHash: event.transactionHash
        });
      }

      // Process BatchProcessed events
      for (const event of processedEvents) {
        const block = await event.getBlock();
        timeline.push({
          stage: 'Processed by Manufacturer',
          status: 'Completed',
          date: new Date(block.timestamp * 1000).toISOString(),
          actor: `Manufacturer: ${event.args.manufacturer.substring(0, 6)}...${event.args.manufacturer.substring(event.args.manufacturer.length - 4)}`,
          notes: 'Batch processed and QR code generated',
          blockNumber: event.blockNumber,
          transactionHash: event.transactionHash
        });
      }

      // Sort timeline by block number (chronological order)
      timeline.sort((a, b) => a.blockNumber - b.blockNumber);

      console.log('✅ Timeline fetched:', timeline);
      
      return {
        success: true,
        timeline: timeline
      };

    } catch (error) {
      console.error('❌ Error fetching batch timeline:', error);
      return {
        success: false,
        error: error.message,
        timeline: []
      };
    }
  }

  // ==================== FARMER METHODS ====================

  /**
   * Create a new herb batch (Farmer only)
   */
  async createBatch(batchData) {
    console.log('🌱 Creating batch with data:', batchData);
    console.log('🔍 Current service state:');
    console.log('  - isConnected:', this.isConnected);
    console.log('  - currentAccount:', this.currentAccount);
    console.log('  - currentRole:', this.currentRole);
    console.log('  - contract:', !!this.herbChainContract);

    try {
      // Re-determine role before creating batch to ensure it's current
      console.log('🔄 Re-determining role before batch creation...');
      await this.determineUserRole();
      console.log('🎭 Role after re-determination:', this.currentRole);

      this.validateRole([USER_ROLES.FARMER, USER_ROLES.ADMIN]);
      console.log('✅ Role validation passed');

      this.validateBatchData(batchData);
      console.log('✅ Batch data validation passed');

      console.log('📤 Sending transaction to blockchain...');
      const tx = await this.herbChainContract.createBatch(
        batchData.herbName,
        batchData.location,
        batchData.moisturePercent,
        batchData.photoIpfsHash,
        batchData.notes
      );

      console.log('⏳ Transaction sent, hash:', tx.hash);
      console.log('⏳ Waiting for confirmation...');
      const receipt = await tx.wait();
      console.log('✅ Transaction confirmed in block:', receipt.blockNumber);
      
      // Extract batch ID from events
      const batchId = await this.extractBatchIdFromReceipt(receipt);
      console.log('🆔 Extracted batch ID:', batchId);

      return {
        success: true,
        batchId,
        txHash: receipt.transactionHash,
        gasUsed: receipt.gasUsed.toString()
      };

    } catch (error) {
      console.error('❌ Create batch failed:', error);
      console.error('❌ Error details:', {
        message: error.message,
        code: error.code,
        reason: error.reason,
        data: error.data
      });
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get all batches for a specific farmer
   */
  async getFarmerBatches(farmerAddress = null) {
    try {
      const address = farmerAddress || this.currentAccount;
      const batchIds = await this.herbChainContract.getFarmerBatches(address);
      
      const batches = await Promise.all(
        batchIds.map(id => this.getBatch(Number(id)))
      );

      return {
        success: true,
        batches: batches.filter(batch => batch.success).map(batch => batch.data)
      };

    } catch (error) {
      console.error('❌ Get farmer batches failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // ==================== LAB OFFICER METHODS ====================

  /**
   * Approve a pending batch (Lab Officer only)
   */
  async approveBatch(batchId) {
    try {
      this.validateRole([USER_ROLES.LAB_OFFICER, USER_ROLES.ADMIN]);

      const tx = await this.herbChainContract.approveBatch(batchId);
      const receipt = await tx.wait();

      return {
        success: true,
        batchId,
        txHash: receipt.transactionHash,
        gasUsed: receipt.gasUsed.toString()
      };

    } catch (error) {
      console.error('❌ Approve batch failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Reject a pending batch with reason (Lab Officer only)
   */
  async rejectBatch(batchId, reason) {
    try {
      this.validateRole([USER_ROLES.LAB_OFFICER, USER_ROLES.ADMIN]);

      if (!reason || reason.trim().length === 0) {
        throw new Error('Rejection reason is required');
      }

      const tx = await this.herbChainContract.rejectBatch(batchId, reason);
      const receipt = await tx.wait();

      return {
        success: true,
        batchId,
        reason,
        txHash: receipt.transactionHash,
        gasUsed: receipt.gasUsed.toString()
      };

    } catch (error) {
      console.error('❌ Reject batch failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get all pending batches (Lab Officer view)
   */
  async getPendingBatches() {
    try {
      const batchIds = await this.herbChainContract.getPendingBatches();
      
      const batches = await Promise.all(
        batchIds.map(id => this.getBatch(Number(id)))
      );

      return {
        success: true,
        batches: batches.filter(batch => batch.success).map(batch => batch.data)
      };

    } catch (error) {
      console.error('❌ Get pending batches failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // ==================== MANUFACTURER METHODS ====================

  /**
   * Process an approved batch (Manufacturer only)
   */
  async processBatch(batchId, qrCodeHash) {
    try {
      this.validateRole([USER_ROLES.MANUFACTURER, USER_ROLES.ADMIN]);

      if (!qrCodeHash || qrCodeHash.trim().length === 0) {
        throw new Error('QR code hash is required');
      }

      const tx = await this.herbChainContract.processBatch(batchId, qrCodeHash);
      const receipt = await tx.wait();

      return {
        success: true,
        batchId,
        qrCodeHash,
        txHash: receipt.transactionHash,
        gasUsed: receipt.gasUsed.toString()
      };

    } catch (error) {
      console.error('❌ Process batch failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get all approved batches (Manufacturer view)
   */
  async getApprovedBatches() {
    try {
      const batchIds = await this.herbChainContract.getApprovedBatches();
      
      const batches = await Promise.all(
        batchIds.map(id => this.getBatch(Number(id)))
      );

      return {
        success: true,
        batches: batches.filter(batch => batch.success).map(batch => batch.data)
      };

    } catch (error) {
      console.error('❌ Get approved batches failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // ==================== CONSUMER METHODS ====================

  /**
   * Get batch details by ID
   */
  async getBatch(batchId) {
    try {
      const batch = await this.herbChainContract.getBatch(batchId);
      
      return {
        success: true,
        data: this.formatBatchData(batch)
      };

    } catch (error) {
      console.error('❌ Get batch failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get batch details by QR code hash
   */
  async getBatchByQR(qrCodeHash) {
    try {
      const batch = await this.herbChainContract.getBatchByQR(qrCodeHash);
      
      return {
        success: true,
        data: this.formatBatchData(batch)
      };

    } catch (error) {
      console.error('❌ Get batch by QR failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get total number of batches
   */
  async getTotalBatches() {
    try {
      const total = await this.herbChainContract.getTotalBatches();
      
      return {
        success: true,
        total: Number(total)
      };

    } catch (error) {
      console.error('❌ Get total batches failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // ==================== ADMIN METHODS ====================

  /**
   * Grant farmer role to address (Admin only)
   */
  async grantFarmerRole(address) {
    try {
      this.validateRole([USER_ROLES.ADMIN]);

      const tx = await this.herbChainContract.grantFarmerRole(address);
      const receipt = await tx.wait();

      return {
        success: true,
        address,
        role: 'farmer',
        txHash: receipt.transactionHash
      };

    } catch (error) {
      console.error('❌ Grant farmer role failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Grant lab officer role to address (Admin only)
   */
  async grantLabRole(address) {
    try {
      this.validateRole([USER_ROLES.ADMIN]);

      const tx = await this.herbChainContract.grantLabRole(address);
      const receipt = await tx.wait();

      return {
        success: true,
        address,
        role: 'lab_officer',
        txHash: receipt.transactionHash
      };

    } catch (error) {
      console.error('❌ Grant lab role failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Grant manufacturer role to address (Admin only)
   */
  async grantManufacturerRole(address) {
    try {
      this.validateRole([USER_ROLES.ADMIN]);

      const tx = await this.herbChainContract.grantManufacturerRole(address);
      const receipt = await tx.wait();

      return {
        success: true,
        address,
        role: 'manufacturer',
        txHash: receipt.transactionHash
      };

    } catch (error) {
      console.error('❌ Grant manufacturer role failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // ==================== EVENT HANDLING ====================

  /**
   * Set up event listeners for real-time updates
   */
  setupEventListeners(callbacks = {}) {
    if (!this.herbChainContract) return;

    // Remove existing listeners
    this.removeAllListeners();

    // BatchCreated event
    if (callbacks.onBatchCreated) {
      this.herbChainContract.on('BatchCreated', (batchId, farmer, herbName, event) => {
        callbacks.onBatchCreated({
          batchId: Number(batchId),
          farmer,
          herbName,
          txHash: event.transactionHash,
          blockNumber: event.blockNumber
        });
      });
    }

    // BatchApproved event
    if (callbacks.onBatchApproved) {
      this.herbChainContract.on('BatchApproved', (batchId, labOfficer, timestamp, event) => {
        callbacks.onBatchApproved({
          batchId: Number(batchId),
          labOfficer,
          timestamp: Number(timestamp),
          txHash: event.transactionHash,
          blockNumber: event.blockNumber
        });
      });
    }

    // BatchRejected event
    if (callbacks.onBatchRejected) {
      this.herbChainContract.on('BatchRejected', (batchId, labOfficer, reason, timestamp, event) => {
        callbacks.onBatchRejected({
          batchId: Number(batchId),
          labOfficer,
          reason,
          timestamp: Number(timestamp),
          txHash: event.transactionHash,
          blockNumber: event.blockNumber
        });
      });
    }

    // BatchProcessed event
    if (callbacks.onBatchProcessed) {
      this.herbChainContract.on('BatchProcessed', (batchId, manufacturer, qrCodeHash, timestamp, event) => {
        callbacks.onBatchProcessed({
          batchId: Number(batchId),
          manufacturer,
          qrCodeHash,
          timestamp: Number(timestamp),
          txHash: event.transactionHash,
          blockNumber: event.blockNumber
        });
      });
    }
  }

  /**
   * Remove all event listeners
   */
  removeAllListeners() {
    if (this.herbChainContract) {
      this.herbChainContract.removeAllListeners();
    }
  }

  // ==================== UTILITY METHODS ====================

  /**
   * Format batch data for frontend consumption
   */
  formatBatchData(batch) {
    return {
      id: Number(batch.id),
      farmer: batch.farmer,
      herbName: batch.herbName,
      location: batch.location,
      moisturePercent: Number(batch.moisturePercent),
      photoIpfsHash: batch.photoIpfsHash,
      notes: batch.notes,
      status: BATCH_STATUS[batch.status],
      statusCode: Number(batch.status),
      rejectionReason: batch.rejectionReason,
      createdAt: new Date(Number(batch.createdAt) * 1000),
      approvedAt: batch.approvedAt > 0 ? new Date(Number(batch.approvedAt) * 1000) : null,
      processedAt: batch.processedAt > 0 ? new Date(Number(batch.processedAt) * 1000) : null,
      labOfficer: batch.labOfficer && batch.labOfficer !== '0x0000000000000000000000000000000000000000' ? batch.labOfficer : null,
      manufacturer: batch.manufacturer && batch.manufacturer !== '0x0000000000000000000000000000000000000000' ? batch.manufacturer : null,
      qrCodeHash: batch.qrCodeHash || null,
      
      // Legacy compatibility fields
      herb: batch.herbName,
      moisture: Number(batch.moisturePercent),
      photoIPFS: batch.photoIpfsHash,
      qrCodeIPFS: batch.qrCodeHash
    };
  }

  /**
   * Validate user role for restricted operations
   */
  validateRole(allowedRoles) {
    if (!allowedRoles.includes(this.currentRole)) {
      throw new Error(`Access denied. Required role: ${allowedRoles.join(' or ')}, current role: ${this.currentRole}`);
    }
  }

  /**
   * Validate batch data before creation
   */
  validateBatchData(batchData) {
    const required = ['herbName', 'location', 'moisturePercent', 'photoIpfsHash', 'notes'];
    
    for (const field of required) {
      if (!batchData[field]) {
        throw new Error(`${field} is required`);
      }
    }

    if (batchData.moisturePercent < 0 || batchData.moisturePercent > 100) {
      throw new Error('Moisture percent must be between 0 and 100');
    }
  }

  /**
   * Extract batch ID from transaction receipt
   */
  async extractBatchIdFromReceipt(receipt) {
    try {
      // Look for BatchCreated event in logs
      const batchCreatedLog = receipt.logs.find(log => {
        try {
          const parsed = this.herbChainContract.interface.parseLog(log);
          return parsed.name === 'BatchCreated';
        } catch {
          return false;
        }
      });

      if (batchCreatedLog) {
        const parsed = this.herbChainContract.interface.parseLog(batchCreatedLog);
        return Number(parsed.args.batchId);
      }

      // Fallback: get total batches (assumes this was the latest)
      const total = await this.herbChainContract.getTotalBatches();
      return Number(total);

    } catch (error) {
      console.warn('Could not extract batch ID from receipt:', error);
      return null;
    }
  }

  /**
   * Get account balance
   */
  async getAccountBalance(address = null) {
    try {
      const account = address || this.currentAccount;
      const balance = await this.provider.getBalance(account);
      
      return {
        success: true,
        balance: ethers.utils.formatEther(balance),
        wei: balance.toString()
      };

    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Disconnect from the service
   */
  disconnect() {
    this.removeAllListeners();
    this.provider = null;
    this.signer = null;
    this.herbChainContract = null;
    this.currentAccount = null;
    this.currentRole = null;
    this.isConnected = false;
  }

  // Legacy compatibility methods
  onBatchCreated(callback) {
    this.setupEventListeners({ onBatchCreated: callback });
  }

  onBatchApproved(callback) {
    this.setupEventListeners({ onBatchApproved: callback });
  }

  onBatchRejected(callback) {
    this.setupEventListeners({ onBatchRejected: callback });
  }

  onBatchProcessed(callback) {
    this.setupEventListeners({ onBatchProcessed: callback });
  }
}

export default new BlockchainService();