import React, { useState } from 'react';
import { walletService } from '../services/walletService';

const ContractTester: React.FC = () => {
  const [walletState, setWalletState] = useState<{
    isConnected: boolean;
    publicKey: string | null;
    error: string | null;
  }>({
    isConnected: false,
    publicKey: null,
    error: null
  });

  const [testResults, setTestResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const addResult = (test: string, result: any, success: boolean) => {
    const newResult = {
      id: Date.now(),
      test,
      result,
      success,
      timestamp: new Date().toLocaleTimeString()
    };
    setTestResults(prev => [newResult, ...prev]);
  };

  const connectWallet = async () => {
    try {
      setIsLoading(true);
      const result = await walletService.connect();
      setWalletState(result);
      
      if (result.isConnected) {
        addResult('Wallet Connection', `Connected: ${result.publicKey}`, true);
      } else {
        addResult('Wallet Connection', result.error, false);
      }
    } catch (error) {
      addResult('Wallet Connection', error instanceof Error ? error.message : 'Unknown error', false);
    } finally {
      setIsLoading(false);
    }
  };

  const testRegisterClinic = async () => {
    if (!walletState.isConnected || !walletState.publicKey) {
      addResult('Register Clinic', 'Wallet not connected', false);
      return;
    }

    try {
      setIsLoading(true);
      const result = await walletService.registerClinic(
        walletState.publicKey,
        'Test Clinic',
        'LIC123456789'
      );
      addResult('Register Clinic', `Transaction: ${result}`, true);
    } catch (error) {
      addResult('Register Clinic', error instanceof Error ? error.message : 'Unknown error', false);
    } finally {
      setIsLoading(false);
    }
  };

  const testSubmitClaim = async () => {
    if (!walletState.isConnected || !walletState.publicKey) {
      addResult('Submit Claim', 'Wallet not connected', false);
      return;
    }

    try {
      setIsLoading(true);
      const result = await walletService.submitClaim(
        walletState.publicKey,
        'patient123',
        'CONSULTATION',
        10 // 10 XLM
      );
      addResult('Submit Claim', `Transaction: ${result}`, true);
    } catch (error) {
      addResult('Submit Claim', error instanceof Error ? error.message : 'Unknown error', false);
    } finally {
      setIsLoading(false);
    }
  };

  const testGetClinicMetadata = async () => {
    if (!walletState.publicKey) {
      addResult('Get Clinic Metadata', 'No wallet address available', false);
      return;
    }

    try {
      setIsLoading(true);
      const result = await walletService.getClinicMetadata(walletState.publicKey);
      addResult('Get Clinic Metadata', JSON.stringify(result, null, 2), true);
    } catch (error) {
      addResult('Get Clinic Metadata', error instanceof Error ? error.message : 'Unknown error', false);
    } finally {
      setIsLoading(false);
    }
  };

  const testGetClinicReputation = async () => {
    if (!walletState.publicKey) {
      addResult('Get Clinic Reputation', 'No wallet address available', false);
      return;
    }

    try {
      setIsLoading(true);
      const result = await walletService.getClinicReputation(walletState.publicKey);
      addResult('Get Clinic Reputation', JSON.stringify(result, null, 2), true);
    } catch (error) {
      addResult('Get Clinic Reputation', error instanceof Error ? error.message : 'Unknown error', false);
    } finally {
      setIsLoading(false);
    }
  };

  const testGetClaim = async () => {
    try {
      setIsLoading(true);
      const result = await walletService.getClaim(1);
      addResult('Get Claim #1', JSON.stringify(result, null, 2), true);
    } catch (error) {
      addResult('Get Claim #1', error instanceof Error ? error.message : 'Unknown error', false);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Smart Contract Tester</h1>
      
      {/* Wallet Status */}
      <div className="bg-gray-100 rounded-lg p-4 mb-6">
        <h2 className="text-xl font-semibold mb-2">Wallet Status</h2>
        <p><strong>Connected:</strong> {walletState.isConnected ? 'Yes' : 'No'}</p>
        {walletState.publicKey && (
          <p><strong>Address:</strong> {walletService.formatAddress(walletState.publicKey)}</p>
        )}
        {walletState.error && (
          <p className="text-red-600"><strong>Error:</strong> {walletState.error}</p>
        )}
      </div>

      {/* Test Buttons */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
        <button
          onClick={connectWallet}
          disabled={isLoading}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
        >
          {walletState.isConnected ? 'Reconnect Wallet' : 'Connect Wallet'}
        </button>

        <button
          onClick={testRegisterClinic}
          disabled={isLoading || !walletState.isConnected}
          className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded disabled:opacity-50"
        >
          Register Clinic
        </button>

        <button
          onClick={testSubmitClaim}
          disabled={isLoading || !walletState.isConnected}
          className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded disabled:opacity-50"
        >
          Submit Claim
        </button>

        <button
          onClick={testGetClinicMetadata}
          disabled={isLoading}
          className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded disabled:opacity-50"
        >
          Get Clinic Data
        </button>

        <button
          onClick={testGetClinicReputation}
          disabled={isLoading}
          className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded disabled:opacity-50"
        >
          Get Reputation
        </button>

        <button
          onClick={testGetClaim}
          disabled={isLoading}
          className="bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded disabled:opacity-50"
        >
          Get Claim #1
        </button>
      </div>

      {isLoading && (
        <div className="text-center mb-4">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <p className="mt-2">Processing...</p>
        </div>
      )}

      {/* Test Results */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h2 className="text-xl font-semibold mb-4">Test Results</h2>
        {testResults.length === 0 ? (
          <p className="text-gray-500">No tests run yet. Click the buttons above to test the smart contract.</p>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {testResults.map((result) => (
              <div
                key={result.id}
                className={`p-3 rounded border-l-4 ${
                  result.success
                    ? 'border-green-500 bg-green-50'
                    : 'border-red-500 bg-red-50'
                }`}
              >
                <div className="flex justify-between items-start">
                  <h3 className="font-semibold">{result.test}</h3>
                  <span className="text-sm text-gray-500">{result.timestamp}</span>
                </div>
                <pre className="mt-2 text-sm bg-white p-2 rounded overflow-x-auto">
                  {typeof result.result === 'string' ? result.result : JSON.stringify(result.result, null, 2)}
                </pre>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ContractTester;
