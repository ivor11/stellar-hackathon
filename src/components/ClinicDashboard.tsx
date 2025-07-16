import React, { useState } from 'react';
import { DashboardProps, ClinicMetadata, Claim, ClinicRegistrationForm, ClaimSubmissionForm } from '../types';

function ClinicDashboard({ walletAddress }: DashboardProps): JSX.Element {
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

  const handleRegistration = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    try {
      // TODO: Integrate with smart contract
      console.log('Registering clinic:', registrationForm);
      // Mock registration success
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
    }
  };

  const handleClaimSubmission = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    try {
      // TODO: Integrate with smart contract
      console.log('Submitting claim:', claimForm);
      const newClaim: Claim = {
        claim_id: Date.now(),
        patient_id: claimForm.patientId,
        service_code: claimForm.serviceCode,
        amount: parseFloat(claimForm.amount),
        status: 'Pending',
        date: new Date().toISOString().split('T')[0],
        clinic: clinicData?.name || 'Unknown Clinic'
      };
      setClaims([...claims, newClaim]);
      setClaimForm({ patientId: '', serviceCode: '', amount: '' });
    } catch (error) {
      console.error('Claim submission failed:', error);
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
      case 'Pending': return 'bg-yellow-100 text-yellow-800';
      case 'Approved': return 'bg-green-100 text-green-800';
      case 'Rejected': return 'bg-red-100 text-red-800';
      case 'Payment Released': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Clinic Dashboard</h2>
      
      {!isRegistered ? (
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
          <p>Your clinic is not registered. Please register to start submitting claims.</p>
          <button
            onClick={() => setShowRegistration(true)}
            className="mt-2 bg-yellow-500 hover:bg-yellow-600 text-white py-2 px-4 rounded"
          >
            Register Clinic
          </button>
        </div>
      ) : (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
          <p>✓ Clinic registered: {clinicData?.name}</p>
          <p>License: {clinicData?.license_number}</p>
          <p>Status: {clinicData?.is_verified ? 'Verified' : 'Pending Verification'}</p>
        </div>
      )}

      {showRegistration && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-semibold mb-4">Register Clinic</h3>
          <form onSubmit={handleRegistration}>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Clinic Name</label>
                <input
                  type="text"
                  value={registrationForm.name}
                  onChange={(e) => handleRegistrationChange('name', e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">License Number</label>
                <input
                  type="text"
                  value={registrationForm.licenseNumber}
                  onChange={(e) => handleRegistrationChange('licenseNumber', e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded"
                  required
                />
              </div>
              <div className="flex space-x-3">
                <button
                  type="submit"
                  className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded"
                >
                  Register
                </button>
                <button
                  type="button"
                  onClick={() => setShowRegistration(false)}
                  className="bg-gray-500 hover:bg-gray-600 text-white py-2 px-4 rounded"
                >
                  Cancel
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {isRegistered && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-semibold mb-4">Submit New Claim</h3>
          <form onSubmit={handleClaimSubmission}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Patient ID</label>
                <input
                  type="text"
                  value={claimForm.patientId}
                  onChange={(e) => handleClaimChange('patientId', e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Service Code</label>
                <input
                  type="text"
                  value={claimForm.serviceCode}
                  onChange={(e) => handleClaimChange('serviceCode', e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded"
                  placeholder="e.g., CHECKUP, SURGERY"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Amount (USDC)</label>
                <input
                  type="number"
                  value={claimForm.amount}
                  onChange={(e) => handleClaimChange('amount', e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded"
                  step="0.01"
                  required
                />
              </div>
            </div>
            <button
              type="submit"
              className="mt-4 bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded"
            >
              Submit Claim
            </button>
          </form>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-xl font-semibold mb-4">Your Claims</h3>
        {claims.length === 0 ? (
          <p className="text-gray-500">No claims submitted yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full table-auto">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-4 py-2 text-left">Claim ID</th>
                  <th className="px-4 py-2 text-left">Patient ID</th>
                  <th className="px-4 py-2 text-left">Service</th>
                  <th className="px-4 py-2 text-left">Amount</th>
                  <th className="px-4 py-2 text-left">Status</th>
                  <th className="px-4 py-2 text-left">Date</th>
                </tr>
              </thead>
              <tbody>
                {claims.map((claim) => (
                  <tr key={claim.claim_id} className="border-t">
                    <td className="px-4 py-2">{claim.claim_id}</td>
                    <td className="px-4 py-2">{claim.patient_id}</td>
                    <td className="px-4 py-2">{claim.service_code}</td>
                    <td className="px-4 py-2">${claim.amount}</td>
                    <td className="px-4 py-2">
                      <span className={`px-2 py-1 rounded text-sm ${getStatusColor(claim.status)}`}>
                        {claim.status}
                      </span>
                    </td>
                    <td className="px-4 py-2">{claim.date}</td>
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