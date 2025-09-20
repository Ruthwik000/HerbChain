# HerbChain Deployment Guide

This guide covers deploying the HerbChain smart contract to different Ethereum networks.

## 🚀 Quick Deployment

### Local Development (Hardhat Network)
```bash
# Deploy to local hardhat network
npx hardhat run scripts/deploy.js --network hardhat
```

### Ethereum Sepolia Testnet
```bash
# Deploy to Sepolia testnet
npm run deploy:sepolia
```

### Ethereum Mainnet
```bash
# Deploy to Ethereum mainnet
npm run deploy:mainnet
```

## 📋 Pre-Deployment Checklist

### 1. Environment Setup
Create a `.env` file from the example:
```bash
cp .env.example .env
```

Edit `.env` with your configuration:
```env
# Private key for deployment (without 0x prefix)
PRIVATE_KEY=your_private_key_here

# RPC URLs for different networks
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_INFURA_KEY
MAINNET_RPC_URL=https://mainnet.infura.io/v3/YOUR_INFURA_KEY

# API keys for contract verification
ETHERSCAN_API_KEY=your_etherscan_api_key

# Gas reporting
REPORT_GAS=true
```

### 2. Wallet Setup
- Ensure your wallet has sufficient ETH for deployment
- **Sepolia**: Get test ETH from [Sepolia Faucet](https://sepoliafaucet.com/)
- **Mainnet**: Ensure you have real ETH for gas fees

### 3. Gas Estimation
Current deployment costs:
- **Contract Deployment**: ~2.2M gas (~$50-200 depending on gas price)
- **Role Setup**: ~50K gas per role (~$5-20 per role)

## 🌐 Network-Specific Deployment

### Sepolia Testnet Deployment

1. **Get Sepolia ETH**:
   - Visit [Sepolia Faucet](https://sepoliafaucet.com/)
   - Request test ETH for your deployer address

2. **Configure RPC**:
   ```env
   SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_INFURA_KEY
   ```

3. **Deploy**:
   ```bash
   npm run deploy:sepolia
   ```

4. **Verify Contract** (optional):
   ```bash
   npx hardhat verify --network sepolia CONTRACT_ADDRESS
   ```

### Mainnet Deployment

⚠️ **WARNING**: Mainnet deployment uses real ETH. Double-check everything!

1. **Final Testing**:
   - Ensure all tests pass: `npm run test`
   - Deploy and test on Sepolia first

2. **Security Review**:
   - Review contract code one final time
   - Ensure private key security

3. **Deploy**:
   ```bash
   npm run deploy:mainnet
   ```

4. **Verify Contract**:
   ```bash
   npx hardhat verify --network mainnet CONTRACT_ADDRESS
   ```

## 🔧 Post-Deployment Setup

### 1. Role Assignment
After deployment, assign roles to users:

```bash
# Set contract address
export CONTRACT_ADDRESS="0xYourContractAddress"

# Run role setup script
npx hardhat run scripts/setup-roles.js --network NETWORK_NAME
```

Or assign roles manually:
```javascript
// Grant farmer role
await herbChain.grantFarmerRole("0xFarmerAddress");

// Grant lab officer role
await herbChain.grantLabRole("0xLabOfficerAddress");

// Grant manufacturer role
await herbChain.grantManufacturerRole("0xManufacturerAddress");
```

### 2. Frontend Integration
Update your frontend with the deployed contract address:

```javascript
// In your frontend configuration
const CONTRACT_ADDRESS = "0xYourDeployedContractAddress";
const NETWORK_ID = 1; // 1 for mainnet, 11155111 for Sepolia
```

### 3. Contract Verification
Verify your contract on Etherscan for transparency:

```bash
npx hardhat verify --network NETWORK_NAME CONTRACT_ADDRESS
```

## 📊 Deployment Costs

### Gas Usage Estimates

| Network | Deployment Cost | Role Setup (per role) |
|---------|----------------|------------------------|
| **Sepolia** | ~2.2M gas (Free with faucet) | ~50K gas (Free) |
| **Mainnet** | ~2.2M gas ($50-200) | ~50K gas ($5-20) |

*Costs vary based on network congestion and gas prices*

### Cost Optimization Tips

1. **Deploy during low gas periods** (weekends, off-peak hours)
2. **Use gas price trackers** like [ETH Gas Station](https://ethgasstation.info/)
3. **Consider Layer 2 solutions** for lower costs (though not covered in this guide)

## 🔍 Verification & Testing

### Contract Verification
After deployment, verify the contract is working:

```bash
# Run interaction test
export CONTRACT_ADDRESS="0xYourContractAddress"
npx hardhat run scripts/simple-test.js --network NETWORK_NAME
```

### Frontend Testing
1. Update frontend with new contract address
2. Test all user flows:
   - Farmer: Create batches
   - Lab Officer: Approve/reject batches
   - Manufacturer: Process batches
   - Consumer: View traceability

## 🚨 Troubleshooting

### Common Issues

1. **"Insufficient funds"**:
   - Ensure wallet has enough ETH for gas
   - Check gas price settings

2. **"Transaction underpriced"**:
   - Increase gas price in hardhat.config.js
   - Wait for network congestion to decrease

3. **"Contract creation code storage out of gas"**:
   - The contract is too large
   - Already optimized with viaIR compilation

4. **"Nonce too high"**:
   - Reset MetaMask account or wait for nonce sync

### Getting Help

1. **Check transaction on Etherscan** using the transaction hash
2. **Review Hardhat logs** for detailed error messages
3. **Test on Sepolia first** before mainnet deployment

## 📝 Deployment Checklist

- [ ] Environment variables configured
- [ ] Wallet funded with sufficient ETH
- [ ] Contract compiled successfully (`npm run compile`)
- [ ] All tests passing (`npm run test`)
- [ ] Network configuration verified
- [ ] Gas price acceptable
- [ ] Backup of private key secured
- [ ] Contract deployed successfully
- [ ] Contract verified on Etherscan
- [ ] Roles assigned to appropriate addresses
- [ ] Frontend updated with contract address
- [ ] End-to-end testing completed

## 🎉 Success!

Once deployed, your HerbChain contract will be live on the Ethereum blockchain, providing immutable herb traceability for your supply chain!

**Next Steps**:
1. Integrate with your React frontend
2. Set up IPFS for photo/QR code storage
3. Train users on the new system
4. Monitor contract usage and gas costs

---

*For technical support, refer to the main README.md or create an issue in the repository.*