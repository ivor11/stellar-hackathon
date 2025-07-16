import freighterApi from '@stellar/freighter-api';

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

  // Sign a transaction (for future smart contract integration)
  async signTransaction(xdr: string): Promise<string> {
    try {
      const { signedXDR } = await freighterApi.signTransaction(xdr);
      return signedXDR;
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

  // Placeholder methods for health insurance contract integration
  async registerClinic(
    clinicAddress: string,
    name: string,
    licenseNumber: string
  ): Promise<string> {
    // TODO: Implement smart contract call for clinic registration
    throw new Error('Smart contract integration pending');
  }

  async submitClaim(
    clinic: string,
    patientId: string,
    serviceCode: string,
    amount: number
  ): Promise<string> {
    // TODO: Implement smart contract call for claim submission
    throw new Error('Smart contract integration pending');
  }

  async approveClaim(admin: string, claimId: number): Promise<string> {
    // TODO: Implement smart contract call for claim approval
    throw new Error('Smart contract integration pending');
  }

  async rejectClaim(admin: string, claimId: number): Promise<string> {
    // TODO: Implement smart contract call for claim rejection
    throw new Error('Smart contract integration pending');
  }

  async releaseClaim(admin: string, claimId: number): Promise<string> {
    // TODO: Implement smart contract call for payment release
    throw new Error('Smart contract integration pending');
  }

  async verifyClinic(admin: string, clinicAddress: string): Promise<string> {
    // TODO: Implement smart contract call for clinic verification
    throw new Error('Smart contract integration pending');
  }
}

export const walletService = new FreighterWalletService();