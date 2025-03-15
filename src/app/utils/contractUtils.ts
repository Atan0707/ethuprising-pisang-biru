import { Eip1193Provider, ethers } from "ethers";
import Blocknogotchi from "@/contract/BlocknogotchiContract.json";
import { BLOCKNOGOTCHI_CONTRACT_ADDRESS } from "./config";


export const getSigner = async (walletProvider: Eip1193Provider) => {
    if (!walletProvider) {
      throw new Error('Wallet provider not available');
    }
    
    const provider = new ethers.BrowserProvider(walletProvider);
    return provider.getSigner();
  };

// Get the Blockmon contract instance
export const getBlockmonContract = async (signer?: ethers.Signer) => {
    if (!signer) {
      throw new Error('Signer not available');
    }
    
    return new ethers.Contract(BLOCKNOGOTCHI_CONTRACT_ADDRESS, Blocknogotchi.abi, signer);
  };

// Get the token ID from a hash
export const hashToId = async (hash: string, provider: Eip1193Provider) => {
    const signer = await getSigner(provider);
    const contract = await getBlockmonContract(signer);
    return contract.getTokenIdFromHash(hash);
  };