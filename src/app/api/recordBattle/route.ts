import { NextResponse } from "next/server";
import { ethers } from "ethers";
import { BLOCKNOGOTCHI_CONTRACT_ADDRESS } from "@/app/utils/config";
import BlocknogotchiContract from "@/contract/BlocknogotchiContract.json";

// Keep track of the last transaction for each battle pair
const battleTransactions = new Map<string, string>();

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { winnerTokenId, loserTokenId } = body;

    // Create a unique key for this battle pair (order doesn't matter)
    const battleKey = [winnerTokenId, loserTokenId].sort().join("-");

    // Check if we already have a transaction hash for this battle
    const existingTxHash = battleTransactions.get(battleKey);
    if (existingTxHash) {
      return NextResponse.json({
        success: true,
        transactionHash: existingTxHash,
        message: "Battle already recorded",
      });
    }

    // Initialize provider and wallet
    const provider = new ethers.JsonRpcProvider(
      "https://sepolia-rpc.scroll.io/"
    );
    const privateKey =
      "0c230509ed25afe2f168577b7b406ae6914431e2caa3a9babf42ec23518250ad";
    const wallet = new ethers.Wallet(privateKey, provider);

    // Initialize contract with signer
    const contract = new ethers.Contract(
      BLOCKNOGOTCHI_CONTRACT_ADDRESS,
      BlocknogotchiContract.abi,
      wallet
    );

    // Calculate experience
    const winnerExperience = 100;
    const loserExperience = 50;

    try {
      // Call the recordBattle function
      const tx = await contract.recordBattle(
        winnerTokenId,
        loserTokenId,
        winnerExperience,
        loserExperience
      );

      // Wait for transaction to be mined
      const receipt = await tx.wait();

      // Store the transaction hash for this battle
      battleTransactions.set(battleKey, receipt.hash);

      // Clean up old transactions after 5 minutes
      setTimeout(() => {
        battleTransactions.delete(battleKey);
      }, 5 * 60 * 1000);

      return NextResponse.json({
        success: true,
        transactionHash: receipt.hash,
      });
    } catch (error: any) {
      if (error.message?.includes("already known")) {
        // If the transaction is already known, wait briefly and check for the hash
        await new Promise((resolve) => setTimeout(resolve, 2000));
        const existingTxHash = battleTransactions.get(battleKey);
        if (existingTxHash) {
          return NextResponse.json({
            success: true,
            transactionHash: existingTxHash,
            message: "Battle already recorded",
          });
        }
      }
      throw error;
    }
  } catch (error: any) {
    console.error("Error recording battle:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Unknown error",
      },
      { status: 500 }
    );
  }
}
