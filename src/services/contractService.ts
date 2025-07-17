import {
  Contract,
  Address,
  nativeToScVal,
  scValToNative,
  TransactionBuilder,
  Account,
  Keypair,
  rpc,
} from '@stellar/stellar-sdk';
import { CONTRACT_CONFIG, XDR_TYPES } from '../config/contractConfig';

export interface ContractCallResult {
  success: boolean;
  result?: any;
  error?: string;
  transactionHash?: string;
}

export class ContractService {
  private sorobanRpc: rpc.Server;
  private contract: Contract;

  constructor() {
    this.sorobanRpc = new rpc.Server(CONTRACT_CONFIG.SOROBAN_RPC_URL);
    this.contract = new Contract(CONTRACT_CONFIG.CONTRACT_ADDRESS);
  }

  public getNetworkPassphrase(): string {
    return CONTRACT_CONFIG.NETWORK_PASSPHRASE;
  }

  private async buildAndSimulateTransaction(
    sourceAccount: string,
    operation: any
  ): Promise<{ transaction: any; simulationResult: any }> {
    try {
      console.log('Getting account info for:', sourceAccount);
      const account = await this.sorobanRpc.getAccount(sourceAccount);
      console.log('Account found:', account);
      
      const transactionBuilder = new TransactionBuilder(account, {
        fee: '100000', // 0.1 XLM as max fee (reduced from 1 XLM)
        networkPassphrase: CONTRACT_CONFIG.NETWORK_PASSPHRASE,
      }).setTimeout(300);

      transactionBuilder.addOperation(operation);
      const transaction = transactionBuilder.build();

      console.log('Simulating transaction...');
      const simulationResult = await this.sorobanRpc.simulateTransaction(transaction);
      console.log('Simulation result:', simulationResult);
      
      // For older SDK versions, we'll just check if the simulation has errors
      if ('error' in simulationResult) {
        throw new Error(`Simulation failed: ${simulationResult.error}`);
      }

      return { transaction, simulationResult };
    } catch (error) {
      console.error('Build transaction error:', error);
      if (error instanceof Error) {
        if (error.message.includes('account not found') || 
            error.message.includes('Account not found') ||
            (error as any).response?.status === 404) {
          throw new Error(`Account ${sourceAccount} not found on testnet. Please ensure your wallet is funded with testnet XLM from https://friendbot.stellar.org/`);
        }
        throw new Error(`Failed to build transaction: ${error.message}`);
      }
      // Handle non-Error objects that might have response data
      if ((error as any).response?.status === 404) {
        throw new Error(`Account ${sourceAccount} not found on testnet. Please ensure your wallet is funded with testnet XLM from https://friendbot.stellar.org/`);
      }
      throw new Error(`Failed to build transaction: Unknown error`);
    }
  }

  async registerClinic(
    clinicAddress: string,
    name: string,
    licenseNumber: string,
    signTransaction: (xdr: string) => Promise<string>
  ): Promise<ContractCallResult> {
    try {
      console.log('Registering clinic:', { clinicAddress, name, licenseNumber });
      
      // Create operation with explicit typing
      console.log('Creating contract operation...');
      const operation = this.contract.call(
        XDR_TYPES.REGISTER_CLINIC,
        new Address(clinicAddress).toScVal(),
        nativeToScVal(name),
        nativeToScVal(licenseNumber)
      );
      console.log('Contract operation created successfully');

      console.log('Building and simulating transaction...');
      const { transaction } = await this.buildAndSimulateTransaction(
        clinicAddress,
        operation
      );
      console.log('Transaction built and simulated successfully');

      console.log('Requesting transaction signature...');
      const signedXDR = await signTransaction(transaction.toXDR());
      console.log('Transaction signed successfully');
      
      const signedTransaction = TransactionBuilder.fromXDR(
        signedXDR,
        CONTRACT_CONFIG.NETWORK_PASSPHRASE
      );

      console.log('Submitting transaction to network...');
      const result = await this.sorobanRpc.sendTransaction(signedTransaction);
      console.log('Transaction submitted successfully:', result);
      
      return {
        success: true,
        transactionHash: result.hash,
        result: true
      };
    } catch (error) {
      console.error('Full registration error:', error);
      console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  async submitClaim(
    clinic: string,
    patientId: string,
    serviceCode: string,
    amount: number,
    signTransaction: (xdr: string) => Promise<string>
  ): Promise<ContractCallResult> {
    try {
      const operation = this.contract.call(
        XDR_TYPES.SUBMIT_CLAIM,
        new Address(clinic).toScVal(),
        nativeToScVal(patientId),
        nativeToScVal(serviceCode),
        nativeToScVal(BigInt(amount * 10000000)) // Convert to stroops (7 decimal places)
      );

      const { transaction } = await this.buildAndSimulateTransaction(
        clinic,
        operation
      );

      const signedXDR = await signTransaction(transaction.toXDR());
      const signedTransaction = TransactionBuilder.fromXDR(
        signedXDR,
        CONTRACT_CONFIG.NETWORK_PASSPHRASE
      );

      const result = await this.sorobanRpc.sendTransaction(signedTransaction);

      return {
        success: true,
        transactionHash: result.hash,
        result: result.hash // Return transaction hash as claim ID reference
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  async approveClaim(
    admin: string,
    claimId: number,
    signTransaction: (xdr: string) => Promise<string>
  ): Promise<ContractCallResult> {
    try {
      const operation = this.contract.call(
        XDR_TYPES.APPROVE_CLAIM,
        new Address(admin).toScVal(),
        nativeToScVal(claimId, { type: 'u64' })
      );

      const { transaction } = await this.buildAndSimulateTransaction(
        admin,
        operation
      );

      const signedXDR = await signTransaction(transaction.toXDR());
      const signedTransaction = TransactionBuilder.fromXDR(
        signedXDR,
        CONTRACT_CONFIG.NETWORK_PASSPHRASE
      );

      const result = await this.sorobanRpc.sendTransaction(signedTransaction);

      return {
        success: true,
        transactionHash: result.hash,
        result: true
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  async rejectClaim(
    admin: string,
    claimId: number,
    signTransaction: (xdr: string) => Promise<string>
  ): Promise<ContractCallResult> {
    try {
      const operation = this.contract.call(
        XDR_TYPES.REJECT_CLAIM,
        new Address(admin).toScVal(),
        nativeToScVal(claimId, { type: 'u64' })
      );

      const { transaction } = await this.buildAndSimulateTransaction(
        admin,
        operation
      );

      const signedXDR = await signTransaction(transaction.toXDR());
      const signedTransaction = TransactionBuilder.fromXDR(
        signedXDR,
        CONTRACT_CONFIG.NETWORK_PASSPHRASE
      );

      const result = await this.sorobanRpc.sendTransaction(signedTransaction);

      return {
        success: true,
        transactionHash: result.hash,
        result: true
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  async releaseClaim(
    admin: string,
    claimId: number,
    signTransaction: (xdr: string) => Promise<string>
  ): Promise<ContractCallResult> {
    try {
      const operation = this.contract.call(
        XDR_TYPES.RELEASE_CLAIM,
        new Address(admin).toScVal(),
        nativeToScVal(claimId, { type: 'u64' })
      );

      const { transaction } = await this.buildAndSimulateTransaction(
        admin,
        operation
      );

      const signedXDR = await signTransaction(transaction.toXDR());
      const signedTransaction = TransactionBuilder.fromXDR(
        signedXDR,
        CONTRACT_CONFIG.NETWORK_PASSPHRASE
      );

      const result = await this.sorobanRpc.sendTransaction(signedTransaction);

      return {
        success: true,
        transactionHash: result.hash,
        result: true
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  async verifyClinic(
    admin: string,
    clinicAddress: string,
    signTransaction: (xdr: string) => Promise<string>
  ): Promise<ContractCallResult> {
    try {
      const operation = this.contract.call(
        XDR_TYPES.VERIFY_CLINIC,
        new Address(admin).toScVal(),
        new Address(clinicAddress).toScVal()
      );

      const { transaction } = await this.buildAndSimulateTransaction(
        admin,
        operation
      );

      const signedXDR = await signTransaction(transaction.toXDR());
      const signedTransaction = TransactionBuilder.fromXDR(
        signedXDR,
        CONTRACT_CONFIG.NETWORK_PASSPHRASE
      );

      const result = await this.sorobanRpc.sendTransaction(signedTransaction);

      return {
        success: true,
        transactionHash: result.hash,
        result: true
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  // Read-only methods for querying contract state
  async getClaim(claimId: number): Promise<ContractCallResult> {
    try {
      // Create a dummy keypair for read-only operations
      const dummyKeypair = Keypair.random();
      const dummyAccount = new Account(dummyKeypair.publicKey(), '0');
      
      const operation = this.contract.call(
        XDR_TYPES.GET_CLAIM,
        nativeToScVal(claimId, { type: 'u64' })
      );

      const transaction = new TransactionBuilder(dummyAccount, {
        fee: '100',
        networkPassphrase: CONTRACT_CONFIG.NETWORK_PASSPHRASE,
      })
        .addOperation(operation)
        .setTimeout(30)
        .build();

      const simulationResult = await this.sorobanRpc.simulateTransaction(transaction);
      
      if ('error' in simulationResult) {
        throw new Error(`Contract call failed: ${simulationResult.error}`);
      }

      // Extract the result from simulation
      if (!simulationResult.result?.retval) {
        throw new Error('No result returned from contract');
      }
      
      const result = scValToNative(simulationResult.result.retval);
      
      return {
        success: true,
        result
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  async getClinicMetadata(clinicAddress: string): Promise<ContractCallResult> {
    try {
      // Create a dummy keypair for read-only operations
      const dummyKeypair = Keypair.random();
      const dummyAccount = new Account(dummyKeypair.publicKey(), '0');
      
      const operation = this.contract.call(
        XDR_TYPES.GET_CLINIC_METADATA,
        new Address(clinicAddress).toScVal()
      );

      const transaction = new TransactionBuilder(dummyAccount, {
        fee: '100',
        networkPassphrase: CONTRACT_CONFIG.NETWORK_PASSPHRASE,
      })
        .addOperation(operation)
        .setTimeout(30)
        .build();

      const simulationResult = await this.sorobanRpc.simulateTransaction(transaction);
      
      if ('error' in simulationResult) {
        throw new Error(`Contract call failed: ${simulationResult.error}`);
      }

      // Extract the result from simulation
      if (!simulationResult.result?.retval) {
        throw new Error('No result returned from contract');
      }
      
      const result = scValToNative(simulationResult.result.retval);
      
      return {
        success: true,
        result
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  async getClinicReputation(clinicAddress: string): Promise<ContractCallResult> {
    try {
      // Create a dummy keypair for read-only operations
      const dummyKeypair = Keypair.random();
      const dummyAccount = new Account(dummyKeypair.publicKey(), '0');
      
      const operation = this.contract.call(
        XDR_TYPES.GET_CLINIC_REPUTATION,
        new Address(clinicAddress).toScVal()
      );

      const transaction = new TransactionBuilder(dummyAccount, {
        fee: '100',
        networkPassphrase: CONTRACT_CONFIG.NETWORK_PASSPHRASE,
      })
        .addOperation(operation)
        .setTimeout(30)
        .build();

      const simulationResult = await this.sorobanRpc.simulateTransaction(transaction);
      
      if ('error' in simulationResult) {
        throw new Error(`Contract call failed: ${simulationResult.error}`);
      }

      // Extract the result from simulation
      if (!simulationResult.result?.retval) {
        throw new Error('No result returned from contract');
      }
      
      const result = scValToNative(simulationResult.result.retval);
      
      return {
        success: true,
        result
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }
}

export const contractService = new ContractService();
