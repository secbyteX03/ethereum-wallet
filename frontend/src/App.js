import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import ConnectButton from './components/ConnectButton';
import BalanceDisplay from './components/BalanceDisplay';
import SendForm from './components/SendForm';
import ReceiveSection from './components/ReceiveSection';
import './App.css';

function App() {
  // State management
  const [account, setAccount] = useState(null);
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [balance, setBalance] = useState('0');
  const [network, setNetwork] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);

  // Initialize provider and check if already connected
  useEffect(() => {
    initializeProvider();
    checkIfWalletIsConnected();
  }, []);

  /**
   * Initialize ethers provider using MetaMask
   */
  const initializeProvider = async () => {
    if (window.ethereum) {
      try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        setProvider(provider);
        
        // Get network info
        const network = await provider.getNetwork();
        setNetwork(network);
        
        // Listen for account changes
        window.ethereum.on('accountsChanged', handleAccountsChanged);
        window.ethereum.on('chainChanged', handleChainChanged);
        
      } catch (error) {
        console.error('Error initializing provider:', error);
      }
    }
  };

  /**
   * Check if wallet is already connected
   */
  const checkIfWalletIsConnected = async () => {
    if (window.ethereum) {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        if (accounts.length > 0) {
          connectWallet(false); // Connect without requesting permission
        }
      } catch (error) {
        console.error('Error checking wallet connection:', error);
      }
    }
  };

  /**
   * Connect to MetaMask wallet
   * @param {boolean} requestPermission - Whether to request permission
   */
  const connectWallet = async (requestPermission = true) => {
    if (!window.ethereum) {
      alert('MetaMask not detected! Please install MetaMask to use this wallet.');
      return;
    }

    setIsConnecting(true);
    try {
      let accounts;
      
      if (requestPermission) {
        // Request account access
        accounts = await window.ethereum.request({ 
          method: 'eth_requestAccounts' 
        });
      } else {
        // Just get current accounts
        accounts = await window.ethereum.request({ 
          method: 'eth_accounts' 
        });
      }

      if (accounts.length > 0) {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        const address = await signer.getAddress();
        
        setAccount(address);
        setProvider(provider);
        setSigner(signer);
        
        // Fetch initial balance
        await updateBalance(address, provider);
        
        console.log('✅ Wallet connected:', address);
      }
    } catch (error) {
      console.error('Error connecting wallet:', error);
      if (error.code === 4001) {
        alert('Connection rejected by user');
      } else {
        alert('Error connecting to wallet: ' + error.message);
      }
    }
    setIsConnecting(false);
  };

  /**
   * Update ETH balance for the connected account
   */
  const updateBalance = async (address = account, providerInstance = provider) => {
    if (!address || !providerInstance) return;
    
    try {
      const balance = await providerInstance.getBalance(address);
      const balanceInEth = ethers.formatEther(balance);
      setBalance(balanceInEth);
    } catch (error) {
      console.error('Error fetching balance:', error);
    }
  };

  /**
   * Handle account changes (when user switches accounts in MetaMask)
   */
  const handleAccountsChanged = (accounts) => {
    if (accounts.length === 0) {
      // User disconnected
      setAccount(null);
      setSigner(null);
      setBalance('0');
    } else {
      // User switched accounts
      connectWallet(false);
    }
  };

  /**
   * Handle chain/network changes
   */
  const handleChainChanged = () => {
    // Reload the page when chain changes (recommended by MetaMask)
    window.location.reload();
  };

  /**
   * Disconnect wallet (clear state)
   */
  const disconnectWallet = () => {
    setAccount(null);
    setSigner(null);
    setBalance('0');
    console.log('🔌 Wallet disconnected');
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>🏦 Ethereum Wallet Basic</h1>
        <p>Connect, Send, and Receive ETH</p>
      </header>

      <main className="App-main">
        {!account ? (
          <div className="connect-section">
            <ConnectButton 
              onConnect={() => connectWallet(true)}
              isConnecting={isConnecting}
            />
            <div className="info-box">
              <h3>🔐 Security Notes:</h3>
              <ul>
                <li>This wallet connects to your MetaMask extension</li>
                <li>Your private keys never leave your MetaMask wallet</li>
                <li>Always verify transaction details before confirming</li>
                <li>Never share your seed phrase or private keys</li>
              </ul>
            </div>
          </div>
        ) : (
          <div className="wallet-container">
            <div className="wallet-header">
              <div className="account-info">
                <h3>Connected Account:</h3>
                <p className="account-address">{account}</p>
                <button onClick={disconnectWallet} className="disconnect-btn">
                  Disconnect
                </button>
              </div>
              
              {network && (
                <div className="network-info">
                  <p>Network: <strong>{network.name}</strong></p>
                  <p>Chain ID: <strong>{network.chainId.toString()}</strong></p>
                </div>
              )}
            </div>

            <BalanceDisplay 
              balance={balance} 
              onRefresh={() => updateBalance()}
            />

            <div className="wallet-actions">
              <SendForm 
                signer={signer}
                provider={provider}
                onTransactionComplete={() => updateBalance()}
                currentNetwork={network}
              />
              
              <ReceiveSection account={account} />
            </div>
          </div>
        )}
      </main>

      <footer className="App-footer">
        <p>⚠️ This is a demo wallet for educational purposes. Use testnet ETH only!</p>
      </footer>
    </div>
  );
}

export default App;