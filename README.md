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
   - Browse available listings
   - Select the NFT you want to purchase
   - Complete the purchase transaction
5. To claim a purchased NFT:
   - Scan your physical NFC card
   - Claim the NFT to your wallet

## Technical Implementation

The NFC functionality is implemented using the Web NFC API, which allows web applications to read and write to NFC tags. The application uses this to verify that the user possesses the physical card associated with the NFT.

### Security Considerations

- The NFC data is hashed before being sent to the blockchain
- The NFC serial number is combined with the data for additional security
- All transactions require wallet signatures for authentication

## Development

### Project Structure

- `src/app/utils/nfc.ts`: NFC utility functions
- `src/app/utils/p2p-swap.ts`: P2P swap functionality
- `src/app/p2p/create/page.tsx`: P2P listing creation page

### Adding NFC Support to New Pages

To add NFC support to a new page:

1. Import the NFC utilities:
   ```typescript
   import { isNfcSupported, readFromNfcTag, getNfcSerialNumber } from '@/app/utils/nfc';
   ```

2. Check if NFC is supported:
   ```typescript
   const [nfcSupported, setNfcSupported] = useState(false);
   
   useEffect(() => {
     if (typeof window !== 'undefined') {
       setNfcSupported(isNfcSupported());
     }
   }, []);
   ```

3. Implement NFC scanning:
   ```typescript
   const handleScanNFC = async () => {
     try {
       const serialNumber = await getNfcSerialNumber();
       const nfcData = await readFromNfcTag();
       // Process the NFC data
     } catch (error) {
       // Handle errors
     }
   };
   ```

## License

This project is licensed under the MIT License - see the LICENSE file for details.
