import React from 'react';

/**
 * BalanceDisplay Component
 * Shows the current ETH balance with refresh functionality
 */
const BalanceDisplay = ({ balance, onRefresh }) => {
  // Format balance for display (limit to 6 decimal places)
  const formatBalance = (balance) => {
    const numBalance = parseFloat(balance);
    if (numBalance === 0) return '0.000000';
    return numBalance.toFixed(6);
  };

  // Convert ETH to USD (this would typically come from an API)
  // For demo purposes, using a placeholder rate
  const getUSDValue = (ethBalance) => {
    const ETH_TO_USD = 2000; // Placeholder rate
    const usdValue = parseFloat(ethBalance) * ETH_TO_USD;
    return usdValue.toFixed(2);
  };

  return (
    <div className="balance-container">
      <div className="balance-card">
        <div className="balance-header">
          <h3>💰 Your Balance</h3>
          <button 
            onClick={onRefresh}
            className="refresh-button"
            title="Refresh balance"
          >
            🔄
          </button>
        </div>
        
        <div className="balance-display">
          <div className="balance-main">
            <span className="balance-amount">{formatBalance(balance)}</span>
            <span className="balance-currency">ETH</span>
          </div>
          
          <div className="balance-usd">
            ≈ ${getUSDValue(balance)} USD
          </div>
        </div>

        <div className="balance-info">
          {parseFloat(balance) === 0 ? (
            <p className="balance-warning">
              ⚠️ No ETH balance. Get testnet ETH from a faucet to start testing!
            </p>
          ) : parseFloat(balance) < 0.001 ? (
            <p className="balance-warning">
              ⚠️ Low balance. Consider getting more testnet ETH.
            </p>
          ) : (
            <p className="balance-good">
              ✅ Good balance for testing transactions
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default BalanceDisplay;