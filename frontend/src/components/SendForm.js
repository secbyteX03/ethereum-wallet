import React, { useState } from 'react';
import { ethers } from 'ethers';

/**
 * SendForm Component
 * Allows users to send ETH to other addresses
 */
const SendForm = ({ signer, provider, onTransactionComplete, currentNetwork }) => {
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [txStatus, setTxStatus] = useState(null); // null, 'pending', 'success', 'error'
  const [txHash, setTxHash] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  /**
   * Validate Ethereum address
   */
  const isValidAddress = (address) => {
    try {
      return ethers.isAddress(address);
    } catch {
      return false;
    }
  };

  /**
   * Get Etherscan URL based on network
   */
  const getEtherscanUrl = (txHash) => {
    if (!currentNetwork) return '#';
    
    const chainId = Number(currentNetwork.chainId);
    
    switch (chainId) {
      case 1: // Mainnet
        return `https://etherscan.io/tx/${txHash}`;
      case 11155111: // Sepolia
        return `https://sepolia.etherscan.io/tx/${txHash}`;
      case 5: // Goerli (deprecated but might be used)
        return `https://goerli.etherscan.io/tx/${txHash}`;
      default:
        return '#';
    }
  };

  /**
   * Estimate gas for the transaction
   */
  const estimateGas = async (to, value) => {
    try {
      const gasLimit = await provider.estimateGas({
        to: to,
        value: value
      });
      
      const feeData = await provider.getFeeData();
      const gasPrice = feeData.gasPrice;
      
      const estimatedCost = gasLimit * gasPrice;
      return ethers.formatEther(estimatedCost);
    } catch (error) {console.error('Gas estimation error:', error);
        return '0.001'; // Fallback estimate
      }
    };
   
    /**
     * Handle form submission to send ETH
     */
    const handleSend = async (e) => {
      e.preventDefault();
      
      // Reset previous status
      setTxStatus(null);
      setTxHash('');
      setErrorMessage('');
   
      // Validation
      if (!recipient.trim()) {
        setErrorMessage('Please enter a recipient address');
        return;
      }
   
      if (!isValidAddress(recipient)) {
        setErrorMessage('Please enter a valid Ethereum address');
        return;
      }
   
      if (!amount || parseFloat(amount) <= 0) {
        setErrorMessage('Please enter a valid amount');
        return;
      }
   
      try {
        setIsLoading(true);
        
        // Check if user has sufficient balance
        const senderAddress = await signer.getAddress();
        const balance = await provider.getBalance(senderAddress);
        const amountInWei = ethers.parseEther(amount);
        
        // Estimate gas cost
        const estimatedGasCost = await estimateGas(recipient, amountInWei);
        const totalCost = parseFloat(amount) + parseFloat(estimatedGasCost);
        
        if (balance < amountInWei) {
          throw new Error(`Insufficient balance. You need ${amount} ETH but only have ${ethers.formatEther(balance)} ETH`);
        }
   
        if (ethers.formatEther(balance) < totalCost.toString()) {
          throw new Error(`Insufficient balance for gas fees. Estimated total cost: ${totalCost.toFixed(6)} ETH`);
        }
   
        // Create and send transaction
        console.log(`💸 Sending ${amount} ETH to ${recipient}...`);
        
        const transaction = {
          to: recipient,
          value: amountInWei,
        };
   
        const tx = await signer.sendTransaction(transaction);
        setTxHash(tx.hash);
        setTxStatus('pending');
   
        console.log('📝 Transaction sent:', tx.hash);
   
        // Wait for transaction to be mined
        const receipt = await tx.wait();
        
        if (receipt.status === 1) {
          setTxStatus('success');
          console.log('✅ Transaction confirmed:', receipt);
          
          // Refresh balance after successful transaction
          setTimeout(() => {
            onTransactionComplete();
          }, 1000);
   
          // Clear form
          setRecipient('');
          setAmount('');
        } else {
          throw new Error('Transaction failed');
        }
   
      } catch (error) {
        console.error('❌ Transaction error:', error);
        setTxStatus('error');
        
        // Handle different error types
        if (error.code === 4001) {
          setErrorMessage('Transaction cancelled by user');
        } else if (error.code === -32603) {
          setErrorMessage('Transaction failed - insufficient funds for gas');
        } else if (error.message.includes('insufficient funds')) {
          setErrorMessage('Insufficient funds for this transaction');
        } else {
          setErrorMessage(error.message || 'Transaction failed');
        }
      } finally {
        setIsLoading(false);
      }
    };
   
    return (
      <div className="send-container">
        <div className="send-card">
          <h3>📤 Send ETH</h3>
          
          <form onSubmit={handleSend}>
            <div className="form-group">
              <label htmlFor="recipient">Recipient Address:</label>
              <input
                type="text"
                id="recipient"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                placeholder="0x1234567890123456789012345678901234567890"
                disabled={isLoading}
                className={!recipient ? '' : isValidAddress(recipient) ? 'valid' : 'invalid'}
              />
              {recipient && !isValidAddress(recipient) && (
                <span className="validation-error">Invalid Ethereum address</span>
              )}
            </div>
   
            <div className="form-group">
              <label htmlFor="amount">Amount (ETH):</label>
              <input
                type="number"
                id="amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.1"
                step="0.000001"
                min="0"
                disabled={isLoading}
              />
              <div className="amount-helpers">
                <button 
                  type="button" 
                  onClick={() => setAmount('0.01')}
                  disabled={isLoading}
                  className="amount-preset"
                >
                  0.01 ETH
                </button>
                <button 
                  type="button" 
                  onClick={() => setAmount('0.1')}
                  disabled={isLoading}
                  className="amount-preset"
                >
                  0.1 ETH
                </button>
              </div>
            </div>
   
            <button 
              type="submit" 
              disabled={isLoading || !recipient || !amount || !isValidAddress(recipient)}
              className="send-button"
            >
              {isLoading ? (
                <>
                  <span className="loading-spinner"></span>
                  Sending...
                </>
              ) : (
                'Send ETH'
              )}
            </button>
          </form>
   
          {/* Transaction Status */}
          {txStatus && (
            <div className={`tx-status ${txStatus}`}>
              {txStatus === 'pending' && (
                <div>
                  <p>⏳ Transaction pending...</p>
                  <p>Hash: <code>{txHash}</code></p>
                  {currentNetwork && Number(currentNetwork.chainId) !== 31337 && (
                    <a 
                      href={getEtherscanUrl(txHash)} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="etherscan-link"
                    >
                      View on Etherscan →
                    </a>
                  )}
                </div>
              )}
              
              {txStatus === 'success' && (
                <div>
                  <p>✅ Transaction successful!</p>
                  <p>Hash: <code>{txHash}</code></p>
                  {currentNetwork && Number(currentNetwork.chainId) !== 31337 && (
                    <a 
                      href={getEtherscanUrl(txHash)} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="etherscan-link"
                    >
                      View on Etherscan →
                    </a>
                  )}
                </div>
              )}
              
              {txStatus === 'error' && (
                <div>
                  <p>❌ Transaction failed</p>
                  <p>{errorMessage}</p>
                </div>
              )}
            </div>
          )}
   
          {/* Security Warning */}
          <div className="security-warning">
            <p>🔐 <strong>Security Reminder:</strong></p>
            <ul>
              <li>Always double-check the recipient address</li>
              <li>Start with small amounts when testing</li>
              <li>Transactions on blockchain are irreversible</li>
              <li>Never send to smart contract addresses unless intended</li>
            </ul>
          </div>
        </div>
      </div>
    );
   };
   
   export default SendForm;