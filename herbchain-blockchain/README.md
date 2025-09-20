# HerbChain Blockchain Smart Contract

A comprehensive blockchain-based herb traceability system built with Solidity, featuring role-based access control and IPFS integration for photos and QR codes.

## 🌿 Overview

HerbChain enables complete traceability of herbs from farm to consumer through a decentralized blockchain system. The smart contract manages the entire supply chain with four distinct roles:

- **Farmers**: Create batches with herb details and photos
- **Lab Officers**: Approve or reject batches based on quality standards
- **Manufacturers**: Process approved batches and generate QR codes
- **Consumers**: Trace herb journey via batch ID or QR code scanning

## 🏗️ Architecture

### Smart Contract Structure

```
HerbChain.sol
├── Role Management (OpenZeppelin AccessControl)
├── Batch Data Structure
├── Core Functions (Create, Approve, Reject, Process)
├── Consumer Functions (Read-only access)
└── Events (Real-time updates)
```

### Data Flow

```
Farmer → Creates Batch → Status: Pending
    ↓
Lab Officer → Approves/Rejects → Status: Approved/Rejected
    ↓
Manufacturer → Processes → Status: Processed + QR Code
    ↓
Consumer → Scans QR → Views Complete Traceability
```

## 🚀 Quick Start

### Prerequisites

- Node.js (v16+)
- npm or yarn
- Hardhat development environment

### Installation

```bash
# Navigate to blockchain directory
cd herbchain-blockchain

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env
# Edit .env with your configuration
```

### Compilation

```bash
# Compile smart contracts
npm run compile
```

### Testing

```bash
# Run comprehensive test suite
npm run test
```

### Deployment

```bash
# Deploy to local network
npm run node          # In one terminal
npm run deploy:localhost  # In another terminal

# Deploy to Sepolia testnet
npm run deploy:sepolia

# Deploy to Ethereum mainnet
npm run deploy:mainnet
```

## 📋 Smart Contract Functions

### Farmer Functions

#### `createBatch(herbName, location, moisturePercent, photoIpfsHash, notes)`
Creates a new herb batch with complete details.

**Parameters:**
- `herbName`: Name of the herb (e.g., "Basil", "Mint")
- `location`: Growing location
- `moisturePercent`: Moisture content (0-100)
- `photoIpfsHash`: IPFS hash of herb photo
- `notes`: Additional notes

**Events:** `BatchCreated(batchId, farmer, herbName)`

### Lab Officer Functions

#### `approveBatch(batchId)`
Approves a pending batch for processing.

**Events:** `BatchApproved(batchId, labOfficer, timestamp)`

#### `rejectBatch(batchId, reason)`
Rejects a batch with specified reason.

**Events:** `BatchRejected(batchId, labOfficer, reason, timestamp)`

### Manufacturer Functions

#### `processBatch(batchId, qrCodeHash)`
Marks approved batch as processed and stores QR code.

**Events:** `BatchProcessed(batchId, manufacturer, qrCodeHash, timestamp)`

### Consumer Functions

#### `getBatch(batchId)`
Retrieves complete batch information.

#### `getBatchByQR(qrCodeHash)`
Gets batch details using QR code hash.

#### `getFarmerBatches(farmerAddress)`
Lists all batches from specific farmer.

#### `getPendingBatches()`
Returns all pending batches (for lab officers).

#### `getApprovedBatches()`
Returns all approved batches (for manufacturers).

## 🔐 Role Management

### Admin Functions

```solidity
// Grant roles (only admin)
grantFarmerRole(address farmer)
grantLabRole(address labOfficer)
grantManufacturerRole(address manufacturer)
```

### Role Verification

```solidity
// Check roles
hasRole(FARMER_ROLE, address)
hasRole(LAB_ROLE, address)
hasRole(MANUFACTURER_ROLE, address)
```

## 📊 Data Structures

### Batch Structure

```solidity
struct Batch {
    uint256 id;                 // Unique batch identifier
    address farmer;             // Farmer's address
    string herbName;            // Name of the herb
    string location;            // Growing location
    uint256 moisturePercent;    // Moisture content
    string photoIpfsHash;       // IPFS hash of photo
    string notes;               // Additional notes
    BatchStatus status;         // Current status
    string rejectionReason;     // Reason if rejected
    uint256 createdAt;          // Creation timestamp
    uint256 approvedAt;         // Approval timestamp
    uint256 processedAt;        // Processing timestamp
    address labOfficer;         // Approving lab officer
    address manufacturer;       // Processing manufacturer
    string qrCodeHash;          // QR code IPFS hash
}
```

### Batch Status

```solidity
enum BatchStatus {
    Pending,    // 0 - Awaiting lab approval
    Approved,   // 1 - Approved by lab
    Rejected,   // 2 - Rejected by lab
    Processed   // 3 - Processed by manufacturer
}
```

## 🎯 Events

All state changes emit events for real-time frontend updates:

```solidity
event BatchCreated(uint256 indexed batchId, address indexed farmer, string herbName);
event BatchApproved(uint256 indexed batchId, address indexed labOfficer, uint256 timestamp);
event BatchRejected(uint256 indexed batchId, address indexed labOfficer, string reason, uint256 timestamp);
event BatchProcessed(uint256 indexed batchId, address indexed manufacturer, string qrCodeHash, uint256 timestamp);
```

## 🔗 IPFS Integration

### Photo Storage
- Farmers upload herb photos to IPFS
- Only IPFS hash stored on-chain (gas efficient)
- Frontend retrieves images using hash

### QR Code Storage
- Manufacturers generate QR codes
- QR codes uploaded to IPFS
- Hash stored on-chain for consumer lookup

## 🌐 Network Configuration

### Supported Networks

- **Local Development**: Hardhat Network (Chain ID: 1337)
- **Sepolia Testnet**: Ethereum Testnet (Chain ID: 11155111)
- **Ethereum Mainnet**: Production (Chain ID: 1)

### Gas Optimization

- OpenZeppelin contracts for security
- Optimized storage patterns
- Efficient array operations
- ReentrancyGuard protection

## 🧪 Testing

Comprehensive test suite covering:

- Role management and access control
- Batch creation and validation
- Approval/rejection workflows
- Manufacturing and QR code generation
- Consumer traceability functions
- Error handling and edge cases

```bash
# Run tests with coverage
npm run test

# Run specific test file
npx hardhat test test/HerbChain.test.js
```

## 🔧 Frontend Integration

### Web3 Connection

```javascript
import { ethers } from 'ethers';

// Connect to contract
const provider = new ethers.providers.Web3Provider(window.ethereum);
const signer = provider.getSigner();
const contract = new ethers.Contract(contractAddress, abi, signer);

// Listen to events
contract.on("BatchCreated", (batchId, farmer, herbName) => {
    console.log(`New batch created: ${herbName} by ${farmer}`);
});
```

### Example Usage

```javascript
// Create batch (Farmer)
await contract.createBatch(
    "Organic Basil",
    "Farm Location A",
    15,
    "QmPhotoHash123",
    "Premium quality basil"
);

// Approve batch (Lab Officer)
await contract.approveBatch(1);

// Process batch (Manufacturer)
await contract.processBatch(1, "QmQRCodeHash456");

// Get batch info (Consumer)
const batch = await contract.getBatch(1);
```

## 📈 Gas Estimates

| Function | Estimated Gas |
|----------|---------------|
| createBatch | ~150,000 |
| approveBatch | ~50,000 |
| rejectBatch | ~60,000 |
| processBatch | ~80,000 |
| getBatch | ~30,000 (view) |

## 🛡️ Security Features

- **Access Control**: Role-based permissions
- **Reentrancy Protection**: ReentrancyGuard
- **Input Validation**: Comprehensive checks
- **Event Logging**: Complete audit trail
- **Immutable Records**: Blockchain permanence

## 📁 Project Structure

```
herbchain-blockchain/
├── contracts/
│   └── HerbChain.sol          # Main smart contract
├── scripts/
│   └── deploy.js              # Deployment script
├── test/
│   └── HerbChain.test.js      # Comprehensive tests
├── examples/
│   └── frontend-integration.js # Frontend integration guide
├── hardhat.config.js          # Hardhat configuration
├── package.json               # Dependencies and scripts
├── .env.example               # Environment variables template
└── README.md                  # This file
```

## 📝 License

MIT License - see LICENSE file for details.

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Add comprehensive tests
4. Submit pull request

## 📞 Support

For technical support or questions:
- Create an issue in the repository
- Review the test files for usage examples
- Check the deployment scripts for configuration

---

Built with ❤️ for transparent herb traceability