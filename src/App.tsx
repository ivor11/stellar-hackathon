import React, { useState } from 'react';
import './App.css';
import ConnectWallet from './components/ConnectWallet';
import ClinicDashboard from './components/ClinicDashboard';
import AdminDashboard from './components/AdminDashboard';
import PatientView from './components/PatientView';
import ContractTester from './components/ContractTester';
import { UserType } from './types';
import { walletService } from './services/walletService';
import stellarBanner from './assets/stellar-banner.png';

function App() {
  const [walletAddress, setWalletAddress] = useState<string>('');
  const [userType, setUserType] = useState<UserType>('');

  return (
    <div className="min-h-screen bg-secondary">
      <header className="bg-primary text-white shadow-md">
        <div className="container mx-auto flex justify-between items-center p-4">
          <h1 className="text-3xl font-bold">Stellar Health</h1>
          {walletAddress && (
            <div className="text-sm bg-blue-400 px-4 py-2 rounded-full">
              Connected: {walletService.formatAddress(walletAddress)}
            </div>
          )}
        </div>
      </header>

      <main className="container mx-auto p-8">
        {!walletAddress ? (
          <ConnectWallet onConnect={setWalletAddress} />
        ) : (
          <div>
            {!userType ? (
              <div className="flex flex-row items-center justify-center space-x-12 mt-16">
                {/* Left side */}
                <div className="text-center">
                  <h1 className="text-5xl font-bold text-primary mb-4">Stellar Health</h1>
                  <img src={stellarBanner} alt="Stellar Health Banner" className="w-96 rounded-lg shadow-lg"/>
                </div>

                {/* Right side */}
                <div className="bg-white rounded-lg shadow-lg p-8 w-96">
                  <div className="space-y-4">
                    <button
                      onClick={() => setUserType('clinic')}
                      className="w-full bg-primary hover:bg-blue-700 text-white py-3 px-6 rounded-lg transition-transform transform hover:scale-105"
                    >
                      Clinic Dashboard
                    </button>
                    <button
                      onClick={() => setUserType('admin')}
                      className="w-full bg-accent hover:bg-teal-500 text-white py-3 px-6 rounded-lg transition-transform transform hover:scale-105"
                    >
                      Admin Dashboard
                    </button>
                    <button
                      onClick={() => setUserType('patient')}
                      className="w-full bg-gray-600 hover:bg-gray-700 text-white py-3 px-6 rounded-lg transition-transform transform hover:scale-105"
                    >
                      Patient View
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div>
                <div className="mb-6">
                  <button
                    onClick={() => setUserType('')}
                    className="bg-gray-500 hover:bg-gray-600 text-white py-2 px-4 rounded-lg shadow-md hover:shadow-lg transition-shadow"
                  >
                    ← Back to Role Selection
                  </button>
                </div>
                
                {userType === 'clinic' && <ClinicDashboard walletAddress={walletAddress} />}
                {userType === 'admin' && <AdminDashboard walletAddress={walletAddress} />}
                {userType === 'patient' && <PatientView walletAddress={walletAddress} />}
                {userType === 'tester' && <ContractTester />}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
