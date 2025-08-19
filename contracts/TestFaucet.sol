// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title TestFaucet
 * @dev A simple faucet contract for testing purposes on local/testnet
 * This contract allows users to request small amounts of ETH for testing
 * NOTE: This is optional - the wallet works without any custom contracts
 */
contract TestFaucet {
    // Amount to give per request (0.1 ETH)
    uint256 public constant FAUCET_AMOUNT = 0.1 ether;
    
    // Cooldown period between requests (24 hours)
    uint256 public constant COOLDOWN_TIME = 24 hours;
    
    // Track last request time for each address
    mapping(address => uint256) public lastRequestTime;
    
    // Owner of the contract
    address public owner;
    
    event FaucetRequested(address indexed requester, uint256 amount);
    event FaucetFunded(address indexed funder, uint256 amount);
    
    constructor() {
        owner = msg.sender;
    }
    
    /**
     * @dev Request ETH from the faucet
     * Can only be called once per 24 hours per address
     */
    function requestETH() external {
        require(
            block.timestamp >= lastRequestTime[msg.sender] + COOLDOWN_TIME,
            "Must wait 24 hours between requests"
        );
        require(
            address(this).balance >= FAUCET_AMOUNT,
            "Faucet is empty"
        );
        
        lastRequestTime[msg.sender] = block.timestamp;
        
        // Send ETH to requester
        (bool success, ) = payable(msg.sender).call{value: FAUCET_AMOUNT}("");
        require(success, "Transfer failed");
        
        emit FaucetRequested(msg.sender, FAUCET_AMOUNT);
    }
    
    /**
     * @dev Fund the faucet with ETH
     * Anyone can fund the faucet
     */
    function fundFaucet() external payable {
        require(msg.value > 0, "Must send some ETH");
        emit FaucetFunded(msg.sender, msg.value);
    }
    
    /**
     * @dev Get the contract's ETH balance
     */
    function getBalance() external view returns (uint256) {
        return address(this).balance;
    }
    
    /**
     * @dev Check if an address can request ETH
     */
    function canRequest(address user) external view returns (bool) {
        return block.timestamp >= lastRequestTime[user] + COOLDOWN_TIME;
    }
    
    /**
     * @dev Emergency withdraw - only owner
     */
    function emergencyWithdraw() external {
        require(msg.sender == owner, "Only owner can withdraw");
        payable(owner).transfer(address(this).balance);
    }
    
    // Allow contract to receive ETH
    receive() external payable {
        emit FaucetFunded(msg.sender, msg.value);
    }
}