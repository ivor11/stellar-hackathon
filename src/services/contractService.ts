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

  public getContractAddress(): string {
    return CONTRACT_CONFIG.CONTRACT_ADDRESS;
  }

  async checkContractHealth(): Promise<ContractCallResult> {
    try {
      // Simple check to see if we can connect to the contract
      console.log('Checking contract health...');
      console.log('Contract address:', CONTRACT_CONFIG.CONTRACT_ADDRESS);
      console.log('Network:', CONTRACT_CONFIG.NETWORK_PASSPHRASE);
      console.log('RPC URL:', CONTRACT_CONFIG.SOROBAN_RPC_URL);
      
      const dummyKeypair = Keypair.random();
      const dummyAccount = new Account(dummyKeypair.publicKey(), '0');
      
      // Try a simple call to see if the contract exists
      const operation = this.contract.call('get_claim', nativeToScVal(999999, { type: 'u64' }));

      const transaction = new TransactionBuilder(dummyAccount, {
        fee: '100',
        networkPassphrase: CONTRACT_CONFIG.NETWORK_PASSPHRASE,
      })
        .addOperation(operation)
        .setTimeout(30)
        .build();

      const simulationResult = await this.sorobanRpc.simulateTransaction(transaction);
      
      console.log('Contract health check simulation result:', simulationResult);
      
      if ('error' in simulationResult) {
        // If error contains "not found" related to contract, contract doesn't exist
        const errorStr = simulationResult.error.toString();
        if (errorStr.includes('does not exist') || errorStr.includes('not found')) {
          return {
            success: false,
            error: 'Contract not found. Please check the contract address and ensure it is deployed.'
          };
        }
        // Other errors might be expected (like claim not found)
        return {
          success: true,
          result: 'Contract is reachable'
        };
      }
      
      return {
        success: true,
        result: 'Contract is healthy'
      };
    } catch (error) {
      console.error('Contract health check failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Contract health check failed'
      };
    }
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
        fee: '1000000', // Increase fee for contract operations
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
          throw new Error(`Account ${sourceAccount} not found on futurenet. Please ensure your wallet is funded with futurenet XLM from https://stellar.org/laboratory/#account-creator?network=futurenet`);
        }
        throw new Error(`Failed to build transaction: ${error.message}`);
      }
      // Handle non-Error objects that might have response data
      if ((error as any).response?.status === 404) {
        throw new Error(`Account ${sourceAccount} not found on futurenet. Please ensure your wallet is funded with futurenet XLM from https://stellar.org/laboratory/#account-creator?network=futurenet`);
      }
      throw new Error(`Failed to build transaction: Unknown error`);
    }
  }

  async initContract(
    admin: string,
    signTransaction: (xdr: string) => Promise<string>
  ): Promise<ContractCallResult> {
    try {
      console.log('Initializing contract...');
      
      const operation = this.contract.call(XDR_TYPES.INIT);

      const { transaction, simulationResult } = await this.buildAndSimulateTransaction(
        admin,
        operation
      );

      // Check simulation result for any issues
      if (simulationResult.error) {
        throw new Error(`Transaction simulation failed: ${simulationResult.error}`);
      }
      
      // Prepare the transaction with simulation results
      const preparedTransaction = rpc.assembleTransaction(transaction, simulationResult).build();

      const signedXDR = await signTransaction(preparedTransaction.toXDR());
      const signedTransaction = TransactionBuilder.fromXDR(
        signedXDR,
        CONTRACT_CONFIG.NETWORK_PASSPHRASE
      );

      const result = await this.sorobanRpc.sendTransaction(signedTransaction);
      
      // Check if transaction failed
      if (result.status === 'ERROR') {
        console.error('Contract initialization failed:', result.errorResult);
        throw new Error(`Contract initialization failed. Error: ${result.errorResult}`);
      }

      console.log('Contract initialized successfully');
      return {
        success: true,
        transactionHash: result.hash,
        result: true
      };
    } catch (error) {
      console.error('Contract initialization error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  async isContractInitialized(): Promise<boolean> {
    try {
      // Try to get the claim counter to see if contract is initialized
      const dummyKeypair = Keypair.random();
      const dummyAccount = new Account(dummyKeypair.publicKey(), '0');
      
      // We'll try to call a simple read operation to check if contract is initialized
      // Since there's no direct "isInitialized" method, we'll try to access storage
      const operation = this.contract.call('get_claim', nativeToScVal(1, { type: 'u64' }));

      const transaction = new TransactionBuilder(dummyAccount, {
        fee: '100',
        networkPassphrase: CONTRACT_CONFIG.NETWORK_PASSPHRASE,
      })
        .addOperation(operation)
        .setTimeout(30)
        .build();

      const simulationResult = await this.sorobanRpc.simulateTransaction(transaction);
      
      // If we get an error about claim not found, contract is initialized
      // If we get an error about storage not initialized, contract needs init
      if ('error' in simulationResult) {
        const errorStr = simulationResult.error.toString();
        if (errorStr.includes('claim not found') || errorStr.includes('Claim not found')) {
          return true; // Contract is initialized, just no claims exist
        }
        return false; // Likely not initialized
      }
      
      return true; // If simulation succeeds, contract is initialized
    } catch (error) {
      console.error('Error checking contract initialization:', error);
      return false;
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
      console.log('Expected network passphrase:', CONTRACT_CONFIG.NETWORK_PASSPHRASE);
      console.log('Expected RPC URL:', CONTRACT_CONFIG.SOROBAN_RPC_URL);
      
      // Validate inputs
      if (!clinicAddress || !name || !licenseNumber) {
        throw new Error('Missing required parameters for clinic registration');
      }
      
      // Validate address format
      try {
        new Address(clinicAddress);
      } catch (e) {
        throw new Error(`Invalid clinic address format: ${clinicAddress}`);
      }
      
      // Create operation with explicit typing
      console.log('Creating contract operation...');
      const operation = this.contract.call(
        XDR_TYPES.REGISTER_CLINIC,
        new Address(clinicAddress).toScVal(),
        nativeToScVal(name, { type: 'string' }),
        nativeToScVal(licenseNumber, { type: 'string' })
      );
      console.log('Contract operation created successfully');

      console.log('Building and simulating transaction...');
      const { transaction, simulationResult } = await this.buildAndSimulateTransaction(
        clinicAddress,
        operation
      );
      console.log('Transaction built and simulated successfully');
      
      // Check simulation result for any issues
      if (simulationResult.error) {
        throw new Error(`Transaction simulation failed: ${simulationResult.error}`);
      }
      
      // Prepare the transaction with simulation results
      const preparedTransaction = rpc.assembleTransaction(transaction, simulationResult).build();

      console.log('Requesting transaction signature...');
      const signedXDR = await signTransaction(preparedTransaction.toXDR());
      console.log('Transaction signed successfully');
      
      const signedTransaction = TransactionBuilder.fromXDR(
        signedXDR,
        CONTRACT_CONFIG.NETWORK_PASSPHRASE
      );

      console.log('Submitting transaction to network...');
      const result = await this.sorobanRpc.sendTransaction(signedTransaction);
      console.log('Transaction submitted successfully:', result);
      
      // Check if transaction failed
      if (result.status === 'ERROR') {
        console.error('Transaction failed with error result:', result.errorResult);
        let errorMessage = 'Transaction failed';
        
        try {
          // Try to decode the error result for more information
          if (result.errorResult) {
            console.error('Raw error result:', result.errorResult);
            // Check if it's a contract error
            if (result.errorResult && typeof result.errorResult === 'object') {
              // Try to extract meaningful error information
              const errorStr = JSON.stringify(result.errorResult, null, 2);
              console.error('Error result details:', errorStr);
              
              // Check for common error patterns
              if (errorStr.includes('InsufficientBalance') || errorStr.includes('insufficient_balance')) {
                errorMessage = 'Insufficient balance. Please fund your account with XLM on Futurenet: https://stellar.org/laboratory/#account-creator?network=futurenet';
              } else if (errorStr.includes('txMalformed') || errorStr.includes('malformed')) {
                errorMessage = 'Transaction is malformed. This could be due to incorrect parameters or network mismatch. Make sure Freighter is connected to Futurenet network.';
              } else if (errorStr.includes('storage') || errorStr.includes('Storage')) {
                errorMessage = 'Contract storage error. The contract may not be properly initialized.';
              } else if (errorStr.includes('auth') || errorStr.includes('Auth') || errorStr.includes('require_auth')) {
                errorMessage = 'Authorization failed. Make sure you\'re using the correct wallet address and that Freighter is connected to Futurenet.';
              } else if (errorStr.includes('account') || errorStr.includes('Account')) {
                errorMessage = 'Account error. Your account may not be funded on Futurenet. Please fund it at: https://stellar.org/laboratory/#account-creator?network=futurenet';
              } else {
                errorMessage = `Transaction failed. Details: ${errorStr}`;
              }
            } else {
              errorMessage = `Transaction failed. Error code: ${result.errorResult}`;
            }
          }
        } catch (decodeError) {
          console.error('Failed to decode error result:', decodeError);
        }
        
        // Also check if this might be a contract initialization issue
        if (result.errorResult && JSON.stringify(result.errorResult).includes('storage')) {
          errorMessage += '\n\nThis might be a contract initialization issue. The contract may need to be initialized first.';
        }
        
        // Try to provide more specific error information
        if (result.errorResult) {
          try {
            // Look for common error patterns
            const errorStr = JSON.stringify(result.errorResult);
            if (errorStr.includes('invoke_host_function')) {
              errorMessage += '\n\nContract invocation failed. This might be due to invalid parameters or contract logic.';
            }
            if (errorStr.includes('insufficient_balance')) {
              errorMessage += '\n\nInsufficient balance to pay transaction fees.';
            }
            if (errorStr.includes('auth_not_required')) {
              errorMessage += '\n\nAuthorization issue. Make sure the wallet is properly connected.';
            }
          } catch (e) {
            // Ignore JSON parsing errors
          }
        }
        
        throw new Error(errorMessage);
      }
      
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
      console.log('Submitting claim:', { clinic, patientId, serviceCode, amount });
      console.log('Expected network passphrase:', CONTRACT_CONFIG.NETWORK_PASSPHRASE);
      console.log('Expected RPC URL:', CONTRACT_CONFIG.SOROBAN_RPC_URL);
      
      // Validate inputs
      if (!clinic || !patientId || !serviceCode || amount <= 0) {
        throw new Error('Missing required parameters for claim submission');
      }
      
      // Validate address format
      try {
        new Address(clinic);
      } catch (e) {
        throw new Error(`Invalid clinic address format: ${clinic}`);
      }
      
      // Create operation with explicit typing
      console.log('Creating contract operation...');
      const operation = this.contract.call(
        XDR_TYPES.SUBMIT_CLAIM,
        new Address(clinic).toScVal(),
        nativeToScVal(patientId, { type: 'string' }),
        nativeToScVal(serviceCode, { type: 'string' }),
        nativeToScVal(BigInt(amount * 10000000), { type: 'i128' }) // Convert to stroops (7 decimal places)
      );
      console.log('Contract operation created successfully');

      console.log('Building and simulating transaction...');
      const { transaction, simulationResult } = await this.buildAndSimulateTransaction(
        clinic,
        operation
      );
      console.log('Transaction built and simulated successfully');
      
      // Check simulation result for any issues
      if (simulationResult.error) {
        throw new Error(`Transaction simulation failed: ${simulationResult.error}`);
      }
      
      // Prepare the transaction with simulation results
      const preparedTransaction = rpc.assembleTransaction(transaction, simulationResult).build();
      console.log('Transaction prepared successfully');

      console.log('Signing transaction...');
      const signedXDR = await signTransaction(preparedTransaction.toXDR());
      const signedTransaction = TransactionBuilder.fromXDR(
        signedXDR,
        CONTRACT_CONFIG.NETWORK_PASSPHRASE
      );
      console.log('Transaction signed successfully');

      console.log('Submitting signed transaction...');
      const result = await this.sorobanRpc.sendTransaction(signedTransaction);
      console.log('Submit transaction result:', result);
      
      // Check for transaction errors
      if ('error' in result) {
        console.error('Transaction submission error:', result.error);
        throw new Error(`Transaction submission failed: ${result.error}`);
      }
      
      // Check if transaction failed
      if ('error' in result || (result as any).status === 'ERROR' || (result as any).status === 'FAILED') {
        console.error('Transaction failed with status:', (result as any).status);
        
        let errorMessage = 'Transaction failed';
        
        // Try to decode error details
        try {
          const errorResult = (result as any).errorResult;
          if (errorResult) {
            console.error('Transaction error result:', errorResult);
            const errorStr = JSON.stringify(errorResult);
            
            // Check for common error patterns
            if (errorStr.includes('InsufficientBalance') || errorStr.includes('insufficient_balance')) {
              errorMessage = 'Insufficient balance. Please fund your account with XLM on Futurenet: https://stellar.org/laboratory/#account-creator?network=futurenet';
            } else if (errorStr.includes('txMalformed') || errorStr.includes('malformed')) {
              errorMessage = 'Transaction is malformed. This could be due to incorrect parameters or network mismatch. Make sure Freighter is connected to Futurenet network.';
            } else if (errorStr.includes('storage') || errorStr.includes('Storage')) {
              errorMessage = 'Contract storage error. The contract may not be properly initialized.';
            } else if (errorStr.includes('auth') || errorStr.includes('Auth') || errorStr.includes('require_auth')) {
              errorMessage = 'Authorization failed. Make sure you\'re using the correct wallet address and that Freighter is connected to Futurenet.';
            } else if (errorStr.includes('account') || errorStr.includes('Account')) {
              errorMessage = 'Account error. Your account may not be funded on Futurenet. Please fund it at: https://stellar.org/laboratory/#account-creator?network=futurenet';
            } else {
              errorMessage = `Transaction failed. Details: ${errorStr}`;
            }
          } else {
            errorMessage = `Transaction failed. Error code: ${(result as any).errorResult}`;
          }
        } catch (decodeError) {
          console.error('Failed to decode error result:', decodeError);
        }
        
        // Also check if this might be a contract initialization issue
        const errorResult = (result as any).errorResult;
        if (errorResult && JSON.stringify(errorResult).includes('storage')) {
          errorMessage += '\n\nThis might be a contract initialization issue. The contract may need to be initialized first.';
        }
        
        // Try to provide more specific error information
        if (errorResult) {
          try {
            // Look for common error patterns
            const errorStr = JSON.stringify(errorResult);
            if (errorStr.includes('invoke_host_function')) {
              errorMessage += '\n\nContract invocation failed. This might be due to invalid parameters or contract logic.';
            }
            if (errorStr.includes('insufficient_balance')) {
              errorMessage += '\n\nInsufficient balance to pay transaction fees.';
            }
            if (errorStr.includes('auth_not_required')) {
              errorMessage += '\n\nAuthorization issue. Make sure the wallet is properly connected.';
            }
          } catch (e) {
            // Ignore JSON parsing errors
          }
        }
        
        throw new Error(errorMessage);
      }

      return {
        success: true,
        transactionHash: result.hash,
        result: result.hash // Return transaction hash as claim ID reference
      };
    } catch (error) {
      console.error('Full submit claim error:', error);
      console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
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

      const { transaction, simulationResult } = await this.buildAndSimulateTransaction(
        admin,
        operation
      );

      // Check simulation result for any issues
      if (simulationResult.error) {
        throw new Error(`Transaction simulation failed: ${simulationResult.error}`);
      }
      
      // Prepare the transaction with simulation results
      const preparedTransaction = rpc.assembleTransaction(transaction, simulationResult).build();

      const signedXDR = await signTransaction(preparedTransaction.toXDR());
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

      const { transaction, simulationResult } = await this.buildAndSimulateTransaction(
        admin,
        operation
      );

      // Check simulation result for any issues
      if (simulationResult.error) {
        throw new Error(`Transaction simulation failed: ${simulationResult.error}`);
      }
      
      // Prepare the transaction with simulation results
      const preparedTransaction = rpc.assembleTransaction(transaction, simulationResult).build();

      const signedXDR = await signTransaction(preparedTransaction.toXDR());
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

      const { transaction, simulationResult } = await this.buildAndSimulateTransaction(
        admin,
        operation
      );

      // Check simulation result for any issues
      if (simulationResult.error) {
        throw new Error(`Transaction simulation failed: ${simulationResult.error}`);
      }
      
      // Prepare the transaction with simulation results
      const preparedTransaction = rpc.assembleTransaction(transaction, simulationResult).build();

      const signedXDR = await signTransaction(preparedTransaction.toXDR());
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

      const { transaction, simulationResult } = await this.buildAndSimulateTransaction(
        admin,
        operation
      );

      // Check simulation result for any issues
      if (simulationResult.error) {
        throw new Error(`Transaction simulation failed: ${simulationResult.error}`);
      }
      
      // Prepare the transaction with simulation results
      const preparedTransaction = rpc.assembleTransaction(transaction, simulationResult).build();

      const signedXDR = await signTransaction(preparedTransaction.toXDR());
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

      // Recursively convert BigInts to strings to avoid serialization errors in frontend
      const processValue = (value: any): any => {
        if (typeof value === 'bigint') {
          return value.toString();
        }
        if (Array.isArray(value)) {
          return value.map(processValue);
        }
        if (typeof value === 'object' && value !== null) {
          return Object.fromEntries(
            Object.entries(value).map(([key, val]) => [key, processValue(val)])
          );
        }
        return value;
      };

      const processedResult = processValue(result);
      
      return {
        success: true,
        result: processedResult
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

  // Get all claims by attempting to fetch claims from 1 to a reasonable limit
  async getAllClaims(): Promise<ContractCallResult> {
    try {
      const claims = [];
      const maxClaimsToCheck = 100; // Reasonable limit to avoid infinite loops
      let consecutiveFailures = 0;
      const maxConsecutiveFailures = 5; // Stop after 5 consecutive failures
      
      console.log('Fetching all claims...');
      
      for (let i = 1; i <= maxClaimsToCheck; i++) {
        try {
          const claimResult = await this.getClaim(i);
          if (claimResult.success && claimResult.result) {
            claims.push(claimResult.result);
            consecutiveFailures = 0; // Reset failure counter on success
            console.log(`Found claim ${i}:`, claimResult.result);
          } else {
            consecutiveFailures++;
            console.log(`Claim ${i} not found or failed to fetch`);
            
            // If we've had several consecutive failures, likely no more claims
            if (consecutiveFailures >= maxConsecutiveFailures) {
              console.log(`Stopping after ${maxConsecutiveFailures} consecutive failures`);
              break;
            }
          }
        } catch (error) {
          consecutiveFailures++;
          console.log(`Error fetching claim ${i}:`, error);
          
          // If we've had several consecutive failures, likely no more claims
          if (consecutiveFailures >= maxConsecutiveFailures) {
            console.log(`Stopping after ${maxConsecutiveFailures} consecutive failures`);
            break;
          }
        }
      }
      
      console.log(`Total claims found: ${claims.length}`);
      
      return {
        success: true,
        result: claims
      };
    } catch (error) {
      console.error('Error in getAllClaims:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get all claims'
      };
    }
  }

  // Get claims by status
  async getClaimsByStatus(status: string): Promise<ContractCallResult> {
    try {
      const allClaimsResult = await this.getAllClaims();
      
      if (!allClaimsResult.success) {
        return allClaimsResult;
      }
      
      console.log('Filtering claims by status:', status);
      console.log('All claims before filtering:', allClaimsResult.result);
      
      const filteredClaims = allClaimsResult.result.filter((claim: any) => {
        // Map contract status to frontend status
        let claimStatus = '';
        // The status from the contract might be an array like `['Pending']`
        const contractStatus = Array.isArray(claim.status) ? claim.status[0] : claim.status;

        if (contractStatus === 'Pending') claimStatus = 'Pending';
        else if (contractStatus === 'Approved') claimStatus = 'Approved';
        else if (contractStatus === 'Rejected') claimStatus = 'Rejected';
        else if (contractStatus === 'Released') claimStatus = 'Payment Released';
        
        console.log(`Claim ${claim.claim_id} has contract status: ${contractStatus}, mapped to: ${claimStatus}, looking for: ${status}`);
        
        return claimStatus === status;
      });
      
      console.log('Filtered claims:', filteredClaims);
      
      return {
        success: true,
        result: filteredClaims
      };
    } catch (error) {
      console.error('Error filtering claims by status:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get claims by status'
      };
    }
  }

  // Get claims by clinic address
  async getClaimsByClinic(clinicAddress: string): Promise<ContractCallResult> {
    try {
      const allClaimsResult = await this.getAllClaims();
      
      if (!allClaimsResult.success) {
        return allClaimsResult;
      }
      
      console.log('Filtering claims by clinic:', clinicAddress);
      console.log('All claims before filtering:', allClaimsResult.result);
      
      const filteredClaims = allClaimsResult.result.filter((claim: any) => {
        console.log(`Claim ${claim.claim_id} clinic: ${claim.clinic}, looking for: ${clinicAddress}`);
        return claim.clinic === clinicAddress;
      });
      
      console.log('Filtered claims for clinic:', filteredClaims);
      
      return {
        success: true,
        result: filteredClaims
      };
    } catch (error) {
      console.error('Error filtering claims by clinic:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get claims by clinic'
      };
    }
  }
}

export const contractService = new ContractService();
