import React, { useState } from 'react';

interface AccountFunderProps {
  walletAddress: string;
  onFunded: () => void;
}

const AccountFunder: React.FC<AccountFunderProps> = ({ walletAddress, onFunded }) => {
  const [isFunding, setIsFunding] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  const fundAccount = async () => {
    setIsFunding(true);
    setError('');
    setSuccess('');

    try {
      // Fund the account multiple times to ensure sufficient XLM for contract transactions
      const fundingAttempts = 3;
      let successCount = 0;
      
      for (let i = 0; i < fundingAttempts; i++) {
        try {
          // Use Futurenet friendbot instead of testnet
          const response = await fetch(`https://friendbot-futurenet.stellar.org/?addr=${walletAddress}`);
          if (response.ok) {
            successCount++;
          }
          // Wait between requests to avoid rate limiting
          if (i < fundingAttempts - 1) {
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        } catch (err) {
          console.warn(`Funding attempt ${i + 1} failed:`, err);
        }
      }
      
      if (successCount > 0) {
        setSuccess(`Account funded successfully with ${successCount} transactions! You now have enough XLM for contract operations.`);
        setTimeout(() => {
          onFunded();
        }, 3000);
      } else {
        throw new Error('All funding attempts failed');
      }
    } catch (error) {
      setError('Failed to fund account. Please try again or fund manually at https://stellar.org/laboratory/#account-creator?network=futurenet (you may need to fund multiple times for contract operations).');
    } finally {
      setIsFunding(false);
    }
  };

  const copyAddress = () => {
    navigator.clipboard.writeText(walletAddress);
  };

  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-6">
      <h3 className="text-lg font-semibold text-yellow-800 mb-4">Account Needs Funding</h3>
      <p className="text-yellow-700 mb-4">
        Your wallet needs futurenet XLM to interact with the smart contract. You can fund it automatically or manually.
      </p>
      
      {error && (
        <div className="bg-red-100 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      {success && (
        <div className="bg-green-100 border border-green-200 text-green-700 px-4 py-3 rounded mb-4">
          {success}
        </div>
      )}

      <div className="space-y-4">
        <div>
          <p className="text-sm font-medium text-yellow-800 mb-2">Your Wallet Address:</p>
          <div className="flex items-center space-x-2">
            <code className="bg-yellow-100 px-2 py-1 rounded text-sm flex-1 break-all">
              {walletAddress}
            </code>
            <button
              onClick={copyAddress}
              className="bg-yellow-600 hover:bg-yellow-700 text-white px-3 py-1 rounded text-sm"
            >
              Copy
            </button>
          </div>
        </div>

        <div className="flex space-x-3">
          <button
            onClick={fundAccount}
            disabled={isFunding}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white px-4 py-2 rounded"
          >
            {isFunding ? 'Funding...' : 'Auto-Fund Account'}
          </button>
          
          <a
            href="https://friendbot.stellar.org"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded inline-block"
          >
            Manual Funding
          </a>
        </div>

        <p className="text-xs text-yellow-600">
          Note: This uses futurenet XLM which has no real value. The friendbot will give you free futurenet XLM for testing.
        </p>
      </div>
    </div>
  );
};

export default AccountFunder;
