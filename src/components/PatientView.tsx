import React, { useState, useEffect } from 'react';
import { DashboardProps, Claim, ClaimStatus } from '../types';
import { walletService } from '../services/walletService';

function PatientView({ walletAddress }: DashboardProps): JSX.Element {
  const [claims, setClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [searchClaimId, setSearchClaimId] = useState<string>('');
  const [selectedClaim, setSelectedClaim] = useState<Claim | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!walletAddress) return;

      setLoading(true);
      setError(null);

      try {
        const allClaimsResult = await walletService.getAllClaims();
        if (allClaimsResult) {
          const patientClaims = allClaimsResult
            .filter((c: any) => c.patient_id === walletAddress)
            .map((claim: any): Claim => {
              const contractStatus = Array.isArray(claim.status) ? claim.status[0] : claim.status;
              return {
                claim_id: claim.claim_id,
                patient_id: claim.patient_id,
                service_code: claim.service_code,
                amount: Number(claim.amount) / 10000000,
                clinic: claim.clinic,
                date: new Date(Number(claim.date) * 1000).toISOString().split('T')[0],
                status: contractStatus === 'Pending' ? 'Pending' :
                       contractStatus === 'Approved' ? 'Approved' :
                       contractStatus === 'Rejected' ? 'Rejected' :
                       contractStatus === 'Released' ? 'Payment Released' : 'Pending'
              };
            });
          setClaims(patientClaims);
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : 'An unknown error occurred.');
        console.error(e);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [walletAddress]);

  const searchClaim = async (): Promise<void> => {
    if (!searchClaimId) {
      setSelectedClaim(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const claimResult = await walletService.getClaim(parseInt(searchClaimId, 10));
      if (claimResult) {
        const contractStatus = Array.isArray(claimResult.status) ? claimResult.status[0] : claimResult.status;
        const formattedClaim: Claim = {
          claim_id: claimResult.claim_id,
          patient_id: claimResult.patient_id,
          service_code: claimResult.service_code,
          amount: Number(claimResult.amount) / 10000000,
          clinic: claimResult.clinic,
          date: new Date(Number(claimResult.date) * 1000).toISOString().split('T')[0],
          status: contractStatus === 'Pending' ? 'Pending' :
                 contractStatus === 'Approved' ? 'Approved' :
                 contractStatus === 'Rejected' ? 'Rejected' :
                 contractStatus === 'Released' ? 'Payment Released' : 'Pending'
        };
        setSelectedClaim(formattedClaim);
      } else {
        setSelectedClaim(null);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to search for claim.');
      setSelectedClaim(null);
    } finally {
      setLoading(false);
    }
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

  return (
    <div className="space-y-8">
      <h2 className="text-4xl font-bold text-text-primary">Patient Dashboard</h2>
      
      {loading && <p>Loading...</p>}
      {error && <p className="text-error">Error: {error}</p>}

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

      {/* Patient Information */}
      <div className="bg-white rounded-lg shadow-lg p-6 border border-border-color">
        <h3 className="text-2xl font-semibold mb-4 text-text-primary">Patient Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-text-secondary">Patient ID</p>
            <p className="font-medium text-text-primary">{walletAddress}</p>
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
