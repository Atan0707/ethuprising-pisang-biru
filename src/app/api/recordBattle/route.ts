import { NextResponse } from "next/server";
import { ethers } from "ethers";
import { BLOCKNOGOTCHI_CONTRACT_ADDRESS } from "@/app/utils/config";
import BlocknogotchiContract from "@/contract/BlocknogotchiContract.json";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { winnerTokenId, loserTokenId } = body;

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

    // Calculate experience (you can adjust these values)
    const winnerExperience = 100; // Winner gets more experience
    const loserExperience = 50; // Loser gets less experience

    // Call the recordBattle function
    const tx = await contract.recordBattle(
      winnerTokenId,
      loserTokenId,
      winnerExperience,
      loserExperience
    );

    // Wait for transaction to be mined
    const receipt = await tx.wait();

    return NextResponse.json({
      success: true,
      transactionHash: receipt.hash,
    });
  } catch (error) {
    console.error("Error recording battle:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
