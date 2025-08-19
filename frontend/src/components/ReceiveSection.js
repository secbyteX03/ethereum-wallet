import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';

/**
 * ReceiveSection Component
 * Displays the user's address and QR code for receiving ETH
 */
const ReceiveSection = ({ account }) => {
  const [qrCodeData, setQrCodeData] = useState('');
  const [copied, setCopied] = useState(false);

  /**
   * Generate QR code when account changes
   */
  useEffect(() => {
    if (account) {
      generateQRCode(account);
    }
  }, [account]);

  /**
   * Generate QR code for the account address
   */
  const generateQRCode = async (address) => {
    try {
      // Create QR code with Ethereum URI format
      const qrData = await QRCode.toDataURL(`ethereum:${address}`, {
        width: 200,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#ffffff'
        }
      });
      setQrCodeData(qrData);
    } catch (error) {
      console.error('Error generating QR code:', error);
    }
  };

  /**
   * Copy address to clipboard
   */
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(account);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
      // Fallback for older browsers
      fallbackCopy(account);
    }
  };

  /**
   * Fallback copy method for older browsers
   */
  const fallbackCopy = (text) => {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
      document.execCommand('copy');
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Fallback copy failed:', err);
    }
    document.body.removeChild(textArea);
  };

  /**
   * Format address for display (show first 6 and last 4 characters)
   */
  const formatAddress = (address) => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  /**
   * Share address using Web Share API (mobile-friendly)
   */
  const shareAddress = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'My Ethereum Address',
          text: `Send ETH to my address: ${account}`,
          url: `ethereum:${account}`
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
      // Fallback to copying
      copyToClipboard();
    }
  };

  return (
    <div className="receive-container">
      <div className="receive-card">
        <h3>📥 Receive ETH</h3>
        
        <div className="receive-content">
          <div className="qr-section">
            {qrCodeData ? (
              <div className="qr-container">
                <img 
                  src={qrCodeData} 
                  alt="QR Code for receiving ETH" 
                  className="qr-code"
                />
                <p className="qr-label">Scan to send ETH</p>
              </div>
            ) : (
              <div className="qr-loading">
                <div className="loading-spinner"></div>
                <p>Generating QR code...</p>
              </div>
            )}
          </div>

          <div className="address-section">
            <label>Your Address:</label>
            <div className="address-display">
              <code className="address-text">{account}</code>
              <div className="address-actions">
                <button 
                  onClick={copyToClipboard}
                  className={`copy-button ${copied ? 'copied' : ''}`}
                  title="Copy address"
                >
                  {copied ? '✅ Copied!' : '📋 Copy'}
                </button>
                
                {navigator.share && (
                  <button 
                    onClick={shareAddress}
                    className="share-button"
                    title="Share address"
                  >
                    🔗 Share
                  </button>
                )}
              </div>
            </div>

            <div className="address-short">
              <p>Short format: <strong>{formatAddress(account)}</strong></p>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="receive-instructions">
          <h4>💡 How to receive ETH:</h4>
          <ol>
            <li>Share your address or QR code with the sender</li>
            <li>They can scan the QR code or copy your address</li>
            <li>ETH will appear in your balance once confirmed</li>
            <li>Transactions typically take 15 seconds to 5 minutes</li>
          </ol>
        </div>

        {/* Testnet Faucet Links */}
        <div className="faucet-links">
          <h4>🚰 Get Test ETH (Testnets):</h4>
          <div className="faucet-buttons">
            <a 
              href="https://sepoliafaucet.com/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="faucet-link"
            >
              Sepolia Faucet
            </a>
            <a 
              href="https://faucets.chain.link/sepolia" 
              target="_blank" 
              rel="noopener noreferrer"
              className="faucet-link"
            >
              Chainlink Faucet
            </a>
            <a 
              href="https://www.alchemy.com/faucets/ethereum-sepolia" 
              target="_blank" 
              rel="noopener noreferrer"
              className="faucet-link"
            >
              Alchemy Faucet
            </a>
          </div>
          <p className="faucet-note">
            ⚠️ Use testnet faucets only with testnet networks (Sepolia, Goerli)
          </p>
        </div>

        {/* Security Notes */}
        <div className="security-info">
          <h4>🔐 Security Notes:</h4>
          <ul>
            <li>This address is safe to share publicly</li>
            <li>Only send ETH/tokens to this exact address</li>
            <li>Double-check the network (Mainnet vs Testnet)</li>
            <li>Keep your seed phrase/private keys secret</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ReceiveSection;