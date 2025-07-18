// Smart contract configuration
export const CONTRACT_CONFIG = {
  // This will be updated with the deployed contract address
  // For now using a placeholder - you'll need to deploy the contract and update this
  CONTRACT_ADDRESS: 'CDCXYE6JPZEQSE4ICAAQQNP2WYGXKPY2LV43YFLOZXQ6YA564QO4OSFM',
  
  // Soroban RPC URL for Futurenet
  SOROBAN_RPC_URL: 'https://rpc-futurenet.stellar.org',
  
  // Network passphrase for Futurenet
  NETWORK_PASSPHRASE: 'Test SDF Future Network ; October 2022',
  
  // Alternative for Testnet
  // SOROBAN_RPC_URL: 'https://soroban-testnet.stellar.org',
  // NETWORK_PASSPHRASE: 'Test SDF Network ; September 2015',
};

export const XDR_TYPES = {
  // Contract method names
  INIT: 'init',
  REGISTER_CLINIC: 'register_clinic',
  SUBMIT_CLAIM: 'submit_claim',
  APPROVE_CLAIM: 'approve_claim',
  REJECT_CLAIM: 'reject_claim',
  RELEASE_CLAIM: 'release_claim',
  VERIFY_CLINIC: 'verify_clinic',
  GET_CLAIM: 'get_claim',
  GET_CLINIC_METADATA: 'get_clinic_metadata',
  GET_CLINIC_REPUTATION: 'get_clinic_reputation',
};
