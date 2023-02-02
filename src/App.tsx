import React, { useMemo } from 'react';
import logo from './logo.svg';
import './App.scss';
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
import Game from './components/Game';
import { StoreProvider } from './hooks/useStore';
import { Router } from 'react-router-dom';
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
            new SolflareWalletAdapter({ network: WalletAdapterNetwork.Devnet }),
            new CoinbaseWalletAdapter(),
            new BraveWalletAdapter(),
      ],
      []
  );

  return (
    <ChakraProvider theme={theme}>
    {/* <ConnectionProvider endpoint="https://solend.rpcpool.com/a3e03ba77d5e870c8c694b19d61c/"> */}
    <ConnectionProvider endpoint="https://api.devnet.solana.com">
        <WalletProvider wallets={wallets} autoConnect={false}>
                <WalletModalProvider>
                  <StoreProvider>
                      <Game/>
                  </StoreProvider>
                </WalletModalProvider>
            </WalletProvider>
        </ConnectionProvider>
    </ChakraProvider>
  );
}

export default App;
