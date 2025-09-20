# MetaMask Setup for HerbChain

This guide helps you connect MetaMask to your deployed HerbChain contracts.

## 🦊 **MetaMask Network Configuration**

### Add Localhost Network to MetaMask

1. **Open MetaMask**
2. **Click Network Dropdown** (top center)
3. **Click "Add Network"**
4. **Fill in the details**:

```
Network Name: HerbChain Local
RPC URL: http://127.0.0.1:8545
Chain ID: 1337
Currency Symbol: ETH
Block Explorer URL: (leave empty)
```

5. **Click "Save"**

## 📍 **Your Contract Addresses**

```env
HERBCHAIN_CONTRACT=0x2279B7A0a67DB372996a5FaB50D91eAA73d2eBe6
IPFS_STORAGE_CONTRACT=0xa513E6E4b8f2a923D98304ec87F64353C4D5C853
ACCESS_CONTROL_CONTRACT=0x0165878A594ca255338adfa4d48449f69242Eb8F
NETWORK_ID=1337
NETWORK_NAME=localhost
```

## 🔐 **Import Test Accounts**

### Option 1: Generate New Test Accounts
Run the account generator:
```bash
npx hardhat run scripts/generate-accounts.js
```

### Option 2: Use Hardhat Default Accounts
These accounts come with 10,000 ETH each on localhost:

```
Account #0 (Admin/Deployer):
Address: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
Private Key: 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80

Account #1 (Farmer):
Address: 0x70997970C51812dc3A010C7d01b50e0d17dc79C8
Private Key: 0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d

Account #2 (Lab Officer):
Address: 0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC
Private Key: 0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a

Account #3 (Manufacturer):
Address: 0x90F79bf6EB2c4f870365E785982E1f101E93b906
Private Key: 0x7c852118294e51e653712a81e05800f419141751be58f605c371e15141b007a6
```

### Import Steps:
1. **Open MetaMask**
2. **Click Account Icon** → **Import Account**
3. **Select "Private Key"**
4. **Paste the private key** (with 0x prefix)
5. **Click "Import"**
6. **Repeat for each role**

## 🧪 **Test Your Setup**

### 1. Run Contract Tests
```bash
# Test with your deployed contracts
npx hardhat run scripts/test-deployed-contracts.js --network localhost
```

### 2. Check Contract in MetaMask
1. **Switch to HerbChain Local network**
2. **Go to "Assets" tab**
3. **Click "Import tokens"**
4. **Enter contract address**: `0x2279B7A0a67DB372996a5FaB50D91eAA73d2eBe6`

### 3. Verify Account Roles
The test script will automatically assign roles:
- **Account #0**: Admin (can grant roles)
- **Account #1**: Farmer (can create batches)
- **Account #2**: Lab Officer (can approve/reject batches)
- **Account #3**: Manufacturer (can process batches)

## 🔄 **Testing Workflow with MetaMask**

### Step 1: Create Batch (as Farmer)
1. **Switch to Farmer account** in MetaMask
2. **Use your frontend** or call contract directly
3. **Create a new herb batch**

### Step 2: Approve Batch (as Lab Officer)
1. **Switch to Lab Officer account**
2. **Approve the pending batch**

### Step 3: Process Batch (as Manufacturer)
1. **Switch to Manufacturer account**
2. **Process the approved batch**
3. **Generate QR code**

### Step 4: View Traceability (as Consumer)
1. **Switch to any account**
2. **Look up batch by ID or QR code**
3. **View complete traceability chain**

## 🚨 **Troubleshooting**

### "Nonce too high" Error
1. **Go to MetaMask Settings**
2. **Advanced → Reset Account**
3. **Confirm reset**

### "Network not found" Error
1. **Make sure Hardhat node is running**:
   ```bash
   npx hardhat node
   ```
2. **Check RPC URL**: `http://127.0.0.1:8545`

### "Contract not found" Error
1. **Verify contract address**
2. **Make sure you're on the right network**
3. **Redeploy if necessary**:
   ```bash
   npx hardhat run scripts/deploy-with-roles.js --network localhost
   ```

## 📱 **Frontend Integration**

Update your frontend `.env` file:

```env
VITE_HERBCHAIN_CONTRACT_ADDRESS=0x2279B7A0a67DB372996a5FaB50D91eAA73d2eBe6
VITE_IPFS_STORAGE_CONTRACT_ADDRESS=0xa513E6E4b8f2a923D98304ec87F64353C4D5C853
VITE_ACCESS_CONTROL_CONTRACT_ADDRESS=0x0165878A594ca255338adfa4d48449f69242Eb8F
VITE_NETWORK_ID=1337
VITE_NETWORK_NAME=localhost
VITE_RPC_URL=http://127.0.0.1:8545
```

## ✅ **Verification Checklist**

- [ ] MetaMask network added (Chain ID: 1337)
- [ ] Test accounts imported
- [ ] Accounts have ETH balance
- [ ] Contract addresses configured
- [ ] Roles assigned correctly
- [ ] Test workflow completed
- [ ] Frontend connected

## 🎉 **Ready to Go!**

Your HerbChain contracts are now ready for MetaMask testing. You can:

1. **Create herb batches** as a farmer
2. **Approve/reject batches** as a lab officer  
3. **Process batches** as a manufacturer
4. **Trace herb journey** as a consumer

All transactions will be signed with MetaMask and recorded on your local blockchain!