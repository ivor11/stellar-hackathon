import { useState, useEffect } from 'react';
import { DashboardProps, Claim, ClinicInfo } from '../types';
import { walletService } from '../services/walletService';

function AdminDashboard({ walletAddress }: DashboardProps) {
  const [pendingClaims, setPendingClaims] = useState<Claim[]>([]);
  const [approvedClaims, setApprovedClaims] = useState<Claim[]>([]);
  const [clinicToVerify, setClinicToVerify] = useState<string>('');
  const [clinicMetadata, setClinicMetadata] = useState<{ [address: string]: any }>({});
  const [verifiedClinics, setVerifiedClinics] = useState<ClinicInfo[]>([]);
  const [loading, setLoading] = useState<{ [key: string]: boolean }>({});
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  // Fetch claims on component mount
  useEffect(() => {
    if (walletAddress) {
      fetchClaims();
    }
  }, [walletAddress]);

  const fetchClaims = async (): Promise<void> => {
    setLoading(prev => ({ ...prev, fetchClaims: true }));
    setError('');
    
    try {
      console.log('Fetching claims from contract...');
      
      // First, let's fetch all claims to see what we have
      const allClaimsResult = await walletService.getAllClaims();
      console.log('All claims result:', allClaimsResult);
      
      // Fetch pending claims
      const pendingClaimsResult = await walletService.getClaimsByStatus('Pending');
      console.log('Pending claims result:', pendingClaimsResult);
      
      // Fetch approved claims
      const approvedClaimsResult = await walletService.getClaimsByStatus('Approved');
      console.log('Approved claims result:', approvedClaimsResult);
      
      // Transform contract data to frontend format
      const transformClaim = (claim: any): Claim => {
        const contractStatus = Array.isArray(claim.status) ? claim.status[0] : claim.status;
        return {
          claim_id: claim.claim_id,
          patient_id: claim.patient_id,
          service_code: claim.service_code,
          amount: Number(claim.amount) / 10000000, // Convert from stroops
          clinic: claim.clinic, // This will be the address, we might want to resolve to name
          date: new Date(Number(claim.date) * 1000).toISOString().split('T')[0], // Convert timestamp
          status: contractStatus === 'Pending' ? 'Pending' as const : 
                 contractStatus === 'Approved' ? 'Approved' as const :
                 contractStatus === 'Rejected' ? 'Rejected' as const :
                 contractStatus === 'Released' ? 'Payment Released' as const : 'Pending' as const
        };
      };
      
      const transformedPending = Array.isArray(pendingClaimsResult) ? pendingClaimsResult.map(transformClaim) : [];
      const transformedApproved = Array.isArray(approvedClaimsResult) ? approvedClaimsResult.map(transformClaim) : [];
      
      setPendingClaims(transformedPending);
      setApprovedClaims(transformedApproved);

      if (allClaimsResult) {
        const uniqueClinicAddresses = [...new Set(allClaimsResult.map((c: any) => c.clinic))];
        const clinicPromises = uniqueClinicAddresses.map(async (address: any) => {
          try {
            const metadata = await walletService.getClinicMetadata(address);
            const reputation = await walletService.getClinicReputation(address);
            return {
              name: metadata.name,
              address: address,
              isVerified: metadata.is_verified,
              reputation: {
                success: Number(reputation.success_count),
                total: Number(reputation.success_count) + Number(reputation.failure_count),
              },
            };
          } catch (e) {
            console.error(`Failed to fetch info for clinic ${address}`, e);
            return null;
          }
        });

        const clinicsData = (await Promise.all(clinicPromises)).filter(c => c) as ClinicInfo[];
        setVerifiedClinics(clinicsData);
      }
      
      // Show success message if claims were found
      if (transformedPending.length > 0 || transformedApproved.length > 0) {
        setSuccess(`Found ${transformedPending.length} pending and ${transformedApproved.length} approved claims`);
      } else {
        setSuccess('No claims found in the contract yet');
      }
    } catch (error) {
      console.error('Failed to fetch claims:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch claims');
    } finally {
      setLoading(prev => ({ ...prev, fetchClaims: false }));
    }
  };

  const handleApprove = async (claimId: number): Promise<void> => {
    setLoading(prev => ({ ...prev, [`approve_${claimId}`]: true }));
    setError('');
    
    try {
      const result = await walletService.approveClaim(walletAddress, claimId);
      console.log('Approval successful:', result);
      
      // Refresh claims to get updated data from contract
      await fetchClaims();
      setSuccess(`Claim ${claimId} approved successfully!`);
    } catch (error) {
      console.error('Approval failed:', error);
      setError(error instanceof Error ? error.message : 'Approval failed');
    } finally {
      setLoading(prev => ({ ...prev, [`approve_${claimId}`]: false }));
    }
  };

  const handleReject = async (claimId: number): Promise<void> => {
    setLoading(prev => ({ ...prev, [`reject_${claimId}`]: true }));
    setError('');
    
    try {
      const result = await walletService.rejectClaim(walletAddress, claimId);
      console.log('Rejection successful:', result);
      
      // Refresh claims to get updated data from contract
      await fetchClaims();
      setSuccess(`Claim ${claimId} rejected successfully!`);
    } catch (error) {
      console.error('Rejection failed:', error);
      setError(error instanceof Error ? error.message : 'Rejection failed');
    } finally {
      setLoading(prev => ({ ...prev, [`reject_${claimId}`]: false }));
    }
  };

  const handleRelease = async (claimId: number): Promise<void> => {
    setLoading(prev => ({ ...prev, [`release_${claimId}`]: true }));
    setError('');
    
    try {
      const result = await walletService.releaseClaim(walletAddress, claimId);
      console.log('Payment release successful:', result);
      
      // Refresh claims to get updated data from contract
      await fetchClaims();
      setSuccess(`Payment for claim ${claimId} released successfully!`);
    } catch (error) {
      console.error('Payment release failed:', error);
      setError(error instanceof Error ? error.message : 'Payment release failed');
    } finally {
      setLoading(prev => ({ ...prev, [`release_${claimId}`]: false }));
    }
  };

  const handleVerifyClinic = async (clinicAddress: string): Promise<void> => {
    setLoading(prev => ({ ...prev, [`verify_${clinicAddress}`]: true }));
    setError('');
    
    try {
      const result = await walletService.verifyClinic(walletAddress, clinicAddress);
      console.log('Clinic verification successful:', result);
      setSuccess(`Clinic ${clinicAddress} verified successfully!`);
      
      // Update the clinic's verification status in local state
      setClinicMetadata(prev => ({
        ...prev,
        [clinicAddress]: {
          ...prev[clinicAddress],
          metadata: {
            ...prev[clinicAddress].metadata,
            is_verified: true
          }
        }
      }));
    } catch (error) {
      console.error('Clinic verification failed:', error);
      setError(error instanceof Error ? error.message : 'Clinic verification failed');
    } finally {
      setLoading(prev => ({ ...prev, [`verify_${clinicAddress}`]: false }));
    }
  };

  const handleFetchClinicMetadata = async (): Promise<void> => {
    if (!clinicToVerify.trim()) {
      setError('Please enter a clinic address');
      return;
    }

    setLoading(prev => ({ ...prev, [`fetch_${clinicToVerify}`]: true }));
    setError('');
    
    try {
      const metadata = await walletService.getClinicMetadata(clinicToVerify);
      const reputation = await walletService.getClinicReputation(clinicToVerify);
      
      setClinicMetadata(prev => ({
        ...prev,
        [clinicToVerify]: {
          metadata,
          reputation,
          address: clinicToVerify
        }
      }));
      
      setClinicToVerify('');
      setSuccess('Clinic metadata fetched successfully!');
    } catch (error) {
      console.error('Failed to fetch clinic metadata:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch clinic metadata');
    } finally {
      setLoading(prev => ({ ...prev, [`fetch_${clinicToVerify}`]: false }));
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
      
      {error && (
        <div className="bg-error text-white px-6 py-4 rounded-lg shadow-md">
          <p className="font-semibold">{error}</p>
        </div>
      )}

      {success && (
        <div className="bg-success text-white px-6 py-4 rounded-lg shadow-md">
          <p className="font-semibold">{success}</p>
        </div>
      )}

      {/* Contract Management - REMOVED as requested */}
      
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
            <p className="text-4xl font-bold text-warning">{Object.keys(clinicMetadata).length}</p>
            <p className="text-md text-text-secondary">Clinics to Verify</p>
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
                          disabled={loading[`approve_${claim.claim_id}`]}
                          className="bg-success hover:bg-green-700 disabled:bg-green-300 text-white py-2 px-4 rounded-lg text-sm transition-transform transform hover:scale-105"
                        >
                          {loading[`approve_${claim.claim_id}`] ? 'Approving...' : 'Approve'}
                        </button>
                        <button
                          onClick={() => handleReject(claim.claim_id)}
                          disabled={loading[`reject_${claim.claim_id}`]}
                          className="bg-error hover:bg-red-700 disabled:bg-red-300 text-white py-2 px-4 rounded-lg text-sm transition-transform transform hover:scale-105"
                        >
                          {loading[`reject_${claim.claim_id}`] ? 'Rejecting...' : 'Reject'}
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
                  <th className="px-6 py-3 text-left text-text-primary font-semibold">Service</th>
                  <th className="px-6 py-3 text-left text-text-primary font-semibold">Amount</th>
                  <th className="px-6 py-3 text-left text-text-primary font-semibold">Date</th>
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
                    <td className="px-6 py-4">{claim.service_code}</td>
                    <td className="px-6 py-4">${claim.amount}</td>
                    <td className="px-6 py-4">{claim.date}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(claim.status)}`}>
                        {claim.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleRelease(claim.claim_id)}
                        disabled={loading[`release_${claim.claim_id}`]}
                        className="bg-primary hover:bg-blue-700 disabled:bg-blue-300 text-white py-2 px-4 rounded-lg text-sm transition-transform transform hover:scale-105"
                      >
                        {loading[`release_${claim.claim_id}`] ? 'Releasing...' : 'Release Payment'}
                      </button>
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
        
        {/* Add Clinic for Verification */}
        <div className="mb-6 p-4 bg-secondary rounded-lg">
          <h4 className="text-lg font-semibold mb-3 text-text-primary">Add Clinic for Verification</h4>
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              value={clinicToVerify}
              onChange={(e) => setClinicToVerify(e.target.value)}
              placeholder="Enter clinic Stellar address (e.g., GXXX...)"
              className="flex-1 px-4 py-2 border border-border-color rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
            <button
              onClick={handleFetchClinicMetadata}
              disabled={loading[`fetch_${clinicToVerify}`] || !clinicToVerify.trim()}
              className="bg-accent text-white px-6 py-2 rounded-lg hover:bg-primary transition duration-200 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading[`fetch_${clinicToVerify}`] ? 'Fetching...' : 'Fetch Clinic Info'}
            </button>
          </div>
          <p className="text-sm text-text-secondary mt-2">
            Enter a Stellar address to fetch clinic information and add it to the verification queue.
          </p>
        </div>

        {/* Clinics Pending Verification */}
        {Object.keys(clinicMetadata).length === 0 ? (
          <p className="text-text-secondary">No clinics pending verification. Add a clinic address above to get started.</p>
        ) : (
          <div className="space-y-4">
            {Object.entries(clinicMetadata).map(([address, data]) => (
              <div key={address} className="border border-border-color rounded-lg p-4 bg-secondary">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h4 className="font-semibold text-lg text-text-primary">{data.metadata.name}</h4>
                    <p className="text-sm text-text-secondary mb-1">Address: {address}</p>
                    <p className="text-sm text-text-secondary mb-1">License: {data.metadata.license_number}</p>
                    <p className="text-sm text-text-secondary mb-2">
                      Registration Date: {new Date(Number(data.metadata.registration_date) * 1000).toLocaleDateString()}
                    </p>
                    <div className="flex items-center gap-4 mb-2">
                      <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                        data.metadata.is_verified 
                          ? 'bg-success text-white' 
                          : 'bg-warning text-white'
                      }`}>
                        {data.metadata.is_verified ? '✓ Verified' : '⏳ Pending Verification'}
                      </span>
                      <span className="text-sm text-text-secondary">
                        Reputation: {data.reputation.success_count} success / {data.reputation.failure_count} failures
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    {!data.metadata.is_verified && (
                      <button
                        onClick={() => handleVerifyClinic(address)}
                        disabled={loading[`verify_${address}`]}
                        className="bg-success hover:bg-green-700 disabled:bg-green-300 text-white py-2 px-4 rounded-lg transition-transform transform hover:scale-105"
                      >
                        {loading[`verify_${address}`] ? 'Verifying...' : 'Verify Clinic'}
                      </button>
                    )}
                    <button
                      onClick={() => setClinicMetadata(prev => {
                        const updated = { ...prev };
                        delete updated[address];
                        return updated;
                      })}
                      className="bg-gray-500 hover:bg-gray-600 text-white py-1 px-3 rounded text-sm"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Verified Clinics Directory */}
      <div className="bg-white rounded-lg shadow-lg p-6 border border-border-color">
        <h3 className="text-2xl font-semibold mb-4 text-text-primary">Verified Clinics Directory</h3>
        <div className="space-y-4">
          {verifiedClinics.map((clinic, index) => {
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
    </div>
  );
}

export default AdminDashboard;