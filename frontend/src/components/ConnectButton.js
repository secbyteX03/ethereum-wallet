import React from 'react';

/**
 * ConnectButton Component
 * Displays a button to connect to MetaMask wallet
 */
const ConnectButton = ({ onConnect, isConnecting }) => {
  // Check if MetaMask is installed
  const isMetaMaskInstalled = () => {
    return typeof window.ethereum !== 'undefined';
  };

  if (!isMetaMaskInstalled()) {
    return (
      <div className="connect-container">
        <div className="metamask-warning">
          <h2>🦊 MetaMask Required</h2>
          <p>Please install MetaMask to use this wallet</p>
          <a 
            href="https://metamask.io/download/"
            target="_blank"
            rel="noopener noreferrer"
            className="install-button"
          >
            Install MetaMask
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="connect-container">
      <div className="connect-card">
        <h2>🌟 Welcome to Ethereum Wallet</h2>
        <p>Connect your MetaMask wallet to get started</p>
        
        <button 
          onClick={onConnect}
          disabled={isConnecting}
          className="connect-button"
        >
          {isConnecting ? (
            <>
              <span className="loading-spinner"></span>
              Connecting...
            </>
          ) : (
            <>
              🦊 Connect MetaMask
            </>
          )}
        </button>

        <div className="connect-info">
          <h4>What happens when you connect?</h4>
          <ul>
            <li>✅ View your ETH balance</li>
            <li>✅ Send ETH to other addresses</li>
            <li>✅ Receive ETH with QR codes</li>
            <li>✅ Track transaction history</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ConnectButton;