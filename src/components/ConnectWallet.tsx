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
    <div className="max-w-md mx-auto bg-white rounded-xl shadow-lg p-8 border border-border-color">
      <div className="text-center">
        <h2 className="text-3xl font-bold mb-4 text-text-primary">Connect Your Wallet</h2>
        <p className="text-text-secondary mb-8">
          Please connect your Freighter wallet to access the Stellar Health platform.
        </p>
        
        {error && (
          <div className="bg-error text-white px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}
        
        <button
          onClick={connectFreighter}
          disabled={connecting}
          className="w-full bg-primary hover:bg-blue-700 disabled:bg-blue-300 text-white font-semibold py-3 px-6 rounded-lg transition-transform transform hover:scale-105 shadow-md hover:shadow-lg"
        >
          {connecting ? 'Connecting...' : 'Connect Freighter Wallet'}
        </button>
        
        <p className="text-sm text-gray-500 mt-6">
          Don't have Freighter? <a href="https://freighter.app" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Download here</a>
        </p>
      </div>
    </div>
  );
}

export default ConnectWallet;
