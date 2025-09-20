const { ethers } = require("hardhat");

async function main() {
  console.log("🔐 Generating test accounts for HerbChain...\n");

  // Generate 4 random accounts
  const roles = ["Admin/Deployer", "Farmer", "Lab Officer", "Manufacturer"];
  const accounts = [];

  for (let i = 0; i < 4; i++) {
    const wallet = ethers.Wallet.createRandom();
    accounts.push({
      role: roles[i],
      address: wallet.address,
      privateKey: wallet.privateKey.slice(2) // Remove 0x prefix
    });
  }

  console.log("📋 Generated Accounts:");
  console.log("=" .repeat(80));
  
  accounts.forEach((account, index) => {
    console.log(`${index + 1}. ${account.role}`);
    console.log(`   Address:     ${account.address}`);
    console.log(`   Private Key: ${account.privateKey}`);
    console.log("");
  });

  console.log("🔧 .env Configuration:");
  console.log("=" .repeat(80));
  console.log(`PRIVATE_KEY=${accounts[0].privateKey}`);
  console.log(`FARMER_PRIVATE_KEY=${accounts[1].privateKey}`);
  console.log(`LAB_PRIVATE_KEY=${accounts[2].privateKey}`);
  console.log(`MANUFACTURER_PRIVATE_KEY=${accounts[3].privateKey}`);
  console.log("");

  console.log("🦊 MetaMask Import Instructions:");
  console.log("=" .repeat(80));
  console.log("1. Open MetaMask");
  console.log("2. Click 'Import Account'");
  console.log("3. Select 'Private Key'");
  console.log("4. Paste the private key (with 0x prefix):");
  console.log("");
  
  accounts.forEach((account, index) => {
    console.log(`   ${account.role}: 0x${account.privateKey}`);
  });

  console.log("");
  console.log("⚠️  SECURITY WARNING:");
  console.log("- These are test accounts only");
  console.log("- Never use these for real funds");
  console.log("- Keep private keys secure");
  console.log("- Add .env to .gitignore");

  console.log("");
  console.log("💰 Getting Test ETH:");
  console.log("- For Sepolia: https://sepoliafaucet.com/");
  console.log("- For local testing: Accounts will have ETH automatically");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });