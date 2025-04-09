# [Blocknogotchi](https://www.blocknogotchi.fun/)

Blocknogotchi is a blockchain-based digital monster fighting game with NFC card as your buddy. Fight together and be the best in the whole world. 

Checkout here: [https://www.blocknogotchi.fun/](https://www.blocknogotchi.fun/)

![image](https://github.com/user-attachments/assets/3012dad3-4be4-40de-8456-24edf843d96b)

![image](https://github.com/user-attachments/assets/1b9ed62d-c5a7-4498-a5de-f1bcf0ef8cce)

![image](https://github.com/user-attachments/assets/dc142a12-9fc0-410d-b411-66b7e6071de8)

![image](https://github.com/user-attachments/assets/b95364e7-b2b6-4fbb-b364-c633fcc4d2e0)

## Features

- **Mint NFT Pets**: Create unique virtual pets with different species and attributes
- **Arena**: Fight together with your buddy and be the best!
- **NFC Integration**: Use NFC cards to claim and interact with your pets
- **P2P Swap**: Introducing Person-to-Person swap, where you need to swap your NFT physically
- **Community Fund**: Community fund is sourced from NFT sales and also a percent of the swap transaction for community to hold their own event on DAO

## Project Architechture

![image](https://github.com/user-attachments/assets/bf6dba1c-ca8d-4fa5-b3df-3361a2f1f639)

- Contract Owner will mint the NFC and store the claim hash inside a NFC card
- User will claim the NFT via NFC with claim hash stored in it.
- All the data queried using The Graph

![image](https://github.com/user-attachments/assets/68a02bcc-a747-48cf-9e5c-bb30fdea5b42)

- Data will be fetched from contract metadata
- User will fight another user off-chain using the nft metadata
- Battle recorded on-chain

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

- Blocknogotchi Contract - [https://sepolia.scrollscan.com/address/0x42d6c92e2d768a8555b4a8941aff1e9528ca8586](https://sepolia.scrollscan.com/address/0x42d6c92e2d768a8555b4a8941aff1e9528ca8586)
- P2P contract - [https://sepolia.scrollscan.com/address/0xe3512091dfcc852fd8c053153f2a8df70170ce77](https://sepolia.scrollscan.com/address/0xe3512091dfcc852fd8c053153f2a8df70170ce77)

## Subgraph

- Blocknogotchi Contract Subgraph - [https://thegraph.com/studio/subgraph/blocknogotchi-contract/](https://thegraph.com/studio/subgraph/blocknogotchi-contract/)
- P2P Subgraph - [https://thegraph.com/studio/subgraph/blocknogotchi-escrow/](https://thegraph.com/studio/subgraph/blocknogotchi-escrow/)
- The Graph repo - [https://github.com/Atan0707/ethuprising-thegraph](https://github.com/Atan0707/ethuprising-thegraph)

## Acknowledgments

- Inspired by the classic Tamagotchi virtual pets
- Built with Next.js, Tailwind CSS, and Ethers.js
- Pokemon images stored on IPFS

# Blockmon P2P Swap with NFC Verification

This project implements a secure P2P swap system for Blockmon NFTs with physical NFC card verification.

## Features

- **Physical NFC Card Verification**: Securely verify ownership of physical NFT cards using Web NFC API
- **P2P Swap Marketplace**: List and purchase NFTs directly from other users with escrow protection
- **Secure Transactions**: All transactions are secured by smart contracts on the blockchain

## NFC Functionality

The application uses the Web NFC API to read data from physical NFC cards. This provides an additional layer of security by ensuring that the person listing or claiming an NFT actually possesses the physical card.

### Requirements for NFC Functionality

- **Compatible Device**: A device with NFC hardware (most modern Android phones)
- **Compatible Browser**: Chrome for Android (version 89+)
- **HTTPS**: The Web NFC API only works on secure (HTTPS) connections

### Browser Compatibility

| Browser | Support |
|---------|---------|
| Chrome for Android (89+) | ✅ Supported |
| Safari | ❌ Not supported |
| Firefox | ❌ Not supported |
| Chrome for Desktop | ❌ Not supported |
| Edge | ❌ Not supported |

## Getting Started

### Installation

```bash
# Install dependencies
yarn install

# Run development server
yarn dev

# Build for production
yarn build
```

### Usage

1. Connect your wallet using the Reown AppKit
2. Navigate to the P2P Swap section
3. To list an NFT:
   - Select the NFT you want to list
   - Scan your physical NFC card to verify ownership
   - Set your desired price
   - Create the listing
4. To purchase an NFT:
   - Scan NFC card
   - Complete the purchase transaction
5. To claim a purchased NFT:
   - Scan your physical NFC card
   - Claim the NFT to your wallet

## Technical Implementation

The NFC functionality is implemented using the Web NFC API, which allows web applications to read and write to NFC tags. The application uses this to verify that the user possesses the physical card associated with the NFT.

## Development

### Project Structure

- `src/app/utils/nfc.ts`: NFC utility functions
- `src/app/utils/p2p-swap.ts`: P2P swap functionality
- `src/app/p2p/create/page.tsx`: P2P listing creation page
- `src/app/battle/page.tsx`: Battle page
-  `war.mjs`: WebSocket file (hosted on Digital Ocean)

## License

This project is licensed under the MIT License - see the LICENSE file for details.
