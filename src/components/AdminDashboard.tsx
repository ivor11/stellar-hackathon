import React, { useState } from 'react';
import { DashboardProps, Claim, ClinicInfo } from '../types';

function AdminDashboard({ walletAddress }: DashboardProps): JSX.Element {
  const [pendingClaims, setPendingClaims] = useState<Claim[]>([
    { claim_id: 1, patient_id: 'P001', service_code: 'CHECKUP', amount: 100, clinic: 'City Health Clinic', date: '2024-01-15', status: 'Pending' },
    { claim_id: 2, patient_id: 'P002', service_code: 'SURGERY', amount: 5000, clinic: 'Metro Hospital', date: '2024-01-16', status: 'Pending' },
    { claim_id: 3, patient_id: 'P003', service_code: 'CONSULTATION', amount: 75, clinic: 'Community Health Center', date: '2024-01-14', status: 'Pending' }
  ]);

  const [approvedClaims, setApprovedClaims] = useState<Claim[]>([]);
  const [pendingClinics, setPendingClinics] = useState<ClinicInfo[]>([
    { name: 'Community Health Center', address: 'GZZZ...ZZZZ', isVerified: false, reputation: { success: 0, total: 0 } }
  ]);

  const handleApprove = async (claimId: number): Promise<void> => {
    try {
      // TODO: Integrate with smart contract
      console.log('Approving claim:', claimId);
      
      const claimToApprove = pendingClaims.find(claim => claim.claim_id === claimId);
      if (claimToApprove) {
        const updatedClaim: Claim = { ...claimToApprove, status: 'Approved' };
        setPendingClaims(prev => prev.filter(claim => claim.claim_id !== claimId));
        setApprovedClaims(prev => [...prev, updatedClaim]);
      }
    } catch (error) {
      console.error('Approval failed:', error);
    }
  };

  const handleReject = async (claimId: number): Promise<void> => {
    try {
      // TODO: Integrate with smart contract
      console.log('Rejecting claim:', claimId);
      
      setPendingClaims(prev => prev.filter(claim => claim.claim_id !== claimId));
    } catch (error) {
      console.error('Rejection failed:', error);
    }
  };

  const handleRelease = async (claimId: number): Promise<void> => {
    try {
      // TODO: Integrate with smart contract
      console.log('Releasing payment for claim:', claimId);
      
      setApprovedClaims(prev => 
        prev.map(claim => 
          claim.claim_id === claimId 
            ? { ...claim, status: 'Payment Released' }
            : claim
        )
      );
    } catch (error) {
      console.error('Payment release failed:', error);
    }
  };

  const handleVerifyClinic = async (clinicAddress: string): Promise<void> => {
    try {
      // TODO: Integrate with smart contract
      console.log('Verifying clinic:', clinicAddress);
      
      setPendingClinics(prev => prev.filter(clinic => clinic.address !== clinicAddress));
    } catch (error) {
      console.error('Clinic verification failed:', error);
    }
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
      <h2 className="text-4xl font-bold text-text-primary">Admin Dashboard</h2>
      
      {/* System Statistics */}
      <div className="bg-white rounded-lg shadow-lg p-6 border border-border-color">
        <h3 className="text-2xl font-semibold mb-4 text-text-primary">System Statistics</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="text-center p-4 bg-secondary rounded-lg">
            <p className="text-4xl font-bold text-primary">{pendingClaims.length}</p>
            <p className="text-md text-text-secondary">Pending Claims</p>
          </div>
          <div className="text-center p-4 bg-secondary rounded-lg">
            <p className="text-4xl font-bold text-success">{approvedClaims.length}</p>
            <p className="text-md text-text-secondary">Approved Claims</p>
          </div>
          <div className="text-center p-4 bg-secondary rounded-lg">
            <p className="text-4xl font-bold text-warning">{pendingClinics.length}</p>
            <p className="text-md text-text-secondary">Pending Clinics</p>
          </div>
          <div className="text-center p-4 bg-secondary rounded-lg">
            <p className="text-4xl font-bold text-accent">
              ${approvedClaims.reduce((sum, claim) => sum + claim.amount, 0)}
            </p>
            <p className="text-md text-text-secondary">Total Value</p>
          </div>
        </div>
      </div>

      {/* Pending Claims */}
      <div className="bg-white rounded-lg shadow-lg p-6 border border-border-color">
        <h3 className="text-2xl font-semibold mb-4 text-text-primary">Pending Claims Review</h3>
        {pendingClaims.length === 0 ? (
          <p className="text-text-secondary">No pending claims to review.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full table-auto">
              <thead>
                <tr className="bg-secondary">
                  <th className="px-6 py-3 text-left text-text-primary font-semibold">Claim ID</th>
                  <th className="px-6 py-3 text-left text-text-primary font-semibold">Patient ID</th>
                  <th className="px-6 py-3 text-left text-text-primary font-semibold">Clinic</th>
                  <th className="px-6 py-3 text-left text-text-primary font-semibold">Service</th>
                  <th className="px-6 py-3 text-left text-text-primary font-semibold">Amount</th>
                  <th className="px-6 py-3 text-left text-text-primary font-semibold">Date</th>
                  <th className="px-6 py-3 text-left text-text-primary font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {pendingClaims.map((claim) => (
                  <tr key={claim.claim_id} className="border-t border-border-color hover:bg-gray-50">
                    <td className="px-6 py-4">{claim.claim_id}</td>
                    <td className="px-6 py-4">{claim.patient_id}</td>
                    <td className="px-6 py-4">{claim.clinic}</td>
                    <td className="px-6 py-4">{claim.service_code}</td>
                    <td className="px-6 py-4">${claim.amount}</td>
                    <td className="px-6 py-4">{claim.date}</td>
                    <td className="px-6 py-4">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleApprove(claim.claim_id)}
                          className="bg-success hover:bg-green-700 text-white py-2 px-4 rounded-lg text-sm transition-transform transform hover:scale-105"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleReject(claim.claim_id)}
                          className="bg-error hover:bg-red-700 text-white py-2 px-4 rounded-lg text-sm transition-transform transform hover:scale-105"
                        >
                          Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Approved Claims */}
      <div className="bg-white rounded-lg shadow-lg p-6 border border-border-color">
        <h3 className="text-2xl font-semibold mb-4 text-text-primary">Approved Claims - Payment Release</h3>
        {approvedClaims.length === 0 ? (
          <p className="text-text-secondary">No approved claims pending payment release.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full table-auto">
              <thead>
                <tr className="bg-secondary">
                  <th className="px-6 py-3 text-left text-text-primary font-semibold">Claim ID</th>
                  <th className="px-6 py-3 text-left text-text-primary font-semibold">Patient ID</th>
                  <th className="px-6 py-3 text-left text-text-primary font-semibold">Clinic</th>
                  <th className="px-6 py-3 text-left text-text-primary font-semibold">Amount</th>
                  <th className="px-6 py-3 text-left text-text-primary font-semibold">Status</th>
                  <th className="px-6 py-3 text-left text-text-primary font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {approvedClaims.map((claim) => (
                  <tr key={claim.claim_id} className="border-t border-border-color hover:bg-gray-50">
                    <td className="px-6 py-4">{claim.claim_id}</td>
                    <td className="px-6 py-4">{claim.patient_id}</td>
                    <td className="px-6 py-4">{claim.clinic}</td>
                    <td className="px-6 py-4">${claim.amount}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(claim.status)}`}>
                        {claim.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {claim.status === 'Approved' && (
                        <button
                          onClick={() => handleRelease(claim.claim_id)}
                          className="bg-primary hover:bg-blue-700 text-white py-2 px-4 rounded-lg text-sm transition-transform transform hover:scale-105"
                        >
                          Release Payment
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Clinic Verification */}
      <div className="bg-white rounded-lg shadow-lg p-6 border border-border-color">
        <h3 className="text-2xl font-semibold mb-4 text-text-primary">Clinic Verification</h3>
        {pendingClinics.length === 0 ? (
          <p className="text-text-secondary">No clinics pending verification.</p>
        ) : (
          <div className="space-y-4">
            {pendingClinics.map((clinic, index) => (
              <div key={index} className="border border-border-color rounded-lg p-4 bg-secondary">
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="font-semibold text-lg text-text-primary">{clinic.name}</h4>
                    <p className="text-sm text-text-secondary">Address: {clinic.address}</p>
                    <span className="bg-warning text-white px-3 py-1 rounded-full text-sm font-semibold mt-2 inline-block">
                      ⏳ Pending Verification
                    </span>
                  </div>
                  <button
                    onClick={() => handleVerifyClinic(clinic.address)}
                    className="bg-success hover:bg-green-700 text-white py-2 px-4 rounded-lg transition-transform transform hover:scale-105"
                  >
                    Verify Clinic
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminDashboard;