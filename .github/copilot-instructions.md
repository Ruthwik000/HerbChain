# HerbChain AI Coding Guidelines

## Project Overview

HerbChain is a dual-project blockchain traceability system for Ayurvedic herbs with a Solidity smart contract backend and React frontend. The system tracks herb batches through a 4-role supply chain: Farmers → Lab Officers → Manufacturers → Consumers.

## Architecture

### Dual-Project Structure

- **`herbchain-blockchain/`**: Hardhat/Solidity smart contracts with OpenZeppelin access control
- **`herbchain-frontend/`**: React 18 + Vite application with role-based dashboards

### Data Flow

```
Farmer → Creates Batch (Pending) → Lab Officer → Approves/Rejects → Manufacturer → Processes + QR Code → Consumer → Verifies
```

### Key Components

- **Smart Contract**: `HerbChain.sol` - manages batch lifecycle, roles, and IPFS integration
- **Frontend Services**: `blockchainService.js` (ethers.js integration), `dataService.js` (mock data), `ipfsService.js`
- **State Management**: React Context (`AuthContext`, `BlockchainContext`) + Zustand stores
- **UI Components**: Role-specific dashboards in `src/pages/`, reusable components in `src/components/`

## Critical Workflows

### Full Development Setup

```bash
# Terminal 1: Start local blockchain network
cd herbchain-blockchain && npm run node

# Terminal 2: Deploy contract with roles
cd herbchain-blockchain && npm run deploy:with-roles

# Terminal 3: Start frontend
cd herbchain-frontend && npm run dev
```

### Smart Contract Development

```bash
cd herbchain-blockchain
npm run compile                    # Compile contracts
npm run test                       # Run test suite
npm run deploy:localhost           # Deploy to local network
npm run deploy:sepolia             # Deploy to testnet
```

### Frontend Development

```bash
cd herbchain-frontend
npm run dev                        # Start dev server (Vite)
npm run build                      # Production build
npm run lint                       # ESLint check
npm run preview                    # Preview production build
```

## Project Conventions

### Batch ID Patterns

- Format: `{HERB_CODE}-{YEAR}-{SEQUENTIAL_ID}` (e.g., `ASH-2025-001`, `TUL-2025-002`)
- Used for consumer verification and batch tracking

### Status System & Colors

- **Pending** (Yellow `#EAB308`): Awaiting lab approval
- **Approved** (Green `#22C55E`): Ready for manufacturing
- **Rejected** (Red `#EF4444`): Failed quality check
- **Processed** (Orange `#F97316`): Complete with QR code

### Component Patterns

```jsx
// Standard component structure
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { IconName } from "lucide-react";

const ComponentName = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      // Data fetching logic
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="component-classes"
    >
      {/* Component JSX */}
    </motion.div>
  );
};
```

### Error Handling

```javascript
// Standard error handling pattern
try {
  const result = await blockchainService.someFunction();
  if (!result.success) {
    showError(result.error || "Operation failed");
    return;
  }
  showSuccess("Operation completed successfully");
} catch (error) {
  console.error("Blockchain error:", error);
  showError("Blockchain interaction failed");
}
```

## Integration Points

### Blockchain Connection

```javascript
// Always check connection before blockchain operations
const { isConnected, service, account } = useBlockchain();

if (!isConnected || !service) {
  showError("Please connect your wallet first");
  return;
}

// Use service for contract interactions
const result = await service.createBatch(batchData);
```

### IPFS Integration

```javascript
// Photo upload pattern
import ipfsService from "../services/ipfsService";

const uploadPhoto = async (file) => {
  try {
    const result = await ipfsService.uploadFile(file);
    return result.success ? result.hash : null;
  } catch (error) {
    console.error("IPFS upload failed:", error);
    return null;
  }
};
```

### Environment Configuration

```javascript
// Frontend environment variables (Vite)
VITE_HERBCHAIN_CONTRACT_ADDRESS=0x...
VITE_NETWORK_ID=1337
VITE_NETWORK_NAME=localhost

// Blockchain environment variables
PRIVATE_KEY=your_private_key
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/...
```

## Role-Based Development

### Adding New Features

1. **Smart Contract**: Update `HerbChain.sol` ABI and functions
2. **Service Layer**: Update `blockchainService.js` with new methods
3. **UI Components**: Create role-specific components in appropriate `pages/` directory
4. **State Management**: Update contexts if new global state is needed

### Testing Patterns

```javascript
// Smart contract testing
describe("Batch Creation", function () {
  it("Should create batch with correct parameters", async function () {
    const { herbChain, farmer } = await loadFixture(deployFixture);
    await expect(herbChain.connect(farmer).createBatch(...))
      .to.emit(herbChain, "BatchCreated");
  });
});

// Frontend testing (if implemented)
describe("BatchProcessingCard", () => {
  it("displays batch information correctly", () => {
    // Test component rendering and interactions
  });
});
```

## Common Pitfalls

### Blockchain Development

- Always check `hasRole()` before role-specific operations
- Handle transaction rejections gracefully
- Use proper gas limits for complex operations
- Test with multiple accounts for role-based features

### Frontend Development

- Check `isConnected` before blockchain operations
- Handle loading states for all async operations
- Use consistent error messaging via `useToast()`
- Follow responsive design patterns for mobile compatibility

### Deployment

- Deploy contract before running frontend
- Update contract address in frontend environment
- Test role assignments after deployment
- Verify IPFS connectivity for file uploads

## Key Files Reference

### Architecture Understanding

- `herbchain-blockchain/contracts/HerbChain.sol` - Core smart contract
- `herbchain-frontend/src/services/blockchainService.js` - Blockchain integration
- `herbchain-frontend/src/context/BlockchainContext.jsx` - Global blockchain state

### Development Workflow

- `herbchain-blockchain/package.json` - Blockchain scripts and dependencies
- `herbchain-frontend/package.json` - Frontend scripts and dependencies
- `herbchain-blockchain/hardhat.config.js` - Network configuration

### UI Patterns

- `herbchain-frontend/src/components/BatchProcessingCard.jsx` - Card component pattern
- `herbchain-frontend/src/pages/manufacturer/ManufacturerDashboard.jsx` - Dashboard pattern
- `herbchain-frontend/src/layouts/DashboardLayout.jsx` - Layout structure
