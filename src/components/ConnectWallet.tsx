import React, { useState } from 'react';
import { ConnectWalletProps } from '../types';
import { walletService } from '../services/walletService';

function ConnectWallet({ onConnect }: ConnectWalletProps): JSX.Element {
  const [connecting, setConnecting] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const connectFreighter = async (): Promise<void> => {
    setConnecting(true);
    setError('');

    try {
      const walletState = await walletService.connect();
      
      if (walletState.error) {
        setError(walletState.error);
      } else if (walletState.publicKey) {
        onConnect(walletState.publicKey);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setConnecting(false);
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-4">Connect Your Wallet</h2>
        <p className="text-gray-600 mb-6">
          Connect your Freighter wallet to access the health insurance claim system
        </p>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
        
        <button
          onClick={connectFreighter}
          disabled={connecting}
          className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white font-semibold py-3 px-6 rounded-lg transition duration-200"
        >
          {connecting ? 'Connecting...' : 'Connect Freighter Wallet'}
        </button>
        
        <p className="text-sm text-gray-500 mt-4">
          Don't have Freighter? <a href="https://freighter.app" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">Download here</a>
        </p>
      </div>
    </div>
  );
}

export default ConnectWallet;