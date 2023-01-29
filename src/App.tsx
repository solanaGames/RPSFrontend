import React, { useMemo } from 'react';
import logo from './logo.svg';
import './App.css';
import { Box, Button, ChakraProvider, extendTheme, Flex, Text } from '@chakra-ui/react'
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import {
    WalletModalProvider,
    WalletDisconnectButton,
    WalletMultiButton
} from '@solana/wallet-adapter-react-ui';
import { clusterApiUrl } from '@solana/web3.js';
import { BraveWalletAdapter, CoinbaseWalletAdapter, PhantomWalletAdapter, SolflareWalletAdapter } from '@solana/wallet-adapter-wallets';
import Game from './Game';
// Default styles that can be overridden by your app
require('@solana/wallet-adapter-react-ui/styles.css');


const theme = extendTheme({
  fonts: {
    heading: `'Arcade', sans-serif`,
    body: `'Arcade', sans-serif`,
  },
})

function App() {
  const wallets = useMemo(
      () => [
            new PhantomWalletAdapter(),
            new SolflareWalletAdapter({ network: WalletAdapterNetwork.Mainnet }),
            new CoinbaseWalletAdapter(),
            new BraveWalletAdapter(),
      ],
      []
  );

  console.log(wallets);

  return (
    <ChakraProvider theme={theme}>
    <ConnectionProvider endpoint="https://solend.rpcpool.com/a3e03ba77d5e870c8c694b19d61c/">
        <WalletProvider wallets={wallets} autoConnect={false}>
                <WalletModalProvider>
                  <Game/>
                </WalletModalProvider>
            </WalletProvider>
        </ConnectionProvider>
    </ChakraProvider>
  );
}

export default App;
