import React, { useState } from 'react';
import './App.css';
import ConnectWallet from './components/ConnectWallet';
import ClinicDashboard from './components/ClinicDashboard';
import AdminDashboard from './components/AdminDashboard';
import PatientView from './components/PatientView';
import { UserType } from './types';
import { walletService } from './services/walletService';

function App(): JSX.Element {
  const [walletAddress, setWalletAddress] = useState<string>('');
  const [userType, setUserType] = useState<UserType>('');

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-blue-600 text-white p-4">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold">Health Insurance Claims</h1>
          {walletAddress && (
            <div className="text-sm">
              Connected: {walletService.formatAddress(walletAddress)}
            </div>
          )}
        </div>
      </header>

      <main className="container mx-auto p-4">
        {!walletAddress ? (
          <ConnectWallet onConnect={setWalletAddress} />
        ) : (
          <div>
            {!userType ? (
              <div className="bg-blue rounded-lg shadow-md p-6 max-w-md mx-auto">
                <h2 className="text-xl font-semibold mb-4">Select Your Role</h2>
                <div className="space-y-3">
                  <button
                    onClick={() => setUserType('clinic')}
                    className="w-full bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded-lg"
                  >
                    Clinic Dashboard
                  </button>
                  <button
                    onClick={() => setUserType('admin')}
                    className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-lg"
                  >
                    Admin Dashboard
                  </button>
                  <button
                    onClick={() => setUserType('patient')}
                    className="w-full bg-purple-500 hover:bg-purple-600 text-white py-2 px-4 rounded-lg"
                  >
                    Patient View
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <div className="mb-4">
                  <button
                    onClick={() => setUserType('')}
                    className="bg-gray-500 hover:bg-gray-600 text-white py-2 px-4 rounded-lg"
                  >
                    ← Back to Role Selection
                  </button>
                </div>
                
                {userType === 'clinic' && <ClinicDashboard walletAddress={walletAddress} />}
                {userType === 'admin' && <AdminDashboard walletAddress={walletAddress} />}
                {userType === 'patient' && <PatientView walletAddress={walletAddress} />}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

export default App;