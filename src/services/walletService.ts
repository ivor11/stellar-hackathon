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
  async fundAccountOnFuturenet(accountId?: string): Promise<string> {
    try {
      const { address } = await freighterApi.getAddress();
      const targetAddress = accountId || address;
      
      if (!targetAddress) {
        throw new Error('No account address provided');
      }

      // Use Stellar's Futurenet friendbot
      const fundingUrl = `https://friendbot-futurenet.stellar.org/?addr=${targetAddress}`;
      const response = await fetch(fundingUrl, { method: 'GET' });
      
      if (!response.ok) {
        throw new Error(`Funding failed: ${response.statusText}`);
      }

      return `Account ${targetAddress} funded successfully on Futurenet`;
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to fund account');
    }
  }

  async checkContractHealth(): Promise<string> {
    try {
      const result = await contractService.checkContractHealth();
      if (!result.success) {
        throw new Error(result.error || 'Contract health check failed');
      }
      return result.result || 'Contract is healthy';
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Contract health check failed');
    }
  }

  async initializeContract(): Promise<string> {
    try {
      // Get current connected address
      const { address } = await freighterApi.getAddress();
      if (!address) {
        throw new Error('Wallet not connected');
      }

      const result = await contractService.initContract(
        address,
        this.signTransaction.bind(this)
      );

      if (!result.success) {
        throw new Error(result.error || 'Failed to initialize contract');
      }

      return result.transactionHash || 'Contract initialization successful';
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to initialize contract');
    }
  }

  async registerClinic(
    clinicAddress: string,
    name: string,
    licenseNumber: string
  ): Promise<string> {
    try {
      // First check if we're on the right network
      console.log('Checking wallet network configuration...');
      const networkInfo = await this.getNetwork();
      console.log('Wallet network:', networkInfo);
      
      // Verify the address is the same as connected wallet
      const { address: connectedAddress } = await freighterApi.getAddress();
      console.log('Connected wallet address:', connectedAddress);
      console.log('Clinic address parameter:', clinicAddress);
      
      if (connectedAddress !== clinicAddress) {
        console.warn('Address mismatch! Connected wallet address differs from clinic address parameter');
      }

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

  async getAllClaims() {
    try {
      const result = await contractService.getAllClaims();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to get all claims');
      }

      return result.result;
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to get all claims');
    }
  }

  async getClaimsByStatus(status: string) {
    try {
      const result = await contractService.getClaimsByStatus(status);
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to get claims by status');
      }

      return result.result;
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to get claims by status');
    }
  }

  async getClaimsByClinic(clinicAddress: string) {
    try {
      const result = await contractService.getClaimsByClinic(clinicAddress);
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to get claims by clinic');
      }

      return result.result;
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to get claims by clinic');
    }
  }
}

export const walletService = new FreighterWalletService();