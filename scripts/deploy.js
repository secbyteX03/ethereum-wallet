const hre = require("hardhat");

async function main() {
  console.log("🚀 Starting deployment...");
  
  // Get the deployer account
  const [deployer] = await hre.ethers.getSigners();
  console.log("📝 Deploying contracts with account:", deployer.address);
  
  // Check deployer balance
  const balance = await deployer.provider.getBalance(deployer.address);
  console.log("💰 Account balance:", hre.ethers.formatEther(balance), "ETH");
  
  // Deploy TestFaucet contract
  console.log("\n📦 Deploying TestFaucet...");
  const TestFaucet = await hre.ethers.getContractFactory("TestFaucet");
  const faucet = await TestFaucet.deploy();
  
  await faucet.waitForDeployment();
  const faucetAddress = await faucet.getAddress();
  
  console.log("✅ TestFaucet deployed to:", faucetAddress);
  
  // Fund the faucet with some ETH if on local network
  const network = await hre.ethers.provider.getNetwork();
  console.log("🌐 Network:", network.name, "Chain ID:", network.chainId.toString());
  
  if (network.chainId === 31337n) { // Local Hardhat network
    console.log("\n💰 Funding faucet with 5 ETH...");
    const fundTx = await deployer.sendTransaction({
      to: faucetAddress,
      value: hre.ethers.parseEther("5.0")
    });
    await fundTx.wait();
    console.log("✅ Faucet funded!");
  }
  
  // Verify contract on Etherscan (only on testnets/mainnet)
  if (network.chainId !== 31337n && process.env.ETHERSCAN_API_KEY) {
    console.log("\n🔍 Waiting before verification...");
    await new Promise(resolve => setTimeout(resolve, 10000)); // Wait 10 seconds
    
    try {
      await hre.run("verify:verify", {
        address: faucetAddress,
        constructorArguments: [],
      });
      console.log("✅ Contract verified on Etherscan");
    } catch (error) {
      console.log("⚠️ Verification failed:", error.message);
    }
  }
  
  console.log("\n🎉 Deployment complete!");
  console.log("📋 Contract addresses:");
  console.log("   TestFaucet:", faucetAddress);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });