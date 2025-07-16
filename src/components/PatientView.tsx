import React, { useState } from 'react';
import { DashboardProps, Claim, ClinicInfo, ClaimStatus } from '../types';

function PatientView({ walletAddress }: DashboardProps): JSX.Element {
  const [claims, setClaims] = useState<Claim[]>([
    { claim_id: 1, patient_id: 'P001', service_code: 'CHECKUP', amount: 100, clinic: 'City Health Clinic', date: '2024-01-15', status: 'Approved' },
    { claim_id: 2, patient_id: 'P001', service_code: 'SURGERY', amount: 5000, clinic: 'Metro Hospital', date: '2024-01-16', status: 'Payment Released' },
    { claim_id: 3, patient_id: 'P001', service_code: 'CONSULTATION', amount: 75, clinic: 'City Health Clinic', date: '2024-01-14', status: 'Rejected' }
  ]);
  
  const [searchClaimId, setSearchClaimId] = useState<string>('');
  const [selectedClaim, setSelectedClaim] = useState<Claim | null>(null);
  const [clinics, setClinics] = useState<ClinicInfo[]>([
    { name: 'City Health Clinic', address: 'GXXX...XXXX', isVerified: true, reputation: { success: 85, total: 100 } },
    { name: 'Metro Hospital', address: 'GYYY...YYYY', isVerified: true, reputation: { success: 92, total: 150 } },
    { name: 'Community Health Center', address: 'GZZZ...ZZZZ', isVerified: false, reputation: { success: 0, total: 0 } }
  ]);

  const searchClaim = (): void => {
    const claim = claims.find(c => c.claim_id.toString() === searchClaimId);
    setSelectedClaim(claim || null);
  };

  const getStatusColor = (status: ClaimStatus): string => {
    switch (status) {
      case 'Pending': return 'bg-yellow-100 text-yellow-800';
      case 'Approved': return 'bg-green-100 text-green-800';
      case 'Rejected': return 'bg-red-100 text-red-800';
      case 'Payment Released': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getReputationColor = (percentage: number): string => {
    if (percentage >= 90) return 'text-green-600';
    if (percentage >= 75) return 'text-yellow-600';
    return 'text-red-600';
  };

  const calculateReputationPercentage = (success: number, total: number): number => {
    return total > 0 ? Math.round((success / total) * 100) : 0;
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Patient Dashboard</h2>
      
      {/* Claim Search */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold mb-4">Search Claim Status</h3>
        <div className="flex space-x-3">
          <input
            type="text"
            value={searchClaimId}
            onChange={(e) => setSearchClaimId(e.target.value)}
            placeholder="Enter Claim ID"
            className="flex-1 p-2 border border-gray-300 rounded"
          />
          <button
            onClick={searchClaim}
            className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded"
          >
            Search
          </button>
        </div>
        
        {selectedClaim && (
          <div className="mt-4 p-4 border rounded-lg bg-gray-50">
            <h4 className="font-semibold mb-2">Claim Details</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Claim ID</p>
                <p className="font-medium">{selectedClaim.claim_id}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Patient ID</p>
                <p className="font-medium">{selectedClaim.patient_id}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Service</p>
                <p className="font-medium">{selectedClaim.service_code}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Amount</p>
                <p className="font-medium">${selectedClaim.amount}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Clinic</p>
                <p className="font-medium">{selectedClaim.clinic}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Status</p>
                <span className={`px-2 py-1 rounded text-sm ${getStatusColor(selectedClaim.status)}`}>
                  {selectedClaim.status}
                </span>
              </div>
            </div>
          </div>
        )}
        
        {searchClaimId && !selectedClaim && (
          <div className="mt-4 p-4 border border-red-300 rounded-lg bg-red-50">
            <p className="text-red-700">No claim found with ID: {searchClaimId}</p>
          </div>
        )}
      </div>

      {/* My Claims History */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold mb-4">My Claims History</h3>
        {claims.length === 0 ? (
          <p className="text-gray-500">No claims found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full table-auto">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-4 py-2 text-left">Claim ID</th>
                  <th className="px-4 py-2 text-left">Service</th>
                  <th className="px-4 py-2 text-left">Clinic</th>
                  <th className="px-4 py-2 text-left">Amount</th>
                  <th className="px-4 py-2 text-left">Date</th>
                  <th className="px-4 py-2 text-left">Status</th>
                </tr>
              </thead>
              <tbody>
                {claims.map((claim) => (
                  <tr key={claim.claim_id} className="border-t">
                    <td className="px-4 py-2">{claim.claim_id}</td>
                    <td className="px-4 py-2">{claim.service_code}</td>
                    <td className="px-4 py-2">{claim.clinic}</td>
                    <td className="px-4 py-2">${claim.amount}</td>
                    <td className="px-4 py-2">{claim.date}</td>
                    <td className="px-4 py-2">
                      <span className={`px-2 py-1 rounded text-sm ${getStatusColor(claim.status)}`}>
                        {claim.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Clinic Directory */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold mb-4">Verified Clinics Directory</h3>
        <div className="space-y-4">
          {clinics.map((clinic, index) => {
            const reputationPercentage = calculateReputationPercentage(clinic.reputation.success, clinic.reputation.total);
            
            return (
              <div key={index} className="border rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h4 className="font-semibold">{clinic.name}</h4>
                    <p className="text-sm text-gray-600">Address: {clinic.address}</p>
                    
                    <div className="mt-2 flex items-center space-x-4">
                      <div className="flex items-center">
                        {clinic.isVerified ? (
                          <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm">
                            ✓ Verified
                          </span>
                        ) : (
                          <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-sm">
                            ⏳ Pending Verification
                          </span>
                        )}
                      </div>
                      
                      {clinic.reputation.total > 0 && (
                        <div>
                          <span className="text-sm text-gray-600">Success Rate: </span>
                          <span className={`font-medium ${getReputationColor(reputationPercentage)}`}>
                            {reputationPercentage}%
                          </span>
                          <span className="text-sm text-gray-500">
                            {' '}({clinic.reputation.success}/{clinic.reputation.total})
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Patient Information */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold mb-4">Patient Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-600">Patient ID</p>
            <p className="font-medium">P001</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Wallet Address</p>
            <p className="font-medium text-xs">{walletAddress}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Total Claims</p>
            <p className="font-medium">{claims.length}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Approved Claims</p>
            <p className="font-medium text-green-600">
              {claims.filter(c => c.status === 'Approved' || c.status === 'Payment Released').length}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PatientView;