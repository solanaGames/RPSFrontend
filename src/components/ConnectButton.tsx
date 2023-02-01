import { Menu, MenuItem, MenuButton, Button, MenuList } from "@chakra-ui/react";
import { 
  useWalletModal
 } from '@solana/wallet-adapter-react-ui';
import { useWallet } from "@solana/wallet-adapter-react";
import { ChevronDownIcon } from "@chakra-ui/icons";
import { useEffect } from "react";

const WALLET_PREFIX_SUFFIX_LENGTH = 6;

export default function ConnectButton() {
    const { disconnect, wallets, select, publicKey, connect, wallet } = useWallet();
    const { visible, setVisible } = useWalletModal();

    useEffect(() => {
      connect();
    }, [wallet])
  console.log('walletbutton', publicKey);
    return  publicKey ? 
    <Menu gutter={0}>
  <MenuButton as={Button} borderRight="1px solid">
  {`${publicKey.toBase58().slice(
        0,
        WALLET_PREFIX_SUFFIX_LENGTH,
      )}...${publicKey.toBase58().slice(-WALLET_PREFIX_SUFFIX_LENGTH)}`} <ChevronDownIcon />
  </MenuButton>
  <MenuList>
    <MenuItem onClick={() => disconnect()}>Disconnect</MenuItem>
    <MenuItem
    key='copy'
    onClick={() => {
      navigator.clipboard.writeText(publicKey.toBase58());
    }}
    >Copy address</MenuItem>
  </MenuList>
</Menu>  : <Menu gutter={0}>
  <MenuButton as={Button} borderRight="1px solid">
    Connect wallet <ChevronDownIcon />
  </MenuButton>
  <MenuList>
    {wallets.map(wallet => <MenuItem key={wallet.adapter.name} onClick={() => {
        select(wallet.adapter.name)
    }}>
        {wallet.adapter.name}
    </MenuItem>)}
  </MenuList>
</Menu>
}