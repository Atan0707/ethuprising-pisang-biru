/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";
import { Eip1193Provider, ethers } from "ethers";
import { BLOCKNOGOTCHI_CONTRACT_ADDRESS } from "@/app/utils/config";
import BlocknogotchiContract from "@/contract/BlocknogotchiContract.json";
import { useAppKitAccount, useAppKitProvider } from "@reown/appkit/react";
import { useEffect, useState } from "react";
import Image from "next/image";
// Define a type for our Pokemon data
interface PokemonData {
  tokenId: number;
  name: string;
  tokenURI: string;
  hp: number;
  baseDamage: number;
}

function Page() {
  const { address, isConnected } = useAppKitAccount();
  const { walletProvider } = useAppKitProvider("eip155");
  const [pokemonList, setPokemonList] = useState<PokemonData[]>([]);
  const [loading, setLoading] = useState(false);

  const getPokemonData = async () => {
    if (!address || !isConnected) return [];

    try {
      const provider = new ethers.BrowserProvider(
        walletProvider as Eip1193Provider
      );
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(
        BLOCKNOGOTCHI_CONTRACT_ADDRESS,
        BlocknogotchiContract.abi,
        signer
      );

      const ownedPokemon: PokemonData[] = [];

      // Loop through tokens 1-10
      for (let tokenId = 1; tokenId <= 10; tokenId++) {
        try {
          const owner = await contract.ownerOf(tokenId);

          if (owner.toLowerCase() === address.toLowerCase()) {
            const [
              name,
              _attribute,
              _rarity,
              _level,
              hp,
              baseDamage,
              _battleCount,
              _battleWins,
              _birthTime,
              _lastBattleTime,
              _claimed,
              _tokenOwner,
              tokenURI,
              _age,
              _experience,
              _hasEvolved,
            ] = await contract.getBlocknogotchi(tokenId);

            ownedPokemon.push({
              tokenId,
              name,
              tokenURI,
              hp: Number(hp),
              baseDamage: Number(baseDamage),
            });
          }
        } catch (error) {
          console.log("error: ", error);
          continue;
        }
      }

      return ownedPokemon;
    } catch (e) {
      console.log("error: ", e);
      return [];
    }
  };

  useEffect(() => {
    const fetchPokemon = async () => {
      setLoading(true);
      const data = await getPokemonData();
      setPokemonList(data);
      setLoading(false);
    };

    if (isConnected && address) {
      fetchPokemon();
    }
  }, [isConnected, address]); // Run when connection status or address changes

  // Add function to handle Pokémon selection
  const selectPokemon = (pokemon: PokemonData) => {
    // Encode the parameters for the URL
    const params = new URLSearchParams({
      imageUrl: pokemon.tokenURI,
      name: pokemon.name,
      baseDamage: pokemon.baseDamage.toString(),
      health: pokemon.hp.toString(),
      tokenId: pokemon.tokenId.toString(),
    });

    // Redirect to battle page with parameters
    window.location.href = `/battle?${params.toString()}`;
  };

  return (
    <div className="p-4">
      {loading ? (
        <div>Loading your Pokemon...</div>
      ) : (
        <div>
          <h1 className="text-2xl font-bold mb-4">
            Choose your Pokémon for battle
          </h1>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pokemonList.map((pokemon) => (
              <div
                key={pokemon.tokenId}
                className="border p-4 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
                onClick={() => selectPokemon(pokemon)}
              >
                <h2 className="text-xl font-bold">{pokemon.name}</h2>
                <img
                  src={pokemon.tokenURI}
                  alt={pokemon.name}
                  className="w-full h-48 object-cover"
                />
                <div className="mt-2">
                  <p>HP: {pokemon.hp}</p>
                  <p>Base Damage: {pokemon.baseDamage}</p>
                </div>
                <button className="mt-3 w-full bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded">
                  Select for Battle
                </button>
              </div>
            ))}
            {pokemonList.length === 0 && !loading && (
              <div>No Pokemon found</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default Page;
