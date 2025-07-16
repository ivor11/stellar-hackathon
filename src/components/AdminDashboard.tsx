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
      case 'Pending': return 'bg-yellow-100 text-yellow-800';
      case 'Approved': return 'bg-green-100 text-green-800';
      case 'Rejected': return 'bg-red-100 text-red-800';
      case 'Payment Released': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Admin Dashboard</h2>
      
      {/* Pending Claims */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-xl font-semibold mb-4">Pending Claims Review</h3>
        {pendingClaims.length === 0 ? (
          <p className="text-gray-500">No pending claims to review.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full table-auto">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-4 py-2 text-left">Claim ID</th>
                  <th className="px-4 py-2 text-left">Patient ID</th>
                  <th className="px-4 py-2 text-left">Clinic</th>
                  <th className="px-4 py-2 text-left">Service</th>
                  <th className="px-4 py-2 text-left">Amount</th>
                  <th className="px-4 py-2 text-left">Date</th>
                  <th className="px-4 py-2 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {pendingClaims.map((claim) => (
                  <tr key={claim.claim_id} className="border-t">
                    <td className="px-4 py-2">{claim.claim_id}</td>
                    <td className="px-4 py-2">{claim.patient_id}</td>
                    <td className="px-4 py-2">{claim.clinic}</td>
                    <td className="px-4 py-2">{claim.service_code}</td>
                    <td className="px-4 py-2">${claim.amount}</td>
                    <td className="px-4 py-2">{claim.date}</td>
                    <td className="px-4 py-2">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleApprove(claim.claim_id)}
                          className="bg-green-500 hover:bg-green-600 text-white py-1 px-3 rounded text-sm"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleReject(claim.claim_id)}
                          className="bg-red-500 hover:bg-red-600 text-white py-1 px-3 rounded text-sm"
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
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-xl font-semibold mb-4">Approved Claims - Payment Release</h3>
        {approvedClaims.length === 0 ? (
          <p className="text-gray-500">No approved claims pending payment release.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full table-auto">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-4 py-2 text-left">Claim ID</th>
                  <th className="px-4 py-2 text-left">Patient ID</th>
                  <th className="px-4 py-2 text-left">Clinic</th>
                  <th className="px-4 py-2 text-left">Amount</th>
                  <th className="px-4 py-2 text-left">Status</th>
                  <th className="px-4 py-2 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {approvedClaims.map((claim) => (
                  <tr key={claim.claim_id} className="border-t">
                    <td className="px-4 py-2">{claim.claim_id}</td>
                    <td className="px-4 py-2">{claim.patient_id}</td>
                    <td className="px-4 py-2">{claim.clinic}</td>
                    <td className="px-4 py-2">${claim.amount}</td>
                    <td className="px-4 py-2">
                      <span className={`px-2 py-1 rounded text-sm ${getStatusColor(claim.status)}`}>
                        {claim.status}
                      </span>
                    </td>
                    <td className="px-4 py-2">
                      {claim.status === 'Approved' && (
                        <button
                          onClick={() => handleRelease(claim.claim_id)}
                          className="bg-blue-500 hover:bg-blue-600 text-white py-1 px-3 rounded text-sm"
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
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-xl font-semibold mb-4">Clinic Verification</h3>
        {pendingClinics.length === 0 ? (
          <p className="text-gray-500">No clinics pending verification.</p>
        ) : (
          <div className="space-y-4">
            {pendingClinics.map((clinic, index) => (
              <div key={index} className="border rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="font-semibold">{clinic.name}</h4>
                    <p className="text-sm text-gray-600">Address: {clinic.address}</p>
                    <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-sm">
                      ⏳ Pending Verification
                    </span>
                  </div>
                  <button
                    onClick={() => handleVerifyClinic(clinic.address)}
                    className="bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded"
                  >
                    Verify Clinic
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* System Statistics */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-xl font-semibold mb-4">System Statistics</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-600">{pendingClaims.length}</p>
            <p className="text-sm text-gray-600">Pending Claims</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">{approvedClaims.length}</p>
            <p className="text-sm text-gray-600">Approved Claims</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-yellow-600">{pendingClinics.length}</p>
            <p className="text-sm text-gray-600">Pending Clinics</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-purple-600">
              ${approvedClaims.reduce((sum, claim) => sum + claim.amount, 0)}
            </p>
            <p className="text-sm text-gray-600">Total Value</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;