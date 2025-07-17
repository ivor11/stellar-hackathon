// Smart contract types
export interface Claim {
  claim_id: number;
  patient_id: string;
  service_code: string;
  amount: number;
  date: string;
  clinic: string;
  status: ClaimStatus;
}

export interface ClinicMetadata {
  name: string;
  license_number: string;
  registration_date: number;
  is_verified: boolean;
}

export interface Reputation {
  success_count: number;
  failure_count: number;
}

export type ClaimStatus = 'Pending' | 'Approved' | 'Rejected' | 'Payment Released';

export type UserType = 'clinic' | 'admin' | 'patient' | 'tester' | '';

// Form types
export interface ClinicRegistrationForm {
  name: string;
  licenseNumber: string;
}

export interface ClaimSubmissionForm {
  patientId: string;
  serviceCode: string;
  amount: string;
}

// Component prop types
export interface ConnectWalletProps {
  onConnect: (address: string) => void;
}

export interface DashboardProps {
  walletAddress: string;
}

// Clinic directory types
export interface ClinicInfo {
  name: string;
  address: string;
  isVerified: boolean;
  reputation: {
    success: number;
    total: number;
  };
}