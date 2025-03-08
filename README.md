# Blocknogotchi

Blocknogotchi is a blockchain-based digital monster fighting game with NFC card as your buddy. Fight together and be the best in the whole world.

![image](https://github.com/user-attachments/assets/252fe6c7-e293-451f-a938-efd36e096f41)

## Features

- **Mint NFT Pets**: Create unique virtual pets with different species and attributes
- **Arena**: Fight together with your buddy and be the best!
- **NFC Integration**: Use NFC cards to claim and interact with your pets
- **Marketplace**: Trade your NFT card in the marketplace

## Project Architechture 

![image](https://github.com/user-attachments/assets/807e0267-f680-402a-a19c-b679f73ed965)

- Contract Owner will mint the NFC and store the claim hash inside a NFC card
- User will claim the NFT via NFC with claim hash stored in it.
- All the data queried using The Graph

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- Yarn package manager
- MetaMask or compatible Ethereum wallet

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/blocknogotchi.git
cd blocknogotchi
```

2. Install dependencies:
```bash
yarn install
```

3. Run the development server:
```bash
yarn dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

## Contract

- NFT Contract - https://sepolia.scrollscan.com/address/0xb5960bda72dba8693c4376bca91c166e10cde75a
- Marketplace contract - https://sepolia.scrollscan.com/address/0xb5960bda72dba8693c4376bca91c166e10cde75a

## Subgraph

- NFT Contract Subgraph - https://thegraph.com/studio/subgraph/ethuprising/
- Marketplace Subgraph - https://thegraph.com/studio/subgraph/blockmon-marketplace/
- The Graph repo - https://github.com/Atan0707/ethuprising-thegraph

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Inspired by the classic Tamagotchi virtual pets
- Built with Next.js, Tailwind CSS, and Ethers.js
- Pokemon images stored on IPFS
