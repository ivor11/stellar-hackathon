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
      case 'Pending': return 'bg-warning text-white';
      case 'Approved': return 'bg-success text-white';
      case 'Rejected': return 'bg-error text-white';
      case 'Payment Released': return 'bg-primary text-white';
      default: return 'bg-gray-200 text-text-secondary';
    }
  };

  const getReputationColor = (percentage: number): string => {
    if (percentage >= 90) return 'text-success';
    if (percentage >= 75) return 'text-warning';
    return 'text-error';
  };

  const calculateReputationPercentage = (success: number, total: number): number => {
    return total > 0 ? Math.round((success / total) * 100) : 0;
  };

  return (
    <div className="space-y-8">
      <h2 className="text-4xl font-bold text-text-primary">Patient Dashboard</h2>
      
      {/* Claim Search */}
      <div className="bg-white rounded-lg shadow-lg p-6 border border-border-color">
        <h3 className="text-2xl font-semibold mb-4 text-text-primary">Search Claim Status</h3>
        <div className="flex space-x-3">
          <input
            type="text"
            value={searchClaimId}
            onChange={(e) => setSearchClaimId(e.target.value)}
            placeholder="Enter Claim ID"
            className="flex-1 p-3 border border-border-color rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <button
            onClick={searchClaim}
            className="bg-primary hover:bg-blue-700 text-white py-2 px-6 rounded-lg shadow-md hover:shadow-lg transition-shadow"
          >
            Search
          </button>
        </div>
        
        {selectedClaim && (
          <div className="mt-6 p-6 border border-border-color rounded-lg bg-secondary">
            <h4 className="font-semibold text-xl mb-4 text-text-primary">Claim Details</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-text-secondary">Claim ID</p>
                <p className="font-medium text-text-primary">{selectedClaim.claim_id}</p>
              </div>
              <div>
                <p className="text-sm text-text-secondary">Patient ID</p>
                <p className="font-medium text-text-primary">{selectedClaim.patient_id}</p>
              </div>
              <div>
                <p className="text-sm text-text-secondary">Service</p>
                <p className="font-medium text-text-primary">{selectedClaim.service_code}</p>
              </div>
              <div>
                <p className="text-sm text-text-secondary">Amount</p>
                <p className="font-medium text-text-primary">${selectedClaim.amount}</p>
              </div>
              <div>
                <p className="text-sm text-text-secondary">Clinic</p>
                <p className="font-medium text-text-primary">{selectedClaim.clinic}</p>
              </div>
              <div>
                <p className="text-sm text-text-secondary">Status</p>
                <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(selectedClaim.status)}`}>
                  {selectedClaim.status}
                </span>
              </div>
            </div>
          </div>
        )}
        
        {searchClaimId && !selectedClaim && (
          <div className="mt-6 p-4 border border-error rounded-lg bg-red-100 text-error">
            <p className="font-semibold">No claim found with ID: {searchClaimId}</p>
          </div>
        )}
      </div>

      {/* My Claims History */}
      <div className="bg-white rounded-lg shadow-lg p-6 border border-border-color">
        <h3 className="text-2xl font-semibold mb-4 text-text-primary">My Claims History</h3>
        {claims.length === 0 ? (
          <p className="text-text-secondary">No claims found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full table-auto">
              <thead>
                <tr className="bg-secondary">
                  <th className="px-6 py-3 text-left text-text-primary font-semibold">Claim ID</th>
                  <th className="px-6 py-3 text-left text-text-primary font-semibold">Service</th>
                  <th className="px-6 py-3 text-left text-text-primary font-semibold">Clinic</th>
                  <th className="px-6 py-3 text-left text-text-primary font-semibold">Amount</th>
                  <th className="px-6 py-3 text-left text-text-primary font-semibold">Date</th>
                  <th className="px-6 py-3 text-left text-text-primary font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {claims.map((claim) => (
                  <tr key={claim.claim_id} className="border-t border-border-color hover:bg-gray-50">
                    <td className="px-6 py-4">{claim.claim_id}</td>
                    <td className="px-6 py-4">{claim.service_code}</td>
                    <td className="px-6 py-4">{claim.clinic}</td>
                    <td className="px-6 py-4">${claim.amount}</td>
                    <td className="px-6 py-4">{claim.date}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(claim.status)}`}>
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
      <div className="bg-white rounded-lg shadow-lg p-6 border border-border-color">
        <h3 className="text-2xl font-semibold mb-4 text-text-primary">Verified Clinics Directory</h3>
        <div className="space-y-4">
          {clinics.map((clinic, index) => {
            const reputationPercentage = calculateReputationPercentage(clinic.reputation.success, clinic.reputation.total);
            
            return (
              <div key={index} className="border border-border-color rounded-lg p-4 bg-secondary">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h4 className="font-semibold text-lg text-text-primary">{clinic.name}</h4>
                    <p className="text-sm text-text-secondary">Address: {clinic.address}</p>
                    
                    <div className="mt-2 flex items-center space-x-4">
                      <div className="flex items-center">
                        {clinic.isVerified ? (
                          <span className="bg-success text-white px-3 py-1 rounded-full text-sm font-semibold">
                            ✓ Verified
                          </span>
                        ) : (
                          <span className="bg-warning text-white px-3 py-1 rounded-full text-sm font-semibold">
                            ⏳ Pending Verification
                          </span>
                        )}
                      </div>
                      
                      {clinic.reputation.total > 0 && (
                        <div>
                          <span className="text-sm text-text-secondary">Success Rate: </span>
                          <span className={`font-medium ${getReputationColor(reputationPercentage)}`}>
                            {reputationPercentage}%
                          </span>
                          <span className="text-sm text-text-secondary">
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
      <div className="bg-white rounded-lg shadow-lg p-6 border border-border-color">
        <h3 className="text-2xl font-semibold mb-4 text-text-primary">Patient Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-text-secondary">Patient ID</p>
            <p className="font-medium text-text-primary">P001</p>
          </div>
          <div>
            <p className="text-sm text-text-secondary">Wallet Address</p>
            <p className="font-medium text-xs text-text-primary">{walletAddress}</p>
          </div>
          <div>
            <p className="text-sm text-text-secondary">Total Claims</p>
            <p className="font-medium text-text-primary">{claims.length}</p>
          </div>
          <div>
            <p className="text-sm text-text-secondary">Approved Claims</p>
            <p className="font-medium text-success">
              {claims.filter(c => c.status === 'Approved' || c.status === 'Payment Released').length}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PatientView;
