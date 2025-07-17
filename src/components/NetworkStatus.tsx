import React, { useState, useEffect } from 'react';
import { walletService } from '../services/walletService';

interface NetworkStatusProps {
  onNetworkReady: () => void;
}

const NetworkStatus: React.FC<NetworkStatusProps> = ({ onNetworkReady }) => {
  const [networkStatus, setNetworkStatus] = useState<{
    isCorrectNetwork: boolean;
    currentNetwork: string;
    expectedNetwork: string;
    error?: string;
  } | null>(null);

  const checkNetwork = async () => {
    try {
      const currentNetwork = await walletService.getNetwork();
      const expectedNetwork = 'Test SDF Future Network ; October 2022';
      
      const isCorrectNetwork = currentNetwork === expectedNetwork;
      
      setNetworkStatus({
        isCorrectNetwork,
        currentNetwork: currentNetwork || 'Unknown',
        expectedNetwork,
      });

      if (isCorrectNetwork) {
        onNetworkReady();
      }
    } catch (error) {
      setNetworkStatus({
        isCorrectNetwork: false,
        currentNetwork: 'Error',
        expectedNetwork: 'Test SDF Future Network ; October 2022',
        error: error instanceof Error ? error.message : 'Failed to check network'
      });
    }
  };

  useEffect(() => {
    checkNetwork();
  }, []);

  if (!networkStatus) {
    return (
      <div className="bg-blue-100 text-blue-800 px-4 py-3 rounded-lg">
        <p>Checking network configuration...</p>
      </div>
    );
  }

  if (networkStatus.isCorrectNetwork) {
    return (
      <div className="bg-green-100 text-green-800 px-4 py-3 rounded-lg">
        <p className="font-semibold">✅ Network Configuration Correct</p>
        <p className="text-sm">Connected to: {networkStatus.currentNetwork}</p>
      </div>
    );
  }

  return (
    <div className="bg-red-100 text-red-800 px-4 py-3 rounded-lg">
      <p className="font-semibold">❌ Network Configuration Issue</p>
      <p className="text-sm">Current: {networkStatus.currentNetwork}</p>
      <p className="text-sm">Expected: {networkStatus.expectedNetwork}</p>
      {networkStatus.error && (
        <p className="text-sm mt-2">Error: {networkStatus.error}</p>
      )}
      <div className="mt-3">
        <p className="text-sm font-semibold">To fix this:</p>
        <ol className="text-sm list-decimal list-inside mt-1">
          <li>Open Freighter wallet extension</li>
          <li>Click on the network dropdown (usually shows "Mainnet" or "Testnet")</li>
          <li>Select "Add Network" or "Custom Network"</li>
          <li>Add Futurenet with:
            <ul className="list-disc list-inside ml-4 mt-1">
              <li>Name: Futurenet</li>
              <li>RPC URL: https://rpc-futurenet.stellar.org</li>
              <li>Passphrase: Test SDF Future Network ; October 2022</li>
            </ul>
          </li>
          <li>Switch to the Futurenet network</li>
          <li>Refresh this page</li>
        </ol>
        <button 
          onClick={checkNetwork}
          className="mt-3 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
        >
          Recheck Network
        </button>
      </div>
    </div>
  );
};

export default NetworkStatus;
