import freighterApi from '@stellar/freighter-api';
import { contractService } from './contractService';

export interface WalletState {
  isConnected: boolean;
  publicKey: string | null;
  error: string | null;
}

export class FreighterWalletService {
  // Check if Freighter is installed
  async isFreighterInstalled(): Promise<boolean> {
    try {
      const { isConnected } = await freighterApi.isConnected();
      return isConnected;
    } catch (error) {
      return false;
    }
  }

  // Check if user has allowed connection
  async isAllowed(): Promise<boolean> {
    try {
      const { isAllowed } = await freighterApi.isAllowed();
      return isAllowed;
    } catch (error) {
      return false;
    }
  }

  // Connect to Freighter wallet
  async connect(): Promise<WalletState> {
    try {
      if (!await this.isFreighterInstalled()) {
        throw new Error('Freighter wallet is not installed. Please install it from freighter.app');
      }

      // Request access if not already allowed
      if (!await this.isAllowed()) {
        await freighterApi.setAllowed();
      }

      const { address } = await freighterApi.getAddress();
      return {
        isConnected: true,
        publicKey: address,
        error: null
      };
    } catch (error) {
      return {
        isConnected: false,
        publicKey: null,
        error: error instanceof Error ? error.message : 'Failed to connect to wallet'
      };
    }
  }

  // Sign a transaction (for smart contract integration)
  async signTransaction(xdr: string): Promise<string> {
    try {
      const { signedTxXdr } = await freighterApi.signTransaction(xdr, {
        networkPassphrase: contractService.getNetworkPassphrase(),
      });
      return signedTxXdr;
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to sign transaction');
    }
  }

  // Get network details
  async getNetwork(): Promise<string> {
    try {
      const { network } = await freighterApi.getNetwork();
      return network;
    } catch (error) {
      throw new Error('Failed to get network information');
    }
  }

  // Format Stellar address for display
  formatAddress(address: string): string {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-6)}`;
  }

  // Smart contract integration methods
  async registerClinic(
    clinicAddress: string,
    name: string,
    licenseNumber: string
  ): Promise<string> {
    try {
      const result = await contractService.registerClinic(
        clinicAddress,
        name,
        licenseNumber,
        this.signTransaction.bind(this)
      );

      if (!result.success) {
        throw new Error(result.error || 'Failed to register clinic');
      }

      return result.transactionHash || 'Registration successful';
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to register clinic');
    }
  }

  async submitClaim(
    clinic: string,
    patientId: string,
    serviceCode: string,
    amount: number
  ): Promise<string> {
    try {
      const result = await contractService.submitClaim(
        clinic,
        patientId,
        serviceCode,
        amount,
        this.signTransaction.bind(this)
      );

      if (!result.success) {
        throw new Error(result.error || 'Failed to submit claim');
      }

      return result.transactionHash || 'Claim submitted successfully';
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to submit claim');
    }
  }

  async approveClaim(admin: string, claimId: number): Promise<string> {
    try {
      const result = await contractService.approveClaim(
        admin,
        claimId,
        this.signTransaction.bind(this)
      );

      if (!result.success) {
        throw new Error(result.error || 'Failed to approve claim');
      }

      return result.transactionHash || 'Claim approved successfully';
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to approve claim');
    }
  }

  async rejectClaim(admin: string, claimId: number): Promise<string> {
    try {
      const result = await contractService.rejectClaim(
        admin,
        claimId,
        this.signTransaction.bind(this)
      );

      if (!result.success) {
        throw new Error(result.error || 'Failed to reject claim');
      }

      return result.transactionHash || 'Claim rejected successfully';
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to reject claim');
    }
  }

  async releaseClaim(admin: string, claimId: number): Promise<string> {
    try {
      const result = await contractService.releaseClaim(
        admin,
        claimId,
        this.signTransaction.bind(this)
      );

      if (!result.success) {
        throw new Error(result.error || 'Failed to release claim payment');
      }

      return result.transactionHash || 'Payment released successfully';
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to release claim payment');
    }
  }

  async verifyClinic(admin: string, clinicAddress: string): Promise<string> {
    try {
      const result = await contractService.verifyClinic(
        admin,
        clinicAddress,
        this.signTransaction.bind(this)
      );

      if (!result.success) {
        throw new Error(result.error || 'Failed to verify clinic');
      }

      return result.transactionHash || 'Clinic verified successfully';
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to verify clinic');
    }
  }

  // Read-only methods for querying contract state
  async getClaim(claimId: number) {
    try {
      const result = await contractService.getClaim(claimId);
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to get claim data');
      }

      return result.result;
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to get claim data');
    }
  }

  async getClinicMetadata(clinicAddress: string) {
    try {
      const result = await contractService.getClinicMetadata(clinicAddress);
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to get clinic metadata');
      }

      return result.result;
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to get clinic metadata');
    }
  }

  async getClinicReputation(clinicAddress: string) {
    try {
      const result = await contractService.getClinicReputation(clinicAddress);
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to get clinic reputation');
      }

      return result.result;
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to get clinic reputation');
    }
  }
}

export const walletService = new FreighterWalletService();