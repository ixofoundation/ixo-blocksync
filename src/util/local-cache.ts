import { getIxoSwap } from "../postgres/ixo_swap";
import { getTokenClassContractAddress } from "../postgres/token";

// Define in-memory caches
const tokenClassCache: Record<string, any> = {};
const ixoSwapCache: Record<string, any> = {};

/**
 * Local Cache for Token Class Contract Addresses
 * Will first check if in cache, then use it, otherwise attempt
 * query db for value, if value then update cache, otherwise return null
 */
export const getCachedTokenClassContractAddress = async (
  contractAddress: string
) => {
  if (tokenClassCache[contractAddress]) {
    return tokenClassCache[contractAddress];
  }

  const result = await getTokenClassContractAddress(contractAddress);
  if (result) {
    tokenClassCache[contractAddress] = result;
  }
  return result;
};

/**
 * Local Cache for Ixo Swap addresses
 * Will first check if in cache, then use it, otherwise attempt
 * query db for value, if value then update cache, otherwise return null
 */ export const getCachedIxoSwap = async (contractAddress: string) => {
  if (ixoSwapCache[contractAddress]) {
    return ixoSwapCache[contractAddress];
  }

  const result = await getIxoSwap(contractAddress);
  if (result) {
    ixoSwapCache[contractAddress] = result;
  }
  return result;
};
