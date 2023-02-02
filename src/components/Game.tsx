import React, { useEffect, useMemo, useState } from 'react';
import logo from './logo.svg';
import { Box, Button, Card, ChakraProvider, Flex, List, ListItem, Spacer, Text, Tooltip, useMediaQuery } from '@chakra-ui/react'
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { LAMPORTS_PER_SOL } from '@solana/web3.js';
import ConnectButton from './ConnectButton';
import AnimatedNumber from './AnimatedNumber';
import useStore from '../hooks/useStore';
import { useToast } from '@chakra-ui/react'
import Title from './Title';
import Loading from './Loading';
import Hand, { HANDS } from './Hand';
import Display from './Display';

function Game() { 
    const [message, setMessage] = useState<string | null>(' ');
    const [aboutOpen, setAboutOpen] = useState<boolean>(false);
    const [isLargerThan800] = useMediaQuery('(min-width: 800px)');
    const { publicKey} = useWallet();
    const { parsedGameState, betSize, setBetSize, solBalance, setSolBalance } = useStore();

    useEffect(() => {
      if (!publicKey) {
        setMessage(' ')
      }
    }, [publicKey]);

    const chosenHand = parsedGameState.status === 'created' ? parsedGameState.hand : null;

    const disabled = (chosenHand !== undefined && chosenHand !== null);

    const betIncrements = [0.01,0.1,1];

  return (
    <Box overflow="hidden" height="100vh" bg="#bb81be">
      <Flex bg="#bb81be" paddingY="10%" paddingX={10} paddingTop="0" justify="center" position="relative" overflow="hidden" >
      <Box className='bg' height="100vh"/>
      <Flex direction="column" align="center">
      <Title/>
        <Flex direction="column" align="center" justify="space-evenly" position="relative" maxWidth={800} textAlign="center" height="95vh">
        <Flex direction="column" align="center" gap={2}>
        <Box position="relative"><ConnectButton/></Box>
        {publicKey && <Box className={publicKey ? "balanceBox" : "balanceBoxHidden"}><Tooltip label={solBalance}>{solBalance ? <Box><Text fontSize={36} fontFamily="inherit">Balance </Text>
      <Flex align="center" className="balance" marginTop={-4} >
      <AnimatedNumber number={solBalance ?? 0}/><Box paddingRight={2}/><Text fontSize={36} fontFamily="inherit">SOL</Text></Flex></Box> : ' '}</Tooltip></Box>}
        </Flex>
        <Display/>
        <Flex width="100%" 
        direction="column" align="center" gap={4}>
          
        <Flex width="100%" 
        direction="column" align="center" marginBottom={publicKey ? undefined : -24}>
        <Text fontSize={24} className={parsedGameState.status === "created" ? "balance greenBlink" : undefined}>{parsedGameState.status === "created" ? "Current wager" : 'Bet size'}: {parsedGameState.status === "created" ? parsedGameState.wager.toFixed(2) : betSize.toFixed(2)} SOL</Text>
        <Flex paddingTop={1} gap={8} paddingBottom={2} flexWrap="wrap" width="100%" justify={isLargerThan800 ? "center" : "space-between"}>
            {betIncrements.map(size => <Box flexBasis="15%" key={size}>
                <Button className="eightbit-btn" width={isLargerThan800 ? "64px" : "52px"} onClick={() => {
                  if (betSize === 0.01 && size > 0.01) {
                    setBetSize(size)
                    return;
                  }
                  setBetSize(betSize + size)
                }} size="sm"> +{size}</Button>
            </Box>).concat(
              <Box flexBasis="15%" key="reset">
              <Button className="eightbit-btn eightbit-btn--reset" width={isLargerThan800 ? "64px" : "52px"} onClick={() => setBetSize(0.01)}  size="sm"> RESET </Button>
              </Box>
            )}
        </Flex>
        </Flex>
        <Flex width="100%" 
        direction="column" align="center">
        <Text marginBottom={-4} fontSize={24}>{disabled ? "Your hand" : "Choose your hand"}</Text>
        {disabled ? <Flex width="100%" justify="center">
            <Text fontSize={72} className="disabledHand" onClick={() => {}}>{HANDS[chosenHand].emoji}</Text>
        </Flex> : <Flex width="100%" justify="space-between">
            <Hand hand={0}/>
            <Hand hand={1}/>
            <Hand hand={2}/>
        </Flex>}
        </Flex>
        </Flex>
      </Flex>
      </Flex>
      </Flex>
      {publicKey && <Flex justify="center" position="absolute" width="100%" bottom="4">
      <Tooltip isOpen={aboutOpen} label="SolRPS is an onchain Rock, Paper, Scissors game. Each players' chosen hand is encrypted and only revealed after both player has commited (commit-reveal scheme). When playing directly against the site, an offchain service will play a random hand after your encrypted hand is commited."><Text  onClick={() => {setAboutOpen(!aboutOpen)}} fontSize={24} cursor="pointer"><u>Help</u></Text></Tooltip>
      </Flex>}
      </Box>
  );
}

export default Game;
