const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("TestFaucet", function () {
  let faucet;
  let owner;
  let user1;
  let user2;

  beforeEach(async function () {
    // Get test accounts
    [owner, user1, user2] = await ethers.getSigners();

    // Deploy the contract
    const TestFaucet = await ethers.getContractFactory("TestFaucet");
    faucet = await TestFaucet.deploy();
    await faucet.waitForDeployment();

    // Fund the faucet with 5 ETH
    await owner.sendTransaction({
      to: await faucet.getAddress(),
      value: ethers.parseEther("5.0")
    });
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await faucet.owner()).to.equal(owner.address);
    });

    it("Should have the correct faucet amount", async function () {
      expect(await faucet.FAUCET_AMOUNT()).to.equal(ethers.parseEther("0.1"));
    });

    it("Should receive funding", async function () {
      const balance = await faucet.getBalance();
      expect(balance).to.equal(ethers.parseEther("5.0"));
    });
  });

  describe("Request ETH", function () {
    it("Should allow users to request ETH", async function () {
      const initialBalance = await ethers.provider.getBalance(user1.address);
      
      // Request ETH from faucet
      const tx = await faucet.connect(user1).requestETH();
      const receipt = await tx.wait();
      
      // Calculate gas cost
      const gasUsed = receipt.gasUsed * receipt.gasPrice;
      const finalBalance = await ethers.provider.getBalance(user1.address);
      
      // Should receive 0.1 ETH minus gas costs
      const expectedBalance = initialBalance + ethers.parseEther("0.1") - gasUsed;
      expect(finalBalance).to.equal(expectedBalance);
    });

    it("Should prevent requests within cooldown period", async function () {
      // First request should succeed
      await faucet.connect(user1).requestETH();
      
      // Second request should fail
      await expect(faucet.connect(user1).requestETH())
        .to.be.revertedWith("Must wait 24 hours between requests");
    });

    it("Should fail when faucet is empty", async function () {
      // Drain the faucet
      await faucet.connect(owner).emergencyWithdraw();
      
      // Request should fail
      await expect(faucet.connect(user1).requestETH())
        .to.be.revertedWith("Faucet is empty");
    });

    it("Should emit FaucetRequested event", async function () {
      await expect(faucet.connect(user1).requestETH())
        .to.emit(faucet, "FaucetRequested")
        .withArgs(user1.address, ethers.parseEther("0.1"));
    });
  });

  describe("Funding", function () {
    it("Should allow funding via fundFaucet function", async function () {
      const initialBalance = await faucet.getBalance();
      
      await faucet.connect(user1).fundFaucet({ value: ethers.parseEther("1.0") });
      
      const finalBalance = await faucet.getBalance();
      expect(finalBalance).to.equal(initialBalance + ethers.parseEther("1.0"));
    });

    it("Should emit FaucetFunded event", async function () {
      await expect(faucet.connect(user1).fundFaucet({ value: ethers.parseEther("1.0") }))
        .to.emit(faucet, "FaucetFunded")
        .withArgs(user1.address, ethers.parseEther("1.0"));
    });
  });

  describe("Emergency withdraw", function () {
    it("Should allow owner to withdraw", async function () {
      const initialOwnerBalance = await ethers.provider.getBalance(owner.address);
      const faucetBalance = await faucet.getBalance();
      
      const tx = await faucet.connect(owner).emergencyWithdraw();
      const receipt = await tx.wait();
      const gasUsed = receipt.gasUsed * receipt.gasPrice;
      
      const finalOwnerBalance = await ethers.provider.getBalance(owner.address);
      expect(finalOwnerBalance).to.equal(initialOwnerBalance + faucetBalance - gasUsed);
    });

    it("Should prevent non-owner from withdrawing", async function () {
      await expect(faucet.connect(user1).emergencyWithdraw())
        .to.be.revertedWith("Only owner can withdraw");
    });
  });

  describe("Utility functions", function () {
    it("Should correctly report if user can request", async function () {
      // Initially should be able to request
      expect(await faucet.canRequest(user1.address)).to.be.true;
      
      // After requesting, should not be able to request
      await faucet.connect(user1).requestETH();
      expect(await faucet.canRequest(user1.address)).to.be.false;
    });
  });
});