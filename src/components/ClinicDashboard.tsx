import React, { useState, useEffect } from 'react';
import { DashboardProps, ClinicMetadata, Claim, ClinicRegistrationForm, ClaimSubmissionForm } from '../types';
import { walletService } from '../services/walletService';
import AccountFunder from './AccountFunder';

function ClinicDashboard({ walletAddress }: DashboardProps) {
  const [isRegistered, setIsRegistered] = useState<boolean>(false);
  const [clinicData, setClinicData] = useState<ClinicMetadata | null>(null);
  const [claims, setClaims] = useState<Claim[]>([]);
  const [showRegistration, setShowRegistration] = useState<boolean>(false);
  const [registrationForm, setRegistrationForm] = useState<ClinicRegistrationForm>({
    name: '',
    licenseNumber: ''
  });
  const [claimForm, setClaimForm] = useState<ClaimSubmissionForm>({
    patientId: '',
    serviceCode: '',
    amount: ''
  });

  const [registrationLoading, setRegistrationLoading] = useState<boolean>(false);
  const [claimLoading, setClaimLoading] = useState<boolean>(false);
  const [refreshLoading, setRefreshLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [needsFunding, setNeedsFunding] = useState<boolean>(false);

  // Check if clinic is already registered on component mount
  useEffect(() => {
    const checkClinicRegistration = async () => {
      try {
        const metadata = await walletService.getClinicMetadata(walletAddress);
        if (metadata) {
          setIsRegistered(true);
          setClinicData(metadata);
        }
      } catch (error) {
        // Clinic not registered yet, which is fine
        console.log('Clinic not registered yet');
      }
      
      // Always try to fetch claims regardless of registration status
      // This will handle cases where clinic is registered but we want to see existing claims
      try {
        await fetchClinicClaims();
      } catch (error) {
        console.log('No existing claims or clinic not registered yet');
      }
    };

    if (walletAddress) {
      checkClinicRegistration();
    }
  }, [walletAddress]);

  // Function to fetch claims for this clinic
  const fetchClinicClaims = async (): Promise<void> => {
    try {
      console.log('Fetching claims for clinic:', walletAddress);
      const clinicClaims = await walletService.getClaimsByClinic(walletAddress);
      console.log('Clinic claims fetched:', clinicClaims);
      
      // Transform contract data to frontend format
      const transformClaim = (claim: any): Claim => {
        const contractStatus = Array.isArray(claim.status) ? claim.status[0] : claim.status;
        return {
          claim_id: claim.claim_id,
          patient_id: claim.patient_id,
          service_code: claim.service_code,
          amount: Number(claim.amount) / 10000000, // Convert from stroops
          clinic: clinicData?.name || walletAddress, // Use clinic name if available
          date: new Date(Number(claim.date) * 1000).toISOString().split('T')[0], // Convert timestamp
          status: contractStatus === 'Pending' ? 'Pending' as const : 
                 contractStatus === 'Approved' ? 'Approved' as const :
                 contractStatus === 'Rejected' ? 'Rejected' as const :
                 contractStatus === 'Released' ? 'Payment Released' as const : 'Pending' as const
        };
      };
      
      const transformedClaims = Array.isArray(clinicClaims) ? clinicClaims.map(transformClaim) : [];
      console.log('Transformed clinic claims:', transformedClaims);
      setClaims(transformedClaims);
      
      if (transformedClaims.length > 0) {
        console.log(`Found ${transformedClaims.length} claims for clinic`);
      } else {
        console.log('No claims found for this clinic');
      }
    } catch (error) {
      console.error('Failed to fetch clinic claims:', error);
      // Don't show error for empty claims, just keep claims empty
      setClaims([]);
    }
  };

  // Function to refresh clinic data
  const refreshClinicData = async (): Promise<void> => {
    setRefreshLoading(true);
    setError('');
    
    try {
      const metadata = await walletService.getClinicMetadata(walletAddress);
      if (metadata) {
        setClinicData(metadata);
        console.log('Clinic data refreshed:', metadata);
      }
      // Also refresh claims
      await fetchClinicClaims();
    } catch (error) {
      console.error('Failed to refresh clinic data:', error);
      setError(error instanceof Error ? error.message : 'Failed to refresh clinic data');
    } finally {
      setRefreshLoading(false);
    }
  };

  const handleRegistration = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setRegistrationLoading(true);
    setError('');
    
    try {
      console.log('Starting clinic registration...');
      console.log('Wallet address:', walletAddress);
      console.log('Registration form:', registrationForm);
      
      const result = await walletService.registerClinic(
        walletAddress,
        registrationForm.name,
        registrationForm.licenseNumber
      );
      
      console.log('Registration successful:', result);
      setIsRegistered(true);
      setClinicData({
        name: registrationForm.name,
        license_number: registrationForm.licenseNumber,
        registration_date: Date.now(),
        is_verified: false
      });
      setShowRegistration(false);
    } catch (error) {
      console.error('Registration failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Registration failed';
      
      // Check if it's a funding issue
      if (errorMessage.includes('account not found') || 
          errorMessage.includes('Account not found') || 
          errorMessage.includes('friendbot') ||
          errorMessage.includes('not found on futurenet') ||
          errorMessage.includes('Insufficient balance') ||
          errorMessage.includes('fund your account')) {
        setNeedsFunding(true);
        setError(`Your account needs to be funded with XLM on Futurenet. Please visit: https://stellar.org/laboratory/#account-creator?network=futurenet and fund address: ${walletAddress}`);
      } else {
        setError(errorMessage);
      }
    } finally {
      setRegistrationLoading(false);
    }
  };

  const handleClaimSubmission = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setClaimLoading(true);
    setError('');
    
    try {
      const result = await walletService.submitClaim(
        walletAddress,
        claimForm.patientId,
        claimForm.serviceCode,
        parseFloat(claimForm.amount)
      );
      
      console.log('Claim submitted:', result);
      
      // Reset form and refresh claims from contract
      setClaimForm({ patientId: '', serviceCode: '', amount: '' });
      await fetchClinicClaims();
    } catch (error) {
      console.error('Claim submission failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Claim submission failed';
      
      // Check if it's a funding issue (account not found)
      if (errorMessage.includes('account not found') || 
          errorMessage.includes('Account not found') || 
          errorMessage.includes('friendbot') ||
          errorMessage.includes('not found on futurenet')) {
        setNeedsFunding(true);
        setError('Your account needs to be funded with futurenet XLM to interact with the smart contract.');
      } else {
        setError(errorMessage);
      }
    } finally {
      setClaimLoading(false);
    }
  };

  const handleRegistrationChange = (field: keyof ClinicRegistrationForm, value: string): void => {
    setRegistrationForm(prev => ({ ...prev, [field]: value }));
  };

  const handleClaimChange = (field: keyof ClaimSubmissionForm, value: string): void => {
    setClaimForm(prev => ({ ...prev, [field]: value }));
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'Pending': return 'bg-warning text-white';
      case 'Approved': return 'bg-success text-white';
      case 'Rejected': return 'bg-error text-white';
      case 'Payment Released': return 'bg-primary text-white';
      default: return 'bg-gray-200 text-text-secondary';
    }
  };

  return (
    <div className="space-y-8">
      <h2 className="text-4xl font-bold text-text-primary">Clinic Dashboard</h2>
      
      {error && (
        <div className="bg-error text-white px-6 py-4 rounded-lg shadow-md">
          <p className="font-semibold">{error}</p>
        </div>
      )}
      
      {needsFunding && (
        <AccountFunder 
          walletAddress={walletAddress} 
          onFunded={() => {
            setNeedsFunding(false);
            setError('');
          }} 
        />
      )}
      
      {!isRegistered ? (
        <div className="bg-warning text-white px-6 py-4 rounded-lg shadow-md border border-border-color flex items-center justify-between">
          <div>
            <p className="font-semibold text-lg">Your clinic is not registered.</p>
            <p className="text-sm">Please register to start submitting claims.</p>
          </div>
          <button
            onClick={() => setShowRegistration(true)}
            className="bg-white text-warning font-semibold py-2 px-6 rounded-lg shadow-md hover:shadow-lg transition-shadow"
          >
            Register Clinic
          </button>
        </div>
      ) : (
        <div className="bg-success text-white px-6 py-4 rounded-lg shadow-md border border-border-color">
          <div className="flex justify-between items-start">
            <div>
              <p className="font-semibold text-lg">✓ Clinic registered: {clinicData?.name}</p>
              <p className="text-sm">License: {clinicData?.license_number}</p>
              <p className="text-sm">Status: {clinicData?.is_verified ? 'Verified' : 'Pending Verification'}</p>
            </div>
            <button
              onClick={refreshClinicData}
              disabled={refreshLoading}
              className="bg-white text-success px-3 py-1 rounded text-sm font-semibold hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {refreshLoading ? 'Refreshing...' : 'Refresh Status'}
            </button>
          </div>
        </div>
      )}

      {showRegistration && (
        <div className="bg-white rounded-lg shadow-lg p-6 border border-border-color">
          <h3 className="text-2xl font-semibold mb-4 text-text-primary">Register Clinic</h3>
          <form onSubmit={handleRegistration} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1 text-text-secondary">Clinic Name</label>
              <input
                type="text"
                value={registrationForm.name}
                onChange={(e) => handleRegistrationChange('name', e.target.value)}
                className="w-full p-3 border border-border-color rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-text-secondary">License Number</label>
              <input
                type="text"
                value={registrationForm.licenseNumber}
                onChange={(e) => handleRegistrationChange('licenseNumber', e.target.value)}
                className="w-full p-3 border border-border-color rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                required
              />
            </div>
            <div className="flex space-x-3">
              <button
                type="submit"
                disabled={registrationLoading}
                className="bg-primary hover:bg-blue-700 disabled:bg-blue-300 text-white py-2 px-6 rounded-lg shadow-md hover:shadow-lg transition-shadow"
              >
                {registrationLoading ? 'Registering...' : 'Register'}
              </button>
              <button
                type="button"
                onClick={() => setShowRegistration(false)}
                disabled={registrationLoading}
                className="bg-gray-500 hover:bg-gray-600 disabled:bg-gray-300 text-white py-2 px-6 rounded-lg shadow-md hover:shadow-lg transition-shadow"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {isRegistered && (
        <div className="bg-white rounded-lg shadow-lg p-6 border border-border-color">
          <h3 className="text-2xl font-semibold mb-4 text-text-primary">Submit New Claim</h3>
          <form onSubmit={handleClaimSubmission} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-text-secondary">Patient ID</label>
                <input
                  type="text"
                  value={claimForm.patientId}
                  onChange={(e) => handleClaimChange('patientId', e.target.value)}
                  className="w-full p-3 border border-border-color rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-text-secondary">Service Code</label>
                <input
                  type="text"
                  value={claimForm.serviceCode}
                  onChange={(e) => handleClaimChange('serviceCode', e.target.value)}
                  className="w-full p-3 border border-border-color rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="e.g., CHECKUP, SURGERY"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-text-secondary">Amount (USDC)</label>
                <input
                  type="number"
                  value={claimForm.amount}
                  onChange={(e) => handleClaimChange('amount', e.target.value)}
                  className="w-full p-3 border border-border-color rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  step="0.01"
                  required
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={claimLoading}
              className="mt-4 bg-success hover:bg-green-700 disabled:bg-green-300 text-white py-2 px-6 rounded-lg shadow-md hover:shadow-lg transition-shadow"
            >
              {claimLoading ? 'Submitting...' : 'Submit Claim'}
            </button>
          </form>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-lg p-6 border border-border-color">
        <h3 className="text-2xl font-semibold mb-4 text-text-primary">Your Claims</h3>
        {claims.length === 0 ? (
          <p className="text-text-secondary">No claims submitted yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full table-auto">
              <thead>
                <tr className="bg-secondary">
                  <th className="px-6 py-3 text-left text-text-primary font-semibold">Claim ID</th>
                  <th className="px-6 py-3 text-left text-text-primary font-semibold">Patient ID</th>
                  <th className="px-6 py-3 text-left text-text-primary font-semibold">Service</th>
                  <th className="px-6 py-3 text-left text-text-primary font-semibold">Amount</th>
                  <th className="px-6 py-3 text-left text-text-primary font-semibold">Status</th>
                  <th className="px-6 py-3 text-left text-text-primary font-semibold">Date</th>
                </tr>
              </thead>
              <tbody>
                {claims.map((claim) => (
                  <tr key={claim.claim_id} className="border-t border-border-color hover:bg-gray-50">
                    <td className="px-6 py-4">{claim.claim_id}</td>
                    <td className="px-6 py-4">{claim.patient_id}</td>
                    <td className="px-6 py-4">{claim.service_code}</td>
                    <td className="px-6 py-4">${claim.amount}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(claim.status)}`}>
                        {claim.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">{claim.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default ClinicDashboard;
