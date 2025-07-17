import { Contract, rpc } from '@stellar/stellar-sdk';

const CONTRACT_ADDRESS = 'CABZ2OKOMLQWBVY7YMVVX7CH4QSYD4BNRVRZNOISC7TQRFF4MF2JUILN';
const SOROBAN_RPC_URL = 'https://soroban-testnet.stellar.org';

async function testContractConnection() {
  try {
    console.log('Testing contract connection...');
    console.log('Contract Address:', CONTRACT_ADDRESS);
    console.log('RPC URL:', SOROBAN_RPC_URL);
    
    const sorobanRpc = new rpc.Server(SOROBAN_RPC_URL);
    
    // Try to get contract data
    const contractDataResponse = await sorobanRpc.getContractData(
      CONTRACT_ADDRESS,
      'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
      rpc.Durability.Persistent
    );
    
    console.log('Contract data response:', contractDataResponse);
    console.log('✅ Contract is accessible!');
  } catch (error) {
    console.error('❌ Error testing contract:', error.message);
    
    // Try alternative approach - check if contract exists by calling getAccount
    try {
      const sorobanRpc = new rpc.Server(SOROBAN_RPC_URL);
      const account = await sorobanRpc.getAccount(CONTRACT_ADDRESS);
      console.log('Contract account exists:', account);
    } catch (accountError) {
      console.error('Contract account check failed:', accountError.message);
    }
  }
}

testContractConnection();