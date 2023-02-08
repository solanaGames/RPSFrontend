import { Menu, MenuItem, MenuButton, Button, MenuList } from "@chakra-ui/react";
import { useWallet, WalletNotSelectedError } from "@solana/wallet-adapter-react";
import { ChevronDownIcon } from "@chakra-ui/icons";
import { useEffect, useState } from "react";

const WALLET_PREFIX_SUFFIX_LENGTH = 6;

export function shortenKey(key: string) {
  return `${key.slice(
    0,
    WALLET_PREFIX_SUFFIX_LENGTH,
  )}...${key.slice(-WALLET_PREFIX_SUFFIX_LENGTH)}`
}

export default function ConnectButton() {
    const { disconnect, wallets, select, publicKey, connect, wallet } = useWallet();
    const [walletSelect, setWalletSelect] = useState<string | null>(null);

    useEffect(() => {
      if (walletSelect) {

        try {
          connect();
        } catch (e) {
          if (!(e instanceof WalletNotSelectedError)) {
            throw e;
          }
        }
      }
    }, [wallet, walletSelect])

    return  publicKey ? 
    <Menu gutter={0}>
  <MenuButton as={Button} borderRight="1px solid">
  {shortenKey(publicKey.toBase58())} <ChevronDownIcon />
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
        select(wallet.adapter.name);
        setWalletSelect(wallet.adapter.name);
    }}>
        {wallet.adapter.name}
    </MenuItem>)}
  </MenuList>
</Menu>
}